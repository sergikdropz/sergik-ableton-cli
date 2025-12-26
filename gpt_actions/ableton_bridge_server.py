#!/usr/bin/env python3
"""
SERGIK Ableton Bridge Server
Connects GPT Actions to Ableton Live via OSC
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# OSC client (optional - install python-osc if using)
osc_client = None
try:
    from pythonosc import udp_client
    OSC_HOST = os.getenv("OSC_HOST", "127.0.0.1")
    OSC_PORT = int(os.getenv("OSC_PORT", "9000"))
    osc_client = udp_client.SimpleUDPClient(OSC_HOST, OSC_PORT)
    print(f"OSC enabled: {OSC_HOST}:{OSC_PORT}")
except ImportError:
    print("python-osc not installed, OSC disabled")

def send_osc(address, *args):
    if osc_client:
        osc_client.send_message(address, list(args) if args else [1])
    return True

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "sergik-ableton-bridge", "osc": osc_client is not None})

@app.route('/transport/play', methods=['POST'])
def transport_play():
    send_osc("/live/song/start_playing")
    return jsonify({"status": "ok", "action": "play"})

@app.route('/transport/stop', methods=['POST'])
def transport_stop():
    send_osc("/live/song/stop_playing")
    return jsonify({"status": "ok", "action": "stop"})

@app.route('/transport/record', methods=['POST'])
def transport_record():
    send_osc("/live/song/record_mode")
    return jsonify({"status": "ok", "action": "record"})

@app.route('/tempo', methods=['POST'])
def set_tempo():
    data = request.get_json(force=True) or {}
    bpm = float(data.get('bpm', 120))
    send_osc("/live/song/set/tempo", bpm)
    return jsonify({"status": "ok", "bpm": bpm})

@app.route('/track/volume', methods=['POST'])
def set_track_volume():
    data = request.get_json(force=True) or {}
    track = int(data.get('track', 0))
    value = float(data.get('value', 0.85))
    send_osc(f"/live/track/set/volume", track, value)
    return jsonify({"status": "ok", "track": track, "volume": value})

@app.route('/track/pan', methods=['POST'])
def set_track_pan():
    data = request.get_json(force=True) or {}
    track = int(data.get('track', 0))
    value = float(data.get('value', 0.0))
    send_osc(f"/live/track/set/pan", track, value)
    return jsonify({"status": "ok", "track": track, "pan": value})

@app.route('/device/param', methods=['POST'])
def set_device_param():
    data = request.get_json(force=True) or {}
    track = int(data.get('track', 0))
    device = int(data.get('device', 0))
    param = int(data.get('param', 0))
    value = float(data.get('value', 0.5))
    send_osc("/live/device/set/parameter/value", track, device, param, value)
    return jsonify({"status": "ok", "track": track, "device": device, "param": param, "value": value})

@app.route('/clip/fire', methods=['POST'])
def fire_clip():
    data = request.get_json(force=True) or {}
    track = int(data.get('track', 0))
    clip = int(data.get('clip', 0))
    send_osc("/live/clip/fire", track, clip)
    return jsonify({"status": "ok", "track": track, "clip": clip})

if __name__ == '__main__':
    # Fix: Use port 5000 instead of 8000 to avoid conflict with main API server
    # Can be overridden with BRIDGE_PORT environment variable
    bridge_port = int(os.getenv("BRIDGE_PORT", "5000"))
    
    print("=" * 50)
    print("SERGIK Ableton Bridge")
    print("=" * 50)
    print(f"Endpoints: /health, /transport/play, /tempo, etc.")
    print(f"Running on port: {bridge_port}")
    print("Run ngrok: ngrok http 5000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=bridge_port, debug=False)
