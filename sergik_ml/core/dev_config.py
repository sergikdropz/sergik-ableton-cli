"""
Developer Configuration System
Centralized configuration for efficient development and clean builds
"""

import os
import logging
import time
from typing import Dict, Any, Optional, List
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
import json

logger = logging.getLogger(__name__)


class Environment(Enum):
    """Development environment types."""
    DEV = "dev"
    STAGING = "staging"
    PROD = "prod"
    TEST = "test"


class LogLevel(Enum):
    """Logging levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class BuildMetrics:
    """Build performance metrics."""
    build_start_time: float = field(default_factory=time.time)
    build_end_time: Optional[float] = None
    build_duration: Optional[float] = None
    files_processed: int = 0
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    cache_hits: int = 0
    cache_misses: int = 0
    memory_peak_mb: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary."""
        return {
            "build_duration_seconds": self.build_duration,
            "files_processed": self.files_processed,
            "error_count": len(self.errors),
            "warning_count": len(self.warnings),
            "cache_hit_rate": (
                self.cache_hits / (self.cache_hits + self.cache_misses)
                if (self.cache_hits + self.cache_misses) > 0 else 0.0
            ),
            "memory_peak_mb": self.memory_peak_mb,
        }
    
    def finish(self):
        """Mark build as finished and calculate duration."""
        self.build_end_time = time.time()
        self.build_duration = self.build_end_time - self.build_start_time


