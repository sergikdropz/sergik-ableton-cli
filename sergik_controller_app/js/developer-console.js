/**
 * Developer Console - Chrome DevTools-like logging
 * Captures ALL logs, API calls, errors, status updates, and IPC communication
 */

class DeveloperConsole {
    constructor() {
        this.logs = [];
        this.maxLogs = 5000; // Increased for comprehensive logging
        this.enabled = true;
        this.logApiCalls = true;
        this.logErrors = true;
        this.logPerformance = true;
        this.logStatusUpdates = true;
        this.logActions = true;
        this.filter = 'all';
        this.shouldRender = true; // Always render
        
        // Intercept console methods FIRST (before anything else)
        this.originalConsole = {
            log: console.log.bind(console),
            error: console.error.bind(console),
            warn: console.warn.bind(console),
            info: console.info.bind(console),
            debug: console.debug.bind(console),
            trace: console.trace.bind(console),
            group: console.group.bind(console),
            groupEnd: console.groupEnd.bind(console),
            table: console.table.bind(console)
        };
        
        this.setupConsoleInterception();
        this.setupApiInterception();
        this.setupErrorHandling();
        this.setupIPCInterception();
        this.setupStatusInterception();
        this.setupActionInterception();
        this.setupUI();
        
        // Log initialization
        this.addLog('info', '🔧 Developer Console initialized', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        
        // Log that we're ready
        this.originalConsole.log('[DevConsole] Developer Console ready - capturing all logs');
    }
    
    setupConsoleInterception() {
        const self = this;
        
        console.log = function(...args) {
            self.originalConsole.log.apply(console, args);
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
            self.addLog('info', message, args.length > 1 ? args : null);
        };
        
        console.error = function(...args) {
            self.originalConsole.error.apply(console, args);
            const message = args.map(arg => {
                if (arg instanceof Error) {
                    return `${arg.message}\n${arg.stack || ''}`;
                }
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
            self.addLog('error', message, {
                args: args,
                stack: args.find(a => a instanceof Error)?.stack
            });
        };
        
        console.warn = function(...args) {
            self.originalConsole.warn.apply(console, args);
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
            self.addLog('warn', message, args.length > 1 ? args : null);
        };
        
        console.info = function(...args) {
            self.originalConsole.info.apply(console, args);
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
            self.addLog('info', message, args.length > 1 ? args : null);
        };
        
        console.debug = function(...args) {
            self.originalConsole.debug.apply(console, args);
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
            self.addLog('debug', message, args.length > 1 ? args : null);
        };
        
        console.trace = function(...args) {
            self.originalConsole.trace.apply(console, args);
            const stack = new Error().stack;
            self.addLog('debug', `Trace: ${args.join(' ')}`, { stack });
        };
    }
    
    setupApiInterception() {
        const self = this;
        const originalFetch = window.fetch;
        
        window.fetch = async function(...args) {
            const startTime = performance.now();
            const url = args[0];
            const options = args[1] || {};
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            if (self.logApiCalls) {
                self.addLog('info', `🌐 FETCH ${options.method || 'GET'} ${url}`, {
                    requestId,
                    method: options.method || 'GET',
                    url: url,
                    headers: options.headers,
                    body: options.body ? (typeof options.body === 'string' ? options.body.substring(0, 200) : '[Body]') : null
                });
            }
            
            try {
                const response = await originalFetch.apply(this, args);
                const duration = performance.now() - startTime;
                
                // Clone response to read body without consuming it
                const clonedResponse = response.clone();
                let responseBody = null;
                
                try {
                    const contentType = response.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        responseBody = await clonedResponse.json();
                    } else if (contentType.includes('text/')) {
                        responseBody = await clonedResponse.text();
                        if (responseBody.length > 500) {
                            responseBody = responseBody.substring(0, 500) + '... (truncated)';
                        }
                    }
                } catch (e) {
                    // Ignore body read errors
                }
                
                if (self.logApiCalls) {
                    const status = response.status;
                    const statusText = response.statusText;
                    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'success';
                    
                    self.addLog(level, `📡 RESPONSE ${status} ${statusText} ${url} (${duration.toFixed(2)}ms)`, {
                        requestId,
                        url: url,
                        status: status,
                        statusText: statusText,
                        duration: duration,
                        headers: Object.fromEntries(response.headers.entries()),
                        body: responseBody
                    });
                }
                
                if (self.logPerformance && duration > 1000) {
                    self.addLog('warn', `⚠️ Slow request: ${url} took ${duration.toFixed(2)}ms`);
                }
                
                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
                if (self.logApiCalls) {
                    self.addLog('error', `❌ FETCH ERROR ${url} - ${error.message} (${duration.toFixed(2)}ms)`, {
                        requestId,
                        url: url,
                        error: error.message,
                        stack: error.stack,
                        duration: duration
                    });
                }
                throw error;
            }
        };
    }
    
    setupIPCInterception() {
        const self = this;
        
        // Use WeakMap to track intercepted APIs (since sergikAPI might not be extensible)
        const interceptedAPIs = new WeakMap();
        
        // Function to intercept sergikAPI when it becomes available
        const interceptAPI = () => {
            if (!window.sergikAPI) return;
            
            // Check if already intercepted using WeakMap
            if (interceptedAPIs.has(window.sergikAPI)) return;
            interceptedAPIs.set(window.sergikAPI, true);
            
            // Store original methods
            const originalAPI = {};
            Object.keys(window.sergikAPI).forEach(key => {
                if (typeof window.sergikAPI[key] === 'function' && key !== '__intercepted') {
                    originalAPI[key] = window.sergikAPI[key].bind(window.sergikAPI);
                }
            });
            
            // Wrap all methods
            Object.keys(originalAPI).forEach(key => {
                window.sergikAPI[key] = async function(...args) {
                    const startTime = performance.now();
                    const methodName = key;
                    const requestId = `ipc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    if (self.logApiCalls) {
                        self.addLog('info', `📨 IPC → ${methodName}`, {
                            requestId,
                            method: methodName,
                            args: self.serializeArgs(args)
                        });
                    }
                    
                    try {
                        const result = await originalAPI[key].apply(this, args);
                        const duration = performance.now() - startTime;
                        
                        if (self.logApiCalls) {
                            const level = result?.success === false ? 'error' : 'success';
                            self.addLog(level, `📬 IPC ← ${methodName} (${duration.toFixed(2)}ms)`, {
                                requestId,
                                method: methodName,
                                success: result?.success,
                                duration: duration,
                                data: self.serializeResult(result)
                            });
                        }
                        
                        if (self.logPerformance && duration > 1000) {
                            self.addLog('warn', `⚠️ Slow IPC: ${methodName} took ${duration.toFixed(2)}ms`);
                        }
                        
                        return result;
                    } catch (error) {
                        const duration = performance.now() - startTime;
                        if (self.logApiCalls) {
                            self.addLog('error', `❌ IPC ERROR ${methodName} - ${error.message} (${duration.toFixed(2)}ms)`, {
                                requestId,
                                method: methodName,
                                error: error.message,
                                stack: error.stack,
                                duration: duration
                            });
                        }
                        throw error;
                    }
                };
            });
            
            self.addLog('info', '✅ IPC interception active - all sergikAPI calls will be logged');
        };
        
        // Try immediately
        interceptAPI();
        
        // Also watch for when it becomes available
        if (!window.sergikAPI) {
            const checkInterval = setInterval(() => {
                if (window.sergikAPI) {
                    interceptAPI();
                    clearInterval(checkInterval);
                }
            }, 100);
            
            // Stop checking after 10 seconds
            setTimeout(() => clearInterval(checkInterval), 10000);
        }
    }
    
    serializeArgs(args) {
        return args.map(arg => {
            if (arg instanceof Error) {
                return { type: 'Error', message: arg.message, stack: arg.stack };
            }
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.parse(JSON.stringify(arg, (key, value) => {
                        if (value instanceof Error) {
                            return { type: 'Error', message: value.message, stack: value.stack };
                        }
                        if (typeof value === 'function') {
                            return '[Function]';
                        }
                        return value;
                    }));
                } catch (e) {
                    return '[Object]';
                }
            }
            return arg;
        });
    }
    
    serializeResult(result) {
        if (result instanceof Error) {
            return { type: 'Error', message: result.message, stack: result.stack };
        }
        if (typeof result === 'object' && result !== null) {
            try {
                const serialized = JSON.parse(JSON.stringify(result, (key, value) => {
                    if (value instanceof Error) {
                        return { type: 'Error', message: value.message, stack: value.stack };
                    }
                    if (typeof value === 'function') {
                        return '[Function]';
                    }
                    // Limit large objects
                    if (typeof value === 'string' && value.length > 1000) {
                        return value.substring(0, 1000) + '... (truncated)';
                    }
                    return value;
                }));
                return serialized;
            } catch (e) {
                return '[Object - serialization failed]';
            }
        }
        return result;
    }
    
    setupStatusInterception() {
        const self = this;
        
        // Intercept updateStatus function
        const originalUpdateStatus = window.updateStatus;
        if (typeof originalUpdateStatus === 'function') {
            window.updateStatus = function(text, color) {
                if (self.logStatusUpdates) {
                    self.addLog('info', `📊 STATUS: ${text} (${color})`, { text, color });
                }
                return originalUpdateStatus.apply(this, arguments);
            };
        } else {
            // Wait for it to be defined
            Object.defineProperty(window, 'updateStatus', {
                set: function(fn) {
                    const original = fn;
                    window.updateStatus = function(text, color) {
                        if (self.logStatusUpdates) {
                            self.addLog('info', `📊 STATUS: ${text} (${color})`, { text, color });
                        }
                        return original.apply(this, arguments);
                    };
                },
                get: function() {
                    return window._updateStatus;
                },
                configurable: true
            });
        }
    }
    
    setupActionInterception() {
        const self = this;
        
        // Intercept addAction function
        const originalAddAction = window.addAction;
        if (typeof originalAddAction === 'function') {
            window.addAction = function(message, type = 'info') {
                if (self.logActions) {
                    const level = type === 'error' ? 'error' : type === 'warning' || type === 'warn' ? 'warn' : type === 'success' ? 'success' : 'info';
                    self.addLog(level, `🎯 ACTION: ${message}`, { type, message });
                }
                return originalAddAction.apply(this, arguments);
            };
        } else {
            // Wait for it to be defined
            Object.defineProperty(window, 'addAction', {
                set: function(fn) {
                    const original = fn;
                    window.addAction = function(message, type = 'info') {
                        if (self.logActions) {
                            const level = type === 'error' ? 'error' : type === 'warning' || type === 'warn' ? 'warn' : type === 'success' ? 'success' : 'info';
                            self.addLog(level, `🎯 ACTION: ${message}`, { type, message });
                        }
                        return original.apply(this, arguments);
                    };
                },
                get: function() {
                    return window._addAction;
                },
                configurable: true
            });
        }
    }
    
    setupErrorHandling() {
        const self = this;
        
        // Global error handler
        window.addEventListener('error', (event) => {
            if (self.logErrors) {
                self.addLog('error', `💥 UNCAUGHT ERROR: ${event.message}`, {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error,
                    stack: event.error?.stack
                });
            }
        }, true);
        
        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            if (self.logErrors) {
                const reason = event.reason;
                const message = reason instanceof Error ? reason.message : String(reason);
                const stack = reason instanceof Error ? reason.stack : null;
                
                self.addLog('error', `💥 UNHANDLED PROMISE REJECTION: ${message}`, {
                    reason: message,
                    stack: stack,
                    promise: event.promise
                });
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
                this.maxLogs = parseInt(e.target.value) || 5000;
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
        
        // Watch for settings panel visibility
        this.setupVisibilityWatcher();
        
        // Initial render
        setTimeout(() => this.render(), 100);
    }
    
    setupVisibilityWatcher() {
        const observer = new MutationObserver(() => {
            const section = document.getElementById('settings-developer');
            if (section) {
                const isVisible = section.classList.contains('active') || 
                                 section.style.display !== 'none' ||
                                 window.getComputedStyle(section).display !== 'none';
                if (isVisible) {
                    this.shouldRender = true;
                    this.render();
                }
            }
        });
        
        const settingsModal = document.getElementById('settings-modal');
        const developerSection = document.getElementById('settings-developer');
        if (settingsModal) {
            observer.observe(settingsModal, { attributes: true, attributeFilter: ['class'] });
        }
        if (developerSection) {
            observer.observe(developerSection, { attributes: true, attributeFilter: ['class', 'style'] });
        }
        
        // Watch for clicks on developer nav button
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
            data: data,
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        this.logs.push(log);
        
        // Trim if over max
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Always render (logs are stored regardless)
        if (this.shouldRender) {
            // Debounce rendering for performance
            if (!this.renderTimeout) {
                this.renderTimeout = setTimeout(() => {
                    this.render();
                    this.renderTimeout = null;
                }, 50);
            }
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
        
        // Show last 500 logs for performance (increased)
        const displayLogs = filteredLogs.slice(-500);
        
        // Render
        const html = displayLogs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            const levelClass = `console-${log.level}`;
            const levelIcon = this.getLevelIcon(log.level);
            
            let dataHtml = '';
            if (log.data && typeof log.data === 'object') {
                try {
                    const dataStr = JSON.stringify(log.data, null, 2);
                    if (dataStr.length > 1000) {
                        dataHtml = `<div class="console-data">${this.escapeHtml(dataStr.substring(0, 1000))}... (truncated, ${dataStr.length} chars)</div>`;
                    } else {
                        dataHtml = `<div class="console-data">${this.escapeHtml(dataStr)}</div>`;
                    }
                } catch (e) {
                    dataHtml = `<div class="console-data">[Object - ${e.message}]</div>`;
                }
            }
            
            return `
                <div class="console-line ${levelClass}" data-log-id="${log.id}">
                    <span class="console-time">[${time}]</span>
                    <span class="console-level">${levelIcon}</span>
                    <span class="console-message">${this.escapeHtml(log.message)}</span>
                    ${dataHtml}
                </div>
            `;
        }).join('');
        
        const wasScrolledToBottom = consoleEl.scrollHeight - consoleEl.scrollTop <= consoleEl.clientHeight + 10;
        
        consoleEl.innerHTML = html || '<div style="color: #666; font-style: italic;">No logs to display</div>';
        
        // Auto-scroll to bottom only if already at bottom
        if (wasScrolledToBottom) {
            consoleEl.scrollTop = consoleEl.scrollHeight;
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
        this.addLog('info', '🧹 Console cleared');
    }
    
    export() {
        const data = {
            timestamp: new Date().toISOString(),
            app: 'SERGIK AI Controller',
            version: '1.0.0',
            logs: this.logs,
            summary: {
                total: this.logs.length,
                byLevel: this.logs.reduce((acc, log) => {
                    acc[log.level] = (acc[log.level] || 0) + 1;
                    return acc;
                }, {})
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sergik-console-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.addLog('info', '📥 Logs exported');
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
            this.addLog('info', '📋 Logs copied to clipboard');
        }).catch(err => {
            this.originalConsole.error('Failed to copy:', err);
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
        if (maxLogs) this.maxLogs = parseInt(maxLogs) || 5000;
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

// Initialize IMMEDIATELY (before other scripts)
if (document.readyState === 'loading') {
    // Initialize as early as possible
    window.developerConsole = new DeveloperConsole();
    document.addEventListener('DOMContentLoaded', () => {
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

// Also intercept sergikAPI when it becomes available (retry mechanism)
const setupIPCWhenReady = () => {
    if (window.sergikAPI && window.developerConsole) {
        window.developerConsole.setupIPCInterception();
    } else {
        setTimeout(setupIPCWhenReady, 100);
    }
};
setupIPCWhenReady();
