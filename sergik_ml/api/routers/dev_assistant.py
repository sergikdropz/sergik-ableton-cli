"""
Dev Assistant Router

Proxy endpoints to SERGIK AI Team for development assistance.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import httpx
import logging
import os

router = APIRouter(prefix="/dev/assistant", tags=["dev-assistant"])
logger = logging.getLogger(__name__)

# Default SERGIK AI Team URL
DEFAULT_AI_TEAM_URL = os.getenv("SERGIK_AI_TEAM_URL", "http://127.0.0.1:8001")
TIMEOUT = 30.0  # 30 second timeout


class AgentMessageRequest(BaseModel):
    """Request model for agent message."""
    sender: str = Field(default="Developer", description="Message sender")
    receiver: str = Field(..., description="Agent name (DevAssistant, ControllerDev, etc.)")
    content: str = Field(..., description="Message content")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Optional metadata")


class AutoHelpRequest(BaseModel):
    """Request model for auto help."""
    task: str = Field(..., description="Development task description")


class CodeReviewRequest(BaseModel):
    """Request model for code review."""
    file_path: str = Field(..., description="File path to review")


class BestPracticesRequest(BaseModel):
    """Request model for best practices."""
    topic: str = Field(..., description="Topic for best practices")


async def _call_ai_team(endpoint: str, payload: Dict[str, Any], timeout: float = TIMEOUT) -> Dict[str, Any]:
    """
    Make HTTP request to SERGIK AI Team.
    
    Args:
        endpoint: API endpoint path (e.g., "/agent/message")
        payload: Request payload
        timeout: Request timeout in seconds
        
    Returns:
        Response data as dict
        
    Raises:
        HTTPException: If request fails
    """
    url = f"{DEFAULT_AI_TEAM_URL}{endpoint}"
    
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        logger.error(f"Timeout calling SERGIK AI Team: {url}")
        raise HTTPException(
            status_code=504,
            detail=f"Request timeout: SERGIK AI Team did not respond within {timeout} seconds"
        )
    except httpx.ConnectError:
        logger.error(f"Connection error: SERGIK AI Team not available at {url}")
        raise HTTPException(
            status_code=503,
            detail=f"SERGIK AI Team not available at {DEFAULT_AI_TEAM_URL}. Is it running?"
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error from SERGIK AI Team: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"SERGIK AI Team error: {e.response.text}"
        )
    except Exception as e:
        logger.error(f"Unexpected error calling SERGIK AI Team: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}"
        )


@router.post("/message")
async def send_agent_message(request: AgentMessageRequest):
    """
    Send message to SERGIK AI Team agent.
    
    Proxies request to SERGIK AI Team /agent/message endpoint.
    """
    try:
        payload = {
            "sender": request.sender,
            "receiver": request.receiver,
            "content": request.content,
            "metadata": request.metadata
        }
        
        result = await _call_ai_team("/agent/message", payload)
        
        return {
            "success": result.get("success", True),
            "agent": result.get("agent", request.receiver),
            "reply": result.get("reply", ""),
            "error": result.get("error")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_agent_message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents")
async def list_agents():
    """
    List available SERGIK AI Team agents.
    
    Proxies request to SERGIK AI Team /agent/list endpoint.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{DEFAULT_AI_TEAM_URL}/agent/list")
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timeout")
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=f"SERGIK AI Team not available at {DEFAULT_AI_TEAM_URL}"
        )
    except Exception as e:
        logger.error(f"Error listing agents: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def check_ai_team_health():
    """
    Check SERGIK AI Team health.
    
    Proxies request to SERGIK AI Team /health endpoint.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{DEFAULT_AI_TEAM_URL}/health")
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        return {
            "status": "timeout",
            "available": False,
            "message": "Request timeout"
        }
    except httpx.ConnectError:
        return {
            "status": "unavailable",
            "available": False,
            "message": f"SERGIK AI Team not available at {DEFAULT_AI_TEAM_URL}"
        }
    except Exception as e:
        logger.error(f"Error checking health: {e}", exc_info=True)
        return {
            "status": "error",
            "available": False,
            "message": str(e)
        }


@router.post("/auto-help")
async def auto_help(request: AutoHelpRequest):
    """
    Get automatic help from DevAssistant.
    
    Sends auto_help request to DevAssistant agent.
    """
    try:
        payload = {
            "sender": "Developer",
            "receiver": "DevAssistant",
            "content": f"auto_help: {request.task}",
            "metadata": {}
        }
        
        result = await _call_ai_team("/agent/message", payload)
        
        return {
            "success": result.get("success", True),
            "reply": result.get("reply", ""),
            "error": result.get("error")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in auto_help: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/code-review")
async def code_review(request: CodeReviewRequest):
    """
    Review code using DevAssistant.
    
    Sends code_review request to DevAssistant agent.
    """
    try:
        payload = {
            "sender": "Developer",
            "receiver": "DevAssistant",
            "content": f"code_review: {request.file_path}",
            "metadata": {}
        }
        
        result = await _call_ai_team("/agent/message", payload)
        
        return {
            "success": result.get("success", True),
            "reply": result.get("reply", ""),
            "error": result.get("error")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in code_review: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/best-practices")
async def best_practices(request: BestPracticesRequest):
    """
    Get best practices from DevAssistant.
    
    Sends best_practices request to DevAssistant agent.
    """
    try:
        payload = {
            "sender": "Developer",
            "receiver": "DevAssistant",
            "content": f"best_practices: {request.topic}",
            "metadata": {}
        }
        
        result = await _call_ai_team("/agent/message", payload)
        
        return {
            "success": result.get("success", True),
            "reply": result.get("reply", ""),
            "error": result.get("error")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in best_practices: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

