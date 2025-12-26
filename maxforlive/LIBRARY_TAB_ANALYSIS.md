# Library Tab Analysis - Max for Live Device Development

## Overview
The Library Tab in the SERGIK AI Controller Preview provides a comprehensive media browser and management system for searching, previewing, and loading audio samples, MIDI files, and other media into Ableton Live.

## Core Components

### 1. UI Structure

#### Browser Panel (Left Side)
- **Search Input**: `#media-search` with placeholder "Search... (BPM:120, key:C, name:kick)"
- **Filter Bar**: Genre, type, and metadata filters
- **Browser List**: Scrollable list of media items (`.browser-item`)

#### Media Items (`.browser-item`)
Each item has:
- `data-media-id`: Unique identifier
- `data-media-type`: "audio" or "midi"
- `data-media-path`: File path (optional)
- `data-bpm`: BPM metadata (optional)
- `data-key`: Key metadata (optional)
- Display elements:
  - Icon (`.item-icon`)
  - Name (`.item-name`)
  - Type badge (`.item-type`)
  - Time/duration (`.item-time`)
  - Status badges (`.media-status-badge`)

#### Editor Panel (Right Side)
- Waveform editor (for audio)
- Piano roll editor (for MIDI)
- Timeline editor
- Clip properties panel

### 2. JavaScript Classes & Functions

#### MediaLoader Class
**Location**: Lines ~8147-8400

**Key Methods**:
- `loadMediaIntoEditor(mediaId, editorType)`: Loads media into specified editor
- `preloadMedia(mediaId)`: Preloads media data for faster access
- `fetchMediaData(media)`: Fetches media data (samples, notes, metadata)
- `getMediaById(mediaId)`: Retrieves media object from DOM
- `updateMediaItemState(mediaId, state)`: Updates visual state (selected, loaded, playing, loading, error)
- `sendToMax(command, ...args)`: Sends commands to Max for Live device

**State Management**:
- `currentMedia`: Currently loaded media ID
- `mediaHistory`: Array of loaded media IDs
- `loadedMedia`: Map of loaded media cache
- `mediaCache`: Map of media data cache

#### MediaItemInteraction Class
**Location**: Lines ~8400-8600

**Key Methods**:
- `setupInteractions()`: Sets up click, double-click, keyboard navigation
- Handles single-click (select), double-click (load), keyboard navigation

**Interaction Patterns**:
- **Single Click**: Selects item, shows preview
- **Double Click**: Loads media into editor
- **Enter Key**: Loads selected item
- **Arrow Keys**: Navigate through items
- **Escape**: Deselects item

### 3. Search Functionality

#### Search Syntax
The search input supports structured queries:
- `BPM:120` - Filter by BPM
- `key:C` - Filter by musical key
- `name:kick` - Filter by name/pattern
- `genre:house` - Filter by genre
- Multiple filters can be combined

#### Search Implementation
- Real-time search with debouncing
- Filters browser items based on query
- Highlights matching items
- Shows result count

### 4. Media States

#### Visual States (CSS Classes)
- `.selected`: Item is currently selected
- `.loaded`: Media has been loaded into editor
- `.playing`: Media is currently playing
- `.loading`: Media is being loaded
- `.error`: Error occurred loading media
- `.hover`: Mouse hover state
- `.dragging`: Item is being dragged

### 5. Max for Live Integration

#### Commands Sent to Max
Based on `SERGIK_AI_Controller.js`:

1. **search_library** (query)
   - Searches Ableton Live browser
   - API: `GET /live/browser/search?query={query}`
   - Returns: `{count, results: [{path, name, type, ...}]}`

2. **load_sample** (trackIndex, samplePath)
   - Loads sample into track
   - API: `POST /live/browser/load`
   - Body: `{item_path: samplePath, track_index: trackIndex}`
   - Returns: `{status, track_index, item_path}`

3. **hot_swap** (trackIndex, deviceIndex, samplePath)
   - Hot-swaps sample in device
   - API: `POST /live/browser/hot_swap`
   - Body: `{track_index, device_index, sample_path}`
   - Returns: `{status, track_index, device_index}`

### 6. Editor Integration

#### Waveform Editor (Audio)
When audio is loaded:
- Displays waveform visualization
- Shows BPM, key, sample rate
- Allows clip editing
- Updates clip properties panel

