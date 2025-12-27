# SERGIK AI Controller - Standalone App

A standalone desktop application that bridges voice control, GPT Actions, and Ableton Live for complete music production control.

## Features

- 🎤 **Voice Control** - Push-to-talk voice commands for Ableton Live
- 🎹 **MIDI Generation** - Generate chords, bass, arpeggios, and drums
- 🎛️ **Ableton Control** - Full transport, track, and device control
- 🤖 **GPT Integration** - Natural language commands via SERGIK GPT Actions
- 📊 **Session Monitoring** - Real-time Ableton Live session state
- ⚙️ **Configurable** - Customizable API endpoints and settings

## Architecture

```
┌─────────────────────┐
│  Electron App       │
│  (Standalone)        │
└──────────┬──────────┘
           │
           ├─→ Voice Input (Microphone)
           ├─→ UI Controls (Buttons, Inputs)
           │
           ▼
┌─────────────────────┐
│  SERGIK ML API      │
│  (Port 8000)        │
└──────────┬──────────┘
           │
           ├─→ GPT Actions
           ├─→ Voice Pipeline
           └─→ Ableton Control
           │
           ▼
┌─────────────────────┐
│  Ableton Live       │
│  (OSC/LOM)          │
└─────────────────────┘
```

## Installation

### Prerequisites

- Node.js 18+ and npm
- SERGIK ML API server running (port 8000)
- Ableton Live with OSC enabled (optional, for full control)

### Setup

1. **Install Dependencies:**

```bash
cd sergik_controller_app
npm install
```

2. **Start the App:**

```bash
# Development mode
npm start

# Or with dev tools
npm run dev
```

3. **Build for Distribution:**

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

## Usage

### Starting the App

1. **Ensure SERGIK ML API is running:**
   ```bash
   python -m sergik_ml.serving.api
   ```

2. **Launch the app:**
   ```bash
   npm start
   ```

3. **Check connection status** (top-left corner should show "Connected")

### Voice Control

1. **Hold the microphone button** to record
2. **Speak your command** (e.g., "Set tempo to 125", "Generate tech house drums")
3. **Release the button** to process
4. **View response** in the voice status area

### MIDI Generation

1. **Set parameters:**
   - Key (e.g., 10B, 7A)
   - Bars (1-32)
   - Style (house, techno, etc.)

2. **Click generation buttons:**
   - Chords
   - Bass
   - Arps
   - Drums

3. **Or use natural language:**
   - Type in the natural language field
   - Click "Generate" or press Enter

### Ableton Live Control

1. **Transport:**
   - Click Play/Stop/Record buttons
   - Set tempo and click "Set"

2. **Commands:**
   - Type commands in the command input
   - Examples:
     - "Create MIDI track called Lead"
     - "Mute track 2"
     - "Fire scene 4"
     - "Load Wavetable on track 1"

3. **Session Info:**
   - View current tempo, tracks, scenes
   - Click "Refresh" to update

## Configuration

### API Settings

1. Click **⚙️ Settings** button
2. Enter API Base URL (default: `http://127.0.0.1:8000`)
3. Click **Save**

### Voice Input

The app uses your system's default microphone. Make sure:
- Microphone permissions are granted
- Default input device is set correctly
- Microphone is not muted

## Example Commands

### Voice Commands

- "Set tempo to 125"
- "Play"
- "Stop"
- "Generate tech house drums"
- "Create a MIDI track called Lead Synth"
- "Mute track 2"
- "Fire scene 4"

### Natural Language

- "Generate tech house chords in D minor"
- "Create a walking bass line in 10B"
- "Make 8 bars of minimal techno drums"
- "Generate arpeggios going upward"

### Ableton Commands

- "Create MIDI track"
- "Load Wavetable on track 1"
- "Set track 2 volume to 0.8"
- "Fire clip on track 0, slot 1"

## Troubleshooting

### Connection Issues

**Problem:** Status shows "Disconnected"

**Solutions:**
1. Verify SERGIK ML API is running: `curl http://127.0.0.1:8000/health`
2. Check API URL in settings
3. Check firewall settings

### Voice Not Working

**Problem:** Voice recording fails

**Solutions:**
1. Check microphone permissions
2. Verify default input device
3. Check browser/system audio settings

### Commands Not Executing

**Problem:** Commands sent but nothing happens

**Solutions:**
1. Verify Ableton Live is running
2. Check OSC is enabled (port 9000)
3. Check Ableton Live OSC settings
4. Review API server logs

## Development

### Project Structure

```
sergik_controller_app/
├── main.js          # Electron main process
├── preload.js       # Preload script (IPC bridge)
├── index.html       # UI structure
├── styles.css       # Styles
├── renderer.js      # UI logic
├── package.json     # Dependencies
└── assets/          # Icons, images
```

### Adding Features

1. **New API Endpoint:**
   - Add handler in `main.js` (IPC handler)
   - Expose in `preload.js`
   - Use in `renderer.js`

2. **UI Changes:**
   - Modify `index.html` for structure
   - Update `styles.css` for styling
   - Add logic in `renderer.js`

## Building

### macOS

```bash
npm run build:mac
# Output: dist/SERGIK AI Controller-1.0.0.dmg
```

### Windows

```bash
npm run build:win
# Output: dist/SERGIK AI Controller Setup 1.0.0.exe
```

### Linux

```bash
npm run build:linux
# Output: dist/SERGIK AI Controller-1.0.0.AppImage
```

## Integration with Max for Live

This standalone app can work alongside the Max for Live device:

- **Standalone App:** Full UI, voice control, session monitoring
- **Max for Live Device:** Integrated in Ableton Live, MIDI generation

Both connect to the same SERGIK ML API server.

## Future Enhancements

- [ ] Real-time MIDI visualization
- [ ] Clip editor with note display
- [ ] Preset management
- [ ] Multi-track control panel
- [ ] Audio waveform display
- [ ] Custom keyboard shortcuts
- [ ] Plugin browser integration

## Support

For issues:
1. Check API server logs
2. Review app console (DevTools: Cmd+Option+I / Ctrl+Shift+I)
3. Verify Ableton Live OSC settings
4. Check connection status indicator

## License

MIT License - See LICENSE file

