/**
 * Loading States & Progress Indicators
 * Provides loading spinners, progress bars, and skeleton screens
 */

class LoadingStates {
    constructor() {
        this.activeLoaders = new Map();
    }
    
    // Show loading spinner on a button
    setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = '';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        }
    }
    
    // Show full-screen loading overlay
    showOverlay(message = 'Loading...', progress = null) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loading-overlay';
        
        const content = document.createElement('div');
        content.className = 'loading-content';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        const text = document.createElement('div');
        text.className = 'loading-text';
        text.textContent = message;
        
        content.appendChild(spinner);
        content.appendChild(text);
        
        if (progress !== null) {
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            const progressFill = document.createElement('div');
            progressFill.className = 'progress-bar-fill';
            progressFill.style.width = `${progress}%`;
            progressBar.appendChild(progressFill);
            content.appendChild(progressBar);
        }
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        // Animate in
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
        
        this.activeLoaders.set('overlay', overlay);
        return overlay;
    }
    
    // Hide loading overlay
    hideOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
            this.activeLoaders.delete('overlay');
        }
    }
    
    // Update overlay progress
    updateOverlayProgress(progress, message = null) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            const progressFill = overlay.querySelector('.progress-bar-fill');
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            if (message) {
                const text = overlay.querySelector('.loading-text');
                if (text) {
                    text.textContent = message;
                }
            }
        }
    }
    
    // Create skeleton screen
    createSkeleton(type = 'text', count = 1) {
        const skeletons = [];
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = `skeleton skeleton-${type}`;
            skeletons.push(skeleton);
        }
        return skeletons;
    }
    
    // Wrap async function with loading state
    async withLoading(fn, options = {}) {
        const {
            button = null,
            overlay = false,
            message = 'Loading...',
            onProgress = null
        } = options;
        
        let overlayEl = null;
        
        try {
            // Show loading
            if (button) {
                this.setButtonLoading(button, true);
            }
            if (overlay) {
                overlayEl = this.showOverlay(message);
            }
            
            // Execute function
            const result = await fn((progress, progressMessage) => {
                if (overlayEl && onProgress) {
                    this.updateOverlayProgress(progress, progressMessage);
                }
            });
            
            return result;
        } finally {
            // Hide loading
            if (button) {
                this.setButtonLoading(button, false);
            }
            if (overlayEl) {
                this.hideOverlay();
            }
        }
    }
    
    // Show inline spinner
    showSpinner(container, message = '') {
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'inline-spinner-container';
        spinnerContainer.style.display = 'flex';
        spinnerContainer.style.alignItems = 'center';
        spinnerContainer.style.gap = '8px';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        spinnerContainer.appendChild(spinner);
        
        if (message) {
            const text = document.createElement('span');
            text.textContent = message;
            text.style.fontSize = '11px';
            text.style.color = 'var(--text-secondary)';
            spinnerContainer.appendChild(text);
        }
        
        if (container) {
            container.appendChild(spinnerContainer);
        }
        
        return spinnerContainer;
    }
    
    // Hide inline spinner
    hideSpinner(spinnerContainer) {
        if (spinnerContainer && spinnerContainer.parentNode) {
            spinnerContainer.parentNode.removeChild(spinnerContainer);
        }
    }
}

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.LoadingStates = LoadingStates;
    // Global convenience function
    window.loadingStates = new LoadingStates();
}

