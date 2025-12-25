# SERGIK AI - Complete Music Production Ecosystem

AI-powered music generation and production assistant for Ableton Live. Generate drums, bass, chords, and melodies using SERGIK's proprietary production style, with full Ableton Live integration, DNA analysis, and natural language control.

## Features

### Music Generation
- **Drum Generation**: 12+ genres (house, tech-house, techno, hip-hop, trap, DnB, reggaeton, ambient, lo-fi, and more)
- **Bass Generation**: Groove-first basslines with syncopation
- **Chord Progressions**: House/tech-house style chord sequences with multiple voicings
- **Melody Generation**: Scale-aware melodic lines
- **Arpeggios**: Multiple pattern types (up, down, random, pingpong)
- **Natural Language Generation**: "Generate tech house chords in D minor"

### Ableton Live Integration
- **Full Track Management**: Create/delete/mute/solo/arm tracks, set volume/pan
- **Device Control**: Load instruments, effects, VSTs, control parameters, load presets
- **Clip Management**: Create/fire/stop/duplicate clips, set/get MIDI notes
- **Browser Access**: Search library, load samples, hot-swap sounds
- **Session Control**: Fire scenes, set tempo, quantization, undo/redo
- **Transport Control**: Play, stop, record, stop all clips
- **Mixer Control**: Set send levels, pan, volume
- **OSC-based Control**: Real-time parameter modulation
- **Max for Live Integration**: Complete SERGIK AI Controller device

### Analysis & Intelligence
- **SERGIK DNA Analysis**: Compare tracks against production DNA profile
- **MusicBrainz Integration**: Automatic metadata and genre extraction
- **Audio Analysis**: BPM, key (Camelot), energy level detection
- **Catalog Search**: Find tracks by collaborator, year, BPM, key, or style
- **Similarity Matching**: Vector-based track similarity
- **Voice Control**: Push-to-talk with STT/TTS integration

### GPT Integration
- **Custom GPT Actions**: Full OpenAPI integration
- **Natural Language Commands**: Control Ableton via chat
- **Production Advice**: Style-based recommendations
- **Collaboration Support**: Match collaborators to project styles

## Catalog Statistics

### Complete Catalog
- **Ableton Projects**: 20,503 (.als files)
- **Finished Exports**: 721 tracks
- **iTunes Library**: 1,895 tracks (1,167 SERGIK + 728 influences)
- **Training Ready**: 554 tracks (24-bit WAV)
- **Total Storage**: 350+ GB
- **Years Active**: 2015-2025
- **Unique Collaborators**: 98
- **Total Duration**: 44.59+ hours

### Production Timeline
- **2024**: 6,364 projects (peak year)
- **2025**: 4,251 projects
- **2022**: 4,631 projects
- **2023**: 2,514 projects

### Top Collaborators

**By Project Count:**
1. Silent Jay (408 projects)
2. Slick Floyd (285 projects)
3. Breauxx (213 projects)
4. OG Coconut (187 projects)
5. NOOD (185 projects)
6. ANDINO (154 projects)
7. Sean Watson (151 projects)
8. Sean Hart (122 projects)
9. CHKLZ (108 projects)
10. LODIN (108 projects)

**By Exported Tracks:**
1. Silent Jay (27 exported tracks)
2. ANDINO (16 exported tracks)
3. Breauxx (16 exported tracks)
4. Slick Floyd (16 exported tracks)
5. Javi (8 exported tracks)
6. L9V (8 exported tracks)
7. Sean Hart (7 exported tracks)
8. JIMII (6 exported tracks)
9. Stan The Guitarman (6 exported tracks)
10. ESHER (6 exported tracks)

**Note:** 437 solo tracks (no collaborator) have been exported.

## Installation

```bash
# Clone the repository
git clone https://github.com/sergikdropz/sergik-ableton-cli.git
cd sergik-ableton-cli

# Install dependencies
pip install -r requirements.txt

# Optional: Install MusicBrainz packages for DNA analysis
pip install musicbrainzngs pyacoustid

# Optional: Set AcoustID API key for better MusicBrainz lookup
export ACOUSTID_API_KEY="your_api_key_here"  # Get free key at https://acoustid.org/api-key

# Make CLI executable
chmod +x sergik_cli.py

# Optional: Add to PATH
ln -s $(pwd)/sergik_cli.py /usr/local/bin/sergik
```

