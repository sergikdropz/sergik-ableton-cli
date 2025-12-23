/*
SERGIK OSC Receiver - Max for Live Device
JavaScript for receiving OSC messages from SERGIK CLI

Installation:
1. Create a new MIDI Effect in Max for Live
2. Add a [js] object and load this file
3. Add [udpreceive 9000] connected to this script
4. Route output to [midiout]

OSC Messages:
  /sergik/midi/note [track] [pitch] [velocity] [start] [duration]
  /sergik/pattern/drums [json_data]
  /live/song/set/tempo [bpm]
  /live/song/start_playing [1]
  /live/song/stop_playing [1]
*/

// Inlets: 1 (OSC messages from udpreceive)
// Outlets: 2 (MIDI out, Info out)
inlets = 1;
outlets = 2;

// Global state
var pendingNotes = [];
var currentTrack = 0;

function msg_int(v) {
    // Handle raw integers (usually from OSC)
    post("Received int: " + v + "\n");
}

function msg_float(v) {
    // Handle raw floats
    post("Received float: " + v + "\n");
}

function list() {
    // Handle OSC messages as lists
    var args = arrayfromargs(arguments);
    post("Received list: " + args.join(", ") + "\n");
}

// Main OSC message handler
function anything() {
    var address = messagename;
    var args = arrayfromargs(arguments);

    post("OSC: " + address + " " + args.join(" ") + "\n");

    // Route based on OSC address
    if (address.indexOf("/sergik/midi/note") === 0) {
        handleMidiNote(args);
    } else if (address.indexOf("/sergik/pattern/") === 0) {
        handlePattern(address, args);
    } else if (address.indexOf("/live/song/set/tempo") === 0) {
        handleTempo(args);
    } else if (address.indexOf("/live/song/start_playing") === 0) {
        handlePlay();
    } else if (address.indexOf("/live/song/stop_playing") === 0) {
        handleStop();
    } else if (address.indexOf("/live/track/set/volume") === 0) {
        handleVolume(args);
    } else if (address.indexOf("/live/clip/fire") === 0) {
        handleFireClip(args);
    }
}

// Handle individual MIDI note
function handleMidiNote(args) {
    // args: [track, pitch, velocity, start_beat, duration]
    if (args.length < 5) {
        post("Invalid note message\n");
        return;
    }

    var track = args[0];
    var pitch = args[1];
    var velocity = args[2];
    var start = args[3];
    var duration = args[4];

    // Convert to MIDI
    // Output note on immediately (scheduling would require metro)
    outlet(0, [144, pitch, velocity]);  // Note on

    // Schedule note off (using delay in ms based on BPM)
    // Assuming 120 BPM default, 1 beat = 500ms
    var durationMs = duration * 500;  // Rough approximation

    // For proper timing, you'd use a Task or metro object
    // This is simplified for demonstration
    outlet(1, "note", track, pitch, velocity, start, duration);
}

// Handle pattern data (JSON)
function handlePattern(address, args) {
    var patternType = address.split("/").pop();

    try {
        var patternData = JSON.parse(args[0]);
        outlet(1, "pattern", patternType, JSON.stringify(patternData));
        post("Received " + patternType + " pattern\n");
    } catch (e) {
        post("Error parsing pattern: " + e + "\n");
    }
}

// Handle tempo change
function handleTempo(args) {
    if (args.length > 0) {
        var bpm = args[0];
        // Use Live API to set tempo
        var api = new LiveAPI("live_set");
        api.set("tempo", bpm);
        outlet(1, "tempo", bpm);
        post("Tempo set to: " + bpm + "\n");
    }
}

// Handle play
function handlePlay() {
    var api = new LiveAPI("live_set");
    api.call("start_playing");
    outlet(1, "transport", "play");
    post("Playback started\n");
}

// Handle stop
function handleStop() {
    var api = new LiveAPI("live_set");
    api.call("stop_playing");
    outlet(1, "transport", "stop");
    post("Playback stopped\n");
}

// Handle volume
function handleVolume(args) {
    if (args.length >= 2) {
        var track = args[0];
        var volume = args[1];

        var api = new LiveAPI("live_set tracks " + track);
        api.set("mixer_device volume value", volume);
        outlet(1, "volume", track, volume);
        post("Track " + track + " volume: " + volume + "\n");
    }
}

// Handle fire clip
function handleFireClip(args) {
    if (args.length >= 2) {
        var track = args[0];
        var clip = args[1];

        var api = new LiveAPI("live_set tracks " + track + " clip_slots " + clip + " clip");
        api.call("fire");
        outlet(1, "clip", track, clip);
        post("Fired clip " + clip + " on track " + track + "\n");
    }
}

// Initialize
function loadbang() {
    post("SERGIK OSC Receiver loaded\n");
    post("Listening for OSC on port 9000\n");
}
