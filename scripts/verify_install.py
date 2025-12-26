"""
verify_install.py — Sergik AI System Setup Verifier
Version: 1.0
Author: Sergik AI
Purpose: Confirm environment, dataset structure, feature extraction readiness,
         and Ableton OSC integration.
Compatible with: macOS / Cursor workspace integration
"""

import os
import sys
import importlib
import socket
import time
import threading
import logging
from pathlib import Path
from typing import List, Tuple, Optional

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# --- CONFIG ---
PROJECT_ROOT = Path(__file__).parent.parent.resolve()

# Add project root to Python path for imports
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
EXPECTED_DIRS = [
    "data/catalog",
    "data/manifests",
    "data/analysis",
    "scripts",
    "sergik_ml",
    "knowledge",
    "gpt_config",
]
EXPECTED_FILES = [
    "data/manifests/tracks.csv",
    "data/catalog/ableton_projects/all_projects.csv",
    "gpt_config/system_instructions.md",
    "sergik_ml/serving/api.py",
    "sergik_ml/generators/midi_advanced.py",
    "sergik_ml/features/audio_features.py",
]
OSC_PORT = 9000  # Must match Ableton OSC output port

# Core dependencies
CORE_DEPS = [
    "librosa",
    "pandas",
    "numpy",
    "fastapi",
    "uvicorn",
    "pythonosc",
]

# Optional dependencies
OPTIONAL_DEPS = [
    "soundfile",
    "pyloudnorm",
    "scikit-learn",
    "boto3",
    "torch",
    "openai",
]


# ---------------------------
# BASIC CHECKS
# ---------------------------

def check_python_env() -> bool:
    """Check Python environment."""
    print("\n🔍 Checking Python environment...")
    print(f"   Python version: {sys.version.split()[0]}")
    print(f"   Executable: {sys.executable}")
    is_venv = sys.prefix != sys.base_prefix
    print(f"   Virtual environment: {'✅ Yes' if is_venv else '⚠️  No (recommended to use venv)'}")
    print(f"   Platform: {sys.platform}")
    return True


def check_dependencies() -> Tuple[bool, List[str]]:
    """Check required dependencies."""
    print("\n🧠 Checking dependencies...")
    
    missing_core = []
    for lib in CORE_DEPS:
        try:
            importlib.import_module(lib.replace("-", "_"))
            print(f"   ✅ {lib}")
        except ImportError:
            print(f"   ❌ {lib} (REQUIRED)")
            missing_core.append(lib)
    
    print("\n📦 Optional dependencies:")
    for lib in OPTIONAL_DEPS:
        try:
            importlib.import_module(lib.replace("-", "_"))
            print(f"   ✅ {lib}")
        except ImportError:
            print(f"   ⚪ {lib} (optional)")
    
    if missing_core:
        print(f"\n   ⚠️  Install missing: pip install {' '.join(missing_core)}")
        return False, missing_core
    
    return True, []


def check_structure() -> Tuple[bool, List[str]]:
    """Check folder and file structure."""
    print("\n📂 Checking project structure...")
    
    missing = []
    
    # Check directories
    for d in EXPECTED_DIRS:
        path = PROJECT_ROOT / d
        exists = path.is_dir()
        print(f"   📁 {d} {'✅' if exists else '❌'}")
        if not exists:
            missing.append(d)
    
    # Check key files
    print("\n📄 Checking key files...")
    for f in EXPECTED_FILES:
        path = PROJECT_ROOT / f
        exists = path.is_file()
        print(f"   📄 {f} {'✅' if exists else '❌'}")
        if not exists:
            missing.append(f)
    
    return len(missing) == 0, missing


