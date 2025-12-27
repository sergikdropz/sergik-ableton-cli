/**
 * Enhanced SearchParser Class
 * 
 * Extends SearchParser with fuzzy matching and advanced suggestion features.
 * Provides better search experience with typo tolerance and intelligent suggestions.
 */

import { SearchParser } from './search-parser.js';

export class EnhancedSearchParser extends SearchParser {
    constructor() {
        super();
        this.fuzzyThreshold = 0.6;
        this.commonGenres = ['house', 'techno', 'trance', 'dubstep', 'drum and bass', 'hip hop', 'jazz', 'funk', 'electronic', 'ambient'];
        this.commonKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }

    /**
     * Fuzzy match query against text
     * @param {string} query - Search query
     * @param {string} text - Text to match against
     * @returns {number} Similarity score (0-1)
     */
    fuzzyMatch(query, text) {
        if (!query || !text) return 0;
        
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        
        // Exact match
        if (textLower.includes(queryLower)) return 1.0;
        
        // Word boundary match
        const words = textLower.split(/\s+/);
        const queryWords = queryLower.split(/\s+/);
        let matches = 0;
        queryWords.forEach(qw => {
            if (words.some(w => w.startsWith(qw) || w.includes(qw))) {
                matches++;
            }
        });
        if (matches > 0) return 0.7 + (matches / queryWords.length) * 0.3;
        
        // Character-based similarity (Levenshtein-like)
        return this.calculateSimilarity(queryLower, textLower);
    }

    /**
     * Calculate string similarity using Levenshtein distance
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Similarity score (0-1)
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Edit distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }

    /**
     * Get enhanced suggestions with fuzzy matching
     * @param {string} partialQuery - Partial query string
     * @param {Array} recentItems - Recent search items
     * @param {Array} mediaItems - Media items to search through
     * @returns {Array} Enhanced suggestions with scores
     */
    getEnhancedSuggestions(partialQuery, recentItems = [], mediaItems = []) {
        const suggestions = [];
        const lowerQuery = partialQuery.toLowerCase();
        
        if (!partialQuery || partialQuery.length < 2) {
            return suggestions;
        }
        
        // 1. Recent queries (exact match priority)
        recentItems.forEach(item => {
            const itemText = typeof item === 'string' ? item : (item.name || item);
            const score = this.fuzzyMatch(partialQuery, itemText);
            if (score >= this.fuzzyThreshold) {
                suggestions.push({
                    text: itemText,
                    type: 'recent',
                    score: score,
                    priority: 1
                });
            }
        });
        
        // 2. Media item names (fuzzy match)
        mediaItems.forEach(item => {
            const name = item.name || '';
            const score = this.fuzzyMatch(partialQuery, name);
            if (score >= this.fuzzyThreshold) {
                suggestions.push({
                    text: name,
                    type: 'media',
                    score: score,
                    priority: 2,
                    metadata: item
                });
            }
        });
        
        // 3. Common filters
        const commonFilters = [
            ...this.commonGenres.map(g => `genre:${g}`),
            ...this.commonKeys.map(k => `key:${k}`),
            'BPM:120', 'BPM:128', 'BPM:140', 'BPM:160'
        ];
        
        commonFilters.forEach(filter => {
            if (filter.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    text: filter,
                    type: 'filter',
                    score: 0.8,
                    priority: 3
                });
            }
        });
        
        // Sort by priority, then score
        return suggestions
            .sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                return b.score - a.score;
            })
            .slice(0, 10)
            .map(s => ({ text: s.text, type: s.type }));
    }

    /**
     * Parse with fuzzy matching support
     * Attempts to extract genre/key from free text if no structured filters found
     * @param {string} query - Query string
     * @returns {Object} Parsed query object
     */
    parseWithFuzzy(query) {
        const parsed = this.parse(query);
        
        // If no structured filters found, try fuzzy matching
        if (!parsed.text && !parsed.bpm_min && !parsed.key && !parsed.name_pattern && !parsed.genre) {
            const queryLower = query.toLowerCase();
            
            // Try to extract genre from free text
            for (const genre of this.commonGenres) {
                if (this.fuzzyMatch(genre, queryLower) >= 0.7) {
                    parsed.genre = genre;
                    break;
                }
            }
            
            // Try to extract key
            for (const key of this.commonKeys) {
                if (query.toUpperCase().includes(key)) {
                    parsed.key = key;
                    break;
                }
            }
            
            // If still no filters, treat entire query as text search
            if (!parsed.genre && !parsed.key) {
                parsed.text = query.trim();
            }
        }
        
        return parsed;
    }

    /**
     * Override getSuggestions to use enhanced version
     * @param {string} partialQuery - Partial query string
     * @param {Array} recentItems - Recent search items
     * @param {Array} mediaItems - Optional media items for fuzzy matching
     * @returns {Array} Suggestions
     */
    getSuggestions(partialQuery, recentItems = [], mediaItems = []) {
        if (mediaItems && mediaItems.length > 0) {
            return this.getEnhancedSuggestions(partialQuery, recentItems, mediaItems);
        }
        return super.getSuggestions(partialQuery, recentItems);
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.EnhancedSearchParser = EnhancedSearchParser;
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = EnhancedSearchParser;
}

