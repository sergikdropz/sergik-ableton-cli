/*
================================================================================
SERGIK AI Controller - Max for Live Device
================================================================================

Full-featured controller for SERGIK AI integration in Ableton Live.
Communicates with the SERGIK ML API server via HTTP requests.
Provides complete Live Object Model (LOM) access for full Ableton control.

Features:
  - Natural language MIDI generation (chords, bass, arpeggios)
  - Drum pattern generation (12+ genres: house, techno, trap, dnb, etc.)
  - Full Track Management (create/delete/properties/routing)
  - Device Control (load devices, VSTs, parameters, presets)
  - Clip Management (create/fire/duplicate/notes)
  - Browser/Library Access (search/load samples)
  - Session Control (scenes/mixer/undo/quantization)
  - Real-time parameter control (swing, humanize, density)
  - Pattern insertion into clips
  - Transport sync

Commands (Inlet 0):
  Melodic:
    generate_chords, generate_bass, generate_arps, prompt <text>
  
  Drums:
    generate_drums, drums <genre>, drum_prompt <text>, drum_genre <name>
    drum_genres, swing <0-100>, humanize <0-100>, density <0.1-2.0>
  
  Tracks:
    create_track <type> [name], delete_track <index>
    arm_track <index> [0/1], mute_track <index> [0/1], solo_track <index> [0/1]
    set_volume <index> <0-1>, set_pan <index> <-1 to 1>
    rename_track <index> <name>, set_track_color <index> <0-69>
    get_tracks, get_track_info <index>
  
  Devices:
    load_device <track> <name>, load_vst <track> <name>
    set_param <track> <device> <param> <value>
    get_params <track> <device>, toggle_device <track> <device>
    load_preset <track> <device> <preset_name>
    get_devices <track>
  
  Clips:
    create_clip <track> <slot> [length], delete_clip <track> <slot>
    fire_clip <track> <slot>, stop_clip <track> [slot]
    duplicate_clip <track> <slot> [target_track] [target_slot]
    set_clip_notes <track> <slot>, get_clip_notes <track> <slot>
    get_clip_info <track> <slot>
  
  Browser:
    search_library <query>, load_sample <track> <path>
    hot_swap <track> <device> <sample_path>
  
  Session:
    fire_scene <index>, stop_scene, create_scene [name]
    delete_scene <index>, duplicate_scene <index>
    set_tempo <bpm>, set_quantization <value>
    undo, redo, get_session_state
  
  Transport:
    transport_play, transport_stop, transport_record
    stop_all_clips
  
  Mixer:
    set_send <track> <send_index> <level>
  
  Playback:
    play, stop, clear, insert
  
  System:
    health, set_api <host> <port>

Inlets:
  0 - Commands (bang, messages)
  1 - Key selection (symbol: 10B, 7A, etc.)
  2 - Bars (int: 1-32)
  3 - Style (symbol: house, techno, jazz)
  4 - Voicing (symbol: stabs, pads)
  5 - Pattern (symbol: up, down, random, pingpong)

Outlets:
  0 - MIDI notes (pitch velocity)
  1 - Status messages (for display)
  2 - Note data (pitch start duration velocity)
  3 - API/LOM response (JSON string)

Author: SERGIK AI
Version: 2.0 (Full Ableton Integration)
================================================================================
*/

inlets = 6;
outlets = 4;

// Set inlet/outlet assist
setinletassist(0, "Commands: tracks, devices, clips, browser, session, etc.");
setinletassist(1, "Key (10B, 7A, 11B, 8A, etc.)");
setinletassist(2, "Bars (1-32)");
setinletassist(3, "Style (house, techno, jazz)");
setinletassist(4, "Voicing (stabs, pads)");
setinletassist(5, "Pattern (up, down, random, pingpong)");

setoutletassist(0, "MIDI notes [pitch velocity]");
setoutletassist(1, "Status messages");
setoutletassist(2, "Note data [pitch start duration velocity]");
setoutletassist(3, "API/LOM response JSON");

// ============================================================================
// Configuration
// ============================================================================

var API_HOST = "127.0.0.1";
var API_PORT = 8000;
var API_BASE_URL = "http://" + API_HOST + ":" + API_PORT;

// Load LOM modules (these would be loaded via file references in Max for Live)
// For now, we'll define minimal stubs if modules aren't available
if (typeof buildLOMPath === "undefined") {
    // Stub functions - will be replaced when LOM modules are loaded
    function buildLOMPath(components) {
        var parts = ["live_set"];
        if (components.track !== undefined) parts.push("tracks", components.track);
        if (components.device !== undefined) parts.push("devices", components.device);
        if (components.parameter !== undefined) parts.push("parameters", components.parameter);
        if (components.clipSlot !== undefined) {
            parts.push("clip_slots", components.clipSlot);
            if (components.clip) parts.push("clip");
        }
        return parts.join(" ");
    }
    
    function safeLOMCall(operation, path, context) {
        context = context || {};
        try {
            var api = new LiveAPI(path);
            if (context.required && !api.id) {
                throw new Error("LOM object does not exist: " + path);
            }
            return operation(api);
        } catch (e) {
            if (typeof handleLOMError === "function") {
                handleLOMError(e, context);
            }
            if (context.throwOnError !== false) {
                throw e;
            }
            return null;
        }
    }
    
    function validateTrackIndex(index) {
        if (typeof index !== "number" || index < 0 || !Number.isInteger(index)) {
            throw new Error("Track index must be non-negative integer");
        }
    }
    
    function validateDeviceIndex(trackIndex, deviceIndex) {
        validateTrackIndex(trackIndex);
        if (typeof deviceIndex !== "number" || deviceIndex < 0 || !Number.isInteger(deviceIndex)) {
            throw new Error("Device index must be non-negative integer");
        }
    }
    
    function validateClipSlot(trackIndex, slotIndex) {
        validateTrackIndex(trackIndex);
        if (typeof slotIndex !== "number" || slotIndex < 0 || !Number.isInteger(slotIndex)) {
            throw new Error("Clip slot index must be non-negative integer");
        }
    }
    
    // Cache stub
    var lomStateCache = {
        get: function(key, fetcher) { return fetcher ? fetcher() : null; },
        set: function(key, value) {},
        invalidate: function(pattern) {},
        isFresh: function(key) { return false; }
    };
}

// Current state
var currentKey = "10B";
var currentBars = 8;
var currentStyle = "house";
var currentVoicing = "stabs";
var currentPattern = "up";
var currentTempo = 125;
var currentDrumGenre = "house";
var currentSwing = 0;
var currentHumanize = 0;
var currentDensity = 1.0;
var isConnected = false;

// Generated notes buffer
var noteBuffer = [];
var playbackTask = null;

// Track color palette (Ableton's 70 colors indexed 0-69)
var TRACK_COLORS = 70;

// ============================================================================
// HTTP Request Handler
// ============================================================================

function httpRequest(method, endpoint, data, callback) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:141',message:'httpRequest called',data:{method:method,endpoint:endpoint,hasData:!!data,url:API_BASE_URL + endpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    var url = API_BASE_URL + endpoint;
    var request = new XMLHttpRequest();
    
    request.open(method, url, true);
    request.setRequestHeader("Content-Type", "application/json");
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:149',message:'HTTP request opened',data:{method:method,url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    request.onreadystatechange = function() {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:152',message:'HTTP state change',data:{readyState:request.readyState,status:request.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (request.readyState === 4) {
            if (request.status === 200) {
                try {
                    var response = JSON.parse(request.responseText);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:157',message:'HTTP success',data:{status:request.status,responseStatus:response.status || 'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    callback(null, response);
                } catch (e) {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:161',message:'JSON parse error',data:{error:e.toString(),responseText:request.responseText.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    callback("JSON parse error: " + e, null);
                }
            } else {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:166',message:'HTTP error status',data:{status:request.status,statusText:request.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                callback("HTTP error: " + request.status, null);
            }
        }
    };
    
    // Add error handler for network failures
    request.onerror = function() {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:173',message:'HTTP network error',data:{url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        callback("Network error: Unable to connect to " + url, null);
    };
    
    // Add timeout handler
    request.ontimeout = function() {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:179',message:'HTTP timeout',data:{url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        callback("Request timeout: " + url, null);
    };
    
    request.timeout = 10000; // 10 second timeout
    
    if (data) {
        request.send(JSON.stringify(data));
    } else {
        request.send();
    }
}

// ============================================================================
// Status Display
// ============================================================================

function status(message) {
    outlet(1, message);
    post("[SERGIK] " + message + "\n");
}

function outputJSON(data) {
    outlet(3, JSON.stringify(data));
}

// ============================================================================
// Inlet Handlers
// ============================================================================

