# Voice Control Pipeline - Implementation Summary

## Overview

A complete voice control pipeline has been built to enable full control of Ableton Live via voice commands using SERGIK Custom GPT and the AI Controller.

## Architecture

```
┌─────────────────┐
│  Voice Input   │ (Microphone)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   STT (Speech   │ (faster-whisper or OpenAI)
│   to Text)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GPT Actions    │ (SERGIK GPT Actions API)
│  API Router     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Command        │ (Extract from GPT response)
│  Extraction     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Ableton Live   │ (OSC/LOM commands)
│  Execution      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TTS Response   │ (Confirmation)
└─────────────────┘
```

## Components Created

### 1. GPT Voice Service (`sergik_ml/services/gpt_voice_service.py`)

**Purpose:** Routes voice input through SERGIK GPT Actions API for intelligent intent understanding.

**Key Features:**
- Automatic endpoint selection based on command type
- Supports `/live/command`, `/gpt/generate`, `/gpt/drums`
- Command extraction from GPT responses
- Context-aware processing

**Methods:**
- `process_voice_with_gpt()` - Main processing method
- `_call_gpt_actions()` - Routes to appropriate GPT endpoint
- `_extract_commands()` - Parses GPT response for commands
- `_generate_tts_response()` - Creates TTS text

### 2. Voice Orchestrator (`sergik_ml/services/voice_orchestrator.py`)

**Purpose:** Coordinates the complete voice control pipeline.

**Key Features:**
- Full pipeline orchestration
- Command execution
- Error handling
- Session context management
- TTS response generation

**Methods:**
- `process_voice_command()` - Main orchestration method
- `_execute_command()` - Executes individual commands
- `_generate_summary_tts()` - Creates TTS summaries
- `get_context()` / `clear_context()` - Context management

### 3. API Endpoint (`POST /voice/gpt`)

**Location:** `sergik_ml/api/routers/voice.py`

**Purpose:** HTTP endpoint for GPT-powered voice control.

**Request:**
- Multipart form data with WAV file

**Response:**
- Transcribed text
- GPT response
- Executed commands
- TTS path
- Summary

### 4. Configuration Updates

**File:** `sergik_ml/config.py`

**Added:**
- `api_base_url` - SERGIK ML API base URL (default: `http://127.0.0.1:8000`)

### 5. Dependency Injection Updates

**Files:**
- `sergik_ml/api/dependencies.py` - Added `get_gpt_voice_service()`
- `sergik_ml/core/container.py` - Registered `gpt_voice_service`

### 6. Documentation

**Files:**
- `docs/VOICE_CONTROL_PIPELINE.md` - Complete usage guide
- `scripts/voice_input_client.py` - Example client script

## Usage Examples

### Basic API Usage

```bash
# Record voice and send to API
curl -X POST http://localhost:8000/voice/gpt \
  -F "file=@voice_command.wav"
```

### Python Client

```python
from scripts.voice_input_client import record_voice, send_voice_command

# Record 3 seconds
audio, sr = record_voice(duration=3)

# Send to API
result = send_voice_command(audio, sr)
print(result['intent']['tts'])
```

### Command Line Client

```bash
# Record and process
python scripts/voice_input_client.py --duration 5

# Process existing file
python scripts/voice_input_client.py --file voice.wav
```

## Supported Voice Commands

### Ableton Live Control

- **Transport:** "Play", "Stop", "Set tempo to 125", "Record"
- **Tracks:** "Create MIDI track", "Mute track 2", "Set volume to 0.8"
- **Clips:** "Fire scene 4", "Fire clip on track 1"
- **Devices:** "Load Wavetable", "Set reverb mix to 0.5"

### Music Generation

- **Chords:** "Generate tech house chords in D minor"
- **Bass:** "Create walking bass in 10B"
- **Drums:** "Make tech house drums at 126 BPM"
- **Arpeggios:** "Generate upward arpeggios"

## Integration Points

### With SERGIK GPT Actions

