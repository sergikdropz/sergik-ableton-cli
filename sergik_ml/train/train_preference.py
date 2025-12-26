#!/usr/bin/env python3
"""
SERGIK ML Preference Model Training

Trains preference model from user ratings stored in music_intelligence table.
Enhanced with cross-validation, enhanced features, and better metrics.

Usage:
    python -m sergik_ml.train.train_preference [--use-enhanced-features] [--k-folds 5]
"""

import numpy as np
from pathlib import Path
import logging
import sys
from typing import Dict, Any, Optional
from sklearn.model_selection import KFold
from sklearn.metrics import r2_score

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sergik_ml.stores.sql_store import list_tracks, init_db
from sergik_ml.stores.vector_store import feature_vec
from sergik_ml.models.preference import PreferenceModel
from sergik_ml.config import CFG

# Try to import enhanced features
try:
    from scripts.ml.feature_engineering import extract_ml_features, get_feature_names
    ENHANCED_FEATURES_AVAILABLE = True
except ImportError:
    ENHANCED_FEATURES_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Enhanced features not available, using base features")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def cross_validate(
    X: np.ndarray,
    y: np.ndarray,
    k_folds: int = 5,
    l2: float = 1e-2
) -> Dict[str, float]:
    """
    Perform k-fold cross-validation.
    
    Args:
        X: Feature matrix
        y: Ratings
        k_folds: Number of folds
        l2: L2 regularization strength
        
    Returns:
        Dictionary with CV metrics
    """
    if len(X) < k_folds:
        logger.warning(f"Not enough samples ({len(X)}) for {k_folds}-fold CV, using {len(X)} folds")
        k_folds = len(X)
    
    kf = KFold(n_splits=k_folds, shuffle=True, random_state=42)
    
    cv_mse = []
    cv_mae = []
    cv_r2 = []
    
    for fold, (train_idx, val_idx) in enumerate(kf.split(X), 1):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]
        
        # Train model
        model = PreferenceModel()
        model.fit(X_train, y_train, l2=l2)
        
        # Evaluate on validation set
        y_pred = model.predict(X_val)
        
        mse = np.mean((y_pred - y_val) ** 2)
        mae = np.mean(np.abs(y_pred - y_val))
        r2 = r2_score(y_val, y_pred)
        
        cv_mse.append(mse)
        cv_mae.append(mae)
        cv_r2.append(r2)
        
        logger.info(f"Fold {fold}/{k_folds}: MSE={mse:.4f}, MAE={mae:.4f}, R²={r2:.4f}")
    
    return {
        "cv_mse_mean": float(np.mean(cv_mse)),
        "cv_mse_std": float(np.std(cv_mse)),
        "cv_mae_mean": float(np.mean(cv_mae)),
        "cv_mae_std": float(np.std(cv_mae)),
        "cv_r2_mean": float(np.mean(cv_r2)),
        "cv_r2_std": float(np.std(cv_r2)),
    }


