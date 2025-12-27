# SERGIK AI Controller - Complete Device Guide

## Overview

The SERGIK AI Controller is a comprehensive Max for Live device that provides full control over Ableton Live through AI-powered MIDI generation and Live Object Model (LOM) integration. It communicates with the SERGIK ML API server to create musical patterns and control Ableton Live.

## Features

- **MIDI Generation**: Chords, bass, arpeggios, and drums
- **Natural Language Control**: Describe what you want in plain English
- **Track Management**: Create, delete, rename, arm, mute, solo tracks
- **Device Control**: Load devices/VSTs, set parameters, load presets
- **Clip Management**: Create, fire, duplicate clips, set notes
- **Browser/Library Access**: Search and load samples
- **Session Control**: Scenes, tempo, quantization, undo/redo
- **Transport Control**: Play, stop, record
- **Mixer Control**: Volume, pan, sends
- **Parameter Control**: Key, bars, style, voicing, humanize, density

## Installation

1. Save `SERGIK_AI_Controller.maxpat` as `.amxd` format in:
   `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`

2. Ensure `SERGIK_AI_Controller.js` is accessible to Max

3. Start the API server:
   ```bash
   python -m sergik_ml.serving.api
   ```

## Usage

### Basic MIDI Generation

1. **Set Parameters:**
   - Select **Key** (e.g., 10B, 7A)
   - Set **Bars** (1-32)
   - Choose **Style** (house, techno, jazz, etc.)
   - Select **Voicing** (stabs, pads, leads, bass)

2. **Generate:**
   - Click **CHORDS**, **BASS**, **ARPS**, or **DRUMS**
   - Or type in the natural language field

3. **Play/Insert:**
   - Click **PLAY** to hear the generated notes
   - Click **INSERT** to add notes to selected clip

### Track Management

**Create Track:**
```
create_track midi Lead Synth
create_track audio Vocals
create_track return Reverb
```

**Track Control:**
```
arm_track 0 1          # Arm track 0
mute_track 1           # Toggle mute on track 1
solo_track 2 1         # Solo track 2
set_volume 0 0.75      # Set track 0 volume to 75%
set_pan 1 -0.5         # Pan track 1 left
rename_track 2 "Drums" # Rename track 2
set_track_color 0 15   # Set track 0 color
get_tracks             # List all tracks
```

### Device Control

**Load Devices:**
```
load_device 0 Wavetable
load_device 1 Reverb
load_vst 0 Serum
```

**Control Parameters:**
```
set_param 0 0 cutoff 0.5    # Set cutoff on track 0, device 0
get_params 0 0              # Get all parameters
toggle_device 0 1           # Toggle device on/off
load_preset 0 0 "Bright Pad"  # Load preset
get_devices 0               # List devices on track 0
```

### Clip Management

**Create and Control Clips:**
```
create_clip 0 0 16         # Create 16-bar clip on track 0, slot 0
fire_clip 0 0              # Launch clip
stop_clip 0                # Stop all clips on track 0
duplicate_clip 0 0 1 0     # Duplicate to track 1, slot 0
set_clip_notes 0 0         # Insert generated notes
get_clip_notes 0 0         # Get notes from clip
get_clip_info 0 0          # Get clip information
```

### Session Control

**Scenes:**
```
fire_scene 0               # Launch scene 0
create_scene Verse         # Create new scene
delete_scene 1             # Delete scene 1
duplicate_scene 0          # Duplicate scene 0
stop_scene                 # Stop all clips
```

**Tempo and Quantization:**
```
set_tempo 128             # Set tempo to 128 BPM
set_quantization 1_bar     # Set quantization
undo                       # Undo last action
redo                       # Redo action
get_session_state         # Get full session state
```

### Transport Control

```
transport_play             # Start playback
transport_stop             # Stop playback
transport_record           # Start recording
stop_all_clips             # Stop all clips
```

### Natural Language Commands

Type commands in the natural language input field:

**Examples:**
```
generate tech house chords in 10B
create a walking bass line in D minor
make 8 bars of minimal techno drums
create a new MIDI track called Lead Synth
load Wavetable on track 1
fire scene 2
set tempo to 128
```

## Complete Command Reference

### MIDI Generation
- `generate_chords` - Generate chord progression
- `generate_bass` - Generate bass line
- `generate_arps` - Generate arpeggios
- `prompt <text>` - Natural language generation

