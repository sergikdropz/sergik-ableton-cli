/**
 * @fileoverview Field Auto-Update - Automatically updates fields based on genre selection
 * @module field-auto-update
 */

import { getGenreDefaults } from './genre-info.js';
import { createLogger } from './utils/logger.ts';

const logger = createLogger('FieldAutoUpdater');

/**
 * FieldAutoUpdater class handles automatic field updates based on genre selection
 * Uses requestAnimationFrame for batched DOM updates
 */
export class FieldAutoUpdater {
    /**
     * Create a FieldAutoUpdater instance
     * @param {Object} elements - DOM element references
     * @param {HTMLElement} elements.tempoSelect - Tempo dropdown element
     * @param {HTMLElement} elements.energySelect - Energy dropdown element
     * @param {HTMLElement} elements.keySelect - Key dropdown element
     * @param {HTMLElement} elements.scaleSelect - Scale dropdown element
     */
    constructor(elements) {
        this.tempoSelect = elements.tempoSelect;
        this.energySelect = elements.energySelect;
        this.keySelect = elements.keySelect;
        this.scaleSelect = elements.scaleSelect;
        
        // Track which fields were manually edited (to preserve user changes)
        this.manualEdits = {
            tempo: false,
            energy: false,
            key: false,
            scale: false
        };
        
        // Update queue for batching DOM operations
        this.updateQueue = [];
        this.rafId = null;
        
        // Setup event listeners to track manual edits
        this.setupManualEditTracking();
    }
    
    /**
     * Setup event listeners to track when user manually edits fields
     * @private
     */
    setupManualEditTracking() {
        if (this.tempoSelect) {
            this.tempoSelect.addEventListener('change', () => {
                this.manualEdits.tempo = true;
            });
        }
        
        if (this.energySelect) {
            this.energySelect.addEventListener('change', () => {
                this.manualEdits.energy = true;
            });
        }
        
        if (this.keySelect) {
            this.keySelect.addEventListener('change', () => {
                this.manualEdits.key = true;
            });
        }
        
        if (this.scaleSelect) {
            this.scaleSelect.addEventListener('change', () => {
                this.manualEdits.scale = true;
            });
        }
    }
    
    /**
     * Update fields based on genre selection
     * @param {string} genre - Selected genre
     * @param {boolean} force - Force update even if manually edited
     */
    updateFromGenre(genre, force = false) {
        if (!genre) {
            logger.warn('No genre provided for auto-update');
            return;
        }
        
        const defaults = getGenreDefaults(genre);
        if (!defaults) {
            logger.warn(`No defaults found for genre: ${genre}`);
            return;
        }
        
        logger.debug(`Updating fields from genre: ${genre}`, defaults);
        
        // Queue updates for batched DOM operations
        this.queueUpdate(() => {
            this.updateTempo(defaults.tempo, force);
            this.updateEnergy(defaults.energy, force);
            this.updateKey(defaults.key, force);
            this.updateScale(defaults.scale, force);
        });
    }
    
    /**
     * Queue an update function for batched execution
     * @param {Function} updateFn - Function to execute
     * @private
     */
    queueUpdate(updateFn) {
        this.updateQueue.push(updateFn);
        
        if (this.rafId === null) {
            this.rafId = requestAnimationFrame(() => {
                // Execute all queued updates
                this.updateQueue.forEach(fn => {
                    try {
                        fn();
                    } catch (error) {
                        logger.error('Error in queued update', error);
                    }
                });
                
                // Clear queue and reset
                this.updateQueue = [];
                this.rafId = null;
            });
        }
    }
    
    /**
     * Update tempo field
     * @param {number} tempo - Tempo value
     * @param {boolean} force - Force update even if manually edited
     * @private
     */
    updateTempo(tempo, force = false) {
        if (!this.tempoSelect) return;
        
        // Check if Follow Live mode is enabled
        const followToggle = document.getElementById('tempo-follow-toggle');
        if (followToggle && followToggle.checked) {
            logger.debug('Skipping tempo update - Follow Live mode is enabled');
            return;
        }
        
        if (!force && this.manualEdits.tempo) {
            logger.debug('Skipping tempo update - manually edited');
            return;
        }
        
        // Find matching option or closest match
        const options = Array.from(this.tempoSelect.options);
        const exactMatch = options.find(opt => parseInt(opt.value, 10) === tempo);
        
        if (exactMatch) {
            this.tempoSelect.value = exactMatch.value;
        } else {
            // Find closest match
            let closest = options[1]; // Skip first option
            let minDiff = Math.abs(parseInt(closest.value, 10) - tempo);
            
            options.forEach(opt => {
                const diff = Math.abs(parseInt(opt.value, 10) - tempo);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = opt;
                }
            });
            
            if (closest) {
                this.tempoSelect.value = closest.value;
            }
        }
        
