/**
 * @fileoverview Genre Selector Web Component
 * @module components/genre-selector
 */

import { StateManager } from '../state-manager.js';
import { GenreManager } from '../genre-manager.js';

/**
 * Genre Selector Web Component
 * Encapsulated custom element for genre selection
 */
export class GenreSelectorComponent extends HTMLElement {
    private stateManager: StateManager;
    private genreManager: GenreManager;
    private shadow: ShadowRoot;
    private unsubscribe: (() => void) | null = null;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.stateManager = new StateManager();
        this.genreManager = new GenreManager();
        
        this.setupStyles();
        this.setupTemplate();
        this.setupEventListeners();
    }

    /**
     * Setup component styles
     */
    private setupStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                font-family: 'JetBrains Mono', monospace;
            }
            
            .genre-selector {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .genre-select {
                background: #2a2a2a;
                border: 1px solid #4a4a4a;
                border-radius: 4px;
                padding: 4px 8px;
                color: #00d4aa;
                font-family: inherit;
                font-size: 0.75rem;
                min-width: 140px;
            }
            
            .subgenre-line {
                display: none;
            }
            
            .subgenre-line.visible {
                display: flex;
            }
            
            .label {
                color: #a0a0a0;
                min-width: 70px;
                font-size: 0.8rem;
            }
        `;
        this.shadow.appendChild(style);
    }

    /**
     * Setup component template
     */
    private setupTemplate(): void {
        const container = document.createElement('div');
        container.className = 'genre-selector';
        
        container.innerHTML = `
            <div class="display-line">
                <span class="label">Genre:</span>
                <select class="genre-select" id="genre-select">
                    <!-- Options will be populated -->
                </select>
            </div>
            <div class="display-line subgenre-line" id="subgenre-line">
                <span class="label">Sub-Genre:</span>
                <select class="genre-select" id="subgenre-select">
                    <option value="">None</option>
                </select>
            </div>
        `;
        
        this.shadow.appendChild(container);
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        const genreSelect = this.shadow.getElementById('genre-select') as HTMLSelectElement;
        const subGenreSelect = this.shadow.getElementById('subgenre-select') as HTMLSelectElement;

        if (genreSelect) {
            genreSelect.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                this.stateManager.selectGenre(target.value);
                this.updateSubGenres(target.value);
            });
        }

        if (subGenreSelect) {
            subGenreSelect.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                this.stateManager.selectSubGenre(target.value);
            });
        }

        // Subscribe to state changes
        this.unsubscribe = this.stateManager.subscribe((state) => {
            this.onStateChange(state);
        });
    }

    /**
     * Handle state changes
     */
    private onStateChange(state: ReturnType<StateManager['getState']>): void {
        // Dispatch custom event for parent components
        this.dispatchEvent(new CustomEvent('genre-change', {
            detail: {
                genre: state.selectedGenre,
                subGenre: state.selectedSubGenre
            },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Update sub-genre dropdown
     */
    private updateSubGenres(genre: string): void {
        const subGenres = this.genreManager.getSubGenres(genre);
        const subGenreSelect = this.shadow.getElementById('subgenre-select') as HTMLSelectElement;
        const subGenreLine = this.shadow.getElementById('subgenre-line');

        if (!subGenreSelect || !subGenreLine) return;

        // Clear existing options
        subGenreSelect.innerHTML = '<option value="">None</option>';

        // Add sub-genres
        if (subGenres.length > 0) {
            subGenres.forEach(subGenre => {
                const option = document.createElement('option');
                option.value = this.genreManager.normalizeSubGenreValue(subGenre);
                option.textContent = subGenre;
                subGenreSelect.appendChild(option);
            });
            subGenreLine.classList.add('visible');
            this.stateManager.setUIState({ subGenreVisible: true });
        } else {
            subGenreLine.classList.remove('visible');
            this.stateManager.setUIState({ subGenreVisible: false });
        }
    }

    /**
     * Populate genre options from HTML content
     */
    connectedCallback(): void {
        // Get options from light DOM (slotted content)
        const slot = this.querySelector('slot');
        if (slot) {
            slot.assignedNodes();
            // Process assigned nodes to extract options (future implementation)
        }

        // Or get from attribute/data
        const genresData = this.getAttribute('genres');
        if (genresData) {
            try {
                const genres = JSON.parse(genresData);
                this.populateGenres(genres);
            } catch (e) {
                // Logger will be added when migrating to TypeScript
                if (typeof console !== 'undefined') {
                    console.error('Failed to parse genres data', e);
                }
            }
        }
    }

    /**
     * Populate genre dropdown
     */
    private populateGenres(genres: Array<{ value: string; text: string; group?: string }>): void {
        const genreSelect = this.shadow.getElementById('genre-select') as HTMLSelectElement;
        if (!genreSelect) return;

        // Group by category
        const grouped = genres.reduce((acc, genre) => {
            const group = genre.group || 'Other';
            if (!acc[group]) acc[group] = [];
            acc[group].push(genre);
            return acc;
        }, {} as Record<string, typeof genres>);

        // Create optgroups and options
        Object.entries(grouped).forEach(([group, items]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group;
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.value;
                option.textContent = item.text;
                optgroup.appendChild(option);
            });
            genreSelect.appendChild(optgroup);
        });
    }

    /**
     * Get current selection
     */
    getSelection(): { genre: string; subGenre: string } {
        const state = this.stateManager.getState();
        return {
            genre: state.selectedGenre,
            subGenre: state.selectedSubGenre
        };
    }

    /**
     * Cleanup on disconnect
     */
    disconnectedCallback(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Register custom element
if (!customElements.get('genre-selector')) {
    customElements.define('genre-selector', GenreSelectorComponent);
}

