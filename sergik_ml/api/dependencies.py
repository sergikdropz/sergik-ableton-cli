"""
API Dependencies

Dependency injection for API routes using container.
"""

from ..core.container import get_container
from ..services.generation_service import GenerationService
from ..services.ableton_service import AbletonService
from ..services.analysis_service import AnalysisService
from ..services.track_service import TrackService
from ..services.voice_service import VoiceService
from ..services.state_service import StateService


def get_generation_service() -> GenerationService:
    """Get generation service instance from container."""
    return get_container().get("generation_service")


def get_ableton_service() -> AbletonService:
    """Get Ableton service instance from container."""
    return get_container().get("ableton_service")


def get_analysis_service() -> AnalysisService:
    """Get analysis service instance from container."""
    return get_container().get("analysis_service")


def get_track_service() -> TrackService:
    """Get track service instance from container."""
    return get_container().get("track_service")


def get_voice_service() -> VoiceService:
    """Get voice service instance from container."""
    return get_container().get("voice_service")


def get_state_service() -> StateService:
    """Get state service instance from container."""
    return get_container().get("state_service")

