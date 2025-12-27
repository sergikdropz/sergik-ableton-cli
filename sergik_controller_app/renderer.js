/**
 * SERGIK AI Controller - Renderer Process
 * 
 * Handles all UI interactions and API communication.
 */

// State
let isRecording = false;
let recordingStartTime = null;
let mediaRecorder = null;
let audioChunks = [];
let commandHistory = [];

// DOM Elements
const elements = {
    // Connection
    connectionStatus: document.getElementById('connectionStatus'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    
    // Generation
    keySelect: document.getElementById('keySelect'),
    barsInput: document.getElementById('barsInput'),
    styleSelect: document.getElementById('styleSelect'),
    generateChordsBtn: document.getElementById('generateChordsBtn'),
    generateBassBtn: document.getElementById('generateBassBtn'),
    generateArpsBtn: document.getElementById('generateArpsBtn'),
    generateDrumsBtn: document.getElementById('generateDrumsBtn'),
    naturalLanguageInput: document.getElementById('naturalLanguageInput'),
    naturalLanguageBtn: document.getElementById('naturalLanguageBtn'),
    
    // Voice
    voiceRecordBtn: document.getElementById('voiceRecordBtn'),
    voiceRecordText: document.getElementById('voiceRecordText'),
    voiceStatus: document.getElementById('voiceStatus'),
    
    // Transport
    playBtn: document.getElementById('playBtn'),
    stopBtn: document.getElementById('stopBtn'),
    recordBtn: document.getElementById('recordBtn'),
    tempoInput: document.getElementById('tempoInput'),
    setTempoBtn: document.getElementById('setTempoBtn'),
    
    // Command
    commandInput: document.getElementById('commandInput'),
    executeCommandBtn: document.getElementById('executeCommandBtn'),
    
    // Status
    statusLog: document.getElementById('statusLog'),
    
    // Session
    sessionTempo: document.getElementById('sessionTempo'),
    sessionTracks: document.getElementById('sessionTracks'),
    sessionScenes: document.getElementById('sessionScenes'),
    sessionStatus: document.getElementById('sessionStatus'),
    refreshSessionBtn: document.getElementById('refreshSessionBtn'),
    
    // History
    commandHistory: document.getElementById('commandHistory'),
    
    // Settings
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    apiUrlInput: document.getElementById('apiUrlInput'),
    saveApiUrlBtn: document.getElementById('saveApiUrlBtn'),
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Check connection
    await checkConnection();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start periodic updates
    setInterval(checkConnection, 10000); // Every 10 seconds
    setInterval(updateSessionState, 5000); // Every 5 seconds
}

function setupEventListeners() {
    // Generation buttons
    elements.generateChordsBtn.addEventListener('click', () => generateChords());
    elements.generateBassBtn.addEventListener('click', () => generateBass());
    elements.generateArpsBtn.addEventListener('click', () => generateArps());
    elements.generateDrumsBtn.addEventListener('click', () => generateDrums());
    elements.naturalLanguageBtn.addEventListener('click', () => handleNaturalLanguage());
    elements.naturalLanguageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleNaturalLanguage();
        }
    });
    
    // Voice control
    elements.voiceRecordBtn.addEventListener('mousedown', startRecording);
    elements.voiceRecordBtn.addEventListener('mouseup', stopRecording);
    elements.voiceRecordBtn.addEventListener('mouseleave', stopRecording);
    elements.voiceRecordBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startRecording();
    });
    elements.voiceRecordBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopRecording();
    });
    
    // Transport
    elements.playBtn.addEventListener('click', () => executeCommand('play'));
    elements.stopBtn.addEventListener('click', () => executeCommand('stop'));
    elements.recordBtn.addEventListener('click', () => executeCommand('record'));
    elements.setTempoBtn.addEventListener('click', () => setTempo());
    elements.tempoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setTempo();
    });
    
    // Command execution
    elements.executeCommandBtn.addEventListener('click', () => executeCustomCommand());
    elements.commandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeCustomCommand();
    });
    
    // Session
    elements.refreshSessionBtn.addEventListener('click', updateSessionState);
    
    // Settings
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.classList.add('active');
        loadSettings();
    });
    elements.closeSettingsBtn.addEventListener('click', () => {
        elements.settingsModal.classList.remove('active');
    });
    elements.saveApiUrlBtn.addEventListener('click', saveSettings);
    
    // Close modal on outside click
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            elements.settingsModal.classList.remove('active');
        }
    });
}

