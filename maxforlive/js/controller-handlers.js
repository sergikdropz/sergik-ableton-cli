/**
 * @fileoverview Controller Handlers - Main handler orchestrator
 * @module controller-handlers
 */

import { createLogger } from './utils/logger.ts';
import { getCurrentAnalysisData, setCurrentAnalysisData, getCurrentTrackIndex, getCurrentClipSlot } from './state-helpers.js';

const logger = createLogger('ControllerHandlers');

/**
 * Main handler orchestrator for SERGIK AI Controller
 * Coordinates all handler modules and provides unified interface
 */
export class ControllerHandlers {
    /**
     * Create a ControllerHandlers instance
     * @param {string} apiBaseUrl - Base URL for API calls
     */
    constructor(apiBaseUrl = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;
        this.handlers = {};
        this.initialized = false;
    }

    /**
     * Initialize all handler modules
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            logger.warn('Handlers already initialized');
            return;
        }

        try {
            // Import handler modules
            const { AnalysisHandlers } = await import('./analysis-handlers.js');
            const { WorkflowHandlers } = await import('./workflow-handlers.js');
            const { EditorHandlers } = await import('./editor-handlers.js');
            const { LibraryHandlers } = await import('./library-handlers.js');
            const { AIChatHandler } = await import('./ai-chat-handler.js');
            const { QuickActionHandlers } = await import('./quick-action-handlers.js');
            const { GenerationHandlers } = await import('./generation-handlers.js');

            // Initialize handlers
            this.handlers.analysis = new AnalysisHandlers(this.apiBaseUrl);
            this.handlers.workflow = new WorkflowHandlers(this.apiBaseUrl);
            this.handlers.editor = new EditorHandlers(this.apiBaseUrl);
            this.handlers.library = new LibraryHandlers(this.apiBaseUrl);
            this.handlers.chat = new AIChatHandler(this.apiBaseUrl);
            this.handlers.quickActions = new QuickActionHandlers(this.apiBaseUrl);
            this.handlers.generation = new GenerationHandlers(this.apiBaseUrl);

            this.initialized = true;
            logger.info('All handlers initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize handlers', error);
            throw error;
        }
    }

    /**
     * Get a handler by name
     * @param {string} name - Handler name (analysis, workflow, editor, library, chat, quickActions)
     * @returns {Object} Handler instance
     */
    getHandler(name) {
        if (!this.initialized) {
            throw new Error('Handlers not initialized. Call initialize() first.');
        }
        if (!this.handlers[name]) {
            throw new Error(`Handler '${name}' not found`);
        }
        return this.handlers[name];
    }

