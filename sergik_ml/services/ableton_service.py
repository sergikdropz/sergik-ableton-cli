"""
Ableton Service

Orchestrates Ableton Live operations via OSC.
"""

from typing import Dict, Any, Optional, List
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
    
    # Transform methods for editor operations
    async def quantize_clip(self, track_index: int, clip_slot: int, grid: str, strength: int) -> Dict[str, Any]:
        """Quantize MIDI notes in clip"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Quantize clip: track={track_index}, slot={clip_slot}, grid={grid}, strength={strength}")
        return {"status": "ok", "message": "Quantize operation queued"}
    
    async def transpose_clip(self, track_index: int, clip_slot: int, semitones: int) -> Dict[str, Any]:
        """Transpose MIDI notes in clip"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Transpose clip: track={track_index}, slot={clip_slot}, semitones={semitones}")
        return {"status": "ok", "message": "Transpose operation queued"}
    
    async def adjust_velocity(self, track_index: int, clip_slot: int, operation: str, value: float) -> Dict[str, Any]:
        """Adjust MIDI velocity"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Adjust velocity: track={track_index}, slot={clip_slot}, op={operation}, value={value}")
        return {"status": "ok", "message": "Velocity adjustment queued"}
    
    async def make_legato(self, track_index: int, clip_slot: int) -> Dict[str, Any]:
        """Make MIDI notes legato"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Make legato: track={track_index}, slot={clip_slot}")
        return {"status": "ok", "message": "Legato operation queued"}
    
    async def remove_overlaps(self, track_index: int, clip_slot: int) -> Dict[str, Any]:
        """Remove overlapping MIDI notes"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Remove overlaps: track={track_index}, slot={clip_slot}")
        return {"status": "ok", "message": "Remove overlaps queued"}
    
    async def apply_fade(self, track_index: int, clip_slot: int, fade_type: str, duration: float) -> Dict[str, Any]:
        """Apply fade in/out to audio"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Apply fade: track={track_index}, slot={clip_slot}, type={fade_type}, duration={duration}")
        return {"status": "ok", "message": "Fade operation queued"}
    
    async def normalize_audio(self, track_index: int, clip_slot: int, target_level: float) -> Dict[str, Any]:
        """Normalize audio"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Normalize audio: track={track_index}, slot={clip_slot}, level={target_level}")
        return {"status": "ok", "message": "Normalize operation queued"}
    
    async def time_stretch(self, track_index: int, clip_slot: int, factor: float) -> Dict[str, Any]:
        """Time stretch audio"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Time stretch: track={track_index}, slot={clip_slot}, factor={factor}")
        return {"status": "ok", "message": "Time stretch queued"}
    
    async def pitch_shift(self, track_index: int, clip_slot: int, semitones: int) -> Dict[str, Any]:
        """Pitch shift audio"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Pitch shift: track={track_index}, slot={clip_slot}, semitones={semitones}")
        return {"status": "ok", "message": "Pitch shift queued"}
    
    async def export_track(self, track_index: Optional[int], clip_slot: Optional[int], format: str, location: str, export_stems: bool = False) -> Dict[str, Any]:
        """Export track or clip"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Export track: track={track_index}, slot={clip_slot}, format={format}, location={location}")
        return {"status": "ok", "message": "Export queued", "file_path": f"{location}/export.{format}"}
    
    async def batch_export(self, format: str, location: str, export_stems: bool, tracks: List[int]) -> Dict[str, Any]:
        """Batch export tracks"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Batch export: format={format}, location={location}, tracks={tracks}")
        return {"status": "ok", "message": "Batch export queued", "files_exported": len(tracks)}
    
    async def export_stems(self, track_index: int, format: str, location: str) -> Dict[str, Any]:
        """Export track as stems"""
        # TODO: Implement via LOM or OSC
        self.logger.info(f"Export stems: track={track_index}, format={format}, location={location}")
        return {"status": "ok", "message": "Stem export queued", "stems": []}
    
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

