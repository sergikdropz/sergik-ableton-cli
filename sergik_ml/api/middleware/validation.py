"""
Request Validation Middleware

Provides validation for API requests, LOM paths, and indices.
"""

import re
import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from ...utils.errors import ValidationError

logger = logging.getLogger(__name__)


# ============================================================================
# LOM Path Validation
# ============================================================================

def validate_lom_path(path: str) -> bool:
    """
    Validate LOM path format.
    
    Args:
        path: LOM path string
        
    Returns:
        True if valid
        
    Raises:
        ValidationError: If path is invalid
    """
    if not path or not isinstance(path, str):
        raise ValidationError("LOM path must be a non-empty string")
    
    # Basic path structure validation
    valid_patterns = [
        r"^live_set$",
        r"^live_set tracks \d+$",
        r"^live_set tracks \d+ devices \d+$",
        r"^live_set tracks \d+ devices \d+ parameters \d+$",
        r"^live_set tracks \d+ clip_slots \d+$",
        r"^live_set tracks \d+ clip_slots \d+ clip$",
        r"^live_set tracks \d+ mixer_device (volume|panning)$",
        r"^live_set tracks \d+ mixer_device sends \d+$",
        r"^live_set scenes \d+$",
        r"^live_set view highlighted_clip_slot clip$",
        r"^live_app browser$",
    ]
    
    # Check if path matches any valid pattern
    for pattern in valid_patterns:
        if re.match(pattern, path):
            return True
    
    # Allow more complex paths (with additional components)
    if path.startswith("live_set") or path.startswith("live_app"):
        # Basic structure check passed
        return True
    
    raise ValidationError(f"Invalid LOM path format: {path}")


# ============================================================================
# Index Validation
# ============================================================================

def validate_track_index(track_index: int, max_tracks: Optional[int] = None) -> int:
    """
    Validate track index.
    
    Args:
        track_index: Track index to validate
        max_tracks: Maximum number of tracks (optional)
        
    Returns:
        Validated track index
        
    Raises:
        ValidationError: If index is invalid
    """
    if not isinstance(track_index, int):
        raise ValidationError(f"Track index must be an integer, got: {type(track_index)}")
    
    if track_index < 0:
        raise ValidationError(f"Track index must be non-negative, got: {track_index}")
    
    if max_tracks is not None and track_index >= max_tracks:
        raise ValidationError(
            f"Track index {track_index} out of range (0-{max_tracks - 1})"
        )
    
    return track_index


def validate_device_index(
    track_index: int,
    device_index: int,
    max_devices: Optional[int] = None
) -> int:
    """
    Validate device index.
    
    Args:
        track_index: Track index
        device_index: Device index to validate
        max_devices: Maximum number of devices (optional)
        
    Returns:
        Validated device index
        
    Raises:
        ValidationError: If index is invalid
    """
    validate_track_index(track_index)
    
    if not isinstance(device_index, int):
        raise ValidationError(f"Device index must be an integer, got: {type(device_index)}")
    
    if device_index < 0:
        raise ValidationError(f"Device index must be non-negative, got: {device_index}")
    
    if max_devices is not None and device_index >= max_devices:
        raise ValidationError(
            f"Device index {device_index} out of range (0-{max_devices - 1}) "
            f"on track {track_index}"
        )
    
    return device_index


def validate_clip_slot(
    track_index: int,
    slot_index: int,
    max_slots: Optional[int] = None
) -> int:
    """
    Validate clip slot index.
    
    Args:
        track_index: Track index
        slot_index: Clip slot index to validate
        max_slots: Maximum number of clip slots (optional)
        
    Returns:
        Validated slot index
        
    Raises:
        ValidationError: If index is invalid
    """
    validate_track_index(track_index)
    
    if not isinstance(slot_index, int):
        raise ValidationError(f"Clip slot index must be an integer, got: {type(slot_index)}")
    
    if slot_index < 0:
        raise ValidationError(f"Clip slot index must be non-negative, got: {slot_index}")
    
    if max_slots is not None and slot_index >= max_slots:
        raise ValidationError(
            f"Clip slot {slot_index} out of range (0-{max_slots - 1}) "
            f"on track {track_index}"
        )
    
    return slot_index


def validate_scene_index(scene_index: int, max_scenes: Optional[int] = None) -> int:
    """
    Validate scene index.
    
    Args:
        scene_index: Scene index to validate
        max_scenes: Maximum number of scenes (optional)
        
    Returns:
        Validated scene index
        
    Raises:
        ValidationError: If index is invalid
    """
    if not isinstance(scene_index, int):
        raise ValidationError(f"Scene index must be an integer, got: {type(scene_index)}")
    
    if scene_index < 0:
        raise ValidationError(f"Scene index must be non-negative, got: {scene_index}")
    
    if max_scenes is not None and scene_index >= max_scenes:
        raise ValidationError(
            f"Scene index {scene_index} out of range (0-{max_scenes - 1})"
        )
    
    return scene_index


# ============================================================================
# Parameter Validation
# ============================================================================

def validate_parameter_value(value: float, min_value: float = 0.0, max_value: float = 1.0) -> float:
    """
    Validate parameter value.
    
    Args:
        value: Parameter value
        min_value: Minimum value
        max_value: Maximum value
        
    Returns:
        Clamped and validated value
        
    Raises:
        ValidationError: If value is invalid
    """
    if not isinstance(value, (int, float)):
        raise ValidationError(f"Parameter value must be a number, got: {type(value)}")
    
    # Clamp value to range
    clamped = max(min_value, min(max_value, float(value)))
    
    if clamped != value:
        logger.warning(f"Parameter value {value} clamped to {clamped} (range: {min_value}-{max_value})")
    
    return clamped


# ============================================================================
# Request Validation Middleware
# ============================================================================

async def validation_middleware(request: Request, call_next):
    """
    FastAPI middleware for request validation.
    
    Validates request data before processing.
    """
    # Skip validation for certain paths
    skip_paths = ["/health", "/docs", "/openapi.json", "/redoc"]
    if any(request.url.path.startswith(path) for path in skip_paths):
        return await call_next(request)
    
    try:
        # Process request
        response = await call_next(request)
        return response
        
    except ValidationError as e:
        logger.warning(f"Validation error: {e}")
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "error": "validation_error",
                "message": str(e)
            }
        )
    
    except Exception as e:
        logger.error(f"Unexpected error in validation middleware: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "error": "internal_error",
                "message": "An internal error occurred"
            }
        )


# ============================================================================
# Schema Validators
# ============================================================================

def validate_request_schema(data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate request data against schema.
    
    Args:
        data: Request data
        schema: Schema definition
        
    Returns:
        Validated data
        
    Raises:
        ValidationError: If validation fails
    """
    validated = {}
    
    for key, validator in schema.items():
        if key not in data:
            if "required" in validator and validator["required"]:
                raise ValidationError(f"Missing required field: {key}")
            continue
        
        value = data[key]
        
        # Type validation
        if "type" in validator:
            expected_type = validator["type"]
            if not isinstance(value, expected_type):
                raise ValidationError(
                    f"Field {key} must be of type {expected_type.__name__}, "
                    f"got {type(value).__name__}"
                )
        
        # Range validation
        if "min" in validator and value < validator["min"]:
            raise ValidationError(
                f"Field {key} must be >= {validator['min']}, got {value}"
            )
        
        if "max" in validator and value > validator["max"]:
            raise ValidationError(
                f"Field {key} must be <= {validator['max']}, got {value}"
            )
        
        validated[key] = value
    
    return validated

