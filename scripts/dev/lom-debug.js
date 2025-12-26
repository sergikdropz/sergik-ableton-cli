/**
 * LOM Debug Tool - LOM debugging and inspection utility
 * 
 * Provides LOM path inspector, state viewer, error analyzer, and performance profiler.
 */

// ============================================================================
// LOM Path Inspector
// ============================================================================

/**
 * Inspect LOM path
 * @param {string} path - LOM path to inspect
 * @returns {Object} Inspection results
 */
function inspectLOMPath(path) {
    var result = {
        path: path,
        valid: false,
        components: {},
        objectExists: false,
        properties: {},
        error: null
    };
    
    try {
        // Parse path components
        var parts = path.split(" ");
        result.components = {
            base: parts[0] || "live_set",
            track: null,
            device: null,
            parameter: null,
            clipSlot: null,
            clip: false
        };
        
        // Extract components
        for (var i = 0; i < parts.length; i++) {
            if (parts[i] === "tracks" && i + 1 < parts.length) {
                result.components.track = parseInt(parts[i + 1]);
            } else if (parts[i] === "devices" && i + 1 < parts.length) {
                result.components.device = parseInt(parts[i + 1]);
            } else if (parts[i] === "parameters" && i + 1 < parts.length) {
                result.components.parameter = parseInt(parts[i + 1]);
            } else if (parts[i] === "clip_slots" && i + 1 < parts.length) {
                result.components.clipSlot = parseInt(parts[i + 1]);
            } else if (parts[i] === "clip") {
                result.components.clip = true;
            }
        }
        
        // Try to access object
        try {
            var api = new LiveAPI(path);
            result.objectExists = !!api.id;
            
            if (result.objectExists) {
                // Get common properties
                var commonProps = ["name", "value", "is_active", "has_clip", "length"];
                for (var j = 0; j < commonProps.length; j++) {
                    try {
                        result.properties[commonProps[j]] = api.get(commonProps[j]);
                    } catch (e) {
                        // Property doesn't exist for this object type
                    }
                }
            }
            
            result.valid = true;
        } catch (e) {
            result.error = e.toString();
        }
    } catch (e) {
        result.error = e.toString();
    }
    
    return result;
}

// ============================================================================
// State Viewer
// ============================================================================

/**
 * View current LOM state
 * @returns {Object} State information
 */
function viewLOMState() {
    var state = {
        timestamp: new Date().toISOString(),
        tracks: [],
        devices: [],
        clips: [],
        session: {}
    };
    
    try {
        var liveSet = new LiveAPI("live_set");
        
        // Session info
        state.session = {
            tempo: liveSet.get("tempo"),
            trackCount: liveSet.get("tracks").length / 2,
            sceneCount: liveSet.get("scenes").length / 2
        };
        
        // Track info
        var tracks = liveSet.get("tracks");
        var trackCount = tracks.length / 2;
        for (var i = 0; i < trackCount; i++) {
            try {
                var track = new LiveAPI("live_set tracks " + i);
                state.tracks.push({
                    index: i,
                    name: track.get("name").toString(),
                    deviceCount: track.get("devices").length / 2,
                    clipCount: track.get("clip_slots").length / 2
                });
            } catch (e) {
                // Skip tracks that can't be accessed
            }
        }
        
        // Device info (first track only for brevity)
        if (trackCount > 0) {
            try {
                var track = new LiveAPI("live_set tracks 0");
                var devices = track.get("devices");
                var deviceCount = devices.length / 2;
                for (var j = 0; j < deviceCount; j++) {
                    try {
                        var device = new LiveAPI("live_set tracks 0 devices " + j);
                        state.devices.push({
                            trackIndex: 0,
                            deviceIndex: j,
                            name: device.get("name").toString(),
                            className: device.get("class_name").toString(),
                            enabled: device.get("is_active") ? true : false
                        });
                    } catch (e) {
                        // Skip devices that can't be accessed
                    }
                }
            } catch (e) {
                // Skip if track can't be accessed
            }
        }
    } catch (e) {
        state.error = e.toString();
    }
    
    return state;
}

// ============================================================================
// Error Analyzer
// ============================================================================

/**
 * Analyze LOM errors
 * @param {number} count - Number of recent errors to analyze
 * @returns {Object} Error analysis
 */
