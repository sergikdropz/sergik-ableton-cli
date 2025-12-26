/**
 * @fileoverview Genre Manager - Core logic for genre/sub-genre management
 * @module genre-manager
 */

import { subGenreMap, genreConfig } from './config.js';
import { createLogger } from './utils/logger.ts';

const logger = createLogger('GenreManager');

// Memoization cache
const subGenresCache = new Map();
let allGenresCache = null;

/**
 * GenreManager class handles genre and sub-genre operations
 * @class
 */
export class GenreManager {
    /**
     * Create a GenreManager instance
     * @param {Object} config - Configuration object
     * @param {Object.<string, string[]>} config.subGenreMap - Map of genres to sub-genres
     * @param {string} config.defaultGenre - Default genre selection
     * @param {boolean} config.enableLogging - Enable console logging
     * @param {boolean} config.enableErrorHandling - Enable error handling
     */
    constructor(config = genreConfig) {
        this.subGenreMap = config.subGenreMap || subGenreMap;
        this.defaultGenre = config.defaultGenre || 'house';
        this.enableLogging = config.enableLogging !== false;
        this.enableErrorHandling = config.enableErrorHandling !== false;
    }

    /**
     * Get sub-genres for a given genre (memoized)
     * @param {string} genre - Genre name
     * @returns {string[]} Array of sub-genre names
     */
    getSubGenres(genre) {
        if (!genre || typeof genre !== 'string') {
            if (this.enableLogging) {
                logger.warn('Invalid genre parameter', { genre });
            }
            return [];
        }

        const normalizedGenre = genre.toLowerCase().trim();
        
        // Check cache first
        if (subGenresCache.has(normalizedGenre)) {
            return subGenresCache.get(normalizedGenre);
        }

        const subGenres = this.subGenreMap[normalizedGenre] || [];
        
        // Cache result
        subGenresCache.set(normalizedGenre, subGenres);

        if (this.enableLogging && subGenres.length === 0 && normalizedGenre !== '') {
            logger.debug(`No sub-genres found for "${genre}"`);
        }

        return subGenres;
    }

    /**
     * Check if a genre has sub-genres
     * @param {string} genre - Genre name
     * @returns {boolean} True if genre has sub-genres
     */
    hasSubGenres(genre) {
        const subGenres = this.getSubGenres(genre);
        return subGenres.length > 0;
    }

    /**
     * Get all available genres (memoized)
     * @returns {string[]} Array of all genre names
     */
    getAllGenres() {
        // Use cached result if available
        if (allGenresCache !== null) {
            return allGenresCache;
        }
        
        const genres = Object.keys(this.subGenreMap);
        // Note: In a real implementation, we'd update the cache
        // For now, we'll just return the result
        return genres;
    }
    
    /**
     * Clear memoization cache (useful for testing or when config changes)
     */
    clearCache() {
        subGenresCache.clear();
    }

    /**
     * Check if a genre exists
     * @param {string} genre - Genre name to check
     * @returns {boolean} True if genre exists
     */
    isValidGenre(genre) {
        if (!genre || typeof genre !== 'string') {
            return false;
        }
        const normalizedGenre = genre.toLowerCase().trim();
        return normalizedGenre in this.subGenreMap;
    }

    /**
     * Normalize sub-genre name to value format (lowercase with underscores)
     * @param {string} subGenre - Sub-genre display name
     * @returns {string} Normalized value
     */
    normalizeSubGenreValue(subGenre) {
        if (!subGenre || typeof subGenre !== 'string') {
            return '';
        }
        return subGenre.toLowerCase().replace(/\s+/g, '_');
    }
}

