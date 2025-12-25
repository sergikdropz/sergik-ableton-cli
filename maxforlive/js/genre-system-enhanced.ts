/**
 * @fileoverview Enhanced Genre System with State Management and Virtual DOM
 * @module genre-system-enhanced
 */

// @ts-check
import { StateManager } from './state-manager.js';
import { GenreManager } from './genre-manager.js';
import { UIController } from './ui-controller.js';
import { VirtualDOM, h } from './virtual-dom.js';
import { genreConfig } from './config.js';

// Type definitions (for JSDoc compatibility)
/**
 * @typedef {Object} GenreConfig
 * @property {string} [defaultGenre]
 * @property {Object.<string, string[]>} [subGenreMap]
 * @property {boolean} [enableSearch]
 * @property {boolean} [enableRecentSelections]
 */

/**
 * @typedef {Object} GenreElements
 * @property {HTMLSelectElement} genreSelect
 * @property {HTMLSelectElement} subGenreSelect
 * @property {HTMLElement} subGenreLine
 */

/**
 * @typedef {Object} GenreSelection
 * @property {string} genre
 * @property {string} subGenre
 */

/**
 * Enhanced GenreSystem with state management and virtual DOM
 */
export class EnhancedGenreSystem {
    private stateManager: StateManager;
    private genreManager: GenreManager;
    private uiController: UIController | null = null;
    private virtualDOM: VirtualDOM | null = null;
    private unsubscribe: (() => void) | null = null;

    /**
     * @param {any} config
     */
    constructor(config = genreConfig) {
        this.stateManager = new StateManager();
        this.genreManager = new GenreManager(config);
    }

    /**
     * Initialize the enhanced genre system
     * @param {GenreElements} elements
     * @param {boolean} [useVirtualDOM=false]
     */
    initialize(elements, useVirtualDOM = false) {
        // Create UI controller
        this.uiController = new UIController(elements);

        // Setup virtual DOM if requested
        if (useVirtualDOM) {
            const container = document.createElement('div');
            elements.subGenreLine.appendChild(container);
            this.virtualDOM = new VirtualDOM(container);
        }

        // Subscribe to state changes
        this.unsubscribe = this.stateManager.subscribe((state) => {
            this.handleStateChange(state);
        });

        // Setup event listeners
        this.setupEventListeners(elements);

        // Initialize with default genre
        const defaultGenre = elements.genreSelect.value || this.genreManager.defaultGenre;
        this.stateManager.selectGenre(defaultGenre);
    }

    /**
     * Setup event listeners
     * @param {GenreElements} elements
     * @private
     */
    setupEventListeners(elements) {
        elements.genreSelect.addEventListener('change', (e) => {
            const genreTarget = /** @type {HTMLSelectElement} */ (e.target);
            if (genreTarget) {
                this.stateManager.selectGenre(genreTarget.value);
            }
        });

        elements.subGenreSelect.addEventListener('change', (e) => {
            const subGenreTarget = /** @type {HTMLSelectElement} */ (e.target);
            if (subGenreTarget) {
                this.stateManager.selectSubGenre(subGenreTarget.value);
            }
        });
    }

    /**
     * Handle state changes
     * @param {any} state
     * @private
     */
    handleStateChange(state) {
        if (!this.uiController) return;

        // Update sub-genres
        const subGenres = this.genreManager.getSubGenres(state.selectedGenre);

        if (this.virtualDOM) {
            // Use virtual DOM for rendering
            this.renderWithVirtualDOM(subGenres, state);
        } else {
            // Use traditional DOM updates
            this.uiController.updateSubGenreDropdown(
                subGenres,
                (sg) => this.genreManager.normalizeSubGenreValue(sg)
            );
        }

        // Update UI state
        this.uiController.updateGenreDisplay(state.selectedGenre);
    }

    /**
     * Render using virtual DOM
     * @param {string[]} subGenres
     * @param {any} state
     * @private
     */
    renderWithVirtualDOM(subGenres, state) {
        if (!this.virtualDOM) return;

        const optionNodes = subGenres.map(subGenre => 
            h('option', {
                value: this.genreManager.normalizeSubGenreValue(subGenre),
                selected: state.selectedSubGenre === this.genreManager.normalizeSubGenreValue(subGenre)
            }, subGenre)
        );

        const children = [
            h('option', { value: '' }, 'None'),
            ...optionNodes
        ];

        const vnode = h('select', {
            id: 'subgenre-select',
            className: 'dropdown-select',
            onChange: (e) => {
                const subGenreTarget = /** @type {HTMLSelectElement} */ (e.target);
                if (subGenreTarget && subGenreTarget.value !== undefined) {
                    this.stateManager.selectSubGenre(subGenreTarget.value);
                }
            }
        }, children);

        this.virtualDOM.render(vnode);
    }

    /**
     * Get current selection
     * @returns {GenreSelection}
     */
    getSelection() {
        const state = this.stateManager.getState();
        return {
            genre: state.selectedGenre,
            subGenre: state.selectedSubGenre
        };
    }

    /**
     * Get state manager (for advanced usage)
     */
    getStateManager(): StateManager {
        return this.stateManager;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.virtualDOM) {
            this.virtualDOM.clear();
        }
    }
}

/**
 * Initialize enhanced genre system
 * @param {any} [config]
 * @param {boolean} [useVirtualDOM=false]
 * @returns {EnhancedGenreSystem|null}
 */
export function initializeEnhancedGenreSystem(config, useVirtualDOM = false) {
    try {
        const genreSelect = document.getElementById('genre-select') as HTMLSelectElement;
        const subGenreSelect = document.getElementById('subgenre-select') as HTMLSelectElement;
        const subGenreLine = document.getElementById('subgenre-line');

        if (!genreSelect || !subGenreSelect || !subGenreLine) {
            console.error('EnhancedGenreSystem: Required DOM elements not found');
            return null;
        }

        const system = new EnhancedGenreSystem(config);
        system.initialize({
            genreSelect,
            subGenreSelect,
            subGenreLine
        }, useVirtualDOM);

        // Make available globally for debugging
        if (typeof window !== 'undefined') {
            (window as any).enhancedGenreSystem = system;
        }

        return system;
    } catch (error) {
        console.error('EnhancedGenreSystem: Failed to initialize', error);
        return null;
    }
}

