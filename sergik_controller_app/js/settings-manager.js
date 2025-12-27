/**
 * Settings Manager
 * Handles app settings, persistence, and UI
 */

class SettingsManager {
    constructor() {
        this.settings = this.getDefaultSettings();
        this.loadSettings();
        this.setupEventListeners();
    }
    
    getDefaultSettings() {
        return {
            api: {
                url: 'http://127.0.0.1:8000',
                timeout: 10000,
                retryCount: 3
            },
            appearance: {
                theme: 'dark',
                fontSize: 'medium',
                uiDensity: 'normal'
            },
            behavior: {
                autoSave: false,
                autoConnect: true,
                defaultTempo: 124
            },
            notifications: {
                enabled: true,
                sound: false,
                duration: 3000
            },
            advanced: {
                debugMode: false,
                logLevel: 'info'
            }
        };
    }
    
    loadSettings() {
        try {
            const stored = localStorage.getItem('sergik-settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...this.getDefaultSettings(), ...parsed };
            }
        } catch (error) {
            console.error('[Settings] Failed to load settings:', error);
        }
        this.applySettings();
    }
    
    saveSettings() {
        try {
            localStorage.setItem('sergik-settings', JSON.stringify(this.settings));
            this.applySettings();
            if (window.showNotification) {
                window.showNotification('Settings saved', 'success', 2000);
            }
            return true;
        } catch (error) {
            console.error('[Settings] Failed to save settings:', error);
            if (window.showNotification) {
                window.showNotification('Failed to save settings', 'error', 3000);
            }
            return false;
        }
    }
    
    applySettings() {
        // Apply theme
        if (this.settings.appearance.theme === 'light') {
            document.body.classList.add('theme-light');
        } else {
            document.body.classList.remove('theme-light');
        }
        
        // Apply font size
        document.documentElement.style.setProperty('--font-size-base', 
            this.settings.appearance.fontSize === 'small' ? '11px' :
            this.settings.appearance.fontSize === 'large' ? '13px' : '12px'
        );
        
        // Apply UI density
        document.body.classList.remove('density-compact', 'density-comfortable');
        if (this.settings.appearance.uiDensity !== 'normal') {
            document.body.classList.add(`density-${this.settings.appearance.uiDensity}`);
        }
        
        // Update API URL if needed
        if (window.sergikAPI && this.settings.api.url) {
            // API URL is managed in main.js, would need IPC to update
        }
    }
    
