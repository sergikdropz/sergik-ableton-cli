"""
Logging Middleware

Adds correlation IDs and request context to all requests.
"""

import uuid
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from ...core.logging import (
    set_correlation_id,
    get_correlation_id,
    set_request_context,
    clear_context
)
from ...core.metrics import get_metrics_collector

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to add correlation IDs and request context."""
    
    async def dispatch(self, request: Request, call_next):
        # Generate correlation ID
        corr_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        set_correlation_id(corr_id)
        
        # Set request context
        context = {
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.query_params),
            "client_ip": request.client.host if request.client else None,
        }
        set_request_context(context)
        
        # Add correlation ID to response headers
        start_time = time.time()
        
        try:
            response = await call_next(request)
            response.headers["X-Correlation-ID"] = corr_id
            
            # Log request completion
            duration_ms = (time.time() - start_time) * 1000
            
            # Record metrics
            metrics = get_metrics_collector()
            metrics.increment("http_requests_total", tags={
                "method": request.method,
                "status": str(response.status_code),
                "path": request.url.path
            })
            metrics.record_histogram("http_request_duration_ms", duration_ms, tags={
                "method": request.method,
                "path": request.url.path
            })
            
            logger.info(
                "Request completed",
                extra={
                    "correlation_id": corr_id,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                    "method": request.method,
                    "path": request.url.path,
                }
            )
            
            return response
            
        except Exception as e:
            # Log request error
            duration_ms = (time.time() - start_time) * 1000
            
            # Record error metrics
            metrics = get_metrics_collector()
            metrics.increment("http_requests_errors_total", tags={
                "method": request.method,
                "path": request.url.path,
                "error_type": type(e).__name__
            })
            
            logger.error(
                "Request failed",
                extra={
                    "correlation_id": corr_id,
                    "duration_ms": duration_ms,
                    "method": request.method,
                    "path": request.url.path,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                exc_info=True
            )
            raise
        finally:
            # Clear context
            clear_context()

