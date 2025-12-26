# SERGIK AI Controller - Max for Live Device Setup

## Quick Start

### 1. Prerequisites

- **Ableton Live Suite** (or Live + Max for Live add-on)
- **SERGIK ML API Server** running on `http://127.0.0.1:8000`

### 2. Install the Device

1. **Copy the device file:**
   ```bash
   # Copy to your Ableton User Library
   cp SERGIK_AI_Controller.maxpat ~/Music/Ableton/User\ Library/Presets/MIDI\ Effects/Max\ MIDI\ Effect/
   ```

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
- **Key** - Musical key (10B, 7A, etc.)
- **Bars** - Length in bars (1-32)
- **Style** - Musical style (house, techno, jazz, etc.)
- **Voicing** - Voicing type (stabs, pads, leads, bass)
- **Humanize** - Humanization amount (0-100)
- **Density** - Pattern density (0-100)

### Natural Language Input
Type commands like:
- `generate tech house chords in 10B`
- `create a walking bass line in D minor`
- `make 8 bars of minimal techno drums`

### Playback Controls
- **▶ PLAY** - Play generated notes
- **CLEAR** - Clear note buffer
- **HEALTH** - Check API connection status

## Advanced Usage

### Command Reference

All commands can be sent to the device's first inlet:

**MIDI Generation:**
```
generate_chords
generate_bass
generate_arps
prompt <text>
```

**Drum Generation:**
```
generate_drums
drums <genre>
drum_prompt <text>
swing <0-100>
humanize <0-100>
density <0.1-2.0>
```

**Track Management:**
```
create_track <type> [name]
delete_track <index>
arm_track <index> [0/1]
mute_track <index> [0/1]
solo_track <index> [0/1]
set_volume <index> <0-1>
set_pan <index> <-1 to 1>
get_tracks
```

**Device Control:**
```
load_device <track> <name>
load_vst <track> <name>
set_param <track> <device> <param> <value>
get_params <track> <device>
toggle_device <track> <device>
get_devices <track>
```

**Clip Management:**
```
create_clip <track> <slot> [length]
fire_clip <track> <slot>
stop_clip <track> [slot]
set_clip_notes <track> <slot>
get_clip_notes <track> <slot>
```

**Session Control:**
```
fire_scene <index>
set_tempo <bpm>
set_quantization <value>
transport_play
transport_stop
transport_record
```

See `SERGIK_AI_Device_Guide.md` for complete command reference.

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
├── SERGIK_AI_Controller.maxpat    # Max for Live device (this file)
├── SERGIK_AI_Controller.js       # JavaScript engine
├── SERGIK_AI_Device_Guide.md      # Complete documentation
└── M4L_DEVICE_SETUP.md           # This file
```

## Saving as Preset

After customizing the device:

1. In Ableton Live, right-click the device
2. Select **Save as Default Preset**
3. Or save to: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`

---

*SERGIK AI v2.0 - Full Ableton Live Integration*

