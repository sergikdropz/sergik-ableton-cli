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

// DOM Elements - Initialize after DOM is ready
let elements = {};

function initializeElements() {
    elements = {
        // Device status
        statusLed: document.getElementById('status-led'),
        statusText: document.getElementById('status-text'),
        statusLedDisplay: document.getElementById('status-led-display'),
        statusTextDisplay: document.getElementById('status-text-display'),
        btnRefreshConnection: document.getElementById('btn-refresh-connection'),
        
        // Main tabs
        mainTabBtns: document.querySelectorAll('.main-tab-btn'),
        tabSections: document.querySelectorAll('.tab-section'),
        
        // Generation
        toggleAudio: document.getElementById('toggle-audio'),
        toggleMidi: document.getElementById('toggle-midi'),
        generateButtons: document.querySelectorAll('.btn-generate'),
        
        // Display controls
        ideaInput: document.getElementById('idea-input'),
        genreSelect: document.getElementById('genre-select'),
        subgenreSelect: document.getElementById('subgenre-select'),
        subgenreLine: document.getElementById('subgenre-line'),
        tempoSelect: document.getElementById('tempo-select'),
        tempoFollowToggle: document.getElementById('tempo-follow-toggle'),
        tempoToggleLabel: document.getElementById('tempo-toggle-label'),
        energySelect: document.getElementById('energy-select'),
        lengthBarsSelect: document.getElementById('length-bars-select'),
        lengthMeasureTypeSelect: document.getElementById('length-measure-type-select'),
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
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeElements();
        initializeApp();
    });
} else {
    // DOM already loaded
    initializeElements();
    initializeApp();
}

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
    
    // Initialize audio engine, synthesizer, and analyzer
    if (window.audioEngine) {
        try {
            await window.audioEngine.initialize();
            const audioContext = window.audioEngine.getAudioContext();
            
            if (audioContext) {
                // Get audio settings
                const audioSettings = window.settingsManager?.settings?.audio || {};
                
                // Initialize synthesizer with settings
                if (window.Synthesizer) {
                    const synthOptions = {
                        maxVoices: audioSettings.synthMaxVoices || 8,
                        waveform: audioSettings.synthWaveform || 'sine',
                        filterType: audioSettings.synthFilterType || 'lowpass',
                        filterFreq: audioSettings.synthFilterFreq || 2000,
                        filterQ: audioSettings.synthFilterQ || 1,
                        attack: audioSettings.synthAttack || 0.01,
                        decay: audioSettings.synthDecay || 0.1,
                        sustain: audioSettings.synthSustain || 0.7,
                        release: audioSettings.synthRelease || 0.3,
                        lfoRate: audioSettings.synthLfoRate || 0,
                        lfoAmount: audioSettings.synthLfoAmount || 0,
                        volume: audioSettings.synthVolume || 0.3
                    };
                    window.audioSynthesizer = new window.Synthesizer(audioContext, synthOptions);
                }
                
                // Initialize analyzer with settings
                if (window.AudioAnalyzer) {
                    const analyzerOptions = {
                        fftSize: audioSettings.analyzerFftSize || 2048,
                        smoothingTimeConstant: audioSettings.analyzerSmoothing || 0.8,
                        minDecibels: audioSettings.analyzerMinDecibels || -100,
                        maxDecibels: audioSettings.analyzerMaxDecibels || -30
                    };
                    window.audioAnalyzer = new window.AudioAnalyzer(audioContext, analyzerOptions);
                    window.audioEngine.connectAnalyzer(window.audioAnalyzer);
                    window.audioAnalyzer.start();
                }
            }
        } catch (error) {
            console.error('[Renderer] Failed to initialize audio components:', error);
        }
    }
    
    // Test IPC communication first
    console.log('[Renderer] Testing IPC communication...');
    if (window.sergikAPI) {
        try {
            const testResult = await window.sergikAPI.getApiUrl();
            console.log('[Renderer] IPC test successful, API URL:', testResult);
        } catch (error) {
            console.error('[Renderer] IPC test failed:', error);
        }
    } else {
        console.error('[Renderer] window.sergikAPI is not available!');
    }
    
    // Check connection
    await checkConnection();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up idea analyzer for auto-fill
    setupIdeaAnalyzer();
    
    // Initialize context menus
    setupContextMenus();
    
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
    logToDevConsole('info', 'Loading initial data...');
    
    const errors = [];
    
    try {
        // Load session state (tracks, clips)
        try {
            logToDevConsole('info', 'Loading session state...');
            const sessionState = await loadSessionState();
            logToDevConsole('success', 'Session state loaded', { tracks: sessionState?.tracks?.length || 0 });
        } catch (error) {
            const errorMsg = `Failed to load session state: ${error.message}`;
            console.error('[Renderer]', errorMsg, error);
            logToDevConsole('error', errorMsg, error);
            errors.push('session state');
        }
        
        // Load drum genres
        try {
            logToDevConsole('info', 'Loading drum genres...');
            await loadDrumGenres();
            logToDevConsole('success', 'Drum genres loaded');
        } catch (error) {
            const errorMsg = `Failed to load drum genres: ${error.message}`;
            console.error('[Renderer]', errorMsg, error);
            logToDevConsole('error', errorMsg, error);
            errors.push('drum genres');
        }
        
        // Load media library (recent items)
        try {
            logToDevConsole('info', 'Loading recent media...');
            await loadRecentMedia();
            logToDevConsole('success', 'Recent media loaded');
        } catch (error) {
            const errorMsg = `Failed to load recent media: ${error.message}`;
            console.error('[Renderer]', errorMsg, error);
            logToDevConsole('error', errorMsg, error);
            errors.push('recent media');
        }
        
        // Update track and slot options with session data
        try {
            const sessionState = await loadSessionState().catch(() => null);
            if (sessionState && sessionState.tracks) {
                updateTrackAndSlotOptions(sessionState.tracks);
            } else {
                updateTrackAndSlotOptions([]);
            }
        } catch (error) {
            console.warn('[Renderer] Failed to update track options:', error);
            updateTrackAndSlotOptions([]);
        }
        
        // Initialize genre sub-genre system
        if (elements.genreSelect) {
            const currentGenre = elements.genreSelect.value || 'house';
            handleGenreChange(currentGenre);
        }
        
        // Initialize empty canvas states
        initializeEmptyCanvases();
        
        if (errors.length > 0) {
            const errorMsg = `Initial data loaded with errors: ${errors.join(', ')}`;
            addAction(errorMsg, 'warning');
            logToDevConsole('warning', errorMsg);
        } else {
            addAction('Initial data loaded', 'success');
            logToDevConsole('success', 'Initial data loaded successfully');
        }
    } catch (error) {
        const errorMsg = `Failed to load initial data: ${error.message}`;
        console.error('[Renderer]', errorMsg, error);
        logToDevConsole('error', errorMsg, error);
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
            
            // Load from media storage directory (new dedicated storage) - PRIORITY
            try {
                // Load all media from storage (generated and imported)
                const mediaResult = await window.sergikAPI.listMediaStorageFiles({ source: 'all', type: 'all' });
                if (mediaResult.success && mediaResult.files) {
                    const mediaItems = mediaResult.files.map(file => {
                        // Determine type from extension or source
                        let fileType = 'audio';
                        const ext = file.type || '';
                        if (['mid', 'midi'].includes(ext)) {
                            fileType = 'midi';
                        } else if (['wav', 'mp3', 'aiff', 'aif', 'flac', 'ogg'].includes(ext)) {
                            fileType = 'audio';
                        }
                        
                        return {
                            id: file.path,
                            name: file.name,
                            path: file.path,
                            type: fileType,
                            duration: 0, // Duration not stored in file metadata
                            source: file.source || 'media',
                            modified: file.modified,
                            size: file.size
                        };
                    });
                    allItems.push(...mediaItems);
                }
            } catch (mediaError) {
                console.warn('[Renderer] Failed to load media storage files:', mediaError);
            }
            
            // Load from local library directory (legacy - for backward compatibility)
            try {
                const libraryResult = await window.sergikAPI.listLibraryFiles('MIDI');
                if (libraryResult.success && libraryResult.files) {
                    const libraryItems = libraryResult.files
                        .filter(file => file.source === 'library') // Only include legacy library files
                        .map(file => ({
                            id: file.path,
                            name: file.name,
                            path: file.path,
                            type: 'midi',
                            duration: 0,
                            source: 'library',
                            modified: file.modified
                        }));
                    allItems.push(...libraryItems);
                }
                
                const audioResult = await window.sergikAPI.listLibraryFiles('Audio');
                if (audioResult.success && audioResult.files) {
                    const audioItems = audioResult.files
                        .filter(file => file.source === 'library') // Only include legacy library files
                        .map(file => ({
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
            const mediaCount = recentItems.filter(i => i.source && i.source.startsWith('media')).length;
            const libraryCount = recentItems.filter(i => i.source === 'library').length;
            console.log(`[Renderer] Loaded ${recentItems.length} media items (${mediaCount} from media storage, ${libraryCount} from library)`);
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
        btn.addEventListener('click', (e) => {
            const tabId = btn.dataset.mainTab;
            if (window.visualFeedback) {
                window.visualFeedback.addTabFeedback(btn, true);
                window.visualFeedback.addRipple(btn, e);
            }
            switchTab(tabId);
        });
    });
    
    // Generation buttons
    elements.generateButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const type = btn.dataset.type;
            if (window.visualFeedback) {
                window.visualFeedback.addRipple(btn, e);
                window.visualFeedback.addButtonFeedback(btn, 'generating...', 'loading');
            }
            try {
                await handleGenerate(type);
                if (window.visualFeedback) {
                    window.visualFeedback.addButtonFeedback(btn, 'generated!', 'success');
                }
            } catch (error) {
                if (window.visualFeedback) {
                    window.visualFeedback.addButtonFeedback(btn, 'error!', 'error');
                }
            }
        });
    });
    
    // Genre selector
    elements.genreSelect?.addEventListener('change', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addSelectFeedback(elements.genreSelect);
        }
        handleGenreChange(e.target.value);
    });
    
    // Add focus/blur feedback to all selects
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('focus', () => {
            if (window.visualFeedback) {
                window.visualFeedback.addInputFeedback(select, 'focus');
            }
        });
        select.addEventListener('blur', () => {
            if (window.visualFeedback) {
                window.visualFeedback.removeInputFeedback(select);
            }
        });
    });
    
    // Intelligence selector
    const intelligenceSelect = document.getElementById('intelligence-select');
    const intelligenceSubLine = document.getElementById('intelligence-sub-line');
    const intelligenceSubSelect = document.getElementById('intelligence-sub-select');
    
    intelligenceSelect?.addEventListener('change', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addSelectFeedback(intelligenceSelect);
        }
        const value = e.target.value;
        if (value && intelligenceSubLine && intelligenceSubSelect) {
            intelligenceSubLine.style.display = '';
            populateIntelligenceSubOptions(value, intelligenceSubSelect);
        } else if (intelligenceSubLine) {
            intelligenceSubLine.style.display = 'none';
        }
        // Update advanced panel if open
        if (typeof updateAdvancedIntelligencePanel === 'function') {
            updateAdvancedIntelligencePanel();
        }
    });
    
    // Function to populate intelligence sub-options
    function populateIntelligenceSubOptions(category, subSelect) {
        if (!subSelect) return;
        
        // Clear existing options
        subSelect.innerHTML = '<option value="">None</option>';
        
        // Use global INTELLIGENCE_CATEGORIES (defined later in file)
        if (typeof INTELLIGENCE_CATEGORIES === 'undefined') return;
        if (!INTELLIGENCE_CATEGORIES[category]) return;
        
        const categoryData = INTELLIGENCE_CATEGORIES[category];
        categoryData.subOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.toLowerCase().replace(/\s+/g, '_');
            opt.textContent = option;
            subSelect.appendChild(opt);
        });
    }
    
    // Setup advanced intelligence panel (will be called after INTELLIGENCE_CATEGORIES is defined)
    // This will be called from the global scope after the constant is defined
    
    // Tempo follow toggle
    elements.tempoFollowToggle?.addEventListener('change', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addCheckboxFeedback(elements.tempoFollowToggle, e.target.checked);
        }
        const label = elements.tempoToggleLabel;
        if (label) {
            label.textContent = e.target.checked ? 'Follow Live' : 'Auto Update';
        }
    });
    
    // Add feedback to all checkboxes/toggles
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (window.visualFeedback) {
                window.visualFeedback.addCheckboxFeedback(checkbox, e.target.checked);
            }
        });
    });
    
    // Input tabs
    elements.inputTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (window.visualFeedback) {
                window.visualFeedback.addTabFeedback(btn, true);
                window.visualFeedback.addRipple(btn, e);
            }
            const tabId = btn.dataset.tab;
            switchInputTab(tabId);
        });
    });
    
    // File drop zone
    elements.dropZone?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addPulse(elements.dropZone, 'rgba(0, 122, 204, 0.2)', 300);
        }
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
    elements.btnAnalyzeUrl?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(elements.btnAnalyzeUrl, e);
            window.visualFeedback.addButtonFeedback(elements.btnAnalyzeUrl, 'analyzing...', 'loading');
        }
        const url = elements.urlInput?.value.trim();
        if (url) {
            try {
                await handleUrlAnalyze(url);
                if (window.visualFeedback) {
                    window.visualFeedback.addButtonFeedback(elements.btnAnalyzeUrl, 'analyzed!', 'success');
                }
            } catch (error) {
                if (window.visualFeedback) {
                    window.visualFeedback.addButtonFeedback(elements.btnAnalyzeUrl, 'error!', 'error');
                }
            }
        } else {
            if (window.visualFeedback) {
                window.visualFeedback.removeButtonFeedback(elements.btnAnalyzeUrl);
            }
        }
    });
    
    elements.urlInput?.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            if (window.visualFeedback) {
                window.visualFeedback.addInputFeedback(elements.urlInput, 'typing');
            }
            const url = elements.urlInput?.value.trim();
            if (url) {
                try {
                    await handleUrlAnalyze(url);
                    if (window.visualFeedback) {
                        window.visualFeedback.addInputFeedback(elements.urlInput, 'success');
                    }
                } catch (error) {
                    if (window.visualFeedback) {
                        window.visualFeedback.addInputFeedback(elements.urlInput, 'error');
                    }
                }
            }
        }
    });
    
    // Add focus/blur feedback to URL input
    elements.urlInput?.addEventListener('focus', () => {
        if (window.visualFeedback) {
            window.visualFeedback.addInputFeedback(elements.urlInput, 'focus');
        }
    });
    elements.urlInput?.addEventListener('blur', () => {
        if (window.visualFeedback) {
            window.visualFeedback.removeInputFeedback(elements.urlInput);
        }
    });
    
    // Mic button
    elements.micBtn?.addEventListener('mousedown', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addPulse(elements.micBtn, 'rgba(220, 53, 69, 0.3)', 0);
            elements.micBtn.style.transform = 'scale(1.1)';
        }
        startRecording();
    });
    elements.micBtn?.addEventListener('mouseup', () => {
        if (window.visualFeedback) {
            elements.micBtn.style.transform = '';
            window.visualFeedback.addPulse(elements.micBtn, 'rgba(40, 167, 69, 0.3)', 300);
        }
        stopRecording();
    });
    elements.micBtn?.addEventListener('mouseleave', () => {
        if (window.visualFeedback) {
            elements.micBtn.style.transform = '';
        }
        stopRecording();
    });
    elements.micBtn?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (window.visualFeedback) {
            window.visualFeedback.addPulse(elements.micBtn, 'rgba(220, 53, 69, 0.3)', 0);
            elements.micBtn.style.transform = 'scale(1.1)';
        }
        startRecording();
    });
    elements.micBtn?.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (window.visualFeedback) {
            elements.micBtn.style.transform = '';
            window.visualFeedback.addPulse(elements.micBtn, 'rgba(40, 167, 69, 0.3)', 300);
        }
        stopRecording();
    });
    
    // Command input
    elements.commandInput?.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const command = elements.commandInput?.value.trim();
            if (command) {
                if (window.visualFeedback) {
                    window.visualFeedback.addInputFeedback(elements.commandInput, 'typing');
                }
                try {
                    await handleCommand(command);
                    if (window.visualFeedback) {
                        window.visualFeedback.addInputFeedback(elements.commandInput, 'success');
                        setTimeout(() => {
                            window.visualFeedback.removeInputFeedback(elements.commandInput);
                        }, 1000);
                    }
                } catch (error) {
                    if (window.visualFeedback) {
                        window.visualFeedback.addInputFeedback(elements.commandInput, 'error');
                    }
                }
            }
        }
    });
    
    // Add focus/blur feedback to command input
    elements.commandInput?.addEventListener('focus', () => {
        if (window.visualFeedback) {
            window.visualFeedback.addInputFeedback(elements.commandInput, 'focus');
        }
    });
    elements.commandInput?.addEventListener('blur', () => {
        if (window.visualFeedback) {
            window.visualFeedback.removeInputFeedback(elements.commandInput);
        }
    });
    
    // Transport controls
    elements.btnRewind?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(elements.btnRewind, e);
            window.visualFeedback.addButtonFeedback(elements.btnRewind, null, 'click');
        }
        if (window.sergikAPI) {
            const result = await window.sergikAPI.transportAction('rewind');
            if (result.success) {
                addAction('Rewind', 'info');
            }
        }
    });
    elements.btnStop?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(elements.btnStop, e);
            window.visualFeedback.addButtonFeedback(elements.btnStop, null, 'click');
        }
        if (window.sergikAPI) {
            const result = await window.sergikAPI.transportAction('stop');
            if (result.success) {
                addAction('Stop', 'info');
            }
        }
    });
    elements.btnPlay?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(elements.btnPlay, e);
            window.visualFeedback.addButtonFeedback(elements.btnPlay, null, 'click');
        }
        if (window.sergikAPI) {
            const result = await window.sergikAPI.transportAction('play');
            if (result.success) {
                addAction('Play', 'info');
            }
        }
    });
    elements.btnRecord?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(elements.btnRecord, e);
            window.visualFeedback.addButtonFeedback(elements.btnRecord, null, 'click');
        }
        if (window.sergikAPI) {
            const result = await window.sergikAPI.transportAction('record');
            if (result.success) {
                addAction('Record', 'info');
            }
        }
    });
    elements.btnForward?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(elements.btnForward, e);
            window.visualFeedback.addButtonFeedback(elements.btnForward, null, 'click');
        }
        if (window.sergikAPI) {
            const result = await window.sergikAPI.transportAction('forward');
            if (result.success) {
                addAction('Forward', 'info');
            }
        }
    });
    
    // Quick actions
    elements.btnAnalyze?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(elements.btnAnalyze, e);
            window.visualFeedback.addButtonFeedback(elements.btnAnalyze, 'analyzing...', 'loading');
        }
        try {
        await handleAnalyze();
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(elements.btnAnalyze, 'analyzed!', 'success');
            }
        } catch (error) {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(elements.btnAnalyze, 'error!', 'error');
            }
        }
    });
    
    elements.btnPreview?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(elements.btnPreview, e);
            window.visualFeedback.addButtonFeedback(elements.btnPreview, 'previewing...', 'loading');
        }
        try {
        await handlePreview();
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(elements.btnPreview, 'previewing!', 'success');
            }
        } catch (error) {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(elements.btnPreview, 'error!', 'error');
            }
        }
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
            
            // Use IPC handler for file upload
            if (window.sergikAPI) {
                const fileResult = await window.sergikAPI.selectFileForAnalysis();
                if (fileResult.success) {
                    const result = await window.sergikAPI.analyzeUpload(fileResult.filePath);
                    if (result.success) {
                        displayAnalysisResults(result.data);
                        addAction('Analysis complete', 'success');
                        return;
                    } else {
                        throw new Error(result.error || 'Analysis failed');
                    }
                }
            }
            
            // Fallback: direct API call
            const apiBaseUrl = await window.sergikAPI?.getApiBaseUrl() || 'http://localhost:8000';
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
            
            // Use IPC handler for preview
            if (window.sergikAPI) {
                // Parse query to extract organize parameters
                const params = {
                    source_dirs: query,
                    target_base: '/Users/machd/Desktop/SERGIK_Organized',
                    organize_by: 'genre,bpm,key'
                };
                const result = await window.sergikAPI.organizePreview(params);
                if (result.success) {
                    displayPreviewResults(result.data);
                    addAction('Preview complete', 'success');
                    return;
                } else {
                    throw new Error(result.error || 'Preview failed');
                }
            }
            
            // Fallback: direct API call
            const apiBaseUrl = await window.sergikAPI?.getApiBaseUrl() || 'http://localhost:8000';
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
        btn.addEventListener('click', (e) => {
            if (window.visualFeedback) {
                window.visualFeedback.addTabFeedback(btn, true);
                window.visualFeedback.addRipple(btn, e);
            }
            const view = btn.dataset.view;
            switchAnalysisView(view);
        });
    });
    
    // Slot selection removed - commit button always enabled with default 'next' slot
        const commitBtn = document.getElementById('commit-btn');
        const indicator = document.getElementById('placement-indicator');
        if (commitBtn && indicator) {
                commitBtn.disabled = false;
        indicator.textContent = 'Next Empty Slot';
                indicator.classList.remove('waiting');
                indicator.classList.add('ready');
    }
    
    // AI chat
    elements.btnSendAi?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(elements.btnSendAi, e);
            window.visualFeedback.addButtonFeedback(elements.btnSendAi, 'sending...', 'loading');
        }
        const message = elements.aiInput?.value.trim();
        if (message) {
            try {
                await handleAiMessage(message);
                if (window.visualFeedback) {
                    window.visualFeedback.addButtonFeedback(elements.btnSendAi, 'sent!', 'success');
                }
            } catch (error) {
                if (window.visualFeedback) {
                    window.visualFeedback.addButtonFeedback(elements.btnSendAi, 'error!', 'error');
                }
            }
        } else {
            if (window.visualFeedback) {
                window.visualFeedback.removeButtonFeedback(elements.btnSendAi);
            }
        }
    });
    
    elements.aiInput?.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = elements.aiInput?.value.trim();
            if (message) {
                if (window.visualFeedback) {
                    window.visualFeedback.addInputFeedback(elements.aiInput, 'typing');
                }
                try {
                    await handleAiMessage(message);
                    if (window.visualFeedback) {
                        window.visualFeedback.addInputFeedback(elements.aiInput, 'success');
                        setTimeout(() => {
                            window.visualFeedback.removeInputFeedback(elements.aiInput);
                        }, 1000);
                    }
                } catch (error) {
                    if (window.visualFeedback) {
                        window.visualFeedback.addInputFeedback(elements.aiInput, 'error');
                    }
                }
            }
        }
    });
    
    // Add focus/blur feedback to AI input
    elements.aiInput?.addEventListener('focus', () => {
        if (window.visualFeedback) {
            window.visualFeedback.addInputFeedback(elements.aiInput, 'focus');
        }
    });
    elements.aiInput?.addEventListener('blur', () => {
        if (window.visualFeedback) {
            window.visualFeedback.removeInputFeedback(elements.aiInput);
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
    
    // Refresh connection button
    setupRefreshConnectionButton();
    
    // Advanced key panel
    setupAdvancedKeyPanel();
    
    // Advanced intelligence panel (will be initialized after INTELLIGENCE_CATEGORIES is defined)
    // Called at end of file after constant definition
    
    // Add visual feedback to all remaining buttons that don't have explicit handlers
    // This ensures comprehensive coverage
    setTimeout(() => {
        document.querySelectorAll('button:not([data-wired-feedback])').forEach(btn => {
            // Skip buttons that already have feedback or are in special containers
            if (btn.closest('.settings-modal') || btn.closest('#developer-console')) {
                return;
            }
            
            // Only add click feedback to buttons that don't have async handlers
            if (!btn.dataset.hasFeedback) {
                btn.addEventListener('click', function(e) {
                    if (window.visualFeedback && !this.disabled) {
                        window.visualFeedback.addRipple(this, e);
                        window.visualFeedback.addButtonFeedback(this, null, 'click');
                    }
                }, { once: false });
                btn.dataset.hasFeedback = 'true';
            }
        });
        
        // Add focus/blur feedback to all text inputs and textareas
        document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => {
            if (!input.dataset.hasFeedback) {
                input.addEventListener('focus', () => {
                    if (window.visualFeedback) {
                        window.visualFeedback.addInputFeedback(input, 'focus');
                    }
                });
                input.addEventListener('blur', () => {
                    if (window.visualFeedback) {
                        window.visualFeedback.removeInputFeedback(input);
                    }
                });
                input.dataset.hasFeedback = 'true';
            }
        });
    }, 500);
}

// ============================================================================
// Context Menu System
// ============================================================================

function setupContextMenus() {
    if (!window.contextMenu) {
        console.warn('[Renderer] Context menu system not available');
        return;
    }
    
    // Media Item Context Menu (Library Tab)
    window.contextMenu.registerMenuItems('media-item', [
        {
            label: 'Preview',
            icon: '👁',
            action: (target) => {
                const mediaId = target.dataset.mediaId;
                if (mediaId) {
                    loadMediaIntoEditor(mediaId);
                }
            }
        },
        {
            label: 'Load into Editor',
            icon: '📝',
            action: (target) => {
                const mediaId = target.dataset.mediaId;
                if (mediaId) {
                    loadMediaIntoEditor(mediaId);
                }
            }
        },
        'separator',
        {
            label: 'Copy Name',
            icon: '📋',
            action: (target) => {
                const name = target.querySelector('.browser-item-name')?.textContent || target.textContent;
                navigator.clipboard.writeText(name).then(() => {
                    addAction('Copied to clipboard', 'success');
                }).catch(() => {
                    addAction('Failed to copy', 'error');
                });
            }
        },
        {
            label: 'Copy Path',
            icon: '📁',
            action: (target) => {
                const path = target.dataset.mediaPath || target.dataset.mediaId;
                if (path) {
                    navigator.clipboard.writeText(path).then(() => {
                        addAction('Path copied to clipboard', 'success');
                    }).catch(() => {
                        addAction('Failed to copy path', 'error');
                    });
                }
            }
        },
        'separator',
        {
            label: 'Delete',
            icon: '🗑',
            danger: true,
            action: async (target) => {
                const mediaId = target.dataset.mediaId;
                if (mediaId && confirm('Delete this media item?')) {
                    // Implement delete functionality
                    addAction('Delete functionality to be implemented', 'info');
                }
            }
        }
    ]);
    
    // Generated File Context Menu (Create Tab)
    window.contextMenu.registerMenuItems('generated-file', [
        {
            label: 'Preview',
            icon: '👁',
            action: (target) => {
                const fileId = target.dataset.fileId;
                if (window.createTabEnhancements && fileId) {
                    window.createTabEnhancements.selectGeneratedFile(fileId);
                }
            }
        },
        {
            label: 'Load into Editor',
            icon: '📝',
            action: (target) => {
                const fileId = target.dataset.fileId;
                if (window.createTabEnhancements && fileId) {
                    const file = window.createTabEnhancements.generatedFiles?.find(f => f.id === fileId);
                    if (file && file.path) {
                        loadMediaIntoEditor(file.path);
                    }
                }
            }
        },
        'separator',
        {
            label: 'Copy Name',
            icon: '📋',
            action: (target) => {
                const name = target.querySelector('.generated-file-name')?.textContent;
                if (name) {
                    navigator.clipboard.writeText(name).then(() => {
                        addAction('Copied to clipboard', 'success');
                    }).catch(() => {
                        addAction('Failed to copy', 'error');
                    });
                }
            }
        },
        {
            label: 'Copy Path',
            icon: '📁',
            action: (target) => {
                const fileId = target.dataset.fileId;
                if (window.createTabEnhancements && fileId) {
                    const file = window.createTabEnhancements.generatedFiles?.find(f => f.id === fileId);
                    if (file && file.path) {
                        navigator.clipboard.writeText(file.path).then(() => {
                            addAction('Path copied to clipboard', 'success');
                        }).catch(() => {
                            addAction('Failed to copy path', 'error');
                        });
                    }
                }
            }
        },
        'separator',
        {
            label: 'Remove from List',
            icon: '✕',
            action: (target) => {
                const fileId = target.dataset.fileId;
                if (window.createTabEnhancements && fileId) {
                    window.createTabEnhancements.removeGeneratedFile(fileId);
                }
            }
        }
    ]);
    
    // Generation Button Context Menu
    window.contextMenu.registerMenuItems('generate-button', [
        {
            label: 'Generate',
            icon: '⚡',
            action: (target) => {
                const type = target.dataset.type;
                if (type) {
                    handleGenerate(type);
                }
            }
        },
        {
            label: 'Add to Batch Queue',
            icon: '➕',
            action: (target) => {
                const type = target.dataset.type;
                if (window.createTabEnhancements && type) {
                    window.createTabEnhancements.addToBatchQueue(type);
                }
            },
            visible: (target) => {
                // Only show if batch mode is available
                return window.createTabEnhancements !== undefined;
            }
        },
        'separator',
        {
            label: 'Generate with Preset...',
            icon: '💾',
            action: (target) => {
                // Show preset selector
                addAction('Preset selector to be implemented', 'info');
            }
        }
    ]);
    
    // Canvas Context Menu (Waveform/Piano Roll)
    window.contextMenu.registerMenuItems('canvas', [
        {
            label: 'Zoom In',
            icon: '🔍',
            shortcut: 'Ctrl++',
            action: () => {
                // Implement zoom in
                addAction('Zoom in', 'info');
            }
        },
        {
            label: 'Zoom Out',
            icon: '🔍',
            shortcut: 'Ctrl+-',
            action: () => {
                // Implement zoom out
                addAction('Zoom out', 'info');
            }
        },
        {
            label: 'Reset Zoom',
            icon: '↺',
            action: () => {
                // Implement reset zoom
                addAction('Reset zoom', 'info');
            }
        },
        'separator',
        {
            label: 'Copy Image',
            icon: '📋',
            action: async (target) => {
                if (target instanceof HTMLCanvasElement) {
                    try {
                        target.toBlob((blob) => {
                            if (blob && navigator.clipboard && navigator.clipboard.write) {
                                navigator.clipboard.write([
                                    new ClipboardItem({ 'image/png': blob })
                                ]).then(() => {
                                    addAction('Canvas copied to clipboard', 'success');
                                }).catch(() => {
                                    addAction('Failed to copy canvas', 'error');
                                });
                            } else {
                                addAction('Clipboard API not available', 'error');
                            }
                        });
                    } catch (error) {
                        console.error('[Renderer] Failed to copy canvas:', error);
                        addAction('Failed to copy canvas', 'error');
                    }
                }
            }
        },
        {
            label: 'Save Image...',
            icon: '💾',
            action: (target) => {
                if (target instanceof HTMLCanvasElement) {
                    try {
                        const link = document.createElement('a');
                        link.download = `canvas-${Date.now()}.png`;
                        link.href = target.toDataURL();
                        link.click();
                        addAction('Canvas saved', 'success');
                    } catch (error) {
                        console.error('[Renderer] Failed to save canvas:', error);
                        addAction('Failed to save canvas', 'error');
                    }
                }
            }
        }
    ]);
    
    // Preset Item Context Menu
    window.contextMenu.registerMenuItems('preset-item', [
        {
            label: 'Load Preset',
            icon: '📂',
            action: (target) => {
                const presetName = target.dataset.presetName;
                if (window.createTabEnhancements && presetName) {
                    window.createTabEnhancements.loadPreset(presetName);
                }
            }
        },
        'separator',
        {
            label: 'Rename',
            icon: '✏',
            action: (target) => {
                const presetName = target.dataset.presetName || target.dataset.preset;
                if (!presetName) return;
                
                // Get current preset name for display
                const currentName = target.textContent?.trim() || 
                                   target.querySelector('.preset-name')?.textContent?.trim() ||
                                   presetName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                const newName = prompt('Enter new preset name:', currentName);
                if (newName && window.createTabEnhancements) {
                    window.createTabEnhancements.renamePreset(presetName, newName);
                }
            }
        },
        {
            label: 'Duplicate',
            icon: '📋',
            action: (target) => {
                const presetName = target.dataset.presetName || target.dataset.preset;
                if (presetName && window.createTabEnhancements) {
                    window.createTabEnhancements.duplicatePreset(presetName);
                }
            }
        },
        {
            label: 'Delete',
            icon: '🗑',
            danger: true,
            action: (target) => {
                const presetName = target.dataset.presetName;
                if (presetName && confirm('Delete this preset?')) {
                    if (window.createTabEnhancements) {
                        window.createTabEnhancements.deletePreset(presetName);
                    }
                }
            }
        }
    ]);
    
    // Batch Queue Item Context Menu
    window.contextMenu.registerMenuItems('batch-item', [
        {
            label: 'Move Up',
            icon: '↑',
            action: (target) => {
                const index = parseInt(target.dataset.index);
                if (window.createTabEnhancements && index > 0) {
                    window.createTabEnhancements.moveInBatchQueue(index, -1);
                }
            },
            enabled: (target) => {
                const index = parseInt(target.dataset.index);
                return index > 0;
            }
        },
        {
            label: 'Move Down',
            icon: '↓',
            action: (target) => {
                const index = parseInt(target.dataset.index);
                if (window.createTabEnhancements) {
                    window.createTabEnhancements.moveInBatchQueue(index, 1);
                }
            },
            enabled: (target) => {
                const index = parseInt(target.dataset.index);
                const total = document.querySelectorAll('.batch-queue-item').length;
                return index < total - 1;
            }
        },
        'separator',
        {
            label: 'Remove',
            icon: '✕',
            action: (target) => {
                const index = parseInt(target.dataset.index);
                if (window.createTabEnhancements) {
                    window.createTabEnhancements.removeFromBatchQueue(index);
                }
            }
        }
    ]);
    
    console.log('[Renderer] Context menus registered');
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
    // Initialize Library Audio Manager
    if (!window.libraryAudioManager && window.LibraryAudioManager) {
        window.libraryAudioManager = new LibraryAudioManager();
    }
    
    // Initialize Library Workflow Optimizer
    try {
        if (window.LibraryWorkflowOptimizer) {
            window.libraryWorkflowOptimizer = new window.LibraryWorkflowOptimizer();
            console.log('[Library Tab] LibraryWorkflowOptimizer initialized');
        }
    } catch (err) {
        console.warn('[Library Tab] LibraryWorkflowOptimizer initialization failed:', err);
    }
    
    // Initialize editor states if not exists (minimal stub)
    if (!window.editorStates) {
        window.editorStates = {
            waveform: {
                data: null,
                clipProperties: {
                    gain: 0,
                    bpm: 120,
                    warp: { enabled: true, mode: 'beats', markers: [] }
                },
                selection: { start: 0, end: 0 },
                saveState: function() {
                    try {
                        localStorage.setItem('editorState_waveform', 
                            JSON.stringify({ clipProperties: this.clipProperties, selection: this.selection }));
                    } catch (e) { 
                        console.warn('[EditorState] Save failed:', e); 
                    }
                }
            },
            'piano-roll': {
                data: { notes: [] },
                saveState: function() {
                    try {
                        localStorage.setItem('editorState_pianoRoll', 
                            JSON.stringify({ notes: this.data.notes }));
                    } catch (e) { 
                        console.warn('[EditorState] Save failed:', e); 
                    }
                }
            }
        };
    }
    
    // Initialize Enhanced Clip Editor
    try {
        if (window.EnhancedClipEditor) {
            window.enhancedClipEditor = new window.EnhancedClipEditor();
            console.log('[Library Tab] EnhancedClipEditor initialized');
        }
    } catch (err) {
        console.warn('[Library Tab] EnhancedClipEditor initialization failed:', err);
    }
    
    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function(e) {
            if (window.visualFeedback) {
                window.visualFeedback.addRipple(chip, e);
                window.visualFeedback.addButtonFeedback(chip, null, 'click');
            }
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
        // Add focus/blur feedback
        searchInput.addEventListener('focus', () => {
            if (window.visualFeedback) {
                window.visualFeedback.addInputFeedback(searchInput, 'focus');
            }
        });
        searchInput.addEventListener('blur', () => {
            if (window.visualFeedback) {
                window.visualFeedback.removeInputFeedback(searchInput);
            }
        });
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            searchClear.style.display = query.trim() ? 'block' : 'none';
            
            if (window.visualFeedback && query.trim()) {
                window.visualFeedback.addInputFeedback(searchInput, 'typing');
            }
            
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
                    if (window.visualFeedback) {
                        window.visualFeedback.addInputFeedback(searchInput, 'typing');
                    }
                    performLibrarySearch(query).then(() => {
                        if (window.visualFeedback) {
                            window.visualFeedback.addInputFeedback(searchInput, 'success');
                        }
                        // Load first result
                        const firstItem = document.querySelector('.browser-item');
                        if (firstItem) {
                            firstItem.click();
                        }
                    }).catch(() => {
                        if (window.visualFeedback) {
                            window.visualFeedback.addInputFeedback(searchInput, 'error');
                        }
                    });
                }
            }
        });
    }
    
    if (searchClear) {
        searchClear.addEventListener('click', (e) => {
            if (window.visualFeedback) {
                window.visualFeedback.addRipple(searchClear, e);
                window.visualFeedback.addButtonFeedback(searchClear, null, 'click');
            }
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
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(toggle, null, 'click');
            }
            const group = this.closest('.media-group');
            if (group) {
                group.classList.toggle('collapsed');
                this.textContent = group.classList.contains('collapsed') ? '▶' : '▼';
            }
        });
    });
    
    // Media navigation
    document.getElementById('prev-media')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('prev-media'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('prev-media'), null, 'click');
        }
        navigateMedia(-1);
    });
    document.getElementById('next-media')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('next-media'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('next-media'), null, 'click');
        }
        navigateMedia(1);
    });
    document.getElementById('random-media')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('random-media'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('random-media'), null, 'click');
        }
        navigateMedia('random');
    });
    
    // Editor toolbar
    document.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (window.visualFeedback) {
                window.visualFeedback.addRipple(btn, e);
                window.visualFeedback.addButtonFeedback(btn, null, 'click');
            }
            const tool = this.dataset.tool;
            switchEditorTool(tool);
        });
    });
    
    // Action buttons
    document.getElementById('action-insert')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('action-insert'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('action-insert'), 'inserting...', 'loading');
        }
        handleMediaAction('insert').then(() => {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('action-insert'), 'inserted!', 'success');
            }
        }).catch(() => {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('action-insert'), 'error!', 'error');
            }
        });
    });
    document.getElementById('action-replace')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('action-replace'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('action-replace'), 'replacing...', 'loading');
        }
        handleMediaAction('replace').then(() => {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('action-replace'), 'replaced!', 'success');
            }
        }).catch(() => {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('action-replace'), 'error!', 'error');
            }
        });
    });
    document.getElementById('action-commit')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('action-commit'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('action-commit'), 'committing...', 'loading');
        }
        handleMediaAction('commit').then(() => {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('action-commit'), 'committed!', 'success');
            }
        }).catch(() => {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('action-commit'), 'error!', 'error');
            }
        });
    });
    document.getElementById('action-duplicate')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('action-duplicate'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('action-duplicate'), 'duplicating...', 'loading');
        }
        handleMediaAction('duplicate').then(() => {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('action-duplicate'), 'duplicated!', 'success');
            }
        }).catch(() => {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('action-duplicate'), 'error!', 'error');
            }
        });
    });
    
    // Preview controls
    document.getElementById('preview-play')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('preview-play'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('preview-play'), null, 'click');
        }
        handlePreview('play');
    });
    document.getElementById('preview-stop')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('preview-stop'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('preview-stop'), null, 'click');
        }
        handlePreview('stop');
    });
    document.getElementById('preview-loop')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('preview-loop'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('preview-loop'), null, 'click');
        }
        handlePreview('loop');
    });
    
    // Browser items - handled by LibraryWorkflowOptimizer (lazy loading)
    // Event listeners are attached by workflow optimizer after media items are rendered
}

