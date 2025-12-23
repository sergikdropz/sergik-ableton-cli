"""
SERGIK ML Bidirectional OSC Communication

Two-way OSC communication between SERGIK ML and Ableton Live:
  - Outgoing: ML Service -> Ableton (commands, status, TTS)
  - Incoming: Ableton -> ML Service (track info, clip selection, transport state)

Setup in Max for Live:
  [udpsend 127.0.0.1 8002]  # Send to ML service
  [udpreceive 8001]          # Receive from ML service
"""

import logging
import threading
import json
from typing import Dict, Any, Optional, Callable, List
from dataclasses import dataclass, field
from datetime import datetime

from ..config import CFG

logger = logging.getLogger(__name__)

# Try to import OSC libraries
try:
    from pythonosc import udp_client, dispatcher, osc_server
    OSC_AVAILABLE = True
except ImportError:
    OSC_AVAILABLE = False
    logger.warning("python-osc not installed. Install: pip install python-osc")


@dataclass
class AbletonState:
    """Current state of Ableton Live session."""
    tempo: float = 120.0
    is_playing: bool = False
    current_track: int = 0
    current_clip: int = -1
    current_track_name: str = ""
    current_clip_name: str = ""
    current_file_path: str = ""
    selected_track_id: str = ""
    track_count: int = 0
    last_update: datetime = field(default_factory=datetime.now)


