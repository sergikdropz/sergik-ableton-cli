#!/usr/bin/env python3
"""
SERGIK Automated Retraining Pipeline

Automated retraining of preference model when new ratings are collected.
- Triggers on new ratings threshold (e.g., 50 new ratings)
- Retrains preference model
- Evaluates against previous version
- Deploys if improvement

Can be run as:
- Cron job
- Scheduled task
- Manual trigger
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import subprocess

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sergik_ml.stores.sql_store import (
    engine, music_intelligence, init_db
)
from sqlalchemy import select, func
from sergik_ml.models.model_versioning import (
    get_registry, load_preference_model, save_preference_model
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_new_ratings_count(since_timestamp: Optional[datetime] = None) -> int:
    """
    Get count of new ratings since timestamp.
    
    Args:
        since_timestamp: Timestamp to check from (None = last 24 hours)
        
    Returns:
        Number of new ratings
    """
    if since_timestamp is None:
        since_timestamp = datetime.utcnow() - timedelta(days=1)
    
    with engine.begin() as conn:
        count = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.rating.isnot(None),
                music_intelligence.c.updated_at >= since_timestamp
            )
        ).scalar()
    
    return count


def get_last_training_timestamp() -> Optional[datetime]:
    """Get timestamp of last model training."""
    registry = get_registry()
    versions = registry.list_versions("preference")
    
    if not versions:
        return None
    
    latest = versions[0]
    metadata = latest.get("metadata", {})
    created_at = metadata.get("created_at")
    
    if created_at:
        try:
            return datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        except:
            return None
    
    return None


def should_retrain(threshold: int = 50) -> bool:
    """
    Check if model should be retrained.
    
    Args:
        threshold: Minimum number of new ratings to trigger retraining
        
    Returns:
        True if should retrain
    """
    last_training = get_last_training_timestamp()
    new_ratings = get_new_ratings_count(since_timestamp=last_training)
    
    logger.info(f"New ratings since last training: {new_ratings} (threshold: {threshold})")
    
    return new_ratings >= threshold


def train_model(use_enhanced_features: bool = False) -> Dict[str, Any]:
    """
    Train preference model.
    
    Args:
        use_enhanced_features: Use enhanced 20+ dim features
        
    Returns:
        Training results dictionary
    """
    logger.info("Starting model training...")
    
    # Run training script
    cmd = [
        sys.executable, "-m", "sergik_ml.train.train_preference",
        "--k-folds", "5",
    ]
    
    if use_enhanced_features:
        cmd.append("--use-enhanced-features")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=str(project_root)
        )
        
        if result.returncode != 0:
            logger.error(f"Training failed: {result.stderr}")
            return {"status": "error", "error": result.stderr}
        
        logger.info("Training completed successfully")
        return {"status": "success", "output": result.stdout}
        
    except Exception as e:
        logger.error(f"Training exception: {e}")
        return {"status": "error", "error": str(e)}


def compare_models(version_a: int, version_b: int) -> Dict[str, Any]:
    """
    Compare two model versions.
    
    Args:
        version_a: Previous version
        version_b: New version
        
    Returns:
        Comparison results
    """
    registry = get_registry()
    comparison = registry.compare_versions("preference", version_a, version_b)
    
    return comparison


def should_deploy(comparison: Dict[str, Any]) -> bool:
    """
    Determine if new model should be deployed.
    
    Args:
        comparison: Model comparison results
        
    Returns:
        True if should deploy
    """
    # Deploy if new model has lower MSE or higher R²
    if comparison.get("better") == "version_b":
        return True
    
    # Deploy if MSE improvement is significant (>5%)
    mse_delta = comparison.get("mse_delta")
    if mse_delta and mse_delta < -0.05:  # 5% improvement
        return True
    
    return False


def deploy_model(version: int) -> bool:
    """
    Deploy model version (make it latest).
    
    Args:
        version: Version to deploy
        
    Returns:
        Success status
    """
    registry = get_registry()
    return registry.rollback("preference", version)


def retrain_pipeline(
    threshold: int = 50,
    use_enhanced_features: bool = False,
    force: bool = False
) -> Dict[str, Any]:
    """
    Run complete retraining pipeline.
    
    Args:
        threshold: Minimum new ratings to trigger retraining
        use_enhanced_features: Use enhanced features
        force: Force retraining even if threshold not met
        
    Returns:
        Pipeline results
    """
    logger.info("=" * 60)
    logger.info("RETRAINING PIPELINE")
    logger.info("=" * 60)
    
    # Initialize database
    init_db()
    
    # Check if should retrain
    if not force and not should_retrain(threshold):
        logger.info("Threshold not met, skipping retraining")
        return {
            "status": "skipped",
            "reason": "threshold_not_met",
            "new_ratings": get_new_ratings_count(),
            "threshold": threshold,
        }
    
    # Get current version
    registry = get_registry()
    current_version = registry.get_latest_version("preference")
    
    logger.info(f"Current model version: {current_version}")
    
    # Train new model
    train_result = train_model(use_enhanced_features=use_enhanced_features)
    
    if train_result["status"] != "success":
        return {
            "status": "error",
            "error": train_result.get("error", "Training failed"),
        }
    
    # Get new version
    new_version = registry.get_latest_version("preference")
    
    if new_version == current_version:
        logger.warning("No new model version created")
        return {
            "status": "error",
            "error": "No new model version created",
        }
    
    logger.info(f"New model version: {new_version}")
    
    # Compare models
    if current_version > 0:
        comparison = compare_models(current_version, new_version)
        logger.info(f"Model comparison: {comparison}")
        
        # Decide if should deploy
        if should_deploy(comparison):
            logger.info("New model is better, deploying...")
            deploy_model(new_version)
            return {
                "status": "success",
                "deployed": True,
                "current_version": current_version,
                "new_version": new_version,
                "comparison": comparison,
            }
        else:
            logger.info("New model is not better, keeping previous version")
            # Rollback to previous version
            registry.rollback("preference", current_version)
            return {
                "status": "success",
                "deployed": False,
                "current_version": current_version,
                "new_version": new_version,
                "comparison": comparison,
                "reason": "new_model_not_better",
            }
    else:
        # First model, always deploy
        logger.info("First model, deploying...")
        return {
            "status": "success",
            "deployed": True,
            "current_version": 0,
            "new_version": new_version,
        }


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="SERGIK Automated Retraining Pipeline"
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=50,
        help="Minimum new ratings to trigger retraining (default: 50)"
    )
    parser.add_argument(
        "--use-enhanced-features",
        action="store_true",
        help="Use enhanced 20+ dim feature vectors"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force retraining even if threshold not met"
    )
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Only check if retraining is needed, don't train"
    )
    
    args = parser.parse_args()
    
    if args.check_only:
        should = should_retrain(threshold=args.threshold)
        new_ratings = get_new_ratings_count()
        print(f"Should retrain: {should}")
        print(f"New ratings: {new_ratings} (threshold: {args.threshold})")
        return
    
    result = retrain_pipeline(
        threshold=args.threshold,
        use_enhanced_features=args.use_enhanced_features,
        force=args.force
    )
    
    logger.info("=" * 60)
    logger.info("PIPELINE COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Status: {result['status']}")
    if result.get("deployed"):
        logger.info(f"Deployed version: {result.get('new_version')}")
    else:
        logger.info(f"Kept version: {result.get('current_version')}")


if __name__ == "__main__":
    main()

