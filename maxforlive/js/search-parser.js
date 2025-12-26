/**
 * SearchParser Class
 * 
 * Parses structured browser search queries like:
 *   - BPM:120
 *   - key:C
 *   - name:kick
 *   - genre:house
 *   - BPM:120, key:C, name:kick
 */

export class SearchParser {
    constructor() {
        this.recentQueries = this.loadRecentQueries();
        this.maxRecentQueries = 10;
    }

    /**
     * Parse structured query into filter object
     * @param {string} query - Search query string
     * @returns {Object} Parsed query object
     */
    parse(query) {
        const parsed = {
            text: "",
            bpm_min: null,
            bpm_max: null,
            key: null,
            name_pattern: null,
            genre: null
        };

        if (!query || typeof query !== "string") {
            return parsed;
        }

        // Pattern for KEY:VALUE filters
        const filterPattern = /(\w+):([^\s,]+)/g;
        let match;
        let freeText = query.trim();

        // Extract all filters
        while ((match = filterPattern.exec(query)) !== null) {
            const key = match[1].toLowerCase();
            const value = match[2];

            // Remove filter from free text
            freeText = freeText.replace(match[0], "").trim();

            if (key === "bpm") {
                // BPM range or single value
                if (value.includes("-")) {
                    const parts = value.split("-");
                    parsed.bpm_min = parseFloat(parts[0]);
                    parsed.bpm_max = parseFloat(parts[1]) || null;
                } else {
                    const bpm = parseFloat(value);
                    if (!isNaN(bpm)) {
                        // Allow ±5 BPM tolerance for single values
                        parsed.bpm_min = bpm - 5;
                        parsed.bpm_max = bpm + 5;
                    }
                }
            } else if (key === "key") {
                parsed.key = value.toUpperCase();
            } else if (key === "name") {
                parsed.name_pattern = value.toLowerCase();
            } else if (key === "genre") {
                parsed.genre = value.toLowerCase();
            }
        }

        // Clean up free text (remove extra commas/spaces)
        freeText = freeText.replace(/[,\s]+/g, " ").trim();
        parsed.text = freeText;

        return parsed;
    }

    /**
     * Validate query syntax
     * @param {string} query - Query to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validate(query) {
        const errors = [];
        
        if (!query || typeof query !== "string") {
            return { isValid: false, errors: ["Query is required"] };
        }

        // Check for invalid filter syntax
        const invalidPattern = /:\s*[,:]/;
        if (invalidPattern.test(query)) {
            errors.push("Invalid filter syntax: empty filter value");
        }

        // Check for invalid BPM values
        const bpmPattern = /bpm:([^\s,]+)/gi;
        let bpmMatch;
        while ((bpmMatch = bpmPattern.exec(query)) !== null) {
            const value = bpmMatch[1];
            if (!value.includes("-")) {
                const bpm = parseFloat(value);
                if (isNaN(bpm) || bpm < 20 || bpm > 300) {
                    errors.push(`Invalid BPM value: ${value} (must be 20-300)`);
                }
            } else {
                const parts = value.split("-");
                const min = parseFloat(parts[0]);
                const max = parseFloat(parts[1]);
                if (isNaN(min) || isNaN(max) || min < 20 || max > 300 || min >= max) {
                    errors.push(`Invalid BPM range: ${value}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Build search object for API
     * @param {string} query - Query string
     * @returns {Object} Search object for API
     */
    buildSearchObject(query) {
        const parsed = this.parse(query);
        
        return {
            query: query,
            filters: {
                text: parsed.text || null,
                bpm_min: parsed.bpm_min,
                bpm_max: parsed.bpm_max,
                key: parsed.key,
                name_pattern: parsed.name_pattern,
                genre: parsed.genre
            }
        };
    }

    /**
     * Get auto-complete suggestions
     * @param {string} partialQuery - Partial query string
     * @param {Array} recentItems - Recent search items
     * @returns {Array} Suggestions
     */
    getSuggestions(partialQuery, recentItems = []) {
        const suggestions = [];
        
        if (!partialQuery || partialQuery.length < 2) {
            return suggestions;
        }

        const lowerQuery = partialQuery.toLowerCase();

        // Filter suggestions from recent items
        recentItems.forEach(item => {
            const name = (item.name || "").toLowerCase();
            if (name.includes(lowerQuery)) {
                suggestions.push({
                    text: item.name,
                    type: "recent"
                });
            }
        });

        // Add common filter suggestions
        const commonFilters = [
            "BPM:120",
            "BPM:128",
            "key:C",
            "key:10B",
            "genre:house",
            "genre:techno"
        ];

        commonFilters.forEach(filter => {
            if (filter.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    text: filter,
                    type: "filter"
                });
            }
        });

        return suggestions.slice(0, 10); // Limit to 10 suggestions
    }

    /**
     * Save query to recent queries
     * @param {string} query - Query to save
     */
    saveRecentQuery(query) {
        if (!query || query.trim().length === 0) {
            return;
        }

        // Remove if already exists
        const index = this.recentQueries.indexOf(query);
        if (index !== -1) {
            this.recentQueries.splice(index, 1);
        }

        // Add to beginning
        this.recentQueries.unshift(query);

        // Limit size
        if (this.recentQueries.length > this.maxRecentQueries) {
            this.recentQueries = this.recentQueries.slice(0, this.maxRecentQueries);
        }

        // Save to localStorage
        try {
            localStorage.setItem("browser_recent_queries", JSON.stringify(this.recentQueries));
        } catch (e) {
            console.warn("Failed to save recent queries:", e);
        }
    }

    /**
     * Load recent queries from localStorage
     * @returns {Array} Recent queries
     */
    loadRecentQueries() {
        try {
            const stored = localStorage.getItem("browser_recent_queries");
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn("Failed to load recent queries:", e);
        }
        return [];
    }

    /**
     * Get recent queries
     * @returns {Array} Recent queries
     */
    getRecentQueries() {
        return [...this.recentQueries];
    }

    /**
     * Clear recent queries
     */
    clearRecentQueries() {
        this.recentQueries = [];
        try {
            localStorage.removeItem("browser_recent_queries");
        } catch (e) {
            console.warn("Failed to clear recent queries:", e);
        }
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.SearchParser = SearchParser;
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = SearchParser;
}

