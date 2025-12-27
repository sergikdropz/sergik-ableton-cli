"""
Controller Health Monitor

Monitors and maintains health of the SERGIK AI Controller.
Integrates with ML pipeline for automated health management.
"""

import logging
import time
import requests
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum

from ..config import CFG
from .ml_pipeline import ControllerHealthMetrics, get_pipeline

logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """Health status levels."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    CRITICAL = "critical"


@dataclass
class HealthCheckResult:
    """Result of a health check."""
    status: HealthStatus
    score: float
    metrics: ControllerHealthMetrics
    issues: List[str]
    recommendations: List[str]
    timestamp: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "status": self.status.value,
            "score": self.score,
            "metrics": self.metrics.to_dict(),
            "issues": self.issues,
            "recommendations": self.recommendations,
            "timestamp": self.timestamp
        }


class ControllerHealthMonitor:
    """
    Monitor and maintain controller health.
    
    Features:
    - Continuous health monitoring
    - Automatic issue detection
    - Health-based recommendations
    - Integration with ML pipeline
    - Alert system
    """
    
    def __init__(self):
        """Initialize health monitor."""
        self.pipeline = get_pipeline()
        self.health_history: List[HealthCheckResult] = []
        self.alert_threshold = 0.8  # Alert if health < 80%
        self.critical_threshold = 0.5  # Critical if health < 50%
        
        logger.info("Controller Health Monitor initialized")
    
    def check_health(self) -> HealthCheckResult:
        """Perform comprehensive health check."""
        # Get health metrics from pipeline
        metrics = self.pipeline.check_controller_health()
        
        # Calculate health score
        health_score = metrics.health_score
        
        # Determine status
        if health_score >= 0.9:
            status = HealthStatus.HEALTHY
        elif health_score >= 0.7:
            status = HealthStatus.DEGRADED
        elif health_score >= 0.5:
            status = HealthStatus.UNHEALTHY
        else:
            status = HealthStatus.CRITICAL
        
        # Identify issues
        issues = self._identify_issues(metrics)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(metrics, issues)
        
        result = HealthCheckResult(
            status=status,
            score=health_score,
            metrics=metrics,
            issues=issues,
            recommendations=recommendations,
            timestamp=time.time()
        )
        
        # Store in history
        self.health_history.append(result)
        
        # Keep only recent history (last 7 days)
        cutoff_time = time.time() - (7 * 24 * 3600)
        self.health_history = [
            h for h in self.health_history
            if h.timestamp > cutoff_time
        ]
        
        # Log status
        if status == HealthStatus.CRITICAL:
            logger.critical(f"Controller health CRITICAL: {health_score:.2f}")
        elif status == HealthStatus.UNHEALTHY:
            logger.warning(f"Controller health UNHEALTHY: {health_score:.2f}")
        elif status == HealthStatus.DEGRADED:
            logger.warning(f"Controller health DEGRADED: {health_score:.2f}")
        else:
            logger.info(f"Controller health OK: {health_score:.2f}")
        
        return result
    
    def _identify_issues(self, metrics: ControllerHealthMetrics) -> List[str]:
        """Identify health issues."""
        issues = []
        
        if not metrics.connection_status:
            issues.append("Controller not connected to backend")
        
        if metrics.error_rate > 0.1:
            issues.append(f"High error rate: {metrics.error_rate:.1%}")
        
        if metrics.avg_latency_ms > 500:
            issues.append(f"High latency: {metrics.avg_latency_ms:.0f}ms")
        
        if metrics.p95_latency_ms > 1000:
            issues.append(f"P95 latency too high: {metrics.p95_latency_ms:.0f}ms")
        
        if metrics.response_time_ms > 2000:
            issues.append(f"Slow response time: {metrics.response_time_ms:.0f}ms")
        
        if metrics.failure_count > metrics.success_count:
            issues.append("More failures than successes")
        
        return issues
    
    def _generate_recommendations(
        self,
        metrics: ControllerHealthMetrics,
        issues: List[str]
    ) -> List[str]:
        """Generate health recommendations."""
        recommendations = []
        
        if not metrics.connection_status:
            recommendations.append("Check backend server is running")
            recommendations.append("Verify network connectivity")
            recommendations.append("Check firewall settings")
        
        if metrics.error_rate > 0.1:
            recommendations.append("Review error logs for patterns")
            recommendations.append("Check backend service health")
            recommendations.append("Consider retraining models if errors are prediction-related")
        
        if metrics.avg_latency_ms > 500:
            recommendations.append("Optimize model inference time")
            recommendations.append("Consider model quantization")
            recommendations.append("Check database query performance")
        
        if metrics.p95_latency_ms > 1000:
            recommendations.append("Investigate slow request patterns")
            recommendations.append("Add caching for frequent requests")
            recommendations.append("Consider load balancing")
        
        if len(issues) == 0:
            recommendations.append("Controller is healthy - continue monitoring")
        
        return recommendations
    
    def get_health_summary(self) -> Dict[str, Any]:
        """Get health summary."""
        if not self.health_history:
            return {
                "status": "unknown",
                "message": "No health data available"
            }
        
        latest = self.health_history[-1]
        
        # Calculate trends
        if len(self.health_history) >= 2:
            previous = self.health_history[-2]
            score_trend = latest.score - previous.score
            trend_direction = "improving" if score_trend > 0 else "degrading" if score_trend < 0 else "stable"
        else:
            trend_direction = "unknown"
            score_trend = 0.0
        
        return {
            "current_status": latest.status.value,
            "current_score": latest.score,
            "trend": trend_direction,
            "score_change": score_trend,
            "issues_count": len(latest.issues),
            "recommendations_count": len(latest.recommendations),
            "latest_check": latest.timestamp,
            "history_count": len(self.health_history)
        }
    
    def get_health_history(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get health history for specified hours."""
        cutoff_time = time.time() - (hours * 3600)
        recent_history = [
            h.to_dict() for h in self.health_history
            if h.timestamp > cutoff_time
        ]
        return recent_history


# Global monitor instance
_monitor: Optional[ControllerHealthMonitor] = None


def get_health_monitor() -> ControllerHealthMonitor:
    """Get global health monitor instance."""
    global _monitor
    if _monitor is None:
        _monitor = ControllerHealthMonitor()
    return _monitor

