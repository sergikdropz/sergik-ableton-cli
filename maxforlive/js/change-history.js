/**
 * @fileoverview Change History - Undo/redo system for field changes
 * @module change-history
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('ChangeHistory');

/**
 * ChangeHistory class manages undo/redo history
 */
export class ChangeHistory {
    /**
     * Create a ChangeHistory instance
     * @param {number} maxHistory - Maximum history size (default: 50)
     */
    constructor(maxHistory = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
    }
    
    /**
     * Save current state to history
     * @param {Object} state - State object to save
     */
    saveState(state) {
        // Remove any "future" states if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        // Deep clone state
        const stateCopy = JSON.parse(JSON.stringify(state));
        
        // Add to history
        this.history.push(stateCopy);
        this.currentIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentIndex--;
        }
        
        logger.debug('State saved', { index: this.currentIndex, historySize: this.history.length });
    }
    
    /**
     * Undo - go back one state
     * @returns {Object|null} Previous state or null if at beginning
     */
    undo() {
        if (this.currentIndex <= 0) {
            logger.debug('Cannot undo - at beginning of history');
            return null;
        }
        
        this.currentIndex--;
        const state = this.history[this.currentIndex];
        
        logger.debug('Undo performed', { index: this.currentIndex });
        return JSON.parse(JSON.stringify(state)); // Return deep copy
    }
    
    /**
     * Redo - go forward one state
     * @returns {Object|null} Next state or null if at end
     */
    redo() {
        if (this.currentIndex >= this.history.length - 1) {
            logger.debug('Cannot redo - at end of history');
            return null;
        }
        
        this.currentIndex++;
        const state = this.history[this.currentIndex];
        
        logger.debug('Redo performed', { index: this.currentIndex });
        return JSON.parse(JSON.stringify(state)); // Return deep copy
    }
    
    /**
     * Check if undo is available
     * @returns {boolean} True if undo is available
     */
    canUndo() {
        return this.currentIndex > 0;
    }
    
    /**
     * Check if redo is available
     * @returns {boolean} True if redo is available
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
    
    /**
     * Get current state
     * @returns {Object|null} Current state or null if no history
     */
    getCurrentState() {
        if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
            return null;
        }
        
        return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    
    /**
     * Clear history
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        logger.debug('History cleared');
    }
    
    /**
     * Get history size
     * @returns {number} Number of states in history
     */
    getHistorySize() {
        return this.history.length;
    }
}

/**
 * Initialize change history
 * @param {number} maxHistory - Maximum history size
 * @returns {ChangeHistory} History instance
 */
export function initializeChangeHistory(maxHistory = 50) {
    return new ChangeHistory(maxHistory);
}

