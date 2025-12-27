/**
 * SERGIK AI Controller - Main Process
 * 
 * Electron main process for the standalone SERGIK AI Controller app.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Keep a global reference of the window object
let mainWindow;
let apiBaseUrl = 'http://127.0.0.1:8000';
let isRecording = false;
let apiSettings = null;

// ============================================================================
// Settings Management
// ============================================================================

/**
 * Load API settings from userData
 */
function loadApiSettings() {
  try {
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      apiSettings = settings.api || getDefaultApiSettings();
    } else {
      apiSettings = getDefaultApiSettings();
    }
    
    // Update apiBaseUrl from settings
    if (apiSettings.url) {
      apiBaseUrl = apiSettings.url;
    }
  } catch (error) {
    console.error('[Settings] Failed to load API settings:', error);
    apiSettings = getDefaultApiSettings();
  }
}

/**
 * Get default API settings
 */
function getDefaultApiSettings() {
  return {
    url: 'http://127.0.0.1:8000',
    timeout: 10000,
    retryCount: 3,
    retryDelay: 1000,
    retryBackoff: true,
    authType: 'none',
    apiKey: '',
    apiKeyHeader: 'X-API-Key',
    bearerToken: '',
    basicUsername: '',
    basicPassword: '',
    endpointTimeouts: {
      health: 5000,
      generate: 30000,
      analyze: 60000,
      live: 10000,
      transport: 5000,
      browser: 10000
    },
    logRequests: false,
    logResponses: false,
    logErrors: true,
    showRequestDetails: false,
    keepAlive: true,
    maxConnections: 10,
    connectionTimeout: 5000,
    validateSSL: true
  };
}

/**
 * Save API settings to userData
 */
function saveApiSettings() {
  try {
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');
    
    let allSettings = {};
    if (fs.existsSync(settingsPath)) {
      const existing = fs.readFileSync(settingsPath, 'utf8');
      allSettings = JSON.parse(existing);
    }
    
    allSettings.api = apiSettings;
    fs.writeFileSync(settingsPath, JSON.stringify(allSettings, null, 2));
  } catch (error) {
    console.error('[Settings] Failed to save API settings:', error);
  }
}

/**
 * Get timeout for endpoint type
 */
function getEndpointTimeout(endpointType) {
  if (!apiSettings || !apiSettings.endpointTimeouts) {
    return apiSettings?.timeout || 10000;
  }
  return apiSettings.endpointTimeouts[endpointType] || apiSettings.timeout || 10000;
}

/**
 * Build request headers with authentication
 */