    setupEventListeners() {
        // Settings modal
        const modal = document.getElementById('settings-modal');
        const closeBtn = document.getElementById('settings-close');
        const cancelBtn = document.getElementById('settings-cancel');
        const saveBtn = document.getElementById('settings-save');
        
        // Navigation
        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Close handlers
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hide());
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveFromUI());
        }
        
        // Close on backdrop click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hide();
                }
            });
        }
        
        // Test API connection
        const testBtn = document.getElementById('test-api-connection');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testConnection());
        }
        
        // Export/Import
        const exportBtn = document.getElementById('export-settings');
        const importBtn = document.getElementById('import-settings');
        const resetBtn = document.getElementById('reset-settings');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSettings());
        }
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importSettings());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }
    }
    
    show() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            this.populateUI();
            modal.classList.add('show');
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }
    
    hide() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    showSection(sectionName) {
        // Update nav buttons
        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-section') === sectionName);
        });
        
        // Update sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.toggle('active', section.id === `settings-${sectionName}`);
        });
    }
    
    populateUI() {
        // API
        const apiUrl = document.getElementById('settings-api-url');
        const timeout = document.getElementById('settings-timeout');
        const retryCount = document.getElementById('settings-retry-count');
        
        if (apiUrl) apiUrl.value = this.settings.api.url;
        if (timeout) timeout.value = this.settings.api.timeout;
        if (retryCount) retryCount.value = this.settings.api.retryCount;
        
        // Appearance
        const theme = document.getElementById('settings-theme');
        const fontSize = document.getElementById('settings-font-size');
        const uiDensity = document.getElementById('settings-ui-density');
        
        if (theme) theme.value = this.settings.appearance.theme;
        if (fontSize) fontSize.value = this.settings.appearance.fontSize;
        if (uiDensity) uiDensity.value = this.settings.appearance.uiDensity;
        
        // Behavior
        const autoSave = document.getElementById('settings-auto-save');
        const autoConnect = document.getElementById('settings-auto-connect');
        const defaultTempo = document.getElementById('settings-default-tempo');
        
        if (autoSave) autoSave.checked = this.settings.behavior.autoSave;
        if (autoConnect) autoConnect.checked = this.settings.behavior.autoConnect;
        if (defaultTempo) defaultTempo.value = this.settings.behavior.defaultTempo;
        
        // Notifications
        const notifEnabled = document.getElementById('settings-notifications-enabled');
        const notifSound = document.getElementById('settings-notifications-sound');
        const notifDuration = document.getElementById('settings-notification-duration');
        
        if (notifEnabled) notifEnabled.checked = this.settings.notifications.enabled;
        if (notifSound) notifSound.checked = this.settings.notifications.sound;
        if (notifDuration) notifDuration.value = this.settings.notifications.duration;
        
        // Advanced
        const debugMode = document.getElementById('settings-debug-mode');
        const logLevel = document.getElementById('settings-log-level');
        
        if (debugMode) debugMode.checked = this.settings.advanced.debugMode;
        if (logLevel) logLevel.value = this.settings.advanced.logLevel;
        
        // Keyboard shortcuts
        this.populateKeyboardShortcuts();
    }
    
    populateKeyboardShortcuts() {
        const list = document.getElementById('keyboard-shortcuts-list');
        if (!list || !window.keyboardShortcuts) return;
        
        list.innerHTML = '';
        const shortcuts = window.keyboardShortcuts.getShortcuts();
        
        shortcuts.forEach(({ key, description }) => {
            if (!description) return;
            
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            item.innerHTML = `
                <span class="shortcut-item-label">${description}</span>
                <kbd class="shortcut-item-key">${key}</kbd>
            `;
            list.appendChild(item);
        });
    }
    
    saveFromUI() {
        // API
        const apiUrl = document.getElementById('settings-api-url');
        const timeout = document.getElementById('settings-timeout');
        const retryCount = document.getElementById('settings-retry-count');
        
        if (apiUrl) this.settings.api.url = apiUrl.value;
        if (timeout) this.settings.api.timeout = parseInt(timeout.value);
        if (retryCount) this.settings.api.retryCount = parseInt(retryCount.value);
        
        // Appearance
        const theme = document.getElementById('settings-theme');
        const fontSize = document.getElementById('settings-font-size');
        const uiDensity = document.getElementById('settings-ui-density');
        
        if (theme) this.settings.appearance.theme = theme.value;
        if (fontSize) this.settings.appearance.fontSize = fontSize.value;
        if (uiDensity) this.settings.appearance.uiDensity = uiDensity.value;
        
        // Behavior
        const autoSave = document.getElementById('settings-auto-save');
        const autoConnect = document.getElementById('settings-auto-connect');
        const defaultTempo = document.getElementById('settings-default-tempo');
        
        if (autoSave) this.settings.behavior.autoSave = autoSave.checked;
        if (autoConnect) this.settings.behavior.autoConnect = autoConnect.checked;
        if (defaultTempo) this.settings.behavior.defaultTempo = parseInt(defaultTempo.value);
        
        // Notifications
        const notifEnabled = document.getElementById('settings-notifications-enabled');
        const notifSound = document.getElementById('settings-notifications-sound');
        const notifDuration = document.getElementById('settings-notification-duration');
        
        if (notifEnabled) this.settings.notifications.enabled = notifEnabled.checked;
        if (notifSound) this.settings.notifications.sound = notifSound.checked;
        if (notifDuration) this.settings.notifications.duration = parseInt(notifDuration.value);
        
        // Advanced
        const debugMode = document.getElementById('settings-debug-mode');
        const logLevel = document.getElementById('settings-log-level');
        
        if (debugMode) this.settings.advanced.debugMode = debugMode.checked;
        if (logLevel) this.settings.advanced.logLevel = logLevel.value;
        
        this.saveSettings();
        this.hide();
    }
    
    async testConnection() {
        const apiUrl = document.getElementById('settings-api-url');
        const url = apiUrl ? apiUrl.value : this.settings.api.url;
        
        if (window.loadingStates) {
            window.loadingStates.setButtonLoading(document.getElementById('test-api-connection'), true);
        }
        
        try {
            const response = await fetch(`${url}/health`, { 
                method: 'GET',
                timeout: 5000 
            });
            
            if (response.ok) {
                if (window.showNotification) {
                    window.showNotification('Connection successful!', 'success', 2000);
                }
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.showError(error);
            } else if (window.showNotification) {
                window.showNotification('Connection failed', 'error', 3000);
            }
        } finally {
            if (window.loadingStates) {
                window.loadingStates.setButtonLoading(document.getElementById('test-api-connection'), false);
            }
        }
    }
    
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sergik-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        if (window.showNotification) {
            window.showNotification('Settings exported', 'success', 2000);
        }
    }
    
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    this.settings = { ...this.getDefaultSettings(), ...imported };
                    this.saveSettings();
                    this.populateUI();
                    if (window.showNotification) {
                        window.showNotification('Settings imported', 'success', 2000);
                    }
                } catch (error) {
                    if (window.errorHandler) {
                        window.errorHandler.showError(error);
                    }
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            this.settings = this.getDefaultSettings();
            this.saveSettings();
            this.populateUI();
            if (window.showNotification) {
                window.showNotification('Settings reset to defaults', 'success', 2000);
            }
        }
    }
    
    getSetting(path) {
        const parts = path.split('.');
        let value = this.settings;
        for (const part of parts) {
            value = value[part];
            if (value === undefined) return null;
        }
        return value;
    }
    
    setSetting(path, value) {
        const parts = path.split('.');
        const lastPart = parts.pop();
        let obj = this.settings;
        for (const part of parts) {
            if (!obj[part]) obj[part] = {};
            obj = obj[part];
        }
        obj[lastPart] = value;
        this.saveSettings();
    }
}

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.SettingsManager = SettingsManager;
    window.settingsManager = new SettingsManager();
    window.showSettingsPanel = function() {
        if (window.settingsManager) {
            window.settingsManager.show();
        }
    };
}

