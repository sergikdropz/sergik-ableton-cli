#!/usr/bin/env python3
"""
SERGIK ML Preference Model Training

Trains preference model from user ratings stored in music_intelligence table.

Usage:
    python -m sergik_ml.train.train_preference
"""

import numpy as np
from pathlib import Path
import logging
import sys

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sergik_ml.stores.sql_store import list_tracks, init_db
from sergik_ml.stores.vector_store import feature_vec
from sergik_ml.models.preference import PreferenceModel
from sergik_ml.config import CFG

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Train preference model from rated tracks."""

    # Initialize database
    init_db()

    # Load rated tracks
    logger.info("Loading rated tracks...")
    rows = list_tracks(limit=10000, rated_only=True)

    if len(rows) < 10:
        logger.warning(f"Only {len(rows)} rated tracks found. Need at least 10 for training.")
        logger.info("Rate more tracks using: POST /action {cmd: 'pack.rate', args: {track_id, rating}}")
        return

    logger.info(f"Found {len(rows)} rated tracks")

    # Extract features and ratings
    X = np.stack([feature_vec(r) for r in rows])
    y = np.array([float(r["rating"]) for r in rows], dtype=np.float32)

    logger.info(f"Feature matrix shape: {X.shape}")
    logger.info(f"Rating range: {y.min():.1f} - {y.max():.1f} (mean: {y.mean():.2f})")

    # Train model
    logger.info("Training preference model...")
    model = PreferenceModel()
    model.fit(X, y, l2=1e-2)

    # Evaluate
    predictions = model.predict(X)
    mse = np.mean((predictions - y) ** 2)
    mae = np.mean(np.abs(predictions - y))

    logger.info(f"Training MSE: {mse:.4f}")
    logger.info(f"Training MAE: {mae:.4f}")

    # Feature importance
    importance = model.get_feature_importance()
    logger.info("Feature importance:")
    for feat, imp in importance.items():
        logger.info(f"  {feat}: {imp:.4f}")

    # Save model
    out_dir = Path(CFG.artifact_dir) / "models"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "preference_model.pkl"

    model.save(str(out_path))
    logger.info(f"Model saved to: {out_path}")


if __name__ == "__main__":
    main()
