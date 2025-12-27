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
  getApiBaseUrl: () => ipcRenderer.invoke('get-api-url'), // Alias for compatibility
  setApiUrl: (url) => ipcRenderer.invoke('set-api-url', url),
  getApiSettings: () => ipcRenderer.invoke('get-api-settings'),
  setApiSettings: (settings) => ipcRenderer.invoke('set-api-settings', settings),
  
  // Health Checks
  checkHealth: () => {
    // #region agent log
    console.log('[Preload Debug] checkHealth called');
    try {
      fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'preload.js:20',message:'checkHealth IPC invoke start',data:{hasIpcRenderer:!!ipcRenderer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'P'})}).catch(e=>console.error('[Preload] Log fetch failed:',e));
    } catch(e) { console.log('[Preload] Log setup failed:', e); }
    // #endregion
    try {
      const promise = ipcRenderer.invoke('check-health');
      // #region agent log
      console.log('[Preload Debug] ipcRenderer.invoke returned promise');
      try {
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'preload.js:24',message:'ipcRenderer.invoke called',data:{promiseType:typeof promise,isPromise:promise instanceof Promise},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'U'})}).catch(e=>console.error('[Preload] Log fetch failed:',e));
      } catch(e) { console.log('[Preload] Log setup failed:', e); }
      // #endregion
      promise.then(result => {
        // #region agent log
        console.log('[Preload Debug] IPC success', result);
        try {
          fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'preload.js:27',message:'checkHealth IPC success',data:{hasResult:!!result,success:result?.success},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Q'})}).catch(e=>console.error('[Preload] Log fetch failed:',e));
        } catch(e) { console.log('[Preload] Log setup failed:', e); }
        // #endregion
      }).catch(error => {
        // #region agent log
        console.error('[Preload Debug] IPC error', error);
        try {
          fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'preload.js:31',message:'checkHealth IPC error',data:{errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(e=>console.error('[Preload] Log fetch failed:',e));
        } catch(e) { console.log('[Preload] Log setup failed:', e); }
        // #endregion
      });
      return promise;
    } catch (syncError) {
      // #region agent log
      console.error('[Preload Debug] Sync error', syncError);
      try {
        fetch('http://127.0.0.1:7242/ingest/1a0fb566-a809-4ec8-acf1-755116941527',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'preload.js:36',message:'checkHealth sync error',data:{errorMessage:syncError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'V'})}).catch(e=>console.error('[Preload] Log setup failed:', e));
      } catch(e) { console.log('[Preload] Log setup failed:', e); }
      // #endregion
      return Promise.reject(syncError);
    }
  },
  checkGptHealth: () => ipcRenderer.invoke('check-gpt-health'),
  
  // Server Management
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  restartServer: () => ipcRenderer.invoke('restart-server'),
  checkServerStatus: () => ipcRenderer.invoke('check-server-status'),
  
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
  analyzeBatch: (params) => ipcRenderer.invoke('analyze-batch', params),
  gptAnalyze: (filePath) => ipcRenderer.invoke('gpt-analyze', filePath),
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
  
  // Organization
  organizeAutoOrganize: (params) => ipcRenderer.invoke('organize-auto-organize', params),
  organizePreview: (params) => ipcRenderer.invoke('organize-preview', params),
  
  // Transform
  transformQuantize: (params) => ipcRenderer.invoke('transform-quantize', params),
  transformTranspose: (params) => ipcRenderer.invoke('transform-transpose', params),
  transformVelocity: (params) => ipcRenderer.invoke('transform-velocity', params),
  transformLegato: (params) => ipcRenderer.invoke('transform-legato', params),
  transformRemoveOverlaps: (params) => ipcRenderer.invoke('transform-remove-overlaps', params),
  transformFade: (params) => ipcRenderer.invoke('transform-fade', params),
  transformNormalize: (params) => ipcRenderer.invoke('transform-normalize', params),
  transformTimeStretch: (params) => ipcRenderer.invoke('transform-time-stretch', params),
  transformPitchShift: (params) => ipcRenderer.invoke('transform-pitch-shift', params),
  transformTimeShift: (params) => ipcRenderer.invoke('transform-time-shift', params),
  
  // Export
  exportTrack: (params) => ipcRenderer.invoke('export-track', params),
  exportBatch: (params) => ipcRenderer.invoke('export-batch', params),
  exportStems: (params) => ipcRenderer.invoke('export-stems', params),
  
  // Library Management
  saveMidiToLibrary: (midiData, filename) => ipcRenderer.invoke('save-midi-to-library', midiData, filename),
  saveAudioToLibrary: (audioData, filename) => ipcRenderer.invoke('save-audio-to-library', audioData, filename),
  saveAnalysisToLibrary: (analysisData, filename) => ipcRenderer.invoke('save-analysis-to-library', analysisData, filename),
  getLibraryPath: () => ipcRenderer.invoke('get-library-path'),
  listLibraryFiles: (subdir) => ipcRenderer.invoke('list-library-files', subdir),
  
  // Media Storage Management (new dedicated storage)
  getMediaStoragePath: () => ipcRenderer.invoke('get-media-storage-path'),
  listMediaStorageFiles: (options) => ipcRenderer.invoke('list-media-storage-files', options),
  
  // API Key Management
  getApiKey: (service) => ipcRenderer.invoke('get-api-key', service),
  setApiKey: (service, key) => ipcRenderer.invoke('set-api-key', service, key),
  deleteApiKey: (service) => ipcRenderer.invoke('delete-api-key', service),
  listApiKeys: () => ipcRenderer.invoke('list-api-keys'),
  getApiKeysInfo: () => ipcRenderer.invoke('get-api-keys-info'),
  
  // SERGIK AI Team
  checkAITeamHealth: () => ipcRenderer.invoke('ai-team-health'),
  sendAITeamMessage: (agent, content, sender) => ipcRenderer.invoke('ai-team-message', agent, content, sender),
  listAITeamAgents: () => ipcRenderer.invoke('ai-team-list-agents'),
  
  // Clip Properties
  setClipProperty: (params) => ipcRenderer.invoke('set-clip-property', params),
  setClipBPM: (bpm) => ipcRenderer.invoke('set-clip-bpm', bpm),
  addWarpMarker: (marker) => ipcRenderer.invoke('add-warp-marker', marker),
  transposeNotes: (params) => ipcRenderer.invoke('transpose-notes', params),
});

