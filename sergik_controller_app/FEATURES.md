# SERGIK AI Controller - Features Documentation

## Overview
The Electron app now matches the preview design with all intended features implemented.

## Tab Features

### 🎹 Create Tab
- **Generation Controls**
  - Audio/MIDI toggles
  - 8 generation buttons: Kicks, Claps & Snares, Hats & Shakers, Percussion, Bass, Synths & Sounds, Vocals, FX
  - Track controls: Create, Delete, Arm, Mute, Solo, Rename

- **Display Screen**
  - Status indicator with LED
  - Idea input field
  - Genre selector (with sub-genre support)
  - Tempo selector with "Follow Live" toggle
  - Energy selector (1-10 scale)
  - Intelligence selector (with sub-categories)
  - Key selector (Camelot wheel notation)
  - Scale selector (Major, Minor, Dorian, Phrygian, Lydian, Mixolydian, Locrian, Harmonic Minor, Melodic Minor, Pentatonic scales, Blues)
  - Target track selector
  - Slot selector

- **Input Methods**
  - File upload (drag & drop or browse)
  - URL input (YouTube, SoundCloud, direct audio URLs)
  - Microphone recording (push-to-talk)
  - Command input (natural language)

- **Transport Controls**
  - Rewind, Stop, Play, Record, Forward

### 🔍 Analyze Tab
- **View Modes**
  - SERGIK DNA: DNA score gauge, genre bars, production tips
  - MusicBrainz: Track metadata, artist, album, tags
  - Features: BPM, Key, Energy, LUFS, Spectral Centroid, Stereo Width

- **Analysis Controls**
  - Analyze File
  - Analyze URL
  - DNA Match
  - Export results

- **Commit Section**
  - Placement indicator
  - Commit to Track button (enabled when slot is selected)

### 📚 Library Tab
- **Media Browser**
  - Search with syntax: `BPM:120, key:C, name:kick`
  - Filter chips: All, Audio, MIDI, Variables, Recent
  - Media groups: Recent, Variables, All Media (collapsible)
  - Media navigation: Previous, Next, Random
  - Media list with selection

- **Editor Views**
  - **Waveform Editor**
    - Warp toggle and mode selector
    - Gain control (-12 to +12 dB)
    - Transpose control (-48 to +48 semitones)
    - Clip color picker
    - Launch mode, quantization, follow action
    - Waveform canvas
    - Info bar (length, selection, BPM, sample rate)

  - **Piano Roll Editor**
    - Grid display toggle
    - Note names toggle
    - Scale highlight with selector
    - Piano keys mini view
    - MIDI note canvas
    - Velocity lane
    - CC lanes
    - Info bar (velocity, quantization, fold octaves)

  - **Timeline Editor**
    - Timeline ruler
    - Track headers with controls (Mute, Solo, Arm)
    - Track volume faders
    - Track lanes for clips
    - Automation lanes
    - Info bar (track count, clip count, track height)

- **Toolbar**
  - Tools: Select, Cut, Fade
  - Editor views: Waveform, Piano Roll, Timeline
  - Zoom controls

- **Actions Panel**
  - Insert, Replace, Commit, Duplicate buttons
  - Copy, Paste buttons
  - Preview controls (Play, Stop, Loop)
  - Clip info display (BPM, Key, Length)

### 🤖 AI Tab
- **Chat Interface**
  - User and AI message bubbles
  - Timestamp display
  - Clear chat button

- **Quick Actions**
  - Suggest Genre
  - DNA Match
  - Find Similar
  - Optimize Mix

- **Smart Features**
  - Suggestion cards with match scores
  - Workflow automation:
    - Auto-Organize
    - Batch Export
    - DNA Analysis
  - Create Workflow button

- **Performance Analytics**
  - CPU usage with visual bar
  - RAM usage with visual bar

## API Integration

The app uses `window.sergikAPI` exposed via preload.js:

- `checkHealth()` - Check API connection
- `gptGenerate(prompt)` - GPT generation
- `generateChords(params)` - Generate chord progressions
- `generateBass(params)` - Generate bass lines
- `generateArps(params)` - Generate arpeggios
- `generateDrums(params)` - Generate drum patterns
- `processVoice(audioBuffer)` - Process voice recordings
- `liveCommand(command)` - Send commands to Ableton Live
- `getSessionState()` - Get Ableton Live session state
- `setRecording(recording)` - Set recording state

## Styling

- Ableton-style dark theme
- Color accents: Orange (#ff764d), Cyan (#00d4aa), Purple (#a855f7), Yellow (#ffb800)
- JetBrains Mono font for monospace elements
- Responsive grid layouts
- Smooth transitions and animations

## Status Indicators

- Connection status LED (green = connected, red = disconnected, pulsing = connecting)
- Status text display
- Action list with color-coded entries (success, error, info)

## Next Steps for Backend Integration

1. **Library Tab**
   - Connect media search to API
   - Implement media loading into editors
   - Connect action buttons to Ableton Live

2. **Analyze Tab**
   - Connect file/URL analysis to API
   - Implement DNA matching
   - Connect commit functionality

3. **AI Tab**
   - Connect chat to GPT API
   - Implement quick actions
   - Connect workflow execution

4. **Create Tab**
   - Connect generation buttons to API
   - Implement sub-genre population based on genre
   - Connect intelligence sub-categories

## Running the App

```bash
cd sergik_controller_app
npm start
```

For development with DevTools:
```bash
npm run dev
```

## Building

```bash
npm run build        # Build for current platform
npm run build:mac    # Build for macOS
npm run build:win    # Build for Windows
npm run build:linux  # Build for Linux
```

