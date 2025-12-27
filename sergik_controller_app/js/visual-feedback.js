/**
 * Visual Feedback Utility
 * Provides consistent visual feedback for all interactive elements across the app
 */

class VisualFeedback {
    constructor() {
        this.activeFeedback = new Map(); // Track active feedback to prevent conflicts
    }

    /**
     * Add visual feedback to a button
     * @param {HTMLElement} button - Button element
     * @param {string} text - Feedback text (optional)
     * @param {string} type - Feedback type: 'loading', 'success', 'error', 'click'
     * @param {number} duration - Duration in ms (default: auto)
     */
    addButtonFeedback(button, text = null, type = 'click', duration = null) {
        if (!button) return;

        // Store original state
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
        if (!button.dataset.originalBg) {
            button.dataset.originalBg = button.style.background || getComputedStyle(button).backgroundColor;
        }
        if (!button.dataset.originalColor) {
            button.dataset.originalColor = button.style.color || getComputedStyle(button).color;
        }

        // Add click animation
        button.style.transition = 'all 0.15s ease';
        button.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            button.style.transform = '';
        }, 150);

        if (type === 'click') {
            // Simple click feedback - no text change
            return;
        }

        // Add feedback classes
        button.classList.add('btn-feedback');
        button.classList.add(`btn-feedback-${type}`);

        if (type === 'loading') {
            button.style.opacity = '0.7';
            button.style.cursor = 'wait';
            button.disabled = true;

            // Add spinner
            if (!button.querySelector('.btn-spinner')) {
                const spinner = document.createElement('span');
                spinner.className = 'btn-spinner';
                spinner.innerHTML = '⏳';
                spinner.style.marginRight = '6px';
                button.insertBefore(spinner, button.firstChild);
            }

            if (text) {
                this._updateButtonText(button, text);
            }
        } else if (type === 'success') {
            button.style.opacity = '1';
            button.style.cursor = 'default';
            button.style.background = '#28a745';
            button.style.color = 'white';
            button.disabled = false;

            // Remove spinner
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

            if (text) {
                this._updateButtonText(button, text);
            }

            // Auto-remove after duration
            const removeDuration = duration || 1500;
            setTimeout(() => {
                this.removeButtonFeedback(button);
            }, removeDuration);
        } else if (type === 'error') {
            button.style.opacity = '1';
            button.style.cursor = 'default';
            button.style.background = '#dc3545';
            button.style.color = 'white';
            button.disabled = false;

            // Remove spinner
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

            if (text) {
                this._updateButtonText(button, text);
            }

            // Auto-remove after duration
            const removeDuration = duration || 2000;
            setTimeout(() => {
                this.removeButtonFeedback(button);
            }, removeDuration);
        }
    }

    /**
     * Remove visual feedback from a button
     * @param {HTMLElement} button - Button element
     */
    removeButtonFeedback(button) {
        if (!button) return;

        // Remove feedback classes
        button.classList.remove('btn-feedback', 'btn-feedback-loading', 'btn-feedback-success', 'btn-feedback-error');

        // Reset styles
        button.style.opacity = '';
        button.style.cursor = '';
        button.style.background = button.dataset.originalBg || '';
        button.style.color = button.dataset.originalColor || '';
        button.style.transform = '';
        button.disabled = false;

        // Remove icons
        const spinner = button.querySelector('.btn-spinner');
        if (spinner) spinner.remove();
        const successIcon = button.querySelector('.btn-success-icon');
        if (successIcon) successIcon.remove();
        const errorIcon = button.querySelector('.btn-error-icon');
        if (errorIcon) errorIcon.remove();

        // Restore original text
        if (button.dataset.originalText) {
            this._updateButtonText(button, button.dataset.originalText);
        }
    }

    /**
     * Update button text while preserving icons
     * @private
     */
    _updateButtonText(button, text) {
        // Remove existing text nodes
        const textNodes = Array.from(button.childNodes).filter(node => 
            node.nodeType === Node.TEXT_NODE
        );
        textNodes.forEach(node => node.remove());

        // Find last element or append text
        const elements = Array.from(button.childNodes).filter(node => 
            node.nodeType === Node.ELEMENT_NODE
        );
        
        if (elements.length > 0) {
            // Append text after last element
            button.appendChild(document.createTextNode(text));
        } else {
            button.textContent = text;
        }
    }

    /**
     * Add visual feedback to a checkbox/toggle
     * @param {HTMLElement} checkbox - Checkbox input element
     * @param {boolean} checked - Whether checkbox is checked
     */
    addCheckboxFeedback(checkbox, checked) {
        if (!checkbox) return;

        const label = checkbox.closest('label');
        if (!label) return;

        label.style.transition = 'all 0.2s ease';
        label.style.transform = 'scale(1.05)';

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

    /**
     * Add visual feedback to an input field
     * @param {HTMLElement} input - Input element
     * @param {string} type - Feedback type: 'focus', 'success', 'error', 'typing'
     */
    addInputFeedback(input, type = 'focus') {
        if (!input) return;

        input.style.transition = 'all 0.2s ease';

        if (type === 'focus') {
            input.style.borderColor = '#007acc';
            input.style.boxShadow = '0 0 0 2px rgba(0, 122, 204, 0.2)';
        } else if (type === 'success') {
            input.style.borderColor = '#28a745';
            input.style.boxShadow = '0 0 0 2px rgba(40, 167, 69, 0.2)';
            setTimeout(() => {
                this.removeInputFeedback(input);
            }, 2000);
        } else if (type === 'error') {
            input.style.borderColor = '#dc3545';
            input.style.boxShadow = '0 0 0 2px rgba(220, 53, 69, 0.2)';
            setTimeout(() => {
                this.removeInputFeedback(input);
            }, 2000);
        } else if (type === 'typing') {
            input.style.background = '#1e1e1e';
            input.style.borderColor = '#007acc';
        }
    }

    /**
     * Remove visual feedback from an input field
     * @param {HTMLElement} input - Input element
     */
    removeInputFeedback(input) {
        if (!input) return;
        input.style.borderColor = '';
        input.style.boxShadow = '';
        input.style.background = '';
    }

    /**
     * Add visual feedback to a tab button
     * @param {HTMLElement} tab - Tab button element
     * @param {boolean} isActive - Whether tab is active
     */
    addTabFeedback(tab, isActive = false) {
        if (!tab) return;

        tab.style.transition = 'all 0.2s ease';
        tab.style.transform = 'scale(0.95)';

        setTimeout(() => {
            tab.style.transform = '';
            if (isActive) {
                tab.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    tab.style.transform = '';
                }, 200);
            }
        }, 150);
    }

    /**
     * Add visual feedback to a select dropdown
     * @param {HTMLElement} select - Select element
     */
    addSelectFeedback(select) {
        if (!select) return;

        select.style.transition = 'all 0.2s ease';
        select.style.borderColor = '#007acc';
        select.style.boxShadow = '0 0 0 2px rgba(0, 122, 204, 0.2)';

        setTimeout(() => {
            select.style.borderColor = '';
            select.style.boxShadow = '';
        }, 300);
    }

    /**
     * Add pulse animation to an element
     * @param {HTMLElement} element - Element to pulse
     * @param {string} color - Pulse color (optional)
     * @param {number} duration - Duration in ms
     */
    addPulse(element, color = null, duration = 500) {
        if (!element) return;

        const originalBg = element.style.background || getComputedStyle(element).backgroundColor;
        element.style.transition = 'background-color 0.3s ease';

        if (color) {
            element.style.background = color;
        } else {
            // Default pulse based on element type
            element.style.background = 'rgba(0, 122, 204, 0.2)';
        }

        setTimeout(() => {
            element.style.background = originalBg;
        }, duration);
    }

    /**
     * Add flash animation to an element
     * @param {HTMLElement} element - Element to flash
     * @param {string} level - Flash level: 'error', 'warn', 'info', 'success', 'debug'
     */
    addFlash(element, level = 'info') {
        if (!element) return;

        const flashColors = {
            error: 'rgba(220, 53, 69, 0.2)',
            warn: 'rgba(255, 193, 7, 0.2)',
            info: 'rgba(0, 122, 204, 0.1)',
            success: 'rgba(40, 167, 69, 0.1)',
            debug: 'rgba(108, 117, 125, 0.1)'
        };

        const originalBg = element.style.background || getComputedStyle(element).backgroundColor;
        element.style.transition = 'background-color 0.3s ease';

        if (flashColors[level]) {
            element.style.background = flashColors[level];
            setTimeout(() => {
                element.style.background = originalBg;
            }, 300);
        }
    }

    /**
     * Add ripple effect to an element (like Material Design)
     * @param {HTMLElement} element - Element to add ripple to
     * @param {Event} event - Click event
     */
    addRipple(element, event) {
        if (!element || !event) return;

        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.3)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s ease-out';
        ripple.style.pointerEvents = 'none';

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

// Create global instance
window.visualFeedback = new VisualFeedback();

// Add CSS animation for ripple effect if not already present
if (!document.getElementById('ripple-animation-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-animation-style';
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        .btn-feedback {
            transition: all 0.2s ease !important;
        }
    `;
    document.head.appendChild(style);
}

