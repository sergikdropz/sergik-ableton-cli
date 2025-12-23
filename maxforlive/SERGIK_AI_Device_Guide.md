# SERGIK AI Max for Live Device - Full Ableton Integration

Build guide for the SERGIK AI controller device with complete Ableton Live control.

## Prerequisites

1. **Ableton Live Suite** (or Live + Max for Live add-on)
2. **SERGIK ML API Server** running (`python -m sergik_ml.serving.api`)
3. Copy `SERGIK_AI_Controller.js` to your Max for Live search path

## Quick Start

```bash
# Terminal 1: Start API Server
cd sergik_custom_gpt
python -m sergik_ml.serving.api

# Open Ableton Live with the SERGIK AI M4L device
```

## Complete Command Reference

### Track Management

| Command | Arguments | Description |
|---------|-----------|-------------|
| `create_track` | `<type> [name]` | Create track (midi/audio/return) |
| `delete_track` | `<index>` | Delete track by index |
| `arm_track` | `<index> [0/1]` | Arm track for recording |
| `mute_track` | `<index> [0/1]` | Mute/unmute track |
| `solo_track` | `<index> [0/1]` | Solo/unsolo track |
| `set_volume` | `<index> <0-1>` | Set track volume |
| `set_pan` | `<index> <-1 to 1>` | Set track pan |
| `rename_track` | `<index> <name>` | Rename track |
| `set_track_color` | `<index> <0-69>` | Set track color |
| `get_tracks` | - | List all tracks |
| `get_track_info` | `<index>` | Get track details |

**Examples:**
```
create_track midi Lead Synth
create_track audio Vocals
arm_track 0 1
mute_track 2
solo_track 1
set_volume 0 0.75
set_pan 1 -0.5
rename_track 2 "Drums"
set_track_color 0 15
get_tracks
```

### Device Control

| Command | Arguments | Description |
|---------|-----------|-------------|
| `load_device` | `<track> <name>` | Load Ableton device |
| `load_vst` | `<track> <name>` | Load VST/AU plugin |
| `set_param` | `<track> <device> <param> <value>` | Set parameter |
| `get_params` | `<track> <device>` | Get all parameters |
| `toggle_device` | `<track> <device> [0/1]` | Enable/disable device |
| `load_preset` | `<track> <device> <preset>` | Load preset |
| `get_devices` | `<track>` | List devices on track |

**Examples:**
```
load_device 0 Wavetable
load_device 1 Reverb
load_vst 0 Serum
set_param 0 0 cutoff 0.5
get_params 0 0
toggle_device 0 1
get_devices 0
```

### Clip Management

| Command | Arguments | Description |
|---------|-----------|-------------|
| `create_clip` | `<track> <slot> [length]` | Create empty clip |
| `delete_clip` | `<track> <slot>` | Delete clip |
| `fire_clip` | `<track> <slot>` | Launch clip |
| `stop_clip` | `<track> [slot]` | Stop clip(s) |
| `duplicate_clip` | `<track> <slot> [target_track] [target_slot]` | Duplicate clip |
| `set_clip_notes` | `<track> <slot>` | Set notes from buffer |
| `get_clip_notes` | `<track> <slot>` | Get notes to buffer |
| `get_clip_info` | `<track> <slot>` | Get clip properties |

**Examples:**
```
create_clip 0 0 16
fire_clip 0 0
stop_clip 0
duplicate_clip 0 0 1 0
get_clip_notes 0 0
```

### Browser/Library

| Command | Arguments | Description |
|---------|-----------|-------------|
| `search_library` | `<query>` | Search Ableton library |
| `load_sample` | `<track> <path>` | Load sample to track |
| `hot_swap` | `<track> <device> <path>` | Hot-swap sample |

**Examples:**
```
search_library 808 kick
load_sample 0 /Users/me/Samples/kick.wav
hot_swap 0 0 /Users/me/Samples/new_kick.wav
```

### Session Control

| Command | Arguments | Description |
|---------|-----------|-------------|
| `fire_scene` | `<index>` | Launch scene |
| `stop_scene` | - | Stop all clips |
| `create_scene` | `[name]` | Create new scene |
| `delete_scene` | `<index>` | Delete scene |
| `duplicate_scene` | `<index>` | Duplicate scene |
| `set_tempo` | `<bpm>` | Set session tempo |
| `set_quantization` | `<value>` | Set quantization |
| `undo` | - | Undo last action |
| `redo` | - | Redo action |
| `get_session_state` | - | Get full session state |

