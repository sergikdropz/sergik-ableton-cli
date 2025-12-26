#!/usr/bin/env python3
"""
Test Backend-Frontend Connection

Tests that all frontend endpoints are properly connected to the backend.
"""

import requests
import json
import sys
from typing import Dict, List, Tuple

API_BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> Tuple[bool, str]:
    """Test a single endpoint."""
    url = f"{API_BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        else:
            return False, f"Unsupported method: {method}"
        
        if response.status_code == expected_status:
            return True, f"✅ {method} {endpoint} - OK"
        else:
            return False, f"❌ {method} {endpoint} - Status {response.status_code} (expected {expected_status})"
    except requests.exceptions.ConnectionError:
        return False, f"❌ {method} {endpoint} - Connection refused (is server running?)"
    except Exception as e:
        return False, f"❌ {method} {endpoint} - Error: {str(e)}"

def main():
    """Run all connection tests."""
    print("=" * 70)
    print("SERGIK Backend-Frontend Connection Test")
    print("=" * 70)
    print(f"Testing against: {API_BASE_URL}\n")
    
    tests = [
        # Health check
        ("GET", "/health", None),
        ("GET", "/gpt/health", None),
        
        # Generation endpoints
        ("POST", "/generate/chord_progression", {
            "key": "10B",
            "progression_type": "i-VI-III-VII",
            "bars": 4,
            "voicing": "stabs",
            "seventh_chords": True,
            "tempo": 125
        }),
        ("POST", "/generate/walking_bass", {
            "key": "10B",
            "chord_progression_type": "i-VI-III-VII",
            "style": "house",
            "bars": 4,
            "tempo": 125
        }),
        ("POST", "/generate/arpeggios", {
            "key": "10B",
            "chord_progression_type": "i-VI-III-VII",
            "pattern": "up",
            "speed": 0.25,
            "octaves": 2,
            "bars": 4,
            "tempo": 125
        }),
        
        # Drum endpoints (compatibility)
        ("POST", "/drums/generate", {
            "genre": "house",
            "bars": 4,
            "tempo": 125,
            "swing": 0,
            "humanize": 0,
            "density": 1.0,
            "output_format": "midi"
        }),
        ("GET", "/drums/genres", None),
        
        # GPT endpoints
        ("POST", "/gpt/generate", {
            "prompt": "generate a tech house drum pattern"
        }),
        
        # Ableton Live endpoints
        ("POST", "/live/command", {
            "prompt": "create a midi track"
        }),
        ("POST", "/live/devices/load", {
            "track_index": 0,
            "device_name": "Simpler"
        }),
        ("GET", "/live/browser/search?query=test", None, 200),  # Browser search with query
    ]
    
    results = []
    for test in tests:
        method, endpoint, data = test[:3]
        expected_status = test[3] if len(test) > 3 else 200
        success, message = test_endpoint(method, endpoint, data, expected_status)
        results.append((success, message))
        print(message)
    
    print("\n" + "=" * 70)
    passed = sum(1 for success, _ in results if success)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✅ All endpoints connected successfully!")
        return 0
    else:
        print("❌ Some endpoints failed. Check server logs for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

