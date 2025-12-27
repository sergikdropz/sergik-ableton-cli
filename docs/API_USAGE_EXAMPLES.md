# API Usage Examples

## Transform Endpoints

### Quantize MIDI Notes

```python
import requests

response = requests.post(
    "http://localhost:8000/api/transform/quantize",
    json={
        "track_index": 0,
        "clip_slot": 0,
        "grid": "1/16",  # Options: "1/32", "1/16", "1/8", "1/4", "1/2", "1", "triplet", "swing"
        "strength": 100  # 0-100
    }
)

print(response.json())
# {"status": "ok", "result": {"status": "ok", "message": "Quantized to 1/16 grid at 100% strength"}}
```

### Transpose MIDI Notes

```python
response = requests.post(
    "http://localhost:8000/api/transform/transpose",
    json={
        "track_index": 0,
        "clip_slot": 0,
        "semitones": 12  # Positive = up, negative = down
    }
)
```

### Adjust Velocity

```python
# Set all velocities to 100
response = requests.post(
    "http://localhost:8000/api/transform/velocity",
    json={
        "track_index": 0,
        "clip_slot": 0,
        "operation": "set",  # Options: "set", "scale", "randomize"
        "value": 100  # 0-127 for set, 0-2.0 for scale, 0-100 for randomize
    }
)

# Scale velocities by 1.5x
response = requests.post(
    "http://localhost:8000/api/transform/velocity",
    json={
        "track_index": 0,
        "clip_slot": 0,
        "operation": "scale",
        "value": 1.5
    }
)
```

### Make Legato

```python
response = requests.post(
    "http://localhost:8000/api/transform/legato",
    json={
        "track_index": 0,
        "clip_slot": 0
    }
)
```

### Remove Overlaps

```python
response = requests.post(
    "http://localhost:8000/api/transform/remove_overlaps",
    json={
        "track_index": 0,
        "clip_slot": 0
    }
)
```

### Time Shift

```python
# Shift right by 0.25 beats (16th note)
response = requests.post(
    "http://localhost:8000/api/transform/time_shift",
    json={
        "track_index": 0,
        "clip_slot": 0,
        "direction": "right",  # "left" or "right"
        "amount": 0.25  # Beats
    }
)
```

### Audio Processing

```python
# Fade in
response = requests.post(
    "http://localhost:8000/api/transform/fade",
    json={
        "track_index": 0,
        "clip_slot": 0,
        "type": "in",  # "in", "out", or "both"
        "duration": 0.5  # Seconds
    }
)

# Normalize
response = requests.post(
    "http://localhost:8000/api/transform/normalize",
    json={
        "track_index": 0,
        "clip_slot": 0,
        "target_level": -0.1  # dB
    }
)

# Time stretch
response = requests.post(
    "http://localhost:8000/api/transform/time_stretch",
    json={
        "track_index": 0,
        "clip_slot": 0,
        "factor": 1.5  # 1.0 = no change, 2.0 = double speed
    }
)

# Pitch shift
response = requests.post(
    "http://localhost:8000/api/transform/pitch_shift",
    json={
        "track_index": 0,
        "clip_slot": 0,
        "semitones": 7  # Positive = up, negative = down
    }
)
```

## Library/Browser Endpoints

### Search Library

```python
# Simple search
response = requests.get(
    "http://localhost:8000/api/live/browser/search",
    params={"query": "kick"}
)

# Advanced search with syntax
response = requests.get(
    "http://localhost:8000/api/live/browser/search",
    params={"query": "BPM:120 key:C name:kick genre:house"}
)

results = response.json()
# {"status": "ok", "items": [...]}
```

### Load Sample

```python
response = requests.post(
    "http://localhost:8000/api/live/browser/load",
    json={
        "track_index": 0,
        "sample_path": "/Users/username/Music/Samples/kick.wav"
    }
)
```

### Hot-Swap Sample

```python
response = requests.post(
    "http://localhost:8000/api/live/browser/hot_swap",
    json={
        "track_index": 0,
        "device_index": 0,
        "sample_path": "/Users/username/Music/Samples/new_kick.wav"
    }
)
```

## Analysis Endpoints

### Analyze Audio File

```python
with open("track.wav", "rb") as f:
    response = requests.post(
        "http://localhost:8000/api/analyze/upload",
        files={"file": f}
    )

result = response.json()
# {
#   "status": "ok",
#   "metadata": {
#     "bpm": 125.0,
#     "key": "10B",
#     "energy": 6.5,
#     "lufs": -14.2,
#     ...
#   }
# }
```

