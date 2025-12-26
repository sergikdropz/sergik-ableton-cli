"""
GPT Router

Natural language generation and analysis endpoints.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
import logging
import time

from ...schemas import (
    GPTGenerateRequest,
    GPTAnalyzeRequest,
    GPTTransformRequest,
    GPTSuggestion,
)
from ...api.dependencies import get_generation_service, get_track_service
from ...services.generation_service import GenerationService
from ...services.track_service import TrackService
from ...utils.errors import GenerationError, ValidationError as SergikValidationError
from ...utils.text_extraction import (
    extract_style,
    extract_key,
    extract_bars,
    extract_percentage,
)
from ...connectors.ableton_osc import osc_status

router = APIRouter(prefix="/gpt", tags=["gpt"])
logger = logging.getLogger(__name__)


@router.get("/health")
def gpt_health():
    """
    GPT Action: System health check.
    
    Returns connection status and current state.
    """
    return {
        "status": "ok",
        "service": "sergik-ml-gpt",
        "version": "1.0.0",
        "timestamp": time.time()
    }


@router.post("/generate")
def gpt_generate(
    request: GPTGenerateRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    GPT Action: Natural language MIDI/audio generation.
    
    Examples:
      - "generate a tech house drum pattern"
      - "create a walking bass in D minor"
      - "make chord progression in 10B"
    
    Returns:
        Generated content with description
    """
    try:
        prompt = request.prompt.lower()
        result = {}
        
        # Chord progression
        if "chord" in prompt or "progression" in prompt:
            key = extract_key(request.prompt) or "10B"
            bars = extract_bars(request.prompt) or 8
            notes = generation_service.generate_chords(
                key=key,
                progression_type="i-VI-III-VII" if "minor" in prompt else "I-V-vi-IV",
                bars=bars,
                voicing="stabs" if "stab" in prompt else "pads",
                tempo=125
            )
            result = {
                "type": "chord_progression",
                "notes": notes,
                "description": f"Generated {len(notes)} chord notes in {key}"
            }
        
        # Bass line
        elif "bass" in prompt:
            key = extract_key(request.prompt) or "10B"
            style = "jazz" if "jazz" in prompt else "house" if "house" in prompt else "techno"
            bars = extract_bars(request.prompt) or 8
            notes = generation_service.generate_bass(
                key=key,
                chord_progression_type="i-VI-III-VII",
                style=style,
                bars=bars,
                tempo=125
            )
            result = {
                "type": "bass",
                "notes": notes,
                "description": f"Generated {style} bass line in {key} ({len(notes)} notes)"
            }
        
        # Arpeggios
        elif "arp" in prompt:
            key = extract_key(request.prompt) or "10B"
            pattern = "up" if "up" in prompt else "down" if "down" in prompt else "random"
            bars = extract_bars(request.prompt) or 4
            notes = generation_service.generate_arpeggios(
                key=key,
                chord_progression_type="i-VI-III-VII",
                pattern=pattern,
                speed=0.25,
                octaves=2,
                bars=bars,
                tempo=125
            )
            result = {
                "type": "arpeggios",
                "notes": notes,
                "description": f"Generated {pattern} arpeggios in {key}"
            }
        
        else:
            raise ValueError("Could not understand generation request. Try: 'generate chords in 10B' or 'create bass line'")
        
        osc_status(f"GPT: {result['description']}")
        return {"status": "ok", "prompt": request.prompt, "result": result}
    
    except (ValueError, SergikValidationError) as e:
        logger.error(f"GPT generation validation failed: {e}", exc_info=True)
        return {"status": "error", "prompt": request.prompt, "error": str(e)}
    except GenerationError as e:
        logger.error(f"GPT generation failed: {e}", exc_info=True)
        return {"status": "error", "prompt": request.prompt, "error": str(e)}