// Inlet 0: Commands
function anything() {
    var cmd = messagename;
    var args = arrayfromargs(arguments);
    
    switch(cmd) {
        // === MIDI Generation ===
        case "generate_chords":
            generateChords();
            break;
        case "generate_bass":
            generateBass();
            break;
        case "generate_arps":
            generateArpeggios();
            break;
        case "prompt":
            if (args.length > 0) {
                naturalLanguageGenerate(args.join(" "));
            }
            break;
            
        // === Drum Generation ===
        case "generate_drums":
            generateDrums();
            break;
        case "drums":
            if (args.length > 0) {
                generateDrumsFast(args[0]);
            } else {
                generateDrums();
            }
            break;
        case "drum_prompt":
            if (args.length > 0) {
                naturalLanguageDrums(args.join(" "));
            }
            break;
        case "drum_genre":
            if (args.length > 0) setDrumGenre(args[0]);
            break;
        case "swing":
            if (args.length > 0) setSwing(parseFloat(args[0]));
            break;
        case "humanize":
            if (args.length > 0) setHumanize(parseFloat(args[0]));
            break;
        case "density":
            if (args.length > 0) setDensity(parseFloat(args[0]));
            break;
        case "drum_genres":
            getDrumGenres();
            break;
            
        // === Track Management ===
        case "create_track":
            createTrack(args[0] || "midi", args.slice(1).join(" ") || null);
            break;
        case "delete_track":
            if (args.length > 0) deleteTrack(parseInt(args[0]));
            break;
        case "arm_track":
            if (args.length > 0) armTrack(parseInt(args[0]), args[1] !== undefined ? parseInt(args[1]) : null);
            break;
        case "mute_track":
            if (args.length > 0) muteTrack(parseInt(args[0]), args[1] !== undefined ? parseInt(args[1]) : null);
            break;
        case "solo_track":
            if (args.length > 0) soloTrack(parseInt(args[0]), args[1] !== undefined ? parseInt(args[1]) : null);
            break;
        case "set_volume":
            if (args.length >= 2) setTrackVolume(parseInt(args[0]), parseFloat(args[1]));
            break;
        case "set_pan":
            if (args.length >= 2) setTrackPan(parseInt(args[0]), parseFloat(args[1]));
            break;
        case "rename_track":
            if (args.length >= 2) renameTrack(parseInt(args[0]), args.slice(1).join(" "));
            break;
        case "set_track_color":
            if (args.length >= 2) setTrackColor(parseInt(args[0]), parseInt(args[1]));
            break;
        case "get_tracks":
            getTracks();
            break;
        case "get_track_info":
            if (args.length > 0) getTrackInfo(parseInt(args[0]));
            break;
            
        // === Device Control ===
        case "load_device":
            if (args.length >= 2) loadDevice(parseInt(args[0]), args.slice(1).join(" "));
            break;
        case "load_vst":
            if (args.length >= 2) loadVST(parseInt(args[0]), args.slice(1).join(" "));
            break;
        case "set_param":
            if (args.length >= 4) {
                // Parse paramIndexOrName: if numeric string, use as index; otherwise use as name
                var paramArg = args[2];
                var paramIndexOrName;
                if (typeof paramArg === "number") {
                    paramIndexOrName = paramArg;
                } else if (typeof paramArg === "string" && !isNaN(paramArg) && paramArg.trim() !== "") {
                    paramIndexOrName = parseInt(paramArg);
                } else {
                    paramIndexOrName = paramArg;
                }
                setDeviceParam(parseInt(args[0]), parseInt(args[1]), paramIndexOrName, parseFloat(args[3]));
            }
            break;
        case "get_params":
            if (args.length >= 2) getDeviceParams(parseInt(args[0]), parseInt(args[1]));
            break;
        case "toggle_device":
            if (args.length >= 2) toggleDevice(parseInt(args[0]), parseInt(args[1]), args[2] !== undefined ? parseInt(args[2]) : null);
            break;
        case "load_preset":
            if (args.length >= 3) loadPreset(parseInt(args[0]), parseInt(args[1]), args.slice(2).join(" "));
            break;
        case "get_devices":
            if (args.length > 0) getDevices(parseInt(args[0]));
            break;
            
        // === Clip Management ===
        case "create_clip":
            if (args.length >= 2) createClip(parseInt(args[0]), parseInt(args[1]), args[2] ? parseFloat(args[2]) : 16);
            break;
        case "delete_clip":
            if (args.length >= 2) deleteClip(parseInt(args[0]), parseInt(args[1]));
            break;
        case "fire_clip":
            if (args.length >= 2) fireClip(parseInt(args[0]), parseInt(args[1]));
            break;
        case "stop_clip":
            if (args.length > 0) stopClip(parseInt(args[0]), args[1] !== undefined ? parseInt(args[1]) : null);
            break;
        case "duplicate_clip":
            if (args.length >= 2) duplicateClip(parseInt(args[0]), parseInt(args[1]), args[2] ? parseInt(args[2]) : null, args[3] ? parseInt(args[3]) : null);
            break;
        case "set_clip_notes":
            if (args.length >= 2) setClipNotes(parseInt(args[0]), parseInt(args[1]));
            break;
        case "get_clip_notes":
            if (args.length >= 2) getClipNotes(parseInt(args[0]), parseInt(args[1]));
            break;
        case "get_clip_info":
            if (args.length >= 2) getClipInfo(parseInt(args[0]), parseInt(args[1]));
            break;
            
        // === Browser/Library ===
        case "search_library":
            if (args.length > 0) searchLibrary(args.join(" "));
            break;
        case "load_sample":
            if (args.length >= 2) loadSample(parseInt(args[0]), args.slice(1).join(" "));
            break;
        case "hot_swap":
            if (args.length >= 3) hotSwapSample(parseInt(args[0]), parseInt(args[1]), args.slice(2).join(" "));
            break;
            
        // === Session Control ===
        case "fire_scene":
            if (args.length > 0) fireScene(parseInt(args[0]));
            break;
        case "stop_scene":
            stopScene();
            break;
        case "create_scene":
            createScene(args.length > 0 ? args.join(" ") : null);
            break;
        case "delete_scene":
            if (args.length > 0) deleteScene(parseInt(args[0]));
            break;
        case "duplicate_scene":
            if (args.length > 0) duplicateScene(parseInt(args[0]));
            break;
        case "set_tempo":
            if (args.length > 0) setTempo(parseFloat(args[0]));
            break;
        case "set_quantization":
            if (args.length > 0) setQuantization(args[0]);
            break;
        case "undo":
            performUndo();
            break;
        case "redo":
            performRedo();
            break;
        case "get_session_state":
            getSessionState();
            break;
            
        // === Transport ===
        case "transport_play":
            transportPlay();
            break;
        case "transport_stop":
            transportStop();
            break;
        case "transport_record":
            transportRecord();
            break;
        case "stop_all_clips":
            stopAllClips();
            break;
            
        // === Mixer ===
        case "set_send":
            if (args.length >= 3) setTrackSend(parseInt(args[0]), parseInt(args[1]), parseFloat(args[2]));
            break;
            
        // === Playback ===
        case "play":
            playNotes();
            break;
        case "stop":
            stopPlayback();
            break;
        case "clear":
            clearBuffer();
            break;
        case "insert":
            insertToClip();
            break;
            
        // === System ===
        case "health":
            checkHealth();
            break;
        case "set_api":
            if (args.length >= 2) {
                API_HOST = args[0];
                API_PORT = args[1];
                API_BASE_URL = "http://" + API_HOST + ":" + API_PORT;
                status("API: " + API_BASE_URL);
            }
            break;
            
        default:
            // Try natural language processing for unknown commands
            naturalLanguageCommand(cmd + " " + args.join(" "));
    }
}

function bang() {
    checkHealth();
}

// ============================================================================
// Mouse and Gesture Support
// ============================================================================

// Handle mouse events from Max
function mouse(x, y, button, modifiers) {
    // x, y: mouse position
    // button: 0=left, 1=right, 2=middle
    // modifiers: bitmask (1=shift, 2=ctrl, 4=alt, 8=cmd)
    
    var cmd = "mouse_event";
    var args = [x, y, button, modifiers];
    
    // Send to outlet for processing
    outlet(1, "Mouse: " + x + ", " + y + ", button: " + button);
}

// Handle gesture events
function gesture(type, value1, value2) {
    // type: "swipe", "pinch", "rotate", "tap"
    // value1, value2: gesture-specific values
    
    var cmd = "gesture_" + type;
    var args = [value1, value2];
    
    outlet(1, "Gesture: " + type + " (" + value1 + ", " + value2 + ")");
    
    // Map gestures to commands
    switch(type) {
        case "swipe":
            if (value1 > 0) {
                // Swipe right - scrub forward
                // Could trigger timeline navigation
            } else {
                // Swipe left - scrub backward
            }
            break;
        case "pinch":
            // Pinch zoom
            // Could trigger zoom commands
            break;
        case "rotate":
            // Rotate gesture
            break;
        case "tap":
            // Tap gesture
            break;
    }
}

