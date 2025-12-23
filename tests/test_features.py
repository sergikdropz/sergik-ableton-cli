"""
Tests for SERGIK ML feature extraction.
"""

import pytest
import numpy as np
from pathlib import Path


class TestTextEmbeddings:
    """Test text embedding functions."""

    def test_prompt_embedding_deterministic(self):
        """Same prompt should produce same embedding."""
        from sergik_ml.features.text_embeddings import prompt_embedding

        emb1 = prompt_embedding("tech house with heavy bass")
        emb2 = prompt_embedding("tech house with heavy bass")

        np.testing.assert_array_equal(emb1, emb2)

    def test_prompt_embedding_normalized(self):
        """Embeddings should be unit normalized."""
        from sergik_ml.features.text_embeddings import prompt_embedding

        emb = prompt_embedding("test prompt")
        norm = np.linalg.norm(emb)

        assert abs(norm - 1.0) < 1e-6

    def test_prompt_embedding_dimension(self):
        """Should respect dimension parameter."""
        from sergik_ml.features.text_embeddings import prompt_embedding

        emb128 = prompt_embedding("test", dim=128)
        emb512 = prompt_embedding("test", dim=512)

        assert len(emb128) == 128
        assert len(emb512) == 512

    def test_style_embedding(self):
        """Style embeddings should work for known styles."""
        from sergik_ml.features.text_embeddings import style_embedding

        styles = ["tech-house", "house", "techno", "disco", "trap"]

        for style in styles:
            emb = style_embedding(style)
            assert len(emb) == 256
            assert abs(np.linalg.norm(emb) - 1.0) < 1e-6

    def test_sergik_dna_embedding(self):
        """SERGIK DNA embedding should be stable."""
        from sergik_ml.features.text_embeddings import sergik_dna_embedding

        dna1 = sergik_dna_embedding()
        dna2 = sergik_dna_embedding()

        np.testing.assert_array_equal(dna1, dna2)

    def test_classify_sergik_style(self):
        """Style classification should work."""
        from sergik_ml.features.text_embeddings import classify_sergik_style

        # Good SERGIK match
        result = classify_sergik_style(
            bpm=125,
            key="Cmin",
            energy=0.08,
            harmonic_ratio=0.5,
        )

        assert "sergik_score" in result
        assert 0 <= result["sergik_score"] <= 1
        assert "is_sergik_style" in result
        assert "match_reasons" in result

    def test_batch_embeddings(self):
        """Batch embedding should return matrix."""
        from sergik_ml.features.text_embeddings import batch_embeddings

        prompts = ["prompt 1", "prompt 2", "prompt 3"]
        embs = batch_embeddings(prompts, dim=128)

        assert embs.shape == (3, 128)


class TestVectorStore:
    """Test vector store operations."""

    def test_feature_vec_normalized(self):
        """Feature vectors should be normalized."""
        from sergik_ml.stores.vector_store import feature_vec

        row = {
            "bpm": 125,
            "energy": 0.08,
            "brightness": 3000,
            "lufs": -12,
            "harmonic_ratio": 0.5,
            "percussive_ratio": 0.5,
            "stereo_width": 0.4,
        }

        vec = feature_vec(row)
        norm = np.linalg.norm(vec)

        assert abs(norm - 1.0) < 1e-6

    def test_cosine_similarity(self):
        """Cosine similarity should work correctly."""
        from sergik_ml.stores.vector_store import cosine

        a = np.array([1, 0, 0], dtype=np.float32)
        b = np.array([1, 0, 0], dtype=np.float32)
        c = np.array([0, 1, 0], dtype=np.float32)

        assert abs(cosine(a, b) - 1.0) < 1e-6  # Same direction
        assert abs(cosine(a, c)) < 1e-6  # Orthogonal


