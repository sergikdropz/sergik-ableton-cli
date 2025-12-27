/**
 * Search Enhancements
 * Autocomplete, search history, and search suggestions
 */

class SearchEnhancements {
    constructor() {
        this.searchHistory = this.loadSearchHistory();
        this.maxHistory = 20;
        this.suggestions = [];
        this.autocompleteContainer = null;
        this.setupAutocomplete();
    }
    
    loadSearchHistory() {
        try {
            const stored = localStorage.getItem('sergik-search-history');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[Search] Failed to load search history:', error);
            return [];
        }
    }
    
    saveSearchHistory() {
        try {
            localStorage.setItem('sergik-search-history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('[Search] Failed to save search history:', error);
        }
    }
    
    addToHistory(query) {
        if (!query || query.trim() === '') return;
        
        const trimmed = query.trim();
        
        // Remove if already exists
        const index = this.searchHistory.indexOf(trimmed);
        if (index > -1) {
            this.searchHistory.splice(index, 1);
        }
        
        // Add to beginning
        this.searchHistory.unshift(trimmed);
        
        // Limit size
        if (this.searchHistory.length > this.maxHistory) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistory);
        }
        
        this.saveSearchHistory();
    }
    
    setupAutocomplete() {
        const searchInput = document.getElementById('media-search');
        if (!searchInput) return;
        
        // Create autocomplete container
        this.autocompleteContainer = document.createElement('div');
        this.autocompleteContainer.id = 'search-autocomplete';
        this.autocompleteContainer.className = 'search-autocomplete';
        searchInput.parentElement.appendChild(this.autocompleteContainer);
        
        // Handle input
        searchInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });
        
        // Handle focus
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim() === '' && this.searchHistory.length > 0) {
                this.showHistory();
            } else if (searchInput.value.trim() !== '') {
                this.handleInput(searchInput.value);
            }
        });
        
        // Handle blur (hide autocomplete after a delay to allow clicks)
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideAutocomplete();
            }, 200);
        });
        
        // Handle keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSuggestions(e.key === 'ArrowDown' ? 1 : -1);
            } else if (e.key === 'Enter' && this.suggestions.length > 0) {
                e.preventDefault();
                this.selectSuggestion(0);
            } else if (e.key === 'Escape') {
                this.hideAutocomplete();
            }
        });
    }
    
    handleInput(query) {
        if (!query || query.trim() === '') {
            this.hideAutocomplete();
            return;
        }
        
        // Generate suggestions
        this.suggestions = this.generateSuggestions(query);
        this.showAutocomplete();
    }
    
    generateSuggestions(query) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();
        
        // Search history matches
        this.searchHistory.forEach(historyItem => {
            if (historyItem.toLowerCase().includes(lowerQuery) && historyItem !== query) {
                suggestions.push({
                    text: historyItem,
                    type: 'history',
                    icon: '🕒'
                });
            }
        });
        
        // Common search patterns
        const patterns = [
            'BPM:',
            'key:',
            'name:',
            'type:',
            'genre:'
        ];
        
        patterns.forEach(pattern => {
            if (lowerQuery.includes(pattern.toLowerCase())) {
                // Could add value suggestions here
            } else if (!lowerQuery.includes(':')) {
                // Suggest pattern if no pattern in query
                suggestions.push({
                    text: `${query} ${pattern}`,
                    type: 'pattern',
                    icon: '💡'
                });
            }
        });
        
        // Limit suggestions
        return suggestions.slice(0, 5);
    }
    
    showHistory() {
        if (this.searchHistory.length === 0) return;
        
        this.suggestions = this.searchHistory.slice(0, 10).map(item => ({
            text: item,
            type: 'history',
            icon: '🕒'
        }));
        
        this.showAutocomplete();
    }
    
    showAutocomplete() {
        if (!this.autocompleteContainer || this.suggestions.length === 0) {
            this.hideAutocomplete();
            return;
        }
        
        const searchInput = document.getElementById('media-search');
        if (!searchInput) return;
        
        const rect = searchInput.getBoundingClientRect();
        this.autocompleteContainer.style.top = `${rect.bottom + 4}px`;
        this.autocompleteContainer.style.left = `${rect.left}px`;
        this.autocompleteContainer.style.width = `${rect.width}px`;
        
        // Build HTML
        let html = '<div class="autocomplete-header">Suggestions</div>';
        this.suggestions.forEach((suggestion, index) => {
            html += `
                <div class="autocomplete-item" data-index="${index}">
                    <span class="autocomplete-icon">${suggestion.icon || '🔍'}</span>
                    <span class="autocomplete-text">${this.escapeHtml(suggestion.text)}</span>
                </div>
            `;
        });
        this.autocompleteContainer.innerHTML = html;
        this.autocompleteContainer.classList.add('show');
        
        // Add click handlers
        this.autocompleteContainer.querySelectorAll('.autocomplete-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectSuggestion(index);
            });
            
            item.addEventListener('mouseenter', () => {
                this.autocompleteContainer.querySelectorAll('.autocomplete-item').forEach(i => i.classList.remove('hover'));
                item.classList.add('hover');
            });
        });
    }
    
    hideAutocomplete() {
        if (this.autocompleteContainer) {
            this.autocompleteContainer.classList.remove('show');
        }
    }
    
    selectSuggestion(index) {
        if (index < 0 || index >= this.suggestions.length) return;
        
        const suggestion = this.suggestions[index];
        const searchInput = document.getElementById('media-search');
        
        if (searchInput) {
            searchInput.value = suggestion.text;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.focus();
        }
        
        this.hideAutocomplete();
    }
    
    navigateSuggestions(direction) {
        const items = this.autocompleteContainer?.querySelectorAll('.autocomplete-item');
        if (!items || items.length === 0) return;
        
        const current = this.autocompleteContainer.querySelector('.autocomplete-item.hover');
        let index = current ? Array.from(items).indexOf(current) : -1;
        
        index += direction;
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        
        items.forEach(item => item.classList.remove('hover'));
        items[index].classList.add('hover');
        items[index].scrollIntoView({ block: 'nearest' });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    clearHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
        if (window.showNotification) {
            window.showNotification('Search history cleared', 'info', 2000);
        }
    }
}

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.SearchEnhancements = SearchEnhancements;
    window.searchEnhancements = new SearchEnhancements();
    
    // Integrate with existing search
    const originalPerformLibrarySearch = window.performLibrarySearch;
    if (originalPerformLibrarySearch) {
        window.performLibrarySearch = async function(query) {
            // Add to history
            if (window.searchEnhancements) {
                window.searchEnhancements.addToHistory(query);
            }
            // Call original function
            return originalPerformLibrarySearch(query);
        };
    }
}