    /**
     * Wire up all button handlers in the DOM
     * @returns {Promise<void>}
     */
    async wireUpButtons() {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Wire analysis buttons
            this.wireAnalysisButtons();
            
            // Wire workflow buttons
            this.wireWorkflowButtons();
            
            // Wire editor buttons
            this.wireEditorButtons();
            
            // Wire library buttons
            this.wireLibraryButtons();
            
            // Wire AI chat
            this.wireAIChat();
            
            // Wire quick actions
            this.wireQuickActions();
            
            // Wire generation buttons
            this.wireGenerationButtons();

            logger.info('All buttons wired up successfully');
        } catch (error) {
            logger.error('Failed to wire up buttons', error);
            throw error;
        }
    }

    /**
     * Wire analysis buttons
     */
    wireAnalysisButtons() {
        const analysis = this.handlers.analysis;

        // Find buttons by text content or data attributes
        document.querySelectorAll('button').forEach(btn => {
            const text = btn.textContent.trim();
            
            // Analyze File button
            if (text === 'Analyze File' || btn.getAttribute('data-info-title') === 'Analyze File') {
                btn.addEventListener('click', async () => {
                    // Find file input
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput && fileInput.files.length > 0) {
                        try {
                            updateStatus('processing', 'Analyzing file...');
                            const result = await analysis.analyzeFile(fileInput.files[0]);
                            updateStatus('ready', 'Analysis complete');
                            displayAnalysisResult(result);
                        } catch (error) {
                            updateStatus('error', 'Analysis failed: ' + error.message);
                            console.error('Analysis failed:', error);
                            alert('Analysis failed: ' + error.message);
                        }
                    } else {
                        alert('Please select a file first');
                    }
                });
            }

            // Analyze URL button
            if (text === 'Analyze URL' || text === 'Analyze' || btn.getAttribute('data-info-title') === 'Analyze URL') {
                btn.addEventListener('click', async () => {
                    // Find URL input
                    const urlInput = document.querySelector('.url-input') || document.querySelector('input[placeholder*="URL"]') || document.querySelector('input[placeholder*="url"]');
                    if (urlInput && urlInput.value.trim()) {
                        try {
                            updateStatus('processing', 'Analyzing URL...');
                            const result = await analysis.analyzeURL(urlInput.value.trim());
                            updateStatus('ready', 'Analysis complete');
                            displayAnalysisResult(result);
                        } catch (error) {
                            updateStatus('error', 'Analysis failed: ' + error.message);
                            console.error('URL analysis failed:', error);
                            alert('Analysis failed: ' + error.message);
                        }
                    } else {
                        alert('Please enter a URL');
                    }
                });
            }

            // DNA Match button
            if (text === 'DNA Match' || btn.getAttribute('data-info-title') === 'DNA Match') {
                btn.addEventListener('click', async () => {
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput && fileInput.files.length > 0) {
                        try {
                            updateStatus('processing', 'Matching DNA...');
                            const result = await analysis.dnaMatch(fileInput.files[0]);
                            updateStatus('ready', 'DNA match complete');
                            displayDNAMatch(result);
                        } catch (error) {
                            updateStatus('error', 'DNA match failed: ' + error.message);
                            console.error('DNA match failed:', error);
                            alert('DNA match failed: ' + error.message);
                        }
                    } else {
                        alert('Please select a file first');
                    }
                });
            }

            // Export Analysis button
            if (text === 'Export' || btn.getAttribute('data-info-title') === 'Export') {
                btn.addEventListener('click', () => {
                    const analysisData = getCurrentAnalysisData();
                    if (analysisData) {
                        analysis.exportAnalysis(analysisData);
                    } else {
                        alert('No analysis data to export');
                    }
                });
            }
        });
    }

    /**
     * Wire workflow buttons
     */
    wireWorkflowButtons() {
        const workflow = this.handlers.workflow;

        // Auto-Organize workflow
        document.querySelectorAll('.workflow-item').forEach(item => {
            const workflowName = item.querySelector('.workflow-name')?.textContent;
            const runBtn = item.querySelector('.btn-icon-small');

            if (runBtn && workflowName === 'Auto-Organize') {
                runBtn.addEventListener('click', async () => {
                    try {
                        const options = await workflow.showOrganizeDialog();
                        if (!options) return; // User cancelled

                        updateStatus('processing', 'Organizing files...');
                        const result = await workflow.autoOrganize(options);
                        const message = options.dryRun
                            ? `Preview: ${result.files_processed} files would be organized`
                            : `Organized ${result.files_organized} files`;
                        updateStatus('ready', message);

                        if (result.errors && result.errors.length > 0) {
                            alert(`Organized ${result.files_organized} files. ${result.errors.length} errors occurred.`);
                        } else {
                            alert(message);
                        }
                    } catch (error) {
                        updateStatus('error', 'Organization failed: ' + error.message);
                        console.error('Auto-organize failed:', error);
                    }
                });
            }

            if (runBtn && workflowName === 'Batch Export') {
                runBtn.addEventListener('click', async () => {
                    try {
                        const options = await workflow.showBatchExportDialog();
                        if (!options) return;
                        updateStatus('processing', 'Exporting...');
                        const result = await workflow.batchExport(options);
                        updateStatus('ready', `Exported ${result.files_exported} files`);
                        alert(`Exported ${result.files_exported} files`);
                    } catch (error) {
                        updateStatus('error', 'Batch export failed: ' + error.message);
                        console.error('Batch export failed:', error);
                    }
                });
            }

            if (runBtn && workflowName === 'DNA Analysis') {
                runBtn.addEventListener('click', async () => {
                    try {
                        const options = await workflow.showDNAAnalysisDialog();
                        if (!options) return;
                        updateStatus('processing', 'Analyzing DNA...');
                        const result = await workflow.dnaAnalysis(options);
                        updateStatus('ready', `Analyzed ${result.files_analyzed} files`);
                        alert(`DNA analysis complete: ${result.files_analyzed} files analyzed`);
                    } catch (error) {
                        updateStatus('error', 'DNA analysis failed: ' + error.message);
                        console.error('DNA analysis failed:', error);
                    }
                });
            }
        });
    }

    /**
     * Wire editor buttons
     */
    wireEditorButtons() {
        const editor = this.handlers.editor;
        // Editor buttons will be wired in editor-handlers.js
        // This is a placeholder for future integration
    }

    /**
     * Wire library buttons
     */
    wireLibraryButtons() {
        const library = this.handlers.library;
        
        // Wire up library search
        const mediaSearch = document.getElementById('media-search');
        if (mediaSearch) {
            mediaSearch.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    const query = mediaSearch.value.trim();
                    if (query) {
                        try {
                            updateStatus('processing', 'Searching library...');
                            const results = await library.searchLibrary(query);
                            updateStatus('ready', `Found ${results.items?.length || 0} items`);
                            // Display results (would need to integrate with browser list)
                            console.log('Search results:', results);
                        } catch (error) {
                            updateStatus('error', 'Search failed: ' + error.message);
                            console.error('Library search failed:', error);
                        }
                    }
                }
            });
        }
    }

    /**
     * Wire AI chat interface
     */
    wireAIChat() {
        const chat = this.handlers.chat;
        
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const chatClear = document.getElementById('ai-clear');

        if (chatInput && chatSend) {
            const sendMessage = async () => {
                const message = chatInput.value.trim();
                if (!message) return;

                chatInput.value = '';
                await chat.sendMessage(message);
            };

            chatSend.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }

        if (chatClear) {
            chatClear.addEventListener('click', () => {
                chat.clearChat();
            });
        }
    }

    /**
     * Wire quick action buttons
     */
    wireQuickActions() {
        const quickActions = this.handlers.quickActions;

        document.querySelectorAll('.quick-action-card').forEach(card => {
            const action = card.getAttribute('data-action');
            if (action) {
                card.addEventListener('click', async () => {
                    try {
                        updateStatus('processing', 'Processing...');
                        await quickActions.handleAction(action);
                        updateStatus('ready', 'Action complete');
                    } catch (error) {
                        updateStatus('error', 'Action failed: ' + error.message);
                        console.error('Quick action failed:', error);
                    }
                });
            }
        });
    }

    /**
     * Wire generation buttons
     */
    wireGenerationButtons() {
        const generation = this.handlers.generation;
        const generateButtons = document.querySelectorAll('.btn-generate');

        generateButtons.forEach(btn => {
            // Remove existing listeners to avoid duplicates
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', async function() {
                if (this.disabled) return;
                
                const type = this.dataset.type;
                const audioEnabled = document.getElementById('toggle-audio')?.checked !== false;
                const midiEnabled = document.getElementById('toggle-midi')?.checked !== false;
                
                // Visual feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 100);
                
                // Update status
                updateStatus('processing', `Generating ${type}...`);
                
                try {
                    // Get generation parameters from UI
                    const key = document.getElementById('key-select')?.value || '10B';
                    const bars = parseInt(document.getElementById('bars-input')?.value) || 8;
                    const style = document.getElementById('style-select')?.value || 'tech_house';
                    
                    let result;
                    const outputTypes = [];
                    if (audioEnabled) outputTypes.push('audio');
                    if (midiEnabled) outputTypes.push('midi');
                    
                    // Map button types to generation methods
                    switch(type) {
                        case 'chords':
                            result = await generation.generateChords({ key, bars, voicing: 'stabs', tempo: 125 });
                            break;
                        case 'bass':
                            result = await generation.generateBass({ key, style, bars, tempo: 125 });
                            break;
                        case 'arps':
                            result = await generation.generateArpeggios({ key, pattern: 'up', bars, tempo: 125 });
                            break;
                        case 'drums':
                            result = await generation.generateDrums({ style, bars, tempo: 125 });
                            break;
                        case 'kicks':
                        case 'claps':
                        case 'hats':
                        case 'percussion':
                        case 'synths':
                        case 'vocals':
                        case 'fx':
                            result = await generation.generateElement(type, { style, bars, tempo: 125 });
                            break;
                        default:
                            throw new Error(`Unknown generation type: ${type}`);
                    }
                    
                    // Add to media list
                    if (typeof addToMediaList === 'function') {
                        addToMediaList(type, outputTypes, result);
                    }
                    
                    updateStatus('ready', 'Generation complete');
                    
                    // Switch to library tab after generation
                    setTimeout(() => {
                        const libraryTab = document.querySelector('[data-main-tab="library"]');
                        if (libraryTab) {
                            libraryTab.click();
                        }
                    }, 500);
                } catch (error) {
                    console.error('Generation error:', error);
                    updateStatus('error', 'Generation failed: ' + error.message);
                    alert('Generation failed: ' + error.message);
                }
            });
        });
    }
}

