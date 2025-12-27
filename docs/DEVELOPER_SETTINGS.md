# Developer Settings & Build Optimization Guide

This guide explains the centralized developer configuration system designed for efficient development and clean builds.

## Overview

The developer settings system provides:
- **Environment-aware configuration** - Automatically adjusts based on dev/staging/prod
- **Resource-efficient logging** - Only logs what matters
- **Build performance tracking** - Metrics for optimization
- **Centralized settings** - One place to manage all dev settings

## Quick Start

### Python Backend

The system automatically detects your environment from `SERGIK_ENV`:

```bash
# Development (default)
export SERGIK_ENV=dev
python run_server.py

# Production
export SERGIK_ENV=prod
python run_server.py
```

### JavaScript Frontend

The dev config is automatically loaded in the browser:

```javascript
// Access dev config
const config = window.SergikDevConfig;
console.log(config.get('logLevel'));
console.log(config.get('maxLogs'));
```

## Configuration Options

### Environment Variables

#### Core Settings
- `SERGIK_ENV` - Environment: `dev`, `staging`, `prod`, `test` (default: `dev`)
- `SERGIK_LOG_LEVEL` - Logging level: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` (default: `INFO`)

#### Logging
- `SERGIK_LOG_TO_FILE` - Enable file logging: `true`/`false` (default: `false`)
- `SERGIK_LOG_JSON` - Use JSON format: `true`/`false` (default: `true`)
- `SERGIK_LOG_BUILD_METRICS` - Log build metrics: `true`/`false` (default: `true`)
- `SERGIK_LOG_PERFORMANCE` - Log performance metrics: `true`/`false` (default: `true`)
- `SERGIK_LOG_API_CALLS` - Log API calls: `true`/`false` (default: `true`)
- `SERGIK_LOG_ERRORS` - Log errors: `true`/`false` (default: `true`)

#### Performance
- `SERGIK_ENABLE_PROFILING` - Enable profiling: `true`/`false` (default: `false`)
- `SERGIK_ENABLE_MEMORY_TRACKING` - Track memory usage: `true`/`false` (default: `false`)
- `SERGIK_MAX_LOG_SIZE_MB` - Max log file size in MB (default: `10.0`)
- `SERGIK_LOG_ROTATION_COUNT` - Number of log files to keep (default: `5`)

#### Build Optimization
- `SERGIK_ENABLE_BUILD_CACHE` - Use build cache: `true`/`false` (default: `true`)
- `SERGIK_MINIFY_PRODUCTION` - Minify in production: `true`/`false` (default: `true`)
- `SERGIK_SOURCE_MAPS` - Generate source maps: `true`/`false` (default: `true`)
- `SERGIK_TREE_SHAKING` - Enable tree shaking: `true`/`false` (default: `true`)

#### Resource Limits
- `SERGIK_MAX_LOGS` - Maximum number of logs to keep (default: `1000`)
- `SERGIK_MAX_NETWORK_REQUESTS` - Maximum network requests to track (default: `500`)
- `SERGIK_MAX_CONSOLE_HISTORY` - Maximum console history (default: `200`)

#### Feature Flags
- `SERGIK_ENABLE_HOT_RELOAD` - Enable hot reload: `true`/`false` (default: `true`)
- `SERGIK_ENABLE_TYPE_CHECKING` - Run type checking: `true`/`false` (default: `true`)
- `SERGIK_ENABLE_LINTING` - Run linting: `true`/`false` (default: `true`)
- `SERGIK_ENABLE_TEST_COVERAGE` - Run tests with coverage: `true`/`false` (default: `false`)

## Environment-Specific Defaults

### Development (`dev`)
- Log level: `DEBUG`
- Build metrics: Enabled
- Profiling: Enabled
- Memory tracking: Enabled
- Source maps: Enabled
- Hot reload: Enabled
- Max logs: `1000`

### Production (`prod`)
- Log level: `WARNING`
- Build metrics: Disabled
- Profiling: Disabled
- Memory tracking: Disabled
- Source maps: Disabled
- Hot reload: Disabled
- Max logs: `500`
- Minification: Enabled
- Tree shaking: Enabled

### Staging (`staging`)
- Similar to production but with more logging
- Build metrics: Enabled
- Log level: `INFO`

## Usage Examples

### Python

```python
from sergik_ml.core.dev_config import get_dev_config, log_performance, log_build_metric

# Get config
config = get_dev_config()

# Log performance
import time
start = time.time()
# ... do work ...
log_performance("data_processing", time.time() - start)

# Log build metric
log_build_metric("files_processed", 42)

# Track build
from sergik_ml.core.dev_config import track_build_start, track_build_end
track_build_start()
# ... build process ...
track_build_end()
```

### JavaScript

```javascript
// Access config
const config = window.SergikDevConfig;

// Start build tracking
config.startBuildTracking();

// Track metrics
config.trackFileProcessed();
config.trackCacheHit();
config.trackError(new Error("Something went wrong"));

// Log performance
config.logPerformance("render", 45.2, { component: "dashboard" });

// End build tracking
config.endBuildTracking();

// Get metrics
const metrics = config.getMetrics();
console.log(metrics);
```

## Build Script

Use the build script with metrics:

```bash
# Make executable
chmod +x scripts/build_with_metrics.py

