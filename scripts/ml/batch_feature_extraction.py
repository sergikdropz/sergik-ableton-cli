#!/usr/bin/env python3
"""
SERGIK Batch Feature Extraction Script

Processes all audio files (721 exports + 1,895 iTunes tracks) and extracts
comprehensive features, storing them in the database.

Features:
- Parallel processing for speed
- Progress tracking and resume capability
- Error handling and retry logic
- Skip already-processed files
- MusicBrainz lookup with caching
- SERGIK DNA matching
"""

import sys
import os
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
import time

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from scripts.data_loader import load_exports, load_itunes_library, DATA_DIR
from sergik_ml.features.audio_features import extract_full_features
from sergik_ml.pipelines.audio_analysis import (
    analyze_audio,
    fingerprint_audio,
    lookup_musicbrainz,
    match_sergik_dna,
)
from sergik_ml.stores.sql_store import upsert_track, get_track, init_db

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cache directory for MusicBrainz lookups
CACHE_DIR = Path("data/cache/musicbrainz")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Progress tracking
PROGRESS_FILE = Path("data/analysis/feature_extraction_progress.json")


def get_track_id(file_path: str) -> str:
    """Generate stable track ID from file path."""
    return hashlib.sha1(file_path.encode()).hexdigest()[:12]


def load_progress() -> Dict[str, Any]:
    """Load progress tracking data."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {
        "processed": [],
        "failed": [],
        "skipped": [],
        "started_at": None,
        "last_updated": None,
    }


def save_progress(progress: Dict[str, Any]) -> None:
    """Save progress tracking data."""
    progress["last_updated"] = datetime.now().isoformat()
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)


def get_musicbrainz_cache(fingerprint: str) -> Optional[Dict[str, Any]]:
    """Get cached MusicBrainz data."""
    cache_file = CACHE_DIR / f"{hashlib.md5(fingerprint.encode()).hexdigest()}.json"
    if cache_file.exists():
        with open(cache_file, 'r') as f:
            return json.load(f)
    return None


def save_musicbrainz_cache(fingerprint: str, data: Dict[str, Any]) -> None:
    """Save MusicBrainz data to cache."""
    cache_file = CACHE_DIR / f"{hashlib.md5(fingerprint.encode()).hexdigest()}.json"
    with open(cache_file, 'w') as f:
        json.dump(data, f, indent=2)


def process_single_track(
    file_path: str,
    track_metadata: Optional[Dict[str, Any]] = None,
    skip_existing: bool = True
) -> Dict[str, Any]:
    """
    Process a single audio file and extract all features.
    
    Args:
        file_path: Path to audio file
        track_metadata: Optional metadata from CSV (filename, collaborator, etc.)
        skip_existing: Skip if track already exists in DB
        
    Returns:
        Result dict with status and data
    """
    track_id = get_track_id(file_path)
    
    # Check if already processed
    if skip_existing:
        existing = get_track(track_id)
        if existing and existing.get('bpm') and existing.get('energy'):
            return {
                "status": "skipped",
                "track_id": track_id,
                "reason": "already_processed"
            }
    
    # Check if file exists
    if not os.path.exists(file_path):
        return {
            "status": "error",
            "track_id": track_id,
            "error": "file_not_found"
        }
    
    try:
        # Extract audio features
        logger.info(f"Processing: {Path(file_path).name}")
        features = extract_full_features(file_path)
        
        if not features:
            return {
                "status": "error",
                "track_id": track_id,
                "error": "feature_extraction_failed"
            }
        
        # MusicBrainz lookup (with caching)
        mb_data = None
        try:
            fingerprint = fingerprint_audio(file_path)
            if fingerprint:
                # Check cache first
                mb_data = get_musicbrainz_cache(fingerprint)
                if not mb_data:
                    mb_data = lookup_musicbrainz(fingerprint=fingerprint)
                    if mb_data:
                        save_musicbrainz_cache(fingerprint, mb_data)
        except Exception as e:
            logger.warning(f"MusicBrainz lookup failed for {file_path}: {e}")
        
        # SERGIK DNA matching
        dna_match = match_sergik_dna(features)
        
        # Build track row
        track_row = {
            "track_id": track_id,
            "bpm": features.get("bpm"),
            "key": features.get("key"),
            "energy": features.get("energy"),
            "brightness": features.get("brightness"),
            "lufs": features.get("lufs"),
            "harmonic_ratio": features.get("harmonic_ratio"),
            "percussive_ratio": features.get("percussive_ratio"),
            "stereo_width": features.get("stereo_width"),
            "style_source": "pack" if track_metadata else "itunes",
            "updated_at": datetime.utcnow(),
        }
        
        # Add metadata from CSV if available
        if track_metadata:
            if track_metadata.get("collaborator"):
                track_row["tags"] = json.dumps([track_metadata["collaborator"]])
            if track_metadata.get("filename"):
                track_row["prompt_text"] = track_metadata["filename"]
        
        # Add MusicBrainz data to tags if available
        if mb_data and mb_data.get("genre"):
            tags = track_row.get("tags", [])
            if isinstance(tags, str):
                tags = json.loads(tags) if tags else []
            tags.append(f"genre:{mb_data['genre']}")
            track_row["tags"] = json.dumps(tags)
        
        # Add DNA match score
        if dna_match and dna_match.get("sergik_score"):
            # Store DNA match in structure_json
            track_row["structure_json"] = json.dumps({
                "sergik_dna_score": dna_match["sergik_score"],
                "is_sergik_style": dna_match.get("is_sergik_style", False),
                "match_reasons": dna_match.get("match_reasons", []),
            })
        
        # Store additional features in structure_json
        structure = json.loads(track_row.get("structure_json", "{}") or "{}")
        structure.update({
            "duration": features.get("duration"),
            "sample_rate": features.get("sample_rate"),
            "energy_std": features.get("energy_std"),
            "spectral_rolloff": features.get("spectral_rolloff"),
            "spectral_bandwidth": features.get("spectral_bandwidth"),
            "zero_crossing_rate": features.get("zero_crossing_rate"),
            "mfcc_mean": features.get("mfcc_mean"),
            "mfcc_std": features.get("mfcc_std"),
            "chroma_profile": features.get("chroma_profile"),
        })
        track_row["structure_json"] = json.dumps(structure)
        
        # Upsert to database
        upsert_track(track_row)
        
        return {
            "status": "success",
            "track_id": track_id,
            "bpm": features.get("bpm"),
            "key": features.get("key"),
            "energy": features.get("energy"),
        }
        
    except Exception as e:
        logger.error(f"Error processing {file_path}: {e}")
        return {
            "status": "error",
            "track_id": track_id,
            "error": str(e)
        }


def process_tracks_batch(
    tracks: List[Dict[str, Any]],
    max_workers: int = 4,
    skip_existing: bool = True
) -> Dict[str, Any]:
    """
    Process a batch of tracks in parallel.
    
    Args:
        tracks: List of track dicts with 'path' key
        max_workers: Number of parallel workers
        skip_existing: Skip already-processed tracks
        
    Returns:
        Summary statistics
    """
    progress = load_progress()
    if not progress.get("started_at"):
        progress["started_at"] = datetime.now().isoformat()
    
    results = {
        "success": 0,
        "error": 0,
        "skipped": 0,
        "total": len(tracks),
    }
    
    # Filter out already processed
    processed_set = set(progress.get("processed", []))
    failed_set = set(progress.get("failed", []))
    
    tracks_to_process = []
    for track in tracks:
        file_path = track.get("path") or track.get("full_path")
        if not file_path:
            continue
        
        track_id = get_track_id(file_path)
        if track_id in processed_set:
            results["skipped"] += 1
            continue
        if track_id in failed_set and skip_existing:
            results["skipped"] += 1
            continue
        
        tracks_to_process.append((file_path, track))
    
    logger.info(f"Processing {len(tracks_to_process)} tracks (skipping {results['skipped']} already processed)")
    
    # Process in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(process_single_track, file_path, track_metadata, skip_existing): (file_path, track_metadata)
            for file_path, track_metadata in tracks_to_process
        }
        
        for future in as_completed(futures):
            file_path, track_metadata = futures[future]
            try:
                result = future.result()
                track_id = result.get("track_id")
                
                if result["status"] == "success":
                    results["success"] += 1
                    progress["processed"].append(track_id)
                    logger.info(f"✓ {Path(file_path).name} - BPM: {result.get('bpm')}, Key: {result.get('key')}")
                elif result["status"] == "skipped":
                    results["skipped"] += 1
                else:
                    results["error"] += 1
                    progress["failed"].append(track_id)
                    logger.error(f"✗ {Path(file_path).name} - {result.get('error')}")
                
                # Save progress every 10 tracks
                if (results["success"] + results["error"]) % 10 == 0:
                    save_progress(progress)
                    
            except Exception as e:
                results["error"] += 1
                logger.error(f"Exception processing {file_path}: {e}")
                track_id = get_track_id(file_path)
                progress["failed"].append(track_id)
    
    # Final progress save
    save_progress(progress)
    
    return results


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Batch feature extraction for SERGIK ML"
    )
    parser.add_argument(
        "--source",
        choices=["exports", "itunes", "all"],
        default="all",
        help="Data source to process (default: all)"
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=4,
        help="Number of parallel workers (default: 4)"
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        default=True,
        help="Skip already-processed tracks (default: True)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Limit number of tracks to process (for testing)"
    )
    
    args = parser.parse_args()
    
    # Initialize database
    init_db()
    
    logger.info("=" * 60)
    logger.info("BATCH FEATURE EXTRACTION")
    logger.info("=" * 60)
    
    # Load tracks
    all_tracks = []
    
    if args.source in ["exports", "all"]:
        logger.info("Loading exports...")
        exports = load_exports()
        logger.info(f"Found {len(exports)} exports")
        for export in exports:
            file_path = export.get("path") or export.get("full_path")
            if file_path and os.path.exists(file_path):
                all_tracks.append({
                    "path": file_path,
                    "filename": export.get("filename"),
                    "collaborator": export.get("collaborator"),
                    "source": "exports"
                })
    
    if args.source in ["itunes", "all"]:
        logger.info("Loading iTunes library...")
        itunes = load_itunes_library("all")
        logger.info(f"Found {len(itunes)} iTunes tracks")
        for track in itunes:
            file_path = track.get("path") or track.get("full_path")
            if file_path and os.path.exists(file_path):
                all_tracks.append({
                    "path": file_path,
                    "filename": track.get("filename"),
                    "collaborator": track.get("collaborator"),
                    "source": "itunes"
                })
    
    if args.limit:
        all_tracks = all_tracks[:args.limit]
        logger.info(f"Limited to {args.limit} tracks for testing")
    
    logger.info(f"Total tracks to process: {len(all_tracks)}")
    
    if not all_tracks:
        logger.warning("No tracks found to process")
        return
    
    # Process tracks
    start_time = time.time()
    results = process_tracks_batch(
        all_tracks,
        max_workers=args.max_workers,
        skip_existing=args.skip_existing
    )
    elapsed = time.time() - start_time
    
    # Print summary
    logger.info("=" * 60)
    logger.info("EXTRACTION COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Total tracks: {results['total']}")
    logger.info(f"Success: {results['success']}")
    logger.info(f"Errors: {results['error']}")
    logger.info(f"Skipped: {results['skipped']}")
    logger.info(f"Time elapsed: {elapsed:.1f}s")
    logger.info(f"Average time per track: {elapsed/max(results['success'], 1):.1f}s")


if __name__ == "__main__":
    main()

