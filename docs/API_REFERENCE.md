# API Reference

## Overview

This document provides comprehensive API reference for the SERGIK ML API, including LOM endpoints, error codes, request/response examples, and integration patterns.

## Base URL

```
http://127.0.0.1:8000
```

## Authentication

Currently no authentication required for local development.

## Endpoints

### Health & Status

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "sergik-ml",
  "version": "1.0.0"
}
```

### Track Management

#### POST /live/tracks/create

Create a new track.

**Request:**
```json
{
  "track_type": "midi",
  "name": "New Track"
}
```

**Response:**
```json
{
  "status": "ok",
  "command": "create_track",
  "result": {
    "track_type": "midi",
    "name": "New Track",
    "index": 0
  }
}
```

#### GET /live/tracks

Get list of all tracks.

**Response:**
```json
{
  "status": "ok",
  "tracks": [
    {
      "index": 0,
      "name": "Track 1",
      "device_count": 2,
      "clip_count": 8
    }
  ]
}
```

#### DELETE /live/tracks/{track_index}

Delete a track.

**Response:**
```json
{
  "status": "ok",
  "command": "delete_track",
  "result": {
    "index": 0
  }
}
```

### Device Control

#### POST /live/devices/load

Load a device onto a track.

**Request:**
```json
{
  "track_index": 0,
  "device_name": "Simpler"
}
```

**Response:**
```json
{
  "status": "ok",
  "command": "load_device",
  "result": {
    "track_index": 0,
    "device_name": "Simpler"
  }
}
```

#### POST /live/devices/param

Set device parameter.

**Request:**
```json
{
  "track_index": 0,
  "device_index": 0,
  "param_index": 1,
  "value": 0.75
}
```

**Response:**
```json
{
  "status": "ok",
  "command": "set_param",
  "result": {
    "track_index": 0,
    "device_index": 0,
    "param_index": 1,
    "value": 0.75
  }
}
```

### Clip Management

#### POST /live/clips/create

Create a clip.

**Request:**
```json
{
  "track_index": 0,
  "slot_index": 0,
  "length_beats": 16
}
```

**Response:**
```json
{
  "status": "ok",
  "command": "create_clip",
  "result": {
    "track_index": 0,
    "slot_index": 0,
    "length": 16
  }
}
```

#### POST /live/clips/notes

Set clip notes.

**Request:**
```json
{
  "track_index": 0,
  "slot_index": 0,
  "notes": [
    {
      "pitch": 60,
      "start_time": 0,
      "duration": 1,
      "velocity": 100,
      "mute": 0
    }
  ]
}
```

**Response:**
```json
{
  "status": "ok",
  "command": "set_clip_notes",
  "result": {
    "track_index": 0,
    "slot_index": 0,
    "note_count": 1
  }
}
```

### Generation

#### POST /generate/chord_progression

Generate chord progression.

**Request:**
```json
{
  "key": "10B",
  "progression_type": "i-VI-III-VII",
  "bars": 8,
  "voicing": "stabs",
  "tempo": 125
}
```

**Response:**
```json
{
  "status": "ok",
  "notes": [
    {
      "pitch": 60,
      "start_time": 0,
      "duration": 1,
      "velocity": 100
    }
  ]
}
```

## Error Codes

### Validation Errors (400)

```json
{
  "status": "error",
  "error": "validation_error",
  "message": "Track index must be non-negative integer"
}
```

### Not Found (404)

```json
{
  "status": "error",
  "error": "not_found",
  "message": "Track 10 does not exist"
}
```

### Internal Server Error (500)

```json
{
  "status": "error",
  "error": "internal_error",
  "message": "An internal error occurred"
}
```

## LOM Error Types

### INVALID_PATH

Object does not exist or path is malformed.

**Example:**
```json
{
  "type": "INVALID_PATH",
  "retryable": false,
  "userMessage": "The requested object does not exist or is out of range."
}
```

### PERMISSION

Read-only access or permission denied.

**Example:**
```json
{
  "type": "PERMISSION",
  "retryable": false,
  "userMessage": "You don't have permission to perform this operation."
}
```

### STATE

Invalid state (e.g., no clip selected).

**Example:**
```json
{
  "type": "STATE",
  "retryable": false,
  "userMessage": "The current state doesn't allow this operation."
}
```

### TRANSIENT

Temporary errors (e.g., Live busy).

**Example:**
```json
{
  "type": "TRANSIENT",
  "retryable": true,
  "userMessage": "Ableton Live is busy. Please try again."
}
```

## Integration Patterns

### Max for Live → API

```javascript
function createTrack(type, name) {
    httpRequest("POST", "/live/tracks/create", {
        track_type: type,
        name: name
    }, function(err, response) {
        if (err) {
            status("Error: " + err);
        } else {
            status("Created track: " + response.result.name);
        }
    });
}
```

### API → LOM

```python
from sergik_ml.api.middleware.validation import validate_track_index
from sergik_ml.connectors.ableton_osc import osc_send

@router.post("/live/tracks/create")
def create_track(request: CreateTrackRequest):
    validate_track_index(0)  # Validate if needed
    osc_send("/scp/create_track", request.model_dump())
    return LiveCommandResponse(status="ok", ...)
```

### Error Handling

```javascript
httpRequest("POST", "/live/tracks/create", data, function(err, response) {
    if (err) {
        // Handle HTTP error
        if (err.status === 400) {
            status("Validation error: " + err.message);
        } else if (err.status === 500) {
            status("Server error: " + err.message);
        }
    } else if (response.status === "error") {
        // Handle API error
        if (response.error === "validation_error") {
            status("Invalid input: " + response.message);
        }
    } else {
        // Success
        status("Success: " + response.result);
    }
});
```

## Request/Response Examples

### Complete Track Creation Flow

**1. Create Track**
```bash
POST /live/tracks/create
{
  "track_type": "midi",
  "name": "Bass"
}
```

**2. Load Device**
```bash
POST /live/devices/load
{
  "track_index": 0,
  "device_name": "Operator"
}
```

**3. Create Clip**
```bash
POST /live/clips/create
{
  "track_index": 0,
  "slot_index": 0,
  "length_beats": 16
}
```

**4. Generate Notes**
```bash
POST /generate/walking_bass
{
  "key": "10B",
  "style": "house",
  "bars": 8
}
```

**5. Insert Notes**
```bash
POST /live/clips/notes
{
  "track_index": 0,
  "slot_index": 0,
  "notes": [...]
}
```

## Performance Considerations

### Caching

State is cached with TTL:
- Track state: 1 second TTL
- Device state: 1 second TTL
- Clip state: 1 second TTL

### Batching

Batch operations when possible:
```javascript
// Instead of multiple calls
batchSetVolume({
    0: 0.75,
    1: 0.80,
    2: 0.70
});
```

### Rate Limiting

API has rate limiting middleware:
- Default: 100 requests per minute
- Adjustable via configuration

## Conclusion

This API reference provides:

- **Complete endpoint documentation**
- **Error code reference**
- **Integration patterns**
- **Request/response examples**
- **Performance considerations**

For more information, see:
- `LOM_DESIGN_PRINCIPLES.md` - Design patterns
- `DEVELOPMENT_WORKFLOW.md` - Development procedures

