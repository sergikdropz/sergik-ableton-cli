/**
 * Clip Utils - Clip note batch insertion and state management
 * 
 * Provides utilities for working with clips in Live Object Model.
 */

// ============================================================================
// Clip Note Batch Insertion
// ============================================================================

/**
 * Insert notes batch into clip
 * @param {string} clipPath - LOM path to clip
 * @param {Array} notes - Array of note objects {pitch, start_time, duration, velocity, mute}
 * @param {Object} options - Options {clearExisting, loopEnd}
 */
function insertNotesBatch(clipPath, notes, options) {
    options = options || {};
    
    try {
        var clip = new LiveAPI(clipPath);
        
        if (!clip.id) {
            throw new Error("Clip does not exist: " + clipPath);
        }
        
        // Clear existing notes if requested
        if (options.clearExisting !== false) {
            clip.call("remove_notes", 0, 0, 128, 127);
        }
        
        // Set loop end if provided
        if (options.loopEnd !== undefined) {
            clip.set("loop_end", options.loopEnd);
        }
        
        // Batch insert notes
        clip.call("add_new_notes");
        clip.call("notes", notes.length);
        
        for (var i = 0; i < notes.length; i++) {
            var note = notes[i];
            clip.call("note",
                note.pitch || 60,
                note.start_time || 0,
                note.duration || 1,
                note.velocity || 100,
                note.mute || 0
            );
        }
        
        clip.call("done");
        
        return true;
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {
                name: "insertNotesBatch",
                clipPath: clipPath,
                noteCount: notes.length
            });
        } else {
            post("Error inserting notes:", e);
        }
        return false;
    }
}

/**
 * Insert notes into clip by track and slot
 * @param {number} trackIndex - Track index
 * @param {number} slotIndex - Clip slot index
 * @param {Array} notes - Array of note objects
 * @param {Object} options - Options
 */
function insertNotesToClip(trackIndex, slotIndex, notes, options) {
    options = options || {};
    
    try {
        if (typeof validateClipSlot === "function") {
            validateClipSlot(trackIndex, slotIndex);
        }
        
        var clipPath = "live_set tracks " + trackIndex + " clip_slots " + slotIndex + " clip";
        return insertNotesBatch(clipPath, notes, options);
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {
                name: "insertNotesToClip",
                trackIndex: trackIndex,
                slotIndex: slotIndex
            });
        }
        return false;
    }
}

/**
 * Get notes from clip
 * @param {number} trackIndex - Track index
 * @param {number} slotIndex - Clip slot index
 * @returns {Array} Array of note objects
 */
function getClipNotes(trackIndex, slotIndex) {
    var notes = [];
    
    try {
        if (typeof validateClipSlot === "function") {
            validateClipSlot(trackIndex, slotIndex);
        }
        
        var clip = new LiveAPI(
            "live_set tracks " + trackIndex + " clip_slots " + slotIndex + " clip"
        );
        
        if (!clip.id) {
            return notes; // Empty clip
        }
        
        var noteCount = clip.get("notes");
        if (!noteCount || noteCount.length === 0) {
            return notes;
        }
        
        // Note: LiveAPI note access is limited, this is a simplified version
        // Full note extraction would require iterating through note ranges
        // For now, return basic clip info
        
        return {
            hasNotes: noteCount > 0,
            noteCount: noteCount,
            length: parseFloat(clip.get("length")),
            loopStart: parseFloat(clip.get("loop_start")),
            loopEnd: parseFloat(clip.get("loop_end"))
        };
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {
                name: "getClipNotes",
                trackIndex: trackIndex,
                slotIndex: slotIndex
            });
        }
        return [];
    }
}

// ============================================================================
// Clip State Management
// ============================================================================

/**
 * Get clip state
 * @param {number} trackIndex - Track index
 * @param {number} slotIndex - Clip slot index
 * @returns {Object} Clip state object
 */
