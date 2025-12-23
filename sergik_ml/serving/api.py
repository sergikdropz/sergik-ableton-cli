"""
SERGIK ML API - FastAPI Application

Main endpoints:
  POST /action         - Execute action command
  POST /voice          - Process voice recording
  GET  /health         - Health check
  GET  /tracks         - List tracks
  GET  /tracks/{id}    - Get track details
  GET  /similar/{id}   - Get similar tracks
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List
from pathlib import Path
import uuid
import time
import logging
import re

from ..schemas import (
    ActionIn, ActionOut, VoiceOut, VoiceIntent,
    ChordProgressionRequest, WalkingBassRequest, ArpeggioRequest,
    HumanizeRequest, DrumVariationRequest,
    GPTGenerateRequest, GPTAnalyzeRequest, GPTTransformRequest,
    GPTWorkflowRequest, GPTSuggestion
)
from ..stores.sql_store import init_db, log_action, get_track, list_tracks
from ..stores.vector_store import similar as vector_similar
from ..policies.action_policy import validate_action
from ..connectors.ableton_osc import osc_status, osc_send, osc_similar_results, osc_error
from ..pipelines.pack_pipeline import create_pack, rate_track
from ..pipelines.voice_pipeline import voice_to_action, tts_and_notify_live
from ..generators.midi_advanced import (
    generate_chord_progression,
    generate_walking_bass,
    generate_arpeggios,
    generate_drum_variations,
    humanize_midi
)
from ..config import CFG
from .dashboard import router as dashboard_router
from .rate_limiter import RateLimitMiddleware

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SERGIK ML Service",
    description="ML-native music production API for Ableton Live integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Include dashboard router
app.include_router(dashboard_router)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    init_db()
    logger.info("SERGIK ML Service started")


# OSC address mapping for Live actions
LIVE_OSC_MAP = {
    "live.set_tempo": "/scp/set_tempo",
    "live.play": "/scp/play",
    "live.stop": "/scp/stop",
    "live.add_device": "/scp/add_device",
    "live.add_effect": "/scp/add_effect",
    "live.set_param": "/scp/set_param",
    "live.list_tracks": "/scp/list_tracks",
    "live.export_audio": "/scp/export_audio",
    "live.fire_clip": "/scp/fire_clip",
}


def dispatch(cmd: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dispatch command to appropriate handler.
    """
    # Live actions -> OSC to Ableton
    if cmd in LIVE_OSC_MAP:
        osc_send(LIVE_OSC_MAP[cmd], args)
        return {"routed": "ableton_osc", "address": LIVE_OSC_MAP[cmd], "args": args}

    # Pack creation
    if cmd == "pack.create":
        result = create_pack(args)
        osc_status(f"Pack created: {result['track_count']} files", **result)
        return result

    # Track rating
    if cmd == "pack.rate":
        result = rate_track(args)
        osc_status(f"Rated {result['track_id']}: {result['rating']} stars")
        return result

    # Similarity search
    if cmd == "pack.similar":
        track_id = args.get("track_id")
        k = int(args.get("k", 10))
        style_filter = args.get("style_filter")

        if not track_id:
            raise ValueError("pack.similar requires track_id")

        results = vector_similar(track_id, k=k, style_filter=style_filter)
        osc_status(f"Found {len(results)} similar tracks")
        osc_similar_results(track_id, results)
        return {"track_id": track_id, "similar": results, "count": len(results)}

    # MusicBrains generation (proxy)
    if cmd == "musicbrains.generate":
        import requests
        try:
            r = requests.post(f"{CFG.musicbrains_url}/generate", json=args, timeout=60)
            r.raise_for_status()
            osc_status("MusicBrains generated audio")
            return {"musicbrains": r.json()}
        except Exception as e:
            raise ValueError(f"MusicBrains generation failed: {e}")

    # Loop generation (proxy)
    if cmd == "gen.generate_loop":
        import requests
        try:
            r = requests.post(f"{CFG.sergik_gen_url}/generate_loop", json=args, timeout=120)
            r.raise_for_status()
            osc_status("Generator produced a loop")
            return {"gen": r.json()}
        except Exception as e:
            raise ValueError(f"Generation failed: {e}")

    # TTS
    if cmd == "voice.tts":
        text = str(args.get("text", ""))
        path = tts_and_notify_live(text)
        return {"tts_path": path}

    raise ValueError(f"Unknown command: {cmd}")


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "sergik-ml", "version": "1.0.0"}


@app.post("/action", response_model=ActionOut)
def action(inp: ActionIn):
    """
    Execute an action command.

    Commands include:
      - pack.create: Create sample pack
      - pack.rate: Rate a track
      - pack.similar: Find similar tracks
      - live.*: Ableton Live control
      - gen.generate_loop: Generate audio
    """
    start_time = time.time()

    try:
        validate_action(inp.cmd, inp.args)
        result = dispatch(inp.cmd, inp.args)
        duration_ms = int((time.time() - start_time) * 1000)

        log_action(inp.cmd, inp.args, inp.meta, "ok", result, None, duration_ms)
        return ActionOut(status="ok", cmd=inp.cmd, result=result)

    except Exception as e:
        err = str(e)
        duration_ms = int((time.time() - start_time) * 1000)

        osc_error(err, inp.cmd)
        log_action(inp.cmd or "unknown", inp.args or {}, inp.meta or {}, "error", {}, err, duration_ms)

        logger.error(f"Action failed: {inp.cmd} - {err}")
        return ActionOut(status="error", cmd=inp.cmd, error=err, result={})


@app.post("/voice", response_model=VoiceOut)
async def voice(file: UploadFile = File(...)):
    """
    Process voice recording (push-to-talk).

    Upload WAV file -> STT -> Intent parsing -> Action execution -> TTS response
    """
    try:
        # Save uploaded file
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        wav_path = upload_dir / f"voice_{uuid.uuid4().hex}.wav"

        content = await file.read()
        wav_path.write_bytes(content)

        # Process voice
        intent = voice_to_action(str(wav_path))
        action_out: Optional[ActionOut] = None

        # Execute command if found
        if intent.get("cmd"):
            try:
                validate_action(intent["cmd"], intent.get("args", {}))
                result = dispatch(intent["cmd"], intent.get("args", {}))
                action_out = ActionOut(status="ok", cmd=intent["cmd"], result=result)
            except Exception as e:
                action_out = ActionOut(status="error", cmd=intent["cmd"], error=str(e))

        # Generate TTS response
        tts_path = tts_and_notify_live(intent.get("tts", "Done."))

        return VoiceOut(
            status="ok",
            text=intent.get("text"),
            intent=VoiceIntent(
                text=intent.get("text", ""),
                cmd=intent.get("cmd"),
                args=intent.get("args", {}),
                tts=intent.get("tts", "Done."),
                confidence=intent.get("confidence", 0.0)
            ),
            action=action_out,
            tts_path=tts_path
        )

    except Exception as e:
        err = str(e)
        osc_error(err, "voice")
        logger.error(f"Voice processing failed: {err}")
        return VoiceOut(status="error", error=err)


