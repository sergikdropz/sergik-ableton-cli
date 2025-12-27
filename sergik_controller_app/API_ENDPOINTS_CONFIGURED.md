# SERGIK AI Controller - API Endpoints Configuration

## ✅ All API Endpoints Configured

All API endpoints have been properly configured and are available through the `window.sergikAPI` interface.

## API Base URL

**Default:** `http://127.0.0.1:8000`

The API URL can be configured in Settings (⚙️ button) or will use the default if not set.

## Available Endpoints

### Health & Status
- ✅ `checkHealth()` - Check API server health
- ✅ `checkGptHealth()` - Check GPT integration health

### Voice Control
- ✅ `processVoice(audioBuffer)` - Process voice input
- ✅ `setRecording(recording)` - Set recording state
- ✅ `getRecording()` - Get recording state

### GPT Generation
- ✅ `gptGenerate(prompt)` - Natural language MIDI generation
- ✅ `gptDrums(prompt)` - Natural language drum generation
- ✅ `gptAnalyze(filePath)` - DNA analysis via GPT

### MIDI Generation
- ✅ `generateChords(params)` - Generate chord progression
- ✅ `generateBass(params)` - Generate walking bass
- ✅ `generateArps(params)` - Generate arpeggios
- ✅ `generateDrums(params)` - Generate drum pattern
- ✅ `getDrumGenres()` - Get available drum genres

### Ableton Live Control
- ✅ `liveCommand(command)` - Execute natural language command
- ✅ `getSessionState()` - Get current session state

### Track Management
- ✅ `createTrack(params)` - Create new track
- ✅ `deleteTrack(trackIndex)` - Delete track
- ✅ `getTracks()` - Get all tracks

### Clip Management
- ✅ `createClip(params)` - Create clip
- ✅ `fireClip(params)` - Fire clip
- ✅ `stopClip(params)` - Stop clip
- ✅ `duplicateClip(params)` - Duplicate clip
- ✅ `setClipNotes(params)` - Set MIDI notes
- ✅ `getClipNotes(trackIndex, slotIndex)` - Get clip notes

### Browser/Library
- ✅ `browserSearch(query)` - Search library
- ✅ `browserLoad(params)` - Load item from browser

### Transport Control
- ✅ `transportAction(action)` - Transport control (play, stop, record, etc.)
- ✅ `setTempo(tempo)` - Set session tempo

### Scene Management
- ✅ `fireScene(sceneIndex)` - Fire scene
- ✅ `createScene(params)` - Create scene

### Analysis
- ✅ `analyzeUpload(filePath)` - Analyze uploaded file
- ✅ `analyzeUrl(url)` - Analyze from URL
- ✅ `analyzeBatch(params)` - Batch analyze multiple files
- ✅ `selectFileForAnalysis()` - Select file for analysis

### Organization
- ✅ `organizeAutoOrganize(params)` - Auto-organize files by genre/BPM/key
- ✅ `organizePreview(params)` - Preview organization without moving files

### Transform (MIDI/Audio)
- ✅ `transformQuantize(params)` - Quantize MIDI notes
- ✅ `transformTranspose(params)` - Transpose MIDI notes
- ✅ `transformVelocity(params)` - Adjust velocity
- ✅ `transformLegato(params)` - Make notes legato
- ✅ `transformRemoveOverlaps(params)` - Remove overlapping notes
- ✅ `transformFade(params)` - Apply fade in/out
- ✅ `transformNormalize(params)` - Normalize audio
- ✅ `transformTimeStretch(params)` - Time stretch audio
- ✅ `transformPitchShift(params)` - Pitch shift audio
- ✅ `transformTimeShift(params)` - Time shift clip

### Export
- ✅ `exportTrack(params)` - Export track/clip to audio
- ✅ `exportBatch(params)` - Batch export multiple tracks
- ✅ `exportStems(params)` - Export track as stems

### Library Management
- ✅ `saveMidiToLibrary(midiData, filename)` - Save MIDI to library
- ✅ `saveAudioToLibrary(audioData, filename)` - Save audio to library
- ✅ `saveAnalysisToLibrary(analysisData, filename)` - Save analysis to library
- ✅ `getLibraryPath()` - Get library directory path
- ✅ `listLibraryFiles(subdir)` - List library files
- ✅ `getMediaStoragePath()` - Get media storage path
- ✅ `listMediaStorageFiles(options)` - List media storage files

### API Configuration
- ✅ `getApiUrl()` - Get current API URL
- ✅ `getApiBaseUrl()` - Get current API base URL (alias)
- ✅ `setApiUrl(url)` - Set API URL
- ✅ `getApiSettings()` - Get API settings
- ✅ `setApiSettings(settings)` - Set API settings

### API Key Management
- ✅ `getApiKey(service)` - Get API key for service
- ✅ `setApiKey(service, key)` - Set API key for service
- ✅ `deleteApiKey(service)` - Delete API key
- ✅ `listApiKeys()` - List all API keys
- ✅ `getApiKeysInfo()` - Get API keys info

## Usage Examples

### Generate MIDI
```javascript
const result = await window.sergikAPI.generateChords({
  key: '10B',
  bars: 8,
  voicing: 'stabs',
  tempo: 125
});
```

### Analyze File
```javascript
const fileResult = await window.sergikAPI.selectFileForAnalysis();
if (fileResult.success) {
  const analysis = await window.sergikAPI.analyzeUpload(fileResult.filePath);
}
```

### Control Ableton
```javascript
await window.sergikAPI.transportAction('play');
await window.sergikAPI.setTempo(128);
await window.sergikAPI.liveCommand('Create MIDI track called Lead');
```

### Transform MIDI
```javascript
await window.sergikAPI.transformQuantize({
  track_index: 0,
  clip_slot: 0,
  grid: '16th',
  strength: 100
});
```

## Connection Status

The app automatically checks connection status every 10 seconds. The status LED in the top-left shows:
- 🟢 **Green** = Connected
- 🔴 **Red** = Disconnected

## Settings

Access settings via the ⚙️ button to configure:
- API URL
- Timeouts
- Authentication
- API Keys
- Ngrok configuration

## Notes

- All endpoints use the enhanced API client with retry logic and error handling
- API keys are encrypted and stored securely
- Settings are persisted in userData directory
- Connection status is monitored automatically

