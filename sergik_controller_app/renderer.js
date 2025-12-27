/**
 * SERGIK AI Controller - Renderer Process
 * 
 * Handles all UI interactions and API communication matching the preview design.
 */

// State
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let currentTab = 'create';

// DOM Elements
const elements = {
    // Device status
    statusLed: document.getElementById('status-led'),
    statusText: document.getElementById('status-text'),
    statusLedDisplay: document.getElementById('status-led-display'),
    statusTextDisplay: document.getElementById('status-text-display'),
    
    // Main tabs
    mainTabBtns: document.querySelectorAll('.main-tab-btn'),
    tabSections: document.querySelectorAll('.tab-section'),
    
    // Generation
    toggleAudio: document.getElementById('toggle-audio'),
    toggleMidi: document.getElementById('toggle-midi'),
    generateButtons: document.querySelectorAll('.btn-generate'),
    
    // Track controls
    btnCreateTrack: document.getElementById('btn-create-track'),
    btnDeleteTrack: document.getElementById('btn-delete-track'),
    btnArmTrack: document.getElementById('btn-arm-track'),
    btnMuteTrack: document.getElementById('btn-mute-track'),
    btnSoloTrack: document.getElementById('btn-solo-track'),
    btnRenameTrack: document.getElementById('btn-rename-track'),
    
    // Display controls
    ideaInput: document.getElementById('idea-input'),
    genreSelect: document.getElementById('genre-select'),
    subgenreSelect: document.getElementById('subgenre-select'),
    subgenreLine: document.getElementById('subgenre-line'),
    tempoSelect: document.getElementById('tempo-select'),
    tempoFollowToggle: document.getElementById('tempo-follow-toggle'),
    tempoToggleLabel: document.getElementById('tempo-toggle-label'),
    energySelect: document.getElementById('energy-select'),
    keySelect: document.getElementById('key-select'),
    trackSelect: document.getElementById('track-select'),
    slotSelect: document.getElementById('slot-select'),
    
    // Input tabs
    inputTabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // File input
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    
    // URL input
    urlInput: document.getElementById('url-input'),
    btnAnalyzeUrl: document.getElementById('btn-analyze-url'),
    
    // Mic
    micBtn: document.getElementById('mic-btn'),
    
    // Command
    commandInput: document.getElementById('command-input'),
    
    // Transport
    btnRewind: document.getElementById('btn-rewind'),
    btnStop: document.getElementById('btn-stop'),
    btnPlay: document.getElementById('btn-play'),
    btnRecord: document.getElementById('btn-record'),
    btnForward: document.getElementById('btn-forward'),
    
    // Status
    actionList: document.getElementById('action-list'),
    
    // Quick actions
    btnAnalyze: document.getElementById('btn-analyze'),
    btnPreview: document.getElementById('btn-preview'),
    
    // Analysis
    dnaScore: document.getElementById('dna-score'),
    dnaFill: document.getElementById('dna-fill'),
    genreBars: document.getElementById('genre-bars'),
    viewToggleBtns: document.querySelectorAll('.toggle-btn'),
    viewContents: document.querySelectorAll('.view-content'),
    
    // AI
    aiMessages: document.getElementById('ai-messages'),
    aiInput: document.getElementById('ai-input'),
    btnSendAi: document.getElementById('btn-send-ai'),
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Initialize notification system
let notificationSystem = null;

async function initializeApp() {
    console.log('[Renderer] Initializing app...');
    
    // Initialize notification system
    if (window.NotificationSystem) {
        notificationSystem = new window.NotificationSystem();
        window.notificationSystem = notificationSystem;
    }
    
    // Initialize keyboard shortcuts
    if (window.KeyboardShortcuts) {
        window.keyboardShortcuts = new window.KeyboardShortcuts();
    }
    
    // Initialize error handler
    if (window.ErrorHandler) {
        window.errorHandler = new window.ErrorHandler();
    }
    
    // Initialize loading states
    if (window.LoadingStates) {
        window.loadingStates = new window.LoadingStates();
    }
    
    // Initialize undo manager
    if (window.UndoManager) {
        window.undoManager = new window.UndoManager(50);
    }
    
    // Check connection
    await checkConnection();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up idea analyzer for auto-fill
    setupIdeaAnalyzer();
    
    // Load initial data
    await loadInitialData();
    
    // Start periodic updates
    setInterval(checkConnection, 10000); // Every 10 seconds
    setInterval(loadSessionState, 5000); // Update session state every 5 seconds
    
    // Performance: Throttle scroll and resize events
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Redraw canvases on resize
            if (window.currentMediaData) {
                drawWaveform(window.currentMediaData);
            }
        }, 250);
    }, { passive: true });
    
    // Show welcome notification
    if (window.showNotification) {
        setTimeout(() => {
            window.showNotification('SERGIK AI Controller ready. Press ? for help.', 'success', 3000);
        }, 500);
    }
}

async function loadInitialData() {
    console.log('[Renderer] Loading initial data...');
    
    try {
        // Load session state (tracks, clips)
        const sessionState = await loadSessionState();
        
        // Load drum genres
        await loadDrumGenres();
        
        // Load media library (recent items)
        await loadRecentMedia();
        
        // Update track and slot options with session data
        if (sessionState && sessionState.tracks) {
            updateTrackAndSlotOptions(sessionState.tracks);
        } else {
            updateTrackAndSlotOptions([]);
        }
        
        // Initialize genre sub-genre system
        if (elements.genreSelect) {
            const currentGenre = elements.genreSelect.value || 'house';
            handleGenreChange(currentGenre);
        }
        
        // Initialize empty canvas states
        initializeEmptyCanvases();
        
        addAction('Initial data loaded', 'success');
    } catch (error) {
        console.error('[Renderer] Failed to load initial data:', error);
        addAction('Failed to load initial data', 'error');
        // Still initialize empty states
        initializeEmptyCanvases();
        updateTrackAndSlotOptions([]);
        // Initialize genre system even on error
        if (elements.genreSelect) {
            handleGenreChange(elements.genreSelect.value || 'house');
        }
    }
}

function initializeEmptyCanvases() {
    // Initialize waveform canvas
    const waveformCanvas = document.getElementById('waveform-canvas');
    if (waveformCanvas) {
        drawWaveform({});
    }
    
    // Initialize piano roll canvas
    const pianoRollCanvas = document.getElementById('piano-roll-canvas');
    if (pianoRollCanvas) {
        drawPianoRoll([]);
    }
    
    // Initialize timeline ruler
    const timelineRuler = document.getElementById('timeline-ruler');
    if (timelineRuler) {
        drawTimeline([]);
    }
}

async function loadSessionState() {
    try {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.getSessionState();
            if (result.success && result.data) {
                const state = result.data;
                
                // Update track count
                if (state.tracks && state.tracks.length > 0) {
                    updateTrackAndSlotOptions(state.tracks);
                }
                
                // Update tempo if available
                if (state.tempo && elements.tempoSelect) {
                    elements.tempoSelect.value = Math.round(state.tempo);
                }
                
                return state;
            }
        }
    } catch (error) {
        console.error('[Renderer] Failed to load session state:', error);
    }
    return null;
}

async function loadDrumGenres() {
    try {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.getDrumGenres();
            if (result.success && result.data) {
                const genres = Array.isArray(result.data) ? result.data : (result.data.genres || []);
                
                // Update genre select if needed
                if (elements.genreSelect && genres.length > 0) {
                    // Keep existing options, just ensure we have the API genres
                    genres.forEach(genre => {
                        const option = Array.from(elements.genreSelect.options).find(opt => opt.value === genre);
                        if (!option) {
                            const newOption = document.createElement('option');
                            newOption.value = genre;
                            newOption.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
                            elements.genreSelect.appendChild(newOption);
                        }
                    });
                }
                
                return genres;
            }
        }
    } catch (error) {
        console.error('[Renderer] Failed to load drum genres:', error);
    }
    return [];
}

async function loadRecentMedia() {
    try {
        const allItems = [];
        
        if (window.sergikAPI) {
            // Load from API (recent media from server)
            try {
                const result = await window.sergikAPI.browserSearch('Recent');
                if (result.success && result.data && result.data.items) {
                    allItems.push(...result.data.items);
                }
            } catch (apiError) {
                console.warn('[Renderer] Failed to load recent media from API:', apiError);
            }
            
            // Load from local library directory
            try {
                const libraryResult = await window.sergikAPI.listLibraryFiles('MIDI');
                if (libraryResult.success && libraryResult.files) {
                    const libraryItems = libraryResult.files.map(file => ({
                        id: file.path,
                        name: file.name,
                        path: file.path,
                        type: 'midi',
                        duration: 0, // Duration not stored in file metadata
                        source: 'library',
                        modified: file.modified
                    }));
                    allItems.push(...libraryItems);
                }
                
                const audioResult = await window.sergikAPI.listLibraryFiles('Audio');
                if (audioResult.success && audioResult.files) {
                    const audioItems = audioResult.files.map(file => ({
                        id: file.path,
                        name: file.name,
                        path: file.path,
                        type: 'audio',
                        duration: 0,
                        source: 'library',
                        modified: file.modified
                    }));
                    allItems.push(...audioItems);
                }
            } catch (libraryError) {
                console.warn('[Renderer] Failed to load library files:', libraryError);
            }
        }
        
        // Sort by modified date (newest first)
        allItems.sort((a, b) => {
            const dateA = new Date(a.modified || a.timestamp || 0);
            const dateB = new Date(b.modified || b.timestamp || 0);
            return dateB - dateA;
        });
        
        // Limit to most recent 50 items
        const recentItems = allItems.slice(0, 50);
        updateMediaList(recentItems);
        
        if (recentItems.length > 0) {
            console.log(`[Renderer] Loaded ${recentItems.length} media items (${recentItems.filter(i => i.source === 'library').length} from library)`);
        }
        
        return recentItems;
    } catch (error) {
        console.error('[Renderer] Failed to load recent media:', error);
    }
    
    // If no results, clear placeholder items
    const mediaList = document.getElementById('media-list');
    if (mediaList) {
        const placeholderItems = mediaList.querySelectorAll('.browser-item[data-media-id^="sample"]');
        placeholderItems.forEach(item => item.remove());
    }
    
    return [];
}

function updateTrackAndSlotOptions(tracks) {
    const trackSelect = elements.trackSelect;
    const slotSelect = elements.slotSelect;
    
    if (!trackSelect || !slotSelect) return;
    
    // Clear existing options (except "new" and "next")
    const trackOptions = Array.from(trackSelect.options);
    trackOptions.forEach(opt => {
        if (opt.value !== 'new') opt.remove();
    });
    
    // Add tracks from session state
    if (tracks && tracks.length > 0) {
        tracks.forEach((track, index) => {
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = track.name || `Track ${index + 1}`;
            trackSelect.appendChild(option);
        });
    }
    
    // Update slot options (1-8)
    const slotOptions = Array.from(slotSelect.options);
    slotOptions.forEach(opt => {
        if (opt.value !== 'next' && opt.value !== '') opt.remove();
    });
    
    for (let i = 1; i <= 8; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.textContent = `Slot ${i}`;
        slotSelect.appendChild(option);
    }
}

