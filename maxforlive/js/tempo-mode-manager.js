/**
 * @fileoverview Tempo Mode Manager - Handles Follow Live vs Auto Update tempo modes
 * @module tempo-mode-manager
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('TempoModeManager');

/**
 * TempoModeManager class manages tempo mode (Follow Live vs Auto Update)
 */
export class TempoModeManager {
    /**
     * Create a TempoModeManager instance
     * @param {Object} elements - DOM element references
     * @param {HTMLElement} elements.tempoSelect - Tempo dropdown element
     * @param {HTMLElement} elements.toggle - Toggle checkbox element
     * @param {HTMLElement} elements.toggleLabel - Toggle label element
     */
    constructor(elements) {
        this.tempoSelect = elements.tempoSelect;
        this.toggle = elements.toggle;
        this.toggleLabel = elements.toggleLabel;
        this.isFollowLive = false;
        this.currentLiveTempo = null;
        this.tempoUpdateInterval = null;
        this.liveTempoCallback = null;
        
        this.initialize();
    }
    
    /**
     * Initialize the tempo mode manager
     * @private
     */
    initialize() {
        if (!this.toggle || !this.tempoSelect) {
            logger.warn('Required elements not found for tempo mode manager');
            return;
        }
        
        // Load saved state from localStorage
        const savedState = localStorage.getItem('tempo-follow-live');
        if (savedState === 'true') {
            this.toggle.checked = true;
            this.isFollowLive = true;
            this.updateLabel();
            this.enableFollowLive();
        }
        
        // Setup event listener
        this.toggle.addEventListener('change', () => {
            this.handleToggleChange();
        });
        
        logger.debug('Tempo mode manager initialized', { isFollowLive: this.isFollowLive });
    }
    
    /**
     * Handle toggle change
     * @private
     */
    handleToggleChange() {
        this.isFollowLive = this.toggle.checked;
        this.updateLabel();
        
        if (this.isFollowLive) {
            this.enableFollowLive();
        } else {
            this.disableFollowLive();
        }
        
        // Save state
        localStorage.setItem('tempo-follow-live', this.isFollowLive.toString());
        
        logger.debug('Tempo mode changed', { isFollowLive: this.isFollowLive });
    }
    
    /**
     * Update toggle label
     * @private
     */
    updateLabel() {
        if (this.toggleLabel) {
            this.toggleLabel.textContent = this.isFollowLive ? 'Follow Live' : 'Auto Update';
        }
    }
    
    /**
     * Enable Follow Live mode
     * @private
     */
    enableFollowLive() {
        // Fetch current project tempo
        this.fetchLiveTempo();
        
        // Set up periodic tempo updates (every 2 seconds)
        if (this.tempoUpdateInterval) {
            clearInterval(this.tempoUpdateInterval);
        }
        
        this.tempoUpdateInterval = setInterval(() => {
            this.fetchLiveTempo();
        }, 2000);
        
        // Disable tempo dropdown (make it read-only visually)
        if (this.tempoSelect) {
            this.tempoSelect.style.opacity = '0.7';
            this.tempoSelect.title = 'Tempo is synced with Ableton Live project tempo';
        }
    }
    
    /**
     * Disable Follow Live mode
     * @private
     */
    disableFollowLive() {
        // Clear interval
        if (this.tempoUpdateInterval) {
            clearInterval(this.tempoUpdateInterval);
            this.tempoUpdateInterval = null;
        }
        
        // Restore original option texts
        if (this.tempoSelect) {
            Array.from(this.tempoSelect.options).forEach(option => {
                const originalText = option.getAttribute('data-original-text');
                if (originalText) {
                    option.textContent = originalText;
                    option.removeAttribute('data-original-text');
                }
            });
            
            // Re-enable tempo dropdown
            this.tempoSelect.style.opacity = '1';
            this.tempoSelect.title = '';
        }
    }
    
