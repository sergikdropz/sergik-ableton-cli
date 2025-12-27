/**
 * Favorites and Collections Management System
 * 
 * Manages user favorites and collections with localStorage persistence.
 */

export class FavoritesCollections {
    constructor() {
        this.favorites = this.loadFavorites();
        this.collections = this.loadCollections();
        this.setupUI();
        this.setupEventListeners();
    }

    /**
     * Setup UI elements
     */
    setupUI() {
        // Add favorites button to filter bar
        const filterBar = document.querySelector('.filter-bar');
        if (filterBar) {
            // Check if favorites button already exists
            if (!filterBar.querySelector('[data-filter="favorites"]')) {
                const favoritesBtn = document.createElement('button');
                favoritesBtn.className = 'filter-chip';
                favoritesBtn.setAttribute('data-filter', 'favorites');
                favoritesBtn.innerHTML = '⭐ Favorites';
                favoritesBtn.style.cssText = `
                    background: rgba(255, 215, 0, 0.1);
                    border: 1px solid #FFD700;
                    color: #FFD700;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                `;
                favoritesBtn.addEventListener('click', () => this.showFavorites());
                favoritesBtn.addEventListener('mouseenter', () => {
                    favoritesBtn.style.background = 'rgba(255, 215, 0, 0.2)';
                });
                favoritesBtn.addEventListener('mouseleave', () => {
                    favoritesBtn.style.background = 'rgba(255, 215, 0, 0.1)';
                });
                filterBar.appendChild(favoritesBtn);
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for media loaded events to update favorite status
        document.addEventListener('mediaLoaded', (e) => {
            const mediaId = e.detail?.mediaId;
            if (mediaId) {
                this.updateFavoriteUI(mediaId, this.isFavorite(mediaId));
            }
        });
        
        // Listen for media items rendered
        document.addEventListener('mediaItemsRendered', (e) => {
            // Update favorites UI for all rendered items
            setTimeout(() => {
                this.updateAllFavoriteUI();
            }, 100);
        });
        
        // Listen for item selection to show favorite status
        document.addEventListener('mediaSelected', (e) => {
            const mediaId = e.detail?.mediaId;
            if (mediaId) {
                // Ensure favorite icon is visible if item is favorite
                this.updateFavoriteUI(mediaId, this.isFavorite(mediaId));
            }
        });
    }

    /**
     * Add media to favorites
     * @param {string} mediaId - Media ID
     */
    addToFavorites(mediaId) {
        if (!mediaId) return;
        
        if (!this.favorites.includes(mediaId)) {
            this.favorites.push(mediaId);
            this.saveFavorites();
            this.updateFavoriteUI(mediaId, true);
            
            if (window.visualFeedback && window.visualFeedback.success) {
                window.visualFeedback.success('Added to favorites');
            }
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('favoriteAdded', {
                detail: { mediaId }
            }));
        }
    }

    /**
     * Remove media from favorites
     * @param {string} mediaId - Media ID
     */
    removeFromFavorites(mediaId) {
        if (!mediaId) return;
        
        const index = this.favorites.indexOf(mediaId);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.saveFavorites();
            this.updateFavoriteUI(mediaId, false);
            
            if (window.visualFeedback && window.visualFeedback.info) {
                window.visualFeedback.info('Removed from favorites');
            }
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('favoriteRemoved', {
                detail: { mediaId }
            }));
        }
    }

    /**
     * Toggle favorite status
     * @param {string} mediaId - Media ID
     */
    toggleFavorite(mediaId) {
        if (this.isFavorite(mediaId)) {
            this.removeFromFavorites(mediaId);
        } else {
            this.addToFavorites(mediaId);
        }
    }

    /**
     * Check if media is favorite
     * @param {string} mediaId - Media ID
     * @returns {boolean} True if favorite
     */
    isFavorite(mediaId) {
        return this.favorites.includes(mediaId);
    }

    /**
     * Show favorites in browser list
     */
    showFavorites() {
        // Filter browser list to show only favorites
        if (window.browserList) {
            const allItems = window.browserList.items || [];
            const favoriteItems = allItems.filter(item => 
                this.favorites.includes(item.id)
            );
            window.browserList.setItems(favoriteItems);
            
            // Update filter chip states
            document.querySelectorAll('.filter-chip').forEach(chip => {
                chip.classList.remove('active');
            });
            const favoritesBtn = document.querySelector('[data-filter="favorites"]');
            if (favoritesBtn) {
                favoritesBtn.classList.add('active');
            }
            
            // Visual feedback
            if (window.visualFeedback && window.visualFeedback.info) {
                window.visualFeedback.info(`Showing ${favoriteItems.length} favorites`);
            }
        }
    }

    /**
     * Update favorite UI for a specific item
     * @param {string} mediaId - Media ID
     * @param {boolean} isFavorite - Whether item is favorite
     */
    updateFavoriteUI(mediaId, isFavorite) {
        const item = document.querySelector(`[data-media-id="${mediaId}"]`);
        if (!item) return;
        
        // Update status indicator
        if (window.enhancedMediaDisplay) {
            window.enhancedMediaDisplay.updateItemStatus(mediaId, 'favorite', isFavorite);
        }
        
        // Update data attribute
        if (isFavorite) {
            item.setAttribute('data-favorite', 'true');
            
            // Add favorite icon if not present
            if (!item.querySelector('.favorite-icon')) {
                const favoriteIcon = document.createElement('span');
                favoriteIcon.className = 'favorite-icon';
                favoriteIcon.textContent = '★';
                favoriteIcon.style.cssText = `
                    color: #FFD700;
                    margin-left: 8px;
                    font-size: 14px;
                `;
                favoriteIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleFavorite(mediaId);
                });
                
                const itemName = item.querySelector('.item-name');
                if (itemName) {
                    itemName.appendChild(favoriteIcon);
                }
            }
        } else {
            item.removeAttribute('data-favorite');
            const favoriteIcon = item.querySelector('.favorite-icon');
            if (favoriteIcon) {
                favoriteIcon.remove();
            }
        }
    }

    /**
     * Update all favorite UI indicators
     */
    updateAllFavoriteUI() {
        this.favorites.forEach(mediaId => {
            this.updateFavoriteUI(mediaId, true);
        });
    }

    /**
     * Create a new collection
     * @param {string} name - Collection name
     * @returns {Object} Created collection
     */
    createCollection(name) {
        if (!name || name.trim().length === 0) {
            throw new Error('Collection name is required');
        }
        
        const collection = {
            id: `collection_${Date.now()}`,
            name: name.trim(),
            items: [],
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        
        this.collections.push(collection);
        this.saveCollections();
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('collectionCreated', {
            detail: { collection }
        }));
        
        return collection;
    }

    /**
     * Add media to collection
     * @param {string} collectionId - Collection ID
     * @param {string} mediaId - Media ID
     */
    addToCollection(collectionId, mediaId) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) {
            throw new Error('Collection not found');
        }
        
        if (!collection.items.includes(mediaId)) {
            collection.items.push(mediaId);
            collection.updated = new Date().toISOString();
            this.saveCollections();
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('collectionUpdated', {
                detail: { collectionId, mediaId, action: 'added' }
            }));
        }
    }

    /**
     * Remove media from collection
     * @param {string} collectionId - Collection ID
     * @param {string} mediaId - Media ID
     */
    removeFromCollection(collectionId, mediaId) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) return;
        
        const index = collection.items.indexOf(mediaId);
        if (index > -1) {
            collection.items.splice(index, 1);
            collection.updated = new Date().toISOString();
            this.saveCollections();
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('collectionUpdated', {
                detail: { collectionId, mediaId, action: 'removed' }
            }));
        }
    }

    /**
     * Delete collection
     * @param {string} collectionId - Collection ID
     */
    deleteCollection(collectionId) {
        const index = this.collections.findIndex(c => c.id === collectionId);
        if (index > -1) {
            this.collections.splice(index, 1);
            this.saveCollections();
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('collectionDeleted', {
                detail: { collectionId }
            }));
        }
    }

    /**
     * Get all favorites
     * @returns {Array} Array of favorite media IDs
     */
    getFavorites() {
        return [...this.favorites];
    }

    /**
     * Get all collections
     * @returns {Array} Array of collections
     */
    getCollections() {
        return [...this.collections];
    }

    /**
     * Load favorites from localStorage
     * @returns {Array} Favorites array
     */
    loadFavorites() {
        try {
            const stored = localStorage.getItem('library_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('[FavoritesCollections] Failed to load favorites:', e);
            return [];
        }
    }

    /**
     * Save favorites to localStorage
     */
    saveFavorites() {
        try {
            localStorage.setItem('library_favorites', JSON.stringify(this.favorites));
        } catch (e) {
            console.warn('[FavoritesCollections] Failed to save favorites:', e);
        }
    }

    /**
     * Load collections from localStorage
     * @returns {Array} Collections array
     */
    loadCollections() {
        try {
            const stored = localStorage.getItem('library_collections');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('[FavoritesCollections] Failed to load collections:', e);
            return [];
        }
    }

    /**
     * Save collections to localStorage
     */
    saveCollections() {
        try {
            localStorage.setItem('library_collections', JSON.stringify(this.collections));
        } catch (e) {
            console.warn('[FavoritesCollections] Failed to save collections:', e);
        }
    }

    /**
     * Clear all favorites
     */
    clearFavorites() {
        this.favorites = [];
        this.saveFavorites();
        this.updateAllFavoriteUI();
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('favoritesCleared'));
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.FavoritesCollections = FavoritesCollections;
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = FavoritesCollections;
}