// AI Tab Setup
function setupAITab() {
    // Initialize AI Team integration
    initializeAITeam();
    
    // Chat input
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    
    if (chatInput && chatSend) {
        // Add focus/blur feedback
        chatInput.addEventListener('focus', () => {
            if (window.visualFeedback) {
                window.visualFeedback.addInputFeedback(chatInput, 'focus');
            }
        });
        chatInput.addEventListener('blur', () => {
            if (window.visualFeedback) {
                window.visualFeedback.removeInputFeedback(chatInput);
            }
        });
        
        chatSend.addEventListener('click', async (e) => {
            if (window.visualFeedback) {
                window.visualFeedback.addRipple(chatSend, e);
                window.visualFeedback.addButtonFeedback(chatSend, 'sending...', 'loading');
            }
            const message = chatInput.value.trim();
            if (message) {
                try {
                    await handleChatMessage(message);
                    if (window.visualFeedback) {
                        window.visualFeedback.addButtonFeedback(chatSend, 'sent!', 'success');
                    }
                } catch (error) {
                    if (window.visualFeedback) {
                        window.visualFeedback.addButtonFeedback(chatSend, 'error!', 'error');
                    }
                }
            } else {
                if (window.visualFeedback) {
                    window.visualFeedback.removeButtonFeedback(chatSend);
                }
            }
        });
        
        chatInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = chatInput.value.trim();
                if (message) {
                    if (window.visualFeedback) {
                        window.visualFeedback.addInputFeedback(chatInput, 'typing');
                    }
                    try {
                        await handleChatMessage(message);
                        if (window.visualFeedback) {
                            window.visualFeedback.addInputFeedback(chatInput, 'success');
                            setTimeout(() => {
                                window.visualFeedback.removeInputFeedback(chatInput);
                            }, 1000);
                        }
                    } catch (error) {
                        if (window.visualFeedback) {
                            window.visualFeedback.addInputFeedback(chatInput, 'error');
                        }
                    }
                }
            }
        });
    }
    
    // Clear chat
    document.getElementById('ai-clear')?.addEventListener('click', (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('ai-clear'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('ai-clear'), 'clearing...', 'loading');
        }
        const messages = document.getElementById('chat-messages');
        if (messages) {
            messages.innerHTML = '';
            addChatMessage('ai', 'Hello! I\'m your AI assistant. How can I help you create music today?');
        }
        if (window.visualFeedback) {
            setTimeout(() => {
                window.visualFeedback.addButtonFeedback(document.getElementById('ai-clear'), 'cleared!', 'success');
            }, 100);
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
        settingsBtn.addEventListener('click', (e) => {
            if (window.visualFeedback) {
                window.visualFeedback.addRipple(settingsBtn, e);
                window.visualFeedback.addButtonFeedback(settingsBtn, null, 'click');
            }
            if (window.showSettingsPanel) {
                window.showSettingsPanel();
            }
        });
    }
}

