"""
API Routers

Domain-specific routers for the SERGIK ML API.
"""

from .generation import router as generation_router
from .ableton import router as ableton_router
from .analysis import router as analysis_router
from .gpt import router as gpt_router
from .tracks import router as tracks_router
from .voice import router as voice_router
from .compat import router as compat_router

__all__ = [
    "generation_router",
    "ableton_router",
    "analysis_router",
    "gpt_router",
    "tracks_router",
    "voice_router",
    "compat_router",
]

