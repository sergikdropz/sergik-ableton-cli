"""
Metrics Collection

Provides metrics collection for monitoring and observability.
"""

import time
import logging
from typing import Dict, Any, Optional
from collections import defaultdict
from datetime import datetime

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Simple in-memory metrics collector."""
    
    def __init__(self):
        """Initialize metrics collector."""
        self._counters: Dict[str, int] = defaultdict(int)
        self._gauges: Dict[str, float] = {}
        self._histograms: Dict[str, list] = defaultdict(list)
        self._start_times: Dict[str, float] = {}
    
    def increment(self, metric_name: str, value: int = 1, tags: Optional[Dict[str, str]] = None) -> None:
        """
        Increment a counter metric.
        
        Args:
            metric_name: Name of the metric
            value: Value to increment by
            tags: Optional tags for the metric
        """
        key = self._make_key(metric_name, tags)
        self._counters[key] += value
        logger.debug(f"Metric incremented: {key} = {self._counters[key]}")
    
    def set_gauge(self, metric_name: str, value: float, tags: Optional[Dict[str, str]] = None) -> None:
        """
        Set a gauge metric.
        
        Args:
            metric_name: Name of the metric
            value: Gauge value
            tags: Optional tags for the metric
        """
        key = self._make_key(metric_name, tags)
        self._gauges[key] = value
        logger.debug(f"Metric gauge set: {key} = {value}")
    
    def record_histogram(self, metric_name: str, value: float, tags: Optional[Dict[str, str]] = None) -> None:
        """
        Record a histogram value.
        
        Args:
            metric_name: Name of the metric
            value: Value to record
            tags: Optional tags for the metric
        """
        key = self._make_key(metric_name, tags)
        self._histograms[key].append(value)
        # Keep only last 1000 values
        if len(self._histograms[key]) > 1000:
            self._histograms[key] = self._histograms[key][-1000:]
    
    def start_timer(self, metric_name: str, tags: Optional[Dict[str, str]] = None) -> str:
        """
        Start a timer.
        
        Args:
            metric_name: Name of the metric
            tags: Optional tags for the metric
            
        Returns:
            Timer ID for stopping the timer
        """
        timer_id = self._make_key(metric_name, tags)
        self._start_times[timer_id] = time.time()
        return timer_id
    
    def stop_timer(self, timer_id: str) -> float:
        """
        Stop a timer and record duration.
        
        Args:
            timer_id: Timer ID from start_timer
            
        Returns:
            Duration in seconds
        """
        if timer_id not in self._start_times:
            logger.warning(f"Timer {timer_id} was not started")
            return 0.0
        
        duration = time.time() - self._start_times[timer_id]
        del self._start_times[timer_id]
        
        # Record as histogram
        metric_name = timer_id.split("|")[0]  # Extract metric name
        self.record_histogram(metric_name, duration)
        
        return duration
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get all current metrics.
        
        Returns:
            Dictionary with counters, gauges, and histograms
        """
        histograms_summary = {}
        for key, values in self._histograms.items():
            if values:
                histograms_summary[key] = {
                    "count": len(values),
                    "min": min(values),
                    "max": max(values),
                    "avg": sum(values) / len(values),
                    "p95": sorted(values)[int(len(values) * 0.95)] if len(values) > 0 else 0,
                }
        
        return {
            "counters": dict(self._counters),
            "gauges": dict(self._gauges),
            "histograms": histograms_summary,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    def _make_key(self, metric_name: str, tags: Optional[Dict[str, str]]) -> str:
        """Create metric key with tags."""
        if not tags:
            return metric_name
        tag_str = "|".join(f"{k}={v}" for k, v in sorted(tags.items()))
        return f"{metric_name}|{tag_str}"


# Global metrics collector instance
_metrics_collector: Optional[MetricsCollector] = None


def get_metrics_collector() -> MetricsCollector:
    """Get global metrics collector instance."""
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = MetricsCollector()
    return _metrics_collector