// Refresh connection button handler
function setupRefreshConnectionButton() {
    const refreshBtn = elements.btnRefreshConnection;
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async (e) => {
            if (window.visualFeedback) {
                window.visualFeedback.addRipple(refreshBtn, e);
            }
            
            // Add spinning animation
            refreshBtn.style.transform = 'rotate(360deg)';
            refreshBtn.style.transition = 'transform 0.5s ease-in-out';
            
            // Update status to show connecting
            updateConnectionStatus(false, 'CONNECTING...');
            
            try {
                // First check server status
                let serverStatus = null;
                if (window.sergikAPI && window.sergikAPI.checkServerStatus) {
                    serverStatus = await window.sergikAPI.checkServerStatus();
                }
                
                // If server is not responding, try to start/restart it
                if (!serverStatus || !serverStatus.serverResponding) {
                    updateConnectionStatus(false, 'STARTING SERVER...');
                    
                    // Try to restart the server
                    if (window.sergikAPI && window.sergikAPI.restartServer) {
                        const restartResult = await window.sergikAPI.restartServer();
                        if (restartResult.success) {
                            // Wait a bit for server to start
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        } else {
                            // If restart failed, try starting
                            if (window.sergikAPI && window.sergikAPI.startServer) {
                                const startResult = await window.sergikAPI.startServer();
                                if (startResult.success) {
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                }
                            }
                        }
                    }
                }
                
                // Now check connection
                await checkConnection();
            } catch (error) {
                console.error('[Renderer] Connection refresh failed:', error);
                updateConnectionStatus(false, 'CONNECTION FAILED');
            }
            
            // Reset animation after a delay
            setTimeout(() => {
                refreshBtn.style.transform = 'rotate(0deg)';
            }, 500);
        });
    }
}

