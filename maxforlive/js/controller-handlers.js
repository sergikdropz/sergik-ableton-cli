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
            
            // Wire transport buttons
            this.wireTransportButtons();
            
            // Wire track control buttons
            this.wireTrackButtons();

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
        
        // Wire editor toolbar buttons
        const toolbarBtns = document.querySelectorAll('.toolbar-btn');
        toolbarBtns.forEach(btn => {
            const tool = btn.getAttribute('data-tool');
            if (!tool) return;
            
            // Prevent duplicate listeners
            if (btn.dataset.wired) return;
            
            btn.addEventListener('click', async () => {
                try {
                    // Update active button state
                    toolbarBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    switch(tool) {
                        case 'select':
                            // UI state only - no API call needed
                            logger.debug('Select tool activated');
                            break;
                            
                        case 'cut':
                            // Split clip at cursor/selection
                            try {
                                await editor.split();
                                updateStatus('ready', 'Clip cut');
                            } catch (error) {
                                logger.error('Cut failed', error);
                                updateStatus('error', 'Cut failed: ' + error.message);
                            }
                            break;
                            
                        case 'fade':
                            // Apply fade - check if we have selection context
                            // For now, apply fade in (could be enhanced to detect selection)
                            try {
                                await editor.fadeIn(0.1);
                                updateStatus('ready', 'Fade applied');
                            } catch (error) {
                                logger.error('Fade failed', error);
                                updateStatus('error', 'Fade failed: ' + error.message);
                            }
                            break;
                            
                        case 'waveform':
                        case 'piano':
                        case 'timeline':
                            // Switch editor view (UI only)
                            // These are handled by existing editor view switching code
                            logger.debug(`Switching to ${tool} editor`);
                            // Trigger existing editor view switch if available
                            if (typeof window.switchEditorView === 'function') {
                                window.switchEditorView(tool);
                            }
                            break;
                            
                        default:
                            logger.warn(`Unknown tool: ${tool}`);
                    }
                } catch (error) {
                    logger.error('Editor button action failed', error);
                    updateStatus('error', 'Action failed: ' + error.message);
                }
            });
            
            btn.dataset.wired = 'true';
        });
        
        // Wire zoom buttons
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        
        if (zoomIn && !zoomIn.dataset.wired) {
            zoomIn.addEventListener('click', () => {
                editor.zoomIn();
                logger.debug('Zoom in');
            });
            zoomIn.dataset.wired = 'true';
        }
        
        if (zoomOut && !zoomOut.dataset.wired) {
            zoomOut.addEventListener('click', () => {
                editor.zoomOut();
                logger.debug('Zoom out');
            });
            zoomOut.dataset.wired = 'true';
        }
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
    
    /**
     * Wire transport buttons
     */
    wireTransportButtons() {
        const transportBtns = document.querySelectorAll('.transport-btn');
        
        transportBtns.forEach(btn => {
            // Prevent duplicate listeners
            if (btn.dataset.wired) return;
            
            btn.addEventListener('click', async () => {
                const action = this._getTransportAction(btn);
                if (!action) {
                    logger.warn('Could not determine transport action for button');
                    return;
                }
                
                try {
                    updateStatus('processing', `${action}...`);
                    
                    // Handle special cases for rewind/forward (not in standard transport API)
                    if (action === 'rewind' || action === 'forward') {
                        // Use set locator or natural language command for these
                        const response = await fetch(`${this.apiBaseUrl}/api/live/command`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                prompt: action === 'rewind' ? 'rewind transport' : 'fast forward transport'
                            })
                        });
                        
                        if (!response.ok) {
                            const error = await response.json().catch(() => ({ detail: response.statusText }));
                            throw new Error(error.detail || `Transport ${action} failed`);
                        }
                        
                        const result = await response.json();
                        logger.info(`Transport ${action}`, result);
                        updateStatus('ready', `${action} executed`);
                    } else {
                        // Standard transport actions: play, stop, record, continue
                        const response = await fetch(`${this.apiBaseUrl}/api/live/transport/${action}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                        if (!response.ok) {
                            const error = await response.json().catch(() => ({ detail: response.statusText }));
                            throw new Error(error.detail || `Transport ${action} failed`);
                        }
                        
                        const result = await response.json();
                        logger.info(`Transport ${action}`, result);
                        updateStatus('ready', `${action} executed`);
                    }
                } catch (error) {
                    logger.error(`Transport ${action} failed`, error);
                    updateStatus('error', `Transport ${action} failed: ${error.message}`);
                }
            });
            
            btn.dataset.wired = 'true';
        });
    }
    
    /**
     * Wire track control buttons
     */
    wireTrackButtons() {
        const editor = this.handlers.editor;
        
        // Create Track button
        const createBtn = document.querySelector('button[data-info-title="Create Track"]') || 
                         document.getElementById('btn-create-track');
        if (createBtn && !createBtn.dataset.wired) {
            createBtn.addEventListener('click', async () => {
                try {
                    updateStatus('processing', 'Creating track...');
                    
                    const response = await fetch(`${this.apiBaseUrl}/api/live/tracks/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            track_type: 'midi', // Default to MIDI, could be made configurable
                            name: null // Could prompt user for name
                        })
                    });
                    
                    if (!response.ok) {
                        const error = await response.json().catch(() => ({ detail: response.statusText }));
                        throw new Error(error.detail || 'Create track failed');
                    }
                    
                    const result = await response.json();
                    logger.info('Track created', result);
                    updateStatus('ready', 'Track created');
                } catch (error) {
                    logger.error('Create track failed', error);
                    updateStatus('error', 'Create track failed: ' + error.message);
                    alert('Failed to create track: ' + error.message);
                }
            });
            createBtn.dataset.wired = 'true';
        }
        
        // Delete Track button
        const deleteBtn = document.querySelector('button[data-info-title="Delete Track"]') || 
                         document.getElementById('btn-delete-track');
        if (deleteBtn && !deleteBtn.dataset.wired) {
            deleteBtn.addEventListener('click', async () => {
                const trackIndex = this._getTrackIndex();
                
                if (trackIndex === null || trackIndex === undefined) {
                    alert('Please select a track to delete');
                    return;
                }
                
                if (!confirm(`Delete track ${trackIndex + 1}?`)) {
                    return;
                }
                
                try {
                    updateStatus('processing', 'Deleting track...');
                    
                    const response = await fetch(`${this.apiBaseUrl}/api/live/tracks/${trackIndex}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (!response.ok) {
                        const error = await response.json().catch(() => ({ detail: response.statusText }));
                        throw new Error(error.detail || 'Delete track failed');
                    }
                    
                    const result = await response.json();
                    logger.info('Track deleted', result);
                    updateStatus('ready', 'Track deleted');
                } catch (error) {
                    logger.error('Delete track failed', error);
                    updateStatus('error', 'Delete track failed: ' + error.message);
                    alert('Failed to delete track: ' + error.message);
                }
            });
            deleteBtn.dataset.wired = 'true';
        }
        
        // Arm Track button
        const armBtn = document.querySelector('button[data-info-title="Arm Track"]') || 
                      document.getElementById('btn-arm-track');
        if (armBtn && !armBtn.dataset.wired) {
            armBtn.addEventListener('click', async () => {
                const trackIndex = this._getTrackIndex();
                if (trackIndex === null || trackIndex === undefined) {
                    alert('Please select a track');
                    return;
                }
                
                try {
                    const isArmed = armBtn.classList.contains('active');
                    await editor.trackArm(trackIndex, !isArmed);
                    armBtn.classList.toggle('active');
                    updateStatus('ready', `Track ${!isArmed ? 'armed' : 'disarmed'}`);
                } catch (error) {
                    logger.error('Arm track failed', error);
                    updateStatus('error', 'Arm track failed: ' + error.message);
                }
            });
            armBtn.dataset.wired = 'true';
        }
        
        // Mute Track button
        const muteBtn = document.querySelector('button[data-info-title="Mute Track"]') || 
                       document.getElementById('btn-mute-track');
        if (muteBtn && !muteBtn.dataset.wired) {
            muteBtn.addEventListener('click', async () => {
                const trackIndex = this._getTrackIndex();
                if (trackIndex === null || trackIndex === undefined) {
                    alert('Please select a track');
                    return;
                }
                
                try {
                    const isMuted = muteBtn.classList.contains('active');
                    await editor.trackMute(trackIndex, !isMuted);
                    muteBtn.classList.toggle('active');
                    updateStatus('ready', `Track ${!isMuted ? 'muted' : 'unmuted'}`);
                } catch (error) {
                    logger.error('Mute track failed', error);
                    updateStatus('error', 'Mute track failed: ' + error.message);
                }
            });
            muteBtn.dataset.wired = 'true';
        }
        
        // Solo Track button
        const soloBtn = document.querySelector('button[data-info-title="Solo Track"]') || 
                       document.getElementById('btn-solo-track');
        if (soloBtn && !soloBtn.dataset.wired) {
            soloBtn.addEventListener('click', async () => {
                const trackIndex = this._getTrackIndex();
                if (trackIndex === null || trackIndex === undefined) {
                    alert('Please select a track');
                    return;
                }
                
                try {
                    const isSoloed = soloBtn.classList.contains('active');
                    await editor.trackSolo(trackIndex, !isSoloed);
                    soloBtn.classList.toggle('active');
                    updateStatus('ready', `Track ${!isSoloed ? 'soloed' : 'unsoloed'}`);
                } catch (error) {
                    logger.error('Solo track failed', error);
                    updateStatus('error', 'Solo track failed: ' + error.message);
                }
            });
            soloBtn.dataset.wired = 'true';
        }
        
        // Rename Track button
        const renameBtn = document.querySelector('button[data-info-title="Rename Track"]') || 
                         document.getElementById('btn-rename-track');
        if (renameBtn && !renameBtn.dataset.wired) {
            renameBtn.addEventListener('click', async () => {
                const trackIndex = this._getTrackIndex();
                if (trackIndex === null || trackIndex === undefined) {
                    alert('Please select a track');
                    return;
                }
                
                const newName = prompt('Enter new track name:');
                if (!newName || !newName.trim()) {
                    return;
                }
                
                try {
                    updateStatus('processing', 'Renaming track...');
                    
                    const response = await fetch(`${this.apiBaseUrl}/api/live/tracks/${trackIndex}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: newName.trim()
                        })
                    });
                    
                    if (!response.ok) {
                        const error = await response.json().catch(() => ({ detail: response.statusText }));
                        throw new Error(error.detail || 'Rename track failed');
                    }
                    
                    const result = await response.json();
                    logger.info('Track renamed', result);
                    updateStatus('ready', 'Track renamed');
                } catch (error) {
                    logger.error('Rename track failed', error);
                    updateStatus('error', 'Rename track failed: ' + error.message);
                    alert('Failed to rename track: ' + error.message);
                }
            });
            renameBtn.dataset.wired = 'true';
        }
    }
    
    /**
     * Get transport action from button
     * @private
     * @param {HTMLElement} button - Transport button element
     * @returns {string|null} Transport action name
     */
    _getTransportAction(button) {
        // Check data attribute first
        const dataAction = button.getAttribute('data-action');
        if (dataAction) return dataAction;
        
        // Check title attribute
        const title = button.getAttribute('data-info-title') || button.getAttribute('title');
        if (title) {
            const titleLower = title.toLowerCase();
            if (titleLower.includes('rewind')) return 'rewind';
            if (titleLower.includes('stop')) return 'stop';
            if (titleLower.includes('play')) return 'play';
            if (titleLower.includes('record')) return 'record';
            if (titleLower.includes('forward')) return 'forward';
        }
        
        // Check class for record button
        if (button.classList.contains('record')) return 'record';
        
        // Check text content as fallback
        const text = button.textContent.trim().toLowerCase();
        if (text.includes('⏪') || text.includes('rewind')) return 'rewind';
        if (text.includes('⏹') || text.includes('stop')) return 'stop';
        if (text.includes('▶') || text.includes('play')) return 'play';
        if (text.includes('⏺') || text.includes('record')) return 'record';
        if (text.includes('⏩') || text.includes('forward')) return 'forward';
        
        return null;
    }
    
    /**
     * Get current track index
     * @private
     * @returns {number} Current track index
     */
    _getTrackIndex() {
        // Try to use state helper first
        if (typeof getCurrentTrackIndex === 'function') {
            return getCurrentTrackIndex();
        }
        
        // Fallback to window state
        if (window.currentTrackIndex !== undefined) {
            return window.currentTrackIndex;
        }
        
        // Default to 0 if nothing is set
        return 0;
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

