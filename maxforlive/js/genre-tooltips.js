/**
 * @fileoverview Genre Tooltips - Tooltip system for genre information
 * @module genre-tooltips
 */

import { getGenreInfo, getBPMRange, getGenreDescription } from './genre-info.js';

/**
 * GenreTooltips class manages tooltip display for genres
 * @class
 */
export class GenreTooltips {
    /**
     * Create a GenreTooltips instance
     * @param {HTMLElement} genreSelect - Genre dropdown element
     */
    constructor(genreSelect) {
        this.genreSelect = genreSelect;
        this.tooltip = null;
        this.currentTarget = null;
        
        this.createTooltip();
        this.attachEventListeners();
    }

    /**
     * Create tooltip element
     * @private
     */
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'genre-tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            background: #1a1a1a;
            border: 1px solid #00d4aa;
            border-radius: 4px;
            padding: 8px 12px;
            color: #ffffff;
            font-size: 0.75rem;
            font-family: 'JetBrains Mono', monospace;
            z-index: 10000;
            pointer-events: none;
            display: none;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;
        document.body.appendChild(this.tooltip);
    }

    /**
     * Attach event listeners to genre select
     * @private
     */
    attachEventListeners() {
        if (!this.genreSelect) return;

        // Show tooltip on hover over options (via select element)
        this.genreSelect.addEventListener('mouseenter', (e) => {
            this.showTooltipForOption(e.target);
        });

        this.genreSelect.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });

        // Show tooltip when option is focused
        this.genreSelect.addEventListener('focus', (e) => {
            this.showTooltipForCurrentSelection();
        });

        this.genreSelect.addEventListener('blur', () => {
            this.hideTooltip();
        });

        // Show tooltip on change
        this.genreSelect.addEventListener('change', () => {
            this.showTooltipForCurrentSelection();
            setTimeout(() => this.hideTooltip(), 3000); // Hide after 3 seconds
        });
    }

    /**
     * Show tooltip for specific option
     * @param {HTMLElement} target - Target element
     * @private
     */
    showTooltipForOption(target) {
        // For select elements, we need to get the selected option
        if (target.tagName === 'SELECT') {
            const selectedOption = target.options[target.selectedIndex];
            if (selectedOption && selectedOption.value) {
                this.showTooltip(selectedOption.value, target);
            }
        }
    }

    /**
     * Show tooltip for current selection
     * @private
     */
    showTooltipForCurrentSelection() {
        if (!this.genreSelect) return;
        const selectedOption = this.genreSelect.options[this.genreSelect.selectedIndex];
        if (selectedOption && selectedOption.value) {
            this.showTooltip(selectedOption.value, this.genreSelect);
        }
    }

    /**
     * Show tooltip with genre information
     * @param {string} genre - Genre value
     * @param {HTMLElement} target - Target element for positioning
     */
    showTooltip(genre, target) {
        if (!this.tooltip || !genre) return;

        const info = getGenreInfo(genre);
        if (!info) {
            this.hideTooltip();
            return;
        }

        // Build tooltip content
        let content = `<div style="font-weight: 600; color: #00d4aa; margin-bottom: 4px;">${this.formatGenreName(genre)}</div>`;
        content += `<div style="color: #a0a0a0; font-size: 0.7rem; margin-bottom: 4px;">BPM: ${info.bpmRange}</div>`;
        content += `<div style="margin-bottom: 4px;">${info.description}</div>`;
        
        if (info.characteristics && info.characteristics.length > 0) {
            content += `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #4a4a4a;">`;
            content += `<div style="font-size: 0.7rem; color: #a0a0a0;">Characteristics:</div>`;
            content += `<div style="font-size: 0.7rem; margin-top: 2px;">${info.characteristics.join(' • ')}</div>`;
            content += `</div>`;
        }

        this.tooltip.innerHTML = content;
        this.tooltip.style.display = 'block';

        // Position tooltip
        this.positionTooltip(target);
    }

    /**
     * Position tooltip relative to target
     * @param {HTMLElement} target - Target element
     * @private
     */
    positionTooltip(target) {
        if (!this.tooltip || !target) return;

        const rect = target.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        // Position to the right of the select
        let left = rect.right + 10;
        let top = rect.top;

        // Adjust if tooltip would go off screen
        if (left + tooltipRect.width > window.innerWidth) {
            left = rect.left - tooltipRect.width - 10;
        }

        if (top + tooltipRect.height > window.innerHeight) {
            top = window.innerHeight - tooltipRect.height - 10;
        }

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }

    /**
     * Format genre name for display
     * @param {string} genre - Genre value
     * @returns {string} Formatted name
     * @private
     */
    formatGenreName(genre) {
        if (!genre) return '';
        return genre
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Update tooltip for option elements (for future enhancement with custom dropdown)
     * @param {HTMLElement} option - Option element
     */
    showTooltipForOptionElement(option) {
        if (option && option.value) {
            this.showTooltip(option.value, option);
        }
    }

    /**
     * Cleanup tooltip
     */
    destroy() {
        if (this.tooltip && this.tooltip.parentElement) {
            this.tooltip.parentElement.removeChild(this.tooltip);
        }
        this.tooltip = null;
    }
}

