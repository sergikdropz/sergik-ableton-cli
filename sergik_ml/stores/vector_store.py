"""
SERGIK ML Vector Store - Similarity search for tracks.

Mode A (future): Postgres + pgvector (true ANN search)
Mode B (current): In-memory cosine similarity (fast fallback)

Upgrade path:
  1. Set CFG.db_url to Postgres
  2. Add pgvector extension and embedding column
  3. Implement pgvector queries in this module
"""

from typing import Dict, Any, List, Optional
import numpy as np
import logging

from .sql_store import list_tracks, get_track

logger = logging.getLogger(__name__)


def feature_vec(row: Dict[str, Any], normalize: bool = True) -> np.ndarray:
    """
    Extract feature vector from track row for similarity computation.

    Features (7-dim):
      - bpm (normalized by 200)
      - energy
      - brightness (normalized by 5000)
      - lufs (normalized by -60)
      - harmonic_ratio
      - percussive_ratio
      - stereo_width
    """
    bpm = float(row.get("bpm") or 120) / 200.0
    energy = float(row.get("energy") or 0.0)
    brightness = float(row.get("brightness") or 2000) / 5000.0
    lufs = (float(row.get("lufs") or -14) + 60) / 60.0  # Normalize to 0-1
    harmonic = float(row.get("harmonic_ratio") or 0.5)
    percussive = float(row.get("percussive_ratio") or 0.5)
    stereo = float(row.get("stereo_width") or 0.0)

    v = np.array([bpm, energy, brightness, lufs, harmonic, percussive, stereo], dtype=np.float32)

    if normalize:
        norm = np.linalg.norm(v)
        if norm > 1e-9:
            v = v / norm

    return v


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a < 1e-9 or norm_b < 1e-9:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    """Compute Euclidean distance between two vectors."""
    return float(np.linalg.norm(a - b))


def similar(
    track_id: str,
    k: int = 10,
    style_filter: Optional[str] = None,
    metric: str = "cosine"
) -> List[Dict[str, Any]]:
    """
    Find k most similar tracks to the given track.

    Args:
        track_id: Source track ID
        k: Number of results
        style_filter: Optional style_source filter
        metric: 'cosine' or 'euclidean'

    Returns:
        List of {track_id, score, source_pack, style_source}
    """
    rows = list_tracks(limit=10000)

    # Find target track
    target = next((r for r in rows if r.get("track_id") == track_id), None)
    if not target:
        logger.warning(f"Track not found: {track_id}")
        return []

    target_vec = feature_vec(target)

    # Score all other tracks
    scored = []
    for r in rows:
        if r.get("track_id") == track_id:
            continue

        if style_filter and r.get("style_source") != style_filter:
            continue

        candidate_vec = feature_vec(r)

        if metric == "cosine":
            score = cosine_similarity(target_vec, candidate_vec)
        else:
            # Convert distance to similarity
            dist = euclidean_distance(target_vec, candidate_vec)
            score = 1.0 / (1.0 + dist)

        scored.append({
            "track_id": r["track_id"],
            "score": score,
            "source_pack": r.get("source_pack"),
            "style_source": r.get("style_source"),
            "bpm": r.get("bpm"),
            "key": r.get("key"),
        })

    # Sort by score descending
    scored.sort(key=lambda x: x["score"], reverse=True)

    return scored[:k]


def batch_feature_vectors(track_ids: List[str]) -> np.ndarray:
    """Get feature vectors for multiple tracks as a matrix."""
    rows = list_tracks(limit=10000)
    id_to_row = {r["track_id"]: r for r in rows}

    vectors = []
    for tid in track_ids:
        if tid in id_to_row:
            vectors.append(feature_vec(id_to_row[tid]))
        else:
            vectors.append(np.zeros(7, dtype=np.float32))

    return np.stack(vectors)