### Start SERGIK ML API Server

```bash
# Start the API server (required for Max for Live device and GPT Actions)
python -m sergik_ml.serving.api

# Server runs on http://127.0.0.1:8000
# API docs available at http://127.0.0.1:8000/docs
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

## Ableton Live Setup

### Max for Live Device (SERGIK AI Controller)

The SERGIK AI Controller provides complete Ableton Live integration:

1. **Start API Server** (required):
   ```bash
   python -m sergik_ml.serving.api
   ```

2. **Load Device in Ableton**:
   - Open Ableton Live
   - Create a new MIDI track
   - Add Max for Live MIDI Effect
   - Load `SERGIK_AI_Controller.js` (see `maxforlive/SERGIK_AI_Device_Guide.md`)

3. **Device Features**:
   - Natural language MIDI generation
   - Drum pattern generation (12+ genres)
   - Full track/device/clip management
   - Browser/library search
   - Session control and transport
   - Real-time parameter control

### Available Commands (via Max for Live or API)

**Track Management**: `create_track`, `delete_track`, `arm_track`, `mute_track`, `solo_track`, `set_volume`, `set_pan`

**Device Control**: `load_device`, `load_vst`, `set_param`, `get_params`, `toggle_device`

**Clip Management**: `create_clip`, `fire_clip`, `stop_clip`, `duplicate_clip`, `set_clip_notes`, `get_clip_notes`

**Session Control**: `fire_scene`, `set_tempo`, `set_quantization`, `undo`, `redo`

**Generation**: `generate_chords`, `generate_bass`, `generate_arps`, `generate_drums`, `prompt` (natural language)

See `maxforlive/SERGIK_AI_Device_Guide.md` for complete command reference.

### OSC Communication (Legacy)

The CLI can also send OSC messages to port 9000:

| Address | Arguments | Description |
|---------|-----------|-------------|
| `/sergik/midi/note` | track pitch vel start dur | Send MIDI note |
| `/live/song/set/tempo` | bpm | Set tempo |
| `/live/song/start_playing` | 1 | Start playback |
| `/live/song/stop_playing` | 1 | Stop playback |
| `/live/track/set/volume` | track volume | Set track volume |
| `/live/clip/fire` | track clip | Fire clip |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎵 ABLETON LIVE (.als)                       │
│                    Creative Source of Truth                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERGIK ML API (FastAPI Server)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ MIDI Gen     │  │ Drum Gen     │  │ DNA Analysis │         │
│  │ - Chords     │  │ - 12+ genres │  │ - MusicBrainz│         │
│  │ - Bass       │  │ - Audio/MIDI │  │ - BPM/Key    │         │
│  │ - Arps       │  │ - Humanize   │  │ - Energy     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Ableton Ctrl │  │ Voice Ctrl   │  │ Vector Store │         │
│  │ - Tracks     │  │ - STT/TTS    │  │ - Similarity  │         │
│  │ - Devices    │  │ - Push-to-talk│  │ - Search     │         │
│  │ - Clips      │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Max for Live │    │ Custom GPT   │    │ CLI Tool     │
│ Controller   │    │ Actions      │    │ sergik_cli.py│
│ Device       │    │ OpenAPI      │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Integration Points

- **Ableton Live → SERGIK AI**: Max for Live device sends OSC/HTTP to API
- **SERGIK AI → Ableton Live**: API controls Live via OSC/HTTP
- **Custom GPT → SERGIK AI**: Natural language commands via OpenAPI
- **CLI → SERGIK AI**: Command-line interface for generation

## SERGIK Style Profile & DNA

Based on comprehensive analysis of 1,895 tracks (1,167 SERGIK + 728 influences):

### BPM Profile (Dual-Zone Producer)
- **Downtempo/Hip-Hop Zone**: 80-90 BPM (41% of catalog)
- **House/Tech Zone**: 120-129 BPM (32% of catalog)
- **Average BPM**: 107.6
- **Sweet Spot**: 120-127 BPM for tech-house

### Key Preferences (Camelot Notation)
- **Primary**: 10B (D major) - 31%
- **Secondary**: 11B (A major) - 21%
- **Minor Zone**: 7A (D minor) - 13%, 8A (A minor) - 12%
- **Harmonic Palette**: Centered around D/A major and minor

### Energy Profile
- **Sweet Spot**: Level 5-7 (91% of tracks)
- **Average Energy**: 6/10
- **Style**: Mid-energy groove focus, not peak-time bangers
- **Production Guidelines**:
  - Level 6 for standard releases
  - Level 7+ for club/festival tracks
  - Level 5 for lo-fi/chill releases

### Genre DNA
- **Hip-Hop Foundation**: 42%
- **Funk Influence**: 17%
- **House Energy**: 8%
- **Soul Textures**: 7%
- **Other**: 26%

### Intelligence Profile (Based on 1,895 tracks)

**Emotional Signature:**
- **Primary Emotion:** Groovy (70% of tracks) - Funky, rhythmic, danceable
- **Average Valence:** 0.76 (consistently positive)
- **Average Arousal:** 0.57 (moderately energetic)
- **Top Emotions:** Funky, rhythmic, danceable, relaxed, laid-back

**Psychological Signature:**
- **Primary Effects:** Social (51%), Background (21%), Productivity (19%)
- **Average Focus:** 0.50 (balanced)
- **Average Relaxation:** 0.63 (moderately relaxing)
- **Average Motivation:** 0.53 (moderately motivating)

**Sonic Signature:**
- **Timbre:** Neutral (98%) - Balanced tonal character
- **Texture:** Balanced (98%) - Well-balanced harmonic/percussive mix
- **Spatial:** Focused (99%) - Centered, controlled stereo image
- **Dynamics:** Dynamic (99%) - Good energy variation

**Intent Signature:**
- **Primary Intents:** Creative (31%), Chill (27%), Dance Floor (25%)
- **Top Use Cases:** Studio/production, home/study, club/festival, social settings

### Production Characteristics
- **Groove-First Philosophy**: Rhythm drives composition decisions
- **Multi-Layer Melodic Architecture**: 3+ melodic layers with spectral separation
- **Spectral Separation Processing**: Heavy use of Multiband Dynamics
- **Gate-Tight Transients**: Clean transient control per stem
- **Send/Return as Compositional Elements**: Reverb and delay as instruments
- **Stem-Ready Architecture**: All productions exportable as individual stems

## Project Structure

```
sergik_custom_gpt/
├── sergik_cli.py                 # Main CLI tool
├── run_server.py                 # Start API server
├── requirements.txt              # Python dependencies
├── README.md                     # This file
│
├── sergik_ml/                    # Core ML/AI modules
│   ├── serving/
│   │   ├── api.py               # FastAPI server (main API)
│   │   ├── dashboard.py         # Web dashboard
│   │   └── rate_limiter.py      # Rate limiting
│   ├── generators/
│   │   ├── drum_generator.py   # 12+ drum genres
│   │   └── midi_advanced.py    # Chords, bass, arps
│   ├── models/
│   │   ├── intent.py            # Intent classification
│   │   ├── preference.py        # Preference learning
│   │   ├── rerank.py            # Result reranking
│   │   └── contextual_bandits.py # Contextual recommendations
│   ├── pipelines/
│   │   ├── audio_analysis.py    # BPM/key/energy detection
│   │   ├── voice_pipeline.py   # STT/TTS integration
│   │   └── stem_separation.py  # Stem separation
│   ├── connectors/
│   │   ├── ableton_osc.py      # OSC communication
│   │   └── cloud_storage.py     # Cloud sync
│   ├── stores/
│   │   ├── vector_store.py     # Vector similarity
│   │   └── sql_store.py        # SQL database
│   └── features/
│       ├── audio_features.py    # Audio feature extraction
│       └── text_embeddings.py   # Text embeddings
│
├── gpt_actions/                  # GPT integration
│   ├── ableton_bridge_server.py  # HTTP/REST bridge
│   ├── sergik_gpt_openapi.yaml   # Full API schema
│   ├── replicate_openapi.yaml    # Replicate API schema
│   └── ableton_openapi.yaml      # Ableton bridge schema
│
├── maxforlive/                   # Max for Live devices
│   ├── SERGIK_AI_Controller.js  # Main controller (full integration)
│   ├── SERGIK_AI_Device_Guide.md # Complete device guide
│   ├── SERGIK_AI_Controller_Preview.html # Device preview
│   ├── SERGIK_AI_Editor.maxpat  # Editor patch
│   ├── SERGIK_AI_Simple.maxpat   # Simple patch
│   └── SERGIK_OSC_Receiver.amxd.js # Legacy OSC receiver
│
├── knowledge/                    # GPT knowledge base
│   ├── 00_overview.md            # Catalog overview
│   ├── 01_style_signature.md    # Production style
│   ├── 02_quality_standards.md   # Quality tiers
│   ├── 03_workflow_templates.md  # Workflow patterns
│   ├── 04_dataset_extraction_spec.md # Dataset specs
│   ├── 05_musical_dna.md         # DNA profile
│   └── 06_system_architecture.md # System architecture
│
├── scripts/                      # Data processing
│   ├── scan_audio.py            # Audio file scanning
│   ├── scan_projects.py         # Ableton project scanning
│   ├── scan_itunes_library.py   # iTunes library import
│   ├── analyze_bpm_all.py       # BPM analysis
│   ├── analyze_full_library.py  # Full library analysis
│   ├── refine_dna_from_exports.py # DNA refinement with MusicBrainz
│   ├── rekordbox_analyzer.py    # Rekordbox analysis
│   ├── build_knowledge_chunks.py # Knowledge chunking
│   ├── build_finetune_jsonl.py  # Fine-tune dataset
│   ├── ableton_metadata_parser.py # ALS file parsing
│   ├── osc_bridge.py            # OSC bridge server
│   └── sync_cloud.py            # Cloud synchronization
│
├── data/                         # Training data & analysis
│   ├── manifests/                # Analysis results
│   │   ├── sergik_master_profile.json # Master profile
│   │   ├── sergik_dna_refined.json    # Refined DNA
│   │   ├── exports_dna_analysis.csv    # Track analysis
│   │   ├── exports_dna_statistics.json # Statistics
│   │   ├── GENRE_MAPPING_REFERENCE.md  # Genre mapping
│   │   └── DNA_ANALYSIS_README.md      # DNA analysis guide
│   ├── catalog/                  # Catalog data
│   │   ├── ableton_projects/    # Project metadata
│   │   ├── exports/              # Export metadata
│   │   └── itunes_library/       # iTunes data
│   ├── analysis/                 # Analysis results
│   │   ├── bpm_key/              # BPM/key analysis
│   │   ├── collaborators/        # Collaborator rankings
│   │   └── timeline/             # Timeline analysis
│   ├── chunks/                   # Knowledge chunks
│   ├── finetune/                 # Fine-tuning data
│   └── profiles/                 # Artist profiles
│
└── gpt_config/                   # GPT configuration
    ├── gpt_config.json           # GPT config
    ├── system_instructions.md    # System instructions
    └── system_prompt.txt         # System prompt
