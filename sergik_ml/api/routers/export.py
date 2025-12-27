"""
Export Router

Track and clip export endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging

from ...api.dependencies import get_ableton_service
from ...services.ableton_service import AbletonService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/export", tags=["export"])


class ExportRequest(BaseModel):
    """Export request"""
    track_index: Optional[int] = None
    clip_slot: Optional[int] = None
    format: str = "wav"  # wav, mp3, aif
    location: str
    export_stems: bool = False


class BatchExportRequest(BaseModel):
    """Batch export request"""
    format: str = "wav"
    location: str
    export_stems: bool = False
    tracks: List[int] = []  # Empty = all tracks


@router.post("/track")
async def export_track(
    request: ExportRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Export track or clip to audio file
    
    Args:
        request: Export request
        ableton_service: Ableton service
        
    Returns:
        Export result with file path
    """
    try:
        result = await ableton_service.export_track(
            track_index=request.track_index,
            clip_slot=request.clip_slot,
            format=request.format,
            location=request.location,
            export_stems=request.export_stems
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Export track failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def batch_export(
    request: BatchExportRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Batch export multiple tracks/clips
    
    Args:
        request: Batch export request
        ableton_service: Ableton service
        
    Returns:
        Batch export result
    """
    try:
        result = await ableton_service.batch_export(
            format=request.format,
            location=request.location,
            export_stems=request.export_stems,
            tracks=request.tracks
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Batch export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stems")
async def export_stems(
    request: ExportRequest,
    ableton_service: AbletonService = Depends(get_ableton_service)
):
    """
    Export track as individual stems
    
    Args:
        request: Export request
        ableton_service: Ableton service
        
    Returns:
        Export result with stem paths
    """
    try:
        result = await ableton_service.export_stems(
            track_index=request.track_index,
            format=request.format,
            location=request.location
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Export stems failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

