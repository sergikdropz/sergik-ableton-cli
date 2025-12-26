/**
 * Track Utils - Track iteration and batch operations
 * 
 * Provides utilities for working with tracks in Live Object Model.
 */

// Load dependencies (these would be loaded in Max for Live context)
// var buildLOMPath = require("lom-core").buildLOMPath;
// var safeLOMCall = require("lom-core").safeLOMCall;
// var validateTrackIndex = require("lom-core").validateTrackIndex;
// var lomStateCache = require("lom-cache").lomStateCache;

// ============================================================================
// Track Iteration
// ============================================================================

/**
 * Iterate over all tracks
 * @param {Function} callback - Callback function(track, index)
 * @param {Object} options - Options
 */
function iterateTracks(callback, options) {
    options = options || {};
    
    try {
        var liveSet = new LiveAPI("live_set");
        var tracks = liveSet.get("tracks");
        var count = tracks.length / 2;
        
        for (var i = 0; i < count; i++) {
            var track = new LiveAPI("live_set tracks " + i);
            var shouldContinue = callback(track, i);
            
            // Return false from callback to break
            if (shouldContinue === false) {
                break;
            }
        }
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {name: "iterateTracks"});
        } else {
            post("Error iterating tracks:", e);
        }
    }
}

/**
 * Get all tracks as array
 * @returns {Array} Array of track info objects
 */
function getAllTracks() {
    var tracks = [];
    
    iterateTracks(function(track, index) {
        try {
            tracks.push({
                index: index,
                name: track.get("name").toString(),
                deviceCount: track.get("devices").length / 2,
                clipCount: track.get("clip_slots").length / 2,
                isMidi: track.get("has_midi_input") ? true : false,
                isAudio: track.get("has_audio_input") ? true : false
            });
        } catch (e) {
            // Skip tracks that can't be accessed
        }
        return true; // Continue
    });
    
    return tracks;
}

/**
 * Find track by name
 * @param {string} name - Track name
 * @returns {number} Track index or -1 if not found
 */
function findTrackByName(name) {
    var foundIndex = -1;
    
    iterateTracks(function(track, index) {
        try {
            if (track.get("name").toString() === name) {
                foundIndex = index;
                return false; // Stop iteration
            }
        } catch (e) {
            // Continue
        }
        return true;
    });
    
    return foundIndex;
}

// ============================================================================
// Batch Track Operations
// ============================================================================

/**
 * Get track info for multiple tracks
 * @param {Array} trackIndices - Array of track indices
 * @returns {Array} Array of track info objects
 */
function batchGetTrackInfo(trackIndices) {
    var results = [];
    
    try {
        var liveSet = new LiveAPI("live_set");
        var tracks = liveSet.get("tracks");
        var trackCount = tracks.length / 2;
        
        for (var i = 0; i < trackIndices.length; i++) {
            var index = trackIndices[i];
            
            if (index >= 0 && index < trackCount) {
                try {
                    var track = new LiveAPI("live_set tracks " + index);
                    var volume = new LiveAPI("live_set tracks " + index + " mixer_device volume");
                    var panning = new LiveAPI("live_set tracks " + index + " mixer_device panning");
                    
                    results.push({
                        index: index,
                        name: track.get("name").toString(),
                        deviceCount: track.get("devices").length / 2,
                        clipCount: track.get("clip_slots").length / 2,
                        volume: parseFloat(volume.get("value")),
                        pan: parseFloat(panning.get("value")),
                        muted: track.get("mute") ? true : false,
                        soloed: track.get("solo") ? true : false,
                        armed: track.get("arm") ? true : false
                    });
                } catch (e) {
                    // Skip tracks that can't be accessed
                }
            }
        }
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {name: "batchGetTrackInfo"});
        }
    }
    
    return results;
}

/**
 * Set volume for multiple tracks
 * @param {Object} volumeMap - Map of track index to volume (0-1)
 */
function batchSetVolume(volumeMap) {
    var keys = Object.keys(volumeMap);
    
    for (var i = 0; i < keys.length; i++) {
        var trackIndex = parseInt(keys[i]);
        var volume = Math.max(0, Math.min(1, parseFloat(volumeMap[trackIndex])));
        
        try {
            if (typeof validateTrackIndex === "function") {
                validateTrackIndex(trackIndex);
            }
            
            var mixer = new LiveAPI("live_set tracks " + trackIndex + " mixer_device volume");
            mixer.set("value", volume);
        } catch (e) {
            if (typeof handleLOMError === "function") {
                handleLOMError(e, {name: "batchSetVolume", trackIndex: trackIndex});
            }
        }
    }
}

// ============================================================================
// Track State Management
// ============================================================================

/**
 * Get track state
 * @param {number} trackIndex - Track index
 * @returns {Object} Track state object
 */
function getTrackState(trackIndex) {
    try {
        if (typeof validateTrackIndex === "function") {
            validateTrackIndex(trackIndex);
        }
        
        // Use cache if available
        var cacheKey = "track_state_" + trackIndex;
        if (typeof lomStateCache !== "undefined" && lomStateCache.isFresh(cacheKey)) {
            return lomStateCache.get(cacheKey);
        }
        
        var track = new LiveAPI("live_set tracks " + trackIndex);
        var volume = new LiveAPI("live_set tracks " + trackIndex + " mixer_device volume");
        var panning = new LiveAPI("live_set tracks " + trackIndex + " mixer_device panning");
        
        var state = {
            index: trackIndex,
            name: track.get("name").toString(),
            volume: parseFloat(volume.get("value")),
            pan: parseFloat(panning.get("value")),
            muted: track.get("mute") ? true : false,
            soloed: track.get("solo") ? true : false,
            armed: track.get("arm") ? true : false,
            deviceCount: track.get("devices").length / 2,
            clipCount: track.get("clip_slots").length / 2
        };
        
        // Cache state
        if (typeof lomStateCache !== "undefined") {
            lomStateCache.set(cacheKey, state);
        }
        
        return state;
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {name: "getTrackState", trackIndex: trackIndex});
        }
        return null;
    }
}

/**
 * Synchronize track state (invalidate cache)
 * @param {number} trackIndex - Track index (optional, invalidates all if not provided)
 */
function syncTrackState(trackIndex) {
    if (typeof lomStateCache === "undefined") {
        return;
    }
    
    if (trackIndex !== undefined) {
        lomStateCache.invalidate("track_state_" + trackIndex);
    } else {
        lomStateCache.invalidate("track_state");
    }
}

// ============================================================================
// Exports
// ============================================================================

if (typeof exports !== 'undefined') {
    exports.iterateTracks = iterateTracks;
    exports.getAllTracks = getAllTracks;
    exports.findTrackByName = findTrackByName;
    exports.batchGetTrackInfo = batchGetTrackInfo;
    exports.batchSetVolume = batchSetVolume;
    exports.getTrackState = getTrackState;
    exports.syncTrackState = syncTrackState;
}