        // Reset manual edit flag if forced
        if (force) {
            this.manualEdits.tempo = false;
        }
    }
    
    /**
     * Update energy field
     * @param {number} energy - Energy value
     * @param {boolean} force - Force update even if manually edited
     * @private
     */
    updateEnergy(energy, force = false) {
        if (!this.energySelect) return;
        
        if (!force && this.manualEdits.energy) {
            logger.debug('Skipping energy update - manually edited');
            return;
        }
        
        const option = this.energySelect.querySelector(`option[value="${energy}"]`);
        if (option) {
            this.energySelect.value = energy.toString();
        }
        
        // Reset manual edit flag if forced
        if (force) {
            this.manualEdits.energy = false;
        }
    }
    
    /**
     * Update key field
     * @param {string} key - Key value (e.g., "10B")
     * @param {boolean} force - Force update even if manually edited
     * @private
     */
    updateKey(key, force = false) {
        if (!this.keySelect) return;
        
        if (!force && this.manualEdits.key) {
            logger.debug('Skipping key update - manually edited');
            return;
        }
        
        const option = this.keySelect.querySelector(`option[value="${key}"]`);
        if (option) {
            this.keySelect.value = key;
        }
        
        // Reset manual edit flag if forced
        if (force) {
            this.manualEdits.key = false;
        }
    }
    
    /**
     * Update scale field
     * @param {string} scale - Scale value (e.g., "major")
     * @param {boolean} force - Force update even if manually edited
     * @private
     */
    updateScale(scale, force = false) {
        if (!this.scaleSelect) return;
        
        if (!force && this.manualEdits.scale) {
            logger.debug('Skipping scale update - manually edited');
            return;
        }
        
        const option = this.scaleSelect.querySelector(`option[value="${scale}"]`);
        if (option) {
            this.scaleSelect.value = scale;
        }
        
        // Reset manual edit flag if forced
        if (force) {
            this.manualEdits.scale = false;
        }
    }
    
    /**
     * Reset manual edit tracking (useful when loading presets)
     */
    resetManualEdits() {
        this.manualEdits = {
            tempo: false,
            energy: false,
            key: false,
            scale: false
        };
    }
    
    /**
     * Get current field values
     * @returns {Object} Current field values
     */
    getCurrentValues() {
        return {
            tempo: this.tempoSelect ? parseInt(this.tempoSelect.value, 10) : null,
            energy: this.energySelect ? parseInt(this.energySelect.value, 10) : null,
            key: this.keySelect ? this.keySelect.value : null,
            scale: this.scaleSelect ? this.scaleSelect.value : null
        };
    }
}

/**
 * Initialize field auto-updater
 * @param {Object} config - Optional configuration
 * @returns {FieldAutoUpdater|null} Initialized auto-updater or null if elements not found
 */
export function initializeFieldAutoUpdater(config = {}) {
    try {
        const tempoSelect = document.getElementById('tempo-select');
        const energySelect = document.getElementById('energy-select');
        const keySelect = document.getElementById('key-select');
        const scaleSelect = document.getElementById('scale-select');
        
        if (!tempoSelect || !energySelect || !keySelect || !scaleSelect) {
            logger.warn('Required DOM elements not found for field auto-updater');
            return null;
        }
        
        const updater = new FieldAutoUpdater({
            tempoSelect,
            energySelect,
            keySelect,
            scaleSelect
        });
        
        // Make available globally for debugging
        if (typeof window !== 'undefined') {
            window.fieldAutoUpdater = updater;
        }
        
        return updater;
    } catch (error) {
        logger.error('Failed to initialize field auto-updater', error);
        return null;
    }
}