class TestPreferenceModel:
    """Test preference model."""

    def test_preference_model_fit(self):
        """Model should fit on data."""
        from sergik_ml.models.preference import PreferenceModel

        X = np.random.randn(100, 7).astype(np.float32)
        y = np.random.randn(100).astype(np.float32) + 3

        model = PreferenceModel()
        model.fit(X, y)

        assert model.fitted
        assert model.w is not None
        assert len(model.w) == 7

    def test_preference_model_predict(self):
        """Model should make predictions."""
        from sergik_ml.models.preference import PreferenceModel

        X = np.random.randn(100, 7).astype(np.float32)
        y = np.random.randn(100).astype(np.float32) + 3

        model = PreferenceModel()
        model.fit(X, y)

        predictions = model.predict(X[:10])

        assert len(predictions) == 10
        assert all(np.isfinite(predictions))

    def test_preference_model_save_load(self, tmp_path):
        """Model should save and load correctly."""
        from sergik_ml.models.preference import PreferenceModel

        X = np.random.randn(50, 7).astype(np.float32)
        y = np.random.randn(50).astype(np.float32) + 3

        model = PreferenceModel()
        model.fit(X, y)

        # Save
        path = tmp_path / "model.pkl"
        model.save(str(path))

        # Load
        loaded = PreferenceModel.load(str(path))

        assert loaded.fitted
        np.testing.assert_array_equal(model.w, loaded.w)
        assert model.b == loaded.b

    def test_feature_importance(self):
        """Feature importance should return dict."""
        from sergik_ml.models.preference import PreferenceModel

        X = np.random.randn(50, 7).astype(np.float32)
        y = np.random.randn(50).astype(np.float32) + 3

        model = PreferenceModel()
        model.fit(X, y)

        importance = model.get_feature_importance()

        assert isinstance(importance, dict)
        assert len(importance) == 7


class TestIntentModel:
    """Test intent classification."""

    def test_basic_intent_parsing(self):
        """Should parse basic intents."""
        from sergik_ml.models.intent import IntentModel

        model = IntentModel()

        # Sample pack intent
        result = model.predict("create a sample pack from the drums")
        assert result["cmd"] == "pack.create"

        # Similar intent
        result = model.predict("find similar tracks")
        assert result["cmd"] == "pack.similar"

        # Tempo intent
        result = model.predict("set tempo to 128")
        assert result["cmd"] == "live.set_tempo"
        assert result["args"]["tempo"] == 128

    def test_smart_intent_classifier(self):
        """Smart intent classifier should work."""
        from sergik_ml.models.smart_intent import classify_intent

        result = classify_intent("make me a 4 bar sample pack")

        assert result.cmd == "pack.create"
        assert result.confidence > 0
        assert "tts" in dir(result)


class TestSmartIntent:
    """Test smart intent classifier."""

    def test_confidence_scoring(self):
        """Should provide confidence scores."""
        from sergik_ml.models.smart_intent import classify_intent

        result = classify_intent("create sample pack")

        assert 0 <= result.confidence <= 1

    def test_argument_extraction(self):
        """Should extract arguments from text."""
        from sergik_ml.models.smart_intent import classify_intent

        result = classify_intent("generate 8 bar tech house drums")

        assert result.cmd == "gen.drums"
        assert result.args.get("bars") == 8 or result.args.get("style") == "tech-house"

    def test_unknown_command(self):
        """Should handle unknown commands gracefully."""
        from sergik_ml.models.smart_intent import classify_intent

        result = classify_intent("flibbertigibbet wonky doodle")

        assert result.cmd is None or result.confidence < 0.5


class TestContextualBandits:
    """Test contextual bandit algorithms."""

    def test_epsilon_greedy(self):
        """Epsilon greedy should work."""
        from sergik_ml.models.contextual_bandits import EpsilonGreedy

        bandit = EpsilonGreedy(epsilon=0.1)

        # Add arms
        for i in range(5):
            bandit.add_arm(f"arm_{i}", np.random.randn(7))

        # Select and update
        for _ in range(10):
            arm = bandit.select_arm()
            bandit.update(arm, np.random.random())

        assert bandit.state.total_pulls == 10

    def test_thompson_sampling(self):
        """Thompson sampling should work."""
        from sergik_ml.models.contextual_bandits import ThompsonSampling

        bandit = ThompsonSampling()

        # Add arms
        for i in range(3):
            bandit.add_arm(f"arm_{i}", np.random.randn(7))

        # Select and update
        arm = bandit.select_arm()
        bandit.update(arm, 0.8)

        assert bandit.state.total_pulls == 1

    def test_linucb(self):
        """LinUCB should work with context."""
        from sergik_ml.models.contextual_bandits import LinUCB

        bandit = LinUCB(feature_dim=7, alpha=1.0)

        # Add arms
        for i in range(3):
            bandit.add_arm(f"arm_{i}", np.random.randn(7))

        # Select with context
        context = np.random.randn(7)
        arm = bandit.select_arm(context)

        # Update
        bandit.update(arm, context, 0.7)

        assert bandit.state.total_pulls == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
