"""
Files Router

File serving endpoints for generated media.
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
import logging
import os
from pathlib import Path

router = APIRouter(prefix="/files", tags=["files"])
logger = logging.getLogger(__name__)


@router.get("/audio")
def serve_audio_file(
    path: str = Query(..., description="Path to audio file to serve")
):
    """
    Serve generated audio files.
    
    Security: Only serves files from allowed directories (artifacts/generated_drums).
    """
    try:
        # Normalize and validate path
        file_path = Path(path).resolve()
        
        # Security: Only allow files from artifacts/generated_drums
        # Handle both relative and absolute paths
        cwd = Path(os.getcwd())
        allowed_dirs = [
            (cwd / "artifacts" / "generated_drums").resolve(),
            Path("artifacts/generated_drums").resolve(),
        ]
        
        # Normalize file path
        if not file_path.is_absolute():
            file_path = (cwd / file_path).resolve()
        else:
            file_path = file_path.resolve()
        
        # Check if file is in allowed directory
        is_allowed = False
        for allowed_dir in allowed_dirs:
            try:
                # Python 3.9+ method
                if hasattr(file_path, 'is_relative_to'):
                    if file_path.is_relative_to(allowed_dir):
                        is_allowed = True
                        break
                else:
                    # Python < 3.9 compatibility
                    try:
                        file_path.relative_to(allowed_dir)
                        is_allowed = True
                        break
                    except ValueError:
                        continue
            except (ValueError, AttributeError):
                continue
        
        if not is_allowed:
            raise HTTPException(
                status_code=403,
                detail="File path not allowed. Only files from artifacts/generated_drums can be served."
            )
        
        # Check if file exists
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Audio file not found: {path}")
        
        # Check if it's an audio file
        audio_extensions = {".wav", ".aif", ".aiff", ".mp3", ".flac", ".ogg"}
        if file_path.suffix.lower() not in audio_extensions:
            raise HTTPException(status_code=400, detail="File is not an audio file")
        
        # Return file
        return FileResponse(
            path=str(file_path),
            media_type="audio/wav" if file_path.suffix.lower() == ".wav" else "audio/mpeg",
            filename=file_path.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to serve audio file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to serve audio file: {str(e)}")

