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
from ..core.logging import get_logger, get_correlation_id, get_request_context

logger = get_logger(__name__)

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
    # Transform operations
    "live.quantize_clip": "/scp/quantize_clip",
    "live.transpose_clip": "/scp/transpose_clip",
    "live.adjust_velocity": "/scp/adjust_velocity",
    "live.make_legato": "/scp/make_legato",
    "live.remove_overlaps": "/scp/remove_overlaps",
    "live.apply_fade": "/scp/apply_fade",
    "live.normalize_audio": "/scp/normalize_audio",
    "live.time_stretch": "/scp/time_stretch",
    "live.pitch_shift": "/scp/pitch_shift",
    "live.time_shift": "/scp/time_shift",
    # Export operations
    "live.export_track": "/scp/export_track",
    "live.batch_export": "/scp/batch_export",
    "live.export_stems": "/scp/export_stems",
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
        """
        Quantize MIDI notes in clip using OSC/LOM.
        
        Args:
            track_index: Track index (0-based)
            clip_slot: Clip slot index (0-based)
            grid: Grid size (e.g., "1/32", "1/16", "1/8", "1/4", "1/2", "1", "triplet", "swing")
            strength: Quantize strength (0-100)
            
        Returns:
            Result dictionary with status
        """
        corr_id = get_correlation_id()
        context = get_request_context() or {}
        
        log_context = {
            "operation": "quantize_clip",
            "track_index": track_index,
            "clip_slot": clip_slot,
            "grid": grid,
            "strength": strength,
            "correlation_id": corr_id,
            **context
        }
        
        try:
            # Validate inputs
            if not (0 <= strength <= 100):
                raise ValueError(f"Strength must be between 0 and 100, got {strength}")
            
            valid_grids = ["1/32", "1/16", "1/8", "1/4", "1/2", "1", "triplet", "swing"]
            if grid not in valid_grids:
                raise ValueError(f"Grid must be one of {valid_grids}, got {grid}")
            
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot,
                "grid": grid,
                "strength": strength
            }
            
            logger.info("Executing quantize operation", extra=log_context)
            result = self.execute_command("live.quantize_clip", args)
            
            logger.info("Quantize operation successful", extra={**log_context, "result": result.get("status")})
            return {
                "status": "ok",
                "message": f"Quantized to {grid} grid at {strength}% strength",
                "correlation_id": corr_id,
                **result
            }
        except ValueError as e:
            logger.warning(f"Quantize validation error: {e}", extra=log_context)
            raise
        except AbletonConnectionError as e:
            logger.error(f"Quantize OSC connection error: {e}", exc_info=True, extra=log_context)
            raise
        except Exception as e:
            logger.error(f"Quantize error: {e}", exc_info=True, extra=log_context)
            return {"status": "error", "message": str(e), "correlation_id": corr_id}
    
    async def transpose_clip(self, track_index: int, clip_slot: int, semitones: int) -> Dict[str, Any]:
        """
        Transpose MIDI notes in clip.
        
        Args:
            track_index: Track index (0-based)
            clip_slot: Clip slot index (0-based)
            semitones: Number of semitones to transpose (positive=up, negative=down)
            
        Returns:
            Result dictionary with status
        """
        try:
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot,
                "semitones": semitones
            }
            result = self.execute_command("live.transpose_clip", args)
            self.logger.info(f"Transpose clip: track={track_index}, slot={clip_slot}, semitones={semitones}")
            direction = "up" if semitones > 0 else "down"
            return {
                "status": "ok",
                "message": f"Transposed {abs(semitones)} semitones {direction}",
                **result
            }
        except Exception as e:
            self.logger.error(f"Transpose error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def adjust_velocity(self, track_index: int, clip_slot: int, operation: str, value: float) -> Dict[str, Any]:
        """
        Adjust MIDI velocity.
        
        Args:
            track_index: Track index (0-based)
            clip_slot: Clip slot index (0-based)
            operation: Operation type ("set", "scale", "randomize")
            value: Value for operation (0-127 for set, 0-2.0 for scale, 0-100 for randomize)
            
        Returns:
            Result dictionary with status
        """
        try:
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot,
                "operation": operation,
                "value": value
            }
            result = self.execute_command("live.adjust_velocity", args)
            self.logger.info(f"Adjust velocity: track={track_index}, slot={clip_slot}, op={operation}, value={value}")
            return {
                "status": "ok",
                "message": f"Velocity {operation} applied with value {value}",
                **result
            }
        except Exception as e:
            self.logger.error(f"Velocity adjustment error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def make_legato(self, track_index: int, clip_slot: int) -> Dict[str, Any]:
        """
        Make MIDI notes legato (extend end times to next note start).
        
        Args:
            track_index: Track index (0-based)
            clip_slot: Clip slot index (0-based)
            
        Returns:
            Result dictionary with status
        """
        try:
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot
            }
            result = self.execute_command("live.make_legato", args)
            self.logger.info(f"Make legato: track={track_index}, slot={clip_slot}")
            return {
                "status": "ok",
                "message": "Notes made legato",
                **result
            }
        except Exception as e:
            self.logger.error(f"Legato error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def remove_overlaps(self, track_index: int, clip_slot: int) -> Dict[str, Any]:
        """
        Remove overlapping MIDI notes (trim earlier note to start of later note).
        
        Args:
            track_index: Track index (0-based)
            clip_slot: Clip slot index (0-based)
            
        Returns:
            Result dictionary with status
        """
        try:
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot
            }
            result = self.execute_command("live.remove_overlaps", args)
            self.logger.info(f"Remove overlaps: track={track_index}, slot={clip_slot}")
            return {
                "status": "ok",
                "message": "Overlapping notes removed",
                **result
            }
        except Exception as e:
            self.logger.error(f"Remove overlaps error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def apply_fade(self, track_index: int, clip_slot: int, fade_type: str, duration: float) -> Dict[str, Any]:
        """
        Apply fade in/out to audio clip.
        
        Args:
            track_index: Track index (0-based)
            clip_slot: Clip slot index (0-based)
            fade_type: Fade type ("in", "out", "both")
            duration: Fade duration in seconds
            
        Returns:
            Result dictionary with status
        """
        try:
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot,
                "fade_type": fade_type,
                "duration": duration
            }
            result = self.execute_command("live.apply_fade", args)
            self.logger.info(f"Apply fade: track={track_index}, slot={clip_slot}, type={fade_type}, duration={duration}")
            return {
                "status": "ok",
                "message": f"Fade {fade_type} applied ({duration}s)",
                **result
            }
        except Exception as e:
            self.logger.error(f"Fade error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def normalize_audio(self, track_index: int, clip_slot: int, target_level: float) -> Dict[str, Any]:
        """
        Normalize audio clip to target level.
        
        Args:
            track_index: Track index (0-based)
            clip_slot: Clip slot index (0-based)
            target_level: Target level in dB (typically -0.1 to -3.0)
            
        Returns:
            Result dictionary with status
        """
        try:
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot,
                "target_level": target_level
            }
            result = self.execute_command("live.normalize_audio", args)
            self.logger.info(f"Normalize audio: track={track_index}, slot={clip_slot}, level={target_level}")
            return {
                "status": "ok",
                "message": f"Audio normalized to {target_level} dB",
                **result
            }
        except Exception as e:
            self.logger.error(f"Normalize error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def time_stretch(self, track_index: int, clip_slot: int, factor: float) -> Dict[str, Any]:
        """
        Time stretch audio clip by factor.
        
        Args:
            track_index: Track index (0-based)
            clip_slot: Clip slot index (0-based)
            factor: Stretch factor (0.5 = half speed, 2.0 = double speed)
            
        Returns:
            Result dictionary with status
        """
        try:
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot,
                "factor": factor
            }
            result = self.execute_command("live.time_stretch", args)
            self.logger.info(f"Time stretch: track={track_index}, slot={clip_slot}, factor={factor}")
            return {
                "status": "ok",
                "message": f"Time stretched by {factor}x",
                **result
            }
        except Exception as e:
            self.logger.error(f"Time stretch error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def pitch_shift(self, track_index: int, clip_slot: int, semitones: int) -> Dict[str, Any]:
        """
        Pitch shift audio clip.
        
        Args:
            track_index: Track index (0-based)
            clip_slot: Clip slot index (0-based)
            semitones: Number of semitones to shift (positive=up, negative=down)
            
        Returns:
            Result dictionary with status
        """
        try:
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot,
                "semitones": semitones
            }
            result = self.execute_command("live.pitch_shift", args)
            self.logger.info(f"Pitch shift: track={track_index}, slot={clip_slot}, semitones={semitones}")
            direction = "up" if semitones > 0 else "down"
            return {
                "status": "ok",
                "message": f"Pitch shifted {abs(semitones)} semitones {direction}",
                **result
            }
        except Exception as e:
            self.logger.error(f"Pitch shift error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def time_shift(self, track_index: int, clip_slot: int, direction: str, amount: float) -> Dict[str, Any]:
        """
        Time shift clip (move left or right in time).
        
        Args:
            track_index: Track index (0-based)
            clip_slot: Clip slot index (0-based)
            direction: Direction ("left" or "right")
            amount: Amount to shift in beats
            
        Returns:
            Result dictionary with status
        """
        try:
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot,
                "direction": direction,
                "amount": amount
            }
            result = self.execute_command("live.time_shift", args)
            self.logger.info(f"Time shift: track={track_index}, slot={clip_slot}, direction={direction}, amount={amount}")
            return {
                "status": "ok",
                "message": f"Time shifted {direction} by {amount} beats",
                **result
            }
        except Exception as e:
            self.logger.error(f"Time shift error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def export_track(self, track_index: Optional[int], clip_slot: Optional[int], format: str, location: str, export_stems: bool = False) -> Dict[str, Any]:
        """
        Export track or clip to file.
        
        Args:
            track_index: Track index (None for master export)
            clip_slot: Clip slot index (None for track export)
            format: Export format ("wav", "aiff", "mp3")
            location: Export directory path
            export_stems: Whether to export stems (for track export)
            
        Returns:
            Result dictionary with file path
        """
        try:
            args = {
                "track_index": track_index,
                "clip_slot": clip_slot,
                "format": format,
                "location": location,
                "export_stems": export_stems
            }
            result = self.execute_command("live.export_track", args)
            self.logger.info(f"Export track: track={track_index}, slot={clip_slot}, format={format}, location={location}")
            export_type = "clip" if clip_slot is not None else "track"
            return {
                "status": "ok",
                "message": f"{export_type.capitalize()} export queued",
                "file_path": f"{location}/export.{format}",
                **result
            }
        except Exception as e:
            self.logger.error(f"Export error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def batch_export(self, format: str, location: str, export_stems: bool, tracks: List[int]) -> Dict[str, Any]:
        """
        Batch export multiple tracks.
        
        Args:
            format: Export format ("wav", "aiff", "mp3")
            location: Export directory path
            export_stems: Whether to export stems
            tracks: List of track indices to export
            
        Returns:
            Result dictionary with export count
        """
        try:
            args = {
                "format": format,
                "location": location,
                "export_stems": export_stems,
                "tracks": tracks
            }
            result = self.execute_command("live.batch_export", args)
            self.logger.info(f"Batch export: format={format}, location={location}, tracks={tracks}")
            return {
                "status": "ok",
                "message": f"Batch export queued for {len(tracks)} tracks",
                "files_exported": len(tracks),
                **result
            }
        except Exception as e:
            self.logger.error(f"Batch export error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    async def export_stems(self, track_index: int, format: str, location: str) -> Dict[str, Any]:
        """
        Export track as individual stems (one file per device/group).
        
        Args:
            track_index: Track index (0-based)
            format: Export format ("wav", "aiff", "mp3")
            location: Export directory path
            
        Returns:
            Result dictionary with stem paths
        """
        try:
            args = {
                "track_index": track_index,
                "format": format,
                "location": location
            }
            result = self.execute_command("live.export_stems", args)
            self.logger.info(f"Export stems: track={track_index}, format={format}, location={location}")
            return {
                "status": "ok",
                "message": "Stem export queued",
                "stems": [],
                **result
            }
        except Exception as e:
            self.logger.error(f"Stem export error: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
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