function setupEventListeners() {
    // Main tab switching
    elements.mainTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.mainTab;
            switchTab(tabId);
        });
    });
    
    // Generation buttons
    elements.generateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            handleGenerate(type);
        });
    });
    
    // Track controls
    elements.btnCreateTrack?.addEventListener('click', async () => {
        const trackName = prompt('Enter track name:');
        if (trackName && window.sergikAPI) {
            const result = await window.sergikAPI.createTrack({ name: trackName });
            if (result.success) {
                addAction(`Track created: ${trackName}`, 'success');
            } else {
                addAction(`Failed to create track: ${result.error}`, 'error');
            }
        }
    });
    elements.btnDeleteTrack?.addEventListener('click', async () => {
        const trackIndex = prompt('Enter track index to delete:');
        if (trackIndex !== null && window.sergikAPI) {
            const result = await window.sergikAPI.deleteTrack(parseInt(trackIndex));
            if (result.success) {
                addAction(`Track ${trackIndex} deleted`, 'success');
            } else {
                addAction(`Failed to delete track: ${result.error}`, 'error');
            }
        }
    });
    elements.btnArmTrack?.addEventListener('click', () => executeCommand('arm track'));
    elements.btnMuteTrack?.addEventListener('click', () => executeCommand('mute track'));
    elements.btnSoloTrack?.addEventListener('click', () => executeCommand('solo track'));
    elements.btnRenameTrack?.addEventListener('click', () => executeCommand('rename track'));
    
    // Genre selector
    elements.genreSelect?.addEventListener('change', (e) => {
        handleGenreChange(e.target.value);
    });
    
    // Intelligence selector
    const intelligenceSelect = document.getElementById('intelligence-select');
    const intelligenceSubLine = document.getElementById('intelligence-sub-line');
    const intelligenceSubSelect = document.getElementById('intelligence-sub-select');
    
    intelligenceSelect?.addEventListener('change', (e) => {
        const value = e.target.value;
        if (value && intelligenceSubLine && intelligenceSubSelect) {
            intelligenceSubLine.style.display = '';
            populateIntelligenceSubOptions(value, intelligenceSubSelect);
        } else if (intelligenceSubLine) {
            intelligenceSubLine.style.display = 'none';
        }
    });
    
    // Function to populate intelligence sub-options
    function populateIntelligenceSubOptions(category, subSelect) {
        if (!subSelect) return;
        
        // Clear existing options
        subSelect.innerHTML = '';
        
        // Define options for each category
        const options = {
            'emotional': ['Joy', 'Sadness', 'Anger', 'Fear', 'Surprise', 'Disgust'],
            'psychological': ['Arousal', 'Valence', 'Dominance', 'Tension', 'Release'],
            'sonic': ['Brightness', 'Warmth', 'Punch', 'Depth', 'Width'],
            'intent': ['Creative', 'Chill', 'Dance Floor', 'Social', 'Study']
        };
        
        const subOptions = options[category] || [];
        subOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.toLowerCase().replace(/\s+/g, '-');
            opt.textContent = option;
            subSelect.appendChild(opt);
        });
    }
    
    // Tempo follow toggle
    elements.tempoFollowToggle?.addEventListener('change', (e) => {
        const label = elements.tempoToggleLabel;
        if (label) {
            label.textContent = e.target.checked ? 'Follow Live' : 'Auto Update';
        }
    });
    
    // Input tabs
    elements.inputTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchInputTab(tabId);
        });
    });
    
    // File drop zone
    elements.dropZone?.addEventListener('click', async () => {
        // Use file dialog in Electron
        if (window.sergikAPI) {
            const fileResult = await window.sergikAPI.selectFileForAnalysis();
            if (fileResult.success) {
                // Extract filename from path
                const pathParts = fileResult.filePath.split(/[/\\]/);
                const fileName = pathParts[pathParts.length - 1];
                const fileObj = { name: fileName, path: fileResult.filePath };
                await handleFileUpload(fileObj);
            }
        } else {
            elements.fileInput?.click();
        }
    });
    
    // Enhanced drag and drop with visual feedback
    let dragCounter = 0;
    
    elements.dropZone?.addEventListener('dragenter', (e) => {
            e.preventDefault();
        dragCounter++;
        elements.dropZone?.classList.add('dragover');
        if (e.dataTransfer.types.includes('Files')) {
            const fileCount = e.dataTransfer.items.length;
            if (fileCount > 1) {
                elements.dropZone?.setAttribute('data-file-count', fileCount);
            }
        }
    });
    
    elements.dropZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        elements.dropZone?.classList.add('dragover');
    });
    
    elements.dropZone?.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            elements.dropZone?.classList.remove('dragover');
            elements.dropZone?.removeAttribute('data-file-count');
        }
    });
    
    elements.dropZone?.addEventListener('drop', async (e) => {
        e.preventDefault();
        dragCounter = 0;
        elements.dropZone?.classList.remove('dragover');
        const fileCount = e.dataTransfer.files.length;
        elements.dropZone?.removeAttribute('data-file-count');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Handle multiple files
            if (fileCount > 1) {
                await handleMultipleFiles(Array.from(files));
            } else {
                // Single file
                const file = files[0];
                const fileObj = { 
                    name: file.name, 
                    path: file.path || null
                };
                await handleFileUpload(fileObj);
            }
        }
    });
    
    elements.fileInput?.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            // In Electron, we need to use file dialog to get path
            if (window.sergikAPI) {
                const fileResult = await window.sergikAPI.selectFileForAnalysis();
                if (fileResult.success) {
                    const pathParts = fileResult.filePath.split(/[/\\]/);
                    const fileName = pathParts[pathParts.length - 1];
                    const fileObj = { name: fileName, path: fileResult.filePath };
                    await handleFileUpload(fileObj);
                }
            }
        }
    });
    
    // URL analyze
    elements.btnAnalyzeUrl?.addEventListener('click', () => {
        const url = elements.urlInput?.value.trim();
        if (url) {
            handleUrlAnalyze(url);
        }
    });
    
    elements.urlInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const url = elements.urlInput?.value.trim();
            if (url) {
                handleUrlAnalyze(url);
            }
        }
    });
    
    // Mic button
    elements.micBtn?.addEventListener('mousedown', startRecording);
    elements.micBtn?.addEventListener('mouseup', stopRecording);
    elements.micBtn?.addEventListener('mouseleave', stopRecording);
    elements.micBtn?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startRecording();
    });
    elements.micBtn?.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopRecording();
    });
    
    // Command input
    elements.commandInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const command = elements.commandInput?.value.trim();
            if (command) {
                handleCommand(command);
            }
        }
    });
    
    // Transport controls
    elements.btnRewind?.addEventListener('click', async () => {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.transportAction('rewind');
            if (result.success) {
                addAction('Rewind', 'info');
            }
        }
    });
    elements.btnStop?.addEventListener('click', async () => {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.transportAction('stop');
            if (result.success) {
                addAction('Stop', 'info');
            }
        }
    });
    elements.btnPlay?.addEventListener('click', async () => {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.transportAction('play');
            if (result.success) {
                addAction('Play', 'info');
            }
        }
    });
    elements.btnRecord?.addEventListener('click', async () => {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.transportAction('record');
            if (result.success) {
                addAction('Record', 'info');
            }
        }
    });
    elements.btnForward?.addEventListener('click', async () => {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.transportAction('forward');
            if (result.success) {
                addAction('Forward', 'info');
            }
        }
    });
    
    // Quick actions
    elements.btnAnalyze?.addEventListener('click', async () => {
        await handleAnalyze();
    });
    
    elements.btnPreview?.addEventListener('click', async () => {
        await handlePreview();
    });
    
    // Implement analyze function
    async function handleAnalyze() {
        try {
            addAction('Analyzing...', 'info');
            
            // Get file from input or drop zone
            const fileInput = document.getElementById('file-input');
            let file = null;
            
            if (fileInput?.files?.[0]) {
                file = fileInput.files[0];
            } else if (window.currentFile) {
                file = window.currentFile;
            } else {
                addAction('Please select a file first', 'error');
                return;
            }
            
            // Create FormData
            const formData = new FormData();
            formData.append('file', file);
            
            // Make API request
            const apiBaseUrl = window.sergikAPI?.getApiBaseUrl() || 'http://localhost:8000';
            const response = await fetch(`${apiBaseUrl}/api/analyze/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Analysis failed');
            }
            
            const result = await response.json();
            displayAnalysisResults(result);
            addAction('Analysis complete', 'success');
        } catch (error) {
            console.error('Analyze error:', error);
            addAction(`Analysis failed: ${error.message}`, 'error');
        }
    }
    
    // Implement preview function
    async function handlePreview() {
        try {
            addAction('Previewing...', 'info');
            
            // Get search query
            const query = elements.urlInput?.value.trim() || 
                         document.getElementById('media-search')?.value.trim();
            
            if (!query) {
                addAction('Enter search query or URL', 'error');
                return;
            }
            
            // Make API request
            const apiBaseUrl = window.sergikAPI?.getApiBaseUrl() || 'http://localhost:8000';
            const response = await fetch(`${apiBaseUrl}/api/organize/preview?query=${encodeURIComponent(query)}`, {
                method: 'GET'
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Preview failed');
            }
            
            const preview = await response.json();
            displayPreviewResults(preview);
            addAction('Preview complete', 'success');
        } catch (error) {
            console.error('Preview error:', error);
            addAction(`Preview failed: ${error.message}`, 'error');
        }
    }
    
    // Display analysis results
    function displayAnalysisResults(result) {
        // Update UI with results
        if (result.metadata) {
            const bpmEl = document.getElementById('analysis-bpm');
            const keyEl = document.getElementById('analysis-key');
            const energyEl = document.getElementById('analysis-energy');
            
            if (bpmEl && result.metadata.bpm) bpmEl.textContent = result.metadata.bpm;
            if (keyEl && result.metadata.key) keyEl.textContent = result.metadata.key;
            if (energyEl && result.metadata.energy) energyEl.textContent = result.metadata.energy;
        }
        
        // Store results for export
        window.currentAnalysisData = result;
    }
    
    // Display preview results
    function displayPreviewResults(preview) {
        // Update UI with preview
        const previewContainer = document.getElementById('preview-results');
        if (previewContainer) {
            previewContainer.innerHTML = JSON.stringify(preview, null, 2);
            previewContainer.style.display = 'block';
        }
    }
    
    // Analysis view toggles
    elements.viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchAnalysisView(view);
        });
    });
    
    // Update commit button state based on slot selection
    elements.slotSelect?.addEventListener('change', (e) => {
        const commitBtn = document.getElementById('commit-btn');
        const indicator = document.getElementById('placement-indicator');
        if (commitBtn && indicator) {
            if (e.target.value && e.target.value !== '') {
                commitBtn.disabled = false;
                indicator.textContent = `Slot ${parseInt(e.target.value) + 1}`;
                indicator.classList.remove('waiting');
                indicator.classList.add('ready');
            } else {
                commitBtn.disabled = true;
                indicator.textContent = 'Select slot...';
                indicator.classList.remove('ready');
                indicator.classList.add('waiting');
            }
        }
    });
    
    // AI chat
    elements.btnSendAi?.addEventListener('click', () => {
        const message = elements.aiInput?.value.trim();
        if (message) {
            handleAiMessage(message);
        }
    });
    
    elements.aiInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = elements.aiInput?.value.trim();
            if (message) {
                handleAiMessage(message);
            }
        }
    });
    
    // Library Tab - Browser
    setupLibraryTab();
    
    // AI Tab - Enhanced features
    setupAITab();
    
    // Analyze Tab - Enhanced features
    setupAnalyzeTab();
    
    // Settings button
    setupSettingsButton();
    
    // Advanced key panel
    setupAdvancedKeyPanel();
}

// Handle multiple file uploads
async function handleMultipleFiles(files) {
    if (!files || files.length === 0) return;
    
    const validFiles = files.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ['wav', 'mp3', 'flac', 'aif', 'aiff', 'mid', 'midi'].includes(ext);
    });
    
    if (validFiles.length === 0) {
        if (window.showNotification) {
            window.showNotification('No valid audio/MIDI files found', 'warning', 3000);
        }
        return;
    }
    
    if (window.showNotification) {
        window.showNotification(`Processing ${validFiles.length} file(s)...`, 'info', 2000);
    }
    
    // Process files sequentially with progress
    for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        try {
            const fileObj = { 
                name: file.name, 
                path: file.path || null
            };
            await handleFileUpload(fileObj);
            
            if (window.showNotification && i < validFiles.length - 1) {
                window.showNotification(`Processed ${i + 1}/${validFiles.length} files`, 'info', 1000);
            }
        } catch (error) {
            console.error(`[Renderer] Failed to process file ${file.name}:`, error);
            if (window.errorHandler) {
                window.errorHandler.showError(error);
            }
        }
    }
    
    if (window.showNotification) {
        window.showNotification(`Successfully processed ${validFiles.length} file(s)`, 'success', 3000);
    }
}

// Library Tab Setup
function setupLibraryTab() {
    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            filterMediaItems(filter);
        });
    });
    
    // Search
    const searchInput = document.getElementById('media-search');
    const searchClear = document.getElementById('search-clear');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            searchClear.style.display = query.trim() ? 'block' : 'none';
            
            // Debounce search
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (query.trim()) {
                    performLibrarySearch(query);
                } else {
                    // Empty search - load recent items
                    loadRecentMedia();
                }
            }, 300);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    performLibrarySearch(query).then(() => {
                        // Load first result
                        const firstItem = document.querySelector('.browser-item');
                        if (firstItem) {
                            firstItem.click();
                        }
                    });
                }
            }
        });
    }
    
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                searchClear.style.display = 'none';
            }
            // Reset filter
            const allFilter = document.querySelector('.filter-chip[data-filter="all"]');
            if (allFilter) {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                allFilter.classList.add('active');
                filterMediaItems('all');
            }
        });
    }
    
    // Group toggles
    document.querySelectorAll('.group-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const group = this.closest('.media-group');
            if (group) {
                group.classList.toggle('collapsed');
                this.textContent = group.classList.contains('collapsed') ? '▶' : '▼';
            }
        });
    });
    
    // Media navigation
    document.getElementById('prev-media')?.addEventListener('click', () => navigateMedia(-1));
    document.getElementById('next-media')?.addEventListener('click', () => navigateMedia(1));
    document.getElementById('random-media')?.addEventListener('click', () => navigateMedia('random'));
    
    // Editor toolbar
    document.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', function() {
            const tool = this.dataset.tool;
            switchEditorTool(tool);
        });
    });
    
    // Action buttons
    document.getElementById('action-insert')?.addEventListener('click', () => handleMediaAction('insert'));
    document.getElementById('action-replace')?.addEventListener('click', () => handleMediaAction('replace'));
    document.getElementById('action-commit')?.addEventListener('click', () => handleMediaAction('commit'));
    document.getElementById('action-duplicate')?.addEventListener('click', () => handleMediaAction('duplicate'));
    
    // Preview controls
    document.getElementById('preview-play')?.addEventListener('click', () => handlePreview('play'));
    document.getElementById('preview-stop')?.addEventListener('click', () => handlePreview('stop'));
    document.getElementById('preview-loop')?.addEventListener('click', () => handlePreview('loop'));
    
    // Browser items
    document.querySelectorAll('.browser-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.browser-item').forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            loadMediaIntoEditor(this.dataset.mediaId);
        });
    });
}

// AI Tab Setup
function setupAITab() {
    // Chat input
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    
    if (chatInput && chatSend) {
        chatSend.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message) {
                handleChatMessage(message);
            }
        });
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = chatInput.value.trim();
                if (message) {
                    handleChatMessage(message);
                }
            }
        });
    }
    
    // Clear chat
    document.getElementById('ai-clear')?.addEventListener('click', () => {
        const messages = document.getElementById('chat-messages');
        if (messages) {
            messages.innerHTML = '';
            addChatMessage('ai', 'Hello! I\'m your AI assistant. How can I help you create music today?');
        }
    });
    
    // Quick actions
    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.addEventListener('click', function() {
            const action = this.dataset.action;
            handleQuickAction(action);
        });
    });
    
    // Workflows
    document.querySelectorAll('.workflow-item .btn-icon-small').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const workflow = this.closest('.workflow-item');
            const workflowName = workflow?.querySelector('.workflow-name')?.textContent;
            if (workflowName) {
                executeWorkflow(workflowName);
            }
        });
    });
    
    document.getElementById('create-workflow')?.addEventListener('click', () => {
        addAction('Create workflow dialog would open here', 'info');
    });
}

// Settings button handler
function setupSettingsButton() {
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (window.showSettingsPanel) {
                window.showSettingsPanel();
            }
        });
    }
}

// Analyze Tab Setup
function setupAnalyzeTab() {
    // Analysis buttons
    document.getElementById('btn-analyze-file')?.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.wav,.mp3,.flac,.aif';
        fileInput.onchange = (e) => {
            if (e.target.files.length > 0) {
                analyzeFile(e.target.files[0]);
            }
        };
        fileInput.click();
    });
    
    document.getElementById('btn-analyze-url')?.addEventListener('click', () => {
        const url = prompt('Enter URL to analyze:');
        if (url) {
            analyzeUrl(url);
        }
    });
    
    document.getElementById('btn-dna-match')?.addEventListener('click', async () => {
        await handleDNAMatch();
    });
    
    document.getElementById('btn-export-analysis')?.addEventListener('click', async () => {
        await handleExport();
    });
    
    // Implement DNA match function
    async function handleDNAMatch() {
        try {
            addAction('DNA matching...', 'info');
            
            // Get file from input or drop zone
            const fileInput = document.getElementById('file-input');
            let file = null;
            
            if (fileInput?.files?.[0]) {
                file = fileInput.files[0];
            } else if (window.currentFile) {
                file = window.currentFile;
            } else {
                addAction('Please select a file first', 'error');
                return;
            }
            
            // Create FormData
            const formData = new FormData();
            formData.append('file', file);
            
            // Make API request to DNA analysis endpoint
            const apiBaseUrl = window.sergikAPI?.getApiBaseUrl() || 'http://localhost:8000';
            const response = await fetch(`${apiBaseUrl}/api/gpt/analyze`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'DNA match failed');
            }
            
            const result = await response.json();
            displayDNAMatchResults(result);
            addAction('DNA match complete', 'success');
        } catch (error) {
            console.error('DNA match error:', error);
            addAction(`DNA match failed: ${error.message}`, 'error');
        }
    }
    
    // Implement export function
    async function handleExport() {
        try {
            addAction('Exporting analysis...', 'info');
            
            // Get current analysis data
            const analysisData = window.currentAnalysisData;
            if (!analysisData) {
                addAction('No analysis data to export', 'error');
                return;
            }
            
            // Save to library instead of download
            if (window.sergikAPI) {
                const filename = `analysis_${Date.now()}.json`;
                const result = await window.sergikAPI.saveAnalysisToLibrary(analysisData, filename);
                
        if (result.success) {
                    addAction(`Analysis saved to library: ${filename}`, 'success');
                    if (result.filePath) {
                        addAction(`Location: ${result.filePath}`, 'info');
                    }
        } else {
                    addAction(`Export failed: ${result.error}`, 'error');
                }
            } else {
                // Fallback: download if API not available
                const blob = new Blob([JSON.stringify(analysisData, null, 2)], { 
                    type: 'application/json' 
                });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `sergik_analysis_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                addAction('Export complete (downloaded)', 'success');
        }
    } catch (error) {
            console.error('Export error:', error);
            addAction(`Export failed: ${error.message}`, 'error');
        }
    }
    
    // Display DNA match results
    function displayDNAMatchResults(result) {
        // Update UI with DNA match results
        const dnaContainer = document.getElementById('dna-results');
        if (dnaContainer) {
            if (result.dna_match) {
                dnaContainer.innerHTML = `
                    <h3>DNA Match Results</h3>
                    <p><strong>Match Score:</strong> ${result.dna_match.score || 'N/A'}</p>
                    <p><strong>Genre:</strong> ${result.dna_match.genre || 'N/A'}</p>
                    <p><strong>BPM Zone:</strong> ${result.dna_match.bpm_zone || 'N/A'}</p>
                    <p><strong>Key:</strong> ${result.dna_match.key || 'N/A'}</p>
                    <pre>${JSON.stringify(result.dna_match, null, 2)}</pre>
                `;
            } else {
                dnaContainer.innerHTML = '<p>No DNA match data available</p>';
            }
            dnaContainer.style.display = 'block';
        }
        
        // Store results for export
        window.currentAnalysisData = result;
    }
    
    // Commit button
    document.getElementById('commit-btn')?.addEventListener('click', () => {
        commitToTrack();
    });
}

