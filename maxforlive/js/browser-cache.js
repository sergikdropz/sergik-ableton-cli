/**
 * BrowserCache Class
 * 
 * Cache for browser structure and search results.
 */

export class BrowserCache {
    constructor() {
        this.browserStructure = null;
        this.searchResults = new Map(); // key: query, value: { results, timestamp }
        this.searchResultTTL = 5 * 60 * 1000; // 5 minutes
        this.lastStructureUpdate = null;
        this.structureTTL = 60 * 1000; // 1 minute
    }

    /**
     * Get browser structure
     * @returns {Object|null} Browser structure or null if expired
     */
    getBrowserStructure() {
        if (!this.browserStructure) {
            return null;
        }

        // Check if expired
        if (this.lastStructureUpdate && 
            Date.now() - this.lastStructureUpdate > this.structureTTL) {
            this.browserStructure = null;
            return null;
        }

        return this.browserStructure;
    }

    /**
     * Set browser structure
     * @param {Object} structure - Browser structure
     */
    setBrowserStructure(structure) {
        this.browserStructure = structure;
        this.lastStructureUpdate = Date.now();
    }

    /**
     * Get search results from cache
     * @param {string} query - Search query
     * @returns {Array|null} Cached results or null
     */
    getSearchResults(query) {
        if (!this.searchResults.has(query)) {
            return null;
        }

        const cached = this.searchResults.get(query);

        // Check if expired
        if (Date.now() - cached.timestamp > this.searchResultTTL) {
            this.searchResults.delete(query);
            return null;
        }

        return cached.results;
    }

    /**
     * Set search results in cache
     * @param {string} query - Search query
     * @param {Array} results - Search results
     */
    setSearchResults(query, results) {
        this.searchResults.set(query, {
            results: results,
            timestamp: Date.now()
        });

        // Limit cache size (remove oldest)
        if (this.searchResults.size > 50) {
            const oldestQuery = Array.from(this.searchResults.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            this.searchResults.delete(oldestQuery);
        }
    }

    /**
     * Clear search results cache
     */
    clearSearchResults() {
        this.searchResults.clear();
    }

    /**
     * Clear browser structure cache
     */
    clearBrowserStructure() {
        this.browserStructure = null;
        this.lastStructureUpdate = null;
    }

    /**
     * Clear all caches
     */
    clearAll() {
        this.clearSearchResults();
        this.clearBrowserStructure();
    }

    /**
     * Invalidate search results for query
     * @param {string} query - Query to invalidate
     */
    invalidateSearchResults(query) {
        this.searchResults.delete(query);
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.BrowserCache = BrowserCache;
    window.browserCache = new BrowserCache();
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = BrowserCache;
}

