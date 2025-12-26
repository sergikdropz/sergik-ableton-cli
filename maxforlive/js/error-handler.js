/**
 * ErrorHandler Class
 * 
 * Comprehensive error handling with retry logic and user-friendly messages.
 */

export class ErrorHandler {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // Initial delay in ms
        this.retryBackoff = 2; // Exponential backoff multiplier
    }

    /**
     * Handle error with retry logic
     * @param {Function} fn - Function to execute
     * @param {Object} options - Options
     * @returns {Promise} Result
     */
    async withRetry(fn, options = {}) {
        const maxRetries = options.maxRetries || this.maxRetries;
        const retryDelay = options.retryDelay || this.retryDelay;
        const backoff = options.backoff || this.retryBackoff;

        let lastError;
        let delay = retryDelay;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // Don't retry on certain errors
                if (this.isNonRetryableError(error)) {
                    throw this.formatError(error);
                }
                
                // For LOM errors, check classification
                if (error.context && typeof lomErrorHandler !== 'undefined') {
                    var classification = lomErrorHandler.classifyError(error);
                    if (!classification.retryable) {
                        throw this.formatError(error);
                    }
                }

                // Last attempt - throw error
                if (attempt === maxRetries) {
                    break;
                }

                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= backoff;
            }
        }

        throw this.formatError(lastError);
    }
    
    /**
     * Handle LOM error with context preservation
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     * @returns {Object} Formatted error
     */
    handleLOMError(error, context) {
        // Use LOM error handler if available
        if (typeof lomErrorHandler !== 'undefined' && lomErrorHandler.handle) {
            var formatted = lomErrorHandler.handle(error, context);
            return this.formatError(formatted.original || error);
        }
        
        // Fallback to standard error handling
        error.context = context;
        return this.formatError(error);
    }

    /**
     * Check if error is non-retryable
     * @param {Error} error - Error object
     * @returns {boolean} True if non-retryable
     */
    isNonRetryableError(error) {
        // Client errors (4xx) are usually non-retryable
        if (error.status >= 400 && error.status < 500) {
            return true;
        }

        // Validation errors
        if (error.name === 'ValidationError' || error.name === 'LOMError') {
            // Check if it's a retryable LOM error
            if (error.context && typeof lomErrorHandler !== 'undefined') {
                var classification = lomErrorHandler.classifyError(error);
                return !classification.retryable;
            }
            return true;
        }
        
        // LOM invalid path errors are non-retryable
        if (error.message && (
            error.message.includes('invalid path') ||
            error.message.includes('out of range') ||
            error.message.includes('does not exist')
        )) {
            return true;
        }

        return false;
    }

    /**
     * Format error for user display
     * @param {Error} error - Error object
     * @returns {Error} Formatted error
     */
    formatError(error) {
        let message = 'An error occurred';

        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        // Network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            message = 'Network error: Unable to connect to server';
        }

        // HTTP errors
        if (error.status) {
            switch (error.status) {
                case 400:
                    message = 'Invalid request: ' + message;
                    break;
                case 401:
                    message = 'Authentication required';
                    break;
                case 403:
                    message = 'Access denied';
                    break;
                case 404:
                    message = 'Resource not found';
                    break;
                case 429:
                    message = 'Too many requests. Please wait a moment.';
                    break;
                case 500:
                    message = 'Server error. Please try again later.';
                    break;
                default:
                    message = `Error ${error.status}: ${message}`;
            }
        }

        // LOM errors
        if (error.message && error.message.includes('LiveAPI')) {
            message = 'Ableton Live error: ' + message;
        }
        
        // Enhanced LOM error classification
        if (error.context && error.context.operation) {
            // Use LOM error handler if available
            if (typeof lomErrorHandler !== 'undefined' && lomErrorHandler.classifyError) {
                var classification = lomErrorHandler.classifyError(error);
                message = classification.userMessage || message;
            }
        }

        return {
            name: error.name || 'Error',
            message: message,
            original: error,
            context: error.context || {}
        };
    }

    /**
     * Show error to user
     * @param {Error} error - Error object
     * @param {string} context - Error context
     */
    showError(error, context = '') {
        const formatted = this.formatError(error);
        const message = context ? `${context}: ${formatted.message}` : formatted.message;

        // Show in console
        console.error('[ErrorHandler]', message, formatted.original);

        // Show notification
        this.showNotification(message, 'error');

        // Dispatch error event
        const event = new CustomEvent('error', {
            detail: {
                error: formatted,
                context: context
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Show notification
     * @param {string} message - Message
     * @param {string} type - Type ('error', 'warning', 'info', 'success')
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add to page
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Auto-remove after delay
        const delay = type === 'error' ? 5000 : 3000;
        setTimeout(() => {
            notification.remove();
        }, delay);
    }

    /**
     * Handle API error
     * @param {Response} response - Fetch response
     * @returns {Promise} Error
     */
    async handleApiError(response) {
        let error;
        try {
            const data = await response.json();
            error = new Error(data.error || data.message || 'API error');
            error.status = response.status;
            error.data = data;
        } catch (e) {
            error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
        }
        throw error;
    }

    /**
     * Wrap async function with error handling
     * @param {Function} fn - Async function
     * @param {string} context - Error context
     * @returns {Function} Wrapped function
     */
    wrap(fn, context = '') {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.showError(error, context);
                throw error;
            }
        };
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.ErrorHandler = ErrorHandler;
    window.errorHandler = new ErrorHandler();
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = ErrorHandler;
}

