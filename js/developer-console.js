/**
 * Developer Console
 * Captures and displays logs, API calls, errors, and performance metrics
 */

class DeveloperConsole {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.enabled = true;
        this.logApiCalls = true;
        this.logErrors = true;
        this.logPerformance = false;
        this.filter = 'all';
        this.shouldRender = false; // Track if we should render
        
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
        this.addLog('info', 'Developer Console initialized', { timestamp: new Date().toISOString() });
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
            
            if (self.logApiCalls) {
                self.addLog('info', `API Call: ${options.method || 'GET'} ${url}`, {
                    method: options.method || 'GET',
                    url: url,
                    headers: options.headers,
                    body: options.body
                });
            }
            
            try {
                const response = await originalFetch.apply(this, args);
                const duration = performance.now() - startTime;
                
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
                
                if (self.logPerformance && duration > 1000) {
                    self.addLog('warn', `Slow API call: ${url} took ${duration.toFixed(2)}ms}`);
                }
                
                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
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
            const originalAPI = { ...window.sergikAPI };
            
            // Wrap all API methods
            Object.keys(window.sergikAPI).forEach(key => {
                if (typeof window.sergikAPI[key] === 'function') {
                    const originalMethod = window.sergikAPI[key];
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
                }
            });
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
        
        // Watch for settings panel visibility to render when opened
        this.setupVisibilityWatcher();
        
        // Initial render
        this.render();
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
        
        const log = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            data: data
        };
        
        this.logs.push(log);
        
        // Trim if over max
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Always render if console is visible or should be rendered
        const consoleEl = document.getElementById('developer-console');
        const section = document.getElementById('settings-developer');
        const isVisible = section && (
            section.classList.contains('active') || 
            section.style.display !== 'none' ||
            this.shouldRender
        );
        
        if (isVisible && consoleEl) {
            this.render();
        }
    }
    
    trimLogs() {
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }
    
    render() {
        const consoleEl = document.getElementById('developer-console');
        if (!consoleEl) return;
        
        // Filter logs
        let filteredLogs = this.logs;
        if (this.filter !== 'all') {
            filteredLogs = this.logs.filter(log => log.level === this.filter);
        }
        
        // Show last 200 logs for performance (increased from 100)
        const displayLogs = filteredLogs.slice(-200);
        
        // Render
        const html = displayLogs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            const levelClass = `console-${log.level}`;
            const levelIcon = this.getLevelIcon(log.level);
            
            let dataHtml = '';
            if (log.data && typeof log.data === 'object') {
                try {
                    // Limit data size for display
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
        
        consoleEl.innerHTML = html || '<div style="color: #666; font-style: italic;">No logs to display</div>';
        
        // Auto-scroll to bottom
        consoleEl.scrollTop = consoleEl.scrollHeight;
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