### Drum Generation
- `generate_drums` - Generate drum pattern
- `drums <genre>` - Generate specific genre
- `drum_prompt <text>` - Natural language drum generation
- `drum_genre <name>` - Set drum genre
- `swing <0-100>` - Set swing amount
- `humanize <0-100>` - Set humanization
- `density <0.1-2.0>` - Set pattern density

### Track Management
- `create_track <type> [name]` - Create track
- `delete_track <index>` - Delete track
- `arm_track <index> [0/1]` - Arm track
- `mute_track <index> [0/1]` - Mute track
- `solo_track <index> [0/1]` - Solo track
- `set_volume <index> <0-1>` - Set volume
- `set_pan <index> <-1 to 1>` - Set pan
- `rename_track <index> <name>` - Rename track
- `set_track_color <index> <0-69>` - Set color
- `get_tracks` - List tracks
- `get_track_info <index>` - Get track info

### Device Control
- `load_device <track> <name>` - Load device
- `load_vst <track> <name>` - Load VST
- `set_param <track> <device> <param> <value>` - Set parameter
- `get_params <track> <device>` - Get parameters
- `toggle_device <track> <device>` - Toggle device
- `load_preset <track> <device> <preset>` - Load preset
- `get_devices <track>` - List devices

### Clip Management
- `create_clip <track> <slot> [length]` - Create clip
- `delete_clip <track> <slot>` - Delete clip
- `fire_clip <track> <slot>` - Launch clip
- `stop_clip <track> [slot]` - Stop clip
- `duplicate_clip <track> <slot> [target_track] [target_slot]` - Duplicate clip
- `set_clip_notes <track> <slot>` - Set notes
- `get_clip_notes <track> <slot>` - Get notes
- `get_clip_info <track> <slot>` - Get clip info

### Browser/Library
- `search_library <query>` - Search library
- `load_sample <track> <path>` - Load sample
- `hot_swap <track> <device> <path>` - Hot-swap sample

### Session Control
- `fire_scene <index>` - Launch scene
- `stop_scene` - Stop all clips
- `create_scene [name]` - Create scene
- `delete_scene <index>` - Delete scene
- `duplicate_scene <index>` - Duplicate scene
- `set_tempo <bpm>` - Set tempo
- `set_quantization <value>` - Set quantization
- `undo` - Undo
- `redo` - Redo
- `get_session_state` - Get session state

### Transport
- `transport_play` - Play
- `transport_stop` - Stop
- `transport_record` - Record
- `stop_all_clips` - Stop all clips

### Mixer
- `set_send <track> <send_index> <level>` - Set send level

### Playback
- `play` - Play notes
- `stop` - Stop playback
- `clear` - Clear buffer
- `insert` - Insert to clip

### System
- `health` - Check connection
- `set_api <host> <port>` - Change API endpoint

## Parameters

### Key
Musical key selection (10B, 7A, 11B, 8A, etc.)

### Bars
Length of generated pattern (1-32 bars, default: 8)

### Style
Musical style/genre (house, techno, jazz, trap, dnb, etc.)

### Voicing
Chord voicing type (stabs, pads, leads, bass)

### Humanize
Adds timing and velocity variation (0-100, default: 15)

### Density
Pattern note density (0-100, default: 60)

## Inlets

- **Inlet 0**: Commands (bang, messages)
- **Inlet 1**: Key selection (symbol)
- **Inlet 2**: Bars (int: 1-32)
- **Inlet 3**: Style (symbol)
- **Inlet 4**: Voicing (symbol)
- **Inlet 5**: Pattern (symbol)

## Outlets

- **Outlet 0**: MIDI notes (pitch velocity)
- **Outlet 1**: Status messages (for display)
- **Outlet 2**: Note data (pitch start duration velocity)
- **Outlet 3**: API response (JSON string)

## Troubleshooting

**Device not generating:**
- Check API server is running
- Click **HEALTH** button
- Verify connection status

**Notes not inserting:**
- Create a MIDI clip first
- Select the clip
- Click **INSERT**

**Track/Device/Clip commands not working:**
- Check track/device/clip indices (0-indexed)
- Verify Ableton Live is running
- Check Max console for errors
- Ensure Live Object Model access is enabled

**Natural language not working:**
- Check API server logs
- Verify prompt format
- Try simpler commands first

---

*SERGIK AI v2.0 - Full Ableton Live Integration*
