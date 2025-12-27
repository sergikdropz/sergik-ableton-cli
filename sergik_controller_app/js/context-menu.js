/**
 * SERGIK AI Controller - Context Menu System
 * 
 * Provides right-click context menus throughout the application
 */

class ContextMenu {
    constructor() {
        this.menu = null;
        this.currentTarget = null;
        this.currentEvent = null;
        this.menuItems = new Map(); // Store registered menu items by element type
        this.isVisible = false;
        this.init();
    }
    
    init() {
        // Create context menu element
        this.menu = document.createElement('div');
        this.menu.id = 'context-menu';
        this.menu.className = 'context-menu';
        document.body.appendChild(this.menu);
        
        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (this.isVisible && !this.menu.contains(e.target)) {
                this.hide();
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
        
        // Prevent default browser context menu on elements with data-context-menu
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('[data-context-menu]')) {
                e.preventDefault();
                this.show(e, e.target.closest('[data-context-menu]'));
            }
        });
    }
    
    /**
     * Register context menu items for an element type
     * @param {string} elementType - Type identifier (e.g., 'media-item', 'generated-file', 'canvas')
     * @param {Array} items - Array of menu item objects
     */
    registerMenuItems(elementType, items) {
        this.menuItems.set(elementType, items);
    }
    
    /**
     * Show context menu at mouse position
     */
    show(event, target) {
        if (!target) return;
        
        const elementType = target.getAttribute('data-context-menu');
        if (!elementType) return;
        
        const items = this.menuItems.get(elementType);
        if (!items || items.length === 0) return;
        
        this.currentTarget = target;
        this.currentEvent = event; // Store event for use in actions
        this.renderMenu(items, target);
        this.positionMenu(event.clientX, event.clientY);
        this.menu.classList.add('visible');
        this.isVisible = true;
    }
    
    /**
     * Hide context menu
     */
    hide() {
        if (this.menu) {
            this.menu.classList.remove('visible');
            this.isVisible = false;
            this.currentTarget = null;
            this.currentEvent = null;
        }
    }
    
    /**
     * Render menu items
     */
    renderMenu(items, target) {
        this.menu.innerHTML = '';
        
        items.forEach((item, index) => {
            if (item === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                this.menu.appendChild(separator);
                return;
            }
            
            // Check if item should be visible
            if (item.visible && typeof item.visible === 'function' && !item.visible(target)) {
                return;
            }
            
            // Check if item should be enabled
            const isEnabled = item.enabled === undefined || (typeof item.enabled === 'function' ? item.enabled(target) : item.enabled);
            
            const menuItem = document.createElement('div');
            menuItem.className = `context-menu-item ${!isEnabled ? 'disabled' : ''} ${item.danger ? 'danger' : ''}`;
            
            if (item.icon) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'context-menu-icon';
                iconSpan.textContent = item.icon;
                menuItem.appendChild(iconSpan);
            }
            
            const label = document.createElement('span');
            label.className = 'context-menu-label';
            label.textContent = item.label;
            menuItem.appendChild(label);
            
            if (item.shortcut) {
                const shortcut = document.createElement('span');
                shortcut.className = 'context-menu-shortcut';
                shortcut.textContent = item.shortcut;
                menuItem.appendChild(shortcut);
            }
            
            if (item.submenu) {
                const arrow = document.createElement('span');
                arrow.className = 'context-menu-arrow';
                arrow.textContent = '▶';
                menuItem.appendChild(arrow);
                
                // Handle submenu (simplified - can be expanded)
                menuItem.addEventListener('mouseenter', () => {
                    // Show submenu (future enhancement)
                });
            }
            
            if (isEnabled) {
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (item.action && typeof item.action === 'function') {
                        item.action(target, this.currentEvent);
                    }
                    this.hide();
                });
            }
            
            this.menu.appendChild(menuItem);
        });
    }
    
    /**
     * Position menu at mouse coordinates
     */
    positionMenu(x, y) {
        const menuRect = this.menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Adjust position if menu would go off-screen
        let posX = x;
        let posY = y;
        
        if (x + menuRect.width > windowWidth) {
            posX = windowWidth - menuRect.width - 10;
        }
        
        if (y + menuRect.height > windowHeight) {
            posY = windowHeight - menuRect.height - 10;
        }
        
        // Ensure menu stays on screen
        posX = Math.max(10, posX);
        posY = Math.max(10, posY);
        
        this.menu.style.left = `${posX}px`;
        this.menu.style.top = `${posY}px`;
    }
    
    /**
     * Get current target element
     */
    getCurrentTarget() {
        return this.currentTarget;
    }
}

// Create global instance
window.contextMenu = new ContextMenu();

