/**
 * @fileoverview Genre Visuals - Visual indicators, icons, and color coding
 * @module genre-visuals
 */

import { getBPMRange } from './genre-info.js';

/**
 * Category color mapping
 * @type {Object.<string, string>}
 */
const categoryColors = {
    'electronic': '#00d4aa',      // Cyan
    'hiphop': '#ff6b35',          // Orange
    'breakbeat': '#a855f7',      // Purple
    'latin': '#fbbf24',          // Yellow
    'ambient': '#60a5fa',        // Blue
    'funk': '#f59e0b',           // Amber
    'rock': '#ef4444',           // Red
    'jazz': '#10b981'            // Green
};

/**
 * Genre to category mapping
 * @type {Object.<string, string>}
 */
const genreToCategory = {
    // Electronic
    'house': 'electronic',
    'tech_house': 'electronic',
    'deep_house': 'electronic',
    'techno': 'electronic',
    'disco': 'electronic',
    'progressive_house': 'electronic',
    'minimal': 'electronic',
    'trance': 'electronic',
    'hard_techno': 'electronic',
    'acid_house': 'electronic',
    'experimental': 'electronic',
    'bass': 'electronic',
    // Hip-Hop
    'hiphop': 'hiphop',
    'boom_bap': 'hiphop',
    'trap': 'hiphop',
    'lo_fi': 'hiphop',
    'drill': 'hiphop',
    // Breakbeat
    'dnb': 'breakbeat',
    'jungle': 'breakbeat',
    'breakbeat': 'breakbeat',
    'garage': 'breakbeat',
    // Latin
    'reggaeton': 'latin',
    'dembow': 'latin',
    'reggae': 'latin',
    'salsa': 'latin',
    // Ambient
    'ambient': 'ambient',
    'downtempo': 'ambient',
    'trip_hop': 'ambient',
    // Funk
    'funk': 'funk',
    'soul': 'funk',
    'r_and_b': 'funk',
    // Rock
    'indie_rock': 'rock',
    'alternative': 'rock',
    'post_rock': 'rock',
    'psychedelic': 'rock',
    // Jazz
    'jazz': 'jazz',
    'jazz_fusion': 'jazz',
    'nu_jazz': 'jazz'
};

/**
 * Category icons (using Unicode/emoji)
 * @type {Object.<string, string>}
 */
const categoryIcons = {
    'electronic': '⚡',
    'hiphop': '🎤',
    'breakbeat': '🥁',
    'latin': '🌴',
    'ambient': '🌊',
    'funk': '🎸',
    'rock': '🎸',
    'jazz': '🎷'
};

/**
 * GenreVisuals class manages visual indicators for genres
 * @class
 */
export class GenreVisuals {
    /**
     * Create a GenreVisuals instance
     * @param {HTMLElement} genreSelect - Genre dropdown element
     */
    constructor(genreSelect) {
        this.genreSelect = genreSelect;
        this.badges = new Map();
        
        this.initialize();
    }

    /**
     * Initialize visual indicators
     * @private
     */
    initialize() {
        if (!this.genreSelect) return;

        // Add category classes to options
        this.addCategoryClasses();

        // Add BPM badges
        this.addBPMBadges();

        // Update on change
        this.genreSelect.addEventListener('change', () => {
            this.updateVisuals();
        });
    }

    /**
     * Add category classes to genre select
     * @private
     */
    addCategoryClasses() {
        if (!this.genreSelect) return;

        // Add category class to select element based on current selection
        this.updateSelectCategoryClass();
    }

    /**
     * Update select element's category class
     * @private
     */
    updateSelectCategoryClass() {
        if (!this.genreSelect) return;

        // Remove all category classes
        Object.keys(categoryColors).forEach(category => {
            this.genreSelect.classList.remove(`category-${category}`);
        });

        // Add category class for current selection
        const currentGenre = /** @type {HTMLSelectElement} */ (this.genreSelect).value;
        const category = this.getCategoryForGenre(currentGenre);
        if (category) {
            this.genreSelect.classList.add(`category-${category}`);
            // Update border color
            this.genreSelect.style.borderColor = categoryColors[category];
        }
    }

    /**
     * Add BPM badges to options
     * @private
     */
    addBPMBadges() {
        if (!this.genreSelect) return;

        // For native select elements, we can't modify option appearance directly
        // So we'll add a badge next to the select instead
        this.createBPMBadge();
    }