#### Piano Roll Editor (MIDI)
When MIDI is loaded:
- Displays MIDI notes
- Shows note grid
- Allows note editing
- Updates timeline

### 7. Data Flow

```
User Action → MediaItemInteraction → MediaLoader → API Call → Max for Live
     ↓              ↓                    ↓            ↓            ↓
  Click/Double   Select Item      Fetch Data    HTTP Request  Live Object Model
     ↓              ↓                    ↓            ↓            ↓
  Visual Update  State Change    Cache Data    Response      Load Sample
```

### 8. Required API Endpoints

For full functionality, the Max device needs to implement:

#### GET /live/browser/search
**Query Parameters**:
- `query`: Search query string (supports BPM:120, key:C, name:kick syntax)

**Response**:
```json
{
  "status": "ok",
  "count": 10,
  "results": [
    {
      "path": "/path/to/sample.wav",
      "name": "Kick Drum",
      "type": "audio",
      "bpm": 120,
      "key": "C",
      "duration": 4.0,
      "sample_rate": 44100
    }
  ]
}
```

#### POST /live/browser/load
**Body**:
```json
{
  "item_path": "/path/to/sample.wav",
  "track_index": 0
}
```

**Response**:
```json
{
  "status": "ok",
  "track_index": 0,
  "item_path": "/path/to/sample.wav",
  "clip_slot": 0
}
```

#### POST /live/browser/hot_swap
**Body**:
```json
{
  "track_index": 0,
  "device_index": 0,
  "sample_path": "/path/to/sample.wav"
}
```

**Response**:
```json
{
  "status": "ok",
  "track_index": 0,
  "device_index": 0,
  "sample_path": "/path/to/sample.wav"
}
```

### 9. Implementation Checklist for Max Device

#### Frontend (Max for Live UI)
- [ ] Create browser panel UI (search input, filter bar, item list)
- [ ] Implement media item rendering with metadata
- [ ] Add click/double-click handlers
- [ ] Implement keyboard navigation
- [ ] Add visual state indicators (selected, loaded, playing)
- [ ] Create search input with syntax support
- [ ] Implement filter UI (genre, type, BPM range, key)

#### Backend (JavaScript)
- [ ] Implement `searchLibrary(query)` function
- [ ] Implement `loadSample(trackIndex, samplePath)` function
- [ ] Implement `hotSwapSample(trackIndex, deviceIndex, samplePath)` function
- [ ] Create MediaLoader class
- [ ] Create MediaItemInteraction class
- [ ] Implement search parsing (BPM:120, key:C, name:kick)
- [ ] Add media caching system
- [ ] Implement state management

#### Live Object Model Integration
- [ ] Access Ableton Live browser via LOM
- [ ] Search browser items
- [ ] Load samples into tracks
- [ ] Hot-swap samples in devices
- [ ] Get media metadata (BPM, key, duration)

#### API Integration
- [ ] Connect to SERGIK ML API endpoints
- [ ] Handle HTTP requests/responses
- [ ] Parse search results
- [ ] Update UI with results
- [ ] Handle errors gracefully

### 10. Key Features to Implement

1. **Search & Filter**
   - Real-time search with debouncing
   - Structured query syntax
   - Multiple filter types
   - Result highlighting

2. **Media Preview**
   - Audio waveform preview
   - MIDI note preview
   - Metadata display
   - Playback controls

3. **Loading System**
   - Single-click select
   - Double-click load
   - Keyboard shortcuts
   - Loading states

4. **Editor Integration**
   - Waveform editor for audio
   - Piano roll for MIDI
   - Timeline synchronization
   - Clip properties

5. **State Management**
   - Selected item tracking
   - Loaded media cache
   - History navigation
   - Error handling

### 11. Example Usage Flow

1. User types "BPM:120 key:C" in search
2. System searches Ableton browser + SERGIK catalog
3. Results displayed in browser list
4. User clicks item → selected, preview shown
5. User double-clicks → media loaded into editor
6. MediaLoader fetches data, updates editor
7. Command sent to Max: `load_sample 0 "/path/to/file.wav"`
8. Max device loads sample into track 0
9. UI updates: item marked as "loaded", editor shows waveform

### 12. Technical Notes

- **Caching**: Media data is cached to avoid redundant API calls
- **Debouncing**: Search input is debounced (300ms) for performance
- **State Classes**: CSS classes used for visual state management
- **Event Delegation**: Click handlers use event delegation for dynamic items
- **Max Communication**: Uses `maxComms.sendCommand()` or console.log fallback

