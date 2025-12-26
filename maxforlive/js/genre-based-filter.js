/**
 * @fileoverview Genre-Based Filter - Filters field options based on selected genre
 * @module genre-based-filter
 */

import { createLogger } from './utils/logger.ts';
import { getGenreInfo, getBPMRange } from './genre-info.js';

const logger = createLogger('GenreBasedFilter');

/**
 * GenreBasedFilter class filters field options based on genre
 */
export class GenreBasedFilter {
    /**
     * Create a GenreBasedFilter instance
     */
    constructor() {
        // No initialization needed
    }
    
    /**
     * Parse BPM range string
     * @param {string} bpmRange - BPM range string like "120-130" or "Variable"
     * @returns {number[]} [min, max] or null if variable
     * @private
     */
    parseBPMRange(bpmRange) {
        if (!bpmRange || bpmRange === 'Variable') {
            return null;
        }
        
        const match = bpmRange.match(/(\d+)-(\d+)/);
        if (match) {
            return [parseInt(match[1], 10), parseInt(match[2], 10)];
        }
        
        return null;
    }
    
    /**
     * Filter tempo options based on genre
     * @param {string} genre - Selected genre
     * @param {number[]} allTempoOptions - All available tempo options
     * @returns {number[]} Filtered tempo options
     */
    filterTempoOptions(genre, allTempoOptions) {
        if (!genre) return allTempoOptions;
        
        const bpmRange = getBPMRange(genre);
        const range = this.parseBPMRange(bpmRange);
        
        if (!range) {
            // Variable range - return all options
            return allTempoOptions;
        }
        
        const [min, max] = range;
        
        // Filter options within range (with some padding)
        const padding = 5; // Allow 5 BPM outside range
        return allTempoOptions.filter(tempo => 
            tempo >= (min - padding) && tempo <= (max + padding)
        );
    }
    
    /**
     * Filter energy options based on genre
     * @param {string} genre - Selected genre
     * @param {number[]} allEnergyOptions - All available energy options (1-10)
     * @returns {number[]} Filtered energy options
     */
    filterEnergyOptions(genre, allEnergyOptions) {
        if (!genre) return allEnergyOptions;
        
        const genreInfo = getGenreInfo(genre);
        if (!genreInfo) return allEnergyOptions;
        
        // Genre-specific energy ranges
        const genreEnergyMap = {
            'ambient': [1, 2, 3, 4],
            'lo_fi': [1, 2, 3, 4],
            'downtempo': [2, 3, 4, 5],
            'soul': [3, 4, 5, 6],
            'reggae': [3, 4, 5],
            'hiphop': [4, 5, 6, 7],
            'funk': [5, 6, 7, 8],
            'house': [5, 6, 7, 8],
            'tech_house': [6, 7, 8],
            'techno': [6, 7, 8, 9],
            'trance': [7, 8, 9, 10],
            'hard_techno': [8, 9, 10],
            'dnb': [8, 9, 10],
            'jungle': [8, 9, 10],
            'bass': [7, 8, 9, 10],
            'trap': [7, 8, 9],
            'drill': [8, 9, 10]
        };
        
        const normalizedGenre = genre.toLowerCase();
        const filtered = genreEnergyMap[normalizedGenre];
        
        if (filtered) {
            return allEnergyOptions.filter(energy => filtered.includes(energy));
        }
        
        // Default: return all options
        return allEnergyOptions;
    }
    
    /**
     * Apply filters to tempo dropdown
     * @param {string} genre - Selected genre
     * @param {HTMLElement} tempoSelect - Tempo select element
     */
    applyTempoFilter(genre, tempoSelect) {
        if (!tempoSelect) return;
        
        // Get all tempo options
        const allOptions = Array.from(tempoSelect.options)
            .map(opt => parseInt(opt.value, 10))
            .filter(val => !isNaN(val));
        
        // Filter options
        const filtered = this.filterTempoOptions(genre, allOptions);
        
        // Update options visibility
        Array.from(tempoSelect.options).forEach(option => {
            const value = parseInt(option.value, 10);
            if (isNaN(value)) {
                // Keep non-numeric options visible
                option.style.display = '';
            } else {
                option.style.display = filtered.includes(value) ? '' : 'none';
            }
        });
        
        logger.debug(`Tempo filter applied for genre: ${genre}`, { filtered: filtered.length, total: allOptions.length });
    }
    
    /**
     * Apply filters to energy dropdown
     * @param {string} genre - Selected genre
     * @param {HTMLElement} energySelect - Energy select element
     */
    applyEnergyFilter(genre, energySelect) {
        if (!energySelect) return;
        
        // Get all energy options
        const allOptions = Array.from(energySelect.options)
            .map(opt => parseInt(opt.value, 10))
            .filter(val => !isNaN(val));
        
        // Filter options
        const filtered = this.filterEnergyOptions(genre, allOptions);
        
        // Update options visibility
        Array.from(energySelect.options).forEach(option => {
            const value = parseInt(option.value, 10);
            if (isNaN(value)) {
                // Keep non-numeric options visible
                option.style.display = '';
            } else {
                option.style.display = filtered.includes(value) ? '' : 'none';
            }
        });
        
        logger.debug(`Energy filter applied for genre: ${genre}`, { filtered: filtered.length, total: allOptions.length });
    }
}

/**
 * Initialize genre-based filter
 * @returns {GenreBasedFilter} Filter instance
 */
export function initializeGenreBasedFilter() {
    return new GenreBasedFilter();
}

