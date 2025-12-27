/**
 * Notification System
 * Toast notifications for user feedback
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 3000;
        this.createContainer();
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = null) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        // Limit number of notifications
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.removeNotification(oldest);
        }
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-dismiss
        const dismissDuration = duration !== null ? duration : this.defaultDuration;
        if (dismissDuration > 0) {
            setTimeout(() => {
                this.dismiss(notification);
            }, dismissDuration);
        }
        
        return notification;
    }
    
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = this.getIcon(type);
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">
                    <div class="notification-title">${typeLabel}</div>
                    <div class="notification-text">${this.escapeHtml(message)}</div>
                </div>
                <button class="notification-close" aria-label="Close">×</button>
            </div>
        `;
        
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.dismiss(notification);
        });
        
        // Click to dismiss
        notification.addEventListener('click', (e) => {
            if (e.target === notification || e.target.closest('.notification-content')) {
                this.dismiss(notification);
            }
        });
        
        return notification;
    }
    
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
    
    dismiss(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.classList.add('dismissing');
        setTimeout(() => {
            this.removeNotification(notification);
        }, 300);
    }
    
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    success(message, duration = null) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration = null) {
        return this.show(message, 'error', duration || 5000); // Errors stay longer
    }
    
    warning(message, duration = null) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration = null) {
        return this.show(message, 'info', duration);
    }
    
    clear() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
        this.notifications = [];
    }
}

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.NotificationSystem = NotificationSystem;
    // Global convenience function
    window.showNotification = function(message, type = 'info', duration = null) {
        if (!window.notificationSystem) {
            window.notificationSystem = new NotificationSystem();
        }
        return window.notificationSystem.show(message, type, duration);
    };
}

