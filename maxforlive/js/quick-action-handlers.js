/**
 * @fileoverview Quick Action Handlers - Handles quick action buttons
 * @module quick-action-handlers
 */

import { createLogger } from './utils/logger.ts';
import { getCurrentTrackMetadata } from './state-helpers.js';

const logger = createLogger('QuickActionHandlers');

/**
 * QuickActionHandlers class handles quick action buttons
 */
export class QuickActionHandlers {
    /**
     * Create a QuickActionHandlers instance
     * @param {string} apiBaseUrl - Base URL for API calls
     */
    constructor(apiBaseUrl = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;
    }

    /**
     * Handle a quick action
     * @param {string} action - Action name (suggest-genre, match-dna, find-similar, optimize-mix)
     * @returns {Promise<void>}
     */
    async handleAction(action) {
        try {
            logger.debug('Handling quick action', { action });

            switch (action) {
                case 'suggest-genre':
                    await this.suggestGenre();
                    break;
                case 'match-dna':
                    await this.matchDNA();
                    break;
                case 'find-similar':
                    await this.findSimilar();
                    break;
                case 'optimize-mix':
                    await this.optimizeMix();
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            logger.error('Quick action failed', error);
            throw error;
        }
    }

    /**
     * Suggest genre for current track
     * @returns {Promise<void>}
     */
    async suggestGenre() {
        try {
            // Get current track info
            const trackInfo = this._getCurrentTrackInfo();
            
            // Search catalog for genre suggestions
            const response = await fetch(`${this.apiBaseUrl}/api/gpt/catalog/search?query=genre&limit=10`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Genre search failed');
            }

            const result = await response.json();
            
            // Display suggestions
            const suggestions = result.tracks?.map(t => t.genre || t.style).filter(Boolean) || [];
            const uniqueGenres = [...new Set(suggestions)].slice(0, 5);
            
            this._showResult('Genre Suggestions', uniqueGenres.join(', '));
        } catch (error) {
            logger.error('Suggest genre failed', error);
            throw error;
        }
    }

    /**
     * Match current track against SERGIK DNA
     * @returns {Promise<void>}
     */
    async matchDNA() {
        try {
            const trackInfo = this._getCurrentTrackInfo();
            
            if (!trackInfo.file) {
                throw new Error('No track selected for DNA analysis');
            }

            const response = await fetch(`${this.apiBaseUrl}/api/gpt/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: 'Match this track against SERGIK DNA profile',
                    file_path: trackInfo.file
                })
            });

            if (!response.ok) {
                throw new Error('DNA match failed');
            }

            const result = await response.json();
            const matchScore = result.sergik_dna?.match_score || 0;
            const matchPercentage = Math.round(matchScore * 100);
            
            this._showResult('DNA Match', `Match Score: ${matchPercentage}%`, result.sergik_dna);
        } catch (error) {
            logger.error('Match DNA failed', error);
            throw error;
        }
    }

    /**
     * Find similar tracks
     * @returns {Promise<void>}
     */
    async findSimilar() {
        try {
            const trackInfo = this._getCurrentTrackInfo();
            
            if (!trackInfo.bpm && !trackInfo.key) {
                throw new Error('Track needs BPM or key for similarity search');
            }

            const query = [];
            if (trackInfo.bpm) query.push(`BPM:${trackInfo.bpm}`);
            if (trackInfo.key) query.push(`key:${trackInfo.key}`);
            if (trackInfo.genre) query.push(`genre:${trackInfo.genre}`);

            const response = await fetch(`${this.apiBaseUrl}/api/gpt/catalog/search?query=${encodeURIComponent(query.join(' '))}&limit=10`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Similarity search failed');
            }

            const result = await response.json();
            const tracks = result.tracks || [];
            
            this._showResult('Similar Tracks', `Found ${tracks.length} similar tracks`, tracks);
        } catch (error) {
            logger.error('Find similar failed', error);
            throw error;
        }
    }

    /**
     * Optimize mix suggestions
     * @returns {Promise<void>}
     */
    async optimizeMix() {
        try {
            const trackInfo = this._getCurrentTrackInfo();
            
            const response = await fetch(`${this.apiBaseUrl}/api/gpt/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: `Suggest mix optimizations for this track. BPM: ${trackInfo.bpm || 'unknown'}, Key: ${trackInfo.key || 'unknown'}, Genre: ${trackInfo.genre || 'unknown'}`
                })
            });

            if (!response.ok) {
                throw new Error('Mix optimization failed');
            }

            const result = await response.json();
            const suggestions = result.suggestions || result.description || 'No specific suggestions available';
            
            this._showResult('Mix Optimization', suggestions);
        } catch (error) {
            logger.error('Optimize mix failed', error);
            throw error;
        }
    }

    /**
     * Get current track info from UI
     * @private
     */
    _getCurrentTrackInfo() {
        // Use state helpers if available
        if (typeof getCurrentTrackMetadata === 'function') {
            return getCurrentTrackMetadata();
        }
        // Fallback to window state
        return {
            file: window.currentTrackFile || null,
            bpm: window.currentTrackBPM || null,
            key: window.currentTrackKey || null,
            genre: window.currentTrackGenre || null,
            trackIndex: window.currentTrackIndex || 0
        };
    }

    /**
     * Show result in UI
     * @private
     */
    _showResult(title, message, data = null) {
        // Create or update result display
        let resultDiv = document.getElementById('quick-action-result');
        if (!resultDiv) {
            resultDiv = document.createElement('div');
            resultDiv.id = 'quick-action-result';
            resultDiv.className = 'quick-action-result';
            const aiTab = document.getElementById('tab-section-ai');
            if (aiTab) {
                aiTab.appendChild(resultDiv);
            }
        }

        resultDiv.innerHTML = `
            <div class="result-header">
                <h4>${title}</h4>
                <button class="result-close">&times;</button>
            </div>
            <div class="result-content">
                <p>${message}</p>
                ${data ? `<pre>${JSON.stringify(data, null, 2)}</pre>` : ''}
            </div>
        `;

        // Close button
        const closeBtn = resultDiv.querySelector('.result-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                resultDiv.remove();
            });
        }

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (resultDiv.parentNode) {
                resultDiv.remove();
            }
        }, 10000);
    }
}

