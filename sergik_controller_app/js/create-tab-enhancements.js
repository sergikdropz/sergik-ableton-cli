/**
 * Create Tab Enhancements
 * Handles parameter presets, smart suggestions, batch generation, parameter history,
 * visual indicators, expandable menus, and media preview for the Create Tab
 */

class CreateTabEnhancements {
    constructor() {
        this.presets = this.loadPresets();
        this.parameterHistory = this.loadHistory();
        this.currentPreset = null;
        this.batchQueue = [];
        this.expandStates = this.loadExpandStates();
        this.dnaProfile = null;
        this.suggestionCache = new Map();
        this.generatedFiles = this.loadGeneratedFiles();
        
        // Debounced functions
        this.debouncedHistorySave = this.debounce(() => this.saveHistory(), 500);
        this.debouncedParameterTracking = this.debounce(() => this.addToHistory(), 500);
        
        // Initialize after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        // Wait for elements to be available
        if (!elements || !elements.genreSelect) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.setupPresets();
        this.setupSuggestions();
        this.setupBatchMode();
        this.setupHistory();
        this.setupParameterTracking();
        this.setupExpandableMenus();
        this.setupMediaPreview();
        this.setupGeneratedFilesPanel();
        this.loadDnaProfile();
    }
    
    // ==================== Preset Management ====================
    