// Analyze Tab Setup
function setupAnalyzeTab() {
    // Analysis buttons (redundant buttons removed - functionality now in input interface)
    
    document.getElementById('btn-dna-match')?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('btn-dna-match'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('btn-dna-match'), 'matching...', 'loading');
        }
        try {
        await handleDNAMatch();
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('btn-dna-match'), 'matched!', 'success');
            }
        } catch (error) {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('btn-dna-match'), 'error!', 'error');
            }
        }
    });
    
    document.getElementById('btn-export-analysis')?.addEventListener('click', async (e) => {
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(document.getElementById('btn-export-analysis'), e);
            window.visualFeedback.addButtonFeedback(document.getElementById('btn-export-analysis'), 'exporting...', 'loading');
        }
        try {
        await handleExport();
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('btn-export-analysis'), 'exported!', 'success');
            }
        } catch (error) {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(document.getElementById('btn-export-analysis'), 'error!', 'error');
            }
        }
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
            
            // Use IPC handler for DNA analysis
            if (window.sergikAPI) {
                const fileResult = await window.sergikAPI.selectFileForAnalysis();
                if (fileResult.success) {
                    const result = await window.sergikAPI.gptAnalyze(fileResult.filePath);
                    if (result.success) {
                        displayDNAMatchResults(result.data);
                        addAction('DNA match complete', 'success');
                        return;
                    } else {
                        throw new Error(result.error || 'DNA match failed');
                    }
                }
            }
            
            // Fallback: direct API call
            const apiBaseUrl = await window.sergikAPI?.getApiBaseUrl() || 'http://localhost:8000';
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
    document.getElementById('commit-btn')?.addEventListener('click', async (e) => {
        const commitBtn = document.getElementById('commit-btn');
        if (window.visualFeedback) {
            window.visualFeedback.addRipple(commitBtn, e);
            window.visualFeedback.addButtonFeedback(commitBtn, 'committing...', 'loading');
        }
        try {
            await commitToTrack();
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(commitBtn, 'committed!', 'success');
            }
        } catch (error) {
            if (window.visualFeedback) {
                window.visualFeedback.addButtonFeedback(commitBtn, 'error!', 'error');
            }
        }
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
    
    // Save to recent searches
    if (window.libraryWorkflowOptimizer) {
        window.libraryWorkflowOptimizer.saveRecentSearch(query);
    }
    
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
        itemDiv.setAttribute('data-context-menu', 'media-item');
        
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
        
        // Click handlers are now managed by LibraryWorkflowOptimizer
        // Single click = select, double click = load
        
        mediaList.appendChild(itemDiv);
    });
    
    updateMediaCount();
    
    // Dispatch event for workflow optimizer to attach listeners
    document.dispatchEvent(new CustomEvent('mediaItemsRendered', { 
        detail: { items: items } 
    }));
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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:2196',message:'loadMediaIntoEditor entry',data:{mediaId,mediaIdType:typeof mediaId,isFilePath:mediaId?.includes('/')||mediaId?.includes('\\')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    // Check if mediaId is a file path (contains / or \)
    const isFilePath = mediaId && (mediaId.includes('/') || mediaId.includes('\\'));
    
    try {
        if (window.sergikAPI) {
            if (isFilePath) {
                // For file paths, try to find the media ID by searching for the filename
                const filename = mediaId.split(/[/\\]/).pop();
                const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
                
                addAction(`Searching for media ID: ${filename}...`, 'info');
                
                // Try to search for the file by name
                const searchResult = await window.sergikAPI.browserSearch(`name:${nameWithoutExt}`);
                
                if (searchResult.success && searchResult.data && searchResult.data.items) {
                    // Find exact match by path
                    const exactMatch = searchResult.data.items.find(item => 
                        item.path === mediaId || item.path?.endsWith(filename)
                    );
                    
                    if (exactMatch && exactMatch.id) {
                        // Use the found media ID
                        mediaId = exactMatch.id;
                        addAction(`Found media ID: ${mediaId}`, 'success');
                    } else if (searchResult.data.items.length > 0) {
                        // Use first match if no exact match
                        mediaId = searchResult.data.items[0].id;
                        addAction(`Using first match: ${mediaId}`, 'info');
                    } else {
                        // If search fails, try loading by path directly (some APIs support this)
                        addAction(`File not found in browser. Loading by path...`, 'info');
                        const pathResult = await window.sergikAPI.browserLoad({ 
                            item_id: mediaId,
                            path: mediaId  // Some APIs accept path as fallback
                        });
                        
                        if (pathResult && pathResult.success) {
                            addAction(`Media loaded by path`, 'success');
                            if (pathResult.data) {
                                updateEditorWithMedia(pathResult.data);
                            }
                            return;
                        } else {
                            // Last resort: load into audio engine for preview only
                            addAction(`Cannot load into Ableton browser. File available for preview only.`, 'warning');
                            if (window.libraryAudioManager) {
                                const mediaType = mediaId.endsWith('.mid') ? 'midi' : 'audio';
                                window.libraryAudioManager.selectMediaItem(mediaId, mediaType);
                            }
                            return;
                        }
                    }
                } else {
                    // Search failed, try direct path load
                    addAction(`Search failed. Trying direct path load...`, 'info');
                    const pathResult = await window.sergikAPI.browserLoad({ 
                        item_id: mediaId,
                        path: mediaId
                    });
                    
                    if (pathResult && pathResult.success) {
                        addAction(`Media loaded by path`, 'success');
                        if (pathResult.data) {
                            updateEditorWithMedia(pathResult.data);
                        }
                        return;
                    } else {
                        // Fallback to audio engine preview
                        addAction(`Cannot load into Ableton browser. File available for preview only.`, 'warning');
                        if (window.libraryAudioManager) {
                            const mediaType = mediaId.endsWith('.mid') ? 'midi' : 'audio';
                            window.libraryAudioManager.selectMediaItem(mediaId, mediaType);
                        }
                        return;
                    }
                }
            }
            
            // Load using media ID
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:2201',message:'Calling browserLoad',data:{item_id:mediaId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
            // #endregion
            const result = await window.sergikAPI.browserLoad({ item_id: mediaId });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:2202',message:'browserLoad result',data:{success:result?.success,error:result?.error,statusCode:result?.statusCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
            // #endregion
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
        // Fallback: try to load into audio engine for preview
        if (isFilePath && window.libraryAudioManager) {
            try {
                const mediaType = mediaId.endsWith('.mid') ? 'midi' : 'audio';
                await window.libraryAudioManager.selectMediaItem(mediaId, mediaType);
                addAction(`Loaded for preview only`, 'info');
            } catch (previewError) {
                console.warn('[loadMediaIntoEditor] Preview fallback failed:', previewError);
            }
        }
    }
}