@app.get("/tracks")
def get_tracks(
    limit: int = Query(100, ge=1, le=5000),
    rated_only: bool = Query(False)
):
    """List tracks in database."""
    tracks = list_tracks(limit=limit, rated_only=rated_only)
    return {"tracks": tracks, "count": len(tracks)}


@app.get("/tracks/{track_id}")
def get_track_detail(track_id: str):
    """Get track details by ID."""
    track = get_track(track_id)
    if not track:
        raise HTTPException(status_code=404, detail=f"Track not found: {track_id}")
    return track


@app.get("/similar/{track_id}")
def get_similar(
    track_id: str,
    k: int = Query(10, ge=1, le=100),
    style: Optional[str] = Query(None)
):
    """Find similar tracks."""
    results = vector_similar(track_id, k=k, style_filter=style)
    if not results:
        raise HTTPException(status_code=404, detail=f"Track not found or no similar tracks: {track_id}")
    return {"track_id": track_id, "similar": results, "count": len(results)}


# ============================================================================
# Advanced MIDI Generation Endpoints
# ============================================================================

@app.post("/generate/chord_progression")
def api_generate_chord_progression(request: ChordProgressionRequest):
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
        notes = generate_chord_progression(
            key=request.key,
            progression_type=request.progression_type,
            bars=request.bars,
            voicing=request.voicing,
            seventh_chords=request.seventh_chords,
            tempo=request.tempo
        )
        osc_status(f"Generated {len(notes)} chord notes ({request.progression_type})")
        return {"status": "ok", "notes": notes, "count": len(notes)}
    except Exception as e:
        logger.error(f"Chord progression generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/walking_bass")
def api_generate_walking_bass(request: WalkingBassRequest):
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
        notes = generate_walking_bass(
            key=request.key,
            chord_progression_type=request.chord_progression_type,
            style=request.style,
            bars=request.bars,
            tempo=request.tempo
        )
        osc_status(f"Generated {len(notes)} bass notes ({request.style} style)")
        return {"status": "ok", "notes": notes, "count": len(notes)}
    except Exception as e:
        logger.error(f"Walking bass generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/arpeggios")