### 13. Additional Implementation Details

#### Media Groups Structure
The library organizes items into collapsible groups:
- **Recent Group**: Recently used media items
- **Variables Group**: Variable/parameter items
- **All Media Group**: Complete media list (default active)

Each group has:
- Header with title, count, and toggle button
- Items container (`.group-items`)
- Collapsible/expandable functionality

#### Keyboard Navigation Class
**MediaKeyboardNavigation** (Lines ~8600-8800):
- `navigateNext()`: Move to next item
- `navigatePrevious()`: Move to previous item
- `loadSelected()`: Load currently selected item
- `previewSelected()`: Preview selected item (500ms)
- `loadPreviousMedia()`: Load from history (back)
- `loadNextMedia()`: Load from history (forward)
- `loadRandomMedia()`: Load random item

#### Filter System
Filter chips in filter bar:
- `data-filter="all"`: Show all media
- `data-filter="audio"`: Audio files only
- `data-filter="midi"`: MIDI files only
- `data-filter="variables"`: Variables only
- `data-filter="recent"`: Recent items only

#### Media Navigation Controls
Compact navigation bar:
- Previous button (`#prev-media`): Load previous item
- Position indicator: `current-index / total-count`
- Next button (`#next-media`): Load next item
- Random button (`#random-media`): Load random item

#### Editor Toolbar
Tool selection buttons:
- Select tool (`data-tool="select"`): Default selection mode
- Cut tool (`data-tool="cut"`): Cut audio/MIDI at cursor
- Fade tool (`data-tool="fade"`): Apply fade in/out
- Waveform editor (`data-tool="waveform"`): Switch to waveform view
- Piano roll editor (`data-tool="piano"`): Switch to piano roll view
- Timeline editor (`data-tool="timeline"`): Switch to timeline view
- Zoom controls: Zoom in/out buttons

#### Search Suggestions
Search input has suggestions dropdown (`#search-suggestions`):
- Shows matching items as user types
- Clickable suggestions
- Auto-complete functionality

### 14. Max for Live Implementation Requirements

#### UI Components Needed

1. **Browser Panel** (Left Side):
   - Search input field
   - Clear search button (×)
   - Filter chips (All, Audio, MIDI, Variables, Recent)
   - Media groups (collapsible)
   - Browser list (scrollable)
   - Media navigation bar

2. **Editor Panel** (Right Side):
   - Toolbar with tool buttons
   - Waveform editor canvas
   - Piano roll editor canvas
   - Timeline editor canvas
   - Clip properties panel

3. **Media Item Display**:
   - Icon (emoji or image)
   - Name text
   - Type badge
   - Duration/time
   - Status badges (loaded, playing, etc.)

#### JavaScript Functions to Implement

```javascript
// Search functionality
function performSearch(query) {
    // Parse query (BPM:120, key:C, name:kick)
    // Call API: GET /live/browser/search?query={query}
    // Update browser list with results
    // Highlight matching items
}

// Media loading
function loadMediaItem(mediaId) {
    // Get media data
    // Determine editor type (audio → waveform, midi → piano-roll)
    // Load into editor
    // Update state (selected, loaded)
    // Send to Max: load_sample trackIndex path
}

// Filter functionality
function applyFilter(filterType) {
    // Filter browser items by type
    // Update filter chip states
    // Show/hide groups
}

// Navigation
function navigateMedia(direction) {
    // direction: 'next', 'prev', 'random'
    // Update selection
    // Load if auto-load enabled
}
```

#### Live Object Model Integration

For browser search in Max:
```javascript
// Access Ableton browser
var browser = new LiveAPI("live_set browser");
// Search items
var results = browser.call("search", query);
// Get item path
var itemPath = browser.get("selected_item_path");
// Load into track
var track = new LiveAPI("live_set tracks " + trackIndex);
track.call("load_item", itemPath);
```

### 15. API Endpoint Implementation

The Max device needs these endpoints (may need to be added to SERGIK ML API):

#### GET /live/browser/search
**Implementation**:
- Query Ableton Live browser via LOM
- Search SERGIK catalog database
- Combine results
- Return formatted response

**Query Parsing**:
- Parse `BPM:120` → filter by BPM
- Parse `key:C` → filter by key
- Parse `name:kick` → filter by name pattern
- Parse `genre:house` → filter by genre