// Handle keyboard events from Max
function key(keycode, modifiers, pressed) {
    // keycode: key code
    // modifiers: bitmask
    // pressed: 1=pressed, 0=released
    
    if (pressed) {
        // Map to commands based on keycode
        var cmd = mapKeyToCommand(keycode, modifiers);
        if (cmd) {
            outlet(0, cmd);
        }
    }
}

function mapKeyToCommand(keycode, modifiers) {
    // Map keyboard shortcuts to commands
    // This is a simplified mapping - full implementation would handle all Ableton shortcuts
    
    var hasCtrl = (modifiers & 2) !== 0;
    var hasShift = (modifiers & 1) !== 0;
    var hasAlt = (modifiers & 4) !== 0;
    
    // Space = play/stop
    if (keycode === 32) {
        return "transport_play";
    }
    
    // Enter = record
    if (keycode === 13) {
        return "transport_record";
    }
    
    // Ctrl+Z = undo
    if (keycode === 90 && hasCtrl) {
        return "undo";
    }
    
    // Ctrl+Shift+Z = redo
    if (keycode === 90 && hasCtrl && hasShift) {
        return "redo";
    }
    
    // Ctrl+A = select all
    if (keycode === 65 && hasCtrl) {
        return "select_all";
    }
    
    // Ctrl+D = duplicate
    if (keycode === 68 && hasCtrl) {
        return "duplicate";
    }
    
    // Ctrl+U = quantize
    if (keycode === 85 && hasCtrl) {
        return "set_quantization 1/16";
    }
    
    // Ctrl+E = split
    if (keycode === 69 && hasCtrl) {
        return "split";
    }
    
    // Ctrl+J = consolidate
    if (keycode === 74 && hasCtrl) {
        return "consolidate";
    }
    
    return null;
}

// Inlet 1-5: Parameters
function in1(key) { currentKey = key; status("Key: " + currentKey); }
function in2(bars) { currentBars = Math.max(1, Math.min(32, bars)); status("Bars: " + currentBars); }
function in3(style) { currentStyle = style; status("Style: " + currentStyle); }
function in4(voicing) { currentVoicing = voicing; status("Voicing: " + currentVoicing); }
function in5(pattern) { currentPattern = pattern; status("Pattern: " + currentPattern); }

// ============================================================================
// TRACK MANAGEMENT (Live Object Model)
// ============================================================================

function createTrack(trackType, name) {
    try {
        // Use safe LOM call with validation
        var liveSet = safeLOMCall(
            function(api) { return api; },
            "live_set",
            {name: "createTrack", required: true}
        );
        
        if (!liveSet) {
            throw new Error("Failed to access live_set");
        }
        
        var trackCount = parseInt(liveSet.get("tracks").length / 2);
        
        if (trackType === "midi") {
            liveSet.call("create_midi_track", trackCount);
            status("✅ Created MIDI track");
        } else if (trackType === "audio") {
            liveSet.call("create_audio_track", trackCount);
            status("✅ Created Audio track");
        } else if (trackType === "return") {
            liveSet.call("create_return_track");
            status("✅ Created Return track");
        } else {
            status("❌ Unknown track type: " + trackType);
            return;
        }
        
        // Rename if name provided - use safe call
        if (name) {
            var trackPath = buildLOMPath({track: trackCount});
            safeLOMCall(
                function(track) {
                    track.set("name", name);
                    return true;
                },
                trackPath,
                {name: "createTrack.rename", required: true}
            );
            status("✅ Created " + trackType + " track: " + name);
        }
        
        // Invalidate cache
        if (lomStateCache) {
            lomStateCache.invalidate("track");
        }
        
        outputJSON({status: "ok", action: "create_track", track_type: trackType, name: name, index: trackCount});
    } catch (e) {
        status("❌ Create track failed: " + e);
        outputJSON({status: "error", error: e.toString()});
    }
}

function deleteTrack(index) {
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.call("delete_track", index);
        status("✅ Deleted track " + index);
        outputJSON({status: "ok", action: "delete_track", index: index});
    } catch (e) {
        status("❌ Delete track failed: " + e);
        outputJSON({status: "error", error: e.toString()});
    }
}

function armTrack(index, state) {
    try {
        var track = new LiveAPI("live_set tracks " + index);
        if (state === null) {
            // Toggle
            var current = parseInt(track.get("arm"));
            track.set("arm", current ? 0 : 1);
        } else {
            track.set("arm", state);
        }
        var newState = parseInt(track.get("arm"));
        status("✅ Track " + index + " arm: " + (newState ? "ON" : "OFF"));
        outputJSON({status: "ok", action: "arm_track", index: index, arm: newState});
    } catch (e) {
        status("❌ Arm track failed: " + e);
    }
}

function muteTrack(index, state) {
    try {
        var track = new LiveAPI("live_set tracks " + index);
        if (state === null) {
            var current = parseInt(track.get("mute"));
            track.set("mute", current ? 0 : 1);
        } else {
            track.set("mute", state);
        }
        var newState = parseInt(track.get("mute"));
        status("✅ Track " + index + " mute: " + (newState ? "ON" : "OFF"));
        outputJSON({status: "ok", action: "mute_track", index: index, mute: newState});
    } catch (e) {
        status("❌ Mute track failed: " + e);
    }
}

function soloTrack(index, state) {
    try {
        var track = new LiveAPI("live_set tracks " + index);
        if (state === null) {
            var current = parseInt(track.get("solo"));
            track.set("solo", current ? 0 : 1);
        } else {
            track.set("solo", state);
        }
        var newState = parseInt(track.get("solo"));
        status("✅ Track " + index + " solo: " + (newState ? "ON" : "OFF"));
        outputJSON({status: "ok", action: "solo_track", index: index, solo: newState});
    } catch (e) {
        status("❌ Solo track failed: " + e);
    }
}

function setTrackVolume(index, volume) {
    try {
        var track = new LiveAPI("live_set tracks " + index);
        var mixer = new LiveAPI("live_set tracks " + index + " mixer_device volume");
        mixer.set("value", Math.max(0, Math.min(1, volume)));
        status("✅ Track " + index + " volume: " + Math.round(volume * 100) + "%");
        outputJSON({status: "ok", action: "set_volume", index: index, volume: volume});
    } catch (e) {
        status("❌ Set volume failed: " + e);
    }
}

function setTrackPan(index, pan) {
    try {
        var mixer = new LiveAPI("live_set tracks " + index + " mixer_device panning");
        mixer.set("value", Math.max(-1, Math.min(1, pan)));
        status("✅ Track " + index + " pan: " + Math.round(pan * 100));
        outputJSON({status: "ok", action: "set_pan", index: index, pan: pan});
    } catch (e) {
        status("❌ Set pan failed: " + e);
    }
}

function renameTrack(index, name) {
    try {
        var track = new LiveAPI("live_set tracks " + index);
        track.set("name", name);
        status("✅ Track " + index + " renamed to: " + name);
        outputJSON({status: "ok", action: "rename_track", index: index, name: name});
    } catch (e) {
        status("❌ Rename track failed: " + e);
    }
}

function setTrackColor(index, color) {
    try {
        var track = new LiveAPI("live_set tracks " + index);
        track.set("color_index", Math.max(0, Math.min(69, color)));
        status("✅ Track " + index + " color: " + color);
        outputJSON({status: "ok", action: "set_track_color", index: index, color: color});
    } catch (e) {
        status("❌ Set track color failed: " + e);
    }
}

