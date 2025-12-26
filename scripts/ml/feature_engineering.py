#!/usr/bin/env python3
"""
SERGIK Feature Engineering Module

Expands 7-dim feature vector to 20+ dimensions by adding:
- Spectral features (rolloff, bandwidth, ZCR)
- Temporal features (duration, energy_std)
- Harmonic features (key encoding, chroma stability)
- Timbral features (MFCC variance, diversity)
- Context features (collaborator, style, year)
"""

import sys
import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sergik_ml.stores.vector_store import feature_vec as base_feature_vec

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Camelot key to numeric encoding
CAMELOT_TO_NUM = {
    "1A": 0, "2A": 1, "3A": 2, "4A": 3, "5A": 4, "6A": 5,
    "7A": 6, "8A": 7, "9A": 8, "10A": 9, "11A": 10, "12A": 11,
    "1B": 12, "2B": 13, "3B": 14, "4B": 15, "5B": 16, "6B": 17,
    "7B": 18, "8B": 19, "9B": 20, "10B": 21, "11B": 22, "12B": 23,
}

# Style source encoding
STYLE_SOURCES = {
    "pack": 0,
    "sergik_dna": 1,
    "musicbrains": 2,
    "hybrid": 3,
    "ai_gen": 4,
}


def normalize_bpm(bpm: Optional[float]) -> float:
    """Normalize BPM to 0-1 range (20-300 BPM)."""
    if bpm is None:
        return 0.5  # Default to middle
    return max(0.0, min(1.0, (bpm - 20) / 280))


def normalize_brightness(brightness: Optional[float]) -> float:
    """Normalize brightness to 0-1 range (0-5000 Hz)."""
    if brightness is None:
        return 0.5
    return max(0.0, min(1.0, brightness / 5000))


def normalize_lufs(lufs: Optional[float]) -> float:
    """Normalize LUFS to 0-1 range (-60 to 0 LUFS)."""
    if lufs is None:
        return 0.5
    return max(0.0, min(1.0, (lufs + 60) / 60))


def normalize_duration(duration: Optional[float]) -> float:
    """Normalize duration to 0-1 range (0-600 seconds = 10 minutes)."""
    if duration is None:
        return 0.5
    return max(0.0, min(1.0, duration / 600))


def normalize_spectral_rolloff(rolloff: Optional[float]) -> float:
    """Normalize spectral rolloff to 0-1 range (0-22050 Hz)."""
    if rolloff is None:
        return 0.5
    return max(0.0, min(1.0, rolloff / 22050))


def normalize_spectral_bandwidth(bandwidth: Optional[float]) -> float:
    """Normalize spectral bandwidth to 0-1 range (0-5000 Hz)."""
    if bandwidth is None:
        return 0.5
    return max(0.0, min(1.0, bandwidth / 5000))


def encode_key(key: Optional[str]) -> tuple:
    """
    Encode key into 2-dim vector (Camelot position, major/minor).
    
    Returns:
        (camelot_position, is_major) where camelot_position is 0-23, is_major is 0 or 1
    """
    if not key:
        return (12.0, 0.5)  # Default to middle
    
    # Try to map to Camelot
    camelot_key = None
    if key in CAMELOT_TO_NUM:
        camelot_key = key
    else:
        # Try to convert from musical key notation
        key_upper = key.upper()
        if "MAJOR" in key_upper or "MAJ" in key_upper:
            note = key_upper.split()[0].replace("#", "#").replace("B", "b")
            # Simple mapping (would need full conversion logic)
            camelot_key = "10B"  # Default
        elif "MINOR" in key_upper or "MIN" in key_upper:
            note = key_upper.split()[0].replace("#", "#").replace("B", "b")
            camelot_key = "7A"  # Default
    
    if camelot_key and camelot_key in CAMELOT_TO_NUM:
        camelot_pos = CAMELOT_TO_NUM[camelot_key] / 23.0  # Normalize to 0-1
        is_major = 1.0 if camelot_key.endswith("B") else 0.0
        return (camelot_pos, is_major)
    
    return (12.0, 0.5)  # Default