// Library Tab Functions
function filterMediaItems(filter) {
    const items = document.querySelectorAll('.browser-item');
    items.forEach(item => {
        const type = item.dataset.mediaType;
        if (filter === 'all' || filter === type || (filter === 'recent' && item.closest('[data-group="recent"]'))) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
    updateMediaCount();
}

async function performLibrarySearch(query) {
    if (!query || query.trim() === '') {
        // Empty search - load recent items
        await loadRecentMedia();
        return;
    }
    
    addAction(`Searching: ${query}...`, 'info');
    
    try {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.browserSearch(query);
            if (result.success && result.data) {
                const items = result.data.items || [];
                updateMediaList(items);
                addAction(`Found ${items.length} results`, 'success');
        } else {
                throw new Error(result.error || 'Search failed');
            }
        }
    } catch (error) {
        addAction(`Search failed: ${error.message}`, 'error');
        // On error, clear the list
        updateMediaList([]);
    }
}

function updateMediaList(items) {
    const mediaList = document.getElementById('media-list');
    if (!mediaList) return;
    
    // Clear ALL existing items (including placeholders)
    const existingItems = mediaList.querySelectorAll('.browser-item');
    existingItems.forEach(item => item.remove());
    
    if (!items || items.length === 0) {
        // Show empty state
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'browser-item';
        emptyDiv.style.opacity = '0.5';
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.padding = '20px';
        emptyDiv.innerHTML = '<span>No media items found</span>';
        mediaList.appendChild(emptyDiv);
        updateMediaCount();
        return;
    }
    
    // Add new items
    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'browser-item';
        itemDiv.dataset.mediaId = item.id || item.path || `item-${index}`;
        itemDiv.dataset.mediaType = item.type || (item.path?.endsWith('.mid') ? 'midi' : 'audio');
        itemDiv.dataset.mediaPath = item.path || '';
        
        const itemName = item.name || item.filename || item.path?.split(/[/\\]/).pop() || 'Unknown';
        const duration = item.duration || 0;
        
        // Add library badge if from library
        const libraryBadge = item.source === 'library' ? '<span class="library-badge" title="From Library">📁</span>' : '';
        
        itemDiv.innerHTML = `
            <span class="item-icon">${itemDiv.dataset.mediaType === 'midi' ? '🎹' : '🎵'}</span>
            <span class="item-name">${itemName}</span>
            ${libraryBadge}
            <span class="item-time">${formatDuration(duration)}</span>
        `;
        
        itemDiv.addEventListener('click', function() {
            document.querySelectorAll('.browser-item').forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            loadMediaIntoEditor(this.dataset.mediaId);
        });
        
        mediaList.appendChild(itemDiv);
    });
    
    updateMediaCount();
}

function updateMediaCount() {
    const mediaList = document.getElementById('media-list');
    if (!mediaList) return;
    
    const items = mediaList.querySelectorAll('.browser-item:not([style*="opacity"])');
    const count = items.length;
    
    const countElement = document.getElementById('total-media-count');
    if (countElement) {
        countElement.textContent = count;
    }
    
    // Update group count
    const allMediaGroup = document.querySelector('.media-group:has(#media-list)');
    if (allMediaGroup) {
        const countBadge = allMediaGroup.querySelector('.group-count');
        if (countBadge) {
            countBadge.textContent = count;
        }
    }
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function navigateMedia(direction) {
    const items = Array.from(document.querySelectorAll('.browser-item:not([style*="display: none"])'));
    const selected = document.querySelector('.browser-item.selected');
    if (!selected || items.length === 0) return;
    
    let currentIndex = items.indexOf(selected);
    let newIndex;
    
    if (direction === 'random') {
        newIndex = Math.floor(Math.random() * items.length);
    } else {
        newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
    }
    
    items[newIndex].click();
    updateMediaPosition(newIndex + 1, items.length);
}

function updateMediaPosition(current, total) {
    const currentEl = document.getElementById('current-media-index');
    const totalEl = document.getElementById('total-media-count');
    if (currentEl) currentEl.textContent = current;
    if (totalEl) totalEl.textContent = total;
}

function updateMediaCount() {
    const visible = document.querySelectorAll('.browser-item:not([style*="display: none"])').length;
    const countEl = document.querySelector('.group-count');
    if (countEl) {
        countEl.textContent = `(${visible})`;
    }
    updateMediaPosition(0, visible);
}

function switchEditorTool(tool) {
    // Update toolbar
    document.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    
    // Switch editor views
    if (tool === 'waveform') {
        switchEditorView('waveform');
    } else if (tool === 'piano') {
        switchEditorView('piano-roll');
    } else if (tool === 'timeline') {
        switchEditorView('timeline');
    }
}

function switchEditorView(view) {
    document.querySelectorAll('.editor-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const target = document.getElementById(`editor-${view}`);
    if (target) {
        target.classList.add('active');
    }
}

async function loadMediaIntoEditor(mediaId) {
    addAction(`Loading ${mediaId} into editor...`, 'info');
    
    try {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.browserLoad({ item_id: mediaId });
        if (result.success) {
                addAction(`Media loaded: ${mediaId}`, 'success');
                // Update editor with media info
                updateEditorWithMedia(result.data);
        } else {
                throw new Error(result.error || 'Load failed');
            }
        }
    } catch (error) {
        addAction(`Load failed: ${error.message}`, 'error');
    }
}

async function handleMediaAction(action) {
    const selectedItem = document.querySelector('.browser-item.selected');
    if (!selectedItem) {
        addAction('No item selected', 'error');
        return;
    }
    
    const mediaId = selectedItem.dataset.mediaId;
    const trackIndex = parseInt(elements.trackSelect?.value) || 0;
    const slotIndex = parseInt(elements.slotSelect?.value);
    
    try {
        if (action === 'insert') {
            if (window.sergikAPI) {
                const result = await window.sergikAPI.createClip({
                    track_index: trackIndex,
                    slot_index: slotIndex !== undefined ? slotIndex : 'next',
                    clip_type: selectedItem.dataset.mediaType || 'audio'
                });
        if (result.success) {
                    addAction('Media inserted', 'success');
                }
            }
        } else if (action === 'replace') {
            if (window.sergikAPI && slotIndex !== undefined) {
                const result = await window.sergikAPI.browserLoad({
                    item_id: mediaId,
                    track_index: trackIndex,
                    slot_index: slotIndex
                });
                if (result.success) {
                    addAction('Media replaced', 'success');
                }
            }
        } else if (action === 'commit') {
            // Commit is handled separately
            commitToTrack();
        } else if (action === 'duplicate') {
            if (window.sergikAPI && slotIndex !== undefined) {
                const result = await window.sergikAPI.duplicateClip({
                    track_index: trackIndex,
                    slot_index: slotIndex,
                    target_slot: slotIndex + 1
                });
                if (result.success) {
                    addAction('Clip duplicated', 'success');
                }
            }
        }
    } catch (error) {
        addAction(`${action} failed: ${error.message}`, 'error');
    }
}

function handlePreview(action) {
    const btn = document.getElementById(`preview-${action}`);
    if (btn) {
        btn.classList.toggle('active', action === 'play' || action === 'loop');
    }
    addAction(`Preview ${action}`, 'info');
}

// AI Tab Functions
function handleChatMessage(message) {
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!chatMessages) return;
    
    // Add user message
    addChatMessage('user', message);
    
    if (chatInput) {
        chatInput.value = '';
    }
    
    // Simulate AI response
    setTimeout(() => {
        addChatMessage('ai', `I understand you want to "${message}". Let me help you with that.`);
    }, 500);
}