@dataclass
class DevConfig:
    """Developer configuration settings."""
    # Environment
    environment: Environment = Environment.DEV
    
    # Logging
    log_level: LogLevel = LogLevel.INFO
    log_to_file: bool = False
    log_file_path: Optional[Path] = None
    log_json: bool = True
    log_build_metrics: bool = True
    log_performance: bool = True
    log_api_calls: bool = True
    log_errors: bool = True
    
    # Performance
    enable_profiling: bool = False
    enable_memory_tracking: bool = False
    max_log_size_mb: float = 10.0
    log_rotation_count: int = 5
    
    # Build optimization
    enable_build_cache: bool = True
    build_cache_dir: Optional[Path] = None
    minify_production: bool = True
    source_maps: bool = True
    tree_shaking: bool = True
    
    # Resource limits
    max_logs: int = 1000
    max_network_requests: int = 500
    max_console_history: int = 200
    
    # Feature flags
    enable_hot_reload: bool = True
    enable_type_checking: bool = True
    enable_linting: bool = True
    enable_test_coverage: bool = False
    
    # Build metrics
    build_metrics: BuildMetrics = field(default_factory=BuildMetrics)
    
    def __post_init__(self):
        """Initialize paths and validate configuration."""
        if self.log_file_path is None:
            self.log_file_path = Path("logs") / f"sergik_{self.environment.value}.log"
        
        if self.build_cache_dir is None:
            self.build_cache_dir = Path(".build_cache")
        
        # Ensure directories exist
        self.log_file_path.parent.mkdir(parents=True, exist_ok=True)
        self.build_cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Environment-specific optimizations
        if self.environment == Environment.PROD:
            self.log_level = LogLevel.WARNING
            self.log_build_metrics = False
            self.enable_profiling = False
            self.enable_memory_tracking = False
            self.source_maps = False
            self.max_logs = 500
        elif self.environment == Environment.DEV:
            self.log_level = LogLevel.DEBUG
            self.log_build_metrics = True
            self.enable_profiling = True
            self.enable_memory_tracking = True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary."""
        return {
            "environment": self.environment.value,
            "log_level": self.log_level.value,
            "log_to_file": self.log_to_file,
            "log_file_path": str(self.log_file_path),
            "log_json": self.log_json,
            "log_build_metrics": self.log_build_metrics,
            "log_performance": self.log_performance,
            "log_api_calls": self.log_api_calls,
            "log_errors": self.log_errors,
            "enable_profiling": self.enable_profiling,
            "enable_memory_tracking": self.enable_memory_tracking,
            "max_log_size_mb": self.max_log_size_mb,
            "log_rotation_count": self.log_rotation_count,
            "enable_build_cache": self.enable_build_cache,
            "build_cache_dir": str(self.build_cache_dir),
            "minify_production": self.minify_production,
            "source_maps": self.source_maps,
            "tree_shaking": self.tree_shaking,
            "max_logs": self.max_logs,
            "max_network_requests": self.max_network_requests,
            "max_console_history": self.max_console_history,
            "enable_hot_reload": self.enable_hot_reload,
            "enable_type_checking": self.enable_type_checking,
            "enable_linting": self.enable_linting,
            "enable_test_coverage": self.enable_test_coverage,
        }
    
    def save_to_file(self, path: Path):
        """Save configuration to file."""
        with open(path, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load_from_file(cls, path: Path) -> 'DevConfig':
        """Load configuration from file."""
        with open(path, 'r') as f:
            data = json.load(f)
        
        config = cls(
            environment=Environment(data.get("environment", "dev")),
            log_level=LogLevel(data.get("log_level", "INFO")),
            log_to_file=data.get("log_to_file", False),
            log_file_path=Path(data.get("log_file_path", "logs/sergik_dev.log")),
            log_json=data.get("log_json", True),
            log_build_metrics=data.get("log_build_metrics", True),
            log_performance=data.get("log_performance", True),
            log_api_calls=data.get("log_api_calls", True),
            log_errors=data.get("log_errors", True),
            enable_profiling=data.get("enable_profiling", False),
            enable_memory_tracking=data.get("enable_memory_tracking", False),
            max_log_size_mb=data.get("max_log_size_mb", 10.0),
            log_rotation_count=data.get("log_rotation_count", 5),
            enable_build_cache=data.get("enable_build_cache", True),
            build_cache_dir=Path(data.get("build_cache_dir", ".build_cache")),
            minify_production=data.get("minify_production", True),
            source_maps=data.get("source_maps", True),
            tree_shaking=data.get("tree_shaking", True),
            max_logs=data.get("max_logs", 1000),
            max_network_requests=data.get("max_network_requests", 500),
            max_console_history=data.get("max_console_history", 200),
            enable_hot_reload=data.get("enable_hot_reload", True),
            enable_type_checking=data.get("enable_type_checking", True),
            enable_linting=data.get("enable_linting", True),
            enable_test_coverage=data.get("enable_test_coverage", False),
        )
        
        return config
    
    @classmethod
    def from_env(cls) -> 'DevConfig':
        """Load configuration from environment variables."""
        env_str = os.getenv("SERGIK_ENV", "dev").lower()
        env_map = {
            "dev": Environment.DEV,
            "development": Environment.DEV,
            "staging": Environment.STAGING,
            "prod": Environment.PROD,
            "production": Environment.PROD,
            "test": Environment.TEST,
            "testing": Environment.TEST,
        }
        environment = env_map.get(env_str, Environment.DEV)
        
        log_level_str = os.getenv("SERGIK_LOG_LEVEL", "INFO").upper()
        log_level = LogLevel(log_level_str) if log_level_str in [e.value for e in LogLevel] else LogLevel.INFO
        
        return cls(
            environment=environment,
            log_level=log_level,
            log_to_file=os.getenv("SERGIK_LOG_TO_FILE", "false").lower() == "true",
            log_json=os.getenv("SERGIK_LOG_JSON", "true").lower() == "true",
            log_build_metrics=os.getenv("SERGIK_LOG_BUILD_METRICS", "true").lower() == "true",
            log_performance=os.getenv("SERGIK_LOG_PERFORMANCE", "true").lower() == "true",
            log_api_calls=os.getenv("SERGIK_LOG_API_CALLS", "true").lower() == "true",
            log_errors=os.getenv("SERGIK_LOG_ERRORS", "true").lower() == "true",
            enable_profiling=os.getenv("SERGIK_ENABLE_PROFILING", "false").lower() == "true",
            enable_memory_tracking=os.getenv("SERGIK_ENABLE_MEMORY_TRACKING", "false").lower() == "true",
            max_log_size_mb=float(os.getenv("SERGIK_MAX_LOG_SIZE_MB", "10.0")),
            log_rotation_count=int(os.getenv("SERGIK_LOG_ROTATION_COUNT", "5")),
            enable_build_cache=os.getenv("SERGIK_ENABLE_BUILD_CACHE", "true").lower() == "true",
            minify_production=os.getenv("SERGIK_MINIFY_PRODUCTION", "true").lower() == "true",
            source_maps=os.getenv("SERGIK_SOURCE_MAPS", "true").lower() == "true",
            tree_shaking=os.getenv("SERGIK_TREE_SHAKING", "true").lower() == "true",
            max_logs=int(os.getenv("SERGIK_MAX_LOGS", "1000")),
            max_network_requests=int(os.getenv("SERGIK_MAX_NETWORK_REQUESTS", "500")),
            max_console_history=int(os.getenv("SERGIK_MAX_CONSOLE_HISTORY", "200")),
            enable_hot_reload=os.getenv("SERGIK_ENABLE_HOT_RELOAD", "true").lower() == "true",
            enable_type_checking=os.getenv("SERGIK_ENABLE_TYPE_CHECKING", "true").lower() == "true",
            enable_linting=os.getenv("SERGIK_ENABLE_LINTING", "true").lower() == "true",
            enable_test_coverage=os.getenv("SERGIK_ENABLE_TEST_COVERAGE", "false").lower() == "true",
        )


# Global dev config instance
_dev_config: Optional[DevConfig] = None


def get_dev_config() -> DevConfig:
    """Get or create global developer configuration."""
    global _dev_config
    if _dev_config is None:
        _dev_config = DevConfig.from_env()
    return _dev_config


def set_dev_config(config: DevConfig):
    """Set global developer configuration."""
    global _dev_config
    _dev_config = config


def log_build_metric(metric_name: str, value: Any, unit: str = ""):
    """Log a build metric."""
    config = get_dev_config()
    if config.log_build_metrics:
        logger.info(
            f"BUILD_METRIC: {metric_name}={value}{unit}",
            extra={
                "metric_name": metric_name,
                "metric_value": value,
                "metric_unit": unit,
                "build_phase": "build"
            }
        )


def log_performance(operation: str, duration: float, details: Optional[Dict[str, Any]] = None):
    """Log performance metric."""
    config = get_dev_config()
    if config.log_performance:
        extra = {
            "operation": operation,
            "duration_seconds": duration,
            "performance": True
        }
        if details:
            extra.update(details)
        
        level = logging.WARNING if duration > 1.0 else logging.INFO
        logger.log(
            level,
            f"PERFORMANCE: {operation} took {duration:.3f}s",
            extra=extra
        )


def track_build_start():
    """Start tracking build metrics."""
    config = get_dev_config()
    config.build_metrics = BuildMetrics()
    log_build_metric("build_started", time.time())


def track_build_end():
    """End tracking build metrics and log summary."""
    config = get_dev_config()
    config.build_metrics.finish()
    
    metrics = config.build_metrics.to_dict()
    logger.info(
        "BUILD_COMPLETE",
        extra={
            "build_metrics": metrics,
            "build_phase": "complete"
        }
    )
    
    # Log summary
    logger.info(f"Build completed in {metrics['build_duration_seconds']:.2f}s")
    logger.info(f"Files processed: {metrics['files_processed']}")
    logger.info(f"Errors: {metrics['error_count']}, Warnings: {metrics['warning_count']}")
    if metrics['cache_hit_rate'] > 0:
        logger.info(f"Cache hit rate: {metrics['cache_hit_rate']:.1%}")
    if metrics['memory_peak_mb'] > 0:
        logger.info(f"Peak memory: {metrics['memory_peak_mb']:.1f} MB")

