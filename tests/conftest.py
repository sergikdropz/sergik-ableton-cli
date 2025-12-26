"""
Pytest Configuration

Shared fixtures and configuration for tests.
"""

import pytest
from pathlib import Path
import tempfile
import shutil


@pytest.fixture
def temp_dir():
    """Create a temporary directory for tests."""
    temp_path = Path(tempfile.mkdtemp())
    yield temp_path
    shutil.rmtree(temp_path, ignore_errors=True)


@pytest.fixture
def sample_audio_file(temp_dir):
    """Create a sample audio file for testing."""
    # This would create a minimal WAV file
    # For now, return a path that tests can use
    audio_path = temp_dir / "test_audio.wav"
    # In real tests, you'd create an actual audio file here
    return audio_path


@pytest.fixture
def mock_config(monkeypatch):
    """Mock configuration for tests."""
    monkeypatch.setenv("SERGIK_HOST", "127.0.0.1")
    monkeypatch.setenv("SERGIK_PORT", "8000")
    monkeypatch.setenv("SERGIK_DB_URL", "sqlite:///:memory:")
    monkeypatch.setenv("SERGIK_ABLETON_OSC_HOST", "127.0.0.1")
    monkeypatch.setenv("SERGIK_ABLETON_OSC_PORT", "9000")

