# SERGIK AI Controller - Max for Live Device Setup

## Quick Start

### 1. Prerequisites

- **Ableton Live Suite** (or Live + Max for Live add-on)
- **SERGIK ML API Server** running on `http://127.0.0.1:8000`

### 2. Install the Device

1. **Save the device file:**
   - Open `SERGIK_AI_Controller.maxpat` in Max
   - **File → Save As**
   - Navigate to: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`
   - Change format to **"Max for Live Device"**
   - Save as: `SERGIK_AI_Controller.amxd` (or your preferred name)

2. **Ensure JavaScript file is accessible:**
   - The device references `SERGIK_AI_Controller.js`
   - Make sure this file is in Max's search path
   - Default location: `~/sergik_custom_gpt/maxforlive/`

3. **Start the API server:**
   ```bash
   cd ~/sergik_custom_gpt
   python -m sergik_ml.serving.api
   ```

### 3. Use in Ableton Live

1. Open Ableton Live
2. Create a new MIDI track
3. Go to **Max for Live → Max MIDI Effect**
4. Select **SERGIK AI Controller** from your presets
5. Click **HEALTH** button to verify connection

## Device Features

### Generation Buttons
- **CHORDS** - Generate chord progressions
- **BASS** - Generate walking bass lines
- **ARPS** - Generate arpeggios
- **DRUMS** - Generate drum patterns
- **INSERT** - Insert generated notes into selected clip

### Parameters
- **Key** - Musical key (10B, 7A, 11B, 8A, 9B, 6A, 12B, 5A, 1B, 4A, 2B, 3A)
- **Bars** - Length in bars (1-32, default: 8)
- **Style** - Musical style (house, techno, jazz, etc.)
- **Voicing** - Voicing type (stabs, pads, leads, bass)
- **Humanize** - Humanization amount (0-100, default: 15)
- **Density** - Pattern density (0-100, default: 60)

### Natural Language Input
Type commands in the natural language field:
- `generate tech house chords in 10B`
- `create a walking bass line in D minor`
- `make 8 bars of minimal techno drums`
- `generate trap drums at 140 BPM`

### Playback Controls
- **▶ PLAY** - Play generated notes
- **CLEAR** - Clear note buffer
- **HEALTH** - Check API connection status

## Complete Command Reference

### MIDI Generation
```
generate_chords
generate_bass
generate_arps
prompt <text>
```

### Drum Generation
```
generate_drums
drums <genre>
drum_prompt <text>
drum_genre <name>
swing <0-100>
humanize <0-100>
density <0.1-2.0>
```

### Track Management
```
create_track <type> [name]          # Create track (midi/audio/return)
delete_track <index>                 # Delete track by index
arm_track <index> [0/1]              # Arm track for recording
mute_track <index> [0/1]             # Mute/unmute track
solo_track <index> [0/1]             # Solo/unsolo track
set_volume <index> <0-1>             # Set track volume
set_pan <index> <-1 to 1>           # Set track pan
rename_track <index> <name>          # Rename track
set_track_color <index> <0-69>       # Set track color
get_tracks                           # List all tracks
get_track_info <index>               # Get track details
```

### Device Control
```
load_device <track> <name>           # Load Ableton device
load_vst <track> <name>              # Load VST/AU plugin
set_param <track> <device> <param> <value>  # Set parameter
get_params <track> <device>        # Get all parameters
toggle_device <track> <device>     # Enable/disable device
load_preset <track> <device> <preset_name>  # Load preset
get_devices <track>                 # List devices on track
```

### Clip Management
```
create_clip <track> <slot> [length]  # Create empty clip
delete_clip <track> <slot>           # Delete clip
fire_clip <track> <slot>              # Launch clip
stop_clip <track> [slot]              # Stop clip(s)
duplicate_clip <track> <slot> [target_track] [target_slot]  # Duplicate clip
set_clip_notes <track> <slot>         # Set notes from buffer
get_clip_notes <track> <slot>         # Get notes to buffer
get_clip_info <track> <slot>         # Get clip properties
```

### Browser/Library
```
search_library <query>               # Search Ableton library
load_sample <track> <path>           # Load sample to track
hot_swap <track> <device> <path>     # Hot-swap sample
```

### Session Control
```
fire_scene <index>                   # Launch scene
stop_scene                           # Stop all clips
create_scene [name]                  # Create new scene
delete_scene <index>                 # Delete scene
duplicate_scene <index>              # Duplicate scene
set_tempo <bpm>                      # Set session tempo
set_quantization <value>             # Set quantization
undo                                 # Undo last action
redo                                 # Redo action
get_session_state                    # Get full session state
```

### Transport Control
```
transport_play                       # Start playback
transport_stop                       # Stop playback
transport_record                     # Start recording
stop_all_clips                       # Stop all clips
```

### Mixer Control
```
set_send <track> <send_index> <level>  # Set send level
```

### Playback
```
play                                 # Play generated notes
stop                                 # Stop playback
clear                                # Clear note buffer
insert                               # Insert notes into selected clip
```

### System
```
health                               # Check API connection
set_api <host> <port>                # Change API endpoint
```

## Troubleshooting

### Device Not Loading
1. Check Max console for errors
2. Verify `SERGIK_AI_Controller.js` is in Max search path
3. Ensure JavaScript file has no syntax errors

### "Disconnected" Status
1. Verify API server is running:
   ```bash
   curl http://127.0.0.1:8000/gpt/health
   ```
2. Click **HEALTH** button in device
3. Check port 8000 is not blocked

### Notes Not Inserting
1. Create a MIDI clip first (double-click empty slot)
2. Select the clip
3. Click **INSERT** button

### Commands Not Working
1. Check outlet 3 for JSON response
2. Look at Max console for error messages
3. Verify track/device/clip indices are correct (0-indexed)

## File Structure

```
maxforlive/
├── SERGIK_AI_Controller.maxpat    # Max for Live device source
├── SERGIK_AI_Controller.js        # JavaScript engine
└── M4L_DEVICE_SETUP.md            # This file
```

## Saving as Preset

After customizing the device:

1. In Ableton Live, right-click the device
2. Select **Save as Default Preset**
3. Or save to: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`

---

*SERGIK AI v2.0 - Full Ableton Live Integration*
