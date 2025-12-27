/**
 * Developer Console
 * Captures and displays logs, API calls, errors, and performance metrics
 */

class DeveloperConsole {
    constructor() {
        // Load dev config if available
        this.devConfig = typeof window !== 'undefined' && window.SergikDevConfig 
            ? window.SergikDevConfig 
            : null;
        
        this.logs = [];
        this.networkRequests = [];
        
        // Use dev config values or defaults
        this.maxLogs = this.devConfig?.get('maxLogs') || 1000;
        this.maxNetworkRequests = this.devConfig?.get('maxNetworkRequests') || 500;
        this.enabled = true;
        this.logApiCalls = this.devConfig?.get('logApiCalls') !== false;
        this.logErrors = this.devConfig?.get('logErrors') !== false;
        this.logPerformance = this.devConfig?.get('logPerformance') || false;
        this.filter = 'all';
        this.shouldRender = false;
        this.searchQuery = '';
        this.currentTab = 'console';
        
        // Feature flags - use dev config
        this.enhancedRendering = true;
        this.expandableObjects = true;
        this.networkTabEnabled = true;
        this.performanceTabEnabled = this.devConfig?.get('enableProfiling') || false;
        this.performanceMetrics = [];
        
        // Resource-efficient rendering
        this.renderThrottle = null;
        this.renderDebounceMs = 100; // Throttle renders to avoid performance issues
        
        // Intercept console methods
        this.originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info,
            debug: console.debug
        };
        
        this.setupConsoleInterception();
        this.setupApiInterception();
        this.setupErrorHandling();
        this.setupIPCInterception();
        this.setupUI();
        
