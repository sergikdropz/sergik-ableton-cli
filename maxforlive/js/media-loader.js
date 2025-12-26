/**
 * MediaLoader Class
 * 
 * Handles loading media into editors, managing media history, and caching.
 */

export class MediaLoader {
    constructor() {
        this.currentMedia = null;
        this.mediaHistory = [];
        this.historyIndex = -1;
        this.loadedMedia = new Map(); // Cache loaded media
        this.mediaCache = new Map(); // Media data cache
        this.maxCacheSize = 100;
        this.maxHistorySize = 50;
        this.preloadQueue = [];
        this.isPreloading = false;
    }

    /**
     * Load media into editor
     * @param {string} mediaId - Media ID
     * @param {string} editorType - Editor type ('auto', 'waveform', 'piano-roll')
     * @returns {Promise<Object>} Loaded media data
     */
    async loadMediaIntoEditor(mediaId, editorType = 'auto') {
        try {
            // Check cache first
            if (this.mediaCache.has(mediaId)) {
                const cached = this.mediaCache.get(mediaId);
                this._updateMediaItemState(mediaId, 'loaded');
                this._addToHistory(mediaId);
                this.currentMedia = mediaId;
                return cached;
            }

            // Update state to loading
            this._updateMediaItemState(mediaId, 'loading');

            // Fetch media data
            const mediaData = await this.fetchMediaData(mediaId);

            // Determine editor type if auto
            if (editorType === 'auto') {
                editorType = this._determineEditorType(mediaData);
            }

            // Load into appropriate editor
            await this._loadIntoEditor(mediaData, editorType);

            // Update state
            this._updateMediaItemState(mediaId, 'loaded');
            this._addToHistory(mediaId);
            this.currentMedia = mediaId;

            // Cache media data
            this._cacheMediaData(mediaId, mediaData);

            return mediaData;
        } catch (error) {
            this._updateMediaItemState(mediaId, 'error');
            console.error("Failed to load media:", error);
            throw error;
        }
    }

    /**
     * Preload media in background
     * @param {string} mediaId - Media ID to preload
     */
    async preloadMedia(mediaId) {
        if (this.mediaCache.has(mediaId)) {
            return; // Already cached
        }

        // Add to preload queue
        this.preloadQueue.push(mediaId);

        // Process queue if not already processing
        if (!this.isPreloading) {
            this._processPreloadQueue();
        }
    }

    /**
     * Process preload queue
     */
    async _processPreloadQueue() {
        if (this.isPreloading || this.preloadQueue.length === 0) {
            return;
        }

        this.isPreloading = true;

        while (this.preloadQueue.length > 0) {
            const mediaId = this.preloadQueue.shift();
            
            try {
                // Only fetch metadata, don't load into editor
                const mediaData = await this.fetchMediaData(mediaId);
                this._cacheMediaData(mediaId, mediaData);
            } catch (error) {
                console.warn(`Failed to preload media ${mediaId}:`, error);
            }

            // Small delay to avoid blocking
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        this.isPreloading = false;
    }

    /**
     * Fetch media data
     * @param {string|Object} media - Media ID or media object
     * @returns {Promise<Object>} Media data
     */
    async fetchMediaData(media) {
        const mediaId = typeof media === 'string' ? media : media.id;

        // Check cache
        if (this.mediaCache.has(mediaId)) {
            return this.mediaCache.get(mediaId);
        }

        // Get media object if only ID provided
        const mediaObj = typeof media === 'string' 
            ? this.getMediaById(mediaId) 
            : media;

        if (!mediaObj) {
            throw new Error(`Media not found: ${mediaId}`);
        }

        // Fetch from API or extract from DOM
        const mediaData = {
            id: mediaId,
            name: mediaObj.name || mediaObj.getAttribute('data-media-name') || '',
            path: mediaObj.path || mediaObj.getAttribute('data-media-path') || '',
            type: mediaObj.type || mediaObj.getAttribute('data-media-type') || 'audio',
            bpm: this._parseFloat(mediaObj.bpm || mediaObj.getAttribute('data-bpm')),
            key: mediaObj.key || mediaObj.getAttribute('data-key') || null,
            duration: this._parseFloat(mediaObj.duration || mediaObj.getAttribute('data-duration')),
            sample_rate: this._parseInt(mediaObj.sample_rate || mediaObj.getAttribute('data-sample-rate'))
        };

        // Cache it
        this._cacheMediaData(mediaId, mediaData);

        return mediaData;
    }

    /**
     * Get media by ID from DOM
     * @param {string} mediaId - Media ID
     * @returns {HTMLElement|null} Media element
     */
    getMediaById(mediaId) {
        return document.querySelector(`[data-media-id="${mediaId}"]`);
    }

    /**
     * Parse duration string to seconds
     * @param {string} timeStr - Time string (e.g., "4:32", "120.5")
     * @returns {number} Duration in seconds
     */
    parseDuration(timeStr) {
        if (!timeStr) return 0;

        // Try parsing as number (seconds)
        const num = parseFloat(timeStr);
        if (!isNaN(num)) {
            return num;
        }

        // Try parsing as MM:SS or HH:MM:SS
        const parts = timeStr.split(':').map(p => parseFloat(p));
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }

        return 0;
    }

