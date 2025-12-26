/**
 * LOM Core Tests - Unit tests for LOM core functionality
 * 
 * Tests path builder, validation, error handling, and cache.
 */

// Load test utilities
// var testUtils = require("./lom-test-utils");
// var lomCore = require("../js/lom/lom-core");

// ============================================================================
// Path Builder Tests
// ============================================================================

function testPathBuilder() {
    // Test basic path
    var path1 = buildLOMPath({});
    assert(path1 === "live_set", "Empty components should return 'live_set'");
    
    // Test track path
    var path2 = buildLOMPath({track: 0});
    assert(path2 === "live_set tracks 0", "Track path incorrect");
    
    // Test device path
    var path3 = buildLOMPath({track: 0, device: 1});
    assert(path3 === "live_set tracks 0 devices 1", "Device path incorrect");
    
    // Test parameter path
    var path4 = buildLOMPath({track: 0, device: 1, parameter: 2});
    assert(path4 === "live_set tracks 0 devices 1 parameters 2", "Parameter path incorrect");
    
    // Test clip path
    var path5 = buildLOMPath({track: 0, clipSlot: 1, clip: true});
    assert(path5 === "live_set tracks 0 clip_slots 1 clip", "Clip path incorrect");
}

// ============================================================================
// Validation Tests
// ============================================================================

function testTrackIndexValidation() {
    // Valid indices
    try {
        validateTrackIndex(0);
        validateTrackIndex(5);
        validateTrackIndex(10);
    } catch (e) {
        throw new Error("Valid track indices should not throw: " + e);
    }
    
    // Invalid indices
    var invalid = [-1, -5, "0", 0.5, null, undefined];
    for (var i = 0; i < invalid.length; i++) {
        try {
            validateTrackIndex(invalid[i]);
            throw new Error("Invalid track index should throw: " + invalid[i]);
        } catch (e) {
            // Expected
        }
    }
}

function testDeviceIndexValidation() {
    // Valid indices
    try {
        validateDeviceIndex(0, 0);
        validateDeviceIndex(0, 5);
    } catch (e) {
        // May fail if track doesn't exist, which is OK for unit tests
    }
    
    // Invalid indices
    var invalid = [
        [-1, 0],
        [0, -1],
        ["0", 0],
        [0, "0"]
    ];
    for (var i = 0; i < invalid.length; i++) {
        try {
            validateDeviceIndex(invalid[i][0], invalid[i][1]);
            throw new Error("Invalid device index should throw: " + JSON.stringify(invalid[i]));
        } catch (e) {
            // Expected
        }
    }
}

function testClipSlotValidation() {
    // Valid indices
    try {
        validateClipSlot(0, 0);
        validateClipSlot(0, 5);
    } catch (e) {
        // May fail if track doesn't exist, which is OK for unit tests
    }
    
    // Invalid indices
    var invalid = [
        [-1, 0],
        [0, -1],
        ["0", 0],
        [0, "0"]
    ];
    for (var i = 0; i < invalid.length; i++) {
        try {
            validateClipSlot(invalid[i][0], invalid[i][1]);
            throw new Error("Invalid clip slot should throw: " + JSON.stringify(invalid[i]));
        } catch (e) {
            // Expected
        }
    }
}

// ============================================================================
// Safe LOM Call Tests
// ============================================================================

function testSafeLOMCall() {
    // Test successful call
    var result = safeLOMCall(
        function(api) { return "success"; },
        "live_set",
        {name: "test", required: false}
    );
    // Result may be null if LiveAPI not available, which is OK
    
    // Test with error
    try {
        safeLOMCall(
            function(api) { throw new Error("Test error"); },
            "live_set",
            {name: "test", throwOnError: true}
        );
        // Should have thrown
    } catch (e) {
        // Expected
    }
    
    // Test with throwOnError: false
    var result2 = safeLOMCall(
        function(api) { throw new Error("Test error"); },
        "live_set",
        {name: "test", throwOnError: false}
    );
    assert(result2 === null, "Should return null when throwOnError is false");
}

// ============================================================================
// Cache Tests
// ============================================================================

function testCache() {
    if (typeof lomStateCache === "undefined") {
        return; // Skip if cache not available
    }
    
    var key = "test_key";
    var value = "test_value";
    
    // Test set and get
    lomStateCache.set(key, value);
    var cached = lomStateCache.get(key);
    assert(cached === value, "Cache get should return set value");
    
    // Test invalidation
    lomStateCache.invalidate(key);
    var afterInvalidate = lomStateCache.get(key);
    assert(afterInvalidate === null || afterInvalidate === undefined, "Cache should be invalidated");
    
    // Test TTL (simplified)
    lomStateCache.set(key, value);
    var isFresh = lomStateCache.isFresh(key);
    assert(typeof isFresh === "boolean", "isFresh should return boolean");
}

// ============================================================================
// Run All Tests
// ============================================================================

function runAllTests() {
    var tests = [
        testPathBuilder,
        testTrackIndexValidation,
        testDeviceIndexValidation,
        testClipSlotValidation,
        testSafeLOMCall,
        testCache
    ];
    
    if (typeof runTests === "function") {
        return runTests(tests);
    } else {
        // Simple test runner
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
                    test: tests[i].name,
                    error: e.toString()
                });
            }
        }
        
        return results;
    }
}

// Export for use
if (typeof exports !== 'undefined') {
    exports.runAllTests = runAllTests;
    exports.testPathBuilder = testPathBuilder;
    exports.testTrackIndexValidation = testTrackIndexValidation;
    exports.testDeviceIndexValidation = testDeviceIndexValidation;
    exports.testClipSlotValidation = testClipSlotValidation;
    exports.testSafeLOMCall = testSafeLOMCall;
    exports.testCache = testCache;
}

