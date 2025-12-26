/**
 * @fileoverview Keyboard Shortcuts - Handles keyboard shortcuts for editor fields
 * @module keyboard-shortcuts
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('KeyboardShortcuts');

/**
 * KeyboardShortcuts class manages keyboard shortcuts
 */
export class KeyboardShortcuts {
    /**
     * Create a KeyboardShortcuts instance
     * @param {Object} elements - DOM element references
     * @param {Object} callbacks - Callback functions
     */
    constructor(elements = {}, callbacks = {}) {
        this.elements = elements;
        this.callbacks = callbacks;
        this.shortcuts = new Map();
        this.setupShortcuts();
        this.setupEventListeners();
    }
    
    /**
     * Setup keyboard shortcuts
     * @private
     */
    setupShortcuts() {
        // Field focus shortcuts
        this.shortcuts.set('g', () => this.focusField('genre-select'));
        this.shortcuts.set('t', () => this.focusField('tempo-select'));
        this.shortcuts.set('e', () => this.focusField('energy-select'));
        this.shortcuts.set('i', () => this.focusField('intelligence-select'));
        this.shortcuts.set('k', () => this.focusField('key-select'));
        this.shortcuts.set('s', () => this.focusField('scale-select'));
        this.shortcuts.set('r', () => this.focusField('track-select'));
        this.shortcuts.set('l', () => this.focusField('slot-select'));
        this.shortcuts.set('d', () => this.focusField('idea-input'));
        
        // Action shortcuts
        if (this.callbacks.undo) {
            this.shortcuts.set('Ctrl+Z', () => this.callbacks.undo());
            this.shortcuts.set('Meta+Z', () => this.callbacks.undo()); // Mac
        }
        
        if (this.callbacks.redo) {
            this.shortcuts.set('Ctrl+Y', () => this.callbacks.redo());
            this.shortcuts.set('Meta+Y', () => this.callbacks.redo()); // Mac
            this.shortcuts.set('Ctrl+Shift+Z', () => this.callbacks.redo()); // Alternative
        }
        
        if (this.callbacks.apply) {
            this.shortcuts.set('Ctrl+Enter', () => this.callbacks.apply());
            this.shortcuts.set('Meta+Enter', () => this.callbacks.apply()); // Mac
        }
        
        if (this.callbacks.cancel) {
            this.shortcuts.set('Escape', () => this.callbacks.cancel());
        }
    }
    
    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
    }
    
    /**
     * Handle keydown event
     * @param {KeyboardEvent} event - Keyboard event
     * @private
     */
    handleKeyDown(event) {
        // Don't trigger shortcuts when typing in inputs
        if (this.isInputFocused()) {
            // Only allow Escape and Ctrl+Enter in inputs
            if (event.key === 'Escape' && this.callbacks.cancel) {
                event.preventDefault();
                this.callbacks.cancel();
                return;
            }
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && this.callbacks.apply) {
                event.preventDefault();
                this.callbacks.apply();
                return;
            }
            return;
        }
        
        // Build shortcut key
        const parts = [];
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.metaKey) parts.push('Meta');
        if (event.shiftKey) parts.push('Shift');
        if (event.altKey) parts.push('Alt');
        
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        parts.push(key);
        
        const shortcutKey = parts.join('+');
        
        // Check for exact match first
        if (this.shortcuts.has(shortcutKey)) {
            event.preventDefault();
            this.shortcuts.get(shortcutKey)();
            logger.debug(`Shortcut triggered: ${shortcutKey}`);
            return;
        }
        
        // Check for single key shortcuts (only if no modifiers)
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
            if (this.shortcuts.has(key)) {
                event.preventDefault();
                this.shortcuts.get(key)();
                logger.debug(`Shortcut triggered: ${key}`);
                return;
            }
        }
    }
    
    /**
     * Check if an input field is focused
     * @returns {boolean} True if input is focused
     * @private
     */
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );
    }
    
    /**
     * Focus a field by ID
     * @param {string} fieldId - Field ID
     * @private
     */
    focusField(fieldId) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.focus();
            if (element.tagName === 'SELECT') {
                // For select elements, try to open dropdown
                element.click();
            }
            logger.debug(`Focused field: ${fieldId}`);
        } else {
            logger.warn(`Field not found: ${fieldId}`);
        }
    }
    
    /**
     * Register a custom shortcut
     * @param {string} key - Shortcut key (e.g., 'Ctrl+S', 'g')
     * @param {Function} callback - Callback function
     */
    registerShortcut(key, callback) {
        this.shortcuts.set(key, callback);
        logger.debug(`Registered shortcut: ${key}`);
    }
    
    /**
     * Unregister a shortcut
     * @param {string} key - Shortcut key
     */
    unregisterShortcut(key) {
        this.shortcuts.delete(key);
        logger.debug(`Unregistered shortcut: ${key}`);
    }
}

/**
 * Initialize keyboard shortcuts
 * @param {Object} callbacks - Callback functions for actions
 * @returns {KeyboardShortcuts} Shortcuts instance
 */
export function initializeKeyboardShortcuts(callbacks = {}) {
    return new KeyboardShortcuts({}, callbacks);
}

