"""
GPT Voice Service

Routes voice input through SERGIK GPT Actions for intelligent intent understanding
and Ableton Live control.
"""

import logging
import httpx
from typing import Dict, Any, Optional
from pathlib import Path

from .base import BaseService
from ..pipelines.voice_pipeline import stt_transcribe, tts_speak
from ..config import CFG
from ..utils.errors import ServiceError

logger = logging.getLogger(__name__)


class GPTVoiceService(BaseService):
    """
    Service for GPT-powered voice control.
    
    Pipeline:
    1. STT: Transcribe voice to text
    2. GPT: Send text to GPT Actions API for intent understanding
    3. Parse: Extract commands from GPT response
    4. Execute: Run Ableton commands
    5. TTS: Generate spoken response
    """
    
    def __init__(self):
        super().__init__()
        self.api_base_url = CFG.api_base_url or "http://localhost:8000"
        self.timeout = 30.0
    
    def process_voice_with_gpt(
        self,
        wav_path: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process voice recording using GPT for intent understanding.
        
        Args:
            wav_path: Path to recorded audio file
            context: Optional context (session state, previous commands)
            
        Returns:
            {
                "text": str,           # Transcribed text
                "gpt_response": dict,  # GPT Actions response
                "commands": list,       # Extracted commands
                "tts": str,            # Response text for TTS
                "confidence": float    # Confidence score
            }
        """
        if not wav_path or not Path(wav_path).exists():
            raise ServiceError(f"Voice file not found: {wav_path}")
        
        try:
            # Step 1: Transcribe voice to text
            text = stt_transcribe(wav_path)
            logger.info(f"STT result: {text}")
            
            if not text or len(text.strip()) < 3:
                return {
                    "text": text or "",
                    "gpt_response": {},
                    "commands": [],
                    "tts": "I didn't catch that. Please try again.",
                    "confidence": 0.0
                }
            
            # Step 2: Send to GPT Actions API
            gpt_response = self._call_gpt_actions(text, context)
            
            # Step 3: Parse GPT response to extract commands
            commands = self._extract_commands(gpt_response)
            
            # Step 4: Generate TTS response
            tts_text = self._generate_tts_response(gpt_response, commands)
            
            return {
                "text": text,
                "gpt_response": gpt_response,
                "commands": commands,
                "tts": tts_text,
                "confidence": 0.9 if commands else 0.5
            }
            
        except Exception as e:
            logger.error(f"GPT voice processing failed: {e}", exc_info=True)
            raise ServiceError(f"Voice processing failed: {e}")
    
    def _call_gpt_actions(
        self,
        text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Call GPT Actions API to understand intent.
        
        Tries multiple endpoints:
        1. /live/command - For Ableton Live control
        2. /gpt/generate - For music generation
        3. /gpt/drums - For drum generation
        """
        # Determine which endpoint to use
        text_lower = text.lower()
        
        # Check if it's an Ableton control command
        control_keywords = [
            "play", "stop", "tempo", "bpm", "track", "mute", "solo",
            "volume", "pan", "scene", "clip", "device", "create", "delete",
            "fire", "arm", "record"
        ]
        
        generation_keywords = [
            "generate", "create", "make", "build", "chord", "bass", "arp",
            "melody", "pattern"
        ]
        
        drum_keywords = ["drum", "beat", "kick", "snare", "hat", "percussion"]
        
        # Try Ableton command first
        if any(kw in text_lower for kw in control_keywords):
            return self._call_ableton_command(text)
        
        # Try drum generation
        if any(kw in text_lower for kw in drum_keywords):
            return self._call_gpt_drums(text)
        
        # Try general generation
        if any(kw in text_lower for kw in generation_keywords):
            return self._call_gpt_generate(text)
        
        # Default: try Ableton command (most common)
        return self._call_ableton_command(text)
    
    def _call_ableton_command(self, text: str) -> Dict[str, Any]:
        """Call /live/command endpoint for Ableton control."""
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    f"{self.api_base_url}/live/command",
                    json={"prompt": text}
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"GPT Ableton command failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def _call_gpt_generate(self, text: str) -> Dict[str, Any]:
        """Call /gpt/generate endpoint for music generation."""
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    f"{self.api_base_url}/gpt/generate",
                    json={"prompt": text}
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"GPT generate failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def _call_gpt_drums(self, text: str) -> Dict[str, Any]:
        """Call /gpt/drums endpoint for drum generation."""
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    f"{self.api_base_url}/gpt/drums",
                    json={"prompt": text}
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"GPT drums failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def _extract_commands(self, gpt_response: Dict[str, Any]) -> list:
        """
        Extract executable commands from GPT response.
        
        GPT responses can contain:
        - Direct actions in result.actions
        - Descriptions that need parsing
        - Status updates
        """
        commands = []
        
        if not gpt_response or gpt_response.get("status") == "error":
            return commands
        
        # Check for actions array
        result = gpt_response.get("result", {})
        if isinstance(result, dict):
            actions = result.get("actions", [])
            if actions:
                commands.extend(actions)
        
        # Check for direct command in result
        if "command" in result:
            commands.append({
                "action": result.get("command"),
                "args": result.get("result", {})
            })
        
        # Check for action suggestions
        if "suggestions" in result:
            for suggestion in result.get("suggestions", []):
                action = suggestion.get("action")
                if action:
                    commands.append(action)
        
        return commands
    
    def _generate_tts_response(
        self,
        gpt_response: Dict[str, Any],
        commands: list
    ) -> str:
        """Generate TTS response text from GPT response."""
        if gpt_response.get("status") == "error":
            error = gpt_response.get("error", "Unknown error")
            return f"Sorry, I encountered an error: {error}"
        
        # Check for description in response
        result = gpt_response.get("result", {})
        description = result.get("description")
        if description:
            return description
        
        # Check for status message
        if commands:
            action_count = len(commands)
            if action_count == 1:
                action = commands[0].get("action", "command")
                return f"Executed {action}."
            else:
                return f"Executed {action_count} commands."
        
        # Default response
        return "Done."