function getTracks() {
    try {
        var liveSet = new LiveAPI("live_set");
        var trackIds = liveSet.get("tracks");
        var tracks = [];
        
        for (var i = 0; i < trackIds.length; i += 2) {
            var trackIndex = Math.floor(i / 2);
            var track = new LiveAPI("live_set tracks " + trackIndex);
            
            if (track.id) {
                var volume = new LiveAPI("live_set tracks " + trackIndex + " mixer_device volume");
                var panning = new LiveAPI("live_set tracks " + trackIndex + " mixer_device panning");
                var devices = track.get("devices");
                
                // Infer track type (schema expects a string; use midi/audio/return where possible)
                var className = "";
                try { className = track.get("class_name").toString(); } catch (e) { className = ""; }
                var cls = (className || "").toLowerCase();
                var trackType = "midi";
                if (cls.indexOf("return") !== -1) trackType = "return";
                else if (cls.indexOf("audio") !== -1) trackType = "audio";
                else if (cls.indexOf("midi") !== -1) trackType = "midi";
                else {
                    // fallback based on inputs
                    var hasMidi = parseInt(track.get("has_midi_input"));
                    var hasAudio = parseInt(track.get("has_audio_input"));
                    trackType = hasAudio ? "audio" : "midi";
                }
                
                tracks.push({
                    index: trackIndex,
                    name: track.get("name").toString(),
                    track_type: trackType,
                    color: parseInt(track.get("color_index")),
                    arm: parseInt(track.get("arm")),
                    mute: parseInt(track.get("mute")),
                    solo: parseInt(track.get("solo")),
                    volume: parseFloat(volume.get("value")),
                    pan: parseFloat(panning.get("value")),
                    has_midi_input: parseInt(track.get("has_midi_input")),
                    has_audio_input: parseInt(track.get("has_audio_input")),
                    device_count: Math.floor(devices.length / 2)
                });
            }
        }
        
        status("✅ Found " + tracks.length + " tracks");
        outputJSON({status: "ok", action: "get_tracks", tracks: tracks, count: tracks.length});
    } catch (e) {
        status("❌ Get tracks failed: " + e);
        outputJSON({status: "error", error: e.toString()});
    }
}

function getTrackInfo(index) {
    try {
        var track = new LiveAPI("live_set tracks " + index);
        var volume = new LiveAPI("live_set tracks " + index + " mixer_device volume");
        var panning = new LiveAPI("live_set tracks " + index + " mixer_device panning");
        var devices = track.get("devices");

        // Infer track type (schema expects string)
        var className = "";
        try { className = track.get("class_name").toString(); } catch (e) { className = ""; }
        var cls = (className || "").toLowerCase();
        var trackType = "midi";
        if (cls.indexOf("return") !== -1) trackType = "return";
        else if (cls.indexOf("audio") !== -1) trackType = "audio";
        else if (cls.indexOf("midi") !== -1) trackType = "midi";
        else {
            var hasMidi = parseInt(track.get("has_midi_input"));
            var hasAudio = parseInt(track.get("has_audio_input"));
            trackType = hasAudio ? "audio" : "midi";
        }
        
        var info = {
            index: index,
            name: track.get("name").toString(),
            track_type: trackType,
            color: parseInt(track.get("color_index")),
            arm: parseInt(track.get("arm")),
            mute: parseInt(track.get("mute")),
            solo: parseInt(track.get("solo")),
            volume: parseFloat(volume.get("value")),
            pan: parseFloat(panning.get("value")),
            has_midi_input: parseInt(track.get("has_midi_input")),
            has_audio_input: parseInt(track.get("has_audio_input")),
            device_count: Math.floor(devices.length / 2)
        };
        
        status("✅ Track " + index + ": " + info.name);
        outputJSON({status: "ok", action: "get_track_info", track: info});
    } catch (e) {
        status("❌ Get track info failed: " + e);
    }
}

// ============================================================================
// DEVICE CONTROL (Live Object Model)
// ============================================================================

function loadDevice(trackIndex, deviceName) {
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        var browser = new LiveAPI("live_app browser");
        
        // Use Live's browser to find and load the device
        // Note: This requires the device to be in the browser's search results
        status("Loading device: " + deviceName + " on track " + trackIndex);
        
        // For native devices, we can use the track's create_device method
        // This works for built-in Ableton devices
        try {
            track.call("create_device", deviceName);
            status("✅ Loaded device: " + deviceName);
            outputJSON({status: "ok", action: "load_device", track: trackIndex, device: deviceName});
        } catch (e) {
            // If direct creation fails, try via API
            httpRequest("POST", "/live/devices/load", {
                track_index: trackIndex,
                device_name: deviceName
            }, function(err, response) {
                if (err) {
                    status("❌ Load device failed: " + err);
                } else {
                    status("✅ " + response.result);
                    outputJSON(response);
                }
            });
        }
    } catch (e) {
        status("❌ Load device failed: " + e);
    }
}

function loadVST(trackIndex, pluginName) {
    try {
        status("Loading VST: " + pluginName + " on track " + trackIndex);
        
        // VST loading requires browser navigation
        // Send to API for browser-based loading
        httpRequest("POST", "/live/devices/load_vst", {
            track_index: trackIndex,
            plugin_name: pluginName,
            plugin_format: "vst3"
        }, function(err, response) {
            if (err) {
                status("❌ Load VST failed: " + err);
            } else {
                status("✅ Loaded VST: " + pluginName);
                outputJSON(response);
            }
        });
    } catch (e) {
        status("❌ Load VST failed: " + e);
    }
}

function setDeviceParam(trackIndex, deviceIndex, paramIndexOrName, value) {
    try {
        // Validate indices
        validateDeviceIndex(trackIndex, deviceIndex);
        
        // Use safe LOM call to get device
        var devicePath = buildLOMPath({track: trackIndex, device: deviceIndex});
        var device = safeLOMCall(
            function(api) { return api; },
            devicePath,
            {name: "setDeviceParam.getDevice", required: true}
        );
        
        if (!device) {
            throw new Error("Device not found");
        }
        
        var params = device.get("parameters");
        var paramIndex = paramIndexOrName;
        
        // Find parameter by name if string provided
        if (typeof paramIndexOrName === "string") {
            for (var i = 0; i < params.length; i += 2) {
                var paramPath = buildLOMPath({
                    track: trackIndex,
                    device: deviceIndex,
                    parameter: Math.floor(i / 2)
                });
                var param = safeLOMCall(
                    function(api) { return api; },
                    paramPath,
                    {name: "setDeviceParam.findParam", required: false}
                );
                if (param && param.get("name").toString().toLowerCase() === paramIndexOrName.toLowerCase()) {
                    paramIndex = Math.floor(i / 2);
                    break;
                }
            }
        }
        
        // Set parameter value
        var paramPath = buildLOMPath({
            track: trackIndex,
            device: deviceIndex,
            parameter: paramIndex
        });
        safeLOMCall(
            function(param) {
                param.set("value", Math.max(0, Math.min(1, value)));
                return true;
            },
            paramPath,
            {name: "setDeviceParam.setValue", required: true}
        );
        
        // Invalidate cache
        if (lomStateCache) {
            lomStateCache.invalidate("device_state_" + trackIndex + "_" + deviceIndex);
        }
        
        status("✅ Set param " + paramIndex + " = " + Math.round(value * 100) + "%");
        outputJSON({status: "ok", action: "set_param", track: trackIndex, device: deviceIndex, param: paramIndex, value: value});
    } catch (e) {
        status("❌ Set param failed: " + e);
        outputJSON({status: "error", error: e.toString()});
    }
}

function getDeviceParams(trackIndex, deviceIndex) {
    try {
        var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + deviceIndex);
        var paramIds = device.get("parameters");
        var params = [];
        
        for (var i = 0; i < paramIds.length; i += 2) {
            var param = new LiveAPI("live_set tracks " + trackIndex + " devices " + deviceIndex + " parameters " + Math.floor(i / 2));
            params.push({
                index: Math.floor(i / 2),
                name: param.get("name").toString(),
                value: parseFloat(param.get("value")),
                min: parseFloat(param.get("min")),
                max: parseFloat(param.get("max")),
                default: parseFloat(param.get("default_value"))
            });
        }
        
        var deviceName = device.get("name").toString();
        status("✅ " + deviceName + ": " + params.length + " parameters");
        outputJSON({status: "ok", action: "get_params", device_name: deviceName, params: params});
    } catch (e) {
        status("❌ Get params failed: " + e);
    }
}

function toggleDevice(trackIndex, deviceIndex, state) {
    try {
        var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + deviceIndex);
        var current = parseInt(device.get("is_active"));
        var newState;
        if (state === null || typeof state === "undefined") {
            newState = current ? 0 : 1;
        } else if (typeof state === "boolean") {
            newState = state ? 1 : 0;
        } else {
            newState = parseInt(state) ? 1 : 0;
        }
        device.set("is_active", newState);
        var deviceName = device.get("name").toString();
        status("✅ " + deviceName + ": " + (newState ? "ON" : "OFF"));
        outputJSON({status: "ok", action: "toggle_device", device: deviceName, enabled: newState});
    } catch (e) {
        status("❌ Toggle device failed: " + e);
    }
}

function loadPreset(trackIndex, deviceIndex, presetName) {
    try {
        status("Loading preset: " + presetName);
        
        httpRequest("POST", "/live/devices/load_preset", {
            track_index: trackIndex,
            device_index: deviceIndex,
            preset_name: presetName
        }, function(err, response) {
            if (err) {
                status("❌ Load preset failed: " + err);
            } else {
                status("✅ Loaded preset: " + presetName);
                outputJSON(response);
            }
        });
    } catch (e) {
        status("❌ Load preset failed: " + e);
    }
}