        // Add initial log
        this.addLog('info', 'Developer Console initialized', { 
            timestamp: new Date().toISOString(),
            devConfig: this.devConfig ? 'loaded' : 'default'
        });
    }
    
    setupConsoleInterception() {
        const self = this;
        
        console.log = function(...args) {
            self.originalConsole.log.apply(console, args);
            self.addLog('info', args.join(' '), args.length > 1 ? args : null);
        };
        
        console.error = function(...args) {
            self.originalConsole.error.apply(console, args);
            self.addLog('error', args.join(' '), args.length > 1 ? args : null);
        };
        
        console.warn = function(...args) {
            self.originalConsole.warn.apply(console, args);
            self.addLog('warn', args.join(' '), args.length > 1 ? args : null);
        };
        
        console.info = function(...args) {
            self.originalConsole.info.apply(console, args);
            self.addLog('info', args.join(' '), args.length > 1 ? args : null);
        };
        
        console.debug = function(...args) {
            self.originalConsole.debug.apply(console, args);
            self.addLog('debug', args.join(' '), args.length > 1 ? args : null);
        };
    }
    
    setupApiInterception() {
        const self = this;
        const originalFetch = window.fetch;
        
        window.fetch = async function(...args) {
            const startTime = performance.now();
            const url = args[0];
            const options = args[1] || {};
            const method = options.method || 'GET';
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Phase 5: Create network request object
            const networkRequest = {
                id: requestId,
                method: method,
                url: url,
                headers: options.headers || {},
                body: options.body,
                timestamp: Date.now(),
                status: 'pending',
                duration: null,
                error: null,
                responseHeaders: null,
                responseBody: null,
                responseText: null,
                completed: false
            };
            
            // Phase 5: Add to network requests if tab enabled
            if (self.networkTabEnabled) {
                self.addNetworkRequest(networkRequest);
            }
            
            if (self.logApiCalls) {
                self.addLog('info', `API Call: ${method} ${url}`, {
                    method: method,
                    url: url,
                    headers: options.headers,
                    body: options.body
                });
            }
            
            try {
                const response = await originalFetch.apply(this, args);
                const duration = performance.now() - startTime;
                
                // Clone response to read body
                const clonedResponse = response.clone();
                let responseBody = null;
                let responseText = null;
                
                try {
                    const contentType = response.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        responseBody = await clonedResponse.json();
                    } else if (contentType.includes('text/')) {
                        responseText = await clonedResponse.text();
                        if (responseText.length > 500) {
                            responseText = responseText.substring(0, 500) + '... (truncated)';
                        }
                    }
                } catch (e) {
                    // Ignore body read errors
                }
                
                // Phase 5: Update network request with response
                if (self.networkTabEnabled) {
                    networkRequest.status = response.status;
                    networkRequest.statusText = response.statusText;
                    networkRequest.duration = duration;
                    networkRequest.responseHeaders = Object.fromEntries(response.headers.entries());
                    networkRequest.responseBody = responseBody;
                    networkRequest.responseText = responseText;
                    networkRequest.completed = true;
                    self.updateNetworkRequest(networkRequest);
                }
                
                if (self.logApiCalls) {
                    const status = response.status;
                    const statusText = response.statusText;
                    const level = status >= 400 ? 'error' : 'success';
                    
                    self.addLog(level, `API Response: ${status} ${statusText} (${duration.toFixed(2)}ms)`, {
                        url: url,
                        status: status,
                        statusText: statusText,
                        duration: duration
                    });
                }
                
                // Log performance metrics if enabled
                if (self.logPerformance) {
                    if (self.devConfig) {
                        self.devConfig.logPerformance(`API: ${method} ${url}`, duration, {
                            status: response.status,
                            url: url
                        });
                    }
                    if (duration > 1000) {
                        self.addLog('warn', `Slow API call: ${url} took ${duration.toFixed(2)}ms`);
                    }
                }
                
                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
                
                // Phase 5: Update network request with error
                if (self.networkTabEnabled) {
                    networkRequest.status = 'error';
                    networkRequest.error = error.message;
                    networkRequest.duration = duration;
                    networkRequest.completed = true;
                    self.updateNetworkRequest(networkRequest);
                }
                
                if (self.logApiCalls) {
                    self.addLog('error', `API Error: ${url} - ${error.message} (${duration.toFixed(2)}ms)`, error);
                }
                throw error;
            }
        };
    }
    
    setupIPCInterception() {
        const self = this;
        
        // Intercept IPC calls if sergikAPI exists
        if (window.sergikAPI) {
            try {
                const originalAPI = { ...window.sergikAPI };
                
                // Wrap all API methods
                Object.keys(window.sergikAPI).forEach(key => {
                    if (typeof window.sergikAPI[key] === 'function') {
                        const originalMethod = window.sergikAPI[key];
                        
                        // Try to wrap the method, but handle read-only properties gracefully
                        try {
                            window.sergikAPI[key] = async function(...args) {
                                const startTime = performance.now();
                                const methodName = key;
                                
                                if (self.logApiCalls) {
                                    self.addLog('info', `IPC Call: ${methodName}`, {
                                        method: methodName,
                                        args: args.length > 0 ? args : null
                                    });
                                }
                                
                                try {
                                    const result = await originalMethod.apply(this, args);
                                    const duration = performance.now() - startTime;
                                    
                                    if (self.logApiCalls) {
                                        const level = result?.success === false ? 'error' : 'success';
                                        self.addLog(level, `IPC Response: ${methodName} (${duration.toFixed(2)}ms)`, {
                                            method: methodName,
                                            success: result?.success,
                                            duration: duration,
                                            data: result
                                        });
                                    }
                                    
                                    if (self.logPerformance && duration > 1000) {
                                        self.addLog('warn', `Slow IPC call: ${methodName} took ${duration.toFixed(2)}ms`);
                                    }
                                    
                                    return result;
                                } catch (error) {
                                    const duration = performance.now() - startTime;
                                    if (self.logApiCalls) {
                                        self.addLog('error', `IPC Error: ${methodName} - ${error.message} (${duration.toFixed(2)}ms)`, error);
                                    }
                                    throw error;
                                }
                            };
                        } catch (assignError) {
                            // Property is read-only, skip interception for this method
                            console.debug(`[DeveloperConsole] Cannot intercept ${key} (read-only property)`);
                        }
                    }
                });
            } catch (error) {
                console.warn('[DeveloperConsole] Failed to intercept IPC calls:', error);
                // Continue without interception - this is not critical
            }
        }
    }
    
    setupErrorHandling() {
        const self = this;
        
        // Global error handler
        window.addEventListener('error', (event) => {
            if (self.logErrors) {
                self.addLog('error', `Uncaught Error: ${event.message}`, {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error
                });
            }
        });
        
        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            if (self.logErrors) {
                self.addLog('error', `Unhandled Promise Rejection: ${event.reason}`, event.reason);
            }
        });
    }
    
    setupUI() {
        // Load settings
        this.loadSettings();
        
        // Setup event listeners
        const enabledCheckbox = document.getElementById('settings-console-enabled');
        const apiCallsCheckbox = document.getElementById('settings-console-api-calls');
        const errorsCheckbox = document.getElementById('settings-console-errors');
        const performanceCheckbox = document.getElementById('settings-console-performance');
        const maxLogsInput = document.getElementById('settings-console-max-logs');
        const filterSelect = document.getElementById('settings-console-filter');
        const clearBtn = document.getElementById('console-clear');
        const exportBtn = document.getElementById('console-export');
        const copyBtn = document.getElementById('console-copy');
        
        if (enabledCheckbox) {
            enabledCheckbox.addEventListener('change', (e) => {
                this.enabled = e.target.checked;
                this.saveSettings();
            });
        }
        
        if (apiCallsCheckbox) {
            apiCallsCheckbox.addEventListener('change', (e) => {
                this.logApiCalls = e.target.checked;
                this.saveSettings();
            });
        }
        
        if (errorsCheckbox) {
            errorsCheckbox.addEventListener('change', (e) => {
                this.logErrors = e.target.checked;
                this.saveSettings();
            });
        }
        
        if (performanceCheckbox) {
            performanceCheckbox.addEventListener('change', (e) => {
                this.logPerformance = e.target.checked;
                this.saveSettings();
            });
        }
        
        if (maxLogsInput) {
            maxLogsInput.addEventListener('change', (e) => {
                this.maxLogs = parseInt(e.target.value) || 1000;
                this.saveSettings();
                this.trimLogs();
            });
        }
        
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filter = e.target.value;
                this.saveSettings();
                this.render();
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clear();
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.export();
            });
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyAll();
            });
        }
        
        // Phase 3: Setup search and filter
        this.setupSearchAndFilter();
        
        // Watch for settings panel visibility to render when opened
        this.setupVisibilityWatcher();
        
        // Initial render
        this.render();
    }
    
    setupSearchAndFilter() {
        // Search input (if exists)
        const searchInput = document.getElementById('console-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.render();
            });
        }
        
        // Filter buttons (if exist)
        const filterButtons = document.querySelectorAll('.console-filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filter = filter;
                filterButtons.forEach(b => {
                    if (b.dataset.filter === filter) {
                        b.style.background = '#007acc';
                        b.style.color = 'white';
                    } else {
                        b.style.background = '#3c3c3c';
                        b.style.color = '#cccccc';
                    }
                });
                const filterSelect = document.getElementById('settings-console-filter');
                if (filterSelect) {
                    filterSelect.value = filter;
                }
                this.saveSettings();
                this.render();
            });
        });
        
        // Phase 5: Setup tabs (if enabled)
        if (this.networkTabEnabled) {
            this.setupTabs();
        }
    }
    
    setupTabs() {
        const tabs = document.querySelectorAll('.console-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                this.currentTab = targetTab;
                tabs.forEach(t => {
                    if (t.dataset.tab === targetTab) {
                        t.style.background = '#007acc';
                        t.style.color = 'white';
                    } else {
                        t.style.background = '#3c3c3c';
                        t.style.color = '#cccccc';
                    }
                });
                const searchBar = document.querySelector('.console-toolbar');
                if (searchBar) {
                    searchBar.style.display = targetTab === 'console' ? 'flex' : 'none';
                }
                this.render();
            });
        });
        const initialTab = document.querySelector('.console-tab.active');
        if (initialTab) {
            this.currentTab = initialTab.dataset.tab || 'console';
        }
    }
    
    setupVisibilityWatcher() {
        // Watch for when developer section becomes visible
        const observer = new MutationObserver(() => {
            const consoleEl = document.getElementById('developer-console');
            const section = document.getElementById('settings-developer');
            if (consoleEl && section) {
                const isVisible = section.classList.contains('active') || section.style.display !== 'none';
                if (isVisible && !this.shouldRender) {
                    this.shouldRender = true;
                    this.render(); // Render when panel opens
                }
            }
        });
        
        // Observe settings modal and developer section
        const settingsModal = document.getElementById('settings-modal');
        const developerSection = document.getElementById('settings-developer');
        if (settingsModal) {
            observer.observe(settingsModal, { attributes: true, attributeFilter: ['class'] });
        }
        if (developerSection) {
            observer.observe(developerSection, { attributes: true, attributeFilter: ['class', 'style'] });
        }
        
        // Also watch for clicks on developer nav button
        const devNavBtn = document.querySelector('[data-section="developer"]');
        if (devNavBtn) {
            devNavBtn.addEventListener('click', () => {
                setTimeout(() => {
                    this.shouldRender = true;
                    this.render();
                }, 100);
            });
        }
    }
    
    addLog(level, message, data = null) {
        if (!this.enabled) return;
        
        // Track memory if enabled
        if (this.devConfig && this.devConfig.config.enableMemoryTracking) {
            this.devConfig.trackMemory();
        }
        
        const log = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            data: data
        };
        
        this.logs.push(log);
        
        // Trim if over max (efficient circular buffer approach)
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // Throttled rendering for performance
        const consoleEl = document.getElementById('developer-console');
        const section = document.getElementById('settings-developer');
        const isVisible = section && (
            section.classList.contains('active') || 
            section.style.display !== 'none' ||
            this.shouldRender
        );
        
        if (isVisible && consoleEl) {
            // Throttle renders to avoid performance issues
            if (this.renderThrottle) {
                clearTimeout(this.renderThrottle);
            }
            this.renderThrottle = setTimeout(() => {
                this.render();
                this.renderThrottle = null;
            }, this.renderDebounceMs);
        }
    }
    
    trimLogs() {
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }
    
    render() {
        // Phase 5: Support tabs
        if (this.currentTab === 'network') {
            this.renderNetwork();
            return;
        }
        
        const consoleEl = document.getElementById('developer-console');
        if (!consoleEl) return;
        
        // Filter logs by level
        let filteredLogs = this.logs;
        if (this.filter !== 'all') {
            filteredLogs = this.logs.filter(log => log.level === this.filter);
        }
        
        // Phase 3: Filter by search query
        if (this.searchQuery) {
            filteredLogs = filteredLogs.filter(log => {
                const message = log.message.toLowerCase();
                const dataStr = log.data ? JSON.stringify(log.data).toLowerCase() : '';
                return message.includes(this.searchQuery) || dataStr.includes(this.searchQuery);
            });
        }
        
        // Show last 200 logs for performance
        const displayLogs = filteredLogs.slice(-200);
        
        // Use enhanced rendering if enabled
        const html = this.enhancedRendering 
            ? this.renderEnhanced(displayLogs)
            : this.renderOriginal(displayLogs);
        
        const wasScrolledToBottom = consoleEl.scrollHeight - consoleEl.scrollTop <= consoleEl.clientHeight + 10;
        
        consoleEl.innerHTML = html || '<div style="color: #666; font-style: italic;">No logs to display</div>';
        
        // Phase 4: Wire up expandable objects if enabled
        if (this.expandableObjects) {
            this.wireExpandableObjects(consoleEl);
        }
        
        // Auto-scroll to bottom only if already at bottom
        if (wasScrolledToBottom) {
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    }
    
    renderOriginal(logs) {
        // Original rendering method (fallback)
        return logs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            const levelClass = `console-${log.level}`;
            const levelIcon = this.getLevelIcon(log.level);
            
            let dataHtml = '';
            if (log.data && typeof log.data === 'object') {
                try {
                    const dataStr = JSON.stringify(log.data, null, 2);
                    if (dataStr.length > 500) {
                        dataHtml = `<div class="console-data">${this.escapeHtml(dataStr.substring(0, 500))}... (truncated)</div>`;
                    } else {
                        dataHtml = `<div class="console-data">${this.escapeHtml(dataStr)}</div>`;
                    }
                } catch (e) {
                    dataHtml = `<div class="console-data">[Object - ${e.message}]</div>`;
                }
            }
            
            return `
                <div class="console-line ${levelClass}">
                    <span class="console-time">[${time}]</span>
                    <span class="console-level">${levelIcon}</span>
                    <span class="console-message">${this.escapeHtml(log.message)}</span>
                    ${dataHtml}
                </div>
            `;
        }).join('');
    }
    
    renderEnhanced(logs) {
        // Enhanced rendering with color-coded values
        return logs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit'
            });
            const levelClass = `console-${log.level}`;
            const levelIcon = this.getLevelIcon(log.level);
            
            let messageHtml = this.renderMessage(log.message);
            let dataHtml = '';
            if (log.data && typeof log.data === 'object') {
                dataHtml = this.renderData(log.data);
            }
            
            return `
                <div class="console-line ${levelClass}">
                    <span class="console-time">[${time}]</span>
                    <span class="console-level">${levelIcon}</span>
                    <span class="console-message">${messageHtml}</span>
                    ${dataHtml}
                </div>
            `;
        }).join('');
    }
    
    renderMessage(message) {
        if (!message) return '';
        let html = this.escapeHtml(message);
        html = html.replace(/(\d+\.?\d*)/g, '<span class="value-number">$1</span>');
        html = html.replace(/"(.*?)"/g, '<span class="value-string">"$1"</span>');
        html = html.replace(/\b(true|false|null|undefined)\b/g, (match) => {
            if (match === 'null' || match === 'undefined') {
                return `<span class="value-null">${match}</span>`;
            }
            return `<span class="value-boolean">${match}</span>`;
        });
        return html;
    }
    
    renderData(data) {
        if (!data) return '';
        if (this.expandableObjects) {
            return `<div class="console-data">${this.renderValue(data, 0)}</div>`;
        }
        try {
            const dataStr = JSON.stringify(data, null, 2);
            if (dataStr.length > 500) {
                return `<div class="console-data">${this.escapeHtml(dataStr.substring(0, 500))}... (truncated)</div>`;
            } else {
                return `<div class="console-data">${this.escapeHtml(dataStr)}</div>`;
            }
        } catch (e) {
            return `<div class="console-data">[Object - ${e.message}]</div>`;
        }
    }
    
    renderValue(value, depth = 0) {
        if (depth > 3) return '<span class="value-preview">[Max Depth]</span>';
        if (value === null) return '<span class="value-null">null</span>';
        if (value === undefined) return '<span class="value-undefined">undefined</span>';
        const type = typeof value;
        if (type === 'string') return `<span class="value-string">"${this.escapeHtml(value)}"</span>`;
        if (type === 'number') return `<span class="value-number">${value}</span>`;
        if (type === 'boolean') return `<span class="value-boolean">${value}</span>`;
        if (type === 'function') return `<span class="value-function">function ${value.name || ''}()</span>`;
        if (type === 'object') {
            if (Array.isArray(value)) {
                if (value.length === 0) return '<span class="value-array">[]</span>';
                const preview = value.length > 3 
                    ? value.slice(0, 3).map(v => this.renderValue(v, depth + 1)).join(', ') + `, ... (${value.length} items)`
                    : value.map(v => this.renderValue(v, depth + 1)).join(', ');
                const uniqueId = `array_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                return `<span class="value-array expandable" data-expanded="false" data-id="${uniqueId}">
                    <span class="expand-icon">▶</span>
                    <span class="array-preview">[${preview}]</span>
                    <div class="array-expanded" style="display: none; margin-left: 20px;">
                        ${value.map((v, i) => `<div class="array-item">${i}: ${this.renderValue(v, depth + 1)}</div>`).join('')}
                    </div>
                </span>`;
            } else {
                const keys = Object.keys(value);
                if (keys.length === 0) return '<span class="value-object">{}</span>';
                const preview = keys.slice(0, 3).map(k => `${k}: ${this.renderValue(value[k], depth + 1)}`).join(', ');
                const more = keys.length > 3 ? `, ... (${keys.length} properties)` : '';
                const uniqueId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                return `<span class="value-object expandable" data-expanded="false" data-id="${uniqueId}">
                    <span class="expand-icon">▶</span>
                    <span class="object-preview">{${preview}${more}}</span>
                    <div class="object-expanded" style="display: none; margin-left: 20px;">
                        ${keys.map(k => `<div class="object-property"><span class="property-key">${k}:</span><span class="property-value">${this.renderValue(value[k], depth + 1)}</span></div>`).join('')}
                    </div>
                </span>`;
            }
        }
        return `<span class="value-unknown">${this.escapeHtml(String(value))}</span>`;
    }
    
    wireExpandableObjects(container) {
        container.addEventListener('click', (e) => {
            const expandable = e.target.closest('.expandable');
            if (expandable) {
                const isExpanded = expandable.dataset.expanded === 'true';
                expandable.dataset.expanded = !isExpanded;
                const expandedContent = expandable.querySelector('.object-expanded, .array-expanded');
                if (expandedContent) {
                    expandedContent.style.display = isExpanded ? 'none' : 'block';
                }
                const expandIcon = expandable.querySelector('.expand-icon');
                if (expandIcon) {
                    expandIcon.textContent = isExpanded ? '▶' : '▼';
                }
            }
        });
    }
    
    addNetworkRequest(request) {
        this.networkRequests.push(request);
        if (this.networkRequests.length > this.maxNetworkRequests) {
            this.networkRequests.shift();
        }
        if (this.currentTab === 'network') {
            this.renderNetwork();
        }
    }
    
    updateNetworkRequest(request) {
        const index = this.networkRequests.findIndex(r => r.id === request.id);
        if (index !== -1) {
            this.networkRequests[index] = request;
            if (this.currentTab === 'network') {
                this.renderNetwork();
            }
        }
    }
    
    renderNetwork() {
        const consoleEl = document.getElementById('developer-console');
        if (!consoleEl) return;
        const requests = this.networkRequests.slice(-200);
        const html = requests.map(req => {
            const statusClass = req.status >= 400 ? 'status-error' : 
                              req.status >= 300 ? 'status-warning' : 
                              req.status === 'error' ? 'status-error' : 'status-success';
            const methodClass = `method-${req.method.toLowerCase()}`;
            const duration = req.duration ? `${req.duration.toFixed(2)}ms` : 'pending';
            const status = req.status || 'pending';
            return `
                <div class="network-entry ${statusClass}" data-request-id="${req.id}">
                    <div class="network-header">
                        <span class="network-method ${methodClass}">${req.method}</span>
                        <span class="network-url">${this.escapeHtml(req.url)}</span>
                        <span class="network-status ${statusClass}">${status}</span>
                        <span class="network-duration">${duration}</span>
                        <button class="network-toggle" data-action="toggle" data-id="${req.id}">▼</button>
                    </div>
                    <div class="network-details" style="display: none;">
                        ${req.headers && Object.keys(req.headers).length > 0 ? `
                            <div class="network-section">
                                <div class="network-section-title">Request Headers</div>
                                <pre class="network-headers">${this.formatHeaders(req.headers)}</pre>
                            </div>
                        ` : ''}
                        ${req.body ? `
                            <div class="network-section">
                                <div class="network-section-title">Request Body</div>
                                <pre class="network-body">${this.formatBody(req.body)}</pre>
                            </div>
                        ` : ''}
                        ${req.responseHeaders ? `
                            <div class="network-section">
                                <div class="network-section-title">Response Headers</div>
                                <pre class="network-headers">${this.formatHeaders(req.responseHeaders)}</pre>
                            </div>
                        ` : ''}
                        ${req.responseBody ? `
                            <div class="network-section">
                                <div class="network-section-title">Response Body</div>
                                <pre class="network-body">${this.formatJSON(req.responseBody)}</pre>
                            </div>
                        ` : ''}
                        ${req.error ? `
                            <div class="network-section">
                                <div class="network-section-title">Error</div>
                                <pre class="network-body" style="color: #f48771;">${this.escapeHtml(req.error)}</pre>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        consoleEl.innerHTML = html || '<div style="color: #666; font-style: italic;">No network requests</div>';
        consoleEl.querySelectorAll('.network-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const entry = consoleEl.querySelector(`[data-request-id="${id}"]`);
                if (entry) {
                    const details = entry.querySelector('.network-details');
                    const isVisible = details.style.display !== 'none';
                    details.style.display = isVisible ? 'none' : 'block';
                    e.target.textContent = isVisible ? '▼' : '▲';
                }
            });
        });
    }
    
    formatHeaders(headers) {
        if (typeof headers === 'object' && headers !== null) {
            return Object.entries(headers).map(([key, value]) => `${key}: ${value}`).join('\n');
        }
        return String(headers || '');
    }
    
    formatBody(body) {
        if (typeof body === 'string') {
            try {
                const parsed = JSON.parse(body);
                return this.formatJSON(parsed);
            } catch {
                return this.escapeHtml(body);
            }
        }
        return this.formatJSON(body);
    }
    
    formatJSON(obj) {
        try {
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return String(obj);
        }
    }
    
    getLevelIcon(level) {
        const icons = {
            error: '❌',
            warn: '⚠️',
            info: 'ℹ️',
            success: '✅',
            debug: '🔍'
        };
        return icons[level] || '•';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    clear() {
        this.logs = [];
        this.render();
    }
    
    export() {
        const data = {
            timestamp: new Date().toISOString(),
            logs: this.logs
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sergik-console-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    copyAll() {
        const text = this.logs.map(log => {
            const time = new Date(log.timestamp).toLocaleString();
            return `[${time}] [${log.level.toUpperCase()}] ${log.message}`;
        }).join('\n');
        
        navigator.clipboard.writeText(text).then(() => {
            if (window.showNotification) {
                window.showNotification('Console logs copied to clipboard', 'success', 2000);
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }
    
    loadSettings() {
        const enabled = localStorage.getItem('dev-console-enabled');
        const apiCalls = localStorage.getItem('dev-console-api-calls');
        const errors = localStorage.getItem('dev-console-errors');
        const performance = localStorage.getItem('dev-console-performance');
        const maxLogs = localStorage.getItem('dev-console-max-logs');
        const filter = localStorage.getItem('dev-console-filter');
        
        if (enabled !== null) this.enabled = enabled === 'true';
        if (apiCalls !== null) this.logApiCalls = apiCalls === 'true';
        if (errors !== null) this.logErrors = errors === 'true';
        if (performance !== null) this.logPerformance = performance === 'true';
        if (maxLogs) this.maxLogs = parseInt(maxLogs) || 1000;
        if (filter) this.filter = filter;
        
        // Update UI
        const enabledCheckbox = document.getElementById('settings-console-enabled');
        const apiCallsCheckbox = document.getElementById('settings-console-api-calls');
        const errorsCheckbox = document.getElementById('settings-console-errors');
        const performanceCheckbox = document.getElementById('settings-console-performance');
        const maxLogsInput = document.getElementById('settings-console-max-logs');
        const filterSelect = document.getElementById('settings-console-filter');
        
        if (enabledCheckbox) enabledCheckbox.checked = this.enabled;
        if (apiCallsCheckbox) apiCallsCheckbox.checked = this.logApiCalls;
        if (errorsCheckbox) errorsCheckbox.checked = this.logErrors;
        if (performanceCheckbox) performanceCheckbox.checked = this.logPerformance;
        if (maxLogsInput) maxLogsInput.value = this.maxLogs;
        if (filterSelect) filterSelect.value = this.filter;
    }
    
    saveSettings() {
        localStorage.setItem('dev-console-enabled', this.enabled);
        localStorage.setItem('dev-console-api-calls', this.logApiCalls);
        localStorage.setItem('dev-console-errors', this.logErrors);
        localStorage.setItem('dev-console-performance', this.logPerformance);
        localStorage.setItem('dev-console-max-logs', this.maxLogs);
        localStorage.setItem('dev-console-filter', this.filter);
    }
}

// Global function for logging to dev console
window.logToDevConsole = function(level, message, data = null) {
    if (window.developerConsole) {
        window.developerConsole.addLog(level, message, data);
    } else {
        // Queue logs if console not initialized yet
        if (!window._pendingLogs) window._pendingLogs = [];
        window._pendingLogs.push({ level, message, data });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.developerConsole = new DeveloperConsole();
        // Process any pending logs
        if (window._pendingLogs) {
            window._pendingLogs.forEach(log => {
                window.developerConsole.addLog(log.level, log.message, log.data);
            });
            window._pendingLogs = [];
        }
    });
} else {
    window.developerConsole = new DeveloperConsole();
    // Process any pending logs
    if (window._pendingLogs) {
        window._pendingLogs.forEach(log => {
            window.developerConsole.addLog(log.level, log.message, log.data);
        });
        window._pendingLogs = [];
    }
}

// Also intercept sergikAPI when it becomes available
if (window.sergikAPI) {
    // Will be intercepted in constructor
} else {
    // Wait for sergikAPI to be available
    const checkAPI = setInterval(() => {
        if (window.sergikAPI && window.developerConsole) {
            window.developerConsole.setupIPCInterception();
            clearInterval(checkAPI);
        }
    }, 100);
}
