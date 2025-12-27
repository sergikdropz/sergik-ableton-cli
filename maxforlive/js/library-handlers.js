/**
 * @fileoverview Library Handlers - Handles library tab functionality
 * @module library-handlers
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('LibraryHandlers');

/**
 * LibraryHandlers class handles library search, load, and hot-swap operations
 */
export class LibraryHandlers {
    /**
     * Create a LibraryHandlers instance
     * @param {string} apiBaseUrl - Base URL for API calls
     */
    constructor(apiBaseUrl = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;
    }

    /**
     * Search library with query syntax
     * Supports: "BPM:120, key:C, name:kick"
     * @param {string} query - Search query
     * @returns {Promise<Object>} Search results
     */
    async searchLibrary(query) {
        try {
            logger.debug('Searching library', { query });

            // Parse query syntax
            const parsed = this._parseSearchQuery(query);

            const response = await fetch(`${this.apiBaseUrl}/api/live/browser/search?query=${encodeURIComponent(query)}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Search failed');
            }

            const result = await response.json();
            logger.info('Library search complete', { count: result.items?.length || 0 });
            return result;
        } catch (error) {
            logger.error('Library search failed', error);
            throw error;
        }
    }

    /**
     * Load sample into track
     * @param {number} trackIndex - Track index
     * @param {string} samplePath - Path to sample
     * @returns {Promise<Object>} Operation result
     */
    async loadSample(trackIndex, samplePath) {
        try {
            logger.debug('Loading sample', { trackIndex, samplePath });

            const response = await fetch(`${this.apiBaseUrl}/api/live/browser/load`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    track_index: trackIndex,
                    sample_path: samplePath
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Load sample failed');
            }

            const result = await response.json();
            logger.info('Sample loaded', { trackIndex, samplePath });
            return result;
        } catch (error) {
            logger.error('Load sample failed', error);
            throw error;
        }
    }

    /**
     * Hot-swap sample in device
     * @param {number} trackIndex - Track index
     * @param {number} deviceIndex - Device index
     * @param {string} samplePath - Path to sample
     * @returns {Promise<Object>} Operation result
     */
    async hotSwapSample(trackIndex, deviceIndex, samplePath) {
        try {
            logger.debug('Hot-swapping sample', { trackIndex, deviceIndex, samplePath });

            const response = await fetch(`${this.apiBaseUrl}/api/live/browser/hot_swap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    track_index: trackIndex,
                    device_index: deviceIndex,
                    sample_path: samplePath
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Hot-swap failed');
            }

            const result = await response.json();
            logger.info('Sample hot-swapped', { trackIndex, deviceIndex, samplePath });
            return result;
        } catch (error) {
            logger.error('Hot-swap failed', error);
            throw error;
        }
    }

    /**
     * Get media metadata
     * @param {string} path - Path to media file
     * @returns {Promise<Object>} Metadata
     */
    async getMediaMetadata(path) {
        try {
            logger.debug('Getting media metadata', { path });

            // Try to get from analysis endpoint if it's an audio file
            const response = await fetch(`${this.apiBaseUrl}/api/analyze/path?file_path=${encodeURIComponent(path)}`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                return {
                    bpm: result.metadata?.bpm,
                    key: result.metadata?.key,
                    energy: result.metadata?.energy,
                    duration: result.metadata?.duration,
                    ...result.metadata
                };
            }

            // Fallback: return basic info
            return {
                path: path,
                name: path.split('/').pop()
            };
        } catch (error) {
            logger.warn('Failed to get metadata', error);
            return {
                path: path,
                name: path.split('/').pop()
            };
        }
    }

    /**
     * Parse search query syntax
     * Supports: "BPM:120, key:C, name:kick"
     * @private
     */
    _parseSearchQuery(query) {
        const parsed = {
            bpm: null,
            key: null,
            name: null,
            genre: null,
            type: null
        };

        const parts = query.split(',').map(p => p.trim());
        
        for (const part of parts) {
            if (part.includes(':')) {
                const [key, value] = part.split(':').map(s => s.trim());
                const keyLower = key.toLowerCase();
                
                if (keyLower === 'bpm') {
                    parsed.bpm = parseInt(value);
                } else if (keyLower === 'key') {
                    parsed.key = value;
                } else if (keyLower === 'name') {
                    parsed.name = value;
                } else if (keyLower === 'genre') {
                    parsed.genre = value;
                } else if (keyLower === 'type') {
                    parsed.type = value;
                }
            } else {
                // No colon, treat as name search
                parsed.name = part;
            }
        }

        return parsed;
    }
}

