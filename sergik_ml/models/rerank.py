"""
SERGIK ML Reranker

Reranks similarity search results using preference model.

score_final = alpha * similarity + (1 - alpha) * preference
"""

import numpy as np
from typing import List, Dict, Any, Optional
import logging

from .preference import PreferenceModel

logger = logging.getLogger(__name__)


class Reranker:
    """
    Reranks candidate results using learned preferences.
    """

    def __init__(self, pref_model: Optional[PreferenceModel] = None, alpha: float = 0.7):
        """
        Args:
            pref_model: Trained preference model (or None for similarity-only)
            alpha: Weight for similarity vs preference (1.0 = similarity only)
        """
        self.pref_model = pref_model or PreferenceModel()
        self.alpha = alpha

    def rerank(
        self,
        candidates: List[Dict[str, Any]],
        candidate_vecs: np.ndarray,
        similarity_scores: np.ndarray,
        alpha: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Rerank candidates using preference model.

        Args:
            candidates: List of candidate dicts with 'track_id'
            candidate_vecs: Feature vectors (n_candidates, n_features)
            similarity_scores: Raw similarity scores (n_candidates,)
            alpha: Override default alpha

        Returns:
            Reranked candidates with updated scores
        """
        if alpha is None:
            alpha = self.alpha

        # Get preference predictions
        if self.pref_model.fitted:
            pref_scores = self.pref_model.predict(candidate_vecs)
            # Normalize preference to 0-1
            pref_min, pref_max = pref_scores.min(), pref_scores.max()
            if pref_max > pref_min:
                pref_scores = (pref_scores - pref_min) / (pref_max - pref_min)
            else:
                pref_scores = np.ones_like(pref_scores) * 0.5
        else:
            pref_scores = np.ones(len(candidates), dtype=np.float32) * 0.5

        # Combine scores
        final_scores = alpha * similarity_scores + (1 - alpha) * pref_scores

        # Sort by final score
        order = np.argsort(-final_scores)

        # Build reranked results
        results = []
        for i in order:
            cand = candidates[i].copy()
            cand["score"] = float(final_scores[i])
            cand["similarity_score"] = float(similarity_scores[i])
            cand["preference_score"] = float(pref_scores[i])
            results.append(cand)

        logger.debug(f"Reranked {len(results)} candidates (alpha={alpha})")
        return results

    def rerank_simple(
        self,
        candidates: List[Dict[str, Any]],
        feature_extractor: callable,
        alpha: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Simplified rerank that extracts features from candidates.

        Args:
            candidates: List with 'score' and feature fields
            feature_extractor: Function to extract feature vector from candidate
            alpha: Weight for similarity vs preference
        """
        if not candidates:
            return []

        vecs = np.stack([feature_extractor(c) for c in candidates])
        sims = np.array([c.get("score", 0.5) for c in candidates], dtype=np.float32)

        return self.rerank(candidates, vecs, sims, alpha)