function analyzeLOMErrors(count) {
    count = count || 10;
    
    var analysis = {
        total: 0,
        byType: {},
        byOperation: {},
        recent: [],
        recommendations: []
    };
    
    if (typeof lomErrorHandler !== "undefined" && lomErrorHandler.getRecentErrors) {
        var errors = lomErrorHandler.getRecentErrors(count);
        analysis.total = errors.length;
        
        for (var i = 0; i < errors.length; i++) {
            var error = errors[i];
            var type = error.classification ? error.classification.type : "UNKNOWN";
            
            // Count by type
            analysis.byType[type] = (analysis.byType[type] || 0) + 1;
            
            // Count by operation
            var operation = error.context ? error.context.operation : "unknown";
            analysis.byOperation[operation] = (analysis.byOperation[operation] || 0) + 1;
            
            // Add to recent
            analysis.recent.push({
                type: type,
                operation: operation,
                message: error.error ? error.error.toString() : "Unknown error",
                timestamp: error.timestamp
            });
        }
        
        // Generate recommendations
        if (analysis.byType["INVALID_PATH"] > 0) {
            analysis.recommendations.push("Check LOM path construction - invalid paths detected");
        }
        if (analysis.byType["TRANSIENT"] > 0) {
            analysis.recommendations.push("Consider adding retry logic for transient errors");
        }
        if (analysis.byType["PERMISSION"] > 0) {
            analysis.recommendations.push("Check read-only access - permission errors detected");
        }
    }
    
    return analysis;
}

// ============================================================================
// Performance Profiler
// ============================================================================

/**
 * Profile LOM operations
 * @returns {Object} Performance metrics
 */
function profileLOMOperations() {
    var metrics = {
        operations: {},
        summary: {
            total: 0,
            avgDuration: 0,
            maxDuration: 0,
            minDuration: Infinity
        }
    };
    
    if (typeof lomOperationLogger !== "undefined" && lomOperationLogger.getPerformanceMetrics) {
        var perfMetrics = lomOperationLogger.getPerformanceMetrics();
        metrics.operations = perfMetrics;
        
        // Calculate summary
        var totalDuration = 0;
        var totalCount = 0;
        
        for (var op in perfMetrics) {
            var metric = perfMetrics[op];
            totalDuration += metric.totalDuration || 0;
            totalCount += metric.count || 0;
            
            if (metric.maxDuration > metrics.summary.maxDuration) {
                metrics.summary.maxDuration = metric.maxDuration;
            }
            if (metric.minDuration < metrics.summary.minDuration) {
                metrics.summary.minDuration = metric.minDuration;
            }
        }
        
        metrics.summary.total = totalCount;
        metrics.summary.avgDuration = totalCount > 0 ? totalDuration / totalCount : 0;
        
        if (metrics.summary.minDuration === Infinity) {
            metrics.summary.minDuration = 0;
        }
    }
    
    return metrics;
}

// ============================================================================
// Main Debug Function
// ============================================================================

/**
 * Run all debug tools
 * @returns {Object} Complete debug report
 */
function runLOMDebug() {
    var report = {
        timestamp: new Date().toISOString(),
        pathInspection: {},
        state: {},
        errors: {},
        performance: {}
    };
    
    // Inspect common paths
    var commonPaths = [
        "live_set",
        "live_set tracks 0",
        "live_set tracks 0 devices 0"
    ];
    
    report.pathInspection = {};
    for (var i = 0; i < commonPaths.length; i++) {
        report.pathInspection[commonPaths[i]] = inspectLOMPath(commonPaths[i]);
    }
    
    // View state
    report.state = viewLOMState();
    
    // Analyze errors
    report.errors = analyzeLOMErrors(10);
    
    // Profile performance
    report.performance = profileLOMOperations();
    
    return report;
}

// ============================================================================
// Exports
// ============================================================================

if (typeof exports !== 'undefined') {
    exports.inspectLOMPath = inspectLOMPath;
    exports.viewLOMState = viewLOMState;
    exports.analyzeLOMErrors = analyzeLOMErrors;
    exports.profileLOMOperations = profileLOMOperations;
    exports.runLOMDebug = runLOMDebug;
}

// Console output for Max for Live
if (typeof post !== "undefined") {
    post("LOM Debug Tool loaded");
    post("Usage: runLOMDebug() to get complete report");
}

