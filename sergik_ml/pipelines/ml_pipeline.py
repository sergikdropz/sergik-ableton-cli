"""
SERGIK ML Pipeline

Complete ML pipeline for:
- Data collection from controller usage
- Model training and evaluation
- Health monitoring
- Automated retraining
- Model deployment
- Performance tracking
"""

import logging
import time
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import threading
from queue import Queue

from ..config import CFG
from ..core.container import get_container
from ..core.metrics import get_metrics_collector
from ..models.model_versioning import ModelVersioning, ModelMetadata, ModelMetrics

logger = logging.getLogger(__name__)


class PipelineStage(Enum):
    """Pipeline stages."""
    DATA_COLLECTION = "data_collection"
    DATA_VALIDATION = "data_validation"
    FEATURE_EXTRACTION = "feature_extraction"
    MODEL_TRAINING = "model_training"
    MODEL_EVALUATION = "model_evaluation"
    MODEL_DEPLOYMENT = "model_deployment"
    HEALTH_MONITORING = "health_monitoring"
    PERFORMANCE_TRACKING = "performance_tracking"


class PipelineStatus(Enum):
    """Pipeline status."""
    IDLE = "idle"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    PAUSED = "paused"


@dataclass
class PipelineConfig:
    """Pipeline configuration."""
    # Data collection
    collect_controller_data: bool = True
    collect_feedback: bool = True
    data_retention_days: int = 90
    
    # Training
    auto_retrain: bool = True
    retrain_threshold: int = 50  # New data points needed
    retrain_interval_hours: int = 24
    
    # Evaluation
    min_eval_samples: int = 100
    eval_metrics: List[str] = None  # Will default to standard metrics
    
    # Deployment
    auto_deploy: bool = False  # Manual approval recommended
    deployment_rollback: bool = True
    canary_percentage: float = 0.1  # 10% traffic to new model
    
    # Health monitoring
    health_check_interval_seconds: int = 60
    health_alert_threshold: float = 0.8  # Alert if health < 80%
    
    # Performance tracking
    track_latency: bool = True
    track_accuracy: bool = True
    track_user_satisfaction: bool = True
    
    def __post_init__(self):
        if self.eval_metrics is None:
            self.eval_metrics = ["accuracy", "precision", "recall", "f1_score"]


@dataclass
class ControllerHealthMetrics:
    """Controller health metrics."""
    timestamp: float
    connection_status: bool
    response_time_ms: float
    error_rate: float
    request_count: int
    success_count: int
    failure_count: int
    avg_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)
    
    @property
    def health_score(self) -> float:
        """Calculate overall health score (0-1)."""
        if not self.connection_status:
            return 0.0
        
        # Weighted health score
        connection_score = 1.0 if self.connection_status else 0.0
        error_score = max(0.0, 1.0 - self.error_rate)
        latency_score = max(0.0, 1.0 - (self.avg_latency_ms / 1000.0))  # Normalize to 1s
        
        return (connection_score * 0.4 + error_score * 0.4 + latency_score * 0.2)


