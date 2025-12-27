/**
 * SERGIK AI Controller - Main Process
 * 
 * Electron main process for the standalone SERGIK AI Controller app.
 */

// CRITICAL: Write to multiple locations to verify module loads
// This MUST execute first, before any Electron requires
const fs = require('fs');
const path = require('path');

// Write to a test file in the app directory first (most likely to work)
const testLogPath = path.join(__dirname, 'module-load-test.log');
try {
  const testContent = `MODULE LOADED AT: ${new Date().toISOString()}\nPID: ${process.pid}\nNode: ${process.version}\nPlatform: ${process.platform}\n__dirname: ${__dirname}\ncwd: ${process.cwd()}\n`;
  fs.writeFileSync(testLogPath, testContent);
  // Also write to stderr immediately (always available)
  process.stderr.write(`[MAIN.JS] MODULE LOADED - PID: ${process.pid}\n`);
  process.stderr.write(`[MAIN.JS] Test file: ${testLogPath}\n`);
} catch (e) {
  process.stderr.write(`[MAIN.JS] Test file write failed: ${e.message}\n`);
}

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const axios = require('axios');
const { safeStorage } = require('electron');
const crypto = require('crypto');

// Immediate log test on module load
const logPath = '/Users/machd/sergik_custom_gpt/.cursor/debug.log';
try {
  fs.appendFileSync(logPath, JSON.stringify({location:'main.js:13',message:'MODULE LOADED',data:{nodeVersion:process.version,platform:process.platform,pid:process.pid,__dirname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'MODULE_LOAD'})+'\n');
  console.log('[Main Debug] Module loaded, log file test written to:', logPath);
} catch (e) {
  console.error('[Main Debug] Module load log failed:', e.message, e.code, e.stack?.substring(0, 200));
  // Try to write to stderr as fallback
  process.stderr.write(`[Main Debug] Module load log failed: ${e.message}\n`);
  // Also try to write to test file
  try {
    fs.appendFileSync(testLogPath, `LOG FILE WRITE FAILED: ${e.message}\n`);
  } catch (e2) {
    // Ignore
  }
}

// Catch uncaught errors that might prevent app from starting
process.on('uncaughtException', (error) => {
  try {
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:25',message:'UNCAUGHT EXCEPTION',data:{errorMessage:error.message,errorStack:error.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CRASH'})+'\n');
  } catch (e) {
    // Ignore log write failures
  }
  console.error('[Main Debug] UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  try {
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:33',message:'UNHANDLED REJECTION',data:{reason:reason?.message || String(reason)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'REJECTION'})+'\n');
  } catch (e) {
    // Ignore log write failures
  }
  console.error('[Main Debug] UNHANDLED REJECTION:', reason);
});

// Keep a global reference of the window object
let mainWindow;
let apiBaseUrl = 'http://127.0.0.1:8000';
let isRecording = false;
let apiSettings = null;

// API Keys storage (encrypted)
let apiKeysStore = {};
const ENCRYPTION_KEY_LENGTH = 32;

// ============================================================================
// Settings Management
// ============================================================================

/**
 * Load API settings from userData
 */
function loadApiSettings() {
  try {
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:40',message:'loadApiSettings entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SETTINGS_LOAD'})+'\n');
    // #endregion
    
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');
    
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:47',message:'got userDataPath',data:{userDataPath,settingsPath,exists:fs.existsSync(settingsPath)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SETTINGS_LOAD'})+'\n');
    // #endregion
    
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
    
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:62',message:'loadApiSettings success',data:{apiBaseUrl,hasApiSettings:!!apiSettings},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SETTINGS_LOAD'})+'\n');
    // #endregion
  } catch (error) {
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:65',message:'loadApiSettings error',data:{errorMessage:error.message,errorStack:error.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SETTINGS_LOAD'})+'\n');
    // #endregion
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
    validateSSL: true,
    
    // Ngrok support
    useNgrok: false,
    ngrokUrl: '',
    ngrokApiKey: process.env.NGROK_API_KEY || '', // For ngrok API to get dynamic URLs
    
    // Multiple API Keys for AI services
    apiKeys: {
        // SERGIK API
        sergik: {
            enabled: false,
            key: '',
            header: 'X-API-Key'
        },
        // OpenAI for GPT/voice
        openai: {
            enabled: false,
            key: '',
            header: 'Authorization',
            prefix: 'Bearer'
        },
        // Anthropic Claude
        anthropic: {
            enabled: false,
            key: '',
            header: 'x-api-key'
        },
        // Google AI
        google: {
            enabled: false,
            key: '',
            header: 'Authorization',
            prefix: 'Bearer'
        },
        // Custom API keys
        custom: []
    }
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
 * Build request headers with authentication from multiple sources
 */
