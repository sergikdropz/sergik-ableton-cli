"""
Operation Logger - Server-side operation logging

Provides API request logging, LOM operation tracking, performance monitoring,
and error aggregation.
"""

import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from collections import defaultdict
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class OperationEntry:
    """Single operation log entry."""
    timestamp: float
    operation: str
    endpoint: Optional[str] = None
    path: Optional[str] = None
    args: Dict[str, Any] = field(default_factory=dict)
    result: Optional[Any] = None
    error: Optional[str] = None
    duration_ms: Optional[float] = None


@dataclass
class PerformanceMetric:
    """Performance metric for an operation."""
    count: int = 0
    total_duration_ms: float = 0.0
    avg_duration_ms: float = 0.0
    min_duration_ms: float = float('inf')
    max_duration_ms: float = 0.0
    error_count: int = 0


class OperationLogger:
    """
    Server-side operation logger for API requests and LOM operations.
    """
    
    def __init__(self, max_log_size: int = 1000):
        """
        Initialize operation logger.
        
        Args:
            max_log_size: Maximum number of log entries to keep
        """
        self.log: List[OperationEntry] = []
        self.max_log_size = max_log_size
        self.enabled = True
        self.performance_metrics: Dict[str, PerformanceMetric] = defaultdict(PerformanceMetric)
    
    def log_operation(
        self,
        operation: str,
        endpoint: Optional[str] = None,
        path: Optional[str] = None,
        args: Optional[Dict[str, Any]] = None,
        result: Optional[Any] = None,
        error: Optional[Exception] = None,
        duration_ms: Optional[float] = None
    ) -> None:
        """
        Log an operation.
        
        Args:
            operation: Operation name
            endpoint: API endpoint (if applicable)
            path: LOM path (if applicable)
            args: Operation arguments
            result: Operation result
            error: Error (if any)
            duration_ms: Operation duration in milliseconds
        """
        if not self.enabled:
            return
        
        entry = OperationEntry(
            timestamp=time.time(),
            operation=operation,
            endpoint=endpoint,
            path=path,
            args=args or {},
            result=result,
            error=str(error) if error else None,
            duration_ms=duration_ms
        )
        
        self.log.append(entry)
        
        # Trim log
        if len(self.log) > self.max_log_size:
            self.log.pop(0)
        
        # Update performance metrics
        self._update_metrics(operation, duration_ms, error is not None)
        
        # Log to standard logger
        if error:
            logger.error(
                f"LOM Operation failed: {operation} "
                f"(endpoint={endpoint}, path={path}, error={error})"
            )
        else:
            logger.debug(
                f"LOM Operation: {operation} "
                f"(endpoint={endpoint}, path={path}, duration={duration_ms}ms)"
            )
    
    def _update_metrics(
        self,
        operation: str,
        duration_ms: Optional[float],
        has_error: bool
    ) -> None:
        """Update performance metrics for an operation."""
        metric = self.performance_metrics[operation]
        metric.count += 1
        
        if has_error:
            metric.error_count += 1
        
        if duration_ms is not None:
            metric.total_duration_ms += duration_ms
            metric.avg_duration_ms = metric.total_duration_ms / metric.count
            metric.min_duration_ms = min(metric.min_duration_ms, duration_ms)
            metric.max_duration_ms = max(metric.max_duration_ms, duration_ms)
    
    def get_recent_errors(self, count: int = 10) -> List[OperationEntry]:
        """
        Get recent errors.
        
        Args:
            count: Number of errors to return
            
        Returns:
            List of error entries
        """
        errors = [entry for entry in self.log if entry.error]
        return errors[-count:]
    
    def get_operations_by_type(self, operation: str) -> List[OperationEntry]:
        """
        Get operations by type.
        
        Args:
            operation: Operation name
            
        Returns:
            List of operation entries
        """
        return [entry for entry in self.log if entry.operation == operation]
    
    def get_performance_metrics(
        self,
        operation: Optional[str] = None
    ) -> Dict[str, PerformanceMetric]:
        """
        Get performance metrics.
        
        Args:
            operation: Operation name (optional, returns all if not provided)
            
        Returns:
            Performance metrics dictionary
        """
        if operation:
            return {operation: self.performance_metrics.get(operation)}
        return dict(self.performance_metrics)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get log statistics.
        
        Returns:
            Statistics dictionary
        """
        stats = {
            "total": len(self.log),
            "errors": sum(1 for entry in self.log if entry.error),
            "by_operation": defaultdict(int),
            "performance": {}
        }
        
        for entry in self.log:
            stats["by_operation"][entry.operation] += 1
        
        for op, metric in self.performance_metrics.items():
            stats["performance"][op] = {
                "count": metric.count,
                "error_count": metric.error_count,
                "avg_duration_ms": metric.avg_duration_ms,
                "min_duration_ms": metric.min_duration_ms if metric.min_duration_ms != float('inf') else 0,
                "max_duration_ms": metric.max_duration_ms
            }
        
        return stats
    
    def clear_log(self) -> None:
        """Clear log and metrics."""
        self.log = []
        self.performance_metrics.clear()
    
    def enable(self) -> None:
        """Enable logging."""
        self.enabled = True
    
    def disable(self) -> None:
        """Disable logging."""
        self.enabled = False


# ============================================================================
# Global Instance
# ============================================================================

_operation_logger: Optional[OperationLogger] = None


def get_operation_logger() -> OperationLogger:
    """Get or create global operation logger instance."""
    global _operation_logger
    if _operation_logger is None:
        _operation_logger = OperationLogger()
    return _operation_logger


# ============================================================================
# Decorators
# ============================================================================

def log_operation(operation_name: str):
    """
    Decorator to log function execution.
    
    Args:
        operation_name: Name of the operation
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger_instance = get_operation_logger()
            start_time = time.time()
            error = None
            result = None
            
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                error = e
                raise
            finally:
                duration_ms = (time.time() - start_time) * 1000
                logger_instance.log_operation(
                    operation=operation_name,
                    args={"args": args, "kwargs": kwargs},
                    result=result,
                    error=error,
                    duration_ms=duration_ms
                )
        
        return wrapper
    return decorator

