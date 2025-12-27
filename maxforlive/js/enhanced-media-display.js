/**
 * Enhanced Media Display Class
 * 
 * Provides rich metadata visualization, hover previews, and status indicators for media items.
 */

export class EnhancedMediaDisplay {
    constructor() {
        this.currentPreview = null;
        this.previewTimeout = null;
        // Setup enhanced rendering immediately to override BrowserList prototype
        // This must happen before BrowserList creates any items
        this.setupEnhancedRendering();
        this.setupHoverPreview();
    }

    /**
     * Setup enhanced rendering by extending BrowserList
     */
    setupEnhancedRendering() {
        // Override BrowserList createItemElement to add metadata badges
        // This must happen before BrowserList is instantiated or used
        const BrowserListClass = typeof BrowserList !== 'undefined' ? BrowserList : window.BrowserList;
        
        if (BrowserListClass) {
            // Only override if not already overridden
            if (!BrowserListClass.prototype.createItemElement._enhanced) {
                const originalCreateItem = BrowserListClass.prototype.createItemElement;
                const self = this;
                
                BrowserListClass.prototype.createItemElement = function(item, index) {
                    const element = originalCreateItem.call(this, item, index);
                    // Only enhance if not already enhanced
                    if (!element.hasAttribute('data-enhanced')) {
                        self.enhanceMediaItem(element, item);
                    }
                    return element;
                };
                
                // Mark as enhanced to prevent multiple overrides
                BrowserListClass.prototype.createItemElement._enhanced = true;
                console.log('[EnhancedMediaDisplay] BrowserList prototype override applied');
            }
        } else {
            // BrowserList not loaded yet, try again when it's available
            setTimeout(() => {
                const BrowserListClass = typeof BrowserList !== 'undefined' ? BrowserList : window.BrowserList;
                if (BrowserListClass) {
                    this.setupEnhancedRendering();
                }
            }, 100);
        }
    }

