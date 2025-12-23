# GPT Actions for Music Generation

Connect your SERGIK Custom GPT to music generation platforms.

## Option 1: Replicate API (Recommended - Easiest)

Replicate hosts MusicGen and other audio AI models with a REST API.

### Setup

1. Get API key: https://replicate.com/account/api-tokens
2. In Custom GPT → Actions → Add Action
3. Import `replicate_openapi.yaml`
4. Add authentication: Bearer token with your API key

### Models Available

| Model | Best For |
|-------|----------|
| `meta/musicgen` | Full music generation |
| `riffusion/riffusion` | Spectogram-based generation |
| `stability-ai/stable-audio` | High-quality audio |

### Example Prompt
```
Generate a SERGIK-style tech house track at 125 BPM in C major 
with funky bassline and multi-layer leads
```

---

## Option 2: Ableton Bridge (Local Control)

Control Ableton Live directly from your GPT via OSC.

### Architecture
```
Custom GPT → GPT Action → ngrok → Bridge Server → OSC → Ableton/Max4Live
```

### Setup

1. Install dependencies:
```bash
pip install flask python-osc
```

2. Install AbletonOSC in Max for Live:
   - Download: https://github.com/ideoforms/AbletonOSC
   - Add to Ableton User Library

3. Run bridge server:
```bash
python ableton_bridge_server.py
```

4. Expose via ngrok:
```bash
ngrok http 5000
```

5. Add ngrok URL to Custom GPT Actions

### Available Commands

| Endpoint | Action |
|----------|--------|
| `POST /ableton/tempo` | Set BPM |
| `POST /ableton/play` | Start playback |
| `POST /ableton/stop` | Stop playback |
| `POST /ableton/clip/fire` | Trigger clip |
| `POST /ableton/device/parameter` | Control device |

---

## Option 3: Mubert API (Commercial)

Mubert offers royalty-free AI music generation.

### Setup

1. Get API key: https://mubert.com/render/api
2. Add to GPT Actions with OpenAPI schema

### Endpoint
```
POST https://api-b2b.mubert.com/v2/RecordTrack
{
  "method": "RecordTrack",
  "params": {
    "pat": "YOUR_PAT_TOKEN",
    "duration": 30,
    "tags": ["house", "funky", "groovy"],
    "mode": "track"
  }
}
```

---

## Option 4: Suno API (Unofficial)

Suno generates full songs with vocals. No official API, but wrappers exist.

### Setup

1. Use unofficial wrapper: https://github.com/gcui-art/suno-api
2. Self-host or use a hosted version
3. Connect via GPT Actions

---

## Option 5: Hugging Face Inference API

Direct access to open-source audio models.

### Setup

1. Get token: https://huggingface.co/settings/tokens
2. Use Inference API endpoints

### Example
```bash
curl https://api-inference.huggingface.co/models/facebook/musicgen-small \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"inputs": "SERGIK style funky house 125 BPM"}'
```

---

## Quick Start Recommendation

**For fastest setup:** Use Replicate
1. Sign up at replicate.com
2. Get API token
3. Import `replicate_openapi.yaml` into your GPT
4. Start generating

**For Ableton control:** Use Bridge Server
1. Run `ableton_bridge_server.py`
2. Install AbletonOSC Max for Live device
3. Expose with ngrok
4. Add to GPT Actions

---

## Option 6: SERGIK ML API (Full Ableton Integration)

The SERGIK ML API provides comprehensive natural language control for music production with **complete Ableton Live integration**.

### Features

- **Full Track Management**: Create/delete/mute/solo/arm tracks, set volume/pan
- **Device Control**: Load instruments, effects, VSTs, control parameters, load presets
- **Clip Management**: Create/fire/stop/duplicate clips, set/get MIDI notes
- **Browser Access**: Search library, load samples, hot-swap sounds
- **Session Control**: Fire scenes, set tempo, quantization, undo/redo
- **Transport Control**: Play, stop, record, stop all clips
- **Mixer Control**: Set send levels, pan, volume
- **Natural Language MIDI Generation**: "generate a tech house chord progression in D minor"
- **Drum Pattern Generation**: MIDI or audio drums with 12+ genre presets
- **SERGIK DNA Analysis**: Compare tracks against your production DNA
- **Voice Control**: Push-to-talk with STT/TTS

### Setup

