/**
 * @fileoverview Field Validator - Validates field values and provides feedback
 * @module field-validator
 */

import { createLogger } from './utils/logger.ts';
import { getGenreInfo, getBPMRange } from './genre-info.js';

const logger = createLogger('FieldValidator');

/**
 * FieldValidator class validates field values
 */
export class FieldValidator {
    /**
     * Create a FieldValidator instance
     */
    constructor() {
        // No initialization needed
    }
    
    /**
     * Parse BPM range string
     * @param {string} bpmRange - BPM range string
     * @returns {number[]|null} [min, max] or null
     * @private
     */
    parseBPMRange(bpmRange) {
        if (!bpmRange || bpmRange === 'Unknown' || bpmRange === 'Variable') {
            return null;
        }
        
        const match = bpmRange.match(/(\d+)-(\d+)/);
        if (match) {
            return [parseInt(match[1], 10), parseInt(match[2], 10)];
        }
        
        return null;
    }
    
    /**
     * Validate field configuration
     * @param {Object} config - Field configuration
     * @param {string} config.genre - Selected genre
     * @param {number} config.tempo - Tempo value
     * @param {number} config.energy - Energy value
     * @param {string} config.key - Key value
     * @param {string} config.scale - Scale value
     * @returns {Object} Validation result with errors and warnings
     */
    validate(config) {
        const errors = [];
        const warnings = [];
        
        // Validate tempo
        if (config.tempo !== undefined && config.tempo !== null) {
            if (config.tempo < 60 || config.tempo > 200) {
                errors.push('Tempo must be between 60 and 200 BPM');
            } else if (config.genre) {
                const genreInfo = getGenreInfo(config.genre);
                if (genreInfo) {
                    const bpmRange = getBPMRange(config.genre);
                    const range = this.parseBPMRange(bpmRange);
                    if (range) {
                        const [min, max] = range;
                        if (config.tempo < min || config.tempo > max) {
                            warnings.push(`Tempo ${config.tempo} is outside typical ${config.genre} range (${min}-${max} BPM)`);
                        }
                    }
                }
            }
        }
        
        // Validate energy
        if (config.energy !== undefined && config.energy !== null) {
            if (config.energy < 1 || config.energy > 10) {
                errors.push('Energy must be between 1 and 10');
            }
        }
        
        // Validate key
        if (config.key) {
            const keyPattern = /^\d+[AB]$/;
            if (!keyPattern.test(config.key)) {
                errors.push('Invalid key format. Use Camelot notation (e.g., 10B, 7A)');
            }
        }
        
        // Validate scale
        if (config.scale) {
            const validScales = [
                'major', 'minor', 'dorian', 'phrygian', 'lydian',
                'mixolydian', 'locrian', 'harmonic_minor', 'melodic_minor',
                'pent_major', 'pent_minor', 'blues'
            ];
            if (!validScales.includes(config.scale)) {
                errors.push('Invalid scale');
            }
        }
        
        return {
            errors,
            warnings,
            isValid: errors.length === 0
        };
    }
    
    /**
     * Display validation feedback on fields
     * @param {Object} validationResult - Validation result
     * @param {Object} elements - Field elements
     */
    displayFeedback(validationResult, elements) {
        // Clear existing feedback
        this.clearFeedback(elements);
        
        // Apply error styles
        validationResult.errors.forEach(error => {
            // Find relevant field and apply error style
            if (error.includes('Tempo')) {
                this.applyErrorStyle(elements.tempoSelect);
            } else if (error.includes('Energy')) {
                this.applyErrorStyle(elements.energySelect);
            } else if (error.includes('key')) {
                this.applyErrorStyle(elements.keySelect);
            } else if (error.includes('scale')) {
                this.applyErrorStyle(elements.scaleSelect);
            }
        });
        
        // Apply warning styles
        validationResult.warnings.forEach(warning => {
            if (warning.includes('Tempo')) {
                this.applyWarningStyle(elements.tempoSelect);
            } else if (warning.includes('Energy')) {
                this.applyWarningStyle(elements.energySelect);
            }
        });
        
        logger.debug('Validation feedback displayed', validationResult);
    }
    
    /**
     * Apply error style to element
     * @param {HTMLElement} element - Element to style
     * @private
     */
    applyErrorStyle(element) {
        if (!element) return;
        element.style.borderColor = '#ef4444';
        element.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.3)';
    }
    
    /**
     * Apply warning style to element
     * @param {HTMLElement} element - Element to style
     * @private
     */
    applyWarningStyle(element) {
        if (!element) return;
        element.style.borderColor = '#fbbf24';
        element.style.boxShadow = '0 0 8px rgba(251, 191, 36, 0.3)';
    }
    
    /**
     * Clear validation feedback
     * @param {Object} elements - Field elements
     */
    clearFeedback(elements) {
        Object.values(elements).forEach(element => {
            if (element) {
                element.style.borderColor = '';
                element.style.boxShadow = '';
            }
        });
    }
}

/**
 * Initialize field validator
 * @returns {FieldValidator} Validator instance
 */
export function initializeFieldValidator() {
    return new FieldValidator();
}

