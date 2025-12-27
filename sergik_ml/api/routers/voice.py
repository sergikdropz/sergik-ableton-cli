"""
Voice Router

Voice processing and action dispatch endpoints.
"""

from fastapi import APIRouter, UploadFile, File
from pathlib import Path
import uuid
import time
import logging

from fastapi import Depends

from ...schemas import ActionIn, ActionOut, VoiceOut, VoiceIntent
from ...api.dependencies import (
    get_voice_service,
    get_track_service,
    get_ableton_service,
    get_generation_service,
    get_gpt_voice_service
)
from ...services.voice_service import VoiceService
from ...services.track_service import TrackService
from ...services.ableton_service import AbletonService
from ...services.generation_service import GenerationService
from ...services.gpt_voice_service import GPTVoiceService
from ...services.voice_orchestrator import VoiceOrchestrator
from ...utils.errors import ValidationError as SergikValidationError, ServiceError
from ...stores.sql_store import log_action
from ...policies.action_policy import validate_action
from ...connectors.ableton_osc import osc_error

router = APIRouter(prefix="/voice", tags=["voice"])
logger = logging.getLogger(__name__)


def dispatch(
    cmd: str,
    args: dict,
    ableton_service: AbletonService,
    track_service: TrackService,
    voice_service: VoiceService
) -> dict:
    """Dispatch command to appropriate service."""
    # Ableton commands
    if cmd.startswith("live."):
        return ableton_service.execute_command(cmd, args)
    
    # Pack operations
    if cmd == "pack.create":
        return track_service.create_pack(args)
    
    if cmd == "pack.rate":
        return track_service.rate_track(
            track_id=args.get("track_id"),
            rating=args.get("rating", 3),
            context=args.get("context")
        )
    
    if cmd == "pack.similar":
        return track_service.find_similar(
            track_id=args.get("track_id"),
            k=args.get("k", 10),
            style_filter=args.get("style_filter")
        )
    
    # Voice TTS
    if cmd == "voice.tts":
        text = str(args.get("text", ""))
        path = voice_service.synthesize_and_notify(text)
        return {"tts_path": path}
    
    raise ValueError(f"Unknown command: {cmd}")


@router.post("/action", response_model=ActionOut)
def action(
    inp: ActionIn,
    ableton_service: AbletonService = Depends(get_ableton_service),
    track_service: TrackService = Depends(get_track_service),
    voice_service: VoiceService = Depends(get_voice_service)
):
    """
    Execute an action command.
    
    Commands include:
      - pack.create: Create sample pack
      - pack.rate: Rate a track
      - pack.similar: Find similar tracks
      - live.*: Ableton Live control
      - voice.tts: Text-to-speech
    """
    start_time = time.time()
    
    try:
        validate_action(inp.cmd, inp.args)
        result = dispatch(inp.cmd, inp.args, ableton_service, track_service, voice_service)
        duration_ms = int((time.time() - start_time) * 1000)
        
        log_action(inp.cmd, inp.args, inp.meta, "ok", result, None, duration_ms)
        return ActionOut(status="ok", cmd=inp.cmd, result=result)
    
    except SergikValidationError as e:
        err = str(e)
        duration_ms = int((time.time() - start_time) * 1000)
        
        osc_error(err, inp.cmd)
        log_action(
            inp.cmd or "unknown",
            inp.args or {},
            inp.meta or {},
            "error",
            {},
            err,
            duration_ms
        )
        
        logger.error(f"Action validation failed: {inp.cmd} - {err}", exc_info=True)
        return ActionOut(status="error", cmd=inp.cmd, error=err, result={})
    except (ValueError, ServiceError) as e:
        err = str(e)
        duration_ms = int((time.time() - start_time) * 1000)
        
        osc_error(err, inp.cmd)
        log_action(
            inp.cmd or "unknown",
            inp.args or {},
            inp.meta or {},
            "error",
            {},
            err,
            duration_ms
        )
        
        logger.error(f"Action failed: {inp.cmd} - {err}", exc_info=True)
        return ActionOut(status="error", cmd=inp.cmd, error=err, result={})


