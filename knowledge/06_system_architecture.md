# 🎛️ SERGIK AI — System Architecture

**Version:** 1.0  
**Author:** Sergik AI  
**Last Updated:** December 2024

A unified blueprint connecting creative production (Ableton Live) with dataset engineering, AI finetuning, and cloud-based evolution.

---

## 🌐 Overview

SERGIK AI is a **cybernetic studio assistant** — a living music–AI ecosystem where every creative action can be captured, analyzed, transformed, and evolved through data.

It operates across three interconnected layers:

| Layer | Focus | Description |
|-------|--------|-------------|
| **🎨 Creative Layer** | Sound creation and musical expression | Ableton Live sessions, MIDI data, audio stems, automation, and tempo — forming the artistic source of truth |
| **⚙️ Technical Layer** | Dataset generation and processing | Python-based data pipelines, feature extraction, and metadata builders aligned to SERGIK dataset standards |
| **🔗 Integration Layer** | Automation, model orchestration, and cloud connectivity | Real-time DAW–AI interaction (OSC bridge), dataset versioning, GitHub/S3 sync, and model prep for finetuning |

These three layers communicate through a **feedback architecture** that captures, learns from, and enhances your sonic identity.

---

## 🧩 System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎵 ABLETON LIVE (.als)                       │
│                    Creative Source of Truth                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              🎚️ OSC BRIDGE (osc_bridge.py)                      │
│              Real-time session data capture                      │
│              • Tempo sync  • Transport state  • Parameters       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         🧠 ABLETON METADATA PARSER (ableton_metadata_parser.py) │
│         Extract: BPM, clips, devices, samples, plugins          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              🎧 DATASETS (data/catalog/, data/manifests/)       │
│              • tracks.csv  • projects_als.csv  • exports.csv    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          🧪 FEATURE EXTRACTION (sergik_ml/features/)            │
│          Audio analysis: BPM, key, energy, MFCCs, chroma        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          📊 DATASET BUILDER (scripts/build_*.py)                │
│          Schema merge + metadata alignment + JSONL export       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          🌐 SYNC & VERSIONING (sync_cloud.py)                   │
│          • SHA-256 checksums  • Git push  • S3 upload           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          🤖 AI MODEL TRAINING (future)                          │
│          Finetuning pipeline → Personalized co-producer         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          🔄 FEEDBACK LOOP                                        │
│          AI-generated MIDI → OSC → Back to Ableton Live         │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Core Components

### 1. 🎧 Audio Feature Extraction
**Location:** `sergik_ml/features/audio_features.py`

Uses `librosa` and `pyloudnorm` to extract:
- Tempo (BPM) with beat tracking
- Energy (RMS) and dynamics
- Brightness (spectral centroid)
- LUFS loudness measurement
- Harmonic/Percussive ratio
- Key estimation via chroma analysis
- MFCCs for timbral fingerprinting

```python
from sergik_ml.features.audio_features import extract_full_features

features = extract_full_features("my_track.wav")
# Returns: bpm, energy, key, mfcc_mean, chroma_profile, etc.
```

### 2. 🎹 Advanced MIDI Generation
**Location:** `sergik_ml/generators/midi_advanced.py`

Intelligent MIDI generation with harmonic awareness:
- **Chord Progressions:** House, techno, jazz, modal patterns
- **Walking Bass:** Jazz, house, techno styles
- **Arpeggios:** Up, down, random, pingpong patterns
- **Drum Variations:** From seed patterns
- **Humanization:** Timing and velocity variance

```python
from sergik_ml.generators.midi_advanced import generate_chord_progression

notes = generate_chord_progression(
    key="10B",           # Camelot key
    progression_type="i-VI-III-VII",
    bars=8,
    voicing="stabs",
    tempo=125
)
```

### 3. 🧠 Ableton Metadata Parser
**Location:** `scripts/ableton_metadata_parser.py`

Parses `.als` project files (gzipped XML) to extract:
- Project tempo and time signature
- Track names, types, and colors
- Device chains and plugin lists
- Clip names and lengths
- Sample file references

```bash
python scripts/ableton_metadata_parser.py ~/Music/Ableton\ Projects
# Outputs: data/catalog/projects_als.csv
```

### 4. 🎚️ OSC Bridge
**Location:** `scripts/osc_bridge.py`

Real-time bidirectional communication with Ableton Live:
- Captures tempo, transport, and parameter changes
- Forwards requests to SERGIK ML API
- Sends generated MIDI back to Max for Live

```bash
python scripts/osc_bridge.py --port 9000 --api-url http://localhost:8000
```

