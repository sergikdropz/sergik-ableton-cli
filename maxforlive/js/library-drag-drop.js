/**
 * Library Drag & Drop Support
 * 
 * Enables drag and drop functionality for media items to load samples into tracks/devices.
 */

export class LibraryDragDrop {
    constructor() {
        this.draggedItem = null;
        this.dropZones = new Map();
        this.setupDragDrop();
    }

    /**
     * Setup drag and drop functionality
     */
    setupDragDrop() {
        // Make media items draggable
        document.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.browser-item[data-media-id]');
            if (!item) return;
            
            const mediaId = item.getAttribute('data-media-id');
            const mediaPath = item.getAttribute('data-media-path') || mediaId;
            const mediaType = item.getAttribute('data-media-type') || 'audio';
            const mediaName = item.querySelector('.item-name')?.textContent || 'Unknown';
            
            this.draggedItem = {
                mediaId,
                path: mediaPath,
                type: mediaType,
                name: mediaName
            };
            
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', mediaPath);
            e.dataTransfer.setData('application/json', JSON.stringify(this.draggedItem));
            
            // Visual feedback
            item.classList.add('dragging');
            
            // Create drag image
            const dragImage = item.cloneNode(true);
            dragImage.style.cssText = `
                position: absolute;
                top: -1000px;
                opacity: 0.8;
                pointer-events: none;
            `;
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        });
        
        document.addEventListener('dragend', (e) => {
            document.querySelectorAll('.dragging').forEach(el => {
                el.classList.remove('dragging');
            });
            this.draggedItem = null;
        });
        
        // Setup drop zones
        this.setupDropZones();
        
        // Listen for dynamically added drop zones
        this.observeDropZones();
    }

    /**
     * Setup drop zones for tracks and devices
     */
    setupDropZones() {
        // Track drop zones
        document.querySelectorAll('[data-drop-zone="track"]').forEach(zone => {
            this.registerDropZone(zone);
        });
        
        // Device drop zones
        document.querySelectorAll('[data-drop-zone="device"]').forEach(zone => {
            this.registerDropZone(zone);
        });
    }

    /**
     * Register a drop zone
     * @param {HTMLElement} zone - Drop zone element
     */
    registerDropZone(zone) {
        const zoneId = zone.getAttribute('data-zone-id') || `zone_${Date.now()}`;
        
        if (this.dropZones.has(zoneId)) {
            return; // Already registered
        }
        
        zone.setAttribute('data-zone-id', zoneId);
        zone.setAttribute('draggable', 'false');
        
        // Drag over handler
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            zone.classList.add('drop-target');
        });
        
        // Drag leave handler
        zone.addEventListener('dragleave', (e) => {
            // Only remove class if leaving the zone entirely
            if (!zone.contains(e.relatedTarget)) {
                zone.classList.remove('drop-target');
            }
        });
        
        // Drop handler
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('drop-target');
            
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                const zoneType = zone.getAttribute('data-drop-zone');
                
                if (zoneType === 'track') {
                    this.handleTrackDrop(zone, data);
                } else if (zoneType === 'device') {
                    this.handleDeviceDrop(zone, data);
                }
            } catch (err) {
                console.error('[LibraryDragDrop] Drop failed:', err);
                if (window.visualFeedback && window.visualFeedback.error) {
                    window.visualFeedback.error('Failed to load sample');
                }
            }
        });
        
        this.dropZones.set(zoneId, zone);
    }

    /**
     * Handle drop on track
     * @param {HTMLElement} zone - Drop zone element
     * @param {Object} data - Dragged item data
     */
    async handleTrackDrop(zone, data) {
        const trackIndex = parseInt(zone.getAttribute('data-track-index'));
        
        if (isNaN(trackIndex)) {
            console.warn('[LibraryDragDrop] Invalid track index');
            return;
        }
        
        // Try LibraryHandlers first, then fallback to direct API call
        if (window.libraryHandlers && window.libraryHandlers.loadSample) {
            try {
                await window.libraryHandlers.loadSample(trackIndex, data.path);
                
                if (window.visualFeedback && window.visualFeedback.success) {
                    window.visualFeedback.success(`Loaded ${data.name} into track ${trackIndex + 1}`);
                }
            } catch (err) {
                console.error('[LibraryDragDrop] Load sample failed:', err);
                if (window.visualFeedback && window.visualFeedback.error) {
                    window.visualFeedback.error(`Failed to load sample: ${err.message}`);
                }
            }
        } else {
            // Fallback: direct API call
            try {
                const apiBaseUrl = window.API_BASE_URL || 'http://127.0.0.1:8000';
                const response = await fetch(`${apiBaseUrl}/live/browser/load`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        track_index: trackIndex,
                        item_path: data.path || data.mediaId
                    })
                });
                
                if (response.ok) {
                    if (window.visualFeedback && window.visualFeedback.success) {
                        window.visualFeedback.success(`Loaded ${data.name} into track ${trackIndex + 1}`);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (err) {
                console.error('[LibraryDragDrop] Load sample failed:', err);
                if (window.visualFeedback && window.visualFeedback.error) {
                    window.visualFeedback.error(`Failed to load sample: ${err.message}`);
                }
            }
        }
    }

    /**
     * Handle drop on device
     * @param {HTMLElement} zone - Drop zone element
     * @param {Object} data - Dragged item data
     */
    async handleDeviceDrop(zone, data) {
        const trackIndex = parseInt(zone.getAttribute('data-track-index'));
        const deviceIndex = parseInt(zone.getAttribute('data-device-index'));
        
        if (isNaN(trackIndex) || isNaN(deviceIndex)) {
            console.warn('[LibraryDragDrop] Invalid track or device index');
            return;
        }
        
        // Try LibraryHandlers first, then fallback to direct API call
        if (window.libraryHandlers && window.libraryHandlers.hotSwapSample) {
            try {
                await window.libraryHandlers.hotSwapSample(trackIndex, deviceIndex, data.path);
                
                if (window.visualFeedback && window.visualFeedback.success) {
                    window.visualFeedback.success(`Hot-swapped ${data.name} in device`);
                }
            } catch (err) {
                console.error('[LibraryDragDrop] Hot-swap failed:', err);
                if (window.visualFeedback && window.visualFeedback.error) {
                    window.visualFeedback.error(`Failed to hot-swap sample: ${err.message}`);
                }
            }
        } else {
            // Fallback: direct API call
            try {
                const apiBaseUrl = window.API_BASE_URL || 'http://127.0.0.1:8000';
                const response = await fetch(`${apiBaseUrl}/live/browser/hot_swap`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        track_index: trackIndex,
                        device_index: deviceIndex,
                        sample_path: data.path
                    })
                });
                
                if (response.ok) {
                    if (window.visualFeedback && window.visualFeedback.success) {
                        window.visualFeedback.success(`Hot-swapped ${data.name} in device`);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (err) {
                console.error('[LibraryDragDrop] Hot-swap failed:', err);
                if (window.visualFeedback && window.visualFeedback.error) {
                    window.visualFeedback.error(`Failed to hot-swap sample: ${err.message}`);
                }
            }
        }
    }

    /**
     * Observe for dynamically added drop zones
     */
    observeDropZones() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if node is a drop zone
                        if (node.hasAttribute && node.hasAttribute('data-drop-zone')) {
                            this.registerDropZone(node);
                        }
                        // Check children
                        const dropZones = node.querySelectorAll?.('[data-drop-zone]');
                        if (dropZones) {
                            dropZones.forEach(zone => this.registerDropZone(zone));
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Make media items draggable (call after items are rendered)
     */
    makeItemsDraggable() {
        // Use event delegation on the container for better performance
        const container = document.querySelector('#media-list .browser-list-wrapper') || 
                         document.querySelector('#media-list .browser-list-items') ||
                         document.getElementById('media-list');
        
        if (!container) {
            console.warn('[LibraryDragDrop] Container not found for making items draggable');
            return;
        }
        
        // Make all existing items draggable
        container.querySelectorAll('.browser-item[data-media-id]').forEach(item => {
            if (!item.hasAttribute('draggable')) {
                item.setAttribute('draggable', 'true');
                item.style.cursor = 'grab';
            }
        });
        
        // Also observe for new items being added
        if (!this.dragObserver) {
            this.dragObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('browser-item')) {
                            if (!node.hasAttribute('draggable')) {
                                node.setAttribute('draggable', 'true');
                                node.style.cursor = 'grab';
                            }
                        }
                    });
                });
            });
            
            this.dragObserver.observe(container, {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * Create a drop zone programmatically
     * @param {HTMLElement} element - Element to make a drop zone
     * @param {string} type - Zone type ('track' or 'device')
     * @param {number} trackIndex - Track index
     * @param {number} deviceIndex - Device index (optional)
     * @returns {HTMLElement} Drop zone element
     */
    createDropZone(element, type, trackIndex, deviceIndex = null) {
        element.setAttribute('data-drop-zone', type);
        element.setAttribute('data-track-index', trackIndex.toString());
        if (deviceIndex !== null) {
            element.setAttribute('data-device-index', deviceIndex.toString());
        }
        
        // Add visual styling
        element.style.cssText += `
            transition: all 0.2s;
        `;
        
        // Add CSS class for styling
        element.classList.add('drop-zone');
        
        this.registerDropZone(element);
        return element;
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.LibraryDragDrop = LibraryDragDrop;
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = LibraryDragDrop;
}

