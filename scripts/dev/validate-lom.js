/**
 * LOM Validation Script
 * 
 * Validates all LOM paths, checks index ranges, verifies object existence,
 * and generates validation report.
 */

// ============================================================================
// Path Validation
// ============================================================================

/**
 * Validate all LOM paths in codebase
 * @param {Array} paths - Array of paths to validate
 * @returns {Object} Validation results
 */
function validateLOMPaths(paths) {
    var results = {
        total: paths.length,
        valid: 0,
        invalid: 0,
        errors: []
    };
    
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        try {
            // Try to create LiveAPI object
            var api = new LiveAPI(path);
            if (api.id) {
                results.valid++;
            } else {
                results.invalid++;
                results.errors.push({
                    path: path,
                    error: "Object does not exist"
                });
            }
        } catch (e) {
            results.invalid++;
            results.errors.push({
                path: path,
                error: e.toString()
            });
        }
    }
    
    return results;
}

// ============================================================================
// Index Range Validation
// ============================================================================

/**
 * Validate index ranges
 * @returns {Object} Validation results
 */
function validateIndexRanges() {
    var results = {
        tracks: {valid: true, count: 0, errors: []},
        devices: {valid: true, count: 0, errors: []},
        clips: {valid: true, count: 0, errors: []}
    };
    
    try {
        var liveSet = new LiveAPI("live_set");
        
        // Validate track indices
        var tracks = liveSet.get("tracks");
        var trackCount = tracks.length / 2;
        results.tracks.count = trackCount;
        
        for (var i = 0; i < trackCount; i++) {
            try {
                var track = new LiveAPI("live_set tracks " + i);
                var trackName = track.get("name");
                
                // Validate device indices
                var devices = track.get("devices");
                var deviceCount = devices.length / 2;
                results.devices.count += deviceCount;
                
                for (var j = 0; j < deviceCount; j++) {
                    try {
                        var device = new LiveAPI("live_set tracks " + i + " devices " + j);
                        var deviceName = device.get("name");
                    } catch (e) {
                        results.devices.errors.push({
                            track: i,
                            device: j,
                            error: e.toString()
                        });
                        results.devices.valid = false;
                    }
                }
                
                // Validate clip slot indices
                var clipSlots = track.get("clip_slots");
                var slotCount = clipSlots.length / 2;
                results.clips.count += slotCount;
                
                for (var k = 0; k < slotCount; k++) {
                    try {
                        var slot = new LiveAPI("live_set tracks " + i + " clip_slots " + k);
                        var hasClip = slot.get("has_clip");
                    } catch (e) {
                        results.clips.errors.push({
                            track: i,
                            slot: k,
                            error: e.toString()
                        });
                        results.clips.valid = false;
                    }
                }
            } catch (e) {
                results.tracks.errors.push({
                    track: i,
                    error: e.toString()
                });
                results.tracks.valid = false;
            }
        }
    } catch (e) {
        results.error = e.toString();
    }
    
    return results;
}

// ============================================================================
// Object Existence Verification
// ============================================================================

/**
 * Verify object existence
 * @param {string} path - LOM path
 * @returns {Object} Verification result
 */
function verifyObjectExistence(path) {
    var result = {
        path: path,
        exists: false,
        properties: {},
        error: null
    };
    
    try {
        var api = new LiveAPI(path);
        result.exists = !!api.id;
        
        if (result.exists) {
            // Try to get common properties
            var commonProps = ["name", "value", "is_active"];
            for (var i = 0; i < commonProps.length; i++) {
                try {
                    result.properties[commonProps[i]] = api.get(commonProps[i]);
                } catch (e) {
                    // Property doesn't exist
                }
            }
        }
    } catch (e) {
        result.error = e.toString();
    }
    
    return result;
}

// ============================================================================
// Validation Report Generator
// ============================================================================

/**
 * Generate validation report
 * @returns {Object} Complete validation report
 */
function generateValidationReport() {
    var report = {
        timestamp: new Date().toISOString(),
        indexRanges: {},
        pathValidation: {},
        summary: {
            valid: true,
            totalErrors: 0,
            recommendations: []
        }
    };
    
    // Validate index ranges
    report.indexRanges = validateIndexRanges();
    
    // Check for errors
    if (!report.indexRanges.tracks.valid) {
        report.summary.valid = false;
        report.summary.totalErrors += report.indexRanges.tracks.errors.length;
    }
    if (!report.indexRanges.devices.valid) {
        report.summary.valid = false;
        report.summary.totalErrors += report.indexRanges.devices.errors.length;
    }
    if (!report.indexRanges.clips.valid) {
        report.summary.valid = false;
        report.summary.totalErrors += report.indexRanges.clips.errors.length;
    }
    
    // Generate recommendations
    if (report.indexRanges.tracks.errors.length > 0) {
        report.summary.recommendations.push(
            "Some tracks cannot be accessed - check track indices"
        );
    }
    if (report.indexRanges.devices.errors.length > 0) {
        report.summary.recommendations.push(
            "Some devices cannot be accessed - check device indices"
        );
    }
    if (report.indexRanges.clips.errors.length > 0) {
        report.summary.recommendations.push(
            "Some clip slots cannot be accessed - check slot indices"
        );
    }
    
    if (report.summary.valid) {
        report.summary.recommendations.push("All validations passed!");
    }
    
    return report;
}

// ============================================================================
// Exports
// ============================================================================

if (typeof exports !== 'undefined') {
    exports.validateLOMPaths = validateLOMPaths;
    exports.validateIndexRanges = validateIndexRanges;
    exports.verifyObjectExistence = verifyObjectExistence;
    exports.generateValidationReport = generateValidationReport;
}

// Console output for Max for Live
if (typeof post !== "undefined") {
    post("LOM Validation Script loaded");
    post("Usage: generateValidationReport() to get complete report");
}

