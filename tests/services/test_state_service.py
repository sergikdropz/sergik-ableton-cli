"""
Tests for State Service

Unit tests for persistent state management.
"""

import pytest
from sergik_ml.services.state_service import StateService, SessionState, TrackState
from sergik_ml.utils.errors import DatabaseError


@pytest.fixture
def state_service():
    """Create a state service instance for testing."""
    return StateService(session_id="test-session-123")


@pytest.mark.unit
def test_initialize_session(state_service):
    """Test session initialization."""
    state = state_service.initialize_session()
    assert state.session_id == "test-session-123"
    assert state.tempo == 120.0
    assert state.version == 1


@pytest.mark.unit
def test_update_track_state(state_service):
    """Test updating track state."""
    state_service.initialize_session()
    
    track = state_service.update_track_state(
        track_index=0,
        updates={"name": "Test Track", "volume": 0.8}
    )
    
    assert track.name == "Test Track"
    assert track.volume == 0.8
    assert track.track_index == 0


@pytest.mark.unit
def test_get_session_state(state_service):
    """Test retrieving session state."""
    state_service.initialize_session()
    state_service.update_track_state(0, {"name": "Test"})
    
    retrieved = state_service.get_session_state()
    assert retrieved is not None
    assert retrieved.session_id == "test-session-123"
    assert 0 in retrieved.tracks


@pytest.mark.integration
def test_state_persistence(state_service):
    """Test that state persists across service instances."""
    # Create and update state
    state_service.initialize_session()
    state_service.update_track_state(0, {"name": "Persistent Track"})
    
    # Create new service instance with same session ID
    new_service = StateService(session_id="test-session-123")
    retrieved = new_service.get_session_state()
    
    assert retrieved is not None
    assert 0 in retrieved.tracks
    assert retrieved.tracks[0].name == "Persistent Track"

