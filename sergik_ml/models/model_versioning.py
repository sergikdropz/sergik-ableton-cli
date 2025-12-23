"""
SERGIK ML Model Versioning

Track, version, and manage ML models:
  - Automatic versioning on save
  - Training metadata logging
  - A/B testing support
  - Rollback capability

Storage structure:
    artifacts/
    └── models/
        └── preference/
            ├── v1/
            │   ├── model.pkl
            │   ├── metadata.json
            │   └── metrics.json
            ├── v2/
            │   └── ...
            └── latest -> v2/
"""

import logging
import json
import shutil
import pickle
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, asdict
import hashlib

from ..config import CFG

logger = logging.getLogger(__name__)


@dataclass
class ModelMetadata:
    """Metadata for a model version."""
    version: int
    model_type: str
    created_at: str
    training_samples: int
    feature_dim: int
    hyperparameters: Dict[str, Any]
    git_commit: Optional[str] = None
    training_duration_sec: float = 0.0
    notes: str = ""


@dataclass
class ModelMetrics:
    """Evaluation metrics for a model version."""
    mse: float = 0.0
    mae: float = 0.0
    rmse: float = 0.0
    r2: float = 0.0
    val_mse: Optional[float] = None
    val_mae: Optional[float] = None
    feature_importance: Dict[str, float] = None

    def __post_init__(self):
        if self.feature_importance is None:
            self.feature_importance = {}


class ModelRegistry:
    """
    Registry for versioned models.

    Supports:
      - Automatic versioning
      - Metadata tracking
      - A/B testing
      - Rollback
    """

    def __init__(self, base_dir: Optional[str] = None):
        """
        Initialize model registry.

        Args:
            base_dir: Base directory for models (default: from config)
        """
        self.base_dir = Path(base_dir or CFG.artifact_dir) / "models"
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _model_dir(self, model_type: str) -> Path:
        """Get directory for a model type."""
        return self.base_dir / model_type

    def _version_dir(self, model_type: str, version: int) -> Path:
        """Get directory for a specific version."""
        return self._model_dir(model_type) / f"v{version}"

    def get_latest_version(self, model_type: str) -> int:
        """Get the latest version number for a model type."""
        model_dir = self._model_dir(model_type)
        if not model_dir.exists():
            return 0

        versions = []
        for d in model_dir.iterdir():
            if d.is_dir() and d.name.startswith("v"):
                try:
                    versions.append(int(d.name[1:]))
                except ValueError:
                    pass

        return max(versions) if versions else 0

    def save_model(
        self,
        model: Any,
        model_type: str,
        metadata: ModelMetadata,
        metrics: Optional[ModelMetrics] = None,
        make_latest: bool = True,
    ) -> Tuple[int, Path]:
        """
        Save a model with versioning.

        Args:
            model: Model object to save
            model_type: Type of model (e.g., "preference")
            metadata: Model metadata
            metrics: Optional evaluation metrics
            make_latest: Update 'latest' symlink

        Returns:
            Tuple of (version, path)
        """
        version = self.get_latest_version(model_type) + 1
        version_dir = self._version_dir(model_type, version)
        version_dir.mkdir(parents=True, exist_ok=True)

        # Update metadata with version
        metadata.version = version
        if not metadata.created_at:
            metadata.created_at = datetime.utcnow().isoformat()

        # Save model
        model_path = version_dir / "model.pkl"
        with open(model_path, "wb") as f:
            pickle.dump(model, f)

        # Save metadata
        metadata_path = version_dir / "metadata.json"
        with open(metadata_path, "w") as f:
            json.dump(asdict(metadata), f, indent=2)

        # Save metrics
        if metrics:
            metrics_path = version_dir / "metrics.json"
            with open(metrics_path, "w") as f:
                json.dump(asdict(metrics), f, indent=2)

        # Compute model hash
        model_hash = self._compute_hash(model_path)
        hash_path = version_dir / "model.sha256"
        hash_path.write_text(model_hash)

        # Update latest symlink
        if make_latest:
            self._update_latest(model_type, version)

        logger.info(f"Saved {model_type} model v{version} to {version_dir}")
        return version, version_dir

    def load_model(
        self,
        model_type: str,
        version: Optional[int] = None,
    ) -> Tuple[Any, ModelMetadata, Optional[ModelMetrics]]:
        """
        Load a model version.

        Args:
            model_type: Type of model
            version: Version to load (None = latest)

        Returns:
            Tuple of (model, metadata, metrics)
        """
        if version is None:
            version = self.get_latest_version(model_type)

        if version == 0:
            raise FileNotFoundError(f"No models found for type: {model_type}")

        version_dir = self._version_dir(model_type, version)
        if not version_dir.exists():
            raise FileNotFoundError(f"Model version not found: {model_type} v{version}")

        # Load model
        model_path = version_dir / "model.pkl"
        with open(model_path, "rb") as f:
            model = pickle.load(f)

        # Load metadata
        metadata = None
        metadata_path = version_dir / "metadata.json"
        if metadata_path.exists():
            with open(metadata_path) as f:
                metadata = ModelMetadata(**json.load(f))

        # Load metrics
        metrics = None
        metrics_path = version_dir / "metrics.json"
        if metrics_path.exists():
            with open(metrics_path) as f:
                metrics = ModelMetrics(**json.load(f))

        logger.info(f"Loaded {model_type} model v{version}")
        return model, metadata, metrics

    def list_versions(self, model_type: str) -> List[Dict[str, Any]]:
        """
        List all versions of a model type.

        Returns:
            List of version info dicts
        """
        model_dir = self._model_dir(model_type)
        if not model_dir.exists():
            return []

        versions = []
        for d in sorted(model_dir.iterdir()):
            if d.is_dir() and d.name.startswith("v"):
                try:
                    version = int(d.name[1:])
                    info = {"version": version, "path": str(d)}

                    # Load metadata if available
                    metadata_path = d / "metadata.json"
                    if metadata_path.exists():
                        with open(metadata_path) as f:
                            info["metadata"] = json.load(f)

                    # Load metrics if available
                    metrics_path = d / "metrics.json"
                    if metrics_path.exists():
                        with open(metrics_path) as f:
                            info["metrics"] = json.load(f)

                    versions.append(info)

                except ValueError:
                    pass

        return sorted(versions, key=lambda x: x["version"], reverse=True)

    def delete_version(self, model_type: str, version: int) -> bool:
        """
        Delete a model version.

        Args:
            model_type: Type of model
            version: Version to delete

        Returns:
            Success status
        """
        version_dir = self._version_dir(model_type, version)
        if not version_dir.exists():
            logger.warning(f"Version not found: {model_type} v{version}")
            return False

        shutil.rmtree(version_dir)
        logger.info(f"Deleted {model_type} v{version}")

        # Update latest if needed
        latest = self.get_latest_version(model_type)
        if latest > 0:
            self._update_latest(model_type, latest)

        return True

    def rollback(self, model_type: str, to_version: int) -> bool:
        """
        Rollback to a previous version.

        Args:
            model_type: Type of model
            to_version: Version to rollback to

        Returns:
            Success status
        """
        if not self._version_dir(model_type, to_version).exists():
            logger.error(f"Version not found: {model_type} v{to_version}")
            return False

        self._update_latest(model_type, to_version)
        logger.info(f"Rolled back {model_type} to v{to_version}")
        return True

    def compare_versions(
        self,
        model_type: str,
        version_a: int,
        version_b: int,
    ) -> Dict[str, Any]:
        """
        Compare two model versions.

        Returns:
            Comparison dict with metrics delta
        """
        _, _, metrics_a = self.load_model(model_type, version_a)
        _, _, metrics_b = self.load_model(model_type, version_b)

        if not metrics_a or not metrics_b:
            return {"error": "Metrics not available for comparison"}

        return {
            "version_a": version_a,
            "version_b": version_b,
            "mse_delta": (metrics_b.mse - metrics_a.mse) if metrics_a.mse and metrics_b.mse else None,
            "mae_delta": (metrics_b.mae - metrics_a.mae) if metrics_a.mae and metrics_b.mae else None,
            "r2_delta": (metrics_b.r2 - metrics_a.r2) if metrics_a.r2 and metrics_b.r2 else None,
            "better": (
                "version_b" if metrics_b.mse < metrics_a.mse
                else "version_a" if metrics_a.mse < metrics_b.mse
                else "equal"
            ) if metrics_a.mse and metrics_b.mse else "unknown",
        }

    def _update_latest(self, model_type: str, version: int) -> None:
        """Update the 'latest' symlink."""
        model_dir = self._model_dir(model_type)
        latest_link = model_dir / "latest"

        if latest_link.exists() or latest_link.is_symlink():
            latest_link.unlink()

        version_dir = self._version_dir(model_type, version)
        latest_link.symlink_to(version_dir.name)

    def _compute_hash(self, file_path: Path) -> str:
        """Compute SHA256 hash of file."""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()