#### POST /live/browser/load
**Implementation**:
- Get track via LOM: `live_set tracks {trackIndex}`
- Load item: `track.call("load_item", itemPath)`
- Return success/error

#### POST /live/browser/hot_swap
**Implementation**:
- Get device: `live_set tracks {trackIndex} devices {deviceIndex}`
- Hot-swap sample: `device.call("hot_swap", samplePath)`
- Return success/error

### 16. Data Structures

#### Media Item Object
```javascript
{
    id: "sample-1",
    name: "Kick_01.wav",
    type: "audio", // or "midi"
    path: "/path/to/file.wav",
    bpm: 120,
    key: "C",
    duration: 4.0,
    sample_rate: 44100,
    genre: "house",
    metadata: {
        // Additional metadata
    }
}
```

#### Search Result Response
```javascript
{
    status: "ok",
    count: 10,
    results: [
        {
            path: "/path/to/sample.wav",
            name: "Kick Drum",
            type: "audio",
            bpm: 120,
            key: "C",
            duration: 4.0,
            sample_rate: 44100
        }
    ]
}
```

### 17. Next Steps

1. **Review this analysis** with the Max device implementation team
2. **Implement API endpoints** in SERGIK ML server if missing:
   - `/live/browser/search`
   - `/live/browser/load`
   - `/live/browser/hot_swap`
3. **Create Max for Live UI components**:
   - Browser panel layout
   - Media item rendering
   - Editor panels
   - Toolbar
4. **Implement JavaScript classes** in Max device:
   - MediaLoader
   - MediaItemInteraction
   - MediaKeyboardNavigation
   - Search functionality
5. **Integrate Live Object Model**:
   - Browser access
   - Track/device control
   - Sample loading
6. **Test functionality**:
   - Search with various queries
   - Load samples into tracks
   - Hot-swap in devices
   - Editor integration
7. **Add error handling** and user feedback
8. **Implement caching** for performance
9. **Add keyboard shortcuts** for power users
10. **Test with real Ableton Live sessions**

### 18. Debugging & Testing Guide

#### HTTP Request Debugging

**Check Max Device Outlets**:
- **Outlet 3**: JSON responses from API calls
  - All API responses are sent to outlet 3 as JSON strings
  - Parse with `JSON.parse()` in Max or view in console
  - Format: `{"status": "ok", "result": {...}, "error": null}`

**API Testing Tools**:
- **Interactive API Docs**: `http://127.0.0.1:8000/docs`
  - FastAPI Swagger UI for testing endpoints
  - Test `/live/browser/search`, `/live/browser/load`, `/live/browser/hot_swap`
  - View request/response schemas
  - Test with sample data before Max integration

**Max Console Debugging**:
- Check Max console for JavaScript errors
- Use `post()` function for debug output
- Enable verbose logging in Max device
- Check for LOM errors (Live API access issues)

**Example Debug Flow**:
```javascript
// In Max device JavaScript
function searchLibrary(query) {
    post("Searching:", query);
    
    httpRequest("GET", "/live/browser/search?query=" + encodeURIComponent(query), null, 
        function(err, response) {
            if (err) {
                post("ERROR:", err);
                outlet(1, "❌ Search failed: " + err);  // Status outlet
            } else {
                post("Response:", JSON.stringify(response));  // Console
                outlet(3, JSON.stringify(response));  // JSON outlet
                outlet(1, "✅ Found " + response.count + " results");  // Status
            }
        }
    );
}
```

#### OSC Testing

**Test OSC Communication**:
```python
# In Python console or test script
from sergik_ml.connectors.ableton_osc import osc_status

# Send test message
osc_status("Test message")

# Check Max device receives on OSC input
# Should appear in Max console or status outlet
```

**OSC Message Flow**:
1. Max device sends HTTP request to API
2. API processes request
3. API sends OSC message to Max device (if needed)
4. Max device receives OSC on input
5. Max device updates UI/state

**OSC Endpoints Used**:
- `/scp/browser_search` - Browser search results
- `/scp/browser_load` - Item loaded confirmation
- `/scp/hot_swap` - Hot-swap confirmation
- `/scp/status` - General status updates
- `/scp/error` - Error notifications

#### Voice Command Testing

