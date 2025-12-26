/**
 * @fileoverview UI Controller - Manages UI state and interactions for genre selection
 * @module ui-controller
 */

import { createLogger } from './utils/logger.ts';
import { KeyboardNavigation } from './utils/keyboard-navigation.ts';

const logger = createLogger('UIController');

/**
 * UIController class handles UI state and DOM interactions
 * @class
 */
export class UIController {
    /**
     * Create a UIController instance
     * @param {Object} elements - DOM element references
     * @param {HTMLElement} elements.genreSelect - Genre dropdown element
     * @param {HTMLElement} elements.subGenreSelect - Sub-genre dropdown element
     * @param {HTMLElement} elements.subGenreLine - Sub-genre container element
     */
    constructor(elements) {
        this.genreSelect = elements.genreSelect;
        this.subGenreSelect = elements.subGenreSelect;
        this.subGenreLine = elements.subGenreLine;
        
        this.validateElements();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
    }
    
    /**
     * Setup keyboard navigation for dropdowns
     * @private
     */
    setupKeyboardNavigation() {
        if (this.genreSelect) {
            new KeyboardNavigation(this.genreSelect, {
                cycle: true,
                onEscape: () => {
                    this.genreSelect.blur();
                }
            });
        }
        
        if (this.subGenreSelect) {
            new KeyboardNavigation(this.subGenreSelect, {
                cycle: true,
                onEscape: () => {
                    this.subGenreSelect.blur();
                }
            });
        }
    }

    /**
     * Validate that all required DOM elements exist
     * @throws {Error} If required elements are missing
     * @private
     */
    validateElements() {
        const required = {
            genreSelect: this.genreSelect,
            subGenreSelect: this.subGenreSelect,
            subGenreLine: this.subGenreLine
        };

        for (const [name, element] of Object.entries(required)) {
            if (!element) {
                throw new Error(`UIController: Required element "${name}" not found in DOM`);
            }
        }
    }

    /**
     * Show the sub-genre dropdown
     */
    showSubGenreDropdown() {
        if (this.subGenreLine) {
            this.subGenreLine.style.display = 'flex';
        }
    }

    /**
     * Hide the sub-genre dropdown
     */
    hideSubGenreDropdown() {
        if (this.subGenreLine) {
            this.subGenreLine.style.display = 'none';
        }
        // Update ARIA attributes
        if (this.subGenreSelect) {
            this.subGenreSelect.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Update the sub-genre dropdown with new options
     * @param {string[]} subGenres - Array of sub-genre names
     * @param {Function} normalizeFn - Function to normalize sub-genre values
     */
    updateSubGenreDropdown(subGenres, normalizeFn) {
        if (!this.subGenreSelect) {
            logger.error('subGenreSelect element not found');
            return;
        }

        // Clear existing options
        this.subGenreSelect.innerHTML = '<option value="">None</option>';

        // Add sub-genres if available
        if (subGenres && subGenres.length > 0) {
            subGenres.forEach(subGenre => {
                try {
                    const option = document.createElement('option');
                    option.value = normalizeFn ? normalizeFn(subGenre) : subGenre.toLowerCase().replace(/\s+/g, '_');
                    option.textContent = subGenre;
                    this.subGenreSelect.appendChild(option);
                } catch (error) {
                    logger.error('Error creating option', error);
                }
            });
            this.showSubGenreDropdown();
        } else {
            this.hideSubGenreDropdown();
        }
    }

    /**
     * Get the currently selected genre
     * @returns {string} Selected genre value
     */
    getSelectedGenre() {
        if (!this.genreSelect) {
            return '';
        }
        return this.genreSelect.value || '';
    }

    /**
     * Get the currently selected sub-genre
     * @returns {string} Selected sub-genre value
     */
    getSelectedSubGenre() {
        if (!this.subGenreSelect) {
            return '';
        }
        return this.subGenreSelect.value || '';
    }

    /**
     * Set the genre selection
     * @param {string} genre - Genre value to select
     */
    setGenre(genre) {
        if (this.genreSelect && genre) {
            this.genreSelect.value = genre;
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            this.genreSelect.dispatchEvent(event);
        }
    }

    /**
     * Set the sub-genre selection
     * @param {string} subGenre - Sub-genre value to select
     */
    setSubGenre(subGenre) {
        if (this.subGenreSelect && subGenre) {
            this.subGenreSelect.value = subGenre;
        }
    }

    /**
     * Update genre display (for future enhancements like visual indicators)
     * @param {string} genre - Genre value
     */
    updateGenreDisplay(genre) {
        // Placeholder for future enhancements
        // Could update colors, icons, badges, etc.
        if (this.genreSelect) {
            // Remove previous category classes
            this.genreSelect.classList.remove('category-electronic', 'category-hiphop', 'category-breakbeat', 
                                            'category-latin', 'category-ambient', 'category-funk', 
                                            'category-rock', 'category-jazz');
            
            // Add category class based on genre (simplified - could be more sophisticated)
            // This is a placeholder for future enhancement
        }
        
        // Announce to screen readers
        this.announceToScreenReader(`Genre changed to ${genre}`);
    }
    
    /**
     * Announce changes to screen readers
     * @param {string} message - Message to announce
     * @private
     */
    announceToScreenReader(message) {
        // Create or get live region
        let liveRegion = document.getElementById('aria-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }
        
        // Update message
        liveRegion.textContent = message;
        
        // Clear after announcement (screen readers will have read it)
        setTimeout(() => {
            if (liveRegion) {
                liveRegion.textContent = '';
            }
        }, 1000);
    }
    
    /**
     * Set focus to genre select
     */
    focusGenreSelect() {
        if (this.genreSelect) {
            this.genreSelect.focus();
        }
    }
    
    /**
     * Set focus to sub-genre select
     */
    focusSubGenreSelect() {
        if (this.subGenreSelect) {
            this.subGenreSelect.focus();
        }
    }
    
    /**
     * Restore focus to last focused element
     */
    restoreFocus() {
        // This would track the last focused element
        // For now, focus genre select as default
        this.focusGenreSelect();
    }
}