function getClipState(trackIndex, slotIndex) {
    try {
        if (typeof validateClipSlot === "function") {
            validateClipSlot(trackIndex, slotIndex);
        }
        
        // Use cache if available
        var cacheKey = "clip_state_" + trackIndex + "_" + slotIndex;
        if (typeof lomStateCache !== "undefined" && lomStateCache.isFresh(cacheKey)) {
            return lomStateCache.get(cacheKey);
        }
        
        var clipSlot = new LiveAPI(
            "live_set tracks " + trackIndex + " clip_slots " + slotIndex
        );
        
        var hasClip = clipSlot.get("has_clip") ? true : false;
        var state = {
            trackIndex: trackIndex,
            slotIndex: slotIndex,
            hasClip: hasClip
        };
        
        if (hasClip) {
            var clip = new LiveAPI(
                "live_set tracks " + trackIndex + " clip_slots " + slotIndex + " clip"
            );
            
            state.name = clip.get("name").toString();
            state.length = parseFloat(clip.get("length"));
            state.loopStart = parseFloat(clip.get("loop_start"));
            state.loopEnd = parseFloat(clip.get("loop_end"));
            state.isPlaying = clip.get("is_playing") ? true : false;
            state.isRecording = clip.get("is_recording") ? true : false;
        }
        
        // Cache state
        if (typeof lomStateCache !== "undefined") {
            lomStateCache.set(cacheKey, state);
        }
        
        return state;
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {
                name: "getClipState",
                trackIndex: trackIndex,
                slotIndex: slotIndex
            });
        }
        return null;
    }
}

/**
 * Synchronize clip state (invalidate cache)
 * @param {number} trackIndex - Track index
 * @param {number} slotIndex - Clip slot index (optional)
 */
function syncClipState(trackIndex, slotIndex) {
    if (typeof lomStateCache === "undefined") {
        return;
    }
    
    if (slotIndex !== undefined) {
        lomStateCache.invalidate("clip_state_" + trackIndex + "_" + slotIndex);
    } else {
        lomStateCache.invalidate("clip_state_" + trackIndex);
    }
}

// ============================================================================
// Clip Duplication Utilities
// ============================================================================

/**
 * Duplicate clip to another slot
 * @param {number} sourceTrack - Source track index
 * @param {number} sourceSlot - Source slot index
 * @param {number} destTrack - Destination track index
 * @param {number} destSlot - Destination slot index
 * @returns {boolean} Success
 */
function duplicateClipToSlot(sourceTrack, sourceSlot, destTrack, destSlot) {
    try {
        if (typeof validateClipSlot === "function") {
            validateClipSlot(sourceTrack, sourceSlot);
            validateClipSlot(destTrack, destSlot);
        }
        
        var sourceClipSlot = new LiveAPI(
            "live_set tracks " + sourceTrack + " clip_slots " + sourceSlot
        );
        
        if (!sourceClipSlot.get("has_clip")) {
            throw new Error("Source slot has no clip");
        }
        
        var clip = new LiveAPI(
            "live_set tracks " + sourceTrack + " clip_slots " + sourceSlot + " clip"
        );
        
        clip.call("duplicate_clip_to", destTrack, destSlot);
        
        // Invalidate cache
        syncClipState(destTrack, destSlot);
        
        return true;
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {
                name: "duplicateClipToSlot",
                sourceTrack: sourceTrack,
                sourceSlot: sourceSlot,
                destTrack: destTrack,
                destSlot: destSlot
            });
        }
        return false;
    }
}

/**
 * Find next empty clip slot
 * @param {number} trackIndex - Track index
 * @param {number} startSlot - Starting slot index
 * @returns {number} Empty slot index or -1 if not found
 */
function findNextEmptySlot(trackIndex, startSlot) {
    startSlot = startSlot || 0;
    
    try {
        if (typeof validateTrackIndex === "function") {
            validateTrackIndex(trackIndex);
        }
        
        var track = new LiveAPI("live_set tracks " + trackIndex);
        var clipSlots = track.get("clip_slots");
        var count = clipSlots.length / 2;
        
        for (var i = startSlot; i < count; i++) {
            var slot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + i);
            if (!slot.get("has_clip")) {
                return i;
            }
        }
        
        return -1; // No empty slot found
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {
                name: "findNextEmptySlot",
                trackIndex: trackIndex,
                startSlot: startSlot
            });
        }
        return -1;
    }
}

// ============================================================================
// Exports
// ============================================================================

if (typeof exports !== 'undefined') {
    exports.insertNotesBatch = insertNotesBatch;
    exports.insertNotesToClip = insertNotesToClip;
    exports.getClipNotes = getClipNotes;
    exports.getClipState = getClipState;
    exports.syncClipState = syncClipState;
    exports.duplicateClipToSlot = duplicateClipToSlot;
    exports.findNextEmptySlot = findNextEmptySlot;
}

