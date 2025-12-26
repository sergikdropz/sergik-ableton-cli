# SERGIK App Setup Guide

## Quick Start Checklist

- [ ] Install Python 3.8+
- [ ] Install dependencies
- [ ] Initialize database
- [ ] Start backend server
- [ ] (Optional) Start agent system
- [ ] Load Max for Live controller
- [ ] Test connection

---

## 1. Prerequisites

### Python Version
```bash
# Check Python version (need 3.8+)
python3 --version
# Should show: Python 3.8.x or higher
```

### System Requirements
- macOS, Linux, or Windows
- 4GB+ RAM recommended
- Internet connection (for optional features)

---

## 2. Install Dependencies

### Core Installation
```bash
# Navigate to project directory
cd /Users/machd/sergik_custom_gpt

# Install Python dependencies
pip install -r requirements.txt
```

### Optional: Audio Analysis Tools
```bash
# For MusicBrainz metadata lookup (optional)
pip install musicbrainzngs pyacoustid

# Set AcoustID API key (optional, get free key at https://acoustid.org/api-key)
export ACOUSTID_API_KEY="your_api_key_here"
```

### Verify Installation
```bash
# Run verification script
python scripts/verify_install.py
```

---

## 3. Database Setup

The app uses SQLite by default (no setup needed). The database will be created automatically on first run.

```bash
# Database will be created at: sergik_ml.db
# No manual setup required - it's automatic!
```

### Optional: PostgreSQL (for production)
```bash
# Set environment variable
export SERGIK_DB_URL="postgresql://user:password@localhost/sergik_ml"

# Create database
createdb sergik_ml
```

---

## 4. Configuration

### Default Configuration (Works Out of the Box)

The app works with defaults - no configuration needed for basic use:

- **Backend**: `http://127.0.0.1:8000`
- **Database**: `sqlite:///sergik_ml.db` (auto-created)
- **OSC Port**: `9000` (for Ableton Live)

### Optional Environment Variables

Create a `.env` file (optional) or set environment variables:

```bash
# .env file (optional)
SERGIK_HOST=127.0.0.1
SERGIK_PORT=8000
SERGIK_DB_URL=sqlite:///sergik_ml.db
SERGIK_ABLETON_OSC_PORT=9000
SERGIK_ARTIFACT_DIR=artifacts
SERGIK_DATA_DIR=data

# Optional: OpenAI for voice features
OPENAI_API_KEY=your_key_here
SERGIK_USE_OPENAI_VOICE=false
```

---

## 5. Start the Backend Server

### Start SERGIK ML API (Required)

```bash
# Start the main backend server
python run_server.py
```

You should see:
```
================================================================================
   _____ ______ _____   _____ _____ _  __    __  __ _
  / ____|  ____|  __ \ / ____|_   _| |/ /   |  \/  | |
 | (___ | |__  | |__) | |  __  | | | ' /    | \  / | |
  \___ \|  __| |  _  /| | |_ | | | |  <     | |\/| | |
  ____) | |____| | \ \| |__| |_| |_| . \    | |  | | |____
 |_____/|______|_|  \_\\_____|_____|_|\\_\   |_|  |_|______|

             100% PROPRIETARY MACHINE LEARNING
================================================================================
  Host:          127.0.0.1
  Port:          8000
  ...
```

### Verify Backend is Running

```bash
# Test health endpoint
curl http://127.0.0.1:8000/health

# Should return:
# {"status":"ok","service":"sergik-ml","version":"1.0.0",...}
```

---

## 6. Start Agent System (Optional)

The agent system provides AI assistance but is optional for basic functionality.

```bash
# In a new terminal
python sergik_ai_team/main.py
```

This starts the agent system on port 8001.

---

## 7. Load Max for Live Controller

### In Ableton Live

1. Open Ableton Live
2. Create a new MIDI track
3. Load the SERGIK AI Controller device:
   - Navigate to: `maxforlive/SERGIK_AI_Controller.js`
   - Or use the Max for Live device file if available
4. The controller will automatically connect to `http://127.0.0.1:8000`

### Verify Connection

The controller will show connection status:
- ✅ **Connected** - Backend is reachable
- ❌ **Disconnected** - Check if backend is running

---

## 8. Test the Connection

### Quick Test
```bash
# Run connection test script
python test_connection.py
```

This tests all frontend endpoints to ensure everything is connected.

### Manual Test
```bash
# Test health
curl http://127.0.0.1:8000/health

# Test GPT health
curl http://127.0.0.1:8000/gpt/health

# Test drum generation
curl -X POST http://127.0.0.1:8000/drums/generate \
  -H "Content-Type: application/json" \
  -d '{
    "genre": "house",
    "bars": 4,
    "tempo": 125,
    "swing": 0,
    "humanize": 0,
    "density": 1.0,
    "output_format": "midi"
  }'
```

