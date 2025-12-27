/**
 * Keyboard Shortcuts System
 * Handles all keyboard shortcuts for the SERGIK AI Controller
 */

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.isEnabled = true;
        this.generationMode = false; // For G+K, G+C, etc.
        this.generationTimer = null;
        this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        this.modKey = this.isMac ? 'Meta' : 'Ctrl';
        
        this.setupShortcuts();
        this.setupEventListeners();
    }
    
    setupShortcuts() {
        // Navigation shortcuts
        this.register('1', () => this.switchTab(0), 'Switch to Create tab');
        this.register('2', () => this.switchTab(1), 'Switch to Analyze tab');
        this.register('3', () => this.switchTab(2), 'Switch to Library tab');
        this.register('4', () => this.switchTab(3), 'Switch to AI tab');
        this.register('Tab', (e) => {
            if (!e.shiftKey) this.cycleTab(1);
            else this.cycleTab(-1);
        }, 'Cycle tabs');
        
        // Transport shortcuts
        this.register('Space', (e) => {
            e.preventDefault();
            this.togglePlay();
        }, 'Play/Pause');
        this.register('Enter', (e) => {
            if (!this.isInputFocused()) {
                e.preventDefault();
                this.toggleRecord();
            }
        }, 'Record');
        this.register('.', (e) => {
            e.preventDefault();
            this.stop();
        }, 'Stop');
        
        // Generation shortcuts (G + key)
        this.register('g', () => {
            this.activateGenerationMode();
        }, 'Activate generation mode');
        
        // Focus shortcuts
        this.register('d', () => this.focusField('idea-input'), 'Focus Idea input');
        this.register('g', () => this.focusField('genre-select'), 'Focus Genre', { context: 'focus' });
        this.register('t', () => this.focusField('tempo-select'), 'Focus Tempo');
        this.register('e', () => this.focusField('energy-select'), 'Focus Energy');
        this.register('i', () => this.focusField('intelligence-select'), 'Focus Intelligence');
        this.register('k', () => this.focusField('key-select'), 'Focus Key');
        this.register('s', () => this.focusField('scale-select'), 'Focus Scale');
        this.register('r', () => this.focusField('track-select'), 'Focus Track');
        this.register('l', () => this.focusField('slot-select'), 'Focus Slot');
        
        // Action shortcuts
        this.register('Ctrl+Z', (e) => {
            e.preventDefault();
            this.undo();
        }, 'Undo');
        this.register('Meta+Z', (e) => {
            e.preventDefault();
            this.undo();
        }, 'Undo');
        this.register('Ctrl+Shift+Z', (e) => {
            e.preventDefault();
            this.redo();
        }, 'Redo');
        this.register('Meta+Shift+Z', (e) => {
            e.preventDefault();
            this.redo();
        }, 'Redo');
        this.register('Ctrl+Y', (e) => {
            e.preventDefault();
            this.redo();
        }, 'Redo');
        this.register('Meta+Y', (e) => {
            e.preventDefault();
            this.redo();
        }, 'Redo');
        this.register('Ctrl+S', (e) => {
            e.preventDefault();
            this.save();
        }, 'Save');
        this.register('Meta+S', (e) => {
            e.preventDefault();
            this.save();
        }, 'Save');
        this.register('Ctrl+D', (e) => {
            e.preventDefault();
            this.duplicate();
        }, 'Duplicate');
        this.register('Meta+D', (e) => {
            e.preventDefault();
            this.duplicate();
        }, 'Duplicate');
        
        // Library shortcuts
        this.register('Ctrl+F', (e) => {
            e.preventDefault();
            this.focusSearch();
        }, 'Focus search');
        this.register('Meta+F', (e) => {
            e.preventDefault();
            this.focusSearch();
        }, 'Focus search');
        
        // Help shortcut
        this.register('?', () => {
            this.showHelp();
        }, 'Show help');
        this.register('Shift+?', () => {
            this.showHelp();
        }, 'Show help');
        
        // Update Save shortcut for Create Tab
        const originalSave = this.shortcuts.get('Ctrl+S');
        if (originalSave) {
            this.register('Ctrl+S', (e) => {
                if (this.isCreateTab() && window.createTabEnhancements) {
                    e.preventDefault();
                    window.createTabEnhancements.saveCurrentPreset();
                } else {
                    originalSave.callback(e);
                }
            }, 'Save current preset or default save');
        }
        
        // Update Load shortcut for Create Tab
        const originalLoad = this.shortcuts.get('Ctrl+L');
        if (!originalLoad) {
            this.register('Ctrl+L', (e) => {
                if (this.isCreateTab()) {
                    e.preventDefault();
                    this.showPresetLoader();
                }
            }, 'Load preset dialog');
        }
        
        // Settings shortcut
        this.register('Ctrl+,', (e) => {
            e.preventDefault();
            this.showSettings();
        }, 'Open settings');
        this.register('Meta+,', (e) => {
            e.preventDefault();
            this.showSettings();
        }, 'Open settings');
        
        // Create Tab Enhancements shortcuts
        this.register('Ctrl+1', (e) => {
            if (this.isCreateTab()) {
                e.preventDefault();
                this.loadPreset('tech_house');
            }
        }, 'Load Tech House preset');
        this.register('Ctrl+2', (e) => {
            if (this.isCreateTab()) {
                e.preventDefault();
                this.loadPreset('hiphop');
            }
        }, 'Load Hip-Hop preset');
        this.register('Ctrl+3', (e) => {
            if (this.isCreateTab()) {
                e.preventDefault();
                this.loadPreset('techno');
            }
        }, 'Load Techno preset');
        this.register('Ctrl+4', (e) => {
            if (this.isCreateTab()) {
                e.preventDefault();
                this.loadPreset('ambient');
            }
        }, 'Load Ambient preset');
        this.register('Ctrl+B', (e) => {
            if (this.isCreateTab()) {
                e.preventDefault();
                this.toggleBatchMode();
            }
        }, 'Toggle batch mode');
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.isEnabled) return;
            
            // Handle generation mode (G + key)
            if (this.generationMode && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const key = e.key.toLowerCase();
                const generationMap = {
                    'k': 'kicks',
                    'c': 'claps',
                    'h': 'hats',
                    'p': 'percussion',
                    'b': 'bass',
                    's': 'synths',
                    'v': 'vocals',
                    'f': 'fx'
                };
                
                if (generationMap[key]) {
                    e.preventDefault();
                    this.triggerGeneration(generationMap[key]);
                    this.deactivateGenerationMode();
                    return;
                }
            }
            
            this.handleKeyDown(e);
        });
        
        // Reset generation mode on any modifier key
        document.addEventListener('keydown', (e) => {
            if (this.generationMode && (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)) {
                this.deactivateGenerationMode();
            }
        });
    }
    
    handleKeyDown(e) {
        // Don't trigger shortcuts when typing in inputs
        if (this.isInputFocused()) {
            // Only allow Escape and Ctrl+Enter in inputs
            if (e.key === 'Escape') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.blur) {
                    activeElement.blur();
                }
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                // Allow Ctrl+Enter in inputs
            } else {
                return;
            }
        }
        
        // Build shortcut key
        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.metaKey) parts.push('Meta');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        parts.push(key);
        
        const shortcutKey = parts.join('+');
        
        // Check for exact match first
        if (this.shortcuts.has(shortcutKey)) {
            const handler = this.shortcuts.get(shortcutKey);
            if (handler && typeof handler.callback === 'function') {
                e.preventDefault();
                handler.callback(e);
                return;
            }
        }
        
        // Check for single key shortcuts (only if no modifiers and not in generation mode)
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !this.generationMode) {
            if (this.shortcuts.has(key)) {
                const handler = this.shortcuts.get(key);
                if (handler && typeof handler.callback === 'function') {
                    e.preventDefault();
                    handler.callback(e);
                    return;
                }
            }
        }
    }
    
    register(key, callback, description = '', options = {}) {
        this.shortcuts.set(key, { callback, description, ...options });
    }
    
    unregister(key) {
        this.shortcuts.delete(key);
    }
    
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable ||
            activeElement.contentEditable === 'true'
        );
    }
    
    // Navigation methods
    switchTab(index) {
        const tabs = ['create', 'analyze', 'library', 'ai'];
        if (index >= 0 && index < tabs.length) {
            const tabBtn = document.querySelector(`[data-main-tab="${tabs[index]}"]`);
            if (tabBtn) tabBtn.click();
        }
    }
    
    cycleTab(direction) {
        const tabs = ['create', 'analyze', 'library', 'ai'];
        // Get current tab from active button
        const activeTab = document.querySelector('.main-tab-btn.active');
        const currentTabName = activeTab ? activeTab.getAttribute('data-main-tab') : 'create';
        const currentIndex = tabs.indexOf(currentTabName);
        const newIndex = (currentIndex + direction + tabs.length) % tabs.length;
        this.switchTab(newIndex);
    }
    
    // Transport methods
    togglePlay() {
        const btn = document.getElementById('btn-play');
        if (btn) btn.click();
    }
    
    toggleRecord() {
        const btn = document.getElementById('btn-record');
        if (btn) btn.click();
    }
    
    stop() {
        const btn = document.getElementById('btn-stop');
        if (btn) btn.click();
    }
    
    // Generation methods
    activateGenerationMode() {
        this.generationMode = true;
        if (window.showNotification) {
            window.showNotification('Generation mode active. Press K/C/H/P/B/S/V/F', 'info', 2000);
        }
        
        // Deactivate after 2 seconds
        if (this.generationTimer) clearTimeout(this.generationTimer);
        this.generationTimer = setTimeout(() => {
            this.deactivateGenerationMode();
        }, 2000);
    }
    
    deactivateGenerationMode() {
        this.generationMode = false;
        if (this.generationTimer) {
            clearTimeout(this.generationTimer);
            this.generationTimer = null;
        }
    }
    
    triggerGeneration(type) {
        const button = document.querySelector(`[data-type="${type}"]`);
        if (button) {
            button.click();
        }
    }
    
    // Focus methods
    focusField(fieldId) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.focus();
            if (element.tagName === 'SELECT') {
                // For select elements, try to open dropdown
                setTimeout(() => element.click(), 10);
            }
        }
    }
    
    focusSearch() {
        const searchInput = document.getElementById('media-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Action methods
    undo() {
        if (window.undoManager && window.undoManager.canUndo()) {
            window.undoManager.undo();
        } else {
            if (window.showNotification) {
                window.showNotification('Nothing to undo', 'info', 2000);
            }
        }
    }
    
    redo() {
        if (window.undoManager && window.undoManager.canRedo()) {
            window.undoManager.redo();
        } else {
            if (window.showNotification) {
                window.showNotification('Nothing to redo', 'info', 2000);
            }
        }
    }
    
    save() {
        if (window.showNotification) {
            window.showNotification('Save functionality coming soon', 'info', 2000);
        }
    }
    
    duplicate() {
        // Trigger duplicate action based on current context
        const duplicateBtn = document.getElementById('action-duplicate');
        if (duplicateBtn && !duplicateBtn.disabled) {
            duplicateBtn.click();
        } else {
            if (window.showNotification) {
                window.showNotification('No item selected to duplicate', 'info', 2000);
            }
        }
    }
    
    // Help and Settings
    showHelp() {
        if (window.showHelpPanel) {
            window.showHelpPanel();
        }
    }
    
    showSettings() {
        if (window.showSettingsPanel) {
            window.showSettingsPanel();
        }
    }
    
    // Create Tab Enhancement methods
    isCreateTab() {
        const activeTab = document.querySelector('.main-tab-btn.active');
        return activeTab && activeTab.dataset.mainTab === 'create';
    }
    
    loadPreset(name) {
        if (window.createTabEnhancements) {
            window.createTabEnhancements.loadPreset(name);
        }
    }
    
    toggleBatchMode() {
        const toggle = document.getElementById('batch-mode-toggle');
        if (toggle) {
            toggle.checked = !toggle.checked;
            toggle.dispatchEvent(new Event('change'));
        }
    }
    
    showPresetLoader() {
        const dropdown = document.getElementById('preset-dropdown');
        if (dropdown) {
            dropdown.focus();
            dropdown.click();
        }
    }
    
    // Utility methods
    enable() {
        this.isEnabled = true;
    }
    
    disable() {
        this.isEnabled = false;
    }
    
    getShortcuts() {
        const shortcuts = [];
        for (const [key, handler] of this.shortcuts.entries()) {
            shortcuts.push({
                key: key.replace(/Meta/g, this.isMac ? 'Cmd' : 'Ctrl'),
                description: handler.description || '',
                callback: handler.callback
            });
        }
        return shortcuts;
    }
}

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.KeyboardShortcuts = KeyboardShortcuts;
}