class BidirectionalOSC:
    """
    Bidirectional OSC communication with Ableton Live.

    Handles both sending commands to Ableton and receiving
    state updates from Ableton.
    """

    def __init__(
        self,
        send_host: str = None,
        send_port: int = None,
        receive_port: int = None,
    ):
        """
        Initialize bidirectional OSC.

        Args:
            send_host: Host to send to (default: from config)
            send_port: Port to send to (default: from config)
            receive_port: Port to receive on (default: send_port + 1)
        """
        self.send_host = send_host or CFG.ableton_osc_host
        self.send_port = send_port or CFG.ableton_osc_port
        self.receive_port = receive_port or (self.send_port + 1)

        self._client: Optional[udp_client.SimpleUDPClient] = None
        self._server: Optional[osc_server.ThreadingOSCUDPServer] = None
        self._server_thread: Optional[threading.Thread] = None
        self._dispatcher = None

        self.state = AbletonState()
        self._callbacks: Dict[str, List[Callable]] = {}

        if OSC_AVAILABLE:
            self._init_client()
            self._init_dispatcher()

    def _init_client(self):
        """Initialize OSC client for sending."""
        try:
            self._client = udp_client.SimpleUDPClient(self.send_host, self.send_port)
            logger.info(f"OSC client ready: {self.send_host}:{self.send_port}")
        except Exception as e:
            logger.error(f"OSC client init failed: {e}")

    def _init_dispatcher(self):
        """Initialize OSC dispatcher for receiving."""
        self._dispatcher = dispatcher.Dispatcher()

        # Register handlers for incoming messages
        self._dispatcher.map("/ableton/tempo", self._handle_tempo)
        self._dispatcher.map("/ableton/transport", self._handle_transport)
        self._dispatcher.map("/ableton/track/selected", self._handle_track_selected)
        self._dispatcher.map("/ableton/clip/selected", self._handle_clip_selected)
        self._dispatcher.map("/ableton/clip/info", self._handle_clip_info)
        self._dispatcher.map("/ableton/track/count", self._handle_track_count)
        self._dispatcher.map("/ableton/error", self._handle_error)

        # Catch-all for debugging
        self._dispatcher.set_default_handler(self._handle_unknown)

    def start_server(self):
        """Start OSC server for receiving messages."""
        if not OSC_AVAILABLE:
            logger.error("OSC not available")
            return False

        if self._server:
            logger.warning("OSC server already running")
            return True

        try:
            self._server = osc_server.ThreadingOSCUDPServer(
                ("0.0.0.0", self.receive_port),
                self._dispatcher,
            )

            self._server_thread = threading.Thread(
                target=self._server.serve_forever,
                daemon=True,
            )
            self._server_thread.start()

            logger.info(f"OSC server listening on port {self.receive_port}")
            return True

        except Exception as e:
            logger.error(f"OSC server start failed: {e}")
            return False

    def stop_server(self):
        """Stop OSC server."""
        if self._server:
            self._server.shutdown()
            self._server = None
            self._server_thread = None
            logger.info("OSC server stopped")

    # ========================================================================
    # Outgoing Messages (ML -> Ableton)
    # ========================================================================

    def send(self, address: str, *args) -> bool:
        """Send OSC message to Ableton."""
        if not self._client:
            logger.warning("OSC client not available")
            return False

        try:
            # Convert complex types to JSON
            processed_args = []
            for arg in args:
                if isinstance(arg, (dict, list)):
                    processed_args.append(json.dumps(arg))
                else:
                    processed_args.append(arg)

            self._client.send_message(address, processed_args)
            return True

        except Exception as e:
            logger.error(f"OSC send failed: {e}")
            return False

    def send_status(self, text: str, **extra) -> bool:
        """Send status message to Ableton."""
        return self.send("/scp/status", json.dumps({"text": text, **extra}))

    def send_similar_results(self, track_id: str, results: List[Dict]) -> bool:
        """Send similarity search results."""
        return self.send(
            "/scp/similar_results",
            json.dumps({"track_id": track_id, "similar": results}),
        )

    def send_tts_ready(self, path: str) -> bool:
        """Notify that TTS audio is ready."""
        return self.send("/scp/tts_ready", json.dumps({"path": path}))

    def send_pack_ready(self, pack_id: str, export_dir: str) -> bool:
        """Notify that sample pack is ready."""
        return self.send(
            "/scp/pack_ready",
            json.dumps({"pack_id": pack_id, "export_dir": export_dir}),
        )

    def set_tempo(self, bpm: float) -> bool:
        """Set Ableton tempo."""
        return self.send("/scp/set_tempo", float(bpm))

    def fire_clip(self, track: int, clip: int) -> bool:
        """Fire a clip in Ableton."""
        return self.send("/scp/fire_clip", int(track), int(clip))

    def request_state(self) -> bool:
        """Request full state update from Ableton."""
        return self.send("/scp/request_state", 1)

    # ========================================================================
    # Incoming Message Handlers (Ableton -> ML)
    # ========================================================================

    def _handle_tempo(self, address: str, *args):
        """Handle tempo update from Ableton."""
        if args:
            self.state.tempo = float(args[0])
            self.state.last_update = datetime.now()
            self._trigger_callbacks("tempo", self.state.tempo)
            logger.debug(f"Tempo updated: {self.state.tempo}")

    def _handle_transport(self, address: str, *args):
        """Handle transport state update."""
        if args:
            self.state.is_playing = bool(args[0])
            self.state.last_update = datetime.now()
            self._trigger_callbacks("transport", self.state.is_playing)
            logger.debug(f"Transport: {'playing' if self.state.is_playing else 'stopped'}")

    def _handle_track_selected(self, address: str, *args):
        """Handle track selection."""
        if len(args) >= 2:
            self.state.current_track = int(args[0])
            self.state.current_track_name = str(args[1]) if len(args) > 1 else ""
            self.state.last_update = datetime.now()
            self._trigger_callbacks("track_selected", {
                "index": self.state.current_track,
                "name": self.state.current_track_name,
            })
            logger.debug(f"Track selected: {self.state.current_track} - {self.state.current_track_name}")

    def _handle_clip_selected(self, address: str, *args):
        """Handle clip selection."""
        if len(args) >= 3:
            self.state.current_track = int(args[0])
            self.state.current_clip = int(args[1])
            self.state.current_clip_name = str(args[2]) if len(args) > 2 else ""
            self.state.last_update = datetime.now()

            # Try to extract track_id from clip name
            if self.state.current_clip_name:
                # Remove common suffixes
                track_id = self.state.current_clip_name
                for suffix in [".wav", ".mp3", ".aif", ".aiff"]:
                    track_id = track_id.replace(suffix, "")
                self.state.selected_track_id = track_id

            self._trigger_callbacks("clip_selected", {
                "track": self.state.current_track,
                "clip": self.state.current_clip,
                "name": self.state.current_clip_name,
                "track_id": self.state.selected_track_id,
            })
            logger.debug(f"Clip selected: {self.state.current_track}/{self.state.current_clip}")

    def _handle_clip_info(self, address: str, *args):
        """Handle clip info (file path, etc.)."""
        if args:
            try:
                info = json.loads(args[0]) if isinstance(args[0], str) else args[0]
                if "file_path" in info:
                    self.state.current_file_path = info["file_path"]
                self._trigger_callbacks("clip_info", info)
            except json.JSONDecodeError:
                pass

    def _handle_track_count(self, address: str, *args):
        """Handle track count update."""
        if args:
            self.state.track_count = int(args[0])
            self._trigger_callbacks("track_count", self.state.track_count)

    def _handle_error(self, address: str, *args):
        """Handle error from Ableton."""
        error_msg = str(args[0]) if args else "Unknown error"
        logger.error(f"Ableton error: {error_msg}")
        self._trigger_callbacks("error", error_msg)

    def _handle_unknown(self, address: str, *args):
        """Handle unknown OSC messages."""
        logger.debug(f"Unknown OSC: {address} {args}")

    # ========================================================================
    # Callback System
    # ========================================================================

    def on(self, event: str, callback: Callable) -> None:
        """
        Register callback for event.

        Events:
          - tempo: (float) tempo changed
          - transport: (bool) playing state changed
          - track_selected: (dict) track selected
          - clip_selected: (dict) clip selected
          - clip_info: (dict) clip info received
          - track_count: (int) track count changed
          - error: (str) error received
        """
        if event not in self._callbacks:
            self._callbacks[event] = []
        self._callbacks[event].append(callback)

    def off(self, event: str, callback: Callable) -> None:
        """Unregister callback."""
        if event in self._callbacks and callback in self._callbacks[event]:
            self._callbacks[event].remove(callback)

    def _trigger_callbacks(self, event: str, data: Any) -> None:
        """Trigger all callbacks for event."""
        for callback in self._callbacks.get(event, []):
            try:
                callback(data)
            except Exception as e:
                logger.error(f"Callback error for {event}: {e}")

    # ========================================================================
    # Context for Voice Commands
    # ========================================================================

    def get_context(self) -> Dict[str, Any]:
        """
        Get current context for voice command processing.

        Returns dict with:
          - current_track_id: Selected track/clip ID
          - tempo: Current tempo
          - is_playing: Transport state
        """
        return {
            "current_track_id": self.state.selected_track_id,
            "current_track_name": self.state.current_track_name,
            "current_clip_name": self.state.current_clip_name,
            "tempo": self.state.tempo,
            "is_playing": self.state.is_playing,
            "track_count": self.state.track_count,
        }


# ============================================================================
# Global Instance
# ============================================================================

_osc: Optional[BidirectionalOSC] = None


def get_osc() -> BidirectionalOSC:
    """Get or create global OSC instance."""
    global _osc
    if _osc is None:
        _osc = BidirectionalOSC()
    return _osc


def start_osc_server() -> bool:
    """Start the OSC server for receiving messages."""
    return get_osc().start_server()


def stop_osc_server() -> None:
    """Stop the OSC server."""
    get_osc().stop_server()


# Convenience exports
def osc_send(address: str, payload: Dict[str, Any]) -> bool:
    """Send OSC message with JSON payload."""
    return get_osc().send(address, json.dumps(payload))


def osc_status(text: str, **extra) -> bool:
    """Send status message."""
    return get_osc().send_status(text, **extra)


def osc_similar_results(track_id: str, similar_list: List[Dict]) -> bool:
    """Send similarity results."""
    return get_osc().send_similar_results(track_id, similar_list)


def osc_tts_ready(path: str) -> bool:
    """Notify TTS ready."""
    return get_osc().send_tts_ready(path)


def get_ableton_context() -> Dict[str, Any]:
    """Get current Ableton context."""
    return get_osc().get_context()