function buildRequestHeaders(customHeaders = {}) {
  const headers = { ...customHeaders };
  
  if (!apiSettings) return headers;
  
  // Add authentication headers
  switch (apiSettings.authType) {
    case 'api_key':
      if (apiSettings.apiKey) {
        headers[apiSettings.apiKeyHeader || 'X-API-Key'] = apiSettings.apiKey;
      }
      break;
    case 'bearer':
      if (apiSettings.bearerToken) {
        headers['Authorization'] = `Bearer ${apiSettings.bearerToken}`;
      }
      break;
    case 'basic':
      if (apiSettings.basicUsername && apiSettings.basicPassword) {
        const credentials = Buffer.from(`${apiSettings.basicUsername}:${apiSettings.basicPassword}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
  }
  
  return headers;
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced API client with retry logic, auth, and logging
 */
async function apiRequest(method, endpoint, data = null, options = {}) {
  const endpointType = options.endpointType || 'default';
  const timeout = options.timeout || getEndpointTimeout(endpointType);
  const retryCount = options.retryCount ?? (apiSettings?.retryCount ?? 3);
  const retryDelay = apiSettings?.retryDelay ?? 1000;
  const retryBackoff = apiSettings?.retryBackoff !== false;
  
  const url = `${apiBaseUrl}${endpoint}`;
  const headers = buildRequestHeaders(options.headers || {});
  
  const requestConfig = {
    method,
    url,
    headers,
    timeout,
    validateStatus: () => true, // Don't throw on HTTP errors
    httpsAgent: apiSettings?.validateSSL === false ? new (require('https').Agent)({ rejectUnauthorized: false }) : undefined
  };
  
  if (data) {
    if (data instanceof fs.ReadStream || data.form) {
      // Form data or file stream
      requestConfig.data = data.form || data;
    } else {
      requestConfig.data = data;
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }
  }
  
  // Log request if enabled
  if (apiSettings?.logRequests) {
    console.log(`[API Request] ${method} ${url}`, apiSettings.showRequestDetails ? { headers, data } : '');
  }
  
  let lastError;
  let attempt = 0;
  
  while (attempt <= retryCount) {
    try {
      const startTime = Date.now();
      const response = await axios(requestConfig);
      const duration = Date.now() - startTime;
      
      // Log response if enabled
      if (apiSettings?.logResponses) {
        console.log(`[API Response] ${method} ${url} - ${response.status} (${duration}ms)`, 
          apiSettings.showRequestDetails ? response.data : '');
      }
      
      // Check for HTTP errors
      if (response.status >= 200 && response.status < 300) {
        return { success: true, data: response.data, status: response.status };
      } else {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = response.data;
        throw error;
      }
    } catch (error) {
      lastError = error;
      attempt++;
      
      // Log error if enabled
      if (apiSettings?.logErrors) {
        console.error(`[API Error] ${method} ${url} - Attempt ${attempt}/${retryCount + 1}:`, error.message);
      }
      
      // Don't retry on last attempt or on certain errors
      if (attempt > retryCount || 
          (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429)) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = retryBackoff ? retryDelay * Math.pow(2, attempt - 1) : retryDelay;
      await sleep(delay);
    }
  }
  
  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Request failed',
    status: lastError?.response?.status,
    data: lastError?.response?.data
  };
}

// ============================================================================
// Library Directory Management
// ============================================================================

/**
 * Get the library directory path
 * Creates it if it doesn't exist
 */
function getLibraryDirectory() {
  const userDataPath = app.getPath('userData');
  const libraryPath = path.join(userDataPath, 'Library');
  
  // Create library directory if it doesn't exist
  if (!fs.existsSync(libraryPath)) {
    fs.mkdirSync(libraryPath, { recursive: true });
  }
  
  return libraryPath;
}

/**
 * Get the dedicated media storage directory path
 * This is the main directory for all generated and imported media
 */
function getMediaStorageDirectory() {
  const userDataPath = app.getPath('userData');
  const mediaPath = path.join(userDataPath, 'Media');
  
  // Create media directory if it doesn't exist
  if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath, { recursive: true });
  }
  
  return mediaPath;
}

/**
 * Get a subdirectory within the library
 * Creates it if it doesn't exist
 */
function getLibrarySubdirectory(subdir) {
  const libPath = getLibraryDirectory();
  const subPath = path.join(libPath, subdir);
  
  if (!fs.existsSync(subPath)) {
    fs.mkdirSync(subPath, { recursive: true });
  }
  
  return subPath;
}

/**
 * Get a subdirectory within the media storage
 * Creates it if it doesn't exist
 */
function getMediaSubdirectory(subdir) {
  const mediaPath = getMediaStorageDirectory();
  const subPath = path.join(mediaPath, subdir);
  
  if (!fs.existsSync(subPath)) {
    fs.mkdirSync(subPath, { recursive: true });
  }
  
  return subPath;
}

/**
 * Get media directory by type (MIDI, Audio, etc.)
 * Organized by Generated/Imported and then by type
 */
function getMediaDirectoryByType(type, source = 'Generated') {
  // Normalize type
  const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if (normalizedType === 'Midi') {
    return getMediaSubdirectory(path.join(source, 'MIDI'));
  } else if (normalizedType === 'Audio') {
    return getMediaSubdirectory(path.join(source, 'Audio'));
  } else {
    return getMediaSubdirectory(path.join(source, normalizedType));
  }
}

/**
 * Initialize library directory structure
 */
function initializeLibraryStructure() {
  // Legacy library structure (for backward compatibility)
  getLibrarySubdirectory('MIDI');
  getLibrarySubdirectory('Audio');
  getLibrarySubdirectory('Exports');
  getLibrarySubdirectory('Analysis');
  
  // New media storage structure
  getMediaSubdirectory('Generated');
  getMediaSubdirectory('Generated/MIDI');
  getMediaSubdirectory('Generated/Audio');
  getMediaSubdirectory('Generated/Exports');
  getMediaSubdirectory('Generated/Analysis');
  
  getMediaSubdirectory('Imported');
  getMediaSubdirectory('Imported/MIDI');
  getMediaSubdirectory('Imported/Audio');
  getMediaSubdirectory('Imported/Exports');
  
  console.log('[Main] Library structure initialized at:', getLibraryDirectory());
  console.log('[Main] Media storage initialized at:', getMediaStorageDirectory());
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'default',
    backgroundColor: '#1a1a1a'
  });

  // Load the index.html
  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
// Load API settings on startup
loadApiSettings();

app.whenReady().then(() => {
  // Initialize library structure
  initializeLibraryStructure();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================================================
// IPC Handlers
// ============================================================================

// API Configuration
ipcMain.handle('get-api-url', () => apiBaseUrl);

ipcMain.handle('set-api-url', (event, url) => {
  apiBaseUrl = url;
  if (apiSettings) {
    apiSettings.url = url;
    saveApiSettings();
  }
  return { success: true, url };
});

ipcMain.handle('get-api-settings', () => {
  if (!apiSettings) {
    loadApiSettings();
  }
  return apiSettings || getDefaultApiSettings();
});

ipcMain.handle('set-api-settings', (event, settings) => {
  apiSettings = { ...getDefaultApiSettings(), ...settings };
  if (apiSettings.url) {
    apiBaseUrl = apiSettings.url;
  }
  saveApiSettings();
  return { success: true };
});

// Health Check
ipcMain.handle('check-health', async () => {
  const result = await apiRequest('GET', '/health', null, { endpointType: 'health' });
  if (result.success) {
    return {
      success: true,
      status: result.data?.status,
      service: result.data?.service
    };
  }
  return result;
});

// GPT Health Check
ipcMain.handle('check-gpt-health', async () => {
  const result = await apiRequest('GET', '/gpt/health', null, { endpointType: 'health' });
  if (result.success) {
    return {
      success: true,
      status: result.data?.status
    };
  }
  return result;
});

// Voice Control
ipcMain.handle('process-voice', async (event, audioArray) => {
  try {
    // Convert array to buffer
    const audioBuffer = Buffer.from(audioArray);
    
    // Save to temp file (API expects a file upload)
    const os = require('os');
    const tempPath = path.join(os.tmpdir(), `sergik_voice_${Date.now()}.wav`);
    
    // Write buffer to file
    fs.writeFileSync(tempPath, audioBuffer);
    
    // Create form data
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(tempPath), {
      filename: 'voice.wav',
      contentType: 'audio/wav'
    });
    
    // Send to API using enhanced client
    const result = await apiRequest('POST', '/voice/gpt', { form }, {
      endpointType: 'generate',
      headers: form.getHeaders()
    });
    
    // Cleanup
    try {
      fs.unlinkSync(tempPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }
    
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// GPT Generation
ipcMain.handle('gpt-generate', async (event, prompt) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/gpt/generate`,
      { prompt },
      { timeout: 30000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// GPT Drums
ipcMain.handle('gpt-drums', async (event, prompt) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/gpt/drums`,
      { prompt },
      { timeout: 30000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Ableton Live Commands
ipcMain.handle('live-command', async (event, command) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/command`,
      { prompt: command },
      { timeout: 10000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Generate Chords
ipcMain.handle('generate-chords', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/generate/chord_progression`,
      params,
      { timeout: 30000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Generate Bass
ipcMain.handle('generate-bass', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/generate/walking_bass`,
      params,
      { timeout: 30000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Generate Arpeggios
ipcMain.handle('generate-arps', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/generate/arpeggios`,
      params,
      { timeout: 30000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Generate Drums
ipcMain.handle('generate-drums', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/drums/generate`,
      params,
      { timeout: 30000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Get Drum Genres
ipcMain.handle('get-drum-genres', async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/drums/genres`, { timeout: 5000 });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Get Session State
ipcMain.handle('get-session-state', async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/live/session/state`, { timeout: 5000 });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// File Dialog
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Recording State
ipcMain.handle('set-recording', (event, recording) => {
  isRecording = recording;
  return { success: true, recording };
});

ipcMain.handle('get-recording', () => {
  return { recording: isRecording };
});

// ============================================================================
// Analysis Endpoints
// ============================================================================

// Analyze File Upload
ipcMain.handle('analyze-upload', async (event, filePath) => {
  try {
    const fs = require('fs');
    const FormData = require('form-data');
    
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: 'audio/wav'
    });
    
    const response = await axios.post(
      `${apiBaseUrl}/analyze/upload`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 60000
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Handle file selection for analysis
ipcMain.handle('select-file-for-analysis', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Audio File',
      filters: [
        { name: 'Audio Files', extensions: ['wav', 'mp3', 'flac', 'aif', 'aiff', 'm4a'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'No file selected' };
    }
    
    return { success: true, filePath: result.filePaths[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Analyze URL
ipcMain.handle('analyze-url', async (event, url) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/analyze/url?url=${encodeURIComponent(url)}`,
      {},
      { timeout: 60000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// ============================================================================
// Track Management
// ============================================================================

// Create Track
ipcMain.handle('create-track', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/tracks/create`,
      params,
      { timeout: 10000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Delete Track
ipcMain.handle('delete-track', async (event, trackIndex) => {
  try {
    const response = await axios.delete(
      `${apiBaseUrl}/live/tracks/${trackIndex}`,
      { timeout: 10000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Get Tracks
ipcMain.handle('get-tracks', async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/live/tracks`, { timeout: 5000 });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// ============================================================================
// Clip Management
// ============================================================================

// Create Clip
ipcMain.handle('create-clip', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/clips/create`,
      params,
      { timeout: 10000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Fire Clip
ipcMain.handle('fire-clip', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/clips/fire`,
      params,
      { timeout: 5000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Stop Clip
ipcMain.handle('stop-clip', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/clips/stop`,
      params,
      { timeout: 5000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Duplicate Clip
ipcMain.handle('duplicate-clip', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/clips/duplicate`,
      params,
      { timeout: 10000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Set Clip Notes
ipcMain.handle('set-clip-notes', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/clips/notes`,
      params,
      { timeout: 10000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Get Clip Notes
ipcMain.handle('get-clip-notes', async (event, trackIndex, slotIndex) => {
  try {
    const response = await axios.get(
      `${apiBaseUrl}/live/clips/${trackIndex}/${slotIndex}`,
      { timeout: 5000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// ============================================================================
// Browser/Library
// ============================================================================

// Browser Search
ipcMain.handle('browser-search', async (event, query) => {
  try {
    const response = await axios.get(
      `${apiBaseUrl}/live/browser/search?query=${encodeURIComponent(query)}`,
      { timeout: 10000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Load Browser Item
ipcMain.handle('browser-load', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/browser/load`,
      params,
      { timeout: 10000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// ============================================================================
// Transport Control
// ============================================================================

// Transport Action
ipcMain.handle('transport-action', async (event, action) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/transport/${action}`,
      {},
      { timeout: 5000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Set Tempo
ipcMain.handle('set-tempo', async (event, tempo) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/session/tempo`,
      { tempo },
      { timeout: 5000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// ============================================================================
// Scene Management
// ============================================================================

// Fire Scene
ipcMain.handle('fire-scene', async (event, sceneIndex) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/scenes/fire`,
      { scene_index: sceneIndex },
      { timeout: 5000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Create Scene
ipcMain.handle('create-scene', async (event, params) => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/live/scenes/create`,
      params,
      { timeout: 10000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// ============================================================================
// Library Management IPC Handlers
// ============================================================================

/**
 * Convert MIDI notes array to MIDI file format using jsmidgen
 */
function convertNotesToMIDI(notes, tempo = 120) {
  try {
    const Midi = require('jsmidgen');
    const file = new Midi.File();
    const track = new Midi.Track();
    file.addTrack(track);
    
    // Set tempo
    track.setTempo(tempo);
    
    // Add notes
    if (Array.isArray(notes)) {
      let currentTime = 0;
      notes.forEach(note => {
        const pitch = note.pitch || note.note || 60;
        const velocity = note.velocity || 100;
        const start = note.start || currentTime;
        const duration = note.duration || 0.25;
        
        // Convert time to ticks (assuming 480 ticks per quarter note)
        const startTicks = Math.floor(start * 480);
        const durationTicks = Math.floor(duration * 480);
        
        track.addNote(0, pitch, durationTicks, velocity, startTicks);
        currentTime = Math.max(currentTime, start + duration);
      });
    }
    
    return file.toBytes();
  } catch (error) {
    console.error('[Main] MIDI conversion error:', error);
    // Fallback: return empty buffer
    return Buffer.alloc(0);
  }
}

// Save MIDI file to library
ipcMain.handle('save-midi-to-library', async (event, midiData, filename) => {
  try {
    // Use new media storage directory for generated media
    const midiDir = getMediaDirectoryByType('MIDI', 'Generated');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const safeFilename = filename || `generated_${timestamp}.mid`;
    const filePath = path.join(midiDir, safeFilename);
    
    // If midiData is notes array, convert to MIDI file
    if (midiData.notes || Array.isArray(midiData)) {
      const notes = midiData.notes || midiData;
      const tempo = midiData.tempo || midiData.metadata?.tempo || 120;
      
      const midiBuffer = convertNotesToMIDI(notes, tempo);
      
      if (midiBuffer.length > 0) {
        fs.writeFileSync(filePath, midiBuffer);
        return { 
          success: true, 
          filePath: filePath,
          message: `Saved MIDI file to library: ${safeFilename}`
        };
      } else {
        // Fallback: save as JSON if MIDI conversion fails
        const jsonPath = filePath.replace('.mid', '.json');
        fs.writeFileSync(jsonPath, JSON.stringify({
          notes: notes,
          metadata: midiData.metadata || { tempo: tempo },
          timestamp: new Date().toISOString()
        }, null, 2));
        
        return { 
          success: true, 
          filePath: jsonPath,
          message: `Saved MIDI notes to library: ${safeFilename.replace('.mid', '.json')}`,
          note: 'Saved as JSON (MIDI conversion failed)'
        };
      }
    } else if (Buffer.isBuffer(midiData) || typeof midiData === 'string') {
      // Already a MIDI file buffer or base64
      const buffer = Buffer.isBuffer(midiData) ? midiData : Buffer.from(midiData, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      return { 
        success: true, 
        filePath: filePath,
        message: `Saved MIDI file to library: ${safeFilename}`
      };
    } else {
      throw new Error('Invalid MIDI data format');
    }
  } catch (error) {
    console.error('[Main] Save MIDI error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Save audio file to library
ipcMain.handle('save-audio-to-library', async (event, audioData, filename) => {
  try {
    // Use new media storage directory for generated media
    const audioDir = getMediaDirectoryByType('Audio', 'Generated');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const safeFilename = filename || `generated_${timestamp}.wav`;
    const filePath = path.join(audioDir, safeFilename);
    
    // Handle different audio data formats
    let buffer;
    if (Buffer.isBuffer(audioData)) {
      buffer = audioData;
    } else if (typeof audioData === 'string') {
      // Base64 encoded
      buffer = Buffer.from(audioData, 'base64');
    } else if (audioData instanceof ArrayBuffer) {
      buffer = Buffer.from(audioData);
    } else if (Array.isArray(audioData)) {
      // Array of numbers (audio samples)
      buffer = Buffer.from(new Uint8Array(audioData));
    } else {
      throw new Error('Invalid audio data format');
    }
    
    fs.writeFileSync(filePath, buffer);
    
    return { 
      success: true, 
      filePath: filePath,
      message: `Saved audio to library: ${safeFilename}`
    };
  } catch (error) {
    console.error('[Main] Save audio error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Save analysis JSON to library
ipcMain.handle('save-analysis-to-library', async (event, analysisData, filename) => {
  try {
    // Use new media storage directory for generated media
    const analysisDir = getMediaSubdirectory('Generated/Analysis');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const safeFilename = filename || `analysis_${timestamp}.json`;
    const filePath = path.join(analysisDir, safeFilename);
    
    const jsonData = typeof analysisData === 'string' 
      ? analysisData 
      : JSON.stringify(analysisData, null, 2);
    
    fs.writeFileSync(filePath, jsonData);
    
    return { 
      success: true, 
      filePath: filePath,
      message: `Saved analysis to library: ${safeFilename}`
    };
  } catch (error) {
    console.error('[Main] Save analysis error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Get library directory path
ipcMain.handle('get-library-path', () => {
  return { 
    success: true,
    path: getLibraryDirectory(),
    subdirectories: {
      midi: getLibrarySubdirectory('MIDI'),
      audio: getLibrarySubdirectory('Audio'),
      exports: getLibrarySubdirectory('Exports'),
      analysis: getLibrarySubdirectory('Analysis')
    }
  };
});

// Get media storage directory path
ipcMain.handle('get-media-storage-path', () => {
  return { 
    success: true,
    path: getMediaStorageDirectory(),
    subdirectories: {
      generated: {
        base: getMediaSubdirectory('Generated'),
        midi: getMediaDirectoryByType('MIDI', 'Generated'),
        audio: getMediaDirectoryByType('Audio', 'Generated'),
        exports: getMediaSubdirectory('Generated/Exports'),
        analysis: getMediaSubdirectory('Generated/Analysis')
      },
      imported: {
        base: getMediaSubdirectory('Imported'),
        midi: getMediaDirectoryByType('MIDI', 'Imported'),
        audio: getMediaDirectoryByType('Audio', 'Imported'),
        exports: getMediaSubdirectory('Imported/Exports')
      }
    }
  };
});

// List library files (legacy - also checks media storage)
ipcMain.handle('list-library-files', async (event, subdir = '') => {
  try {
    const allFiles = [];
    
    // Check legacy library directory
    const libPath = subdir ? getLibrarySubdirectory(subdir) : getLibraryDirectory();
    if (fs.existsSync(libPath)) {
      const files = fs.readdirSync(libPath)
        .filter(file => {
          const filePath = path.join(libPath, file);
          return fs.statSync(filePath).isFile();
        })
        .map(file => {
          const filePath = path.join(libPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            type: path.extname(file).toLowerCase().slice(1),
            source: 'library'
          };
        });
      allFiles.push(...files);
    }
    
    // Also check media storage directory
    if (!subdir || subdir === 'MIDI' || subdir === 'Audio') {
      const mediaType = subdir === 'MIDI' ? 'MIDI' : (subdir === 'Audio' ? 'Audio' : null);
      if (mediaType) {
        // Check Generated
        const generatedPath = getMediaDirectoryByType(mediaType, 'Generated');
        if (fs.existsSync(generatedPath)) {
          const files = fs.readdirSync(generatedPath)
            .filter(file => {
              const filePath = path.join(generatedPath, file);
              return fs.statSync(filePath).isFile();
            })
            .map(file => {
              const filePath = path.join(generatedPath, file);
              const stats = fs.statSync(filePath);
              return {
                name: file,
                path: filePath,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                type: path.extname(file).toLowerCase().slice(1),
                source: 'media-generated'
              };
            });
          allFiles.push(...files);
        }
        
        // Check Imported
        const importedPath = getMediaDirectoryByType(mediaType, 'Imported');
        if (fs.existsSync(importedPath)) {
          const files = fs.readdirSync(importedPath)
            .filter(file => {
              const filePath = path.join(importedPath, file);
              return fs.statSync(filePath).isFile();
            })
            .map(file => {
              const filePath = path.join(importedPath, file);
              const stats = fs.statSync(filePath);
              return {
                name: file,
                path: filePath,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                type: path.extname(file).toLowerCase().slice(1),
                source: 'media-imported'
              };
            });
          allFiles.push(...files);
        }
      } else if (!subdir) {
        // If no subdir specified, check all media storage
        const mediaPath = getMediaStorageDirectory();
        if (fs.existsSync(mediaPath)) {
          // Recursively get all files from media storage
          function getAllFiles(dir, baseSource) {
            const files = [];
            try {
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isFile()) {
                  const stats = fs.statSync(fullPath);
                  files.push({
                    name: entry.name,
                    path: fullPath,
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    type: path.extname(entry.name).toLowerCase().slice(1),
                    source: baseSource
                  });
                } else if (entry.isDirectory()) {
                  files.push(...getAllFiles(fullPath, baseSource));
                }
              }
            } catch (err) {
              console.warn(`[Main] Error reading directory ${dir}:`, err);
            }
            return files;
          }
          allFiles.push(...getAllFiles(mediaPath, 'media'));
        }
      }
    }
    
    // Sort by modified date (newest first)
    allFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    return { success: true, files: allFiles };
  } catch (error) {
    console.error('[Main] List library files error:', error);
    return { success: false, error: error.message };
  }
});

// List media storage files (new dedicated handler)
ipcMain.handle('list-media-storage-files', async (event, options = {}) => {
  try {
    const { source = 'all', type = 'all' } = options; // source: 'all', 'generated', 'imported'; type: 'all', 'midi', 'audio'
    const allFiles = [];
    
    // Helper function to list files in a directory
    function listFilesInDir(dirPath, fileSource) {
      if (!fs.existsSync(dirPath)) {
        return [];
      }
      
      return fs.readdirSync(dirPath)
        .filter(file => {
          const filePath = path.join(dirPath, file);
          return fs.statSync(filePath).isFile();
        })
        .map(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            type: path.extname(file).toLowerCase().slice(1),
            source: fileSource
          };
        });
    }
    
    // Determine which directories to check
    const sourcesToCheck = source === 'all' ? ['Generated', 'Imported'] : [source];
    const typesToCheck = type === 'all' ? ['MIDI', 'Audio'] : [type];
    
    for (const src of sourcesToCheck) {
      for (const mediaType of typesToCheck) {
        const dirPath = getMediaDirectoryByType(mediaType, src);
        const files = listFilesInDir(dirPath, `media-${src.toLowerCase()}`);
        allFiles.push(...files);
      }
    }
    
    // Sort by modified date (newest first)
    allFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    return { success: true, files: allFiles, count: allFiles.length };
  } catch (error) {
    console.error('[Main] List media storage files error:', error);
    return { success: false, error: error.message };
  }
});

