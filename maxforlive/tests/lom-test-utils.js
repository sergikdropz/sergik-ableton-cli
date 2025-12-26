/**
 * LOM Test Utils - Testing utilities for Live Object Model
 * 
 * Provides mock LiveAPI objects, test path builders, validation test helpers,
 * and error simulation.
 */

// ============================================================================
// Mock LiveAPI Object
// ============================================================================

/**
 * Create mock LiveAPI object
 * @param {string} path - LOM path
 * @param {Object} properties - Properties to return
 * @returns {Object} Mock LiveAPI object
 */
function createMockLiveAPI(path, properties) {
    properties = properties || {};
    
    var mock = {
        id: properties.id || path,
        path: path,
        properties: properties,
        
        get: function(property) {
            if (this.properties.hasOwnProperty(property)) {
                return this.properties[property];
            }
            // Default values for common properties
            if (property === "tracks") return [];
            if (property === "devices") return [];
            if (property === "clip_slots") return [];
            if (property === "scenes") return [];
            if (property === "parameters") return [];
            if (property === "name") return "Mock " + property;
            if (property === "value") return 0.5;
            if (property === "has_clip") return false;
            if (property === "is_active") return 1;
            return null;
        },
        
        set: function(property, value) {
            this.properties[property] = value;
            return true;
        },
        
        call: function(method, ...args) {
            if (this.properties.callbacks && this.properties.callbacks[method]) {
                return this.properties.callbacks[method].apply(this, args);
            }
            return true;
        }
    };
    
    return mock;
}

// ============================================================================
// Test Path Builders
// ============================================================================

/**
 * Test path builder (same as production)
 * @param {Object} components - Path components
 * @returns {string} LOM path
 */
function testBuildLOMPath(components) {
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
    return parts.join(" ");
}

// ============================================================================
// Validation Test Helpers
// ============================================================================

/**
 * Test validation function
 * @param {Function} validator - Validation function
 * @param {*} validInput - Valid input
 * @param {Array} invalidInputs - Array of invalid inputs
 * @returns {Object} Test results
 */
function testValidator(validator, validInput, invalidInputs) {
    invalidInputs = invalidInputs || [];
    var results = {
        passed: 0,
        failed: 0,
        errors: []
    };
    
    // Test valid input
    try {
        validator(validInput);
        results.passed++;
    } catch (e) {
        results.failed++;
        results.errors.push("Valid input failed: " + e.toString());
    }
    
    // Test invalid inputs
    for (var i = 0; i < invalidInputs.length; i++) {
        try {
            validator(invalidInputs[i]);
            results.failed++;
            results.errors.push("Invalid input passed: " + JSON.stringify(invalidInputs[i]));
        } catch (e) {
            results.passed++;
            // Expected error
        }
    }
    
    return results;
}

// ============================================================================
// Error Simulation
// ============================================================================

/**
 * Create error simulator
 * @param {string} errorType - Type of error to simulate
 * @returns {Function} Function that throws the error
 */
function createErrorSimulator(errorType) {
    return function() {
        var error;
        switch (errorType) {
            case "INVALID_PATH":
                error = new Error("Invalid path: object does not exist");
                break;
            case "OUT_OF_RANGE":
                error = new Error("Index out of range");
                break;
            case "PERMISSION":
                error = new Error("Access denied: read-only");
                break;
            case "STATE":
                error = new Error("No clip selected");
                break;
            case "TRANSIENT":
                error = new Error("Ableton Live is busy");
                break;
            default:
                error = new Error("Unknown error");
        }
        throw error;
    };
}

/**
 * Mock LiveAPI that throws errors
 * @param {string} path - LOM path
 * @param {string} errorType - Error type to throw
 * @returns {Object} Mock that throws errors
 */
function createErrorMockLiveAPI(path, errorType) {
    var simulator = createErrorSimulator(errorType);
    return {
        id: null,
        path: path,
        get: simulator,
        set: simulator,
        call: simulator
    };
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Assert function for tests
 * @param {boolean} condition - Condition to check
 * @param {string} message - Error message
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error("Assertion failed: " + (message || "Unknown"));
    }
}

/**
 * Run test suite
 * @param {Array} tests - Array of test functions
 * @returns {Object} Test results
 */
function runTests(tests) {
    var results = {
        total: tests.length,
        passed: 0,
        failed: 0,
        errors: []
    };
    
    for (var i = 0; i < tests.length; i++) {
        try {
            tests[i]();
            results.passed++;
        } catch (e) {
            results.failed++;
            results.errors.push({
                test: i,
                error: e.toString()
            });
        }
    }
    
    return results;
}

// ============================================================================
// Exports
// ============================================================================

if (typeof exports !== 'undefined') {
    exports.createMockLiveAPI = createMockLiveAPI;
    exports.testBuildLOMPath = testBuildLOMPath;
    exports.testValidator = testValidator;
    exports.createErrorSimulator = createErrorSimulator;
    exports.createErrorMockLiveAPI = createErrorMockLiveAPI;
    exports.assert = assert;
    exports.runTests = runTests;
}

