/**
 * LOM State Cache - State caching for Live Object Model
 * 
 * Provides TTL-based caching with automatic cleanup and invalidation strategies.
 */

// ============================================================================
// LOM State Cache Class
// ============================================================================

/**
 * LOM State Cache with TTL support
 */
function LOMStateCache() {
    this.cache = {};
    this.ttl = 1000; // 1 second default TTL
    this.maxAge = 5000; // 5 seconds max age
    this.cleanupInterval = null;
    this.cleanupIntervalMs = 10000; // Cleanup every 10 seconds
}

/**
 * Get value from cache or fetch new
 * @param {string} key - Cache key
 * @param {Function} fetcher - Function to fetch value if not cached
 * @returns {*} Cached or fetched value
 */
LOMStateCache.prototype.get = function(key, fetcher) {
    var cached = this.cache[key];
    var now = Date.now();
    
    // Return cached if fresh
    if (cached && (now - cached.timestamp) < this.ttl) {
        return cached.value;
    }
    
    // Fetch new value
    if (typeof fetcher !== "function") {
        return null;
    }
    
    var value = fetcher();
    this.cache[key] = {
        value: value,
        timestamp: now
    };
    
    return value;
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 */
LOMStateCache.prototype.set = function(key, value) {
    this.cache[key] = {
        value: value,
        timestamp: Date.now()
    };
};

/**
 * Invalidate cache entries matching pattern
 * @param {string} pattern - Pattern to match (optional, clears all if not provided)
 */
LOMStateCache.prototype.invalidate = function(pattern) {
    if (pattern) {
        // Invalidate matching keys
        var keys = Object.keys(this.cache);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.indexOf(pattern) !== -1) {
                delete this.cache[key];
            }
        }
    } else {
        // Clear all
        this.cache = {};
    }
};

/**
 * Get cache entry age
 * @param {string} key - Cache key
 * @returns {number} Age in milliseconds, or -1 if not found
 */
LOMStateCache.prototype.getAge = function(key) {
    var cached = this.cache[key];
    if (!cached) {
        return -1;
    }
    return Date.now() - cached.timestamp;
};

/**
 * Check if key is cached and fresh
 * @param {string} key - Cache key
 * @returns {boolean} True if cached and fresh
 */
LOMStateCache.prototype.isFresh = function(key) {
    var age = this.getAge(key);
    return age >= 0 && age < this.ttl;
};

/**
 * Cleanup old cache entries
 */
LOMStateCache.prototype.cleanup = function() {
    var now = Date.now();
    var keys = Object.keys(this.cache);
    var removed = 0;
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var entry = this.cache[key];
        if ((now - entry.timestamp) > this.maxAge) {
            delete this.cache[key];
            removed++;
        }
    }
    
    if (removed > 0) {
        post("LOM Cache: Cleaned up", removed, "old entries");
    }
};

/**
 * Start automatic cleanup
 */
LOMStateCache.prototype.startCleanup = function() {
    var self = this;
    if (this.cleanupInterval) {
        return; // Already started
    }
    
    this.cleanupInterval = setInterval(function() {
        self.cleanup();
    }, this.cleanupIntervalMs);
};

/**
 * Stop automatic cleanup
 */
LOMStateCache.prototype.stopCleanup = function() {
    if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
    }
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
LOMStateCache.prototype.getStats = function() {
    var keys = Object.keys(this.cache);
    var now = Date.now();
    var fresh = 0;
    var stale = 0;
    
    for (var i = 0; i < keys.length; i++) {
        var entry = this.cache[keys[i]];
        if ((now - entry.timestamp) < this.ttl) {
            fresh++;
        } else {
            stale++;
        }
    }
    
    return {
        total: keys.length,
        fresh: fresh,
        stale: stale,
        ttl: this.ttl,
        maxAge: this.maxAge
    };
};

/**
 * Clear all cache
 */
LOMStateCache.prototype.clear = function() {
    this.cache = {};
};

// ============================================================================
// Global Instance
// ============================================================================

var lomStateCache = new LOMStateCache();

// Start automatic cleanup
lomStateCache.startCleanup();

// ============================================================================
// Exports
// ============================================================================

if (typeof exports !== 'undefined') {
    exports.LOMStateCache = LOMStateCache;
    exports.lomStateCache = lomStateCache;
}

