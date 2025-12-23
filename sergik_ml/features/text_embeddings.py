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


def batch_embeddings(prompts: List[str], dim: int = 256) -> np.ndarray:
    """Generate embeddings for multiple prompts."""
    return np.stack([prompt_embedding(p, dim=dim) for p in prompts])
