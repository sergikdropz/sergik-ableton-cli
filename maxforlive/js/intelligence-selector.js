/**
 * @fileoverview Intelligence Selector - Handles intelligence category selection with sub-menus
 * @module intelligence-selector
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('IntelligenceSelector');

/**
 * SERGIK DNA Intelligence Categories
 */
const INTELLIGENCE_CATEGORIES = [
    'Groovy',
    'Chill',
    'Intense',
    'Calm',
    'Social',
    'Productivity',
    'Creative',
    'Dance Floor',
    'Background',
    'Workout'
];

/**
 * Intelligence sub-menu options by category
 * Maps each category to its sub-options
 */
const INTELLIGENCE_SUB_OPTIONS = {
    groovy: [
        'Funky',
        'Rhythmic',
        'Danceable',
        'Swing',
        'Syncopated'
    ],
    chill: [
        'Relaxed',
        'Laid Back',
        'Mellow',
        'Peaceful',
        'Tranquil'
    ],
    intense: [
        'Aggressive',
        'Powerful',
        'Driving',
        'Energetic',
        'High Impact'
    ],
    calm: [
        'Serene',
        'Meditative',
        'Soothing',
        'Gentle',
        'Balanced'
    ],
    social: [
        'Party',
        'Gathering',
        'Conversational',
        'Interactive',
        'Community'
    ],
    productivity: [
        'Focus',
        'Concentration',
        'Work',
        'Study',
        'Flow State'
    ],
    creative: [
        'Inspirational',
        'Artistic',
        'Experimental',
        'Innovative',
        'Expressive'
    ],
    dance_floor: [
        'Club',
        'Festival',
        'Peak Time',
        'Main Stage',
        'Energy Boost'
    ],
    background: [
        'Ambient',
        'Subtle',
        'Non-Intrusive',
        'Atmospheric',
        'Supporting'
    ],
    workout: [
        'Cardio',
        'Strength',
        'Endurance',
        'Motivation',
        'High Intensity'
    ]
};

/**
 * IntelligenceSelector class manages intelligence category selection
 */
export class IntelligenceSelector {
    /**
     * Create an IntelligenceSelector instance
     * @param {Object} elements - DOM element references
     * @param {HTMLElement} elements.intelligenceSelect - Main intelligence dropdown
     * @param {HTMLElement} elements.intelligenceSubSelect - Sub-category dropdown
     * @param {HTMLElement} elements.intelligenceSubLine - Sub-category container
     */
    constructor(elements) {
        this.intelligenceSelect = elements.intelligenceSelect;
        this.intelligenceSubSelect = elements.intelligenceSubSelect;
        this.intelligenceSubLine = elements.intelligenceSubLine;
        
        // Cache for lazy-loaded sub-menu data
        this.subMenuCache = new Map();
        
        this.initialize();
    }
    
    /**
     * Initialize the intelligence selector
     * @private
     */
    initialize() {
        if (!this.intelligenceSelect) {
            logger.warn('Intelligence select element not found');
            return;
        }
        
        // Populate main category dropdown
        this.populateMainCategories();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    /**
     * Populate main category dropdown
     * @private
     */
    populateMainCategories() {
        if (!this.intelligenceSelect) return;
        
        // Clear existing options (except first placeholder)
        const placeholder = this.intelligenceSelect.querySelector('option[value=""]');
        this.intelligenceSelect.innerHTML = '';
        
        if (placeholder) {
            this.intelligenceSelect.appendChild(placeholder);
        } else {
            // Add placeholder if it doesn't exist
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select Intelligence Category';
            this.intelligenceSelect.appendChild(defaultOption);
        }
        
        // Add category options
        INTELLIGENCE_CATEGORIES.forEach(category => {
            const option = document.createElement('option');
            option.value = category.toLowerCase().replace(/\s+/g, '_');
            option.textContent = category;
            this.intelligenceSelect.appendChild(option);
        });
    }
    
    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        if (this.intelligenceSelect) {
            this.intelligenceSelect.addEventListener('change', (event) => {
                const category = event.target.value;
                this.handleCategoryChange(category);
            });
        }
    }
    
