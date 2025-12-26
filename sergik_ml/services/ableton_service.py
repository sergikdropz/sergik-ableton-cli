"""
Ableton Service

Orchestrates Ableton Live operations via OSC.
"""

from typing import Dict, Any, Optional
import logging

from .base import BaseService
from ..connectors.ableton_osc import (
    osc_send,
    osc_status,
    osc_error,
)
from ..utils.errors import AbletonConnectionError

logger = logging.getLogger(__name__)

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


class AbletonService(BaseService):
    """Service for Ableton Live operations."""
    
    def execute_command(self, cmd: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute Ableton Live command via OSC.
        
        Args:
            cmd: Command identifier (e.g., "live.set_tempo")
            args: Command arguments
            
        Returns:
            Result dictionary
            
        Raises:
            AbletonConnectionError: If OSC communication fails
        """
        if cmd not in LIVE_OSC_MAP:
            raise ValueError(f"Unknown Ableton command: {cmd}")
        
        try:
            address = LIVE_OSC_MAP[cmd]
            success = osc_send(address, args)
            
            if not success:
                raise AbletonConnectionError(f"Failed to send OSC message: {address}")
            
            self.logger.info(f"Executed Ableton command: {cmd}")
            return {
                "routed": "ableton_osc",
                "address": address,
                "args": args,
                "status": "ok"
            }
            
        except Exception as e:
            self.logger.error(f"Ableton command failed: {cmd} - {e}")
            osc_error(str(e), cmd)
            raise AbletonConnectionError(f"Command execution failed: {e}")
    
    def set_tempo(self, bpm: float) -> Dict[str, Any]:
        """
        Set Ableton tempo.
        
        Args:
            bpm: Tempo in BPM
            
        Returns:
            Result dictionary
        """
        return self.execute_command("live.set_tempo", {"bpm": bpm})
    
    def play(self) -> Dict[str, Any]:
        """
        Start Ableton playback.
        
        Returns:
            Result dictionary
        """
        return self.execute_command("live.play", {})
    
    def stop(self) -> Dict[str, Any]:
        """
        Stop Ableton playback.
        
        Returns:
            Result dictionary
        """
        return self.execute_command("live.stop", {})
    
    def fire_clip(self, track: int, clip: int) -> Dict[str, Any]:
        """
        Fire a clip in Ableton.
        
        Args:
            track: Track index
            clip: Clip slot index
            
        Returns:
            Result dictionary
        """
        return self.execute_command("live.fire_clip", {
            "track": track,
            "clip": clip
        })

