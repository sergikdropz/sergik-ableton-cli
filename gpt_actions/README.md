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

## OpenAPI Schema Files

- `replicate_openapi.yaml` - Replicate API schema
- `ableton_openapi.yaml` - Ableton bridge schema (generate after running server)
- `mubert_openapi.yaml` - Mubert API schema (requires API key)