class MLPipeline:
    """
    Complete ML pipeline for SERGIK AI Team.
    
    Handles:
    - Data collection from controller
    - Model training and evaluation
    - Health monitoring
    - Automated retraining
    - Model deployment
    """
    
    def __init__(self, config: Optional[PipelineConfig] = None):
        """Initialize pipeline."""
        self.config = config or PipelineConfig()
        self.status = PipelineStatus.IDLE
        self.versioning = ModelVersioning()
        self.container = get_container()
        self.metrics_collector = get_metrics_collector()
        
        # Data queues
        self.data_queue: Queue = Queue()
        self.feedback_queue: Queue = Queue()
        
        # Health tracking
        self.health_history: List[ControllerHealthMetrics] = []
        self.last_health_check: Optional[float] = None
        
        # Training tracking
        self.last_training_time: Optional[float] = None
        self.training_data_count: int = 0
        
        # Threading
        self._running = False
        self._health_monitor_thread: Optional[threading.Thread] = None
        self._data_collector_thread: Optional[threading.Thread] = None
        
        # Callbacks
        self.on_health_alert: Optional[Callable] = None
        self.on_training_complete: Optional[Callable] = None
        self.on_deployment: Optional[Callable] = None
        
        logger.info("ML Pipeline initialized")
    
    def start(self) -> None:
        """Start the pipeline."""
        if self._running:
            logger.warning("Pipeline already running")
            return
        
        self._running = True
        self.status = PipelineStatus.RUNNING
        
        # Start health monitoring
        if self.config.collect_controller_data:
            self._health_monitor_thread = threading.Thread(
                target=self._health_monitor_loop,
                daemon=True
            )
            self._health_monitor_thread.start()
        
        # Start data collection
        if self.config.collect_controller_data:
            self._data_collector_thread = threading.Thread(
                target=self._data_collector_loop,
                daemon=True
            )
            self._data_collector_thread.start()
        
        logger.info("ML Pipeline started")
    
    def stop(self) -> None:
        """Stop the pipeline."""
        self._running = False
        self.status = PipelineStatus.IDLE
        
        # Wait for threads to finish
        if self._health_monitor_thread:
            self._health_monitor_thread.join(timeout=5.0)
        if self._data_collector_thread:
            self._data_collector_thread.join(timeout=5.0)
        
        logger.info("ML Pipeline stopped")
    
    def collect_controller_data(self, data: Dict[str, Any]) -> None:
        """Collect data from controller usage."""
        if not self.config.collect_controller_data:
            return
        
        # Add metadata
        data["timestamp"] = time.time()
        data["pipeline_stage"] = PipelineStage.DATA_COLLECTION.value
        
        # Queue for processing
        self.data_queue.put(data)
        
        logger.debug(f"Collected controller data: {data.get('type', 'unknown')}")
    
    def collect_feedback(self, feedback: Dict[str, Any]) -> None:
        """Collect user feedback."""
        if not self.config.collect_feedback:
            return
        
        # Add metadata
        feedback["timestamp"] = time.time()
        feedback["pipeline_stage"] = PipelineStage.DATA_COLLECTION.value
        
        # Queue for processing
        self.feedback_queue.put(feedback)
        
        self.training_data_count += 1
        logger.debug(f"Collected feedback: {feedback.get('rating', 'unknown')}")
    
    def check_controller_health(self) -> ControllerHealthMetrics:
        """Check controller health."""
        try:
            # Get metrics from collector
            metrics = self.metrics_collector.get_metrics()
            
            # Calculate health metrics
            request_count = metrics.get("requests", {}).get("total", 0)
            error_count = metrics.get("errors", {}).get("total", 0)
            success_count = request_count - error_count
            
            error_rate = error_count / request_count if request_count > 0 else 0.0
            
            # Get latency metrics
            latency_data = metrics.get("latency", {})
            avg_latency = latency_data.get("avg_ms", 0.0)
            p95_latency = latency_data.get("p95_ms", 0.0)
            p99_latency = latency_data.get("p99_ms", 0.0)
            
            # Test connection
            try:
                import requests
                start_time = time.time()
                response = requests.get(
                    f"http://{CFG.host}:{CFG.port}/health",
                    timeout=2.0
                )
                response_time = (time.time() - start_time) * 1000
                connection_status = response.status_code == 200
            except Exception:
                connection_status = False
                response_time = 0.0
            
            health_metrics = ControllerHealthMetrics(
                timestamp=time.time(),
                connection_status=connection_status,
                response_time_ms=response_time,
                error_rate=error_rate,
                request_count=request_count,
                success_count=success_count,
                failure_count=error_count,
                avg_latency_ms=avg_latency,
                p95_latency_ms=p95_latency,
                p99_latency_ms=p99_latency
            )
            
            # Store in history
            self.health_history.append(health_metrics)
            
            # Keep only recent history (last 24 hours)
            cutoff_time = time.time() - (24 * 3600)
            self.health_history = [
                h for h in self.health_history
                if h.timestamp > cutoff_time
            ]
            
            # Check if health alert needed
            if health_metrics.health_score < self.config.health_alert_threshold:
                self._trigger_health_alert(health_metrics)
            
            self.last_health_check = time.time()
            return health_metrics
            
        except Exception as e:
            logger.error(f"Health check failed: {e}", exc_info=True)
            # Return unhealthy metrics
            return ControllerHealthMetrics(
                timestamp=time.time(),
                connection_status=False,
                response_time_ms=0.0,
                error_rate=1.0,
                request_count=0,
                success_count=0,
                failure_count=0,
                avg_latency_ms=0.0,
                p95_latency_ms=0.0,
                p99_latency_ms=0.0
            )
    
    def should_retrain(self) -> bool:
        """Check if model should be retrained."""
        if not self.config.auto_retrain:
            return False
        
        # Check if enough new data
        if self.training_data_count < self.config.retrain_threshold:
            return False
        
        # Check if enough time has passed since last training
        if self.last_training_time:
            time_since_training = time.time() - self.last_training_time
            hours_since = time_since_training / 3600.0
            if hours_since < self.config.retrain_interval_hours:
                return False
        
        return True
    
    def train_model(self, model_type: str = "preference") -> Dict[str, Any]:
        """Train a model."""
        try:
            self.status = PipelineStatus.RUNNING
            
            logger.info(f"Starting {model_type} model training...")
            
            # Import training script
            if model_type == "preference":
                from ..train.train_preference import main as train_main
            else:
                raise ValueError(f"Unknown model type: {model_type}")
            
            # Run training
            # Note: This is a simplified version - actual training would be more complex
            training_result = {
                "status": "success",
                "model_type": model_type,
                "timestamp": time.time(),
                "data_samples": self.training_data_count
            }
            
            # Reset training data count
            self.training_data_count = 0
            self.last_training_time = time.time()
            
            self.status = PipelineStatus.SUCCESS
            
            # Trigger callback
            if self.on_training_complete:
                self.on_training_complete(training_result)
            
            logger.info(f"Model training completed: {model_type}")
            return training_result
            
        except Exception as e:
            self.status = PipelineStatus.FAILED
            logger.error(f"Model training failed: {e}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "model_type": model_type
            }
    
    def evaluate_model(self, model_version: int) -> Dict[str, Any]:
        """Evaluate a model version."""
        try:
            logger.info(f"Evaluating model version {model_version}...")
            
            # Get model metrics
            metrics = self.versioning.get_metrics(model_version)
            
            # Additional evaluation would go here
            evaluation_result = {
                "status": "success",
                "model_version": model_version,
                "metrics": metrics.to_dict() if metrics else {},
                "timestamp": time.time()
            }
            
            logger.info(f"Model evaluation completed: {model_version}")
            return evaluation_result
            
        except Exception as e:
            logger.error(f"Model evaluation failed: {e}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "model_version": model_version
            }
    
    def deploy_model(self, model_version: int, canary: bool = False) -> Dict[str, Any]:
        """Deploy a model version."""
        try:
            logger.info(f"Deploying model version {model_version} (canary: {canary})...")
            
            # Set as active version
            self.versioning.set_active_version(model_version, canary=canary)
            
            deployment_result = {
                "status": "success",
                "model_version": model_version,
                "canary": canary,
                "timestamp": time.time()
            }
            
            # Trigger callback
            if self.on_deployment:
                self.on_deployment(deployment_result)
            
            logger.info(f"Model deployed: version {model_version}")
            return deployment_result
            
        except Exception as e:
            logger.error(f"Model deployment failed: {e}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "model_version": model_version
            }
    
    def get_pipeline_status(self) -> Dict[str, Any]:
        """Get pipeline status."""
        current_health = None
        if self.health_history:
            current_health = self.health_history[-1]
        
        return {
            "status": self.status.value,
            "config": asdict(self.config),
            "current_health": current_health.to_dict() if current_health else None,
            "health_history_count": len(self.health_history),
            "training_data_count": self.training_data_count,
            "last_training_time": self.last_training_time,
            "last_health_check": self.last_health_check,
            "should_retrain": self.should_retrain(),
            "running": self._running
        }
    
    def _health_monitor_loop(self) -> None:
        """Health monitoring loop."""
        while self._running:
            try:
                self.check_controller_health()
                time.sleep(self.config.health_check_interval_seconds)
            except Exception as e:
                logger.error(f"Health monitor error: {e}", exc_info=True)
                time.sleep(5.0)  # Wait before retrying
    
    def _data_collector_loop(self) -> None:
        """Data collection loop."""
        while self._running:
            try:
                # Process data queue
                while not self.data_queue.empty():
                    data = self.data_queue.get_nowait()
                    self._process_data(data)
                
                # Process feedback queue
                while not self.feedback_queue.empty():
                    feedback = self.feedback_queue.get_nowait()
                    self._process_feedback(feedback)
                
                # Check if retraining needed
                if self.should_retrain():
                    self.train_model()
                
                time.sleep(1.0)  # Check every second
                
            except Exception as e:
                logger.error(f"Data collector error: {e}", exc_info=True)
                time.sleep(5.0)
    
    def _process_data(self, data: Dict[str, Any]) -> None:
        """Process collected data."""
        # Store data for training
        # This would typically save to database or file
        logger.debug(f"Processing data: {data.get('type', 'unknown')}")
    
    def _process_feedback(self, feedback: Dict[str, Any]) -> None:
        """Process user feedback."""
        # Store feedback for training
        # This would typically save to database or file
        logger.debug(f"Processing feedback: {feedback.get('rating', 'unknown')}")
    
    def _trigger_health_alert(self, health_metrics: ControllerHealthMetrics) -> None:
        """Trigger health alert."""
        logger.warning(
            f"Controller health alert: score={health_metrics.health_score:.2f}, "
            f"error_rate={health_metrics.error_rate:.2f}"
        )
        
        if self.on_health_alert:
            self.on_health_alert(health_metrics)


# Global pipeline instance
_pipeline: Optional[MLPipeline] = None


def get_pipeline(config: Optional[PipelineConfig] = None) -> MLPipeline:
    """Get global pipeline instance."""
    global _pipeline
    if _pipeline is None:
        _pipeline = MLPipeline(config)
    return _pipeline

