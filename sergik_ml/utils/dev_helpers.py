"""
Development Helpers

Utility functions for development assistance using SERGIK AI Team.
"""

import logging
from typing import Optional, Dict, Any
import os

logger = logging.getLogger(__name__)

# Try to import SERGIK AI Team functions
try:
    from sergik_ai_team import (
        auto_help as _auto_help,
        develop_sync as _develop_sync,
        code_review as _code_review,
        best_practices as _best_practices,
        ask_agent_sync as _ask_agent_sync,
    )
    AI_TEAM_AVAILABLE = True
except ImportError:
    AI_TEAM_AVAILABLE = False
    logger.warning("SERGIK AI Team not available - dev helpers will use fallback behavior")


def get_dev_assistant():
    """
    Get DevAssistant agent helper.
    
    Returns:
        DevAssistant helper instance or None if unavailable
    """
    if not AI_TEAM_AVAILABLE:
        logger.warning("SERGIK AI Team not available")
        return None
    
    try:
        from sergik_ai_team.dev_helper import get_dev_helper
        return get_dev_helper()
    except Exception as e:
        logger.error(f"Error getting dev assistant: {e}", exc_info=True)
        return None


def ask_agent(agent_name: str, question: str) -> str:
    """
    Ask any SERGIK AI Team agent a question.
    
    Args:
        agent_name: Name of the agent (DevAssistant, ControllerDev, etc.)
        question: Question to ask
        
    Returns:
        Agent response as string
        
    Raises:
        RuntimeError: If SERGIK AI Team is not available
    """
    if not AI_TEAM_AVAILABLE:
        raise RuntimeError("SERGIK AI Team not available. Please ensure it's installed and running.")
    
    try:
        return _ask_agent_sync(question, agent_name)
    except Exception as e:
        logger.error(f"Error asking agent {agent_name}: {e}", exc_info=True)
        raise RuntimeError(f"Error asking agent: {str(e)}")


def auto_help(task: str) -> str:
    """
    Get automatic help for a development task.
    
    Args:
        task: Development task description
        
    Returns:
        Helpful guidance as string
        
    Raises:
        RuntimeError: If SERGIK AI Team is not available
    """
    if not AI_TEAM_AVAILABLE:
        raise RuntimeError("SERGIK AI Team not available. Please ensure it's installed and running.")
    
    try:
        return _auto_help(task)
    except Exception as e:
        logger.error(f"Error getting auto help: {e}", exc_info=True)
        raise RuntimeError(f"Error getting auto help: {str(e)}")


def code_review(file_path: str) -> str:
    """
    Review code using DevAssistant.
    
    Args:
        file_path: Path to file to review
        
    Returns:
        Code review as string
        
    Raises:
        RuntimeError: If SERGIK AI Team is not available
    """
    if not AI_TEAM_AVAILABLE:
        raise RuntimeError("SERGIK AI Team not available. Please ensure it's installed and running.")
    
    try:
        # Use async code_review and run it
        import asyncio
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(_code_review(file_path))
    except RuntimeError:
        # No event loop, create one
        return asyncio.run(_code_review(file_path))
    except Exception as e:
        logger.error(f"Error reviewing code: {e}", exc_info=True)
        raise RuntimeError(f"Error reviewing code: {str(e)}")


def get_best_practices(topic: str = "") -> str:
    """
    Get best practices for a topic.
    
    Args:
        topic: Topic for best practices
        
    Returns:
        Best practices as string
        
    Raises:
        RuntimeError: If SERGIK AI Team is not available
    """
    if not AI_TEAM_AVAILABLE:
        raise RuntimeError("SERGIK AI Team not available. Please ensure it's installed and running.")
    
    try:
        # Use async best_practices and run it
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(_best_practices(topic))
        except RuntimeError:
            # No event loop, create one
            return asyncio.run(_best_practices(topic))
    except Exception as e:
        logger.error(f"Error getting best practices: {e}", exc_info=True)
        raise RuntimeError(f"Error getting best practices: {str(e)}")


def develop_sync(task: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Orchestrate development for a task.
    
    Args:
        task: Development task description
        context: Optional context dictionary
        
    Returns:
        Development guidance as string
        
    Raises:
        RuntimeError: If SERGIK AI Team is not available
    """
    if not AI_TEAM_AVAILABLE:
        raise RuntimeError("SERGIK AI Team not available. Please ensure it's installed and running.")
    
    try:
        return _develop_sync(task, context)
    except Exception as e:
        logger.error(f"Error in develop_sync: {e}", exc_info=True)
        raise RuntimeError(f"Error in develop_sync: {str(e)}")


def is_available() -> bool:
    """
    Check if SERGIK AI Team is available.
    
    Returns:
        True if available, False otherwise
    """
    return AI_TEAM_AVAILABLE