    /**
     * Enhance media item with metadata badges and status indicators
     * @param {HTMLElement} element - Media item element
     * @param {Object} item - Item data
     */
    enhanceMediaItem(element, item) {
        // Skip if already enhanced
        if (element.hasAttribute('data-enhanced')) {
            return;
        }
        element.setAttribute('data-enhanced', 'true');
        
        // Find or create item content container
        let itemContent = element.querySelector('.item-name')?.parentElement;
        if (!itemContent || itemContent === element) {
            itemContent = element;
        }
        
        // Ensure proper structure
        let wrapper = itemContent.querySelector('.item-content-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'item-content-wrapper';
            wrapper.style.cssText = 'display: flex; flex-direction: column; padding: 8px; width: 100%;';
            
            // Move existing content into wrapper
            while (itemContent.firstChild) {
                wrapper.appendChild(itemContent.firstChild);
            }
            itemContent.appendChild(wrapper);
        }
        itemContent = wrapper;
        
        // Add metadata badges
        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'metadata-badges';
        badgesContainer.style.cssText = `
            display: flex;
            gap: 6px;
            margin-top: 4px;
            flex-wrap: wrap;
        `;
        
        // BPM badge
        if (item.bpm) {
            const bpmBadge = this.createBadge('BPM', item.bpm, '#4CAF50');
            badgesContainer.appendChild(bpmBadge);
        }
        
        // Key badge
        if (item.key) {
            const keyBadge = this.createBadge('KEY', item.key, '#2196F3');
            badgesContainer.appendChild(keyBadge);
        }
        
        // Duration badge
        if (item.duration) {
            const duration = this.formatDuration(item.duration);
            const durationBadge = this.createBadge('DUR', duration, '#FF9800');
            badgesContainer.appendChild(durationBadge);
        }
        
        // Type badge
        if (item.type) {
            const typeBadge = this.createBadge('TYPE', item.type.toUpperCase(), '#9C27B0');
            badgesContainer.appendChild(typeBadge);
        }
        
        // Status indicators
        const statusContainer = document.createElement('div');
        statusContainer.className = 'status-indicators';
        statusContainer.style.cssText = 'display: flex; gap: 4px; margin-left: auto;';
        
        // Check if item is favorite (from favoritesCollections if available)
        const mediaId = item.id || item.path || element.getAttribute('data-media-id');
        const isFavorite = item.isFavorite || 
                          (window.favoritesCollections && window.favoritesCollections.isFavorite(mediaId));
        
        if (item.isLoaded) {
            statusContainer.appendChild(this.createStatusIcon('loaded', '✓', '#4CAF50'));
        }
        if (item.isPlaying) {
            statusContainer.appendChild(this.createStatusIcon('playing', '▶', '#F44336'));
        }
        if (isFavorite) {
            statusContainer.appendChild(this.createStatusIcon('favorite', '★', '#FFD700'));
            element.setAttribute('data-favorite', 'true');
        }
        
        // Create metadata row
        const metaRow = document.createElement('div');
        metaRow.className = 'metadata-row';
        metaRow.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            margin-top: 4px;
        `;
        metaRow.appendChild(badgesContainer);
        if (statusContainer.children.length > 0) {
            metaRow.appendChild(statusContainer);
        }
        
        itemContent.appendChild(metaRow);
    }

    /**
     * Create metadata badge
     * @param {string} label - Badge label
     * @param {string|number} value - Badge value
     * @param {string} color - Badge color
     * @returns {HTMLElement} Badge element
     */
    createBadge(label, value, color) {
        const badge = document.createElement('span');
        badge.className = 'metadata-badge';
        badge.setAttribute('data-badge-type', label.toLowerCase());
        badge.style.cssText = `
            background: ${color}20;
            color: ${color};
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            border: 1px solid ${color}40;
            white-space: nowrap;
        `;
        badge.textContent = `${label}: ${value}`;
        return badge;
    }

    /**
     * Create status icon
     * @param {string} type - Icon type
     * @param {string} icon - Icon character
     * @param {string} color - Icon color
     * @returns {HTMLElement} Icon element
     */
    createStatusIcon(type, icon, color) {
        const iconEl = document.createElement('span');
        iconEl.className = `status-icon ${type}`;
        iconEl.setAttribute('data-status-type', type);
        iconEl.textContent = icon;
        iconEl.style.cssText = `
            color: ${color};
            font-size: 12px;
            cursor: pointer;
            display: inline-block;
        `;
        return iconEl;
    }

    /**
     * Format duration in seconds to readable string
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0s';
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Setup hover preview functionality
     */
    setupHoverPreview() {
        document.addEventListener('mouseenter', (e) => {
            const item = e.target.closest('.browser-item[data-media-id]');
            if (!item) return;
            
            clearTimeout(this.previewTimeout);
            this.previewTimeout = setTimeout(() => {
                this.showHoverPreview(item, e);
            }, 500); // Show after 500ms hover
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            const item = e.target.closest('.browser-item[data-media-id]');
            if (!item) return;
            
            clearTimeout(this.previewTimeout);
            this.hideHoverPreview();
        }, true);
    }

    /**
     * Show hover preview for media item
     * @param {HTMLElement} item - Media item element
     * @param {MouseEvent} event - Mouse event
     */
    showHoverPreview(item, event) {
        this.hideHoverPreview();
        
        const mediaId = item.getAttribute('data-media-id');
        const mediaType = item.getAttribute('data-media-type');
        const mediaName = item.querySelector('.item-name')?.textContent || 'Unknown';
        const mediaBpm = item.getAttribute('data-bpm');
        const mediaKey = item.getAttribute('data-key');
        const mediaDuration = item.getAttribute('data-duration');
        const mediaPath = item.getAttribute('data-media-path');
        
        const preview = document.createElement('div');
        preview.id = 'hover-preview';
        preview.className = 'hover-preview';
        preview.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid var(--border-color, #444);
            border-radius: 8px;
            padding: 15px;
            z-index: 10003;
            max-width: 300px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
            pointer-events: none;
        `;
        
        // Build preview content
        let previewHTML = `
            <div style="margin-bottom: 10px;">
                <strong style="color: var(--text-primary, #fff); font-size: 14px;">${mediaName}</strong>
            </div>
            <div style="color: var(--text-secondary, #aaa); font-size: 12px; line-height: 1.6;">
        `;
        
        if (mediaBpm) previewHTML += `<div>BPM: ${mediaBpm}</div>`;
        if (mediaKey) previewHTML += `<div>Key: ${mediaKey}</div>`;
        if (mediaDuration) previewHTML += `<div>Duration: ${this.formatDuration(parseFloat(mediaDuration))}</div>`;
        if (mediaType) previewHTML += `<div>Type: ${mediaType}</div>`;
        if (mediaPath) {
            previewHTML += `<div style="margin-top: 8px; color: var(--text-tertiary, #666); font-size: 11px; word-break: break-all;">${mediaPath}</div>`;
        }
        
        previewHTML += '</div>';
        preview.innerHTML = previewHTML;
        
        document.body.appendChild(preview);
        this.currentPreview = preview;
        
        // Position preview
        const rect = item.getBoundingClientRect();
        preview.style.left = `${rect.right + 10}px`;
        preview.style.top = `${rect.top}px`;
        
        // Adjust if off-screen
        setTimeout(() => {
            const previewRect = preview.getBoundingClientRect();
            if (previewRect.right > window.innerWidth) {
                preview.style.left = `${rect.left - previewRect.width - 10}px`;
            }
            if (previewRect.bottom > window.innerHeight) {
                preview.style.top = `${window.innerHeight - previewRect.height - 10}px`;
            }
            if (previewRect.left < 0) {
                preview.style.left = '10px';
            }
            if (previewRect.top < 0) {
                preview.style.top = '10px';
            }
        }, 0);
        
        // Try to load additional metadata if available
        if (window.mediaLoader && mediaId) {
            window.mediaLoader.fetchMediaData(mediaId).then(data => {
                if (preview && preview.parentElement) {
                    const metadataDiv = preview.querySelector('div[style*="line-height"]');
                    if (metadataDiv && data) {
                        let metadataHTML = '';
                        if (data.bpm) metadataHTML += `<div>BPM: ${data.bpm}</div>`;
                        if (data.key) metadataHTML += `<div>Key: ${data.key}</div>`;
                        if (data.duration) metadataHTML += `<div>Duration: ${this.formatDuration(data.duration)}</div>`;
                        if (data.type) metadataHTML += `<div>Type: ${data.type}</div>`;
                        if (data.sample_rate) metadataHTML += `<div>Sample Rate: ${data.sample_rate} Hz</div>`;
                        if (metadataHTML) {
                            metadataDiv.innerHTML = metadataHTML;
                        }
                    }
                }
            }).catch(err => {
                // Silently fail - preview already has basic info
            });
        }
    }

