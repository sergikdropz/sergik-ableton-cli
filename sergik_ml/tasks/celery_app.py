"""
SERGIK ML Celery Task Queue

Async task processing for long-running operations:
  - Stem separation
  - Batch pack creation
  - Audio analysis
  - Model training

Setup:
    # Start Redis
    redis-server

    # Start Celery worker
    celery -A sergik_ml.tasks.celery_app worker --loglevel=info

    # Start Celery beat (for scheduled tasks)
    celery -A sergik_ml.tasks.celery_app beat --loglevel=info
"""

import os
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Celery configuration
REDIS_URL = os.getenv("SERGIK_REDIS_URL", "redis://localhost:6379/0")

# Try to initialize Celery
try:
    from celery import Celery
    from celery.schedules import crontab

    app = Celery(
        "sergik_ml",
        broker=REDIS_URL,
        backend=REDIS_URL,
        include=["sergik_ml.tasks.celery_app"],
    )

    # Celery configuration
    app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_time_limit=3600,  # 1 hour max
        worker_prefetch_multiplier=1,
        task_acks_late=True,
    )

    # Scheduled tasks
    app.conf.beat_schedule = {
        "retrain-preference-model-daily": {
            "task": "sergik_ml.tasks.celery_app.retrain_preference_model",
            "schedule": crontab(hour=3, minute=0),  # 3 AM daily
        },
        "cleanup-old-packs-weekly": {
            "task": "sergik_ml.tasks.celery_app.cleanup_old_packs",
            "schedule": crontab(day_of_week=0, hour=4, minute=0),  # Sunday 4 AM
        },
    }

    CELERY_AVAILABLE = True
    logger.info("Celery initialized with Redis backend")

except ImportError:
    CELERY_AVAILABLE = False
    app = None
    logger.warning("Celery not available. Install: pip install celery redis")


def task_decorator(func):
    """Decorator that makes function a Celery task if available."""
    if CELERY_AVAILABLE:
        return app.task(bind=True)(func)
    return func


# ============================================================================
# Task Definitions
# ============================================================================