**Quantization values:** `none`, `8_bars`, `4_bars`, `2_bars`, `1_bar`, `1/2`, `1/4`, `1/8`, `1/16`, `1/32`

**Examples:**
```
fire_scene 0
create_scene Verse
set_tempo 128
set_quantization 1_bar
undo
get_session_state
```

### Transport Control

| Command | Arguments | Description |
|---------|-----------|-------------|
| `transport_play` | - | Start playback |
| `transport_stop` | - | Stop playback |
| `transport_record` | - | Start recording |
| `stop_all_clips` | - | Stop all clips |

### Mixer Control

| Command | Arguments | Description |
|---------|-----------|-------------|
| `set_send` | `<track> <send_index> <level>` | Set send level |

**Examples:**
```
set_send 0 0 0.5
set_send 1 1 0.75
```

### MIDI Generation

| Command | Arguments | Description |
|---------|-----------|-------------|
| `generate_chords` | - | Generate chord progression |
| `generate_bass` | - | Generate walking bass |
| `generate_arps` | - | Generate arpeggios |
| `prompt` | `<text>` | Natural language MIDI generation |

### Drum Generation

| Command | Arguments | Description |
|---------|-----------|-------------|
| `generate_drums` | - | Generate drum pattern |
| `drums` | `<genre>` | Quick drum generation |
| `drum_prompt` | `<text>` | Natural language drums |
| `drum_genre` | `<name>` | Set genre |
| `drum_genres` | - | List available genres |
| `swing` | `<0-100>` | Set swing amount |
| `humanize` | `<0-100>` | Set humanization |
| `density` | `<0.1-2.0>` | Set pattern density |

**Genres:** house, tech_house, techno, hiphop, boom_bap, trap, dnb, jungle, reggaeton, dembow, ambient, downtempo, lo_fi

### Playback/Buffer

| Command | Arguments | Description |
|---------|-----------|-------------|
| `play` | - | Play notes in buffer |
| `stop` | - | Stop playback |
| `clear` | - | Clear note buffer |
| `insert` | - | Insert notes to selected clip |

### System

| Command | Arguments | Description |
|---------|-----------|-------------|
| `health` | - | Check API connection |
| `set_api` | `<host> <port>` | Set API endpoint |

## Natural Language Examples

The controller supports natural language commands through the `prompt` command:

```
prompt generate tech house chords in 10B
prompt create a walking bass line in D minor
prompt make 8 bars of minimal techno drums
prompt arpeggios in A major with pingpong pattern
```

For Ableton control, you can also use natural language via the API:

```
"Create a new MIDI track called 'Lead Synth'"
"Add Wavetable to track 2"
"Set tempo to 128 BPM"
"Mute tracks 3 and 4"
"Solo the vocals"
"Fire scene 4"
```

## Inlets and Outlets

### Inlets

| Inlet | Type | Description |
|-------|------|-------------|
| 0 | Messages | All commands |
| 1 | Symbol | Key (10B, 7A, etc.) |
| 2 | Int | Bars (1-32) |
| 3 | Symbol | Style (house, techno, jazz) |
| 4 | Symbol | Voicing (stabs, pads) |
| 5 | Symbol | Pattern (up, down, random, pingpong) |

### Outlets

| Outlet | Type | Description |
|--------|------|-------------|
| 0 | MIDI | Note on/off messages |
| 1 | Symbol | Status messages |
| 2 | List | Note data [pitch start duration velocity] |
| 3 | Symbol | JSON response data |

## Building the Device

### Step 1: Create Device

1. Open Ableton Live
2. Create a new MIDI track
3. Go to **Max for Live → Max MIDI Effect**
4. Double-click to create and edit

### Step 2: Add JavaScript Object

In Max editor:
```
Press 'n' → type: js SERGIK_AI_Controller.js → Enter
```