The pipeline integrates with existing GPT Actions:
- `/gpt/generate` - Music generation
- `/gpt/drums` - Drum patterns
- `/live/command` - Ableton control

### With Max for Live Controller

The SERGIK AI Controller receives:
- OSC notifications for voice commands
- TTS audio file paths
- Status updates

### With Ableton Live

Commands execute via:
- OSC messages (port 9000)
- Live Object Model (LOM) access
- Real-time parameter control

## Setup Requirements

### Dependencies

```bash
# STT/TTS (choose one)
pip install faster-whisper  # Local STT
# OR
export OPENAI_API_KEY="..."  # Cloud STT/TTS

# HTTP client
pip install httpx

# Voice recording (for client)
pip install sounddevice soundfile
```

### Configuration

```bash
# Optional: Use OpenAI for better quality
export OPENAI_API_KEY="your-key"
export SERGIK_USE_OPENAI_VOICE=true

# API URL (default: http://127.0.0.1:8000)
export SERGIK_API_BASE_URL="http://127.0.0.1:8000"
```

### Services

1. **Start API Server:**
   ```bash
   python -m sergik_ml.serving.api
   ```

2. **Start Ableton Live** with OSC enabled (port 9000)

3. **Load SERGIK AI Controller** in Max for Live

## Performance

- **STT Latency:** 0.5-2s
- **GPT Processing:** 1-3s
- **Command Execution:** 0.1-0.5s
- **TTS Generation:** 1-2s
- **Total Pipeline:** 3-8s per command

## Future Enhancements

1. **Real-time Streaming STT** - Continuous listening
2. **Wake Word Detection** - "Hey SERGIK" activation
3. **Multi-turn Conversations** - Context-aware follow-ups
4. **Voice Activity Detection** - Automatic recording start/stop
5. **Custom Wake Word** - Train custom activation phrase

## Testing

### Test Voice Commands

1. **Transport:**
   - "Play"
   - "Stop"
   - "Set tempo to 125"

2. **Generation:**
   - "Generate tech house drums"
   - "Create chords in D minor"

3. **Track Control:**
   - "Mute track 2"
   - "Create a new MIDI track"

### Test Script

```bash
# Record test command
python scripts/voice_input_client.py --duration 3

# Or use existing file
python scripts/voice_input_client.py --file test_voice.wav
```

## Troubleshooting

### STT Not Working
- Install `faster-whisper` or set `OPENAI_API_KEY`
- Check audio format (WAV, 16kHz+)

### GPT Actions Not Responding
- Verify API server is running
- Check `SERGIK_API_BASE_URL` matches server

### Commands Not Executing
- Check Ableton OSC is enabled (port 9000)
- Verify OSC host/port configuration
- Check Ableton Live is running

## Files Modified/Created

### Created
- `sergik_ml/services/gpt_voice_service.py`
- `sergik_ml/services/voice_orchestrator.py`
- `docs/VOICE_CONTROL_PIPELINE.md`
- `scripts/voice_input_client.py`
- `VOICE_CONTROL_SUMMARY.md`

### Modified
- `sergik_ml/api/routers/voice.py` - Added `/voice/gpt` endpoint
- `sergik_ml/api/dependencies.py` - Added GPT voice service dependency
- `sergik_ml/core/container.py` - Registered GPT voice service
- `sergik_ml/config.py` - Added `api_base_url` configuration

## Next Steps

1. **Test the pipeline** with real voice commands
2. **Integrate with Max for Live** controller UI
3. **Add wake word detection** for hands-free operation
4. **Implement streaming STT** for real-time processing
5. **Add voice activity detection** for automatic recording

## See Also

- [Voice Control Pipeline Guide](docs/VOICE_CONTROL_PIPELINE.md)
- [SERGIK AI Controller](maxforlive/SERGIK_AI_Device_Guide.md)
- [GPT Actions API](gpt_actions/README.md)
- [Backend-Frontend Connection](docs/BACKEND_FRONTEND_CONNECTION.md)