async function handleMediaAction(action) {
    const selectedItem = document.querySelector('.browser-item.selected');
    if (!selectedItem) {
        addAction('No item selected', 'error');
        return;
    }
    
    const mediaId = selectedItem.dataset.mediaId;
    
    // Get track/slot from workflow optimizer if available
    let trackIndex = 0;
    let slotIndex = undefined;
    if (window.libraryWorkflowOptimizer) {
        const target = window.libraryWorkflowOptimizer.getSelectedTrackSlot();
        trackIndex = target.trackIndex;
        slotIndex = target.slotIndex;
    }
    
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

// Audio Engine Integration
let currentPreviewMedia = null;
let audioAnalyzer = null;

async function handlePreview(action) {
    const btn = document.getElementById(`preview-${action}`);
    if (!btn) return;
    
    // Get selected media item
    const selectedMedia = document.querySelector('.browser-item.selected');
    if (!selectedMedia && action !== 'stop') {
        addAction('No media selected for preview', 'warning');
        return;
    }
    
    const mediaPath = selectedMedia?.dataset.mediaPath;
    const mediaType = selectedMedia?.dataset.mediaType;
    
    // Only handle audio files for now
    if (mediaType !== 'audio' && mediaType !== 'midi' && action !== 'stop') {
        addAction('Preview only available for audio files', 'info');
        return;
    }
    
    try {
        // Initialize audio engine if needed
        if (!window.audioEngine) {
            addAction('Audio engine not available', 'error');
            return;
        }
        
        await window.audioEngine.resume();
        
        switch (action) {
            case 'play':
                if (mediaPath && mediaPath !== currentPreviewMedia) {
                    // Load new audio file
                    await window.audioEngine.loadAudioFile(mediaPath);
                    currentPreviewMedia = mediaPath;
                    
                    // Create analyzer for visualization
                    if (!audioAnalyzer && window.AudioAnalyzer) {
                        const audioContext = window.audioEngine.getAudioContext();
                        audioAnalyzer = new window.AudioAnalyzer(audioContext);
                        audioAnalyzer.onUpdate = (data) => {
                            // Update waveform visualization if canvas exists
                            const waveformCanvas = document.getElementById('waveform-canvas');
                            if (waveformCanvas) {
                                audioAnalyzer.drawWaveform(waveformCanvas);
                            }
                        };
                    }
                }
                
                // Play audio
                await window.audioEngine.playAudio();
                btn.classList.add('active');
                
                // Setup analyzer for visualization
                if (window.AudioAnalyzer) {
                    // Stop existing analyzer if any
                    if (audioAnalyzer) {
                        audioAnalyzer.stop();
                        audioAnalyzer.disconnect();
                    }
                    
                    const audioContext = window.audioEngine.getAudioContext();
                    audioAnalyzer = new window.AudioAnalyzer(audioContext);
                    
                    // Connect analyzer in parallel to master gain
                    // Web Audio API supports multiple connections from a node
                    const masterGain = window.audioEngine.getMasterGain();
                    masterGain.connect(audioAnalyzer.getNode());
                    
                    // Update visualization
                    audioAnalyzer.onUpdate = (data) => {
                        // Update waveform canvas in Library tab
                        const waveformCanvas = document.getElementById('waveform-canvas');
                        if (waveformCanvas) {
                            audioAnalyzer.drawWaveform(waveformCanvas);
                        }
                    };
                    
                    audioAnalyzer.start();
                }
                
                addAction('Playing preview...', 'info');
                break;
                
            case 'stop':
                window.audioEngine.stopAudio();
                currentPreviewMedia = null;
                btn.classList.remove('active');
                
                // Stop analyzer
                if (audioAnalyzer) {
                    audioAnalyzer.stop();
                }
                
                addAction('Preview stopped', 'info');
                break;
                
            case 'loop':
                const loopEnabled = !window.audioEngine.loop;
                window.audioEngine.setLoop(loopEnabled);
                btn.classList.toggle('active', loopEnabled);
                addAction(`Loop ${loopEnabled ? 'enabled' : 'disabled'}`, 'info');
                break;
        }
    } catch (error) {
        console.error('[Renderer] Preview error:', error);
        addAction(`Preview error: ${error.message}`, 'error');
        btn.classList.remove('active');
    }
}

// AI Team Integration
let aiTeamAgents = [];
let aiTeamConnected = false;

async function initializeAITeam() {
    // Check AI Team health on startup
    await checkAITeamHealth();
    
    // Load available agents
    await loadAITeamAgents();
}

async function checkAITeamHealth() {
    const statusIndicator = document.getElementById('ai-team-status');
    if (!statusIndicator) return;
    
    // Set checking state
    statusIndicator.className = 'ai-team-status-indicator checking';
    statusIndicator.querySelector('span:last-child').textContent = 'Checking...';
    
    try {
        if (window.sergikAPI && window.sergikAPI.checkAITeamHealth) {
            const result = await window.sergikAPI.checkAITeamHealth();
            
            if (result.success) {
                aiTeamConnected = true;
                statusIndicator.className = 'ai-team-status-indicator connected';
                statusIndicator.querySelector('span:last-child').textContent = 'Connected';
            } else {
                aiTeamConnected = false;
                statusIndicator.className = 'ai-team-status-indicator disconnected';
                statusIndicator.querySelector('span:last-child').textContent = 'Disconnected';
            }
        } else {
            aiTeamConnected = false;
            statusIndicator.className = 'ai-team-status-indicator disconnected';
            statusIndicator.querySelector('span:last-child').textContent = 'Unavailable';
        }
    } catch (error) {
        aiTeamConnected = false;
        statusIndicator.className = 'ai-team-status-indicator disconnected';
        statusIndicator.querySelector('span:last-child').textContent = 'Error';
        console.error('[Renderer] AI Team health check failed:', error);
    }
}

async function loadAITeamAgents() {
    try {
        if (window.sergikAPI && window.sergikAPI.listAITeamAgents) {
            const result = await window.sergikAPI.listAITeamAgents();
            
            if (result.success && result.agents && result.agents.length > 0) {
                aiTeamAgents = result.agents;
                updateAgentSelector();
            } else {
                // Use default agents if API fails
                aiTeamAgents = ['SergikCore', 'DevAssistant', 'ControllerDev', 'VSTCraft', 'AbleAgent', 'GrooveSense', 'Memoria'];
                updateAgentSelector();
            }
        } else {
            // Use default agents if API not available
            aiTeamAgents = ['SergikCore', 'DevAssistant', 'ControllerDev', 'VSTCraft', 'AbleAgent', 'GrooveSense', 'Memoria'];
            updateAgentSelector();
        }
    } catch (error) {
        console.error('[Renderer] Failed to load AI Team agents:', error);
        // Use default agents on error
        aiTeamAgents = ['SergikCore', 'DevAssistant', 'ControllerDev', 'VSTCraft', 'AbleAgent', 'GrooveSense', 'Memoria'];
        updateAgentSelector();
    }
}

function updateAgentSelector() {
    const agentSelect = document.getElementById('ai-agent-select');
    if (!agentSelect) return;
    
    // Clear existing options except the first one (if it exists)
    const currentValue = agentSelect.value;
    agentSelect.innerHTML = '';
    
    // Agent display names
    const agentNames = {
        'SergikCore': 'SergikCore (Orchestrator)',
        'DevAssistant': 'DevAssistant (Code Help)',
        'ControllerDev': 'ControllerDev (Controller Dev)',
        'VSTCraft': 'VSTCraft (Music Generation)',
        'AbleAgent': 'AbleAgent (Ableton Live)',
        'GrooveSense': 'GrooveSense (Audio Analysis)',
        'Memoria': 'Memoria (Knowledge Base)',
        'AuralBrain': 'AuralBrain (Training)',
        'MaxNode': 'MaxNode (Max for Live)'
    };
    
    aiTeamAgents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent;
        option.textContent = agentNames[agent] || agent;
        agentSelect.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (currentValue && aiTeamAgents.includes(currentValue)) {
        agentSelect.value = currentValue;
    }
}

// AI Tab Functions
async function handleChatMessage(message) {
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const agentSelect = document.getElementById('ai-agent-select');
    
    if (!chatMessages) return;
    
    // Get selected agent
    const selectedAgent = agentSelect ? agentSelect.value : 'SergikCore';
    
    // Add user message
    addChatMessage('user', message);
    
    if (chatInput) {
        chatInput.value = '';
    }
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        // Check if AI Team is connected
        if (!aiTeamConnected) {
            // Re-check connection
            await checkAITeamHealth();
        }
        
        if (window.sergikAPI && window.sergikAPI.sendAITeamMessage && aiTeamConnected) {
            // Send message to AI Team
            const result = await window.sergikAPI.sendAITeamMessage(selectedAgent, message);
            
            // Remove typing indicator
            removeTypingIndicator(typingIndicator);
            
            if (result.success) {
                // Add AI response
                addChatMessage('ai', result.reply || 'No response from agent.');
            } else {
                // Show error message
                addChatMessage('ai', `Error: ${result.error || 'Failed to get response from AI Team'}`);
            }
        } else {
            // Fallback: simulate response if AI Team not available
            removeTypingIndicator(typingIndicator);
    setTimeout(() => {
                addChatMessage('ai', `I understand you want to "${message}". The AI Team server is not connected. Please ensure the SERGIK AI Team server is running on port 8001.`);
    }, 500);
        }
    } catch (error) {
        removeTypingIndicator(typingIndicator);
        console.error('[Renderer] Error sending message to AI Team:', error);
        addChatMessage('ai', `Error: ${error.message || 'Failed to communicate with AI Team'}`);
    }
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return null;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message ai typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="message-text">Typing...</div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return typingDiv;
}

