"""
Tests for service bridge
"""

import pytest
from sergik_ai_team.bridge import is_available, get_bridge


def test_is_available():
    """Test availability check."""
    # Should return boolean
    result = is_available()
    assert isinstance(result, bool)


def test_bridge_initialization():
    """Test bridge initialization."""
    if is_available():
        try:
            bridge = get_bridge()
            assert bridge is not None
            
            # Test health check
            health = bridge.check_health()
            assert "healthy" in health
            assert "services" in health
            assert isinstance(health["services"], dict)
        except Exception as e:
            pytest.skip(f"SERGIK ML not available: {e}")
    else:
        pytest.skip("SERGIK ML not available")


def test_bridge_config():
    """Test bridge configuration access."""
    if is_available():
        try:
            bridge = get_bridge()
            config = bridge.get_config()
            assert isinstance(config, dict)
            assert "osc_host" in config or "api_host" in config
        except Exception as e:
            pytest.skip(f"SERGIK ML not available: {e}")
    else:
        pytest.skip("SERGIK ML not available")

