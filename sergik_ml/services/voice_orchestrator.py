"""
Voice Control Orchestrator

Coordinates the full voice control pipeline:
Voice → STT → GPT → Command Execution → TTS → Ableton
"""

import logging
from typing import Dict, Any, Optional, List
from pathlib import Path

from .base import BaseService
from .gpt_voice_service import GPTVoiceService
from .ableton_service import AbletonService
from .voice_service import VoiceService
from ..utils.errors import ServiceError, ValidationError
from ..pipelines.voice_pipeline import tts_and_notify_live

logger = logging.getLogger(__name__)


class VoiceOrchestrator(BaseService):
    """
    Orchestrates the complete voice control pipeline.
    
    Pipeline:
    1. Voice Input (WAV file)
    2. STT (Speech-to-Text)
    3. GPT Actions (Intent understanding)
    4. Command Extraction
    5. Command Execution (Ableton Live)
    6. TTS Response (Confirmation)
    """
    
    def __init__(
        self,
        gpt_voice_service: GPTVoiceService,
        ableton_service: AbletonService,
        voice_service: VoiceService
    ):
        super().__init__()
        self.gpt_voice_service = gpt_voice_service
        self.ableton_service = ableton_service
        self.voice_service = voice_service
        self.session_context: Dict[str, Any] = {}
    
    def process_voice_command(
        self,
        wav_path: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process voice command through full pipeline.
        
        Args:
            wav_path: Path to voice recording
            context: Optional session context
            
        Returns:
            {
                "text": str,              # Transcribed text
                "gpt_response": dict,     # GPT Actions response
                "commands": list,         # Extracted commands
                "executed": list,         # Successfully executed commands
                "errors": list,           # Command execution errors
                "tts_path": str,          # Path to TTS audio file
                "summary": str            # Human-readable summary
            }
        """
        if not wav_path or not Path(wav_path).exists():
            raise ValidationError(f"Voice file not found: {wav_path}")
        
        # Merge context
        full_context = {**self.session_context, **(context or {})}
        
        try:
            # Step 1-3: Process voice with GPT
            gpt_result = self.gpt_voice_service.process_voice_with_gpt(
                wav_path,
                context=full_context
            )
            
            text = gpt_result.get("text", "")
            commands = gpt_result.get("commands", [])
            gpt_response = gpt_result.get("gpt_response", {})
            
            # Step 4-5: Execute commands
            executed = []
            errors = []
            
            for cmd in commands:
                try:
                    result = self._execute_command(cmd)
                    executed.append({
                        "command": cmd,
                        "result": result
                    })
                except Exception as e:
                    error_msg = str(e)
                    errors.append({
                        "command": cmd,
                        "error": error_msg
                    })
                    logger.error(f"Command execution failed: {cmd} - {error_msg}")
            
            # Step 6: Generate TTS response
            tts_text = self._generate_summary_tts(
                gpt_result.get("tts", ""),
                executed,
                errors
            )
            tts_path = tts_and_notify_live(tts_text)
            
            # Update session context
            self._update_context(executed, errors)
            
            # Generate summary
            summary = self._generate_summary(executed, errors, tts_text)
            
            return {
                "text": text,
                "gpt_response": gpt_response,
                "commands": commands,
                "executed": executed,
                "errors": errors,
                "tts_path": tts_path,
                "summary": summary
            }
            
        except Exception as e:
            logger.error(f"Voice orchestration failed: {e}", exc_info=True)
            error_tts = f"Sorry, I encountered an error: {str(e)}"
            tts_path = tts_and_notify_live(error_tts)
            raise ServiceError(f"Voice orchestration failed: {e}")
    
    def _execute_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a single command.
        
        Commands can be:
        - Ableton Live commands (live.*)
        - Generation commands (gpt.generate, gpt.drums)
        - Other actions
        """
        action = command.get("action")
        args = command.get("args", {})
        
        if not action:
            raise ValueError("Command missing action")
        
        # Route to appropriate service
        if action.startswith("live."):
            # Ableton Live command
            return self.ableton_service.execute_command(action, args)
        
        elif action.startswith("gpt."):
            # GPT generation command (already handled by GPT service)
            return {"status": "ok", "message": "Generation completed"}
        
        else:
            # Unknown command
            raise ValueError(f"Unknown command type: {action}")
    
    def _generate_summary_tts(
        self,
        base_tts: str,
        executed: List[Dict[str, Any]],
        errors: List[Dict[str, Any]]
    ) -> str:
        """Generate TTS text summarizing execution results."""
        if errors:
            if executed:
                return f"{base_tts} {len(executed)} commands succeeded, but {len(errors)} failed."
            else:
                return f"Sorry, all commands failed. {base_tts}"
        
        if executed:
            if len(executed) == 1:
                return base_tts or "Command executed successfully."
            else:
                return f"{base_tts} All {len(executed)} commands executed successfully."
        
        return base_tts or "Done."
    
    def _generate_summary(
        self,
        executed: List[Dict[str, Any]],
        errors: List[Dict[str, Any]],
        tts_text: str
    ) -> str:
        """Generate human-readable summary."""
        parts = []
        
        if executed:
            parts.append(f"✅ Executed {len(executed)} command(s)")
        
        if errors:
            parts.append(f"❌ {len(errors)} error(s)")
        
        if tts_text:
            parts.append(f"💬 Response: {tts_text}")
        
        return " | ".join(parts) if parts else "No actions taken"
    
    def _update_context(
        self,
        executed: List[Dict[str, Any]],
        errors: List[Dict[str, Any]]
    ) -> None:
        """Update session context with execution results."""
        # Store recent commands
        if "recent_commands" not in self.session_context:
            self.session_context["recent_commands"] = []
        
        for cmd_result in executed:
            self.session_context["recent_commands"].append(cmd_result)
        
        # Keep only last 10 commands
        if len(self.session_context["recent_commands"]) > 10:
            self.session_context["recent_commands"] = \
                self.session_context["recent_commands"][-10:]
    
    def get_context(self) -> Dict[str, Any]:
        """Get current session context."""
        return self.session_context.copy()
    
    def clear_context(self) -> None:
        """Clear session context."""
        self.session_context = {}

