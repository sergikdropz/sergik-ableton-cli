# Enhanced Energy Analysis with Intelligence

## Overview

The SERGIK AI energy analysis system has been enhanced with four layers of intelligence:

1. **Emotional Intelligence** - Maps energy to emotions, valence, and arousal
2. **Psychological Intelligence** - Understands psychological effects (focus, relaxation, motivation)
3. **Sonic Intelligence** - Analyzes timbre, texture, spatial, and dynamics
4. **Intent Intelligence** - Detects use cases and suitable contexts

## Features

### Emotional Intelligence

Maps energy levels to emotional states using Russell's circumplex model:

- **Valence** (-1 to 1): Negative to positive emotion
- **Arousal** (0 to 1): Calm to excited
- **Emotion Categories**: calm, melancholic, dreamy, chill, groovy, uplifting, intense, euphoric, etc.
- **Emotional States**: bored, sad, calm, happy, excited, etc.

**Example:**
```json
{
  "emotional": {
    "category": "groovy",
    "valence": 0.8,
    "arousal": 0.6,
    "emotions": ["funky", "rhythmic", "danceable"],
    "emotional_state": "happy"
  }
}
```

### Psychological Intelligence

Analyzes psychological effects based on energy:

- **Focus** (0-1): Concentration level
- **Relaxation** (0-1): Calmness level
- **Motivation** (0-1): Energy/motivation level
- **Primary Effects**: meditation, study, productivity, workout, party, etc.

**Example:**
```json
{
  "psychological": {
    "primary_effect": "productivity",
    "focus": 0.7,
    "relaxation": 0.5,
    "motivation": 0.75,
    "psychological_state": "productive"
  }
}
```

### Sonic Intelligence

Deep audio characteristic analysis:

- **Timbre**: warm, bright, dark, crisp, mellow
- **Texture**: dense, sparse, layered, minimal, rich
- **Spatial**: intimate, wide, focused, expansive
- **Dynamics**: steady, pulsing, dynamic, explosive

**Example:**
```json
{
  "sonic": {
    "timbre": "warm",
    "texture": "layered",
    "spatial": "focused",
    "dynamics": "pulsing",
    "brightness": 3200,
    "harmonic_ratio": 0.65,
    "percussive_ratio": 0.45,
    "energy_variation": 0.08
  }
}
```

### Intent Intelligence

Detects suitable use cases and contexts:

- **Primary Intent**: dance_floor, background, workout, chill, creative, driving, meditation, peak_time
- **Use Cases**: club, cafe, gym, studio, road trip, etc.
- **Characteristics**: driving, rhythmic, ambient, intense, etc.

**Example:**
```json
{
  "intent": {
    "primary": "dance_floor",
    "matches": [
      {
        "intent": "dance_floor",
        "confidence": 0.9,
        "use_cases": ["club", "festival", "party", "peak time"],
        "characteristics": ["driving", "rhythmic", "pulsing"]
      }
    ],
    "use_cases": ["club", "festival", "party", "peak time"],
    "suitable_for": ["club", "festival", "party", "peak time"]
  }
}
```

## Usage

### In Audio Analysis Pipeline

The intelligence is automatically included when analyzing audio:

```python
from sergik_ml.pipelines.audio_analysis import analyze_audio

result = analyze_audio("track.wav")
intelligence = result.get("intelligence", {})

print(f"Emotion: {intelligence['emotional']['category']}")
print(f"Psychological: {intelligence['psychological']['primary_effect']}")
print(f"Sonic: {intelligence['sonic']['timbre']}")
print(f"Intent: {intelligence['intent']['primary']}")
```

### Via API

All analysis endpoints automatically include intelligence:

```bash
# Upload and analyze
curl -X POST "http://localhost:8000/analyze/upload" \
  -F "file=@track.wav"

# Analyze from URL
curl -X POST "http://localhost:8000/analyze/url?url=https://youtube.com/..."

# Analyze local file
curl -X POST "http://localhost:8000/analyze/path?file_path=/path/to/track.wav"
```

**Response includes:**
```json
{
  "status": "ok",
  "file": "track.wav",
  "metadata": { ... },
  "intelligence": {
    "energy_level": 7,
    "energy_category": "medium",
    "emotional": { ... },
    "psychological": { ... },
    "sonic": { ... },
    "intent": { ... },
    "summary": {
      "description": "A high energy track (7/10) with groovy emotional character...",
      "tags": ["groovy", "productivity", "warm", "layered", "dance_floor"]
    }
  },
  "musicbrainz": { ... },
  "sergik_dna": { ... },
  "genre_influence": { ... }
}
```

