"""
SERGIK ML Ableton OSC Connector

Sends OSC messages to Max for Live devices in Ableton.

OSC Addresses:
  /scp/status           - Status messages for UI display
  /scp/similar_results  - Similar track search results
  /scp/tts_ready        - TTS audio file ready notification
  /scp/set_tempo        - Set Ableton tempo
  /scp/add_device       - Add device to track
  /scp/set_param        - Set device parameter
"""

from pythonosc.udp_client import SimpleUDPClient
from typing import Any, Dict, Optional, List
import json
import logging

from ..config import CFG

logger = logging.getLogger(__name__)

# Lazy-initialized OSC client
_client: Optional[SimpleUDPClient] = None


def _get_client() -> SimpleUDPClient:
    """Get or create OSC client."""
    global _client
    if _client is None:
        _client = SimpleUDPClient(CFG.ableton_osc_host, CFG.ableton_osc_port)
        logger.info(f"OSC client initialized: {CFG.ableton_osc_host}:{CFG.ableton_osc_port}")
    return _client


def osc_send(address: str, payload: Dict[str, Any]) -> bool:
    """
    Send OSC message to Ableton.

    In Max for Live:
      [udpreceive 9000] -> [route /scp/status ...] -> [fromsymbol] -> [dict.deserialize]
    """
    try:
        client = _get_client()
        client.send_message(address, [json.dumps(payload)])
        logger.debug(f"OSC sent: {address} -> {payload}")
        return True
    except Exception as e:
        logger.error(f"OSC send failed: {e}")
        return False


def osc_status(text: str, **extra) -> bool:
    """Send status message to Ableton UI."""
    return osc_send("/scp/status", {"text": text, **extra})


def osc_similar_results(track_id: str, similar_list: List[Dict[str, Any]]) -> bool:
    """Send similar track results to Ableton."""
    return osc_send("/scp/similar_results", {
        "track_id": track_id,
        "similar": similar_list,
        "count": len(similar_list)
    })


def osc_tts_ready(path: str) -> bool:
    """Notify Ableton that TTS audio is ready."""
    return osc_send("/scp/tts_ready", {"path": path})


def osc_pack_ready(pack_id: str, export_dir: str, track_count: int) -> bool:
    """Notify Ableton that sample pack is ready."""
    return osc_send("/scp/pack_ready", {
        "pack_id": pack_id,
        "export_dir": export_dir,
        "track_count": track_count
    })


def osc_error(error: str, cmd: Optional[str] = None) -> bool:
    """Send error message to Ableton."""
    return osc_send("/scp/error", {"error": error, "cmd": cmd})