### DNA Match

```python
with open("track.wav", "rb") as f:
    response = requests.post(
        "http://localhost:8000/api/gpt/analyze",
        files={"file": f}
    )

result = response.json()
# {
#   "status": "ok",
#   "dna_match": {
#     "score": 0.85,
#     "genre": "house",
#     "bpm_zone": "120-129",
#     "key": "10B",
#     ...
#   }
# }
```

## Export Endpoints

### Export Track

```python
response = requests.post(
    "http://localhost:8000/api/export/track",
    json={
        "track_index": 0,
        "format": "wav",  # "wav", "aiff", "mp3"
        "location": "/tmp/exports",
        "export_stems": False
    }
)

result = response.json()
# {"status": "ok", "file_path": "/tmp/exports/export.wav"}
```

### Batch Export

```python
response = requests.post(
    "http://localhost:8000/api/export/batch",
    json={
        "format": "wav",
        "location": "/tmp/exports",
        "export_stems": False,
        "tracks": [0, 1, 2, 3]
    }
)

result = response.json()
# {"status": "ok", "files_exported": 4}
```

### Export Stems

```python
response = requests.post(
    "http://localhost:8000/api/export/stems",
    json={
        "track_index": 0,
        "format": "wav",
        "location": "/tmp/exports"
    }
)

result = response.json()
# {"status": "ok", "stems": ["/tmp/exports/track_0.wav", ...]}
```

## JavaScript/TypeScript Examples

### Using Fetch API

```javascript
// Quantize
async function quantizeClip(trackIndex, clipSlot, grid, strength) {
    const response = await fetch('http://localhost:8000/api/transform/quantize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            track_index: trackIndex,
            clip_slot: clipSlot,
            grid: grid,
            strength: strength
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Quantize failed');
    }
    
    return await response.json();
}

// Search library
async function searchLibrary(query) {
    const response = await fetch(
        `http://localhost:8000/api/live/browser/search?query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
        throw new Error('Search failed');
    }
    
    return await response.json();
}
```

### Using EditorHandlers Class

```javascript
import { EditorHandlers } from './js/editor-handlers.js';

const editor = new EditorHandlers('http://localhost:8000');

// Quantize
await editor.quantize('1/16', 100);

// Transpose
await editor.transpose(12);

// Time shift
await editor.timeShift('right', 0.25);

// Rotate
await editor.rotate(90);
```

## Error Handling

### Python

```python
import requests
from requests.exceptions import RequestException

try:
    response = requests.post(
        "http://localhost:8000/api/transform/quantize",
        json={"track_index": 0, "clip_slot": 0, "grid": "1/16", "strength": 100},
        timeout=5
    )
    response.raise_for_status()
    result = response.json()
    print(f"Success: {result['result']['message']}")
except RequestException as e:
    print(f"Request failed: {e}")
except ValueError as e:
    print(f"Invalid response: {e}")
```

### JavaScript

```javascript
async function safeQuantize(trackIndex, clipSlot) {
    try {
        const response = await fetch('http://localhost:8000/api/transform/quantize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                track_index: trackIndex,
                clip_slot: clipSlot,
                grid: '1/16',
                strength: 100
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Quantize failed');
        }
        
        const result = await response.json();
        console.log('Success:', result.result.message);
        return result;
    } catch (error) {
        console.error('Quantize error:', error);
        throw error;
    }
}
```

## Complete Workflow Example

```python
import requests

API_BASE = "http://localhost:8000"

# 1. Generate MIDI (via Max for Live device or API)
# 2. Quantize
requests.post(f"{API_BASE}/api/transform/quantize", json={
    "track_index": 0, "clip_slot": 0, "grid": "1/16", "strength": 100
})

# 3. Transpose
requests.post(f"{API_BASE}/api/transform/transpose", json={
    "track_index": 0, "clip_slot": 0, "semitones": 7
})

# 4. Adjust velocity
requests.post(f"{API_BASE}/api/transform/velocity", json={
    "track_index": 0, "clip_slot": 0, "operation": "scale", "value": 1.2
})

# 5. Export
requests.post(f"{API_BASE}/api/export/track", json={
    "track_index": 0, "format": "wav", "location": "/tmp/exports"
})
```

