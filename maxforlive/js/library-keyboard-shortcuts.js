/**
 * Library Tab Keyboard Shortcuts System
 * 
 * Comprehensive keyboard shortcuts for library tab navigation and actions.
 */

export class LibraryKeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.showHelpOnPress = false;
        this.setupShortcuts();
    }

    /**
     * Setup keyboard shortcuts
     */
    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle if Library tab is active
            const libraryTab = document.getElementById('tab-section-library');
            if (!libraryTab || !libraryTab.classList.contains('active')) return;
            
            // Don't interfere with text input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Allow some shortcuts even in input
                if (e.key === 'Escape') {
                    e.target.blur();
                }
                return;
            }
            
            const combo = this.getKeyCombo(e);
            const handler = this.shortcuts.get(combo);
            
            if (handler) {
                e.preventDefault();
                e.stopPropagation();
                handler(e);
            }
            
            // Show help with ?
            if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                this.toggleHelp();
            }
        });
        
        this.registerDefaultShortcuts();
    }

    /**
     * Register default shortcuts
     */
    registerDefaultShortcuts() {
        // Navigation
        this.register('ArrowUp', () => {
            if (window.mediaItemInteraction) {
                window.mediaItemInteraction.navigate(-1);
            }
        }, 'Navigate up');
        
        this.register('ArrowDown', () => {
            if (window.mediaItemInteraction) {
                window.mediaItemInteraction.navigate(1);
            }
        }, 'Navigate down');
        
        // Actions
        this.register('Enter', () => {
            if (window.mediaItemInteraction) {
                const selected = window.mediaItemInteraction.getSelectedItem();
                if (selected) {
                    window.mediaItemInteraction.loadMedia(selected);
                }
            }
        }, 'Load selected media');
        
        this.register('Space', (e) => {
            e.preventDefault();
            // Toggle preview play
            if (window.mediaItemInteraction) {
                const selected = window.mediaItemInteraction.getSelectedItem();
                if (selected) {
                    window.mediaItemInteraction.previewMedia(selected);
                }
            }
        }, 'Preview selected media');
        
        // Favorites
        this.register('f', () => {
            const selected = window.mediaItemInteraction?.getSelectedItem();
            if (selected && window.favoritesCollections) {
                window.favoritesCollections.toggleFavorite(selected);
            }
        }, 'Toggle favorite');
        
        // Search
        this.register('/', () => {
            const searchInput = document.getElementById('media-search');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }, 'Focus search');
        
        // History navigation
        this.register('alt+ArrowLeft', () => {
            if (window.mediaLoader) {
                window.mediaLoader.navigateBack();
            }
        }, 'Previous media (Alt+Left)');
        
        this.register('alt+ArrowRight', () => {
            if (window.mediaLoader) {
                window.mediaLoader.navigateForward();
            }
        }, 'Next media (Alt+Right)');
        
        // Random
        this.register('r', () => {
            if (window.mediaKeyboardNavigation) {
                window.mediaKeyboardNavigation.loadRandomMedia();
            }
        }, 'Load random media');
        
        // Escape to deselect
        this.register('Escape', () => {
            if (window.mediaItemInteraction) {
                window.mediaItemInteraction.deselectItem();
            }
        }, 'Deselect item');
        
        // Delete/Backspace to remove from favorites (if selected item is favorite)
        this.register('Delete', () => {
            const selected = window.mediaItemInteraction?.getSelectedItem();
            if (selected && window.favoritesCollections) {
                if (window.favoritesCollections.isFavorite(selected)) {
                    window.favoritesCollections.removeFromFavorites(selected);
                }
            }
        }, 'Remove from favorites');
        
        this.register('Backspace', () => {
            const selected = window.mediaItemInteraction?.getSelectedItem();
            if (selected && window.favoritesCollections) {
                if (window.favoritesCollections.isFavorite(selected)) {
                    window.favoritesCollections.removeFromFavorites(selected);
                }
            }
        }, 'Remove from favorites');
    }

    /**
     * Register a keyboard shortcut
     * @param {string} key - Key combination (e.g., 'ArrowUp', 'ctrl+s', 'alt+ArrowLeft')
     * @param {Function} handler - Handler function
     * @param {string} description - Description for help panel
     */
    register(key, handler, description) {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
        this.shortcuts.set(normalizedKey, { handler, description, key });
    }

    /**
     * Get key combination string from event
     * @param {KeyboardEvent} e - Keyboard event
     * @returns {string} Key combination string
     */
    getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }

    /**
     * Toggle help panel
     */
    toggleHelp() {
        const helpPanel = document.getElementById('keyboard-shortcuts-help');
        if (helpPanel) {
            helpPanel.remove();
        } else {
            this.showHelp();
        }
    }

    /**
     * Show keyboard shortcuts help panel
     */
    showHelp() {
        const panel = document.createElement('div');
        panel.id = 'keyboard-shortcuts-help';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid var(--border-color, #444);
            border-radius: 8px;
            padding: 20px;
            z-index: 10004;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        `;
        
        const shortcuts = Array.from(this.shortcuts.values())
            .sort((a, b) => {
                // Sort by key complexity (simple keys first)
                const aParts = a.key.split('+').length;
                const bParts = b.key.split('+').length;
                if (aParts !== bParts) return aParts - bParts;
                return a.key.localeCompare(b.key);
            });
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--border-color, #444); padding-bottom: 10px;">
                <h3 style="color: var(--text-primary, #fff); margin: 0; font-size: 18px;">Keyboard Shortcuts</h3>
                <button id="close-help" style="background: var(--bg-hover, #333); border: 1px solid var(--border-color, #444); color: var(--text-primary, #fff); padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 14px;">×</button>
            </div>
            <div style="color: var(--text-secondary, #aaa); font-size: 13px;">
                ${shortcuts.map(s => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-light, #2a2a2a); align-items: center;">
                        <kbd style="background: var(--bg-panel, #2a2a2a); padding: 4px 8px; border-radius: 4px; color: var(--text-primary, #fff); font-family: 'JetBrains Mono', monospace; font-size: 11px; border: 1px solid var(--border-color, #444);">${this.formatKeyDisplay(s.key)}</kbd>
                        <span style="color: var(--text-secondary, #ccc); margin-left: 15px; text-align: right;">${s.description}</span>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--border-color, #444); color: var(--text-tertiary, #666); font-size: 11px; text-align: center;">
                Press <kbd style="background: var(--bg-panel, #2a2a2a); padding: 2px 6px; border-radius: 3px; border: 1px solid var(--border-color, #444);">?</kbd> to toggle this help
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Close button handler
        document.getElementById('close-help').addEventListener('click', () => {
            panel.remove();
        });
        
        // Close on click outside
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                panel.remove();
            }
        });
        
        // Close on Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                panel.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Format key for display
     * @param {string} key - Key combination
     * @returns {string} Formatted key string
     */
    formatKeyDisplay(key) {
        return key
            .split('+')
            .map(k => {
                // Capitalize first letter of each part
                if (k.length > 1) {
                    return k.charAt(0).toUpperCase() + k.slice(1);
                }
                return k.toUpperCase();
            })
            .join(' + ')
            .replace(/Arrow/g, '→')
            .replace(/ArrowUp/g, '↑')
            .replace(/ArrowDown/g, '↓')
            .replace(/ArrowLeft/g, '←')
            .replace(/ArrowRight/g, '→');
    }

    /**
     * Unregister a shortcut
     * @param {string} key - Key combination
     */
    unregister(key) {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
        this.shortcuts.delete(normalizedKey);
    }

    /**
     * Get all registered shortcuts
     * @returns {Array} Array of shortcut objects
     */
    getShortcuts() {
        return Array.from(this.shortcuts.values());
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.LibraryKeyboardShortcuts = LibraryKeyboardShortcuts;
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = LibraryKeyboardShortcuts;
}