def main():
    """Train preference model from rated tracks."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Train SERGIK ML preference model")
    parser.add_argument(
        "--use-enhanced-features",
        action="store_true",
        help="Use enhanced 20+ dim feature vectors (requires feature_engineering module)"
    )
    parser.add_argument(
        "--k-folds",
        type=int,
        default=5,
        help="Number of folds for cross-validation (default: 5)"
    )
    parser.add_argument(
        "--l2",
        type=float,
        default=1e-2,
        help="L2 regularization strength (default: 1e-2)"
    )
    parser.add_argument(
        "--skip-cv",
        action="store_true",
        help="Skip cross-validation (faster training)"
    )
    
    args = parser.parse_args()

    # Initialize database
    init_db()

    # Load rated tracks
    logger.info("Loading rated tracks...")
    rows = list_tracks(limit=10000, rated_only=True)

    if len(rows) < 10:
        logger.warning(f"Only {len(rows)} rated tracks found. Need at least 10 for training.")
        logger.info("Rate more tracks using: python scripts/ml/collect_ratings.py interactive")
        return

    logger.info(f"Found {len(rows)} rated tracks")

    # Extract features
    use_enhanced = args.use_enhanced_features and ENHANCED_FEATURES_AVAILABLE
    
    if use_enhanced:
        logger.info("Using enhanced feature vectors (20+ dimensions)")
        from scripts.ml.feature_engineering import extract_ml_features
        X = np.stack([extract_ml_features(r) for r in rows])
        feature_names = get_feature_names()
    else:
        logger.info("Using base feature vectors (7 dimensions)")
        X = np.stack([feature_vec(r) for r in rows])
        feature_names = ["bpm", "energy", "brightness", "lufs", "harmonic", "percussive", "stereo"]
    
    y = np.array([float(r["rating"]) for r in rows], dtype=np.float32)

    logger.info(f"Feature matrix shape: {X.shape}")
    logger.info(f"Rating range: {y.min():.1f} - {y.max():.1f} (mean: {y.mean():.2f})")

    # Cross-validation
    if not args.skip_cv and len(rows) >= args.k_folds:
        logger.info(f"Performing {args.k_folds}-fold cross-validation...")
        cv_metrics = cross_validate(X, y, k_folds=args.k_folds, l2=args.l2)
        
        logger.info("=" * 60)
        logger.info("CROSS-VALIDATION RESULTS")
        logger.info("=" * 60)
        logger.info(f"CV MSE: {cv_metrics['cv_mse_mean']:.4f} ± {cv_metrics['cv_mse_std']:.4f}")
        logger.info(f"CV MAE: {cv_metrics['cv_mae_mean']:.4f} ± {cv_metrics['cv_mae_std']:.4f}")
        logger.info(f"CV R²:  {cv_metrics['cv_r2_mean']:.4f} ± {cv_metrics['cv_r2_std']:.4f}")
        logger.info("=" * 60)

    # Train final model on all data
    logger.info("Training final model on all data...")
    model = PreferenceModel()
    model.fit(X, y, l2=args.l2)

    # Evaluate on training set
    predictions = model.predict(X)
    mse = np.mean((predictions - y) ** 2)
    mae = np.mean(np.abs(predictions - y))
    r2 = r2_score(y, predictions)
    
    # Calculate additional metrics
    rmse = np.sqrt(mse)
    mape = np.mean(np.abs((y - predictions) / (y + 1e-9))) * 100  # Mean absolute percentage error

    logger.info("=" * 60)
    logger.info("TRAINING RESULTS")
    logger.info("=" * 60)
    logger.info(f"MSE:  {mse:.4f}")
    logger.info(f"RMSE: {rmse:.4f}")
    logger.info(f"MAE:  {mae:.4f}")
    logger.info(f"R²:   {r2:.4f}")
    logger.info(f"MAPE: {mape:.2f}%")
    logger.info("=" * 60)

    # Feature importance
    importance = model.get_feature_importance()
    if len(importance) != len(feature_names):
        # Fallback to default feature names if mismatch
        feature_names = list(importance.keys())
    
    logger.info("Feature importance:")
    for feat, imp in sorted(importance.items(), key=lambda x: x[1], reverse=True):
        logger.info(f"  {feat}: {imp:.4f}")

    # Save model
    out_dir = Path(CFG.artifact_dir) / "models"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "preference_model.pkl"

    model.save(str(out_path))
    logger.info(f"Model saved to: {out_path}")
    
    # Save training metrics
    metrics_path = out_dir / "preference_model_metrics.json"
    import json
    metrics = {
        "mse": float(mse),
        "rmse": float(rmse),
        "mae": float(mae),
        "r2": float(r2),
        "mape": float(mape),
        "n_samples": len(rows),
        "n_features": X.shape[1],
        "feature_names": feature_names,
        "feature_importance": importance,
        "use_enhanced_features": use_enhanced,
    }
    
    if not args.skip_cv and len(rows) >= args.k_folds:
        metrics["cross_validation"] = cv_metrics
    
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Metrics saved to: {metrics_path}")


if __name__ == "__main__":
    main()