@router.post("/analyze")
def gpt_analyze(
    request: GPTAnalyzeRequest,
    track_service: TrackService = Depends(get_track_service)
):
    """
    GPT Action: Analyze track with SERGIK DNA.
    
    Returns comprehensive analysis with suggestions.
    """
    try:
        track_id = request.track_id
        if not track_id:
            raise ValueError("No track_id provided")
        
        # Get track from database
        track = track_service.get_track(track_id)
        if not track:
            raise HTTPException(status_code=404, detail=f"Track not found: {track_id}")
        
        # SERGIK DNA catalog stats
        catalog_stats = {
            "bpm_zones": {"80-99": 0.41, "100-119": 0.21, "120-129": 0.32, "130-139": 0.04, "140+": 0.02},
            "key_preferences": {"10B": 0.31, "11B": 0.21, "7A": 0.13, "8A": 0.12},
            "energy_sweet_spot": (5.0, 7.0)
        }
        
        # Generate suggestions
        suggestions = []
        
        # BPM suggestion
        bpm = track.get("bpm", 125)
        if bpm < 120 or bpm > 129:
            suggestions.append({
                "type": "tempo",
                "description": f"Consider adjusting tempo to 122-127 BPM (SERGIK sweet spot)",
                "rationale": f"Current BPM: {bpm}. Catalog shows 32% of tracks in 120-129 range.",
                "action": {"cmd": "live.set_tempo", "args": {"tempo": 125}}
            })
        
        # Energy suggestion
        energy = track.get("energy", 0.5) * 10  # Convert to 0-10 scale
        if energy < 5.0:
            suggestions.append({
                "type": "energy",
                "description": "Track energy is below typical SERGIK range",
                "rationale": f"Current energy: {energy:.1f}/10. Sweet spot is 5-7.",
                "action": None
            })
        
        # Key suggestion
        key = track.get("key", "Unknown")
        if key not in ["10B", "11B", "7A", "8A"]:
            suggestions.append({
                "type": "harmony",
                "description": f"Key {key} is outside primary preferences",
                "rationale": "Catalog shows 31% in 10B, 21% in 11B, 13% in 7A, 12% in 8A",
                "action": None
            })
        
        analysis = {
            "track_id": track_id,
            "bpm": bpm,
            "key": key,
            "energy": energy,
            "sergik_dna_match": len([s for s in suggestions if s["action"] is None]) == 0,
            "suggestions": suggestions,
            "catalog_comparison": {
                "bpm_zone": "optimal" if 120 <= bpm <= 129 else "outside_sweet_spot",
                "key_match": "primary" if key in ["10B", "11B"] else "secondary" if key in ["7A", "8A"] else "uncommon",
                "energy_level": "sweet_spot" if 5 <= energy <= 7 else "low" if energy < 5 else "high"
            }
        }
        
        osc_status(f"GPT: Analyzed {track_id}")
        return {"status": "ok", "analysis": analysis}
    
    except HTTPException:
        raise
    except (ValueError, SergikValidationError) as e:
        logger.error(f"GPT analysis validation failed: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}
    except Exception as e:
        logger.error(f"GPT analysis failed: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}


@router.post("/transform")
def gpt_transform(request: GPTTransformRequest):
    """
    GPT Action: Transform MIDI with natural language.
    
    Examples:
      - "humanize drums by 30%"
      - "quantize to 1/16"
    
    Returns:
        Transformation result
    """
    try:
        prompt = request.prompt.lower()
        
        # For now, return instruction since we need MIDI notes
        if "humanize" in prompt:
            amount = extract_percentage(request.prompt) or 20
            return {
                "status": "ok",
                "prompt": request.prompt,
                "action": "humanize",
                "parameters": {
                    "timing_variance_ms": amount,
                    "velocity_variance": amount // 2
                },
                "description": f"Humanize MIDI with {amount}% variance"
            }
        
        return {"status": "error", "error": "Transformation type not recognized"}
    
    except (ValueError, SergikValidationError) as e:
        logger.error(f"GPT transform validation failed: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}
    except Exception as e:
        logger.error(f"GPT transform failed: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}


@router.get("/catalog/search")
def gpt_catalog_search(
    query: str = Query(..., description="Natural language search query"),
    limit: int = Query(10, ge=1, le=100),
    track_service: TrackService = Depends(get_track_service)
):
    """
    GPT Action: Search SERGIK catalog with natural language.
    
    Examples:
      - "find tech house tracks at 126 BPM"
      - "show tracks with high energy"
    """
    try:
        # Extract filters from query
        style = extract_style(query)
        tracks = track_service.list_tracks(limit=limit, rated_only=False)
        
        # Simple filtering (can be enhanced)
        results = [t for t in tracks if style.replace("-", " ") in str(t.get("style", "")).lower()][:limit]
        
        return {
            "status": "ok",
            "query": query,
            "results": results,
            "count": len(results),
            "description": f"Found {len(results)} tracks matching '{query}'"
        }
    
    except (ValueError, SergikValidationError) as e:
        logger.error(f"Catalog search validation failed: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}
    except Exception as e:
        logger.error(f"Catalog search failed: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}


@router.post("/drums")
def gpt_drums(
    request: GPTGenerateRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """
    GPT Action: Natural language drum generation.
    
    Examples:
      - "generate tech house drums"
      - "make trap beat at 140 BPM"
    """
    try:
        prompt = request.prompt.lower()
        style = extract_style(request.prompt)
        bars = extract_bars(request.prompt) or 4
        
        # Use generation service
        result_data = generation_service.generate_drums(
            genre=style,
            bars=bars,
            tempo=125,
            swing=0,
            humanize=0,
            density=1.0,
            output_format="midi"
        )
        
        result = {
            "type": "drum_pattern",
            "pattern": result_data.get("pattern", {}),
            "description": f"Generated {bars}-bar {style} drum pattern"
        }
        
        osc_status(f"GPT: {result['description']}")
        return {"status": "ok", "prompt": request.prompt, "result": result}
    
    except (ValueError, SergikValidationError) as e:
        logger.error(f"GPT drum generation validation failed: {e}", exc_info=True)
        return {"status": "error", "prompt": request.prompt, "error": str(e)}
    except GenerationError as e:
        logger.error(f"GPT drum generation failed: {e}", exc_info=True)
        return {"status": "error", "prompt": request.prompt, "error": str(e)}

