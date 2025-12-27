/**
 * Library Tab Workflow Optimizer
 * Comprehensive workflow enhancements for the Library tab:
 * - Keyboard navigation
 * - Drag & drop
 * - Hover preview
 * - Multi-select
 * - Favorites
 * - Smart defaults
 * - Quick actions
 */

class LibraryWorkflowOptimizer {
    constructor() {
        this.selectedItems = new Set();
        this.favorites = this.loadFavorites();
        this.lastUsedTrack = parseInt(localStorage.getItem('library_lastTrack') || '0');
        this.lastUsedSlot = localStorage.getItem('library_lastSlot') || 'next';
        this.hoverPreviewTimer = null;
        this.currentHoverItem = null;
        this.typeToSearchBuffer = '';
        this.typeToSearchTimer = null;
        this.recentSearches = this.loadRecentSearches();
        this.searchSuggestions = [];
        
        this.init();
    }
    
    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        // Wait a bit for DOM to be ready
        setTimeout(() => {
            this.setupKeyboardNavigation();
            this.setupDragAndDrop();
            this.setupHoverPreview();
            this.setupMultiSelect();
            this.setupFavorites();
            this.setupTrackSlotSelector();
            this.setupSearchAutocomplete();
            this.setupQuickActions();
            this.setupSmartDefaults();
            
            // Listen for media list updates
            document.addEventListener('mediaItemsRendered', () => {
                this.attachEventListeners();
            });
            
            // Also attach listeners if items already exist
            if (document.querySelectorAll('.browser-item').length > 0) {
                this.attachEventListeners();
            }
        }, 100);
    }
    
    // ============================================================================
    // Keyboard Navigation
    // ============================================================================
    
    setupKeyboardNavigation() {
        // Only activate when Library tab is active
        document.addEventListener('keydown', (e) => {
            const libraryTab = document.getElementById('tab-section-library');
            if (!libraryTab || !libraryTab.classList.contains('active')) return;
            
            const searchInput = document.getElementById('media-search');
            if (searchInput && document.activeElement === searchInput) {
                // Handle search-specific shortcuts
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.focusFirstMediaItem();
                }
                return;
            }
            
            // Navigation shortcuts
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateMediaItems(-1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateMediaItems(1);
                    break;
                case 'Home':
                    e.preventDefault();
                    this.navigateMediaItems('first');
                    break;
                case 'End':
                    e.preventDefault();
                    this.navigateMediaItems('last');
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.loadSelectedIntoEditor();
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePreview();
                    break;
                case 'i':
                case 'I':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.quickInsert();
                    }
                    break;
                case 'r':
                case 'R':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.quickReplace();
                    }
                    break;
                case 'd':
                case 'D':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.quickDuplicate();
                    }
                    break;
                case 'p':
                case 'P':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.togglePreview();
                    }
                    break;
                case 'f':
                case 'F':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.toggleFavorite();
                    }
                    break;
                default:
                    // Type-to-search
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        this.handleTypeToSearch(e.key);
                    }
            }
        });
    }
    
    navigateMediaItems(direction) {
        const items = Array.from(document.querySelectorAll('.browser-item:not([style*="display: none"])'));
        if (items.length === 0) return;
        
        const currentIndex = items.findIndex(item => item.classList.contains('selected'));
        let newIndex;
        
        if (direction === 'first') {
            newIndex = 0;
        } else if (direction === 'last') {
            newIndex = items.length - 1;
        } else {
            newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = items.length - 1;
            if (newIndex >= items.length) newIndex = 0;
        }
        
        const newItem = items[newIndex];
        if (newItem) {
            // Select without loading
            document.querySelectorAll('.browser-item').forEach(i => i.classList.remove('selected'));
            newItem.classList.add('selected');
            newItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            
            // Update metadata display
            this.updateMetadataDisplay(newItem);
        }
    }
    
    focusFirstMediaItem() {
        const firstItem = document.querySelector('.browser-item:not([style*="display: none"])');
        if (firstItem) {
            document.querySelectorAll('.browser-item').forEach(i => i.classList.remove('selected'));
            firstItem.classList.add('selected');
            firstItem.scrollIntoView({ block: 'nearest' });
        }
    }
    
    handleTypeToSearch(key) {
        clearTimeout(this.typeToSearchTimer);
        this.typeToSearchBuffer += key.toLowerCase();
        
        // Find matching item
        const items = Array.from(document.querySelectorAll('.browser-item:not([style*="display: none"])'));
        const match = items.find(item => {
            const name = item.querySelector('.item-name')?.textContent.toLowerCase() || '';
            return name.startsWith(this.typeToSearchBuffer);
        });
        
        if (match) {
            document.querySelectorAll('.browser-item').forEach(i => i.classList.remove('selected'));
            match.classList.add('selected');
            match.scrollIntoView({ block: 'nearest' });
        }
        
        // Clear buffer after 1 second
        this.typeToSearchTimer = setTimeout(() => {
            this.typeToSearchBuffer = '';
        }, 1000);
    }
    
    // ============================================================================
    // Lazy Loading
    // ============================================================================
    
    attachEventListeners() {
        // Replace click handlers with lazy loading
        document.querySelectorAll('.browser-item').forEach(item => {
            // Remove existing click listeners by cloning
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Single click = select only
            newItem.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    this.toggleMultiSelect(newItem);
                } else if (e.shiftKey) {
                    this.selectRange(newItem);
                } else {
                    this.selectItem(newItem);
                }
            });
            
            // Double click = load into editor
            newItem.addEventListener('dblclick', () => {
                this.loadSelectedIntoEditor();
            });
            
            // Right click handled by context menu
        });
    }
    
    selectItem(item) {
        document.querySelectorAll('.browser-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.updateMetadataDisplay(item);
    }
    
    loadSelectedIntoEditor() {
        const selected = document.querySelector('.browser-item.selected');
        if (!selected) return;
        
        const mediaId = selected.dataset.mediaId;
        const mediaType = selected.dataset.mediaType || 'audio';
        
        if (window.loadMediaIntoEditor) {
            window.loadMediaIntoEditor(mediaId);
        }
        
        if (window.libraryAudioManager) {
            window.libraryAudioManager.selectMediaItem(mediaId, mediaType);
        }
    }
    
    // ============================================================================
    // Drag & Drop
    // ============================================================================
    
    setupDragAndDrop() {
        // Make media items draggable
        document.addEventListener('mediaItemsRendered', () => {
            document.querySelectorAll('.browser-item').forEach(item => {
                item.draggable = true;
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        mediaId: item.dataset.mediaId,
                        mediaType: item.dataset.mediaType,
                        mediaPath: item.dataset.mediaPath
                    }));
                    item.classList.add('dragging');
                });
                
                item.addEventListener('dragend', () => {
                    item.classList.remove('dragging');
                });
            });
        });
        
        // Add drop zone handlers for track/slot areas
        // Note: This would require visual drop zones in the UI
        // For now, drag data is available for future implementation
    }
    
    // ============================================================================
    // Hover Preview
    // ============================================================================
    
    setupHoverPreview() {
        document.addEventListener('mouseover', (e) => {
            const item = e.target.closest('.browser-item');
            if (!item) {
                this.cancelHoverPreview();
                return;
            }
            
            if (item === this.currentHoverItem) return;
            this.currentHoverItem = item;
            
            // Clear existing timer
            clearTimeout(this.hoverPreviewTimer);
            
            // Start preview after 500ms
            this.hoverPreviewTimer = setTimeout(() => {
                this.startHoverPreview(item);
            }, 500);
        });
        
        document.addEventListener('mouseout', (e) => {
            const item = e.target.closest('.browser-item');
            if (item) {
                this.cancelHoverPreview();
            }
        });
    }
    
    startHoverPreview(item) {
        const mediaPath = item.dataset.mediaPath;
        const mediaType = item.dataset.mediaType;
        
        if (!mediaPath || mediaType !== 'audio') return;
        
        // Select item for preview (but don't load into editor)
        document.querySelectorAll('.browser-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        
        // Update metadata display
        this.updateMetadataDisplay(item);
        
        // Note: Actual preview playback would need to be handled by the preview system
        // This just prepares the item for preview
    }
    
    cancelHoverPreview() {
        clearTimeout(this.hoverPreviewTimer);
        this.currentHoverItem = null;
    }
    
    // ============================================================================
    // Multi-Select
    // ============================================================================
    
    setupMultiSelect() {
        // Handled in attachEventListeners
    }
    
    toggleMultiSelect(item) {
        if (this.selectedItems.has(item)) {
            this.selectedItems.delete(item);
            item.classList.remove('selected');
        } else {
            this.selectedItems.add(item);
            item.classList.add('selected');
        }
        this.updateSelectionCount();
    }
    
    selectRange(item) {
        const items = Array.from(document.querySelectorAll('.browser-item:not([style*="display: none"])'));
        const currentIndex = items.findIndex(i => i.classList.contains('selected'));
        const targetIndex = items.indexOf(item);
        
        if (currentIndex === -1) {
            this.selectItem(item);
            return;
        }
        
        const start = Math.min(currentIndex, targetIndex);
        const end = Math.max(currentIndex, targetIndex);
        
        items.slice(start, end + 1).forEach(i => {
            this.selectedItems.add(i);
            i.classList.add('selected');
        });
        
        this.updateSelectionCount();
    }
    
    updateSelectionCount() {
        const count = this.selectedItems.size;
        // Update UI to show selection count
        const selectedCountEl = document.getElementById('selected-count');
        if (selectedCountEl) {
            selectedCountEl.textContent = count > 0 ? `(${count} selected)` : '';
        }
    }
    
    // ============================================================================
    // Favorites
    // ============================================================================
    
    setupFavorites() {
        // Add favorite button to media items
        document.addEventListener('mediaItemsRendered', () => {
            document.querySelectorAll('.browser-item').forEach(item => {
                const mediaId = item.dataset.mediaId;
                const isFavorite = this.favorites.has(mediaId);
                
                // Add star button
                let starBtn = item.querySelector('.favorite-btn');
                if (!starBtn) {
                    starBtn = document.createElement('button');
                    starBtn.className = `favorite-btn ${isFavorite ? 'active' : ''}`;
                    starBtn.innerHTML = isFavorite ? '⭐' : '☆';
                    starBtn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
                    starBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleFavorite(item);
                    });
                    item.insertBefore(starBtn, item.firstChild);
                }
            });
        });
    }
    
    toggleFavorite(item = null) {
        if (!item) {
            item = document.querySelector('.browser-item.selected');
        }
        if (!item) return;
        
        const mediaId = item.dataset.mediaId;
        const starBtn = item.querySelector('.favorite-btn');
        
        if (this.favorites.has(mediaId)) {
            this.favorites.delete(mediaId);
            if (starBtn) {
                starBtn.innerHTML = '☆';
                starBtn.classList.remove('active');
                starBtn.title = 'Add to favorites';
            }
        } else {
            this.favorites.add(mediaId);
            if (starBtn) {
                starBtn.innerHTML = '⭐';
                starBtn.classList.add('active');
                starBtn.title = 'Remove from favorites';
            }
        }
        
        this.saveFavorites();
    }
    
    loadFavorites() {
        try {
            const saved = localStorage.getItem('library_favorites');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    }
    
    saveFavorites() {
        try {
            localStorage.setItem('library_favorites', JSON.stringify(Array.from(this.favorites)));
        } catch (e) {
            console.warn('[LibraryWorkflow] Failed to save favorites:', e);
        }
    }
    
    // ============================================================================
    // Track/Slot Selector
    // ============================================================================
    
    setupTrackSlotSelector() {
        // Add track/slot selectors to actions panel
        const actionsPanel = document.querySelector('.actions-panel');
        if (!actionsPanel) return;
        
        // Check if already added
        if (document.getElementById('library-track-select')) return;
        
        const selectorGroup = document.createElement('div');
        selectorGroup.className = 'actions-group';
        selectorGroup.innerHTML = `
            <div class="action-label">Target</div>
            <div class="selector-row">
                <label style="font-size: 8px; color: var(--text-secondary);">Track:</label>
                <select id="library-track-select" class="library-select" style="flex: 1; padding: 2px 4px; font-size: 8px;">
                    <option value="0">Track 1</option>
                </select>
            </div>
            <div class="selector-row">
                <label style="font-size: 8px; color: var(--text-secondary);">Slot:</label>
                <select id="library-slot-select" class="library-select" style="flex: 1; padding: 2px 4px; font-size: 8px;">
                    <option value="next">Next</option>
                    <option value="1">Slot 1</option>
                    <option value="2">Slot 2</option>
                    <option value="3">Slot 3</option>
                    <option value="4">Slot 4</option>
                    <option value="5">Slot 5</option>
                    <option value="6">Slot 6</option>
                    <option value="7">Slot 7</option>
                    <option value="8">Slot 8</option>
                </select>
            </div>
            <div id="selected-count" style="font-size: 8px; color: var(--text-secondary); text-align: center; margin-top: 4px;"></div>
        `;
        
        // Insert before actions-group
        const firstGroup = actionsPanel.querySelector('.actions-group');
        if (firstGroup) {
            actionsPanel.insertBefore(selectorGroup, firstGroup);
        } else {
            actionsPanel.appendChild(selectorGroup);
        }
        
        // Set defaults
        const trackSelect = document.getElementById('library-track-select');
        const slotSelect = document.getElementById('library-slot-select');
        if (trackSelect) trackSelect.value = this.lastUsedTrack;
        if (slotSelect) slotSelect.value = this.lastUsedSlot;
        
        // Update on change
        if (trackSelect) {
            trackSelect.addEventListener('change', (e) => {
                this.lastUsedTrack = parseInt(e.target.value);
                localStorage.setItem('library_lastTrack', this.lastUsedTrack);
            });
        }
        if (slotSelect) {
            slotSelect.addEventListener('change', (e) => {
                this.lastUsedSlot = e.target.value;
                localStorage.setItem('library_lastSlot', this.lastUsedSlot);
            });
        }
        
        // Add batch insert button
        const batchBtn = document.createElement('button');
        batchBtn.className = 'action-btn';
        batchBtn.id = 'batch-insert-btn';
        batchBtn.textContent = 'Batch Insert';
        batchBtn.style.marginTop = '4px';
        batchBtn.title = 'Insert all selected items (Ctrl+Click to select multiple)';
        batchBtn.addEventListener('click', () => this.batchInsert());
        selectorGroup.appendChild(batchBtn);
        
        // Update track options when session state changes
        if (window.updateTrackAndSlotOptions) {
            // Refresh track options
            this.updateTrackOptions();
        }
    }
    
    updateTrackOptions() {
        const trackSelect = document.getElementById('library-track-select');
        if (!trackSelect) return;
        
        // Get tracks from session state
        if (window.sergikAPI) {
            window.sergikAPI.getTracks().then(result => {
                if (result.success && result.data) {
                    const tracks = result.data.tracks || [];
                    trackSelect.innerHTML = '<option value="new">New Track</option>';
                    tracks.forEach((track, index) => {
                        const option = document.createElement('option');
                        option.value = index.toString();
                        option.textContent = track.name || `Track ${index + 1}`;
                        trackSelect.appendChild(option);
                    });
                    trackSelect.value = this.lastUsedTrack.toString();
                }
            }).catch(err => {
                console.warn('[LibraryWorkflow] Failed to load tracks:', err);
            });
        }
    }
    
    getSelectedTrackSlot() {
        const trackSelect = document.getElementById('library-track-select');
        const slotSelect = document.getElementById('library-slot-select');
        
        const trackIndex = trackSelect ? parseInt(trackSelect.value) : this.lastUsedTrack;
        const slotValue = slotSelect ? slotSelect.value : this.lastUsedSlot;
        const slotIndex = slotValue === 'next' ? undefined : parseInt(slotValue);
        
        return { trackIndex, slotIndex };
    }
    
    // ============================================================================
    // Search Autocomplete
    // ============================================================================
    
    setupSearchAutocomplete() {
        const searchInput = document.getElementById('media-search');
        if (!searchInput) return;
        
        // Create suggestions dropdown
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer) return;
        
        let suggestionsVisible = false;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            if (query.length === 0) {
                suggestionsContainer.style.display = 'none';
                suggestionsVisible = false;
                return;
            }
            
            // Show recent searches
            const recent = this.recentSearches.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
            const suggestions = this.generateSearchSuggestions(query);
            
            if (recent.length > 0 || suggestions.length > 0) {
                this.showSearchSuggestions(recent, suggestions, suggestionsContainer);
                suggestionsVisible = true;
            } else {
                suggestionsContainer.style.display = 'none';
                suggestionsVisible = false;
            }
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' && suggestionsVisible) {
                e.preventDefault();
                const firstSuggestion = suggestionsContainer.querySelector('.search-suggestion');
                if (firstSuggestion) firstSuggestion.focus();
            }
        });
        
        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
                suggestionsVisible = false;
            }
        });
    }
    
    generateSearchSuggestions(query) {
        // Generate smart suggestions based on query
        const suggestions = [];
        const lowerQuery = query.toLowerCase();
        
        // BPM suggestions
        if (lowerQuery.includes('bpm') || /^\d+$/.test(query)) {
            const bpm = parseInt(query) || 120;
            suggestions.push(`BPM:${bpm}`);
            suggestions.push(`BPM:${bpm}-${bpm + 20}`);
        }
        
        // Key suggestions
        if (lowerQuery.length <= 2 && /^[a-gA-G]#?$/.test(query)) {
            suggestions.push(`key:${query.toUpperCase()}`);
        }
        
        // Common patterns
        const patterns = ['kick', 'snare', 'hat', 'bass', 'lead', 'pad', 'vocal'];
        patterns.forEach(pattern => {
            if (lowerQuery.includes(pattern)) {
                suggestions.push(`name:${pattern}`);
            }
        });
        
        return suggestions.slice(0, 5);
    }
    
    showSearchSuggestions(recent, suggestions, container) {
        container.innerHTML = '';
        
        if (recent.length > 0) {
            const recentGroup = document.createElement('div');
            recentGroup.className = 'suggestion-group';
            recentGroup.innerHTML = '<div class="suggestion-label">Recent</div>';
            recent.forEach(search => {
                const item = document.createElement('div');
                item.className = 'search-suggestion';
                item.textContent = search;
                item.tabIndex = 0;
                item.addEventListener('click', () => {
                    document.getElementById('media-search').value = search;
                    if (window.performLibrarySearch) {
                        window.performLibrarySearch(search);
                    }
                    container.style.display = 'none';
                });
                recentGroup.appendChild(item);
            });
            container.appendChild(recentGroup);
        }
        
        if (suggestions.length > 0) {
            const suggestionsGroup = document.createElement('div');
            suggestionsGroup.className = 'suggestion-group';
            suggestionsGroup.innerHTML = '<div class="suggestion-label">Suggestions</div>';
            suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'search-suggestion';
                item.textContent = suggestion;
                item.tabIndex = 0;
                item.addEventListener('click', () => {
                    document.getElementById('media-search').value = suggestion;
                    if (window.performLibrarySearch) {
                        window.performLibrarySearch(suggestion);
                    }
                    container.style.display = 'none';
                });
                suggestionsGroup.appendChild(item);
            });
            container.appendChild(suggestionsGroup);
        }
        
        container.style.display = 'block';
    }
    
    loadRecentSearches() {
        try {
            const saved = localStorage.getItem('library_recentSearches');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }
    
    saveRecentSearch(query) {
        if (!query || query.trim() === '') return;
        
        // Remove if exists
        this.recentSearches = this.recentSearches.filter(s => s !== query);
        // Add to front
        this.recentSearches.unshift(query);
        // Keep last 10
        this.recentSearches = this.recentSearches.slice(0, 10);
        
        try {
            localStorage.setItem('library_recentSearches', JSON.stringify(this.recentSearches));
        } catch (e) {
            console.warn('[LibraryWorkflow] Failed to save recent searches:', e);
        }
    }
    
    // ============================================================================
    // Quick Actions
    // ============================================================================
    
    setupQuickActions() {
        // Quick actions are handled via keyboard shortcuts
        // Also add visual indicators
    }
    
    quickInsert() {
        const selected = document.querySelector('.browser-item.selected');
        if (!selected) {
            if (typeof addAction === 'function') {
                addAction('No item selected', 'warning');
            }
            return;
        }
        
        const { trackIndex, slotIndex } = this.getSelectedTrackSlot();
        const mediaId = selected.dataset.mediaId;
        const mediaType = selected.dataset.mediaType || 'audio';
        
        if (window.sergikAPI) {
            window.sergikAPI.createClip({
                track_index: trackIndex,
                slot_index: slotIndex !== undefined ? slotIndex : 'next',
                clip_type: mediaType
            }).then(result => {
                if (typeof addAction === 'function') {
                    if (result && result.success) {
                        addAction('Media inserted', 'success');
                    } else {
                        addAction(`Insert failed: ${result?.error || 'Unknown error'}`, 'error');
                    }
                }
            }).catch(err => {
                if (typeof addAction === 'function') {
                    addAction(`Insert failed: ${err.message}`, 'error');
                }
            });
        }
    }
    
    quickReplace() {
        const selected = document.querySelector('.browser-item.selected');
        if (!selected) {
            if (typeof addAction === 'function') {
                addAction('No item selected', 'warning');
            }
            return;
        }
        
        const { trackIndex, slotIndex } = this.getSelectedTrackSlot();
        if (slotIndex === undefined) {
            if (typeof addAction === 'function') {
                addAction('Please select a slot to replace', 'warning');
            }
            return;
        }
        
        const mediaId = selected.dataset.mediaId;
        
        if (window.sergikAPI) {
            window.sergikAPI.browserLoad({
                item_id: mediaId,
                track_index: trackIndex,
                slot_index: slotIndex
            }).then(result => {
                if (typeof addAction === 'function') {
                    if (result && result.success) {
                        addAction('Media replaced', 'success');
                    } else {
                        addAction(`Replace failed: ${result?.error || 'Unknown error'}`, 'error');
                    }
                }
            }).catch(err => {
                if (typeof addAction === 'function') {
                    addAction(`Replace failed: ${err.message}`, 'error');
                }
            });
        }
    }
    
    quickDuplicate() {
        const selected = document.querySelector('.browser-item.selected');
        if (!selected) {
            if (typeof addAction === 'function') {
                addAction('No item selected', 'warning');
            }
            return;
        }
        
        const { trackIndex, slotIndex } = this.getSelectedTrackSlot();
        if (slotIndex === undefined) {
            if (typeof addAction === 'function') {
                addAction('Please select a slot to duplicate', 'warning');
            }
            return;
        }
        
        if (window.sergikAPI) {
            window.sergikAPI.duplicateClip({
                track_index: trackIndex,
                slot_index: slotIndex,
                target_slot: slotIndex + 1
            }).then(result => {
                if (typeof addAction === 'function') {
                    if (result && result.success) {
                        addAction('Clip duplicated', 'success');
                    } else {
                        addAction(`Duplicate failed: ${result?.error || 'Unknown error'}`, 'error');
                    }
                }
            }).catch(err => {
                if (typeof addAction === 'function') {
                    addAction(`Duplicate failed: ${err.message}`, 'error');
                }
            });
        }
    }
    
    togglePreview() {
        const selected = document.querySelector('.browser-item.selected');
        if (!selected) {
            if (typeof addAction === 'function') {
                addAction('No item selected for preview', 'warning');
            }
            return;
        }
        
        // Toggle preview play/stop
        if (window.handlePreview) {
            const isPlaying = document.getElementById('preview-play')?.classList.contains('active');
            window.handlePreview(isPlaying ? 'stop' : 'play');
        }
    }
    
    // ============================================================================
    // Smart Defaults
    // ============================================================================
    
    setupSmartDefaults() {
        // Track/slot defaults are handled in setupTrackSlotSelector
        // Also update when actions are performed
    }
    
    // ============================================================================
    // Visual Feedback
    // ============================================================================
    
    updateMetadataDisplay(item) {
        if (!item) return;
        
        // Update clip info display
        const bpmEl = document.getElementById('clip-info-bpm');
        const keyEl = document.getElementById('clip-info-key');
        const lengthEl = document.getElementById('clip-info-length');
        
        // Try to get metadata from item data attributes
        const bpm = item.dataset.bpm || '120';
        const key = item.dataset.key || 'C';
        const duration = item.dataset.duration || 0;
        const length = duration > 0 ? `${Math.round(duration / 4)} bars` : '4 bars';
        
        if (bpmEl) bpmEl.textContent = bpm;
        if (keyEl) keyEl.textContent = key;
        if (lengthEl) lengthEl.textContent = length;
    }
    
    // ============================================================================
    // Batch Operations
    // ============================================================================
    
    batchInsert() {
        if (this.selectedItems.size === 0) {
            if (typeof addAction === 'function') {
                addAction('No items selected', 'warning');
            }
            return;
        }
        
        const { trackIndex, slotIndex } = this.getSelectedTrackSlot();
        let currentSlot = slotIndex !== undefined ? slotIndex : 0;
        let successCount = 0;
        let failCount = 0;
        
        const items = Array.from(this.selectedItems);
        if (!window.sergikAPI) {
            if (typeof addAction === 'function') {
                addAction('API not available', 'error');
            }
            return;
        }
        
        const promises = items.map(item => {
            const mediaId = item.dataset.mediaId;
            const mediaType = item.dataset.mediaType || 'audio';
            const targetSlot = slotIndex === undefined ? 'next' : currentSlot++;
            
            return window.sergikAPI.createClip({
                track_index: trackIndex,
                slot_index: targetSlot,
                clip_type: mediaType
            }).then(result => {
                if (result && result.success) successCount++;
                else failCount++;
            }).catch(() => {
                failCount++;
            });
        });
        
        Promise.all(promises).then(() => {
            if (typeof addAction === 'function') {
                addAction(`Inserted ${successCount} item(s)${failCount > 0 ? `, ${failCount} failed` : ''}`, 
                    failCount > 0 ? 'warning' : 'success');
            }
            this.selectedItems.clear();
            document.querySelectorAll('.browser-item').forEach(i => i.classList.remove('selected'));
            this.updateSelectionCount();
        });
    }
}

// Export
if (typeof window !== 'undefined') {
    window.LibraryWorkflowOptimizer = LibraryWorkflowOptimizer;
}