**Voice Endpoint Usage**:
- **Endpoint**: `POST /voice`
- **Input**: WAV file (multipart/form-data)
- **Returns**: 
  ```json
  {
    "status": "ok",
    "text": "transcribed text",
    "intent": {
      "text": "load kick drum sample",
      "cmd": "load_sample",
      "args": {"track": 0, "sample": "kick.wav"},
      "confidence": 0.95
    },
    "action": {
      "status": "ok",
      "cmd": "load_sample",
      "result": {...}
    },
    "tts_path": "/path/to/response.wav"
  }
  ```

**Testing Voice Commands**:
```bash
# Using curl
curl -X POST http://127.0.0.1:8000/voice \
  -F "file=@voice_command.wav"

# Response includes:
# - Transcribed text
# - Parsed intent (cmd, args)
# - Executed action result
# - TTS audio path
```

#### State Management

**Max Device Local State**:
The Max device maintains local state for:
- `currentKey`: Current musical key (e.g., "10B", "7A")
- `currentBars`: Number of bars (1-32)
- `currentStyle`: Style/genre (e.g., "house", "techno")
- `currentVoicing`: Voicing type ("stabs", "pads")
- `currentPattern`: Pattern type ("up", "down", "random")
- `currentTempo`: Current BPM
- `currentDrumGenre`: Drum genre
- `currentSwing`: Swing amount (0-100)
- `currentHumanize`: Humanize amount (0-100)
- `currentDensity`: Density (0.1-2.0)
- `noteBuffer`: Generated notes array
- `isConnected`: API connection status

**Get Current Session State**:
```javascript
// In Max device
function getSessionState() {
    httpRequest("GET", "/live/session/state", null, function(err, response) {
        if (!err && response.status === "ok") {
            // Response contains:
            // - tempo, is_playing, is_recording
            // - current_song_time, loop_start, loop_length
            // - track_count, scene_count
            // - tracks[], scenes[]
            outlet(3, JSON.stringify(response));
        }
    });
}
```

#### Debugging Checklist

**Before Testing**:
- [ ] SERGIK ML API server running (`python run_server.py`)
- [ ] Max device loaded in Ableton Live
- [ ] API URL configured in Max device
- [ ] OSC ports configured correctly
- [ ] Max console visible for error messages

**During Testing**:
- [ ] Check outlet 3 for JSON responses
- [ ] Monitor Max console for errors
- [ ] Use `/docs` endpoint to test API directly
- [ ] Verify OSC messages received
- [ ] Check Live Object Model access
- [ ] Validate state updates

**Common Issues**:
1. **No API Response**:
   - Check API server is running
   - Verify API URL in Max device
   - Check network connectivity
   - Review Max console for HTTP errors

2. **OSC Not Working**:
   - Verify OSC ports match (default: 9000)
   - Check OSC receiver in Max device
   - Test with `osc_status("test")` from Python
   - Verify firewall not blocking

3. **LOM Errors**:
   - Ensure Ableton Live is running
   - Check Live API is enabled
   - Verify track/device indices are valid
   - Check Live version compatibility

4. **State Inconsistencies**:
   - Clear Max device state
   - Restart API server
   - Re-sync with Live session
   - Use `getSessionState()` to verify

#### Testing Workflow

**1. API Endpoint Testing**:
```bash
# Test browser search
curl "http://127.0.0.1:8000/live/browser/search?query=kick&limit=10"

# Test browser load
curl -X POST http://127.0.0.1:8000/live/browser/load \
  -H "Content-Type: application/json" \
  -d '{"item_path": "/path/to/sample.wav", "track_index": 0}'

# Test hot-swap
curl -X POST http://127.0.0.1:8000/live/browser/hot_swap \
  -H "Content-Type: application/json" \
  -d '{"track_index": 0, "device_index": 0, "sample_path": "/path/to/sample.wav"}'
```

**2. Max Device Testing**:
```javascript
// In Max device inlet 0
search_library kick
// Check outlet 3 for JSON response
// Check outlet 1 for status message

load_sample 0 /path/to/sample.wav
// Verify sample loads into track 0
// Check outlet 3 for confirmation

hot_swap 0 0 /path/to/sample.wav
// Verify sample swaps in device
// Check outlet 3 for confirmation
```

**3. Integration Testing**:
- Test search → select → load workflow
- Test keyboard navigation
- Test filter functionality
- Test error scenarios (invalid paths, missing tracks)
- Test with large libraries (1000+ items)