    /**
     * Handle category change
     * @param {string} category - Selected category
     * @private
     */
    handleCategoryChange(category) {
        if (!category || category === '') {
            this.hideSubMenu();
            return;
        }
        
        logger.debug(`Intelligence category changed to: ${category}`);
        
        // Load sub-menu options (lazy loading)
        this.loadSubMenu(category).then(subOptions => {
            this.updateSubMenu(subOptions);
            this.showSubMenu();
        }).catch(error => {
            logger.error('Error loading sub-menu', error);
            this.hideSubMenu();
        });
    }
    
    /**
     * Load sub-menu options for a category (lazy loading with caching)
     * @param {string} category - Category name
     * @returns {Promise<string[]>} Sub-options array
     */
    async loadSubMenu(category) {
        // Check cache first
        if (this.subMenuCache.has(category)) {
            return this.subMenuCache.get(category);
        }
        
        // Get sub-options from mapping
        const normalizedCategory = category.toLowerCase();
        const subOptions = INTELLIGENCE_SUB_OPTIONS[normalizedCategory] || [];
        
        // Cache result
        this.subMenuCache.set(category, subOptions);
        
        // Simulate async loading (for future API calls if needed)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(subOptions);
            }, 0);
        });
    }
    
    /**
     * Update sub-menu dropdown with options
     * @param {string[]} subOptions - Sub-options array
     * @private
     */
    updateSubMenu(subOptions) {
        if (!this.intelligenceSubSelect) return;
        
        // Clear existing options
        this.intelligenceSubSelect.innerHTML = '';
        
        // Add "None" option
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = 'None';
        this.intelligenceSubSelect.appendChild(noneOption);
        
        // Add sub-options
        subOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.toLowerCase().replace(/\s+/g, '_');
            optionElement.textContent = option;
            this.intelligenceSubSelect.appendChild(optionElement);
        });
    }
    
    /**
     * Show sub-menu
     * @private
     */
    showSubMenu() {
        if (this.intelligenceSubLine) {
            this.intelligenceSubLine.style.display = 'flex';
            if (this.intelligenceSubSelect) {
                this.intelligenceSubSelect.setAttribute('aria-expanded', 'true');
            }
        }
    }
    
    /**
     * Hide sub-menu
     * @private
     */
    hideSubMenu() {
        if (this.intelligenceSubLine) {
            this.intelligenceSubLine.style.display = 'none';
            if (this.intelligenceSubSelect) {
                this.intelligenceSubSelect.setAttribute('aria-expanded', 'false');
                this.intelligenceSubSelect.value = '';
            }
        }
    }
    
    /**
     * Get current selection
     * @returns {Object} Current intelligence selection
     */
    getSelection() {
        return {
            category: this.intelligenceSelect ? this.intelligenceSelect.value : '',
            subCategory: this.intelligenceSubSelect ? this.intelligenceSubSelect.value : ''
        };
    }
    
    /**
     * Set intelligence category
     * @param {string} category - Category to select
     */
    setCategory(category) {
        if (this.intelligenceSelect) {
            this.intelligenceSelect.value = category;
            this.handleCategoryChange(category);
        }
    }
    
    /**
     * Clear selection
     */
    clear() {
        if (this.intelligenceSelect) {
            this.intelligenceSelect.value = '';
        }
        this.hideSubMenu();
    }
}

/**
 * Initialize intelligence selector
 * @param {Object} config - Optional configuration
 * @returns {IntelligenceSelector|null} Initialized selector or null if elements not found
 */
export function initializeIntelligenceSelector(config = {}) {
    try {
        const intelligenceSelect = document.getElementById('intelligence-select');
        const intelligenceSubSelect = document.getElementById('intelligence-sub-select');
        const intelligenceSubLine = document.getElementById('intelligence-sub-line');
        
        if (!intelligenceSelect) {
            logger.warn('Intelligence select element not found');
            return null;
        }
        
        const selector = new IntelligenceSelector({
            intelligenceSelect,
            intelligenceSubSelect,
            intelligenceSubLine
        });
        
        // Make available globally for debugging
        if (typeof window !== 'undefined') {
            window.intelligenceSelector = selector;
        }
        
        return selector;
    } catch (error) {
        logger.error('Failed to initialize intelligence selector', error);
        return null;
    }
}

