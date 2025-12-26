/**
 * @fileoverview Confidence Indicator - Shows confidence levels for auto-suggestions
 * @module confidence-indicator
 */

import { createLogger } from './utils/logger.ts';
import { getGenreInfo } from './genre-info.js';

const logger = createLogger('ConfidenceIndicator');

/**
 * ConfidenceIndicator class calculates and displays confidence levels
 */
export class ConfidenceIndicator {
    /**
     * Create a ConfidenceIndicator instance
     */
    constructor() {
        // No initialization needed
    }
    
    /**
     * Calculate confidence for a suggestion
     * @param {string} genre - Selected genre
     * @param {Object} suggestion - Suggestion object
     * @param {Object} context - Additional context (user history, idea text, etc.)
     * @returns {number} Confidence score (0-1)
     */
    calculateConfidence(genre, suggestion, context = {}) {
        let confidence = 0.5; // Base confidence
        
        // Check if genre info exists and has defaults
        const genreInfo = getGenreInfo(genre);
        if (genreInfo) {
            if (genreInfo.defaultTempo) confidence += 0.2;
            if (genreInfo.defaultEnergy) confidence += 0.1;
            if (genreInfo.defaultKey) confidence += 0.1;
        }
        
        // Check if suggestion matches idea text
        if (context.ideaText && suggestion.matchesIdea) {
            confidence += 0.1;
        }
        
        // Check user history (if available)
        if (context.userHistory && context.userHistory.hasSimilar(genre)) {
            confidence += 0.1;
        }
        
        // Ensure confidence is between 0 and 1
        return Math.min(Math.max(confidence, 0), 1);
    }
    
    /**
     * Display confidence indicator on an element
     * @param {HTMLElement} element - Element to attach indicator to
     * @param {number} confidence - Confidence value (0-1)
     */
    displayConfidence(element, confidence) {
        if (!element) return;
        
        // Remove existing indicator
        const existing = element.querySelector('.confidence-indicator');
        if (existing) {
            existing.remove();
        }
        
        // Create indicator
        const indicator = document.createElement('span');
        indicator.className = 'confidence-indicator';
        indicator.textContent = `${Math.round(confidence * 100)}%`;
        indicator.style.cssText = `
            font-size: 0.7rem;
            color: rgba(0, 212, 170, ${confidence});
            margin-left: 8px;
            opacity: ${confidence};
            font-weight: 500;
        `;
        
        element.appendChild(indicator);
        
        logger.debug(`Confidence displayed: ${Math.round(confidence * 100)}%`);
    }
    
    /**
     * Get confidence color based on value
     * @param {number} confidence - Confidence value (0-1)
     * @returns {string} Color string
     */
    getConfidenceColor(confidence) {
        if (confidence >= 0.8) return '#00d4aa'; // High - cyan
        if (confidence >= 0.6) return '#fbbf24'; // Medium - yellow
        if (confidence >= 0.4) return '#ff6b35'; // Low-medium - orange
        return '#a0a0a0'; // Low - gray
    }
}

/**
 * Initialize confidence indicator
 * @returns {ConfidenceIndicator} Indicator instance
 */
export function initializeConfidenceIndicator() {
    return new ConfidenceIndicator();
}