## Energy Level Mappings

### Low Energy (1-3)
- **Emotions**: calm, melancholic, dreamy
- **Psychological**: meditation, sleep, study
- **Intent**: meditation, background
- **Sonic**: warm, sparse, intimate, steady

### Mid-Low Energy (4-5)
- **Emotions**: chill, contemplative, warm
- **Psychological**: background, chill_work, social
- **Intent**: background, chill
- **Sonic**: mellow, balanced, focused, pulsing

### Mid Energy (6-7) - SERGIK Sweet Spot
- **Emotions**: groovy, uplifting, confident, smooth
- **Psychological**: productivity, creative_work, driving, social_dance
- **Intent**: creative, driving, social
- **Sonic**: warm/bright, layered, focused, dynamic

### High Energy (8-10)
- **Emotions**: intense, euphoric, energetic, aggressive
- **Psychological**: workout, party, peak_time, intense_focus
- **Intent**: dance_floor, workout, peak_time
- **Sonic**: bright/crisp, dense, wide, explosive

## Integration

The intelligence module is automatically integrated into:

1. **Audio Analysis Pipeline** (`sergik_ml/pipelines/audio_analysis.py`)
   - Automatically enhances `analyze_audio()` results
   - Included in `full_analysis()` pipeline

2. **API Endpoints** (`sergik_ml/serving/api.py`)
   - `/analyze/upload` - Upload and analyze
   - `/analyze/url` - Analyze from URL
   - `/analyze/path` - Analyze local file

3. **Schemas** (`sergik_ml/schemas.py`)
   - `EnergyIntelligence` model for API responses
   - `AudioAnalysisResponse` includes intelligence field

## Configuration

The intelligence mappings can be customized in:
- `sergik_ml/features/energy_intelligence.py`
- `EMOTION_MAP` - Emotional categories
- `PSYCHOLOGICAL_EFFECTS` - Psychological effects
- `SONIC_CHARACTERISTICS` - Sonic characteristics
- `INTENT_CATEGORIES` - Intent categories

## Example Analysis

For a track with:
- Energy: 7/10
- BPM: 125
- Brightness: 3500 Hz
- Harmonic Ratio: 0.65
- Percussive Ratio: 0.45

**Result:**
```json
{
  "energy_level": 7,
  "energy_category": "medium",
  "emotional": {
    "category": "groovy",
    "valence": 0.8,
    "arousal": 0.6,
    "emotions": ["funky", "rhythmic", "danceable"],
    "emotional_state": "happy"
  },
  "psychological": {
    "primary_effect": "productivity",
    "focus": 0.7,
    "relaxation": 0.5,
    "motivation": 0.75,
    "psychological_state": "productive"
  },
  "sonic": {
    "timbre": "warm",
    "texture": "layered",
    "spatial": "focused",
    "dynamics": "dynamic",
    "brightness": 3500,
    "harmonic_ratio": 0.65,
    "percussive_ratio": 0.45,
    "energy_variation": 0.08
  },
  "intent": {
    "primary": "dance_floor",
    "matches": [
      {
        "intent": "dance_floor",
        "confidence": 0.9,
        "use_cases": ["club", "festival", "party", "peak time"],
        "characteristics": ["driving", "rhythmic", "pulsing"]
      },
      {
        "intent": "creative",
        "confidence": 0.6,
        "use_cases": ["studio", "production", "writing", "design"],
        "characteristics": ["inspiring", "textured", "layered"]
      }
    ],
    "use_cases": ["club", "festival", "party", "peak time"],
    "suitable_for": ["club", "festival", "party", "peak time"]
  },
  "summary": {
    "description": "A high energy track (7/10) with groovy emotional character. Psychologically suited for productivity activities. Best suited for dance floor contexts.",
    "tags": ["groovy", "productivity", "warm", "layered", "dance_floor", "energy_analysis", "intelligent_analysis"]
  }
}
```

## Benefits

1. **Better Track Understanding**: Beyond simple energy numbers
2. **Contextual Recommendations**: Know where tracks fit best
3. **Emotional Mapping**: Understand emotional impact
4. **Use Case Detection**: Automatic context identification
5. **Production Insights**: Sonic characteristics for mixing/mastering

## Future Enhancements

- Machine learning models for emotion/intent prediction
- User preference learning from ratings
- Context-aware recommendations
- Real-time analysis during production
- Multi-track analysis for playlists

---

*Enhanced Energy Analysis - SERGIK AI v1.0*

