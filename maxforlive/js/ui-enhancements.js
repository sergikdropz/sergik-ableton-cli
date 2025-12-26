/**
 * UIEnhancements Class
 * 
 * Advanced search UI, enhanced media display, and quick actions.
 */

export class UIEnhancements {
    constructor() {
        this.searchSuggestions = [];
        this.setupSearchEnhancements();
        this.setupMediaDisplay();
        this.setupQuickActions();
    }

    /**
     * Setup search UI enhancements
     */
    setupSearchEnhancements() {
        const searchInput = document.getElementById('media-search');
        if (!searchInput) {
            console.warn('Search input not found');
            return;
        }

        // Create suggestions dropdown
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'search-suggestions';
        suggestionsContainer.className = 'search-suggestions';
        suggestionsContainer.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 4px;
            margin-top: 4px;
            max-height: 300px;
            overflow-y: auto;
            display: none;
            z-index: 1000;
        `;

        // Wrap search input in container
        const searchContainer = searchInput.parentElement || document.body;
        if (!searchContainer.querySelector('.search-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'search-wrapper';
            wrapper.style.cssText = 'position: relative;';
            searchInput.parentNode.insertBefore(wrapper, searchInput);
            wrapper.appendChild(searchInput);
            wrapper.appendChild(suggestionsContainer);
        }

        // Setup input handlers
        let debounceTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimeout);
            const query = e.target.value;

            if (query.length < 2) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            debounceTimeout = setTimeout(() => {
                this.updateSuggestions(query, suggestionsContainer);
            }, 300);
        });

        searchInput.addEventListener('focus', () => {
            if (suggestionsContainer.children.length > 0) {
                suggestionsContainer.style.display = 'block';
            }
        });

        searchInput.addEventListener('blur', () => {
            // Delay to allow click on suggestion
            setTimeout(() => {
                suggestionsContainer.style.display = 'none';
            }, 200);
        });

        // Keyboard navigation in suggestions
        searchInput.addEventListener('keydown', (e) => {
            const suggestions = Array.from(suggestionsContainer.querySelectorAll('.suggestion-item'));
            const selected = suggestionsContainer.querySelector('.suggestion-item.selected');
            let selectedIndex = selected ? suggestions.indexOf(selected) : -1;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % suggestions.length;
                this.selectSuggestion(suggestions, selectedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = selectedIndex <= 0 ? suggestions.length - 1 : selectedIndex - 1;
                this.selectSuggestion(suggestions, selectedIndex);
            } else if (e.key === 'Enter' && selected) {
                e.preventDefault();
                selected.click();
            }
        });
    }

    /**
     * Update search suggestions
     * @param {string} query - Search query
     * @param {HTMLElement} container - Suggestions container
     */
    updateSuggestions(query, container) {
        container.innerHTML = '';

        // Get suggestions from SearchParser
        if (window.SearchParser && window.searchParser) {
            const parser = window.searchParser;
            const recentItems = parser.getRecentQueries().slice(0, 5);
            const suggestions = parser.getSuggestions(query, recentItems);

            if (suggestions.length === 0) {
                container.style.display = 'none';
                return;
            }

            suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.style.cssText = `
                    padding: 10px 15px;
                    cursor: pointer;
                    border-bottom: 1px solid #2a2a2a;
                `;
                item.textContent = suggestion.text;

                item.addEventListener('mouseenter', () => {
                    item.style.background = '#2a2a2a';
                });

                item.addEventListener('mouseleave', () => {
                    item.style.background = 'transparent';
                });

                item.addEventListener('click', () => {
                    const searchInput = document.getElementById('media-search');
                    if (searchInput) {
                        searchInput.value = suggestion.text;
                        searchInput.dispatchEvent(new Event('input'));
                        container.style.display = 'none';
                    }
                });

                container.appendChild(item);
            });

            container.style.display = 'block';
        }
    }

    /**
     * Select suggestion
     * @param {Array} suggestions - Suggestion elements
     * @param {number} index - Selected index
     */
    selectSuggestion(suggestions, index) {
        suggestions.forEach((item, i) => {
            if (i === index) {
                item.classList.add('selected');
                item.style.background = '#2a2a2a';
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
                item.style.background = 'transparent';
            }
        });
    }

    /**
     * Setup enhanced media display
     */
    setupMediaDisplay() {
        // Add metadata tooltips
        document.addEventListener('mouseover', (e) => {
            const item = e.target.closest('.browser-item[data-media-id]');
            if (!item) return;

            // Show tooltip on hover
            this.showMetadataTooltip(item, e);
        }, true);

        document.addEventListener('mouseout', (e) => {
            const item = e.target.closest('.browser-item[data-media-id]');
            if (!item) return;

            this.hideMetadataTooltip();
        }, true);
    }

    /**
     * Show metadata tooltip
     * @param {HTMLElement} item - Media item element
     * @param {MouseEvent} event - Mouse event
     */
    showMetadataTooltip(item, event) {
        // Remove existing tooltip
        this.hideMetadataTooltip();

        const mediaId = item.getAttribute('data-media-id');
        const bpm = item.getAttribute('data-bpm');
        const key = item.getAttribute('data-key');
        const duration = item.getAttribute('data-duration');
        const type = item.getAttribute('data-media-type');

        if (!bpm && !key && !duration) {
            return; // No metadata to show
        }

        const tooltip = document.createElement('div');
        tooltip.id = 'metadata-tooltip';
        tooltip.className = 'metadata-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10001;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;

        const metadata = [];
        if (bpm) metadata.push(`BPM: ${bpm}`);
        if (key) metadata.push(`Key: ${key}`);
        if (duration) metadata.push(`Duration: ${duration}s`);
        if (type) metadata.push(`Type: ${type}`);

        tooltip.innerHTML = metadata.join('<br>');
        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = item.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;

        // Adjust if off-screen
        setTimeout(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.right > window.innerWidth) {
                tooltip.style.left = `${rect.left - tooltipRect.width - 10}px`;
            }
            if (tooltipRect.bottom > window.innerHeight) {
                tooltip.style.top = `${window.innerHeight - tooltipRect.height - 10}px`;
            }
        }, 0);
    }

    /**
     * Hide metadata tooltip
     */
    hideMetadataTooltip() {
        const tooltip = document.getElementById('metadata-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * Setup quick actions menu
     */
    setupQuickActions() {
        // Add context menu to media items
        document.addEventListener('contextmenu', (e) => {
            const item = e.target.closest('.browser-item[data-media-id]');
            if (!item) return;

            e.preventDefault();
            this.showQuickActionsMenu(item, e);
        });

        // Close menu on click outside
        document.addEventListener('click', () => {
            this.hideQuickActionsMenu();
        });
    }

    /**
     * Show quick actions menu
     * @param {HTMLElement} item - Media item element
     * @param {MouseEvent} event - Mouse event
     */
    showQuickActionsMenu(item, event) {
        // Remove existing menu
        this.hideQuickActionsMenu();

        const menu = document.createElement('div');
        menu.id = 'quick-actions-menu';
        menu.className = 'quick-actions-menu';
        menu.style.cssText = `
            position: fixed;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 4px 0;
            z-index: 10002;
            min-width: 150px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;

        const actions = [
            { label: 'Load', action: 'load' },
            { label: 'Preview', action: 'preview' },
            { label: 'Add to Favorites', action: 'favorite' },
            { label: 'Copy Path', action: 'copy' }
        ];

        actions.forEach(action => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.textContent = action.label;
            menuItem.style.cssText = `
                padding: 8px 15px;
                cursor: pointer;
                font-size: 13px;
                color: #fff;
            `;

            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = '#2a2a2a';
            });

            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = 'transparent';
            });

            menuItem.addEventListener('click', () => {
                this.handleQuickAction(action.action, item);
                this.hideQuickActionsMenu();
            });

            menu.appendChild(menuItem);
        });

        document.body.appendChild(menu);

        // Position menu
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;

        // Adjust if off-screen
        setTimeout(() => {
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = `${window.innerWidth - rect.width - 10}px`;
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = `${window.innerHeight - rect.height - 10}px`;
            }
        }, 0);
    }

    /**
     * Hide quick actions menu
     */
    hideQuickActionsMenu() {
        const menu = document.getElementById('quick-actions-menu');
        if (menu) {
            menu.remove();
        }
    }

    /**
     * Handle quick action
     * @param {string} action - Action name
     * @param {HTMLElement} item - Media item element
     */
    handleQuickAction(action, item) {
        const mediaId = item.getAttribute('data-media-id');

        switch (action) {
            case 'load':
                if (window.mediaItemInteraction) {
                    window.mediaItemInteraction.loadMedia(mediaId);
                }
                break;
            case 'preview':
                if (window.mediaItemInteraction) {
                    window.mediaItemInteraction.previewMedia(mediaId);
                }
                break;
            case 'favorite':
                // Add to favorites
                if (window.stateManager) {
                    const favorites = window.stateManager.get('favorites') || [];
                    if (!favorites.includes(mediaId)) {
                        favorites.push(mediaId);
                        window.stateManager.set('favorites', favorites);
                        if (window.visualFeedback) {
                            window.visualFeedback.success('Added to favorites');
                        }
                    }
                }
                break;
            case 'copy':
                // Copy path to clipboard
                const path = item.getAttribute('data-media-path');
                if (path && navigator.clipboard) {
                    navigator.clipboard.writeText(path).then(() => {
                        if (window.visualFeedback) {
                            window.visualFeedback.success('Path copied to clipboard');
                        }
                    });
                }
                break;
        }
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.UIEnhancements = UIEnhancements;
    window.uiEnhancements = new UIEnhancements();
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = UIEnhancements;
}