    /**
     * Create BPM badge element
     * @private
     */
    createBPMBadge() {
        // Check if badge already exists
        if (this.bpmBadge) return;

        this.bpmBadge = document.createElement('span');
        this.bpmBadge.className = 'genre-bpm-badge';
        this.bpmBadge.style.cssText = `
            display: inline-block;
            margin-left: 8px;
            padding: 2px 6px;
            background: #2a2a2a;
            border: 1px solid #4a4a4a;
            border-radius: 3px;
            font-size: 0.65rem;
            color: #a0a0a0;
            font-family: 'JetBrains Mono', monospace;
        `;

        // Insert after genre select
        if (this.genreSelect && this.genreSelect.parentElement) {
            if (this.genreSelect.nextSibling) {
                this.genreSelect.parentElement.insertBefore(
                    this.bpmBadge,
                    this.genreSelect.nextSibling
                );
            } else {
                this.genreSelect.parentElement.appendChild(this.bpmBadge);
            }
        } else {
            console.error('GenreVisuals: Cannot insert BPM badge - parent element not found');
        }

        this.updateBPMBadge();
    }

    /**
     * Update BPM badge with current genre's BPM
     * @private
     */
    updateBPMBadge() {
        if (!this.bpmBadge || !this.genreSelect) return;

        const genre = this.genreSelect.value;
        const bpm = getBPMRange(genre);
        
        if (bpm && bpm !== 'Unknown') {
            this.bpmBadge.textContent = `BPM: ${bpm}`;
            this.bpmBadge.style.display = 'inline-block';
        } else {
            this.bpmBadge.style.display = 'none';
        }
    }

    /**
     * Get category for a genre
     * @param {string} genre - Genre name
     * @returns {string|null} Category name or null
     */
    /**
     * @param {string} genre
     * @returns {string|null}
     */
    getCategoryForGenre(genre) {
        if (!genre) return null;
        const normalized = genre.toLowerCase().trim();
        return /** @type {Record<string, string>} */ (genreToCategory)[normalized] || null;
    }

    /**
     * Get color for a genre
     * @param {string} genre - Genre name
     * @returns {string} Color hex code
     */
    getColorForGenre(genre) {
        const category = this.getCategoryForGenre(genre);
        return category ? categoryColors[category] : '#4a4a4a';
    }

    /**
     * Get icon for a genre
     * @param {string} genre - Genre name
     * @returns {string} Icon emoji
     */
    getIconForGenre(genre) {
        const category = this.getCategoryForGenre(genre);
        return category ? categoryIcons[category] : '🎵';
    }

    /**
     * Update all visuals
     */
    updateVisuals() {
        this.updateSelectCategoryClass();
        this.updateBPMBadge();
    }

    /**
     * Add visual indicator to an element
     * @param {HTMLElement} element - Element to add indicator to
     * @param {string} genre - Genre name
     */
    addVisualIndicator(element, genre) {
        if (!element || !genre) return;

        const category = this.getCategoryForGenre(genre);
        const color = this.getColorForGenre(genre);
        const icon = this.getIconForGenre(genre);

        // Add category class
        if (category) {
            element.classList.add(`genre-category-${category}`);
        }

        // Set border color
        element.style.borderColor = color;

        // Add icon if element supports it
        if (element.dataset) {
            element.dataset.genreIcon = icon;
        }
    }

    /**
     * Create category badge element
     * @param {string} genre - Genre name
     * @returns {HTMLElement} Badge element
     */
    /**
     * @param {string} genre
     * @returns {HTMLElement|null}
     */
    createCategoryBadge(genre) {
        const category = this.getCategoryForGenre(genre);
        if (!category) return null;

        const badge = document.createElement('span');
        badge.className = `genre-category-badge category-${category}`;
        badge.style.cssText = `
            display: inline-block;
            padding: 2px 6px;
            background: ${categoryColors[category]}20;
            border: 1px solid ${categoryColors[category]};
            border-radius: 3px;
            font-size: 0.65rem;
            color: ${categoryColors[category]};
            font-family: 'JetBrains Mono', monospace;
            margin-left: 4px;
        `;
        badge.textContent = `${categoryIcons[category]} ${category.charAt(0).toUpperCase() + category.slice(1)}`;

        return badge;
    }
}

// Export category mappings for use in other modules
export { categoryColors, categoryIcons, genreToCategory };

