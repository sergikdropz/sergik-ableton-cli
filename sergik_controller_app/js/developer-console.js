/**
 * Developer Console - Chrome DevTools-like logging
 * Captures ALL logs, API calls, errors, status updates, and IPC communication
 */

class DeveloperConsole {
    constructor() {
        this.logs = [];
        this.networkRequests = []; // Phase 5: Network requests
        this.maxLogs = 5000; // Increased for comprehensive logging
        this.maxNetworkRequests = 1000; // Phase 5: Max network requests
        this.enabled = true;
        this.logApiCalls = true;
        this.logErrors = true;
        this.logPerformance = true;
        this.logStatusUpdates = true;
        this.logActions = true;
        this.filter = 'all';
        this.shouldRender = true; // Always render
        this.buttonsWired = false; // Track if action buttons are wired
        this.searchQuery = ''; // Phase 3: Search query
        this.currentTab = 'console'; // Phase 5: Current tab
        this.lastStatus = null; // For throttling status updates
        this.lastStatusTime = 0; // For throttling status updates
        this.sergikAITeamUrl = 'http://127.0.0.1:8001'; // SERGIK AI Team URL
        this.devAssistantHistory = []; // Store Dev Assistant conversation history
        
        // Feature flags for enhanced features
        this.enhancedRendering = true; // Phase 2: Enhanced rendering
        this.expandableObjects = true; // Phase 4: Expandable objects
        this.networkTabEnabled = true; // Phase 5: Network tab
        this.performanceTabEnabled = true; // Phase 6: Performance tab
        this.performanceMetrics = []; // Phase 6: Performance metrics
        
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
        
        // Phase 6: Start performance monitoring
        if (this.performanceTabEnabled) {
            this.startPerformanceMonitoring();
        }
        
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
            
            // Only log to dev console if enabled AND it's useful for development
            if (self.enabled) {
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
                
                // Filter out debug/instrumentation noise
                const skipPatterns = [
                    '[DEBUG]',
                    'agent log',
                    'Log failed',
                    'Elements found',
                    'setupUI',
                    'Visibility check',
                    'updateSettingsStatus',
                    'After re-wiring',
                    'Section visible',
                    'About to call',
                    'returned',
                    'Developer nav button clicked',
                    'setupVisibilityWatcher called'
                ];
                
                const shouldSkip = skipPatterns.some(pattern => message.includes(pattern));
                
                if (!shouldSkip) {
            self.addLog('info', message, args.length > 1 ? args : null);
                }
            }
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
                response: null,
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
                self.addLog('info', `🌐 FETCH ${method} ${url}`, {
                    requestId,
                    method: method,
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
                
                // Phase 5: Update network request with error
                if (self.networkTabEnabled) {
                    networkRequest.status = 'error';
                    networkRequest.error = error.message;
                    networkRequest.duration = duration;
                    networkRequest.completed = true;
                    self.updateNetworkRequest(networkRequest);
                }
                
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
            
            try {
                // Store the original API object
                const originalAPI = window.sergikAPI;
                
                // Create a Proxy that intercepts method calls without modifying read-only properties
                const proxiedAPI = new Proxy(originalAPI, {
                    get(target, prop) {
                        const value = target[prop];
                        
                        // If it's a function, wrap it with logging
                        if (typeof value === 'function' && prop !== '__intercepted') {
                            return async function(...args) {
                                const startTime = performance.now();
                                const methodName = prop;
                                const requestId = `ipc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                                
                                if (self.logApiCalls) {
                                    self.addLog('info', `📨 IPC → ${methodName}`, {
                                        requestId,
                                        method: methodName,
                                        args: self.serializeArgs(args)
                                    });
                                }
                                
                                try {
                                    const result = await value.apply(target, args);
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
                        }
                        
                        // Return non-function properties as-is
                        return value;
                    }
                });
                
                // Try to replace window.sergikAPI with the Proxy
                // If window.sergikAPI is read-only, this will fail gracefully
                try {
                    window.sergikAPI = proxiedAPI;
                    
                    // Mark as intercepted
                    interceptedAPIs.set(proxiedAPI, true);
                    
                    self.addLog('info', '✅ IPC interception active - all sergikAPI calls will be logged');
                } catch (assignError) {
                    // window.sergikAPI is read-only, can't replace it
                    // This is expected in some Electron configurations
                    console.debug('[DeveloperConsole] Cannot replace window.sergikAPI (read-only), skipping interception');
                    // Don't log this as an error since it's expected behavior
                    return;
                }
            } catch (error) {
                // Fallback: if Proxy creation fails, log warning but don't break the app
                console.warn('[DeveloperConsole] Failed to intercept IPC calls:', error);
                self.addLog('warn', `⚠️ IPC interception failed: ${error.message}`);
            }
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
                    const now = Date.now();
                    // Only log if status changed OR it's been 2+ seconds since last log
                    if (self.lastStatus !== text || (now - self.lastStatusTime) > 2000) {
                        self.addLog('info', `📊 STATUS: ${text}`, { text, color });
                        self.lastStatus = text;
                        self.lastStatusTime = now;
                    }
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
                            const now = Date.now();
                            // Only log if status changed OR it's been 2+ seconds since last log
                            if (self.lastStatus !== text || (now - self.lastStatusTime) > 2000) {
                                self.addLog('info', `📊 STATUS: ${text}`, { text, color });
                                self.lastStatus = text;
                                self.lastStatusTime = now;
                            }
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
        
        // Setup event listeners - try immediately, but also set up watcher for when DOM is ready
        this._setupEventListeners();
        
        // If DOM not ready, wait for it
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this._setupEventListeners();
            });
        }
        
        // Also try after a delay to catch dynamically loaded content
        setTimeout(() => {
            this._setupEventListeners();
        }, 500);
    }
    
    /**
     * Internal method to setup event listeners (can be called multiple times safely)
     * @private
     * @param {boolean} forceRewire - If true, remove old listeners and re-wire (default: false)
     */
    _setupEventListeners(forceRewire = false) {
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
        
        // If forceRewire, clear wired flags
        if (forceRewire) {
            if (enabledCheckbox) delete enabledCheckbox.dataset.wired;
            if (apiCallsCheckbox) delete apiCallsCheckbox.dataset.wired;
            if (errorsCheckbox) delete errorsCheckbox.dataset.wired;
            if (performanceCheckbox) delete performanceCheckbox.dataset.wired;
            if (maxLogsInput) delete maxLogsInput.dataset.wired;
            if (filterSelect) delete filterSelect.dataset.wired;
        }
        
        // Only wire if not already wired (prevent duplicate listeners)
        if (enabledCheckbox && !enabledCheckbox.dataset.wired) {
            enabledCheckbox.addEventListener('change', (e) => {
                const wasEnabled = this.enabled;
                this.enabled = e.target.checked;
                
                // Log the change (but only if console was enabled before, to avoid infinite loop)
                if (wasEnabled) {
                    this.addLog(this.enabled ? 'success' : 'warn', 
                        `${this.enabled ? '✅' : '⚠️'} Developer Console ${this.enabled ? 'enabled' : 'disabled'}`, {
                        action: 'toggle-console',
                        enabled: this.enabled,
                        previousState: wasEnabled
                    });
                }
                
                // If disabling, show warning
                if (!this.enabled && wasEnabled) {
                    if (window.showNotification) {
                        window.showNotification('Developer Console disabled. Logs will no longer be captured.', 'warning', 3000);
                    }
                }
                
                this.saveSettings();
                
                // Visual feedback
                this._addCheckboxFeedback(enabledCheckbox, e.target.checked);
                
                // Re-render to show/hide console
                if (this.shouldRender) {
                    this.render();
                }
            });
            enabledCheckbox.dataset.wired = 'true';
        }
        
        if (apiCallsCheckbox && !apiCallsCheckbox.dataset.wired) {
            apiCallsCheckbox.addEventListener('change', (e) => {
                const wasEnabled = this.logApiCalls;
                this.logApiCalls = e.target.checked;
                
                // Log the change
                this.addLog('info', `📡 API Call Logging ${this.logApiCalls ? 'enabled' : 'disabled'}`, {
                    action: 'toggle-api-calls',
                    enabled: this.logApiCalls,
                    previousState: wasEnabled
                });
                
                this.saveSettings();
                // Visual feedback
                this._addCheckboxFeedback(apiCallsCheckbox, e.target.checked);
            });
            apiCallsCheckbox.dataset.wired = 'true';
        }
        
        if (errorsCheckbox && !errorsCheckbox.dataset.wired) {
            errorsCheckbox.addEventListener('change', (e) => {
                const wasEnabled = this.logErrors;
                this.logErrors = e.target.checked;
                
                // Log the change
                this.addLog('info', `❌ Error Logging ${this.logErrors ? 'enabled' : 'disabled'}`, {
                    action: 'toggle-errors',
                    enabled: this.logErrors,
                    previousState: wasEnabled
                });
                
                // Warning if disabling error logging
                if (!this.logErrors && wasEnabled) {
                    if (window.showNotification) {
                        window.showNotification('Error logging disabled. Errors will not be captured.', 'warning', 2000);
                    }
                }
                
                this.saveSettings();
                // Visual feedback
                this._addCheckboxFeedback(errorsCheckbox, e.target.checked);
            });
            errorsCheckbox.dataset.wired = 'true';
        }
        
        if (performanceCheckbox && !performanceCheckbox.dataset.wired) {
            performanceCheckbox.addEventListener('change', (e) => {
                const wasEnabled = this.logPerformance;
                this.logPerformance = e.target.checked;
                
                // Log the change
                this.addLog('info', `⚡ Performance Monitoring ${this.logPerformance ? 'enabled' : 'disabled'}`, {
                    action: 'toggle-performance',
                    enabled: this.logPerformance,
                    previousState: wasEnabled
                });
                
                // Start or stop performance monitoring
                if (this.logPerformance && !wasEnabled) {
                    this.startPerformanceMonitoring();
                    if (window.showNotification) {
                        window.showNotification('Performance monitoring started', 'success', 2000);
                    }
                } else if (!this.logPerformance && wasEnabled) {
                    // Stop performance monitoring
                    this.performanceMetrics = [];
                    if (this.currentTab === 'performance') {
                        this.renderPerformance();
                    }
                    if (window.showNotification) {
                        window.showNotification('Performance monitoring stopped', 'info', 2000);
                    }
                }
                
                this.saveSettings();
                // Visual feedback
                this._addCheckboxFeedback(performanceCheckbox, e.target.checked);
            });
            performanceCheckbox.dataset.wired = 'true';
        }
        
        if (maxLogsInput && !maxLogsInput.dataset.wired) {
            maxLogsInput.addEventListener('input', (e) => {
                // Real-time validation
                const value = parseInt(e.target.value);
                const min = parseInt(e.target.min) || 100;
                const max = parseInt(e.target.max) || 10000;
                
                if (isNaN(value) || value < min) {
                    e.target.style.borderColor = '#dc3545';
                    return;
                } else if (value > max) {
                    e.target.style.borderColor = '#ffc107';
                    return;
                } else {
                    e.target.style.borderColor = '';
                }
            });
            
            maxLogsInput.addEventListener('change', (e) => {
                const oldMax = this.maxLogs;
                const newMax = parseInt(e.target.value) || 5000;
                const min = parseInt(e.target.min) || 100;
                const max = parseInt(e.target.max) || 10000;
                
                // Validate and clamp value
                let validatedMax = newMax;
                if (isNaN(validatedMax) || validatedMax < min) {
                    validatedMax = min;
                    e.target.value = min;
                } else if (validatedMax > max) {
                    validatedMax = max;
                    e.target.value = max;
                }
                
                this.maxLogs = validatedMax;
                
                // Log the change
                this.addLog('info', `📊 Max logs changed: ${oldMax} → ${validatedMax}`, {
                    action: 'change-max-logs',
                    oldValue: oldMax,
                    newValue: validatedMax,
                    logCount: this.logs.length
                });
                
                // Immediately trim logs if needed
                const trimmed = this.logs.length - validatedMax;
                if (trimmed > 0) {
                this.trimLogs();
                    this.addLog('info', `✂️ Trimmed ${trimmed} old logs`, {
                        action: 'trim-logs',
                        trimmedCount: trimmed,
                        remainingLogs: this.logs.length
                    });
                }
                
                this.saveSettings();
                this.render();
                this.updateFilterButtonCounts();
                this.updateSettingsStatus(); // Update status display
                
                // Visual feedback
                if (window.visualFeedback) {
                    window.visualFeedback.addInputFeedback(maxLogsInput, 'success');
                    setTimeout(() => {
                        window.visualFeedback.removeInputFeedback(maxLogsInput);
                    }, 1000);
                }
            });
            maxLogsInput.dataset.wired = 'true';
        }
        
        if (filterSelect && !filterSelect.dataset.wired) {
            filterSelect.addEventListener('change', (e) => {
                const oldFilter = this.filter;
                this.filter = e.target.value;
                
                // Log the change
                const logCount = this.getFilteredLogCount(this.filter);
                this.addLog('info', `🔍 Filter changed: ${oldFilter} → ${this.filter} (${logCount} logs)`, {
                    action: 'change-filter',
                    oldFilter: oldFilter,
                    newFilter: this.filter,
                    logCount: logCount
                });
                
                this.saveSettings();
                
                // Sync filter buttons with dropdown selection
                const filterButtons = document.querySelectorAll('.console-filter-btn');
                filterButtons.forEach(b => {
                    if (b.dataset.filter === this.filter) {
                        b.style.background = '#007acc';
                        b.style.color = 'white';
                    } else {
                        b.style.background = '#3c3c3c';
                        b.style.color = '#cccccc';
                    }
                });
                
                this.render();
                this.updateFilterButtonCounts();
                this.updateSettingsStatus(); // Update status display
            });
            filterSelect.dataset.wired = 'true';
        }
        
        // Wire action buttons
        this.wireActionButtons();
        
        // Watch for settings panel visibility
        // Phase 3: Setup search and filter buttons
        this.setupSearchAndFilter();
        
        // Setup Dev Assistant
        this.setupDevAssistant();
        
        this.setupVisibilityWatcher();
        
        // Initial render
        setTimeout(() => {
            this.render();
            this.updateSettingsStatus();
        }, 100);
    }
    
    /**
     * Update visual status indicators for settings
     */
    updateSettingsStatus() {
        // Update max logs input to show current count
        const maxLogsInput = document.getElementById('settings-console-max-logs');
        if (maxLogsInput) {
            const currentCount = this.logs.length;
            const maxLogs = this.maxLogs;
            const usagePercent = Math.round((currentCount / maxLogs) * 100);
            
            // Add status indicator
            let statusIndicator = maxLogsInput.parentElement.querySelector('.max-logs-status');
            if (!statusIndicator) {
                statusIndicator = document.createElement('div');
                statusIndicator.className = 'max-logs-status';
                statusIndicator.style.cssText = 'font-size: 10px; color: #888; margin-top: 4px;';
                maxLogsInput.parentElement.appendChild(statusIndicator);
            }
            
            if (usagePercent > 90) {
                statusIndicator.style.color = '#dc3545';
                statusIndicator.textContent = `⚠️ ${currentCount}/${maxLogs} logs (${usagePercent}% full)`;
            } else if (usagePercent > 70) {
                statusIndicator.style.color = '#ffc107';
                statusIndicator.textContent = `${currentCount}/${maxLogs} logs (${usagePercent}% full)`;
            } else {
                statusIndicator.style.color = '#888';
                statusIndicator.textContent = `${currentCount}/${maxLogs} logs (${usagePercent}% full)`;
            }
        }
        
        // Update filter select to show count
        const filterSelect = document.getElementById('settings-console-filter');
        if (filterSelect) {
            const logCount = this.getFilteredLogCount(this.filter);
            const totalCount = this.logs.length;
            
            // Update option text to show counts (if not already updated)
            const options = filterSelect.querySelectorAll('option');
            options.forEach(opt => {
                const filter = opt.value;
                const count = this.getFilteredLogCount(filter);
                const originalText = opt.dataset.originalText || opt.textContent.split('(')[0].trim();
                opt.dataset.originalText = originalText;
                
                if (filter === 'all') {
                    opt.textContent = `${originalText} (${count})`;
                } else if (count > 0) {
                    opt.textContent = `${originalText} (${count})`;
                } else {
                    opt.textContent = originalText;
                }
            });
        }
    }
    
    setupSearchAndFilter() {
        // Search input - prevent duplicate listeners
        const searchInput = document.getElementById('console-search');
        if (searchInput && !searchInput.dataset.wired) {
            // Add focus visual feedback
            searchInput.addEventListener('focus', () => {
                searchInput.style.borderColor = '#007acc';
                searchInput.style.boxShadow = '0 0 0 2px rgba(0, 122, 204, 0.2)';
            });
            
            searchInput.addEventListener('blur', () => {
                searchInput.style.borderColor = '';
                searchInput.style.boxShadow = '';
            });
            
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                
                // Visual feedback when searching
                if (this.searchQuery) {
                    searchInput.style.background = '#1e1e1e';
                    searchInput.style.borderColor = '#007acc';
                } else {
                    searchInput.style.background = '#252526';
                    searchInput.style.borderColor = '#3c3c3c';
                }
                
                this.render();
            });
            searchInput.dataset.wired = 'true';
        }
        
        // Filter buttons - prevent duplicate listeners
        const filterButtons = document.querySelectorAll('.console-filter-btn');
        filterButtons.forEach(btn => {
            if (!btn.dataset.wired) {
                btn.addEventListener('click', (e) => {
                    const filter = e.target.dataset.filter;
                    this.filter = filter;
                    
                    // Add click animation
                    btn.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        btn.style.transform = '';
                    }, 150);
                    
                    // Update button styles with transition
                    filterButtons.forEach(b => {
                        b.style.transition = 'all 0.2s ease';
                        if (b.dataset.filter === filter) {
                            b.style.background = '#007acc';
                            b.style.color = 'white';
                            b.style.transform = 'scale(1.05)';
                            setTimeout(() => {
                                b.style.transform = '';
                            }, 200);
                        } else {
                            b.style.background = '#3c3c3c';
                            b.style.color = '#cccccc';
                        }
                    });
                    
                    // Update dropdown if it exists
                    const filterSelect = document.getElementById('settings-console-filter');
                    if (filterSelect) {
                        filterSelect.value = filter;
                    }
                    
                    // Log the filter change action
                    const logCount = this.getFilteredLogCount(filter);
                    this.addLog('info', `🔍 Filter changed to: ${filter}`, {
                        filter: filter,
                        logCount: logCount
                    });
                    
                    this.saveSettings();
                    this.render();
                    this.updateFilterButtonCounts();
                });
                btn.dataset.wired = 'true';
            }
        });
        
        // Initial count update
        this.updateFilterButtonCounts();
        
        // Always setup tab switching (tabs should always work)
        this.setupTabs();
    }
    
    setupTabs() {
        const tabs = document.querySelectorAll('.console-tab');
        tabs.forEach(tab => {
            // Prevent duplicate listeners
            if (!tab.dataset.wired) {
                tab.addEventListener('click', (e) => {
                    const targetTab = e.target.dataset.tab;
                    this.currentTab = targetTab;
                    
                    // Add click animation
                    tab.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        tab.style.transform = '';
                    }, 150);
                    
                    // Update active tab with transition
                    tabs.forEach(t => {
                        t.style.transition = 'all 0.2s ease';
                        if (t.dataset.tab === targetTab) {
                            t.style.background = '#007acc';
                            t.style.color = 'white';
                            t.classList.add('active');
                            t.style.transform = 'scale(1.05)';
                            setTimeout(() => {
                                t.style.transform = '';
                            }, 200);
                        } else {
                            t.style.background = '#3c3c3c';
                            t.style.color = '#cccccc';
                            t.classList.remove('active');
                        }
                    });
                    
                    // Show/hide search bar based on tab
                    const searchBar = document.querySelector('.console-toolbar');
                    if (searchBar) {
                        searchBar.style.display = targetTab === 'console' ? 'flex' : 'none';
                    }
                    
                    // Save tab state
                    this.saveSettings();
                    this.render();
                });
                tab.dataset.wired = 'true';
            }
        });
        
        // Set initial tab state from localStorage or HTML
        const savedTab = localStorage.getItem('dev-console-current-tab');
        if (savedTab && ['console', 'network', 'performance'].includes(savedTab)) {
            this.currentTab = savedTab;
            // Update tab UI to match saved state
            tabs.forEach(t => {
                if (t.dataset.tab === savedTab) {
                    t.style.background = '#007acc';
                    t.style.color = 'white';
                    t.classList.add('active');
                } else {
                    t.style.background = '#3c3c3c';
                    t.style.color = '#cccccc';
                    t.classList.remove('active');
                }
            });
        } else {
            // Fallback to HTML active class
            const initialTab = document.querySelector('.console-tab.active');
            if (initialTab) {
                this.currentTab = initialTab.dataset.tab || 'console';
            }
        }
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
                    // Re-wire ALL event listeners when section becomes visible (force re-wire)
                    this._setupEventListeners(true);
                    // Re-wire buttons when section becomes visible (in case they weren't ready before)
                    this.wireActionButtons();
                    // Re-wire search and filter buttons
                    this.setupSearchAndFilter();
                    // Re-wire Dev Assistant
                    this.setupDevAssistant();
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
        if (devNavBtn && !devNavBtn.dataset.wired) {
            devNavBtn.addEventListener('click', () => {
                setTimeout(() => {
                    this.shouldRender = true;
                    this.render();
                    // Re-wire ALL event listeners when developer section is clicked (force re-wire)
                    this._setupEventListeners(true);
                    // Re-wire buttons when developer section is clicked
                    this.wireActionButtons();
                    // Re-wire search and filter buttons
                    this.setupSearchAndFilter();
                }, 100);
            });
            devNavBtn.dataset.wired = 'true';
        }
    }
    
    /**
     * Setup Dev Assistant UI and wire up all event listeners
     */
    setupDevAssistant() {
        const queryInput = document.getElementById('dev-assistant-query');
        const sendBtn = document.getElementById('dev-assistant-send');
        const agentSelect = document.getElementById('dev-assistant-agent');
        const responseArea = document.getElementById('dev-assistant-response');
        const quickActionBtns = document.querySelectorAll('.dev-assistant-quick-btn');
        const aiTeamUrlInput = document.getElementById('settings-ai-team-url');
        
        // Wire up SERGIK AI Team URL input
        if (aiTeamUrlInput && !aiTeamUrlInput.dataset.wired) {
            aiTeamUrlInput.addEventListener('change', (e) => {
                this.sergikAITeamUrl = e.target.value.trim() || 'http://127.0.0.1:8001';
                this.saveSettings();
                
                // Visual feedback
                if (window.visualFeedback) {
                    window.visualFeedback.addInputFeedback(aiTeamUrlInput, 'success');
                    setTimeout(() => {
                        window.visualFeedback.removeInputFeedback(aiTeamUrlInput);
                    }, 1000);
                }
                
                this.addLog('info', `🔗 SERGIK AI Team URL updated: ${this.sergikAITeamUrl}`, {
                    action: 'update-ai-team-url',
                    url: this.sergikAITeamUrl
                });
            });
            aiTeamUrlInput.dataset.wired = 'true';
        }
        
        // Wire up send button
        if (sendBtn && !sendBtn.dataset.wired) {
            sendBtn.addEventListener('click', async () => {
                await this.handleDevAssistantQuery();
            });
            sendBtn.dataset.wired = 'true';
        }
        
        // Wire up Enter key in input
        if (queryInput && !queryInput.dataset.wired) {
            queryInput.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    await this.handleDevAssistantQuery();
                }
            });
            queryInput.dataset.wired = 'true';
        }
        
        // Wire up quick action buttons
        quickActionBtns.forEach(btn => {
            if (!btn.dataset.wired) {
                btn.addEventListener('click', async () => {
                    const action = btn.dataset.action;
                    await this.handleQuickAction(action);
                });
                btn.dataset.wired = 'true';
            }
        });
    }
    
    /**
     * Handle Dev Assistant query submission
     */
    async handleDevAssistantQuery() {
        const queryInput = document.getElementById('dev-assistant-query');
        const agentSelect = document.getElementById('dev-assistant-agent');
        const responseArea = document.getElementById('dev-assistant-response');
        const sendBtn = document.getElementById('dev-assistant-send');
        
        if (!queryInput || !agentSelect || !responseArea) return;
        
        const query = queryInput.value.trim();
        if (!query) return;
        
        const agent = agentSelect.value;
        
        // Show loading state
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';
        }
        responseArea.textContent = 'Sending query to ' + agent + '...';
        
        // Log the query
        this.addLog('info', `🤖 Dev Assistant Query: ${query}`, {
            action: 'dev-assistant-query',
            agent: agent,
            query: query
        });
        
        try {
            const response = await this.callSergikAITeam(agent, query);
            
            // Display response
            responseArea.textContent = response;
            
            // Add to history
            this.devAssistantHistory.push({
                agent: agent,
                query: query,
                response: response,
                timestamp: new Date().toISOString()
            });
            
            // Log success
            this.addLog('success', `✅ Dev Assistant Response received from ${agent}`, {
                action: 'dev-assistant-response',
                agent: agent,
                query: query,
                responseLength: response.length
            });
            
            // Visual feedback
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(sendBtn, 'Sent!', 'success');
                setTimeout(() => {
                    window.visualFeedback.removeButtonFeedback(sendBtn);
                }, 1000);
            }
        } catch (error) {
            responseArea.textContent = `Error: ${error.message}\n\nPlease check:\n- SERGIK AI Team is running on ${this.sergikAITeamUrl}\n- The URL is correct in settings`;
            
            this.addLog('error', `❌ Dev Assistant Error: ${error.message}`, {
                action: 'dev-assistant-error',
                agent: agent,
                query: query,
                error: error.message
            });
            
            // Visual feedback
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(sendBtn, 'Error', 'error');
                setTimeout(() => {
                    window.visualFeedback.removeButtonFeedback(sendBtn);
                }, 2000);
            }
        } finally {
            // Reset loading state
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send';
            }
            queryInput.value = '';
        }
    }
    
    /**
     * Handle quick action button clicks
     */
    async handleQuickAction(action) {
        const responseArea = document.getElementById('dev-assistant-response');
        
        if (action === 'auto-help') {
            const task = prompt('What do you need help with?');
            if (task) {
                responseArea.textContent = 'Getting help...';
                try {
                    const response = await this.autoHelp(task);
                    if (response) {
                        responseArea.textContent = response;
                    }
                } catch (error) {
                    responseArea.textContent = `Error: ${error.message}`;
                }
            }
        } else if (action === 'code-review') {
            const filePath = prompt('Enter file path to review:');
            if (filePath) {
                responseArea.textContent = 'Reviewing code...';
                try {
                    const response = await this.codeReview(filePath);
                    if (response) {
                        responseArea.textContent = response;
                    }
                } catch (error) {
                    responseArea.textContent = `Error: ${error.message}`;
                }
            }
        } else if (action === 'best-practices') {
            const topic = prompt('What topic?');
            if (topic) {
                responseArea.textContent = 'Getting best practices...';
                try {
                    const response = await this.getBestPractices(topic);
                    if (response) {
                        responseArea.textContent = response;
                    }
                } catch (error) {
                    responseArea.textContent = `Error: ${error.message}`;
                }
            }
        }
    }
    
    /**
     * Call SERGIK AI Team agent
     */
    async callSergikAITeam(agent, message) {
        const url = `${this.sergikAITeamUrl}/agent/message`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender: 'Developer',
                    receiver: agent,
                    content: message,
                    metadata: {}
                }),
                signal: AbortSignal.timeout(30000) // 30 second timeout
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || data.reply || 'Unknown error');
            }
            
            return data.reply || 'No response from agent';
        } catch (error) {
            if (error.name === 'TimeoutError') {
                throw new Error('Request timeout: SERGIK AI Team did not respond within 30 seconds');
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(`Network error: Unable to connect to ${this.sergikAITeamUrl}. Is SERGIK AI Team running?`);
            }
            throw error;
        }
    }
    
    /**
     * Get automatic help from DevAssistant
     */
    async autoHelp(task) {
        this.addLog('info', `🤖 Auto Help: ${task}`, { task });
        try {
            const reply = await this.callSergikAITeam('DevAssistant', `auto_help: ${task}`);
            this.addLog('info', `✅ Auto Help Response received`, { task, replyLength: reply.length });
            return reply;
        } catch (error) {
            this.addLog('error', `❌ Auto Help Error: ${error.message}`, { task, error: error.message });
            throw error;
        }
    }
    
    /**
     * Review code using DevAssistant
     */
    async codeReview(filePath) {
        this.addLog('info', `🔍 Code Review: ${filePath}`, { filePath });
        try {
            const reply = await this.callSergikAITeam('DevAssistant', `code_review: ${filePath}`);
            this.addLog('info', `✅ Code Review Response received`, { filePath, replyLength: reply.length });
            return reply;
        } catch (error) {
            this.addLog('error', `❌ Code Review Error: ${error.message}`, { filePath, error: error.message });
            throw error;
        }
    }
    
    /**
     * Get best practices from DevAssistant
     */
    async getBestPractices(topic) {
        this.addLog('info', `📚 Best Practices: ${topic}`, { topic });
        try {
            const reply = await this.callSergikAITeam('DevAssistant', `best_practices: ${topic}`);
            this.addLog('info', `✅ Best Practices Response received`, { topic, replyLength: reply.length });
            return reply;
        } catch (error) {
            this.addLog('error', `❌ Best Practices Error: ${error.message}`, { topic, error: error.message });
            throw error;
        }
    }
    
    /**
     * Ask any agent a question
     */
    async askAgent(agentName, question) {
        this.addLog('info', `🤖 Asking ${agentName}: ${question}`, { agent: agentName, question });
        try {
            const reply = await this.callSergikAITeam(agentName, question);
            this.addLog('info', `✅ Response from ${agentName} received`, { agent: agentName, replyLength: reply.length });
            return reply;
        } catch (error) {
            this.addLog('error', `❌ Error asking ${agentName}: ${error.message}`, { agent: agentName, error: error.message });
            throw error;
        }
    }
    
    wireActionButtons() {
        // Wire up action buttons - this can be called multiple times safely
        const clearBtn = document.getElementById('console-clear');
        const exportBtn = document.getElementById('console-export');
        const copyBtn = document.getElementById('console-copy');
        
        // Only wire if buttons exist and haven't been wired yet
        if (clearBtn && !clearBtn.dataset.wired) {
            clearBtn.addEventListener('click', () => {
                this._addButtonFeedback(clearBtn, 'clearing...');
                
                // Log the action before clearing
                const logCount = this.logs.length;
                this.addLog('info', `🧹 Console cleared (${logCount} logs removed)`, {
                    action: 'clear',
                    logCount: logCount,
                    timestamp: new Date().toISOString()
                });
                
                setTimeout(() => {
                this.clear();
                    this._addButtonFeedback(clearBtn, 'cleared!', 'success');
                    setTimeout(() => this._removeButtonFeedback(clearBtn), 1000);
                }, 100);
            });
            clearBtn.dataset.wired = 'true';
        }
        
        if (exportBtn && !exportBtn.dataset.wired) {
            exportBtn.addEventListener('click', () => {
                this._addButtonFeedback(exportBtn, 'exporting...');
                
                // Log the action before exporting
                const exportData = {
                    timestamp: new Date().toISOString(),
                    totalLogs: this.logs.length,
                    filteredLogs: this.getFilteredLogCount ? this.getFilteredLogCount(this.filter) : this.logs.length,
                    filter: this.filter,
                    searchQuery: this.searchQuery || null
                };
                
                this.addLog('info', `📥 Exporting logs...`, exportData);
                
                setTimeout(() => {
                    try {
                        const fileName = this.export();
                        this.addLog('success', `✅ Logs exported to: ${fileName}`, {
                            action: 'export',
                            fileName: fileName,
                            logCount: this.logs.length,
                            filter: this.filter,
                            searchQuery: this.searchQuery || null
                        });
                        this._addButtonFeedback(exportBtn, 'exported!', 'success');
                        setTimeout(() => this._removeButtonFeedback(exportBtn), 1500);
                    } catch (error) {
                        this.addLog('error', `❌ Export failed: ${error.message}`, {
                            action: 'export',
                            error: error.message,
                            stack: error.stack
                        });
                        this._addButtonFeedback(exportBtn, 'error!', 'error');
                        setTimeout(() => this._removeButtonFeedback(exportBtn), 2000);
                    }
                }, 100);
            });
            exportBtn.dataset.wired = 'true';
        }
        
        if (copyBtn && !copyBtn.dataset.wired) {
            copyBtn.addEventListener('click', async () => {
                this._addButtonFeedback(copyBtn, 'copying...');
                
                // Log the action before copying
                const logCount = this.logs.length;
                this.addLog('info', `📋 Copying ${logCount} logs to clipboard...`, {
                    action: 'copy',
                    logCount: logCount
                });
                
                try {
                    await this.copyAll();
                    this.addLog('success', `✅ ${logCount} logs copied to clipboard`, {
                        action: 'copy',
                        logCount: logCount,
                        success: true
                    });
                    this._addButtonFeedback(copyBtn, 'copied!', 'success');
                    setTimeout(() => this._removeButtonFeedback(copyBtn), 1500);
                } catch (error) {
                    this.addLog('error', `❌ Copy failed: ${error.message}`, {
                        action: 'copy',
                        error: error.message
                    });
                    this._addButtonFeedback(copyBtn, 'error!', 'error');
                    setTimeout(() => this._removeButtonFeedback(copyBtn), 2000);
                }
            });
            copyBtn.dataset.wired = 'true';
        }
        
        // Mark as wired if at least one button was found
        if (clearBtn || exportBtn || copyBtn) {
            this.buttonsWired = true;
        }
    }
    
    /**
     * Add visual feedback to a button
     * @private
     * @param {HTMLElement} button - Button element
     * @param {string} text - Feedback text
     * @param {string} type - Feedback type: 'loading', 'success', 'error'
     */
    _addButtonFeedback(button, text, type = 'loading') {
        if (!button) return;
        
        // Store original text
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
        
        // Add visual feedback classes
        button.classList.add('btn-feedback');
        button.classList.add(`btn-feedback-${type}`);
        
        // Add loading spinner for loading state
        if (type === 'loading') {
            button.style.position = 'relative';
            button.style.opacity = '0.7';
            button.style.cursor = 'wait';
            
            // Create spinner if it doesn't exist
            if (!button.querySelector('.btn-spinner')) {
                const spinner = document.createElement('span');
                spinner.className = 'btn-spinner';
                spinner.innerHTML = '⏳';
                spinner.style.marginRight = '6px';
                button.insertBefore(spinner, button.firstChild);
            }
        } else if (type === 'success') {
            button.style.opacity = '1';
            button.style.cursor = 'default';
            button.style.background = '#28a745';
            button.style.color = 'white';
            
            // Remove spinner if exists
            const spinner = button.querySelector('.btn-spinner');
            if (spinner) spinner.remove();
            
            // Add success icon
            if (!button.querySelector('.btn-success-icon')) {
                const icon = document.createElement('span');
                icon.className = 'btn-success-icon';
                icon.innerHTML = '✓';
                icon.style.marginRight = '6px';
                button.insertBefore(icon, button.firstChild);
            }
        } else if (type === 'error') {
            button.style.opacity = '1';
            button.style.cursor = 'default';
            button.style.background = '#dc3545';
            button.style.color = 'white';
            
            // Remove spinner if exists
            const spinner = button.querySelector('.btn-spinner');
            if (spinner) spinner.remove();
            
            // Add error icon
            if (!button.querySelector('.btn-error-icon')) {
                const icon = document.createElement('span');
                icon.className = 'btn-error-icon';
                icon.innerHTML = '✗';
                icon.style.marginRight = '6px';
                button.insertBefore(icon, button.firstChild);
            }
        }
        
        // Update button text
        const textNode = button.childNodes[button.childNodes.length - 1];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            textNode.textContent = text;
        } else {
            button.appendChild(document.createTextNode(text));
        }
        
        // Add click animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }
    
    /**
     * Remove visual feedback from a button
     * @private
     * @param {HTMLElement} button - Button element
     */
    _removeButtonFeedback(button) {
        if (!button) return;
        
        // Remove feedback classes
        button.classList.remove('btn-feedback', 'btn-feedback-loading', 'btn-feedback-success', 'btn-feedback-error');
        
        // Reset styles
        button.style.opacity = '';
        button.style.cursor = '';
        button.style.background = '';
        button.style.color = '';
        button.style.transform = '';
        button.style.position = '';
        
        // Remove icons
        const spinner = button.querySelector('.btn-spinner');
        if (spinner) spinner.remove();
        const successIcon = button.querySelector('.btn-success-icon');
        if (successIcon) successIcon.remove();
        const errorIcon = button.querySelector('.btn-error-icon');
        if (errorIcon) errorIcon.remove();
        
        // Restore original text
        if (button.dataset.originalText) {
            // Remove all text nodes and restore original
            const textNodes = Array.from(button.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
            textNodes.forEach(node => node.remove());
            
            // Find the last non-icon element or restore full text
            const lastElement = Array.from(button.childNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).pop();
            if (lastElement) {
                lastElement.textContent = button.dataset.originalText;
            } else {
                button.textContent = button.dataset.originalText;
            }
        }
    }
    
    /**
     * Add visual feedback to a checkbox
     * @private
     * @param {HTMLElement} checkbox - Checkbox input element
     * @param {boolean} checked - Whether checkbox is checked
     */
    _addCheckboxFeedback(checkbox, checked) {
        if (!checkbox) return;
        
        // Find the label container
        const label = checkbox.closest('label');
        if (!label) return;
        
        // Add pulse animation
        label.style.transition = 'all 0.2s ease';
        label.style.transform = 'scale(1.05)';
        
        // Add visual indicator
        if (checked) {
            label.style.color = '#28a745';
        } else {
            label.style.color = '#6c757d';
        }
        
        setTimeout(() => {
            label.style.transform = '';
            label.style.color = '';
        }, 300);
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
        
        // Visual feedback: flash console container when new log is added
        const consoleEl = document.getElementById('developer-console');
        if (consoleEl && this.shouldRender) {
            consoleEl.style.transition = 'background-color 0.3s ease';
            const originalBg = consoleEl.style.background || '#0a0a0a';
            
            // Flash effect based on log level
            const flashColors = {
                error: 'rgba(220, 53, 69, 0.2)',
                warn: 'rgba(255, 193, 7, 0.2)',
                info: 'rgba(0, 122, 204, 0.1)',
                success: 'rgba(40, 167, 69, 0.1)',
                debug: 'rgba(108, 117, 125, 0.1)'
            };
            
            if (flashColors[level]) {
                consoleEl.style.background = flashColors[level];
                setTimeout(() => {
                    consoleEl.style.background = originalBg;
                }, 300);
            }
        }
        
        // Always render (logs are stored regardless)
        if (this.shouldRender) {
            // Debounce rendering for performance
            if (!this.renderTimeout) {
                this.renderTimeout = setTimeout(() => {
                    this.render();
                    this.renderTimeout = null;
                    // Update filter counts when new log is added
                    this.updateFilterButtonCounts();
                }, 50);
            }
        }
    }
    
    trimLogs() {
        const beforeCount = this.logs.length;
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
            const trimmed = beforeCount - this.logs.length;
            // Note: Trimming is logged by the caller to avoid infinite loops
            // This method just performs the trim operation
        }
    }
    
    render() {
        // Phase 5 & 6: Support tabs
        if (this.currentTab === 'network') {
            this.renderNetwork();
            return;
        }
        
        if (this.currentTab === 'performance') {
            this.renderPerformance();
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
        
        // Show last 500 logs for performance (increased)
        const displayLogs = filteredLogs.slice(-500);
        
        // Use enhanced rendering if enabled, otherwise fallback to original
        const html = this.enhancedRendering 
            ? this.renderEnhanced(displayLogs)
            : this.renderOriginal(displayLogs);
        
        const wasScrolledToBottom = consoleEl.scrollHeight - consoleEl.scrollTop <= consoleEl.clientHeight + 10;
        
        consoleEl.innerHTML = html || '<div style="color: #666; font-style: italic;">No logs to display</div>';
        
        // Add status bar at bottom
        if (this.logs.length > 0) {
            const statusBar = document.createElement('div');
            statusBar.style.cssText = 'position: sticky; bottom: 0; background: #1e1e1e; padding: 4px 8px; border-top: 1px solid #3c3c3c; font-size: 10px; color: #888; z-index: 10;';
            statusBar.textContent = this.getFilterStatusText(filteredLogs.length, this.logs.length);
            consoleEl.appendChild(statusBar);
        }
        
        // Phase 4: Wire up expandable objects if enabled
        if (this.expandableObjects) {
            this.wireExpandableObjects(consoleEl);
        }
        
        // Auto-scroll to bottom only if already at bottom
        if (wasScrolledToBottom) {
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
        
        // Update filter button counts
        this.updateFilterButtonCounts();
        
        // Update settings status
        this.updateSettingsStatus();
    }
    
    // Phase 5: Network request methods
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
                        <div class="network-section">
                            <div class="network-section-title">Request Headers</div>
                            <pre class="network-headers">${this.formatHeaders(req.headers)}</pre>
                        </div>
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
                        ${req.responseText ? `
                            <div class="network-section">
                                <div class="network-section-title">Response Text</div>
                                <pre class="network-body">${this.escapeHtml(req.responseText)}</pre>
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
        
        // Wire up toggle buttons
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
            return Object.entries(headers)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
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
    
    // Phase 6: Performance monitoring
    startPerformanceMonitoring() {
        if (!this.performanceTabEnabled) return;
        
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) {
                            this.addPerformanceMetric({
                                type: 'long-task',
                                name: entry.name,
                                duration: entry.duration,
                                startTime: entry.startTime,
                                timestamp: Date.now()
                            });
                        }
                    }
                });
                
                // Try to observe long tasks (may not be supported in all browsers)
                try {
                    observer.observe({ entryTypes: ['measure', 'navigation'] });
                } catch (e) {
                    // Long task observation not supported
                }
            } catch (e) {
                // PerformanceObserver not fully supported
            }
        }
        
        // Monitor memory usage (if available)
        if (performance.memory) {
            setInterval(() => {
                this.addPerformanceMetric({
                    type: 'memory',
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });
            }, 5000); // Every 5 seconds
        }
    }
    
    addPerformanceMetric(metric) {
        this.performanceMetrics.push(metric);
        
        if (this.performanceMetrics.length > 1000) {
            this.performanceMetrics.shift();
        }
        
        if (this.currentTab === 'performance') {
            this.renderPerformance();
        }
    }
    
    renderPerformance() {
        const consoleEl = document.getElementById('developer-console');
        if (!consoleEl) return;
        
        const metrics = this.performanceMetrics.slice(-100);
        
        // Group metrics by type
        const longTasks = metrics.filter(m => m.type === 'long-task');
        const memoryMetrics = metrics.filter(m => m.type === 'memory');
        const latestMemory = memoryMetrics[memoryMetrics.length - 1];
        
        let html = '<div class="performance-panel">';
        
        // Memory usage
        if (latestMemory) {
            const usedMB = (latestMemory.used / 1024 / 1024).toFixed(2);
            const totalMB = (latestMemory.total / 1024 / 1024).toFixed(2);
            const limitMB = (latestMemory.limit / 1024 / 1024).toFixed(2);
            const percent = ((latestMemory.used / latestMemory.limit) * 100).toFixed(1);
            
            html += `
                <div class="performance-section">
                    <div class="performance-section-title">Memory Usage</div>
                    <div class="performance-metric">
                        <div class="metric-label">Used:</div>
                        <div class="metric-value">${usedMB} MB</div>
                    </div>
                    <div class="performance-metric">
                        <div class="metric-label">Total:</div>
                        <div class="metric-value">${totalMB} MB</div>
                    </div>
                    <div class="performance-metric">
                        <div class="metric-label">Limit:</div>
                        <div class="metric-value">${limitMB} MB</div>
                    </div>
                    <div class="performance-bar">
                        <div class="performance-bar-fill" style="width: ${percent}%; background: ${percent > 80 ? '#f48771' : percent > 60 ? '#dcdcaa' : '#89d185'};"></div>
                        <div class="performance-bar-label">${percent}%</div>
                    </div>
                </div>
            `;
        }
        
        // Long tasks
        if (longTasks.length > 0) {
            html += `
                <div class="performance-section">
                    <div class="performance-section-title">Long Tasks (>50ms)</div>
                    <div class="long-tasks-list">
                        ${longTasks.slice(-20).map(task => {
                            return `
                                <div class="long-task-entry">
                                    <span class="task-name">${this.escapeHtml(task.name || 'Unknown')}</span>
                                    <span class="task-duration">${task.duration.toFixed(2)}ms</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        consoleEl.innerHTML = html || '<div style="color: #666; font-style: italic;">No performance data</div>';
    }
    
    wireExpandableObjects(container) {
        // Use event delegation for expandable objects
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
    }
    
    renderEnhanced(logs) {
        // Enhanced rendering with color-coded values and better formatting
        return logs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                fractionalSecondDigits: 3
            });
            const levelClass = `console-${log.level}`;
            const levelIcon = this.getLevelIcon(log.level);
            
            // Enhanced message rendering with color-coded values
            let messageHtml = this.renderMessage(log.message, log.data);
            
            // Enhanced data rendering
            let dataHtml = '';
            if (log.data && typeof log.data === 'object') {
                dataHtml = this.renderData(log.data);
            }
            
            // Stack trace for errors
            let stackTraceHtml = '';
            if (log.level === 'error' && log.data?.stack) {
                stackTraceHtml = this.renderStackTrace(log.data.stack);
            }
            
            return `
                <div class="console-line ${levelClass}" data-log-id="${log.id}">
                    <span class="console-time">[${time}]</span>
                    <span class="console-level">${levelIcon}</span>
                    <span class="console-message">${messageHtml}</span>
                    ${dataHtml}
                    ${stackTraceHtml}
                </div>
            `;
        }).join('');
    }
    
