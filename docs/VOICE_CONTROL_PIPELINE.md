# Voice Control Pipeline for Ableton Live

Complete voice control system using SERGIK Custom GPT and AI Controller for full Ableton Live control.

## Architecture

```
Voice Input (Mic)
    ↓
STT (Speech-to-Text)
    ↓
SERGIK GPT Actions API
    ↓
Intent Understanding & Command Extraction
    ↓
Ableton Live Control (via OSC/LOM)
    ↓
TTS Response (Confirmation)
```

## Components

### 1. GPT Voice Service (`sergik_ml/services/gpt_voice_service.py`)

Routes voice input through SERGIK GPT Actions API for intelligent intent understanding.

**Features:**
- Automatic endpoint selection (`/live/command`, `/gpt/generate`, `/gpt/drums`)
- Command extraction from GPT responses
- Context-aware processing

### 2. Voice Orchestrator (`sergik_ml/services/voice_orchestrator.py`)

Coordinates the complete voice control pipeline.

**Pipeline Steps:**
1. Voice Input → STT transcription
2. GPT Actions → Intent understanding
3. Command Extraction → Parse GPT response
4. Command Execution → Run Ableton commands
5. TTS Response → Generate confirmation

### 3. API Endpoint (`POST /voice/gpt`)

Process voice recordings with GPT-powered intent understanding.

## Setup

### 1. Install Dependencies

```bash
# Required for STT/TTS
pip install faster-whisper  # or set OPENAI_API_KEY for cloud STT/TTS

# Required for HTTP client
pip install httpx
```

### 2. Configure Environment

```bash
# Optional: Use OpenAI for STT/TTS (better quality)
export OPENAI_API_KEY="your-key-here"
export SERGIK_USE_OPENAI_VOICE=true

# API base URL (default: http://127.0.0.1:8000)
export SERGIK_API_BASE_URL="http://127.0.0.1:8000"
```

### 3. Start API Server

```bash
python -m sergik_ml.serving.api
```

### 4. Start Ableton Live with OSC

Ensure Ableton Live is running with OSC enabled (port 9000 by default).

## Usage

### API Endpoint

**POST** `/voice/gpt`

Upload a WAV file containing voice command.

**Request:**
```bash
curl -X POST http://localhost:8000/voice/gpt \
  -F "file=@voice_command.wav"
```

**Response:**
```json
{
  "status": "ok",
  "text": "Set tempo to 125 BPM",
  "intent": {
    "text": "Set tempo to 125 BPM",
    "cmd": null,
    "args": {},
    "tts": "✅ Executed 1 command(s) | 💬 Response: Set tempo to 125 BPM",
    "confidence": 0.9
  },
  "action": {
    "status": "ok",
    "cmd": "gpt_voice",
    "result": {
      "executed": [
        {
          "command": {
            "action": "set_tempo",
            "args": {"tempo": 125}
          },
          "result": {"status": "ok"}
        }
      ],
      "errors": [],
      "summary": "✅ Executed 1 command(s)"
    }
  },
  "tts_path": "tts_output/tts_abc123.mp3"
}
```

### Example Voice Commands

#### Ableton Live Control

- **Transport:**
  - "Play"
  - "Stop"
  - "Set tempo to 125"
  - "Record"

- **Tracks:**
  - "Create a new MIDI track called 'Lead Synth'"
  - "Mute track 2"
  - "Solo track 3"
  - "Set track 1 volume to 0.8"

- **Clips & Scenes:**
  - "Fire scene 4"
  - "Fire clip on track 1, slot 2"
  - "Stop all clips"

- **Devices:**
  - "Load Wavetable on track 1"
  - "Set reverb mix to 0.5 on track 2"

#### Music Generation

- **Chords:**
  - "Generate a tech house chord progression in D minor"
  - "Create 8 bars of stab chords at 126 BPM"

- **Bass:**
  - "Create a walking bass line in 10B"
  - "Make a house bass line"

