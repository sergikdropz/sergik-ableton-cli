# SERGIK AI - Ableton Live Integration

AI-powered music generation CLI for Ableton Live. Generate drums, bass, chords, and melodies in the SERGIK production style.

Works alongside **Spawn VST** by Sauceware Audio for complementary AI generation.

## Features

- **Drum Generation**: Tech-house, house, techno, disco, trap, reggaeton patterns
- **Bass Generation**: Groove-first basslines with syncopation
- **Chord Progressions**: House/tech-house style chord sequences
- **Melody Generation**: Scale-aware melodic lines
- **Ableton Control**: OSC-based transport and parameter control
- **Max for Live Integration**: Real-time MIDI routing

## Catalog Stats

- Total Tracks: 651
- Training Ready: 554 (24-bit WAV)
- Collaborators: 98 unique
- Duration: 44.59 hours
- Size: 38.32 GB

## Installation

```bash
# Clone the repository
git clone https://github.com/sergikdropz/sergik-ableton-cli.git
cd sergik-ableton-cli

# Install dependencies
pip install -r requirements.txt

# Make CLI executable
chmod +x sergik_cli.py

# Optional: Add to PATH
ln -s $(pwd)/sergik_cli.py /usr/local/bin/sergik
```

## Quick Start

```bash
# Generate 8 bars of tech-house drums
python sergik_cli.py generate drums --style tech-house --bars 8

# Generate bassline in C minor
python sergik_cli.py generate bass --key Cmin --bars 8

# Generate chord progression
python sergik_cli.py generate chords --key Cmin --progression "i-VI-III-VII"

# Generate melody
python sergik_cli.py generate melody --key Cmin --density 0.4

# Generate full arrangement
python sergik_cli.py generate full --key Cmin --style tech-house --bars 8
```

## Commands

### Generate

```bash
sergik generate drums [OPTIONS]
  --style     tech-house|house|techno|disco|trap|reggaeton
  --bars      Number of bars (default: 8)
  --bpm       Tempo (default: 125)
  --output    Output MIDI file path
  --send      Send to Ableton via OSC

sergik generate bass [OPTIONS]
  --key       Key signature (e.g., Cmin, F#maj)
  --bars      Number of bars
  --bpm       Tempo
  --output    Output path
  --send      Send to Ableton

sergik generate chords [OPTIONS]
  --key         Key signature
  --progression Chord progression (e.g., "i-VI-III-VII")
  --bars        Number of bars
  --output      Output path

sergik generate melody [OPTIONS]
  --key       Key signature
  --density   Note density 0-1 (default: 0.4)
  --bars      Number of bars
  --output    Output path

sergik generate full [OPTIONS]
  --key         Key signature
  --style       Drum style
  --bars        Number of bars
  --output-dir  Output directory
```

### Control Ableton

```bash
sergik control tempo 125      # Set tempo
sergik control play           # Start playback
sergik control stop           # Stop playback
sergik control volume 0 0.8   # Set track 0 volume to 0.8
sergik control fire 0 0       # Fire clip 0 on track 0
```

### Configuration

```bash
sergik config --show                    # Show current config
sergik config --osc-port 9000          # Set OSC port
sergik config --osc-host 127.0.0.1     # Set OSC host
```

### Status

```bash
sergik status    # Check dependencies and configuration
```

## Ableton Setup

### Max for Live Device

1. Open Ableton Live
2. Create a new MIDI track
3. Add a Max for Live MIDI Effect
4. Add these objects:
   - `[udpreceive 9000]` - Receives OSC from CLI
   - `[js SERGIK_OSC_Receiver.amxd.js]` - Processes messages
   - `[midiout]` - Outputs MIDI

### OSC Communication

The CLI sends OSC messages to port 9000 by default:

| Address | Arguments | Description |
|---------|-----------|-------------|
| `/sergik/midi/note` | track pitch vel start dur | Send MIDI note |
| `/live/song/set/tempo` | bpm | Set tempo |
| `/live/song/start_playing` | 1 | Start playback |
| `/live/song/stop_playing` | 1 | Stop playback |
| `/live/track/set/volume` | track volume | Set track volume |
| `/live/clip/fire` | track clip | Fire clip |

## Integration with Spawn VST

SERGIK CLI is designed to work alongside [Spawn by Sauceware Audio](https://saucewareaudio.com/products/spawn):

1. Use Spawn for instant AI-generated melodies with built-in sounds
2. Use SERGIK CLI for custom drum patterns and basslines
3. Route both to separate Ableton tracks
4. Combine for full arrangements

## Architecture

```
┌─────────────────┐     OSC/MIDI      ┌─────────────────┐
│  SERGIK CLI     │ ──────────────►   │  Ableton Live   │
│                 │                   │                 │
│  sergik_cli.py  │                   │  Max for Live   │
│  - drums        │     Port 9000     │  OSC Receiver   │
│  - bass         │                   │                 │
│  - chords       │                   │  ├─ Drums Track │
│  - melody       │                   │  ├─ Bass Track  │
└─────────────────┘                   │  ├─ Chords Track│
                                      │  └─ Melody Track│
┌─────────────────┐                   │                 │
│  Spawn VST      │ ──── MIDI ────►   │  Spawn Track    │
└─────────────────┘                   └─────────────────┘
```

## SERGIK Style Profile

Based on analysis of 651 SERGIK tracks:

- **BPM Range**: 120-127 (sweet spot for tech-house)
- **Primary Keys**: C Major (28%), G Major (22%), D Minor (18%)
- **Groove Philosophy**: Groove-first, syncopated basslines
- **Production**: Spectral separation, gate-tight transients

## Project Structure

```
sergik_custom_gpt/
├── sergik_cli.py                 # Main CLI tool
├── requirements.txt              # Python dependencies
├── README.md                     # This file
├── gpt_actions/
│   └── ableton_bridge_server.py  # HTTP/REST bridge
├── maxforlive/
│   └── SERGIK_OSC_Receiver.amxd.js  # M4L JavaScript
├── knowledge/                    # GPT knowledge base
│   ├── 00_overview.md
│   ├── 01_style_signature.md
│   ├── 02_quality_standards.md
│   ├── 03_workflow_templates.md
│   └── 04_dataset_extraction_spec.md
├── scripts/                      # Data processing
│   ├── scan_audio.py
│   ├── scan_projects.py
│   └── build_knowledge_chunks.py
└── data/                         # Training data
    ├── manifests/
    ├── chunks/
    └── finetune/
```

## GPT Training Quick Start

1. Run audio scan: `python scripts/scan_audio.py`
2. Run project scan: `python scripts/scan_projects.py`
3. Build chunks: `python scripts/build_knowledge_chunks.py`
4. Upload `knowledge/*.md` to Custom GPT
5. Optional: Fine-tune with `data/finetune/sergik_finetune.jsonl`

## License

MIT License - Use freely for music production.

## Credits

- **SERGIK** - Production style and training data
- **Sauceware Audio** - Spawn VST integration
- **Lemonaide Music** - AI MIDI technology
