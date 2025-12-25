/**
 * @fileoverview Error Handler - Standardized error handling with error boundaries
 * @module utils/error-handler
 */

import { createLogger } from './logger.js';

const logger = createLogger('ErrorHandler');

/**
 * Custom error types
 */
export class ValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigurationError';
    }
}

export class DOMError extends Error {
    constructor(message: string, public element?: string) {
        super(message);
        this.name = 'DOMError';
    }
}

/**
 * Error boundary for catching and handling errors gracefully
 */
export class ErrorBoundary {
    private errorHandlers: Map<string, (error: Error) => void> = new Map();
    private fallbackHandler?: (error: Error) => void;

    /**
     * Register error handler for specific error type
     */
    registerHandler(errorType: string, handler: (error: Error) => void): void {
        this.errorHandlers.set(errorType, handler);
    }

    /**
     * Set fallback error handler
     */
    setFallbackHandler(handler: (error: Error) => void): void {
        this.fallbackHandler = handler;
    }

    /**
     * Handle error with appropriate handler
     */
    handleError(error: Error): void {
        const errorType = error.constructor.name;
        const handler = this.errorHandlers.get(errorType) || this.fallbackHandler;

        if (handler) {
            try {
                handler(error);
            } catch (handlerError) {
                logger.error('Error in error handler', handlerError);
                this.defaultErrorHandler(error);
            }
        } else {
            this.defaultErrorHandler(error);
        }
    }

    /**
     * Default error handler
     */
    private defaultErrorHandler(error: Error): void {
        logger.error('Unhandled error', error);
        
        // Show user-friendly message
        if (typeof window !== 'undefined') {
            this.showUserMessage('An error occurred. Please try again.');
        }
    }

    /**
     * Show user-friendly error message
     */
    private showUserMessage(message: string): void {
        // Create or update error message element
        let errorElement = document.getElementById('error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'error-message';
            errorElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 12px 16px;
                border-radius: 4px;
                z-index: 10000;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }, 5000);
    }

    /**
     * Wrap function with error boundary
     */
    wrap<T extends (...args: any[]) => any>(fn: T): T {
        return ((...args: Parameters<T>) => {
            try {
                return fn(...args);
            } catch (error) {
                this.handleError(error as Error);
                throw error;
            }
        }) as T;
    }

    /**
     * Wrap async function with error boundary
     */
    wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T): T {
        return ((...args: Parameters<T>) => {
            return fn(...args).catch((error: Error) => {
                this.handleError(error);
                throw error;
            });
        }) as T;
    }
}

/**
 * Global error boundary instance
 */
export const errorBoundary = new ErrorBoundary();

// Setup default handlers
errorBoundary.registerHandler('ValidationError', (error) => {
    logger.warn('Validation error', error);
});

errorBoundary.registerHandler('DOMError', (error) => {
    logger.error('DOM error', error);
    if (typeof window !== 'undefined') {
        errorBoundary['showUserMessage']('A page element is missing. Please refresh the page.');
    }
});

errorBoundary.registerHandler('ConfigurationError', (error) => {
    logger.error('Configuration error', error);
});

// Global error handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        errorBoundary.handleError(event.error || new Error(event.message));
    });

    window.addEventListener('unhandledrejection', (event) => {
        errorBoundary.handleError(event.reason || new Error('Unhandled promise rejection'));
    });
}

/**
 * Create user-friendly error message
 */
export function getUserFriendlyMessage(error: Error): string {
    if (error instanceof ValidationError) {
        return `Invalid input: ${error.message}`;
    }
    if (error instanceof DOMError) {
        return 'Page element not found. Please refresh the page.';
    }
    if (error instanceof ConfigurationError) {
        return 'Configuration error. Please check settings.';
    }
    return 'An unexpected error occurred. Please try again.';
}

