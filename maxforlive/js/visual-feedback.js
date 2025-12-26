/**
 * VisualFeedback Class
 * 
 * Provides loading states, progress indicators, and toast notifications.
 */

export class VisualFeedback {
    constructor() {
        this.toasts = [];
        this.maxToasts = 5;
        this.setupContainer();
    }

    /**
     * Setup feedback container
     */
    setupContainer() {
        // Create toast container
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        this.toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(this.toastContainer);

        // Create loading overlay container
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.id = 'loading-overlay';
        this.loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        document.body.appendChild(this.loadingOverlay);
    }

    /**
     * Show loading state
     * @param {string} message - Loading message
     * @param {string} id - Loading ID (for tracking)
     * @returns {string} Loading ID
     */
    showLoading(message = 'Loading...', id = null) {
        const loadingId = id || `loading-${Date.now()}`;

        // Create loading element
        const loadingElement = document.createElement('div');
        loadingElement.id = loadingId;
        loadingElement.className = 'loading-indicator';
        loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        loadingElement.style.cssText = `
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

        // Add spinner animation
        const spinner = loadingElement.querySelector('.loading-spinner');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top-color: #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        // Add CSS animation if not already added
        if (!document.getElementById('loading-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-style';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        this.loadingOverlay.appendChild(loadingElement);
        this.loadingOverlay.style.display = 'flex';

        return loadingId;
    }

    /**
     * Hide loading state
     * @param {string} id - Loading ID
     */
    hideLoading(id) {
        if (id) {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        }

        // Hide overlay if no loading elements remain
        if (this.loadingOverlay.children.length === 0) {
            this.loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Show progress indicator
     * @param {string} message - Progress message
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} id - Progress ID
     * @returns {string} Progress ID
     */
    showProgress(message, progress = 0, id = null) {
        const progressId = id || `progress-${Date.now()}`;

        // Create or update progress element
        let progressElement = document.getElementById(progressId);
        if (!progressElement) {
            progressElement = document.createElement('div');
            progressElement.id = progressId;
            progressElement.className = 'progress-indicator';
            progressElement.innerHTML = `
                <div class="progress-message">${message}</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-percent">0%</div>
            `;
            progressElement.style.cssText = `
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px 30px;
                border-radius: 8px;
                min-width: 300px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            `;

            // Style progress bar
            const progressBar = progressElement.querySelector('.progress-bar');
            progressBar.style.cssText = `
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                overflow: hidden;
                margin: 10px 0;
            `;

            const progressFill = progressElement.querySelector('.progress-fill');
            progressFill.style.cssText = `
                height: 100%;
                background: #00ff88;
                width: 0%;
                transition: width 0.3s ease;
            `;

            this.loadingOverlay.appendChild(progressElement);
            this.loadingOverlay.style.display = 'flex';
        }

        // Update progress
        const progressFill = progressElement.querySelector('.progress-fill');
        const progressPercent = progressElement.querySelector('.progress-percent');
        const clampedProgress = Math.max(0, Math.min(100, progress));

        progressFill.style.width = `${clampedProgress}%`;
        progressPercent.textContent = `${Math.round(clampedProgress)}%`;

        return progressId;
    }

    /**
     * Hide progress indicator
     * @param {string} id - Progress ID
     */
    hideProgress(id) {
        this.hideLoading(id);
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type ('success', 'error', 'warning', 'info')
     * @param {number} duration - Duration in ms (0 = no auto-hide)
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${this.getToastColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        toast.textContent = message;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            margin-left: 15px;
            padding: 0;
            width: 20px;
            height: 20px;
            line-height: 1;
        `;
        closeBtn.onclick = () => this.removeToast(toast);
        toast.appendChild(closeBtn);

        // Add slide-in animation
        if (!document.getElementById('toast-animations-style')) {
            const style = document.createElement('style');
            style.id = 'toast-animations-style';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        this.toastContainer.appendChild(toast);
        this.toasts.push(toast);

        // Limit toast count
        if (this.toasts.length > this.maxToasts) {
            this.removeToast(this.toasts[0]);
        }

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Remove toast
     * @param {HTMLElement} toast - Toast element
     */
    removeToast(toast) {
        if (!toast || !toast.parentNode) {
            return;
        }

        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
            const index = this.toasts.indexOf(toast);
            if (index !== -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Get toast color for type
     * @param {string} type - Toast type
     * @returns {string} Color
     */
    getToastColor(type) {
        const colors = {
            success: '#00ff88',
            error: '#ff4444',
            warning: '#ffaa00',
            info: '#4488ff'
        };
        return colors[type] || colors.info;
    }

    /**
     * Show success toast
     * @param {string} message - Message
     */
    success(message) {
        return this.showToast(message, 'success');
    }

    /**
     * Show error toast
     * @param {string} message - Message
     */
    error(message) {
        return this.showToast(message, 'error', 5000);
    }

    /**
     * Show warning toast
     * @param {string} message - Message
     */
    warning(message) {
        return this.showToast(message, 'warning');
    }

    /**
     * Show info toast
     * @param {string} message - Message
     */
    info(message) {
        return this.showToast(message, 'info');
    }

    /**
     * Show loading skeleton
     * @param {HTMLElement} container - Container element
     * @param {number} count - Number of skeletons
     */
    showSkeleton(container, count = 5) {
        container.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-item';
            skeleton.style.cssText = `
                height: 60px;
                background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 4px;
                margin-bottom: 10px;
            `;

            // Add shimmer animation
            if (!document.getElementById('skeleton-animations-style')) {
                const style = document.createElement('style');
                style.id = 'skeleton-animations-style';
                style.textContent = `
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                `;
                document.head.appendChild(style);
            }

            container.appendChild(skeleton);
        }
    }

    /**
     * Hide skeleton
     * @param {HTMLElement} container - Container element
     */
    hideSkeleton(container) {
        const skeletons = container.querySelectorAll('.skeleton-item');
        skeletons.forEach(skeleton => skeleton.remove());
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.VisualFeedback = VisualFeedback;
    window.visualFeedback = new VisualFeedback();
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = VisualFeedback;
}