**OSC Address Map:**
| Address | Description |
|---------|-------------|
| `/sergik/test` | Handshake verification |
| `/ableton/tempo` | Tempo changes |
| `/ableton/transport` | Play/stop/record state |
| `/ableton/track/*` | Track parameters |
| `/sergik/generate` | Trigger MIDI generation |
| `/sergik/action` | Execute AI actions |

### 5. 📡 Cloud Sync & Versioning
**Location:** `scripts/sync_cloud.py`

Dataset lifecycle management:
- SHA-256 checksum verification
- Version manifest generation (`dataset_versions.json`)
- Git commit and push automation
- AWS S3 upload with incremental sync

```bash
python scripts/sync_cloud.py --push --s3    # Full sync
python scripts/sync_cloud.py --verify       # Verify integrity
```

### 6. 🌐 REST API Server
**Location:** `sergik_ml/serving/api.py`

FastAPI server providing:
- GPT Actions for natural language control
- MIDI generation endpoints
- Catalog search
- Track analysis with SERGIK DNA comparison

```bash
python -m sergik_ml.serving.api    # Start on port 8000
```

**Key Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/gpt/generate` | POST | Natural language MIDI generation |
| `/gpt/analyze` | POST | SERGIK DNA track analysis |
| `/gpt/catalog/search` | GET | Search project catalog |
| `/generate/chord_progression` | POST | Direct chord generation |
| `/generate/walking_bass` | POST | Bass line generation |
| `/transform/humanize` | POST | Humanize MIDI notes |

### 7. ✅ System Verification
**Location:** `scripts/verify_install.py`

Comprehensive installation checker:
- Python environment validation
- Dependency verification
- Project structure check
- Audio feature extraction test
- MIDI generation test
- OSC connection test
- API server test

```bash
python scripts/verify_install.py
```

---

## 🧬 Data Schema

### Core Dataset Files

| File | Purpose | Key Fields |
|------|----------|------------|
| `data/manifests/tracks.csv` | Track-level manifest | `track_id`, `filename`, `bpm`, `key`, `mood` |
| `data/catalog/ableton_projects/all_projects.csv` | Ableton project index | `project_name`, `year`, `collaborator` |
| `data/catalog/exports/all_exports.csv` | Exported tracks | `path`, `format`, `bit_depth`, `sample_rate` |
| `data/analysis/bpm_key/analyzed_tracks.csv` | Audio analysis results | `bpm`, `key`, `energy`, `lufs` |
| `data/dataset_versions.json` | Version manifest | `version`, `timestamp`, `files`, `checksums` |

### SERGIK DNA Profile

Located in `data/profiles/master_profile.json`:

```json
{
  "bpm_zones": {
    "80-99": 0.41,
    "100-119": 0.21,
    "120-129": 0.32,
    "130-139": 0.04
  },
  "key_preferences": {
    "10B": 0.31,
    "11B": 0.21,
    "7A": 0.13,
    "8A": 0.12
  },
  "energy_sweet_spot": [5.0, 7.0],
  "genre_dna": {
    "hip-hop": 0.42,
    "funk": 0.17,
    "house": 0.08,
    "soul": 0.07
  }
}
```

---

## 🧠 System Intelligence Flow

```
1. CAPTURE   → Ableton Live exports project data and stems
                                ↓
2. ANALYZE   → Python scripts extract features and structure metadata
                                ↓
3. INTEGRATE → Builder merges and normalizes data for ML readiness
                                ↓
4. EVOLVE    → Datasets are versioned and synced to the cloud
                                ↓
5. LEARN     → AI models finetune on updated datasets
                                ↓
6. REAPPLY   → Models output MIDI/audio or automate DAW parameters
                                ↓
7. FEEDBACK  → New creations are analyzed, closing the creative loop
```

---

## 🚀 Strategic Roadmap

### Phase 1: Foundation (Current) ✅
- Solidified SERGIK dataset standard
- Feature extraction pipelines
- JSONL finetune templates
- **Status:** Stable local pipelines representing your sound

### Phase 2: Autonomy (6-12 months)
- Automatic ingestion from new Ableton projects
- Change tracking and dataset diff tools
- Self-updating dataset intelligence
- **Outcome:** Dataset evolves in real-time as you produce

### Phase 3: Real-Time Integration (12-18 months)
- OSC/MIDI-driven adaptive models
- Feedback loops ("AI mixer assistant")
- Live parameter suggestions
- **Outcome:** SERGIK acts as an active, listening collaborator

### Phase 4: Creative AI (18-30 months)
- User-specific generative models
- MIDI/audio/automation pattern generation
- Personalized suggestions in your sonic language
- **Outcome:** AI co-producer with your unique voice

### Phase 5: Cloud-Linked Evolution (30+ months)
- Multi-user knowledge graph
- Collaborative dataset merging
- Creative lineage tracking
- **Outcome:** Distributed creative network with collective intelligence

---

## 🔧 Development Workflow

### Quick Start

```bash
# 1. Verify installation
python scripts/verify_install.py