function getDevices(trackIndex) {
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        var deviceIds = track.get("devices");
        var devices = [];
        
        for (var i = 0; i < deviceIds.length; i += 2) {
            var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + Math.floor(i / 2));
            devices.push({
                index: Math.floor(i / 2),
                name: device.get("name").toString(),
                class_name: device.get("class_name").toString(),
                enabled: parseInt(device.get("is_active"))
            });
        }
        
        var trackName = track.get("name").toString();
        status("✅ " + trackName + ": " + devices.length + " devices");
        outputJSON({status: "ok", action: "get_devices", track: trackName, devices: devices});
    } catch (e) {
        status("❌ Get devices failed: " + e);
    }
}

// ============================================================================
// CLIP MANAGEMENT (Live Object Model)
// ============================================================================

function createClip(trackIndex, slotIndex, lengthBeats) {
    try {
        // Validate indices
        validateClipSlot(trackIndex, slotIndex);
        
        // Use safe LOM call with path builder
        var clipSlotPath = buildLOMPath({track: trackIndex, clipSlot: slotIndex});
        var clipSlot = safeLOMCall(
            function(api) {
                // Check if slot is empty
                if (api.get("has_clip")) {
                    throw new Error("Slot already has a clip");
                }
                api.call("create_clip", lengthBeats || 16);
                return true;
            },
            clipSlotPath,
            {name: "createClip", required: true}
        );
        
        if (!clipSlot) {
            throw new Error("Failed to create clip");
        }
        
        // Invalidate cache
        if (lomStateCache) {
            lomStateCache.invalidate("clip_state_" + trackIndex + "_" + slotIndex);
        }
        
        status("✅ Created clip in track " + trackIndex + " slot " + slotIndex);
        outputJSON({status: "ok", action: "create_clip", track: trackIndex, slot: slotIndex, length: lengthBeats});
    } catch (e) {
        status("❌ Create clip failed: " + e);
        outputJSON({status: "error", error: e.toString()});
    }
}

function deleteClip(trackIndex, slotIndex) {
    try {
        var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + slotIndex);
        clipSlot.call("delete_clip");
        status("✅ Deleted clip from track " + trackIndex + " slot " + slotIndex);
        outputJSON({status: "ok", action: "delete_clip", track: trackIndex, slot: slotIndex});
    } catch (e) {
        status("❌ Delete clip failed: " + e);
    }
}

function fireClip(trackIndex, slotIndex) {
    try {
        var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + slotIndex);
        clipSlot.call("fire");
        status("✅ Fired clip: track " + trackIndex + " slot " + slotIndex);
        outputJSON({status: "ok", action: "fire_clip", track: trackIndex, slot: slotIndex});
    } catch (e) {
        status("❌ Fire clip failed: " + e);
    }
}

function stopClip(trackIndex, slotIndex) {
    try {
        if (slotIndex !== null) {
            var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + slotIndex);
            clipSlot.call("stop");
        } else {
            var track = new LiveAPI("live_set tracks " + trackIndex);
            track.call("stop_all_clips");
        }
        status("✅ Stopped clip(s) on track " + trackIndex);
        outputJSON({status: "ok", action: "stop_clip", track: trackIndex, slot: slotIndex});
    } catch (e) {
        status("❌ Stop clip failed: " + e);
    }
}

function duplicateClip(trackIndex, slotIndex, targetTrack, targetSlot) {
    try {
        var sourceClipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + slotIndex);
        
        if (!sourceClipSlot.get("has_clip")) {
            status("❌ No clip in source slot");
            return;
        }
        
        var clip = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + slotIndex + " clip");
        
        // Duplicate to same track next slot if no target specified
        var destTrack = targetTrack !== null ? targetTrack : trackIndex;
        var destSlot = targetSlot;
        
        if (destSlot === null) {
            // Find next empty slot
            var track = new LiveAPI("live_set tracks " + destTrack);
            var clipSlots = track.get("clip_slots");
            for (var i = 0; i < clipSlots.length; i += 2) {
                var slot = new LiveAPI("live_set tracks " + destTrack + " clip_slots " + Math.floor(i / 2));
                if (!slot.get("has_clip")) {
                    destSlot = Math.floor(i / 2);
                    break;
                }
            }
        }
        
        if (destSlot === null) {
            status("❌ No empty slot found");
            return;
        }
        
        clip.call("duplicate_clip_to", destTrack, destSlot);
        status("✅ Duplicated clip to track " + destTrack + " slot " + destSlot);
        outputJSON({status: "ok", action: "duplicate_clip", source_track: trackIndex, source_slot: slotIndex, dest_track: destTrack, dest_slot: destSlot});
    } catch (e) {
        status("❌ Duplicate clip failed: " + e);
    }
}

function setClipNotes(trackIndex, slotIndex) {
    if (noteBuffer.length === 0) {
        status("❌ No notes in buffer - generate first!");
        return;
    }
    
    try {
        var clip = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + slotIndex + " clip");
        
        if (!clip.id) {
            status("❌ No clip in slot");
            return;
        }
        
        // Clear existing notes
        clip.call("remove_notes", 0, 0, 128, 127);
        
        // Set loop length based on notes
        var maxTime = 0;
        for (var i = 0; i < noteBuffer.length; i++) {
            var endTime = noteBuffer[i].start_time + noteBuffer[i].duration;
            if (endTime > maxTime) maxTime = endTime;
        }
        clip.set("loop_end", Math.ceil(maxTime / 4) * 4);  // Round to nearest bar
        
        // Insert notes (batch API: add_new_notes() once, notes(total) once, note() per note, done() once)
        clip.call("add_new_notes");
        clip.call("notes", noteBuffer.length);
        for (var i = 0; i < noteBuffer.length; i++) {
            var note = noteBuffer[i];
            clip.call("note", note.pitch, note.start_time, note.duration, note.velocity, note.mute || 0);
        }
        clip.call("done");
        
        status("✅ Set " + noteBuffer.length + " notes in clip");
        outputJSON({status: "ok", action: "set_clip_notes", track: trackIndex, slot: slotIndex, count: noteBuffer.length});
    } catch (e) {
        status("❌ Set clip notes failed: " + e);
    }
}

function getClipNotes(trackIndex, slotIndex) {
    try {
        var clip = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + slotIndex + " clip");
        
        if (!clip.id) {
            status("❌ No clip in slot");
            return;
        }
        
        var loopEnd = parseFloat(clip.get("loop_end"));
        var notesData = clip.call("get_notes", 0, 0, loopEnd, 128);
        
        // Parse notes data
        var notes = [];
        // notesData format: "notes" count [pitch start duration velocity mute]...
        for (var i = 2; i < notesData.length; i += 5) {
            notes.push({
                pitch: notesData[i],
                start_time: notesData[i + 1],
                duration: notesData[i + 2],
                velocity: notesData[i + 3],
                mute: notesData[i + 4]
            });
        }
        
        noteBuffer = notes;  // Store in buffer for playback/editing
        status("✅ Got " + notes.length + " notes from clip");
        outputJSON({status: "ok", action: "get_clip_notes", track: trackIndex, slot: slotIndex, notes: notes, count: notes.length});
    } catch (e) {
        status("❌ Get clip notes failed: " + e);
    }
}

function getClipInfo(trackIndex, slotIndex) {
    try {
        var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + slotIndex);
        
        if (!clipSlot.get("has_clip")) {
            status("❌ No clip in slot");
            return;
        }
        
        var clip = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + slotIndex + " clip");
        
        var info = {
            track: trackIndex,
            slot: slotIndex,
            name: clip.get("name").toString(),
            color: parseInt(clip.get("color_index")),
            length: parseFloat(clip.get("length")),
            loop_start: parseFloat(clip.get("loop_start")),
            loop_end: parseFloat(clip.get("loop_end")),
            is_playing: parseInt(clip.get("is_playing")),
            is_recording: parseInt(clip.get("is_recording")),
            is_midi_clip: parseInt(clip.get("is_midi_clip"))
        };
        
        status("✅ Clip: " + info.name + " (" + info.length + " beats)");
        outputJSON({status: "ok", action: "get_clip_info", clip: info});
    } catch (e) {
        status("❌ Get clip info failed: " + e);
    }
}

// ============================================================================
// BROWSER/LIBRARY ACCESS
// ============================================================================

