"""
SERGIK AI TEAM - Multi-Agent Orchestration
Integrated with SERGIK ML Backend
"""

import sys
import asyncio
import time
from pathlib import Path
from typing import Dict, Any, Callable
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator, Field
import uvicorn
import logging
import structlog

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from .models import Message, AgentResponse, MessageType
from .bridge import get_bridge, is_available
from .config import AGENTS, AGENT_PORT, AGENT_HOST, CONTROLLER_DEV_MODE, validate_config
from .agents.core_agent import sergik_core_handler
from .agents.generation_agent import vstcraft_handler
from .agents.ableton_agent import ableagent_handler
from .agents.analysis_agent import groovesense_handler
from .agents.maxnode_agent import maxnode_handler
from .agents.controller_dev_agent import controller_dev_handler
from .agents.memoria_agent import memoria_handler
from .agents.dev_assistant_agent import dev_assistant_handler

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=logging.INFO,
)

logger = structlog.get_logger(__name__)

# ==== AGENT CLASS ====

class Agent:
    """Agent wrapper."""
    def __init__(self, name: str, role: str, handler: Callable):
        self.name = name
        self.role = role
        self.handler = handler

    async def handle(self, msg: Message) -> str:
        try:
            return await self.handler(msg)
        except Exception as e:
            logger.error(f"Agent {self.name} error: {e}", exc_info=True)
            return f"Error: {str(e)}"

# ==== AGENT MAP ====

AGENT_MAP: Dict[str, Agent] = {
    "SergikCore": Agent("SergikCore", "Coordinator", 
                       lambda msg: sergik_core_handler(msg, AGENT_MAP)),
    "VSTCraft": Agent("VSTCraft", "DSP Dev", vstcraft_handler),
    "MaxNode": Agent("MaxNode", "M4L Specialist", maxnode_handler),
    "GrooveSense": Agent("GrooveSense", "Musicologist", groovesense_handler),
    "AbleAgent": Agent("AbleAgent", "Bridge", ableagent_handler),
    "ControllerDev": Agent("ControllerDev", "Developer", controller_dev_handler),
    "DevAssistant": Agent("DevAssistant", "Code Helper", dev_assistant_handler),
}

# Memoria agent (always available)
AGENT_MAP["Memoria"] = Agent("Memoria", "Knowledge Base", memoria_handler)

# AuralBrain agent (always available)
from .agents.auralbrain_agent import auralbrain_handler
AGENT_MAP["AuralBrain"] = Agent("AuralBrain", "Trainer", auralbrain_handler)

# ==== FASTAPI APP ====

