"""
Voice Service

Orchestrates voice pipeline operations (STT, intent, TTS).
"""

from typing import Dict, Any, Optional
import logging

from .base import BaseService
from ..pipelines.voice_pipeline import (
    voice_to_action,
    tts_and_notify_live,
    stt_transcribe,
    tts_speak,
)
from ..utils.errors import ValidationError

logger = logging.getLogger(__name__)


class VoiceService(BaseService):
    """Service for voice processing operations."""
    
    def process_voice(self, wav_path: str) -> Dict[str, Any]:
        """
        Process voice recording to extract intent.
        
        Args:
            wav_path: Path to recorded audio file
            
        Returns:
            Intent dictionary with text, cmd, args, tts, confidence
            
        Raises:
            ValidationError: If wav_path is invalid
        """
        if not wav_path:
            raise ValidationError("wav_path is required")
        
        try:
            result = voice_to_action(wav_path)
            
            self.logger.info(f"Processed voice: {result.get('text', '')}")
            return result
            
        except Exception as e:
            self.logger.error(f"Voice processing failed: {e}")
            raise
    
    def transcribe(self, wav_path: str) -> str:
        """
        Transcribe audio to text.
        
        Args:
            wav_path: Path to audio file
            
        Returns:
            Transcribed text
            
        Raises:
            ValidationError: If wav_path is invalid
        """
        if not wav_path:
            raise ValidationError("wav_path is required")
        
        try:
            text = stt_transcribe(wav_path)
            self.logger.info(f"Transcribed: {text[:50]}...")
            return text
            
        except Exception as e:
            self.logger.error(f"Transcription failed: {e}")
            raise
    
    def synthesize(self, text: str) -> str:
        """
        Synthesize text to speech.
        
        Args:
            text: Text to synthesize
            
        Returns:
            Path to TTS audio file
            
        Raises:
            ValidationError: If text is empty
        """
        if not text:
            raise ValidationError("text is required")
        
        try:
            path = tts_speak(text)
            self.logger.info(f"Generated TTS: {path}")
            return path
            
        except Exception as e:
            self.logger.error(f"TTS synthesis failed: {e}")
            raise
    
    def synthesize_and_notify(self, text: str) -> str:
        """
        Synthesize text and notify Ableton.
        
        Args:
            text: Text to synthesize
            
        Returns:
            Path to TTS audio file
        """
        if not text:
            raise ValidationError("text is required")
        
        try:
            path = tts_and_notify_live(text)
            self.logger.info(f"Generated TTS and notified Ableton: {path}")
            return path
            
        except Exception as e:
            self.logger.error(f"TTS and notify failed: {e}")
            raise

