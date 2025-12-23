# SERGIK Quality Standards

## Audio Quality Requirements

### Tier 1: Master Quality (Training-Ready)
- **Format:** WAV PCM uncompressed
- **Sample Rate:** 44.1 kHz or 48 kHz
- **Bit Depth:** 24-bit
- **Bitrate:** 2.1-2.3 Mbps
- **Channels:** Stereo (2-channel)
- **Status:** INCLUDE in training

### Tier 2: High Quality
- **Format:** WAV/AIFF
- **Sample Rate:** 44.1+ kHz
- **Bit Depth:** 24-bit
- **Status:** INCLUDE in training (resample if needed)

### Tier 3: Legacy
- **Format:** WAV
- **Sample Rate:** 44.1 kHz
- **Bit Depth:** 16-bit
- **Status:** VALIDATION ONLY (not for training)

### Tier 4: Compressed
- **Format:** MP3, AAC, M4A
- **Status:** EXCLUDE from training

## Quality Control Gates

### Gate 1: Format Validation
```
PASS: WAV or AIFF, 44.1+ kHz, 24-bit
FAIL: MP3, 16-bit, < 44.1 kHz
```

### Gate 2: Duration Check
```
PASS: 2:00 - 8:00 minutes (optimal training length)
WARN: < 2:00 or > 8:00 (may need segmentation)
FAIL: < 0:30 (too short for training)
```

### Gate 3: Clipping Detection
```
PASS: No samples at 0 dBFS
WARN: < 3 consecutive samples at 0 dBFS
FAIL: > 10 consecutive samples at 0 dBFS (audible clipping)
```

### Gate 4: Loudness Standards
```
TARGET: -14 to -10 LUFS integrated
WARN: > -8 LUFS (overlimited)
WARN: < -18 LUFS (too quiet)
```

### Gate 5: File Integrity
```
PASS: Complete file, proper headers
FAIL: Truncated, corrupt, or missing audio data
```

## Mastering Targets

| Parameter | Target | Tolerance |
|-----------|--------|-----------|
| Integrated Loudness | -12 LUFS | ± 2 LUFS |
| True Peak | -1.0 dBTP | max 0 dBTP |
| Dynamic Range | > 6 dB | min 4 dB |
| Stereo Width | Correlated | > 0.7 correlation |

## Metadata Standards

### Required Fields (per track)
```json
{
  "track_id": "SERGIK_0001",
  "filename": "SERGIK - Track Name.wav",
  "full_path": "/absolute/path/to/file.wav",
  "bytes": 65234567,
  "duration_s": 245.8,
  "sample_rate_hz": 44100,
  "bit_depth": 24,
  "channels": 2,
  "bpm": 125,
  "key": "Cmaj",
  "collaborators": "Silent Jay;Breauxx",
  "version_tag": "v2",
  "category": "Collab",
  "source_bucket": "SERGIKDROPZ",
  "quality_tier": 1,
  "include_in_training": true
}
```

### BPM Extraction Rules
1. Parse from filename: `(\d{2,3})\s*[Bb][Pp][Mm]`
2. Valid range: 50-220 BPM
3. If not in filename: leave blank for auto-detection

### Key Extraction Rules
1. Parse from filename: `([A-G](?:#|b)?)\s*(maj|min)?`
2. Normalize: "Cmaj", "Dmin", "F#maj"
3. If not in filename: leave blank for auto-detection

### Collaborator Parsing
1. Split on ` x ` or ` X ` (case insensitive)
2. First segment = SERGIK (skip)
3. Remaining segments = collaborators
4. Join with semicolon: `Silent Jay;BeJanis`

## File Organization Standards

### Approved Directory Structure
```
/SERGIKDROPZ/           → Release-ready tracks
/srija/                 → Hi-res masters
/FTP/                   → Special editions
/Live Recordings/       → Session archives
/Templates/             → Production templates
```

### Rejected Content
- Duplicate files (keep highest quality version)
- Incomplete renders (< 30 seconds)
- Test/scratch files without proper naming
- Compressed formats (MP3/AAC for training)

## Quality Tier Distribution (Current Catalog)

| Tier | Count | Percentage | Action |
|------|-------|------------|--------|
| Tier 1 (Master) | 554 | 85% | Include |
| Tier 2 (High) | 0 | 0% | Include |
| Tier 3 (Legacy) | 95 | 15% | Validate only |
| Tier 4 (Compressed) | 2 | <1% | Exclude |
