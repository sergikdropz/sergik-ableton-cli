# SERGIK AI Quick Start Tutorial

## Overview

This tutorial will guide you through setting up and using SERGIK AI Controller with Ableton Live. You'll learn how to:

1. Set up the system
2. Generate MIDI patterns
3. Use editor functions
4. Browse and load samples
5. Analyze tracks

## Prerequisites

- Ableton Live 11+ with Max for Live
- Python 3.8+
- SERGIK ML API server running
- OSC bridge running

## Step 1: Initial Setup

### 1.1 Start the API Server

```bash
# Navigate to project directory
cd /path/to/sergik_custom_gpt

# Start the API server
python -m sergik_ml.serving.api
```

The server will start on `http://localhost:8000` by default.

### 1.2 Start the OSC Bridge

```bash
# In a new terminal
python scripts/osc_bridge.py --port 9000
```

### 1.3 Load Max for Live Device

1. Open Ableton Live
2. Create a new MIDI track
3. Load the SERGIK AI Controller Max for Live device
4. The device should connect to the API server automatically

## Step 2: Generate MIDI Patterns

### 2.1 Generate Chords

In the Max for Live device, use the command:

```
generate_chords
```

Or specify parameters:
- Key: `10B` (Camelot key notation)
- Bars: `8`
- Style: `house`
- Voicing: `stabs`

### 2.2 Generate Bass Lines

```
generate_bass
```

### 2.3 Generate Drum Patterns

```
generate_drums
```

Or specify genre:
```
drums house
```

Available genres: `house`, `techno`, `trap`, `dnb`, `hip-hop`, `jazz`, `funk`, `disco`, `reggaeton`, `afrobeat`, `baile-funk`, `uk-garage`

## Step 3: Use Editor Functions

### 3.1 Quantize MIDI Notes

1. Select a MIDI clip in Ableton Live
2. In the SERGIK AI Controller, use the Editor tab
3. Click "Quantize" or use the API:

```bash
curl -X POST http://localhost:8000/api/transform/quantize \
  -H "Content-Type: application/json" \
  -d '{
    "track_index": 0,
    "clip_slot": 0,
    "grid": "1/16",
    "strength": 100
  }'
```

### 3.2 Transpose Notes

```bash
curl -X POST http://localhost:8000/api/transform/transpose \
  -H "Content-Type: application/json" \
  -d '{
    "track_index": 0,
    "clip_slot": 0,
    "semitones": 12
  }'
```

### 3.3 Time Shift

Move a clip left or right in time:

```bash
curl -X POST http://localhost:8000/api/transform/time_shift \
  -H "Content-Type: application/json" \
  -d '{
    "track_index": 0,
    "clip_slot": 0,
    "direction": "right",
    "amount": 0.25
  }'
```

### 3.4 Audio Processing

Apply fade, normalize, time stretch, or pitch shift:

```bash
# Fade in
curl -X POST http://localhost:8000/api/transform/fade \
  -H "Content-Type: application/json" \
  -d '{
    "track_index": 0,
    "clip_slot": 0,
    "type": "in",
    "duration": 0.5
  }'

# Normalize
curl -X POST http://localhost:8000/api/transform/normalize \
  -H "Content-Type: application/json" \
  -d '{
    "track_index": 0,
    "clip_slot": 0,
    "target_level": -0.1
  }'
```

## Step 4: Browse and Load Samples

### 4.1 Search Library

In the Library tab, use search syntax:

```
BPM:120 key:C name:kick
```

Or search by genre:
```
genre:house
```

### 4.2 Load Sample

1. Double-click a sample in the browser list
2. Or use the API:

```bash
curl -X POST http://localhost:8000/api/live/browser/load \
  -H "Content-Type: application/json" \
  -d '{
    "track_index": 0,
    "sample_path": "/path/to/sample.wav"
  }'
```

### 4.3 Hot-Swap Sample

Replace a sample in a device:

```bash
curl -X POST http://localhost:8000/api/live/browser/hot_swap \
  -H "Content-Type: application/json" \
  -d '{
    "track_index": 0,
    "device_index": 0,
    "sample_path": "/path/to/new_sample.wav"
  }'
```

## Step 5: Analyze Tracks

### 5.1 Analyze Audio File

```bash
curl -X POST http://localhost:8000/api/analyze/upload \
  -F "file=@/path/to/track.wav"
```

Response includes:
- BPM
- Key
- Energy level
- LUFS loudness
- Spectral features

### 5.2 DNA Match

Compare track to SERGIK DNA profile:

```bash
curl -X POST http://localhost:8000/api/gpt/analyze \
  -F "file=@/path/to/track.wav"
```

## Step 6: Export Tracks

### 6.1 Export Single Track

```bash
curl -X POST http://localhost:8000/api/export/track \
  -H "Content-Type: application/json" \
  -d '{
    "track_index": 0,
    "format": "wav",
    "location": "/tmp/exports"
  }'
```

### 6.2 Batch Export

```bash
curl -X POST http://localhost:8000/api/export/batch \
  -H "Content-Type: application/json" \
  -d '{
    "format": "wav",
    "location": "/tmp/exports",
    "tracks": [0, 1, 2],
    "export_stems": false
  }'
```

## Keyboard Shortcuts

### Library Tab
- `Arrow Up/Down` - Navigate media items
- `Enter` - Load selected item
- `Escape` - Deselect item

### Editor
- `Ctrl+Z` - Undo
- `Ctrl+Shift+Z` - Redo
- `Space` - Play/Stop

## Common Workflows

### Workflow 1: Generate and Refine

1. Generate drum pattern: `generate_drums house`
2. Generate bass line: `generate_bass`
3. Generate chords: `generate_chords`
4. Quantize all clips: Use Editor tab
5. Adjust velocities: Editor → Velocity
6. Export: Export tab

### Workflow 2: Sample-Based Production

1. Search library: `BPM:120 genre:house`
2. Preview samples: Click to preview
3. Load sample: Double-click
4. Time stretch if needed: Editor → Time Stretch
5. Pitch shift if needed: Editor → Pitch Shift
6. Normalize: Editor → Normalize

### Workflow 3: Analysis and Matching

1. Analyze track: Analysis tab → Upload file
2. View DNA match: Click "DNA Match"
3. Find similar tracks: Use search with matched parameters
4. Load similar tracks: Double-click to load

## Troubleshooting

### API Server Not Responding

1. Check if server is running: `curl http://localhost:8000/health`
2. Check port: Default is 8000
3. Check logs: Look for error messages

### OSC Bridge Not Connecting

1. Check OSC port: Default is 9000
2. Verify Max for Live device is sending to correct port
3. Check firewall settings

### Editor Functions Not Working

1. Ensure clip is selected in Ableton Live
2. Check track_index and clip_slot are correct
3. Verify OSC connection is active

## Next Steps

- Read [API Reference](API_REFERENCE.md) for detailed endpoint documentation
- Check [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues
- Explore [Design Principles](DESIGN_PRINCIPLES.md) for architecture details

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review API documentation at `http://localhost:8000/docs`
- Check Max for Live device status indicators