function buildRequestHeaders(customHeaders = {}, endpointType = 'default') {
  const headers = { ...customHeaders };
  
  if (!apiSettings) return headers;
  
  // Determine which API key to use based on endpoint
  let selectedKey = null;
  let selectedHeader = 'X-API-Key';
  let selectedPrefix = '';
  
  // Map endpoint types to API key services
  const endpointKeyMap = {
    'gpt': 'openai',
    'voice': 'openai',
    'generate': 'sergik',
    'analyze': 'sergik',
    'live': 'sergik',
    'default': 'sergik'
  };
  
  const service = endpointKeyMap[endpointType] || 'sergik';
  
  // Check if API keys are configured
  if (apiSettings.apiKeys && apiSettings.apiKeys[service]) {
    const keyConfig = apiSettings.apiKeys[service];
    if (keyConfig.enabled && apiKeysStore[service]) {
      selectedKey = apiKeysStore[service];
      selectedHeader = keyConfig.header || 'X-API-Key';
      selectedPrefix = keyConfig.prefix || '';
    }
  }
  
  // Fallback to legacy single API key
  if (!selectedKey && apiSettings.authType === 'api_key' && apiSettings.apiKey) {
    selectedKey = apiSettings.apiKey;
    selectedHeader = apiSettings.apiKeyHeader || 'X-API-Key';
  }
  
  // Add authentication header
  if (selectedKey) {
    if (selectedPrefix) {
      headers[selectedHeader] = `${selectedPrefix} ${selectedKey}`;
    } else {
      headers[selectedHeader] = selectedKey;
    }
  }
  
  // Add other auth types (bearer, basic) if configured
  switch (apiSettings.authType) {
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
  console.log('[Main Debug] apiRequest called', { method, endpoint, apiBaseUrl });
  
  // #region agent log
  try {
    fs.appendFileSync('/Users/machd/sergik_custom_gpt/.cursor/debug.log', JSON.stringify({location:'main.js:244',message:'apiRequest entry',data:{method,endpoint,apiBaseUrl,hasApiSettings:!!apiSettings,useNgrok:apiSettings?.useNgrok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})+'\n');
  } catch (e) {
    console.error('[Main Debug] Log write failed:', e.message);
  }
  // #endregion
  // Get base URL (ngrok or regular)
  let baseUrl = apiBaseUrl;
  if (apiSettings?.useNgrok) {
    const ngrokUrl = await getNgrokUrl();
    if (ngrokUrl) {
      baseUrl = ngrokUrl;
    }
  }
  // #region agent log
  fs.appendFileSync(logPath, JSON.stringify({location:'main.js:243',message:'baseUrl determined',data:{baseUrl,apiBaseUrl,useNgrok:apiSettings?.useNgrok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})+'\n');
  // #endregion
  
  const endpointType = options.endpointType || 'default';
  const timeout = options.timeout || getEndpointTimeout(endpointType);
  const retryCount = options.retryCount ?? (apiSettings?.retryCount ?? 3);
  const retryDelay = apiSettings?.retryDelay ?? 1000;
  const retryBackoff = apiSettings?.retryBackoff !== false;
  
  const url = `${baseUrl}${endpoint}`;
  const headers = buildRequestHeaders(options.headers || {}, endpointType);
  // #region agent log
  fs.appendFileSync(logPath, JSON.stringify({location:'main.js:252',message:'request config',data:{url,timeout,retryCount,hasHeaders:!!headers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})+'\n');
  // #endregion
  
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
      // #region agent log
      fs.appendFileSync('/Users/machd/sergik_custom_gpt/.cursor/debug.log', JSON.stringify({location:'main.js:295',message:'axios attempt',data:{attempt,url,method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})+'\n');
      // #endregion
      const startTime = Date.now();
      const response = await axios(requestConfig);
      const duration = Date.now() - startTime;
      // #region agent log
      fs.appendFileSync(logPath, JSON.stringify({location:'main.js:298',message:'axios success',data:{status:response.status,duration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})+'\n');
      // #endregion
      
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
      // #region agent log
      fs.appendFileSync('/Users/machd/sergik_custom_gpt/.cursor/debug.log', JSON.stringify({location:'main.js:316',message:'axios error',data:{attempt,errorMessage:error?.message,errorCode:error?.code,hasResponse:!!error?.response,responseStatus:error?.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})+'\n');
      // #endregion
      
      // Log error if enabled
      if (apiSettings?.logErrors) {
        console.error(`[API Error] ${method} ${url} - Attempt ${attempt}/${retryCount + 1}:`, error.message);
      }
      
      // Don't retry on last attempt or on certain errors
      // Also don't retry on connection refused (server not running)
      if (attempt > retryCount || 
          (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) ||
          error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = retryBackoff ? retryDelay * Math.pow(2, attempt - 1) : retryDelay;
      await sleep(delay);
    }
  }
  
  // All retries failed
  // #region agent log
  fs.appendFileSync('/Users/machd/sergik_custom_gpt/.cursor/debug.log', JSON.stringify({location:'main.js:333',message:'apiRequest failed',data:{finalError:lastError?.message,finalErrorCode:lastError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})+'\n');
  // #endregion
  
  // Provide user-friendly error messages
  let errorMessage = lastError?.message || 'Request failed';
  if (lastError?.code === 'ECONNREFUSED') {
    errorMessage = `Cannot connect to API server at ${baseUrl}. Is the SERGIK ML API server running?`;
  } else if (lastError?.code === 'ENOTFOUND') {
    errorMessage = `Cannot resolve API server hostname. Check your API URL settings.`;
  } else if (lastError?.code === 'ETIMEDOUT') {
    errorMessage = `Connection to API server timed out. The server may be slow or unresponsive.`;
  }
  
  return {
    success: false,
    error: errorMessage,
    status: lastError?.response?.status,
    data: lastError?.response?.data,
    errorCode: lastError?.code
  };
}

/**
 * Get ngrok URL dynamically if configured
 */
async function getNgrokUrl() {
  if (!apiSettings?.useNgrok || !apiSettings.ngrokApiKey) {
    return apiSettings?.ngrokUrl || null;
  }
  
  try {
    // Query ngrok API for active tunnels
    const response = await axios.get('https://api.ngrok.com/tunnels', {
      headers: {
        'Authorization': `Bearer ${apiSettings.ngrokApiKey}`,
        'Ngrok-Version': '2'
      },
      timeout: 5000
    });
    
    if (response.data && response.data.tunnels && response.data.tunnels.length > 0) {
      // Find HTTPS tunnel
      const httpsTunnel = response.data.tunnels.find(t => t.proto === 'https');
      if (httpsTunnel) {
        return httpsTunnel.public_url;
      }
      // Fallback to first tunnel
      return response.data.tunnels[0].public_url;
    }
  } catch (error) {
    console.warn('[Ngrok] Failed to fetch dynamic URL, using configured URL:', error.message);
  }
  
  return apiSettings?.ngrokUrl || null;
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

/**
 * Encrypt API key for storage
 */
function encryptApiKey(key, value) {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      // Use Electron's safeStorage for OS-level encryption
      const buffer = Buffer.from(value, 'utf8');
      return safeStorage.encryptString(value);
    } else {
      // Fallback: simple base64 encoding (not secure, but better than plain text)
      console.warn('[Security] OS-level encryption not available, using fallback');
      return Buffer.from(value).toString('base64');
    }
  } catch (error) {
    console.error('[Security] Failed to encrypt API key:', error);
    return null;
  }
}

/**
 * Decrypt API key from storage
 */
function decryptApiKey(key, encryptedValue) {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(encryptedValue);
    } else {
      // Fallback decryption
      return Buffer.from(encryptedValue, 'base64').toString('utf8');
    }
  } catch (error) {
    console.error('[Security] Failed to decrypt API key:', error);
    return null;
  }
}

/**
 * Load API keys from environment variables
 */
function loadApiKeysFromEnv() {
  // Map environment variable names to service names
  const envKeyMap = {
    'OPENAI_API_KEY': 'openai',
    'ANTHROPIC_API_KEY': 'anthropic',
    'GOOGLE_API_KEY': 'google',
    'GOOGLE_AI_API_KEY': 'google',
    'SERGIK_API_KEY': 'sergik',
    'NGROK_API_KEY': 'ngrok'
  };
  
  let loadedCount = 0;
  
  // Check environment variables
  for (const [envVar, service] of Object.entries(envKeyMap)) {
    const value = process.env[envVar];
    if (value && value.trim()) {
      // Only set if not already in store (don't overwrite user-set keys)
      if (!apiKeysStore[service]) {
        apiKeysStore[service] = value.trim();
        loadedCount++;
        console.log(`[API Keys] Loaded ${service} key from environment variable ${envVar}`);
      }
    }
  }
  
  // Also check for .env file in project root (if running from project directory)
  try {
    const projectRoot = path.resolve(__dirname, '..');
    const envPath = path.join(projectRoot, '.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        // Parse KEY=VALUE format
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          if (envKeyMap[key] && value) {
            const service = envKeyMap[key];
            // Only set if not already in store
            if (!apiKeysStore[service]) {
              apiKeysStore[service] = value;
              loadedCount++;
              console.log(`[API Keys] Loaded ${service} key from .env file`);
            }
          }
        }
      }
    }
  } catch (error) {
    // .env file not found or couldn't be read - that's okay
    console.log('[API Keys] No .env file found or couldn\'t read it');
  }
  
  if (loadedCount > 0) {
    // Save loaded keys to encrypted storage
    saveApiKeys();
    console.log(`[API Keys] Loaded ${loadedCount} API key(s) from environment`);
  }
}

/**
 * Load encrypted API keys from disk
 */
function loadApiKeys() {
  try {
    const userDataPath = app.getPath('userData');
    const keysPath = path.join(userDataPath, 'api-keys.encrypted.json');
    
    if (fs.existsSync(keysPath)) {
      const encryptedData = fs.readFileSync(keysPath, 'utf8');
      const data = JSON.parse(encryptedData);
      
      // Decrypt all keys
      for (const [service, encrypted] of Object.entries(data)) {
        apiKeysStore[service] = decryptApiKey(service, encrypted);
      }
    }
    
    // After loading from disk, also check environment variables
    // This allows env vars to be used as fallback or override
    loadApiKeysFromEnv();
  } catch (error) {
    console.error('[Security] Failed to load API keys:', error);
    // Still try to load from environment
    loadApiKeysFromEnv();
  }
}

/**
 * Save encrypted API keys to disk
 */
function saveApiKeys() {
  try {
    const userDataPath = app.getPath('userData');
    const keysPath = path.join(userDataPath, 'api-keys.encrypted.json');
    
    // Encrypt all keys
    const encryptedData = {};
    for (const [service, value] of Object.entries(apiKeysStore)) {
      if (value) {
        encryptedData[service] = encryptApiKey(service, value);
      }
    }
    
    fs.writeFileSync(keysPath, JSON.stringify(encryptedData, null, 2));
    // Set restrictive permissions (Unix/Mac)
    if (process.platform !== 'win32') {
      fs.chmodSync(keysPath, 0o600);
    }
  } catch (error) {
    console.error('[Security] Failed to save API keys:', error);
  }
}

// IPC handlers for API key management
ipcMain.handle('get-api-key', (event, service) => {
  return apiKeysStore[service] || null;
});

ipcMain.handle('set-api-key', (event, service, key) => {
  if (key) {
    apiKeysStore[service] = key;
    saveApiKeys();
    return { success: true };
  } else {
    delete apiKeysStore[service];
    saveApiKeys();
    return { success: true };
  }
});

ipcMain.handle('list-api-keys', () => {
  // Return list of services with keys (but not the keys themselves)
  return Object.keys(apiKeysStore).filter(key => apiKeysStore[key]);
});

ipcMain.handle('get-api-keys-info', () => {
  // Return info about which keys are loaded and their sources
  const info = {};
  const envKeyMap = {
    'OPENAI_API_KEY': 'openai',
    'ANTHROPIC_API_KEY': 'anthropic',
    'GOOGLE_API_KEY': 'google',
    'GOOGLE_AI_API_KEY': 'google',
    'SERGIK_API_KEY': 'sergik',
    'NGROK_API_KEY': 'ngrok'
  };
  
  // Check which keys exist in store
  for (const [service, key] of Object.entries(apiKeysStore)) {
    if (key) {
      // Find which env var this might have come from
      const envVar = Object.entries(envKeyMap).find(([_, s]) => s === service)?.[0];
      info[service] = {
        hasKey: true,
        source: envVar && process.env[envVar] ? 'environment' : 'user',
        envVar: envVar || null
      };
    }
  }
  
  return info;
});

ipcMain.handle('delete-api-key', (event, service) => {
  delete apiKeysStore[service];
  saveApiKeys();
  return { success: true };
});

// Load API keys on startup
console.log('[Main Debug] ===== APP STARTING =====');
console.log('[Main Debug] Loading API keys and settings on startup...');

// Test log file write immediately
try {
  fs.appendFileSync(logPath, JSON.stringify({location:'main.js:790',message:'APP STARTUP',data:{apiBaseUrl,pid:process.pid,cwd:process.cwd(),__dirname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'STARTUP'})+'\n');
  console.log('[Main Debug] Log file write test: SUCCESS');
} catch (e) {
  console.error('[Main Debug] Log file write test: FAILED', e.message, e.code);
  // #region agent log
  try {
    process.stderr.write(`[Main Debug] Log write error: ${e.message}\n`);
  } catch (e2) {
    // Ignore
  }
  // #endregion
}

// #region agent log
try {
  fs.appendFileSync(logPath, JSON.stringify({location:'main.js:803',message:'Before loadApiKeys',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'STARTUP'})+'\n');
} catch (e) {
  console.error('[Main Debug] Log write failed before loadApiKeys:', e.message);
}
// #endregion

loadApiKeys();

// #region agent log
try {
  fs.appendFileSync(logPath, JSON.stringify({location:'main.js:810',message:'Before loadApiSettings',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'STARTUP'})+'\n');
} catch (e) {
  console.error('[Main Debug] Log write failed before loadApiSettings:', e.message);
}
// #endregion

loadApiSettings();
console.log('[Main Debug] API keys loaded, API base URL:', apiBaseUrl);
console.log('[Main Debug] All IPC handlers should be registered now');

// #region agent log
try {
  fs.appendFileSync(logPath, JSON.stringify({location:'main.js:820',message:'After loadApiSettings',data:{apiBaseUrl,hasApiSettings:!!apiSettings},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'STARTUP'})+'\n');
} catch (e) {
  console.error('[Main Debug] Log write failed after loadApiSettings:', e.message);
}
// #endregion

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
  // #region agent log
  try {
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:838',message:'app.whenReady fired',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'APP_READY'})+'\n');
  } catch (e) {
    console.error('[Main Debug] Log write failed in app.whenReady:', e.message);
  }
  // #endregion
  
  console.log('[Main Debug] Electron app.whenReady() fired');
  // Initialize library structure
  initializeLibraryStructure();
  
  // #region agent log
  try {
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:849',message:'Before createWindow',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'APP_READY'})+'\n');
  } catch (e) {
    console.error('[Main Debug] Log write failed before createWindow:', e.message);
  }
  // #endregion
  
  createWindow();
  
  // #region agent log
  try {
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:857',message:'After createWindow',data:{hasMainWindow:!!mainWindow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'APP_READY'})+'\n');
  } catch (e) {
    console.error('[Main Debug] Log write failed after createWindow:', e.message);
  }
  // #endregion

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
ipcMain.handle('get-api-url', () => {
  console.log('[Main Debug] get-api-url handler called, returning:', apiBaseUrl);
  return apiBaseUrl;
});

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

// Health Check - Register handler
// Register BEFORE app.whenReady to ensure it's available
console.log('[Main Debug] Registering check-health IPC handler at startup');
ipcMain.handle('check-health', async (event) => {
  const logPath = '/Users/machd/sergik_custom_gpt/.cursor/debug.log';
  
  console.log('[Main Debug] ===== check-health IPC handler CALLED =====', { 
    apiBaseUrl, 
    hasApiSettings: !!apiSettings,
    timestamp: new Date().toISOString(),
    processId: process.pid
  });
  
  // #region agent log
  try {
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:860',message:'check-health IPC entry',data:{apiBaseUrl,hasApiSettings:!!apiSettings,useNgrok:apiSettings?.useNgrok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
    console.log('[Main Debug] Log written successfully to:', logPath);
  } catch (e) {
    console.error('[Main Debug] Failed to write log:', e.message, e.code, e.stack?.substring(0, 100));
  }
  // #endregion
  try {
    console.log('[Main Debug] Calling apiRequest for /health');
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:880',message:'calling apiRequest',data:{endpoint:'/health',endpointType:'health'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n');
    // #endregion
    const result = await apiRequest('GET', '/health', null, { endpointType: 'health' });
    console.log('[Main Debug] apiRequest result', { success: result?.success, error: result?.error, hasData: !!result?.data });
    // #region agent log
    const logPath2 = '/Users/machd/sergik_custom_gpt/.cursor/debug.log';
    fs.appendFileSync(logPath2, JSON.stringify({location:'main.js:888',message:'apiRequest result',data:{success:result?.success,status:result?.status,error:result?.error,hasData:!!result?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})+'\n');
    // #endregion
    if (result.success) {
      return {
        success: true,
        status: result.data?.status,
        service: result.data?.service
      };
    }
    return result;
  } catch (error) {
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'main.js:803',message:'check-health error',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})+'\n');
    // #endregion
    return { success: false, error: error.message };
  }
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
// Organization Endpoints
// ============================================================================

// Auto-Organize
ipcMain.handle('organize-auto-organize', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/organize/auto-organize', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Preview Organization
ipcMain.handle('organize-preview', async (event, params) => {
  try {
    const { source_dirs, target_base, organize_by } = params;
    const query = `source_dirs=${encodeURIComponent(source_dirs)}&target_base=${encodeURIComponent(target_base)}&organize_by=${encodeURIComponent(organize_by)}`;
    const result = await apiRequest('GET', `/organize/preview?${query}`, null, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// ============================================================================
// Transform Endpoints
// ============================================================================

// Quantize
ipcMain.handle('transform-quantize', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/transform/quantize', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Transpose
ipcMain.handle('transform-transpose', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/transform/transpose', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Velocity
ipcMain.handle('transform-velocity', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/transform/velocity', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Legato
ipcMain.handle('transform-legato', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/transform/legato', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Remove Overlaps
ipcMain.handle('transform-remove-overlaps', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/transform/remove_overlaps', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Fade
ipcMain.handle('transform-fade', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/transform/fade', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Normalize
ipcMain.handle('transform-normalize', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/transform/normalize', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Time Stretch
ipcMain.handle('transform-time-stretch', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/transform/time_stretch', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Pitch Shift
ipcMain.handle('transform-pitch-shift', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/transform/pitch_shift', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Time Shift
ipcMain.handle('transform-time-shift', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/transform/time_shift', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// Export Endpoints
// ============================================================================

// Export Track
ipcMain.handle('export-track', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/export/track', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Batch Export
ipcMain.handle('export-batch', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/export/batch', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export Stems
ipcMain.handle('export-stems', async (event, params) => {
  try {
    const result = await apiRequest('POST', '/export/stems', params, { endpointType: 'live' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// Additional Analysis Endpoints
// ============================================================================

// Batch Analyze
ipcMain.handle('analyze-batch', async (event, params) => {
  try {
    const { source_dir, include_musicbrainz, generate_profiles } = params;
    const query = `source_dir=${encodeURIComponent(source_dir)}&include_musicbrainz=${include_musicbrainz}&generate_profiles=${generate_profiles}`;
    const result = await apiRequest('POST', `/analyze/batch?${query}`, null, { endpointType: 'analyze' });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// GPT Analyze (DNA Match)
ipcMain.handle('gpt-analyze', async (event, filePath) => {
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
    
    const result = await apiRequest('POST', '/gpt/analyze', { form }, {
      endpointType: 'gpt',
      headers: form.getHeaders()
    });
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
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