# 2. Start OSC bridge (terminal 1)
python scripts/osc_bridge.py

# 3. Start API server (terminal 2)
python -m sergik_ml.serving.api

# 4. Open Ableton Live with Max for Live OSC device

# 5. Use Cursor chat for natural language development
```

### Adding New Features

1. **Feature Extraction:** Extend `sergik_ml/features/audio_features.py`
2. **MIDI Generation:** Add patterns to `sergik_ml/generators/midi_advanced.py`
3. **API Endpoints:** Add routes to `sergik_ml/serving/api.py`
4. **OSC Handlers:** Extend `scripts/osc_bridge.py`

### Dataset Updates

```bash
# Parse new Ableton projects
python scripts/ableton_metadata_parser.py ~/Music/Ableton\ Projects

# Sync and version
python scripts/sync_cloud.py --push

# Rebuild finetune data
python scripts/build_finetune_jsonl.py
```

---

## 🔌 Integration Points

### Ableton Live → SERGIK AI

1. **Max for Live Device:** Sends OSC messages to bridge
2. **Project Export:** `.als` files parsed for metadata
3. **Audio Export:** WAV files analyzed for features

### SERGIK AI → Ableton Live

1. **OSC Commands:** Transport control, tempo, parameters
2. **MIDI Generation:** Notes sent via OSC to M4L device
3. **Suggestions:** Displayed in M4L UI or Live's browser

### Custom GPT Integration

Import `gpt_actions/sergik_gpt_openapi.yaml` for:
- Natural language MIDI generation
- Catalog search
- Track analysis with DNA comparison
- Production suggestions

---

## 📊 Capability Matrix

| Layer | Domain | Current | Near-Term | Long-Term |
|-------|--------|---------|-----------|-----------|
| **Technical** | Dataset | SERGIK-standard schemas | Auto-versioning | Autonomous curation |
| | Features | Librosa extraction | Perceptual metrics | Adaptive embeddings |
| | Code | Modular Python | Config generation | Self-adapting pipelines |
| | ML | JSONL formatting | Embedding extractors | End-to-end training |
| **Creative** | DAW | OSC bridge, metadata | Real-time modulation | Bi-directional AI loop |
| | Metadata | Structured attributes | LLM-generated tags | Sonic DNA graph |
| | Generation | MIDI patterns | Arrangement suggestions | Composition partner |
| **Integration** | Tools | Python, OSC, APIs | Database management | Distributed systems |
| | Multi-modal | Audio + text | Visual/mood embeddings | Multi-modal synthesis |
| | Collaboration | Local assistant | Remote sharing | Co-learning network |

---

## 💡 Key Insights

### SERGIK Production DNA

Based on 20,000+ projects and 600+ finished tracks:

- **Dual BPM Zones:** 80-90 (hip-hop) and 120-129 (house)
- **Key Centers:** D major (10B) and A major (11B) dominate
- **Energy Sweet Spot:** Level 5-7 (groove over intensity)
- **Genre Fusion:** Hip-hop foundation + funk + house + soul

### Design Principles

1. **Every sound teaches the system** — Continuous learning from production
2. **Data-driven creativity** — Decisions informed by catalog analysis
3. **Bidirectional flow** — AI assists production, production improves AI
4. **Version everything** — Full reproducibility and evolution tracking

---

## 🎧 Summary

SERGIK AI is not just an assistant — it's an **evolving production ecosystem builder**.

It merges music production, data science, and machine learning into one coherent pipeline:

- ✅ **Capture** your artistic process as data
- ✅ **Build** finetune-ready datasets
- ✅ **Automate** technical workflows
- ✅ **Develop** creative–technical feedback loops

> *"Every sound you make teaches the system who you are."*  
> — SERGIK AI

---

## 📚 Related Documentation

- `00_overview.md` — Artist identity and catalog statistics
- `01_style_signature.md` — Production style parameters
- `02_quality_standards.md` — Audio quality tiers and mixing standards
- `03_workflow_templates.md` — Production workflow patterns
- `04_dataset_extraction_spec.md` — Dataset schema specification
- `05_musical_dna.md` — Harmonic and rhythmic preferences

---

*SERGIK AI — Powered by comprehensive catalog analysis and production data*

