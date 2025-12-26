"""
Tests for SERGIK ML API endpoints.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client."""
    from sergik_ml.api.main import app
    return TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_ok(self, client):
        """Health endpoint should return ok."""
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json()["ok"] is True


class TestActionEndpoint:
    """Test action endpoint."""

    def test_action_invalid_command(self, client):
        """Invalid command should return error."""
        response = client.post(
            "/action",
            json={"cmd": "invalid.command", "args": {}},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "not allowed" in data["error"].lower()

    def test_action_pack_rate_validation(self, client):
        """Rating should be validated."""
        response = client.post(
            "/action",
            json={
                "cmd": "pack.rate",
                "args": {"track_id": "test", "rating": 10},  # Invalid
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"


class TestTracksEndpoint:
    """Test tracks endpoint."""

    def test_list_tracks(self, client):
        """Should list tracks."""
        response = client.get("/tracks")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestSimilarEndpoint:
    """Test similarity endpoint."""

    def test_similar_missing_track(self, client):
        """Should handle missing track gracefully."""
        response = client.get("/similar/nonexistent_track_id_12345")

        assert response.status_code == 200
        data = response.json()
        # Should return empty list or handle gracefully


class TestDashboard:
    """Test dashboard endpoints."""

    def test_dashboard_home(self, client):
        """Dashboard home should return HTML."""
        response = client.get("/dashboard")

        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        assert "SERGIK ML" in response.text

    def test_dashboard_tracks(self, client):
        """Dashboard tracks page should work."""
        response = client.get("/dashboard/tracks")

        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_dashboard_models(self, client):
        """Dashboard models page should work."""
        response = client.get("/dashboard/models")

        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_dashboard_api_stats(self, client):
        """Dashboard API should return stats."""
        response = client.get("/dashboard/api/stats")

        assert response.status_code == 200
        data = response.json()
        assert "total_tracks" in data
        assert "rated_tracks" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
