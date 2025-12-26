"""
SERGIK ML Preference Model

Learns user preferences from ratings to rerank/recommend tracks.

Architecture:
  - V1: Ridge regression on feature vectors (current)
  - V2: Neural network or gradient boosting (upgrade path)
  - V3: Contextual bandits for exploration/exploitation
"""

import numpy as np
from typing import Optional, Tuple
import logging
import pickle
from pathlib import Path

logger = logging.getLogger(__name__)


class PreferenceModel:
    """
    Linear preference model trained from user ratings.

    score = X @ w + b

    where X is the feature matrix and w are learned weights.
    """

    def __init__(self):
        self.w: Optional[np.ndarray] = None
        self.b: float = 3.0  # Default to neutral rating
        self.feature_dim: int = 7
        self.fitted: bool = False

    def fit(self, X: np.ndarray, y: np.ndarray, l2: float = 1e-2) -> "PreferenceModel":
        """
        Fit preference model using ridge regression.

        Args:
            X: Feature matrix (n_samples, n_features)
            y: Ratings (n_samples,)
            l2: L2 regularization strength

        Returns:
            self
        """
        if X.shape[0] < 3:
            logger.warning("Not enough samples to fit preference model")
            return self

        self.feature_dim = X.shape[1]
        self.b = float(y.mean())

        # Ridge regression: (X'X + lambda*I)^-1 X'y
        XtX = X.T @ X
        reg = l2 * np.eye(X.shape[1], dtype=np.float32)

        try:
            self.w = np.linalg.solve(XtX + reg, X.T @ (y - self.b))
            self.fitted = True
            logger.info(f"Preference model fitted on {X.shape[0]} samples")
        except np.linalg.LinAlgError as e:
            logger.error(f"Preference model fitting failed: {e}")
            self.w = np.zeros(self.feature_dim, dtype=np.float32)

        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict preference scores.

        Args:
            X: Feature matrix (n_samples, n_features)

        Returns:
            Predicted scores (n_samples,)
        """
        if self.w is None or not self.fitted:
            return np.full(X.shape[0], self.b, dtype=np.float32)

        return (X @ self.w) + self.b

    def predict_single(self, x: np.ndarray) -> float:
        """Predict score for single feature vector."""
        return float(self.predict(x.reshape(1, -1))[0])

    def save(self, path: str) -> None:
        """Save model to file."""
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump({"w": self.w, "b": self.b, "fitted": self.fitted}, f)
        logger.info(f"Preference model saved to {path}")

    @classmethod
    def load(cls, path: str) -> "PreferenceModel":
        """Load model from file."""
        model = cls()
        try:
            with open(path, "rb") as f:
                data = pickle.load(f)
            model.w = data["w"]
            model.b = data["b"]
            model.fitted = data.get("fitted", True)
            logger.info(f"Preference model loaded from {path}")
        except Exception as e:
            logger.warning(f"Could not load preference model: {e}")
        return model

    def get_feature_importance(self, feature_names: Optional[list] = None) -> dict:
        """
        Get feature importance from weights.
        
        Args:
            feature_names: Optional list of feature names. If None, uses default names.
        
        Returns:
            Dictionary of feature importance scores
        """
        if self.w is None:
            return {}

        if feature_names is None:
            # Default feature names for 7-dim base features
            if self.feature_dim == 7:
                features = ["bpm", "energy", "brightness", "lufs", "harmonic", "percussive", "stereo"]
            else:
                # Generic names for enhanced features
                features = [f"feature_{i}" for i in range(self.feature_dim)]
        else:
            features = feature_names
        
        # Ensure we have enough feature names
        if len(features) < len(self.w):
            features.extend([f"feature_{i}" for i in range(len(features), len(self.w))])
        elif len(features) > len(self.w):
            features = features[:len(self.w)]
        
        importance = {f: float(abs(w)) for f, w in zip(features, self.w)}
        return dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