**4. Performance Testing**:
- Measure search response time
- Measure load time for samples
- Test with 1000+ browser items
- Monitor memory usage
- Check for memory leaks

#### Debugging Tools

**Max Device**:
- Max console for JavaScript errors
- `post()` function for debug output
- Outlet 3 for JSON responses
- Outlet 1 for status messages
- Max inspector for object state

**API Server**:
- FastAPI `/docs` endpoint for interactive testing
- Server logs for request/response
- Python debugger for breakpoints
- OSC message logging

**Ableton Live**:
- Live API inspector (if available)
- Live console for LOM errors
- Track/device state verification
- Browser state inspection

#### Example Debug Session

```javascript
// 1. Test API connection
checkHealth();
// Expected: outlet 1 = "✅ Connected - sergik-ml v1.0.0"

// 2. Test browser search
search_library BPM:120
// Expected: outlet 3 = JSON with results
// Expected: outlet 1 = "✅ Found X results"

// 3. Test sample loading
load_sample 0 /Users/.../kick.wav
// Expected: outlet 3 = JSON with status
// Expected: outlet 1 = "✅ Loaded sample to track 0"
// Verify: Sample appears in track 0 in Live

// 4. Test hot-swap
hot_swap 0 0 /Users/.../snare.wav
// Expected: outlet 3 = JSON with status
// Expected: outlet 1 = "✅ Swapped sample"
// Verify: Simpler/Sampler shows new sample

// 5. Check session state
get_session_state
// Expected: outlet 3 = JSON with full session state
```

#### Troubleshooting Guide

**Issue: "API not responding"**

**Symptoms**: Max device shows "❌ Disconnected" or HTTP errors, no responses from API

**Debugging Steps**:
1. **Check server status**:
   ```bash
   curl http://127.0.0.1:8000/health
   # Expected: {"status":"ok","service":"sergik-ml","version":"..."}
   ```

2. **Verify Max device API URL**:
   - Check `API_BASE_URL` in `SERGIK_AI_Controller.js` (should be `http://127.0.0.1:8000`)
   - Verify no typos in host/port
   - Check if using HTTPS when server is HTTP (or vice versa)

3. **Test network connectivity**:
   ```bash
   # From Max device machine
   ping 127.0.0.1
   telnet 127.0.0.1 8000
   ```

4. **Check server logs**:
   - Review Python server console output
   - Look for connection errors, port binding issues
   - Check if server is actually running: `ps aux | grep python`

5. **Instrumentation points** (add to `httpRequest` function in Max device):
   - Log before HTTP request: URL, method, data
   - Log HTTP response: status code, response body
   - Log errors: error type, message, stack trace
   - Check outlet 3 for JSON responses

6. **Common causes**:
   - Server not started (`python run_server.py`)
   - Wrong port (check `CFG.port` in `sergik_ml/config.py`)
   - Firewall blocking localhost connections
   - Port already in use by another process

**Issue: "OSC messages not received"**

**Symptoms**: Max device doesn't receive status updates, no OSC messages in Max console

**Debugging Steps**:
1. **Test OSC from Python**:
   ```python
   from sergik_ml.connectors.ableton_osc import osc_status
   osc_status("Test message")
   # Check Max console for message
   ```

2. **Verify OSC configuration**:
   - Check `CFG.ableton_osc_port` in `sergik_ml/config.py` (default: 9000)
   - Verify Max device OSC receiver port matches
   - Check `CFG.ableton_osc_host` (should be `127.0.0.1`)

3. **Check Max device OSC setup**:
   - Verify `[udpreceive 9000]` object exists
   - Check `[route /scp/status]` routing
   - Verify `[fromsymbol]` and `[dict.deserialize]` are connected

4. **Test OSC manually**:
   ```bash
   # Using Python
   python -c "from pythonosc.udp_client import SimpleUDPClient; c = SimpleUDPClient('127.0.0.1', 9000); c.send_message('/scp/status', ['test'])"
   ```

5. **Instrumentation points** (add to `osc_send` in `ableton_osc.py`):
   - Log before sending: address, payload
   - Log after sending: success/failure
   - Log exceptions: error type, message

6. **Common causes**:
   - Port mismatch between server and Max device
   - OSC receiver not active in Max device
   - Firewall blocking UDP port 9000
   - Max device not loaded in Ableton Live

**Issue: "Browser search returns empty"**

**Symptoms**: Search queries return 0 results, empty items array in response

