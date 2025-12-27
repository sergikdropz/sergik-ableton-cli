"""
SERGIK ML API Main

FastAPI application factory with modular routers.
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import logging
import os

from ..config import CFG
from ..stores.sql_store import init_db
from ..core.logging import setup_logging
from .routers import (
    generation_router,
    ableton_router,
    analysis_router,
    gpt_router,
    tracks_router,
    voice_router,
    compat_router,
    files_router,
)
from .routers.organize import router as organize_router
from .routers.transform import router as transform_router
from .routers.export import router as export_router
from .routers.pipeline import router as pipeline_router
from .routers.dev_assistant import router as dev_assistant_router
from ..serving.rate_limiter import RateLimitMiddleware
from .middleware.logging_middleware import LoggingMiddleware
from .middleware.auth import AuthenticationMiddleware, RequestSizeMiddleware
from ..utils.errors import SergikError, ValidationError as SergikValidationError

# Import dashboard router (lazy import to avoid circular dependency)
def _get_dashboard_router():
    """Lazy import dashboard router to avoid circular imports."""
    from ..serving.dashboard import router as dashboard_router
    return dashboard_router

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.
    
    Returns:
        Configured FastAPI app instance
    """
    app = FastAPI(
        title="SERGIK ML Service",
        description="ML-native music production API for Ableton Live integration",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        # Request size limits
        max_request_size=10 * 1024 * 1024,  # 10 MB
    )
    
    # Request size middleware (must be first)
    app.add_middleware(RequestSizeMiddleware, max_size=10 * 1024 * 1024)  # 10 MB
    
    # Logging middleware (must be early to capture all requests)
    app.add_middleware(LoggingMiddleware)
    
    # Authentication middleware (optional - can be enabled via config)
    # app.add_middleware(AuthenticationMiddleware, require_auth=CFG.env == "prod")
    
    # CORS middleware (restricted to configured origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CFG.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-API-Key", "X-Correlation-ID"],
    )
    
    # Rate limiting middleware
    app.add_middleware(RateLimitMiddleware)
    
    # Custom exception handler for validation errors
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Convert FastAPI validation errors to our custom error format."""
        errors = exc.errors()
        error_messages = []
        for error in errors:
            field = ".".join(str(loc) for loc in error.get("loc", []))
            msg = error.get("msg", "Validation error")
            error_messages.append(f"{field}: {msg}")
        
        error_message = "; ".join(error_messages) if error_messages else "Validation error"
        
        # Log validation error
        logger.warning(
            "Validation error",
            extra={
                "path": request.url.path,
                "errors": errors,
                "error_message": error_message
            }
        )
        
        # Return our custom error format
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "status": "error",
                "error": error_message,
                "detail": errors
            }
        )
    
    # Custom exception handler for SERGIK errors
    @app.exception_handler(SergikError)
    async def sergik_error_handler(request: Request, exc: SergikError):
        """Handle SERGIK custom errors."""
        logger.error(
            "SERGIK error",
            extra={
                "error_code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
                "context": exc.context,
                "path": request.url.path,
            },
            exc_info=True
        )
        
        # Determine status code based on error type
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        if isinstance(exc, SergikValidationError):
            status_code = status.HTTP_400_BAD_REQUEST
        elif isinstance(exc, (SergikError,)):
            # Check error code for specific status codes
            if "not_found" in exc.error_code.lower():
                status_code = status.HTTP_404_NOT_FOUND
            elif "unauthorized" in exc.error_code.lower() or "authentication" in exc.error_code.lower():
                status_code = status.HTTP_401_UNAUTHORIZED
            elif "forbidden" in exc.error_code.lower() or "authorization" in exc.error_code.lower():
                status_code = status.HTTP_403_FORBIDDEN
            elif "rate_limit" in exc.error_code.lower():
                status_code = status.HTTP_429_TOO_MANY_REQUESTS
        
        return JSONResponse(
            status_code=status_code,
            content=exc.to_dict()
        )
    
    # Generic exception handler for unhandled exceptions
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        """Handle unhandled exceptions."""
        logger.error(
            "Unhandled exception",
            extra={
                "exception_type": type(exc).__name__,
                "message": str(exc),
                "path": request.url.path,
            },
            exc_info=True
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "error": "internal_error",
                "message": "An internal error occurred"
            }
        )
    
    # Include routers
    app.include_router(generation_router)
    app.include_router(ableton_router)
    app.include_router(analysis_router)
    app.include_router(gpt_router)
    app.include_router(tracks_router)
    app.include_router(voice_router)
    app.include_router(compat_router)  # Compatibility endpoints for frontend
    app.include_router(files_router)  # File serving endpoints
    app.include_router(pipeline_router)  # ML pipeline management
    app.include_router(organize_router)  # File organization endpoints
    app.include_router(transform_router)  # MIDI/audio transformation endpoints
    app.include_router(export_router)  # Export endpoints
    app.include_router(dev_assistant_router)  # Dev Assistant endpoints (SERGIK AI Team proxy)
    
    # Include dashboard router (lazy import)
    try:
        dashboard_router = _get_dashboard_router()
        app.include_router(dashboard_router)
    except ImportError as e:
        logger.warning(f"Dashboard router not available: {e}")
    
    # Health check
    @app.get("/health")
    def health():
        """
        Health check endpoint with dependency checks.
        
        Returns:
            Health status with service and dependency information
        """
        from ..stores.sql_store import engine
        from sqlalchemy import text
        
        health_status = {
            "status": "ok",
            "service": "sergik-ml",
            "version": "1.0.0",
            "dependencies": {}
        }
        
        # Check database connection
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            health_status["dependencies"]["database"] = "ok"
        except Exception as e:
            health_status["dependencies"]["database"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
        
        # Check container
        try:
            from ..core.container import get_container
            container = get_container()
            health_status["dependencies"]["container"] = "ok"
        except Exception as e:
            health_status["dependencies"]["container"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
        
        return health_status
    
    # Metrics endpoint
    @app.get("/metrics")
    def metrics():
        """Get application metrics."""
        from ..core.metrics import get_metrics_collector
        collector = get_metrics_collector()
        return collector.get_metrics()
    
    # Initialize database on startup
    @app.on_event("startup")
    async def startup():
        # Setup structured logging
        setup_logging(level=os.getenv("LOG_LEVEL", "INFO"))
        
        # Initialize database
        init_db()
        
        # Start container and services
        from ..core.container import get_container
        container = get_container()
        container.startup()
        
        # Initialize ML pipeline (optional - can be started via API)
        try:
            from ..pipelines.ml_pipeline import get_pipeline, PipelineConfig
            pipeline_config = PipelineConfig(
                collect_controller_data=True,
                auto_retrain=True,
                health_check_interval_seconds=60
            )
            pipeline = get_pipeline(pipeline_config)
            # Don't auto-start - let user control via API
            # pipeline.start()
            logger.info("ML Pipeline initialized (start via /pipeline/start)")
        except Exception as e:
            logger.warning(f"ML Pipeline initialization failed: {e}")
        
        logger.info("SERGIK ML Service started")
    
    # Shutdown hook
    @app.on_event("shutdown")
    async def shutdown():
        """Shutdown services gracefully."""
        from ..core.container import get_container
        container = get_container()
        container.shutdown()
        logger.info("SERGIK ML Service shutdown complete")
    
    return app


# Create app instance for uvicorn
app = create_app()

