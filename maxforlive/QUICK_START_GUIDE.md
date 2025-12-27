# SERGIK AI Controller - Quick Start Guide

## What It Does

The SERGIK AI Controller provides complete control over Ableton Live through AI-powered MIDI generation and Live Object Model integration. It generates musical patterns and controls all aspects of your Ableton Live session.

## Features

- **Generate MIDI**: Chords, bass, arpeggios, drums
- **Track Management**: Create, delete, rename, arm, mute, solo tracks
- **Device Control**: Load devices/VSTs, set parameters, load presets
- **Clip Management**: Create, fire, duplicate clips, set notes
- **Session Control**: Scenes, tempo, quantization, undo/redo
- **Transport Control**: Play, stop, record
- **Natural Language**: Describe what you want in plain English

## Quick Start

### 1. Start the API Server

```bash
cd ~/sergik_custom_gpt
python -m sergik_ml.serving.api
```

### 2. Load Device in Ableton

1. Create a MIDI track
2. Go to **Max for Live → Max MIDI Effect**
3. Select **SERGIK AI Controller**

### 3. Generate MIDI

1. **Set Parameters:**
   - Key: Select musical key (e.g., 10B)
   - Bars: Set length (1-32, default: 8)
   - Style: Choose genre (house, techno, etc.)
   - Voicing: Select type (stabs, pads, leads, bass)

2. **Generate:**
   - Click **CHORDS**, **BASS**, **ARPS**, or **DRUMS**
   - Or type in natural language field

3. **Use Generated Notes:**
   - Click **PLAY** to hear
   - Click **INSERT** to add to selected clip

### 4. Control Ableton Live

**Create Track:**
```
create_track midi Lead Synth
```

**Load Device:**
```
load_device 0 Wavetable
```

**Create and Fire Clip:**
```
create_clip 0 0 16
fire_clip 0 0
```

**Control Session:**
```
set_tempo 128
fire_scene 0
```

## Natural Language Examples

Type in the natural language field:

```
generate tech house chords in 10B
create a new MIDI track called Lead Synth
load Wavetable on track 1
fire scene 2
set tempo to 128
create a walking bass line in D minor
```

## Parameters

- **Key**: Musical key (10B, 7A, 11B, etc.)
- **Bars**: Pattern length (1-32, default: 8)
- **Style**: Genre/style (house, techno, jazz, etc.)
- **Voicing**: Chord voicing (stabs, pads, leads, bass)
- **Humanize**: Timing variation (0-100, default: 15)
- **Density**: Note density (0-100, default: 60)

## Troubleshooting

**"Disconnected" status:**
- Start the API server
- Click **HEALTH** button
- Check server is running on port 8000

**Notes not inserting:**
- Create a MIDI clip first
- Select the clip
- Click **INSERT**

**Commands not working:**
- Check API server is running
- Verify connection with **HEALTH** button
- Check Max console for errors
- Ensure track/device/clip indices are correct (0-indexed)

**Track/Device/Clip commands:**
- All commands use 0-indexed values
- Track 0 = first track
- Device 0 = first device on track
- Clip slot 0 = first clip slot

---

*SERGIK AI v2.0 - Full Ableton Live Integration*
