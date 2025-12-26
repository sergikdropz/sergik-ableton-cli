"""
Ableton Router

Ableton Live control endpoints via OSC.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging
import re
import time

from ...schemas import (
    CreateTrackRequest, UpdateTrackRequest, DeleteTrackRequest,
    TrackListResponse, TrackInfo,
    LoadDeviceRequest, LoadVSTRequest, SetDeviceParamRequest,
    ToggleDeviceRequest, LoadPresetRequest,
    DeviceListResponse, DeviceParamsResponse,
    CreateClipRequest, FireClipRequest, StopClipRequest,
    DuplicateClipRequest, DeleteClipRequest,
    SetClipNotesRequest, GetClipNotesRequest, UpdateClipRequest,
    ClipNotesResponse,
    BrowserSearchRequest, LoadBrowserItemRequest, HotSwapRequest,
    BrowserSearchResponse,
    FireSceneRequest, CreateSceneRequest, DeleteSceneRequest,
    DuplicateSceneRequest,
    SetTempoRequest, SetQuantizationRequest, UndoRedoRequest,
    TransportRequest, SetLocatorRequest, MixerSendRequest,
    SessionStateResponse, LiveCommandResponse,
    GPTGenerateRequest,
)
from fastapi import Depends

from ...api.dependencies import get_ableton_service
from ...services.ableton_service import AbletonService
from ...connectors.ableton_osc import osc_send
from ...utils.errors import AbletonConnectionError, ValidationError as SergikValidationError
from .browser_query_parser import parse_browser_query
from .catalog_search import search_catalog

router = APIRouter(prefix="/live", tags=["ableton"])
logger = logging.getLogger(__name__)


# ============================================================================
# Track Management
# ============================================================================

@router.post("/tracks/create", response_model=LiveCommandResponse)
def live_create_track(request: CreateTrackRequest):
    """Create a new track in Ableton Live."""
    try:
        result = request.model_dump()
        osc_send("/scp/create_track", result)
        return LiveCommandResponse(status="ok", command="create_track", result=result)
    except AbletonConnectionError as e:
        logger.error(f"Create track failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Create track validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.get("/tracks", response_model=TrackListResponse)
def live_get_tracks():
    """Get list of all tracks in the session."""
    try:
        osc_send("/scp/get_tracks", {})
        return TrackListResponse(status="ok", tracks=[], count=0)
    except AbletonConnectionError as e:
        logger.error(f"Get tracks failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))


@router.patch("/tracks/{track_index}", response_model=LiveCommandResponse)
def live_update_track(track_index: int, request: UpdateTrackRequest):
    """Update track properties."""
    try:
        updates = request.model_dump(exclude_none=True)
        updates["track_index"] = track_index
        osc_send("/scp/update_track", updates)
        return LiveCommandResponse(status="ok", command="update_track", result=updates)
    except AbletonConnectionError as e:
        logger.error(f"Update track failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Update track validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.delete("/tracks/{track_index}", response_model=LiveCommandResponse)
def live_delete_track(track_index: int):
    """Delete a track."""
    try:
        osc_send("/scp/delete_track", {"track_index": track_index})
        return LiveCommandResponse(status="ok", command="delete_track", result={"track_index": track_index})
    except AbletonConnectionError as e:
        logger.error(f"Delete track failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Delete track validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid track_index: {e}")


# ============================================================================
# Device Control
# ============================================================================

@router.post("/devices/load", response_model=LiveCommandResponse)
def live_load_device(request: LoadDeviceRequest):
    """Load a native Ableton device onto a track."""
    try:
        data = request.model_dump()
        osc_send("/scp/load_device", data)
        return LiveCommandResponse(status="ok", command="load_device", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Load device failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Load device validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/devices/load_vst", response_model=LiveCommandResponse)
def live_load_vst(request: LoadVSTRequest):
    """Load a VST/AU plugin onto a track."""
    try:
        data = request.model_dump()
        osc_send("/scp/load_vst", data)
        return LiveCommandResponse(status="ok", command="load_vst", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Load VST failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Load VST validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.get("/devices/{track_index}", response_model=DeviceListResponse)
def live_get_devices(track_index: int):
    """Get list of devices on a track."""
    try:
        osc_send("/scp/get_devices", {"track_index": track_index})
        return DeviceListResponse(status="ok", track_index=track_index, devices=[], count=0)
    except AbletonConnectionError as e:
        logger.error(f"Get devices failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))


@router.patch("/devices/param", response_model=LiveCommandResponse)
def live_set_device_param(request: SetDeviceParamRequest):
    """Set a device parameter value."""
    try:
        data = request.model_dump()
        osc_send("/scp/set_param", data)
        return LiveCommandResponse(status="ok", command="set_param", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Set param failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Set param validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.get("/devices/{track_index}/{device_index}/params", response_model=DeviceParamsResponse)
def live_get_device_params(track_index: int, device_index: int):
    """Get all parameters for a device."""
    try:
        osc_send("/scp/get_params", {"track_index": track_index, "device_index": device_index})
        return DeviceParamsResponse(
            status="ok",
            track_index=track_index,
            device_index=device_index,
            device_name="",
            params=[]
        )
    except AbletonConnectionError as e:
        logger.error(f"Get params failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/devices/toggle", response_model=LiveCommandResponse)
def live_toggle_device(request: ToggleDeviceRequest):
    """Enable/disable a device."""
    try:
        data = request.model_dump()
        osc_send("/scp/toggle_device", data)
        return LiveCommandResponse(status="ok", command="toggle_device", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Toggle device failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Toggle device validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/devices/load_preset", response_model=LiveCommandResponse)
def live_load_preset(request: LoadPresetRequest):
    """Load a preset for a device."""
    try:
        data = request.model_dump()
        osc_send("/scp/load_preset", data)
        return LiveCommandResponse(status="ok", command="load_preset", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Load preset failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Load preset validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


# ============================================================================
# Clip Management
# ============================================================================

@router.post("/clips/create", response_model=LiveCommandResponse)
def live_create_clip(request: CreateClipRequest):
    """Create a new clip in a clip slot."""
    try:
        data = request.model_dump()
        osc_send("/scp/create_clip", data)
        return LiveCommandResponse(status="ok", command="create_clip", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Create clip failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Create clip validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/clips/fire", response_model=LiveCommandResponse)
def live_fire_clip(request: FireClipRequest):
    """Fire/launch a clip."""
    try:
        data = request.model_dump()
        osc_send("/scp/fire_clip", data)
        return LiveCommandResponse(status="ok", command="fire_clip", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Fire clip failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Fire clip validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/clips/stop", response_model=LiveCommandResponse)
def live_stop_clip(request: StopClipRequest):
    """Stop a clip or all clips on a track."""
    try:
        data = request.model_dump()
        osc_send("/scp/stop_clip", data)
        return LiveCommandResponse(status="ok", command="stop_clip", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Stop clip failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Stop clip validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/clips/duplicate", response_model=LiveCommandResponse)
def live_duplicate_clip(request: DuplicateClipRequest):
    """Duplicate a clip to another slot."""
    try:
        data = request.model_dump()
        osc_send("/scp/duplicate_clip", data)
        return LiveCommandResponse(status="ok", command="duplicate_clip", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Duplicate clip failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Duplicate clip validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.delete("/clips/{track_index}/{slot_index}", response_model=LiveCommandResponse)
def live_delete_clip(track_index: int, slot_index: int):
    """Delete a clip from a slot."""
    try:
        data = {"track_index": track_index, "slot_index": slot_index}
        osc_send("/scp/delete_clip", data)
        return LiveCommandResponse(status="ok", command="delete_clip", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Delete clip failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Delete clip validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/clips/notes", response_model=LiveCommandResponse)
def live_set_clip_notes(request: SetClipNotesRequest):
    """Set MIDI notes in a clip."""
    try:
        data = request.model_dump()
        osc_send("/scp/set_clip_notes", data)
        return LiveCommandResponse(
            status="ok",
            command="set_clip_notes",
            result={"track_index": request.track_index, "slot_index": request.slot_index, "note_count": len(request.notes)}
        )
    except AbletonConnectionError as e:
        logger.error(f"Set clip notes failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Set clip notes validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.get("/clips/{track_index}/{slot_index}", response_model=ClipNotesResponse)
def live_get_clip_notes(track_index: int, slot_index: int):
    """Get MIDI notes from a clip."""
    try:
        osc_send("/scp/get_clip_notes", {"track_index": track_index, "slot_index": slot_index})
        return ClipNotesResponse(status="ok", track_index=track_index, slot_index=slot_index, notes=[], count=0)
    except AbletonConnectionError as e:
        logger.error(f"Get clip notes failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))


@router.patch("/clips/{track_index}/{slot_index}", response_model=LiveCommandResponse)
def live_update_clip(track_index: int, slot_index: int, request: UpdateClipRequest):
    """Update clip properties."""
    try:
        updates = request.model_dump(exclude_none=True)
        updates["track_index"] = track_index
        updates["slot_index"] = slot_index
        osc_send("/scp/update_clip", updates)
        return LiveCommandResponse(status="ok", command="update_clip", result=updates)
    except AbletonConnectionError as e:
        logger.error(f"Update clip failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Update clip validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


# ============================================================================
# Browser/Library
# ============================================================================

@router.get("/browser/search", response_model=BrowserSearchResponse)
def live_browser_search(query: str, category: Optional[str] = None, limit: int = 20):
    """Search the Ableton browser/library with structured query support.
    
    Supports structured queries:
    - BPM:120 or BPM:120-140 (range)
    - key:C or key:10B (Camelot notation)
    - name:kick (name pattern)
    - genre:house (genre filter)
    - Multiple filters: BPM:120, key:C, name:kick
    
    Note: Live browser results are handled by Max device via LOM.
    This endpoint returns SERGIK catalog results that can be merged.
    """
    try:
        # Parse structured query
        parsed_query = parse_browser_query(query)
        logger.debug(f"Parsed query: {parsed_query}")
        
        # Search SERGIK catalog
        catalog_results = search_catalog(parsed_query, limit=limit, category=category)
        
        # Send OSC notification (Max device will add Live browser results)
        osc_send("/scp/browser_search", {
            "query": query,
            "category": category,
            "limit": limit,
            "parsed": parsed_query
        })
        
        # Return catalog results (Max device will merge with Live browser results)
        return BrowserSearchResponse(
            status="ok",
            query=query,
            items=catalog_results,
            count=len(catalog_results)
        )
    except SergikValidationError as e:
        logger.error(f"Browser search validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except AbletonConnectionError as e:
        logger.error(f"Browser search OSC failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Browser search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Browser search failed: {e}")


@router.post("/browser/load", response_model=LiveCommandResponse)
def live_browser_load(request: LoadBrowserItemRequest):
    """Load an item from the browser to a track.
    
    The Max device will handle the actual loading via Live Object Model.
    This endpoint validates the request and sends OSC notification.
    """
    try:
        # Validate request
        if not request.item_path:
            return LiveCommandResponse(
                status="error",
                command="browser_load",
                error="item_path is required"
            )
        
        if request.track_index < 0:
            return LiveCommandResponse(
                status="error",
                command="browser_load",
                error="track_index must be >= 0"
            )
        
        data = request.model_dump()
        
        # Send OSC notification to Max device
        osc_send("/scp/browser_load", data)
        
        # Return success (Max device will perform actual load via LOM)
        return LiveCommandResponse(
            status="ok",
            command="browser_load",
            result={
                **data,
                "message": "Load command sent to Max device"
            }
        )
    except AbletonConnectionError as e:
        logger.error(f"Browser load failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Browser load validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/browser/hot_swap", response_model=LiveCommandResponse)
def live_hot_swap(request: HotSwapRequest):
    """Hot-swap a sample in Simpler/Sampler.
    
    The Max device will handle the actual hot-swap via Live Object Model.
    This endpoint validates the request and sends OSC notification.
    """
    try:
        # Validate request
        if not request.sample_path:
            return LiveCommandResponse(
                status="error",
                command="hot_swap",
                error="sample_path is required"
            )
        
        if request.track_index < 0 or request.device_index < 0:
            return LiveCommandResponse(
                status="error",
                command="hot_swap",
                error="track_index and device_index must be >= 0"
            )
        
        data = request.model_dump()
        
        # Send OSC notification to Max device
        osc_send("/scp/hot_swap", data)
        
        # Return success (Max device will perform actual hot-swap via LOM)
        return LiveCommandResponse(
            status="ok",
            command="hot_swap",
            result={
                **data,
                "message": "Hot-swap command sent to Max device"
            }
        )
    except AbletonConnectionError as e:
        logger.error(f"Hot swap failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Hot swap validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


# ============================================================================
# Session/Scene Control
# ============================================================================

@router.post("/scenes/fire", response_model=LiveCommandResponse)
def live_fire_scene(request: FireSceneRequest):
    """Fire/launch a scene."""
    try:
        data = request.model_dump()
        osc_send("/scp/fire_scene", data)
        return LiveCommandResponse(status="ok", command="fire_scene", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Fire scene failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Fire scene validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/scenes/create", response_model=LiveCommandResponse)
def live_create_scene(request: CreateSceneRequest):
    """Create a new scene."""
    try:
        data = request.model_dump()
        osc_send("/scp/create_scene", data)
        return LiveCommandResponse(status="ok", command="create_scene", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Create scene failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Create scene validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.delete("/scenes/{scene_index}", response_model=LiveCommandResponse)
def live_delete_scene(scene_index: int):
    """Delete a scene."""
    try:
        osc_send("/scp/delete_scene", {"scene_index": scene_index})
        return LiveCommandResponse(status="ok", command="delete_scene", result={"scene_index": scene_index})
    except AbletonConnectionError as e:
        logger.error(f"Delete scene failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Delete scene validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/scenes/{scene_index}/duplicate", response_model=LiveCommandResponse)
def live_duplicate_scene(scene_index: int):
    """Duplicate a scene."""
    try:
        osc_send("/scp/duplicate_scene", {"scene_index": scene_index})
        return LiveCommandResponse(status="ok", command="duplicate_scene", result={"scene_index": scene_index})
    except AbletonConnectionError as e:
        logger.error(f"Duplicate scene failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Duplicate scene validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/session/tempo", response_model=LiveCommandResponse)
def live_set_tempo(request: SetTempoRequest):
    """Set session tempo."""
    try:
        data = request.model_dump()
        osc_send("/scp/set_tempo", data)
        return LiveCommandResponse(status="ok", command="set_tempo", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Set tempo failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Set tempo validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/session/quantization", response_model=LiveCommandResponse)
def live_set_quantization(request: SetQuantizationRequest):
    """Set global clip trigger quantization."""
    try:
        data = request.model_dump()
        osc_send("/scp/set_quantization", data)
        return LiveCommandResponse(status="ok", command="set_quantization", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Set quantization failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Set quantization validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/session/undo", response_model=LiveCommandResponse)
def live_undo():
    """Undo last action."""
    try:
        osc_send("/scp/undo", {})
        return LiveCommandResponse(status="ok", command="undo", result={})
    except AbletonConnectionError as e:
        logger.error(f"Undo failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/session/redo", response_model=LiveCommandResponse)
def live_redo():
    """Redo last undone action."""
    try:
        osc_send("/scp/redo", {})
        return LiveCommandResponse(status="ok", command="redo", result={})
    except AbletonConnectionError as e:
        logger.error(f"Redo failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/session/state", response_model=SessionStateResponse)
def live_get_session_state():
    """Get full session state."""
    try:
        osc_send("/scp/get_session_state", {})
        return SessionStateResponse(
            status="ok",
            tempo=120.0,
            is_playing=False,
            is_recording=False,
            current_song_time=0.0,
            loop_start=0.0,
            loop_length=4.0,
            track_count=0,
            scene_count=0,
            return_track_count=0,
            quantization="1_bar",
            tracks=[],
            scenes=[]
        )
    except AbletonConnectionError as e:
        logger.error(f"Get session state failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Get session state failed: {e}", exc_info=True)
        return SessionStateResponse(
            status="error",
            tempo=0,
            is_playing=False,
            is_recording=False,
            current_song_time=0,
            loop_start=0,
            loop_length=0,
            track_count=0,
            scene_count=0,
            return_track_count=0,
            quantization="",
            tracks=[],
            scenes=[],
            error=str(e)
        )


@router.post("/transport/{action}", response_model=LiveCommandResponse)
def live_transport(action: str):
    """Control transport. Actions: play, stop, record, continue, stop_all_clips"""
    try:
        if action not in ["play", "stop", "record", "continue", "stop_all_clips"]:
            return LiveCommandResponse(status="error", command="transport", error=f"Unknown action: {action}")
        osc_send(f"/scp/transport_{action}", {})
        return LiveCommandResponse(status="ok", command=f"transport_{action}", result={"action": action})
    except AbletonConnectionError as e:
        logger.error(f"Transport {action} failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Transport {action} validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/mixer/send", response_model=LiveCommandResponse)
def live_set_send(request: MixerSendRequest):
    """Set mixer send level."""
    try:
        data = request.model_dump()
        osc_send("/scp/set_send", data)
        return LiveCommandResponse(status="ok", command="set_send", result=data)
    except AbletonConnectionError as e:
        logger.error(f"Set send failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Set send validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")


@router.post("/command", response_model=LiveCommandResponse)
def live_natural_language_command(request: GPTGenerateRequest):
    """Execute a natural language command for Ableton Live."""
    try:
        prompt = request.prompt.lower()
        result = {"prompt": request.prompt, "actions": []}
        
        # Parse common commands
        if "create" in prompt and "track" in prompt:
            track_type = "midi" if "midi" in prompt else ("audio" if "audio" in prompt else "midi")
            name_match = re.search(r"['\"]([^'\"]+)['\"]", request.prompt)
            name = name_match.group(1) if name_match else None
            osc_send("/scp/create_track", {"track_type": track_type, "name": name})
            result["actions"].append({"action": "create_track", "track_type": track_type, "name": name})
            result["description"] = f"Created {track_type} track" + (f" named '{name}'" if name else "")
        elif "tempo" in prompt:
            tempo_match = re.search(r"(\d+(?:\.\d+)?)", prompt)
            if tempo_match:
                tempo = float(tempo_match.group(1))
                osc_send("/scp/set_tempo", {"tempo": tempo})
                result["actions"].append({"action": "set_tempo", "tempo": tempo})
                result["description"] = f"Set tempo to {tempo} BPM"
        elif "mute" in prompt and "track" in prompt:
            track_match = re.search(r"track\s*(\d+)", prompt)
            if track_match:
                track_idx = int(track_match.group(1))
                osc_send("/scp/update_track", {"track_index": track_idx, "mute": True})
                result["actions"].append({"action": "mute_track", "track_index": track_idx})
                result["description"] = f"Muted track {track_idx}"
        elif "play" in prompt:
            osc_send("/scp/transport_play", {})
            result["actions"].append({"action": "play"})
            result["description"] = "Started playback"
        elif "stop" in prompt:
            osc_send("/scp/transport_stop", {})
            result["actions"].append({"action": "stop"})
            result["description"] = "Stopped playback"
        else:
            result["description"] = "Command not recognized. Try: create track, set tempo, mute/solo track, fire scene, play, stop"
        
        return LiveCommandResponse(status="ok", command="natural_language", result=result)
    except AbletonConnectionError as e:
        logger.error(f"Natural language command failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=str(e))
    except (ValueError, TypeError) as e:
        logger.error(f"Natural language command validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid request: {e}")

