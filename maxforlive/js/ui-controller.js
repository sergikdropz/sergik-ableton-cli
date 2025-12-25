/**
 * @fileoverview UI Controller - Manages UI state and interactions for genre selection
 * @module ui-controller
 */

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
    }

    /**
     * Update the sub-genre dropdown with new options
     * @param {string[]} subGenres - Array of sub-genre names
     * @param {Function} normalizeFn - Function to normalize sub-genre values
     */
    updateSubGenreDropdown(subGenres, normalizeFn) {
        if (!this.subGenreSelect) {
            console.error('UIController.updateSubGenreDropdown: subGenreSelect element not found');
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
                    console.error('UIController.updateSubGenreDropdown: Error creating option', error);
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
    }
}