// Connection Management
async function checkConnection() {
    try {
        const result = await window.sergikAPI.checkHealth();
        if (result.success) {
            updateConnectionStatus(true, 'Connected');
        } else {
            updateConnectionStatus(false, 'Disconnected');
        }
    } catch (error) {
        updateConnectionStatus(false, 'Error');
    }
}

function updateConnectionStatus(connected, text) {
    elements.statusDot.classList.toggle('connected', connected);
    elements.statusText.textContent = text;
}

// Generation Functions
async function generateChords() {
    const params = {
        key: elements.keySelect.value,
        bars: parseInt(elements.barsInput.value),
        voicing: 'stabs',
        tempo: parseInt(elements.tempoInput.value) || 125
    };
    
    addLog('Generating chords...', 'info');
    
    try {
        const result = await window.sergikAPI.generateChords(params);
        if (result.success) {
            addLog(`Generated ${result.data.count || 0} chord notes`, 'success');
            addToHistory('generate_chords', params);
        } else {
            addLog(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Error: ${error.message}`, 'error');
    }
}

async function generateBass() {
    const params = {
        key: elements.keySelect.value,
        bars: parseInt(elements.barsInput.value),
        style: elements.styleSelect.value,
        tempo: parseInt(elements.tempoInput.value) || 125
    };
    
    addLog('Generating bass line...', 'info');
    
    try {
        const result = await window.sergikAPI.generateBass(params);
        if (result.success) {
            addLog(`Generated ${result.data.count || 0} bass notes`, 'success');
            addToHistory('generate_bass', params);
        } else {
            addLog(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Error: ${error.message}`, 'error');
    }
}

async function generateArps() {
    const params = {
        key: elements.keySelect.value,
        bars: parseInt(elements.barsInput.value),
        pattern: 'up',
        tempo: parseInt(elements.tempoInput.value) || 125
    };
    
    addLog('Generating arpeggios...', 'info');
    
    try {
        const result = await window.sergikAPI.generateArps(params);
        if (result.success) {
            addLog(`Generated ${result.data.count || 0} arpeggio notes`, 'success');
            addToHistory('generate_arps', params);
        } else {
            addLog(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Error: ${error.message}`, 'error');
    }
}

async function generateDrums() {
    const params = {
        genre: elements.styleSelect.value,
        bars: parseInt(elements.barsInput.value),
        tempo: parseInt(elements.tempoInput.value) || 125
    };
    
    addLog('Generating drums...', 'info');
    
    try {
        const result = await window.sergikAPI.generateDrums(params);
        if (result.success) {
            addLog(`Generated ${result.data.count || 0} drum notes`, 'success');
            addToHistory('generate_drums', params);
        } else {
            addLog(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Error: ${error.message}`, 'error');
    }
}

async function handleNaturalLanguage() {
    const prompt = elements.naturalLanguageInput.value.trim();
    if (!prompt) return;
    
    addLog(`Processing: "${prompt}"`, 'info');
    
    try {
        const result = await window.sergikAPI.gptGenerate(prompt);
        if (result.success) {
            addLog(`Generated: ${result.data.result?.description || 'Success'}`, 'success');
            addToHistory('gpt_generate', { prompt });
            elements.naturalLanguageInput.value = '';
        } else {
            addLog(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Error: ${error.message}`, 'error');
    }
}

// Voice Control
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
        recordingStartTime = Date.now();
        
        elements.voiceRecordBtn.classList.add('recording');
        elements.voiceRecordText.textContent = 'Recording...';
        elements.voiceStatus.textContent = 'Recording...';
        
        await window.sergikAPI.setRecording(true);
    } catch (error) {
        addLog(`Voice recording error: ${error.message}`, 'error');
    }
}

async function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    mediaRecorder.stop();
    isRecording = false;
    
    elements.voiceRecordBtn.classList.remove('recording');
    elements.voiceRecordText.textContent = 'Hold to Record';
    elements.voiceStatus.textContent = 'Processing...';
    
    await window.sergikAPI.setRecording(false);
}

async function processVoiceRecording(audioBlob) {
    try {
        // Convert blob to array buffer, then to buffer for IPC
        const arrayBuffer = await audioBlob.arrayBuffer();
        const buffer = Array.from(new Uint8Array(arrayBuffer));
        
        const result = await window.sergikAPI.processVoice(buffer);
        
        if (result.success) {
            const data = result.data;
            elements.voiceStatus.textContent = data.intent?.tts || 'Done';
            addLog(`Voice: "${data.text}"`, 'info');
            addLog(`Response: ${data.intent?.tts}`, 'success');
            addToHistory('voice_command', { text: data.text });
        } else {
            elements.voiceStatus.textContent = `Error: ${result.error}`;
            addLog(`Voice error: ${result.error}`, 'error');
        }
    } catch (error) {
        elements.voiceStatus.textContent = `Error: ${error.message}`;
        addLog(`Voice processing error: ${error.message}`, 'error');
    }
}

// Transport Controls
async function executeCommand(command) {
    addLog(`Executing: ${command}`, 'info');
    
    try {
        const result = await window.sergikAPI.liveCommand(command);
        if (result.success) {
            addLog(`Command executed: ${command}`, 'success');
            addToHistory('live_command', { command });
        } else {
            addLog(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Error: ${error.message}`, 'error');
    }
}

async function setTempo() {
    const tempo = parseInt(elements.tempoInput.value);
    if (!tempo || tempo < 20 || tempo > 999) {
        addLog('Invalid tempo (20-999 BPM)', 'error');
        return;
    }
    
    await executeCommand(`set tempo to ${tempo}`);
}

async function executeCustomCommand() {
    const command = elements.commandInput.value.trim();
    if (!command) return;
    
    await executeCommand(command);
    elements.commandInput.value = '';
}

// Session State
async function updateSessionState() {
    try {
        const result = await window.sergikAPI.getSessionState();
        if (result.success && result.data.status === 'ok') {
            const state = result.data.result;
            elements.sessionTempo.textContent = state.tempo || '--';
            elements.sessionTracks.textContent = state.track_count || '--';
            elements.sessionScenes.textContent = state.scene_count || '--';
            elements.sessionStatus.textContent = state.is_playing ? 'Playing' : 'Stopped';
        }
    } catch (error) {
        // Silently fail - Ableton might not be connected
    }
}

// Settings
async function loadSettings() {
    try {
        const apiUrl = await window.sergikAPI.getApiUrl();
        elements.apiUrlInput.value = apiUrl;
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

async function saveSettings() {
    const apiUrl = elements.apiUrlInput.value.trim();
    if (!apiUrl) {
        addLog('API URL cannot be empty', 'error');
        return;
    }
    
    try {
        await window.sergikAPI.setApiUrl(apiUrl);
        addLog('Settings saved', 'success');
        elements.settingsModal.classList.remove('active');
        await checkConnection();
    } catch (error) {
        addLog(`Failed to save settings: ${error.message}`, 'error');
    }
}

// Utility Functions
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    elements.statusLog.insertBefore(entry, elements.statusLog.firstChild);
    
    // Keep only last 50 entries
    while (elements.statusLog.children.length > 50) {
        elements.statusLog.removeChild(elements.statusLog.lastChild);
    }
}

function addToHistory(command, params) {
    commandHistory.unshift({ command, params, timestamp: new Date() });
    if (commandHistory.length > 20) {
        commandHistory.pop();
    }
    
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    elements.commandHistory.innerHTML = '';
    commandHistory.slice(0, 10).forEach(item => {
        const div = document.createElement('div');
        div.className = 'command-history-item';
        div.textContent = `${item.command} - ${new Date(item.timestamp).toLocaleTimeString()}`;
        elements.commandHistory.appendChild(div);
    });
}

