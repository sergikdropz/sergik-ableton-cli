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
 * Initialize library directory structure
 */
function initializeLibraryStructure() {
  getLibrarySubdirectory('MIDI');
  getLibrarySubdirectory('Audio');
  getLibrarySubdirectory('Exports');
  getLibrarySubdirectory('Analysis');
  console.log('[Main] Library structure initialized at:', getLibraryDirectory());
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
  return { success: true, url };
});

// Health Check
ipcMain.handle('check-health', async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/health`, { timeout: 5000 });
    return { 
      success: true, 
      status: response.data.status,
      service: response.data.service 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// GPT Health Check
ipcMain.handle('check-gpt-health', async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/gpt/health`, { timeout: 5000 });
    return { 
      success: true, 
      status: response.data.status 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Voice Control
ipcMain.handle('process-voice', async (event, audioArray) => {
  try {
    // Convert array to buffer
    const audioBuffer = Buffer.from(audioArray);
    
    // Save to temp file (API expects a file upload)
    const fs = require('fs');
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
    
    // Send to API
    const response = await axios.post(
      `${apiBaseUrl}/voice/gpt`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000
      }
    );
    
    // Cleanup
    try {
      fs.unlinkSync(tempPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }
    
    return { success: true, data: response.data };
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
    const midiDir = getLibrarySubdirectory('MIDI');
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
    const audioDir = getLibrarySubdirectory('Audio');
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
    const analysisDir = getLibrarySubdirectory('Analysis');
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

// List library files
ipcMain.handle('list-library-files', async (event, subdir = '') => {
  try {
    const libPath = subdir ? getLibrarySubdirectory(subdir) : getLibraryDirectory();
    
    if (!fs.existsSync(libPath)) {
      return { success: true, files: [] };
    }
    
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
          type: path.extname(file).toLowerCase().slice(1) // Remove the dot
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified)); // Newest first
    
    return { success: true, files };
  } catch (error) {
    console.error('[Main] List library files error:', error);
    return { success: false, error: error.message };
  }
});