    /**
     * Update media item visual state
     * @param {string} mediaId - Media ID
     * @param {string} state - State ('selected', 'loaded', 'playing', 'loading', 'error')
     */
    updateMediaItemState(mediaId, state) {
        this._updateMediaItemState(mediaId, state);
    }

    /**
     * Send command to Max device
     * @param {string} command - Command name
     * @param {...any} args - Command arguments
     */
    sendToMax(command, ...args) {
        // This would communicate with Max device
        // Implementation depends on Max communication mechanism
        if (typeof window.maxComms !== 'undefined' && window.maxComms.sendCommand) {
            window.maxComms.sendCommand(command, ...args);
        } else {
            console.log(`[Max] ${command}`, ...args);
        }
    }

    /**
     * Navigate media history backward
     */
    navigateBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const mediaId = this.mediaHistory[this.historyIndex];
            return this.loadMediaIntoEditor(mediaId);
        }
        return null;
    }

    /**
     * Navigate media history forward
     */
    navigateForward() {
        if (this.historyIndex < this.mediaHistory.length - 1) {
            this.historyIndex++;
            const mediaId = this.mediaHistory[this.historyIndex];
            return this.loadMediaIntoEditor(mediaId);
        }
        return null;
    }

    /**
     * Get current media
     * @returns {string|null} Current media ID
     */
    getCurrentMedia() {
        return this.currentMedia;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.mediaCache.clear();
        this.loadedMedia.clear();
    }

    // Private methods

    _updateMediaItemState(mediaId, state) {
        const element = this.getMediaById(mediaId);
        if (!element) return;

        // Remove all state classes
        element.classList.remove('selected', 'loaded', 'playing', 'loading', 'error');

        // Add new state class
        if (state) {
            element.classList.add(state);
        }
    }

    _addToHistory(mediaId) {
        // Remove if already in history
        const index = this.mediaHistory.indexOf(mediaId);
        if (index !== -1) {
            this.mediaHistory.splice(index, 1);
        }

        // Add to end
        this.mediaHistory.push(mediaId);

        // Limit size
        if (this.mediaHistory.length > this.maxHistorySize) {
            this.mediaHistory.shift();
        }

        // Update index
        this.historyIndex = this.mediaHistory.length - 1;
    }

    _cacheMediaData(mediaId, data) {
        // LRU cache: remove oldest if at limit
        if (this.mediaCache.size >= this.maxCacheSize) {
            const firstKey = this.mediaCache.keys().next().value;
            this.mediaCache.delete(firstKey);
        }

        this.mediaCache.set(mediaId, data);
    }

    _determineEditorType(mediaData) {
        const type = (mediaData.type || '').toLowerCase();
        if (type === 'midi') {
            return 'piano-roll';
        }
        return 'waveform';
    }

    async _loadIntoEditor(mediaData, editorType) {
        // This would integrate with the actual editor components
        // For now, just dispatch an event
        const event = new CustomEvent('mediaLoaded', {
            detail: {
                media: mediaData,
                editorType: editorType
            }
        });
        document.dispatchEvent(event);
    }

    _parseFloat(value) {
        if (value === null || value === undefined) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    }

    _parseInt(value) {
        if (value === null || value === undefined) return null;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.MediaLoader = MediaLoader;
    window.mediaLoader = new MediaLoader();
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = MediaLoader;
}

