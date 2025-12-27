/**
 * Developer Configuration System
 * Centralized configuration for efficient development and clean builds
 */

class DevConfig {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.loadConfig();
        this.metrics = {
            buildStartTime: null,
            buildEndTime: null,
            buildDuration: null,
            filesProcessed: 0,
            errors: [],
            warnings: [],
            cacheHits: 0,
            cacheMisses: 0,
            memoryPeak: 0
        };
        
        this.applyEnvironmentDefaults();
    }
    
    detectEnvironment() {
        // Detect environment from URL, localStorage, or build flags
        if (typeof window !== 'undefined') {
            const hostname = window.location?.hostname || '';
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'dev';
            }
            if (hostname.includes('staging')) {
                return 'staging';
            }
            return localStorage.getItem('sergik-env') || 'dev';
        }
        // Build-time detection
        if (typeof process !== 'undefined' && process.env) {
            return process.env.NODE_ENV || 'development';
        }
        return 'dev';
    }
    
    loadConfig() {
        const defaultConfig = {
            // Logging
            logLevel: 'INFO',
            logToConsole: true,
            logToFile: false,
            logJson: true,
            logBuildMetrics: true,
            logPerformance: true,
            logApiCalls: true,
            logErrors: true,
            
            // Performance
            enableProfiling: false,
            enableMemoryTracking: false,
            maxLogSize: 10 * 1024 * 1024, // 10MB
            logRotationCount: 5,
            
            // Build optimization
            enableBuildCache: true,
            buildCacheDir: '.build_cache',
            minifyProduction: true,
            sourceMaps: true,
            treeShaking: true,
            
            // Resource limits
            maxLogs: 1000,
            maxNetworkRequests: 500,
            maxConsoleHistory: 200,
            
            // Feature flags
            enableHotReload: true,
            enableTypeChecking: true,
            enableLinting: true,
            enableTestCoverage: false
        };
        
        // Load from localStorage if available
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('sergik-dev-config');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return { ...defaultConfig, ...parsed };
                } catch (e) {
                    console.warn('Failed to parse saved dev config:', e);
                }
            }
        }
        
        return defaultConfig;
    }
    
    applyEnvironmentDefaults() {
        if (this.environment === 'production' || this.environment === 'prod') {
            this.config.logLevel = 'WARNING';
            this.config.logBuildMetrics = false;
            this.config.enableProfiling = false;
            this.config.enableMemoryTracking = false;
            this.config.sourceMaps = false;
            this.config.maxLogs = 500;
            this.config.logPerformance = false;
        } else if (this.environment === 'dev' || this.environment === 'development') {
            this.config.logLevel = 'DEBUG';
            this.config.logBuildMetrics = true;
            this.config.enableProfiling = true;
            this.config.enableMemoryTracking = true;
        }
    }
    
    saveConfig() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('sergik-dev-config', JSON.stringify(this.config));
        }
    }
    
    get(key) {
        return this.config[key];
    }
    
    set(key, value) {
        this.config[key] = value;
        this.saveConfig();
    }
    
    startBuildTracking() {
        this.metrics.buildStartTime = performance.now();
        this.metrics.filesProcessed = 0;
        this.metrics.errors = [];
        this.metrics.warnings = [];
        this.metrics.cacheHits = 0;
        this.metrics.cacheMisses = 0;
        
        if (this.config.logBuildMetrics) {
            console.log('[BUILD] Build started');
        }
    }
    
    endBuildTracking() {
        if (this.metrics.buildStartTime === null) return;
        
        this.metrics.buildEndTime = performance.now();
        this.metrics.buildDuration = this.metrics.buildEndTime - this.metrics.buildStartTime;
        
        if (this.config.logBuildMetrics) {
            const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
                ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(1)
                : 0;
            
            console.log('[BUILD] Build completed:', {
                duration: `${this.metrics.buildDuration.toFixed(2)}ms`,
                filesProcessed: this.metrics.filesProcessed,
                errors: this.metrics.errors.length,
                warnings: this.metrics.warnings.length,
                cacheHitRate: `${cacheHitRate}%`,
                memoryPeak: `${(this.metrics.memoryPeak / 1024 / 1024).toFixed(2)}MB`
            });
        }
    }
    
    trackFileProcessed() {
        this.metrics.filesProcessed++;
    }
    
    trackError(error) {
        this.metrics.errors.push({
            message: error.message || String(error),
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
    
    trackWarning(warning) {
        this.metrics.warnings.push({
            message: warning,
            timestamp: new Date().toISOString()
        });
    }
    
    trackCacheHit() {
        this.metrics.cacheHits++;
    }
    
    trackCacheMiss() {
        this.metrics.cacheMisses++;
    }
    
    trackMemory() {
        if (this.config.enableMemoryTracking && performance.memory) {
            const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
            if (memoryMB > this.metrics.memoryPeak) {
                this.metrics.memoryPeak = performance.memory.usedJSHeapSize;
            }
        }
    }
    
    logPerformance(operation, duration, details = {}) {
        if (!this.config.logPerformance) return;
        
        const level = duration > 1000 ? 'warn' : 'info';
        console[level](`[PERFORMANCE] ${operation} took ${duration.toFixed(2)}ms`, details);
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
                ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
                : 0
        };
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DevConfig;
}

// Global instance
if (typeof window !== 'undefined') {
    window.SergikDevConfig = new DevConfig();
}

