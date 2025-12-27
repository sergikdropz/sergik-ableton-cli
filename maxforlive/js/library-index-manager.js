/**
 * Library Index Manager
 * Manages the library file index with metadata for fast searching and organization
 */

export class LibraryIndexManager {
    constructor() {
        this.index = new Map(); // mediaId -> metadata
        this.searchIndex = new Map(); // searchable terms -> Set of mediaIds
        this.storageKey = 'sergik_library_index';
        this.loadIndex();
    }

    /**
     * Generate unique media ID from file path
     * @param {string} filePath - File path
     * @returns {string} Media ID
     */
    generateMediaId(filePath) {
        // Use path as ID, or hash for shorter IDs
        return filePath || `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add file to index
     * @param {string} filePath - File path
     * @param {Object} metadata - File metadata
     * @returns {Promise<string>} Media ID
     */
    async addFile(filePath, metadata) {
        const mediaId = this.generateMediaId(filePath);
        
        const indexEntry = {
            id: mediaId,
            path: filePath,
            name: metadata.filename || filePath.split('/').pop() || filePath.split('\\').pop(),
            type: metadata.type || 'audio',
            source: metadata.source || 'generated',
            generationType: metadata.generationType,
            metadata: {
                bpm: metadata.metadata?.bpm,
                key: metadata.metadata?.key,
                genre: metadata.metadata?.genre,
                duration: metadata.metadata?.duration,
                bars: metadata.metadata?.bars,
                tempo: metadata.metadata?.tempo,
                subCategory: metadata.metadata?.subCategory,
                generatedAt: metadata.metadata?.generatedAt || new Date().toISOString(),
                generationParams: metadata.metadata?.generationParams,
                ...metadata.metadata
            },
            indexedAt: new Date().toISOString()
        };

        this.index.set(mediaId, indexEntry);
        this.updateSearchIndex(mediaId, indexEntry);
        await this.persistIndex();

        // Dispatch event
        document.dispatchEvent(new CustomEvent('libraryIndexUpdated', {
            detail: { mediaId, entry: indexEntry, action: 'added' }
        }));

        return mediaId;
    }

    /**
     * Update search index with file metadata
     * @param {string} mediaId - Media ID
     * @param {Object} entry - Index entry
     */
    updateSearchIndex(mediaId, entry) {
        const searchTerms = this.extractSearchTerms(entry);
        
        searchTerms.forEach(term => {
            if (!this.searchIndex.has(term)) {
                this.searchIndex.set(term, new Set());
            }
            this.searchIndex.get(term).add(mediaId);
        });
    }

    /**
     * Extract searchable terms from entry
     * @param {Object} entry - Index entry
     * @returns {Array<string>} Search terms
     */
    extractSearchTerms(entry) {
        const terms = new Set();
        
        // Add filename terms
        const nameWords = entry.name.toLowerCase().split(/[_\s-]+/);
        nameWords.forEach(word => {
            if (word.length > 2) terms.add(word);
        });
        
        // Add metadata terms
        if (entry.metadata) {
            if (entry.metadata.genre) {
                terms.add(entry.metadata.genre.toLowerCase());
                terms.add(`genre:${entry.metadata.genre.toLowerCase()}`);
            }
            if (entry.metadata.bpm) {
                terms.add(`bpm:${entry.metadata.bpm}`);
            }
            if (entry.metadata.key) {
                terms.add(`key:${entry.metadata.key.toLowerCase()}`);
            }
            if (entry.metadata.type) {
                terms.add(entry.metadata.type.toLowerCase());
            }
            if (entry.generationType) {
                terms.add(entry.generationType.toLowerCase());
            }
        }
        
        return Array.from(terms);
    }

    /**
     * Search index
     * @param {string} query - Search query
     * @returns {Array<Object>} Matching entries
     */
    search(query) {
        const queryLower = query.toLowerCase();
        const queryTerms = queryLower.split(/\s+/);
        const matchingIds = new Set();
        
        queryTerms.forEach(term => {
            // Exact match
            if (this.searchIndex.has(term)) {
                this.searchIndex.get(term).forEach(id => matchingIds.add(id));
            }
            
            // Partial match
            this.searchIndex.forEach((ids, indexTerm) => {
                if (indexTerm.includes(term) || term.includes(indexTerm)) {
                    ids.forEach(id => matchingIds.add(id));
                }
            });
        });
        
        return Array.from(matchingIds).map(id => this.index.get(id)).filter(Boolean);
    }

    /**
     * Get file by ID
     * @param {string} mediaId - Media ID
     * @returns {Object|null} Index entry
     */
    getFile(mediaId) {
        return this.index.get(mediaId) || null;
    }

    /**
     * Get all files
     * @param {Object} filters - Filter options
     * @returns {Array<Object>} Filtered entries
     */
    getAllFiles(filters = {}) {
        let entries = Array.from(this.index.values());
        
        if (filters.type) {
            entries = entries.filter(e => e.type === filters.type);
        }
        if (filters.source) {
            entries = entries.filter(e => e.source === filters.source);
        }
        if (filters.generationType) {
            entries = entries.filter(e => e.generationType === filters.generationType);
        }
        if (filters.genre) {
            entries = entries.filter(e => e.metadata?.genre === filters.genre);
        }
        if (filters.bpm) {
            entries = entries.filter(e => e.metadata?.bpm === filters.bpm);
        }
        
        return entries;
    }

    /**
     * Remove file from index
     * @param {string} mediaId - Media ID
     */
    async removeFile(mediaId) {
        const entry = this.index.get(mediaId);
        if (entry) {
            this.index.delete(mediaId);
            this.removeFromSearchIndex(mediaId);
            await this.persistIndex();
            
            document.dispatchEvent(new CustomEvent('libraryIndexUpdated', {
                detail: { mediaId, entry, action: 'removed' }
            }));
        }
    }

    /**
     * Remove from search index
     * @param {string} mediaId - Media ID
     */
    removeFromSearchIndex(mediaId) {
        this.searchIndex.forEach((ids, term) => {
            ids.delete(mediaId);
            if (ids.size === 0) {
                this.searchIndex.delete(term);
            }
        });
    }

    /**
     * Persist index to localStorage
     */
    async persistIndex() {
        try {
            const indexData = {
                entries: Array.from(this.index.entries()),
                version: '1.0',
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(indexData));
        } catch (error) {
            console.warn('[LibraryIndexManager] Failed to persist index:', error);
        }
    }

    /**
     * Load index from localStorage
     */
    loadIndex() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const indexData = JSON.parse(stored);
                this.index = new Map(indexData.entries || []);
                
                // Rebuild search index
                this.searchIndex.clear();
                this.index.forEach((entry, mediaId) => {
                    this.updateSearchIndex(mediaId, entry);
                });
            }
        } catch (error) {
            console.warn('[LibraryIndexManager] Failed to load index:', error);
            this.index = new Map();
            this.searchIndex = new Map();
        }
    }

    /**
     * Refresh index from filesystem
     * @returns {Promise<number>} Number of files indexed
     */
    async refreshFromFilesystem() {
        try {
            if (!window.sergikAPI) {
                console.warn('[LibraryIndexManager] API not available');
                return 0;
            }

            const result = await window.sergikAPI.listMediaStorageFiles({
                source: 'all',
                type: 'all'
            });

            if (!result.success || !result.files) {
                return 0;
            }

            let added = 0;
            for (const file of result.files) {
                const mediaId = this.generateMediaId(file.path);
                
                // Only add if not already indexed
                if (!this.index.has(mediaId)) {
                    await this.addFile(file.path, {
                        filename: file.name,
                        type: file.type,
                        source: file.source?.replace('media-', '') || 'imported',
                        metadata: {
                            // Try to load metadata file if exists
                            ...(await this.loadMetadataFile(file.path))
                        }
                    });
                    added++;
                }
            }

            return added;
        } catch (error) {
            console.error('[LibraryIndexManager] Refresh failed:', error);
            return 0;
        }
    }

    /**
     * Load metadata file if exists
     * @param {string} filePath - File path
     * @returns {Promise<Object>} Metadata
     */
    async loadMetadataFile(filePath) {
        try {
            const metadataPath = filePath + '.metadata.json';
            // Try to fetch metadata file
            // This would need API endpoint to read metadata files
            return {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Clear index
     */
    async clearIndex() {
        this.index.clear();
        this.searchIndex.clear();
        await this.persistIndex();
    }
}

// Export singleton instance
if (typeof window !== 'undefined') {
    window.LibraryIndexManager = LibraryIndexManager;
    if (!window.libraryIndexManager) {
        window.libraryIndexManager = new LibraryIndexManager();
    }
}

