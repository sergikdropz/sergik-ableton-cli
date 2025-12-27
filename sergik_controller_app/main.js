/**
 * SERGIK AI Controller - Main Process
 * 
 * Electron main process for the standalone SERGIK AI Controller app.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const axios = require('axios');

// Keep a global reference of the window object
let mainWindow;
let apiBaseUrl = 'http://127.0.0.1:8000';
let isRecording = false;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
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

