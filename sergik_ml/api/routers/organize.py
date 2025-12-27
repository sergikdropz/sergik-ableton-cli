"""
File Organization API Router

Handles auto-organize workflow for tracks
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pathlib import Path
import shutil
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/organize", tags=["organize"])


class OrganizeRequest(BaseModel):
    """Request model for organize workflow"""
    source_dirs: List[str]
    target_base: str
    organize_by: List[str]  # ["genre", "bpm", "key"]
    action: str = "copy"  # "copy" or "move"
    dry_run: bool = False


class OrganizeResult(BaseModel):
    """Result model for organize operation"""
    status: str
    files_processed: int
    files_organized: int
    errors: List[str]
    organization_map: Dict[str, str]


def normalize_genre_for_folder(genre: str) -> str:
    """Normalize genre name for folder naming"""
    if not genre:
        return "Unknown"
    # Convert genre codes to readable names
    genre_map = {
        "tech_house": "Tech House",
        "deep_house": "Deep House",
        "hiphop": "Hip-Hop",
        "boom_bap": "Boom Bap",
        "lo_fi": "Lo-Fi",
        "progressive_house": "Progressive House",
        "acid_house": "Acid House",
        "hard_techno": "Hard Techno",
    }
    genre_normalized = genre_map.get(genre, genre.replace("_", " ").title())
    return genre_normalized


def get_bpm_folder(bpm: Optional[int]) -> str:
    """Get BPM range folder name"""
    if not bpm:
        return "Unknown BPM"
    if bpm < 80:
        return "60-79 BPM"
    elif bpm < 100:
        return "80-99 BPM"
    elif bpm < 120:
        return "100-119 BPM"
    elif bpm < 140:
        return "120-139 BPM"
    elif bpm < 160:
        return "140-159 BPM"
    else:
        return "160+ BPM"


def get_key_folder(key: Optional[str]) -> str:
    """Get key folder name"""
    if not key:
        return "Unknown Key"
    # Normalize Camelot notation or standard notation
    if len(key) <= 3:  # Likely Camelot like "8B" or standard like "Cmaj"
        return key
    return "Unknown Key"


def build_target_path(
    base_path: Path,
    organize_by: List[str],
    metadata: Dict[str, Any]
) -> Path:
    """Build target folder path based on organization criteria"""
    path_parts = [base_path]

    for criterion in organize_by:
        if criterion == "genre":
            genre = metadata.get("genre") or metadata.get("style")
            folder = normalize_genre_for_folder(genre)
            path_parts.append(folder)
        elif criterion == "bpm":
            bpm = metadata.get("bpm") or metadata.get("tempo")
            folder = get_bpm_folder(bpm)
            path_parts.append(folder)
        elif criterion == "key":
            key = metadata.get("key")
            folder = get_key_folder(key)
            path_parts.append(folder)
    return Path(*path_parts)


@router.post("/auto-organize", response_model=OrganizeResult)
async def auto_organize(
    request: OrganizeRequest,
    background_tasks: BackgroundTasks
):
    """
    Auto-organize tracks into genre/BPM/key subfolders

    Args:
        request: Organize request with source dirs, target, and criteria
        background_tasks: FastAPI background tasks

    Returns:
        Organization result with statistics
    """
    try:
        from ..stores.sql_store import list_tracks
        from ..pipelines.audio_analysis import analyze_audio

        target_base = Path(request.target_base)
        if not target_base.exists():
            target_base.mkdir(parents=True, exist_ok=True)

        # Get all tracks from database
        all_tracks = list_tracks(limit=10000)

        # Build track metadata map by file path
        track_map = {}
        for track in all_tracks:
            full_path = track.get("full_path")
            if full_path:
                track_map[full_path] = track

        files_processed = 0
        files_organized = 0
        errors = []
        organization_map = {}

        # Process source directories
        for source_dir_str in request.source_dirs:
            source_dir = Path(source_dir_str)
            if not source_dir.exists():
                errors.append(f"Source directory not found: {source_dir}")
                continue

            # Find all audio files
            audio_exts = {".wav", ".aif", ".aiff", ".mp3", ".m4a", ".flac"}
            for audio_file in source_dir.rglob("*"):
                if audio_file.is_file() and audio_file.suffix.lower() in audio_exts:
                    files_processed += 1

                    try:
                        # Get metadata from database or analyze
                        metadata = track_map.get(str(audio_file), {})

                        # If no metadata, try to analyze
                        if not metadata.get("bpm") or not metadata.get("genre"):
                            try:
                                analysis = analyze_audio(str(audio_file))
                                if analysis.get("status") == "ok":
                                    metadata.update(analysis.get("metadata", {}))
                            except Exception as e:
                                logger.warning(f"Could not analyze {audio_file}: {e}")

                        # Build target path
                        target_path = build_target_path(
                            target_base,
                            request.organize_by,
                            metadata
                        )

                        # Create target directory
                        if not request.dry_run:
                            target_path.mkdir(parents=True, exist_ok=True)

                        # Copy or move file
                        target_file = target_path / audio_file.name

                        if not request.dry_run:
                            if request.action == "move":
                                shutil.move(str(audio_file), str(target_file))
                            else:  # copy
                                shutil.copy2(str(audio_file), str(target_file))

                        files_organized += 1
                        organization_map[str(audio_file)] = str(target_file)

                    except Exception as e:
                        error_msg = f"Error processing {audio_file}: {str(e)}"
                        errors.append(error_msg)
                        logger.error(error_msg)

        return OrganizeResult(
            status="success" if not errors else "partial",
            files_processed=files_processed,
            files_organized=files_organized,
            errors=errors,
            organization_map=organization_map
        )

    except Exception as e:
        logger.error(f"Auto-organize failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preview")
async def preview_organization(
    source_dirs: str,
    target_base: str,
    organize_by: str  # Comma-separated: "genre,bpm,key"
):
    """Preview organization without actually moving files"""
    organize_list = [s.strip() for s in organize_by.split(",")]

    request = OrganizeRequest(
        source_dirs=[source_dirs],
        target_base=target_base,
        organize_by=organize_list,
        dry_run=True
    )

    return await auto_organize(request, BackgroundTasks())