def api_generate_arpeggios(request: ArpeggioRequest):
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
        notes = generate_arpeggios(
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
    except Exception as e:
        logger.error(f"Arpeggio generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/drum_variations")
def api_generate_drum_variations(request: DrumVariationRequest):
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
        variations = generate_drum_variations(
            seed_pattern=request.seed_pattern,
            num_variations=request.num_variations
        )
        osc_status(f"Generated {len(variations)} drum variations")
        return {"status": "ok", "variations": variations, "count": len(variations)}
    except Exception as e:
        logger.error(f"Drum variation generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transform/humanize")
def api_humanize_midi(request: HumanizeRequest):
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
        humanized_notes = humanize_midi(
            notes=request.notes,
            timing_variance_ms=request.timing_variance_ms,
            velocity_variance=request.velocity_variance,
            tempo=request.tempo
        )
        osc_status(f"Humanized {len(humanized_notes)} MIDI notes")
        return {"status": "ok", "notes": humanized_notes, "count": len(humanized_notes)}
    except Exception as e:
        logger.error(f"MIDI humanization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GPT Actions - Natural Language Control
# ============================================================================

def extract_style(prompt: str) -> str:
    """Extract music style from natural language."""
    styles = ["tech-house", "deep-house", "techno", "trap", "reggaeton", "house", "ambient"]
    for style in styles:
        if style.replace("-", " ") in prompt.lower() or style in prompt.lower():
            return style
    return "house"


def extract_key(prompt: str) -> Optional[str]:
    """Extract musical key from natural language."""
    key_match = re.search(r"([A-G][#b]?\s*(?:min|maj|minor|major)?|[0-9]{1,2}[AB])", prompt, re.IGNORECASE)
    return key_match.group(1) if key_match else None


def extract_bars(prompt: str) -> Optional[int]:
    """Extract bar count from natural language."""
    bars_match = re.search(r"(\d+)\s*bar", prompt, re.IGNORECASE)
    return int(bars_match.group(1)) if bars_match else None


def extract_percentage(prompt: str) -> Optional[int]:
    """Extract percentage from natural language."""
    pct_match = re.search(r"(\d+)%", prompt)
    return int(pct_match.group(1)) if pct_match else None


@app.get("/gpt/health")
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


@app.post("/gpt/generate")
def gpt_generate(request: GPTGenerateRequest):
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
            notes = generate_chord_progression(
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
            notes = generate_walking_bass(
                key=key,
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
            notes = generate_arpeggios(
                key=key,
                pattern=pattern,
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

    except Exception as e:
        logger.error(f"GPT generation failed: {e}")
        return {"status": "error", "prompt": request.prompt, "error": str(e)}


@app.post("/gpt/analyze")
def gpt_analyze(request: GPTAnalyzeRequest):
    """
    GPT Action: Analyze track with SERGIK DNA.

    Returns comprehensive analysis with suggestions.
    """
    try:
        track_id = request.track_id
        if not track_id:
            raise ValueError("No track_id provided")

        # Get track from database
        track = get_track(track_id)
        if not track:
            raise HTTPException(status_code=404, detail=f"Track not found: {track_id}")

        # SERGIK DNA catalog stats (from decision-logic analysis)
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

    except Exception as e:
        logger.error(f"GPT analysis failed: {e}")
        return {"status": "error", "error": str(e)}


@app.post("/gpt/transform")
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

    except Exception as e:
        logger.error(f"GPT transform failed: {e}")
        return {"status": "error", "error": str(e)}


@app.get("/gpt/catalog/search")
def gpt_catalog_search(
    query: str = Query(..., description="Natural language search query"),
    limit: int = Query(10, ge=1, le=100)
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
        tracks = list_tracks(limit=limit, rated_only=False)

        # Simple filtering (can be enhanced)
        results = [t for t in tracks if style.replace("-", " ") in str(t.get("style", "")).lower()][:limit]

        return {
            "status": "ok",
            "query": query,
            "results": results,
            "count": len(results),
            "description": f"Found {len(results)} tracks matching '{query}'"
        }

    except Exception as e:
        logger.error(f"Catalog search failed: {e}")
        return {"status": "error", "error": str(e)}


# ============================================================================
# Drum Generation Endpoints
# ============================================================================

from ..generators.drum_generator import (
    DrumGenerator, SampleScanner, AudioDrumGenerator,
    generate_drum_pattern as drum_pattern_gen,
    scan_sample_library as scan_samples,
    get_available_genres, get_drum_map,
    get_generator, get_scanner
)
from ..schemas import (
    DrumPatternRequest, DrumAudioRequest, 
    SampleLibraryScanRequest, SampleSearchRequest,
    DrumRackPresetRequest
)

# Storage for scanned libraries
_sample_libraries: Dict[str, Any] = {}


@app.get("/drums/genres")
def api_get_drum_genres():
    """
    Get list of available drum genres.
    
    Returns:
        List of supported genre names
    """
    genres = get_available_genres()
    return {
        "status": "ok",
        "genres": genres,
        "count": len(genres),
        "descriptions": {
            "house": "Classic 4-on-the-floor house pattern",
            "tech_house": "Tech house with syncopated hats and percs",
            "techno": "Minimal techno with sparse elements",
            "hiphop": "Classic boom bap hip-hop",
            "boom_bap": "Classic boom bap hip-hop (alias)",
            "trap": "Modern trap with 808s and hi-hat rolls",
            "dnb": "Drum and bass / jungle breakbeat",
            "jungle": "Jungle breakbeat (alias)",
            "reggaeton": "Reggaeton dembow rhythm",
            "dembow": "Dembow rhythm (alias)",
            "ambient": "Sparse ambient/downtempo",
            "downtempo": "Downtempo (alias)",
            "lo_fi": "Lo-fi hip-hop beats"
        }
    }


@app.get("/drums/map")
def api_get_drum_map():
    """
    Get GM drum mapping (instrument -> MIDI note).
    
    Returns:
        Dictionary mapping instrument names to MIDI note numbers
    """
    return {
        "status": "ok",
        "drum_map": get_drum_map(),
        "description": "General MIDI drum mapping"
    }


@app.post("/drums/generate")
def api_generate_drum_pattern(request: DrumPatternRequest):
    """
    Generate a drum pattern.
    
    Supports multiple genres with configurable swing, humanization, and density.
    
    Example:
        POST /drums/generate
        {
            "genre": "tech_house",
            "bars": 8,
            "tempo": 126,
            "swing": 15,
            "humanize": 20,
            "density": 1.2,
            "output_format": "midi"
        }
    
    Returns:
        MIDI notes or pattern data
    """
    try:
        result = drum_pattern_gen(
            genre=request.genre,
            bars=request.bars,
            tempo=request.tempo,
            swing=request.swing,
            humanize=request.humanize,
            density=request.density,
            output_format="midi"
        )
        
        osc_status(f"Generated {request.genre} drum pattern ({request.bars} bars, {result['count']} hits)")
        return result
        
    except Exception as e:
        logger.error(f"Drum pattern generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/drums/generate/audio")
def api_generate_drum_audio(request: DrumAudioRequest):
    """
    Generate drum pattern and export as WAV audio.
    
    Requires a scanned sample library.
    
    Example:
        POST /drums/generate/audio
        {
            "genre": "trap",
            "bars": 4,
            "tempo": 140,
            "sample_library": "User Drums",
            "output_filename": "trap_beat.wav"
        }
    
    Returns:
        Path to generated WAV file
    """
    try:
        # Get sample library
        library_name = request.sample_library or "default"
        if library_name not in _sample_libraries:
            raise HTTPException(
                status_code=400, 
                detail=f"Sample library '{library_name}' not found. Scan a library first with /samples/scan"
            )
        
        library = _sample_libraries[library_name]
        
        # Generate pattern
        generator = get_generator()
        pattern = generator.generate_pattern(
            genre=request.genre,
            bars=request.bars,
            tempo=request.tempo,
            swing=request.swing,
            humanize=request.humanize
        )
        
        # Render audio
        audio_gen = AudioDrumGenerator(library)
        
        # Output path
        output_dir = Path(CFG.artifact_dir) / "generated_drums"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        filename = request.output_filename or f"{request.genre}_{request.bars}bar_{int(request.tempo)}bpm.wav"
        output_path = output_dir / filename
        
        success = audio_gen.render_pattern(pattern, str(output_path))
        
        if success:
            osc_status(f"Generated drum audio: {filename}")
            return {
                "status": "ok",
                "genre": request.genre,
                "bars": request.bars,
                "tempo": request.tempo,
                "output_path": str(output_path),
                "filename": filename,
                "sample_library": library_name
            }
        else:
            raise HTTPException(status_code=500, detail="Audio rendering failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Drum audio generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/samples/scan")
def api_scan_sample_library(request: SampleLibraryScanRequest):
    """
    Scan a directory for audio samples and index them.
    
    Example:
        POST /samples/scan
        {
            "path": "/Users/me/Samples/Drums",
            "library_name": "My Drums",
            "recursive": true
        }
    
    Returns:
        Library summary with category counts
    """
    try:
        result = scan_samples(
            path=request.path,
            library_name=request.library_name,
            recursive=request.recursive
        )
        
        # Store library reference
        scanner = get_scanner()
        lib_name = request.library_name or Path(request.path).name
        if lib_name in scanner.libraries:
            _sample_libraries[lib_name] = scanner.libraries[lib_name]
        
        osc_status(f"Scanned sample library: {result['name']} ({result['total_samples']} samples)")
        return result
        
    except Exception as e:
        logger.error(f"Sample library scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/samples/scan/ableton")
def api_scan_ableton_library():
    """
    Scan default Ableton Live sample library locations.
    
    Automatically searches common Ableton paths:
    - ~/Music/Ableton/User Library/Samples
    - /Applications/Ableton Live 12 Suite.app/.../Core Library/Samples
    
    Returns:
        Library summary if found
    """
    try:
        scanner = get_scanner()
        library = scanner.scan_ableton_library()
        
        if library and library.total_count > 0:
            _sample_libraries["Ableton Library"] = library
            
            return {
                "status": "ok",
                "name": library.name,
                "path": library.path,
                "total_samples": library.total_count,
                "categories": {cat: len(samples) for cat, samples in library.samples.items()}
            }
        else:
            return {
                "status": "warning",
                "message": "Ableton sample library not found or empty",
                "searched_paths": [
                    "~/Music/Ableton/User Library/Samples",
                    "~/Documents/Ableton/User Library/Samples",
                    "/Applications/Ableton Live 12 Suite.app/.../Core Library/Samples"
                ]
            }
            
    except Exception as e:
        logger.error(f"Ableton library scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/samples/drives")
def api_discover_drives():
    """
    Discover all mounted drives on the system.
    
    Returns:
        List of drives with storage info
    """
    try:
        scanner = get_scanner()
        drives = scanner.discover_all_drives()
        
        return {
            "status": "ok",
            "drives": drives,
            "count": len(drives)
        }
        
    except Exception as e:
        logger.error(f"Drive discovery failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/samples/scan/all-drives")
def api_scan_all_drives(
    max_depth: int = Query(4, ge=1, le=8, description="Maximum directory depth to search"),
    scan_found: bool = Query(True, description="Whether to fully scan found directories")
):
    """
    Scan ALL mounted drives for sample libraries.
    
    This is a comprehensive scan that:
    1. Discovers all mounted volumes
    2. Searches for directories with sample-related names
    3. Scans and indexes found sample directories
    
    Note: This can take several minutes depending on drive sizes.
    
    Returns:
        Complete scan results with all discovered libraries
    """
    try:
        scanner = get_scanner()
        
        osc_status("Starting full drive scan for samples...")
        
        results = scanner.scan_all_drives(
            max_depth=max_depth,
            scan_found=scan_found
        )
        
        # Store all scanned libraries
        for lib_info in results.get("libraries_scanned", []):
            lib_name = lib_info["name"]
            if lib_name in scanner.libraries:
                _sample_libraries[lib_name] = scanner.libraries[lib_name]
        
        osc_status(f"Drive scan complete: {results['total_samples']} samples found")
        
        return {
            "status": "ok",
            **results
        }
        
    except Exception as e:
        logger.error(f"Full drive scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/samples/scan/quick")
def api_quick_scan_samples():
    """
    Quick scan of common sample library locations.
    
    Scans well-known locations where samples are typically stored:
    - ~/Music/Samples
    - ~/Music/Ableton/User Library/Samples
    - ~/Splice/Sounds
    - /Volumes/*/Samples
    - Native Instruments directories
    - Logic Pro loops
    - And more...
    
    Much faster than full drive scan.
    
    Returns:
        List of found libraries with sample counts
    """
    try:
        scanner = get_scanner()
        
        osc_status("Quick scanning common sample locations...")
        
        results = scanner.quick_scan_common_locations()
        
        # Store all scanned libraries
        for lib_info in results.get("libraries_found", []):
            lib_name = lib_info["name"]
            if lib_name in scanner.libraries:
                _sample_libraries[lib_name] = scanner.libraries[lib_name]
        
        osc_status(f"Quick scan complete: {results['total_samples']} samples found in {len(results['libraries_found'])} locations")
        
        return {
            "status": "ok",
            **results
        }
        
    except Exception as e:
        logger.error(f"Quick scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/samples/find")
def api_find_sample_directories(
    path: str = Query(..., description="Root path to search from"),
    max_depth: int = Query(4, ge=1, le=8, description="Maximum directory depth")
):
    """
    Find potential sample directories in a given path.
    
    Searches for directories with names containing sample-related keywords
    (samples, drums, kicks, loops, etc.) without fully scanning them.
    
    Returns:
        List of potential sample directories
    """
    try:
        scanner = get_scanner()
        
        directories = scanner.find_sample_directories(path, max_depth)
        
        return {
            "status": "ok",
            "search_path": path,
            "directories": directories,
            "count": len(directories)
        }
        
    except Exception as e:
        logger.error(f"Directory search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/samples/libraries")
def api_list_sample_libraries():
    """
    List all scanned sample libraries.
    
    Returns:
        List of available libraries with stats
    """
    libraries = []
    for name, lib in _sample_libraries.items():
        libraries.append({
            "name": name,
            "path": lib.path,
            "total_samples": lib.total_count,
            "categories": list(lib.samples.keys())
        })
    
    return {
        "status": "ok",
        "libraries": libraries,
        "count": len(libraries)
    }


@app.get("/samples/search")
def api_search_samples(
    category: Optional[str] = Query(None, description="Sample category: kick, snare, hat, clap, perc, etc."),
    library: Optional[str] = Query(None, description="Library name to search"),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search samples in indexed libraries.
    
    Example:
        GET /samples/search?category=kick&library=My%20Drums&limit=10
    
    Returns:
        List of matching samples with metadata
    """
    try:
        results = []
        
        # Search in specified library or all libraries
        search_libs = [_sample_libraries[library]] if library and library in _sample_libraries else _sample_libraries.values()
        
        for lib in search_libs:
            if category:
                samples = lib.get_samples(category)
            else:
                samples = [s for samples_list in lib.samples.values() for s in samples_list]
            
            for sample in samples[:limit]:
                results.append({
                    "name": sample.name,
                    "path": sample.path,
                    "category": sample.category,
                    "duration": sample.duration,
                    "tags": sample.tags,
                    "library": lib.name
                })
                
                if len(results) >= limit:
                    break
            
            if len(results) >= limit:
                break
        
        return {
            "status": "ok",
            "results": results[:limit],
            "count": len(results[:limit]),
            "category": category,
            "library": library
        }
        
    except Exception as e:
        logger.error(f"Sample search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/drums/rack/preset")
def api_create_drum_rack_preset(request: DrumRackPresetRequest):
    """
    Create a drum rack preset file with sample mappings.
    
    Generates an Ableton-compatible ADG preset or JSON mapping.
    
    Example:
        POST /drums/rack/preset
        {
            "name": "My Tech House Kit",
            "samples": {
                "kick": "/path/to/kick.wav",
                "snare": "/path/to/snare.wav",
                "hat": "/path/to/hat.wav"
            }
        }
    
    Returns:
        Path to generated preset file
    """
    try:
        output_dir = Path(CFG.artifact_dir) / "drum_racks"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate JSON preset (can be converted to ADG)
        preset_data = {
            "name": request.name,
            "type": "drum_rack",
            "version": "1.0",
            "pads": []
        }
        
        # Map samples to drum pads
        pad_mapping = {
            "kick": 36, "snare": 38, "clap": 39, "closed_hat": 42,
            "open_hat": 46, "tom_low": 41, "tom_mid": 47, "tom_high": 50,
            "crash": 49, "ride": 51, "perc_1": 67, "perc_2": 68
        }
        
        for pad_name, sample_path in request.samples.items():
            midi_note = pad_mapping.get(pad_name, 36)
            preset_data["pads"].append({
                "name": pad_name,
                "midi_note": midi_note,
                "sample_path": sample_path
            })
        
        # Save preset
        output_path = output_dir / f"{request.name.replace(' ', '_')}.json"
        
        import json
        with open(output_path, 'w') as f:
            json.dump(preset_data, f, indent=2)
        
        osc_status(f"Created drum rack preset: {request.name}")
        
        return {
            "status": "ok",
            "name": request.name,
            "output_path": str(output_path),
            "pads": len(preset_data["pads"]),
            "description": "Import this preset or manually load samples in Ableton"
        }
        
    except Exception as e:
        logger.error(f"Drum rack preset creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# GPT Natural Language Drum Generation
@app.post("/gpt/drums")
def gpt_generate_drums(request: GPTGenerateRequest):
    """
    GPT Action: Natural language drum generation.
    
    Examples:
      - "make a tech house beat at 126 bpm"
      - "create a trap pattern with heavy 808s"
      - "generate 8 bars of minimal techno drums"
    
    Returns:
        Generated drum pattern
    """
    try:
        prompt = request.prompt.lower()
        
        # Extract genre
        genre = "house"  # default
        genre_keywords = {
            "tech house": "tech_house",
            "techno": "techno",
            "minimal": "techno",
            "house": "house",
            "deep house": "house",
            "hip hop": "hiphop",
            "hiphop": "hiphop",
            "boom bap": "boom_bap",
            "trap": "trap",
            "808": "trap",
            "drum and bass": "dnb",
            "dnb": "dnb",
            "jungle": "jungle",
            "breakbeat": "dnb",
            "reggaeton": "reggaeton",
            "dembow": "dembow",
            "ambient": "ambient",
            "downtempo": "downtempo",
            "lo-fi": "lo_fi",
            "lofi": "lo_fi"
        }
        
        for keyword, g in genre_keywords.items():
            if keyword in prompt:
                genre = g
                break
        
        # Extract tempo
        tempo = 125.0
        tempo_match = re.search(r"(\d{2,3})\s*bpm", prompt)
        if tempo_match:
            tempo = float(tempo_match.group(1))
        else:
            # Genre default tempos
            default_tempos = {
                "house": 125, "tech_house": 126, "techno": 130,
                "hiphop": 95, "boom_bap": 90, "trap": 140,
                "dnb": 174, "jungle": 170, "reggaeton": 95,
                "ambient": 80, "downtempo": 90, "lo_fi": 85
            }
            tempo = default_tempos.get(genre, 125)
        
        # Extract bars
        bars = extract_bars(request.prompt) or 4
        
        # Extract swing/humanize
        swing = 0.0
        humanize = 0.0
        if "swing" in prompt or "swung" in prompt:
            swing = extract_percentage(request.prompt) or 25.0
        if "human" in prompt or "organic" in prompt or "natural" in prompt:
            humanize = extract_percentage(request.prompt) or 20.0
        
        # Generate
        result = drum_pattern_gen(
            genre=genre,
            bars=bars,
            tempo=tempo,
            swing=swing,
            humanize=humanize
        )
        
        result["prompt"] = request.prompt
        result["description"] = f"Generated {genre} drum pattern at {tempo} BPM ({bars} bars, {result['count']} hits)"
        
        osc_status(f"GPT Drums: {result['description']}")
        return result
        
    except Exception as e:
        logger.error(f"GPT drum generation failed: {e}")
        return {"status": "error", "prompt": request.prompt, "error": str(e)}


# ============================================================================
# Ableton Live Integration - Track Management
# ============================================================================

from ..schemas import (
    CreateTrackRequest, UpdateTrackRequest, DeleteTrackRequest,
    TrackListResponse, TrackInfo,
    LoadDeviceRequest, LoadVSTRequest, SetDeviceParamRequest,
    ToggleDeviceRequest, LoadPresetRequest, DeviceListResponse, DeviceParamsResponse,
    CreateClipRequest, FireClipRequest, StopClipRequest, DuplicateClipRequest,
    DeleteClipRequest, SetClipNotesRequest, GetClipNotesRequest, UpdateClipRequest,
    ClipNotesResponse, ClipInfo,
    BrowserSearchRequest, LoadBrowserItemRequest, HotSwapRequest, BrowserSearchResponse,
    FireSceneRequest, CreateSceneRequest, DeleteSceneRequest, DuplicateSceneRequest,
    SetTempoRequest, SetQuantizationRequest, UndoRedoRequest, TransportRequest,
    SetLocatorRequest, MixerSendRequest,
    SessionStateResponse, LiveCommandResponse
)


@app.post("/live/tracks/create", response_model=LiveCommandResponse)
def live_create_track(request: CreateTrackRequest):
    """
    Create a new track in Ableton Live.
    
    Track types: midi, audio, return
    """
    try:
        result = {
            "track_type": request.track_type,
            "name": request.name,
            "color": request.color,
            "index": request.index
        }
        
        # Send OSC command to Max for Live
        osc_send("/scp/create_track", result)
        
        return LiveCommandResponse(
            status="ok",
            command="create_track",
            result=result
        )
    except Exception as e:
        logger.error(f"Create track failed: {e}")
        return LiveCommandResponse(status="error", command="create_track", error=str(e))


@app.get("/live/tracks", response_model=TrackListResponse)
def live_get_tracks():
    """Get list of all tracks in the session."""
    try:
        # This would be populated by M4L sending track info via OSC
        # For now, return placeholder that M4L will fill
        osc_send("/scp/get_tracks", {})
        
        return TrackListResponse(
            status="ok",
            tracks=[],
            count=0
        )
    except Exception as e:
        logger.error(f"Get tracks failed: {e}")
        return TrackListResponse(status="error", tracks=[], count=0, error=str(e))


@app.patch("/live/tracks/{track_index}", response_model=LiveCommandResponse)
def live_update_track(track_index: int, request: UpdateTrackRequest):
    """Update track properties (name, color, arm, mute, solo, volume, pan)."""
    try:
        updates = request.model_dump(exclude_none=True)
        updates["track_index"] = track_index
        
        osc_send("/scp/update_track", updates)
        
        return LiveCommandResponse(
            status="ok",
            command="update_track",
            result=updates
        )
    except Exception as e:
        logger.error(f"Update track failed: {e}")
        return LiveCommandResponse(status="error", command="update_track", error=str(e))


@app.delete("/live/tracks/{track_index}", response_model=LiveCommandResponse)
def live_delete_track(track_index: int):
    """Delete a track."""
    try:
        osc_send("/scp/delete_track", {"track_index": track_index})
        
        return LiveCommandResponse(
            status="ok",
            command="delete_track",
            result={"track_index": track_index}
        )
    except Exception as e:
        logger.error(f"Delete track failed: {e}")
        return LiveCommandResponse(status="error", command="delete_track", error=str(e))


# ============================================================================
# Ableton Live Integration - Device Control
# ============================================================================

@app.post("/live/devices/load", response_model=LiveCommandResponse)
def live_load_device(request: LoadDeviceRequest):
    """Load a native Ableton device onto a track."""
    try:
        data = request.model_dump()
        osc_send("/scp/load_device", data)
        
        return LiveCommandResponse(
            status="ok",
            command="load_device",
            result=data
        )
    except Exception as e:
        logger.error(f"Load device failed: {e}")
        return LiveCommandResponse(status="error", command="load_device", error=str(e))


@app.post("/live/devices/load_vst", response_model=LiveCommandResponse)
def live_load_vst(request: LoadVSTRequest):
    """Load a VST/AU plugin onto a track."""
    try:
        data = request.model_dump()
        osc_send("/scp/load_vst", data)
        
        return LiveCommandResponse(
            status="ok",
            command="load_vst",
            result=data
        )
    except Exception as e:
        logger.error(f"Load VST failed: {e}")
        return LiveCommandResponse(status="error", command="load_vst", error=str(e))


@app.get("/live/devices/{track_index}", response_model=DeviceListResponse)
def live_get_devices(track_index: int):
    """Get list of devices on a track."""
    try:
        osc_send("/scp/get_devices", {"track_index": track_index})
        
        return DeviceListResponse(
            status="ok",
            track_index=track_index,
            devices=[],
            count=0
        )
    except Exception as e:
        logger.error(f"Get devices failed: {e}")
        return DeviceListResponse(status="error", track_index=track_index, devices=[], count=0, error=str(e))


@app.patch("/live/devices/param", response_model=LiveCommandResponse)
def live_set_device_param(request: SetDeviceParamRequest):
    """Set a device parameter value."""
    try:
        data = request.model_dump()
        osc_send("/scp/set_param", data)
        
        return LiveCommandResponse(
            status="ok",
            command="set_param",
            result=data
        )
    except Exception as e:
        logger.error(f"Set param failed: {e}")
        return LiveCommandResponse(status="error", command="set_param", error=str(e))


@app.get("/live/devices/{track_index}/{device_index}/params", response_model=DeviceParamsResponse)
def live_get_device_params(track_index: int, device_index: int):
    """Get all parameters for a device."""
    try:
        osc_send("/scp/get_params", {"track_index": track_index, "device_index": device_index})
        
        return DeviceParamsResponse(
            status="ok",
            track_index=track_index,
            device_index=device_index,
            device_name="",
            params=[]
        )
    except Exception as e:
        logger.error(f"Get params failed: {e}")
        return DeviceParamsResponse(status="error", track_index=track_index, device_index=device_index, device_name="", params=[], error=str(e))


@app.post("/live/devices/toggle", response_model=LiveCommandResponse)
def live_toggle_device(request: ToggleDeviceRequest):
    """Enable/disable a device."""
    try:
        data = request.model_dump()
        osc_send("/scp/toggle_device", data)
        
        return LiveCommandResponse(
            status="ok",
            command="toggle_device",
            result=data
        )
    except Exception as e:
        logger.error(f"Toggle device failed: {e}")
        return LiveCommandResponse(status="error", command="toggle_device", error=str(e))


@app.post("/live/devices/load_preset", response_model=LiveCommandResponse)
def live_load_preset(request: LoadPresetRequest):
    """Load a preset for a device."""
    try:
        data = request.model_dump()
        osc_send("/scp/load_preset", data)
        
        return LiveCommandResponse(
            status="ok",
            command="load_preset",
            result=data
        )
    except Exception as e:
        logger.error(f"Load preset failed: {e}")
        return LiveCommandResponse(status="error", command="load_preset", error=str(e))


# ============================================================================
# Ableton Live Integration - Clip Management
# ============================================================================

@app.post("/live/clips/create", response_model=LiveCommandResponse)
def live_create_clip(request: CreateClipRequest):
    """Create a new clip in a clip slot."""
    try:
        data = request.model_dump()
        osc_send("/scp/create_clip", data)
        
        return LiveCommandResponse(
            status="ok",
            command="create_clip",
            result=data
        )
    except Exception as e:
        logger.error(f"Create clip failed: {e}")
        return LiveCommandResponse(status="error", command="create_clip", error=str(e))


@app.post("/live/clips/fire", response_model=LiveCommandResponse)
def live_fire_clip(request: FireClipRequest):
    """Fire/launch a clip."""
    try:
        data = request.model_dump()
        osc_send("/scp/fire_clip", data)
        
        return LiveCommandResponse(
            status="ok",
            command="fire_clip",
            result=data
        )
    except Exception as e:
        logger.error(f"Fire clip failed: {e}")
        return LiveCommandResponse(status="error", command="fire_clip", error=str(e))


@app.post("/live/clips/stop", response_model=LiveCommandResponse)
def live_stop_clip(request: StopClipRequest):
    """Stop a clip or all clips on a track."""
    try:
        data = request.model_dump()
        osc_send("/scp/stop_clip", data)
        
        return LiveCommandResponse(
            status="ok",
            command="stop_clip",
            result=data
        )
    except Exception as e:
        logger.error(f"Stop clip failed: {e}")
        return LiveCommandResponse(status="error", command="stop_clip", error=str(e))


@app.post("/live/clips/duplicate", response_model=LiveCommandResponse)
def live_duplicate_clip(request: DuplicateClipRequest):
    """Duplicate a clip to another slot."""
    try:
        data = request.model_dump()
        osc_send("/scp/duplicate_clip", data)
        
        return LiveCommandResponse(
            status="ok",
            command="duplicate_clip",
            result=data
        )
    except Exception as e:
        logger.error(f"Duplicate clip failed: {e}")
        return LiveCommandResponse(status="error", command="duplicate_clip", error=str(e))


@app.delete("/live/clips/{track_index}/{slot_index}", response_model=LiveCommandResponse)
def live_delete_clip(track_index: int, slot_index: int):
    """Delete a clip from a slot."""
    try:
        data = {"track_index": track_index, "slot_index": slot_index}
        osc_send("/scp/delete_clip", data)
        
        return LiveCommandResponse(
            status="ok",
            command="delete_clip",
            result=data
        )
    except Exception as e:
        logger.error(f"Delete clip failed: {e}")
        return LiveCommandResponse(status="error", command="delete_clip", error=str(e))


@app.post("/live/clips/notes", response_model=LiveCommandResponse)
def live_set_clip_notes(request: SetClipNotesRequest):
    """Set MIDI notes in a clip."""
    try:
        data = request.model_dump()
        osc_send("/scp/set_clip_notes", data)
        
        return LiveCommandResponse(
            status="ok",
            command="set_clip_notes",
            result={"track_index": request.track_index, "slot_index": request.slot_index, "note_count": len(request.notes)}
        )
    except Exception as e:
        logger.error(f"Set clip notes failed: {e}")
        return LiveCommandResponse(status="error", command="set_clip_notes", error=str(e))


@app.get("/live/clips/{track_index}/{slot_index}", response_model=ClipNotesResponse)
def live_get_clip_notes(track_index: int, slot_index: int):
    """Get MIDI notes from a clip."""
    try:
        osc_send("/scp/get_clip_notes", {"track_index": track_index, "slot_index": slot_index})
        
        return ClipNotesResponse(
            status="ok",
            track_index=track_index,
            slot_index=slot_index,
            notes=[],
            count=0
        )
    except Exception as e:
        logger.error(f"Get clip notes failed: {e}")
        return ClipNotesResponse(status="error", track_index=track_index, slot_index=slot_index, notes=[], count=0, error=str(e))


@app.patch("/live/clips/{track_index}/{slot_index}", response_model=LiveCommandResponse)
def live_update_clip(track_index: int, slot_index: int, request: UpdateClipRequest):
    """Update clip properties."""
    try:
        updates = request.model_dump(exclude_none=True)
        updates["track_index"] = track_index
        updates["slot_index"] = slot_index
        
        osc_send("/scp/update_clip", updates)
        
        return LiveCommandResponse(
            status="ok",
            command="update_clip",
            result=updates
        )
    except Exception as e:
        logger.error(f"Update clip failed: {e}")
        return LiveCommandResponse(status="error", command="update_clip", error=str(e))


# ============================================================================
# Ableton Live Integration - Browser/Library
# ============================================================================

@app.get("/live/browser/search", response_model=BrowserSearchResponse)
def live_browser_search(query: str, category: Optional[str] = None, limit: int = 20):
    """Search the Ableton browser/library."""
    try:
        osc_send("/scp/browser_search", {"query": query, "category": category, "limit": limit})
        
        return BrowserSearchResponse(
            status="ok",
            query=query,
            items=[],
            count=0
        )
    except Exception as e:
        logger.error(f"Browser search failed: {e}")
        return BrowserSearchResponse(status="error", query=query, items=[], count=0, error=str(e))


@app.post("/live/browser/load", response_model=LiveCommandResponse)
def live_browser_load(request: LoadBrowserItemRequest):
    """Load an item from the browser to a track."""
    try:
        data = request.model_dump()
        osc_send("/scp/browser_load", data)
        
        return LiveCommandResponse(
            status="ok",
            command="browser_load",
            result=data
        )
    except Exception as e:
        logger.error(f"Browser load failed: {e}")
        return LiveCommandResponse(status="error", command="browser_load", error=str(e))


@app.post("/live/browser/hot_swap", response_model=LiveCommandResponse)
def live_hot_swap(request: HotSwapRequest):
    """Hot-swap a sample in Simpler/Sampler."""
    try:
        data = request.model_dump()
        osc_send("/scp/hot_swap", data)
        
        return LiveCommandResponse(
            status="ok",
            command="hot_swap",
            result=data
        )
    except Exception as e:
        logger.error(f"Hot swap failed: {e}")
        return LiveCommandResponse(status="error", command="hot_swap", error=str(e))


# ============================================================================
# Ableton Live Integration - Session/Scene Control
# ============================================================================

@app.post("/live/scenes/fire", response_model=LiveCommandResponse)
def live_fire_scene(request: FireSceneRequest):
    """Fire/launch a scene."""
    try:
        data = request.model_dump()
        osc_send("/scp/fire_scene", data)
        
        return LiveCommandResponse(
            status="ok",
            command="fire_scene",
            result=data
        )
    except Exception as e:
        logger.error(f"Fire scene failed: {e}")
        return LiveCommandResponse(status="error", command="fire_scene", error=str(e))


@app.post("/live/scenes/create", response_model=LiveCommandResponse)
def live_create_scene(request: CreateSceneRequest):
    """Create a new scene."""
    try:
        data = request.model_dump()
        osc_send("/scp/create_scene", data)
        
        return LiveCommandResponse(
            status="ok",
            command="create_scene",
            result=data
        )
    except Exception as e:
        logger.error(f"Create scene failed: {e}")
        return LiveCommandResponse(status="error", command="create_scene", error=str(e))


@app.delete("/live/scenes/{scene_index}", response_model=LiveCommandResponse)
def live_delete_scene(scene_index: int):
    """Delete a scene."""
    try:
        osc_send("/scp/delete_scene", {"scene_index": scene_index})
        
        return LiveCommandResponse(
            status="ok",
            command="delete_scene",
            result={"scene_index": scene_index}
        )
    except Exception as e:
        logger.error(f"Delete scene failed: {e}")
        return LiveCommandResponse(status="error", command="delete_scene", error=str(e))


@app.post("/live/scenes/{scene_index}/duplicate", response_model=LiveCommandResponse)
def live_duplicate_scene(scene_index: int):
    """Duplicate a scene."""
    try:
        osc_send("/scp/duplicate_scene", {"scene_index": scene_index})
        
        return LiveCommandResponse(
            status="ok",
            command="duplicate_scene",
            result={"scene_index": scene_index}
        )
    except Exception as e:
        logger.error(f"Duplicate scene failed: {e}")
        return LiveCommandResponse(status="error", command="duplicate_scene", error=str(e))


@app.post("/live/session/tempo", response_model=LiveCommandResponse)
def live_set_tempo(request: SetTempoRequest):
    """Set session tempo."""
    try:
        data = request.model_dump()
        osc_send("/scp/set_tempo", data)
        
        return LiveCommandResponse(
            status="ok",
            command="set_tempo",
            result=data
        )
    except Exception as e:
        logger.error(f"Set tempo failed: {e}")
        return LiveCommandResponse(status="error", command="set_tempo", error=str(e))


@app.post("/live/session/quantization", response_model=LiveCommandResponse)
def live_set_quantization(request: SetQuantizationRequest):
    """Set global clip trigger quantization."""
    try:
        data = request.model_dump()
        osc_send("/scp/set_quantization", data)
        
        return LiveCommandResponse(
            status="ok",
            command="set_quantization",
            result=data
        )
    except Exception as e:
        logger.error(f"Set quantization failed: {e}")
        return LiveCommandResponse(status="error", command="set_quantization", error=str(e))


@app.post("/live/session/undo", response_model=LiveCommandResponse)
def live_undo():
    """Undo last action."""
    try:
        osc_send("/scp/undo", {})
        
        return LiveCommandResponse(
            status="ok",
            command="undo",
            result={}
        )
    except Exception as e:
        logger.error(f"Undo failed: {e}")
        return LiveCommandResponse(status="error", command="undo", error=str(e))


@app.post("/live/session/redo", response_model=LiveCommandResponse)
def live_redo():
    """Redo last undone action."""
    try:
        osc_send("/scp/redo", {})
        
        return LiveCommandResponse(
            status="ok",
            command="redo",
            result={}
        )
    except Exception as e:
        logger.error(f"Redo failed: {e}")
        return LiveCommandResponse(status="error", command="redo", error=str(e))


@app.get("/live/session/state", response_model=SessionStateResponse)
def live_get_session_state():
    """Get full session state."""
    try:
        osc_send("/scp/get_session_state", {})
        
        # This would be populated by M4L response
        return SessionStateResponse(
            status="ok",
            tempo=120.0,
            is_playing=False,
            is_recording=False,
            current_song_time=0.0,
            loop_start=0.0,
            loop_length=4.0,
            track_count=0,
            scene_count=0,
            return_track_count=0,
            quantization="1_bar",
            tracks=[],
            scenes=[]
        )
    except Exception as e:
        logger.error(f"Get session state failed: {e}")
        return SessionStateResponse(status="error", tempo=0, is_playing=False, is_recording=False, 
                                   current_song_time=0, loop_start=0, loop_length=0, track_count=0,
                                   scene_count=0, return_track_count=0, quantization="", tracks=[], scenes=[], error=str(e))


@app.post("/live/transport/{action}", response_model=LiveCommandResponse)
def live_transport(action: str):
    """
    Control transport.
    
    Actions: play, stop, record, continue, stop_all_clips
    """
    try:
        if action not in ["play", "stop", "record", "continue", "stop_all_clips"]:
            return LiveCommandResponse(status="error", command="transport", error=f"Unknown action: {action}")
        
        osc_send(f"/scp/transport_{action}", {})
        
        return LiveCommandResponse(
            status="ok",
            command=f"transport_{action}",
            result={"action": action}
        )
    except Exception as e:
        logger.error(f"Transport {action} failed: {e}")
        return LiveCommandResponse(status="error", command=f"transport_{action}", error=str(e))


@app.post("/live/mixer/send", response_model=LiveCommandResponse)
def live_set_send(request: MixerSendRequest):
    """Set mixer send level."""
    try:
        data = request.model_dump()
        osc_send("/scp/set_send", data)
        
        return LiveCommandResponse(
            status="ok",
            command="set_send",
            result=data
        )
    except Exception as e:
        logger.error(f"Set send failed: {e}")
        return LiveCommandResponse(status="error", command="set_send", error=str(e))


@app.post("/live/command", response_model=LiveCommandResponse)
def live_natural_language_command(request: GPTGenerateRequest):
    """
    Execute a natural language command for Ableton Live.
    
    Examples:
    - "Create a new MIDI track called 'Lead Synth'"
    - "Add Wavetable to track 2"
    - "Mute tracks 3 and 4"
    - "Set tempo to 128"
    """
    try:
        prompt = request.prompt.lower()
        result = {"prompt": request.prompt, "actions": []}
        
        # Parse common commands
        if "create" in prompt and "track" in prompt:
            track_type = "midi" if "midi" in prompt else ("audio" if "audio" in prompt else "midi")
            # Extract name if quoted
            name_match = re.search(r"['\"]([^'\"]+)['\"]", request.prompt)
            name = name_match.group(1) if name_match else None
            
            osc_send("/scp/create_track", {"track_type": track_type, "name": name})
            result["actions"].append({"action": "create_track", "track_type": track_type, "name": name})
            result["description"] = f"Created {track_type} track" + (f" named '{name}'" if name else "")
            
        elif "tempo" in prompt:
            tempo_match = re.search(r"(\d+(?:\.\d+)?)", prompt)
            if tempo_match:
                tempo = float(tempo_match.group(1))
                osc_send("/scp/set_tempo", {"tempo": tempo})
                result["actions"].append({"action": "set_tempo", "tempo": tempo})
                result["description"] = f"Set tempo to {tempo} BPM"
                
        elif "mute" in prompt and "track" in prompt:
            track_match = re.search(r"track\s*(\d+)", prompt)
            if track_match:
                track_idx = int(track_match.group(1))
                osc_send("/scp/mute_track", {"track_index": track_idx, "state": 1})
                result["actions"].append({"action": "mute_track", "track_index": track_idx})
                result["description"] = f"Muted track {track_idx}"
                
        elif "solo" in prompt and "track" in prompt:
            track_match = re.search(r"track\s*(\d+)", prompt)
            if track_match:
                track_idx = int(track_match.group(1))
                osc_send("/scp/solo_track", {"track_index": track_idx, "state": 1})
                result["actions"].append({"action": "solo_track", "track_index": track_idx})
                result["description"] = f"Soloed track {track_idx}"
                
        elif "fire" in prompt and "scene" in prompt:
            scene_match = re.search(r"scene\s*(\d+)", prompt)
            if scene_match:
                scene_idx = int(scene_match.group(1))
                osc_send("/scp/fire_scene", {"scene_index": scene_idx})
                result["actions"].append({"action": "fire_scene", "scene_index": scene_idx})
                result["description"] = f"Fired scene {scene_idx}"
                
        elif "play" in prompt:
            osc_send("/scp/transport_play", {})
            result["actions"].append({"action": "transport_play"})
            result["description"] = "Started playback"
            
        elif "stop" in prompt:
            osc_send("/scp/transport_stop", {})
            result["actions"].append({"action": "transport_stop"})
            result["description"] = "Stopped playback"
            
        else:
            result["description"] = "Command not recognized. Try: create track, set tempo, mute/solo track, fire scene, play, stop"
        
        return LiveCommandResponse(
            status="ok",
            command="natural_language",
            result=result
        )
    except Exception as e:
        logger.error(f"Natural language command failed: {e}")
        return LiveCommandResponse(status="error", command="natural_language", error=str(e))


# ============================================================================
# Audio Analysis Endpoints
# ============================================================================

@app.post("/analyze/upload", response_model=dict)
async def analyze_upload(file: UploadFile = File(...)):
    """
    Upload and analyze an audio file.
    
    Accepts WAV, MP3, FLAC, AIF files.
    Returns BPM, key, energy, MusicBrainz data, and SERGIK DNA match.
    """
    import tempfile
    import os
    
    try:
        # Save uploaded file to temp location
        suffix = Path(file.filename).suffix if file.filename else '.wav'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Run full analysis
        from ..pipelines.audio_analysis import full_analysis
        result = full_analysis(file_path=tmp_path)
        
        # Cleanup temp file
        os.unlink(tmp_path)
        
        return result
        
    except Exception as e:
        logger.error(f"Audio analysis upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/url", response_model=dict)
async def analyze_url(url: str = Query(..., description="URL to YouTube, SoundCloud, or direct audio file")):
    """
    Download audio from URL and analyze it.
    
    Supports YouTube, SoundCloud, and direct audio URLs.
    Uses yt-dlp for extraction.
    """
    try:
        from ..pipelines.audio_analysis import full_analysis
        result = full_analysis(url=url)
        return result
        
    except Exception as e:
        logger.error(f"Audio analysis URL failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/path", response_model=dict)
async def analyze_path(file_path: str = Query(..., description="Path to local audio file")):
    """
    Analyze a local audio file by path.
    
    Use this endpoint when the file already exists on the server.
    """
    try:
        if not Path(file_path).exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        from ..pipelines.audio_analysis import full_analysis
        result = full_analysis(file_path=file_path)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio analysis path failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyze/presets", response_model=dict)
async def get_analysis_presets():
    """
    Get available presets for analysis parameter dropdowns.
    
    Returns tempo, key, energy, and genre preset options.
    """
    from ..schemas import AnalysisPresets
    presets = AnalysisPresets()
    return presets.model_dump()


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("🚀 SERGIK ML API Server")
    print("=" * 60)
    print(f"   Host: {CFG.host}")
    print(f"   Port: {CFG.port}")
    print("=" * 60)
    print("\n📡 Starting server...")
    print(f"   API docs: http://{CFG.host}:{CFG.port}/docs")
    print(f"   Health check: http://{CFG.host}:{CFG.port}/gpt/health")
    print("\n🎛️ Ableton Live Integration:")
    print("   /live/tracks/*     - Track management")
    print("   /live/devices/*    - Device control")
    print("   /live/clips/*      - Clip management")
    print("   /live/browser/*    - Library search")
    print("   /live/session/*    - Session control")
    print("   /live/transport/*  - Transport control")
    print("\n")
    
    uvicorn.run(
        "sergik_ml.serving.api:app",
        host=CFG.host,
        port=CFG.port,
        reload=False,
        log_level="info"
    )