    renderMessage(message, data) {
        if (!message) return '';
        
        // Try to extract and color-code values in the message
        // This is a simple implementation - can be enhanced
        let html = this.escapeHtml(message);
        
        // Color-code common patterns
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
        
        // Phase 4: Use expandable objects if enabled
        if (this.expandableObjects) {
            return `<div class="console-data">${this.renderValue(data, 0)}</div>`;
        }
        
        // Fallback to JSON string rendering
        try {
            const dataStr = JSON.stringify(data, null, 2);
            if (dataStr.length > 2000) {
                return `<div class="console-data">${this.escapeHtml(dataStr.substring(0, 2000))}... (truncated, ${dataStr.length} chars)</div>`;
            } else {
                // Apply syntax highlighting to JSON
                const highlighted = this.highlightJSON(dataStr);
                return `<div class="console-data">${highlighted}</div>`;
            }
        } catch (e) {
            return `<div class="console-data">[Object - ${e.message}]</div>`;
        }
    }
    
    renderValue(value, depth = 0) {
        // Reset seen objects for each top-level render
        if (depth === 0) {
            this._seenObjects = new WeakSet();
        }
        
        // Limit recursion depth to prevent performance issues
        if (depth > 3) {
            return '<span class="value-preview">[Max Depth Reached]</span>';
        }
        
        if (value === null) {
            return '<span class="value-null">null</span>';
        }
        
        if (value === undefined) {
            return '<span class="value-undefined">undefined</span>';
        }
        
        const type = typeof value;
        
        if (type === 'string') {
            return `<span class="value-string">"${this.escapeHtml(value)}"</span>`;
        }
        
        if (type === 'number') {
            return `<span class="value-number">${value}</span>`;
        }
        
        if (type === 'boolean') {
            return `<span class="value-boolean">${value}</span>`;
        }
        
        if (type === 'function') {
            return `<span class="value-function">function ${value.name || ''}()</span>`;
        }
        
        if (type === 'object') {
            // Handle circular references
            if (this._seenObjects && this._seenObjects.has(value)) {
                return '<span class="value-preview">[Circular Reference]</span>';
            }
            
            if (!this._seenObjects) {
                this._seenObjects = new WeakSet();
            }
            this._seenObjects.add(value);
            
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    return '<span class="value-array">[]</span>';
                }
                
                const preview = value.length > 3 
                    ? value.slice(0, 3).map(v => this.renderValue(v, depth + 1)).join(', ') + `, ... (${value.length} items)`
                    : value.map(v => this.renderValue(v, depth + 1)).join(', ');
                
                const uniqueId = `array_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                return `<span class="value-array expandable" data-expanded="false" data-id="${uniqueId}">
                    <span class="expand-icon">▶</span>
                    <span class="array-preview">[${preview}]</span>
                    <div class="array-expanded" style="display: none; margin-left: 20px;">
                        ${value.map((v, i) => 
                            `<div class="array-item">${i}: ${this.renderValue(v, depth + 1)}</div>`
                        ).join('')}
                    </div>
                </span>`;
            } else {
                const keys = Object.keys(value);
                if (keys.length === 0) {
                    return '<span class="value-object">{}</span>';
                }
                
                const preview = keys.slice(0, 3).map(k => {
                    const val = this.renderValue(value[k], depth + 1);
                    return `${k}: ${val}`;
                }).join(', ');
                const more = keys.length > 3 ? `, ... (${keys.length} properties)` : '';
                
                const uniqueId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                return `<span class="value-object expandable" data-expanded="false" data-id="${uniqueId}">
                    <span class="expand-icon">▶</span>
                    <span class="object-preview">{${preview}${more}}</span>
                    <div class="object-expanded" style="display: none; margin-left: 20px;">
                        ${keys.map(k => 
                            `<div class="object-property">
                                <span class="property-key">${k}:</span>
                                <span class="property-value">${this.renderValue(value[k], depth + 1)}</span>
                            </div>`
                        ).join('')}
                    </div>
                </span>`;
            }
        }
        
        return `<span class="value-unknown">${this.escapeHtml(String(value))}</span>`;
    }
    
    highlightJSON(json) {
        // Simple JSON syntax highlighting
        let html = this.escapeHtml(json);
        
        // Highlight keys
        html = html.replace(/"([^"]+)":/g, '<span class="property-key">"$1"</span>:');
        
        // Highlight string values
        html = html.replace(/:\s*"([^"]*)"/g, ': <span class="value-string">"$1"</span>');
        
        // Highlight numbers
        html = html.replace(/:\s*(\d+\.?\d*)/g, ': <span class="value-number">$1</span>');
        
        // Highlight booleans and null
        html = html.replace(/:\s*(true|false|null)/g, (match, value) => {
            const className = value === 'null' ? 'value-null' : 'value-boolean';
            return `: <span class="${className}">${value}</span>`;
        });
        
        return html;
    }
    
    renderStackTrace(stack) {
        if (!stack) return '';
        
        const lines = stack.split('\n').slice(1); // Skip first line (error message)
        
        return `
            <div class="stack-trace">
                ${lines.map(line => {
                    const match = line.match(/at (.+?):(\d+):(\d+)/);
                    if (match) {
                        const [, file, lineNum, colNum] = match;
                        return `<div class="stack-line">
                            <span class="stack-file">${this.escapeHtml(file)}</span>
                            <span class="stack-location">:${lineNum}:${colNum}</span>
                        </div>`;
                    }
                    return `<div class="stack-line">${this.escapeHtml(line.trim())}</div>`;
                }).join('')}
            </div>
        `;
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
        // Note: Action is logged in wireActionButtons() before clearing
        // Update filter counts after clearing
        this.updateFilterButtonCounts();
    }
    
    export() {
        const fileName = `sergik-console-${Date.now()}.json`;
        const data = {
            timestamp: new Date().toISOString(),
            app: 'SERGIK AI Controller',
            version: '1.0.0',
            logs: this.logs,
            filter: this.filter,
            searchQuery: this.searchQuery || null,
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
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        // Return filename for logging purposes
        return fileName;
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
    
    /**
     * Get count of logs for a specific filter
     * @param {string} filter - Filter level ('all', 'error', 'warn', 'info', 'success', 'debug')
     * @returns {number} Count of logs matching the filter
     */
    getFilteredLogCount(filter) {
        if (filter === 'all') {
            return this.logs.length;
        }
        return this.logs.filter(log => log.level === filter).length;
    }
    
    /**
     * Update filter button text to show log counts
     */
    updateFilterButtonCounts() {
        const filterButtons = document.querySelectorAll('.console-filter-btn');
        filterButtons.forEach(btn => {
            const filter = btn.dataset.filter;
            if (!filter) return;
            
            const count = this.getFilteredLogCount(filter);
            const originalText = btn.dataset.originalText || btn.textContent.split('(')[0].trim();
            btn.dataset.originalText = originalText;
            
            if (count > 0) {
                btn.textContent = `${originalText} (${count})`;
            } else {
                btn.textContent = originalText;
            }
        });
    }
    
    /**
     * Get filter status text for status bar
     * @param {number} filteredCount - Number of filtered logs
     * @param {number} totalCount - Total number of logs
     * @returns {string} Status text
     */
    getFilterStatusText(filteredCount, totalCount) {
        let status = `Showing ${filteredCount} of ${totalCount} logs`;
        if (this.filter !== 'all') {
            status += ` (filtered by: ${this.filter})`;
        }
        if (this.searchQuery) {
            status += ` (search: "${this.searchQuery}")`;
        }
        return status;
    }
    
    loadSettings() {
        const enabled = localStorage.getItem('dev-console-enabled');
        const apiCalls = localStorage.getItem('dev-console-api-calls');
        const errors = localStorage.getItem('dev-console-errors');
        const performance = localStorage.getItem('dev-console-performance');
        const maxLogs = localStorage.getItem('dev-console-max-logs');
        const filter = localStorage.getItem('dev-console-filter');
        const currentTab = localStorage.getItem('dev-console-current-tab');
        const aiTeamUrl = localStorage.getItem('dev-console-ai-team-url');
        
        if (enabled !== null) this.enabled = enabled === 'true';
        if (apiCalls !== null) this.logApiCalls = apiCalls === 'true';
        if (errors !== null) this.logErrors = errors === 'true';
        if (performance !== null) this.logPerformance = performance === 'true';
        if (maxLogs) this.maxLogs = parseInt(maxLogs) || 5000;
        if (filter) this.filter = filter;
        if (currentTab && ['console', 'network', 'performance'].includes(currentTab)) {
            this.currentTab = currentTab;
        }
        if (aiTeamUrl) {
            this.sergikAITeamUrl = aiTeamUrl;
        }
        
        // Update UI
        const aiTeamUrlInput = document.getElementById('settings-ai-team-url');
        if (aiTeamUrlInput) {
            aiTeamUrlInput.value = this.sergikAITeamUrl;
        }
        
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
        
        // Restore filter button state
        if (this.filter) {
            const filterButtons = document.querySelectorAll('.console-filter-btn');
            filterButtons.forEach(b => {
                if (b.dataset.filter === this.filter) {
                    b.style.background = '#007acc';
                    b.style.color = 'white';
                } else {
                    b.style.background = '#3c3c3c';
                    b.style.color = '#cccccc';
                }
            });
        }
    }
    
    saveSettings() {
        localStorage.setItem('dev-console-enabled', this.enabled);
        localStorage.setItem('dev-console-api-calls', this.logApiCalls);
        localStorage.setItem('dev-console-errors', this.logErrors);
        localStorage.setItem('dev-console-performance', this.logPerformance);
        localStorage.setItem('dev-console-max-logs', this.maxLogs);
        localStorage.setItem('dev-console-filter', this.filter);
        localStorage.setItem('dev-console-current-tab', this.currentTab);
        localStorage.setItem('dev-console-ai-team-url', this.sergikAITeamUrl);
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

// Expose Dev Assistant helper functions on window object
if (typeof window !== 'undefined') {
    window.askDevAssistant = function(question) {
        if (window.developerConsole) {
            return window.developerConsole.askAgent('DevAssistant', question);
        } else {
            console.error('Developer Console not initialized');
            return Promise.reject(new Error('Developer Console not initialized'));
        }
    };
    
    window.autoHelp = function(task) {
        if (window.developerConsole) {
            return window.developerConsole.autoHelp(task);
        } else {
            console.error('Developer Console not initialized');
            return Promise.reject(new Error('Developer Console not initialized'));
        }
    };
    
    window.codeReview = function(filePath) {
        if (window.developerConsole) {
            return window.developerConsole.codeReview(filePath);
        } else {
            console.error('Developer Console not initialized');
            return Promise.reject(new Error('Developer Console not initialized'));
        }
    };
    
    window.getBestPractices = function(topic) {
        if (window.developerConsole) {
            return window.developerConsole.getBestPractices(topic);
        } else {
            console.error('Developer Console not initialized');
            return Promise.reject(new Error('Developer Console not initialized'));
        }
    };
    
    window.askAgent = function(agentName, question) {
        if (window.developerConsole) {
            return window.developerConsole.askAgent(agentName, question);
        } else {
            console.error('Developer Console not initialized');
            return Promise.reject(new Error('Developer Console not initialized'));
        }
    };
}
