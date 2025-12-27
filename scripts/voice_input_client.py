#!/usr/bin/env python3
"""
Voice Input Client for SERGIK Voice Control

Simple push-to-talk client for voice control of Ableton Live.
Records audio and sends to SERGIK GPT voice control API.
"""

import argparse
import sys
import requests
import tempfile
from pathlib import Path

try:
    import sounddevice as sd
    import soundfile as sf
    HAS_AUDIO = True
except ImportError:
    HAS_AUDIO = False
    print("Warning: sounddevice/soundfile not installed. Install: pip install sounddevice soundfile")


def record_voice(duration=3, sample_rate=44100, channels=1):
    """
    Record voice input from microphone.
    
    Args:
        duration: Recording duration in seconds
        sample_rate: Sample rate (Hz)
        channels: Number of channels (1=mono, 2=stereo)
    
    Returns:
        Tuple of (audio_data, sample_rate)
    """
    if not HAS_AUDIO:
        raise ImportError("sounddevice and soundfile required for recording")
    
    print(f"🎤 Recording for {duration} seconds... (speak now)")
    try:
        audio = sd.rec(
            int(duration * sample_rate),
            samplerate=sample_rate,
            channels=channels,
            dtype='float32'
        )
        sd.wait()
        print("✅ Recording complete.")
        return audio, sample_rate
    except Exception as e:
        print(f"❌ Recording failed: {e}")
        sys.exit(1)


def send_voice_command(audio, sample_rate, api_url="http://localhost:8000"):
    """
    Send voice recording to SERGIK GPT voice control API.
    
    Args:
        audio: Audio data (numpy array)
        sample_rate: Sample rate (Hz)
        api_url: API base URL
    
    Returns:
        API response dictionary
    """
    # Save to temporary WAV file
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        temp_path = f.name
        sf.write(temp_path, audio, sample_rate)
    
    try:
        # Send to API
        print(f"📤 Sending to {api_url}/voice/gpt...")
        with open(temp_path, 'rb') as audio_file:
            response = requests.post(
                f'{api_url}/voice/gpt',
                files={'file': audio_file},
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            # Display results
            print("\n" + "="*60)
            print("📝 TRANSCRIPTION:")
            print(f"   {result.get('text', 'N/A')}")
            print("\n🤖 GPT RESPONSE:")
            intent = result.get('intent', {})
            print(f"   {intent.get('tts', 'N/A')}")
            print("\n⚡ ACTIONS:")
            action = result.get('action', {})
            if action.get('status') == 'ok':
                executed = action.get('result', {}).get('executed', [])
                errors = action.get('result', {}).get('errors', [])
                if executed:
                    print(f"   ✅ Executed {len(executed)} command(s)")
                    for cmd in executed:
                        cmd_info = cmd.get('command', {})
                        print(f"      - {cmd_info.get('action', 'unknown')}")
                if errors:
                    print(f"   ❌ {len(errors)} error(s)")
                    for err in errors:
                        print(f"      - {err.get('error', 'unknown error')}")
            else:
                print(f"   ❌ Error: {action.get('error', 'Unknown error')}")
            print("="*60 + "\n")
            
            return result
    except requests.exceptions.RequestException as e:
        print(f"❌ API request failed: {e}")
        sys.exit(1)
    finally:
        # Cleanup temp file
        try:
            Path(temp_path).unlink()
        except Exception:
            pass


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="SERGIK Voice Control Client - Push-to-talk voice control for Ableton Live"
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=3.0,
        help="Recording duration in seconds (default: 3.0)"
    )
    parser.add_argument(
        "--sample-rate",
        type=int,
        default=44100,
        help="Sample rate in Hz (default: 44100)"
    )
    parser.add_argument(
        "--api-url",
        type=str,
        default="http://localhost:8000",
        help="SERGIK API base URL (default: http://localhost:8000)"
    )
    parser.add_argument(
        "--file",
        type=str,
        help="Use existing WAV file instead of recording"
    )
    
    args = parser.parse_args()
    
    if not HAS_AUDIO and not args.file:
        print("❌ Error: sounddevice/soundfile not installed")
        print("   Install: pip install sounddevice soundfile")
        print("   Or use --file to process existing WAV file")
        sys.exit(1)
    
    try:
        if args.file:
            # Process existing file
            print(f"📁 Processing file: {args.file}")
            with open(args.file, 'rb') as f:
                response = requests.post(
                    f'{args.api_url}/voice/gpt',
                    files={'file': f},
                    timeout=30
                )
                response.raise_for_status()
                result = response.json()
                print(f"\n✅ Result: {result.get('intent', {}).get('tts', 'Done')}")
        else:
            # Record and process
            audio, sr = record_voice(
                duration=args.duration,
                sample_rate=args.sample_rate
            )
            result = send_voice_command(audio, sr, args.api_url)
            
            # Show TTS path if available
            tts_path = result.get('tts_path')
            if tts_path:
                print(f"🔊 TTS audio: {tts_path}")
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

