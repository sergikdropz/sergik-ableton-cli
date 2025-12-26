/**
 * StateManager Class
 * 
 * Centralized state management with persistence and event system.
 */

export class StateManager {
    constructor() {
        this.state = {
            selectedMedia: null,
            currentEditor: null,
            searchQuery: '',
            activeFilter: 'all',
            viewMode: 'list', // 'list' or 'grid'
            sortBy: 'name', // 'name', 'bpm', 'key', 'duration'
            sortOrder: 'asc', // 'asc' or 'desc'
            mediaHistory: [],
            favorites: [],
            settings: {
                autoLoad: false,
                showMetadata: true,
                compactView: false
            }
        };
        this.listeners = new Map();
        this.loadState();
    }

    /**
     * Get state value
     * @param {string} key - State key (supports dot notation)
     * @returns {*} State value
     */
    get(key) {
        const keys = key.split('.');
        let value = this.state;

        for (const k of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[k];
        }

        return value;
    }

    /**
     * Set state value
     * @param {string} key - State key (supports dot notation)
     * @param {*} value - Value to set
     * @param {boolean} persist - Whether to persist to localStorage
     */
    set(key, value, persist = true) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        let target = this.state;

        // Navigate to parent object
        for (const k of keys) {
            if (!target[k] || typeof target[k] !== 'object') {
                target[k] = {};
            }
            target = target[k];
        }

        // Set value
        const oldValue = target[lastKey];
        target[lastKey] = value;

        // Persist if requested
        if (persist) {
            this.saveState();
        }

        // Notify listeners
        this.notify(key, value, oldValue);
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }

        this.listeners.get(key).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index !== -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    /**
     * Notify listeners of state change
     * @param {string} key - State key
     * @param {*} newValue - New value
     * @param {*} oldValue - Old value
     */
    notify(key, newValue, oldValue) {
        // Notify exact key listeners
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error('State listener error:', error);
                }
            });
        }

        // Notify wildcard listeners
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error('State listener error:', error);
                }
            });
        }

        // Dispatch custom event
        const event = new CustomEvent('stateChange', {
            detail: {
                key: key,
                value: newValue,
                oldValue: oldValue
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const stored = localStorage.getItem('browser_state');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with default state
                this.state = {
                    ...this.state,
                    ...parsed,
                    settings: {
                        ...this.state.settings,
                        ...(parsed.settings || {})
                    }
                };
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
        }
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            // Don't save everything - only persistent state
            const persistentState = {
                searchQuery: this.state.searchQuery,
                activeFilter: this.state.activeFilter,
                viewMode: this.state.viewMode,
                sortBy: this.state.sortBy,
                sortOrder: this.state.sortOrder,
                favorites: this.state.favorites,
                settings: this.state.settings
            };
            localStorage.setItem('browser_state', JSON.stringify(persistentState));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    /**
     * Reset state to defaults
     */
    reset() {
        this.state = {
            selectedMedia: null,
            currentEditor: null,
            searchQuery: '',
            activeFilter: 'all',
            viewMode: 'list',
            sortBy: 'name',
            sortOrder: 'asc',
            mediaHistory: [],
            favorites: [],
            settings: {
                autoLoad: false,
                showMetadata: true,
                compactView: false
            }
        };
        this.saveState();
        this.notify('*', this.state, null);
    }

    /**
     * Get full state
     * @returns {Object} Full state object
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Validate state
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];

        // Validate viewMode
        if (!['list', 'grid'].includes(this.state.viewMode)) {
            errors.push('Invalid viewMode');
        }

        // Validate sortBy
        if (!['name', 'bpm', 'key', 'duration'].includes(this.state.sortBy)) {
            errors.push('Invalid sortBy');
        }

        // Validate sortOrder
        if (!['asc', 'desc'].includes(this.state.sortOrder)) {
            errors.push('Invalid sortOrder');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.StateManager = StateManager;
    window.stateManager = new StateManager();
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = StateManager;
}

