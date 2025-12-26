/**
 * LOM Errors - Error handling for Live Object Model
 * 
 * Provides error classification, custom error types, and user-friendly messages.
 */

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * LOM Error - Custom error for LOM operations
 * @param {string} message - Error message
 * @param {Object} context - Error context
 */
function LOMError(message, context) {
    this.name = "LOMError";
    this.message = message || "LOM operation failed";
    this.context = context || {};
    this.stack = (new Error()).stack;
}

LOMError.prototype = Object.create(Error.prototype);
LOMError.prototype.constructor = LOMError;

/**
 * Validation Error - For validation failures
 * @param {string} message - Error message
 * @param {string} field - Field name (optional)
 */
function ValidationError(message, field) {
    this.name = "ValidationError";
    this.message = message || "Validation failed";
    this.field = field;
    this.stack = (new Error()).stack;
}

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

// ============================================================================
// Error Classification
// ============================================================================

/**
 * LOM Error Handler - Classifies and handles LOM errors
 */
function LOMErrorHandler() {
    this.errorLog = [];
    this.maxLogSize = 100;
}

/**
 * Classify error type
 * @param {Error} error - Error object
 * @returns {Object} Classification {type, retryable, message}
 */
LOMErrorHandler.prototype.classifyError = function(error) {
    var message = error.message || error.toString();
    message = message.toLowerCase();
    
    // Invalid path errors
    if (message.indexOf("invalid path") !== -1 || 
        message.indexOf("does not exist") !== -1 ||
        message.indexOf("out of range") !== -1) {
        return {
            type: "INVALID_PATH",
            retryable: false,
            userMessage: "The requested object does not exist or is out of range."
        };
    }
    
    // Permission errors
    if (message.indexOf("access denied") !== -1 ||
        message.indexOf("read-only") !== -1 ||
        message.indexOf("permission") !== -1) {
        return {
            type: "PERMISSION",
            retryable: false,
            userMessage: "You don't have permission to perform this operation."
        };
    }
    
    // State errors (clip not selected, track not armed)
    if (message.indexOf("no clip") !== -1 ||
        message.indexOf("not armed") !== -1 ||
        message.indexOf("not selected") !== -1 ||
        message.indexOf("already has") !== -1) {
        return {
            type: "STATE",
            retryable: false,
            userMessage: "The current state doesn't allow this operation."
        };
    }
    
    // Transient errors (Live busy)
    if (message.indexOf("busy") !== -1 ||
        message.indexOf("timeout") !== -1 ||
        message.indexOf("temporarily") !== -1) {
        return {
            type: "TRANSIENT",
            retryable: true,
            userMessage: "Ableton Live is busy. Please try again."
        };
    }
    
    // Network/connection errors
    if (message.indexOf("connection") !== -1 ||
        message.indexOf("network") !== -1 ||
        message.indexOf("unreachable") !== -1) {
        return {
            type: "CONNECTION",
            retryable: true,
            userMessage: "Connection to Ableton Live failed. Please check your setup."
        };
    }
    
    // Unknown errors
    return {
        type: "UNKNOWN",
        retryable: false,
        userMessage: "An unexpected error occurred: " + (error.message || error.toString())
    };
};

/**
 * Handle error with classification
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 * @returns {Object} Formatted error with classification
 */
LOMErrorHandler.prototype.handle = function(error, context) {
    context = context || {};
    var classification = this.classifyError(error);
    
    var errorEntry = {
        timestamp: new Date().toISOString(),
        error: error,
        context: context,
        classification: classification
    };
    
    // Log error
    this.logError(errorEntry);
    
    // Format error message
    var formattedError = {
        name: error.name || "Error",
        message: classification.userMessage,
        type: classification.type,
        retryable: classification.retryable,
        original: error,
        context: context
    };
    
    return formattedError;
};

/**
 * Log error
 * @param {Object} errorEntry - Error entry
 */
LOMErrorHandler.prototype.logError = function(errorEntry) {
    this.errorLog.push(errorEntry);
    
    // Trim log
    if (this.errorLog.length > this.maxLogSize) {
        this.errorLog.shift();
    }
    
    // Output to Max console
    post("LOM Error:", errorEntry.classification.type, 
         errorEntry.context.operation || "unknown",
         errorEntry.error.message || errorEntry.error.toString());
};

/**
 * Get recent errors
 * @param {number} count - Number of errors to return
 * @returns {Array} Recent errors
 */
LOMErrorHandler.prototype.getRecentErrors = function(count) {
    count = count || 10;
    return this.errorLog.slice(-count);
};

/**
 * Get errors by type
 * @param {string} type - Error type
 * @returns {Array} Errors of specified type
 */
LOMErrorHandler.prototype.getErrorsByType = function(type) {
    return this.errorLog.filter(function(entry) {
        return entry.classification.type === type;
    });
};

/**
 * Clear error log
 */
LOMErrorHandler.prototype.clearLog = function() {
    this.errorLog = [];
};

/**
 * Get error statistics
 * @returns {Object} Error statistics
 */
LOMErrorHandler.prototype.getStats = function() {
    var stats = {
        total: this.errorLog.length,
        byType: {},
        recent: this.getRecentErrors(5)
    };
    
    for (var i = 0; i < this.errorLog.length; i++) {
        var type = this.errorLog[i].classification.type;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
    }
    
    return stats;
};

// ============================================================================
// Global Instance
// ============================================================================

var lomErrorHandler = new LOMErrorHandler();

/**
 * Handle LOM error (global function for use in safeLOMCall)
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 */
function handleLOMError(error, context) {
    return lomErrorHandler.handle(error, context);
}

// ============================================================================
// Exports
// ============================================================================

if (typeof exports !== 'undefined') {
    exports.LOMError = LOMError;
    exports.ValidationError = ValidationError;
    exports.LOMErrorHandler = LOMErrorHandler;
    exports.lomErrorHandler = lomErrorHandler;
    exports.handleLOMError = handleLOMError;
}

