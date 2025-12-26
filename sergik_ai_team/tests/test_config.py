"""
Tests for configuration
"""

import pytest
from sergik_ai_team.config import (
    validate_config,
    validate_paths,
    AGENT_PORT,
    AGENT_HOST,
    BASE_DIR
)


def test_config_paths():
    """Test path validation."""
    results = validate_paths()
    assert isinstance(results, dict)
    assert "valid" in results
    assert "errors" in results
    assert "warnings" in results


def test_config_validation():
    """Test configuration validation."""
    # Should return boolean
    result = validate_config()
    assert isinstance(result, bool)


def test_config_values():
    """Test configuration values."""
    # Port should be in valid range
    assert 1024 <= AGENT_PORT <= 65535
    
    # Host should be a string
    assert isinstance(AGENT_HOST, str)
    
    # Base dir should exist
    assert BASE_DIR.exists()