    /**
     * Fetch current tempo from Ableton Live
     * This will be called by the MaxForLive device or via OSC
     * @private
     */
    fetchLiveTempo() {
        // Try to get tempo from window (set by MaxForLive device)
        if (typeof window !== 'undefined' && window.currentLiveTempo) {
            const tempo = window.currentLiveTempo;
            this.updateTempoFromLive(tempo);
            return;
        }
        
        // Try to get from LiveAPI if available (MaxForLive context)
        if (typeof LiveAPI !== 'undefined') {
            try {
                const liveSet = new LiveAPI('live_set');
                const tempo = parseFloat(liveSet.get('tempo'));
                if (!isNaN(tempo) && tempo > 0) {
                    this.updateTempoFromLive(tempo);
                }
            } catch (error) {
                logger.debug('Could not fetch tempo from LiveAPI', error);
            }
        }
        
        // If callback is set (for external tempo updates via OSC/API)
        if (this.liveTempoCallback) {
            this.liveTempoCallback((tempo) => {
                if (tempo) {
                    this.updateTempoFromLive(tempo);
                }
            });
        }
    }
    
    /**
     * Update tempo dropdown from Live tempo
     * @param {number} tempo - Tempo value from Live
     * @private
     */
    updateTempoFromLive(tempo) {
        if (!this.tempoSelect || !this.isFollowLive) return;
        
        this.currentLiveTempo = tempo;
        
        // Find closest matching option
        const options = Array.from(this.tempoSelect.options);
        let closestOption = options[1]; // Skip first option
        let minDiff = Math.abs(parseInt(closestOption.value, 10) - tempo);
        
        options.forEach(opt => {
            const optValue = parseInt(opt.value, 10);
            if (!isNaN(optValue)) {
                const diff = Math.abs(optValue - tempo);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestOption = opt;
                }
            }
        });
        
        // Update selected value
        if (closestOption && minDiff <= 5) {
            // Only update if within 5 BPM of an option
            this.tempoSelect.value = closestOption.value;
            
            // Update option text to show it's from Live
            const originalText = closestOption.getAttribute('data-original-text') || closestOption.textContent;
            closestOption.setAttribute('data-original-text', originalText);
            closestOption.textContent = `${Math.round(tempo)} BPM (Live)`;
        } else {
            // Tempo doesn't match any option - could add dynamic option here
            logger.debug(`Live tempo ${tempo} doesn't match any dropdown option`);
        }
    }
    
    /**
     * Set callback for external tempo updates
     * @param {Function} callback - Callback function that accepts a function to set tempo
     */
    setLiveTempoCallback(callback) {
        this.liveTempoCallback = callback;
    }
    
    /**
     * Check if Follow Live mode is enabled
     * @returns {boolean} True if Follow Live is enabled
     */
    isFollowLiveEnabled() {
        return this.isFollowLive;
    }
    
    /**
     * Get current Live tempo
     * @returns {number|null} Current Live tempo or null
     */
    getCurrentLiveTempo() {
        return this.currentLiveTempo;
    }
    
    /**
     * Update tempo from external source (e.g., MaxForLive device, OSC)
     * @param {number} tempo - Tempo value
     */
    updateTempo(tempo) {
        if (this.isFollowLive) {
            this.updateTempoFromLive(tempo);
        }
    }
    
    /**
     * Cleanup - call when destroying instance
     */
    destroy() {
        if (this.tempoUpdateInterval) {
            clearInterval(this.tempoUpdateInterval);
        }
        if (this.toggle) {
            this.toggle.removeEventListener('change', this.handleToggleChange);
        }
    }
}

/**
 * Initialize tempo mode manager
 * @param {Object} config - Optional configuration
 * @returns {TempoModeManager|null} Initialized manager or null if elements not found
 */
export function initializeTempoModeManager(config = {}) {
    try {
        const tempoSelect = document.getElementById('tempo-select');
        const toggle = document.getElementById('tempo-follow-toggle');
        const toggleLabel = document.getElementById('tempo-toggle-label');
        
        if (!tempoSelect || !toggle) {
            logger.warn('Required DOM elements not found for tempo mode manager');
            return null;
        }
        
        const manager = new TempoModeManager({
            tempoSelect,
            toggle,
            toggleLabel
        });
        
        // Make available globally for debugging and external access
        if (typeof window !== 'undefined') {
            window.tempoModeManager = manager;
        }
        
        return manager;
    } catch (error) {
        logger.error('Failed to initialize tempo mode manager', error);
        return null;
    }
}