def chroma_stability(chroma_profile: Optional[List[float]]) -> float:
    """
    Calculate chroma stability (variance of chroma profile).
    Lower variance = more stable key.
    """
    if not chroma_profile or len(chroma_profile) != 12:
        return 0.5  # Default
    
    chroma_array = np.array(chroma_profile)
    variance = float(np.var(chroma_array))
    # Normalize variance (typical range 0-0.1)
    return max(0.0, min(1.0, variance * 10))


def mfcc_variance(mfcc_std: Optional[List[float]]) -> float:
    """
    Calculate MFCC variance as timbral diversity measure.
    """
    if not mfcc_std or len(mfcc_std) == 0:
        return 0.5  # Default
    
    mfcc_array = np.array(mfcc_std)
    mean_variance = float(np.mean(mfcc_array))
    # Normalize (typical range 0-100)
    return max(0.0, min(1.0, mean_variance / 100))


def timbral_diversity(mfcc_mean: Optional[List[float]]) -> float:
    """
    Calculate timbral diversity from MFCC mean values.
    Higher variance = more diverse timbre.
    """
    if not mfcc_mean or len(mfcc_mean) == 0:
        return 0.5  # Default
    
    mfcc_array = np.array(mfcc_mean)
    variance = float(np.var(mfcc_array))
    # Normalize (typical range 0-1000)
    return max(0.0, min(1.0, variance / 1000))


def has_collaborator(track_row: Dict[str, Any]) -> float:
    """Check if track has collaborator (0 or 1)."""
    tags = track_row.get("tags")
    if isinstance(tags, str):
        try:
            tags = json.loads(tags)
        except:
            tags = []
    if isinstance(tags, list):
        for tag in tags:
            if " x " in str(tag).lower() or "collaborator" in str(tag).lower():
                return 1.0
    return 0.0


def encode_style_source(style_source: Optional[str]) -> float:
    """Encode style source to 0-1 range."""
    if not style_source:
        return 0.0
    return STYLE_SOURCES.get(style_source, 0.0) / 4.0  # Normalize to 0-1


def normalize_year(updated_at: Optional[datetime]) -> float:
    """Normalize year to 0-1 range (2015-2025)."""
    if not updated_at:
        return 0.5
    
    if isinstance(updated_at, str):
        try:
            updated_at = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
        except:
            return 0.5
    
    year = updated_at.year
    # Normalize 2015-2025 to 0-1
    return max(0.0, min(1.0, (year - 2015) / 10))


def extract_ml_features(track_row: Dict[str, Any]) -> np.ndarray:
    """
    Extract ML-ready features from track row.
    
    Expands from 7-dim to 20+ dimensions:
    - Audio features (7): BPM, energy, brightness, LUFS, harmonic_ratio, percussive_ratio, stereo_width
    - Spectral features (3): rolloff, bandwidth, ZCR
    - Temporal features (2): duration, energy_std
    - Harmonic features (3): key_position, key_major, chroma_stability
    - Timbral features (2): mfcc_variance, timbral_diversity
    - Context features (4): has_collaborator, style_source, year, rating_present
    
    Args:
        track_row: Track row from database
        
    Returns:
        Feature vector as numpy array (20+ dimensions)
    """
    features = []
    
    # Parse structure_json if it's a string
    structure = track_row.get("structure_json")
    if isinstance(structure, str):
        try:
            structure = json.loads(structure) if structure else {}
        except:
            structure = {}
    if not isinstance(structure, dict):
        structure = {}
    
    # 1. Audio features (7 dimensions) - use base feature vector
    base_features = base_feature_vec(track_row, normalize=True)
    features.extend(base_features.tolist() if isinstance(base_features, np.ndarray) else base_features)
    
    # 2. Spectral features (3 dimensions)
    features.append(normalize_spectral_rolloff(structure.get("spectral_rolloff")))
    features.append(normalize_spectral_bandwidth(structure.get("spectral_bandwidth")))
    features.append(min(1.0, max(0.0, structure.get("zero_crossing_rate", 0.5))))
    
    # 3. Temporal features (2 dimensions)
    features.append(normalize_duration(structure.get("duration")))
    energy_std = track_row.get("energy_std") or structure.get("energy_std")
    if energy_std:
        features.append(min(1.0, max(0.0, energy_std)))
    else:
        features.append(0.5)  # Default
    
    # 4. Harmonic features (3 dimensions)
    key_pos, key_major = encode_key(track_row.get("key"))
    features.append(key_pos)
    features.append(key_major)
    chroma_profile = structure.get("chroma_profile")
    features.append(chroma_stability(chroma_profile))
    
    # 5. Timbral features (2 dimensions)
    mfcc_std = structure.get("mfcc_std")
    features.append(mfcc_variance(mfcc_std))
    mfcc_mean = structure.get("mfcc_mean")
    features.append(timbral_diversity(mfcc_mean))
    
    # 6. Context features (4 dimensions)
    features.append(has_collaborator(track_row))
    features.append(encode_style_source(track_row.get("style_source")))
    features.append(normalize_year(track_row.get("updated_at")))
    features.append(1.0 if track_row.get("rating") is not None else 0.0)
    
    return np.array(features, dtype=np.float32)