// Helper: Parse browser query (BPM:120, key:C, name:kick)
function parseBrowserQuery(query) {
    var parsed = {
        text: "",
        bpm_min: null,
        bpm_max: null,
        key: null,
        name_pattern: null,
        genre: null
    };
    
    // Pattern for KEY:VALUE
    var filterPattern = /(\w+):([^\s,]+)/g;
    var match;
    var freeText = query;
    
    while ((match = filterPattern.exec(query)) !== null) {
        var key = match[1].toLowerCase();
        var value = match[2];
        
        // Remove filter from free text
        freeText = freeText.replace(match[0], "").trim();
        
        if (key === "bpm") {
            // BPM range or single value
            if (value.indexOf("-") !== -1) {
                var parts = value.split("-");
                parsed.bpm_min = parseFloat(parts[0]);
                parsed.bpm_max = parseFloat(parts[1]);
            } else {
                var bpm = parseFloat(value);
                parsed.bpm_min = bpm - 5;
                parsed.bpm_max = bpm + 5;
            }
        } else if (key === "key") {
            parsed.key = value.toUpperCase();
        } else if (key === "name") {
            parsed.name_pattern = value.toLowerCase();
        } else if (key === "genre") {
            parsed.genre = value.toLowerCase();
        }
    }
    
    // Clean up free text
    freeText = freeText.replace(/[,\s]+/g, " ").trim();
    parsed.text = freeText;
    
    return parsed;
}

// Helper: Filter results by parsed query
function filterResults(items, parsed) {
    var filtered = [];
    
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var match = true;
        
        // BPM filter (if item has bpm property)
        if (parsed.bpm_min !== null && item.bpm !== undefined) {
            if (item.bpm < parsed.bpm_min || item.bpm > parsed.bpm_max) {
                match = false;
            }
        }
        
        // Key filter
        if (match && parsed.key && item.key) {
            if (item.key.toUpperCase() !== parsed.key) {
                match = false;
            }
        }
        
        // Name pattern
        if (match && parsed.name_pattern) {
            var nameLower = (item.name || "").toLowerCase();
            if (nameLower.indexOf(parsed.name_pattern) === -1) {
                match = false;
            }
        }
        
        // Text search
        if (match && parsed.text) {
            var textLower = parsed.text.toLowerCase();
            var itemNameLower = (item.name || "").toLowerCase();
            var itemPathLower = (item.path || "").toLowerCase();
            if (itemNameLower.indexOf(textLower) === -1 && itemPathLower.indexOf(textLower) === -1) {
                match = false;
            }
        }
        
        // Genre filter
        if (match && parsed.genre && item.genre) {
            if (item.genre.toLowerCase() !== parsed.genre) {
                match = false;
            }
        }
        
        if (match) {
            filtered.push(item);
        }
    }
    
    return filtered;
}

// Helper: Extract metadata from Live browser item
function extractMetadataFromLiveItem(item) {
    // Try to extract BPM, key, duration from item properties
    // Live browser items may have metadata in various formats
    var metadata = {
        bpm: null,
        key: null,
        duration: null
    };
    
    // Attempt to get metadata (Live API dependent)
    try {
        // These would need to be adapted based on actual Live API structure
        // For now, return null values - can be enhanced later
    } catch (e) {
        // Metadata extraction failed
    }
    
    return metadata;
}

function searchLibrary(query) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1324',message:'searchLibrary called',data:{query:query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    status("Searching library: " + query);
    
    // Parse structured query
    var parsed = parseBrowserQuery(query);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1331',message:'Query parsed',data:{parsed:JSON.stringify(parsed)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Search Live browser via LOM
    var liveResults = [];
    try {
        // Note: Live browser search via LOM is limited
        // We can try to access browser items, but full search may not be available
        // For now, we'll rely on API results and add Live browser items if accessible
        
        // Attempt to get browser items (this is a simplified approach)
        // In practice, Live browser access via LOM is limited
        // The Max device would need to implement browser navigation differently
        
    } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1342',message:'LOM browser search error',data:{error:e.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        post("[Browser] Live browser search error: " + e + "\n");
    }
    
    // Search via API (SERGIK catalog + Live browser results from API)
    var apiUrl = "/live/browser/search?query=" + encodeURIComponent(query);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1348',message:'Calling API search',data:{apiUrl:apiUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    httpRequest("GET", apiUrl, null, function(err, response) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1351',message:'API search callback',data:{hasError:!!err,responseStatus:response ? response.status : null,itemCount:response ? (response.items ? response.items.length : 0) : 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        if (err) {
            status("❌ Search failed: " + err);
            outputJSON({
                status: "error",
                query: query,
                items: [],
                count: 0,
                error: err
            });
        } else {
            // Merge Live browser results with API results
            var allResults = liveResults.concat(response.items || []);
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1362',message:'Merging results',data:{liveResultsCount:liveResults.length,apiResultsCount:response.items ? response.items.length : 0,totalBeforeFilter:allResults.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            
            // Filter by parsed query criteria
            var filtered = filterResults(allResults, parsed);
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1368',message:'Filtering complete',data:{filteredCount:filtered.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            
            status("✅ Found " + filtered.length + " results");
            outputJSON({
                status: "ok",
                query: query,
                items: filtered,
                count: filtered.length
            });
        }
    });
}

function loadSample(trackIndex, samplePath) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1374',message:'loadSample called',data:{trackIndex:trackIndex,samplePath:samplePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    status("Loading sample: " + samplePath);
    
    try {
        // Validate track exists
        var track = new LiveAPI("live_set tracks " + trackIndex);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1382',message:'Track LOM access',data:{trackIndex:trackIndex,hasId:!!track.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        if (!track.id) {
            throw new Error("Track " + trackIndex + " not found");
        }
        
        // Load item into track via LOM
        // Note: load_item may need the full path or URI format
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1389',message:'Calling LOM load_item',data:{samplePath:samplePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        var result = track.call("load_item", samplePath);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1392',message:'LOM load_item result',data:{result:result ? result.toString() : 'null'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Find which clip slot was used (if any)
        var clipSlots = track.get("clip_slots");
        var slotIndex = null;
        var slotCount = Math.floor(clipSlots.length / 2);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1398',message:'Finding clip slot',data:{slotCount:slotCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Try to find the loaded clip slot
        // This is approximate - Live may load to first empty slot or create new
        for (var i = 0; i < slotCount; i++) {
            var slot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + i);
            if (slot.get("has_clip")) {
                var clip = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + i + " clip");
                var clipPath = clip.get("file_path");
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1406',message:'Checking clip slot',data:{slotIndex:i,clipPath:clipPath ? clipPath.toString() : 'null',samplePath:samplePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                
                // Match by filename or full path
                if (clipPath) {
                    var clipPathStr = clipPath.toString();
                    var samplePathBase = samplePath.split("/").pop().split("\\").pop(); // Get filename
                    if (clipPathStr.indexOf(samplePath) !== -1 || clipPathStr.indexOf(samplePathBase) !== -1) {
                        slotIndex = i;
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1413',message:'Found matching clip slot',data:{slotIndex:slotIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                        // #endregion
                        break;
                    }
                }
            }
        }
        
        // Also send to API for logging
        httpRequest("POST", "/live/browser/load", {
            item_path: samplePath,
            track_index: trackIndex
        }, function(err, response) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1425',message:'API load callback',data:{hasError:!!err,responseStatus:response ? response.status : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            
            // API response is for logging/confirmation
            if (!err && response.status === "ok") {
                status("✅ Loaded sample to track " + trackIndex + (slotIndex !== null ? " slot " + slotIndex : ""));
                outputJSON({
                    status: "ok",
                    track_index: trackIndex,
                    item_path: samplePath,
                    clip_slot: slotIndex
                });
            } else {
                // LOM load succeeded but API call failed - still report success
                status("✅ Loaded sample to track " + trackIndex + (slotIndex !== null ? " slot " + slotIndex : ""));
                outputJSON({
                    status: "ok",
                    track_index: trackIndex,
                    item_path: samplePath,
                    clip_slot: slotIndex,
                    note: "LOM load succeeded, API notification failed"
                });
            }
        });
        
    } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1443',message:'loadSample exception',data:{error:e.toString(),trackIndex:trackIndex,samplePath:samplePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        status("❌ Load sample failed: " + e);
        outputJSON({
            status: "error",
            error: e.toString(),
            track_index: trackIndex,
            item_path: samplePath
        });
    }
}

