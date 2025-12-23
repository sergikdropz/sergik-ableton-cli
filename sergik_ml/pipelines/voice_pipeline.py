"""
SERGIK ML Voice Pipeline

Push-to-talk voice processing:
  WAV -> STT -> Intent Model -> Action Dispatch -> TTS -> Ableton OSC

STT/TTS are pluggable (stubs by default, can use OpenAI/Whisper).
"""

from typing import Dict, Any, Optional
from pathlib import Path
import uuid
import logging

from ..models.intent import IntentModel
from ..connectors.ableton_osc import osc_tts_ready
from ..config import CFG

logger = logging.getLogger(__name__)

# Output directory for TTS files
TTS_DIR = Path("tts_output")
TTS_DIR.mkdir(exist_ok=True)

# Intent model singleton
_intent_model: Optional[IntentModel] = None


def _get_intent_model() -> IntentModel:
    """Get or create intent model."""
    global _intent_model
    if _intent_model is None:
        _intent_model = IntentModel()
    return _intent_model


def stt_transcribe(wav_path: str) -> str:
    """
    Speech-to-text transcription.

    Modes:
      - Stub (default): Returns test phrase
      - OpenAI Whisper: Real transcription (if OPENAI_API_KEY set)
      - faster-whisper: Local transcription (if installed)
    """
    if CFG.use_openai_voice and CFG.openai_api_key:
        return _stt_openai(wav_path)

    # Try faster-whisper
    try:
        return _stt_faster_whisper(wav_path)
    except ImportError:
        pass

    # Stub response for testing
    logger.warning("Using STT stub - install faster-whisper or set OPENAI_API_KEY")
    return "Sergik, make me a 4-bar sample pack from the drum group and push it to cloud."


def _stt_openai(wav_path: str) -> str:
    """Transcribe using OpenAI Whisper API."""
    try:
        import openai
        client = openai.OpenAI(api_key=CFG.openai_api_key)

        with open(wav_path, "rb") as f:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text"
            )
        return response
    except Exception as e:
        logger.error(f"OpenAI STT failed: {e}")
        return ""


def _stt_faster_whisper(wav_path: str) -> str:
    """Transcribe using local faster-whisper."""
    from faster_whisper import WhisperModel

    model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(wav_path)
    return " ".join([s.text for s in segments])


def tts_speak(text: str) -> str:
    """
    Text-to-speech synthesis.

    Modes:
      - Stub (default): Writes text to file
      - OpenAI TTS: Real synthesis (if OPENAI_API_KEY set)
      - Piper/Coqui: Local synthesis (future)

    Returns:
        Path to audio file (or text file for stub)
    """
    if CFG.use_openai_voice and CFG.openai_api_key:
        return _tts_openai(text)

    # Stub: write text to file
    out_path = TTS_DIR / f"tts_{uuid.uuid4().hex}.txt"
    out_path.write_text(text)
    logger.debug(f"TTS stub: {out_path}")
    return str(out_path)


def _tts_openai(text: str) -> str:
    """Synthesize using OpenAI TTS API."""
    try:
        import openai
        client = openai.OpenAI(api_key=CFG.openai_api_key)

        out_path = TTS_DIR / f"tts_{uuid.uuid4().hex}.mp3"

        response = client.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=text
        )
        response.stream_to_file(str(out_path))
        return str(out_path)
    except Exception as e:
        logger.error(f"OpenAI TTS failed: {e}")
        # Fallback to stub
        out_path = TTS_DIR / f"tts_{uuid.uuid4().hex}.txt"
        out_path.write_text(text)
        return str(out_path)


def voice_to_action(wav_path: str) -> Dict[str, Any]:
    """
    Process voice recording to extract intent.

    Args:
        wav_path: Path to recorded audio

    Returns:
        {"text": str, "cmd": str, "args": dict, "tts": str}
    """
    # Transcribe
    text = stt_transcribe(wav_path)
    logger.info(f"STT result: {text}")

    # Parse intent
    intent_model = _get_intent_model()
    result = intent_model.predict(text)

    return {
        "text": text,
        "cmd": result.get("cmd"),
        "args": result.get("args", {}),
        "tts": result.get("tts", "Done."),
        "confidence": result.get("confidence", 0.0)
    }


def tts_and_notify_live(text: str) -> str:
    """
    Generate TTS and notify Ableton.

    Args:
        text: Text to speak

    Returns:
        Path to TTS output file
    """
    path = tts_speak(text)
    osc_tts_ready(path)
    return path