def extract_ml_features_batch(track_rows: List[Dict[str, Any]]) -> np.ndarray:
    """
    Extract ML features for a batch of tracks.
    
    Args:
        track_rows: List of track row dictionaries
        
    Returns:
        Feature matrix (n_tracks, n_features)
    """
    feature_vectors = []
    for track_row in track_rows:
        try:
            features = extract_ml_features(track_row)
            feature_vectors.append(features)
        except Exception as e:
            logger.error(f"Error extracting features for track {track_row.get('track_id')}: {e}")
            # Use default feature vector
            default_features = np.zeros(20, dtype=np.float32)
            feature_vectors.append(default_features)
    
    return np.stack(feature_vectors)


def get_feature_names() -> List[str]:
    """Get list of feature names for the enhanced feature vector."""
    return [
        # Audio features (7)
        "bpm_normalized",
        "energy",
        "brightness_normalized",
        "lufs_normalized",
        "harmonic_ratio",
        "percussive_ratio",
        "stereo_width",
        # Spectral features (3)
        "spectral_rolloff",
        "spectral_bandwidth",
        "zero_crossing_rate",
        # Temporal features (2)
        "duration_normalized",
        "energy_std",
        # Harmonic features (3)
        "key_position",
        "key_major",
        "chroma_stability",
        # Timbral features (2)
        "mfcc_variance",
        "timbral_diversity",
        # Context features (4)
        "has_collaborator",
        "style_source",
        "year_normalized",
        "rating_present",
    ]


if __name__ == "__main__":
    # Test feature extraction
    test_track = {
        "track_id": "test123",
        "bpm": 125.0,
        "key": "10B",
        "energy": 0.7,
        "brightness": 3500.0,
        "lufs": -12.0,
        "harmonic_ratio": 0.6,
        "percussive_ratio": 0.4,
        "stereo_width": 0.5,
        "style_source": "pack",
        "rating": 4.0,
        "tags": json.dumps(["Silent Jay"]),
        "structure_json": json.dumps({
            "duration": 240.0,
            "energy_std": 0.15,
            "spectral_rolloff": 8000.0,
            "spectral_bandwidth": 2000.0,
            "zero_crossing_rate": 0.1,
            "chroma_profile": [0.1] * 12,
            "mfcc_mean": [0.0] * 13,
            "mfcc_std": [10.0] * 13,
        }),
        "updated_at": datetime(2024, 1, 1),
    }
    
    features = extract_ml_features(test_track)
    feature_names = get_feature_names()
    
    print("Feature extraction test:")
    print(f"Feature vector shape: {features.shape}")
    print(f"Number of features: {len(feature_names)}")
    print("\nFeature values:")
    for name, value in zip(feature_names, features):
        print(f"  {name}: {value:.4f}")

