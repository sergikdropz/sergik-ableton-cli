/**
 * Settings Manager
 * Handles app settings, persistence, and UI
 */

class SettingsManager {
    constructor() {
        this.settings = this.getDefaultSettings();
        this.loadSettings();
        this.setupEventListeners();
        // Load API settings from main process after a short delay
        setTimeout(() => this.loadApiSettingsFromMain(), 500);
    }
    
    getDefaultSettings() {
        return {
            api: {
                url: 'http://127.0.0.1:8000',
                timeout: 10000,
                retryCount: 3,
                retryDelay: 1000,
                retryBackoff: true,
                // Authentication
                authType: 'none', // none, api_key, bearer, basic
                apiKey: '',
                apiKeyHeader: 'X-API-Key',
                bearerToken: '',
                basicUsername: '',
                basicPassword: '',
                // Custom headers
                customHeaders: {},
                // Per-endpoint timeouts (ms)
                endpointTimeouts: {
                    health: 5000,
                    generate: 30000,
                    analyze: 60000,
                    live: 10000,
                    transport: 5000,
                    browser: 10000
                },
                // Request configuration
                maxRequestSize: 10485760, // 10MB
                followRedirects: true,
                validateSSL: true,
                // Proxy settings
                useProxy: false,
                proxyHost: '',
                proxyPort: '',
                proxyAuth: false,
                proxyUsername: '',
                proxyPassword: '',
                // Logging and monitoring
                logRequests: false,
                logResponses: false,
                logErrors: true,
                showRequestDetails: false,
                // Connection settings
                keepAlive: true,
                maxConnections: 10,
                connectionTimeout: 5000,
                // Ngrok support
                useNgrok: false,
                ngrokUrl: '',
                ngrokApiKey: '', // For ngrok API to get dynamic URLs
                // Multiple API Keys for AI services
                apiKeys: {
                    // SERGIK API
                    sergik: {
                        enabled: false,
                        key: '',
                        header: 'X-API-Key'
                    },
                    // OpenAI for GPT/voice
                    openai: {
                        enabled: false,
                        key: '',
                        header: 'Authorization',
                        prefix: 'Bearer'
                    },
                    // Anthropic Claude
                    anthropic: {
                        enabled: false,
                        key: '',
                        header: 'x-api-key'
                    },
                    // Google AI
                    google: {
                        enabled: false,
                        key: '',
                        header: 'Authorization',
                        prefix: 'Bearer'
                    },
                    // Custom API keys
                    custom: []
                }
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
    
    async applySettings() {
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
        
        // Sync API settings with main process
        if (window.sergikAPI && window.sergikAPI.setApiSettings && this.settings.api) {
            try {
                await window.sergikAPI.setApiSettings(this.settings.api);
            } catch (error) {
                console.error('[Settings] Failed to sync API settings:', error);
            }
        }
    }
    
    async loadApiSettingsFromMain() {
        // Load API settings from main process if available
        if (window.sergikAPI && window.sergikAPI.getApiSettings) {
            try {
                const mainSettings = await window.sergikAPI.getApiSettings();
                if (mainSettings) {
                    this.settings.api = { ...this.getDefaultSettings().api, ...mainSettings };
                    this.saveSettings();
                }
            } catch (error) {
                console.error('[Settings] Failed to load API settings from main:', error);
            }
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
        
        // Auth type change handler
        const authType = document.getElementById('settings-auth-type');
        if (authType) {
            authType.addEventListener('change', () => this.updateAuthFieldsVisibility());
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
        // API - Basic
        const apiUrl = document.getElementById('settings-api-url');
        const timeout = document.getElementById('settings-timeout');
        const retryCount = document.getElementById('settings-retry-count');
        const retryDelay = document.getElementById('settings-retry-delay');
        const retryBackoff = document.getElementById('settings-retry-backoff');
        
        if (apiUrl) apiUrl.value = this.settings.api.url || 'http://127.0.0.1:8000';
        if (timeout) timeout.value = this.settings.api.timeout || 10000;
        if (retryCount) retryCount.value = this.settings.api.retryCount || 3;
        if (retryDelay) retryDelay.value = this.settings.api.retryDelay || 1000;
        if (retryBackoff) retryBackoff.checked = this.settings.api.retryBackoff !== false;
        
        // API - Authentication
        const authType = document.getElementById('settings-auth-type');
        const apiKey = document.getElementById('settings-api-key');
        const apiKeyHeader = document.getElementById('settings-api-key-header');
        const bearerToken = document.getElementById('settings-bearer-token');
        const basicUsername = document.getElementById('settings-basic-username');
        const basicPassword = document.getElementById('settings-basic-password');
        
        if (authType) authType.value = this.settings.api.authType || 'none';
        if (apiKey) apiKey.value = this.settings.api.apiKey || '';
        if (apiKeyHeader) apiKeyHeader.value = this.settings.api.apiKeyHeader || 'X-API-Key';
        if (bearerToken) bearerToken.value = this.settings.api.bearerToken || '';
        if (basicUsername) basicUsername.value = this.settings.api.basicUsername || '';
        if (basicPassword) basicPassword.value = this.settings.api.basicPassword || '';
        
        // API - Endpoint Timeouts
        const timeoutHealth = document.getElementById('settings-timeout-health');
        const timeoutGenerate = document.getElementById('settings-timeout-generate');
        const timeoutAnalyze = document.getElementById('settings-timeout-analyze');
        const timeoutLive = document.getElementById('settings-timeout-live');
        
        const timeouts = this.settings.api.endpointTimeouts || {};
        if (timeoutHealth) timeoutHealth.value = timeouts.health || 5000;
        if (timeoutGenerate) timeoutGenerate.value = timeouts.generate || 30000;
        if (timeoutAnalyze) timeoutAnalyze.value = timeouts.analyze || 60000;
        if (timeoutLive) timeoutLive.value = timeouts.live || 10000;
        
        // API - Logging
        const logRequests = document.getElementById('settings-log-requests');
        const logResponses = document.getElementById('settings-log-responses');
        const logErrors = document.getElementById('settings-log-errors');
        const showRequestDetails = document.getElementById('settings-show-request-details');
        
        if (logRequests) logRequests.checked = this.settings.api.logRequests === true;
        if (logResponses) logResponses.checked = this.settings.api.logResponses === true;
        if (logErrors) logErrors.checked = this.settings.api.logErrors !== false;
        if (showRequestDetails) showRequestDetails.checked = this.settings.api.showRequestDetails === true;
        
        // API - Connection
        const keepAlive = document.getElementById('settings-keep-alive');
        const maxConnections = document.getElementById('settings-max-connections');
        const connectionTimeout = document.getElementById('settings-connection-timeout');
        const validateSSL = document.getElementById('settings-validate-ssl');
        
        if (keepAlive) keepAlive.checked = this.settings.api.keepAlive !== false;
        if (maxConnections) maxConnections.value = this.settings.api.maxConnections || 10;
        if (connectionTimeout) connectionTimeout.value = this.settings.api.connectionTimeout || 5000;
        if (validateSSL) validateSSL.checked = this.settings.api.validateSSL !== false;
        
        // Update auth visibility
        this.updateAuthFieldsVisibility();
        
        // Populate API keys (async, loads from main process)
        setTimeout(() => this.populateApiKeysUI(), 100);
        
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

        // Ngrok settings
        const useNgrok = document.getElementById('settings-use-ngrok');
        const ngrokUrl = document.getElementById('settings-ngrok-url');
        const ngrokApiKey = document.getElementById('settings-ngrok-api-key');
        
        if (useNgrok) useNgrok.checked = this.settings.api.useNgrok === true;
        if (ngrokUrl) ngrokUrl.value = this.settings.api.ngrokUrl || '';
        if (ngrokApiKey) ngrokApiKey.value = this.settings.api.ngrokApiKey || '';
        
        // Populate API keys
        this.populateApiKeysUI();
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
        // API - Basic
        const apiUrl = document.getElementById('settings-api-url');
        const timeout = document.getElementById('settings-timeout');
        const retryCount = document.getElementById('settings-retry-count');
        const retryDelay = document.getElementById('settings-retry-delay');
        const retryBackoff = document.getElementById('settings-retry-backoff');
        
        if (apiUrl) this.settings.api.url = apiUrl.value;
        if (timeout) this.settings.api.timeout = parseInt(timeout.value) || 10000;
        if (retryCount) this.settings.api.retryCount = parseInt(retryCount.value) || 3;
        if (retryDelay) this.settings.api.retryDelay = parseInt(retryDelay.value) || 1000;
        if (retryBackoff) this.settings.api.retryBackoff = retryBackoff.checked;
        
        // API - Authentication
        const authType = document.getElementById('settings-auth-type');
        const apiKey = document.getElementById('settings-api-key');
        const apiKeyHeader = document.getElementById('settings-api-key-header');
        const bearerToken = document.getElementById('settings-bearer-token');
        const basicUsername = document.getElementById('settings-basic-username');
        const basicPassword = document.getElementById('settings-basic-password');
        
        if (authType) this.settings.api.authType = authType.value;
        if (apiKey) this.settings.api.apiKey = apiKey.value;
        if (apiKeyHeader) this.settings.api.apiKeyHeader = apiKeyHeader.value;
        if (bearerToken) this.settings.api.bearerToken = bearerToken.value;
        if (basicUsername) this.settings.api.basicUsername = basicUsername.value;
        if (basicPassword) this.settings.api.basicPassword = basicPassword.value;
        
        // API - Endpoint Timeouts
        const timeoutHealth = document.getElementById('settings-timeout-health');
        const timeoutGenerate = document.getElementById('settings-timeout-generate');
        const timeoutAnalyze = document.getElementById('settings-timeout-analyze');
        const timeoutLive = document.getElementById('settings-timeout-live');
        
        if (!this.settings.api.endpointTimeouts) {
            this.settings.api.endpointTimeouts = {};
        }
        if (timeoutHealth) this.settings.api.endpointTimeouts.health = parseInt(timeoutHealth.value) || 5000;
        if (timeoutGenerate) this.settings.api.endpointTimeouts.generate = parseInt(timeoutGenerate.value) || 30000;
        if (timeoutAnalyze) this.settings.api.endpointTimeouts.analyze = parseInt(timeoutAnalyze.value) || 60000;
        if (timeoutLive) this.settings.api.endpointTimeouts.live = parseInt(timeoutLive.value) || 10000;
        
        // API - Logging
        const logRequests = document.getElementById('settings-log-requests');
        const logResponses = document.getElementById('settings-log-responses');
        const logErrors = document.getElementById('settings-log-errors');
        const showRequestDetails = document.getElementById('settings-show-request-details');
        
        if (logRequests) this.settings.api.logRequests = logRequests.checked;
        if (logResponses) this.settings.api.logResponses = logResponses.checked;
        if (logErrors) this.settings.api.logErrors = logErrors.checked;
        if (showRequestDetails) this.settings.api.showRequestDetails = showRequestDetails.checked;
        
        // API - Connection
        const keepAlive = document.getElementById('settings-keep-alive');
        const maxConnections = document.getElementById('settings-max-connections');
        const connectionTimeout = document.getElementById('settings-connection-timeout');
        const validateSSL = document.getElementById('settings-validate-ssl');
        
        if (keepAlive) this.settings.api.keepAlive = keepAlive.checked;
        if (maxConnections) this.settings.api.maxConnections = parseInt(maxConnections.value) || 10;
        if (connectionTimeout) this.settings.api.connectionTimeout = parseInt(connectionTimeout.value) || 5000;
        if (validateSSL) this.settings.api.validateSSL = validateSSL.checked;
        
        // Ngrok settings
        const useNgrok = document.getElementById('settings-use-ngrok');
        const ngrokUrl = document.getElementById('settings-ngrok-url');
        const ngrokApiKey = document.getElementById('settings-ngrok-api-key');
        
        if (useNgrok) this.settings.api.useNgrok = useNgrok.checked;
        if (ngrokUrl) this.settings.api.ngrokUrl = ngrokUrl.value;
        if (ngrokApiKey) this.settings.api.ngrokApiKey = ngrokApiKey.value;
        
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
    
    updateAuthFieldsVisibility() {
        const authType = document.getElementById('settings-auth-type');
        if (!authType) return;
        
        const selectedType = authType.value;
        
        // Hide all auth fields
        const apiKeyGroup = document.getElementById('settings-auth-api-key-group');
        const bearerGroup = document.getElementById('settings-auth-bearer-group');
        const basicGroup = document.getElementById('settings-auth-basic-group');
        
        if (apiKeyGroup) apiKeyGroup.classList.remove('active');
        if (bearerGroup) bearerGroup.classList.remove('active');
        if (basicGroup) basicGroup.classList.remove('active');
        
        // Show relevant fields
        switch (selectedType) {
            case 'api_key':
                if (apiKeyGroup) apiKeyGroup.classList.add('active');
                break;
            case 'bearer':
                if (bearerGroup) bearerGroup.classList.add('active');
                break;
            case 'basic':
                if (basicGroup) basicGroup.classList.add('active');
                break;
        }
    }
    
    async testConnection() {
        const apiUrl = document.getElementById('settings-api-url');
        const url = apiUrl ? apiUrl.value : this.settings.api.url;
        
        if (window.loadingStates) {
            window.loadingStates.setButtonLoading(document.getElementById('test-api-connection'), true);
        }
        
        try {
            // Use IPC to test connection with proper auth
            if (window.sergikAPI && window.sergikAPI.checkHealth) {
                const result = await window.sergikAPI.checkHealth();
                if (result.success) {
                    if (window.showNotification) {
                        window.showNotification('Connection successful!', 'success', 2000);
                    }
                } else {
                    throw new Error(result.error || 'Connection failed');
                }
            } else {
                // Fallback to direct fetch
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
            }
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.showError(error);
            } else if (window.showNotification) {
                window.showNotification(`Connection failed: ${error.message}`, 'error', 3000);
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

    async populateApiKeysUI() {
        const list = document.getElementById('api-keys-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        const services = [
            { name: 'sergik', label: 'SERGIK API', description: 'For SERGIK ML endpoints', envVar: 'SERGIK_API_KEY' },
            { name: 'openai', label: 'OpenAI', description: 'For GPT generation and voice', envVar: 'OPENAI_API_KEY' },
            { name: 'anthropic', label: 'Anthropic Claude', description: 'For Claude AI models', envVar: 'ANTHROPIC_API_KEY' },
            { name: 'google', label: 'Google AI', description: 'For Google AI services', envVar: 'GOOGLE_API_KEY' }
        ];
        
        // Check which services have keys stored and their sources
        const hasKeys = {};
        const keySources = {}; // Track where keys came from (env vs user)
        
        if (window.sergikAPI && window.sergikAPI.listApiKeys) {
            try {
                const storedKeys = await window.sergikAPI.listApiKeys();
                storedKeys.forEach(service => {
                    hasKeys[service] = true;
                });
                
                // Get info about key sources
                if (window.sergikAPI.getApiKeysInfo) {
                    try {
                        const keysInfo = await window.sergikAPI.getApiKeysInfo();
                        Object.entries(keysInfo).forEach(([service, info]) => {
                            keySources[service] = info;
                        });
                    } catch (error) {
                        console.warn('[Settings] Failed to get API keys info:', error);
                    }
                }
            } catch (error) {
                console.error('[Settings] Failed to load API keys list:', error);
            }
        }
        
        services.forEach(({ name, label, description, envVar }) => {
            const keyConfig = this.settings.api?.apiKeys?.[name] || { enabled: false, key: '' };
            const hasKey = hasKeys[name] || false;
            const keySource = keySources[name];
            
            // Show hint about environment variable if key exists and came from env
            let envHint = '';
            if (hasKey && keySource && keySource.source === 'environment' && keySource.envVar) {
                envHint = `<span class="field-hint" style="display: block; margin-top: 2px; font-size: 9px; color: var(--accent-cyan);">✓ Loaded from ${keySource.envVar}</span>`;
            } else if (hasKey && envVar) {
                envHint = `<span class="field-hint" style="display: block; margin-top: 2px; font-size: 9px; color: var(--text-tertiary);">Set ${envVar} to load automatically</span>`;
            }
            
            const item = document.createElement('div');
            item.className = 'api-key-item';
            item.innerHTML = `
                <div class="api-key-header">
                    <div>
                        <label>
                            <input type="checkbox" class="api-key-enabled" data-service="${name}" ${keyConfig.enabled ? 'checked' : ''}>
                            <strong>${label}</strong>
                        </label>
                        <span class="field-hint" style="display: block; margin-top: 4px;">${description}</span>
                        ${envHint}
                    </div>
                    ${hasKey ? `<button class="btn-icon delete-api-key" data-service="${name}" title="Delete key">×</button>` : ''}
                </div>
                <div class="api-key-input">
                    <input type="password" 
                           class="api-key-value" 
                           data-service="${name}" 
                           placeholder="Enter ${label} API key${envVar ? ` (or set ${envVar})` : ''}"
                           value="${hasKey ? '••••••••' : ''}"
                           ${hasKey ? 'data-has-key="true"' : ''}>
                    ${hasKey ? `<button class="btn-small toggle-visibility" data-service="${name}" data-visible="false">Show</button>` : ''}
                </div>
            `;
            list.appendChild(item);
        });
        
        // Add event listeners
        list.querySelectorAll('.api-key-enabled').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const service = e.target.dataset.service;
                if (!this.settings.api.apiKeys[service]) {
                    this.settings.api.apiKeys[service] = { enabled: false, key: '' };
                }
                this.settings.api.apiKeys[service].enabled = e.target.checked;
                this.saveSettings();
            });
        });
        
        list.querySelectorAll('.api-key-value').forEach(input => {
            input.addEventListener('blur', async (e) => {
                const service = e.target.dataset.service;
                const value = e.target.value;
                
                if (value && value !== '••••••••') {
                    // Save to main process securely
                    if (window.sergikAPI && window.sergikAPI.setApiKey) {
                        try {
                            await window.sergikAPI.setApiKey(service, value);
                            // Update UI to show key is saved
                            e.target.value = '••••••••';
                            // Add delete button if not present
                            const item = e.target.closest('.api-key-item');
                            const header = item.querySelector('.api-key-header');
                            if (!header.querySelector('.delete-api-key')) {
                                const deleteBtn = document.createElement('button');
                                deleteBtn.className = 'btn-icon delete-api-key';
                                deleteBtn.dataset.service = service;
                                deleteBtn.title = 'Delete key';
                                deleteBtn.textContent = '×';
                                deleteBtn.addEventListener('click', async () => {
                                    if (confirm(`Delete ${service} API key?`)) {
                                        if (window.sergikAPI && window.sergikAPI.deleteApiKey) {
                                            await window.sergikAPI.deleteApiKey(service);
                                        }
                                        if (this.settings.api.apiKeys[service]) {
                                            delete this.settings.api.apiKeys[service];
                                        }
                                        this.populateApiKeysUI();
                                    }
                                });
                                header.appendChild(deleteBtn);
                            }
                            // Add show/hide button if not present
                            const inputContainer = item.querySelector('.api-key-input');
                            if (!inputContainer.querySelector('.toggle-visibility')) {
                                const toggleBtn = document.createElement('button');
                                toggleBtn.className = 'btn-small toggle-visibility';
                                toggleBtn.dataset.service = service;
                                toggleBtn.dataset.visible = 'false';
                                toggleBtn.textContent = 'Show';
                                toggleBtn.addEventListener('click', () => {
                                    const isVisible = toggleBtn.dataset.visible === 'true';
                                    e.target.type = isVisible ? 'password' : 'text';
                                    toggleBtn.textContent = isVisible ? 'Show' : 'Hide';
                                    toggleBtn.dataset.visible = isVisible ? 'false' : 'true';
                                });
                                inputContainer.appendChild(toggleBtn);
                            }
                            if (window.showNotification) {
                                window.showNotification(`${service.toUpperCase()} API key saved securely`, 'success', 2000);
                            }
                        } catch (error) {
                            console.error('[Settings] Failed to save API key:', error);
                            if (window.showNotification) {
                                window.showNotification('Failed to save API key', 'error', 3000);
                            }
                        }
                    }
                    
                    if (!this.settings.api.apiKeys[service]) {
                        this.settings.api.apiKeys[service] = { enabled: false, key: '' };
                    }
                    this.settings.api.apiKeys[service].key = '***'; // Don't store in localStorage
                    this.saveSettings();
                }
            });
        });
        
        list.querySelectorAll('.delete-api-key').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const service = e.target.dataset.service;
                if (confirm(`Delete ${service} API key?`)) {
                    if (window.sergikAPI && window.sergikAPI.deleteApiKey) {
                        try {
                            await window.sergikAPI.deleteApiKey(service);
                            if (this.settings.api.apiKeys && this.settings.api.apiKeys[service]) {
                                delete this.settings.api.apiKeys[service];
                            }
                            this.populateApiKeysUI();
                            if (window.showNotification) {
                                window.showNotification(`${service.toUpperCase()} API key deleted`, 'success', 2000);
                            }
                        } catch (error) {
                            console.error('[Settings] Failed to delete API key:', error);
                            if (window.showNotification) {
                                window.showNotification('Failed to delete API key', 'error', 3000);
                            }
                        }
                    }
                }
            });
        });
        
        // Toggle visibility buttons
        list.querySelectorAll('.toggle-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                const input = list.querySelector(`.api-key-value[data-service="${service}"]`);
                const isVisible = e.target.dataset.visible === 'true';
                
                if (input) {
                    input.type = isVisible ? 'password' : 'text';
                    e.target.textContent = isVisible ? 'Show' : 'Hide';
                    e.target.dataset.visible = isVisible ? 'false' : 'true';
                }
            });
        });
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

