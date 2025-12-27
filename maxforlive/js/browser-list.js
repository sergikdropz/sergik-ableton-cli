/**
 * BrowserList Class
 * 
 * Virtual scrolling implementation for browser list to handle 1000+ items efficiently.
 */

export class BrowserList {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!this.container) {
            throw new Error('Container element not found');
        }

        this.itemHeight = options.itemHeight || 60; // Height of each item in pixels
        this.bufferSize = options.bufferSize || 50; // Number of items to render outside viewport
        this.items = [];
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.totalHeight = 0;

        this.setupContainer();
        this.setupScrollListener();
    }

    /**
     * Setup container structure
     */
    setupContainer() {
        // Create wrapper for scrolling
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'browser-list-wrapper';
        this.wrapper.style.cssText = `
            position: relative;
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
        `;

        // Create spacer for items before visible area
        this.spacerTop = document.createElement('div');
        this.spacerTop.className = 'browser-list-spacer-top';
        this.spacerTop.style.cssText = `
            height: 0px;
            transition: height 0.1s;
        `;

        // Create container for visible items
        this.itemsContainer = document.createElement('div');
        this.itemsContainer.className = 'browser-list-items';
        this.itemsContainer.style.cssText = `
            position: relative;
        `;

        // Create spacer for items after visible area
        this.spacerBottom = document.createElement('div');
        this.spacerBottom.className = 'browser-list-spacer-bottom';
        this.spacerBottom.style.cssText = `
            height: 0px;
            transition: height 0.1s;
        `;

        // Assemble structure
        this.wrapper.appendChild(this.spacerTop);
        this.wrapper.appendChild(this.itemsContainer);
        this.wrapper.appendChild(this.spacerBottom);

        // Replace container content
        this.container.innerHTML = '';
        this.container.appendChild(this.wrapper);

        // Update container height
        this.updateContainerHeight();
    }

    /**
     * Setup scroll listener
     */
    setupScrollListener() {
        this.wrapper.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            this.updateContainerHeight();
            this.updateVisibleRange();
            this.render();
        });

        resizeObserver.observe(this.container);
    }

    /**
     * Set items to display
     * @param {Array} items - Array of item data
     */
    setItems(items) {
        this.items = items;
        this.totalHeight = items.length * this.itemHeight;
        this.updateVisibleRange();
        this.render();
        
        // Dispatch event for items rendered
        document.dispatchEvent(new CustomEvent('mediaItemsRendered', {
            detail: { items: items, count: items.length }
        }));
        
        // Make items draggable if drag-drop is available
        if (window.libraryDragDrop && window.libraryDragDrop.makeItemsDraggable) {
            setTimeout(() => {
                window.libraryDragDrop.makeItemsDraggable();
            }, 50);
        }
        
        // Update favorites UI if available
        if (window.favoritesCollections && window.favoritesCollections.updateAllFavoriteUI) {
            setTimeout(() => {
                window.favoritesCollections.updateAllFavoriteUI();
            }, 50);
        }
    }

    /**
     * Add items
     * @param {Array} items - Items to add
     */
    addItems(items) {
        this.items = this.items.concat(items);
        this.totalHeight = this.items.length * this.itemHeight;
        this.updateVisibleRange();
        this.render();
    }

    /**
     * Clear all items
     */
    clearItems() {
        this.items = [];
        this.totalHeight = 0;
        this.updateVisibleRange();
        this.render();
    }

    /**
     * Update container height
     */
    updateContainerHeight() {
        const rect = this.container.getBoundingClientRect();
        this.containerHeight = rect.height;
    }

    /**
     * Handle scroll event
     */
    handleScroll() {
        this.scrollTop = this.wrapper.scrollTop;
        this.updateVisibleRange();
        this.render();
    }

    /**
     * Update visible range based on scroll position
     */
    updateVisibleRange() {
        if (this.items.length === 0) {
            this.visibleStart = 0;
            this.visibleEnd = 0;
            return;
        }

        // Calculate which items should be visible
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight);

        // Add buffer
        this.visibleStart = Math.max(0, startIndex - this.bufferSize);
        this.visibleEnd = Math.min(this.items.length, endIndex + this.bufferSize);
    }

    /**
     * Render visible items
     */
    render() {
        if (this.items.length === 0) {
            this.itemsContainer.innerHTML = '';
            this.spacerTop.style.height = '0px';
            this.spacerBottom.style.height = '0px';
            return;
        }

        // Calculate spacer heights
        const topHeight = this.visibleStart * this.itemHeight;
        const bottomHeight = (this.items.length - this.visibleEnd) * this.itemHeight;

        this.spacerTop.style.height = `${topHeight}px`;
        this.spacerBottom.style.height = `${bottomHeight}px`;

        // Clear and render visible items
        this.itemsContainer.innerHTML = '';

        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            const item = this.items[i];
            const element = this.createItemElement(item, i);
            this.itemsContainer.appendChild(element);
        }
    }

    /**
     * Create item element
     * @param {Object} item - Item data
     * @param {number} index - Item index
     * @returns {HTMLElement} Item element
     */
    createItemElement(item, index) {
        const element = document.createElement('div');
        element.className = 'browser-item';
        const mediaId = item.id || item.path || `item-${index}`;
        element.setAttribute('data-media-id', mediaId);
        
        // Add all metadata as data attributes for enhanced display
        if (item.path) element.setAttribute('data-media-path', item.path);
        if (item.type) element.setAttribute('data-media-type', item.type);
        if (item.bpm) element.setAttribute('data-bpm', item.bpm);
        if (item.key) element.setAttribute('data-key', item.key);
        if (item.duration) element.setAttribute('data-duration', item.duration);
        if (item.sample_rate) element.setAttribute('data-sample-rate', item.sample_rate);
        if (item.genre) element.setAttribute('data-genre', item.genre);
        if (item.name) element.setAttribute('data-media-name', item.name);
        
        element.style.cssText = `
            position: absolute;
            top: ${index * this.itemHeight}px;
            left: 0;
            right: 0;
            height: ${this.itemHeight}px;
            box-sizing: border-box;
        `;

        // Use existing item rendering if available
        if (item.element) {
            // Clone existing element
            const cloned = item.element.cloneNode(true);
            element.appendChild(cloned);
        } else {
            // Create basic item structure
            element.innerHTML = `
                <span class="item-icon">${item.icon || '🎵'}</span>
                <span class="item-name">${item.name || 'Untitled'}</span>
                <span class="item-type">${item.type || 'audio'}</span>
                ${item.duration ? `<span class="item-time">${item.duration}s</span>` : ''}
            `;
        }

        return element;
    }

    /**
     * Scroll to item
     * @param {number} index - Item index
     * @param {string} behavior - Scroll behavior ('auto' or 'smooth')
     */
    scrollToItem(index, behavior = 'smooth') {
        if (index < 0 || index >= this.items.length) {
            return;
        }

        const scrollTop = index * this.itemHeight;
        this.wrapper.scrollTo({
            top: scrollTop,
            behavior: behavior
        });
    }

    /**
     * Scroll to top
     */
    scrollToTop() {
        this.wrapper.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * Scroll to bottom
     */
    scrollToBottom() {
        this.wrapper.scrollTo({
            top: this.totalHeight,
            behavior: 'smooth'
        });
    }

    /**
     * Get visible items
     * @returns {Array} Visible items
     */
    getVisibleItems() {
        return this.items.slice(this.visibleStart, this.visibleEnd);
    }

    /**
     * Get item at index
     * @param {number} index - Item index
     * @returns {Object|null} Item or null
     */
    getItem(index) {
        return this.items[index] || null;
    }

    /**
     * Get total item count
     * @returns {number} Total count
     */
    getItemCount() {
        return this.items.length;
    }

    /**
     * Update item at index
     * @param {number} index - Item index
     * @param {Object} item - Updated item data
     */
    updateItem(index, item) {
        if (index < 0 || index >= this.items.length) {
            return;
        }

        this.items[index] = { ...this.items[index], ...item };

        // Re-render if item is visible
        if (index >= this.visibleStart && index < this.visibleEnd) {
            this.render();
        }
    }

    /**
     * Remove item at index
     * @param {number} index - Item index
     */
    removeItem(index) {
        if (index < 0 || index >= this.items.length) {
            return;
        }

        this.items.splice(index, 1);
        this.totalHeight = this.items.length * this.itemHeight;
        this.updateVisibleRange();
        this.render();
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.BrowserList = BrowserList;
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = BrowserList;
}

