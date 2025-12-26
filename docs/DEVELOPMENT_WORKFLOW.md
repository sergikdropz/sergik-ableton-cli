# Development Workflow

## Overview

This document outlines the development workflow for the SERGIK AI system, including setup instructions, testing procedures, debugging techniques, and code review checklist.

## Setup Instructions

### Prerequisites

1. **Ableton Live Suite** (or Live + Max for Live)
2. **Python 3.8+** with virtual environment
3. **Node.js** (for JavaScript tooling, optional)

### Initial Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd sergik_custom_gpt
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Verify installation**
   ```bash
   python scripts/verify_install.py
   ```

4. **Start API server**
   ```bash
   python -m sergik_ml.api.main
   ```

5. **Load Max for Live device**
   - Open Ableton Live
   - Create MIDI track
   - Add Max for Live MIDI Effect
   - Load `SERGIK_AI_Controller.js`

## Development Procedures

### Adding New LOM Functionality

1. **Create utility function** (if needed)
   - Add to appropriate utility module (`track-utils.js`, `device-utils.js`, `clip-utils.js`)
   - Use LOM abstraction layer
   - Add validation

2. **Add controller function**
   - Use utility functions
   - Add error handling
   - Add status messages
   - Add JSON output

3. **Add API endpoint** (if needed)
   - Create schema in `schemas.py`
   - Add router endpoint
   - Add validation middleware

4. **Write tests**
   - Unit tests for utility functions
   - Integration tests for API endpoints

5. **Update documentation**
   - Add to API reference
   - Update examples

### Code Structure

```
maxforlive/
├── js/
│   ├── lom/              # LOM abstraction layer
│   │   ├── lom-core.js   # Core utilities
│   │   ├── lom-cache.js  # State caching
│   │   ├── lom-errors.js # Error handling
│   │   └── ...           # Utility modules
│   └── error-handler.js  # Enhanced error handler
├── SERGIK_AI_Controller.js  # Main controller
└── tests/                # Test files

sergik_ml/
├── api/
│   ├── middleware/       # Validation middleware
│   └── routers/          # API routers
├── services/             # Business logic
└── utils/                # Utilities
```

## Testing Procedures

### Unit Tests

Run JavaScript unit tests:

```javascript
// In Max for Live console
load("tests/lom-core.test.js");
runAllTests();
```

Run Python unit tests:

```bash
pytest tests/api/test_lom_integration.py -v
```

### Integration Tests

Test API → LOM integration:

```bash
pytest tests/api/test_lom_integration.py::TestLOMAPIEndpoints -v
```

### Manual Testing

1. **Test in Ableton Live**
   - Load device
   - Test each function
   - Check console for errors
   - Verify state changes

2. **Use debug tools**
   ```javascript
   // In Max for Live console
   load("scripts/dev/lom-debug.js");
   var report = runLOMDebug();
   post(JSON.stringify(report, null, 2));
   ```

3. **Validate LOM paths**
   ```javascript
   load("scripts/dev/validate-lom.js");
   var report = generateValidationReport();
   post(JSON.stringify(report, null, 2));
   ```

## Debugging Techniques

### LOM Path Inspection

```javascript
var inspection = inspectLOMPath("live_set tracks 0");
post(JSON.stringify(inspection, null, 2));
```

### State Viewing

```javascript
var state = viewLOMState();
post(JSON.stringify(state, null, 2));
```

### Error Analysis

```javascript
var analysis = analyzeLOMErrors(10);
post(JSON.stringify(analysis, null, 2));
```

### Performance Profiling

```javascript
var metrics = profileLOMOperations();
post(JSON.stringify(metrics, null, 2));
```

### Log Analysis

Check operation logs:

```javascript
var stats = lomOperationLogger.getStats();
post(JSON.stringify(stats, null, 2));
```

### Error Log Review

```javascript
var errors = lomErrorHandler.getRecentErrors(10);
for (var i = 0; i < errors.length; i++) {
    post("Error:", errors[i].classification.type, errors[i].error);
}
```

## Code Review Checklist

### LOM Operations

- [ ] Uses `safeLOMCall()` or utility functions
- [ ] Validates indices before access
- [ ] Handles errors with context
- [ ] Invalidates cache after mutations
- [ ] Logs operations for debugging

### Error Handling

- [ ] Try-catch blocks with context
- [ ] User-friendly error messages
- [ ] Error classification used
- [ ] Retry logic for transient errors

### Performance

- [ ] Uses caching where appropriate
- [ ] Batches operations when possible
- [ ] Debounces rapid updates
- [ ] Avoids unnecessary LOM calls

### Code Quality

- [ ] Follows naming conventions
- [ ] Includes JSDoc comments
- [ ] No hardcoded values
- [ ] Proper error handling

### Testing

- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Manual testing completed
- [ ] Edge cases covered

### Documentation

- [ ] Function documented
- [ ] Examples provided
- [ ] API reference updated
- [ ] Design principles followed

## Common Issues & Solutions

### Issue: "Object does not exist"

**Solution**: Validate indices before access
```javascript
validateTrackIndex(index);
var track = safeLOMCall(...);
```

### Issue: "Index out of range"

**Solution**: Check range before access
```javascript
var trackCount = liveSet.get("tracks").length / 2;
if (index >= trackCount) {
    throw new Error("Index out of range");
}
```

### Issue: "Live is busy"

**Solution**: Add retry logic
```javascript
errorHandler.withRetry(
    function() { return safeLOMCall(...); },
    {maxRetries: 3}
);
```

### Issue: Cache stale data

**Solution**: Invalidate after mutations
```javascript
lomStateCache.invalidate("track_" + index);
```

## Best Practices

1. **Always validate** inputs before LOM access
2. **Use abstraction layer** instead of direct LiveAPI calls
3. **Handle errors** with context and classification
4. **Cache state** but invalidate after mutations
5. **Log operations** for debugging and monitoring
6. **Batch operations** when possible
7. **Test thoroughly** before committing
8. **Document changes** in code and docs

## Version Control

### Commit Messages

Use descriptive commit messages:

```
feat: Add batch track volume control
fix: Validate track index before device access
refactor: Use LOM abstraction in clip operations
docs: Update API reference with new endpoints
```

### Branch Strategy

- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

## Deployment

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Manual testing completed
- [ ] Error handling verified
- [ ] Performance acceptable

### Deployment Steps

1. Run full test suite
2. Update version numbers
3. Create release notes
4. Tag release
5. Deploy to production
6. Monitor for errors

## Conclusion

Following this workflow ensures:

- **Quality**: Comprehensive testing and review
- **Maintainability**: Clear structure and documentation
- **Reliability**: Proper error handling and validation
- **Performance**: Optimized operations and caching

For more information, see:
- `LOM_DESIGN_PRINCIPLES.md` - Design patterns
- `API_REFERENCE.md` - API documentation