1. Start the SERGIK ML server:
```bash
cd sergik_custom_gpt
python -m sergik_ml.serving.api
```

2. Load the SERGIK AI Controller M4L device in Ableton

3. (Optional) Expose via ngrok for remote access:
```bash
ngrok http 8000
```

4. Import `sergik_gpt_openapi.yaml` into your Custom GPT Actions

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| **Ableton Live Control** | |
| `POST /live/tracks/create` | Create MIDI/Audio/Return track |
| `PATCH /live/tracks/{index}` | Update track properties |
| `DELETE /live/tracks/{index}` | Delete track |
| `GET /live/tracks` | List all tracks |
| `POST /live/devices/load` | Load Ableton device |
| `POST /live/devices/load_vst` | Load VST/AU plugin |
| `PATCH /live/devices/param` | Set device parameter |
| `GET /live/devices/{track}` | List devices on track |
| `POST /live/clips/create` | Create empty clip |
| `POST /live/clips/fire` | Fire/launch clip |
| `POST /live/clips/notes` | Set MIDI notes in clip |
| `GET /live/clips/{track}/{slot}` | Get clip notes |
| `GET /live/browser/search` | Search Ableton library |
| `POST /live/browser/load` | Load item from browser |
| `POST /live/scenes/fire` | Fire scene |
| `POST /live/session/tempo` | Set tempo |
| `GET /live/session/state` | Get full session state |
| `POST /live/transport/{action}` | Transport control |
| `POST /live/command` | Natural language command |
| **Natural Language** | |
| `POST /gpt/generate` | Natural language MIDI generation |
| `POST /gpt/drums` | Natural language drum generation |
| `POST /gpt/analyze` | SERGIK DNA analysis |
| `GET /gpt/catalog/search` | Search project catalog |
| **Drum Generation** | |
| `POST /drums/generate` | Generate drum pattern (MIDI) |
| `POST /drums/generate/audio` | Generate drum audio (WAV) |
| `GET /drums/genres` | List available drum genres |
| **MIDI Generation** | |
| `POST /generate/chord_progression` | Direct chord generation |
| `POST /generate/walking_bass` | Bass line generation |
| `POST /generate/arpeggios` | Arpeggio generation |
| `POST /transform/humanize` | Humanize MIDI |

### Supported Drum Genres

| Genre | BPM Range | Description |
|-------|-----------|-------------|
| `house` | 120-130 | Classic 4-on-the-floor |
| `tech_house` | 124-128 | Syncopated hats + percs |
| `techno` | 125-140 | Minimal, hypnotic |
| `hiphop` / `boom_bap` | 85-100 | Classic boom bap |
| `trap` | 130-150 | 808s + hi-hat rolls |
| `dnb` / `jungle` | 170-180 | Fast breakbeats |
| `reggaeton` / `dembow` | 90-100 | Dembow rhythm |
| `ambient` / `downtempo` | 70-90 | Sparse, atmospheric |
| `lo_fi` | 75-90 | Lo-fi hip-hop |

### Example GPT Prompts

**Ableton Control:**
```
"Create a new MIDI track called 'Lead Synth'"
"Add Wavetable to track 2"
"Load Serum VST on the bass track"
"Set the filter cutoff to 50% on track 1 device 0"
"Mute tracks 3 and 4"
"Solo the vocals"
"Fire scene 4"
"Set tempo to 128 BPM"
"Duplicate the clip in slot 3"
```

**MIDI Generation:**
```
"Generate a tech house chord progression in 10B with stab voicing"
"Create a walking bass line in D minor, house style, 8 bars"
"Make a trap drum pattern at 140 BPM with hi-hat rolls"
"Generate 8 bars of minimal techno drums with 15% swing"
"Humanize the drums by 25%"
```

**Analysis & Library:**
```
"Analyze my current track and suggest improvements"
"Search my library for '808 kick' samples"
"Scan my samples folder at ~/Music/Samples/Drums"
```

---

## OpenAPI Schema Files

- `sergik_gpt_openapi.yaml` - **SERGIK ML API** (Full Ableton integration, MIDI generation, analysis)
- `replicate_openapi.yaml` - Replicate API schema (audio generation)
- `ableton_openapi.yaml` - Ableton bridge schema (transport control)
- `mubert_openapi.yaml` - Mubert API schema (requires API key)
