# Backend-Frontend Connection Guide

## Overview

The SERGIK system consists of:
- **Frontend**: Max for Live controller (`maxforlive/SERGIK_AI_Controller.js`)
- **Backend**: SERGIK ML API server (port 8000)
- **Agent System**: SERGIK AI Team (port 8001)

## Connection Architecture

```
┌─────────────────────┐
│  Max for Live       │
│  Controller (M4L)   │
└──────────┬──────────┘
           │ HTTP
           │ (port 8000)
           ▼
┌─────────────────────┐
│  SERGIK ML API      │
│  (FastAPI)          │
│  - Generation       │
│  - Ableton Control  │
│  - Analysis         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  SERGIK AI Team     │
│  (Agents)           │
│  (port 8001)        │
└─────────────────────┘
```

## Endpoint Mapping

### Frontend → Backend Endpoints

| Frontend Endpoint | Backend Endpoint | Router | Status |
|-------------------|-----------------|--------|--------|
| `GET /gpt/health` | `/gpt/health` | gpt | ✅ |
| `POST /generate/chord_progression` | `/generate/chord_progression` | generation | ✅ |
| `POST /generate/walking_bass` | `/generate/walking_bass` | generation | ✅ |
| `POST /generate/arpeggios` | `/generate/arpeggios` | generation | ✅ |
| `POST /drums/generate` | `/drums/generate` | compat | ✅ |
| `GET /drums/genres` | `/drums/genres` | compat | ✅ |
| `POST /gpt/generate` | `/gpt/generate` | gpt | ✅ |
| `POST /live/command` | `/live/command` | ableton | ✅ |
| `POST /live/devices/load` | `/live/devices/load` | ableton | ✅ |
| `POST /live/devices/load_vst` | `/live/devices/load_vst` | ableton | ✅ |
| `GET /live/browser/search` | `/live/browser/search` | ableton | ✅ |
| `POST /live/browser/load` | `/live/browser/load` | ableton | ✅ |
| `POST /live/browser/hot_swap` | `/live/browser/hot_swap` | ableton | ✅ |

## Configuration

### Frontend Configuration

The Max for Live controller is configured in `SERGIK_AI_Controller.js`:

```javascript
var API_HOST = "127.0.0.1";
var API_PORT = 8000;
var API_BASE_URL = "http://" + API_HOST + ":" + API_PORT;
```

You can change the API endpoint at runtime:
```javascript
set_api <host> <port>
```

### Backend Configuration

The backend server is configured in `sergik_ml/config.py`:

```python
host = "127.0.0.1"
port = 8000
```

Environment variables:
- `SERGIK_HOST` - Bind host (default: 127.0.0.1)
- `SERGIK_PORT` - Bind port (default: 8000)

## Starting the System

### 1. Start Backend Server

```bash
# Start SERGIK ML API (port 8000)
python run_server.py
```

### 2. Start Agent System (Optional)

```bash
# Start SERGIK AI Team (port 8001)
python sergik_ai_team/main.py
```

### 3. Load Max for Live Controller

1. Open Ableton Live
2. Load the SERGIK AI Controller device
3. The controller will automatically connect to `http://127.0.0.1:8000`

## Testing the Connection

### Quick Test

```bash
# Test health endpoint
curl http://127.0.0.1:8000/health

# Test GPT health
curl http://127.0.0.1:8000/gpt/health
```

### Full Connection Test

```bash
# Run comprehensive connection test
python test_connection.py
```

This will test all frontend endpoints to ensure they're properly connected.

## Troubleshooting

### Connection Refused

**Problem**: Frontend can't connect to backend

**Solutions**:
1. Verify backend is running: `curl http://127.0.0.1:8000/health`
2. Check firewall settings
3. Verify API_HOST and API_PORT in frontend match backend

### Endpoint Not Found (404)

**Problem**: Frontend calls endpoint that doesn't exist

**Solutions**:
1. Check endpoint mapping table above
2. Verify router is included in `sergik_ml/api/main.py`
3. Check router prefix matches expected path

### CORS Errors

**Problem**: Browser blocks requests due to CORS

**Solutions**:
1. Backend includes CORS middleware
2. Check `allowed_origins` in `sergik_ml/config.py`
3. For Max for Live, CORS shouldn't be an issue (not browser-based)

### Timeout Errors

**Problem**: Requests timeout

**Solutions**:
1. Check backend logs for errors
2. Increase timeout in frontend (currently 10 seconds)
3. Verify backend services are healthy

## Compatibility Endpoints

The `compat` router provides compatibility endpoints for the Max for Live frontend:

- `/drums/generate` - Maps to generation service
- `/drums/genres` - Returns available drum genres

These endpoints ensure the frontend can call endpoints using its expected paths.

## API Response Format

All endpoints return JSON in this format:

```json
{
  "status": "ok",
  "notes": [...],
  "count": 42
}
```

Or for errors:

```json
{
  "status": "error",
  "error": "Error message"
}
```

## Next Steps

1. ✅ All endpoints connected
2. ✅ Compatibility router added
3. ✅ Connection test script created
4. ⏭️ Test in Max for Live
5. ⏭️ Monitor logs for issues

## Support

For issues:
1. Check backend logs: `python run_server.py` (logs to console)
2. Check frontend status: Look at Max for Live device status outlet
3. Run connection test: `python test_connection.py`
4. Review endpoint documentation: `http://127.0.0.1:8000/docs`