### Step 3: Basic UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                    🎛️ SERGIK AI Controller v2.0                     │
├─────────────────────────────────────────────────────────────────────┤
│ GENERATION                                                           │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│ │ CHORDS │ │  BASS  │ │  ARPS  │ │ DRUMS  │ │ INSERT │            │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘            │
│                                                                      │
│ PARAMETERS                                                           │
│ Key: [10B ▼]  Bars: [8]  Style: [house ▼]  Voicing: [stabs ▼]      │
│                                                                      │
│ NATURAL LANGUAGE                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ generate tech house chords in D minor                           ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│ TRACKS        DEVICES       CLIPS         SESSION                   │
│ [Create]      [Load]        [Fire]        [Play]                    │
│ [Delete]      [Params]      [Stop]        [Stop]                    │
│ [Mute]        [Toggle]      [Create]      [Tempo]                   │
│ [Solo]                      [Duplicate]   [Scene]                   │
│                                                                      │
│ Status: ✅ Connected - sergik-ml-gpt v1.0.0                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 4: Object Connections

```max
# Generation buttons
[live.text CHORDS] → [message generate_chords] → [js inlet 0]
[live.text BASS] → [message generate_bass] → [js inlet 0]
[live.text ARPS] → [message generate_arps] → [js inlet 0]
[live.text DRUMS] → [message generate_drums] → [js inlet 0]
[live.text INSERT] → [message insert] → [js inlet 0]

# Parameter controls
[umenu keys] → [js inlet 1]
[live.dial bars] → [js inlet 2]
[umenu styles] → [js inlet 3]
[umenu voicing] → [js inlet 4]
[umenu pattern] → [js inlet 5]

# Natural language
[textedit] → [prepend prompt] → [js inlet 0]

# Outputs
[js outlet 0] → [midiout]
[js outlet 1] → [comment status]
[js outlet 3] → [print response]
```

## API Endpoints

The SERGIK ML API provides these Live integration endpoints:

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Tracks** | `/live/tracks/create` | POST | Create track |
| | `/live/tracks/{index}` | PATCH | Update track |
| | `/live/tracks/{index}` | DELETE | Delete track |
| | `/live/tracks` | GET | List tracks |
| **Devices** | `/live/devices/load` | POST | Load device |
| | `/live/devices/load_vst` | POST | Load VST |
| | `/live/devices/{track}` | GET | List devices |
| | `/live/devices/param` | PATCH | Set parameter |
| | `/live/devices/toggle` | POST | Toggle device |
| **Clips** | `/live/clips/create` | POST | Create clip |
| | `/live/clips/fire` | POST | Fire clip |
| | `/live/clips/stop` | POST | Stop clip |
| | `/live/clips/duplicate` | POST | Duplicate clip |
| | `/live/clips/{t}/{s}` | GET | Get clip notes |
| | `/live/clips/notes` | POST | Set clip notes |
| **Browser** | `/live/browser/search` | GET | Search library |
| | `/live/browser/load` | POST | Load item |
| | `/live/browser/hot_swap` | POST | Hot swap sample |
| **Session** | `/live/scenes/fire` | POST | Fire scene |
| | `/live/scenes/create` | POST | Create scene |
| | `/live/session/tempo` | POST | Set tempo |
| | `/live/session/state` | GET | Get session state |
| | `/live/transport/{action}` | POST | Transport control |
| **Mixer** | `/live/mixer/send` | POST | Set send level |
| **NLP** | `/live/command` | POST | Natural language command |

## Troubleshooting

### "Disconnected" Status

1. Verify API server is running:
```bash
curl http://127.0.0.1:8000/gpt/health
```

2. Check port 8000 is not blocked

3. In the device, run `health` command

### Device Not Loading

1. Ensure `SERGIK_AI_Controller.js` is in Max search path
2. Check Max console for errors
3. Verify JavaScript file has no syntax errors

### Commands Not Working

1. Check outlet 3 for JSON response
2. Look at Max console for error messages
3. Verify track/device/clip indices are correct (0-indexed)

### Notes Not Inserting

1. Create a MIDI clip first (double-click empty slot)
2. Select the clip
3. Run `insert` command

## File Locations

```
sergik_custom_gpt/
├── maxforlive/
│   ├── SERGIK_AI_Controller.js     # Main JavaScript
│   ├── SERGIK_AI_Device_Guide.md   # This guide
│   └── SERGIK_AI_Simple.maxpat     # Basic patch template
├── sergik_ml/
│   ├── serving/
│   │   └── api.py                  # API with /live/* endpoints
│   └── schemas.py                  # Request/response models
```

Save your completed device to:
```
~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/
```

---

*SERGIK AI v2.0 - Full Ableton Live Integration*