/**
 * Helper function to update status (if exists)
 */
function updateStatus(status, message) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status status-${status}`;
    }
}

/**
 * Helper function to display analysis result (if exists)
 */
function displayAnalysisResult(result) {
    // Use existing update functions
    if (typeof updateDNAView === 'function') {
        updateDNAView(result);
    }
    if (typeof updateMusicBrainzView === 'function') {
        updateMusicBrainzView(result);
    }
    
    // Display energy intelligence if available
    if (result.intelligence && window.energyIntelligenceUI) {
        window.energyIntelligenceUI.display(result.intelligence);
    }
    
    // Store for export
    if (typeof setCurrentAnalysisData === 'function') {
        setCurrentAnalysisData(result);
    } else {
        window.currentAnalysisData = result;
    }
    
    console.log('Analysis result:', result);
}

/**
 * Helper function to display DNA match (if exists)
 */
function displayDNAMatch(result) {
    // Use existing update functions
    if (typeof updateDNAView === 'function') {
        updateDNAView(result);
    }
    if (typeof updateMusicBrainzView === 'function') {
        updateMusicBrainzView(result);
    }
    
    // Show DNA match score if available
    if (result.dna_match || result.sergik_dna) {
        const matchScore = result.dna_match?.match_score || result.sergik_dna?.overall_match || 0;
        const message = `DNA Match: ${Math.round(matchScore)}%`;
        updateStatus('ready', message);
        
        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(message);
        }
    }
    
    // Store for export
    if (typeof setCurrentAnalysisData === 'function') {
        setCurrentAnalysisData(result);
    } else {
        window.currentAnalysisData = result;
    }
    
    console.log('DNA match:', result);
}

// getCurrentAnalysisData is now imported from state-helpers.js

/**
 * Initialize controller handlers
 * @param {string} apiBaseUrl - Base URL for API
 * @returns {Promise<ControllerHandlers>} Initialized handlers instance
 */
export async function initializeControllerHandlers(apiBaseUrl = 'http://localhost:8000') {
    const handlers = new ControllerHandlers(apiBaseUrl);
    await handlers.initialize();
    await handlers.wireUpButtons();
    return handlers;
}

