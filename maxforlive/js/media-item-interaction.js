/**
 * MediaItemInteraction Class
 * 
 * Handles user interactions (clicks, double-clicks) with media items.
 */

export class MediaItemInteraction {
    constructor() {
        this.clickTimeout = null;
        this.selectedItem = null;
        this.doubleClickDelay = 300; // ms
        this.setupInteractions();
    }

    /**
     * Setup event listeners for media items
     */
    setupInteractions() {
        // Use event delegation for media items
        // Try to find BrowserList wrapper first, fallback to media-list container
        let eventTarget = document.querySelector('#media-list .browser-list-wrapper') || 
                         document.getElementById('media-list');
        if (!eventTarget) {
            console.warn('Media list element not found');
            return;
        }

        // Click handler (single or double)
        eventTarget.addEventListener('click', (e) => {
            const item = e.target.closest('.browser-item[data-media-id]');
            if (!item) return;

            const mediaId = item.getAttribute('data-media-id');
            
            // Handle double-click
            if (this.clickTimeout) {
                clearTimeout(this.clickTimeout);
                this.clickTimeout = null;
                this.handleDoubleClick(mediaId, item);
            } else {
                // Handle single-click (with delay to detect double-click)
                this.clickTimeout = setTimeout(() => {
                    this.handleSingleClick(mediaId, item);
                    this.clickTimeout = null;
                }, this.doubleClickDelay);
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return; // Don't interfere with text input
            }

            switch (e.key) {
                case 'Enter':
                    if (this.selectedItem) {
                        this.loadMedia(this.selectedItem);
                    }
                    break;
                case 'Escape':
                    this.deselectItem();
                    break;
            }
        });
    }

    /**
     * Handle single-click (select item)
     * @param {string} mediaId - Media ID
     * @param {HTMLElement} item - Media item element
     */
    handleSingleClick(mediaId, item) {
        this.selectItem(mediaId, item);
        this.previewMedia(mediaId);
    }

    /**
     * Handle double-click (load item)
     * @param {string} mediaId - Media ID
     * @param {HTMLElement} item - Media item element
     */
    handleDoubleClick(mediaId, item) {
        this.selectItem(mediaId, item);
        this.loadMedia(mediaId);
    }

    /**
     * Select media item
     * @param {string} mediaId - Media ID
     * @param {HTMLElement} item - Media item element (optional)
     */
    selectItem(mediaId, item = null) {
        // Deselect previous item
        if (this.selectedItem) {
            const prevItem = document.querySelector(`[data-media-id="${this.selectedItem}"]`);
            if (prevItem) {
                prevItem.classList.remove('selected');
            }
        }

        // Select new item
        if (!item) {
            item = document.querySelector(`[data-media-id="${mediaId}"]`);
        }

        if (item) {
            item.classList.add('selected');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            this.selectedItem = mediaId;

            // Dispatch event
            const event = new CustomEvent('mediaSelected', {
                detail: { mediaId: mediaId, element: item }
            });
            document.dispatchEvent(event);
        }
    }

    /**
     * Deselect current item
     */
    deselectItem() {
        if (this.selectedItem) {
            const item = document.querySelector(`[data-media-id="${this.selectedItem}"]`);
            if (item) {
                item.classList.remove('selected');
            }
            this.selectedItem = null;

            // Dispatch event
            const event = new CustomEvent('mediaDeselected');
            document.dispatchEvent(event);
        }
    }

    /**
     * Preview media (show preview without loading)
     * @param {string} mediaId - Media ID
     */
    previewMedia(mediaId) {
        // Get media data
        const mediaLoader = window.mediaLoader;
        if (!mediaLoader) return;

        // Fetch media data for preview
        mediaLoader.fetchMediaData(mediaId).then(mediaData => {
            // Dispatch preview event
            const event = new CustomEvent('mediaPreview', {
                detail: { media: mediaData }
            });
            document.dispatchEvent(event);
        }).catch(error => {
            console.warn('Failed to preview media:', error);
        });
    }

    /**
     * Load media into editor
     * @param {string} mediaId - Media ID
     */
    async loadMedia(mediaId) {
        const mediaLoader = window.mediaLoader;
        if (!mediaLoader) {
            console.error('MediaLoader not available');
            return;
        }

        try {
            // Update state to loading
            mediaLoader.updateMediaItemState(mediaId, 'loading');

            // Load into editor
            await mediaLoader.loadMediaIntoEditor(mediaId);

            // Dispatch event
            const event = new CustomEvent('mediaLoaded', {
                detail: { mediaId: mediaId }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Failed to load media:', error);
            mediaLoader.updateMediaItemState(mediaId, 'error');

            // Show error notification
            this.showError(`Failed to load media: ${error.message}`);
        }
    }

    /**
     * Get selected item
     * @returns {string|null} Selected media ID
     */
    getSelectedItem() {
        return this.selectedItem;
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     */
    showError(message) {
        // Create or update error notification
        let notification = document.getElementById('error-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'error-notification';
            notification.className = 'error-notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.MediaItemInteraction = MediaItemInteraction;
    window.mediaItemInteraction = new MediaItemInteraction();
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = MediaItemInteraction;
}

