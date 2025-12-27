/**
 * Help System
 * Provides help panel and keyboard shortcuts reference
 */

class HelpSystem {
    constructor() {
        this.setupHelpPanel();
    }
    
    setupHelpPanel() {
        // Create help panel HTML if it doesn't exist
        if (!document.getElementById('help-panel')) {
            const helpPanel = document.createElement('div');
            helpPanel.id = 'help-panel';
            helpPanel.className = 'help-panel';
            helpPanel.innerHTML = this.getHelpHTML();
            document.body.appendChild(helpPanel);
        }
        
        // Setup event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (!this.isInputFocused()) {
                    e.preventDefault();
                    this.toggle();
                }
            }
            if (e.key === 'Escape' && document.getElementById('help-panel')?.classList.contains('show')) {
                this.hide();
            }
        });
    }
    
    getHelpHTML() {
        return `
            <div class="help-panel-content">
                <div class="help-header">
                    <h2>Help & Keyboard Shortcuts</h2>
                    <button class="help-close" id="help-close" aria-label="Close help">×</button>
                </div>
                <div class="help-body">
                    <div class="help-tabs">
                        <button class="help-tab-btn active" data-tab="shortcuts">Shortcuts</button>
                        <button class="help-tab-btn" data-tab="features">Features</button>
                        <button class="help-tab-btn" data-tab="faq">FAQ</button>
                    </div>
                    <div class="help-content">
                        <div class="help-section active" id="help-shortcuts">
                            ${this.getShortcutsHTML()}
                        </div>
                        <div class="help-section" id="help-features">
                            ${this.getFeaturesHTML()}
                        </div>
                        <div class="help-section" id="help-faq">
                            ${this.getFAQHTML()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getShortcutsHTML() {
        if (!window.keyboardShortcuts) {
            return '<p>Keyboard shortcuts not available</p>';
        }
        
        const shortcuts = window.keyboardShortcuts.getShortcuts();
        const grouped = this.groupShortcuts(shortcuts);
        
        let html = '';
        for (const [category, items] of Object.entries(grouped)) {
            html += `<div class="help-shortcut-group">
                <h3>${category}</h3>
                <div class="help-shortcut-list">`;
            items.forEach(({ key, description }) => {
                if (description) {
                    html += `<div class="help-shortcut-item">
                        <kbd>${key}</kbd>
                        <span>${description}</span>
                    </div>`;
                }
            });
            html += `</div></div>`;
        }
        
        return html;
    }
    
    groupShortcuts(shortcuts) {
        const groups = {
            'Navigation': [],
            'Transport': [],
            'Generation': [],
            'Focus': [],
            'Actions': [],
            'Library': [],
            'Other': []
        };
        
        shortcuts.forEach(({ key, description }) => {
            if (!description) return;
            
            if (description.includes('tab') || description.includes('Tab')) {
                groups['Navigation'].push({ key, description });
            } else if (description.includes('Play') || description.includes('Record') || description.includes('Stop')) {
                groups['Transport'].push({ key, description });
            } else if (description.includes('Generate') || description.includes('generation')) {
                groups['Generation'].push({ key, description });
            } else if (description.includes('Focus')) {
                groups['Focus'].push({ key, description });
            } else if (description.includes('search') || description.includes('Library')) {
                groups['Library'].push({ key, description });
            } else if (description.includes('Undo') || description.includes('Redo') || description.includes('Save') || description.includes('Duplicate')) {
                groups['Actions'].push({ key, description });
            } else {
                groups['Other'].push({ key, description });
            }
        });
        
        // Remove empty groups
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) {
                delete groups[key];
            }
        });
        
        return groups;
    }
    
    getFeaturesHTML() {
        return `
            <div class="help-feature-list">
                <div class="help-feature-item">
                    <h3>Create Tab</h3>
                    <p>Generate audio and MIDI content using AI. Select genre, tempo, energy, and other parameters, then click generation buttons or use keyboard shortcuts.</p>
                </div>
                <div class="help-feature-item">
                    <h3>Analyze Tab</h3>
                    <p>Analyze audio files for DNA matching, features, and metadata. Upload files or paste URLs to analyze.</p>
                </div>
                <div class="help-feature-item">
                    <h3>Library Tab</h3>
                    <p>Browse and edit your media library. Search with syntax like "BPM:120, key:C, name:kick". Use editors to preview and edit clips.</p>
                </div>
                <div class="help-feature-item">
                    <h3>AI Tab</h3>
                    <p>Chat with AI assistant for music production help. Use quick actions for common tasks.</p>
                </div>
            </div>
        `;
    }
    
    getFAQHTML() {
        return `
            <div class="help-faq-list">
                <div class="help-faq-item">
                    <h3>How do I connect to the API?</h3>
                    <p>Open Settings (Ctrl+,) and configure the API URL. Click "Test Connection" to verify.</p>
                </div>
                <div class="help-faq-item">
                    <h3>How do I generate content?</h3>
                    <p>Select parameters in the Create tab, then click generation buttons or use shortcuts (G+K for kicks, G+C for claps, etc.).</p>
                </div>
                <div class="help-faq-item">
                    <h3>How do I search the library?</h3>
                    <p>Use syntax like "BPM:120" for tempo, "key:C" for key, "name:kick" for name. Combine with commas: "BPM:120, key:C".</p>
                </div>
                <div class="help-faq-item">
                    <h3>Can I customize keyboard shortcuts?</h3>
                    <p>Yes! Open Settings (Ctrl+,) and go to the Keyboard section to view all shortcuts.</p>
                </div>
            </div>
        `;
    }
    
    show() {
        const panel = document.getElementById('help-panel');
        if (panel) {
            // Refresh shortcuts if available
            if (window.keyboardShortcuts) {
                const shortcutsSection = panel.querySelector('#help-shortcuts');
                if (shortcutsSection) {
                    shortcutsSection.innerHTML = this.getShortcutsHTML();
                }
            }
            
            panel.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Setup tab switching
            panel.querySelectorAll('.help-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.getAttribute('data-tab');
                    this.switchTab(tab);
                });
            });
            
            // Close button
            const closeBtn = panel.querySelector('#help-close');
            if (closeBtn) {
                closeBtn.onclick = () => this.hide();
            }
        }
    }
    
    hide() {
        const panel = document.getElementById('help-panel');
        if (panel) {
            panel.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    toggle() {
        const panel = document.getElementById('help-panel');
        if (panel && panel.classList.contains('show')) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.help-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        
        // Update sections
        document.querySelectorAll('.help-section').forEach(section => {
            section.classList.toggle('active', section.id === `help-${tabName}`);
        });
    }
    
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );
    }
}

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.HelpSystem = HelpSystem;
    window.helpSystem = new HelpSystem();
    window.showHelpPanel = function() {
        if (window.helpSystem) {
            window.helpSystem.show();
        }
    };
}