def check_data_files() -> bool:
    """Check data and catalog files."""
    print("\n🎵 Checking data files...")
    
    data_dir = PROJECT_ROOT / "data"
    if not data_dir.exists():
        print("   ❌ data/ directory not found")
        return False
    
    # Count files in key directories
    checks = [
        ("data/catalog/ableton_projects", "*.csv", "Ableton project catalogs"),
        ("data/catalog/exports", "*.csv", "Export catalogs"),
        ("data/manifests", "*.csv", "Manifest files"),
        ("data/analysis", "**/*.csv", "Analysis files"),
    ]
    
    for rel_path, pattern, desc in checks:
        path = PROJECT_ROOT / rel_path
        if path.exists():
            count = len(list(path.glob(pattern)))
            print(f"   📊 {desc}: {count} files ✅")
        else:
            print(f"   📊 {desc}: not found ⚪")
    
    return True


# ---------------------------
# AUDIO FEATURE TEST
# ---------------------------

def test_audio_features() -> bool:
    """Test audio feature extraction capabilities."""
    print("\n🎛️ Testing audio feature extraction...")
    
    try:
        import numpy as np
        
        # Check librosa import
        import librosa
        print("   ✅ librosa imported successfully")
        
        # Generate test signal
        sr = 22050
        duration = 1.0
        t = np.linspace(0, duration, int(sr * duration))
        y = 0.5 * np.sin(2 * np.pi * 440 * t)  # 440Hz sine wave
        
        # Test feature extraction
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        tempo = float(np.atleast_1d(tempo)[0])
        print(f"   ✅ Beat tracking: {tempo:.1f} BPM detected")
        
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        print(f"   ✅ MFCC extraction: shape {mfcc.shape}")
        
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        print(f"   ✅ Chroma extraction: shape {chroma.shape}")
        
        print("   ✅ Feature extraction functional!")
        return True
        
    except ImportError as e:
        print(f"   ❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Feature extraction failed: {e}")
        return False


# ---------------------------
# MIDI GENERATION TEST
# ---------------------------

def test_midi_generation() -> bool:
    """Test MIDI generation capabilities."""
    print("\n🎹 Testing MIDI generation...")
    
    try:
        from sergik_ml.generators.midi_advanced import (
            generate_chord_progression,
            generate_walking_bass,
            generate_arpeggios,
        )
        
        # Test chord progression
        chords = generate_chord_progression(key="10B", bars=4)
        print(f"   ✅ Chord progression: {len(chords)} notes generated")
        
        # Test bass line
        bass = generate_walking_bass(key="10B", bars=4)
        print(f"   ✅ Walking bass: {len(bass)} notes generated")
        
        # Test arpeggios
        arps = generate_arpeggios(key="10B", bars=4)
        print(f"   ✅ Arpeggios: {len(arps)} notes generated")
        
        print("   ✅ MIDI generation functional!")
        return True
        
    except ImportError as e:
        print(f"   ❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ MIDI generation failed: {e}")
        return False


# ---------------------------
# ABLETON OSC TEST
# ---------------------------

def test_osc_connection() -> bool:
    """Test Ableton OSC Bridge connection."""
    print("\n🎚️ Testing Ableton OSC Bridge...")
    
    try:
        from pythonosc import udp_client
        
        # Try to create OSC client
        client = udp_client.SimpleUDPClient("127.0.0.1", OSC_PORT)
        print(f"   ✅ OSC client created for port {OSC_PORT}")
        
        # Try sending test message
        try:
            client.send_message("/sergik/test", [1])
            print("   📡 Sent test OSC message")
        except Exception as e:
            print(f"   ⚠️  Could not send OSC message: {e}")
        
        # Check if OSC bridge or Ableton is listening
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(0.5)
        
        try:
            sock.bind(("127.0.0.1", OSC_PORT))
            sock.close()
            print(f"   ⚠️  Port {OSC_PORT} is free (no OSC listener detected)")
            print("      💡 Start osc_bridge.py or Ableton with OSC enabled")
            return True
        except OSError:
            print(f"   ✅ Port {OSC_PORT} is in use (OSC listener detected)")
            return True
            
    except ImportError:
        print("   ❌ pythonosc not installed")
        return False
    except Exception as e:
        print(f"   ❌ OSC test failed: {e}")
        return False


