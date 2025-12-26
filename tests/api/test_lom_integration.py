"""
LOM Integration Tests

Integration tests for API -> LOM integration, error propagation,
and state synchronization.
"""

import pytest
from fastapi.testclient import TestClient
from sergik_ml.api.main import app
from sergik_ml.api.middleware.validation import (
    validate_track_index,
    validate_device_index,
    validate_clip_slot,
    validate_lom_path
)
from sergik_ml.utils.errors import ValidationError


client = TestClient(app)


class TestLOMValidation:
    """Test LOM validation functions."""
    
    def test_validate_track_index_valid(self):
        """Test valid track index."""
        result = validate_track_index(0)
        assert result == 0
        
        result = validate_track_index(5)
        assert result == 5
    
    def test_validate_track_index_invalid(self):
        """Test invalid track index."""
        with pytest.raises(ValidationError):
            validate_track_index(-1)
        
        with pytest.raises(ValidationError):
            validate_track_index("0")
        
        with pytest.raises(ValidationError):
            validate_track_index(0.5)
    
    def test_validate_track_index_range(self):
        """Test track index range validation."""
        with pytest.raises(ValidationError):
            validate_track_index(10, max_tracks=5)
    
    def test_validate_device_index_valid(self):
        """Test valid device index."""
        result = validate_device_index(0, 0)
        assert result == 0
        
        result = validate_device_index(0, 5)
        assert result == 5
    
    def test_validate_device_index_invalid(self):
        """Test invalid device index."""
        with pytest.raises(ValidationError):
            validate_device_index(-1, 0)
        
        with pytest.raises(ValidationError):
            validate_device_index(0, -1)
        
        with pytest.raises(ValidationError):
            validate_device_index(0, "0")
    
    def test_validate_clip_slot_valid(self):
        """Test valid clip slot."""
        result = validate_clip_slot(0, 0)
        assert result == 0
        
        result = validate_clip_slot(0, 5)
        assert result == 5
    
    def test_validate_clip_slot_invalid(self):
        """Test invalid clip slot."""
        with pytest.raises(ValidationError):
            validate_clip_slot(-1, 0)
        
        with pytest.raises(ValidationError):
            validate_clip_slot(0, -1)
    
    def test_validate_lom_path_valid(self):
        """Test valid LOM paths."""
        valid_paths = [
            "live_set",
            "live_set tracks 0",
            "live_set tracks 0 devices 1",
            "live_set tracks 0 devices 1 parameters 2",
            "live_set tracks 0 clip_slots 1",
            "live_set tracks 0 clip_slots 1 clip",
            "live_set tracks 0 mixer_device volume",
            "live_app browser"
        ]
        
        for path in valid_paths:
            result = validate_lom_path(path)
            assert result is True
    
    def test_validate_lom_path_invalid(self):
        """Test invalid LOM paths."""
        invalid_paths = [
            "",
            "invalid_path",
            "live_set tracks",
            "live_set tracks -1"
        ]
        
        for path in invalid_paths:
            with pytest.raises(ValidationError):
                validate_lom_path(path)


class TestLOMAPIEndpoints:
    """Test LOM-related API endpoints."""
    
    def test_health_endpoint(self):
        """Test health endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
    
    def test_tracks_endpoint_validation(self):
        """Test tracks endpoint with validation."""
        # This would test actual endpoint if Ableton is connected
        # For now, just test that endpoint exists
        response = client.get("/live/tracks")
        # May return 200 or error depending on Ableton connection
        assert response.status_code in [200, 500, 503]
    
    def test_create_track_validation(self):
        """Test create track endpoint validation."""
        # Test with invalid data
        response = client.post("/live/tracks/create", json={
            "track_type": "invalid"
        })
        # Should handle validation
        assert response.status_code in [200, 400, 422]


class TestErrorPropagation:
    """Test error propagation from LOM to API."""
    
    def test_validation_error_propagation(self):
        """Test that validation errors propagate correctly."""
        with pytest.raises(ValidationError) as exc_info:
            validate_track_index(-1)
        
        assert "non-negative" in str(exc_info.value).lower()
    
    def test_lom_path_error_propagation(self):
        """Test that LOM path errors propagate correctly."""
        with pytest.raises(ValidationError) as exc_info:
            validate_lom_path("invalid_path")
        
        assert "invalid" in str(exc_info.value).lower()


class TestStateSynchronization:
    """Test state synchronization."""
    
    def test_state_service_initialization(self):
        """Test state service initialization."""
        from sergik_ml.services.state_service import StateService
        
        service = StateService()
        state = service.initialize_session()
        
        assert state is not None
        assert state.tempo == 120.0
        assert state.track_count == 0
    
    def test_state_update(self):
        """Test state updates."""
        from sergik_ml.services.state_service import StateService
        
        service = StateService()
        service.initialize_session()
        
        track_state = service.update_track_state(0, {
            "name": "Test Track",
            "volume": 0.75
        })
        
        assert track_state.name == "Test Track"
        assert track_state.volume == 0.75
    
    def test_state_sync(self):
        """Test state synchronization."""
        from sergik_ml.services.state_service import StateService
        
        service = StateService()
        service.initialize_session()
        
        client_state = {
            "tempo": 125.0,
            "is_playing": True,
            "tracks": [
                {"index": 0, "name": "Track 1", "volume": 0.8}
            ]
        }
        
        synced_state = service.sync_state(client_state)
        
        assert synced_state.tempo == 125.0
        assert synced_state.is_playing is True
        assert 0 in synced_state.tracks
        assert synced_state.tracks[0].name == "Track 1"

