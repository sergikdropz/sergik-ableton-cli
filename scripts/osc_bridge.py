"""
osc_bridge.py — Sergik AI OSC Bridge Server
Version: 1.0
Author: Sergik AI
Purpose:
    Standalone OSC server that bridges Ableton Live with the Sergik AI system.
    Listens for OSC messages from Ableton and relays them to dataset pipelines,
    the API server, or directly triggers AI actions.

Features:
    - Real-time session capture (tempo, transport, clip state)
    - Parameter automation logging
    - Bidirectional communication with Max for Live
    - Integration with Sergik ML API
    - Test handshake for verify_install.py

OSC Address Map:
    /sergik/test           - Handshake test (responds with /sergik/ack)
    /ableton/tempo         - Tempo changes
    /ableton/transport     - Play/stop/record state
    /ableton/track/*       - Track parameters
    /ableton/clip/*        - Clip state changes
    /ableton/device/*      - Device parameter changes
    /sergik/action         - Trigger Sergik AI actions
    /sergik/generate       - Trigger MIDI generation

Usage:
    python scripts/osc_bridge.py [--port 9000] [--api-url http://localhost:8000]
"""

import argparse
import json
import logging
import os
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
DEFAULT_LISTEN_PORT = 9000      # Ableton sends to this port
DEFAULT_RESPONSE_PORT = 9001    # Sergik responds on this port
DEFAULT_M4L_PORT = 9002         # Max for Live receives on this port
DEFAULT_API_URL = "http://localhost:8000"

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class SessionState:
    """Current Ableton session state."""
    tempo: float = 120.0
    playing: bool = False
    recording: bool = False
    current_time: float = 0.0
    tracks: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    last_update: float = field(default_factory=time.time)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "tempo": self.tempo,
            "playing": self.playing,
            "recording": self.recording,
            "current_time": self.current_time,
            "track_count": len(self.tracks),
            "last_update": self.last_update,
        }


