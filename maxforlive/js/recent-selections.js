/**
 * @fileoverview Recent Selections - Track and display recent genre/sub-genre combinations
 * @module recent-selections
 */

import { createLogger } from './utils/logger.ts';
import { validateRecentSelectionsArray, validateGenre, validateSubGenre } from './utils/validator.ts';

const logger = createLogger('RecentSelections');

/**
 * RecentSelections class manages recent genre/sub-genre selections
 * @class
 */
export class RecentSelections {
    /**
     * Create a RecentSelections instance
     * @param {Object} options - Configuration options
     * @param {number} options.maxItems - Maximum number of recent items (default: 5)
     * @param {string} options.storageKey - localStorage key (default: 'sergik_recent_genres')
     * @param {HTMLElement} options.container - Container element for recent selections UI
     */
    constructor(options = {}) {
        this.maxItems = options.maxItems || 5;
        this.storageKey = options.storageKey || 'sergik_recent_genres';
        this.container = options.container;
        this.selections = [];
        
        this.loadFromStorage();
    }

    /**
     * Add a selection to recent list
     * @param {string} genre - Genre value
     * @param {string} subGenre - Sub-genre value (optional)
     */
    addSelection(genre, subGenre = '') {
        // Validate inputs
        if (!genre || !validateGenre(genre)) {
            logger.warn('Invalid genre in addSelection', { genre });
            return;
        }

        if (subGenre && !validateSubGenre(subGenre)) {
            logger.warn('Invalid subGenre in addSelection', { subGenre });
            subGenre = ''; // Clear invalid subGenre
        }

        // Remove existing entry if present
        this.selections = this.selections.filter(
            item => !(item.genre === genre && item.subGenre === subGenre)
        );

        // Add to beginning
        this.selections.unshift({
            genre,
            subGenre,
            timestamp: Date.now()
        });

        // Limit to maxItems
        if (this.selections.length > this.maxItems) {
            this.selections = this.selections.slice(0, this.maxItems);
        }

        // Save to storage
        this.saveToStorage();

        // Update UI if container exists
        if (this.container) {
            this.updateUI();
        }
    }

    /**
     * Get recent selections
     * @returns {Array} Array of recent selections
     */
    getSelections() {
        return this.selections.slice(); // Return copy
    }

    /**
     * Clear all recent selections
     */
    clear() {
        this.selections = [];
        this.saveToStorage();
        if (this.container) {
            this.updateUI();
        }
    }

    /**
     * Load selections from localStorage
     * @private
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Validate and sanitize using validator
                this.selections = validateRecentSelectionsArray(parsed);
            }
        } catch (error) {
            logger.warn('Failed to load from storage', error);
            this.selections = [];
        }
    }

    /**
     * Save selections to localStorage
     * @private
     */
    saveToStorage() {
        try {
            // Validate before saving
            const validated = validateRecentSelectionsArray(this.selections);
            localStorage.setItem(this.storageKey, JSON.stringify(validated));
        } catch (error) {
            logger.warn('Failed to save to storage', error);
        }
    }

    /**
     * Create UI for recent selections
     * @param {HTMLElement} container - Container element
     * @param {Function} onSelect - Callback when selection is clicked
     */
    createUI(container, onSelect) {
        this.container = container;
        this.onSelectCallback = onSelect;
        this.updateUI();
    }

    /**
     * Update UI with current selections
     * @private
     */
    updateUI() {
        if (!this.container) return;

        // Clear container
        this.container.innerHTML = '';

        if (this.selections.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'recent-selections-empty';
            emptyMsg.textContent = 'No recent selections';
            emptyMsg.style.cssText = 'color: #a0a0a0; font-size: 0.75rem; padding: 8px;';
            this.container.appendChild(emptyMsg);
            return;
        }

        // Create header
        const header = document.createElement('div');
        header.className = 'recent-selections-header';
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
        
        const title = document.createElement('span');
        title.textContent = 'Recent Selections';
        title.style.cssText = 'font-size: 0.8rem; color: #a0a0a0; font-weight: 600;';

        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.className = 'recent-selections-clear';
        clearBtn.style.cssText = `
            background: transparent;
            border: 1px solid #4a4a4a;
            color: #a0a0a0;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.7rem;
            cursor: pointer;
        `;
        clearBtn.addEventListener('click', () => this.clear());

        header.appendChild(title);
        header.appendChild(clearBtn);
        this.container.appendChild(header);

        // Create selection buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'recent-selections-buttons';
        buttonsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

        this.selections.forEach((selection, index) => {
            const button = document.createElement('button');
            button.className = 'recent-selection-btn';
            button.style.cssText = `
                background: #2a2a2a;
                border: 1px solid #4a4a4a;
                color: #00d4aa;
                padding: 6px 8px;
                border-radius: 4px;
                font-size: 0.75rem;
                text-align: left;
                cursor: pointer;
                font-family: 'JetBrains Mono', monospace;
            `;

            // Format label
            let label = this.formatGenreName(selection.genre);
            if (selection.subGenre) {
                label += ` → ${this.formatGenreName(selection.subGenre)}`;
            }

            button.textContent = label;
            button.title = `Click to select: ${label}`;

            button.addEventListener('click', () => {
                if (this.onSelectCallback) {
                    this.onSelectCallback(selection.genre, selection.subGenre);
                }
            });

            // Hover effect
            button.addEventListener('mouseenter', () => {
                button.style.background = '#3a3a3a';
                button.style.borderColor = '#00d4aa';
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = '#2a2a2a';
                button.style.borderColor = '#4a4a4a';
            });

            buttonsContainer.appendChild(button);
        });

        this.container.appendChild(buttonsContainer);
    }

    /**
     * Format genre name for display
     * @param {string} genre - Genre value
     * @returns {string} Formatted name
     * @private
     */
    formatGenreName(genre) {
        if (!genre) return '';
        // Convert snake_case to Title Case
        return genre
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Set container element
     * @param {HTMLElement} container - Container element
     */
    setContainer(container) {
        this.container = container;
        if (container) {
            this.updateUI();
        }
    }

    /**
     * Set callback for selection clicks
     * @param {Function} callback - Callback function(genre, subGenre)
     */
    setOnSelect(callback) {
        this.onSelectCallback = callback;
    }
}

