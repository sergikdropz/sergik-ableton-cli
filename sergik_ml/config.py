"""
SERGIK ML Configuration

Environment variables:
  SERGIK_HOST, SERGIK_PORT - Service binding
  SERGIK_DB_URL - SQLAlchemy database URL
  SERGIK_ARTIFACT_DIR - Model artifacts directory
  SERGIK_ABLETON_OSC_HOST/PORT - Ableton OSC target
"""

from dataclasses import dataclass, field
from typing import Optional
import os


@dataclass(frozen=True)
class Config:
    """Immutable configuration loaded from environment."""

    # Core service
    host: str = os.getenv("SERGIK_HOST", "127.0.0.1")
    port: int = int(os.getenv("SERGIK_PORT", "8000"))

    # Storage
    db_url: str = os.getenv("SERGIK_DB_URL", "sqlite:///sergik_ml.db")
    artifact_dir: str = os.getenv("SERGIK_ARTIFACT_DIR", "artifacts")
    data_dir: str = os.getenv("SERGIK_DATA_DIR", "data")

    # Ableton OSC
    ableton_osc_host: str = os.getenv("SERGIK_ABLETON_OSC_HOST", "127.0.0.1")
    ableton_osc_port: int = int(os.getenv("SERGIK_ABLETON_OSC_PORT", "9000"))

    # Model microservices (optional)
    sergik_gen_url: str = os.getenv("SERGIK_GEN_URL", "http://127.0.0.1:8011")
    musicbrains_url: str = os.getenv("SERGIK_MUSICBRAINS_URL", "http://127.0.0.1:8012")

    # Voice providers
    use_openai_voice: bool = os.getenv("SERGIK_USE_OPENAI_VOICE", "0") == "1"
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")

    # Feature extraction
    default_sample_rate: int = int(os.getenv("SERGIK_SAMPLE_RATE", "44100"))
    embedding_dim: int = int(os.getenv("SERGIK_EMBEDDING_DIM", "256"))


CFG = Config()