```

## GPT Integration Quick Start

### Option 1: Custom GPT Actions (Recommended)

1. **Start API Server**:
   ```bash
   python -m sergik_ml.serving.api
   ```

2. **Expose via ngrok** (for remote access):
   ```bash
   ngrok http 8000
   ```

3. **Import OpenAPI Schema**:
   - Go to Custom GPT → Actions → Add Action
   - Import `gpt_actions/sergik_gpt_openapi.yaml`
   - Set authentication if needed

4. **Upload Knowledge Base**:
   - Upload all files from `knowledge/` directory
   - Upload `gpt_config/system_instructions.md`

### Option 2: Fine-Tuning

1. **Prepare Data**:
   ```bash
   python scripts/scan_audio.py
   python scripts/scan_projects.py
   python scripts/build_knowledge_chunks.py
   python scripts/build_finetune_jsonl.py
   ```

2. **Upload to Custom GPT**:
   - Upload `knowledge/*.md` files
   - Optional: Fine-tune with `data/finetune/sergik_finetune.jsonl`

## DNA Analysis & Refinement

### Run DNA Analysis

```bash
# Analyze tracks with MusicBrainz integration
python scripts/refine_dna_from_exports.py [directory_path]

# Options:
# --max-files N    Limit to first N files
# --skip-analysis  Use existing CSV data
```

### Output Files

- `data/manifests/exports_dna_analysis.csv` - Detailed track analysis
- `data/manifests/exports_dna_statistics.json` - Statistical summary
- `data/manifests/sergik_dna_refined.json` - Refined DNA profile
- `data/profiles/master_profile.json` - Updated master profile

### MusicBrainz Setup

1. **Install packages**:
   ```bash
   pip install musicbrainzngs pyacoustid
   ```

2. **Get AcoustID API key** (optional but recommended):
   - Visit: https://acoustid.org/api-key
   - Set: `export ACOUSTID_API_KEY="your_key"`

See `data/manifests/DNA_ANALYSIS_README.md` for complete guide.

## API Endpoints

### Main Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| **Ableton Control** | `POST /live/tracks/create` | Create track |
| | `POST /live/devices/load` | Load device |
| | `POST /live/clips/fire` | Fire clip |
| | `POST /live/session/tempo` | Set tempo |
| | `POST /live/command` | Natural language command |
| **Generation** | `POST /gpt/generate` | Natural language MIDI |
| | `POST /gpt/drums` | Natural language drums |
| | `POST /drums/generate` | Generate drum pattern |
| | `POST /generate/chord_progression` | Generate chords |
| | `POST /generate/walking_bass` | Generate bass |
| **Analysis** | `POST /gpt/analyze` | DNA analysis |
| | `GET /gpt/catalog/search` | Search catalog |

Full API documentation: `http://127.0.0.1:8000/docs`

## Supported Drum Genres

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

## Example Usage

### Natural Language Commands (via GPT or API)

**Ableton Control**:
```
"Create a new MIDI track called 'Lead Synth'"
"Add Wavetable to track 2"
"Set tempo to 128 BPM"
"Mute tracks 3 and 4"
"Fire scene 4"
```

**MIDI Generation**:
```
"Generate a tech house chord progression in 10B with stab voicing"
"Create a walking bass line in D minor, house style, 8 bars"
"Make a trap drum pattern at 140 BPM with hi-hat rolls"
```

**Analysis**:
```
"Analyze my current track and suggest improvements"
"Search my library for '808 kick' samples"
"Compare this track to my DNA profile"
```

## Additional Resources

- **Max for Live Device Guide**: `maxforlive/SERGIK_AI_Device_Guide.md`
- **DNA Analysis Guide**: `data/manifests/DNA_ANALYSIS_README.md`
- **Genre Mapping Reference**: `data/manifests/GENRE_MAPPING_REFERENCE.md`
- **System Architecture**: `knowledge/06_system_architecture.md`
- **GPT Actions Guide**: `gpt_actions/README.md`

## Development

### Running Tests

```bash
python -m pytest tests/
```

### Adding New Features

1. **Feature Extraction**: Extend `sergik_ml/features/audio_features.py`
2. **MIDI Generation**: Add patterns to `sergik_ml/generators/midi_advanced.py`
3. **API Endpoints**: Add routes to `sergik_ml/serving/api.py`
4. **OSC Handlers**: Extend `scripts/osc_bridge.py`

### Dataset Updates

```bash
# Parse new Ableton projects
python scripts/ableton_metadata_parser.py ~/Music/Ableton\ Projects

# Sync and version
python scripts/sync_cloud.py --push

# Rebuild finetune data
python scripts/build_finetune_jsonl.py
```

## License

MIT License - Use freely for music production.

## Credits

- **SERGIK (Jordan Caboga)** - Production style, training data, and proprietary AI algorithms
- **MusicBrainz** - Metadata and genre data
- **AcoustID** - Audio fingerprinting