**Debugging Steps**:
1. **Test API directly**:
   ```bash
   curl "http://127.0.0.1:8000/live/browser/search?query=kick&limit=10"
   # Check response: {"status":"ok","items":[...],"count":N}
   ```

2. **Verify query parsing**:
   - Test simple query: `kick`
   - Test structured query: `BPM:120, key:C`
   - Check if query parser handles syntax correctly

3. **Check Live browser access**:
   - Verify Ableton Live is running
   - Check if Live browser has items
   - Test LOM access: `new LiveAPI("live_set browser")` in Max console

4. **Check SERGIK catalog**:
   - Verify database connection
   - Check if catalog has tracks: `SELECT COUNT(*) FROM music_intelligence`
   - Review catalog search function logs

5. **Instrumentation points**:
   - In `live_browser_search` (API): Log parsed query, catalog results count
   - In `searchLibrary` (Max): Log query, LOM results, merged results
   - Log filter application: which items pass/fail filters

6. **Common causes**:
   - Query syntax error (invalid BPM:value format)
   - No items match filter criteria (too restrictive)
   - LOM browser access fails (Live not running)
   - Catalog database empty or not connected

**Issue: "Sample won't load"**

**Symptoms**: `load_sample` command fails, no clip created, error in outlet 1/3

**Debugging Steps**:
1. **Verify file path**:
   ```javascript
   // In Max device
   post("Loading:", samplePath);
   // Check if path is absolute and file exists
   ```

2. **Check file format**:
   - Supported: `.wav`, `.aif`, `.aiff`, `.mp3`, `.flac`
   - Verify file is not corrupted
   - Check file permissions (readable)

3. **Verify track exists**:
   ```javascript
   // In Max device
   var track = new LiveAPI("live_set tracks " + trackIndex);
   post("Track exists:", track.id ? "yes" : "no");
   ```

4. **Check Live API permissions**:
   - Verify Live API is enabled in Live preferences
   - Check if track is locked or protected
   - Verify user has write permissions

5. **Instrumentation points**:
   - In `loadSample` (Max): Log trackIndex, samplePath before LOM call
   - Log LOM result: success/failure, error message
   - Log clip slot detection: which slot was used
   - In `live_browser_load` (API): Log request validation, OSC send result

6. **Common causes**:
   - Invalid file path (relative vs absolute, wrong format)
   - Track index out of range (track doesn't exist)
   - File format not supported by Live
   - Live API disabled or permissions issue
   - LOM `load_item` call fails (check Max console for LOM errors)

**Issue: "State out of sync"**

**Symptoms**: UI shows different state than Live session, stale data, inconsistent behavior

**Debugging Steps**:
1. **Check current state**:
   ```javascript
   // In Max device
   getSessionState();
   // Check outlet 3 for state JSON
   // Compare with actual Live session
   ```

2. **Verify state manager**:
   - Check `stateManager.getState()` in browser console
   - Verify localStorage persistence
   - Check for state conflicts

3. **Check state update triggers**:
   - Verify events fire on state changes
   - Check if listeners are registered
   - Verify state sync happens on Live changes

4. **Instrumentation points**:
   - In `StateManager.set`: Log key, old value, new value
   - In state sync functions: Log before/after sync
   - Log state persistence: save/load from localStorage
   - Log state conflicts: when local != Live state

5. **Common causes**:
   - State not persisted (localStorage disabled/full)
   - State update events not firing
   - Live session changed externally (not via Max device)
   - State manager not initialized
   - Race condition between state updates

**General Debugging Workflow**:

1. **Enable debug mode**:
   - Add `?debug=true` to preview URL
   - Check `window.debugTools` in browser console
   - Enable verbose logging in Max device

2. **Check logs**:
   - Max console: JavaScript errors, LOM errors
   - API server logs: Request/response, exceptions
   - Browser console: Network errors, JavaScript errors
   - Debug log file: `/Users/machd/sergik_custom_gpt/.cursor/debug.log`

3. **Use debugging tools**:
   ```javascript
   // In browser console
   window.debugTools.inspectState();
   window.debugTools.getLogs('error');
   window.debugTools.getProfileStats('search');
   ```

4. **Test incrementally**:
   - Start with simple operations (health check)
   - Progress to complex operations (search, load)
   - Isolate failing component (API vs LOM vs UI)
   - Compare working vs non-working scenarios