@router.post("", response_model=VoiceOut)
async def voice(
    file: UploadFile = File(...),
    voice_service: VoiceService = Depends(get_voice_service),
    ableton_service: AbletonService = Depends(get_ableton_service),
    track_service: TrackService = Depends(get_track_service)
):
    """
    Process voice recording (push-to-talk).
    
    Upload WAV file -> STT -> Intent parsing -> Action execution -> TTS response
    """
    wav_path = None
    try:
        # Save uploaded file
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        wav_path = upload_dir / f"voice_{uuid.uuid4().hex}.wav"
        
        content = await file.read()
        wav_path.write_bytes(content)
        
        # Process voice
        intent_data = voice_service.process_voice(str(wav_path))
        action_out: ActionOut = None
        
        # Execute command if found
        if intent_data.get("cmd"):
            try:
                validate_action(intent_data["cmd"], intent_data.get("args", {}))
                result = dispatch(
                    intent_data["cmd"],
                    intent_data.get("args", {}),
                    ableton_service,
                    track_service,
                    voice_service
                )
                action_out = ActionOut(
                    status="ok",
                    cmd=intent_data["cmd"],
                    result=result
                )
            except (SergikValidationError, ValueError, ServiceError) as e:
                action_out = ActionOut(
                    status="error",
                    cmd=intent_data["cmd"],
                    error=str(e)
                )
        
        # Generate TTS response
        tts_path = voice_service.synthesize_and_notify(intent_data.get("tts", "Done."))
        
        return VoiceOut(
            status="ok",
            text=intent_data.get("text"),
            intent=VoiceIntent(
                text=intent_data.get("text", ""),
                cmd=intent_data.get("cmd"),
                args=intent_data.get("args", {}),
                tts=intent_data.get("tts", "Done."),
                confidence=intent_data.get("confidence", 0.0)
            ),
            action=action_out,
            tts_path=tts_path
        )
    
    except SergikValidationError as e:
        err = str(e)
        osc_error(err, "voice")
        logger.error(f"Voice processing validation failed: {err}", exc_info=True)
        return VoiceOut(status="error", error=err)
    except Exception as e:
        err = str(e)
        osc_error(err, "voice")
        logger.error(f"Voice processing failed: {err}", exc_info=True)
        return VoiceOut(status="error", error=err)
    finally:
        # Cleanup uploaded file
        if wav_path and wav_path.exists():
            try:
                wav_path.unlink()
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup voice file {wav_path}: {cleanup_error}")


@router.post("/gpt", response_model=VoiceOut)
async def voice_gpt(
    file: UploadFile = File(...),
    gpt_voice_service: GPTVoiceService = Depends(get_gpt_voice_service),
    ableton_service: AbletonService = Depends(get_ableton_service),
    voice_service: VoiceService = Depends(get_voice_service)
):
    """
    Process voice recording using GPT Actions for intelligent intent understanding.
    
    This endpoint uses SERGIK GPT Actions to understand voice commands and
    execute Ableton Live controls or music generation tasks.
    
    Pipeline:
    1. STT: Transcribe voice to text
    2. GPT: Send to GPT Actions API for intent understanding
    3. Execute: Run Ableton commands or generation tasks
    4. TTS: Generate spoken response
    
    Examples:
    - "Set tempo to 125 BPM"
    - "Create a tech house drum pattern"
    - "Generate chords in D minor"
    - "Mute track 2"
    """
    wav_path = None
    try:
        # Save uploaded file
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        wav_path = upload_dir / f"voice_gpt_{uuid.uuid4().hex}.wav"
        
        content = await file.read()
        wav_path.write_bytes(content)
        
        # Create orchestrator
        orchestrator = VoiceOrchestrator(
            gpt_voice_service=gpt_voice_service,
            ableton_service=ableton_service,
            voice_service=voice_service
        )
        
        # Process voice command
        result = orchestrator.process_voice_command(str(wav_path))
        
        # Convert to VoiceOut format
        return VoiceOut(
            status="ok",
            text=result.get("text", ""),
            intent=VoiceIntent(
                text=result.get("text", ""),
                cmd=None,  # GPT handles multiple commands
                args={},
                tts=result.get("summary", ""),
                confidence=0.9 if result.get("executed") else 0.5
            ),
            action=ActionOut(
                status="ok" if not result.get("errors") else "error",
                cmd="gpt_voice",
                result={
                    "executed": result.get("executed", []),
                    "errors": result.get("errors", []),
                    "summary": result.get("summary", "")
                },
                error=None if not result.get("errors") else str(result.get("errors"))
            ),
            tts_path=result.get("tts_path", "")
        )
    
    except SergikValidationError as e:
        err = str(e)
        osc_error(err, "voice_gpt")
        logger.error(f"GPT voice processing validation failed: {err}", exc_info=True)
        return VoiceOut(status="error", error=err)
    except Exception as e:
        err = str(e)
        osc_error(err, "voice_gpt")
        logger.error(f"GPT voice processing failed: {err}", exc_info=True)
        return VoiceOut(status="error", error=err)
    finally:
        # Cleanup uploaded file
        if wav_path and wav_path.exists():
            try:
                wav_path.unlink()
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup voice file {wav_path}: {cleanup_error}")

