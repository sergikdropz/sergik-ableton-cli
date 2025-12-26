"""
SERGIK ML Configuration

Environment variables:
  SERGIK_HOST, SERGIK_PORT - Service binding
  SERGIK_DB_URL - SQLAlchemy database URL
  SERGIK_ARTIFACT_DIR - Model artifacts directory
  SERGIK_ABLETON_OSC_HOST/PORT - Ableton OSC target
  SERGIK_ENV - Environment (dev, staging, prod) - defaults to dev
"""

from typing import Optional, List
import os
from pydantic import BaseModel, Field, field_validator, ValidationError
from .utils.errors import ConfigurationError


class ConfigSchema(BaseModel):
    """Pydantic schema for configuration validation."""
    
    # Environment
    env: str = Field(default="dev", description="Environment: dev, staging, prod")
    
    # Core service
    host: str = Field(default="127.0.0.1", description="Service host")
    port: int = Field(default=8000, ge=1, le=65535, description="Service port")
    
    # Storage
    db_url: str = Field(default="sqlite:///sergik_ml.db", description="Database URL")
    artifact_dir: str = Field(default="artifacts", description="Model artifacts directory")
    data_dir: str = Field(default="data", description="Data directory")
    
    # Ableton OSC
    ableton_osc_host: str = Field(default="127.0.0.1", description="Ableton OSC host")
    ableton_osc_port: int = Field(default=9000, ge=1, le=65535, description="Ableton OSC port")
    
    # Model microservices (optional)
    sergik_gen_url: str = Field(default="http://127.0.0.1:8011", description="SERGIK generator service URL")
    musicbrains_url: str = Field(default="http://127.0.0.1:8012", description="MusicBrains service URL")
    
    # Voice providers
    use_openai_voice: bool = Field(default=False, description="Use OpenAI for STT/TTS")
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    
    # Feature extraction
    default_sample_rate: int = Field(default=44100, ge=8000, le=192000, description="Default sample rate")
    embedding_dim: int = Field(default=256, ge=64, le=2048, description="Embedding dimension")
    
    # CORS (for security)
    allowed_origins: List[str] = Field(default_factory=lambda: ["*"], description="Allowed CORS origins")
    
    @field_validator('host', 'ableton_osc_host')
    @classmethod
    def validate_host(cls, v):
        """Validate host address."""
        if not v or not isinstance(v, str):
            raise ValueError("Host must be a non-empty string")
        return v
    
    @field_validator('db_url')
    @classmethod
    def validate_db_url(cls, v):
        """Validate database URL."""
        if not v or not isinstance(v, str):
            raise ValueError("Database URL must be a non-empty string")
        if not (v.startswith("sqlite:///") or v.startswith("postgresql://") or v.startswith("mysql://")):
            raise ValueError("Database URL must start with sqlite:///, postgresql://, or mysql://")
        return v
    
    @field_validator('env')
    @classmethod
    def validate_env(cls, v):
        """Validate environment."""
        if v not in ["dev", "staging", "prod"]:
            raise ValueError("Environment must be one of: dev, staging, prod")
        return v


def _get_env_var(key: str, default: str) -> str:
    """Safely get environment variable."""
    return os.getenv(key, default)


def _get_int_env_var(key: str, default: int) -> int:
    """Safely get integer environment variable."""
    value = os.getenv(key)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError as e:
        raise ConfigurationError(
            f"Invalid integer value for {key}: {value}",
            details={"key": key, "value": value, "expected_type": "int"}
        ) from e


def _get_bool_env_var(key: str, default: bool) -> bool:
    """Safely get boolean environment variable."""
    value = os.getenv(key)
    if value is None:
        return default
    return value.lower() in ("1", "true", "yes", "on")


def _get_list_env_var(key: str, default: List[str]) -> List[str]:
    """Safely get list environment variable (comma-separated)."""
    value = os.getenv(key)
    if value is None:
        return default
    if value == "*":
        return ["*"]
    return [item.strip() for item in value.split(",") if item.strip()]


def _load_config_from_env() -> ConfigSchema:
    """Load configuration from environment variables with type-safe parsing."""
    env = _get_env_var("SERGIK_ENV", "dev")
    
    # Environment-specific defaults
    if env == "prod":
        default_allowed_origins = _get_list_env_var("SERGIK_ALLOWED_ORIGINS", [])
        if not default_allowed_origins:
            raise ConfigurationError(
                "SERGIK_ALLOWED_ORIGINS must be set in production",
                details={"env": env}
            )
    else:
        default_allowed_origins = _get_list_env_var("SERGIK_ALLOWED_ORIGINS", ["*"])
    
    try:
        return ConfigSchema(
            env=env,
            host=_get_env_var("SERGIK_HOST", "127.0.0.1"),
            port=_get_int_env_var("SERGIK_PORT", 8000),
            db_url=_get_env_var("SERGIK_DB_URL", "sqlite:///sergik_ml.db"),
            artifact_dir=_get_env_var("SERGIK_ARTIFACT_DIR", "artifacts"),
            data_dir=_get_env_var("SERGIK_DATA_DIR", "data"),
            ableton_osc_host=_get_env_var("SERGIK_ABLETON_OSC_HOST", "127.0.0.1"),
            ableton_osc_port=_get_int_env_var("SERGIK_ABLETON_OSC_PORT", 9000),
            sergik_gen_url=_get_env_var("SERGIK_GEN_URL", "http://127.0.0.1:8011"),
            musicbrains_url=_get_env_var("SERGIK_MUSICBRAINS_URL", "http://127.0.0.1:8012"),
            use_openai_voice=_get_bool_env_var("SERGIK_USE_OPENAI_VOICE", False),
            openai_api_key=_get_env_var("OPENAI_API_KEY", None),
            default_sample_rate=_get_int_env_var("SERGIK_SAMPLE_RATE", 44100),
            embedding_dim=_get_int_env_var("SERGIK_EMBEDDING_DIM", 256),
            allowed_origins=default_allowed_origins,
        )
    except ValidationError as e:
        raise ConfigurationError(
            f"Configuration validation failed: {e}",
            details={"validation_errors": e.errors()}
        ) from e


# Create and validate config instance (fails fast on errors)
try:
    _config_schema = _load_config_from_env()
    CFG = _config_schema  # Use Pydantic model directly
except ConfigurationError as e:
    # Fail fast - don't allow invalid configuration
    import sys
    print(f"ERROR: Configuration failed: {e.message}", file=sys.stderr)
    if e.details:
        print(f"Details: {e.details}", file=sys.stderr)
    sys.exit(1)
