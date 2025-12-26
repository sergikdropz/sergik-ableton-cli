/**
 * LOM Logger - Operation logging for Live Object Model
 * 
 * Provides operation tracking, error logging, performance metrics, and debug output.
 */

// ============================================================================
// LOM Operation Logger Class
// ============================================================================

/**
 * LOM Operation Logger
 */
function LOMOperationLogger() {
    this.log = [];
    this.maxLogSize = 1000;
    this.enabled = true;
    this.performanceMetrics = {};
}

/**
 * Log LOM operation
 * @param {string} operation - Operation name
 * @param {string} path - LOM path
 * @param {Array} args - Operation arguments
 * @param {*} result - Operation result
 * @param {Error} error - Error (if any)
 */
LOMOperationLogger.prototype.logOperation = function(operation, path, args, result, error) {
    if (!this.enabled) {
        return;
    }
    
    var entry = {
        timestamp: Date.now(),
        operation: operation,
        path: path,
        args: args || [],
        result: result,
        error: error ? error.toString() : null,
        duration: null // Will be set if timing is available
    };
    
    this.log.push(entry);
    
    // Trim log
    if (this.log.length > this.maxLogSize) {
        this.log.shift();
    }
    
    // Output to Max console
    if (error) {
        post("LOM Error:", operation, path, error.toString());
    } else {
        post("LOM Operation:", operation, path, "OK");
    }
};

/**
 * Start timing an operation
 * @param {string} operation - Operation name
 * @returns {number} Timestamp
 */
LOMOperationLogger.prototype.startTiming = function(operation) {
    this.performanceMetrics[operation] = {
        start: Date.now(),
        count: (this.performanceMetrics[operation] || {}).count || 0
    };
    return this.performanceMetrics[operation].start;
};

/**
 * End timing an operation
 * @param {string} operation - Operation name
 * @returns {number} Duration in milliseconds
 */
LOMOperationLogger.prototype.endTiming = function(operation) {
    var metric = this.performanceMetrics[operation];
    if (!metric || !metric.start) {
        return null;
    }
    
    var duration = Date.now() - metric.start;
    metric.count = (metric.count || 0) + 1;
    metric.totalDuration = (metric.totalDuration || 0) + duration;
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.maxDuration = Math.max(metric.maxDuration || 0, duration);
    metric.minDuration = Math.min(metric.minDuration || Infinity, duration);
    
    delete metric.start;
    
    return duration;
};

/**
 * Get recent errors
 * @param {number} count - Number of errors to return
 * @returns {Array} Recent errors
 */
LOMOperationLogger.prototype.getRecentErrors = function(count) {
    count = count || 10;
    var errors = this.log.filter(function(entry) {
        return entry.error !== null;
    });
    return errors.slice(-count);
};

/**
 * Get operations by type
 * @param {string} operation - Operation name
 * @returns {Array} Operations of specified type
 */
LOMOperationLogger.prototype.getOperationsByType = function(operation) {
    return this.log.filter(function(entry) {
        return entry.operation === operation;
    });
};

/**
 * Get performance metrics
 * @param {string} operation - Operation name (optional)
 * @returns {Object} Performance metrics
 */
LOMOperationLogger.prototype.getPerformanceMetrics = function(operation) {
    if (operation) {
        return this.performanceMetrics[operation] || null;
    }
    return this.performanceMetrics;
};

/**
 * Clear log
 */
LOMOperationLogger.prototype.clearLog = function() {
    this.log = [];
    this.performanceMetrics = {};
};

/**
 * Get log statistics
 * @returns {Object} Log statistics
 */
LOMOperationLogger.prototype.getStats = function() {
    var stats = {
        total: this.log.length,
        errors: 0,
        byOperation: {},
        performance: this.performanceMetrics
    };
    
    for (var i = 0; i < this.log.length; i++) {
        var entry = this.log[i];
        if (entry.error) {
            stats.errors++;
        }
        stats.byOperation[entry.operation] = (stats.byOperation[entry.operation] || 0) + 1;
    }
    
    return stats;
};

/**
 * Enable logging
 */
LOMOperationLogger.prototype.enable = function() {
    this.enabled = true;
};

/**
 * Disable logging
 */
LOMOperationLogger.prototype.disable = function() {
    this.enabled = false;
};

/**
 * Export log as JSON
 * @returns {string} JSON string
 */
LOMOperationLogger.prototype.exportLog = function() {
    return JSON.stringify({
        log: this.log,
        metrics: this.performanceMetrics,
        stats: this.getStats()
    }, null, 2);
};

// ============================================================================
// Global Instance
// ============================================================================

var lomOperationLogger = new LOMOperationLogger();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Log operation (global function)
 * @param {string} operation - Operation name
 * @param {string} path - LOM path
 * @param {Array} args - Arguments
 * @param {*} result - Result
 * @param {Error} error - Error
 */
function logLOMOperation(operation, path, args, result, error) {
    lomOperationLogger.logOperation(operation, path, args, result, error);
}

/**
 * Time operation wrapper
 * @param {string} operation - Operation name
 * @param {Function} fn - Function to time
 * @returns {*} Function result
 */
function timeLOMOperation(operation, fn) {
    var start = lomOperationLogger.startTiming(operation);
    try {
        var result = fn();
        var duration = lomOperationLogger.endTiming(operation);
        logLOMOperation(operation, "", [], result, null);
        return result;
    } catch (e) {
        var duration = lomOperationLogger.endTiming(operation);
        logLOMOperation(operation, "", [], null, e);
        throw e;
    }
}

// ============================================================================
// Exports
// ============================================================================

if (typeof exports !== 'undefined') {
    exports.LOMOperationLogger = LOMOperationLogger;
    exports.lomOperationLogger = lomOperationLogger;
    exports.logLOMOperation = logLOMOperation;
    exports.timeLOMOperation = timeLOMOperation;
}

