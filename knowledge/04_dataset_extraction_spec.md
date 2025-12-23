# SERGIK Dataset Extraction Specification

## Extraction Scope

### Primary Audio Directories
```
/Users/machd/Desktop/SERGIKDROPZ           # 84 tracks, 5.1 GB
/Users/machd/Desktop/srija                  # 14 tracks, 975 MB
/Users/machd/Music/Music/Media.localized/Music/SERGIK/FTP  # 5 tracks, 390 MB
/Users/machd/Music/Music/Media.localized/Music/Unknown Artist/Unknown Album  # 575+ tracks
```

### Ableton Projects
```
/Users/machd/Music/Ableton/User Library/Templates/     # 4 templates
/Users/machd/Music/Ableton/Live Recordings/            # 137 sessions
/Users/machd/Desktop/WOMWOM 121BPM/                    # Stem project
/Users/machd/Desktop/SLAPSTICK Project/                # Sample project
```

### Audio Extensions to Scan
```python
AUDIO_EXTS = {".wav", ".aif", ".aiff", ".mp3", ".m4a", ".flac"}
```

## Track Manifest Schema (tracks.csv)

### Required Columns

| Column | Type | Description | Extraction Method |
|--------|------|-------------|-------------------|
| `track_id` | string | Stable hash of full path | SHA1(full_path)[:12] |
| `filename` | string | File name with extension | os.path.basename() |
| `full_path` | string | Absolute file path | os.path.abspath() |
| `bytes` | int | File size in bytes | os.stat().st_size |
| `duration_s` | float | Duration in seconds | ffprobe/afinfo |
| `sample_rate_hz` | int | Sample rate | ffprobe/afinfo |
| `bit_depth` | int | Bits per sample | ffprobe/afinfo |
| `channels` | int | Channel count | ffprobe/afinfo |
| `bpm` | int/null | BPM from filename | regex parse |
| `key` | string/null | Key from filename | regex parse |
| `collaborators` | string | Semicolon-separated | parse "x" notation |
| `version_tag` | string | v1/v2/VIP/etc | regex parse |
| `category` | string | Solo/Collab/Remix | derived |
| `source_bucket` | string | Parent directory name | path.parent.name |

### Parsing Rules

#### BPM Extraction
```python
BPM_RE = re.compile(r"(\d{2,3})\s*[Bb][Pp][Mm]")
# Valid range: 50-220
# Examples: "125BPM", "127 bpm", "120bpm"
```

#### Key Extraction
```python
KEY_RE = re.compile(r"([A-G](?:#|b)?)\s*(maj|min|major|minor)?", re.IGNORECASE)
# Normalize to: "Cmaj", "Dmin", "F#maj", "Bbmin"
# Examples: "C Major", "Dmin", "G#maj"
```

#### Collaborator Parsing
```python
COLLAB_RE = re.compile(r"\s+[xX]\s+")
# Split on " x " or " X "
# First segment = SERGIK (skip)
# Join remaining with semicolon
# Example: "SERGIK x Silent Jay x BeJanis" → "Silent Jay;BeJanis"
```

#### Version Tag Extraction
```python
VERSION_RE = re.compile(r"\b(v\d+|vip|final|mix\d+|rev\d+)\b", re.IGNORECASE)
# Examples: "v2", "VIP", "final", "mix3"
```

#### Category Derivation
```python
if collaborators:
    category = "Collab"
elif "remix" in filename.lower() or "flip" in filename.lower():
    category = "Remix"
else:
    category = "Solo"
```

## Project Manifest Schema (projects_als.csv)

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `project_path` | string | Full path to .als file |
| `project_name` | string | Project folder name |
| `created_time` | datetime | File creation time |
| `modified_time` | datetime | Last modification time |
| `contains_sergik_template` | bool | Uses SERGIK template |
| `linked_audio_count` | int | Number of linked audio files |

## Audio Feature Schema (track_features.parquet)

### Columns (from librosa analysis)

| Column | Type | Description |
|--------|------|-------------|
| `track_id` | string | Links to tracks.csv |
| `tempo_detected` | float | Auto-detected BPM |
| `key_detected` | string | Auto-detected key |
| `key_confidence` | float | Key detection confidence (0-1) |
| `energy_mean` | float | RMS energy mean |
| `energy_std` | float | RMS energy standard deviation |
| `spectral_centroid_mean` | float | Average brightness |
| `brightness` | float | Normalized brightness (0-1) |
| `mfcc_1_mean` ... `mfcc_13_mean` | float | MFCC coefficients |
| `harmonic_ratio` | float | Harmonic content ratio |
| `percussive_ratio` | float | Percussive content ratio |
| `onset_rate` | float | Rhythmic density |

## Quality Tier Assignment

```python
def determine_quality_tier(sample_rate, bit_depth, format):
    if 'mp3' in format.lower() or bit_depth < 16:
        return 4  # Compressed - EXCLUDE
    elif bit_depth == 16 and sample_rate >= 44100:
        return 3  # Legacy - VALIDATE ONLY
    elif bit_depth >= 24 and sample_rate >= 48000:
        return 1  # Master - INCLUDE
    elif bit_depth >= 24 and sample_rate >= 44100:
        return 1  # Master - INCLUDE
    elif sample_rate >= 44100:
        return 2  # High - INCLUDE
    return 4  # Unknown - EXCLUDE
```

## Extraction Pipeline

### Step 1: Scan Audio Files
```bash
python scripts/scan_audio.py
# Output: data/manifests/tracks.csv
```

### Step 2: Scan Ableton Projects
```bash
python scripts/scan_projects.py
# Output: data/manifests/projects_als.csv
```

### Step 3: Extract Audio Features (Optional)
```bash
python scripts/extract_features.py
# Output: data/features/track_features.parquet
```

### Step 4: Validate Data
```bash
python scripts/validate.py
# Checks: schema compliance, missing values, quality tiers
```

### Step 5: Build Knowledge Chunks
```bash
python scripts/build_knowledge_chunks.py
# Output: data/chunks/knowledge_chunks.jsonl
```

## Output Files

### For Custom GPT (RAG)
```
knowledge/
├── 00_overview.md
├── 01_style_signature.md
├── 02_quality_standards.md
├── 03_workflow_templates.md
└── 04_dataset_extraction_spec.md

data/chunks/knowledge_chunks.jsonl
```

### For Fine-tuning
```
data/finetune/sergik_finetune.jsonl
```

### For Analysis
```
data/manifests/tracks.csv
data/manifests/projects_als.csv
data/features/track_features.parquet
```

## Chunk Schema (knowledge_chunks.jsonl)

```json
{
  "id": "qs_0001",
  "source": "02_quality_standards.md",
  "title": "Mastering Targets",
  "tags": ["mix", "master", "qc"],
  "text": "...chunk text (max 2000 chars)..."
}
```

## Fine-tune Schema (sergik_finetune.jsonl)

```json
{
  "messages": [
    {"role": "system", "content": "You are Sergik AI..."},
    {"role": "user", "content": "User question..."},
    {"role": "assistant", "content": "Sergik-style response..."}
  ]
}
```

## Validation Checklist

- [ ] All SERGIK tracks have valid track_id
- [ ] Duration > 0 for all tracks
- [ ] Sample rate is 44100 or 48000 for training tracks
- [ ] Bit depth is 24 for training tracks
- [ ] No duplicate track_ids
- [ ] Collaborator parsing captures all "x" patterns
- [ ] BPM values in valid range (50-220)
- [ ] Key signatures properly normalized
- [ ] Quality tier assigned to all tracks
- [ ] Source bucket correctly identifies origin directory
