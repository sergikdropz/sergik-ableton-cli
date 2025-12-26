/**
 * Device Utils - Device parameter iteration and batch operations
 * 
 * Provides utilities for working with devices in Live Object Model.
 */

// ============================================================================
// Device Parameter Iteration
// ============================================================================

/**
 * Iterate over device parameters
 * @param {number} trackIndex - Track index
 * @param {number} deviceIndex - Device index
 * @param {Function} callback - Callback function(param, index)
 */
function iterateDeviceParameters(trackIndex, deviceIndex, callback) {
    try {
        if (typeof validateDeviceIndex === "function") {
            validateDeviceIndex(trackIndex, deviceIndex);
        }
        
        var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + deviceIndex);
        var params = device.get("parameters");
        var count = params.length / 2;
        
        for (var i = 0; i < count; i++) {
            var param = new LiveAPI(
                "live_set tracks " + trackIndex + " devices " + deviceIndex + " parameters " + i
            );
            callback(param, i);
        }
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {
                name: "iterateDeviceParameters",
                trackIndex: trackIndex,
                deviceIndex: deviceIndex
            });
        } else {
            post("Error iterating device parameters:", e);
        }
    }
}

/**
 * Get all device parameters
 * @param {number} trackIndex - Track index
 * @param {number} deviceIndex - Device index
 * @returns {Array} Array of parameter info objects
 */
function getDeviceParameters(trackIndex, deviceIndex) {
    var params = [];
    
    iterateDeviceParameters(trackIndex, deviceIndex, function(param, index) {
        try {
            params.push({
                index: index,
                name: param.get("name").toString(),
                value: parseFloat(param.get("value")),
                min: parseFloat(param.get("min")),
                max: parseFloat(param.get("max")),
                default: parseFloat(param.get("default_value")),
                isQuantized: param.get("is_quantized") ? true : false
            });
        } catch (e) {
            // Skip parameters that can't be accessed
        }
    });
    
    return params;
}

/**
 * Find parameter by name
 * @param {number} trackIndex - Track index
 * @param {number} deviceIndex - Device index
 * @param {string} paramName - Parameter name
 * @returns {number} Parameter index or -1 if not found
 */
function findParameterByName(trackIndex, deviceIndex, paramName) {
    var foundIndex = -1;
    
    iterateDeviceParameters(trackIndex, deviceIndex, function(param, index) {
        try {
            if (param.get("name").toString().toLowerCase() === paramName.toLowerCase()) {
                foundIndex = index;
                return false; // Stop iteration (if callback supports it)
            }
        } catch (e) {
            // Continue
        }
    });
    
    return foundIndex;
}

// ============================================================================
// Parameter Batch Updates
// ============================================================================

/**
 * Set multiple parameters at once
 * @param {number} trackIndex - Track index
 * @param {number} deviceIndex - Device index
 * @param {Object} paramMap - Map of parameter index/name to value
 */
function batchSetParameters(trackIndex, deviceIndex, paramMap) {
    try {
        if (typeof validateDeviceIndex === "function") {
            validateDeviceIndex(trackIndex, deviceIndex);
        }
        
        var keys = Object.keys(paramMap);
        
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = paramMap[key];
            
            // Convert parameter name to index if needed
            var paramIndex = key;
            if (isNaN(key)) {
                paramIndex = findParameterByName(trackIndex, deviceIndex, key);
                if (paramIndex === -1) {
                    continue; // Skip if not found
                }
            } else {
                paramIndex = parseInt(key);
            }
            
            try {
                var param = new LiveAPI(
                    "live_set tracks " + trackIndex + 
                    " devices " + deviceIndex + 
                    " parameters " + paramIndex
                );
                
                // Clamp value to min/max
                var min = parseFloat(param.get("min"));
                var max = parseFloat(param.get("max"));
                var clampedValue = Math.max(min, Math.min(max, parseFloat(value)));
                
                param.set("value", clampedValue);
            } catch (e) {
                if (typeof handleLOMError === "function") {
                    handleLOMError(e, {
                        name: "batchSetParameters",
                        trackIndex: trackIndex,
                        deviceIndex: deviceIndex,
                        paramIndex: paramIndex
                    });
                }
            }
        }
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {
                name: "batchSetParameters",
                trackIndex: trackIndex,
                deviceIndex: deviceIndex
            });
        }
    }
}

// ============================================================================
// Device State Synchronization
// ============================================================================

/**
 * Get device state
 * @param {number} trackIndex - Track index
 * @param {number} deviceIndex - Device index
 * @returns {Object} Device state object
 */
function getDeviceState(trackIndex, deviceIndex) {
    try {
        if (typeof validateDeviceIndex === "function") {
            validateDeviceIndex(trackIndex, deviceIndex);
        }
        
        // Use cache if available
        var cacheKey = "device_state_" + trackIndex + "_" + deviceIndex;
        if (typeof lomStateCache !== "undefined" && lomStateCache.isFresh(cacheKey)) {
            return lomStateCache.get(cacheKey);
        }
        
        var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + deviceIndex);
        
        var state = {
            trackIndex: trackIndex,
            deviceIndex: deviceIndex,
            name: device.get("name").toString(),
            className: device.get("class_name").toString(),
            enabled: device.get("is_active") ? true : false,
            parameters: getDeviceParameters(trackIndex, deviceIndex)
        };
        
        // Cache state
        if (typeof lomStateCache !== "undefined") {
            lomStateCache.set(cacheKey, state);
        }
        
        return state;
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {
                name: "getDeviceState",
                trackIndex: trackIndex,
                deviceIndex: deviceIndex
            });
        }
        return null;
    }
}

/**
 * Synchronize device state (invalidate cache)
 * @param {number} trackIndex - Track index
 * @param {number} deviceIndex - Device index (optional)
 */
function syncDeviceState(trackIndex, deviceIndex) {
    if (typeof lomStateCache === "undefined") {
        return;
    }
    
    if (deviceIndex !== undefined) {
        lomStateCache.invalidate("device_state_" + trackIndex + "_" + deviceIndex);
    } else {
        lomStateCache.invalidate("device_state_" + trackIndex);
    }
}

/**
 * Get all devices on a track
 * @param {number} trackIndex - Track index
 * @returns {Array} Array of device info objects
 */
function getTrackDevices(trackIndex) {
    var devices = [];
    
    try {
        if (typeof validateTrackIndex === "function") {
            validateTrackIndex(trackIndex);
        }
        
        var track = new LiveAPI("live_set tracks " + trackIndex);
        var deviceIds = track.get("devices");
        var count = deviceIds.length / 2;
        
        for (var i = 0; i < count; i++) {
            try {
                var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + i);
                devices.push({
                    index: i,
                    name: device.get("name").toString(),
                    className: device.get("class_name").toString(),
                    enabled: device.get("is_active") ? true : false
                });
            } catch (e) {
                // Skip devices that can't be accessed
            }
        }
    } catch (e) {
        if (typeof handleLOMError === "function") {
            handleLOMError(e, {name: "getTrackDevices", trackIndex: trackIndex});
        }
    }
    
    return devices;
}

// ============================================================================
// Exports
// ============================================================================

if (typeof exports !== 'undefined') {
    exports.iterateDeviceParameters = iterateDeviceParameters;
    exports.getDeviceParameters = getDeviceParameters;
    exports.findParameterByName = findParameterByName;
    exports.batchSetParameters = batchSetParameters;
    exports.getDeviceState = getDeviceState;
    exports.syncDeviceState = syncDeviceState;
    exports.getTrackDevices = getTrackDevices;
}