class SergikOSCBridge:
    """
    Sergik AI OSC Bridge Server.
    
    Captures real-time data from Ableton Live and provides
    bidirectional communication with the Sergik ML system.
    """
    
    def __init__(
        self,
        listen_port: int = DEFAULT_LISTEN_PORT,
        response_port: int = DEFAULT_RESPONSE_PORT,
        m4l_port: int = DEFAULT_M4L_PORT,
        api_url: str = DEFAULT_API_URL,
    ):
        """Initialize OSC bridge."""
        self.listen_port = listen_port
        self.response_port = response_port
        self.m4l_port = m4l_port
        self.api_url = api_url
        
        # Session state
        self.session = SessionState()
        
        # Message history for logging
        self.message_log: List[Dict[str, Any]] = []
        self.max_log_size = 1000
        
        # Clients and server
        self._server = None
        self._response_client = None
        self._m4l_client = None
        
        # Import OSC libraries
        try:
            from pythonosc import dispatcher, osc_server, udp_client
            self.dispatcher = dispatcher
            self.osc_server = osc_server
            self.udp_client = udp_client
        except ImportError:
            logger.error("pythonosc not installed. Install: pip install python-osc")
            raise
    
    def _get_response_client(self):
        """Get or create response client."""
        if self._response_client is None:
            self._response_client = self.udp_client.SimpleUDPClient(
                "127.0.0.1", self.response_port
            )
        return self._response_client
    
    def _get_m4l_client(self):
        """Get or create Max for Live client."""
        if self._m4l_client is None:
            self._m4l_client = self.udp_client.SimpleUDPClient(
                "127.0.0.1", self.m4l_port
            )
        return self._m4l_client
    
    def _log_message(self, address: str, args: tuple, direction: str = "in"):
        """Log OSC message."""
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "direction": direction,
            "address": address,
            "args": list(args),
        }
        self.message_log.append(entry)
        
        # Trim log if too large
        if len(self.message_log) > self.max_log_size:
            self.message_log = self.message_log[-self.max_log_size:]
    
    # ========================================================================
    # OSC Handlers
    # ========================================================================
    
    def handle_test(self, address: str, *args):
        """
        Handle /sergik/test - verification handshake.
        Responds with /sergik/ack on response port.
        """
        logger.info(f"🔁 Test handshake received: {address} {args}")
        self._log_message(address, args, "in")
        
        # Send acknowledgment
        client = self._get_response_client()
        client.send_message("/sergik/ack", [1, time.time()])
        logger.info(f"✅ Sent acknowledgment to port {self.response_port}")
    
    def handle_tempo(self, address: str, *args):
        """Handle /ableton/tempo - tempo changes."""
        if args:
            self.session.tempo = float(args[0])
            self.session.last_update = time.time()
            logger.info(f"🎵 Tempo: {self.session.tempo:.2f} BPM")
            self._log_message(address, args, "in")
    
    def handle_transport(self, address: str, *args):
        """Handle /ableton/transport - play/stop/record state."""
        if args:
            state = args[0]
            if isinstance(state, str):
                self.session.playing = state == "playing"
                self.session.recording = state == "recording"
            elif isinstance(state, (int, float)):
                self.session.playing = bool(state)
            
            self.session.last_update = time.time()
            status = "▶️ Playing" if self.session.playing else "⏹️ Stopped"
            if self.session.recording:
                status = "🔴 Recording"
            logger.info(f"Transport: {status}")
            self._log_message(address, args, "in")
    
    def handle_track(self, address: str, *args):
        """Handle /ableton/track/* - track parameters."""
        # Parse track number from address
        parts = address.split("/")
        if len(parts) >= 4:
            track_idx = parts[3]
            param = parts[4] if len(parts) > 4 else "unknown"
            
            if track_idx not in self.session.tracks:
                self.session.tracks[track_idx] = {}
            
            self.session.tracks[track_idx][param] = args[0] if args else None
            self.session.last_update = time.time()
            
            logger.debug(f"Track {track_idx}.{param} = {args}")
        
        self._log_message(address, args, "in")
    
    def handle_clip(self, address: str, *args):
        """Handle /ableton/clip/* - clip state changes."""
        logger.info(f"🎬 Clip event: {address} -> {args}")
        self._log_message(address, args, "in")
    
    def handle_device(self, address: str, *args):
        """Handle /ableton/device/* - device parameter changes."""
        logger.debug(f"🎛️ Device param: {address} -> {args}")
        self._log_message(address, args, "in")
    
    def handle_action(self, address: str, *args):
        """
        Handle /sergik/action - trigger Sergik AI actions.
        
        Expected format: /sergik/action <action_json>
        """
        if not args:
            return
        
        try:
            action_data = json.loads(args[0]) if isinstance(args[0], str) else {"cmd": args[0]}
            logger.info(f"🤖 Action request: {action_data}")
            self._log_message(address, args, "in")
            
            # Forward to API server
            self._forward_to_api("/action", action_data)
            
        except json.JSONDecodeError:
            logger.error(f"Invalid action JSON: {args[0]}")
    
    def handle_generate(self, address: str, *args):
        """
        Handle /sergik/generate - trigger MIDI generation.
        
        Expected format: /sergik/generate <prompt>
        """
        if not args:
            return
        
        prompt = str(args[0])
        logger.info(f"🎹 Generate request: {prompt}")
        self._log_message(address, args, "in")
        
        # Forward to API server
        self._forward_to_api("/gpt/generate", {"prompt": prompt})
    
    def handle_unknown(self, address: str, *args):
        """Fallback handler for unregistered OSC addresses."""
        logger.debug(f"⚙️ Unhandled: {address} -> {args}")
        self._log_message(address, args, "in")
    
    # ========================================================================
    # API Integration
    # ========================================================================
    
    def _forward_to_api(self, endpoint: str, data: Dict[str, Any]):
        """Forward request to Sergik ML API."""
        try:
            import requests
            
            url = f"{self.api_url}{endpoint}"
            response = requests.post(url, json=data, timeout=10)
            
            if response.ok:
                result = response.json()
                logger.info(f"API response: {result.get('status', 'ok')}")
                
                # Send result back to Max for Live
                self._send_to_m4l("/sergik/result", result)
            else:
                logger.error(f"API error: {response.status_code}")
                
        except ImportError:
            logger.warning("requests not installed - API forwarding disabled")
        except Exception as e:
            logger.error(f"API forward failed: {e}")
    
    def _send_to_m4l(self, address: str, data: Any):
        """Send message to Max for Live."""
        try:
            client = self._get_m4l_client()
            
            if isinstance(data, dict):
                client.send_message(address, [json.dumps(data)])
            else:
                client.send_message(address, [data])
            
            self._log_message(address, (data,), "out")
            
        except Exception as e:
            logger.error(f"M4L send failed: {e}")
    
    # ========================================================================
    # Server Control
    # ========================================================================
    
    def start(self):
        """Start the OSC server."""
        # Setup dispatcher
        disp = self.dispatcher.Dispatcher()
        
        # Register handlers
        disp.map("/sergik/test", self.handle_test)
        disp.map("/ableton/tempo", self.handle_tempo)
        disp.map("/ableton/transport", self.handle_transport)
        disp.map("/ableton/track/*", self.handle_track)
        disp.map("/ableton/clip/*", self.handle_clip)
        disp.map("/ableton/device/*", self.handle_device)
        disp.map("/sergik/action", self.handle_action)
        disp.map("/sergik/generate", self.handle_generate)
        disp.set_default_handler(self.handle_unknown)
        
        # Create and start server
        self._server = self.osc_server.ThreadingOSCUDPServer(
            ("127.0.0.1", self.listen_port), disp
        )
        
        print("=" * 60)
        print("🚀 SERGIK AI OSC Bridge")
        print("=" * 60)
        print(f"   📡 Listening on port: {self.listen_port}")
        print(f"   📤 Response port: {self.response_port}")
        print(f"   🎛️ Max for Live port: {self.m4l_port}")
        print(f"   🌐 API URL: {self.api_url}")
        print("=" * 60)
        print("\n🎧 Waiting for OSC messages... (Ctrl+C to stop)")
        print("💡 Run verify_install.py to test connection\n")
        
        try:
            self._server.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Stopping OSC bridge...")
            self._server.server_close()
            print("✅ Bridge stopped cleanly")
    
    def get_session_state(self) -> Dict[str, Any]:
        """Get current session state."""
        return self.session.to_dict()
    
    def get_message_log(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent message log."""
        return self.message_log[-limit:]


# ---------------------------
# CLI Entry Point
# ---------------------------

def main():
    """Run OSC bridge from command line."""
    parser = argparse.ArgumentParser(
        description="Sergik AI OSC Bridge Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scripts/osc_bridge.py
    python scripts/osc_bridge.py --port 9000 --api-url http://localhost:8000
    python scripts/osc_bridge.py --m4l-port 9002

OSC Address Map:
    /sergik/test           Test handshake (responds with /sergik/ack)
    /ableton/tempo         Tempo changes from Live
    /ableton/transport     Play/stop/record state
    /ableton/track/*       Track parameters
    /sergik/action         Trigger AI actions
    /sergik/generate       Generate MIDI via natural language
        """
    )
    
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=DEFAULT_LISTEN_PORT,
        help=f"OSC listen port (default: {DEFAULT_LISTEN_PORT})"
    )
    parser.add_argument(
        "--response-port", "-r",
        type=int,
        default=DEFAULT_RESPONSE_PORT,
        help=f"Response port for test handshake (default: {DEFAULT_RESPONSE_PORT})"
    )
    parser.add_argument(
        "--m4l-port", "-m",
        type=int,
        default=DEFAULT_M4L_PORT,
        help=f"Max for Live receive port (default: {DEFAULT_M4L_PORT})"
    )
    parser.add_argument(
        "--api-url", "-a",
        type=str,
        default=DEFAULT_API_URL,
        help=f"Sergik ML API URL (default: {DEFAULT_API_URL})"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Create and start bridge
    bridge = SergikOSCBridge(
        listen_port=args.port,
        response_port=args.response_port,
        m4l_port=args.m4l_port,
        api_url=args.api_url,
    )
    
    bridge.start()


if __name__ == "__main__":
    main()

