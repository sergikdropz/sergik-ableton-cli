/**
 * Undo/Redo System
 * Tracks action history for undo/redo functionality
 */

class UndoManager {
    constructor(maxHistory = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
        this.isUndoing = false;
        this.isRedoing = false;
    }
    
    // Add action to history
    addAction(action) {
        // If we're in the middle of history (not at the end), remove future actions
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        // Add new action
        this.history.push({
            ...action,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex = this.history.length - 1;
        }
        
        this.updateStatus();
    }
    
    // Undo last action
    undo() {
        if (!this.canUndo()) return null;
        
        this.isUndoing = true;
        const action = this.history[this.currentIndex];
        
        try {
            if (action.undo && typeof action.undo === 'function') {
                action.undo();
            }
            
            this.currentIndex--;
            this.updateStatus();
            
            if (window.showNotification) {
                window.showNotification(`Undo: ${action.description || 'Action'}`, 'info', 2000);
            }
            
            return action;
        } catch (error) {
            console.error('[UndoManager] Undo failed:', error);
            if (window.errorHandler) {
                window.errorHandler.showError(error);
            }
            return null;
        } finally {
            this.isUndoing = false;
        }
    }
    
    // Redo last undone action
    redo() {
        if (!this.canRedo()) return null;
        
        this.isRedoing = true;
        this.currentIndex++;
        const action = this.history[this.currentIndex];
        
        try {
            if (action.redo && typeof action.redo === 'function') {
                action.redo();
            } else if (action.execute && typeof action.execute === 'function') {
                // If no redo, try execute
                action.execute();
            }
            
            this.updateStatus();
            
            if (window.showNotification) {
                window.showNotification(`Redo: ${action.description || 'Action'}`, 'info', 2000);
            }
            
            return action;
        } catch (error) {
            console.error('[UndoManager] Redo failed:', error);
            if (window.errorHandler) {
                window.errorHandler.showError(error);
            }
            return null;
        } finally {
            this.isRedoing = false;
        }
    }
    
    // Check if undo is possible
    canUndo() {
        return this.currentIndex >= 0 && !this.isUndoing && !this.isRedoing;
    }
    
    // Check if redo is possible
    canRedo() {
        return this.currentIndex < this.history.length - 1 && !this.isUndoing && !this.isRedoing;
    }
    
    // Clear history
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.updateStatus();
    }
    
    // Get history info
    getHistoryInfo() {
        return {
            total: this.history.length,
            current: this.currentIndex + 1,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }
    
    // Update status bar
    updateStatus() {
        // Could update a status indicator in the UI
        // For now, just log
        const info = this.getHistoryInfo();
        if (window.settingsManager && window.settingsManager.settings?.advanced?.debugMode) {
            console.log('[UndoManager]', info);
        }
    }
    
    // Create action helper
    createAction(description, execute, undo, data = {}) {
        return {
            description,
            execute: typeof execute === 'function' ? execute : null,
            undo: typeof undo === 'function' ? undo : null,
            data,
            type: 'user-action'
        };
    }
}

// Action creators for common operations
const ActionCreators = {
    // Generation action
    generation: (type, params, result) => {
        return {
            description: `Generate ${type}`,
            type: 'generation',
            data: { type, params, result },
            execute: async () => {
                // Re-execute generation
                if (window.handleGenerate) {
                    await window.handleGenerate(type);
                }
            },
            undo: async () => {
                // Remove generated content
                // This would need to track what was created and remove it
                if (window.showNotification) {
                    window.showNotification(`Removed generated ${type}`, 'info', 2000);
                }
            }
        };
    },
    
    // Track operation
    trackOperation: (operation, trackIndex, data) => {
        return {
        description: `${operation} track ${trackIndex + 1}`,
            type: 'track-operation',
            data: { operation, trackIndex, data },
            execute: async () => {
                // Re-execute operation
                // Implementation depends on operation type
            },
            undo: async () => {
                // Reverse operation
                // Implementation depends on operation type
            }
        };
    },
    
    // Parameter change
    parameterChange: (elementId, oldValue, newValue) => {
        const element = document.getElementById(elementId);
        return {
            description: `Change ${elementId}`,
            type: 'parameter-change',
            data: { elementId, oldValue, newValue },
            execute: () => {
                if (element) {
                    element.value = newValue;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            },
            undo: () => {
                if (element) {
                    element.value = oldValue;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        };
    }
};

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.UndoManager = UndoManager;
    window.ActionCreators = ActionCreators;
    window.undoManager = new UndoManager(50);
    
    // Integrate with keyboard shortcuts
    if (window.keyboardShortcuts) {
        // Override undo/redo methods in keyboard shortcuts
        const originalUndo = window.keyboardShortcuts.undo.bind(window.keyboardShortcuts);
        const originalRedo = window.keyboardShortcuts.redo.bind(window.keyboardShortcuts);
        
        window.keyboardShortcuts.undo = () => {
            if (window.undoManager && window.undoManager.canUndo()) {
                window.undoManager.undo();
            } else {
                originalUndo();
            }
        };
        
        window.keyboardShortcuts.redo = () => {
            if (window.undoManager && window.undoManager.canRedo()) {
                window.undoManager.redo();
            } else {
                originalRedo();
            }
        };
    }
}

