/**
 * @fileoverview Genre Search - Search and filter functionality for genres
 * @module genre-search
 */

import { GenreManager } from './genre-manager.js';
import { createLogger } from './utils/logger.js';
import { debounce } from './utils/debounce.js';
import { sanitizeSearchQuery, validateSearchQuery } from './utils/validator.js';

const logger = createLogger('GenreSearch');

/**
 * GenreSearch class provides search and filtering for genres
 * @class
 */
export class GenreSearch {
    /**
     * Create a GenreSearch instance
     * @param {GenreManager} genreManager - GenreManager instance
     * @param {HTMLElement} genreSelect - Genre dropdown element
     * @param {HTMLElement} searchInput - Search input element (optional)
     */
    /**
     * @param {GenreManager} genreManager
     * @param {HTMLSelectElement} genreSelect
     * @param {HTMLElement|null} [searchInput]
     */
    constructor(genreManager, genreSelect, searchInput = null) {
        this.genreManager = genreManager;
        this.genreSelect = genreSelect;
        this.searchInput = searchInput;
        /** @type {Array<{value: string, text: string, optgroup: string|null}>} */
        this.originalOptions = [];
        this.isFiltered = false;
        
        this.initialize();
    }

    /**
     * Initialize search functionality
     * @private
     */
    initialize() {
        // Store original options
        this.storeOriginalOptions();

        // Create search input if not provided
        if (!this.searchInput) {
            this.createSearchInput();
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Store original dropdown options
     * @private
     */
    storeOriginalOptions() {
        if (!this.genreSelect) return;

        this.originalOptions = [];
        const optgroups = this.genreSelect.querySelectorAll('optgroup');
        
        // Store options from optgroups
        optgroups.forEach(optgroup => {
            /** @type {HTMLOptionsCollection} */
            const options = optgroup.options || [];
            Array.from(options).forEach(option => {
                this.originalOptions.push({
                    value: option.value,
                    text: option.textContent,
                    optgroup: optgroup.label
                });
            });
        });
        
        // Store options not in optgroups (direct children of select)
        /** @type {HTMLOptionsCollection} */
        const allOptions = this.genreSelect.options || [];
        Array.from(allOptions).forEach(option => {
            if (option.parentElement === this.genreSelect) {
                this.originalOptions.push({
                    value: option.value,
                    text: option.textContent,
                    optgroup: null
                });
            }
        });
    }

    /**
     * Create search input element
     * @private
     */
    createSearchInput() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'genre-search-container';
        searchContainer.style.cssText = 'margin-bottom: 8px; position: relative;';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search genres...';
        input.className = 'genre-search-input';
        input.style.cssText = `
            width: 100%;
            padding: 6px 8px;
            background: #2a2a2a;
            border: 1px solid #4a4a4a;
            border-radius: 4px;
            color: #00d4aa;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
        `;

        const clearBtn = document.createElement('button');
        clearBtn.innerHTML = '×';
        clearBtn.className = 'genre-search-clear';
        clearBtn.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            color: #a0a0a0;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0 4px;
            display: none;
        `;

        clearBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        searchContainer.appendChild(input);
        searchContainer.appendChild(clearBtn);
        this.searchInput = input;
        this.clearButton = clearBtn;

        // Insert before genre select
        if (this.genreSelect && this.genreSelect.parentElement) {
            this.genreSelect.parentElement.insertBefore(searchContainer, this.genreSelect);
        } else {
            logger.error('Cannot insert search input - parent element not found');
        }
    }

    /**
     * Set up event listeners
     * @private
     */
    setupEventListeners() {
        if (!this.searchInput) return;

        // Debounced search function (300ms delay)
        const debouncedFilter = debounce((query: string) => {
            this.filterGenres(query);
        }, 300);

        // Search on input with debouncing
        this.searchInput.addEventListener('input', (e) => {
            const target = /** @type {HTMLInputElement} */ (e.target);
            if (target) {
                // Sanitize and validate input
                const sanitized = sanitizeSearchQuery(target.value);
                if (sanitized !== target.value) {
                    target.value = sanitized;
                }
                debouncedFilter(sanitized);
            }
        });

        // Keyboard shortcuts
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
                this.searchInput.blur();
            }
        });

        // Show/hide clear button
        this.searchInput.addEventListener('input', () => {
            if (this.searchInput.value.length > 0) {
                this.clearButton.style.display = 'block';
            } else {
                this.clearButton.style.display = 'none';
            }
        });
    }

    /**
     * Filter genres based on search query
     * @param {string} query - Search query
     */
    filterGenres(query) {
        if (!this.genreSelect) return;

        // Validate and sanitize query
        if (!validateSearchQuery(query)) {
            logger.warn('Invalid search query', { query });
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();

        if (!normalizedQuery) {
            this.restoreOriginalOptions();
            return;
        }

        // Filter options
        /** @type {Array<{value: string, text: string, optgroup: string|null}>} */
        const filteredOptions = this.originalOptions.filter(option => {
            const text = option.text.toLowerCase();
            const value = option.value.toLowerCase();
            return text.includes(normalizedQuery) || value.includes(normalizedQuery);
        });

        // Clear and repopulate dropdown
        this.genreSelect.innerHTML = '';

        // Group by optgroup
        /** @type {Record<string, Array<{value: string, text: string, optgroup: string|null}>>} */
        const grouped = this.groupByOptgroup(filteredOptions);

        Object.entries(grouped).forEach(([groupLabel, options]) => {
            if (groupLabel) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = groupLabel;
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = this.highlightMatch(opt.text, normalizedQuery);
                    optgroup.appendChild(option);
                });
                this.genreSelect.appendChild(optgroup);
            } else {
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = this.highlightMatch(opt.text, normalizedQuery);
                    this.genreSelect.appendChild(option);
                });
            }
        });

        this.isFiltered = true;
    }

    /**
     * Group options by optgroup
     * @param {Array} options - Options array
     * @returns {Object} Grouped options
     * @private
     */
    /**
     * @param {Array<{value: string, text: string, optgroup: string|null}>} options
     * @returns {Record<string, Array<{value: string, text: string, optgroup: string|null}>>}
     */
    groupByOptgroup(options) {
        /** @type {Record<string, Array<{value: string, text: string, optgroup: string|null}>>} */
        const grouped = {};
        options.forEach(option => {
            const group = option.optgroup || '';
            if (!grouped[group]) {
                grouped[group] = [];
            }
            grouped[group].push(option);
        });
        return grouped;
    }

    /**
     * Highlight matching text in search results
     * @param {string} text - Text to highlight
     * @param {string} query - Search query
     * @returns {string} Text with HTML highlighting (or plain text for option elements)
     * @private
     */
    /**
     * @param {string} text
     * @param {string} _query
     * @returns {string}
     */
    highlightMatch(text, _query) {
        // Note: HTML option elements don't support HTML, so we just return the text
        // In a more advanced implementation, we could use a custom dropdown
        return text;
    }

    /**
     * Restore original dropdown options
     * @private
     */
    restoreOriginalOptions() {
        if (!this.genreSelect) return;

        // Get original HTML structure from stored options
        // This is a simplified version - in practice, we'd need to restore the full HTML
        // For now, we'll just reload the page or use a more sophisticated approach
        
        // Store current selection
        const currentValue = /** @type {HTMLSelectElement} */ (this.genreSelect).value;

        // Rebuild from original options
        this.genreSelect.innerHTML = '';
        /** @type {Record<string, Array<{value: string, text: string, optgroup: string|null}>>} */
        const grouped = this.groupByOptgroup(this.originalOptions);

        Object.entries(grouped).forEach(([groupLabel, options]) => {
            if (groupLabel) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = groupLabel;
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    if (opt.value === currentValue) {
                        option.selected = true;
                    }
                    optgroup.appendChild(option);
                });
                this.genreSelect.appendChild(optgroup);
            } else {
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    if (opt.value === currentValue) {
                        option.selected = true;
                    }
                    this.genreSelect.appendChild(option);
                });
            }
        });

        this.isFiltered = false;
    }

    /**
     * Clear search and restore original options
     */
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.restoreOriginalOptions();
        if (this.clearButton) {
            this.clearButton.style.display = 'none';
        }
    }

    /**
     * Focus search input (for keyboard shortcuts)
     */
    focus() {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }
}