if CELERY_AVAILABLE:

    @app.task(bind=True)
    def separate_stems_async(
        self,
        audio_path: str,
        output_dir: Optional[str] = None,
        model: str = "htdemucs",
    ) -> Dict[str, Any]:
        """
        Async stem separation task.

        Args:
            audio_path: Input audio file
            output_dir: Output directory
            model: Demucs model name

        Returns:
            Stem separation result
        """
        from sergik_ml.pipelines.stem_separation import separate_stems
        from sergik_ml.connectors.ableton_osc import osc_status

        self.update_state(state="PROGRESS", meta={"status": "Starting stem separation"})
        osc_status(f"Separating stems: {audio_path}")

        try:
            result = separate_stems(audio_path, output_dir, model)
            osc_status(f"Stems ready: {len(result.get('stems', {}))} stems")
            return result
        except Exception as e:
            osc_status(f"Stem separation failed: {e}")
            raise

    @app.task(bind=True)
    def create_pack_async(
        self,
        args: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Async sample pack creation.

        Args:
            args: Pack creation arguments

        Returns:
            Pack creation result
        """
        from sergik_ml.pipelines.pack_pipeline import create_pack
        from sergik_ml.connectors.ableton_osc import osc_status

        self.update_state(state="PROGRESS", meta={"status": "Creating pack"})
        osc_status("Creating sample pack...")

        try:
            result = create_pack(args)
            osc_status(f"Pack created: {result.get('pack_id')}")
            return result
        except Exception as e:
            osc_status(f"Pack creation failed: {e}")
            raise

    @app.task(bind=True)
    def analyze_audio_async(
        self,
        audio_path: str,
        full_features: bool = True,
    ) -> Dict[str, Any]:
        """
        Async audio analysis.

        Args:
            audio_path: Audio file to analyze
            full_features: Extract full feature set

        Returns:
            Audio features
        """
        from sergik_ml.features.audio_features import (
            extract_audio_features,
            extract_full_features,
        )

        self.update_state(state="PROGRESS", meta={"status": "Analyzing audio"})

        if full_features:
            return extract_full_features(audio_path)
        return extract_audio_features(audio_path)

    @app.task(bind=True)
    def batch_analyze_async(
        self,
        audio_paths: List[str],
    ) -> List[Dict[str, Any]]:
        """
        Batch analyze multiple audio files.

        Args:
            audio_paths: List of audio file paths

        Returns:
            List of analysis results
        """
        from sergik_ml.features.audio_features import extract_full_features
        from sergik_ml.stores.sql_store import upsert_track
        from pathlib import Path

        results = []
        total = len(audio_paths)

        for i, path in enumerate(audio_paths):
            self.update_state(
                state="PROGRESS",
                meta={"current": i + 1, "total": total, "file": path}
            )

            try:
                features = extract_full_features(path)
                track_id = Path(path).stem

                # Store in database
                upsert_track({
                    "track_id": track_id,
                    **features,
                    "style_source": "batch_analysis",
                })

                results.append({"track_id": track_id, "features": features})

            except Exception as e:
                results.append({"track_id": path, "error": str(e)})

        return results

    @app.task(bind=True)
    def retrain_preference_model(self) -> Dict[str, Any]:
        """
        Scheduled task to retrain preference model.

        Returns:
            Training results
        """
        from sergik_ml.train.train_preference import train_and_evaluate
        from sergik_ml.connectors.ableton_osc import osc_status

        self.update_state(state="PROGRESS", meta={"status": "Retraining model"})
        osc_status("Retraining preference model...")

        try:
            result = train_and_evaluate()
            osc_status(f"Model retrained: MAE={result.get('mae', 'N/A'):.3f}")
            return result
        except Exception as e:
            osc_status(f"Model training failed: {e}")
            return {"error": str(e)}

    @app.task(bind=True)
    def cleanup_old_packs(self, days: int = 30) -> Dict[str, Any]:
        """
        Cleanup old pack exports.

        Args:
            days: Remove packs older than this many days

        Returns:
            Cleanup result
        """
        import shutil
        from datetime import datetime, timedelta
        from pathlib import Path
        from sergik_ml.config import CFG

        packs_dir = Path(CFG.artifact_dir) / "packs"
        if not packs_dir.exists():
            return {"removed": 0, "error": None}

        cutoff = datetime.now() - timedelta(days=days)
        removed = 0

        for pack_dir in packs_dir.iterdir():
            if pack_dir.is_dir():
                mtime = datetime.fromtimestamp(pack_dir.stat().st_mtime)
                if mtime < cutoff:
                    shutil.rmtree(pack_dir)
                    removed += 1

        return {"removed": removed, "cutoff_date": cutoff.isoformat()}


# ============================================================================
# Sync Fallbacks (when Celery not available)
# ============================================================================

def separate_stems_sync(
    audio_path: str,
    output_dir: Optional[str] = None,
    model: str = "htdemucs",
) -> Dict[str, Any]:
    """Synchronous stem separation fallback."""
    from sergik_ml.pipelines.stem_separation import separate_stems
    return separate_stems(audio_path, output_dir, model)


def create_pack_sync(args: Dict[str, Any]) -> Dict[str, Any]:
    """Synchronous pack creation fallback."""
    from sergik_ml.pipelines.pack_pipeline import create_pack
    return create_pack(args)


# ============================================================================
# Task Dispatcher
# ============================================================================

def dispatch_task(
    task_name: str,
    *args,
    async_mode: bool = True,
    **kwargs,
) -> Any:
    """
    Dispatch a task, using Celery if available.

    Args:
        task_name: Name of the task
        async_mode: If True and Celery available, run async
        *args, **kwargs: Task arguments

    Returns:
        Task result or AsyncResult
    """
    task_map = {
        "separate_stems": (
            separate_stems_async if CELERY_AVAILABLE else None,
            separate_stems_sync,
        ),
        "create_pack": (
            create_pack_async if CELERY_AVAILABLE else None,
            create_pack_sync,
        ),
    }

    if task_name not in task_map:
        raise ValueError(f"Unknown task: {task_name}")

    async_func, sync_func = task_map[task_name]

    if async_mode and CELERY_AVAILABLE and async_func:
        return async_func.delay(*args, **kwargs)
    else:
        return sync_func(*args, **kwargs)


def get_task_status(task_id: str) -> Dict[str, Any]:
    """
    Get status of an async task.

    Args:
        task_id: Celery task ID

    Returns:
        Task status and result
    """
    if not CELERY_AVAILABLE:
        return {"error": "Celery not available"}

    from celery.result import AsyncResult

    result = AsyncResult(task_id, app=app)

    return {
        "task_id": task_id,
        "status": result.status,
        "ready": result.ready(),
        "successful": result.successful() if result.ready() else None,
        "result": result.result if result.ready() else None,
        "info": result.info if not result.ready() else None,
    }