    setupPresets() {
        // Preset buttons
        const presetButtons = document.querySelectorAll('.preset-btn[data-preset], .preset-item[data-preset]');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const presetName = btn.dataset.preset;
                this.loadPreset(presetName);
            });
        });
        
        // SERGIK DNA preset
        const dnaPresetBtn = document.getElementById('preset-dna');
        if (dnaPresetBtn) {
            dnaPresetBtn.addEventListener('click', () => this.loadDnaPreset());
        }
        
        // Random preset
        const randomPresetBtn = document.getElementById('preset-random');
        if (randomPresetBtn) {
            randomPresetBtn.addEventListener('click', () => this.loadRandomPreset());
        }
        
        // Save preset
        const savePresetBtn = document.getElementById('save-preset-btn');
        if (savePresetBtn) {
            savePresetBtn.addEventListener('click', () => this.saveCurrentPreset());
        }
        
        // Load preset dropdown (custom expandable dropdown)
        const presetDropdownToggle = document.getElementById('preset-dropdown-toggle');
        const presetDropdownMenu = document.getElementById('preset-dropdown-menu');
        if (presetDropdownToggle && presetDropdownMenu) {
            presetDropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                presetDropdownMenu.classList.toggle('collapsed');
                const icon = presetDropdownToggle.querySelector('.expand-icon');
                if (icon) icon.textContent = presetDropdownMenu.classList.contains('collapsed') ? '▼' : '▲';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!presetDropdownToggle.contains(e.target) && !presetDropdownMenu.contains(e.target)) {
                    presetDropdownMenu.classList.add('collapsed');
                    const icon = presetDropdownToggle.querySelector('.expand-icon');
                    if (icon) icon.textContent = '▼';
                }
            });
            
            // Handle preset item clicks (delegated to handle dynamically added items)
            presetDropdownMenu.addEventListener('click', (e) => {
                const item = e.target.closest('.preset-dropdown-item');
                if (!item) return;
                
                e.stopPropagation();
                const presetName = item.dataset.preset;
                if (presetName === 'random_dna') {
                    this.loadRandomDnaPreset();
                } else {
                    this.loadPreset(presetName);
                }
                presetDropdownMenu.classList.add('collapsed');
                const icon = presetDropdownToggle.querySelector('.expand-icon');
                if (icon) icon.textContent = '▼';
                const toggleSpan = presetDropdownToggle.querySelector('span:not(.expand-icon)');
                if (toggleSpan) toggleSpan.textContent = item.textContent;
            });
        }
        
        // Preset search
        const presetSearch = document.getElementById('preset-search');
        if (presetSearch) {
            presetSearch.addEventListener('input', (e) => {
                this.filterPresets(e.target.value);
            });
        }
        
        // Populate custom presets in dropdown
        this.populateCustomPresetsDropdown();
    }
    
    loadPreset(name) {
        const preset = this.presets[name] || this.getDefaultPreset(name);
        if (!preset) return;
        
        // Apply preset values
        if (preset.genre && elements.genreSelect) elements.genreSelect.value = preset.genre;
        if (preset.tempo && elements.tempoSelect) elements.tempoSelect.value = preset.tempo;
        if (preset.energy && elements.energySelect) elements.energySelect.value = preset.energy;
        if (preset.key && elements.keySelect) elements.keySelect.value = preset.key;
        if (preset.scale && elements.scaleSelect) elements.scaleSelect.value = preset.scale;
        if (preset.intelligence && elements.intelligenceSelect) {
            elements.intelligenceSelect.value = preset.intelligence;
        }
        
        // Trigger change events
        if (elements.genreSelect) {
            elements.genreSelect.dispatchEvent(new Event('change'));
        }
        
        // Visual feedback
        document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-preset="${name}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        this.currentPreset = name;
        this.addToHistory();
        
        if (window.showNotification) {
            window.showNotification(`Loaded ${preset.name || name} preset`, 'success', 2000);
        }
    }
    
    loadDnaPreset() {
        if (!this.dnaProfile) {
            this.loadDnaProfile();
        }
        
        const dna = this.dnaProfile?.dna || {};
        const intelligence = this.dnaProfile?.intelligence || {};
        
        // Generate preset from DNA
        const preset = {
            name: 'SERGIK DNA',
            genre: this.getDnaGenre(),
            tempo: this.getDnaTempo(),
            energy: dna.energy?.average || 7,
            key: this.getDnaKey(),
            scale: this.getDnaScale(),
            intelligence: this.getDnaIntelligence()
        };
        
        this.applyPreset(preset);
        this.currentPreset = 'sergik_dna';
        
        if (window.showNotification) {
            window.showNotification('Loaded SERGIK DNA preset', 'success', 2000);
        }
    }
    
    loadRandomPreset() {
        const allPresets = Object.keys(this.presets).concat(Object.keys(this.getDefaultPresets()));
        if (allPresets.length === 0) return;
        
        const randomName = allPresets[Math.floor(Math.random() * allPresets.length)];
        this.loadPreset(randomName);
    }
    
    loadRandomDnaPreset() {
        if (!this.dnaProfile) {
            this.loadDnaProfile();
        }
        
        // Generate random preset within DNA ranges
        const preset = {
            name: 'Random SERGIK DNA',
            genre: this.getDnaGenre(),
            tempo: this.getDnaTempo(),
            energy: this.getRandomDnaEnergy(),
            key: this.getDnaKey(),
            scale: this.getDnaScale(),
            intelligence: this.getDnaIntelligence()
        };
        
        this.applyPreset(preset);
        this.currentPreset = 'random_dna';
        
        if (window.showNotification) {
            window.showNotification('Loaded Random SERGIK DNA preset', 'success', 2000);
        }
    }
    
    getRandomDnaEnergy() {
        const energy = this.dnaProfile?.dna?.energy;
        if (!energy) return 6;
        
        const sweetSpot = energy.sweet_spot || [5, 7];
        return Math.floor(Math.random() * (sweetSpot[1] - sweetSpot[0] + 1)) + sweetSpot[0];
    }
    
    getDnaGenre() {
        const genres = this.dnaProfile?.dna?.genres || {};
        const entries = Object.entries(genres);
        if (entries.length === 0) return 'house';
        
        // Weighted random selection
        const total = entries.reduce((sum, [, pct]) => sum + pct, 0);
        let random = Math.random() * total;
        
        for (const [genre, pct] of entries) {
            random -= pct;
            if (random <= 0) return genre;
        }
        return entries[0][0];
    }
    
    getDnaTempo() {
        const bpm = this.dnaProfile?.dna?.bpm;
        if (!bpm) return 124;
        
        const zones = bpm.zones || {};
        const avg = bpm.average || 104;
        
        // Random within zones or use average
        if (Math.random() > 0.5 && zones.downtempo) {
            const range = zones.downtempo.range || [80, 90];
            return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
        } else if (zones.house) {
            const range = zones.house.range || [120, 129];
            return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
        }
        
        return Math.floor(avg);
    }
    
    getDnaKey() {
        const keys = this.dnaProfile?.dna?.keys;
        if (!keys) return '10B';
        
        const distribution = keys.distribution || {};
        const entries = Object.entries(distribution);
        if (entries.length === 0) return '10B';
        
        // Weighted random
        const total = entries.reduce((sum, [, pct]) => sum + pct, 0);
        let random = Math.random() * total;
        
        for (const [key, pct] of entries) {
            random -= pct;
            if (random <= 0) return key;
        }
        return entries[0][0];
    }
    
    getDnaScale() {
        const key = this.getDnaKey();
        // Major keys end with B, minor with A
        return key.endsWith('B') ? 'major' : 'minor';
    }
    
    getDnaIntelligence() {
        const intelligence = this.dnaProfile?.intelligence;
        if (!intelligence) return 'groovy';
        
        const emotional = intelligence.emotional_profile?.primary_emotions || {};
        const entries = Object.entries(emotional);
        if (entries.length === 0) return 'groovy';
        
        // Weighted random
        const total = entries.reduce((sum, [, count]) => sum + count, 0);
        let random = Math.random() * total;
        
        for (const [intel, count] of entries) {
            random -= count;
            if (random <= 0) return intel;
        }
        return entries[0][0];
    }
    
    applyPreset(preset) {
        if (!elements || !elements.genreSelect) return;
        
        if (preset.genre && elements.genreSelect) elements.genreSelect.value = preset.genre;
        if (preset.tempo && elements.tempoSelect) elements.tempoSelect.value = preset.tempo;
        if (preset.energy && elements.energySelect) elements.energySelect.value = preset.energy;
        if (preset.key && elements.keySelect) elements.keySelect.value = preset.key;
        if (preset.scale && elements.scaleSelect) elements.scaleSelect.value = preset.scale;
        
        const intelligenceSelect = document.getElementById('intelligence-select');
        if (preset.intelligence && intelligenceSelect) {
            intelligenceSelect.value = preset.intelligence;
        }
        
        if (elements.genreSelect) {
            elements.genreSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    saveCurrentPreset() {
        const name = prompt('Enter preset name:');
        if (!name) return;
        
        const preset = {
            name: name,
            genre: elements.genreSelect?.value,
            tempo: elements.tempoSelect?.value,
            energy: elements.energySelect?.value,
            key: elements.keySelect?.value,
            scale: elements.scaleSelect?.value,
            intelligence: elements.intelligenceSelect?.value,
            timestamp: Date.now()
        };
        
        const key = name.toLowerCase().replace(/\s+/g, '_');
        this.presets[key] = preset;
        this.savePresets();
        
        // Add preset button dynamically
        this.addPresetButton(name, preset);
        this.populateCustomPresetsDropdown();
        
        if (window.showNotification) {
            window.showNotification(`Saved "${name}" preset`, 'success', 2000);
        }
    }
    
    filterPresets(query) {
        if (!query) {
            document.getElementById('preset-search-results')?.classList.add('collapsed');
            return;
        }
        
        const results = this.searchPresets(query);
        this.displaySearchResults(results);
        document.getElementById('preset-search-results')?.classList.remove('collapsed');
    }
    
    searchPresets(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        // Search default presets
        const defaults = this.getDefaultPresets();
        for (const [key, preset] of Object.entries(defaults)) {
            if (preset.name?.toLowerCase().includes(lowerQuery) ||
                preset.genre?.toLowerCase().includes(lowerQuery) ||
                key.toLowerCase().includes(lowerQuery)) {
                results.push({ key, preset, category: this.getPresetCategory(key) });
            }
        }
        
        // Search custom presets
        for (const [key, preset] of Object.entries(this.presets)) {
            if (preset.name?.toLowerCase().includes(lowerQuery) ||
                preset.genre?.toLowerCase().includes(lowerQuery) ||
                key.toLowerCase().includes(lowerQuery)) {
                results.push({ key, preset, category: 'Custom' });
            }
        }
        
        return results;
    }
    
    displaySearchResults(results) {
        const container = document.getElementById('preset-search-results-list');
        if (!container) return;
        
        // Group by category
        const grouped = {};
        results.forEach(({ key, preset, category }) => {
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push({ key, preset });
        });
        
        container.innerHTML = '';
        
        for (const [category, items] of Object.entries(grouped)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'preset-search-category';
            categoryDiv.innerHTML = `
                <div class="preset-category-header" data-category="${category}">
                    <span>${category}</span>
                    <span class="expand-icon">▼</span>
                </div>
                <div class="preset-category-content collapsed">
                    ${items.map(({ key, preset }) => `
                        <div class="preset-search-item preset-item" data-preset="${key}" data-preset-name="${key}" data-context-menu="preset-item">
                            <span>${preset.name || key}</span>
                            <button class="btn-icon-small">Load</button>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(categoryDiv);
        }
        
        // Setup click handlers
        container.querySelectorAll('.preset-search-item').forEach(item => {
            item.addEventListener('click', () => {
                const presetKey = item.dataset.preset;
                this.loadPreset(presetKey);
            });
        });
    }
    
    getPresetCategory(key) {
        if (key === 'sergik_dna') return 'SERGIK DNA';
        if (['tech_house', 'hiphop', 'techno', 'ambient'].includes(key)) return 'Standard';
        if (['groovy', 'chill', 'intense', 'social', 'creative', 'dance_floor', 'background', 'workout'].includes(key)) {
            return 'Intelligence';
        }
        return 'Custom';
    }
    
    populateCustomPresetsDropdown() {
        const customCategory = document.getElementById('preset-category-custom');
        const customContent = document.getElementById('preset-category-custom-content');
        if (!customCategory || !customContent) return;
        
        // Get all default preset keys
        const defaultPresets = this.getDefaultPresets();
        const defaultKeys = new Set(Object.keys(defaultPresets));
        defaultKeys.add('sergik_dna');
        defaultKeys.add('random_dna');
        
        // Filter custom presets (not in defaults)
        const customPresets = Object.entries(this.presets).filter(([key]) => !defaultKeys.has(key));
        
        if (customPresets.length === 0) {
            customCategory.style.display = 'none';
            return;
        }
        
        // Show category and populate content
        customCategory.style.display = 'block';
        customContent.innerHTML = customPresets.map(([key, preset]) => `
            <div class="preset-dropdown-item preset-item" data-preset="${key}" data-preset-name="${key}" data-context-menu="preset-item">${preset.name || key}</div>
        `).join('');
        
        // Setup click handlers for dynamically added items
        customContent.querySelectorAll('.preset-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const presetName = item.dataset.preset;
                this.loadPreset(presetName);
                const dropdownMenu = document.getElementById('preset-dropdown-menu');
                if (dropdownMenu) dropdownMenu.classList.add('collapsed');
                const toggleSpan = document.querySelector('#preset-dropdown-toggle span:not(.expand-icon)');
                if (toggleSpan) toggleSpan.textContent = item.textContent;
            });
        });
    }
    
    addPresetButton(name, preset) {
        const grid = document.querySelector('.presets-grid');
        if (!grid) return;
        
        const btn = document.createElement('button');
        btn.className = 'preset-btn preset-item';
        const presetKey = name.toLowerCase().replace(/\s+/g, '_');
        btn.dataset.preset = presetKey;
        btn.dataset.presetName = presetKey;
        btn.setAttribute('data-context-menu', 'preset-item');
        btn.innerHTML = `
            <span class="preset-icon">💾</span>
            <span class="preset-name">${name}</span>
        `;
        btn.addEventListener('click', () => this.loadPreset(btn.dataset.preset));
        grid.appendChild(btn);
    }
    
    // ==================== Smart Suggestions ====================
    
    setupSuggestions() {
        if (!elements || !elements.genreSelect) {
            setTimeout(() => this.setupSuggestions(), 100);
            return;
        }
        
        elements.genreSelect.addEventListener('change', () => {
            this.updateSuggestions();
        });
        
        const closeBtn = document.getElementById('close-suggestions');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const panel = document.getElementById('parameter-suggestions');
                if (panel) panel.classList.add('collapsed');
            });
        }
    }
    
    updateSuggestions() {
        const genre = elements.genreSelect?.value;
        if (!genre) return;
        
        const suggestions = this.getSuggestionsForGenre(genre);
        if (!suggestions || suggestions.length === 0) {
            document.getElementById('parameter-suggestions')?.classList.add('collapsed');
            return;
        }
        
        const panel = document.getElementById('parameter-suggestions');
        if (panel) {
            panel.classList.remove('collapsed');
            this.renderSuggestions(suggestions);
        }
    }
    
    getSuggestionsForGenre(genre) {
        // Check cache
        if (this.suggestionCache.has(genre)) {
            return this.suggestionCache.get(genre);
        }
        
        const genreSuggestions = {
            'tech_house': { key: '10B', tempo: 124, energy: 7 },
            'hiphop': { key: '7A', tempo: 85, energy: 5 },
            'techno': { key: '7A', tempo: 130, energy: 8 },
            'ambient': { key: '10B', tempo: 90, energy: 2 },
            'house': { key: '10B', tempo: 124, energy: 6 },
            'deep_house': { key: '10B', tempo: 120, energy: 5 },
            'disco': { key: '11B', tempo: 120, energy: 6 },
            'progressive_house': { key: '10B', tempo: 128, energy: 7 },
            'minimal': { key: '7A', tempo: 125, energy: 6 },
            'trance': { key: '12B', tempo: 138, energy: 8 },
            'hard_techno': { key: '7A', tempo: 140, energy: 9 },
            'acid_house': { key: '7A', tempo: 125, energy: 7 },
            'boom_bap': { key: '7A', tempo: 90, energy: 5 },
            'trap': { key: '7A', tempo: 140, energy: 8 },
            'lo_fi': { key: '7A', tempo: 80, energy: 3 },
            'dnb': { key: '7A', tempo: 174, energy: 9 },
            'jungle': { key: '7A', tempo: 160, energy: 8 },
            'reggaeton': { key: '7A', tempo: 90, energy: 6 },
            'funk': { key: '10B', tempo: 100, energy: 6 },
            'soul': { key: '11B', tempo: 95, energy: 5 },
            'jazz': { key: '10B', tempo: 120, energy: 4 }
        };
        
        const suggestion = genreSuggestions[genre];
        if (suggestion) {
            this.suggestionCache.set(genre, [suggestion]);
            return [suggestion];
        }
        
        return null;
    }
    
    renderSuggestions(suggestions) {
        const container = document.getElementById('suggestions-content');
        if (!container || !suggestions || suggestions.length === 0) return;
        
        const suggestion = suggestions[0];
        container.innerHTML = `
            <div class="suggestion-section">
                <div class="suggestion-item" data-action="apply-key">
                    <span class="suggestion-label">Recommended Key:</span>
                    <span class="suggestion-value">${suggestion.key}</span>
                    <button class="suggestion-apply">Apply</button>
                </div>
            </div>
            <div class="suggestion-section">
                <div class="suggestion-item" data-action="apply-tempo">
                    <span class="suggestion-label">Recommended Tempo:</span>
                    <span class="suggestion-value">${suggestion.tempo} BPM</span>
                    <button class="suggestion-apply">Apply</button>
                </div>
            </div>
            <div class="suggestion-section">
                <div class="suggestion-item" data-action="apply-energy">
                    <span class="suggestion-label">Recommended Energy:</span>
                    <span class="suggestion-value">${suggestion.energy}</span>
                    <button class="suggestion-apply">Apply</button>
                </div>
            </div>
        `;
        
        // Setup apply buttons
        container.querySelectorAll('.suggestion-apply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.suggestion-item');
                const action = item.dataset.action;
                this.applySuggestion(action, suggestion);
            });
        });
    }
    
    applySuggestion(action, suggestion) {
        switch (action) {
            case 'apply-key':
                if (elements.keySelect && suggestion.key) {
                    elements.keySelect.value = suggestion.key;
                    elements.keySelect.dispatchEvent(new Event('change'));
                }
                break;
            case 'apply-tempo':
                if (elements.tempoSelect && suggestion.tempo) {
                    elements.tempoSelect.value = suggestion.tempo;
                    elements.tempoSelect.dispatchEvent(new Event('change'));
                }
                break;
            case 'apply-energy':
                if (elements.energySelect && suggestion.energy) {
                    elements.energySelect.value = suggestion.energy;
                    elements.energySelect.dispatchEvent(new Event('change'));
                }
                break;
        }
        
        this.addToHistory();
    }
    
    // ==================== Batch Mode ====================
    
    addToBatchQueue(type, subCategory = null) {
        const queueItem = {
            type: type,
            subCategory: subCategory,
            id: `${type}${subCategory ? '-' + subCategory : ''}-${Date.now()}`,
            timestamp: Date.now()
        };
        
        this.batchQueue.push(queueItem);
        this.updateBatchQueueDisplay();
        
        if (window.showNotification) {
            const label = subCategory ? 
                this.getSubCategories(type).find(s => s.id === subCategory)?.label || subCategory :
                type.toUpperCase();
            window.showNotification(`Added ${label} to batch queue`, 'success', 1500);
        }
    }
    
    updateBatchQueueDisplay() {
        const list = document.getElementById('batch-queue-list');
        const count = document.querySelector('.batch-queue-count');
        if (!list) return;
        
        if (count) {
            count.textContent = `Batch Queue (${this.batchQueue.length})`;
        }
        
        list.innerHTML = '';
        
        this.batchQueue.forEach((item, index) => {
            const queueItem = document.createElement('div');
            queueItem.className = 'batch-queue-item';
            queueItem.setAttribute('data-context-menu', 'batch-item');
            queueItem.dataset.index = index;
            queueItem.style.cssText = `
                padding: 6px 8px;
                background: var(--bg-dark);
                border: 1px solid var(--border-color);
                border-radius: 2px;
                margin-bottom: 4px;
                font-size: 9px;
                font-family: 'JetBrains Mono', monospace;
            `;
            
            const mainLine = document.createElement('div');
            mainLine.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
            
            const label = document.createElement('span');
            if (item.subCategory) {
                const subCat = this.getSubCategories(item.type).find(s => s.id === item.subCategory);
                label.textContent = subCat ? subCat.label : `${item.type} - ${item.subCategory}`;
            } else {
                label.textContent = item.type.toUpperCase();
            }
            label.style.color = 'var(--text-primary)';
            
            const actions = document.createElement('div');
            actions.style.cssText = 'display: flex; gap: 4px;';
            
            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.style.cssText = `
                background: var(--accent-red);
                border: none;
                color: white;
                width: 18px;
                height: 18px;
                border-radius: 2px;
                cursor: pointer;
                font-size: 12px;
                line-height: 1;
            `;
            removeBtn.addEventListener('click', () => this.removeFromBatchQueue(index));
            
            actions.appendChild(removeBtn);
            mainLine.appendChild(label);
            mainLine.appendChild(actions);
            queueItem.appendChild(mainLine);
            list.appendChild(queueItem);
        });
    }
    
    removeFromBatchQueue(index) {
        this.batchQueue.splice(index, 1);
        this.updateBatchQueueDisplay();
    }
    
    moveInBatchQueue(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.batchQueue.length) return;
        
        [this.batchQueue[index], this.batchQueue[newIndex]] = [this.batchQueue[newIndex], this.batchQueue[index]];
        this.updateBatchQueueDisplay();
    }
    
    async executeBatch() {
        if (this.batchQueue.length === 0) return;
        
        const executeBtn = document.getElementById('execute-batch');
        if (executeBtn) executeBtn.disabled = true;
        
        if (window.showNotification) {
            window.showNotification(`Executing batch: ${this.batchQueue.length} items`, 'info', 2000);
        }
        
        for (let i = 0; i < this.batchQueue.length; i++) {
            const item = this.batchQueue[i];
            
            // Update status
            if (window.showNotification) {
                const label = item.subCategory ? 
                    this.getSubCategories(item.type).find(s => s.id === item.subCategory)?.label || item.subCategory :
                    item.type.toUpperCase();
                window.showNotification(`Generating ${i + 1}/${this.batchQueue.length}: ${label}`, 'info', 1000);
            }
            
            // Call handleGenerate with sub-category info
            if (window.handleGenerate) {
                await window.handleGenerate(item.type, item.subCategory);
            }
            
            // Small delay between items
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (executeBtn) executeBtn.disabled = false;
        
        if (window.showNotification) {
            window.showNotification(`Batch complete: ${this.batchQueue.length} items generated`, 'success', 3000);
        }
        
        this.clearBatch();
    }
    
    clearBatch() {
        this.batchQueue = [];
        this.updateBatchQueueDisplay();
    }
    
    // ==================== Parameter History ====================
    
    setupHistory() {
        this.addToHistory(); // Save initial state
        
        const toggleBtn = document.getElementById('toggle-history');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const panel = document.getElementById('parameter-history');
                if (panel) {
                    panel.classList.toggle('collapsed');
                    toggleBtn.textContent = panel.classList.contains('collapsed') ? '▼' : '▲';
                }
            });
        }
    }
    
    addToHistory() {
        if (!elements.genreSelect) return;
        
        const params = {
            genre: elements.genreSelect?.value,
            tempo: elements.tempoSelect?.value,
            energy: elements.energySelect?.value,
            key: elements.keySelect?.value,
            scale: elements.scaleSelect?.value,
            intelligence: elements.intelligenceSelect?.value,
            timestamp: Date.now()
        };
        
        // Don't add if identical to last entry
        if (this.parameterHistory.length > 0) {
            const last = this.parameterHistory[0];
            if (JSON.stringify(params) === JSON.stringify({ ...last, timestamp: params.timestamp })) {
                return;
            }
        }
        
        this.parameterHistory.unshift(params);
        if (this.parameterHistory.length > 10) {
            this.parameterHistory.pop();
        }
        
        this.debouncedHistorySave();
        this.updateHistoryDisplay();
    }
    
    updateHistoryDisplay() {
        const list = document.getElementById('history-list');
        if (!list) return;
        
        list.innerHTML = this.parameterHistory.map((params, index) => {
            const date = new Date(params.timestamp);
            const timeStr = date.toLocaleTimeString();
            return `
                <div class="history-item-expandable">
                    <div class="history-item-header" data-index="${index}">
                        <span>${timeStr}</span>
                        <div class="history-item-actions">
                            <button class="btn-icon-small history-restore" data-index="${index}">↻</button>
                            <button class="btn-icon-small history-delete" data-index="${index}">×</button>
                            <span class="expand-icon">▼</span>
                        </div>
                    </div>
                    <div class="history-item-details collapsed">
                        <div>Genre: ${params.genre || 'N/A'}</div>
                        <div>Tempo: ${params.tempo || 'N/A'} BPM</div>
                        <div>Energy: ${params.energy || 'N/A'}</div>
                        <div>Key: ${params.key || 'N/A'}</div>
                        <div>Scale: ${params.scale || 'N/A'}</div>
                        <div>Intelligence: ${params.intelligence || 'N/A'}</div>
                        <button class="btn-small history-duplicate" data-index="${index}">Duplicate</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Setup handlers
        list.querySelectorAll('.history-restore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.restoreFromHistory(index);
            });
        });
        
        list.querySelectorAll('.history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteFromHistory(index);
            });
        });
        
        list.querySelectorAll('.history-duplicate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.duplicateHistoryItem(index);
            });
        });
        
        // Expandable items
        list.querySelectorAll('.history-item-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.classList.contains('history-restore') || 
                    e.target.classList.contains('history-delete')) return;
                const item = header.closest('.history-item-expandable');
                const details = item.querySelector('.history-item-details');
                if (details) {
                    details.classList.toggle('collapsed');
                    const icon = header.querySelector('.expand-icon');
                    if (icon) icon.textContent = details.classList.contains('collapsed') ? '▼' : '▲';
                }
            });
        });
    }
    
    restoreFromHistory(index) {
        const params = this.parameterHistory[index];
        if (!params) return;
        
        this.applyPreset(params);
        // Don't add to history immediately when restoring (avoid duplicate)
        setTimeout(() => this.addToHistory(), 100);
        
        if (window.showNotification) {
            window.showNotification('Restored parameters from history', 'success', 2000);
        }
    }
    
    deleteFromHistory(index) {
        this.parameterHistory.splice(index, 1);
        this.saveHistory();
        this.updateHistoryDisplay();
    }
    
    duplicateHistoryItem(index) {
        const params = { ...this.parameterHistory[index], timestamp: Date.now() };
        this.parameterHistory.unshift(params);
        if (this.parameterHistory.length > 10) {
            this.parameterHistory.pop();
        }
        this.saveHistory();
        this.updateHistoryDisplay();
    }
    
    // ==================== Parameter Tracking ====================
    
    setupParameterTracking() {
        const trackedElements = [
            elements.genreSelect,
            elements.tempoSelect,
            elements.energySelect,
            elements.keySelect,
            elements.scaleSelect,
            elements.intelligenceSelect
        ];
        
        trackedElements.forEach(el => {
            if (el) {
                el.addEventListener('change', () => {
                    this.showModifiedIndicator(el);
                    this.debouncedParameterTracking();
                });
            }
        });
    }
    
    showModifiedIndicator(element) {
        const indicator = element.parentElement?.querySelector('.parameter-indicator');
        if (indicator) {
            indicator.classList.add('modified');
            setTimeout(() => indicator.classList.remove('modified'), 2000);
        }
    }
    
    // ==================== Expandable Menus ====================
    
    setupExpandableMenus() {
        // Preset categories in dropdown (use event delegation for dynamic content)
        const dropdownMenu = document.getElementById('preset-dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.addEventListener('click', (e) => {
                const header = e.target.closest('.preset-category-header');
                if (header) {
                    e.stopPropagation();
                    const content = header.nextElementSibling;
                    if (content && content.classList.contains('preset-category-content')) {
                        content.classList.toggle('collapsed');
                        const icon = header.querySelector('.expand-icon');
                        if (icon) icon.textContent = content.classList.contains('collapsed') ? '▼' : '▲';
                        const categoryId = `preset-category-${header.dataset.category}`;
                        this.saveExpandState(categoryId, !content.classList.contains('collapsed'));
                    }
                }
            });
        }
        
        // Panel toggles (use event delegation)
        document.addEventListener('click', (e) => {
            const toggle = e.target.closest('.panel-toggle');
            if (toggle) {
                const panel = toggle.closest('.expandable-panel');
                if (panel) {
                    const content = panel.querySelector('.panel-content');
                    if (content) {
                        content.classList.toggle('collapsed');
                        const icon = toggle.querySelector('.expand-icon, .collapse-icon');
                        if (icon) {
                            icon.textContent = content.classList.contains('collapsed') ? '▼' : '▲';
                        }
                        const panelId = panel.id;
                        if (panelId) {
                            this.saveExpandState(panelId, !content.classList.contains('collapsed'));
                        }
                    }
                }
            }
        });
        
        // Restore expand states after a short delay to ensure DOM is ready
        setTimeout(() => this.restoreExpandStates(), 200);
    }
    
    restoreExpandStates() {
        for (const [id, expanded] of Object.entries(this.expandStates)) {
            if (id.startsWith('preset-category-')) {
                // Handle preset categories
                const category = id.replace('preset-category-', '');
                const header = document.querySelector(`.preset-category-header[data-category="${category}"]`);
                if (header) {
                    const content = header.nextElementSibling;
                    if (content && content.classList.contains('preset-category-content')) {
                        if (expanded) {
                            content.classList.remove('collapsed');
                            const icon = header.querySelector('.expand-icon');
                            if (icon) icon.textContent = '▲';
                        } else {
                            content.classList.add('collapsed');
                            const icon = header.querySelector('.expand-icon');
                            if (icon) icon.textContent = '▼';
                        }
                    }
                }
            } else {
                // Handle panels
                const element = document.getElementById(id);
                if (element) {
                    const content = element.querySelector('.panel-content');
                    if (content) {
                        if (expanded) {
                            content.classList.remove('collapsed');
                            const toggle = element.querySelector('.panel-toggle');
                            if (toggle) {
                                const icon = toggle.querySelector('.expand-icon');
                                if (icon) icon.textContent = '▲';
                            }
                        } else {
                            content.classList.add('collapsed');
                            const toggle = element.querySelector('.panel-toggle');
                            if (toggle) {
                                const icon = toggle.querySelector('.expand-icon');
                                if (icon) icon.textContent = '▼';
                            }
                        }
                    }
                }
            }
        }
    }
    
    // ==================== Media Preview ====================
    
    setupMediaPreview() {
        // Setup preview control buttons
        const playBtn = document.getElementById('create-preview-play');
        const pauseBtn = document.getElementById('create-preview-pause');
        const stopBtn = document.getElementById('create-preview-stop');
        
        if (playBtn) {
            playBtn.addEventListener('click', async () => {
                await this.handleCreatePreview('play');
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', async () => {
                await this.handleCreatePreview('pause');
            });
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', async () => {
                await this.handleCreatePreview('stop');
            });
        }
        
        // Store reference to current preview file
        this.currentPreviewFile = null;
    }
    
    async handleCreatePreview(action) {
        if (!window.audioEngine) {
            console.warn('[CreateTab] Audio engine not available');
            return;
        }
        
        try {
            await window.audioEngine.resume();
            
            switch (action) {
                case 'play':
                    if (this.currentPreviewFile) {
                        // Load and play the file
                        await window.audioEngine.loadAudioFile(this.currentPreviewFile);
                        await window.audioEngine.playAudio();
                    } else {
                        console.warn('[CreateTab] No preview file loaded');
                    }
                    break;
                    
                case 'pause':
                    if (window.audioEngine.isPlaying) {
                        window.audioEngine.pauseAudio();
                    } else if (window.audioEngine.isPaused) {
                        await window.audioEngine.resumeAudio();
                    }
                    break;
                    
                case 'stop':
                    window.audioEngine.stopAudio();
                    this.currentPreviewFile = null;
                    break;
            }
        } catch (error) {
            console.error('[CreateTab] Preview error:', error);
        }
    }
    
    updateMediaPreview(data, type) {
        const previewPanel = document.getElementById('media-preview-panel');
        if (!previewPanel) return;
        
        // Show preview panel and content
        previewPanel.classList.remove('collapsed');
        const previewContent = previewPanel.querySelector('.preview-content');
        if (previewContent) previewContent.classList.remove('collapsed');
        
        // Store file path if available for audio preview
        if (data.filePath && (type === 'audio' || type === 'both')) {
            this.currentPreviewFile = data.filePath;
        }
        
        if (type === 'audio' || (data.audio && !data.midi)) {
            // Show waveform
            const waveformCanvas = document.getElementById('create-waveform-canvas');
            if (waveformCanvas) {
                // If we have audio file, load it and analyze
                if (this.currentPreviewFile && window.audioEngine && window.AudioAnalyzer) {
                    // Load audio and create analyzer for visualization
                    window.audioEngine.loadAudioFile(this.currentPreviewFile).then(() => {
                        const audioContext = window.audioEngine.getAudioContext();
                        const analyzer = new window.AudioAnalyzer(audioContext);
                        
                        // Get buffer and create source for analysis
                        const buffer = window.audioEngine.currentBuffer;
                        if (buffer) {
                            // Draw static waveform from buffer
                            this.drawBufferWaveform(waveformCanvas, buffer);
                        }
                    }).catch(err => {
                        console.error('[CreateTab] Failed to load audio for preview:', err);
                        // Fallback to simple waveform
                        this.drawSimpleWaveform(waveformCanvas, data.waveform || []);
                    });
                } else {
                    // Use existing drawWaveform function if available, or draw directly
                    if (typeof drawWaveform === 'function') {
                        drawWaveform(data);
                    } else if (window.drawWaveform) {
                        window.drawWaveform(data);
                    } else {
                        // Fallback: draw simple waveform
                        this.drawSimpleWaveform(waveformCanvas, data.waveform || []);
                    }
                }
            }
            const waveformPreview = document.getElementById('waveform-preview');
            const pianoRollPreview = document.getElementById('piano-roll-preview');
            if (waveformPreview) waveformPreview.classList.remove('collapsed');
            if (pianoRollPreview) pianoRollPreview.classList.add('collapsed');
        } else if (type === 'midi' || data.midi || type === 'both') {
            // Show piano roll
            const pianoRollCanvas = document.getElementById('create-piano-roll-canvas');
            if (pianoRollCanvas) {
                // Use existing drawPianoRoll function if available, or draw directly
                if (typeof drawPianoRoll === 'function') {
                    drawPianoRoll(data.notes || []);
                } else if (window.drawPianoRoll) {
                    window.drawPianoRoll(data.notes || []);
                } else {
                    // Fallback: draw simple piano roll
                    this.drawSimplePianoRoll(pianoRollCanvas, data.notes || []);
                }
            }
            const waveformPreview = document.getElementById('waveform-preview');
            const pianoRollPreview = document.getElementById('piano-roll-preview');
            if (pianoRollPreview) pianoRollPreview.classList.remove('collapsed');
            if (waveformPreview && type !== 'both') waveformPreview.classList.add('collapsed');
        }
    }
    
    drawBufferWaveform(canvas, audioBuffer) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 90;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        if (!audioBuffer) return;
        
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        const step = Math.ceil(channelData.length / width);
        const amp = height / 2;
        
        ctx.strokeStyle = '#00d4aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < width; i++) {
            const sampleIndex = Math.floor(i * step);
            const sample = channelData[sampleIndex] || 0;
            const y = amp + (sample * amp);
            
            if (i === 0) {
                ctx.moveTo(i, y);
            } else {
                ctx.lineTo(i, y);
            }
        }
        
        ctx.stroke();
    }
    
    drawSimpleWaveform(canvas, samples) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 90;
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        if (samples && samples.length > 0) {
            ctx.strokeStyle = '#00d4aa';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            const step = width / samples.length;
            const centerY = height / 2;
            const amplitude = height * 0.4;
            
            for (let i = 0; i < samples.length; i++) {
                const x = i * step;
                const y = centerY + (samples[i] * amplitude);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        } else {
            // Draw placeholder
            ctx.strokeStyle = '#3a3a3a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
        }
    }
    
    drawSimplePianoRoll(canvas, notes) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 160;
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        
        const bars = 4;
        for (let i = 0; i <= bars; i++) {
            const x = (i / bars) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        const notesPerOctave = 12;
        const octaves = 4;
        for (let i = 0; i <= octaves * notesPerOctave; i++) {
            const y = (i / (octaves * notesPerOctave)) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw notes
        if (notes && notes.length > 0) {
            notes.forEach(note => {
                const x = ((note.start || 0) / (bars * 4)) * width;
                const y = ((note.pitch % (octaves * notesPerOctave)) / (octaves * notesPerOctave)) * height;
                const w = ((note.duration || 1) / (bars * 4)) * width;
                const h = height / (octaves * notesPerOctave);
                
                ctx.fillStyle = '#00d4aa';
                ctx.fillRect(x, y, w, h);
                ctx.strokeStyle = '#00a88a';
                ctx.strokeRect(x, y, w, h);
            });
        }
    }
    
    // ==================== DNA Profile Loading ====================
    
    async loadDnaProfile() {
        try {
            // Try to load from API first
            if (window.sergikAPI && window.sergikAPI.getDnaProfile) {
                const result = await window.sergikAPI.getDnaProfile();
                if (result.success && result.data) {
                    this.dnaProfile = result.data;
                    return;
                }
            }
            
            // Fallback to embedded data (from master_profile.json structure)
            this.dnaProfile = {
                dna: {
                    bpm: {
                        average: 104.2,
                        zones: {
                            downtempo: { range: [80, 90], percentage: 43.7 },
                            house: { range: [120, 129], percentage: 37.4 }
                        }
                    },
                    keys: {
                        distribution: {
                            '10B': 31,
                            '11B': 21,
                            '7A': 24.1,
                            '8A': 12,
                            '7B': 15.0
                        }
                    },
                    energy: {
                        average: 7.2,
                        sweet_spot: [5, 7]
                    },
                    genres: {
                        hiphop: 29.4,
                        house: 35.6,
                        funk: 11.9,
                        soul: 4.9
                    }
                },
                intelligence: {
                    emotional_profile: {
                        primary_emotions: {
                            groovy: 1320,
                            chill: 422,
                            intense: 121,
                            calm: 20
                        }
                    }
                }
            };
        } catch (error) {
            console.warn('[CreateTabEnhancements] Failed to load DNA profile:', error);
        }
    }
    
    // ==================== Default Presets ====================
    
    getDefaultPresets() {
        return {
            tech_house: {
                name: 'Tech House',
                genre: 'tech_house',
                tempo: 124,
                energy: 7,
                key: '10B',
                scale: 'major'
            },
            hiphop: {
                name: 'Hip-Hop',
                genre: 'hiphop',
                tempo: 85,
                energy: 5,
                key: '7A',
                scale: 'minor'
            },
            techno: {
                name: 'Techno',
                genre: 'techno',
                tempo: 130,
                energy: 8,
                key: '7A',
                scale: 'minor'
            },
            ambient: {
                name: 'Ambient',
                genre: 'ambient',
                tempo: 90,
                energy: 2,
                key: '10B',
                scale: 'major'
            },
            groovy: {
                name: 'Groovy',
                intelligence: 'groovy',
                energy: 6,
                tempo: 115,
                key: '10B',
                scale: 'major'
            },
            chill: {
                name: 'Chill',
                intelligence: 'chill',
                energy: 3,
                tempo: 85,
                key: '10B',
                scale: 'major'
            },
            intense: {
                name: 'Intense',
                intelligence: 'intense',
                energy: 9,
                tempo: 140,
                key: '7A',
                scale: 'minor'
            },
            social: {
                name: 'Social',
                intelligence: 'social',
                energy: 6,
                tempo: 115,
                key: '10B',
                scale: 'major'
            },
            creative: {
                name: 'Creative',
                intelligence: 'creative',
                energy: 6,
                tempo: 110,
                key: '10B',
                scale: 'major'
            },
            dance_floor: {
                name: 'Dance Floor',
                intelligence: 'dance_floor',
                energy: 8,
                tempo: 130,
                key: '10B',
                scale: 'major'
            },
            background: {
                name: 'Background',
                intelligence: 'background',
                energy: 3,
                tempo: 80,
                key: '10B',
                scale: 'major'
            },
            workout: {
                name: 'Workout',
                intelligence: 'workout',
                energy: 9,
                tempo: 155,
                key: '7A',
                scale: 'minor'
            }
        };
    }
    
    getDefaultPreset(name) {
        return this.getDefaultPresets()[name];
    }
    
    // ==================== Storage ====================
    
    loadPresets() {
        try {
            const stored = localStorage.getItem('createTabPresets');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('[CreateTabEnhancements] Failed to load presets:', error);
            return {};
        }
    }
    
    savePresets() {
        try {
            localStorage.setItem('createTabPresets', JSON.stringify(this.presets));
        } catch (error) {
            console.warn('[CreateTabEnhancements] Failed to save presets:', error);
        }
    }
    
    deletePreset(presetName) {
        const key = presetName.toLowerCase().replace(/\s+/g, '_');
        if (!this.presets[key]) {
            if (window.showNotification) {
                window.showNotification(`Preset "${presetName}" not found`, 'error', 2000);
            }
            return;
        }
        
        // Don't allow deleting default presets
        const defaultPresets = this.getDefaultPresets();
        if (defaultPresets[key]) {
            if (window.showNotification) {
                window.showNotification('Cannot delete default presets', 'error', 2000);
            }
            return;
        }
        
        delete this.presets[key];
        this.savePresets();
        
        // Remove from UI
        const presetBtn = document.querySelector(`.preset-btn[data-preset="${key}"], .preset-item[data-preset="${key}"]`);
        if (presetBtn) {
            presetBtn.remove();
        }
        
        // Update dropdown
        this.populateCustomPresetsDropdown();
        
        if (window.showNotification) {
            window.showNotification(`Deleted preset "${presetName}"`, 'success', 2000);
        }
    }
    
    renamePreset(oldName, newName) {
        if (!newName || !newName.trim()) return;
        
        const oldKey = oldName.toLowerCase().replace(/\s+/g, '_');
        const newKey = newName.toLowerCase().replace(/\s+/g, '_');
        
        if (!this.presets[oldKey]) {
            if (window.showNotification) {
                window.showNotification(`Preset "${oldName}" not found`, 'error', 2000);
            }
            return;
        }
        
        // Don't allow renaming default presets
        const defaultPresets = this.getDefaultPresets();
        if (defaultPresets[oldKey]) {
            if (window.showNotification) {
                window.showNotification('Cannot rename default presets', 'error', 2000);
            }
            return;
        }
        
        // Check if new name already exists
        if (this.presets[newKey] && newKey !== oldKey) {
            if (window.showNotification) {
                window.showNotification(`Preset "${newName}" already exists`, 'error', 2000);
            }
            return;
        }
        
        // Rename preset
        const preset = { ...this.presets[oldKey], name: newName.trim() };
        delete this.presets[oldKey];
        this.presets[newKey] = preset;
        this.savePresets();
        
        // Update UI
        const presetBtn = document.querySelector(`.preset-btn[data-preset="${oldKey}"], .preset-item[data-preset="${oldKey}"]`);
        if (presetBtn) {
            presetBtn.dataset.preset = newKey;
            presetBtn.dataset.presetName = newKey;
            const nameSpan = presetBtn.querySelector('.preset-name');
            if (nameSpan) {
                nameSpan.textContent = newName.trim();
            }
        }
        
        // Update dropdown
        this.populateCustomPresetsDropdown();
        
        if (window.showNotification) {
            window.showNotification(`Renamed preset to "${newName}"`, 'success', 2000);
        }
    }
    
    duplicatePreset(presetName) {
        const key = presetName.toLowerCase().replace(/\s+/g, '_');
        if (!this.presets[key]) {
            if (window.showNotification) {
                window.showNotification(`Preset "${presetName}" not found`, 'error', 2000);
            }
            return;
        }
        
        const preset = this.presets[key];
        const originalName = preset.name || presetName;
        const newName = prompt('Enter name for duplicate:', `${originalName} Copy`);
        
        if (!newName || !newName.trim()) return;
        
        const newKey = newName.toLowerCase().replace(/\s+/g, '_');
        
        // Check if name already exists
        if (this.presets[newKey]) {
            if (window.showNotification) {
                window.showNotification(`Preset "${newName}" already exists`, 'error', 2000);
            }
            return;
        }
        
        // Create duplicate
        const duplicate = {
            ...preset,
            name: newName.trim(),
            timestamp: Date.now()
        };
        
        this.presets[newKey] = duplicate;
        this.savePresets();
        
        // Add to UI
        this.addPresetButton(newName.trim(), duplicate);
        this.populateCustomPresetsDropdown();
        
        if (window.showNotification) {
            window.showNotification(`Duplicated preset as "${newName}"`, 'success', 2000);
        }
    }
    
    loadHistory() {
        try {
            const stored = localStorage.getItem('createTabHistory');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('[CreateTabEnhancements] Failed to load history:', error);
            return [];
        }
    }
    
    saveHistory() {
        try {
            localStorage.setItem('createTabHistory', JSON.stringify(this.parameterHistory));
        } catch (error) {
            console.warn('[CreateTabEnhancements] Failed to save history:', error);
        }
    }
    
    loadExpandStates() {
        try {
            const stored = localStorage.getItem('createTabExpandStates');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            return {};
        }
    }
    
    saveExpandState(id, expanded) {
        this.expandStates[id] = expanded;
        try {
            localStorage.setItem('createTabExpandStates', JSON.stringify(this.expandStates));
        } catch (error) {
            console.warn('[CreateTabEnhancements] Failed to save expand state:', error);
        }
    }
    
    // ==================== Utilities ====================
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Add this method to get sub-categories for each type
    getSubCategories(type) {
        const subCategories = {
            kicks: [
                { id: 'kick-808', label: '808 Kick', style: 'deep, sub-bass' },
                { id: 'kick-acoustic', label: 'Acoustic Kick', style: 'natural, organic' },
                { id: 'kick-punchy', label: 'Punchy Kick', style: 'tight, aggressive' },
                { id: 'kick-soft', label: 'Soft Kick', style: 'warm, gentle' },
                { id: 'kick-distorted', label: 'Distorted Kick', style: 'heavy, saturated' }
            ],
            claps: [
                { id: 'clap-classic', label: 'Classic Clap', style: 'traditional, crisp' },
                { id: 'clap-layered', label: 'Layered Clap', style: 'thick, full' },
                { id: 'clap-reverb', label: 'Reverb Clap', style: 'spacious, ambient' },
                { id: 'snare-acoustic', label: 'Acoustic Snare', style: 'natural, live' },
                { id: 'snare-electronic', label: 'Electronic Snare', style: 'synthetic, digital' }
            ],
            hats: [
                { id: 'hat-closed', label: 'Closed Hi-Hat', style: 'tight, short' },
                { id: 'hat-open', label: 'Open Hi-Hat', style: 'sustained, bright' },
                { id: 'hat-shaker', label: 'Shaker', style: 'rhythmic, percussive' },
                { id: 'hat-ride', label: 'Ride Cymbal', style: 'sustained, metallic' },
                { id: 'hat-crash', label: 'Crash', style: 'explosive, bright' }
            ],
            percussion: [
                { id: 'perc-conga', label: 'Conga', style: 'latin, organic' },
                { id: 'perc-bongo', label: 'Bongo', style: 'latin, rhythmic' },
                { id: 'perc-tambourine', label: 'Tambourine', style: 'bright, jingling' },
                { id: 'perc-woodblock', label: 'Woodblock', style: 'dry, percussive' },
                { id: 'perc-triangle', label: 'Triangle', style: 'metallic, bright' }
            ],
            bass: [
                { id: 'bass-sub', label: 'Sub Bass', style: 'deep, low-end' },
                { id: 'bass-synth', label: 'Synth Bass', style: 'electronic, modulated' },
                { id: 'bass-acoustic', label: 'Acoustic Bass', style: 'natural, warm' },
                { id: 'bass-pluck', label: 'Pluck Bass', style: 'punchy, short' },
                { id: 'bass-wobble', label: 'Wobble Bass', style: 'modulated, dynamic' }
            ],
            synths: [
                { id: 'synth-lead', label: 'Lead', style: 'melodic, prominent' },
                { id: 'synth-pad', label: 'Pad', style: 'atmospheric, sustained' },
                { id: 'synth-pluck', label: 'Pluck', style: 'short, percussive' },
                { id: 'synth-arp', label: 'Arpeggio', style: 'patterned, rhythmic' },
                { id: 'synth-brass', label: 'Brass', style: 'bold, powerful' }
            ],
            vocals: [
                { id: 'vocal-choir', label: 'Choir', style: 'layered, harmonic' },
                { id: 'vocal-ahh', label: 'Ahh', style: 'sustained, vowel' },
                { id: 'vocal-ohh', label: 'Ohh', style: 'warm, open' },
                { id: 'vocal-uhh', label: 'Uhh', style: 'dark, closed' },
                { id: 'vocal-phrase', label: 'Phrase', style: 'melodic, lyrical' }
            ],
            fx: [
                { id: 'fx-riser', label: 'Riser', style: 'building, ascending' },
                { id: 'fx-sweep', label: 'Sweep', style: 'filtered, moving' },
                { id: 'fx-impact', label: 'Impact', style: 'powerful, transient' },
                { id: 'fx-reverse', label: 'Reverse', style: 'backwards, ethereal' },
                { id: 'fx-ambient', label: 'Ambient', style: 'atmospheric, textural' }
            ]
        };
        return subCategories[type] || [];
    }

    // ==================== Batch Mode ====================
    
    setupBatchMode() {
        const batchToggle = document.getElementById('batch-mode-toggle');
        const batchQueue = document.getElementById('batch-queue');
        
        if (batchToggle) {
            batchToggle.addEventListener('change', (e) => {
                if (batchQueue) {
                    if (e.target.checked) {
                        batchQueue.classList.remove('collapsed');
                        this.enableBatchModeSubCategories();
                    } else {
                        batchQueue.classList.add('collapsed');
                        this.disableBatchModeSubCategories();
                    }
                }
            });
        }
        
        // Intercept generation buttons when batch mode is active
        // Use capture phase to ensure this runs before renderer.js listeners
        document.querySelectorAll('.btn-generate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (batchToggle?.checked) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showSubCategoryMenu(btn);
                }
            }, true); // Use capture phase
        });
        
        const executeBtn = document.getElementById('execute-batch');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.executeBatch());
        }
        
        const clearBtn = document.getElementById('clear-batch');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearBatch());
        }
    }

    enableBatchModeSubCategories() {
        // Add visual indicator that batch mode is active
        document.querySelectorAll('.btn-generate').forEach(btn => {
            btn.classList.add('batch-mode-active');
            btn.setAttribute('title', 'Click to select sub-category');
        });
    }

    disableBatchModeSubCategories() {
        // Remove visual indicators
        document.querySelectorAll('.btn-generate').forEach(btn => {
            btn.classList.remove('batch-mode-active');
            btn.removeAttribute('title');
        });
        
        // Close any open sub-category menus
        document.querySelectorAll('.sub-category-menu').forEach(menu => {
            menu.remove();
        });
    }

    showSubCategoryMenu(button) {
        // Remove any existing menus
        document.querySelectorAll('.sub-category-menu').forEach(menu => menu.remove());
        
        const type = button.dataset.type;
        const subCategories = this.getSubCategories(type);
        
        if (subCategories.length === 0) {
            // No sub-categories, add directly to queue
            this.addToBatchQueue(type);
            return;
        }
        
        // Create dropdown menu
        const menu = document.createElement('div');
        menu.className = 'sub-category-menu';
        menu.style.cssText = `
            position: absolute;
            background: var(--bg-panel);
            border: 1px solid var(--border-color);
            border-radius: 2px;
            padding: 4px;
            z-index: 1000;
            min-width: 200px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        // Add "All" option
        const allOption = document.createElement('div');
        allOption.className = 'sub-category-item';
        allOption.style.cssText = `
            padding: 6px 8px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 10px;
            font-family: 'JetBrains Mono', monospace;
            color: var(--text-primary);
            margin-bottom: 2px;
        `;
        allOption.textContent = `All ${type.toUpperCase()}`;
        allOption.addEventListener('mouseenter', () => {
            allOption.style.background = 'var(--bg-hover)';
        });
        allOption.addEventListener('mouseleave', () => {
            allOption.style.background = 'transparent';
        });
        allOption.addEventListener('click', () => {
            this.addToBatchQueue(type);
            menu.remove();
        });
        menu.appendChild(allOption);
        
        // Add divider
        const divider = document.createElement('div');
        divider.style.cssText = `
            height: 1px;
            background: var(--border-color);
            margin: 4px 0;
        `;
        menu.appendChild(divider);
        
        // Add sub-category options
        subCategories.forEach(subCat => {
            const item = document.createElement('div');
            item.className = 'sub-category-item';
            item.style.cssText = allOption.style.cssText;
            
            const label = document.createElement('div');
            label.textContent = subCat.label;
            label.style.fontWeight = '600';
            
            const style = document.createElement('div');
            style.textContent = subCat.style;
            style.style.cssText = `
                font-size: 8px;
                color: var(--text-secondary);
                margin-top: 2px;
            `;
            
            item.appendChild(label);
            item.appendChild(style);
            
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--bg-hover)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            item.addEventListener('click', () => {
                this.addToBatchQueue(type, subCat.id);
                menu.remove();
            });
            
            menu.appendChild(item);
        });
        
        // Position menu relative to button
        const rect = button.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 4}px`;
        
        document.body.appendChild(menu);
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && !button.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 100);
    }
    
    // ==================== Generated Files Management ====================
    
    setupGeneratedFilesPanel() {
        // Setup expandable panel
        const panel = document.getElementById('generated-files-panel');
        const toggle = panel?.querySelector('.panel-toggle');
        const content = panel?.querySelector('.generated-files-content');
        
        if (toggle && content) {
            toggle.addEventListener('click', () => {
                panel.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
                const icon = toggle.querySelector('.expand-icon');
                if (icon) {
                    icon.textContent = panel.classList.contains('collapsed') ? '▶' : '▼';
                }
            });
        }
        
        // Clear button
        const clearBtn = document.getElementById('clear-generated-files');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearGeneratedFiles();
            });
        }
        
        // Render initial list
        this.updateGeneratedFilesList();
    }
    
    addGeneratedFile(fileData) {
        const file = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: fileData.name || fileData.filename || 'Untitled',
            path: fileData.filePath || fileData.path,
            type: fileData.type || this.detectFileType(fileData.filePath || fileData.path),
            generationType: fileData.generationType || 'unknown',
            timestamp: fileData.timestamp || Date.now(),
            metadata: fileData.metadata || {}
        };
        
        // Add to beginning of array (most recent first)
        this.generatedFiles.unshift(file);
        
        // Limit to last 50 files
        if (this.generatedFiles.length > 50) {
            this.generatedFiles = this.generatedFiles.slice(0, 50);
        }
        
        this.saveGeneratedFiles();
        this.updateGeneratedFilesList();
        
        // Auto-select the newly generated file
        this.selectGeneratedFile(file.id);
    }
    
    detectFileType(filePath) {
        if (!filePath) return 'unknown';
        const ext = filePath.split('.').pop().toLowerCase();
        if (['wav', 'mp3', 'aiff', 'flac', 'ogg'].includes(ext)) return 'audio';
        if (['mid', 'midi'].includes(ext)) return 'midi';
        return 'unknown';
    }
    
    selectGeneratedFile(fileId) {
        // Update selected state
        const items = document.querySelectorAll('.generated-file-item');
        items.forEach(item => {
            if (item.dataset.fileId === fileId) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
        
        // Load file for preview
        const file = this.generatedFiles.find(f => f.id === fileId);
        if (file && file.path) {
            this.loadFileForPreview(file);
        }
    }
    
    async loadFileForPreview(file) {
        if (!window.audioEngine) {
            console.warn('[CreateTab] Audio engine not available');
            return;
        }
        
        try {
            // Determine preview type
            const previewType = file.type === 'audio' ? 'audio' : 
                              file.type === 'midi' ? 'midi' : 'both';
            
            // Load file into audio engine if audio
            if (file.type === 'audio' || file.type === 'both') {
                await window.audioEngine.loadAudioFile(file.path);
            }
            
            // Update preview panel
            this.updateMediaPreview({
                filePath: file.path,
                name: file.name,
                type: file.type,
                generationType: file.generationType,
                metadata: file.metadata
            }, previewType);
            
            // Show preview panel
            const previewPanel = document.getElementById('media-preview-panel');
            if (previewPanel) {
                previewPanel.classList.remove('collapsed');
                const previewContent = previewPanel.querySelector('.preview-content');
                if (previewContent) previewContent.classList.remove('collapsed');
            }
        } catch (error) {
            console.error('[CreateTab] Failed to load file for preview:', error);
            if (window.addAction) {
                window.addAction(`Failed to load ${file.name} for preview`, 'error');
            }
        }
    }
    
    updateGeneratedFilesList() {
        const listContainer = document.getElementById('generated-files-list');
        if (!listContainer) return;
        
        // Clear existing list
        listContainer.innerHTML = '';
        
        if (this.generatedFiles.length === 0) {
            listContainer.innerHTML = '<div class="generated-files-empty">No files generated yet</div>';
            return;
        }
        
        // Create file items
        this.generatedFiles.forEach(file => {
            const item = this.createFileItem(file);
            listContainer.appendChild(item);
        });
    }
    
    createFileItem(file) {
        const item = document.createElement('div');
        item.className = 'generated-file-item';
        item.dataset.fileId = file.id;
        item.setAttribute('data-context-menu', 'generated-file');
        
        // File icon based on type
        const icon = file.type === 'audio' ? '🎵' : 
                    file.type === 'midi' ? '🎹' : '📄';
        
        // Format timestamp
        const timeStr = this.formatFileTime(file.timestamp);
        
        // Generation type label
        const genTypeLabel = file.generationType.charAt(0).toUpperCase() + file.generationType.slice(1);
        
        item.innerHTML = `
            <span class="generated-file-icon">${icon}</span>
            <div class="generated-file-info">
                <div class="generated-file-name" title="${file.name}">${file.name}</div>
                <div class="generated-file-meta">
                    <span class="generated-file-type">${file.type}</span>
                    <span class="generated-file-gen-type">${genTypeLabel}</span>
                    <span class="generated-file-time">${timeStr}</span>
                </div>
            </div>
            <div class="generated-file-actions">
                <button class="generated-file-action-btn" data-action="preview" title="Preview">👁</button>
                <button class="generated-file-action-btn" data-action="delete" title="Remove">✕</button>
            </div>
        `;
        
        // Click handler
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking action buttons
            if (e.target.closest('.generated-file-actions')) {
                const action = e.target.dataset.action;
                if (action === 'preview') {
                    this.selectGeneratedFile(file.id);
                } else if (action === 'delete') {
                    this.removeGeneratedFile(file.id);
                }
                return;
            }
            
            this.selectGeneratedFile(file.id);
        });
        
        return item;
    }
    
    formatFileTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }
    
    removeGeneratedFile(fileId) {
        this.generatedFiles = this.generatedFiles.filter(f => f.id !== fileId);
        this.saveGeneratedFiles();
        this.updateGeneratedFilesList();
    }
    
    clearGeneratedFiles() {
        if (confirm('Clear all generated files from the list?')) {
            this.generatedFiles = [];
            this.saveGeneratedFiles();
            this.updateGeneratedFilesList();
        }
    }
    
    loadGeneratedFiles() {
        try {
            const stored = localStorage.getItem('create-tab-generated-files');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[CreateTab] Failed to load generated files:', error);
            return [];
        }
    }
    
    saveGeneratedFiles() {
        try {
            localStorage.setItem('create-tab-generated-files', JSON.stringify(this.generatedFiles));
        } catch (error) {
            console.error('[CreateTab] Failed to save generated files:', error);
        }
    }
}

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.CreateTabEnhancements = CreateTabEnhancements;
}

