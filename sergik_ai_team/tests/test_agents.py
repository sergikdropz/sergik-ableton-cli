"""
Tests for agent handlers
"""

import pytest
from sergik_ai_team.models import Message
from sergik_ai_team.agents.core_agent import sergik_core_handler
from sergik_ai_team.agents.dev_assistant_agent import dev_assistant_handler


@pytest.mark.asyncio
async def test_sergik_core_routing():
    """Test SergikCore routes messages correctly."""
    # Mock agent map
    agent_map = {}
    
    # Test generation routing
    msg = Message(
        sender="Test",
        receiver="SergikCore",
        content="generate chords"
    )
    
    # Should return help message since agent_map is empty
    result = await sergik_core_handler(msg, agent_map)
    assert isinstance(result, str)
    assert len(result) > 0


@pytest.mark.asyncio
async def test_dev_assistant_help():
    """Test DevAssistant help command."""
    msg = Message(
        sender="Test",
        receiver="DevAssistant",
        content="help"
    )
    
    result = await dev_assistant_handler(msg)
    assert isinstance(result, str)
    assert "DevAssistant" in result or "help" in result.lower()


@pytest.mark.asyncio
async def test_dev_assistant_suggest():
    """Test DevAssistant suggest command."""
    msg = Message(
        sender="Test",
        receiver="DevAssistant",
        content="suggest"
    )
    
    result = await dev_assistant_handler(msg)
    assert isinstance(result, str)
    assert len(result) > 0


@pytest.mark.asyncio
async def test_message_validation():
    """Test Message model validation."""
    # Valid message
    msg = Message(
        sender="Test",
        receiver="DevAssistant",
        content="test"
    )
    assert msg.sender == "Test"
    assert msg.receiver == "DevAssistant"
    assert msg.content == "test"
    
    # Message with empty content should still work (validation happens in API)
    msg2 = Message(
        sender="Test",
        receiver="DevAssistant",
        content=""
    )
    assert msg2.content == ""

