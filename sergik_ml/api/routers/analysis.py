"""
Analysis Router

Audio analysis endpoints.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Depends
from pathlib import Path
import tempfile
import os
import logging

from ...api.dependencies import get_analysis_service
from ...services.analysis_service import AnalysisService
from ...utils.errors import AnalysisError, FileNotFoundError, ValidationError as SergikValidationError
from ...schemas import AnalysisPresets

router = APIRouter(prefix="/analyze", tags=["analysis"])
logger = logging.getLogger(__name__)


@router.post("/upload")
async def analyze_upload(
    file: UploadFile = File(...),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """
    Upload and analyze an audio file.
    
    Accepts WAV, MP3, FLAC, AIF files.
    Returns BPM, key, energy, MusicBrainz data, and SERGIK DNA match.
    """
    tmp_path = None
    try:
        # Save uploaded file to temp location
        suffix = Path(file.filename).suffix if file.filename else '.wav'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Run analysis
        result = analysis_service.analyze_audio(file_path=tmp_path)
        
        return result
        
    except SergikValidationError as e:
        logger.error(f"Audio analysis validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        logger.error(f"Audio file not found: {e}", exc_info=True)
        raise HTTPException(status_code=404, detail=str(e))
    except AnalysisError as e:
        logger.error(f"Audio analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup temp file {tmp_path}: {cleanup_error}")


@router.post("/url")
async def analyze_url(
    url: str = Query(..., description="URL to YouTube, SoundCloud, or direct audio file"),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """
    Download audio from URL and analyze it.
    
    Supports YouTube, SoundCloud, and direct audio URLs.
    Uses yt-dlp for extraction.
    """
    try:
        result = analysis_service.analyze_audio(url=url)
        return result
    except SergikValidationError as e:
        logger.error(f"Audio analysis URL validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except AnalysisError as e:
        logger.error(f"Audio analysis URL failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/path")
async def analyze_path(
    file_path: str = Query(..., description="Path to local audio file"),
    analysis_service: AnalysisService = Depends(get_analysis_service)
):
    """
    Analyze a local audio file by path.
    
    Use this endpoint when the file already exists on the server.
    """
    try:
        if not Path(file_path).exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        result = analysis_service.analyze_audio(file_path=file_path)
        return result
    except HTTPException:
        raise
    except SergikValidationError as e:
        logger.error(f"Audio analysis path validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        logger.error(f"Audio file not found: {e}", exc_info=True)
        raise HTTPException(status_code=404, detail=str(e))
    except AnalysisError as e:
        logger.error(f"Audio analysis path failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/presets")
async def get_analysis_presets():
    """
    Get available presets for analysis parameter dropdowns.
    
    Returns tempo, key, energy, and genre preset options.
    """
    presets = AnalysisPresets()
    return presets.model_dump()

