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
  getApiSettings: () => ipcRenderer.invoke('get-api-settings'),
  setApiSettings: (settings) => ipcRenderer.invoke('set-api-settings', settings),
  
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
  
  // Analysis
  analyzeUpload: (filePath) => ipcRenderer.invoke('analyze-upload', filePath),
  analyzeUrl: (url) => ipcRenderer.invoke('analyze-url', url),
  selectFileForAnalysis: () => ipcRenderer.invoke('select-file-for-analysis'),
  
  // Track Management
  createTrack: (params) => ipcRenderer.invoke('create-track', params),
  deleteTrack: (trackIndex) => ipcRenderer.invoke('delete-track', trackIndex),
  getTracks: () => ipcRenderer.invoke('get-tracks'),
  
  // Clip Management
  createClip: (params) => ipcRenderer.invoke('create-clip', params),
  fireClip: (params) => ipcRenderer.invoke('fire-clip', params),
  stopClip: (params) => ipcRenderer.invoke('stop-clip', params),
  duplicateClip: (params) => ipcRenderer.invoke('duplicate-clip', params),
  setClipNotes: (params) => ipcRenderer.invoke('set-clip-notes', params),
  getClipNotes: (trackIndex, slotIndex) => ipcRenderer.invoke('get-clip-notes', trackIndex, slotIndex),
  
  // Browser/Library
  browserSearch: (query) => ipcRenderer.invoke('browser-search', query),
  browserLoad: (params) => ipcRenderer.invoke('browser-load', params),
  
  // Transport
  transportAction: (action) => ipcRenderer.invoke('transport-action', action),
  setTempo: (tempo) => ipcRenderer.invoke('set-tempo', tempo),
  
  // Scenes
  fireScene: (sceneIndex) => ipcRenderer.invoke('fire-scene', sceneIndex),
  createScene: (params) => ipcRenderer.invoke('create-scene', params),
  
  // Library Management
  saveMidiToLibrary: (midiData, filename) => ipcRenderer.invoke('save-midi-to-library', midiData, filename),
  saveAudioToLibrary: (audioData, filename) => ipcRenderer.invoke('save-audio-to-library', audioData, filename),
  saveAnalysisToLibrary: (analysisData, filename) => ipcRenderer.invoke('save-analysis-to-library', analysisData, filename),
  getLibraryPath: () => ipcRenderer.invoke('get-library-path'),
  listLibraryFiles: (subdir) => ipcRenderer.invoke('list-library-files', subdir),
  
  // Media Storage Management (new dedicated storage)
  getMediaStoragePath: () => ipcRenderer.invoke('get-media-storage-path'),
  listMediaStorageFiles: (options) => ipcRenderer.invoke('list-media-storage-files', options),
});

