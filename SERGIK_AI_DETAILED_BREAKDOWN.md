# SERGIK AI - Detailed Technical Breakdown

**Version:** 1.0  
**Last Updated:** January 2025

A comprehensive technical overview of the SERGIK AI music production ecosystem.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Components](#core-components)
3. [Data Flow & Pipelines](#data-flow--pipelines)
4. [API & Endpoints](#api--endpoints)
5. [ML Models & Intelligence](#ml-models--intelligence)
6. [DNA Analysis System](#dna-analysis-system)
7. [Integration Points](#integration-points)
8. [Workflow Patterns](#workflow-patterns)

---

## System Architecture

### Three-Layer Architecture

SERGIK AI operates across three interconnected layers:

#### 🎨 Creative Layer
**Purpose:** Sound creation and musical expression

**Components:**
- Ableton Live sessions (.als files)
- MIDI data and patterns
- Audio stems and exports
- Automation curves
- Tempo and time signatures

**Data Sources:**
- 20,503 Ableton project files
- 721 finished track exports
- 1,895 iTunes library tracks
- 350+ GB of audio data

#### ⚙️ Technical Layer
**Purpose:** Dataset generation and processing

**Components:**
- Python-based data pipelines
- Feature extraction engines
- Metadata builders
- Schema normalization
- JSONL dataset generation

**Key Scripts:**
- `scripts/ableton_metadata_parser.py` - Parse .als files
- `scripts/scan_audio.py` - Audio file analysis
- `scripts/refine_dna_from_exports.py` - DNA refinement
- `scripts/build_finetune_jsonl.py` - Training data prep

#### 🔗 Integration Layer
**Purpose:** Automation, orchestration, and connectivity

**Components:**
- Real-time DAW-AI interaction (OSC bridge)
- Dataset versioning
- Cloud sync (GitHub/S3)
- Model preparation for finetuning
- API server (FastAPI)

**Key Services:**
- `sergik_ml/serving/api.py` - Main API server
- `scripts/osc_bridge.py` - OSC communication
- `scripts/sync_cloud.py` - Cloud synchronization

---

## Core Components

### 1. Audio Feature Extraction (`sergik_ml/features/audio_features.py`)

**Purpose:** Extract musical and technical features from audio files

**Capabilities:**
- **Tempo Detection**: Autocorrelation-based BPM detection (20-300 BPM)
- **Key Detection**: Chroma-based analysis → Camelot notation
- **Energy Analysis**: RMS-based energy level (1-10 scale)
- **Spectral Features**: 
  - Spectral centroid (brightness)
  - Spectral rolloff
  - Rhythm complexity
- **Loudness**: LUFS measurement (EBU R128)
- **Harmonic/Percussive Separation**: Ratio analysis
- **MFCCs**: Timbral fingerprinting (13 coefficients)
- **Stereo Width**: Spatial analysis

**Output Schema:**
```python
{
    "bpm": float,
    "key": str,  # Camelot (e.g., "10B")
    "key_notation": str,  # Musical (e.g., "D major")
    "energy": int,  # 1-10
    "duration": float,
    "sample_rate": int,
    "spectral_centroid": float,
    "spectral_rolloff": float,
    "rhythm_complexity": float,
    "loudness_db": float,
    "harmonic_ratio": float,
    "percussive_ratio": float,
    "stereo_width": float
}
```

### 2. MIDI Generation (`sergik_ml/generators/`)

#### 2.1 Advanced MIDI (`midi_advanced.py`)

**Chord Progressions:**
- House, techno, jazz, modal patterns
- Multiple voicings (stabs, pads)
- Seventh chord support
- Custom progressions (e.g., "i-VI-III-VII")
- Camelot key-aware

**Walking Bass:**
- Jazz, house, techno styles
- Chord progression-aware
- Syncopation patterns
- Groove-first approach

**Arpeggios:**
- Patterns: up, down, updown, random, pingpong
- Multi-octave support (1-4 octaves)
- Configurable speed (beats per note)
- Harmonic progression-aware

**Drum Variations:**
- Seed pattern-based generation
- Multiple variations (1-16)
- Style-aware modifications

**Humanization:**
- Timing variance (0-100ms)
- Velocity variance (0-40)
- Tempo-aware quantization

#### 2.2 Drum Generator (`drum_generator.py`)

**Supported Genres (12+):**
- `house` - Classic 4-on-the-floor (120-130 BPM)
- `tech_house` - Syncopated hats + percs (124-128 BPM)
- `techno` - Minimal, hypnotic (125-140 BPM)
- `hiphop` / `boom_bap` - Classic boom bap (85-100 BPM)
- `trap` - 808s + hi-hat rolls (130-150 BPM)
- `dnb` / `jungle` - Fast breakbeats (170-180 BPM)
- `reggaeton` / `dembow` - Dembow rhythm (90-100 BPM)
- `ambient` / `downtempo` - Sparse, atmospheric (70-90 BPM)
- `lo_fi` - Lo-fi hip-hop (75-90 BPM)

**Features:**
- MIDI pattern generation
- Audio rendering (WAV output)
- Swing control (0-100%)
- Humanization (0-100%)
- Density control (0.1-2.0x)
- Sample library integration

### 3. DNA Analysis System (`sergik_ml/pipelines/audio_analysis.py`)

**Purpose:** Compare tracks against SERGIK's production DNA

**Analysis Components:**

1. **Audio Metadata Extraction**
   - BPM, key, energy, duration
   - Spectral features
   - Rhythm complexity

2. **MusicBrainz Integration**
   - AcoustID fingerprinting
   - Text search fallback
   - Genre extraction
   - Metadata enrichment (artist, title, releases, tags)

3. **SERGIK DNA Matching**
   - BPM zone matching (80-90, 120-129)
   - Key preference matching (10B, 11B, 7A, 8A)
   - Energy profile matching (Level 5-7 sweet spot)
   - Genre DNA alignment (Hip-Hop 42%, Funk 17%, House 8%, Soul 7%)

4. **Genre Influence Analysis**
   - MusicBrainz genre mapping
   - SERGIK genre alignment
   - Influence score calculation
   - Primary influence identification

**Output:**
```python
{
    "overall_match": int,  # 0-100
    "scores": {
        "bpm": int,
        "key": int,
        "energy": int
    },
    "genre_fit": str,
    "suggestions": List[str],
    "compatible_collaborators": List[str]
}
```

### 4. Vector Store (`sergik_ml/stores/vector_store.py`)

**Purpose:** Similarity search and recommendation

**Capabilities:**
- Track similarity search
- Feature vector embeddings
- K-nearest neighbors (KNN)
- Style filtering
- Distance metrics (cosine, euclidean)

**Use Cases:**
- Find similar tracks in catalog
- Recommend tracks for playlists
- Style-based filtering
- Collaborative filtering

### 5. SQL Store (`sergik_ml/stores/sql_store.py`)

**Purpose:** Structured data persistence

**Schema:**
- Track metadata
- Action logging
- Preference ratings
- Pack manifests
- Emotion events

**Features:**
- SQLite database (`sergik_ml.db`)
- Action history tracking
- Rating system (1-5 stars)
- Context-aware logging

### 6. Voice Pipeline (`sergik_ml/pipelines/voice_pipeline.py`)

**Purpose:** Voice control and STT/TTS integration

**Capabilities:**
- Speech-to-text (STT)
- Text-to-speech (TTS)
- Intent parsing
- Action dispatch
- Push-to-talk support

**Flow:**
```
Voice Input → STT → Intent Parsing → Action Dispatch → TTS Response → Ableton Notification
```

### 7. Intent Model (`sergik_ml/models/intent.py`)

**Purpose:** Natural language command parsing

**Capabilities:**
- Command classification
- Argument extraction
- Confidence scoring
- Context awareness

**Supported Intents:**
- Generation commands
- Ableton control
- Analysis requests
- Search queries

### 8. Preference Model (`sergik_ml/models/preference.py`)

**Purpose:** Learn from user ratings

**Features:**
- Rating-based learning (1-5 stars)
- Feature importance analysis
- Context-aware recommendations
- Collaborative filtering

**Training Data:**
- Track ratings
- Feature vectors
- Context metadata
- Timestamp tracking

### 9. Contextual Bandits (`sergik_ml/models/contextual_bandits.py`)

**Purpose:** Context-aware recommendations

**Features:**
- Multi-armed bandit algorithm
- Context feature encoding
- Exploration vs exploitation
- Real-time adaptation

---

## Data Flow & Pipelines

### 1. Audio Analysis Pipeline

```
Audio File
    ↓
[Audio Feature Extraction]
    ├─→ BPM Detection
    ├─→ Key Detection (Camelot)
    ├─→ Energy Analysis
    ├─→ Spectral Features
    └─→ Metadata Extraction
    ↓
[MusicBrainz Lookup]
    ├─→ AcoustID Fingerprinting
    ├─→ Text Search Fallback
    ├─→ Genre Extraction
    └─→ Metadata Enrichment
    ↓
[SERGIK DNA Matching]
    ├─→ BPM Zone Matching
    ├─→ Key Preference Matching
    ├─→ Energy Profile Matching
    └─→ Genre DNA Alignment
    ↓
[Analysis Result]
    ├─→ Audio Metadata
    ├─→ MusicBrainz Data
    ├─→ SERGIK DNA Match
    └─→ Genre Influence
```

### 2. MIDI Generation Pipeline

```
User Request (Natural Language or API)
    ↓
[Intent Parsing]
    ├─→ Command Classification
    ├─→ Parameter Extraction
    └─→ Context Analysis
    ↓
[MIDI Generation]
    ├─→ Chord Progression
    ├─→ Walking Bass
    ├─→ Arpeggios
    └─→ Drum Patterns
    ↓
[Humanization (Optional)]
    ├─→ Timing Variance
    ├─→ Velocity Variance
    └─→ Groove Quantization
    ↓
[Output]
    ├─→ MIDI File
    ├─→ OSC to Ableton
    └─→ Clip Insertion
```

### 3. Dataset Building Pipeline

```
Ableton Projects (.als files)
    ↓
[Metadata Parser]
    ├─→ Project Info
    ├─→ Track Data
    ├─→ Device Chains
    └─→ Clip Information
    ↓
[Audio Analysis]
    ├─→ Feature Extraction
    └─→ DNA Analysis
    ↓
[Schema Normalization]
    ├─→ Data Merging
    ├─→ Format Standardization
    └─→ Validation
    ↓
[JSONL Export]
    ├─→ Training Data
    ├─→ Knowledge Chunks
    └─→ Fine-tune Dataset
    ↓
[Versioning & Sync]
    ├─→ SHA-256 Checksums
    ├─→ Git Commit
    └─→ Cloud Upload
```

---

## API & Endpoints

### FastAPI Server (`sergik_ml/serving/api.py`)

**Base URL:** `http://127.0.0.1:8000`

**Documentation:** `http://127.0.0.1:8000/docs`

### Endpoint Categories

#### 1. Health & Status
- `GET /health` - Health check
- `GET /gpt/health` - GPT integration health

#### 2. MIDI Generation
- `POST /generate/chord_progression` - Generate chords
- `POST /generate/walking_bass` - Generate bass line
- `POST /generate/arpeggios` - Generate arpeggios
- `POST /transform/humanize` - Humanize MIDI

#### 3. Drum Generation
- `POST /drums/generate` - Generate drum pattern (MIDI)
- `POST /drums/generate/audio` - Generate drum audio (WAV)
- `GET /drums/genres` - List available genres

#### 4. Natural Language (GPT Actions)
- `POST /gpt/generate` - Natural language MIDI generation
- `POST /gpt/drums` - Natural language drum generation
- `POST /gpt/analyze` - SERGIK DNA analysis
- `GET /gpt/catalog/search` - Search project catalog

#### 5. Audio Analysis
- `POST /analyze/audio` - Analyze audio file
- `POST /analyze/url` - Analyze from URL
- `POST /analyze/path` - Analyze local file

#### 6. Ableton Live Control

**Track Management:**
- `POST /live/tracks/create` - Create track
- `PATCH /live/tracks/{index}` - Update track
- `DELETE /live/tracks/{index}` - Delete track
- `GET /live/tracks` - List tracks
- `GET /live/tracks/{index}` - Get track info

**Device Control:**
- `POST /live/devices/load` - Load device
- `POST /live/devices/load_vst` - Load VST/AU
- `PATCH /live/devices/param` - Set parameter
- `GET /live/devices/{track}` - List devices
- `POST /live/devices/toggle` - Toggle device

**Clip Management:**
- `POST /live/clips/create` - Create clip
- `POST /live/clips/fire` - Fire clip
- `POST /live/clips/stop` - Stop clip
- `POST /live/clips/duplicate` - Duplicate clip
- `POST /live/clips/notes` - Set MIDI notes
- `GET /live/clips/{track}/{slot}` - Get clip notes

**Browser/Library:**
- `GET /live/browser/search` - Search library
- `POST /live/browser/load` - Load item
- `POST /live/browser/hot_swap` - Hot-swap sample

**Session Control:**
- `POST /live/scenes/fire` - Fire scene
- `POST /live/scenes/create` - Create scene
- `POST /live/session/tempo` - Set tempo
- `GET /live/session/state` - Get session state
- `POST /live/transport/{action}` - Transport control
- `POST /live/command` - Natural language command

**Mixer:**
- `POST /live/mixer/send` - Set send level

#### 7. Voice Interface
- `POST /voice` - Process voice recording
- `POST /action` - Execute action command

#### 8. Catalog & Search
- `GET /tracks` - List tracks
- `GET /tracks/{id}` - Get track details
- `GET /similar/{id}` - Get similar tracks

---

## ML Models & Intelligence

### 1. Intent Classification

**Model:** `sergik_ml/models/intent.py`

**Purpose:** Parse natural language commands

**Capabilities:**
- Command classification
- Parameter extraction
- Confidence scoring
- Context awareness

**Example:**
```
Input: "Generate tech house chords in D minor"
Output: {
    "cmd": "generate_chords",
    "args": {
        "key": "7A",
        "style": "tech_house",
        "voicing": "stabs"
    },
    "confidence": 0.95
}
```

### 2. Preference Learning

**Model:** `sergik_ml/models/preference.py`

**Purpose:** Learn from user ratings

**Features:**
- Rating-based learning (1-5 stars)
- Feature importance analysis
- Context-aware recommendations
- Collaborative filtering

**Training:**
- Track ratings → Feature vectors
- MSE/MAE metrics
- Feature importance weights
- Rating distribution analysis

### 3. Reranking

**Model:** `sergik_ml/models/rerank.py`

**Purpose:** Improve search result relevance

**Features:**
- Multi-factor scoring
- User preference integration
- Context-aware ranking
- Diversity optimization

### 4. Contextual Bandits

**Model:** `sergik_ml/models/contextual_bandits.py`

**Purpose:** Context-aware recommendations

**Algorithm:**
- Multi-armed bandit
- Context feature encoding
- Exploration vs exploitation
- Real-time adaptation

### 5. Smart Intent

**Model:** `sergik_ml/models/smart_intent.py`

**Purpose:** Advanced intent parsing with context

**Features:**
- Multi-turn conversations
- Context memory
- Ambiguity resolution
- Intent chaining

---

## DNA Analysis System

### SERGIK DNA Profile

**Location:** `data/profiles/master_profile.json`

**Components:**

1. **BPM Zones**
   - Downtempo/Hip-Hop: 80-90 BPM (41%)
   - House/Tech: 120-129 BPM (32%)
   - Average: 107.6 BPM

2. **Key Preferences (Camelot)**
   - Primary: 10B (D major) - 31%
   - Secondary: 11B (A major) - 21%
   - Minor: 7A (D minor) - 13%, 8A (A minor) - 12%

3. **Energy Profile**
   - Sweet Spot: Level 5-7 (91% of tracks)
   - Average: 6/10
   - Style: Mid-energy groove focus

4. **Genre DNA**
   - Hip-Hop: 42%
   - Funk: 17%
   - House: 8%
   - Soul: 7%
   - Other: 26%

### DNA Matching Algorithm

**Scoring System:**
1. **BPM Match** (0-100 points)
   - Exact match: 100
   - Within zone: 80
   - Close: 60
   - Far: 20

2. **Key Match** (0-100 points)
   - Exact match: 100
   - Compatible (Camelot): 80
   - Relative: 60
   - Unrelated: 20

3. **Energy Match** (0-100 points)
   - Sweet spot (5-7): 100
   - Close: 80
   - Moderate: 60
   - Far: 20

4. **Genre Match** (0-100 points)
   - Primary genre match: 100
   - Secondary: 80
   - Related: 60
   - Unrelated: 20

**Overall Score:**
```
overall_match = (bpm_score * 0.3) + (key_score * 0.3) + 
                (energy_score * 0.2) + (genre_score * 0.2)
```

### MusicBrainz Integration

**Features:**
- AcoustID fingerprinting
- Text search fallback
- Genre extraction (150+ genre variations)
- Metadata enrichment
- Rate limiting (1 req/sec)

**Genre Mapping:**
- 150+ genre variations → 4 SERGIK categories
- Hip-Hop, House, Funk, Soul
- Comprehensive normalization
- Fallback inference from BPM/energy

---

## Integration Points

### 1. Ableton Live → SERGIK AI

**Methods:**
1. **Max for Live Device**
   - SERGIK AI Controller
   - OSC/HTTP communication
   - Real-time parameter capture

2. **Project Export**
   - .als file parsing
   - Metadata extraction
   - Project structure analysis

3. **Audio Export**
   - WAV file analysis
   - Feature extraction
   - DNA matching

### 2. SERGIK AI → Ableton Live

**Methods:**
1. **OSC Commands**
   - Transport control
   - Tempo setting
   - Parameter modulation

2. **MIDI Generation**
   - Notes via OSC
   - Clip insertion
   - Pattern playback

3. **Suggestions**
   - M4L UI display
   - Browser integration
   - Natural language feedback

### 3. Custom GPT Integration

**OpenAPI Schema:** `gpt_actions/sergik_gpt_openapi.yaml`

**Capabilities:**
- Natural language MIDI generation
- Catalog search
- Track analysis with DNA comparison
- Production suggestions
- Ableton control via chat

**Setup:**
1. Start API server
2. Expose via ngrok (optional)
3. Import OpenAPI schema
4. Configure authentication

### 4. Cloud Sync

**Components:**
- GitHub repository
- AWS S3 storage
- Dataset versioning
- SHA-256 checksums

**Workflow:**
```bash
python scripts/sync_cloud.py --push --s3
```

---

## Workflow Patterns

### 1. Production Workflow

```
1. Start Ableton Live
2. Load SERGIK AI Controller M4L device
3. Start API server: python -m sergik_ml.serving.api
4. Generate MIDI via natural language or API
5. Insert into clips
6. Refine and iterate
7. Export and analyze
8. DNA matching and feedback
```

### 2. Analysis Workflow

```
1. Export track from Ableton
2. Run analysis: POST /analyze/audio
3. Review DNA match score
4. Get production suggestions
5. Identify compatible collaborators
6. Update DNA profile (if needed)
```

### 3. Dataset Building Workflow

```
1. Scan Ableton projects: python scripts/ableton_metadata_parser.py
2. Analyze audio: python scripts/scan_audio.py
3. Refine DNA: python scripts/refine_dna_from_exports.py
4. Build knowledge chunks: python scripts/build_knowledge_chunks.py
5. Create finetune data: python scripts/build_finetune_jsonl.py
6. Sync to cloud: python scripts/sync_cloud.py --push
```

### 4. GPT Integration Workflow

```
1. Start API server
2. Expose via ngrok (for remote access)
3. Import OpenAPI schema to Custom GPT
4. Upload knowledge base files
5. Test natural language commands
6. Iterate on prompts and responses
```

---

## Key Statistics

### Catalog
- **Ableton Projects:** 20,503
- **Finished Exports:** 721
- **Exported Tracks (Unique):** 746
- **iTunes Library:** 1,895 tracks
- **Total Storage:** 350+ GB
- **Years Active:** 2015-2025
- **Collaborators:** 98 unique (by projects), 97 unique (by exports)

### Collaborator Statistics

**Top Collaborators by Project Count:**
1. Silent Jay (408 projects)
2. Slick Floyd (285 projects)
3. Breauxx (213 projects)
4. OG Coconut (187 projects)
5. NOOD (185 projects)

**Top Collaborators by Exported Tracks:**
1. Silent Jay (27 exported tracks)
2. ANDINO (16 exported tracks)
3. Breauxx (16 exported tracks)
4. Slick Floyd (16 exported tracks)
5. Javi (8 exported tracks)

**Note:** 437 solo tracks (no collaborator) have been exported.

### Production DNA
- **Dual BPM Zones:** 80-90 (41%) and 120-129 (32%)
- **Primary Keys:** 10B (31%), 11B (21%)
- **Energy Sweet Spot:** Level 5-7 (91%)
- **Genre Foundation:** Hip-Hop 42%, Funk 17%, House 8%, Soul 7%

### Intelligence Profile (1,895 tracks analyzed)

**Emotional Intelligence:**
- **Primary Character:** Groovy (70%) - Funky, rhythmic, danceable
- **Valence:** 0.76 (consistently positive emotion)
- **Arousal:** 0.57 (moderate excitement)
- **Emotional Range:** Groovy → Chill → Intense → Calm

**Psychological Intelligence:**
- **Primary Effects:** Social (51%), Background (21%), Productivity (19%)
- **Focus:** 0.50 (balanced - not distracting, not boring)
- **Relaxation:** 0.63 (moderately relaxing)
- **Motivation:** 0.53 (moderately motivating)

**Sonic Intelligence:**
- **Timbre:** Neutral (98%) - Balanced tonal character
- **Texture:** Balanced (98%) - Well-balanced harmonic/percussive
- **Spatial:** Focused (99%) - Centered, controlled stereo
- **Dynamics:** Dynamic (99%) - Good energy variation

**Intent Intelligence:**
- **Primary Intents:** Creative (31%), Chill (27%), Dance Floor (25%)
- **Use Cases:** Studio/production, home/study, club/festival, social

### System Capabilities
- **Drum Genres:** 12+
- **MIDI Generation:** Chords, bass, arps, drums
- **API Endpoints:** 50+
- **Ableton Control:** Full track/device/clip management
- **DNA Analysis:** MusicBrainz + SERGIK matching
- **Voice Control:** STT/TTS integration

---

## Technology Stack

### Backend
- **Python 3.8+**
- **FastAPI** - API framework
- **Librosa** - Audio analysis
- **MusicBrainz** - Metadata
- **AcoustID** - Fingerprinting
- **SQLite** - Database
- **Pydantic** - Data validation

### Frontend
- **Max for Live** - Ableton integration
- **JavaScript** - M4L device
- **HTML/CSS** - Device preview

### ML/AI
- **Scikit-learn** - ML models
- **NumPy** - Numerical computing
- **Vector stores** - Similarity search
- **Contextual bandits** - Recommendations

### Integration
- **OSC** - Real-time communication
- **HTTP/REST** - API communication
- **OpenAPI** - GPT Actions
- **Git** - Version control
- **S3** - Cloud storage

---

## Future Roadmap

### Phase 1: Foundation ✅
- Dataset standards
- Feature extraction
- JSONL templates
- Basic API

### Phase 2: Autonomy (6-12 months)
- Automatic ingestion
- Change tracking
- Self-updating datasets

### Phase 3: Real-Time (12-18 months)
- OSC/MIDI adaptive models
- Feedback loops
- Live parameter suggestions

### Phase 4: Creative AI (18-30 months)
- User-specific generative models
- MIDI/audio/automation generation
- Personalized suggestions

### Phase 5: Cloud Network (30+ months)
- Multi-user knowledge graph
- Collaborative dataset merging
- Creative lineage tracking

---

*SERGIK AI - Powered by comprehensive catalog analysis and production data*

