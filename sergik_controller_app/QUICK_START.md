# SERGIK AI Controller - Quick Start

Get the standalone app running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- SERGIK ML API server running

## Setup

### 1. Install Dependencies

```bash
cd sergik_controller_app
npm install
```

### 2. Start SERGIK ML API

In a separate terminal:

```bash
cd /path/to/sergik_custom_gpt
python -m sergik_ml.serving.api
```

### 3. Launch the App

```bash
npm start
```

## First Use

1. **Check Connection:**
   - Top-left should show "Connected" (green dot)
   - If "Disconnected", check API server is running

2. **Test Voice Control:**
   - Hold the 🎤 button
   - Say "Set tempo to 125"
   - Release button
   - Check response in voice status area

3. **Generate MIDI:**
   - Set Key: 10B
   - Set Bars: 8
   - Click "Chords" button
   - Check status log for result

4. **Control Ableton:**
   - Type "play" in command input
   - Click "Execute"
   - Or use transport buttons

## Troubleshooting

**App won't start:**
- Check Node.js version: `node --version` (need 18+)
- Try: `npm install` again

**Connection failed:**
- Verify API server: `curl http://127.0.0.1:8000/health`
- Check settings: Click ⚙️ → Verify API URL

**Voice not working:**
- Check microphone permissions
- Try in browser first to test mic

**Commands not executing:**
- Ensure Ableton Live is running
- Check OSC is enabled (port 9000)

## Next Steps

- Read full [README.md](README.md) for detailed features
- Explore voice commands
- Try natural language generation
- Customize settings

