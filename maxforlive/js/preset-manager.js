/**
 * @fileoverview Preset Manager - Save and load field configurations
 * @module preset-manager
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('PresetManager');

const STORAGE_KEY = 'sergik-presets';

/**
 * PresetManager class manages saved presets
 */
export class PresetManager {
    /**
     * Create a PresetManager instance
     */
    constructor() {
        // No initialization needed
    }
    
    /**
     * Load all presets from localStorage
     * @returns {Object} Presets object
     * @private
     */
    loadPresets() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            logger.error('Error loading presets from localStorage', error);
        }
        return {};
    }
    
    /**
     * Save presets to localStorage
     * @param {Object} presets - Presets object
     * @private
     */
    savePresets(presets) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
        } catch (error) {
            logger.error('Error saving presets to localStorage', error);
        }
    }
    
    /**
     * Save a preset
     * @param {string} name - Preset name
     * @param {Object} config - Field configuration
     */
    savePreset(name, config) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            logger.warn('Invalid preset name');
            return false;
        }
        
        const presets = this.loadPresets();
        presets[name] = {
            ...config,
            timestamp: Date.now(),
            name: name
        };
        
        this.savePresets(presets);
        logger.debug(`Preset saved: ${name}`);
        return true;
    }
    
    /**
     * Load a preset
     * @param {string} name - Preset name
     * @returns {Object|null} Preset configuration or null if not found
     */
    loadPreset(name) {
        if (!name) return null;
        
        const presets = this.loadPresets();
        const preset = presets[name];
        
        if (preset) {
            logger.debug(`Preset loaded: ${name}`);
            // Return copy without metadata
            const { timestamp, name: presetName, ...config } = preset;
            return config;
        }
        
        return null;
    }
    
    /**
     * Delete a preset
     * @param {string} name - Preset name
     * @returns {boolean} True if deleted, false if not found
     */
    deletePreset(name) {
        if (!name) return false;
        
        const presets = this.loadPresets();
        if (presets[name]) {
            delete presets[name];
            this.savePresets(presets);
            logger.debug(`Preset deleted: ${name}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get all preset names
     * @returns {string[]} Array of preset names
     */
    getAllPresetNames() {
        const presets = this.loadPresets();
        return Object.keys(presets);
    }
    
    /**
     * Get recent presets (sorted by timestamp, most recent first)
     * @param {number} limit - Maximum number of presets to return
     * @returns {string[]} Array of preset names
     */
    getRecentPresets(limit = 5) {
        const presets = this.loadPresets();
        return Object.entries(presets)
            .sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0))
            .slice(0, limit)
            .map(([name]) => name);
    }
    
    /**
     * Check if preset exists
     * @param {string} name - Preset name
     * @returns {boolean} True if preset exists
     */
    presetExists(name) {
        if (!name) return false;
        const presets = this.loadPresets();
        return name in presets;
    }
    
    /**
     * Get preset metadata
     * @param {string} name - Preset name
     * @returns {Object|null} Preset metadata or null if not found
     */
    getPresetMetadata(name) {
        if (!name) return null;
        
        const presets = this.loadPresets();
        const preset = presets[name];
        
        if (preset) {
            return {
                name: preset.name || name,
                timestamp: preset.timestamp || null
            };
        }
        
        return null;
    }
}

/**
 * Initialize preset manager
 * @returns {PresetManager} Preset manager instance
 */
export function initializePresetManager() {
    return new PresetManager();
}