- **Drums:**
  - "Generate tech house drums"
  - "Make a trap beat at 140 BPM"
  - "Create 8 bars of minimal techno drums"

- **Arpeggios:**
  - "Make some arpeggios going upward"
  - "Generate random arpeggios in 10B"

## Integration with Max for Live Controller

The voice control pipeline integrates seamlessly with the SERGIK AI Controller Max for Live device.

### Setup in Ableton

1. Load SERGIK AI Controller on a MIDI track
2. Ensure API server is running (port 8000)
3. Controller will receive OSC notifications for voice commands

### Real-time Voice Input

You can create a simple voice input handler:

```python
# voice_input_client.py
import sounddevice as sd
import soundfile as sf
import requests
import tempfile

def record_voice(duration=3, sample_rate=44100):
    """Record voice input."""
    print("Recording...")
    audio = sd.rec(
        int(duration * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype='float32'
    )
    sd.wait()
    print("Recording complete.")
    return audio, sample_rate

def send_voice_command(audio, sample_rate):
    """Send voice recording to API."""
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        sf.write(f.name, audio, sample_rate)
        
        with open(f.name, 'rb') as audio_file:
            response = requests.post(
                'http://localhost:8000/voice/gpt',
                files={'file': audio_file}
            )
            return response.json()

# Usage
if __name__ == "__main__":
    audio, sr = record_voice(duration=3)
    result = send_voice_command(audio, sr)
    print(f"Response: {result['intent']['tts']}")
```

## Advanced Features

### Session Context

The orchestrator maintains session context for better command understanding:

```python
orchestrator = VoiceOrchestrator(...)

# First command
result1 = orchestrator.process_voice_command("voice1.wav")

# Second command (uses context from first)
result2 = orchestrator.process_voice_command("voice2.wav")

# Get context
context = orchestrator.get_context()
# {"recent_commands": [...]}

# Clear context
orchestrator.clear_context()
```

### Custom GPT Actions

The system automatically routes to appropriate GPT Actions endpoints:

- `/live/command` - Ableton Live control
- `/gpt/generate` - Music generation
- `/gpt/drums` - Drum pattern generation

You can extend by adding custom endpoints in `GPTVoiceService._call_gpt_actions()`.

## Troubleshooting

### STT Not Working

**Issue:** Voice transcription returns empty or incorrect text.

**Solutions:**
1. Install `faster-whisper`: `pip install faster-whisper`
2. Or set `OPENAI_API_KEY` for cloud STT
3. Check audio file format (WAV, 16kHz+ recommended)

### GPT Actions Not Responding

**Issue:** GPT Actions API returns errors.

**Solutions:**
1. Ensure API server is running: `python -m sergik_ml.serving.api`
2. Check `SERGIK_API_BASE_URL` matches server URL
3. Verify network connectivity

### Commands Not Executing

**Issue:** Commands extracted but not executing in Ableton.

**Solutions:**
1. Check Ableton Live OSC is enabled (port 9000)
2. Verify `SERGIK_ABLETON_OSC_HOST` and `SERGIK_ABLETON_OSC_PORT`
3. Check Ableton Live is running
4. Review logs for OSC errors

## Performance

- **STT Latency:** ~0.5-2s (depends on model)
- **GPT Processing:** ~1-3s (depends on API response time)
- **Command Execution:** ~0.1-0.5s (OSC round-trip)
- **TTS Generation:** ~1-2s (depends on provider)

**Total Pipeline:** ~3-8 seconds per voice command

## Future Enhancements

- [ ] Real-time streaming STT (continuous listening)
- [ ] Wake word detection ("Hey SERGIK")
- [ ] Multi-turn conversation support
- [ ] Voice activity detection (VAD)
- [ ] Custom wake word training
- [ ] Integration with SERGIK Custom GPT Actions directly

## See Also

- [SERGIK AI Controller Guide](../maxforlive/SERGIK_AI_Device_Guide.md)
- [GPT Actions API](../gpt_actions/README.md)
- [Ableton Live Integration](../docs/BACKEND_FRONTEND_CONNECTION.md)

