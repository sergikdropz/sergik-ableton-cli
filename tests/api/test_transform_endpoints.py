"""
Tests for transform API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from sergik_ml.api.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_ableton_service():
    """Mock AbletonService."""
    service = Mock()
    service.quantize_clip = AsyncMock(return_value={"status": "ok", "message": "Quantized"})
    service.transpose_clip = AsyncMock(return_value={"status": "ok", "message": "Transposed"})
    service.adjust_velocity = AsyncMock(return_value={"status": "ok", "message": "Velocity adjusted"})
    service.make_legato = AsyncMock(return_value={"status": "ok", "message": "Made legato"})
    service.remove_overlaps = AsyncMock(return_value={"status": "ok", "message": "Overlaps removed"})
    service.apply_fade = AsyncMock(return_value={"status": "ok", "message": "Fade applied"})
    service.normalize_audio = AsyncMock(return_value={"status": "ok", "message": "Normalized"})
    service.time_stretch = AsyncMock(return_value={"status": "ok", "message": "Time stretched"})
    service.pitch_shift = AsyncMock(return_value={"status": "ok", "message": "Pitch shifted"})
    service.time_shift = AsyncMock(return_value={"status": "ok", "message": "Time shifted"})
    return service


def test_quantize_endpoint(client, mock_ableton_service):
    """Test quantize endpoint."""
    with patch('sergik_ml.api.dependencies.get_ableton_service', return_value=mock_ableton_service):
        response = client.post(
            "/api/transform/quantize",
            json={
                "track_index": 0,
                "clip_slot": 0,
                "grid": "1/16",
                "strength": 100
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        mock_ableton_service.quantize_clip.assert_called_once()


def test_transpose_endpoint(client, mock_ableton_service):
    """Test transpose endpoint."""
    with patch('sergik_ml.api.dependencies.get_ableton_service', return_value=mock_ableton_service):
        response = client.post(
            "/api/transform/transpose",
            json={
                "track_index": 0,
                "clip_slot": 0,
                "semitones": 12
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


def test_velocity_endpoint(client, mock_ableton_service):
    """Test velocity endpoint."""
    with patch('sergik_ml.api.dependencies.get_ableton_service', return_value=mock_ableton_service):
        response = client.post(
            "/api/transform/velocity",
            json={
                "track_index": 0,
                "clip_slot": 0,
                "operation": "set",
                "value": 100
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


def test_time_shift_endpoint(client, mock_ableton_service):
    """Test time_shift endpoint."""
    with patch('sergik_ml.api.dependencies.get_ableton_service', return_value=mock_ableton_service):
        response = client.post(
            "/api/transform/time_shift",
            json={
                "track_index": 0,
                "clip_slot": 0,
                "direction": "right",
                "amount": 0.25
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        mock_ableton_service.time_shift.assert_called_once()


def test_quantize_validation_error(client):
    """Test quantize endpoint with invalid data."""
    response = client.post(
        "/api/transform/quantize",
        json={
            "track_index": -1,  # Invalid
            "grid": "invalid"  # Invalid
        }
    )
    
    # Should return validation error
    assert response.status_code in [400, 422]


def test_transpose_missing_required_field(client):
    """Test transpose endpoint with missing required field."""
    response = client.post(
        "/api/transform/transpose",
        json={
            "track_index": 0
            # Missing semitones
        }
    )
    
    assert response.status_code in [400, 422]

