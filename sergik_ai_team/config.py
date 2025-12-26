"""
Agent System Configuration
"""

import os
import logging
from pathlib import Path
from typing import List, Optional

logger = logging.getLogger(__name__)

# Base paths
BASE_DIR = Path(__file__).parent.parent
AGENT_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
KNOWLEDGE_DIR = DATA_DIR / "knowledge"

# Agent configuration
AGENTS = [
    "SergikCore",
    "VSTCraft",
    "MaxNode",
    "GrooveSense",
    "AuralBrain",
    "AbleAgent",
    "Memoria",
    "ControllerDev"
]

# Data file paths
KNOWLEDGE_PATH = KNOWLEDGE_DIR / "knowledge_chunks.jsonl"
FINETUNE_PATH = DATA_DIR / "sergik_finetune.jsonl"
CONTROLLER_CODE_PATH = BASE_DIR / "maxforlive" / "SERGIK_AI_Controller.js"

# SERGIK ML integration
SERGIK_ML_API_URL = os.getenv("SERGIK_ML_API_URL", "http://127.0.0.1:8000")
SERGIK_ML_OSC_HOST = os.getenv("SERGIK_ABLETON_OSC_HOST", "127.0.0.1")
SERGIK_ML_OSC_PORT = int(os.getenv("SERGIK_ABLETON_OSC_PORT", "9000"))

# Agent system
AGENT_PORT = int(os.getenv("AGENT_PORT", "8001"))
AGENT_HOST = os.getenv("AGENT_HOST", "0.0.0.0")

# Controller development
CONTROLLER_DEV_MODE = os.getenv("CONTROLLER_DEV_MODE", "true").lower() == "true"


def validate_paths() -> dict:
    """
    Validate that required paths exist or can be created.
    Returns dict with validation results.
    """
    results = {
        "valid": True,
        "errors": [],
        "warnings": []
    }
    
    # Required directories
    required_dirs = [
        ("DATA_DIR", DATA_DIR),
        ("KNOWLEDGE_DIR", KNOWLEDGE_DIR),
        ("BASE_DIR", BASE_DIR),
    ]
    
    for name, path in required_dirs:
        if not path.exists():
            try:
                path.mkdir(parents=True, exist_ok=True)
                results["warnings"].append(f"Created missing directory: {name} ({path})")
            except Exception as e:
                results["valid"] = False
                results["errors"].append(f"Cannot create {name} at {path}: {e}")
    
    # Optional files (warn if missing)
    optional_files = [
        ("KNOWLEDGE_PATH", KNOWLEDGE_PATH),
        ("FINETUNE_PATH", FINETUNE_PATH),
        ("CONTROLLER_CODE_PATH", CONTROLLER_CODE_PATH),
    ]
    
    for name, path in optional_files:
        if not path.exists():
            results["warnings"].append(f"Optional file not found: {name} ({path})")
    
    return results


def validate_config() -> bool:
    """
    Validate configuration on startup.
    Returns True if valid, False otherwise.
    """
    # Validate paths
    path_results = validate_paths()
    
    if path_results["errors"]:
        for error in path_results["errors"]:
            logger.error(f"Config validation error: {error}")
    
    if path_results["warnings"]:
        for warning in path_results["warnings"]:
            logger.warning(f"Config validation warning: {warning}")
    
    # Validate port range
    if not (1024 <= AGENT_PORT <= 65535):
        logger.error(f"Invalid AGENT_PORT: {AGENT_PORT} (must be 1024-65535)")
        return False
    
    # Validate OSC port range
    if not (1024 <= SERGIK_ML_OSC_PORT <= 65535):
        logger.error(f"Invalid SERGIK_ML_OSC_PORT: {SERGIK_ML_OSC_PORT} (must be 1024-65535)")
        return False
    
    return path_results["valid"]