# Run build
python scripts/build_with_metrics.py
```

The script will:
1. Run type checking (if enabled)
2. Run linting (if enabled)
3. Build all components
4. Run tests (if enabled)
5. Generate build metrics
6. Save metrics to `.build_metrics.json`

## Developer Console

The JavaScript developer console is optimized for resource efficiency:

- **Throttled rendering** - Renders are debounced to avoid performance issues
- **Circular buffer** - Efficient log storage with automatic trimming
- **Memory tracking** - Optional memory usage monitoring
- **Performance logging** - Automatic performance metric collection

### Console Settings

Access via Settings → Developer Console:
- Enable/disable console
- Toggle API call logging
- Toggle error logging
- Toggle performance logging
- Adjust max logs
- Filter by log level

## Logging Best Practices

### What to Log

✅ **DO Log:**
- Errors and exceptions
- Performance metrics (slow operations)
- Build metrics (files processed, duration)
- API calls (in development)
- Important state changes

❌ **DON'T Log:**
- Every function call (too verbose)
- Sensitive data (API keys, passwords)
- High-frequency events (use sampling)
- Debug info in production

### Log Levels

- **DEBUG** - Detailed information for debugging
- **INFO** - General informational messages
- **WARNING** - Warning messages (non-critical issues)
- **ERROR** - Error messages (recoverable errors)
- **CRITICAL** - Critical errors (application may stop)

## Performance Optimization

### Build Cache

Enable build cache for faster rebuilds:

```bash
export SERGIK_ENABLE_BUILD_CACHE=true
```

Cache is stored in `.build_cache/` directory.

### Tree Shaking

Automatically enabled in production builds. Removes unused code to reduce bundle size.

### Minification

Automatically enabled in production. Uses esbuild for fast minification.

### Source Maps

Disabled in production for smaller builds. Enabled in development for debugging.

## Troubleshooting

### Build is Slow

1. Check if build cache is enabled
2. Disable type checking in development: `SERGIK_ENABLE_TYPE_CHECKING=false`
3. Disable linting in development: `SERGIK_ENABLE_LINTING=false`
4. Reduce max logs: `SERGIK_MAX_LOGS=500`

### Too Many Logs

1. Increase log level: `SERGIK_LOG_LEVEL=WARNING`
2. Reduce max logs: `SERGIK_MAX_LOGS=500`
3. Disable API call logging: `SERGIK_LOG_API_CALLS=false`
4. Disable performance logging: `SERGIK_LOG_PERFORMANCE=false`

### Memory Issues

1. Disable memory tracking: `SERGIK_ENABLE_MEMORY_TRACKING=false`
2. Reduce max logs: `SERGIK_MAX_LOGS=500`
3. Enable log rotation: Set `SERGIK_LOG_ROTATION_COUNT`

## Configuration Files

### Python Config

Location: `sergik_ml/core/dev_config.py`

Can be saved/loaded from JSON:
```python
config = get_dev_config()
config.save_to_file(Path("dev_config.json"))
config = DevConfig.load_from_file(Path("dev_config.json"))
```

### JavaScript Config

Location: `maxforlive/js/dev-config.js`

Automatically saved to `localStorage` as `sergik-dev-config`.

## Integration with Existing Systems

### SERGIK ML Config

The dev config works alongside `sergik_ml/config.py`:
- Dev config: Development tooling and logging
- ML config: Application configuration (ports, database, etc.)

### Logging System

The dev config enhances `sergik_ml/core/logging.py`:
- Adds environment-aware log levels
- Adds file logging support
- Adds build metrics integration

## Best Practices

1. **Use environment variables** - Don't hardcode settings
2. **Enable profiling only when needed** - It has performance overhead
3. **Use appropriate log levels** - Don't log everything as INFO
4. **Monitor build metrics** - Track trends over time
5. **Clean up old logs** - Use log rotation
6. **Test in production mode** - Ensure production builds work

## Examples

### Development Setup

```bash
export SERGIK_ENV=dev
export SERGIK_LOG_LEVEL=DEBUG
export SERGIK_LOG_BUILD_METRICS=true
export SERGIK_ENABLE_PROFILING=true
export SERGIK_ENABLE_MEMORY_TRACKING=true
python run_server.py
```

### Production Setup

```bash
export SERGIK_ENV=prod
export SERGIK_LOG_LEVEL=WARNING
export SERGIK_LOG_BUILD_METRICS=false
export SERGIK_ENABLE_PROFILING=false
export SERGIK_MINIFY_PRODUCTION=true
python run_server.py
```

### CI/CD Setup

```bash
export SERGIK_ENV=test
export SERGIK_ENABLE_TYPE_CHECKING=true
export SERGIK_ENABLE_LINTING=true
export SERGIK_ENABLE_TEST_COVERAGE=true
python scripts/build_with_metrics.py
```

## Summary

The developer settings system provides:
- ✅ Environment-aware configuration
- ✅ Resource-efficient logging
- ✅ Build performance tracking
- ✅ Centralized settings management
- ✅ Automatic optimizations per environment

This ensures clean, efficient builds while maintaining comprehensive logging for development and debugging.

