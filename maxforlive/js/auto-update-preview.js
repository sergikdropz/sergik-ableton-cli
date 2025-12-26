/**
 * @fileoverview Auto-Update Preview - Shows preview of changes before applying auto-updates
 * @module auto-update-preview
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('AutoUpdatePreview');

/**
 * AutoUpdatePreview class shows preview of changes before applying
 */
export class AutoUpdatePreview {
    /**
     * Create an AutoUpdatePreview instance
     */
    constructor() {
        this.previewOverlay = null;
        this.previewData = null;
        this.applyCallback = null;
        this.cancelCallback = null;
        this.autoApplyTimeout = null;
        this.createPreviewOverlay();
    }
    
    /**
     * Create preview overlay element
     * @private
     */
    createPreviewOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'auto-update-preview-overlay';
        overlay.className = 'auto-update-preview-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Space Grotesk', sans-serif;
        `;
        
        const previewBox = document.createElement('div');
        previewBox.className = 'auto-update-preview-box';
        previewBox.style.cssText = `
            background: #2a2a2a;
            border: 2px solid #00d4aa;
            border-radius: 8px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
            color: #ffffff;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Auto-Update Preview';
        title.style.cssText = 'margin: 0 0 15px 0; color: #00d4aa; font-size: 1.2rem;';
        
        const changesList = document.createElement('div');
        changesList.id = 'preview-changes-list';
        changesList.style.cssText = 'margin-bottom: 20px;';
        
        const buttons = document.createElement('div');
        buttons.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'preview-cancel-btn';
        cancelBtn.style.cssText = `
            padding: 8px 16px;
            background: #4a4a4a;
            border: 1px solid #6a6a6a;
            border-radius: 4px;
            color: #ffffff;
            cursor: pointer;
            font-size: 0.9rem;
        `;
        cancelBtn.addEventListener('click', () => this.cancel());
        
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply';
        applyBtn.className = 'preview-apply-btn';
        applyBtn.style.cssText = `
            padding: 8px 16px;
            background: #00d4aa;
            border: 1px solid #00d4aa;
            border-radius: 4px;
            color: #1a1a1a;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
        `;
        applyBtn.addEventListener('click', () => this.apply());
        
        buttons.appendChild(cancelBtn);
        buttons.appendChild(applyBtn);
        
        previewBox.appendChild(title);
        previewBox.appendChild(changesList);
        previewBox.appendChild(buttons);
        overlay.appendChild(previewBox);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.cancel();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.previewOverlay && this.previewOverlay.style.display !== 'none') {
                this.cancel();
            }
        });
        
        document.body.appendChild(overlay);
        this.previewOverlay = overlay;
    }
    
    /**
     * Show preview of changes
     * @param {Object} changes - Changes object with before/after values
     * @param {Function} applyCallback - Callback when user applies changes
     * @param {Function} cancelCallback - Callback when user cancels
     * @param {number} autoApplyDelay - Auto-apply delay in ms (0 to disable)
     */
    showPreview(changes, applyCallback, cancelCallback = null, autoApplyDelay = 2000) {
        this.previewData = changes;
        this.applyCallback = applyCallback;
        this.cancelCallback = cancelCallback;
        
        const changesList = this.previewOverlay.querySelector('#preview-changes-list');
        changesList.innerHTML = '';
        
        // Create change items
        Object.entries(changes).forEach(([field, data]) => {
            if (!data || data.before === data.after) return;
            
            const item = document.createElement('div');
            item.style.cssText = 'margin-bottom: 10px; padding: 8px; background: #1a1a1a; border-radius: 4px;';
            
            const fieldName = document.createElement('strong');
            fieldName.textContent = field.charAt(0).toUpperCase() + field.slice(1) + ': ';
            fieldName.style.color = '#00d4aa';
            
            const changeText = document.createElement('span');
            changeText.textContent = `${data.before} → ${data.after}`;
            changeText.style.color = '#ffffff';
            
            item.appendChild(fieldName);
            item.appendChild(changeText);
            changesList.appendChild(item);
        });
        
        // Show overlay
        this.previewOverlay.style.display = 'flex';
        
        // Auto-apply after delay if specified
        if (autoApplyDelay > 0) {
            this.autoApplyTimeout = setTimeout(() => {
                this.apply();
            }, autoApplyDelay);
        }
        
        logger.debug('Preview shown', changes);
    }
    
    /**
     * Apply changes
     */
    apply() {
        if (this.autoApplyTimeout) {
            clearTimeout(this.autoApplyTimeout);
            this.autoApplyTimeout = null;
        }
        
        this.hidePreview();
        
        if (this.applyCallback) {
            this.applyCallback(this.previewData);
        }
        
        logger.debug('Preview applied');
    }
    
    /**
     * Cancel preview
     */
    cancel() {
        if (this.autoApplyTimeout) {
            clearTimeout(this.autoApplyTimeout);
            this.autoApplyTimeout = null;
        }
        
        this.hidePreview();
        
        if (this.cancelCallback) {
            this.cancelCallback(this.previewData);
        }
        
        logger.debug('Preview cancelled');
    }
    
    /**
     * Hide preview overlay
     * @private
     */
    hidePreview() {
        if (this.previewOverlay) {
            this.previewOverlay.style.display = 'none';
        }
        this.previewData = null;
        this.applyCallback = null;
        this.cancelCallback = null;
    }
}

/**
 * Initialize auto-update preview
 * @returns {AutoUpdatePreview} Preview instance
 */
export function initializeAutoUpdatePreview() {
    return new AutoUpdatePreview();
}