# ============================================================================
# Global Registry
# ============================================================================

_registry: Optional[ModelRegistry] = None


def get_registry() -> ModelRegistry:
    """Get or create global model registry."""
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry


# ============================================================================
# Convenience Functions
# ============================================================================

def save_preference_model(
    model: Any,
    training_samples: int,
    metrics: Dict[str, float],
    hyperparameters: Optional[Dict[str, Any]] = None,
) -> Tuple[int, Path]:
    """
    Save preference model with versioning.

    Args:
        model: PreferenceModel instance
        training_samples: Number of training samples
        metrics: Dict with mse, mae, etc.
        hyperparameters: Training hyperparameters

    Returns:
        Tuple of (version, path)
    """
    registry = get_registry()

    metadata = ModelMetadata(
        version=0,  # Will be set by registry
        model_type="preference",
        created_at=datetime.utcnow().isoformat(),
        training_samples=training_samples,
        feature_dim=7,
        hyperparameters=hyperparameters or {"l2": 0.01},
    )

    model_metrics = ModelMetrics(
        mse=metrics.get("mse", 0),
        mae=metrics.get("mae", 0),
        rmse=metrics.get("rmse", 0),
        r2=metrics.get("r2", 0),
        feature_importance=metrics.get("feature_importance", {}),
    )

    return registry.save_model(model, "preference", metadata, model_metrics)


def load_preference_model(version: Optional[int] = None):
    """Load preference model (latest by default)."""
    registry = get_registry()
    model, metadata, metrics = registry.load_model("preference", version)
    return model, metadata, metrics


def list_preference_versions() -> List[Dict[str, Any]]:
    """List all preference model versions."""
    return get_registry().list_versions("preference")
