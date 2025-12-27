/**
 * Library Auto-Refresh
 * Handles automatic library UI updates when files are added/modified
 */

export class LibraryAutoRefresh {
    constructor() {
        this.refreshDebounce = null;
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for new files
        document.addEventListener('libraryFileAdded', (e) => {
            this.handleFileAdded(e.detail);
        });

        // Listen for index updates
        document.addEventListener('libraryIndexUpdated', (e) => {
            this.handleIndexUpdate(e.detail);
        });

        // Listen for generation complete
        document.addEventListener('generationComplete', (e) => {
            this.handleGenerationComplete(e.detail);
        });
    }

    /**
     * Handle file added event
     * @param {Object} detail - Event detail
     */
    async handleFileAdded(detail) {
        const { filePath, mediaId, metadata, type } = detail;

        // Add to recent list
        if (window.mediaLoader) {
            window.mediaLoader.addToRecent(mediaId, {
                path: filePath,
                type: type,
                metadata: metadata
            });
        }

        // Refresh library items
        this.debouncedRefresh();

        // Update group counts
        if (typeof updateGroupCounts === 'function') {
            setTimeout(() => updateGroupCounts(), 100);
        }

        // Show notification
        this.showNotification(`New ${type} added: ${metadata.filename || filePath.split('/').pop() || filePath.split('\\').pop()}`);
    }

    /**
     * Handle index update
     * @param {Object} detail - Event detail
     */
    handleIndexUpdate(detail) {
        const { action, mediaId } = detail;
        
        if (action === 'added') {
            this.debouncedRefresh();
        } else if (action === 'removed') {
            this.removeFromUI(mediaId);
        }
    }

    /**
     * Handle generation complete
     * @param {Object} detail - Event detail
     */
    async handleGenerationComplete(detail) {
        const { type, params, result, saveResult } = detail;

        if (saveResult && saveResult.success) {
            // File was saved, refresh library
            this.debouncedRefresh();

            // Optionally auto-switch to library tab
            if (window.settings?.autoSwitchToLibraryAfterGeneration) {
                setTimeout(() => {
                    this.switchToLibraryTab();
                    
                    // Auto-select new file after a delay
                    if (saveResult.mediaId) {
                        setTimeout(() => {
                            this.selectNewFile(saveResult.mediaId);
                        }, 500);
                    }
                }, 300);
            }
        }
    }

    /**
     * Refresh library items
     */
    async refreshLibraryItems() {
        try {
            // Get all files from API first (includes both generated and imported)
            let allItems = [];
            
            if (window.sergikAPI) {
                try {
                    const result = await window.sergikAPI.listMediaStorageFiles({
                        source: 'all',
                        type: 'all'
                    });
                    
                    if (result.success && result.files) {
                        allItems = result.files.map(file => ({
                            id: file.path,
                            name: file.name,
                            type: file.type,
                            path: file.path,
                            icon: file.type === 'midi' ? '🎹' : '🎵',
                            bpm: file.metadata?.bpm,
                            key: file.metadata?.key,
                            genre: file.metadata?.genre,
                            duration: file.metadata?.duration,
                            source: file.source?.replace('media-', '') || 'imported',
                            ...file
                        }));
                    }
                } catch (apiError) {
                    console.warn('[LibraryAutoRefresh] API list failed, using index only:', apiError);
                }
            }
            
            // Enhance with index metadata and add indexed-only files
            if (window.libraryIndexManager) {
                // Get indexed files
                const indexedFiles = window.libraryIndexManager.getAllFiles();
                
                // Create map for fast lookup
                const indexedMap = new Map();
                indexedFiles.forEach(file => {
                    indexedMap.set(file.id, file);
                });
                
                // Enhance API items with index data
                allItems = allItems.map(item => {
                    const indexEntry = indexedMap.get(item.id);
                    if (indexEntry) {
                        // Merge index metadata
                        return {
                            ...item,
                            bpm: item.bpm || indexEntry.metadata?.bpm,
                            key: item.key || indexEntry.metadata?.key,
                            genre: item.genre || indexEntry.metadata?.genre,
                            duration: item.duration || indexEntry.metadata?.duration,
                            generationType: indexEntry.generationType,
                            metadata: { ...item.metadata, ...indexEntry.metadata }
                        };
                    }
                    return item;
                });
                
                // Add indexed files not in API results (newly generated files)
                indexedFiles.forEach(indexedFile => {
                    const exists = allItems.some(item => item.id === indexedFile.id);
                    if (!exists) {
                        allItems.push({
                            id: indexedFile.id,
                            name: indexedFile.name,
                            type: indexedFile.type,
                            path: indexedFile.path,
                            icon: indexedFile.type === 'midi' ? '🎹' : '🎵',
                            bpm: indexedFile.metadata?.bpm,
                            key: indexedFile.metadata?.key,
                            genre: indexedFile.metadata?.genre,
                            duration: indexedFile.metadata?.duration,
                            source: indexedFile.source || 'generated',
                            generationType: indexedFile.generationType,
                            metadata: indexedFile.metadata
                        });
                    }
                });
            }

            // Update BrowserList
            if (window.browserList && allItems.length > 0) {
                window.browserList.setItems(allItems);
            }

            // Also refresh index from filesystem
            await this.refreshFromFilesystem();
        } catch (error) {
            console.error('[LibraryAutoRefresh] Refresh failed:', error);
        }
    }

    /**
     * Refresh from filesystem
     */
    async refreshFromFilesystem() {
        try {
            if (window.sergikAPI && window.libraryIndexManager) {
                const added = await window.libraryIndexManager.refreshFromFilesystem();
                
                if (added > 0) {
                    // Refresh UI with new files
                    await this.refreshLibraryItems();
                }
            }
        } catch (error) {
            console.error('[LibraryAutoRefresh] Filesystem refresh failed:', error);
        }
    }

    /**
     * Debounced refresh
     */
    debouncedRefresh() {
        clearTimeout(this.refreshDebounce);
        this.refreshDebounce = setTimeout(() => {
            this.refreshLibraryItems();
        }, 500);
    }

    /**
     * Remove item from UI
     * @param {string} mediaId - Media ID
     */
    removeFromUI(mediaId) {
        const item = document.querySelector(`[data-media-id="${mediaId}"]`);
        if (item) {
            item.remove();
            if (typeof updateGroupCounts === 'function') {
                updateGroupCounts();
            }
        }
    }

    /**
     * Switch to library tab
     */
    switchToLibraryTab() {
        const libraryTab = document.querySelector('[data-main-tab="library"]');
        if (libraryTab) {
            libraryTab.click();
        }
    }

    /**
     * Select new file in library
     * @param {string} mediaId - Media ID
     */
    selectNewFile(mediaId) {
        if (window.mediaItemInteraction) {
            window.mediaItemInteraction.selectItem(mediaId);
        }
    }

    /**
     * Show notification
     * @param {string} message - Message to show
     */
    showNotification(message) {
        if (window.visualFeedback && window.visualFeedback.showNotification) {
            window.visualFeedback.showNotification(message, 'success');
        } else {
            console.log(`[Library] ${message}`);
        }
    }
}

// Export singleton
if (typeof window !== 'undefined') {
    window.LibraryAutoRefresh = LibraryAutoRefresh;
    if (!window.libraryAutoRefresh) {
        window.libraryAutoRefresh = new LibraryAutoRefresh();
    }
}