    /**
     * Hide hover preview
     */
    hideHoverPreview() {
        if (this.currentPreview) {
            this.currentPreview.remove();
            this.currentPreview = null;
        }
        const preview = document.getElementById('hover-preview');
        if (preview) {
            preview.remove();
        }
    }

    /**
     * Update media item status
     * @param {string} mediaId - Media ID
     * @param {string} status - Status type (loaded, playing, favorite)
     * @param {boolean} active - Whether status is active
     */
    updateItemStatus(mediaId, status, active) {
        const item = document.querySelector(`[data-media-id="${mediaId}"]`);
        if (!item) return;
        
        const statusContainer = item.querySelector('.status-indicators');
        if (!statusContainer) return;
        
        let statusIcon = statusContainer.querySelector(`[data-status-type="${status}"]`);
        
        if (active) {
            if (!statusIcon) {
                const colors = {
                    loaded: '#4CAF50',
                    playing: '#F44336',
                    favorite: '#FFD700'
                };
                const icons = {
                    loaded: '✓',
                    playing: '▶',
                    favorite: '★'
                };
                statusIcon = this.createStatusIcon(status, icons[status], colors[status]);
                statusContainer.appendChild(statusIcon);
            }
        } else {
            if (statusIcon) {
                statusIcon.remove();
            }
        }
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.EnhancedMediaDisplay = EnhancedMediaDisplay;
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = EnhancedMediaDisplay;
}

