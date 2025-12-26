/**
 * @fileoverview Logger utility - Production-safe logging with levels and filtering
 * @module utils/logger
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

export interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableRemote: boolean;
    remoteEndpoint?: string;
    prefix?: string;
}

/**
 * Logger class for production-safe logging
 */
export class Logger {
    private config: LoggerConfig;
    private context: string;

    constructor(context: string = 'App', config?: Partial<LoggerConfig>) {
        this.context = context;
        this.config = {
            level: this.getLogLevelFromEnv(),
            enableConsole: !this.isProduction(),
            enableRemote: false,
            prefix: `[${context}]`,
            ...config
        };
    }

    /**
     * Get log level from environment variable
     */
    private getLogLevelFromEnv(): LogLevel {
        if (typeof window !== 'undefined') {
            const level = (window as any).__LOG_LEVEL__;
            if (level !== undefined) {
                return parseInt(level, 10) as LogLevel;
            }
        }
        return this.isProduction() ? LogLevel.WARN : LogLevel.DEBUG;
    }

    /**
     * Check if running in production
     */
    private isProduction(): boolean {
        return typeof window !== 'undefined' && 
               (window.location.hostname !== 'localhost' && 
                window.location.hostname !== '127.0.0.1');
    }

    /**
     * Log debug message
     */
    debug(message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    /**
     * Log info message
     */
    info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    /**
     * Log warning message
     */
    warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    /**
     * Log error message
     */
    error(message: string, error?: Error | unknown, ...args: any[]): void {
        const errorMessage = error instanceof Error 
            ? `${message}: ${error.message}` 
            : message;
        this.log(LogLevel.ERROR, errorMessage, error, ...args);
    }

    /**
     * Core logging method
     */
    private log(level: LogLevel, message: string, ...args: any[]): void {
        if (level < this.config.level) {
            return;
        }

        const logMessage = `${this.config.prefix} [${LogLevel[level]}] ${message}`;

        if (this.config.enableConsole) {
            this.logToConsole(level, logMessage, ...args);
        }

        if (this.config.enableRemote && this.config.remoteEndpoint) {
            this.logToRemote(level, message, ...args);
        }
    }

    /**
     * Log to console with appropriate method
     */
    private logToConsole(level: LogLevel, message: string, ...args: any[]): void {
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(message, ...args);
                break;
            case LogLevel.INFO:
                console.info(message, ...args);
                break;
            case LogLevel.WARN:
                console.warn(message, ...args);
                break;
            case LogLevel.ERROR:
                console.error(message, ...args);
                break;
        }
    }

    /**
     * Log to remote endpoint (optional)
     */
    private logToRemote(level: LogLevel, message: string, ...args: any[]): void {
        if (!this.config.remoteEndpoint) return;

        try {
            const logData = {
                level: LogLevel[level],
                context: this.context,
                message,
                args: args.length > 0 ? args : undefined,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                url: typeof window !== 'undefined' ? window.location.href : undefined
            };

            // Use sendBeacon for better reliability
            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                navigator.sendBeacon(
                    this.config.remoteEndpoint,
                    JSON.stringify(logData)
                );
            } else if (typeof fetch !== 'undefined') {
                fetch(this.config.remoteEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logData),
                    keepalive: true
                }).catch(() => {
                    // Silently fail remote logging
                });
            }
        } catch (error) {
            // Silently fail remote logging
        }
    }

    /**
     * Create child logger with context
     */
    child(context: string): Logger {
        return new Logger(`${this.context}:${context}`, this.config);
    }
}

/**
 * Default logger instance
 */
export const logger = new Logger('SERGIK');

/**
 * Create logger for specific module
 */
export function createLogger(context: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger(context, config);
}