app = FastAPI(
    title="SERGIK AI Team",
    description="Multi-agent orchestration with SERGIK ML integration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==== MODELS ====

class ChatInput(BaseModel):
    """Input model for agent messages with validation."""
    sender: str = Field(default="User", max_length=100)
    receiver: str = Field(..., max_length=100)
    content: str = Field(..., min_length=1, max_length=10000)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    @field_validator('content')
    @classmethod
    def content_not_empty(cls, v):
        """Validate content is not empty."""
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        return v.strip()
    
    @field_validator('receiver')
    @classmethod
    def receiver_valid(cls, v):
        """Validate receiver is a known agent."""
        # Note: This will be checked in the endpoint, but we validate format here
        if not v or not v.strip():
            raise ValueError('Receiver cannot be empty')
        return v.strip()
    
    @field_validator('sender')
    @classmethod
    def sender_valid(cls, v):
        """Validate sender format."""
        if not v or not v.strip():
            return "User"
        return v.strip()

# ==== MIDDLEWARE ====

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add process time header to responses."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# ==== ENDPOINTS ====

@app.post("/agent/message", response_model=AgentResponse)
async def send_agent_message(payload: ChatInput, request: Request):
    """Send message to agent with validation and logging."""
    # Validate receiver exists
    if payload.receiver not in AGENT_MAP:
        logger.warning(
            "unknown_agent",
            receiver=payload.receiver,
            available_agents=list(AGENT_MAP.keys()),
            client_ip=request.client.host if request.client else None
        )
        raise HTTPException(
            404,
            detail=f"Unknown agent: {payload.receiver}. Available: {list(AGENT_MAP.keys())}"
        )
    
    # Log request
    logger.info(
        "agent_message_request",
        sender=payload.sender,
        receiver=payload.receiver,
        content_length=len(payload.content),
        client_ip=request.client.host if request.client else None
    )
    
    agent = AGENT_MAP[payload.receiver]
    msg = Message(
        sender=payload.sender,
        receiver=payload.receiver,
        content=payload.content,
        metadata=payload.metadata
    )
    
    try:
        start_time = time.time()
        reply = await agent.handle(msg)
        process_time = time.time() - start_time
        
        logger.info(
            "agent_message_success",
            receiver=payload.receiver,
            reply_length=len(reply),
            process_time=process_time
        )
        
        return AgentResponse(
            agent=payload.receiver,
            reply=reply,
            success=True
        )
    except Exception as e:
        logger.error(
            "agent_message_error",
            receiver=payload.receiver,
            error=str(e),
            error_type=type(e).__name__,
            exc_info=True
        )
        return AgentResponse(
            agent=payload.receiver,
            reply=f"Error processing request: {str(e)}",
            success=False,
            error=str(e)
        )

@app.get("/agent/list")
async def list_agents():
    """List all agents."""
    return {
        "agents": [{"name": a.name, "role": a.role} for a in AGENT_MAP.values()],
        "sergik_ml_available": is_available(),
        "controller_dev_mode": CONTROLLER_DEV_MODE
    }

@app.get("/health")
async def health():
    """Comprehensive health check."""
    health_status = {
        "status": "ok",
        "agents": len(AGENT_MAP),
        "sergik_ml": "available" if is_available() else "unavailable",
        "timestamp": time.time()
    }
    
    # Add detailed service health if available
    if is_available():
        try:
            bridge = get_bridge()
            service_health = bridge.check_health()
            health_status["services"] = service_health["services"]
            health_status["all_services_healthy"] = service_health["healthy"]
            
            if not service_health["healthy"]:
                health_status["status"] = "degraded"
        except Exception as e:
            logger.warning("health_check_error", error=str(e))
            health_status["service_health_error"] = str(e)
    
    return health_status

@app.get("/")
async def root():
    return {
        "status": "SERGIK AI TEAM ONLINE",
        "agents": list(AGENT_MAP.keys()),
        "sergik_ml": "integrated" if is_available() else "not available",
        "endpoints": {
            "agents": "/agent/list",
            "message": "/agent/message",
            "health": "/health"
        }
    }

# ==== STARTUP ====

@app.on_event("startup")
async def startup():
    """Initialize on startup with validation."""
    logger.info("startup_init", message="🚀 SERGIK AI TEAM starting...")
    logger.info("startup_agents", agents=list(AGENT_MAP.keys()), count=len(AGENT_MAP))
    
    # Validate configuration
    config_valid = validate_config()
    if not config_valid:
        logger.error("startup_config_invalid", message="Configuration validation failed")
    else:
        logger.info("startup_config_valid", message="Configuration validated")
    
    # Check SERGIK ML availability
    if is_available():
        try:
            bridge = get_bridge()
            health = bridge.check_health(use_cache=False)
            logger.info(
                "startup_sergik_ml_connected",
                message="✅ SERGIK ML services connected",
                services_healthy=health["healthy"],
                service_status=health["services"]
            )
        except Exception as e:
            logger.warning("startup_sergik_ml_bridge_error", error=str(e), exc_info=True)
    else:
        logger.warning("startup_sergik_ml_unavailable", message="⚠️ SERGIK ML services not available")

# ==== RUN ====

if __name__ == "__main__":
    print("🚀 SERGIK AI TEAM + ML INTEGRATION")
    print(f"Agents: {', '.join(AGENT_MAP.keys())}")
    print(f"SERGIK ML: {'✅ Available' if is_available() else '❌ Not Available'}")
    print(f"Port: {AGENT_PORT}")
    
    uvicorn.run(
        app,
        host=AGENT_HOST,
        port=AGENT_PORT,
        log_level="info"
    )

