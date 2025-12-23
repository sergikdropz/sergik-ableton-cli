"""
SERGIK ML Speech-to-Text Engine

Local STT using faster-whisper for offline voice commands.

Modes:
  - faster-whisper (local, fast, offline)
  - OpenAI Whisper API (cloud, high quality)
  - Stub (for testing)
"""

import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import tempfile

from ..config import CFG

logger = logging.getLogger(__name__)

# Model sizes for faster-whisper
WHISPER_MODELS = {
    "tiny": "Fastest, lowest accuracy (~1GB VRAM)",
    "base": "Fast, good for commands (~1GB VRAM)",
    "small": "Balanced speed/accuracy (~2GB VRAM)",
    "medium": "High accuracy (~5GB VRAM)",
    "large-v3": "Best accuracy (~10GB VRAM)",
}

DEFAULT_MODEL = "base"


class SpeechToText:
    """
    Multi-backend speech-to-text engine.

    Supports:
      - faster-whisper (local)
      - OpenAI Whisper API
      - Stub mode
    """

    def __init__(
        self,
        model_size: str = DEFAULT_MODEL,
        device: str = "auto",
        compute_type: str = "auto",
    ):
        """
        Initialize STT engine.

        Args:
            model_size: Whisper model size
            device: 'cuda', 'cpu', or 'auto'
            compute_type: 'float16', 'int8', or 'auto'
        """
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self._model = None
        self._backend = None

    def _init_faster_whisper(self) -> bool:
        """Initialize faster-whisper backend."""
        try:
            from faster_whisper import WhisperModel

            # Determine device and compute type
            device = self.device
            compute_type = self.compute_type

            if device == "auto":
                try:
                    import torch
                    device = "cuda" if torch.cuda.is_available() else "cpu"
                except ImportError:
                    device = "cpu"

            if compute_type == "auto":
                compute_type = "float16" if device == "cuda" else "int8"

            logger.info(f"Loading faster-whisper model: {self.model_size} on {device}")
            self._model = WhisperModel(
                self.model_size,
                device=device,
                compute_type=compute_type,
            )
            self._backend = "faster-whisper"
            logger.info("faster-whisper initialized successfully")
            return True

        except ImportError:
            logger.warning("faster-whisper not installed")
            return False
        except Exception as e:
            logger.error(f"faster-whisper init failed: {e}")
            return False

    def _init_openai(self) -> bool:
        """Initialize OpenAI Whisper API backend."""
        try:
            import openai

            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.warning("OPENAI_API_KEY not set")
                return False

            self._model = openai.OpenAI(api_key=api_key)
            self._backend = "openai"
            logger.info("OpenAI Whisper API initialized")
            return True

        except ImportError:
            logger.warning("openai package not installed")
            return False
        except Exception as e:
            logger.error(f"OpenAI init failed: {e}")
            return False

    def _ensure_initialized(self) -> str:
        """Ensure a backend is initialized."""
        if self._backend:
            return self._backend

        # Try backends in order of preference
        if CFG.use_openai_voice and self._init_openai():
            return "openai"

        if self._init_faster_whisper():
            return "faster-whisper"

        if self._init_openai():
            return "openai"

        self._backend = "stub"
        logger.warning("Using stub STT backend")
        return "stub"

    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Transcribe audio file to text.

        Args:
            audio_path: Path to audio file (WAV, MP3, etc.)
            language: Language code (e.g., 'en', 'es') or None for auto
            prompt: Optional prompt to guide transcription

        Returns:
            Dict with text, language, segments, confidence
        """
        backend = self._ensure_initialized()

        if backend == "faster-whisper":
            return self._transcribe_faster_whisper(audio_path, language, prompt)
        elif backend == "openai":
            return self._transcribe_openai(audio_path, language, prompt)
        else:
            return self._transcribe_stub(audio_path)

    def _transcribe_faster_whisper(
        self,
        audio_path: str,
        language: Optional[str],
        prompt: Optional[str],
    ) -> Dict[str, Any]:
        """Transcribe using faster-whisper."""
        try:
            segments, info = self._model.transcribe(
                audio_path,
                language=language,
                initial_prompt=prompt,
                beam_size=5,
                vad_filter=True,
            )

            # Collect segments
            text_parts = []
            segment_list = []

            for segment in segments:
                text_parts.append(segment.text)
                segment_list.append({
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text,
                    "confidence": segment.avg_logprob,
                })

            text = " ".join(text_parts).strip()

            return {
                "text": text,
                "language": info.language,
                "language_probability": info.language_probability,
                "segments": segment_list,
                "backend": "faster-whisper",
                "model": self.model_size,
            }

        except Exception as e:
            logger.error(f"faster-whisper transcription failed: {e}")
            return {"text": "", "error": str(e), "backend": "faster-whisper"}

    def _transcribe_openai(
        self,
        audio_path: str,
        language: Optional[str],
        prompt: Optional[str],
    ) -> Dict[str, Any]:
        """Transcribe using OpenAI Whisper API."""
        try:
            with open(audio_path, "rb") as f:
                response = self._model.audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    language=language,
                    prompt=prompt,
                    response_format="verbose_json",
                )

            return {
                "text": response.text,
                "language": response.language,
                "segments": [
                    {
                        "start": s.start,
                        "end": s.end,
                        "text": s.text,
                    }
                    for s in (response.segments or [])
                ],
                "backend": "openai",
                "model": "whisper-1",
            }

        except Exception as e:
            logger.error(f"OpenAI transcription failed: {e}")
            return {"text": "", "error": str(e), "backend": "openai"}

    def _transcribe_stub(self, audio_path: str) -> Dict[str, Any]:
        """Stub transcription for testing."""
        logger.warning(f"Stub STT: returning default text for {audio_path}")
        return {
            "text": "Sergik, create a 4-bar sample pack from the drum group",
            "language": "en",
            "segments": [],
            "backend": "stub",
            "note": "Install faster-whisper for real STT: pip install faster-whisper",
        }


class TextToSpeech:
    """
    Multi-backend text-to-speech engine.

    Supports:
      - OpenAI TTS API
      - Local pyttsx3
      - Stub mode
    """

    def __init__(self, voice: str = "alloy"):
        """
        Initialize TTS engine.

        Args:
            voice: Voice name (OpenAI: alloy, echo, fable, onyx, nova, shimmer)
        """
        self.voice = voice
        self._backend = None
        self._client = None

    def _ensure_initialized(self) -> str:
        """Initialize TTS backend."""
        if self._backend:
            return self._backend

        # Try OpenAI first
        if CFG.use_openai_voice:
            try:
                import openai
                api_key = os.getenv("OPENAI_API_KEY")
                if api_key:
                    self._client = openai.OpenAI(api_key=api_key)
                    self._backend = "openai"
                    logger.info("OpenAI TTS initialized")
                    return "openai"
            except Exception as e:
                logger.warning(f"OpenAI TTS init failed: {e}")

        # Try pyttsx3
        try:
            import pyttsx3
            self._client = pyttsx3.init()
            self._backend = "pyttsx3"
            logger.info("pyttsx3 TTS initialized")
            return "pyttsx3"
        except Exception as e:
            logger.warning(f"pyttsx3 init failed: {e}")

        self._backend = "stub"
        return "stub"

    def speak(
        self,
        text: str,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Convert text to speech.

        Args:
            text: Text to speak
            output_path: Output audio file path (optional)

        Returns:
            Dict with audio path and metadata
        """
        backend = self._ensure_initialized()

        if output_path is None:
            output_path = tempfile.mktemp(suffix=".mp3")

        if backend == "openai":
            return self._speak_openai(text, output_path)
        elif backend == "pyttsx3":
            return self._speak_pyttsx3(text, output_path)
        else:
            return self._speak_stub(text, output_path)

    def _speak_openai(self, text: str, output_path: str) -> Dict[str, Any]:
        """Generate speech using OpenAI TTS."""
        try:
            response = self._client.audio.speech.create(
                model="tts-1",
                voice=self.voice,
                input=text,
            )

            response.stream_to_file(output_path)

            return {
                "path": output_path,
                "text": text,
                "backend": "openai",
                "voice": self.voice,
            }

        except Exception as e:
            logger.error(f"OpenAI TTS failed: {e}")
            return self._speak_stub(text, output_path)

    def _speak_pyttsx3(self, text: str, output_path: str) -> Dict[str, Any]:
        """Generate speech using pyttsx3."""
        try:
            self._client.save_to_file(text, output_path)
            self._client.runAndWait()

            return {
                "path": output_path,
                "text": text,
                "backend": "pyttsx3",
            }

        except Exception as e:
            logger.error(f"pyttsx3 TTS failed: {e}")
            return self._speak_stub(text, output_path)

    def _speak_stub(self, text: str, output_path: str) -> Dict[str, Any]:
        """Stub TTS - writes text to file."""
        txt_path = output_path.replace(".mp3", ".txt").replace(".wav", ".txt")
        Path(txt_path).write_text(text)

        return {
            "path": txt_path,
            "text": text,
            "backend": "stub",
            "note": "Stub mode: text saved to file. Install openai for real TTS.",
        }


# Global instances
_stt = None
_tts = None


def get_stt(model_size: str = DEFAULT_MODEL) -> SpeechToText:
    """Get or create global STT instance."""
    global _stt
    if _stt is None:
        _stt = SpeechToText(model_size=model_size)
    return _stt


def get_tts(voice: str = "alloy") -> TextToSpeech:
    """Get or create global TTS instance."""
    global _tts
    if _tts is None:
        _tts = TextToSpeech(voice=voice)
    return _tts


def transcribe(audio_path: str, **kwargs) -> Dict[str, Any]:
    """Convenience function for transcription."""
    return get_stt().transcribe(audio_path, **kwargs)


def speak(text: str, output_path: Optional[str] = None) -> Dict[str, Any]:
    """Convenience function for TTS."""
    return get_tts().speak(text, output_path)
