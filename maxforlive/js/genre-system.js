/**
 * @fileoverview Genre System - Main initialization and coordination
 * @module genre-system
 */

import { GenreManager } from './genre-manager.js';
import { UIController } from './ui-controller.js';
import { genreConfig } from './config.js';
import { GenreSearch } from './genre-search.js';
import { RecentSelections } from './recent-selections.js';
import { GenreTooltips } from './genre-tooltips.js';
import { GenreVisuals } from './genre-visuals.js';

/**
 * GenreSystem class coordinates GenreManager and UIController
 * @class
 */
export class GenreSystem {
    /**
     * Create a GenreSystem instance
     * @param {Object} config - Configuration object
     */
    constructor(config = genreConfig) {
        this.genreManager = new GenreManager(config);
        this.uiController = null;
        this.genreSearch = null;
        this.recentSelections = null;
        this.genreTooltips = null;
        this.genreVisuals = null;
        this.initialized = false;
        this.enableSearch = config.enableSearch !== false;
        this.enableRecentSelections = config.enableRecentSelections !== false;
        this.enableTooltips = config.enableTooltips !== false;
        this.enableVisuals = config.enableVisuals !== false;
    }

    /**
     * Initialize the genre system with DOM elements
     * @param {Object} elements - DOM element references
     * @param {HTMLElement} elements.genreSelect - Genre dropdown element
     * @param {HTMLElement} elements.subGenreSelect - Sub-genre dropdown element
     * @param {HTMLElement} elements.subGenreLine - Sub-genre container element
     * @throws {Error} If initialization fails
     */
    initialize(elements) {
        try {
            // Create UI controller
            this.uiController = new UIController(elements);

            // Set up event listeners
            this.setupEventListeners();

            // Initialize search if enabled
            if (this.enableSearch) {
                this.genreSearch = new GenreSearch(
                    this.genreManager,
                    this.uiController.genreSelect
                );
            }

            // Initialize recent selections if enabled
            if (this.enableRecentSelections) {
                this.recentSelections = new RecentSelections();
                this.recentSelections.setOnSelect((genre, subGenre) => {
                    this.uiController.setGenre(genre);
                    if (subGenre) {
                        setTimeout(() => {
                            this.uiController.setSubGenre(subGenre);
                        }, 100);
                    }
                });
            }

            // Initialize tooltips if enabled
            if (this.enableTooltips) {
                this.genreTooltips = new GenreTooltips(this.uiController.genreSelect);
            }

            // Initialize visual indicators if enabled
            if (this.enableVisuals) {
                this.genreVisuals = new GenreVisuals(this.uiController.genreSelect);
            }

            // Initialize with default genre
            const defaultGenre = this.uiController.getSelectedGenre() || this.genreManager.defaultGenre;
            this.updateSubGenres(defaultGenre);

            this.initialized = true;

            if (this.genreManager.enableLogging) {
                console.log('GenreSystem: Initialized successfully');
            }
        } catch (error) {
            console.error('GenreSystem.initialize: Failed to initialize', error);
            throw error;
        }
    }

    /**
     * Set up event listeners for genre changes
     * @private
     */
    setupEventListeners() {
        if (!this.uiController || !this.uiController.genreSelect) {
            return;
        }

        this.uiController.genreSelect.addEventListener('change', (event) => {
            const genre = event.target.value;
            this.handleGenreChange(genre);
        });
    }

    /**
     * Handle genre change event
     * @param {string} genre - Selected genre
     * @private
     */
    handleGenreChange(genre) {
        try {
            if (this.genreManager.enableLogging) {
                console.log(`GenreSystem: Genre changed to "${genre}"`);
            }

            // Validate genre before processing
            if (!genre || typeof genre !== 'string' || genre.trim() === '') {
                if (this.genreManager.enableLogging) {
                    console.warn('GenreSystem.handleGenreChange: Invalid genre parameter', genre);
                }
                // Hide dropdown for invalid genre
                if (this.uiController) {
                    this.uiController.hideSubGenreDropdown();
                }
                return;
            }

            this.updateSubGenres(genre);
            this.uiController.updateGenreDisplay(genre);

            // Update visuals
            if (this.genreVisuals) {
                this.genreVisuals.updateVisuals();
            }

            // Track in recent selections
            if (this.recentSelections) {
                const subGenre = this.uiController.getSelectedSubGenre();
                this.recentSelections.addSelection(genre, subGenre);
            }
        } catch (error) {
            console.error('GenreSystem.handleGenreChange: Error handling genre change', error);
            if (this.genreManager.enableErrorHandling) {
                // Fallback: hide sub-genre dropdown on error
                if (this.uiController) {
                    this.uiController.hideSubGenreDropdown();
                }
            }
        }
    }

    /**
     * Update sub-genre dropdown based on selected genre
     * @param {string} genre - Genre to get sub-genres for
     */
    updateSubGenres(genre) {
        if (!this.uiController) {
            console.error('GenreSystem.updateSubGenres: UI controller not initialized');
            return;
        }

        try {
            // Validate genre first
            if (!genre || typeof genre !== 'string' || genre.trim() === '') {
                this.uiController.hideSubGenreDropdown();
                return;
            }

            const subGenres = this.genreManager.getSubGenres(genre);
            const normalizeFn = (subGenre) => this.genreManager.normalizeSubGenreValue(subGenre);
            
            this.uiController.updateSubGenreDropdown(subGenres, normalizeFn);
        } catch (error) {
            console.error('GenreSystem.updateSubGenres: Error updating sub-genres', error);
            this.uiController.hideSubGenreDropdown();
        }
    }

    /**
     * Get current genre and sub-genre selection
     * @returns {Object} Current selection
     */
    getSelection() {
        if (!this.uiController) {
            return { genre: '', subGenre: '' };
        }

        return {
            genre: this.uiController.getSelectedGenre(),
            subGenre: this.uiController.getSelectedSubGenre()
        };
    }

    /**
     * Set container for recent selections UI
     * @param {HTMLElement} container - Container element
     */
    setRecentSelectionsContainer(container) {
        if (this.recentSelections) {
            this.recentSelections.setContainer(container);
        }
    }
}

/**
 * Initialize genre system when DOM is ready
 * @param {Object} config - Optional configuration
 * @returns {GenreSystem} Initialized genre system instance
 */
export function initializeGenreSystem(config) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createGenreSystem(config);
        });
    } else {
        return createGenreSystem(config);
    }
}

/**
 * Create and initialize genre system
 * @param {Object} config - Optional configuration
 * @returns {GenreSystem} Initialized genre system instance
 */
function createGenreSystem(config) {
    try {
        const genreSelect = document.getElementById('genre-select');
        const subGenreSelect = document.getElementById('subgenre-select');
        const subGenreLine = document.getElementById('subgenre-line');

        // Validate DOM elements exist
        const missingElements = [];
        if (!genreSelect) missingElements.push('genre-select');
        if (!subGenreSelect) missingElements.push('subgenre-select');
        if (!subGenreLine) missingElements.push('subgenre-line');

        if (missingElements.length > 0) {
            const errorMsg = `GenreSystem: Required DOM elements not found: ${missingElements.join(', ')}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const system = new GenreSystem(config);
        system.initialize({
            genreSelect,
            subGenreSelect,
            subGenreLine
        });

        // Make system available globally for debugging
        if (typeof window !== 'undefined') {
            window.genreSystem = system;
        }

        return system;
    } catch (error) {
        console.error('GenreSystem: Failed to create system', error);
        // Log additional context for debugging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
        }
        return null;
    }
}

