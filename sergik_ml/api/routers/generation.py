"""
Generation Router

MIDI and drum generation endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
import logging

from ...services.generation_service import GenerationService

from ...schemas import (
    ChordProgressionRequest,
    WalkingBassRequest,
    ArpeggioRequest,
    HumanizeRequest,
    DrumVariationRequest,
    DrumPatternRequest,
    DrumAudioRequest,
)
from ...api.dependencies import get_generation_service
from ...utils.errors import GenerationError, ValidationError as SergikValidationError
from ...connectors.ableton_osc import osc_status
try:
    from ...generators.drum_generator import (
        get_available_genres,
        get_drum_map,
        DrumGenerator,
    )
except ImportError:
    # Fallback if drum_generator not available
    def get_available_genres():
        return ["house", "tech_house", "techno", "hiphop", "trap", "dnb", "reggaeton", "ambient", "lo_fi"]
    
    def get_drum_map():
        return {}
    
    DrumGenerator = None

router = APIRouter(prefix="/generate", tags=["generation"])
logger = logging.getLogger(__name__)


@router.post("/chord_progression")
def api_generate_chord_progression(
    request: ChordProgressionRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    Generate chord progression with harmonic awareness.
    
    Example:
        POST /generate/chord_progression
        {
            "key": "10B",
            "progression_type": "i-VI-III-VII",
            "bars": 8,
            "voicing": "stabs",
            "seventh_chords": true,
            "tempo": 125
        }
    
    Returns:
        List of MIDI notes in Max for Live format
    """
    try:
        notes = generation_service.generate_chords(
            key=request.key,
            progression_type=request.progression_type,
            bars=request.bars,
            voicing=request.voicing,
            seventh_chords=request.seventh_chords,
            tempo=request.tempo
        )
        osc_status(f"Generated {len(notes)} chord notes ({request.progression_type})")
        return {"status": "ok", "notes": notes, "count": len(notes)}
    except SergikValidationError as e:
        logger.error(f"Chord progression validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        logger.error(f"Chord progression generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/walking_bass")
def api_generate_walking_bass(
    request: WalkingBassRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    Generate walking bass line following chord progression.
    
    Example:
        POST /generate/walking_bass
        {
            "key": "10B",
            "chord_progression_type": "i-VI-III-VII",
            "style": "house",
            "bars": 8,
            "tempo": 125
        }
    
    Returns:
        List of MIDI notes for bass
    """
    try:
        notes = generation_service.generate_bass(
            key=request.key,
            chord_progression_type=request.chord_progression_type,
            style=request.style,
            bars=request.bars,
            tempo=request.tempo
        )
        osc_status(f"Generated {len(notes)} bass notes ({request.style} style)")
        return {"status": "ok", "notes": notes, "count": len(notes)}
    except SergikValidationError as e:
        logger.error(f"Walking bass validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        logger.error(f"Walking bass generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/arpeggios")
def api_generate_arpeggios(
    request: ArpeggioRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    Generate arpeggios from chord progression.
    
    Example:
        POST /generate/arpeggios
        {
            "key": "10B",
            "chord_progression_type": "i-VI-III-VII",
            "pattern": "up",
            "speed": 0.25,
            "octaves": 2,
            "bars": 4,
            "tempo": 125
        }
    
    Returns:
        List of MIDI notes for arpeggios
    """
    try:
        notes = generation_service.generate_arpeggios(
            key=request.key,
            chord_progression_type=request.chord_progression_type,
            pattern=request.pattern,
            speed=request.speed,
            octaves=request.octaves,
            bars=request.bars,
            tempo=request.tempo
        )
        osc_status(f"Generated {len(notes)} arpeggio notes ({request.pattern} pattern)")
        return {"status": "ok", "notes": notes, "count": len(notes)}
    except SergikValidationError as e:
        logger.error(f"Arpeggio validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        logger.error(f"Arpeggio generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/drum_variations")
def api_generate_drum_variations(
    request: DrumVariationRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    Generate drum variations from seed pattern.
    
    Example:
        POST /generate/drum_variations
        {
            "seed_pattern": [...],
            "num_variations": 8
        }
    
    Returns:
        List of variations (each is a list of MIDI notes)
    """
    try:
        variations = generation_service.generate_drum_variations(
            seed_pattern=request.seed_pattern,
            num_variations=request.num_variations
        )
        osc_status(f"Generated {len(variations)} drum variations")
        return {"status": "ok", "variations": variations, "count": len(variations)}
    except SergikValidationError as e:
        logger.error(f"Drum variation validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        logger.error(f"Drum variation generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/humanize")
def api_humanize_midi(
    request: HumanizeRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    Add human feel to MIDI notes.
    
    Example:
        POST /transform/humanize
        {
            "notes": [...],
            "timing_variance_ms": 20,
            "velocity_variance": 10,
            "tempo": 125
        }
    
    Returns:
        Humanized MIDI notes
    """
    try:
        humanized_notes = generation_service.humanize_midi(
            notes=request.notes,
            timing_variance_ms=request.timing_variance_ms,
            velocity_variance=request.velocity_variance,
            tempo=request.tempo
        )
        osc_status(f"Humanized {len(humanized_notes)} MIDI notes")
        return {"status": "ok", "notes": humanized_notes, "count": len(humanized_notes)}
    except SergikValidationError as e:
        logger.error(f"MIDI humanization validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        logger.error(f"MIDI humanization failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/drums")
def api_generate_drum_pattern(
    request: DrumPatternRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    Generate a drum pattern.
    
    Supports multiple genres with configurable swing, humanization, and density.
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
        return {"status": "ok", **result}
    except SergikValidationError as e:
        logger.error(f"Drum pattern validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except GenerationError as e:
        logger.error(f"Drum pattern generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drums/genres")
def api_get_drum_genres():
    """Get list of available drum genres."""
    genres = get_available_genres()
    return {
        "status": "ok",
        "genres": genres,
        "count": len(genres)
    }


@router.get("/drums/map")
def api_get_drum_map():
    """Get GM drum mapping (instrument -> MIDI note)."""
    return {
        "status": "ok",
        "drum_map": get_drum_map(),
        "description": "General MIDI drum mapping"
    }

