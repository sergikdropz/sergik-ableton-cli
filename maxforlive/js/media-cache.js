/**
 * MediaCache Class
 * 
 * LRU cache for media metadata with size limits.
 */

export class MediaCache {
    constructor(maxSize = 100, maxSizeBytes = 10 * 1024 * 1024) { // 10MB default
        this.maxSize = maxSize;
        this.maxSizeBytes = maxSizeBytes;
        this.cache = new Map();
        this.sizeBytes = 0;
    }

    /**
     * Get item from cache
     * @param {string} key - Cache key
     * @returns {Object|null} Cached item or null
     */
    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        // Move to end (most recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);

        return value;
    }

    /**
     * Set item in cache
     * @param {string} key - Cache key
     * @param {Object} value - Value to cache
     */
    set(key, value) {
        // Remove if already exists
        if (this.cache.has(key)) {
            this._remove(key);
        }

        // Calculate size
        const itemSize = this._calculateSize(value);

        // Evict items if needed
        while (
            (this.cache.size >= this.maxSize || this.sizeBytes + itemSize > this.maxSizeBytes) &&
            this.cache.size > 0
        ) {
            // Remove least recently used (first item)
            const firstKey = this.cache.keys().next().value;
            this._remove(firstKey);
        }

        // Add new item
        this.cache.set(key, value);
        this.sizeBytes += itemSize;
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean} True if exists
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Remove item from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        this._remove(key);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.sizeBytes = 0;
    }

    /**
     * Get cache size
     * @returns {number} Number of items
     */
    size() {
        return this.cache.size;
    }

    /**
     * Get cache size in bytes
     * @returns {number} Size in bytes
     */
    sizeBytes() {
        return this.sizeBytes;
    }

    /**
     * Remove item and update size
     * @private
     */
    _remove(key) {
        if (this.cache.has(key)) {
            const value = this.cache.get(key);
            const itemSize = this._calculateSize(value);
            this.cache.delete(key);
            this.sizeBytes -= itemSize;
        }
    }

    /**
     * Calculate approximate size of value in bytes
     * @private
     */
    _calculateSize(value) {
        if (value === null || value === undefined) {
            return 0;
        }

        if (typeof value === 'string') {
            return value.length * 2; // UTF-16 encoding
        }

        if (typeof value === 'number') {
            return 8; // 64-bit float
        }

        if (typeof value === 'boolean') {
            return 1;
        }

        if (Array.isArray(value)) {
            return value.reduce((sum, item) => sum + this._calculateSize(item), 0);
        }

        if (typeof value === 'object') {
            return Object.keys(value).reduce((sum, key) => {
                return sum + key.length * 2 + this._calculateSize(value[key]);
            }, 0);
        }

        return 0;
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.MediaCache = MediaCache;
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = MediaCache;
}

