#!/usr/bin/env python3
"""
Start ML Pipeline

Initializes and starts the ML pipeline system.
"""

import sys
import logging
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sergik_ml.pipelines.ml_pipeline import get_pipeline, PipelineConfig
from sergik_ml.pipelines.controller_health import get_health_monitor

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Start the ML pipeline."""
    print("=" * 70)
    print("🚀 SERGIK ML Pipeline - Starting")
    print("=" * 70)
    print()
    
    # Configure pipeline
    config = PipelineConfig(
        collect_controller_data=True,
        collect_feedback=True,
        auto_retrain=True,
        retrain_threshold=50,
        retrain_interval_hours=24,
        health_check_interval_seconds=60,
        health_alert_threshold=0.8
    )
    
    # Initialize pipeline
    pipeline = get_pipeline(config)
    
    # Setup callbacks
    def on_health_alert(health_metrics):
        logger.warning(
            f"⚠️  Health Alert: score={health_metrics.health_score:.2f}, "
            f"error_rate={health_metrics.error_rate:.2f}"
        )
    
    def on_training_complete(result):
        logger.info(f"✅ Training Complete: {result.get('model_type', 'unknown')}")
    
    def on_deployment(result):
        logger.info(f"🚀 Model Deployed: version {result.get('model_version', 'unknown')}")
    
    pipeline.on_health_alert = on_health_alert
    pipeline.on_training_complete = on_training_complete
    pipeline.on_deployment = on_deployment
    
    # Start pipeline
    pipeline.start()
    
    print("✅ ML Pipeline started")
    print()
    print("Pipeline Status:")
    status = pipeline.get_pipeline_status()
    print(f"  Status: {status['status']}")
    print(f"  Running: {status['running']}")
    print(f"  Health monitoring: {config.collect_controller_data}")
    print(f"  Auto-retrain: {config.auto_retrain}")
    print()
    print("Health Monitor:")
    monitor = get_health_monitor()
    health = monitor.check_health()
    print(f"  Current score: {health.score:.2f}")
    print(f"  Status: {health.status.value}")
    print(f"  Issues: {len(health.issues)}")
    print()
    print("=" * 70)
    print("Pipeline is running. Press Ctrl+C to stop.")
    print("=" * 70)
    print()
    
    try:
        # Keep running
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping pipeline...")
        pipeline.stop()
        print("✅ Pipeline stopped")
        sys.exit(0)


if __name__ == "__main__":
    main()