function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    } else {
        const existing = document.getElementById('typing-indicator');
        if (existing) {
            existing.parentNode.removeChild(existing);
        }
    }
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
    // Use default values since dropdowns are removed
    const slot = 'next';  // Default to next empty slot
    const trackIndex = 0;  // Default to first track
    const slotIndex = undefined;  // undefined means next empty
    
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1799',message:'checkConnection entry',data:{hasSergikAPI:!!window.sergikAPI,hasCheckHealth:!!(window.sergikAPI&&window.sergikAPI.checkHealth)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
        if (window.sergikAPI) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1802',message:'calling checkHealth',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const startTime = Date.now();
        let result;
        console.log('[Renderer Debug] Starting checkHealth call', { 
          hasSergikAPI: !!window.sergikAPI,
          hasCheckHealth: !!(window.sergikAPI && window.sergikAPI.checkHealth),
          timestamp: new Date().toISOString()
        });
        try {
            const healthPromise = window.sergikAPI.checkHealth();
            console.log('[Renderer Debug] checkHealth promise created', { isPromise: healthPromise instanceof Promise });
            result = await Promise.race([
                healthPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('IPC timeout after 10s')), 10000))
            ]);
            console.log('[Renderer Debug] checkHealth completed', { result, duration: Date.now() - startTime });
        } catch (ipcError) {
            console.error('[Renderer Debug] checkHealth error', ipcError);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1806',message:'checkHealth IPC error',data:{errorMessage:ipcError?.message,errorName:ipcError?.name,duration:Date.now()-startTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'T'})}).catch(()=>{});
            // #endregion
            throw ipcError;
        }
        const duration = Date.now() - startTime;
        console.log('[Renderer Debug] checkHealth result', { success: result?.success, duration, error: result?.error });
        // #region agent log
        try {
            fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1814',message:'checkHealth result',data:{success:result?.success,hasStatus:!!result?.status,hasService:!!result?.service,error:result?.error,duration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        } catch (e) {
            console.error('[Renderer] Log fetch error:', e);
        }
        // #endregion
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1852',message:'AFTER ENDREGION - CODE REACHED',data:{hasResult:!!result,success:result?.success},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'EXEC_TEST'})}).catch(()=>{});
        // #endregion
        
        // CRITICAL: Update connection status IMMEDIATELY - no async operations
        const shouldConnect = result && result.success;
        const statusText = shouldConnect ? 'CONNECTED' : 'DISCONNECTED';
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1856',message:'VARIABLES CALCULATED',data:{shouldConnect,statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'VARS'})}).catch(()=>{});
        // #endregion
        
        // Update UI DIRECTLY - synchronous DOM operations
        const statusLed = document.getElementById('status-led');
        const statusTextEl = document.getElementById('status-text');
        const statusLedDisplay = document.getElementById('status-led-display');
        const statusTextDisplay = document.getElementById('status-text-display');
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1865',message:'DOM ELEMENTS RETRIEVED',data:{hasStatusLed:!!statusLed,hasStatusText:!!statusTextEl,hasStatusLedDisplay:!!statusLedDisplay,hasStatusTextDisplay:!!statusTextDisplay},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DOM'})}).catch(()=>{});
        // #endregion
        
        console.log('[Renderer] Updating UI directly', { shouldConnect, statusText, hasStatusLed: !!statusLed, hasStatusText: !!statusTextEl });
        
        if (statusLed) {
            statusLed.classList.toggle('connected', shouldConnect);
            statusLed.classList.toggle('disconnected', !shouldConnect);
        }
        if (statusTextEl) {
            statusTextEl.textContent = statusText;
        }
        if (statusLedDisplay) {
            statusLedDisplay.classList.toggle('connected', shouldConnect);
            statusLedDisplay.classList.toggle('disconnected', !shouldConnect);
        }
        if (statusTextDisplay) {
            statusTextDisplay.textContent = shouldConnect ? 'Ready' : 'Not Ready';
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1880',message:'UI UPDATE COMPLETED',data:{shouldConnect,statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'UI_DONE'})}).catch(()=>{});
        // #endregion
        
        console.log('[Renderer] UI update completed', { shouldConnect, statusText });
        
        // Also call updateConnectionStatus for consistency (async, won't block)
        try {
            updateConnectionStatus(shouldConnect, statusText);
        } catch (e) {
            console.error('[Renderer] updateConnectionStatus failed:', e);
        }
        } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1809',message:'window.sergikAPI undefined',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            updateConnectionStatus(false, 'NO API');
        }
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1812',message:'checkConnection error',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        updateConnectionStatus(false, 'ERROR');
        console.error('[Renderer] Connection check failed:', error);
    }
}

function updateConnectionStatus(connected, text) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1868',message:'updateConnectionStatus called',data:{connected,text,hasStatusLed:!!elements.statusLed,hasStatusText:!!elements.statusText,hasStatusLedDisplay:!!elements.statusLedDisplay,hasStatusTextDisplay:!!elements.statusTextDisplay},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'UI_UPDATE'})}).catch(()=>{});
    // #endregion
    console.log('[Renderer] updateConnectionStatus called', { connected, text, hasStatusLed: !!elements.statusLed, hasStatusText: !!elements.statusText });
    if (elements.statusLed) {
        elements.statusLed.classList.toggle('connected', connected);
        elements.statusLed.classList.toggle('disconnected', !connected);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1872',message:'statusLed updated',data:{connected,hasClassList:!!elements.statusLed.classList},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'UI_UPDATE'})}).catch(()=>{});
        // #endregion
    }
    if (elements.statusText) {
        elements.statusText.textContent = text;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1877',message:'statusText updated',data:{text,textContent:elements.statusText.textContent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'UI_UPDATE'})}).catch(()=>{});
        // #endregion
    }
    if (elements.statusLedDisplay) {
        elements.statusLedDisplay.classList.toggle('connected', connected);
        elements.statusLedDisplay.classList.toggle('disconnected', !connected);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1882',message:'statusLedDisplay updated',data:{connected},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'UI_UPDATE'})}).catch(()=>{});
        // #endregion
    }
    if (elements.statusTextDisplay) {
        const displayText = connected ? 'Ready' : 'Not Ready';
        elements.statusTextDisplay.textContent = displayText;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'renderer.js:1888',message:'statusTextDisplay updated',data:{connected,displayText,textContent:elements.statusTextDisplay.textContent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'UI_UPDATE'})}).catch(()=>{});
        // #endregion
    }
}

// Generation
// Make handleGenerate available globally for batch mode
window.handleGenerate = handleGenerate;

// Helper function to get sub-category label
function getSubCategoryLabel(type, subCategoryId) {
    if (!subCategoryId || !window.createTabEnhancements) return '';
    const subCat = window.createTabEnhancements.getSubCategories(type)
        .find(s => s.id === subCategoryId);
    return subCat ? subCat.label : subCategoryId;
}

