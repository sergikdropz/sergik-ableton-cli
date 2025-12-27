"""
Structured Logging Configuration

Provides structured logging with correlation IDs and request context.
"""

import logging
import sys
import json
from typing import Optional, Dict, Any
from contextvars import ContextVar
from datetime import datetime
from pathlib import Path

# Import dev config for environment-aware logging
try:
    from .dev_config import get_dev_config, log_performance, log_build_metric
except ImportError:
    # Fallback if dev_config not available
    def get_dev_config():
        return None
    def log_performance(*args, **kwargs):
        pass
    def log_build_metric(*args, **kwargs):
        pass

# Context variable for correlation ID
correlation_id: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)
request_context: ContextVar[Optional[Dict[str, Any]]] = ContextVar('request_context', default=None)


class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add correlation ID if available
        corr_id = correlation_id.get()
        if corr_id:
            log_data["correlation_id"] = corr_id
        
        # Add request context if available
        ctx = request_context.get()
        if ctx:
            log_data["context"] = ctx
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields from record
        if hasattr(record, "extra") and record.extra:
            log_data.update(record.extra)
        
        return json.dumps(log_data)


def setup_logging(
    level: str = "INFO",
    use_json: bool = True,
    stream: Optional[Any] = None
) -> None:
    """
    Setup structured logging configuration.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        use_json: Whether to use JSON formatting
        stream: Output stream (default: sys.stdout)
    """
    # Try to get dev config for environment-aware settings
    dev_config = get_dev_config()
    if dev_config:
        level = dev_config.log_level.value
        use_json = dev_config.log_json
        if dev_config.log_to_file and dev_config.log_file_path:
            stream = open(dev_config.log_file_path, 'a')
    
    if stream is None:
        stream = sys.stdout
    
    log_level = getattr(logging, level.upper(), logging.INFO)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Create console handler
    handler = logging.StreamHandler(stream)
    handler.setLevel(log_level)
    
    # Set formatter
    if use_json:
        formatter = StructuredFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    
    # Add file handler if configured
    if dev_config and dev_config.log_to_file and dev_config.log_file_path:
        file_handler = logging.FileHandler(dev_config.log_file_path)
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # Set level for third-party loggers (reduce noise)
    root_logger.setLevel(log_level)
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    # Log configuration
    logger = logging.getLogger(__name__)
    logger.info(
        "Logging configured",
        extra={
            "log_level": level,
            "use_json": use_json,
            "log_to_file": dev_config.log_to_file if dev_config else False,
            "environment": dev_config.environment.value if dev_config else "unknown"
        }
    )


def set_correlation_id(corr_id: str) -> None:
    """Set correlation ID for current context."""
    correlation_id.set(corr_id)


def get_correlation_id() -> Optional[str]:
    """Get correlation ID from current context."""
    return correlation_id.get()


def set_request_context(context: Dict[str, Any]) -> None:
    """Set request context for current context."""
    request_context.set(context)


def get_request_context() -> Optional[Dict[str, Any]]:
    """Get request context from current context."""
    return request_context.get()


def clear_context() -> None:
    """Clear correlation ID and request context."""
    correlation_id.set(None)
    request_context.set(None)


def get_logger(name: str) -> logging.Logger:
    """
    Get logger with structured logging support.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    return logger
