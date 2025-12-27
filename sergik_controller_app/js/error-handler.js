/**
 * Error Handler
 * Provides user-friendly error messages and error recovery
 */

class ErrorHandler {
    constructor() {
        this.errorCategories = {
            network: {
                title: 'Connection Error',
                suggestions: [
                    'Check your internet connection',
                    'Verify the API server is running',
                    'Try refreshing the connection'
                ]
            },
            api: {
                title: 'API Error',
                suggestions: [
                    'The server may be temporarily unavailable',
                    'Check the API URL in settings',
                    'Try again in a few moments'
                ]
            },
            validation: {
                title: 'Validation Error',
                suggestions: [
                    'Please check your input',
                    'Ensure all required fields are filled',
                    'Verify the format is correct'
                ]
            },
            file: {
                title: 'File Error',
                suggestions: [
                    'Check the file exists and is accessible',
                    'Verify the file format is supported',
                    'Ensure you have permission to access the file'
                ]
            },
            timeout: {
                title: 'Request Timeout',
                suggestions: [
                    'The operation is taking longer than expected',
                    'Try again with a smaller file',
                    'Check your connection speed'
                ]
            }
        };
    }
    
    categorizeError(error) {
        const errorMessage = error.message || error.toString().toLowerCase();
        
        if (errorMessage.includes('network') || errorMessage.includes('fetch') || 
            errorMessage.includes('connection') || errorMessage.includes('failed to fetch')) {
            return 'network';
        }
        
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
            return 'timeout';
        }
        
        if (errorMessage.includes('file') || errorMessage.includes('path') || 
            errorMessage.includes('not found') || errorMessage.includes('permission')) {
            return 'file';
        }
        
        if (errorMessage.includes('validation') || errorMessage.includes('invalid') || 
            errorMessage.includes('required') || errorMessage.includes('format')) {
            return 'validation';
        }
        
        return 'api';
    }
    
    getUserFriendlyMessage(error) {
        const category = this.categorizeError(error);
        const categoryInfo = this.errorCategories[category] || this.errorCategories.api;
        
        // Try to extract meaningful message from error
        let message = error.message || error.toString();
        
        // Clean up technical error messages
        message = message.replace(/Error: /g, '');
        message = message.replace(/Failed to fetch/g, 'Unable to connect to server');
        message = message.replace(/Network request failed/g, 'Connection failed');
        message = message.replace(/timeout/g, 'Request timed out');
        
        // If message is too technical, use category title
        if (message.length > 100 || message.includes('at ') || message.includes('Error:')) {
            message = categoryInfo.title;
        }
        
        return {
            message,
            category,
            title: categoryInfo.title,
            suggestions: categoryInfo.suggestions
        };
    }
    
    showError(error, options = {}) {
        const {
            showRetry = false,
            retryCallback = null,
            customMessage = null
        } = options;
        
        const errorInfo = this.getUserFriendlyMessage(error);
        const displayMessage = customMessage || errorInfo.message;
        
        // Show notification
        if (window.showNotification) {
            window.showNotification(displayMessage, 'error', 5000);
        }
        
        // Log to console for debugging
        console.error('[ErrorHandler]', error);
        
        // If retry is available, show retry option
        if (showRetry && retryCallback) {
            setTimeout(() => {
                if (window.showNotification) {
                    // Could enhance this to show a retry button in notification
                    console.log('Retry available for:', errorInfo.title);
                }
            }, 1000);
        }
        
        return errorInfo;
    }
    
    handleApiError(result, context = '') {
        if (!result || result.success !== false) {
            return null;
        }
        
        const error = new Error(result.error || 'Unknown error');
        error.context = context;
        
        return this.showError(error, {
            showRetry: true,
            retryCallback: () => {
                // Retry logic would be implemented by caller
            }
        });
    }
    
    isOffline() {
        return !navigator.onLine;
    }
    
    checkOffline() {
        if (this.isOffline()) {
            if (window.showNotification) {
                window.showNotification('You are currently offline. Please check your connection.', 'warning', 5000);
            }
            return true;
        }
        return false;
    }
}

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
    window.errorHandler = new ErrorHandler();
}