async function handleGenerate(type, subCategory = null) {
    // Check offline
    if (window.errorHandler && window.errorHandler.checkOffline()) {
        return;
    }
    
    const params = {
        type: type,
        subCategory: subCategory, // Add sub-category to params
        genre: elements.genreSelect?.value || 'house',
        tempo: parseInt(elements.tempoSelect?.value) || 124,
        energy: parseInt(elements.energySelect?.value) || 6,
        bars: parseInt(elements.lengthBarsSelect?.value) || 8,
        measureType: elements.lengthMeasureTypeSelect?.value || '',
        key: elements.keySelect?.value || '10B',
        track: 'new',  // Always use 'new' as default (auto-create track)
        slot: 'next',  // Always use 'next' as default (next empty slot)
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
    // Get sub-category label for logging
    const subCatLabel = params.subCategory ? getSubCategoryLabel(type, params.subCategory) : '';
    const actionLabel = subCatLabel ? `${type} - ${subCatLabel}` : type;
    addAction(`Generating ${actionLabel}...`, 'info');
    updateStatus('Processing', 'yellow');
    
    let generatedData = null;
    let saveResult = null;
    
    try {
        if (!window.sergikAPI) {
            throw new Error('API not available');
        }
        
        // Map type to API call with subCategory
        let result;
        switch (type) {
            case 'kicks':
            case 'claps':
            case 'hats':
            case 'percussion':
                const drumParams = {
                    genre: params.genre, 
                    bars: params.bars, 
                    tempo: params.tempo,
                    subCategory: params.subCategory,  // Add subCategory
                    output_format: params.audio ? 'audio' : 'midi'  // Request audio format if audio toggle is on
                };
                // Only include measureType if it's not empty
                if (params.measureType) {
                    drumParams.measureType = params.measureType;
                }
                result = await window.sergikAPI.generateDrums(drumParams);
                break;
            case 'bass':
                const bassParams = {
                    key: params.key, 
                    bars: params.bars, 
                    style: params.genre, 
                    tempo: params.tempo,
                    subCategory: params.subCategory  // Add subCategory
                };
                // Only include measureType if it's not empty
                if (params.measureType) {
                    bassParams.measureType = params.measureType;
                }
                result = await window.sergikAPI.generateBass(bassParams);
                break;
            case 'synths':
            case 'vocals':
            case 'fx':
                // Include subCategory, measure type, and bar count in GPT prompt
                const measureTypeText = params.measureType ? ` for a ${params.measureType} section` : '';
                const prompt = subCatLabel ? 
                    `Generate ${subCatLabel} ${type} for ${params.genre} at ${params.tempo} BPM${measureTypeText} (${params.bars} bars)` :
                    `Generate ${type} for ${params.genre} at ${params.tempo} BPM${measureTypeText} (${params.bars} bars)`;
                result = await window.sergikAPI.gptGenerate(prompt);
                break;
            default:
                result = { success: false, error: 'Unknown generation type' };
        }
        
        // Handle result
        if (result.success && result.data) {
            generatedData = result.data;
            
            // Check if audio format was generated
            const isAudioFormat = result.data.format === 'audio' || result.data.audio_path;
            const shouldSaveAudio = params.audio || isAudioFormat;
            
            // Save to library automatically with enhanced metadata integration
            try {
                let audioArrayBuffer = null;
                
                if (shouldSaveAudio && result.data.audio_path) {
                    // Handle audio file generation
                    const audioPath = result.data.audio_path;
                    
                    // Read audio file from server path
                    try {
                        // Fetch audio file from server
                        const apiBaseUrl = window.sergikAPI?.apiBaseUrl || 'http://127.0.0.1:8000';
                        const audioResponse = await fetch(`${apiBaseUrl}/files/audio?path=${encodeURIComponent(audioPath)}`);
                        
                        if (audioResponse.ok) {
                            const audioBlob = await audioResponse.blob();
                            audioArrayBuffer = await audioBlob.arrayBuffer();
                        } else {
                            console.warn('[Renderer] Could not fetch audio from server');
                            saveResult = { success: false, error: 'Could not retrieve audio file from server' };
                        }
                    } catch (audioError) {
                        console.error('[Renderer] Failed to fetch audio file:', audioError);
                        saveResult = { success: false, error: audioError.message };
                    }
                }
                
                // Use enhanced bridge if available, otherwise fallback to standard save
                if (window.generationLibraryBridge && (audioArrayBuffer || !shouldSaveAudio)) {
                    // Build metadata from generation context
                    const metadata = window.generationLibraryBridge.buildMetadataFromGeneration(
                        type,
                        params,
                        result
                    );

                    // Save with metadata integration
                    const fileData = shouldSaveAudio ? audioArrayBuffer : result.data;
                    saveResult = await window.generationLibraryBridge.saveGeneratedFileWithMetadata(
                        fileData,
                        metadata,
                        shouldSaveAudio ? 'audio' : 'midi'
                    );
                } else {
                    // Fallback to standard save
                    if (shouldSaveAudio && audioArrayBuffer) {
                        const filename = `${type}_${params.genre || 'default'}_${Date.now()}.wav`;
                        saveResult = await window.sergikAPI.saveAudioToLibrary(
                            Array.from(new Uint8Array(audioArrayBuffer)),
                            filename
                        );
                    } else {
                        const filename = `${type}_${params.genre || 'default'}_${Date.now()}.mid`;
                        saveResult = await window.sergikAPI.saveMidiToLibrary(
                            result.data,
                            filename
                        );
                    }
                }
                
                if (saveResult.success) {
                    addAction(`Generated and saved ${actionLabel} to library`, 'success');
                    if (saveResult.filePath) {
                        addAction(`Location: ${saveResult.filePath}`, 'info');
                    }
                    if (saveResult.mediaId) {
                        addAction(`Indexed as: ${saveResult.mediaId}`, 'info');
                    }
                    
                    // Add to generated files list
                    if (window.createTabEnhancements) {
                        window.createTabEnhancements.addGeneratedFile({
                            name: saveResult.filePath ? saveResult.filePath.split(/[/\\]/).pop() : `${type}_${params.genre || 'default'}.${shouldSaveAudio ? 'wav' : 'mid'}`,
                            filePath: saveResult.filePath,
                            path: saveResult.filePath,
                            type: shouldSaveAudio ? 'audio' : 'midi',
                            generationType: type,
                            timestamp: Date.now(),
                            metadata: {
                                genre: params.genre,
                                tempo: params.tempo,
                                energy: params.energy,
                                bars: params.bars,
                                measureType: params.measureType,
                                subCategory: params.subCategory
                            }
                        });
                    }
                    
                    // Dispatch generation complete event
                    document.dispatchEvent(new CustomEvent('generationComplete', {
                        detail: {
                            type: type,
                            params: params,
                            result: result,
                            saveResult: saveResult
                        }
                    }));
                    
                    // Add to undo history
                    if (window.undoManager && window.ActionCreators) {
                        const action = window.ActionCreators.generation(type, params, {
                            data: generatedData,
                            filename: saveResult.filePath || `${type}_${params.genre || 'default'}_${Date.now()}.${shouldSaveAudio ? 'wav' : 'mid'}`
                        });
                        window.undoManager.addAction(action);
                    }
                } else {
                    addAction(`Generated ${actionLabel} but failed to save: ${saveResult.error}`, 'warning');
                }
            } catch (saveError) {
                console.warn('[Renderer] Failed to save to library:', saveError);
                addAction(`Generated ${actionLabel} (save to library failed)`, 'warning');
            }
            
            updateStatus('Ready', 'green');
            
            // Update media preview
            if (window.createTabEnhancements) {
                const previewType = params.audio && !params.midi ? 'audio' : 
                                   params.midi && !params.audio ? 'midi' : 
                                   params.audio && params.midi ? 'both' : 'midi';
                window.createTabEnhancements.updateMediaPreview({
                    audio: params.audio ? generatedData : null,
                    midi: params.midi ? generatedData : null,
                    notes: result.data?.notes || [],
                    waveform: result.data?.waveform || [],
                    filePath: saveResult?.filePath || null // Include file path for audio preview
                }, previewType);
            }
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
    
    // Check if ruler exists and is a canvas element
    if (ruler && ruler instanceof HTMLCanvasElement) {
        const ctx = ruler.getContext('2d');
        if (!ctx) {
            console.warn('[Renderer] Could not get 2d context from timeline ruler');
            return;
        }
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
    } else if (ruler) {
        // Ruler element exists but is not a canvas - log warning
        console.warn('[Renderer] Timeline ruler element is not a canvas element');
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
    let currentMouseX = 0;
    let currentMouseY = 0;
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
    
    // Calculate popup position based on mouse pointer
    function calculatePopupPosition(mouseX, mouseY) {
        const popup = popupElement;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Offset from mouse pointer
        const offsetX = 15;
        const offsetY = 15;
        
        // Default: to the right and below pointer
        let left = mouseX + offsetX;
        let top = mouseY + offsetY;
        let position = 'below';
        
        // Check if popup would overflow viewport
        const popupWidth = 250; // max-width
        const popupHeight = 100; // estimated
        
        // Check right overflow - show to the left of pointer instead
        if (left + popupWidth > viewportWidth) {
            left = mouseX - popupWidth - offsetX;
        }
        
        // Check left overflow
        if (left < 0) {
            left = 10;
        }
        
        // Check bottom overflow - show above pointer instead
        if (top + popupHeight > viewportHeight) {
            top = mouseY - popupHeight - offsetY;
            position = 'above';
        }
        
        // Check top overflow
        if (top < 0) {
            top = 10;
        }
        
        return { top, left, position };
    }
    
    // Show popup
    function showInfoPopup(element, info, mouseX, mouseY) {
        if (!info) return;
        
        const popup = createInfoPopup();
        const pos = calculatePopupPosition(mouseX || currentMouseX, mouseY || currentMouseY);
        
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
        
        // Position popup using fixed positioning
        popup.style.position = 'fixed';
        popup.style.top = pos.top + 'px';
        popup.style.left = pos.left + 'px';
        popup.style.transform = 'none'; // Remove translateX since we're positioning from left
        
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
    
    // Update popup position on mouse move
    function updatePopupPosition(mouseX, mouseY) {
        if (!popupElement || !popupElement.classList.contains('visible')) {
            return;
        }
        
        const pos = calculatePopupPosition(mouseX, mouseY);
        popupElement.style.top = pos.top + 'px';
        popupElement.style.left = pos.left + 'px';
        
        // Update arrow position
        if (pos.position === 'above') {
            popupElement.classList.add('above');
        } else {
            popupElement.classList.remove('above');
        }
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
        
        // Store mouse position
        if (e.clientX !== undefined) {
            currentMouseX = e.clientX;
            currentMouseY = e.clientY;
        }
        
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
                showInfoPopup(element, info, currentMouseX, currentMouseY);
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
        
        // Track mouse movement for popup positioning
        document.addEventListener('mousemove', function(e) {
            currentMouseX = e.clientX;
            currentMouseY = e.clientY;
            
            // Update popup position if visible
            if (popupElement && popupElement.classList.contains('visible')) {
                updatePopupPosition(e.clientX, e.clientY);
            }
        });
        
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
                handleMouseEnter(e); // Pass the event to get mouse coordinates
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

// ============================================================================
// Advanced Intelligence Features
// ============================================================================

// Intelligence category definitions with sub-options (global scope)
const INTELLIGENCE_CATEGORIES = {
    'groovy': {
        name: 'Groovy',
        description: 'Funky, rhythmic, and danceable vibes with soulful elements',
        subOptions: ['Deep Groove', 'Funky', 'Soulful', 'Rhythmic', 'Bouncy', 'Swing']
    },
    'chill': {
        name: 'Chill',
        description: 'Relaxed, laid-back, and ambient atmospheres',
        subOptions: ['Ambient', 'Downtempo', 'Lounge', 'Meditative', 'Smooth', 'Relaxed']
    },
    'intense': {
        name: 'Intense',
        description: 'High energy, powerful, and driving compositions',
        subOptions: ['Aggressive', 'Powerful', 'Driving', 'Energetic', 'Hard', 'Punchy']
    },
    'calm': {
        name: 'Calm',
        description: 'Peaceful, serene, and tranquil soundscapes',
        subOptions: ['Peaceful', 'Serene', 'Tranquil', 'Gentle', 'Soft', 'Soothing']
    },
    'social': {
        name: 'Social',
        description: 'Engaging, conversational, and interactive music',
        subOptions: ['Conversational', 'Interactive', 'Engaging', 'Friendly', 'Welcoming', 'Open']
    },
    'productivity': {
        name: 'Productivity',
        description: 'Focus-enhancing, non-distracting background music',
        subOptions: ['Focus', 'Concentration', 'Background', 'Non-Distracting', 'Steady', 'Consistent']
    },
    'creative': {
        name: 'Creative',
        description: 'Inspiring, experimental, and innovative sounds',
        subOptions: ['Experimental', 'Innovative', 'Inspiring', 'Unique', 'Artistic', 'Original']
    },
    'dance_floor': {
        name: 'Dance Floor',
        description: 'High-energy, club-ready, and party-starting tracks',
        subOptions: ['Club', 'Party', 'Festival', 'High Energy', 'Bass Heavy', 'Drop Ready']
    },
    'background': {
        name: 'Background',
        description: 'Subtle, unobtrusive music for ambient environments',
        subOptions: ['Ambient', 'Subtle', 'Unobtrusive', 'Atmospheric', 'Textural', 'Minimal']
    },
    'workout': {
        name: 'Workout',
        description: 'Motivational, high-tempo music for physical activity',
        subOptions: ['Cardio', 'Strength', 'Endurance', 'Motivational', 'Pumping', 'High Tempo']
    }
};

// Intelligence to Key/Scale suggestions mapping
const INTELLIGENCE_KEY_SCALE_SUGGESTIONS = {
    'groovy': {
        keys: ['9B', '10B', '11B', '8B'], // G, D, A, C major - funky keys
        scales: ['major', 'mixolydian', 'pent_major'],
        description: 'Major keys with funky, rhythmic scales'
    },
    'chill': {
        keys: ['8A', '7A', '9A', '5A'], // A, D, E, C minor - relaxed keys
        scales: ['minor', 'dorian', 'pent_minor', 'blues'],
        description: 'Minor keys with laid-back, ambient scales'
    },
    'intense': {
        keys: ['7A', '10A', '11A', '9A'], // D, B, F#, E minor - powerful keys
        scales: ['minor', 'harmonic_minor', 'locrian'],
        description: 'Minor keys with powerful, driving scales'
    },
    'calm': {
        keys: ['8B', '7B', '9B', '8A'], // C, F, G major, A minor - peaceful keys
        scales: ['major', 'minor', 'pent_major', 'pent_minor'],
        description: 'Neutral keys with peaceful, serene scales'
    },
    'social': {
        keys: ['10B', '11B', '9B', '8B'], // D, A, G, C major - friendly keys
        scales: ['major', 'mixolydian', 'lydian'],
        description: 'Major keys with engaging, conversational scales'
    },
    'productivity': {
        keys: ['8B', '7B', '10B', '8A'], // C, F, D major, A minor - neutral keys
        scales: ['major', 'minor', 'dorian'],
        description: 'Neutral keys with focus-enhancing scales'
    },
    'creative': {
        keys: ['10B', '11B', '9B', '7A'], // D, A, G major, D minor - creative keys
        scales: ['dorian', 'lydian', 'mixolydian', 'pent_major'],
        description: 'Various keys with experimental, innovative scales'
    },
    'dance_floor': {
        keys: ['10B', '11B', '9B', '12B'], // D, A, G, E major - energetic keys
        scales: ['major', 'mixolydian', 'pent_major'],
        description: 'Major keys with high-energy, club-ready scales'
    },
    'background': {
        keys: ['8B', '7B', '8A', '7A'], // C, F major, A, D minor - subtle keys
        scales: ['major', 'minor', 'pent_major', 'pent_minor'],
        description: 'Neutral keys with subtle, unobtrusive scales'
    },
    'workout': {
        keys: ['10B', '11B', '9B', '12B'], // D, A, G, E major - motivational keys
        scales: ['major', 'mixolydian', 'pent_major'],
        description: 'Major keys with high-tempo, pumping scales'
    }
};

// Suggest keys and scales based on intelligence category
function suggestKeysAndScalesForIntelligence(intelligenceCategory) {
    if (!intelligenceCategory || !INTELLIGENCE_KEY_SCALE_SUGGESTIONS[intelligenceCategory]) {
        return null;
    }
    
    return INTELLIGENCE_KEY_SCALE_SUGGESTIONS[intelligenceCategory];
}

// Apply intelligence-based suggestions to key and scale selects
function applyIntelligenceSuggestions(intelligenceCategory, autoApply = false) {
    const suggestions = suggestKeysAndScalesForIntelligence(intelligenceCategory);
    if (!suggestions) return;
    
    const keySelect = document.getElementById('key-select');
    const scaleSelect = document.getElementById('scale-select');
    
    if (autoApply) {
        // Auto-apply first suggestion
        if (keySelect && suggestions.keys.length > 0) {
            const suggestedKey = suggestions.keys[0];
            const option = keySelect.querySelector(`option[value="${suggestedKey}"]`);
            if (option) {
                keySelect.value = suggestedKey;
                keySelect.dispatchEvent(new Event('change', { bubbles: true }));
                addAction(`Suggested key: ${suggestedKey} (${intelligenceCategory})`, 'info');
            }
        }
        
        if (scaleSelect && suggestions.scales.length > 0) {
            const suggestedScale = suggestions.scales[0];
            const option = scaleSelect.querySelector(`option[value="${suggestedScale}"]`);
            if (option) {
                scaleSelect.value = suggestedScale;
                scaleSelect.dispatchEvent(new Event('change', { bubbles: true }));
                addAction(`Suggested scale: ${suggestedScale} (${intelligenceCategory})`, 'info');
            }
        }
    }
    
    // Update advanced key panel with suggestions
    updateIntelligenceKeySuggestions(suggestions);
    
    // Update advanced scale panel with suggestions
    updateIntelligenceScaleSuggestions(suggestions);
}

// Update key suggestions in advanced key panel
function updateIntelligenceKeySuggestions(suggestions) {
    const container = document.getElementById('intelligence-key-suggestions');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!suggestions || !suggestions.keys) return;
    
    suggestions.keys.forEach(key => {
        const chip = document.createElement('button');
        chip.className = 'key-chip compatible';
        chip.textContent = formatKeyDisplay(key);
        chip.title = `Suggested for ${suggestions.description || 'intelligence'}`;
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

// Update scale suggestions in advanced scale panel
function updateIntelligenceScaleSuggestions(suggestions) {
    const container = document.getElementById('intelligence-scale-suggestions');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!suggestions || !suggestions.scales) return;
    
    const scaleNames = {
        'major': 'Major',
        'minor': 'Minor',
        'dorian': 'Dorian',
        'phrygian': 'Phrygian',
        'lydian': 'Lydian',
        'mixolydian': 'Mixolydian',
        'locrian': 'Locrian',
        'harmonic_minor': 'Harmonic Minor',
        'melodic_minor': 'Melodic Minor',
        'pent_major': 'Pentatonic Major',
        'pent_minor': 'Pentatonic Minor',
        'blues': 'Blues'
    };
    
    suggestions.scales.forEach(scale => {
        const chip = document.createElement('button');
        chip.className = 'key-chip compatible';
        chip.textContent = scaleNames[scale] || scale;
        chip.title = `Suggested for ${suggestions.description || 'intelligence'}`;
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

// Setup advanced intelligence panel
function setupAdvancedIntelligencePanel() {
    const toggleBtn = document.getElementById('intelligence-advanced-toggle');
    const panel = document.getElementById('advanced-intelligence-panel');
    const closeBtn = document.getElementById('advanced-intelligence-close');
    const intelligenceSelect = document.getElementById('intelligence-select');
    const intelligenceSubSelect = document.getElementById('intelligence-sub-select');
    
    if (!toggleBtn || !panel) return;
    
    // Toggle panel
    toggleBtn.addEventListener('click', () => {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            updateAdvancedIntelligencePanel();
        }
    });
    
    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
        });
    }
    
    // Intelligence change handler
    if (intelligenceSelect) {
        intelligenceSelect.addEventListener('change', () => {
            const category = intelligenceSelect.value;
            updateAdvancedIntelligencePanel();
            
            // Suggest keys and scales based on intelligence
            if (category) {
                applyIntelligenceSuggestions(category, false); // false = don't auto-apply, just show suggestions
            }
        });
    }
    
    // Sub-select change handler
    if (intelligenceSubSelect) {
        intelligenceSubSelect.addEventListener('change', () => {
            updateAdvancedIntelligencePanel();
        });
    }
    
    // Apply suggestions button
    const applyBtn = document.getElementById('apply-intelligence-suggestions');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const category = intelligenceSelect?.value;
            if (category) {
                applyIntelligenceSuggestions(category, true); // true = auto-apply
            }
        });
    }
    
    // Initialize
    updateAdvancedIntelligencePanel();
}

function updateAdvancedIntelligencePanel() {
    const intelligenceSelect = document.getElementById('intelligence-select');
    const intelligenceSubSelect = document.getElementById('intelligence-sub-select');
    if (!intelligenceSelect) return;
    
    const currentCategory = intelligenceSelect.value;
    const currentSub = intelligenceSubSelect?.value || '';
    
    // Update current intelligence display
    const currentIntelligenceDisplay = document.getElementById('current-intelligence-display');
    if (currentIntelligenceDisplay) {
        if (currentCategory) {
            const categoryData = INTELLIGENCE_CATEGORIES[currentCategory];
            currentIntelligenceDisplay.textContent = categoryData?.name || currentCategory;
        } else {
            currentIntelligenceDisplay.textContent = 'None';
        }
    }
    
    // Update current sub display
    const currentSubDisplay = document.getElementById('current-intelligence-sub-display');
    if (currentSubDisplay) {
        currentSubDisplay.textContent = currentSub || 'None';
    }
    
    // Update category quick select
    updateIntelligenceCategories();
    
    // Update category description
    updateIntelligenceDescription(currentCategory);
    
    // Update sub-options
    updateIntelligenceSubOptions(currentCategory);
    
    // Update key and scale suggestions
    if (currentCategory) {
        applyIntelligenceSuggestions(currentCategory, false);
    }
}

function updateIntelligenceCategories() {
    const container = document.getElementById('intelligence-categories');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.keys(INTELLIGENCE_CATEGORIES).forEach(categoryKey => {
        const categoryData = INTELLIGENCE_CATEGORIES[categoryKey];
        const chip = document.createElement('button');
        chip.className = 'key-chip';
        chip.textContent = categoryData.name;
        chip.title = categoryData.description;
        chip.addEventListener('click', () => {
            const intelligenceSelect = document.getElementById('intelligence-select');
            if (intelligenceSelect) {
                intelligenceSelect.value = categoryKey;
                intelligenceSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        container.appendChild(chip);
    });
}

function updateIntelligenceDescription(category) {
    const container = document.getElementById('intelligence-description');
    if (!container) return;
    
    if (category && INTELLIGENCE_CATEGORIES[category]) {
        const categoryData = INTELLIGENCE_CATEGORIES[category];
        container.innerHTML = `
            <div style="font-size: 10px; color: var(--text-secondary); line-height: 1.4;">
                <strong style="color: var(--accent-green);">${categoryData.name}</strong><br>
                ${categoryData.description}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="font-size: 10px; color: var(--text-secondary); line-height: 1.4;">
                Select a category to see details
            </div>
        `;
    }
}

function updateIntelligenceSubOptions(category) {
    const container = document.getElementById('intelligence-sub-options');
    const subSelect = document.getElementById('intelligence-sub-select');
    if (!container || !subSelect) return;
    
    container.innerHTML = '';
    
    if (!category || !INTELLIGENCE_CATEGORIES[category]) {
        subSelect.innerHTML = '<option value="">None</option>';
        return;
    }
    
    const categoryData = INTELLIGENCE_CATEGORIES[category];
    
    // Update dropdown
    subSelect.innerHTML = '<option value="">None</option>';
    categoryData.subOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.toLowerCase().replace(/\s+/g, '_');
        opt.textContent = option;
        subSelect.appendChild(opt);
    });
    
    // Update chip buttons
    categoryData.subOptions.forEach(option => {
        const chip = document.createElement('button');
        chip.className = 'key-chip';
        chip.textContent = option;
        chip.addEventListener('click', () => {
            if (subSelect) {
                subSelect.value = option.toLowerCase().replace(/\s+/g, '_');
                subSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        container.appendChild(chip);
    });
}

// Initialize advanced intelligence panel after constants are defined
if (typeof setupAdvancedIntelligencePanel === 'function') {
    setupAdvancedIntelligencePanel();
}

// Initialize Create Tab Enhancements after elements are initialized
if (typeof CreateTabEnhancements !== 'undefined' && typeof initializeElements === 'function') {
    // Wait for elements to be initialized
    if (Object.keys(elements).length === 0) {
        // Elements not initialized yet, wait a bit
        setTimeout(() => {
            if (typeof CreateTabEnhancements !== 'undefined') {
                window.createTabEnhancements = new CreateTabEnhancements();
                console.log('[Renderer] Create Tab Enhancements initialized');
            }
        }, 200);
    } else {
        window.createTabEnhancements = new CreateTabEnhancements();
        console.log('[Renderer] Create Tab Enhancements initialized');
    }
}

console.log('[Renderer] Script loaded');

