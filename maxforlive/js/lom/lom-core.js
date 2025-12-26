/**
 * LOM Core - Core Live Object Model utilities
 * 
 * Provides path building, safe LOM access, and validation functions.
 */

// ============================================================================
// Path Builder
// ============================================================================

/**
 * Build LOM path from components
 * @param {Object} components - Path components
 * @returns {string} LOM path string
 */
function buildLOMPath(components) {
    var parts = ["live_set"];
    
    if (components.track !== undefined) {
        parts.push("tracks", components.track);
    }
    
    if (components.device !== undefined) {
        parts.push("devices", components.device);
    }
    
    if (components.parameter !== undefined) {
        parts.push("parameters", components.parameter);
    }
    
    if (components.clipSlot !== undefined) {
        parts.push("clip_slots", components.clipSlot);
        if (components.clip) {
            parts.push("clip");
        }
    }
    
    if (components.scene !== undefined) {
        parts.push("scenes", components.scene);
    }
    
    if (components.mixerDevice) {
        parts.push("mixer_device");
        if (components.volume) {
            parts.push("volume");
        } else if (components.panning) {
            parts.push("panning");
        } else if (components.send !== undefined) {
            parts.push("sends", components.send);
        }
    }
    
    if (components.view) {
        parts.push("view");
        if (components.highlightedClipSlot) {
            parts.push("highlighted_clip_slot");
            if (components.clip) {
                parts.push("clip");
            }
        }
    }
    
    if (components.browser) {
        parts = ["live_app", "browser"];
    }
    
    return parts.join(" ");
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate track index
 * @param {number} index - Track index
 * @throws {Error} If index is invalid
 */
function validateTrackIndex(index) {
    if (typeof index !== "number" || index < 0 || !Number.isInteger(index)) {
        throw new Error("Track index must be non-negative integer, got: " + index);
    }
    
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length / 2;
        
        if (index >= trackCount) {
            throw new Error(
                "Track index " + index + " out of range (0-" + (trackCount - 1) + ")"
            );
        }
    } catch (e) {
        if (e.message && e.message.includes("out of range")) {
            throw e;
        }
        // If we can't access live_set, assume it's valid (might be during initialization)
    }
}

/**
 * Validate device index
 * @param {number} trackIndex - Track index
 * @param {number} deviceIndex - Device index
 * @throws {Error} If indices are invalid
 */
function validateDeviceIndex(trackIndex, deviceIndex) {
    validateTrackIndex(trackIndex);
    
    if (typeof deviceIndex !== "number" || deviceIndex < 0 || !Number.isInteger(deviceIndex)) {
        throw new Error("Device index must be non-negative integer, got: " + deviceIndex);
    }
    
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        var deviceCount = track.get("devices").length / 2;
        
        if (deviceIndex >= deviceCount) {
            throw new Error(
                "Device index " + deviceIndex + " out of range (0-" + (deviceCount - 1) + ") on track " + trackIndex
            );
        }
    } catch (e) {
        if (e.message && e.message.includes("out of range")) {
            throw e;
        }
    }
}

/**
 * Validate clip slot index
 * @param {number} trackIndex - Track index
 * @param {number} slotIndex - Clip slot index
 * @throws {Error} If indices are invalid
 */
function validateClipSlot(trackIndex, slotIndex) {
    validateTrackIndex(trackIndex);
    
    if (typeof slotIndex !== "number" || slotIndex < 0 || !Number.isInteger(slotIndex)) {
        throw new Error("Clip slot index must be non-negative integer, got: " + slotIndex);
    }
    
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        var slotCount = track.get("clip_slots").length / 2;
        
        if (slotIndex >= slotCount) {
            throw new Error(
                "Clip slot " + slotIndex + " out of range (0-" + (slotCount - 1) + ") on track " + trackIndex
            );
        }
    } catch (e) {
        if (e.message && e.message.includes("out of range")) {
            throw e;
        }
    }
}

/**
 * Validate scene index
 * @param {number} sceneIndex - Scene index
 * @throws {Error} If index is invalid
 */
function validateSceneIndex(sceneIndex) {
    if (typeof sceneIndex !== "number" || sceneIndex < 0 || !Number.isInteger(sceneIndex)) {
        throw new Error("Scene index must be non-negative integer, got: " + sceneIndex);
    }
    
    try {
        var liveSet = new LiveAPI("live_set");
        var sceneCount = liveSet.get("scenes").length / 2;
        
        if (sceneIndex >= sceneCount) {
            throw new Error(
                "Scene index " + sceneIndex + " out of range (0-" + (sceneCount - 1) + ")"
            );
        }
    } catch (e) {
        if (e.message && e.message.includes("out of range")) {
            throw e;
        }
    }
}

// ============================================================================
// Safe LOM Call
// ============================================================================

/**
 * Safe LOM call with error handling
 * @param {Function} operation - Operation to perform on LiveAPI object
 * @param {string} path - LOM path
 * @param {Object} context - Context information
 * @returns {*} Operation result
 */
function safeLOMCall(operation, path, context) {
    context = context || {};
    
    try {
        var api = new LiveAPI(path);
        
        // Verify object exists if required
        if (context.required && !api.id) {
            throw new Error("LOM object does not exist: " + path);
        }
        
        // Perform operation
        var result = operation(api);
        return result;
        
    } catch (e) {
        // Handle error
        var errorContext = {
            operation: context.name || "unknown",
            path: path,
            timestamp: new Date().toISOString(),
            error: e.toString(),
            ...context
        };
        
        // Log error if logger available
        if (typeof handleLOMError === "function") {
            handleLOMError(e, errorContext);
        } else {
            post("LOM Error:", context.name || "unknown", path, e);
        }
        
        // Throw or return null based on context
        if (context.throwOnError !== false) {
            var error = new Error("LOM operation failed: " + e.toString());
            error.context = errorContext;
            throw error;
        }
        
        return null;
    }
}

/**
 * Get LOM object safely
 * @param {string} path - LOM path
 * @param {Object} options - Options
 * @returns {LiveAPI} LiveAPI object or null
 */
function getLOMObject(path, options) {
    options = options || {};
    return safeLOMCall(
        function(api) { return api; },
        path,
        {
            name: options.name || "getLOMObject",
            required: options.required !== false,
            throwOnError: options.throwOnError !== false
        }
    );
}

// ============================================================================
// Exports
// ============================================================================

// Export for use in Max for Live
if (typeof exports !== 'undefined') {
    exports.buildLOMPath = buildLOMPath;
    exports.validateTrackIndex = validateTrackIndex;
    exports.validateDeviceIndex = validateDeviceIndex;
    exports.validateClipSlot = validateClipSlot;
    exports.validateSceneIndex = validateSceneIndex;
    exports.safeLOMCall = safeLOMCall;
    exports.getLOMObject = getLOMObject;
}

