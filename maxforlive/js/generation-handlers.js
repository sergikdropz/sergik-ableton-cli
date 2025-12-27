/**
 * @fileoverview Generation Handlers - Handles all generation operations
 * @module generation-handlers
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('GenerationHandlers');

/**
 * GenerationHandlers class handles all generation-related operations
 */
export class GenerationHandlers {
    /**
     * Create a GenerationHandlers instance
     * @param {string} apiBaseUrl - Base URL for API calls
     */
    constructor(apiBaseUrl = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;
    }

    /**
     * Generate chord progression
     * @param {Object} options - Generation options
     * @param {string} options.key - Musical key (e.g., '10B', 'Cmaj')
     * @param {number} options.bars - Number of bars
     * @param {string} options.voicing - Voicing type (e.g., 'stabs', 'open')
     * @param {number} options.tempo - Tempo in BPM
     * @returns {Promise<Object>} Generation result
     */
    async generateChords(options = {}) {
        try {
            const {
                key = '10B',
                bars = 8,
                voicing = 'stabs',
                tempo = 125
            } = options;

            logger.debug('Generating chord progression', { key, bars, voicing, tempo });

            const response = await fetch(`${this.apiBaseUrl}/api/generate/chord_progression`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key,
                    bars,
                    voicing,
                    tempo
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Chord generation failed');
            }

            const result = await response.json();
            logger.info('Chord progression generated', { count: result.count });
            return result;
        } catch (error) {
            logger.error('Chord generation failed', error);
            throw error;
        }
    }

    /**
     * Generate walking bass line
     * @param {Object} options - Generation options
     * @param {string} options.key - Musical key
     * @param {string} options.style - Style (e.g., 'house', 'tech_house')
     * @param {number} options.bars - Number of bars
     * @param {number} options.tempo - Tempo in BPM
     * @returns {Promise<Object>} Generation result
     */
    async generateBass(options = {}) {
        try {
            const {
                key = '10B',
                style = 'house',
                bars = 8,
                tempo = 125
            } = options;

            logger.debug('Generating walking bass', { key, style, bars, tempo });

            const response = await fetch(`${this.apiBaseUrl}/api/generate/walking_bass`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key,
                    style,
                    bars,
                    tempo
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Bass generation failed');
            }

            const result = await response.json();
            logger.info('Walking bass generated', { count: result.count });
            return result;
        } catch (error) {
            logger.error('Bass generation failed', error);
            throw error;
        }
    }

    /**
     * Generate arpeggios
     * @param {Object} options - Generation options
     * @param {string} options.key - Musical key
     * @param {string} options.pattern - Arpeggio pattern (e.g., 'up', 'down', 'updown')
     * @param {number} options.bars - Number of bars
     * @param {number} options.tempo - Tempo in BPM
     * @returns {Promise<Object>} Generation result
     */
    async generateArpeggios(options = {}) {
        try {
            const {
                key = '10B',
                pattern = 'up',
                bars = 8,
                tempo = 125
            } = options;

            logger.debug('Generating arpeggios', { key, pattern, bars, tempo });

            const response = await fetch(`${this.apiBaseUrl}/api/generate/arpeggios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key,
                    pattern,
                    bars,
                    tempo
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Arpeggio generation failed');
            }

            const result = await response.json();
            logger.info('Arpeggios generated', { count: result.count });
            return result;
        } catch (error) {
            logger.error('Arpeggio generation failed', error);
            throw error;
        }
    }

    /**
     * Generate drum pattern
     * @param {Object} options - Generation options
     * @param {string} options.style - Drum style/genre
     * @param {number} options.bars - Number of bars
     * @param {number} options.tempo - Tempo in BPM
     * @param {number} options.swing - Swing amount (0-100)
     * @param {number} options.humanize - Humanization amount (0-100)
     * @param {number} options.density - Pattern density (0-100)
     * @returns {Promise<Object>} Generation result
     */
    async generateDrums(options = {}) {
        try {
            const {
                style = 'tech_house',
                bars = 8,
                tempo = 125,
                swing = 0,
                humanize = 0,
                density = 50
            } = options;

            logger.debug('Generating drum pattern', { style, bars, tempo, swing, humanize, density });

            const response = await fetch(`${this.apiBaseUrl}/api/drums/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    genre: style,
                    bars,
                    tempo,
                    swing,
                    humanize,
                    density
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Drum generation failed');
            }

            const result = await response.json();
            logger.info('Drum pattern generated', { style });
            return result;
        } catch (error) {
            logger.error('Drum generation failed', error);
            throw error;
        }
    }

    /**
     * Generate using natural language prompt via GPT
     * @param {string} prompt - Natural language prompt
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Generation result
     */
    async generateFromPrompt(prompt, options = {}) {
        try {
            logger.debug('Generating from prompt', { prompt });

            const response = await fetch(`${this.apiBaseUrl}/api/gpt/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    ...options
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Prompt generation failed');
            }

            const result = await response.json();
            logger.info('Prompt generation complete');
            return result;
        } catch (error) {
            logger.error('Prompt generation failed', error);
            throw error;
        }
    }

    /**
     * Generate drums from natural language prompt
     * @param {string} prompt - Natural language prompt
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Generation result
     */
    async generateDrumsFromPrompt(prompt, options = {}) {
        try {
            logger.debug('Generating drums from prompt', { prompt });

            const response = await fetch(`${this.apiBaseUrl}/api/gpt/drums`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    ...options
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Drum prompt generation failed');
            }

            const result = await response.json();
            logger.info('Drum prompt generation complete');
            return result;
        } catch (error) {
            logger.error('Drum prompt generation failed', error);
            throw error;
        }
    }

    /**
     * Generate specific drum element (kicks, claps, hats, etc.)
     * Uses GPT generation with specific prompts
     * @param {string} type - Element type (kicks, claps, hats, percussion, synths, vocals, fx)
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generation result
     */
    async generateElement(type, options = {}) {
        try {
            const {
                style = 'tech_house',
                bars = 8,
                tempo = 125
            } = options;

            logger.debug('Generating element', { type, style, bars, tempo });

            // Map element types to generation prompts
            const promptMap = {
                kicks: `Generate ${bars} bars of ${style} kick drum pattern at ${tempo} BPM`,
                claps: `Generate ${bars} bars of ${style} clap and snare pattern at ${tempo} BPM`,
                hats: `Generate ${bars} bars of ${style} hi-hat and shaker pattern at ${tempo} BPM`,
                percussion: `Generate ${bars} bars of ${style} percussion pattern at ${tempo} BPM`,
                synths: `Generate ${bars} bars of ${style} synth melody in key 10B at ${tempo} BPM`,
                vocals: `Generate ${bars} bars of ${style} vocal phrase at ${tempo} BPM`,
                fx: `Generate ${style} sound effect and transition at ${tempo} BPM`
            };

            const prompt = promptMap[type] || `Generate ${bars} bars of ${style} ${type} at ${tempo} BPM`;

            // Use GPT generation for complex elements
            if (['kicks', 'claps', 'hats', 'percussion'].includes(type)) {
                return await this.generateDrumsFromPrompt(prompt, options);
            } else {
                return await this.generateFromPrompt(prompt, options);
            }
        } catch (error) {
            logger.error('Element generation failed', error);
            throw error;
        }
    }

    /**
     * Get available drum genres
     * @returns {Promise<Object>} Available genres
     */
    async getDrumGenres() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/drums/genres`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch drum genres');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            logger.error('Failed to get drum genres', error);
            throw error;
        }
    }
}