function hotSwapSample(trackIndex, deviceIndex, samplePath) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1444',message:'hotSwapSample called',data:{trackIndex:trackIndex,deviceIndex:deviceIndex,samplePath:samplePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    status("Hot swapping sample...");
    
    try {
        // Get device
        var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + deviceIndex);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1452',message:'Device LOM access',data:{trackIndex:trackIndex,deviceIndex:deviceIndex,hasId:!!device.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (!device.id) {
            throw new Error("Device not found at track " + trackIndex + " device " + deviceIndex);
        }
        
        // Verify device type (Simpler/Sampler only)
        var deviceName = device.get("name").toString();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1460',message:'Device type check',data:{deviceName:deviceName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (deviceName !== "Simpler" && deviceName !== "Sampler") {
            throw new Error("Hot-swap only works with Simpler/Sampler, found: " + deviceName);
        }
        
        // Perform hot-swap via LOM
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1467',message:'Calling LOM hot_swap',data:{samplePath:samplePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        device.call("hot_swap", samplePath);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1471',message:'LOM hot_swap completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // Also send to API for logging
        httpRequest("POST", "/live/browser/hot_swap", {
            track_index: trackIndex,
            device_index: deviceIndex,
            sample_path: samplePath
        }, function(err, response) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1479',message:'API hot_swap callback',data:{hasError:!!err,responseStatus:response ? response.status : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            
            // API response is for logging/confirmation
            if (!err && response.status === "ok") {
                status("✅ Hot-swapped sample in " + deviceName);
                outputJSON({
                    status: "ok",
                    track_index: trackIndex,
                    device_index: deviceIndex,
                    sample_path: samplePath,
                    device_name: deviceName
                });
            } else {
                // LOM hot-swap succeeded but API call failed - still report success
                status("✅ Hot-swapped sample in " + deviceName);
                outputJSON({
                    status: "ok",
                    track_index: trackIndex,
                    device_index: deviceIndex,
                    sample_path: samplePath,
                    device_name: deviceName,
                    note: "LOM hot-swap succeeded, API notification failed"
                });
            }
        });
        
    } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SERGIK_AI_Controller.js:1501',message:'hotSwapSample exception',data:{error:e.toString(),trackIndex:trackIndex,deviceIndex:deviceIndex,samplePath:samplePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        status("❌ Hot swap failed: " + e);
        outputJSON({
            status: "error",
            error: e.toString(),
            track_index: trackIndex,
            device_index: deviceIndex,
            sample_path: samplePath
        });
    }
}

// ============================================================================
// SESSION/SCENE CONTROL
// ============================================================================

function fireScene(sceneIndex) {
    try {
        var scene = new LiveAPI("live_set scenes " + sceneIndex);
        scene.call("fire");
        status("✅ Fired scene " + sceneIndex);
        outputJSON({status: "ok", action: "fire_scene", scene: sceneIndex});
    } catch (e) {
        status("❌ Fire scene failed: " + e);
    }
}

function stopScene() {
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.call("stop_all_clips");
        status("✅ Stopped all clips");
        outputJSON({status: "ok", action: "stop_scene"});
    } catch (e) {
        status("❌ Stop scene failed: " + e);
    }
}

function createScene(name) {
    try {
        var liveSet = new LiveAPI("live_set");
        var sceneCount = Math.floor(liveSet.get("scenes").length / 2);
        liveSet.call("create_scene", sceneCount);
        
        if (name) {
            var scene = new LiveAPI("live_set scenes " + sceneCount);
            scene.set("name", name);
        }
        
        status("✅ Created scene " + (name || sceneCount));
        outputJSON({status: "ok", action: "create_scene", index: sceneCount, name: name});
    } catch (e) {
        status("❌ Create scene failed: " + e);
    }
}

function deleteScene(sceneIndex) {
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.call("delete_scene", sceneIndex);
        status("✅ Deleted scene " + sceneIndex);
        outputJSON({status: "ok", action: "delete_scene", scene: sceneIndex});
    } catch (e) {
        status("❌ Delete scene failed: " + e);
    }
}

function duplicateScene(sceneIndex) {
    try {
        var scene = new LiveAPI("live_set scenes " + sceneIndex);
        scene.call("duplicate");
        status("✅ Duplicated scene " + sceneIndex);
        outputJSON({status: "ok", action: "duplicate_scene", scene: sceneIndex});
    } catch (e) {
        status("❌ Duplicate scene failed: " + e);
    }
}

function setTempo(bpm) {
    try {
        var liveSet = new LiveAPI("live_set");
        bpm = Math.max(20, Math.min(999, bpm));
        liveSet.set("tempo", bpm);
        currentTempo = bpm;
        status("✅ Tempo: " + bpm + " BPM");
        outputJSON({status: "ok", action: "set_tempo", tempo: bpm});
    } catch (e) {
        status("❌ Set tempo failed: " + e);
    }
}

function setQuantization(value) {
    try {
        var liveSet = new LiveAPI("live_set");
        var quantMap = {
            "none": 0,
            "8_bars": 1,
            "4_bars": 2,
            "2_bars": 3,
            "1_bar": 4,
            "1/2": 5,
            "1/4": 6,
            "1/8": 7,
            "1/16": 8,
            "1/32": 9
        };
        
        var quantValue = quantMap[value] !== undefined ? quantMap[value] : 4;  // Default to 1 bar
        liveSet.set("clip_trigger_quantization", quantValue);
        status("✅ Quantization: " + value);
        outputJSON({status: "ok", action: "set_quantization", quantization: value});
    } catch (e) {
        status("❌ Set quantization failed: " + e);
    }
}

function performUndo() {
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.call("undo");
        status("✅ Undo");
        outputJSON({status: "ok", action: "undo"});
    } catch (e) {
        status("❌ Undo failed: " + e);
    }
}

function performRedo() {
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.call("redo");
        status("✅ Redo");
        outputJSON({status: "ok", action: "redo"});
    } catch (e) {
        status("❌ Redo failed: " + e);
    }
}

function getSessionState() {
    try {
        var liveSet = new LiveAPI("live_set");
        
        var state = {
            tempo: parseFloat(liveSet.get("tempo")),
            is_playing: parseInt(liveSet.get("is_playing")),
            current_song_time: parseFloat(liveSet.get("current_song_time")),
            loop_start: parseFloat(liveSet.get("loop_start")),
            loop_length: parseFloat(liveSet.get("loop_length")),
            track_count: Math.floor(liveSet.get("tracks").length / 2),
            scene_count: Math.floor(liveSet.get("scenes").length / 2),
            return_track_count: Math.floor(liveSet.get("return_tracks").length / 2)
        };
        
        status("✅ Session: " + state.tempo + " BPM, " + state.track_count + " tracks, " + state.scene_count + " scenes");
        outputJSON({status: "ok", action: "get_session_state", state: state});
    } catch (e) {
        status("❌ Get session state failed: " + e);
    }
}

// ============================================================================
// TRANSPORT CONTROL
// ============================================================================

function transportPlay() {
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.call("start_playing");
        status("▶️ Playing");
        outputJSON({status: "ok", action: "transport_play"});
    } catch (e) {
        status("❌ Play failed: " + e);
    }
}

function transportStop() {
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.call("stop_playing");
        status("⏹️ Stopped");
        outputJSON({status: "ok", action: "transport_stop"});
    } catch (e) {
        status("❌ Stop failed: " + e);
    }
}

function transportRecord() {
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.set("record_mode", 1);
        liveSet.call("start_playing");
        status("🔴 Recording");
        outputJSON({status: "ok", action: "transport_record"});
    } catch (e) {
        status("❌ Record failed: " + e);
    }
}

function stopAllClips() {
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.call("stop_all_clips");
        status("⏹️ Stopped all clips");
        outputJSON({status: "ok", action: "stop_all_clips"});
    } catch (e) {
        status("❌ Stop all clips failed: " + e);
    }
}

// ============================================================================
// MIXER CONTROL
// ============================================================================

function setTrackSend(trackIndex, sendIndex, level) {
    try {
        var send = new LiveAPI("live_set tracks " + trackIndex + " mixer_device sends " + sendIndex);
        send.set("value", Math.max(0, Math.min(1, level)));
        status("✅ Track " + trackIndex + " Send " + sendIndex + ": " + Math.round(level * 100) + "%");
        outputJSON({status: "ok", action: "set_send", track: trackIndex, send: sendIndex, level: level});
    } catch (e) {
        status("❌ Set send failed: " + e);
    }
}

// ============================================================================
// MIDI GENERATION (API calls)
// ============================================================================

function checkHealth() {
    status("Checking connection...");
    
    httpRequest("GET", "/gpt/health", null, function(err, response) {
        if (err) {
            isConnected = false;
            status("❌ Disconnected: " + err);
        } else {
            isConnected = true;
            status("✅ Connected - " + response.service + " v" + response.version);
        }
    });
}

