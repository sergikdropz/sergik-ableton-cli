"""
SERGIK ML Text Embeddings

MusicBrains-style text-to-style embeddings for prompt-based generation.

Modes:
  - Stub: Deterministic hash-based pseudo-embeddings (default)
  - Sentence Transformers: Real semantic embeddings (optional)
"""

from typing import Optional, List
import numpy as np
import logging

from ..config import CFG

logger = logging.getLogger(__name__)

# Optional sentence-transformers
_model = None


def _get_transformer_model():
    """Lazy-load sentence transformer model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Loaded sentence-transformers model")
        except ImportError:
            logger.warning("sentence-transformers not installed, using stub embeddings")
            _model = False
    return _model if _model else None


def prompt_embedding(prompt: str, dim: int = 256, use_transformer: bool = False) -> np.ndarray:
    """
    Generate embedding vector from text prompt.

    Args:
        prompt: Text description (e.g., "dark tech-house with heavy bass")
        dim: Output dimension
        use_transformer: Try to use real transformer model

    Returns:
        Normalized embedding vector
    """
    if use_transformer:
        model = _get_transformer_model()
        if model:
            emb = model.encode(prompt, convert_to_numpy=True)
            # Resize or pad to target dim
            if len(emb) > dim:
                emb = emb[:dim]
            elif len(emb) < dim:
                emb = np.pad(emb, (0, dim - len(emb)))
            return emb / (np.linalg.norm(emb) + 1e-9)

    # Stub: deterministic pseudo-embedding from hash
    seed = abs(hash(prompt.lower().strip())) % (2**32)
    rng = np.random.default_rng(seed)
    v = rng.normal(size=(dim,)).astype(np.float32)
    return v / (np.linalg.norm(v) + 1e-9)


def style_embedding(style: str, dim: int = 256) -> np.ndarray:
    """
    Generate embedding for a style tag.

    Predefined styles have consistent embeddings for retrieval.
    """
    style_prompts = {
        "tech-house": "driving groovy tech house with punchy kicks and rolling basslines",
        "house": "classic house music with soulful chords and four on the floor",
        "techno": "dark industrial techno with hard kicks and atmospheric synths",
        "disco": "funky disco with live drums guitar and strings",
        "trap": "heavy trap with 808s hi-hat rolls and dark pads",
        "reggaeton": "latin reggaeton with dembow rhythm and perreo bass",
        "ambient": "atmospheric ambient textures with evolving pads",
        "drum-and-bass": "fast breakbeats with heavy sub bass and rolling drums",
    }

    prompt = style_prompts.get(style.lower(), style)
    return prompt_embedding(prompt, dim=dim)


# ============================================================================
# SERGIK DNA - Proprietary Style Profiles
# ============================================================================

# SERGIK production DNA extracted from 651 tracks analysis
SERGIK_DNA = {
    "bpm_sweet_spot": (122, 127),
    "primary_keys": ["C", "G", "D", "Am", "Em"],
    "groove_philosophy": "syncopated-basslines-first",
    "production_traits": {
        "spectral_separation": True,
        "gate_tight_transients": True,
        "sub_focus": True,
        "stereo_width_range": (0.3, 0.7),
    },
    "style_weights": {
        "tech-house": 0.45,
        "house": 0.25,
        "disco": 0.15,
        "techno": 0.10,
        "other": 0.05,
    },
}


def sergik_dna_embedding(dim: int = 256) -> np.ndarray:
    """
    Generate SERGIK DNA signature embedding.

    This embedding represents the core SERGIK production style
    for similarity matching and style transfer.
    """
    # Create deterministic SERGIK DNA vector
    dna_prompt = (
        "SERGIK production style groovy tech house driving basslines "
        "syncopated rhythms punchy transients spectral separation "
        "gate tight kicks rolling percussion melodic stabs "
        f"bpm range {SERGIK_DNA['bpm_sweet_spot'][0]} to {SERGIK_DNA['bpm_sweet_spot'][1]} "
        f"primary keys {' '.join(SERGIK_DNA['primary_keys'])}"
    )
    return prompt_embedding(dna_prompt, dim=dim)


def sergik_style_distance(track_embedding: np.ndarray) -> float:
    """
    Calculate distance from SERGIK DNA signature.

    Lower values = more SERGIK-like.

    Args:
        track_embedding: Feature embedding of a track

    Returns:
        Distance from SERGIK DNA (0-2, lower is more similar)
    """
    dna = sergik_dna_embedding(dim=len(track_embedding))
    # Cosine distance
    cos_sim = np.dot(track_embedding, dna) / (
        (np.linalg.norm(track_embedding) + 1e-9) * (np.linalg.norm(dna) + 1e-9)
    )
    return float(1.0 - cos_sim)


def classify_sergik_style(
    bpm: float,
    key: str,
    energy: float,
    harmonic_ratio: float
) -> dict:
    """
    Classify how well a track matches SERGIK production DNA.

    Returns:
        Dict with sergik_score (0-1) and style classification
    """
    score = 0.0
    reasons = []

    # BPM in sweet spot
    bpm_low, bpm_high = SERGIK_DNA["bpm_sweet_spot"]
    if bpm_low <= bpm <= bpm_high:
        score += 0.25
        reasons.append("bpm_in_range")
    elif abs(bpm - (bpm_low + bpm_high) / 2) < 10:
        score += 0.15
        reasons.append("bpm_near_range")

    # Key match
    if key and any(k in key.upper() for k in SERGIK_DNA["primary_keys"]):
        score += 0.25
        reasons.append("key_match")

    # Energy level (SERGIK tends toward moderate-high energy)
    if 0.04 <= energy <= 0.12:
        score += 0.25
        reasons.append("energy_in_range")

    # Harmonic content (SERGIK balances melodic and rhythmic)
    if 0.3 <= harmonic_ratio <= 0.7:
        score += 0.25
        reasons.append("harmonic_balance")

    return {
        "sergik_score": min(1.0, score),
        "is_sergik_style": score >= 0.5,
        "match_reasons": reasons,
        "style_category": "tech-house" if score >= 0.6 else "house" if score >= 0.4 else "other"
    }


def batch_embeddings(prompts: List[str], dim: int = 256) -> np.ndarray:
    """Generate embeddings for multiple prompts."""
    return np.stack([prompt_embedding(p, dim=dim) for p in prompts])
