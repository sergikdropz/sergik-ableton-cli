"""
Compatibility Router

Provides compatibility endpoints for Max for Live frontend.
Maps frontend endpoints to backend endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging

from ...services.generation_service import GenerationService
from ...schemas import DrumPatternRequest
from ...api.dependencies import get_generation_service
from ...utils.errors import GenerationError, ValidationError as SergikValidationError
from ...connectors.ableton_osc import osc_status

try:
    from ...generators.drum_generator import get_available_genres
except ImportError:
    def get_available_genres():
        return ["house", "tech_house", "techno", "hiphop", "trap", "dnb", "reggaeton", "ambient", "lo_fi"]

router = APIRouter(tags=["compatibility"])
logger = logging.getLogger(__name__)


@router.post("/drums/generate")
def drums_generate_compat(
    request: DrumPatternRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    Compatibility endpoint: /drums/generate -> /generate/drums
    
    Frontend calls this endpoint, which routes to the generation service.
    """
    try:
        result = generation_service.generate_drums(
            genre=request.genre,
            bars=request.bars,
            tempo=request.tempo,
            swing=request.swing,
            humanize=request.humanize,
            density=request.density,
            output_format=request.output_format
        )
        osc_status(f"Generated drum pattern ({request.genre})")
        return {"status": "ok", **result}
    except SergikValidationError as e:
        logger.error(f"Drum pattern validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        logger.error(f"Drum pattern generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drums/genres")
def drums_genres_compat():
    """
    Compatibility endpoint: /drums/genres -> /generate/drums/genres
    
    Frontend calls this endpoint to get available drum genres.
    """
    genres = get_available_genres()
    return {
        "status": "ok",
        "genres": genres,
        "count": len(genres)
    }

