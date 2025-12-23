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

from ..schemas import ActionIn, ActionOut, VoiceOut, VoiceIntent
from ..stores.sql_store import init_db, log_action, get_track, list_tracks
from ..stores.vector_store import similar as vector_similar
from ..policies.action_policy import validate_action
from ..connectors.ableton_osc import osc_status, osc_send, osc_similar_results, osc_error
from ..pipelines.pack_pipeline import create_pack, rate_track
from ..pipelines.voice_pipeline import voice_to_action, tts_and_notify_live
from ..config import CFG

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
