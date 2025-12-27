"""
ML Pipeline Router

API endpoints for ML pipeline management and health monitoring.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
import logging

from ...pipelines.ml_pipeline import get_pipeline, PipelineConfig
from ...pipelines.controller_health import get_health_monitor
from ...utils.errors import ValidationError

router = APIRouter(prefix="/pipeline", tags=["ml_pipeline"])
logger = logging.getLogger(__name__)


@router.get("/status")
def get_pipeline_status():
    """Get ML pipeline status."""
    try:
        pipeline = get_pipeline()
        return pipeline.get_pipeline_status()
    except Exception as e:
        logger.error(f"Failed to get pipeline status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
def start_pipeline():
    """Start the ML pipeline."""
    try:
        pipeline = get_pipeline()
        pipeline.start()
        return {
            "status": "ok",
            "message": "Pipeline started",
            "pipeline_status": pipeline.get_pipeline_status()
        }
    except Exception as e:
        logger.error(f"Failed to start pipeline: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
def stop_pipeline():
    """Stop the ML pipeline."""
    try:
        pipeline = get_pipeline()
        pipeline.stop()
        return {
            "status": "ok",
            "message": "Pipeline stopped"
        }
    except Exception as e:
        logger.error(f"Failed to stop pipeline: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train")
def trigger_training(model_type: str = "preference"):
    """Trigger model training."""
    try:
        pipeline = get_pipeline()
        result = pipeline.train_model(model_type)
        return result
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
def get_controller_health():
    """Get controller health status."""
    try:
        monitor = get_health_monitor()
        health_result = monitor.check_health()
        return health_result.to_dict()
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/summary")
def get_health_summary():
    """Get health summary."""
    try:
        monitor = get_health_monitor()
        return monitor.get_health_summary()
    except Exception as e:
        logger.error(f"Failed to get health summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/history")
def get_health_history(hours: int = 24):
    """Get health history."""
    try:
        monitor = get_health_monitor()
        return {
            "status": "ok",
            "history": monitor.get_health_history(hours),
            "hours": hours
        }
    except Exception as e:
        logger.error(f"Failed to get health history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collect/feedback")
def collect_feedback(feedback: Dict[str, Any]):
    """Collect user feedback for training."""
    try:
        pipeline = get_pipeline()
        pipeline.collect_feedback(feedback)
        return {
            "status": "ok",
            "message": "Feedback collected"
        }
    except Exception as e:
        logger.error(f"Failed to collect feedback: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collect/data")
def collect_data(data: Dict[str, Any]):
    """Collect controller usage data."""
    try:
        pipeline = get_pipeline()
        pipeline.collect_controller_data(data)
        return {
            "status": "ok",
            "message": "Data collected"
        }
    except Exception as e:
        logger.error(f"Failed to collect data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