function addChatMessage(role, text) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    messageDiv.innerHTML = `
        <div class="message-avatar">${role === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleQuickAction(action) {
    addAction(`Quick action: ${action}`, 'info');
    // TODO: Implement quick actions
}

function executeWorkflow(name) {
    addAction(`Executing workflow: ${name}...`, 'info');
    // TODO: Implement workflow execution
}

// Analyze Tab Functions
async function analyzeFile(file) {
    addAction(`Analyzing ${file.name}...`, 'info');
    updateStatus('Analyzing', 'yellow');
    
    try {
        if (window.sergikAPI) {
            // In Electron, we need to get the file path
            // For now, trigger file dialog or use the file object
            const result = await handleFileUpload(file);
            if (result) {
                addAction('Analysis complete', 'success');
                updateStatus('Ready', 'green');
            }
        }
    } catch (error) {
        addAction(`Analysis failed: ${error.message}`, 'error');
        updateStatus('Error', 'red');
    }
}

async function analyzeUrl(url) {
    addAction(`Analyzing URL: ${url}...`, 'info');
    updateStatus('Analyzing', 'yellow');
    
    try {
        await handleUrlAnalyze(url);
        addAction('URL analysis complete', 'success');
        updateStatus('Ready', 'green');
    } catch (error) {
        addAction(`Analysis failed: ${error.message}`, 'error');
        updateStatus('Error', 'red');
    }
}

async function commitToTrack() {
    const slot = elements.slotSelect?.value;
    if (!slot || slot === '') {
        addAction('Please select a slot first', 'error');
        return;
    }
    
    const trackIndex = parseInt(elements.trackSelect?.value) || 0;
    const slotIndex = slot === 'next' ? undefined : parseInt(slot);
    
    addAction(`Committing to track ${trackIndex} at slot ${slot}...`, 'info');
    
    try {
        if (window.sergikAPI) {
            // Get current clip notes if in editor
            const currentMedia = document.querySelector('.browser-item.selected');
            if (currentMedia) {
                const result = await window.sergikAPI.createClip({
                    track_index: trackIndex,
                    slot_index: slotIndex !== undefined ? slotIndex : 'next',
                    clip_type: 'midi' // or 'audio' based on media type
                });
        if (result.success) {
                    addAction('Committed successfully', 'success');
                    // Reset commit button
                    const commitBtn = document.getElementById('commit-btn');
                    if (commitBtn) commitBtn.disabled = true;
        } else {
                    throw new Error(result.error);
                }
            } else {
                throw new Error('No media selected');
            }
        }
    } catch (error) {
        addAction(`Commit failed: ${error.message}`, 'error');
    }
}

// Tab Management
function switchTab(tabId) {
    currentTab = tabId;
    
    // Update tab buttons
    elements.mainTabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mainTab === tabId);
    });
    
    // Update tab sections
    elements.tabSections.forEach(section => {
        section.classList.toggle('active', section.id === `tab-section-${tabId}`);
    });
    
    console.log('[Renderer] Switched to tab:', tabId);
}

function switchInputTab(tabId) {
    // Update tab buttons
    elements.inputTabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update tab contents
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
}

function switchAnalysisView(view) {
    elements.viewToggleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    elements.viewContents.forEach(content => {
        content.classList.toggle('active', content.id === `view-${view}`);
    });
}

// Connection Management
async function checkConnection() {
    try {
        if (window.sergikAPI) {
        const result = await window.sergikAPI.checkHealth();
        if (result.success) {
                updateConnectionStatus(true, 'CONNECTED');
        } else {
                updateConnectionStatus(false, 'DISCONNECTED');
            }
        } else {
            updateConnectionStatus(false, 'NO API');
        }
    } catch (error) {
        updateConnectionStatus(false, 'ERROR');
        console.error('[Renderer] Connection check failed:', error);
    }
}

function updateConnectionStatus(connected, text) {
    if (elements.statusLed) {
        elements.statusLed.classList.toggle('connected', connected);
        elements.statusLed.classList.toggle('disconnected', !connected);
    }
    if (elements.statusText) {
    elements.statusText.textContent = text;
}
    if (elements.statusLedDisplay) {
        elements.statusLedDisplay.classList.toggle('connected', connected);
        elements.statusLedDisplay.classList.toggle('disconnected', !connected);
    }
    if (elements.statusTextDisplay) {
        elements.statusTextDisplay.textContent = connected ? 'Ready' : 'Not Ready';
    }
}

// Generation
async function handleGenerate(type) {
    // Check offline
    if (window.errorHandler && window.errorHandler.checkOffline()) {
        return;
    }
    
    const params = {
        type: type,
        genre: elements.genreSelect?.value || 'house',
        tempo: parseInt(elements.tempoSelect?.value) || 124,
        energy: parseInt(elements.energySelect?.value) || 6,
        key: elements.keySelect?.value || '10B',
        track: elements.trackSelect?.value || 'new',
        slot: elements.slotSelect?.value || 'next',
        idea: elements.ideaInput?.value || '',
        audio: elements.toggleAudio?.checked || false,
        midi: elements.toggleMidi?.checked || false,
    };
    
    // Find the button that triggered this
    const button = document.querySelector(`[data-type="${type}"]`);
    
    // Use loading states
    if (window.loadingStates && button) {
        await window.loadingStates.withLoading(
            async () => {
                await performGeneration(type, params);
            },
            {
                button: button,
                overlay: false,
                message: `Generating ${type}...`
            }
        );
    } else {
        await performGeneration(type, params);
    }
}

async function performGeneration(type, params) {
    addAction(`Generating ${type}...`, 'info');
    updateStatus('Processing', 'yellow');
    
    let generatedData = null;
    let saveResult = null;
    
    try {
        if (!window.sergikAPI) {
            throw new Error('API not available');
        }
        
        // Map type to API call
        let result;
        switch (type) {
            case 'kicks':
            case 'claps':
            case 'hats':
            case 'percussion':
                result = await window.sergikAPI.generateDrums({ genre: params.genre, bars: 8, tempo: params.tempo });
                break;
            case 'bass':
                result = await window.sergikAPI.generateBass({ key: params.key, bars: 8, style: params.genre, tempo: params.tempo });
                break;
            case 'synths':
            case 'vocals':
            case 'fx':
                result = await window.sergikAPI.gptGenerate(`Generate ${type} for ${params.genre} at ${params.tempo} BPM`);
                break;
            default:
                result = { success: false, error: 'Unknown generation type' };
        }
        
        // Handle result
        if (result.success && result.data) {
            generatedData = result.data;
            
            // Save to library automatically
            try {
                const filename = `${type}_${params.genre || 'default'}_${Date.now()}.mid`;
                saveResult = await window.sergikAPI.saveMidiToLibrary(
                    result.data,
                    filename
                );
                
                if (saveResult.success) {
                    addAction(`Generated and saved ${type} to library`, 'success');
                    if (saveResult.filePath) {
                        addAction(`Location: ${saveResult.filePath}`, 'info');
                    }
                    
                    // Add to undo history
                    if (window.undoManager && window.ActionCreators) {
                        const action = window.ActionCreators.generation(type, params, {
                            data: generatedData,
                            filename: saveResult.filePath || filename
                        });
                        window.undoManager.addAction(action);
                    }
        } else {
                    addAction(`Generated ${type} but failed to save: ${saveResult.error}`, 'warning');
                }
            } catch (saveError) {
                console.warn('[Renderer] Failed to save to library:', saveError);
                addAction(`Generated ${type} (save to library failed)`, 'warning');
            }
            
            updateStatus('Ready', 'green');
        } else {
            // Handle API error
            if (window.errorHandler) {
                window.errorHandler.handleApiError(result, `Generation of ${type}`);
            } else {
                addAction(`Error: ${result.error || 'Unknown error'}`, 'error');
            }
            updateStatus('Error', 'red');
        }
    } catch (error) {
        // Handle error with error handler
        if (window.errorHandler) {
            window.errorHandler.showError(error, { showRetry: true });
        } else {
            addAction(`Error: ${error.message}`, 'error');
        }
        updateStatus('Error', 'red');
        console.error('[Renderer] Generation failed:', error);
    }
}

// Sub-genre mapping
const subGenreMap = {
    'house': ['Classic House', 'Deep House', 'Tech House', 'Progressive House', 'Acid House', 'Future House', 'Tropical House', 'Garage House', 'Bass House', 'French House', 'Disco House', 'Soulful House'],
    'tech_house': ['Minimal Tech House', 'Dark Tech House', 'Driving Tech House', 'Groovy Tech House'],
    'deep_house': ['Soulful Deep House', 'Vocal Deep House', 'Instrumental Deep House', 'Classic Deep House'],
    'techno': ['Minimal Techno', 'Hard Techno', 'Industrial Techno', 'Acid Techno', 'Detroit Techno', 'Berlin Techno', 'Raw Techno', 'Melodic Techno'],
    'trance': ['Progressive Trance', 'Uplifting Trance', 'Vocal Trance', 'Psytrance', 'Tech Trance', 'Hard Trance'],
    'progressive_house': ['Progressive Trance', 'Progressive Breaks', 'Progressive Techno'],
    'minimal': ['Minimal Techno', 'Minimal House', 'Microhouse', 'Minimal Deep'],
    'experimental': ['IDM', 'Glitch', 'Ambient Techno', 'Drone', 'Noise', 'Electroacoustic', 'Sound Art'],
    'bass': ['Dubstep', 'Future Bass', 'Trap', 'Bass House', 'UK Bass', 'Wonky', 'Juke', 'Footwork'],
    'disco': ['Classic Disco', 'Nu-Disco', 'Italo Disco', 'French Disco', 'Disco House'],
    'hard_techno': ['Hard Techno', 'Industrial Techno', 'Raw Techno', 'Schranz'],
    'acid_house': ['Acid House', 'Acid Techno', 'Acid Breaks'],
    'hiphop': ['Boom Bap', 'Trap', 'Drill', 'Mumble Rap', 'Conscious Hip-Hop', 'Gangsta Rap', 'Alternative Hip-Hop', 'Jazz Rap'],
    'boom_bap': ['Classic Boom Bap', 'Modern Boom Bap', 'Jazzy Boom Bap'],
    'trap': ['Atlanta Trap', 'Drill Trap', 'Melodic Trap', 'Latin Trap', 'Trap Metal'],
    'lo_fi': ['Lo-Fi Hip-Hop', 'Lo-Fi House', 'Chill Lo-Fi', 'Jazzy Lo-Fi'],
    'drill': ['UK Drill', 'NY Drill', 'Chicago Drill', 'Brooklyn Drill'],
    'dnb': ['Liquid DnB', 'Neurofunk', 'Jump-Up', 'Techstep', 'Drumfunk', 'Intelligent DnB', 'Darkstep'],
    'jungle': ['Classic Jungle', 'Ragga Jungle', 'Hardcore Jungle', 'Modern Jungle'],
    'breakbeat': ['Big Beat', 'Nu-Skool Breaks', 'Progressive Breaks', 'Acid Breaks'],
    'garage': ['UK Garage', 'Speed Garage', '2-Step', 'Future Garage', 'Bassline'],
    'reggaeton': ['Classic Reggaeton', 'Trapeton', 'Neo Reggaeton', 'Latin Trap'],
    'reggae': ['Roots Reggae', 'Dancehall', 'Dub', 'Ska', 'Rocksteady', 'Lovers Rock'],
    'salsa': ['Salsa Dura', 'Salsa Romantica', 'Timba', 'Salsa Cubana'],
    'ambient': ['Dark Ambient', 'Drone Ambient', 'Space Ambient', 'Nature Ambient', 'Ambient Techno', 'Ambient House'],
    'downtempo': ['Trip-Hop', 'Chillout', 'Lounge', 'Nu-Jazz', 'Downtempo House'],
    'trip_hop': ['Classic Trip-Hop', 'Dark Trip-Hop', 'Jazzy Trip-Hop'],
    'funk': ['Classic Funk', 'P-Funk', 'Nu-Funk', 'Deep Funk', 'Jazz Funk'],
    'soul': ['Classic Soul', 'Neo-Soul', 'Northern Soul', 'Deep Soul', 'Motown'],
    'r_and_b': ['Contemporary R&B', 'Neo-Soul', 'Alternative R&B', 'Quiet Storm'],
    'indie_rock': ['Indie Pop', 'Indie Folk', 'Garage Rock', 'Post-Punk Revival'],
    'alternative': ['Alternative Rock', 'Grunge', 'Britpop', 'Indie Alternative'],
    'post_rock': ['Post-Rock', 'Math Rock', 'Shoegaze', 'Ambient Post-Rock'],
    'psychedelic': ['Psychedelic Rock', 'Psytrance', 'Psychedelic Pop', 'Space Rock', 'Krautrock'],
    'jazz': ['Bebop', 'Cool Jazz', 'Hard Bop', 'Free Jazz', 'Smooth Jazz', 'Acid Jazz'],
    'jazz_fusion': ['Jazz Fusion', 'Jazz Funk', 'Electric Jazz', 'Progressive Jazz'],
    'nu_jazz': ['Nu-Jazz', 'Jazz-House', 'Acid Jazz', 'Jazztronica']
};

function handleGenreChange(genre) {
    const subGenreLine = document.getElementById('subgenre-line');
    const subGenreSelect = document.getElementById('subgenre-select');
    
    if (!subGenreLine || !subGenreSelect) return;
    
    // Get sub-genres for this genre
    const subGenres = subGenreMap[genre] || [];
    
    // Clear existing options
    subGenreSelect.innerHTML = '<option value="">None</option>';
    
    if (subGenres.length > 0) {
        // Add sub-genre options
        subGenres.forEach(subGenre => {
            const option = document.createElement('option');
            option.value = subGenre.toLowerCase().replace(/\s+/g, '_');
            option.textContent = subGenre;
            subGenreSelect.appendChild(option);
        });
        
        // Show sub-genre line
        subGenreLine.style.display = 'flex';
    } else {
        // Hide sub-genre line if no sub-genres
        subGenreLine.style.display = 'none';
    }
    
    console.log('[Renderer] Genre changed to:', genre, 'Sub-genres:', subGenres.length);
}

// File Upload
async function handleFileUpload(file) {
    addAction(`Uploading ${file.name}...`, 'info');
    updateStatus('Processing', 'yellow');
    
    try {
        if (window.sergikAPI) {
            // In Electron renderer, file.path should be available
            let filePath = file.path;
            
            // If no path, try to get it from the file object
            if (!filePath && file.name) {
                // Trigger file selection dialog
                const fileResult = await window.sergikAPI.selectFileForAnalysis();
                if (fileResult.success) {
                    filePath = fileResult.filePath;
                } else {
                    throw new Error('No file path available');
                }
            }
            
            if (filePath) {
                const result = await window.sergikAPI.analyzeUpload(filePath);
        if (result.success) {
                    addAction(`File analyzed: ${file.name}`, 'success');
                    updateAnalysisData(result.data);
                    updateStatus('Ready', 'green');
        } else {
                    throw new Error(result.error);
                }
            } else {
                throw new Error('Could not determine file path');
            }
        } else {
            throw new Error('API not available');
        }
    } catch (error) {
        addAction(`Upload failed: ${error.message}`, 'error');
        updateStatus('Error', 'red');
    }
}

// URL Analyze
async function handleUrlAnalyze(url) {
    addAction(`Analyzing URL: ${url}...`, 'info');
    updateStatus('Processing', 'yellow');
    
    try {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.analyzeUrl(url);
        if (result.success) {
                addAction('URL analysis complete', 'success');
                updateAnalysisData(result.data);
                updateStatus('Ready', 'green');
        } else {
                throw new Error(result.error);
            }
        } else {
            throw new Error('API not available');
        }
    } catch (error) {
        addAction(`Analysis failed: ${error.message}`, 'error');
        updateStatus('Error', 'red');
    }
}

// Voice Recording
async function startRecording() {
    if (isRecording) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await processVoiceRecording(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        if (elements.micBtn) {
            elements.micBtn.classList.add('recording');
        }
        
        addAction('Recording...', 'info');
        updateStatus('Recording', 'red');
        
        if (window.sergikAPI) {
        await window.sergikAPI.setRecording(true);
        }
    } catch (error) {
        addAction(`Recording error: ${error.message}`, 'error');
        console.error('[Renderer] Recording failed:', error);
    }
}

async function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    mediaRecorder.stop();
    isRecording = false;
    
    if (elements.micBtn) {
        elements.micBtn.classList.remove('recording');
    }
    
    addAction('Processing recording...', 'info');
    updateStatus('Processing', 'yellow');
    
    if (window.sergikAPI) {
    await window.sergikAPI.setRecording(false);
    }
}

async function processVoiceRecording(audioBlob) {
    try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const buffer = Array.from(new Uint8Array(arrayBuffer));
        
        if (window.sergikAPI) {
        const result = await window.sergikAPI.processVoice(buffer);
        
        if (result.success) {
            const data = result.data;
                addAction(`Voice: "${data.text}"`, 'info');
                addAction(`Response: ${data.intent?.tts || 'Done'}`, 'success');
                updateStatus('Ready', 'green');
        } else {
                addAction(`Voice error: ${result.error}`, 'error');
                updateStatus('Error', 'red');
            }
        }
    } catch (error) {
        addAction(`Voice processing error: ${error.message}`, 'error');
        updateStatus('Error', 'red');
        console.error('[Renderer] Voice processing failed:', error);
    }
}

// Command Execution
async function handleCommand(command) {
    addAction(`Executing: ${command}`, 'info');
    
    if (elements.commandInput) {
        elements.commandInput.value = '';
    }
    
    await executeCommand(command);
}

async function executeCommand(command) {
    try {
        if (window.sergikAPI) {
        const result = await window.sergikAPI.liveCommand(command);
        if (result.success) {
                addAction(`Command executed: ${command}`, 'success');
        } else {
                addAction(`Error: ${result.error}`, 'error');
            }
        } else {
            addAction('API not available', 'error');
        }
    } catch (error) {
        addAction(`Error: ${error.message}`, 'error');
        console.error('[Renderer] Command execution failed:', error);
    }
}

// AI Chat
async function handleAiMessage(message) {
    // Add user message to chat
    addAiMessage('user', message);
    
    if (elements.aiInput) {
        elements.aiInput.value = '';
    }
    
    // Add thinking indicator
    const thinkingId = addAiMessage('assistant', 'Thinking...');
    
    try {
        if (window.sergikAPI) {
            const result = await window.sergikAPI.gptGenerate(message);
            
            // Remove thinking message
            const thinkingMsg = document.getElementById(thinkingId);
            if (thinkingMsg) {
                thinkingMsg.remove();
            }
            
            if (result.success) {
                const response = result.data.result?.description || result.data.result || 'Done';
                addAiMessage('assistant', response);
            } else {
                addAiMessage('assistant', `Error: ${result.error}`);
            }
        } else {
            // Remove thinking message
            const thinkingMsg = document.getElementById(thinkingId);
            if (thinkingMsg) {
                thinkingMsg.remove();
            }
            addAiMessage('assistant', 'API not available');
        }
    } catch (error) {
        // Remove thinking message
        const thinkingMsg = document.getElementById(thinkingId);
        if (thinkingMsg) {
            thinkingMsg.remove();
        }
        addAiMessage('assistant', `Error: ${error.message}`);
        console.error('[Renderer] AI message failed:', error);
    }
}

function addAiMessage(role, text) {
    if (!elements.aiMessages) return;
    
    const messageId = `ai-msg-${Date.now()}`;
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `ai-message ${role}`;
    messageDiv.textContent = text;
    
    elements.aiMessages.appendChild(messageDiv);
    elements.aiMessages.scrollTop = elements.aiMessages.scrollHeight;
    
    return messageId;
}

// Status Management
function updateStatus(text, color) {
    if (elements.statusTextDisplay) {
        elements.statusTextDisplay.textContent = text;
    }
    
    if (elements.statusLedDisplay) {
        elements.statusLedDisplay.className = 'status-led';
        if (color === 'green') {
            elements.statusLedDisplay.classList.add('connected');
        } else if (color === 'red') {
            elements.statusLedDisplay.classList.add('disconnected');
        }
    }
}

function addAction(message, type = 'info') {
    // Show notification
    if (window.showNotification) {
        const duration = type === 'error' ? 5000 : (type === 'success' ? 3000 : 3000);
        window.showNotification(message, type, duration);
    }
    
    // Also add to action list for backward compatibility
    if (!elements.actionList) return;
    
    const actionDiv = document.createElement('div');
    actionDiv.className = `action-item ${type}`;
    actionDiv.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    elements.actionList.insertBefore(actionDiv, elements.actionList.firstChild);
    
    // Keep only last 20 entries
    while (elements.actionList.children.length > 20) {
        elements.actionList.removeChild(elements.actionList.lastChild);
    }
}

// Analysis - removed duplicate, using the one at end of file

// Canvas Drawing Functions
// Performance: Canvas rendering with requestAnimationFrame
let canvasAnimationFrame = null;
let canvasCache = new Map();

function drawWaveform(mediaData) {
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    
    // Cancel any pending frame
    if (canvasAnimationFrame) {
        cancelAnimationFrame(canvasAnimationFrame);
    }
    
    // Use requestAnimationFrame for smooth rendering
    canvasAnimationFrame = requestAnimationFrame(() => {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 90;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw waveform if we have audio data
        if (mediaData.waveform || mediaData.audio_data) {
            const samples = mediaData.waveform || mediaData.audio_data || [];
            if (samples.length > 0) {
                ctx.strokeStyle = '#00d4aa';
                ctx.lineWidth = 1;
                ctx.beginPath();
                
                const step = width / samples.length;
                const centerY = height / 2;
                const amplitude = height * 0.4;
                
                for (let i = 0; i < samples.length; i++) {
                    const x = i * step;
                    const y = centerY + (samples[i] * amplitude);
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                ctx.stroke();
            }
        } else {
            // Draw placeholder
            ctx.strokeStyle = '#3a3a3a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
            
            // Draw text
            ctx.fillStyle = '#666666';
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText('No waveform data', width / 2, height / 2);
        }
    });
}

function drawPianoRoll(notes) {
    const canvas = document.getElementById('piano-roll-canvas');
    if (!canvas) return;
    
    // Cancel any pending frame
    if (canvasAnimationFrame) {
        cancelAnimationFrame(canvasAnimationFrame);
    }
    
    canvasAnimationFrame = requestAnimationFrame(() => {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 160;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        
        // Vertical lines (bars)
        const bars = 4;
        for (let i = 0; i <= bars; i++) {
            const x = (i / bars) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Horizontal lines (notes)
        const notesPerOctave = 12;
        const octaves = 4;
        for (let i = 0; i <= octaves * notesPerOctave; i++) {
            const y = (i / (octaves * notesPerOctave)) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw notes if provided
        if (notes && notes.length > 0) {
            notes.forEach(note => {
                const x = (note.start / (bars * 4)) * width; // Assuming 4/4 time
                const y = ((note.pitch % (octaves * notesPerOctave)) / (octaves * notesPerOctave)) * height;
                const w = (note.duration / (bars * 4)) * width;
                const h = height / (octaves * notesPerOctave);
                
                ctx.fillStyle = '#00d4aa';
                ctx.fillRect(x, y, w, h);
                ctx.strokeStyle = '#00a88a';
                ctx.strokeRect(x, y, w, h);
            });
        }
    });
}

function drawTimeline(tracks) {
    const ruler = document.getElementById('timeline-ruler');
    const tracksContainer = document.getElementById('timeline-tracks');
    
    if (ruler) {
        const ctx = ruler.getContext('2d');
        const width = ruler.width = ruler.offsetWidth;
        const height = ruler.height = 20;
        
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw time markers
        ctx.strokeStyle = '#666666';
        ctx.fillStyle = '#999999';
        ctx.font = '8px JetBrains Mono';
        ctx.textAlign = 'left';
        
        const bars = 8;
        for (let i = 0; i <= bars; i++) {
            const x = (i / bars) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            ctx.fillText(`${i}`, x + 2, height - 4);
        }
    }
    
    // Update tracks if provided
    if (tracks && tracksContainer) {
        // Tracks are already in HTML, just update them
    }
}

// Update editor when media is loaded
function updateEditorWithMedia(mediaData) {
    // Update waveform info
    if (mediaData.duration && document.getElementById('waveform-length')) {
        document.getElementById('waveform-length').textContent = formatDuration(mediaData.duration);
    }
    if (mediaData.bpm && document.getElementById('waveform-bpm')) {
        document.getElementById('waveform-bpm').textContent = mediaData.bpm;
    }
    if (mediaData.key && document.getElementById('clip-info-key')) {
        document.getElementById('clip-info-key').textContent = mediaData.key;
    }
    if (mediaData.bpm && document.getElementById('clip-info-bpm')) {
        document.getElementById('clip-info-bpm').textContent = mediaData.bpm;
    }
    
    // Draw waveforms/notes based on active editor
    const activeEditor = document.querySelector('.editor-content.active');
    if (activeEditor) {
        if (activeEditor.id === 'editor-waveform') {
            drawWaveform(mediaData);
        } else if (activeEditor.id === 'editor-piano-roll') {
            drawPianoRoll(mediaData.notes || []);
        } else if (activeEditor.id === 'editor-timeline') {
            drawTimeline(mediaData.tracks || []);
        }
    }
}

// Update analysis data display
function updateAnalysisData(data) {
    // DNA Score
    if (data.sergik_dna?.score !== undefined && elements.dnaScore) {
        const score = Math.round(data.sergik_dna.score * 100);
        elements.dnaScore.textContent = `${score}%`;
    }
    
    if (data.sergik_dna?.score !== undefined && elements.dnaFill) {
        const score = Math.round(data.sergik_dna.score * 100);
        elements.dnaFill.style.width = `${score}%`;
    }
    
    // Genre bars
    if (data.sergik_dna?.genres && elements.genreBars) {
        elements.genreBars.innerHTML = '';
        Object.entries(data.sergik_dna.genres).forEach(([genre, value]) => {
            const barDiv = document.createElement('div');
            barDiv.className = 'genre-bar';
            const percentage = Math.round(value * 100);
            barDiv.innerHTML = `
                <div class="genre-bar-header">
                    <span class="genre-bar-name">${genre}</span>
                    <span class="genre-bar-value">${percentage}%</span>
                </div>
                <div class="genre-bar-track">
                    <div class="genre-bar-fill ${genre.toLowerCase()}" style="width: ${percentage}%"></div>
                </div>
            `;
            elements.genreBars.appendChild(barDiv);
        });
    }
    
    // MusicBrainz data
    if (data.musicbrainz) {
        const mb = data.musicbrainz;
        if (mb.title && document.getElementById('mb-track-title')) {
            document.getElementById('mb-track-title').textContent = mb.title;
        }
        if (mb.artist && document.getElementById('mb-track-artist')) {
            document.getElementById('mb-track-artist').textContent = mb.artist;
        }
        if (mb.album && document.getElementById('mb-track-album')) {
            document.getElementById('mb-track-album').textContent = mb.album;
        }
        if (mb.tags && document.getElementById('mb-tags')) {
            const tagsContainer = document.getElementById('mb-tags');
            tagsContainer.innerHTML = '';
            mb.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'mb-tag';
                tagSpan.textContent = tag;
                tagsContainer.appendChild(tagSpan);
            });
        }
    }
    
    // Features
    if (data.features) {
        const f = data.features;
        if (f.bpm && document.getElementById('feature-bpm')) {
            document.getElementById('feature-bpm').textContent = Math.round(f.bpm);
        }
        if (f.key && document.getElementById('feature-key')) {
            document.getElementById('feature-key').textContent = f.key;
        }
        if (f.energy && document.getElementById('feature-energy')) {
            document.getElementById('feature-energy').textContent = Math.round(f.energy);
        }
        if (f.lufs && document.getElementById('feature-lufs')) {
            document.getElementById('feature-lufs').textContent = f.lufs.toFixed(1);
        }
        if (f.spectral_centroid && document.getElementById('feature-centroid')) {
            document.getElementById('feature-centroid').textContent = `${Math.round(f.spectral_centroid)} Hz`;
        }
        if (f.stereo_width && document.getElementById('feature-width')) {
            document.getElementById('feature-width').textContent = f.stereo_width.toFixed(2);
        }
    }
}

// ============================================================================
// Idea Analyzer - Auto-detect and auto-fill from idea input
// ============================================================================

// Genre keyword mapping
const GENRE_KEYWORDS = {
    'tech house': 'tech_house',
    'techhouse': 'tech_house',
    'house': 'house',
    'deep house': 'deep_house',
    'techno': 'techno',
    'hip hop': 'hiphop',
    'hiphop': 'hiphop',
    'hip-hop': 'hiphop',
    'boom bap': 'boom_bap',
    'boombap': 'boom_bap',
    'trap': 'trap',
    'lo-fi': 'lo_fi',
    'lofi': 'lo_fi',
    'lo fi': 'lo_fi',
    'drill': 'drill',
    'drum and bass': 'dnb',
    'drum & bass': 'dnb',
    'dnb': 'dnb',
    'jungle': 'jungle',
    'reggaeton': 'reggaeton',
    'reggae': 'reggae',
    'ambient': 'ambient',
    'downtempo': 'downtempo',
    'funk': 'funk',
    'soul': 'soul',
    'disco': 'disco',
    'jazz': 'jazz',
    'trance': 'trance',
    'progressive house': 'progressive_house',
    'minimal': 'minimal',
    'acid house': 'acid_house',
    'hard techno': 'hard_techno',
    'bass': 'bass',
    'experimental': 'experimental',
    'breakbeat': 'breakbeat',
    'garage': 'garage',
    '2-step': '2step',
    'salsa': 'salsa',
    'bossa nova': 'bossa_nova',
    'samba': 'samba',
    'chillout': 'chillout',
    'trip-hop': 'trip_hop',
    'trip hop': 'trip_hop',
    'r&b': 'r_and_b',
    'r and b': 'r_and_b',
    'neo-soul': 'neo_soul',
    'indie rock': 'indie_rock',
    'alternative': 'alternative',
    'post-rock': 'post_rock',
    'post rock': 'post_rock',
    'psychedelic': 'psychedelic',
    'jazz fusion': 'jazz_fusion',
    'nu-jazz': 'nu_jazz',
    'nu jazz': 'nu_jazz'
};

// Energy keyword mapping
const ENERGY_KEYWORDS = {
    'ambient': 1,
    'very low': 1,
    'very low energy': 1,
    'chill': 2,
    'low': 2,
    'low energy': 2,
    'lo-fi': 3,
    'lofi': 3,
    'downtempo': 4,
    'mid': 5,
    'mid energy': 5,
    'groove': 6,
    'groovy': 6,
    'upbeat': 7,
    'high': 8,
    'high energy': 8,
    'peak time': 9,
    'peak': 9,
    'festival': 10,
    'intense': 9,
    'aggressive': 9
};

// Intelligence keyword mapping
const INTELLIGENCE_KEYWORDS = {
    'groovy': 'groovy',
    'funky': 'groovy',
    'rhythmic': 'groovy',
    'chill': 'chill',
    'relaxed': 'chill',
    'mellow': 'chill',
    'intense': 'intense',
    'aggressive': 'intense',
    'powerful': 'intense',
    'calm': 'calm',
    'serene': 'calm',
    'peaceful': 'calm',
    'social': 'social',
    'party': 'social',
    'productivity': 'productivity',
    'focus': 'productivity',
    'work': 'productivity',
    'creative': 'creative',
    'artistic': 'creative',
    'dance floor': 'dance_floor',
    'club': 'dance_floor',
    'festival': 'dance_floor',
    'background': 'background',
    'ambient': 'background',
    'workout': 'workout',
    'gym': 'workout',
    'cardio': 'workout'
};

// Key notation patterns
const KEY_PATTERNS = [
    { pattern: /(\d+[AB])\s*(?:\([^)]+\))?/gi, extract: (match) => match[1] },
    { pattern: /([CDEFGAB][#b]?)\s*(?:major|maj)/gi, extract: (match) => {
        const keyMap = {
            'C': '8B', 'C#': '3B', 'Db': '3B',
            'D': '10B', 'D#': '5B', 'Eb': '5B',
            'E': '12B', 'F': '7B',
            'F#': '2B', 'Gb': '2B',
            'G': '9B', 'G#': '4B', 'Ab': '4B',
            'A': '11B', 'A#': '6B', 'Bb': '6B',
            'B': '1B'
        };
        return keyMap[match[1]] || null;
    }},
    { pattern: /([CDEFGAB][#b]?)\s*(?:minor|min|m)(?:\s|$)/gi, extract: (match) => {
        const keyMap = {
            'C': '5A', 'C#': '12A', 'Db': '12A',
            'D': '7A', 'D#': '2A', 'Eb': '2A',
            'E': '9A', 'F': '4A',
            'F#': '11A', 'Gb': '11A',
            'G': '6A', 'G#': '1A', 'Ab': '1A',
            'A': '8A', 'A#': '3A', 'Bb': '3A',
            'B': '10A'
        };
        return keyMap[match[1]] || null;
    }}
];

// Key notation mapping (Camelot <-> Standard)
const KEY_NOTATION_MAP = {
    // Minor keys
    '1A': { standard: 'Ab minor', camelot: '1A' },
    '2A': { standard: 'Eb minor', camelot: '2A' },
    '3A': { standard: 'Bb minor', camelot: '3A' },
    '4A': { standard: 'F minor', camelot: '4A' },
    '5A': { standard: 'C minor', camelot: '5A' },
    '6A': { standard: 'G minor', camelot: '6A' },
    '7A': { standard: 'D minor', camelot: '7A' },
    '8A': { standard: 'A minor', camelot: '8A' },
    '9A': { standard: 'E minor', camelot: '9A' },
    '10A': { standard: 'B minor', camelot: '10A' },
    '11A': { standard: 'F# minor', camelot: '11A' },
    '12A': { standard: 'Db minor', camelot: '12A' },
    // Major keys
    '1B': { standard: 'B major', camelot: '1B' },
    '2B': { standard: 'F# major', camelot: '2B' },
    '3B': { standard: 'Db major', camelot: '3B' },
    '4B': { standard: 'Ab major', camelot: '4B' },
    '5B': { standard: 'Eb major', camelot: '5B' },
    '6B': { standard: 'Bb major', camelot: '6B' },
    '7B': { standard: 'F major', camelot: '7B' },
    '8B': { standard: 'C major', camelot: '8B' },
    '9B': { standard: 'G major', camelot: '9B' },
    '10B': { standard: 'D major', camelot: '10B' },
    '11B': { standard: 'A major', camelot: '11B' },
    '12B': { standard: 'E major', camelot: '12B' }
};

// All Camelot keys for dropdown
const CAMELOT_KEYS = [
    { value: '1A', label: '1A (Ab minor)' },
    { value: '2A', label: '2A (Eb minor)' },
    { value: '3A', label: '3A (Bb minor)' },
    { value: '4A', label: '4A (F minor)' },
    { value: '5A', label: '5A (C minor)' },
    { value: '6A', label: '6A (G minor)' },
    { value: '7A', label: '7A (D minor)' },
    { value: '8A', label: '8A (A minor)' },
    { value: '9A', label: '9A (E minor)' },
    { value: '10A', label: '10A (B minor)' },
    { value: '11A', label: '11A (F# minor)' },
    { value: '12A', label: '12A (Db minor)' },
    { value: '1B', label: '1B (B major)' },
    { value: '2B', label: '2B (F# major)' },
    { value: '3B', label: '3B (Db major)' },
    { value: '4B', label: '4B (Ab major)' },
    { value: '5B', label: '5B (Eb major)' },
    { value: '6B', label: '6B (Bb major)' },
    { value: '7B', label: '7B (F major)' },
    { value: '8B', label: '8B (C major)' },
    { value: '9B', label: '9B (G major)' },
    { value: '10B', label: '10B (D major)' },
    { value: '11B', label: '11B (A major)' },
    { value: '12B', label: '12B (E major)' }
];

// Scale patterns
const SCALE_PATTERNS = {
    'major': ['major', 'maj', 'ionian'],
    'minor': ['minor', 'min', 'aeolian', 'natural minor'],
    'dorian': ['dorian'],
    'phrygian': ['phrygian'],
    'lydian': ['lydian'],
    'mixolydian': ['mixolydian'],
    'locrian': ['locrian'],
    'harmonic_minor': ['harmonic minor', 'harmonic'],
    'melodic_minor': ['melodic minor', 'melodic'],
    'pent_major': ['pentatonic major', 'pent major'],
    'pent_minor': ['pentatonic minor', 'pent minor'],
    'blues': ['blues']
};

// IdeaAnalyzer class
class IdeaAnalyzer {
    analyze(ideaText) {
        if (!ideaText || typeof ideaText !== 'string') {
            return {
                genre: null,
                tempo: null,
                energy: null,
                key: null,
                scale: null,
                intelligence: null
            };
        }
        
        const normalized = ideaText.toLowerCase().trim();
        
        return {
            genre: this.extractGenre(normalized),
            tempo: this.extractTempo(normalized),
            energy: this.extractEnergy(normalized),
            key: this.extractKey(normalized),
            scale: this.extractScale(normalized),
            intelligence: this.extractIntelligence(normalized)
        };
    }
    
    extractGenre(text) {
        const sortedKeywords = Object.keys(GENRE_KEYWORDS).sort((a, b) => b.length - a.length);
        for (const keyword of sortedKeywords) {
            if (text.includes(keyword)) {
                return GENRE_KEYWORDS[keyword];
            }
        }
        return null;
    }
    
    extractTempo(text) {
        const bpmPatterns = [
            /(\d{2,3})\s*bpm/gi,
            /(\d{2,3})bpm/gi,
            /at\s+(\d{2,3})/gi,
            /tempo\s+(\d{2,3})/gi,
            /(\d{2,3})\s+tempo/gi
        ];
        
        for (const pattern of bpmPatterns) {
            const match = pattern.exec(text);
            if (match) {
                const tempo = parseInt(match[1], 10);
                if (tempo >= 60 && tempo <= 200) {
                    return tempo;
                }
            }
        }
        return null;
    }
    
    extractEnergy(text) {
        const sortedKeywords = Object.keys(ENERGY_KEYWORDS).sort((a, b) => b.length - a.length);
        for (const keyword of sortedKeywords) {
            if (text.includes(keyword)) {
                return ENERGY_KEYWORDS[keyword];
            }
        }
        
        const energyPatterns = [
            /energy\s+(\d{1,2})/gi,
            /level\s+(\d{1,2})/gi,
            /energy\s+(\d{1,2})\s*\/\s*10/gi
        ];
        
        for (const pattern of energyPatterns) {
            const match = pattern.exec(text);
            if (match) {
                const energy = parseInt(match[1], 10);
                if (energy >= 1 && energy <= 10) {
                    return energy;
                }
            }
        }
        return null;
    }
    
    extractKey(text) {
        const camelotMatch = text.match(/(\d+[AB])/i);
        if (camelotMatch) {
            return camelotMatch[1].toUpperCase();
        }
        
        for (const keyPattern of KEY_PATTERNS) {
            const match = keyPattern.pattern.exec(text);
            if (match) {
                const key = keyPattern.extract(match);
                if (key) return key;
            }
        }
        return null;
    }
    
    extractScale(text) {
        for (const [scale, patterns] of Object.entries(SCALE_PATTERNS)) {
            for (const pattern of patterns) {
                if (text.includes(pattern)) {
                    return scale;
                }
            }
        }
        return null;
    }
    
    extractIntelligence(text) {
        const sortedKeywords = Object.keys(INTELLIGENCE_KEYWORDS).sort((a, b) => b.length - a.length);
        for (const keyword of sortedKeywords) {
            if (text.includes(keyword)) {
                return INTELLIGENCE_KEYWORDS[keyword];
            }
        }
        return null;
    }
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize idea analyzer and auto-fill
function setupIdeaAnalyzer() {
    const ideaInput = elements.ideaInput;
    if (!ideaInput) return;
    
    const ideaAnalyzer = new IdeaAnalyzer();
    
    const analyzeIdea = debounce((ideaText) => {
        if (!ideaText || ideaText.trim() === '') return;
        
        const suggestions = ideaAnalyzer.analyze(ideaText);
        
        // Auto-fill genre if detected
        if (suggestions.genre && elements.genreSelect) {
            const option = elements.genreSelect.querySelector(`option[value="${suggestions.genre}"]`);
            if (option) {
                elements.genreSelect.value = suggestions.genre;
                // Trigger change event to update sub-genres
                elements.genreSelect.dispatchEvent(new Event('change', { bubbles: true }));
                addAction(`Auto-filled genre: ${suggestions.genre}`, 'info');
            }
        }
        
        // Auto-fill tempo if detected (only if Follow Live is disabled)
        if (suggestions.tempo && elements.tempoSelect) {
            const followToggle = document.getElementById('tempo-follow-toggle');
            if (!followToggle || !followToggle.checked) {
                const closestOption = Array.from(elements.tempoSelect.options)
                    .reduce((closest, opt) => {
                        const optValue = parseInt(opt.value, 10);
                        if (isNaN(optValue)) return closest;
                        const currentDiff = Math.abs(parseInt(closest.value, 10) - suggestions.tempo);
                        const optDiff = Math.abs(optValue - suggestions.tempo);
                        return optDiff < currentDiff ? opt : closest;
                    });
                if (closestOption) {
                    elements.tempoSelect.value = closestOption.value;
                    addAction(`Auto-filled tempo: ${suggestions.tempo} BPM`, 'info');
                }
            }
        }
        
        // Auto-fill energy if detected
        if (suggestions.energy && elements.energySelect) {
            const option = elements.energySelect.querySelector(`option[value="${suggestions.energy}"]`);
            if (option) {
                elements.energySelect.value = suggestions.energy.toString();
                addAction(`Auto-filled energy: ${suggestions.energy}`, 'info');
            }
        }
        
        // Auto-fill key if detected
        if (suggestions.key && elements.keySelect) {
            const option = elements.keySelect.querySelector(`option[value="${suggestions.key}"]`);
            if (option) {
                elements.keySelect.value = suggestions.key;
                addAction(`Auto-filled key: ${suggestions.key}`, 'info');
            }
        }
        
        // Auto-fill scale if detected
        if (suggestions.scale && elements.scaleSelect) {
            const option = elements.scaleSelect.querySelector(`option[value="${suggestions.scale}"]`);
            if (option) {
                elements.scaleSelect.value = suggestions.scale;
                addAction(`Auto-filled scale: ${suggestions.scale}`, 'info');
            }
        }
        
        // Auto-fill intelligence if detected
        if (suggestions.intelligence) {
            const intelligenceSelect = document.getElementById('intelligence-select');
            if (intelligenceSelect) {
                const option = intelligenceSelect.querySelector(`option[value="${suggestions.intelligence}"]`);
                if (option) {
                    intelligenceSelect.value = suggestions.intelligence;
                    intelligenceSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    addAction(`Auto-filled intelligence: ${suggestions.intelligence}`, 'info');
                }
            }
        }
    }, 500);
    
    ideaInput.addEventListener('input', (e) => {
        analyzeIdea(e.target.value);
    });
}

// ============================================================================
// Info Popup System - Tooltips on hover
// ============================================================================

(function() {
    let popupElement = null;
    let popupTimer = null;
    let currentElement = null;
    const HOVER_DELAY = 1000; // 1 second
    
    // Detect platform
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    // Create popup element
    function createInfoPopup() {
        if (popupElement) return popupElement;
        
        popupElement = document.createElement('div');
        popupElement.className = 'info-popup';
        popupElement.id = 'info-popup';
        popupElement.innerHTML = `
            <div class="info-popup-arrow"></div>
            <div class="info-popup-title"></div>
            <div class="info-popup-desc"></div>
            <div class="info-popup-shortcut"></div>
        `;
        document.body.appendChild(popupElement);
        return popupElement;
    }
    
    // Format shortcut for platform
    function formatShortcut(shortcut) {
        if (!shortcut) return null;
        if (isMac) {
            return shortcut.replace(/Ctrl\+/g, 'Cmd+').replace(/Alt\+/g, 'Option+');
        }
        return shortcut;
    }
    
    // Get element info from data attributes
    function getElementInfo(element) {
        if (!element || typeof element.getAttribute !== 'function') {
            return null;
        }
        
        const title = element.getAttribute('data-info-title');
        const desc = element.getAttribute('data-info-desc');
        const shortcut = element.getAttribute('data-info-shortcut');
        
        if (!title && !desc) return null;
        
        return {
            title: title || '',
            desc: desc || '',
            shortcut: formatShortcut(shortcut)
        };
    }
    
    // Calculate popup position
    function calculatePopupPosition(element) {
        const rect = element.getBoundingClientRect();
        const popup = popupElement;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Default: below element
        let top = rect.bottom + scrollY + 6;
        let left = rect.left + scrollX + (rect.width / 2);
        let position = 'below';
        
        // Check if popup would overflow viewport
        const popupWidth = 250; // max-width
        const popupHeight = 100; // estimated
        
        // Check bottom overflow
        if (rect.bottom + popupHeight + 12 > viewportHeight) {
            // Show above instead
            top = rect.top + scrollY - popupHeight - 6;
            position = 'above';
        }
        
        // Check right overflow
        if (left + popupWidth / 2 > viewportWidth) {
            left = viewportWidth - popupWidth / 2 - 10;
        }
        
        // Check left overflow
        if (left - popupWidth / 2 < 0) {
            left = popupWidth / 2 + 10;
        }
        
        return { top, left, position };
    }
    
    // Show popup
    function showInfoPopup(element, info) {
        if (!info) return;
        
        const popup = createInfoPopup();
        const pos = calculatePopupPosition(element);
        
        // Update content
        popup.querySelector('.info-popup-title').textContent = info.title;
        popup.querySelector('.info-popup-desc').textContent = info.desc;
        
        const shortcutEl = popup.querySelector('.info-popup-shortcut');
        if (info.shortcut) {
            shortcutEl.innerHTML = `Shortcut: <kbd>${info.shortcut}</kbd>`;
            shortcutEl.style.display = 'block';
        } else {
            shortcutEl.style.display = 'none';
        }
        
        // Position popup
        popup.style.top = pos.top + 'px';
        popup.style.left = pos.left + 'px';
        popup.style.transform = 'translateX(-50%)';
        
        // Update arrow position
        if (pos.position === 'above') {
            popup.classList.add('above');
        } else {
            popup.classList.remove('above');
        }
        
        // Show with animation
        setTimeout(() => {
            popup.classList.add('visible');
        }, 10);
        
        currentElement = element;
    }
    
    // Hide popup
    function hideInfoPopup() {
        if (popupElement) {
            popupElement.classList.remove('visible');
        }
        if (popupTimer) {
            clearTimeout(popupTimer);
            popupTimer = null;
        }
        currentElement = null;
    }
    
    // Handle mouse enter
    function handleMouseEnter(e) {
        const element = e.target;
        const info = getElementInfo(element);
        
        if (!info) return;
        
        // Clear any existing timer
        if (popupTimer) {
            clearTimeout(popupTimer);
            popupTimer = null;
        }
        
        // Hide current popup if different element
        if (currentElement && currentElement !== element) {
            hideInfoPopup();
        }
        
        // Set timer to show popup after delay
        popupTimer = setTimeout(() => {
            if (currentElement !== element) {
                showInfoPopup(element, info);
            }
        }, HOVER_DELAY);
    }
    
    // Handle mouse leave
    function handleMouseLeave(e) {
        if (popupTimer) {
            clearTimeout(popupTimer);
            popupTimer = null;
        }
        hideInfoPopup();
    }
    
    // Initialize popup system
    function initInfoPopupSystem() {
        console.log('[InfoPopup] Initializing info popup system...');
        
        // Use mouseover/mouseout for proper event delegation
        document.addEventListener('mouseover', function(e) {
            // Check if element or parent has data attributes
            let element = e.target;
            let info = null;
            
            // Check element and parents up to 5 levels
            for (let i = 0; i < 5 && element && element !== document.body; i++) {
                // Skip text nodes and other non-elements
                if (element.nodeType === Node.ELEMENT_NODE) {
                    info = getElementInfo(element);
                    if (info) {
                        // Don't show if we're already showing for this element
                        if (currentElement === element) {
                            return;
                        }
                        break;
                    }
                }
                element = element.parentElement;
            }
            
            if (info && element && element.nodeType === Node.ELEMENT_NODE && typeof element.getAttribute === 'function') {
                handleMouseEnter({ target: element });
            }
        }, true);
        
        document.addEventListener('mouseout', function(e) {
            let element = e.target;
            let hasInfo = false;
            let infoElement = null;
            
            // Check if leaving an element with info
            for (let i = 0; i < 5 && element && element !== document.body; i++) {
                // Skip text nodes and other non-elements
                if (element.nodeType === Node.ELEMENT_NODE) {
                    if (getElementInfo(element)) {
                        hasInfo = true;
                        infoElement = element;
                        break;
                    }
                }
                element = element.parentElement;
            }
            
            // Also check if we're moving to a related target that has info
            let relatedTarget = e.relatedTarget;
            if (relatedTarget) {
                for (let i = 0; i < 5 && relatedTarget && relatedTarget !== document.body; i++) {
                    if (relatedTarget.nodeType === Node.ELEMENT_NODE && getElementInfo(relatedTarget)) {
                        // Moving to another element with info, don't hide
                        return;
                    }
                    if (relatedTarget.parentElement) {
                        relatedTarget = relatedTarget.parentElement;
                    } else {
                        break;
                    }
                }
            }
            
            if (hasInfo && infoElement === currentElement) {
                handleMouseLeave(e);
            }
        }, true);
        
        console.log('[InfoPopup] Info popup system initialized');
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInfoPopupSystem);
    } else {
        initInfoPopupSystem();
    }
})();

// ============================================================================
// Advanced Key/Scale Features
// ============================================================================

let keyHistory = [];
let keyNotationMode = 'camelot'; // 'camelot', 'standard', 'hybrid'

// Setup advanced key panel
function setupAdvancedKeyPanel() {
    const toggleBtn = document.getElementById('key-advanced-toggle');
    const panel = document.getElementById('advanced-key-panel');
    const closeBtn = document.getElementById('advanced-key-close');
    const keySelect = document.getElementById('key-select');
    const scaleSelect = document.getElementById('scale-select');
    
    if (!toggleBtn || !panel) return;
    
    // Load saved preferences
    const savedNotation = localStorage.getItem('key-notation-mode');
    if (savedNotation && ['camelot', 'standard', 'hybrid'].includes(savedNotation)) {
        keyNotationMode = savedNotation;
    }
    
    // Load key history
    const savedHistory = localStorage.getItem('key-history');
    if (savedHistory) {
        try {
            keyHistory = JSON.parse(savedHistory);
        } catch (e) {
            keyHistory = [];
        }
    }
    
    // Initialize key dropdown with all keys
    updateKeyDropdown();
    
    // Toggle panel
    toggleBtn.addEventListener('click', () => {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            updateAdvancedKeyPanel();
        }
    });
    
    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
        });
    }
    
    // Notation toggle buttons
    document.querySelectorAll('[data-notation]').forEach(btn => {
        btn.addEventListener('click', () => {
            keyNotationMode = btn.getAttribute('data-notation');
            localStorage.setItem('key-notation-mode', keyNotationMode);
            updateNotationButtons();
            updateKeyDropdown();
            updateAdvancedKeyPanel();
        });
    });
    
    // Key change handler
    if (keySelect) {
        keySelect.addEventListener('change', () => {
            addToKeyHistory(keySelect.value);
            updateAdvancedKeyPanel();
        });
    }
    
    // Scale change handler
    if (scaleSelect) {
        scaleSelect.addEventListener('change', () => {
            updateAdvancedKeyPanel();
        });
    }
    
    // Quick action buttons
    document.getElementById('key-relative')?.addEventListener('click', () => {
        const relative = getRelativeKey(keySelect.value);
        if (relative) {
            keySelect.value = relative;
            keySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    
    document.getElementById('key-parallel')?.addEventListener('click', () => {
        const parallel = getParallelKey(keySelect.value);
        if (parallel) {
            keySelect.value = parallel;
            keySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    
    document.getElementById('key-up')?.addEventListener('click', () => {
        const next = getNextKey(keySelect.value, 1);
        if (next) {
            keySelect.value = next;
            keySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    
    document.getElementById('key-down')?.addEventListener('click', () => {
        const next = getNextKey(keySelect.value, -1);
        if (next) {
            keySelect.value = next;
            keySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    
    // Initialize
    updateNotationButtons();
    updateAdvancedKeyPanel();
}

function updateKeyDropdown() {
    const keySelect = document.getElementById('key-select');
    if (!keySelect) return;
    
    const currentValue = keySelect.value || '10B';
    
    // Clear options
    keySelect.innerHTML = '';
    
    // Add optgroups
    if (keyNotationMode === 'camelot') {
        const minorGroup = document.createElement('optgroup');
        minorGroup.label = 'Minor Keys (A)';
        const majorGroup = document.createElement('optgroup');
        majorGroup.label = 'Major Keys (B)';
        
        CAMELOT_KEYS.forEach(key => {
            const option = document.createElement('option');
            option.value = key.value;
            option.textContent = key.label;
            if (key.value === currentValue) {
                option.selected = true;
            }
            
            if (key.value.endsWith('A')) {
                minorGroup.appendChild(option);
            } else {
                majorGroup.appendChild(option);
            }
        });
        
        keySelect.appendChild(minorGroup);
        keySelect.appendChild(majorGroup);
    } else if (keyNotationMode === 'standard') {
        const minorGroup = document.createElement('optgroup');
        minorGroup.label = 'Minor Keys';
        const majorGroup = document.createElement('optgroup');
        majorGroup.label = 'Major Keys';
        
        CAMELOT_KEYS.forEach(key => {
            const option = document.createElement('option');
            option.value = key.value; // Always use Camelot value internally
            const standardName = KEY_NOTATION_MAP[key.value]?.standard || key.value;
            option.textContent = standardName;
            if (key.value === currentValue) {
                option.selected = true;
            }
            
            if (key.value.endsWith('A')) {
                minorGroup.appendChild(option);
            } else {
                majorGroup.appendChild(option);
            }
        });
        
        keySelect.appendChild(minorGroup);
        keySelect.appendChild(majorGroup);
    } else { // hybrid
        const minorGroup = document.createElement('optgroup');
        minorGroup.label = 'Minor Keys';
        const majorGroup = document.createElement('optgroup');
        majorGroup.label = 'Major Keys';
        
        CAMELOT_KEYS.forEach(key => {
            const option = document.createElement('option');
            option.value = key.value;
            const standardName = KEY_NOTATION_MAP[key.value]?.standard || key.value;
            option.textContent = `${key.value} (${standardName})`;
            if (key.value === currentValue) {
                option.selected = true;
            }
            
            if (key.value.endsWith('A')) {
                minorGroup.appendChild(option);
            } else {
                majorGroup.appendChild(option);
            }
        });
        
        keySelect.appendChild(minorGroup);
        keySelect.appendChild(majorGroup);
    }
}

function updateAdvancedKeyPanel() {
    const keySelect = document.getElementById('key-select');
    const scaleSelect = document.getElementById('scale-select');
    if (!keySelect) return;
    
    const currentKey = keySelect.value;
    
    // Update current key display
    const currentKeyDisplay = document.getElementById('current-key-display');
    const currentScaleDisplay = document.getElementById('current-scale-display');
    if (currentKeyDisplay) {
        currentKeyDisplay.textContent = formatKeyDisplay(currentKey);
    }
    if (currentScaleDisplay && scaleSelect) {
        const scaleText = scaleSelect.options[scaleSelect.selectedIndex].text;
        currentScaleDisplay.textContent = scaleText.split(' ')[0]; // Just the scale name
    }
    
    // Update compatible keys
    updateCompatibleKeys(currentKey);
    
    // Update scale suggestions
    updateScaleSuggestions(currentKey);
    
    // Update key history
    updateKeyHistory();
}

function updateCompatibleKeys(key) {
    const container = document.getElementById('compatible-keys');
    if (!container) return;
    
    container.innerHTML = '';
    
    const compatible = getCompatibleKeys(key);
    compatible.forEach(comp => {
        if (!comp.key) return;
        
        const chip = document.createElement('button');
        chip.className = 'key-chip ' + comp.type;
        chip.textContent = formatKeyDisplay(comp.key);
        chip.title = comp.description;
        chip.addEventListener('click', () => {
            const keySelect = document.getElementById('key-select');
            if (keySelect) {
                keySelect.value = comp.key;
                keySelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        container.appendChild(chip);
    });
}

function updateScaleSuggestions(key) {
    const container = document.getElementById('scale-suggestions');
    if (!container) return;
    
    container.innerHTML = '';
    
    const isMinor = key.endsWith('A');
    const suggestions = isMinor 
        ? ['minor', 'dorian', 'phrygian', 'harmonic_minor', 'pent_minor']
        : ['major', 'mixolydian', 'lydian', 'pent_major'];
    
    suggestions.forEach(scale => {
        const chip = document.createElement('button');
        chip.className = 'key-chip';
        chip.textContent = scale.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        chip.addEventListener('click', () => {
            const scaleSelect = document.getElementById('scale-select');
            if (scaleSelect) {
                scaleSelect.value = scale;
                scaleSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        container.appendChild(chip);
    });
}

function updateKeyHistory() {
    const container = document.getElementById('key-history');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (keyHistory.length === 0) {
        container.innerHTML = '<span style="color: var(--text-tertiary); font-size: 9px;">No recent keys</span>';
        return;
    }
    
    const recent = keyHistory.slice(-6).reverse();
    recent.forEach(key => {
        const chip = document.createElement('button');
        chip.className = 'key-chip';
        chip.textContent = formatKeyDisplay(key);
        chip.addEventListener('click', () => {
            const keySelect = document.getElementById('key-select');
            if (keySelect) {
                keySelect.value = key;
                keySelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        container.appendChild(chip);
    });
}

function addToKeyHistory(key) {
    if (!key) return;
    
    // Remove if exists
    const index = keyHistory.indexOf(key);
    if (index > -1) keyHistory.splice(index, 1);
    
    // Add to front
    keyHistory.push(key);
    
    // Limit to 20
    if (keyHistory.length > 20) keyHistory.shift();
    
    // Save
    localStorage.setItem('key-history', JSON.stringify(keyHistory));
}

function getCompatibleKeys(key) {
    if (!key) return [];
    
    const num = parseInt(key.replace(/[AB]/g, ''));
    const type = key.endsWith('A') ? 'A' : 'B';
    
    const compatible = [
        { key: key, type: 'perfect', description: 'Current key' }
    ];
    
    // +1 and -1 on wheel
    const next1 = getNextKey(key, 1);
    const prev1 = getNextKey(key, -1);
    if (next1) compatible.push({ key: next1, type: 'compatible', description: '+1 on wheel' });
    if (prev1) compatible.push({ key: prev1, type: 'compatible', description: '-1 on wheel' });
    
    // Relative key
    const relative = getRelativeKey(key);
    if (relative) compatible.push({ key: relative, type: 'compatible', description: 'Relative key' });
    
    return compatible;
}

function getNextKey(key, direction) {
    if (!key) return null;
    
    const num = parseInt(key.replace(/[AB]/g, ''));
    const type = key.endsWith('A') ? 'A' : 'B';
    let nextNum = num + direction;
    
    if (nextNum < 1) nextNum = 12;
    if (nextNum > 12) nextNum = 1;
    
    return `${nextNum}${type}`;
}

function getRelativeKey(key) {
    if (!key) return null;
    
    // Relative major/minor (same number, opposite type)
    const num = parseInt(key.replace(/[AB]/g, ''));
    const type = key.endsWith('A') ? 'B' : 'A';
    return `${num}${type}`;
}

function getParallelKey(key) {
    if (!key) return null;
    
    // Parallel major/minor (same root note, different quality)
    const parallelMap = {
        '8B': '5A', '5A': '8B', // C major <-> C minor
        '9B': '6A', '6A': '9B', // G major <-> G minor
        '10B': '7A', '7A': '10B', // D major <-> D minor
        '11B': '8A', '8A': '11B', // A major <-> A minor
        '12B': '9A', '9A': '12B', // E major <-> E minor
        '1B': '10A', '10A': '1B', // B major <-> B minor
        '2B': '11A', '11A': '2B', // F# major <-> F# minor
        '3B': '12A', '12A': '3B', // Db major <-> Db minor
        '4B': '1A', '1A': '4B', // Ab major <-> Ab minor
        '5B': '2A', '2A': '5B', // Eb major <-> Eb minor
        '6B': '3A', '3A': '6B', // Bb major <-> Bb minor
        '7B': '4A', '4A': '7B'  // F major <-> F minor
    };
    
    return parallelMap[key] || null;
}

function formatKeyDisplay(key) {
    if (!key) return '';
    
    if (keyNotationMode === 'camelot') {
        return key;
    } else if (keyNotationMode === 'standard') {
        return KEY_NOTATION_MAP[key]?.standard || key;
    } else { // hybrid
        const standard = KEY_NOTATION_MAP[key]?.standard || '';
        return standard ? `${key} (${standard})` : key;
    }
}

function updateNotationButtons() {
    document.querySelectorAll('[data-notation]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-notation') === keyNotationMode);
    });
}

console.log('[Renderer] Script loaded');