function generateChords() {
    status("Generating chords in " + currentKey + "...");
    
    var data = {
        key: currentKey,
        bars: currentBars,
        voicing: currentVoicing,
        progression_type: "i-VI-III-VII",
        seventh_chords: true,
        tempo: currentTempo
    };
    
    httpRequest("POST", "/generate/chord_progression", data, function(err, response) {
        if (err) {
            status("❌ Error: " + err);
            return;
        }
        
        if (response.status === "ok") {
            noteBuffer = response.notes;
            status("✅ Generated " + response.count + " chord notes");
            outputJSON(response);
        } else {
            status("❌ " + response.error);
        }
    });
}

function generateBass() {
    status("Generating " + currentStyle + " bass in " + currentKey + "...");
    
    var data = {
        key: currentKey,
        style: currentStyle,
        bars: currentBars,
        chord_progression_type: "i-VI-III-VII",
        tempo: currentTempo
    };
    
    httpRequest("POST", "/generate/walking_bass", data, function(err, response) {
        if (err) {
            status("❌ Error: " + err);
            return;
        }
        
        if (response.status === "ok") {
            noteBuffer = response.notes;
            status("✅ Generated " + response.count + " bass notes");
            outputJSON(response);
        } else {
            status("❌ " + response.error);
        }
    });
}

function generateArpeggios() {
    status("Generating " + currentPattern + " arpeggios in " + currentKey + "...");
    
    var data = {
        key: currentKey,
        pattern: currentPattern,
        bars: currentBars,
        octaves: 2,
        speed: 0.25,
        chord_progression_type: "i-VI-III-VII",
        tempo: currentTempo
    };
    
    httpRequest("POST", "/generate/arpeggios", data, function(err, response) {
        if (err) {
            status("❌ Error: " + err);
            return;
        }
        
        if (response.status === "ok") {
            noteBuffer = response.notes;
            status("✅ Generated " + response.count + " arp notes");
            outputJSON(response);
        } else {
            status("❌ " + response.error);
        }
    });
}

function naturalLanguageGenerate(prompt) {
    status("Processing: " + prompt);
    
    var data = { prompt: prompt };
    
    httpRequest("POST", "/gpt/generate", data, function(err, response) {
        if (err) {
            status("❌ Error: " + err);
            return;
        }
        
        if (response.status === "ok") {
            noteBuffer = response.result.notes;
            status("✅ " + response.result.description);
            outputJSON(response);
        } else {
            status("❌ " + response.error);
        }
    });
}

function naturalLanguageCommand(prompt) {
    status("Processing command: " + prompt);
    
    var data = { prompt: prompt };
    
    httpRequest("POST", "/live/command", data, function(err, response) {
        if (err) {
            status("❌ Error: " + err);
        } else if (response.status === "ok") {
            status("✅ " + (response.result.description || "Command executed"));
            outputJSON(response);
        } else {
            status("❌ " + (response.error || "Unknown error"));
        }
    });
}

// ============================================================================
// DRUM GENERATION
// ============================================================================

function setDrumGenre(genre) {
    currentDrumGenre = genre;
    status("Drum genre: " + currentDrumGenre);
}

function setSwing(amount) {
    currentSwing = Math.max(0, Math.min(100, amount));
    status("Swing: " + currentSwing + "%");
}

function setHumanize(amount) {
    currentHumanize = Math.max(0, Math.min(100, amount));
    status("Humanize: " + currentHumanize + "%");
}

function setDensity(amount) {
    currentDensity = Math.max(0.1, Math.min(2.0, amount));
    status("Density: " + currentDensity);
}

function generateDrums() {
    status("Generating " + currentDrumGenre + " drums (" + currentBars + " bars)...");
    
    var data = {
        genre: currentDrumGenre,
        bars: currentBars,
        tempo: currentTempo,
        swing: currentSwing,
        humanize: currentHumanize,
        density: currentDensity
    };
    
    httpRequest("POST", "/drums/generate", data, function(err, response) {
        if (err) {
            status("❌ Error: " + err);
            return;
        }
        
        if (response.status === "ok") {
            noteBuffer = response.notes;
            status("✅ Generated " + response.count + " drum hits (" + response.genre + ")");
            outputJSON(response);
        } else {
            status("❌ " + response.error);
        }
    });
}

function generateDrumsFast(genre) {
    currentDrumGenre = genre || "house";
    generateDrums();
}

function naturalLanguageDrums(prompt) {
    status("Processing: " + prompt);
    
    var data = { prompt: prompt };
    
    httpRequest("POST", "/gpt/drums", data, function(err, response) {
        if (err) {
            status("❌ Error: " + err);
            return;
        }
        
        if (response.status === "ok") {
            noteBuffer = response.notes;
            status("✅ " + response.description);
            outputJSON(response);
        } else {
            status("❌ " + response.error);
        }
    });
}

function getDrumGenres() {
    httpRequest("GET", "/drums/genres", null, function(err, response) {
        if (err) {
            status("❌ Error: " + err);
            return;
        }
        
        if (response.status === "ok") {
            status("✅ Available genres: " + response.genres.join(", "));
            outputJSON(response);
        }
    });
}

// ============================================================================
// PLAYBACK FUNCTIONS
// ============================================================================

function playNotes() {
    if (noteBuffer.length === 0) {
        status("No notes to play - generate first!");
        return;
    }
    
    status("Playing " + noteBuffer.length + " notes...");
    
    var liveApi = new LiveAPI("live_set");
    currentTempo = liveApi.get("tempo");
    
    var msPerBeat = 60000 / currentTempo;
    
    for (var i = 0; i < noteBuffer.length; i++) {
        var note = noteBuffer[i];
        var startMs = note.start_time * msPerBeat;
        var durationMs = note.duration * msPerBeat;
        scheduleNote(note.pitch, note.velocity, startMs, durationMs);
    }
}

function scheduleNote(pitch, velocity, startMs, durationMs) {
    var noteOnTask = new Task(function() {
        outlet(0, pitch, velocity);
        outlet(2, pitch, startMs, durationMs, velocity);
    });
    noteOnTask.schedule(startMs);
    
    var noteOffTask = new Task(function() {
        outlet(0, pitch, 0);
    });
    noteOffTask.schedule(startMs + durationMs);
}

function stopPlayback() {
    status("Stopped");
}

function clearBuffer() {
    noteBuffer = [];
    status("Buffer cleared");
}

function insertToClip() {
    if (noteBuffer.length === 0) {
        status("No notes to insert - generate first!");
        return;
    }
    
    status("Inserting " + noteBuffer.length + " notes to clip...");
    
    try {
        // Use safe LOM call with path builder
        var clipPath = buildLOMPath({view: true, highlightedClipSlot: true, clip: true});
        var clip = safeLOMCall(
            function(api) {
                if (!api.id) {
                    throw new Error("No clip selected");
                }
                return api;
            },
            clipPath,
            {name: "insertToClip", required: true}
        );
        
        if (!clip) {
            status("❌ No clip selected");
            return;
        }
        
        clip.call("remove_notes", 0, 0, 128, 127);
        
        var loopEnd = currentBars * 4;
        clip.set("loop_end", loopEnd);
        
        // Build the note list that fits within loopEnd
        var notesToInsert = [];
        for (var i = 0; i < noteBuffer.length; i++) {
            var note = noteBuffer[i];
            if (note.start_time >= loopEnd) continue;
            notesToInsert.push({
                pitch: note.pitch,
                start_time: note.start_time,
                duration: Math.min(note.duration, loopEnd - note.start_time),
                velocity: note.velocity,
                mute: note.mute || 0
            });
        }
        
        // Insert notes (batch API)
        clip.call("add_new_notes");
        clip.call("notes", notesToInsert.length);
        for (var j = 0; j < notesToInsert.length; j++) {
            var n = notesToInsert[j];
            clip.call("note", n.pitch, n.start_time, n.duration, n.velocity, n.mute);
        }
        clip.call("done");
        
        status("✅ Inserted " + notesToInsert.length + " notes");
        
    } catch (e) {
        status("❌ Insert failed: " + e);
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getState() {
    return {
        key: currentKey,
        bars: currentBars,
        style: currentStyle,
        voicing: currentVoicing,
        pattern: currentPattern,
        tempo: currentTempo,
        connected: isConnected,
        buffer_size: noteBuffer.length
    };
}

function loadbang() {
    status("SERGIK AI Controller v2.0 loaded");
    status("Full Ableton Integration: Tracks, Devices, Clips, Browser, Session");
    status("API: " + API_BASE_URL);
    
    var initTask = new Task(function() {
        checkHealth();
    });
    initTask.schedule(1000);
}

// Export for testing
if (typeof exports !== 'undefined') {
    exports.generateChords = generateChords;
    exports.generateBass = generateBass;
    exports.generateArpeggios = generateArpeggios;
    exports.createTrack = createTrack;
    exports.getTracks = getTracks;
    exports.fireClip = fireClip;
    exports.setTempo = setTempo;
}
