# LOM Design Principles

## Overview

This document outlines the comprehensive design principles for using Live Object Model (LOM) in the SERGIK AI system. These principles ensure robust, maintainable, and performant integration with Ableton Live.

## Architecture Patterns

### 1. Layered Access Pattern

Use a three-layer approach for LOM access:

**Layer 1: Direct LOM Access (Low-level)**
- Direct `new LiveAPI()` calls
- Minimal abstraction
- Used only in core utilities

**Layer 2: Validated Wrapper (Mid-level)**
- `safeLOMCall()` function
- Input validation
- Error handling
- Used in utility modules

**Layer 3: Business Logic (High-level)**
- Domain-specific functions
- Uses validated wrappers
- User-facing operations
- Used in controller

### 2. Path Construction Pattern

Always use structured path builders:

```javascript
// ❌ BAD: String concatenation
var path = "live_set tracks " + trackIndex + " devices " + deviceIndex;

// ✅ GOOD: Structured path builder
var path = buildLOMPath({
    track: trackIndex,
    device: deviceIndex
});
```

### 3. Safe Access Pattern

Always use safe LOM calls with error handling:

```javascript
// ❌ BAD: Direct access
var track = new LiveAPI("live_set tracks " + index);
track.set("name", "New Name");

// ✅ GOOD: Safe access
safeLOMCall(
    function(track) {
        track.set("name", "New Name");
        return true;
    },
    buildLOMPath({track: index}),
    {name: "renameTrack", required: true}
);
```

## Error Handling

### Error Classification

LOM errors are classified into types:

- **INVALID_PATH**: Object does not exist or path is malformed
- **PERMISSION**: Read-only access or permission denied
- **STATE**: Invalid state (e.g., no clip selected)
- **TRANSIENT**: Temporary errors (e.g., Live busy)
- **CONNECTION**: Connection/network errors
- **UNKNOWN**: Unclassified errors

### Error Handling Best Practices

1. **Always validate before access**
   ```javascript
   validateTrackIndex(index);
   var track = safeLOMCall(...);
   ```

2. **Use error classification**
   ```javascript
   var classification = lomErrorHandler.classifyError(error);
   if (classification.retryable) {
       // Retry logic
   }
   ```

3. **Preserve context**
   ```javascript
   safeLOMCall(operation, path, {
       name: "operationName",
       trackIndex: index,
       // ... other context
   });
   ```

## State Management

### Caching Strategy

Use TTL-based caching for frequently accessed state:

```javascript
var trackState = lomStateCache.get("track_" + index, function() {
    return getTrackState(index);
});
```

### Cache Invalidation

Invalidate cache after mutations:

```javascript
// After creating track
lomStateCache.invalidate("track");

// After updating specific track
lomStateCache.invalidate("track_" + index);
```

### State Synchronization

Synchronize state after operations:

```javascript
function createTrack(type, name) {
    // ... create track ...
    syncTrackState(); // Invalidate cache
}
```

## Validation

### Pre-flight Validation

Always validate inputs before LOM access:

```javascript
function setDeviceParam(trackIndex, deviceIndex, paramIndex, value) {
    // Validate indices
    validateTrackIndex(trackIndex);
    validateDeviceIndex(trackIndex, deviceIndex);
    
    // Validate value
    if (value < 0 || value > 1) {
        throw new ValidationError("Value must be between 0 and 1");
    }
    
    // Perform operation
    safeLOMCall(...);
}
```

### Validation Functions

Use provided validation functions:

- `validateTrackIndex(index)`
- `validateDeviceIndex(trackIndex, deviceIndex)`
- `validateClipSlot(trackIndex, slotIndex)`
- `validateSceneIndex(sceneIndex)`

## Performance Optimization

### Batch Operations

Batch multiple operations when possible:

```javascript
// ❌ BAD: Multiple individual calls
for (var i = 0; i < tracks.length; i++) {
    setTrackVolume(i, volumes[i]);
}

// ✅ GOOD: Batch operation
batchSetVolume(volumeMap);
```

### Lazy Evaluation

Defer LOM access until needed:

```javascript
var track = new LazyLOMObject("live_set tracks 0");
// ... later ...
var name = track.get("name"); // LiveAPI created here
```

### Debouncing

Debounce rapid updates:

```javascript
var updater = new DebouncedLOMUpdater(100);
updater.set(path, "volume", 0.75);
```

## Common Patterns

### Track Iterator

```javascript
iterateTracks(function(track, index) {
    post("Track", index, ":", track.get("name"));
    return true; // Continue
});
```

### Device Parameter Iterator

```javascript
iterateDeviceParameters(trackIndex, deviceIndex, function(param, index) {
    post("Param", index, ":", param.get("name"), "=", param.get("value"));
});
```

### Clip Note Batch Insert

```javascript
insertNotesBatch(clipPath, notes, {
    clearExisting: true,
    loopEnd: 16
});
```

## Best Practices Summary

1. ✅ Always validate indices before LOM access
2. ✅ Check `api.id` exists before operations
3. ✅ Use try-catch with context
4. ✅ Cache state when appropriate
5. ✅ Batch operations when possible
6. ✅ Log operations for debugging
7. ✅ Use structured path builders
8. ✅ Handle transient errors with retries
9. ✅ Invalidate cache after mutations
10. ✅ Prefer read-only wrappers for inspection

## Implementation Checklist

When adding new LOM functionality:

- [ ] Path validation (indices in range)
- [ ] Error handling (try-catch with context)
- [ ] State verification (object exists)
- [ ] Cache invalidation (after mutations)
- [ ] Operation logging (for debugging)
- [ ] User feedback (status messages)
- [ ] JSON output (for API responses)
- [ ] Documentation (function purpose)

## Error Recovery

### Retry Logic

For transient errors:

```javascript
errorHandler.withRetry(
    function() {
        return safeLOMCall(...);
    },
    {maxRetries: 3, retryDelay: 1000}
);
```

### Fallback Strategies

```javascript
try {
    // Primary method
    track.call("create_device", deviceName);
} catch (e) {
    // Fallback to API
    httpRequest("POST", "/live/devices/load", {...});
}
```

## Security & Safety

### Read-Only Mode

For inspection operations:

```javascript
var readOnlyTrack = new ReadOnlyLOMWrapper(track);
var name = readOnlyTrack.get("name"); // OK
readOnlyTrack.set("name", "New"); // Throws error
```

### Operation Logging

Log all LOM operations:

```javascript
lomOperationLogger.logOperation(
    "setDeviceParam",
    path,
    {paramIndex: 2, value: 0.75},
    result,
    error
);
```

## Performance Metrics

Monitor LOM operation performance:

```javascript
var metrics = lomOperationLogger.getPerformanceMetrics();
// Returns: count, avgDuration, minDuration, maxDuration
```

## Conclusion

Following these design principles ensures:

- **Robustness**: Comprehensive error handling
- **Performance**: Efficient caching and batching
- **Maintainability**: Clear patterns and abstractions
- **Debuggability**: Comprehensive logging
- **Safety**: Validation and read-only modes

For more information, see:
- `DEVELOPMENT_WORKFLOW.md` - Development procedures
- `API_REFERENCE.md` - API documentation

