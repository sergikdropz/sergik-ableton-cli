"""
Transform Router

MIDI and audio transformation endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
import logging
import uuid

from ...api.dependencies import get_ableton_service
from ...services.ableton_service import AbletonService
from ...core.logging import set_correlation_id, set_request_context, get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/transform", tags=["transform"])


class TransformRequest(BaseModel):
    """Base transform request"""
    track_index: int
    clip_slot: Optional[int] = None


class QuantizeRequest(TransformRequest):
    """Quantize request"""
    grid: str = "16th"  # 32nd, 16th, 8th, 4th, 2nd, whole, triplet, swing
    strength: int = 100  # 0-100


class TransposeRequest(TransformRequest):
    """Transpose request"""
    semitones: int  # Positive = up, negative = down


class VelocityRequest(TransformRequest):
    """Velocity adjustment request"""
    operation: str  # set, scale, randomize
    value: float  # Value for operation


class FadeRequest(TransformRequest):
    """Fade request"""
    type: str  # in, out
    duration: float  # Duration in seconds


class NormalizeRequest(TransformRequest):
    """Normalize request"""
    target_level: float = -0.1  # Target level in dB


class TimeStretchRequest(TransformRequest):
    """Time stretch request"""
    factor: float  # 1.0 = no change, 2.0 = double speed


class PitchShiftRequest(TransformRequest):
    """Pitch shift request"""
    semitones: int  # Positive = up, negative = down


class TimeShiftRequest(TransformRequest):
    """Time shift request"""
    direction: str  # "left" or "right"
    amount: float = 0.25  # Amount to shift in beats


@router.post("/quantize")
async def quantize(
    request: QuantizeRequest,
    ableton_service: AbletonService = Depends(get_ableton_service),
    http_request: Request = None
):
    """
    Quantize MIDI notes
    
    Args:
        request: Quantize request with grid and strength
        ableton_service: Ableton service
        http_request: HTTP request for context
        
    Returns:
        Operation result
    """
    corr_id = str(uuid.uuid4())
    set_correlation_id(corr_id)
    
    context = {
        "operation": "quantize",
        "track_index": request.track_index,
        "clip_slot": request.clip_slot or 0,
        "grid": request.grid,
        "strength": request.strength
    }
    set_request_context(context)
    
    try:
        logger.info("Quantizing MIDI notes", extra=context)
        
        result = await ableton_service.quantize_clip(
            track_index=request.track_index,
            clip_slot=request.clip_slot or 0,
            grid=request.grid,
            strength=request.strength
        )
        
        logger.info("Quantize successful", extra={"result_status": result.get("status")})
        return {"status": "ok", "result": result, "correlation_id": corr_id}
    except ValueError as e:
        logger.warning(f"Quantize validation error: {e}", extra=context)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Quantize failed: {e}", exc_info=True, extra=context)
        raise HTTPException(status_code=500, detail=f"Quantize operation failed: {str(e)}")


@router.post("/transpose")
async def transpose(
    request: TransposeRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Transpose MIDI notes
    
    Args:
        request: Transpose request with semitones
        ableton_service: Ableton service
        
    Returns:
        Operation result
    """
    try:
        result = await ableton_service.transpose_clip(
            track_index=request.track_index,
            clip_slot=request.clip_slot or 0,
            semitones=request.semitones
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Transpose failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/velocity")
async def adjust_velocity(
    request: VelocityRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Adjust MIDI velocity
    
    Args:
        request: Velocity request with operation and value
        ableton_service: Ableton service
        
    Returns:
        Operation result
    """
    try:
        result = await ableton_service.adjust_velocity(
            track_index=request.track_index,
            clip_slot=request.clip_slot or 0,
            operation=request.operation,
            value=request.value
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Velocity adjustment failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/legato")
async def make_legato(
    request: TransformRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Make MIDI notes legato (remove gaps)
    
    Args:
        request: Transform request
        ableton_service: Ableton service
        
    Returns:
        Operation result
    """
    try:
        result = await ableton_service.make_legato(
            track_index=request.track_index,
            clip_slot=request.clip_slot or 0
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Make legato failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove_overlaps")
async def remove_overlaps(
    request: TransformRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Remove overlapping MIDI notes
    
    Args:
        request: Transform request
        ableton_service: Ableton service
        
    Returns:
        Operation result
    """
    try:
        result = await ableton_service.remove_overlaps(
            track_index=request.track_index,
            clip_slot=request.clip_slot or 0
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Remove overlaps failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fade")
async def fade(
    request: FadeRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Apply fade in/out to audio
    
    Args:
        request: Fade request with type and duration
        ableton_service: Ableton service
        
    Returns:
        Operation result
    """
    try:
        result = await ableton_service.apply_fade(
            track_index=request.track_index,
            clip_slot=request.clip_slot or 0,
            fade_type=request.type,
            duration=request.duration
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Fade failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/normalize")
async def normalize(
    request: NormalizeRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Normalize audio
    
    Args:
        request: Normalize request with target level
        ableton_service: Ableton service
        
    Returns:
        Operation result
    """
    try:
        result = await ableton_service.normalize_audio(
            track_index=request.track_index,
            clip_slot=request.clip_slot or 0,
            target_level=request.target_level
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Normalize failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/time_stretch")
async def time_stretch(
    request: TimeStretchRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Time stretch audio
    
    Args:
        request: Time stretch request with factor
        ableton_service: Ableton service
        
    Returns:
        Operation result
    """
    try:
        result = await ableton_service.time_stretch(
            track_index=request.track_index,
            clip_slot=request.clip_slot or 0,
            factor=request.factor
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Time stretch failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pitch_shift")
async def pitch_shift(
    request: PitchShiftRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Pitch shift audio
    
    Args:
        request: Pitch shift request with semitones
        ableton_service: Ableton service
        
    Returns:
        Operation result
    """
    try:
        result = await ableton_service.pitch_shift(
            track_index=request.track_index,
            clip_slot=request.clip_slot or 0,
            semitones=request.semitones
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Pitch shift failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/time_shift")
async def time_shift(
    request: TimeShiftRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Time shift clip (move left or right in time)
    
    Args:
        request: Time shift request with direction and amount
        ableton_service: Ableton service
        
    Returns:
        Operation result
    """
    try:
        result = await ableton_service.time_shift(
            track_index=request.track_index,
            clip_slot=request.clip_slot or 0,
            direction=request.direction,
            amount=request.amount
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Time shift failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

