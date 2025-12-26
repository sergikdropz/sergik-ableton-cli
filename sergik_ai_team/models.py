"""
Shared Data Models for Agent System
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    """Message types for agent communication."""
    COMMAND = "command"
    QUERY = "query"
    RESPONSE = "response"
    ERROR = "error"
    STATUS = "status"


class Message(BaseModel):
    """Agent message model."""
    sender: str = Field(..., description="Sender agent name")
    receiver: str = Field(..., description="Receiver agent name")
    content: str = Field(..., description="Message content")
    message_type: MessageType = Field(default=MessageType.COMMAND)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.now)
    correlation_id: Optional[str] = None


class AgentResponse(BaseModel):
    """Agent response model."""
    agent: str
    reply: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    success: bool = True
    error: Optional[str] = None


class ControllerFeature(BaseModel):
    """Controller feature definition."""
    name: str
    description: str
    commands: List[str]
    implementation: Optional[str] = None
    status: str = "pending"  # pending, implemented, tested


class ControllerAnalysis(BaseModel):
    """Controller code analysis result."""
    total_commands: int
    implemented_features: List[str]
    missing_features: List[str]
    code_suggestions: List[str]
    test_coverage: float = 0.0

