/**
 * SERGIK AI Controller - Preload Script
 * 
 * Exposes safe API to renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('sergikAPI', {
  // API Configuration
  getApiUrl: () => ipcRenderer.invoke('get-api-url'),
  setApiUrl: (url) => ipcRenderer.invoke('set-api-url', url),
  
  // Health Checks
  checkHealth: () => ipcRenderer.invoke('check-health'),
  checkGptHealth: () => ipcRenderer.invoke('check-gpt-health'),
  
  // Voice Control
  processVoice: (audioBuffer) => ipcRenderer.invoke('process-voice', audioBuffer),
  setRecording: (recording) => ipcRenderer.invoke('set-recording', recording),
  getRecording: () => ipcRenderer.invoke('get-recording'),
  
  // GPT Generation
  gptGenerate: (prompt) => ipcRenderer.invoke('gpt-generate', prompt),
  gptDrums: (prompt) => ipcRenderer.invoke('gpt-drums', prompt),
  
  // Ableton Live
  liveCommand: (command) => ipcRenderer.invoke('live-command', command),
  getSessionState: () => ipcRenderer.invoke('get-session-state'),
  
  // MIDI Generation
  generateChords: (params) => ipcRenderer.invoke('generate-chords', params),
  generateBass: (params) => ipcRenderer.invoke('generate-bass', params),
  generateArps: (params) => ipcRenderer.invoke('generate-arps', params),
  generateDrums: (params) => ipcRenderer.invoke('generate-drums', params),
  getDrumGenres: () => ipcRenderer.invoke('get-drum-genres'),
  
  // File Dialog
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
});