---

## 9. Directory Structure

Ensure these directories exist (they're created automatically):

```
sergik_custom_gpt/
├── artifacts/          # Model artifacts (auto-created)
├── data/              # Data files (auto-created)
│   ├── catalog/       # Music catalog
│   ├── analysis/      # Analysis results
│   └── knowledge/     # Knowledge base
├── sergik_ml.db       # SQLite database (auto-created)
├── maxforlive/        # Max for Live controller
└── sergik_ml/         # Backend code
```

---

## 10. Troubleshooting

### Backend Won't Start

**Problem**: `ModuleNotFoundError` or import errors

**Solution**:
```bash
# Reinstall dependencies
pip install -r requirements.txt

# Check Python path
python3 -c "import sergik_ml; print(sergik_ml.__file__)"
```

### Connection Refused

**Problem**: Frontend can't connect to backend

**Solution**:
1. Verify backend is running: `curl http://127.0.0.1:8000/health`
2. Check firewall settings
3. Verify port 8000 is not in use: `lsof -i :8000`

### Database Errors

**Problem**: Database connection fails

**Solution**:
```bash
# Delete and recreate database (SQLite)
rm sergik_ml.db
python run_server.py  # Will recreate automatically
```

### Port Already in Use

**Problem**: Port 8000 is already in use

**Solution**:
```bash
# Use different port
export SERGIK_PORT=8002
python run_server.py

# Update frontend to use new port
# In Max for Live: set_api 127.0.0.1 8002
```

### Missing Dependencies

**Problem**: Import errors for specific modules

**Solution**:
```bash
# Install specific missing package
pip install <package_name>

# Or reinstall all
pip install -r requirements.txt --upgrade
```

---

## 11. Optional Features Setup

### Voice Control (OpenAI)

```bash
# Set OpenAI API key
export OPENAI_API_KEY="your_key_here"
export SERGIK_USE_OPENAI_VOICE=true
```

### MusicBrainz Integration

```bash
# Install MusicBrainz packages
pip install musicbrainzngs pyacoustid

# Set AcoustID API key (optional)
export ACOUSTID_API_KEY="your_key_here"
```

### PostgreSQL (Production)

```bash
# Install PostgreSQL driver
pip install psycopg2-binary

# Set database URL
export SERGIK_DB_URL="postgresql://user:pass@localhost/sergik_ml"
```

---

## 12. Development Mode

### Enable Development Features

```bash
export SERGIK_ENV=dev
export SERGIK_ALLOWED_ORIGINS="*"
```

### Run with Auto-Reload

```bash
# Backend with auto-reload
uvicorn sergik_ml.api.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 13. Production Deployment

### Environment Variables

```bash
export SERGIK_ENV=prod
export SERGIK_ALLOWED_ORIGINS="https://yourdomain.com"
export SERGIK_DB_URL="postgresql://user:pass@localhost/sergik_ml"
export SERGIK_HOST=0.0.0.0
export SERGIK_PORT=8000
```

### Run with Production Server

```bash
# Use gunicorn for production
pip install gunicorn
gunicorn sergik_ml.api.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 14. Quick Reference

### Start Everything
```bash
# Terminal 1: Backend
python run_server.py

# Terminal 2: Agents (optional)
python sergik_ai_team/main.py

# Terminal 3: Test
python test_connection.py
```

### Stop Everything
```bash
# Press Ctrl+C in each terminal
# Or kill processes:
pkill -f "run_server.py"
pkill -f "sergik_ai_team/main.py"
```

### Check Status
```bash
# Backend health
curl http://127.0.0.1:8000/health

# Agent system health
curl http://127.0.0.1:8001/health
```

---

## 15. Next Steps

Once everything is running:

1. ✅ **Test Connection**: `python test_connection.py`
2. ✅ **Load Controller**: Open Max for Live device in Ableton
3. ✅ **Generate Music**: Try generating chords, bass, or drums
4. ✅ **Explore API**: Visit `http://127.0.0.1:8000/docs` for API documentation

---

## Support

If you encounter issues:

1. Check logs in terminal output
2. Run `python test_connection.py` to diagnose
3. Check `docs/BACKEND_FRONTEND_CONNECTION.md` for connection details
4. Review `README.md` for feature documentation

---

## Summary

**Minimum Required:**
1. Install dependencies: `pip install -r requirements.txt`
2. Start backend: `python run_server.py`
3. Load Max for Live controller in Ableton

**That's it!** The app will work with these three steps. Everything else is optional.

