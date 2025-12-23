"""
SERGIK ML Pack Pipeline

ML-native sample pack creation:
  - Audio normalization and trimming
  - Feature extraction for each stem
  - Manifest generation
  - Database logging for training
"""

from typing import Dict, Any, List, Optional
from pathlib import Path
import uuid
import json
import shutil
import datetime
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Lazy imports
_soundfile = None
_librosa = None


def _get_soundfile():
    global _soundfile
    if _soundfile is None:
        import soundfile
        _soundfile = soundfile
    return _soundfile


def _get_librosa():
    global _librosa
    if _librosa is None:
        import librosa
        _librosa = librosa
    return _librosa


def _fade(y: np.ndarray, sr: int, ms: int = 10) -> np.ndarray:
    """Apply fade in/out to audio."""
    n = int(sr * (ms / 1000.0))
    if n <= 1 or y.shape[0] < 2 * n:
        return y

    fade_in = np.linspace(0, 1, n, dtype=np.float32)
    fade_out = np.linspace(1, 0, n, dtype=np.float32)

    y = y.copy()
    y[:n] *= fade_in
    y[-n:] *= fade_out
    return y


def create_pack(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a sample pack from staged audio files.

    Args:
        args:
            stems_dir: Directory with source WAV files
            custom_path: Output base directory
            tempo: BPM for bar calculation
            length_bars: Bars to trim to (or "Full")
            fade_ms: Fade duration in milliseconds
            auto_zip: Create ZIP archive
            cloud_push: Upload to cloud (stub)

    Returns:
        Pack metadata including paths and manifest
    """
    from ..stores.sql_store import upsert_track, insert_pack_manifest, now_utc
    from ..features.audio_features import extract_audio_features

    librosa = _get_librosa()
    sf = _get_soundfile()

    # Parse arguments
    tempo = float(args.get("tempo", 120))
    length_bars = args.get("length_bars", 4)
    if isinstance(length_bars, str) and length_bars.lower() == "full":
        length_bars = 999999
    length_bars = int(length_bars)

    stems_dir = Path(args.get("stems_dir", "uploads"))
    custom_path = args.get("custom_path") or "packs"
    fade_ms = int(args.get("fade_ms", 10))

    # Create export directory
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    export_dir = Path(custom_path) / f"Sergik_Pack_{timestamp}"
    export_dir.mkdir(parents=True, exist_ok=True)

    # Calculate bar duration
    bar_sec = 60.0 / tempo * 4.0

    # Find source files
    wavs = sorted(list(stems_dir.glob("*.wav")))
    if not wavs:
        raise ValueError(f"No WAV files found in {stems_dir}")

    logger.info(f"Creating pack from {len(wavs)} files, {length_bars} bars at {tempo} BPM")

    # Build manifest
    manifest = {
        "pack_name": export_dir.name,
        "tempo": tempo,
        "length_bars": length_bars if length_bars < 999999 else "Full",
        "created_at": timestamp,
        "items": []
    }

    total_duration = 0.0

    for wav in wavs:
        try:
            # Load audio
            y, sr = librosa.load(str(wav), sr=None, mono=True)

            # Calculate max length
            if length_bars >= 999999:
                max_len = len(y)
            else:
                max_len = int(sr * bar_sec * length_bars)

            # Trim and fade
            y_trimmed = y[:max_len].copy()
            y_faded = _fade(y_trimmed, sr, ms=fade_ms)

            # Generate output filename
            bars_str = "full" if length_bars >= 999999 else f"{length_bars}bar"
            out_name = f"{wav.stem}_{bars_str}.wav"
            out_path = export_dir / out_name

            # Write output
            sf.write(str(out_path), y_faded, sr, subtype="PCM_24")

            # Extract features
            feats = extract_audio_features(str(out_path))
            track_id = out_path.stem
            duration = len(y_faded) / sr
            total_duration += duration

            # Store in database
            upsert_track({
                "track_id": track_id,
                "bpm": feats.get("bpm", tempo),
                "energy": feats.get("energy"),
                "brightness": feats.get("brightness"),
                "lufs": feats.get("lufs"),
                "harmonic_ratio": feats.get("harmonic_ratio"),
                "percussive_ratio": feats.get("percussive_ratio"),
                "stereo_width": feats.get("stereo_width"),
                "source_pack": export_dir.name,
                "rating": None,
                "style_source": "pack",
                "updated_at": now_utc()
            })

            # Add to manifest
            manifest["items"].append({
                "track_id": track_id,
                "filename": out_name,
                "path": str(out_path),
                "duration": duration,
                **feats
            })

            logger.debug(f"Processed: {wav.name} -> {out_name}")

        except Exception as e:
            logger.error(f"Error processing {wav}: {e}")
            continue

    # Write manifest JSON
    manifest_path = export_dir / "pack_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))

    # Create ZIP if requested
    zip_path = None
    if args.get("auto_zip", False):
        zip_path = shutil.make_archive(str(export_dir), "zip", export_dir)
        logger.info(f"Created ZIP: {zip_path}")

    # Cloud upload stub
    cloud_url = None
    if args.get("cloud_push", False) and zip_path:
        cloud_url = "https://example.com/packs/" + Path(zip_path).name
        logger.info(f"Cloud upload stub: {cloud_url}")

    # Store pack manifest in database
    pack_id = str(uuid.uuid4())
    insert_pack_manifest({
        "pack_id": pack_id,
        "pack_name": export_dir.name,
        "export_dir": str(export_dir),
        "zip_path": zip_path,
        "cloud_url": cloud_url,
        "manifest_json": manifest,
        "track_count": len(manifest["items"]),
        "total_duration_sec": total_duration,
        "created_at": now_utc()
    })

    logger.info(f"Pack created: {export_dir.name} ({len(manifest['items'])} files)")

    return {
        "pack_id": pack_id,
        "export_dir": str(export_dir),
        "zip_path": zip_path,
        "cloud_url": cloud_url,
        "track_count": len(manifest["items"]),
        "total_duration": total_duration,
        "manifest": manifest
    }


def rate_track(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rate a track (ML feedback loop).

    Updates rating and creates emotion event for preference learning.
    """
    from ..stores.sql_store import upsert_track, insert_emotion, now_utc

    track_id = args.get("track_id")
    if not track_id:
        raise ValueError("track_id is required")

    rating = float(args.get("rating", 3))
    rating = max(1, min(5, rating))

    # Update track rating
    upsert_track({
        "track_id": track_id,
        "rating": rating,
        "updated_at": now_utc()
    })

    # Convert rating to emotion dimensions
    # Valence: 1-5 maps to -1 to 1
    valence = (rating - 3.0) / 2.0
    arousal = 0.5  # Neutral
    dominance = 0.5  # Neutral

    # Insert emotion event
    insert_emotion({
        "emotion_id": str(uuid.uuid4()),
        "track_id": track_id,
        "valence": valence,
        "arousal": arousal,
        "dominance": dominance,
        "source": "user_rating",
        "payload": {"rating": rating},
        "timestamp": now_utc()
    })

    logger.info(f"Rated {track_id}: {rating} stars")

    return {
        "track_id": track_id,
        "rating": rating,
        "valence": valence,
        "arousal": arousal,
        "dominance": dominance
    }