# ---------------------------
# API SERVER TEST
# ---------------------------

def test_api_server() -> bool:
    """Test API server configuration."""
    print("\n🌐 Testing API server configuration...")
    
    try:
        # Check if FastAPI app can be imported
        from sergik_ml.api.main import app
        print("   ✅ FastAPI app imported successfully")
        
        # List available routes
        routes = [route.path for route in app.routes if hasattr(route, 'path')]
        api_routes = [r for r in routes if r.startswith('/')]
        print(f"   ✅ {len(api_routes)} API routes available")
        
        # Check key endpoints
        key_endpoints = ['/action', '/gpt/generate', '/gpt/analyze', '/generate/chord_progression']
        for endpoint in key_endpoints:
            if endpoint in routes:
                print(f"      ✅ {endpoint}")
            else:
                print(f"      ⚪ {endpoint}")
        
        return True
        
    except ImportError as e:
        print(f"   ❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ API server test failed: {e}")
        return False


# ---------------------------
# CLOUD STORAGE TEST
# ---------------------------

def test_cloud_storage() -> bool:
    """Test cloud storage configuration."""
    print("\n☁️ Testing cloud storage...")
    
    try:
        from sergik_ml.connectors.cloud_storage import get_storage, StubStorage
        
        # Get storage provider
        storage = get_storage("auto")
        storage_type = type(storage).__name__
        print(f"   ✅ Storage provider: {storage_type}")
        
        # Check for S3 credentials
        if os.getenv("AWS_ACCESS_KEY_ID"):
            print("   ✅ AWS credentials found")
        else:
            print("   ⚪ AWS credentials not set (using stub storage)")
        
        # Check for Firebase credentials
        if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            print("   ✅ Firebase credentials found")
        else:
            print("   ⚪ Firebase credentials not set")
        
        return True
        
    except ImportError as e:
        print(f"   ❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Cloud storage test failed: {e}")
        return False


# ---------------------------
# SUMMARY
# ---------------------------

def summary(results: dict):
    """Print verification summary."""
    print("\n" + "=" * 60)
    print("📋 VERIFICATION SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {test}: {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n✅ All checks passed! Sergik AI system is ready.")
        print("\n💡 Next steps:")
        print("   1. Start the API server: python -m sergik_ml.serving.api")
        print("   2. Start OSC bridge: python scripts/osc_bridge.py")
        print("   3. Open Cursor chat and begin developing")
    else:
        print("\n⚠️  Some checks failed. Review the output above for details.")
        print("   Install missing dependencies and verify file paths.")
    
    print("\n🎧 SERGIK AI - Ready to evolve your sound\n")


# ---------------------------
# MAIN EXECUTION
# ---------------------------

def main():
    """Run all verification checks."""
    print("=" * 60)
    print("🚀 SERGIK AI SYSTEM — Installation & Integration Verifier")
    print("=" * 60)
    print(f"   Project Root: {PROJECT_ROOT}")
    
    results = {}
    
    # Run all checks
    check_python_env()
    
    deps_ok, _ = check_dependencies()
    results["Dependencies"] = deps_ok
    
    structure_ok, _ = check_structure()
    results["Project Structure"] = structure_ok
    
    results["Data Files"] = check_data_files()
    
    if deps_ok:
        results["Audio Features"] = test_audio_features()
        results["MIDI Generation"] = test_midi_generation()
        results["API Server"] = test_api_server()
        results["Cloud Storage"] = test_cloud_storage()
    else:
        results["Audio Features"] = False
        results["MIDI Generation"] = False
        results["API Server"] = False
        results["Cloud Storage"] = False
    
    results["OSC Connection"] = test_osc_connection()
    
    # Print summary
    summary(results)
    
    return all(results.values())


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

