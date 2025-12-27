/**
 * Advanced Filters UI Component
 * 
 * Provides advanced filtering UI for library search with BPM range, key, genre, and duration filters.
 */

export class AdvancedFilters {
    constructor(containerId = 'filter-bar') {
        this.container = document.getElementById(containerId) || document.querySelector('.filter-bar');
        this.activeFilters = {
            type: null,
            bpmRange: null,
            key: null,
            genre: null,
            duration: null
        };
        this.panel = null;
        this.setupUI();
    }

    /**
     * Setup advanced filters UI
     */
    setupUI() {
        if (!this.container) {
            console.warn('[AdvancedFilters] Filter bar container not found');
            return;
        }
        
        // Create advanced filters panel
        const panel = document.createElement('div');
        panel.className = 'advanced-filters-panel';
        panel.id = 'advanced-filters-panel';
        panel.style.cssText = `
            display: none;
            padding: 15px;
            background: var(--bg-panel, #1a1a1a);
            border-top: 1px solid var(--border-color, #333);
            margin-top: 10px;
            border-radius: 4px;
        `;
        
        // BPM Range Filter
        const bpmSection = this.createBPMSection();
        panel.appendChild(bpmSection);
        
        // Key Filter
        const keySection = this.createKeySection();
        panel.appendChild(keySection);
        
        // Genre Filter
        const genreSection = this.createGenreSection();
        panel.appendChild(genreSection);
        
        // Duration Filter
        const durationSection = this.createDurationSection();
        panel.appendChild(durationSection);
        
        // Action buttons
        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 10px; margin-top: 15px;';
        
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply Filters';
        applyBtn.className = 'filter-apply-btn';
        applyBtn.style.cssText = `
            flex: 1;
            padding: 8px 15px;
            background: var(--accent-cyan, #00d4aa);
            border: none;
            color: #000;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 12px;
        `;
        applyBtn.addEventListener('click', () => this.applyFilters());
        applyBtn.addEventListener('mouseenter', () => {
            applyBtn.style.opacity = '0.9';
        });
        applyBtn.addEventListener('mouseleave', () => {
            applyBtn.style.opacity = '1';
        });
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear All';
        clearBtn.className = 'filter-clear-btn';
        clearBtn.style.cssText = `
            flex: 1;
            padding: 8px 15px;
            background: var(--bg-hover, #333);
            border: 1px solid var(--border-color, #444);
            color: var(--text-primary, #fff);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        clearBtn.addEventListener('click', () => this.clearFilters());
        clearBtn.addEventListener('mouseenter', () => {
            clearBtn.style.background = 'var(--bg-active, #3a3a3a)';
        });
        clearBtn.addEventListener('mouseleave', () => {
            clearBtn.style.background = 'var(--bg-hover, #333)';
        });
        
        actions.appendChild(applyBtn);
        actions.appendChild(clearBtn);
        panel.appendChild(actions);
        
        this.container.appendChild(panel);
        this.panel = panel;
        
        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Advanced Filters ▼';
        toggleBtn.className = 'filter-toggle-btn';
        toggleBtn.style.cssText = `
            margin-top: 10px;
            padding: 8px 15px;
            background: var(--bg-panel, #2a2a2a);
            border: 1px solid var(--border-color, #444);
            color: var(--text-primary, #fff);
            cursor: pointer;
            border-radius: 4px;
            font-size: 12px;
            width: 100%;
        `;
        toggleBtn.addEventListener('click', () => {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
            toggleBtn.textContent = isVisible ? 'Advanced Filters ▼' : 'Advanced Filters ▲';
        });
        toggleBtn.addEventListener('mouseenter', () => {
            toggleBtn.style.background = 'var(--bg-hover, #333)';
        });
        toggleBtn.addEventListener('mouseleave', () => {
            toggleBtn.style.background = 'var(--bg-panel, #2a2a2a)';
        });
        this.container.appendChild(toggleBtn);
        this.toggleBtn = toggleBtn;
    }

    /**
     * Create BPM range filter section
     * @returns {HTMLElement} BPM section element
     */
    createBPMSection() {
        const section = document.createElement('div');
        section.className = 'filter-section';
        section.style.cssText = 'margin-bottom: 15px;';
        
        const label = document.createElement('label');
        label.textContent = 'BPM Range';
        label.style.cssText = 'display: block; margin-bottom: 8px; color: var(--text-primary, #fff); font-size: 13px; font-weight: 500;';
        
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = 'display: flex; gap: 10px; align-items: center;';
        
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.id = 'bpm-min';
        minInput.placeholder = 'Min';
        minInput.min = '20';
        minInput.max = '300';
        minInput.style.cssText = `
            width: 80px;
            padding: 6px;
            background: var(--bg-input, #1f1f1f);
            border: 1px solid var(--border-color, #444);
            color: var(--text-primary, #fff);
            border-radius: 4px;
            font-size: 12px;
        `;
        
        const separator = document.createElement('span');
        separator.textContent = '-';
        separator.style.cssText = 'color: var(--text-secondary, #999);';
        
        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.id = 'bpm-max';
        maxInput.placeholder = 'Max';
        maxInput.min = '20';
        maxInput.max = '300';
        maxInput.style.cssText = minInput.style.cssText;
        
        inputContainer.appendChild(minInput);
        inputContainer.appendChild(separator);
        inputContainer.appendChild(maxInput);
        
        section.appendChild(label);
        section.appendChild(inputContainer);
        return section;
    }

    /**
     * Create key filter section
     * @returns {HTMLElement} Key section element
     */
    createKeySection() {
        const section = document.createElement('div');
        section.className = 'filter-section';
        section.style.cssText = 'margin-bottom: 15px;';
        
        const label = document.createElement('label');
        label.textContent = 'Key';
        label.style.cssText = 'display: block; margin-bottom: 8px; color: var(--text-primary, #fff); font-size: 13px; font-weight: 500;';
        
        const select = document.createElement('select');
        select.id = 'filter-key';
        select.style.cssText = `
            width: 100%;
            padding: 6px;
            background: var(--bg-input, #1f1f1f);
            border: 1px solid var(--border-color, #444);
            color: var(--text-primary, #fff);
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
        `;
        
        const keys = ['', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        keys.forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key || 'Any Key';
            select.appendChild(option);
        });
        
        section.appendChild(label);
        section.appendChild(select);
        return section;
    }

    /**
     * Create genre filter section
     * @returns {HTMLElement} Genre section element
     */
    createGenreSection() {
        const section = document.createElement('div');
        section.className = 'filter-section';
        section.style.cssText = 'margin-bottom: 15px;';
        
        const label = document.createElement('label');
        label.textContent = 'Genre';
        label.style.cssText = 'display: block; margin-bottom: 8px; color: var(--text-primary, #fff); font-size: 13px; font-weight: 500;';
        
        const select = document.createElement('select');
        select.id = 'filter-genre';
        select.style.cssText = `
            width: 100%;
            padding: 6px;
            background: var(--bg-input, #1f1f1f);
            border: 1px solid var(--border-color, #444);
            color: var(--text-primary, #fff);
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
        `;
        
        const genres = ['', 'house', 'techno', 'trance', 'dubstep', 'drum and bass', 'hip hop', 'jazz', 'funk', 'electronic', 'ambient'];
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre ? genre.charAt(0).toUpperCase() + genre.slice(1) : 'Any Genre';
            select.appendChild(option);
        });
        
        section.appendChild(label);
        section.appendChild(select);
        return section;
    }

    /**
     * Create duration filter section
     * @returns {HTMLElement} Duration section element
     */
    createDurationSection() {
        const section = document.createElement('div');
        section.className = 'filter-section';
        section.style.cssText = 'margin-bottom: 15px;';
        
        const label = document.createElement('label');
        label.textContent = 'Duration';
        label.style.cssText = 'display: block; margin-bottom: 8px; color: var(--text-primary, #fff); font-size: 13px; font-weight: 500;';
        
        const select = document.createElement('select');
        select.id = 'filter-duration';
        select.style.cssText = `
            width: 100%;
            padding: 6px;
            background: var(--bg-input, #1f1f1f);
            border: 1px solid var(--border-color, #444);
            color: var(--text-primary, #fff);
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
        `;
        
        const durations = [
            { value: '', label: 'Any Duration' },
            { value: '0-30', label: '0-30 seconds' },
            { value: '30-60', label: '30-60 seconds' },
            { value: '60-120', label: '1-2 minutes' },
            { value: '120-300', label: '2-5 minutes' },
            { value: '300+', label: '5+ minutes' }
        ];
        
        durations.forEach(d => {
            const option = document.createElement('option');
            option.value = d.value;
            option.textContent = d.label;
            select.appendChild(option);
        });
        
        section.appendChild(label);
        section.appendChild(select);
        return section;
    }

    /**
     * Apply active filters and trigger search
     */
    applyFilters() {
        const bpmMin = document.getElementById('bpm-min')?.value;
        const bpmMax = document.getElementById('bpm-max')?.value;
        const key = document.getElementById('filter-key')?.value;
        const genre = document.getElementById('filter-genre')?.value;
        const duration = document.getElementById('filter-duration')?.value;
        
        this.activeFilters = {
            bpmRange: (bpmMin || bpmMax) ? { 
                min: bpmMin ? parseInt(bpmMin) : null, 
                max: bpmMax ? parseInt(bpmMax) : null 
            } : null,
            key: key || null,
            genre: genre || null,
            duration: duration || null
        };
        
        // Build query string
        const queryParts = [];
        if (this.activeFilters.bpmRange) {
            if (this.activeFilters.bpmRange.min && this.activeFilters.bpmRange.max) {
                queryParts.push(`BPM:${this.activeFilters.bpmRange.min}-${this.activeFilters.bpmRange.max}`);
            } else if (this.activeFilters.bpmRange.min) {
                queryParts.push(`BPM:${this.activeFilters.bpmRange.min}`);
            } else if (this.activeFilters.bpmRange.max) {
                queryParts.push(`BPM:${this.activeFilters.bpmRange.max}`);
            }
        }
        if (this.activeFilters.key) queryParts.push(`key:${this.activeFilters.key}`);
        if (this.activeFilters.genre) queryParts.push(`genre:${this.activeFilters.genre}`);
        
        const query = queryParts.join(', ');
        
        // Trigger search
        const searchInput = document.getElementById('media-search');
        if (searchInput) {
            searchInput.value = query;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Dispatch filter event
        document.dispatchEvent(new CustomEvent('filtersApplied', {
            detail: { filters: this.activeFilters, query }
        }));
        
        // Visual feedback
        if (window.visualFeedback && window.visualFeedback.success) {
            window.visualFeedback.success(`Filters applied: ${query || 'All filters cleared'}`);
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        const bpmMin = document.getElementById('bpm-min');
        const bpmMax = document.getElementById('bpm-max');
        const key = document.getElementById('filter-key');
        const genre = document.getElementById('filter-genre');
        const duration = document.getElementById('filter-duration');
        
        if (bpmMin) bpmMin.value = '';
        if (bpmMax) bpmMax.value = '';
        if (key) key.value = '';
        if (genre) genre.value = '';
        if (duration) duration.value = '';
        
        this.activeFilters = {
            bpmRange: null,
            key: null,
            genre: null,
            duration: null
        };
        
        // Clear search
        const searchInput = document.getElementById('media-search');
        if (searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        document.dispatchEvent(new CustomEvent('filtersCleared'));
        
        // Visual feedback
        if (window.visualFeedback && window.visualFeedback.info) {
            window.visualFeedback.info('All filters cleared');
        }
    }

    /**
     * Get active filters
     * @returns {Object} Active filters object
     */
    getActiveFilters() {
        return { ...this.activeFilters };
    }

    /**
     * Show filters panel
     */
    show() {
        if (this.panel) {
            this.panel.style.display = 'block';
            if (this.toggleBtn) {
                this.toggleBtn.textContent = 'Advanced Filters ▲';
            }
        }
    }

    /**
     * Hide filters panel
     */
    hide() {
        if (this.panel) {
            this.panel.style.display = 'none';
            if (this.toggleBtn) {
                this.toggleBtn.textContent = 'Advanced Filters ▼';
            }
        }
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.AdvancedFilters = AdvancedFilters;
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = AdvancedFilters;
}

