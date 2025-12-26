"""
SERGIK ML API - Legacy Location

⚠️ DEPRECATED: This file is kept for backward compatibility.
New code should import from sergik_ml.api.main instead.

Migration:
    OLD: from sergik_ml.serving.api import app
    NEW: from sergik_ml.api.main import app
"""

import warnings

# Issue deprecation warning
warnings.warn(
    "sergik_ml.serving.api is deprecated. Use sergik_ml.api.main instead.",
    DeprecationWarning,
    stacklevel=2
)

# Re-export from new location
from ..api.main import app

__all__ = ["app"]
