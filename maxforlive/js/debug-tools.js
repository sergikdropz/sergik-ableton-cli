/**
 * DebugTools Class
 * 
 * Debugging infrastructure with logging, profiling, and state inspector.
 */

export class DebugTools {
    constructor() {
        this.enabled = false;
        this.logs = [];
        this.maxLogs = 1000;
        this.profiles = new Map();
        this.startTimes = new Map();
    }

    /**
     * Enable/disable debug mode
     * @param {boolean} enabled - Enable or disable
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) {
            console.log('[DebugTools] Debug mode enabled');
        }
    }

    /**
     * Log message
     * @param {string} level - Log level ('log', 'warn', 'error', 'info')
     * @param {string} message - Message
     * @param {...any} args - Additional arguments
     */
    log(level, message, ...args) {
        if (!this.enabled && level !== 'error') {
            return;
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp: timestamp,
            level: level,
            message: message,
            args: args
        };

        this.logs.push(logEntry);

        // Limit log size
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output
        const consoleMethod = console[level] || console.log;
        consoleMethod(`[${timestamp}] ${message}`, ...args);
    }

    /**
     * Start performance profiling
     * @param {string} name - Profile name
     */
    startProfile(name) {
        if (!this.enabled) return;

        this.startTimes.set(name, performance.now());
    }

    /**
     * End performance profiling
     * @param {string} name - Profile name
     * @returns {number} Duration in ms
     */
    endProfile(name) {
        if (!this.enabled) return null;

        const startTime = this.startTimes.get(name);
        if (!startTime) {
            console.warn(`Profile "${name}" was not started`);
            return null;
        }

        const duration = performance.now() - startTime;
        this.startTimes.delete(name);

        if (!this.profiles.has(name)) {
            this.profiles.set(name, []);
        }

        const profileData = this.profiles.get(name);
        profileData.push({
            duration: duration,
            timestamp: Date.now()
        });

        // Keep last 100 measurements
        if (profileData.length > 100) {
            profileData.shift();
        }

        this.log('info', `Profile "${name}": ${duration.toFixed(2)}ms`);
        return duration;
    }

    /**
     * Get profile statistics
     * @param {string} name - Profile name
     * @returns {Object} Statistics
     */
    getProfileStats(name) {
        const data = this.profiles.get(name);
        if (!data || data.length === 0) {
            return null;
        }

        const durations = data.map(d => d.duration);
        const sum = durations.reduce((a, b) => a + b, 0);
        const avg = sum / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);

        // Calculate median
        const sorted = [...durations].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];

        return {
            count: durations.length,
            avg: avg,
            min: min,
            max: max,
            median: median,
            total: sum
        };
    }

    /**
     * Inspect state
     * @returns {Object} State inspection
     */
    inspectState() {
        const inspection = {
            timestamp: new Date().toISOString(),
            state: {},
            cache: {},
            requests: {}
        };

        // State manager
        if (window.stateManager) {
            inspection.state = window.stateManager.getState();
        }

        // Caches
        if (window.browserCache) {
            inspection.cache.browser = {
                structure: window.browserCache.getBrowserStructure() !== null,
                searchResults: window.browserCache.searchResults.size
            };
        }

        if (window.mediaLoader) {
            inspection.cache.media = {
                size: window.mediaLoader.mediaCache.size,
                history: window.mediaLoader.mediaHistory.length
            };
        }

        // Requests
        if (window.requestManager) {
            inspection.requests = {
                active: window.requestManager.getActiveRequestCount(),
                pending: window.requestManager.getPendingRequestCount(),
                queued: window.requestManager.getQueueLength()
            };
        }

        return inspection;
    }

    /**
     * Get logs
     * @param {string} level - Filter by level (optional)
     * @param {number} limit - Limit number of logs
     * @returns {Array} Log entries
     */
    getLogs(level = null, limit = 100) {
        let logs = this.logs;

        if (level) {
            logs = logs.filter(log => log.level === level);
        }

        return logs.slice(-limit);
    }

    /**
     * Clear logs
     */
    clearLogs() {
        this.logs = [];
    }

    /**
     * Clear profiles
     */
    clearProfiles() {
        this.profiles.clear();
        this.startTimes.clear();
    }

    /**
     * Export debug data
     * @returns {Object} Debug data
     */
    export() {
        return {
            logs: this.logs,
            profiles: Array.from(this.profiles.entries()).map(([name, data]) => ({
                name: name,
                stats: this.getProfileStats(name),
                data: data
            })),
            state: this.inspectState()
        };
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.DebugTools = DebugTools;
    window.debugTools = new DebugTools();
    
    // Enable debug mode if URL parameter is present
    if (new URLSearchParams(window.location.search).get('debug') === 'true') {
        window.debugTools.setEnabled(true);
    }
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = DebugTools;
}

