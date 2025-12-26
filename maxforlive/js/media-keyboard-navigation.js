/**
 * MediaKeyboardNavigation Class
 * 
 * Handles keyboard navigation within the media items list.
 */

export class MediaKeyboardNavigation {
    constructor() {
        this.mediaItems = [];
        this.currentIndex = -1;
        this.setupEventListeners();
    }

    /**
     * Setup keyboard event listeners
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere with text input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Check if media list is focused or visible
            const mediaList = document.getElementById('media-list');
            if (!mediaList || !this.isMediaListActive()) {
                return;
            }

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigatePrevious();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.loadSelected();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.deselect();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.navigateToFirst();
                    break;
                case 'End':
                    e.preventDefault();
                    this.navigateToLast();
                    break;
                case 'PageDown':
                    e.preventDefault();
                    this.navigatePageDown();
                    break;
                case 'PageUp':
                    e.preventDefault();
                    this.navigatePageUp();
                    break;
            }

            // History navigation (Cmd/Ctrl + Left/Right)
            if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.loadPreviousMedia();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') {
                e.preventDefault();
                this.loadNextMedia();
            }

            // Random selection (Cmd/Ctrl + R)
            if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
                e.preventDefault();
                this.loadRandomMedia();
            }
        });

        // Update media items list when DOM changes
        const observer = new MutationObserver(() => {
            this.updateMediaItemsList();
        });

        const mediaList = document.getElementById('media-list');
        if (mediaList) {
            observer.observe(mediaList, {
                childList: true,
                subtree: true
            });
        }

        // Initial update
        this.updateMediaItemsList();
    }

    /**
     * Check if media list is active/focused
     * @returns {boolean} True if media list should receive keyboard input
     */
    isMediaListActive() {
        const activeElement = document.activeElement;
        const mediaList = document.getElementById('media-list');
        
        // Check if media list or its children are focused
        if (mediaList && mediaList.contains(activeElement)) {
            return true;
        }

        // Check if no input is focused (media list can receive focus)
        if (activeElement === document.body || activeElement === document.documentElement) {
            return true;
        }

        return false;
    }

    /**
     * Update media items list from DOM
     */
    updateMediaItemsList() {
        const mediaList = document.getElementById('media-list');
        if (!mediaList) {
            this.mediaItems = [];
            return;
        }

        this.mediaItems = Array.from(
            mediaList.querySelectorAll('.browser-item[data-media-id]')
        );

        // Ensure current index is valid
        if (this.currentIndex >= this.mediaItems.length) {
            this.currentIndex = this.mediaItems.length - 1;
        }
        if (this.currentIndex < 0 && this.mediaItems.length > 0) {
            this.currentIndex = 0;
        }
    }

    /**
     * Navigate to next item
     */
    navigateNext() {
        if (this.mediaItems.length === 0) return;

        this.currentIndex = (this.currentIndex + 1) % this.mediaItems.length;
        this.updateSelection();
    }

    /**
     * Navigate to previous item
     */
    navigatePrevious() {
        if (this.mediaItems.length === 0) return;

        this.currentIndex = this.currentIndex <= 0 
            ? this.mediaItems.length - 1 
            : this.currentIndex - 1;
        this.updateSelection();
    }

    /**
     * Navigate to first item
     */
    navigateToFirst() {
        if (this.mediaItems.length === 0) return;

        this.currentIndex = 0;
        this.updateSelection();
    }

    /**
     * Navigate to last item
     */
    navigateToLast() {
        if (this.mediaItems.length === 0) return;

        this.currentIndex = this.mediaItems.length - 1;
        this.updateSelection();
    }

    /**
     * Navigate one page down
     */
    navigatePageDown() {
        if (this.mediaItems.length === 0) return;

        const pageSize = 10; // Items per page
        this.currentIndex = Math.min(
            this.currentIndex + pageSize,
            this.mediaItems.length - 1
        );
        this.updateSelection();
    }

    /**
     * Navigate one page up
     */
    navigatePageUp() {
        if (this.mediaItems.length === 0) return;

        const pageSize = 10; // Items per page
        this.currentIndex = Math.max(
            this.currentIndex - pageSize,
            0
        );
        this.updateSelection();
    }

    /**
     * Update visual selection
     */
    updateSelection() {
        if (this.currentIndex < 0 || this.currentIndex >= this.mediaItems.length) {
            return;
        }

        const item = this.mediaItems[this.currentIndex];
        const mediaId = item.getAttribute('data-media-id');

        // Use MediaItemInteraction to select
        if (window.mediaItemInteraction) {
            window.mediaItemInteraction.selectItem(mediaId, item);
        } else {
            // Fallback: direct selection
            item.classList.add('selected');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Load currently selected item
     */
    loadSelected() {
        if (this.currentIndex < 0 || this.currentIndex >= this.mediaItems.length) {
            return;
        }

        const item = this.mediaItems[this.currentIndex];
        const mediaId = item.getAttribute('data-media-id');

        if (window.mediaItemInteraction) {
            window.mediaItemInteraction.loadMedia(mediaId);
        }
    }

    /**
     * Preview currently selected item
     */
    previewSelected() {
        if (this.currentIndex < 0 || this.currentIndex >= this.mediaItems.length) {
            return;
        }

        const item = this.mediaItems[this.currentIndex];
        const mediaId = item.getAttribute('data-media-id');

        if (window.mediaItemInteraction) {
            window.mediaItemInteraction.previewMedia(mediaId);
        }
    }

    /**
     * Deselect current item
     */
    deselect() {
        if (window.mediaItemInteraction) {
            window.mediaItemInteraction.deselectItem();
        }
        this.currentIndex = -1;
    }

    /**
     * Load previous media from history
     */
    loadPreviousMedia() {
        const mediaLoader = window.mediaLoader;
        if (!mediaLoader) return;

        const previous = mediaLoader.navigateBack();
        if (previous) {
            // Find and select the media item
            this.updateMediaItemsList();
            const mediaId = mediaLoader.getCurrentMedia();
            if (mediaId) {
                const index = this.mediaItems.findIndex(
                    item => item.getAttribute('data-media-id') === mediaId
                );
                if (index !== -1) {
                    this.currentIndex = index;
                    this.updateSelection();
                }
            }
        }
    }

    /**
     * Load next media from history
     */
    loadNextMedia() {
        const mediaLoader = window.mediaLoader;
        if (!mediaLoader) return;

        const next = mediaLoader.navigateForward();
        if (next) {
            // Find and select the media item
            this.updateMediaItemsList();
            const mediaId = mediaLoader.getCurrentMedia();
            if (mediaId) {
                const index = this.mediaItems.findIndex(
                    item => item.getAttribute('data-media-id') === mediaId
                );
                if (index !== -1) {
                    this.currentIndex = index;
                    this.updateSelection();
                }
            }
        }
    }

    /**
     * Load random media
     */
    loadRandomMedia() {
        if (this.mediaItems.length === 0) return;

        const randomIndex = Math.floor(Math.random() * this.mediaItems.length);
        this.currentIndex = randomIndex;
        this.updateSelection();
        this.loadSelected();
    }

    /**
     * Get current index
     * @returns {number} Current index
     */
    getCurrentIndex() {
        return this.currentIndex;
    }

    /**
     * Get total count
     * @returns {number} Total item count
     */
    getTotalCount() {
        return this.mediaItems.length;
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.MediaKeyboardNavigation = MediaKeyboardNavigation;
    window.mediaKeyboardNavigation = new MediaKeyboardNavigation();
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = MediaKeyboardNavigation;
}

