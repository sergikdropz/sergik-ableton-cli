/**
 * Settings Manager
 * Handles app settings, persistence, and UI
 */

class SettingsManager {
    constructor() {
        this.settings = this.getDefaultSettings();
        this.changeQueue = [];
        this.changeHistory = [];
        this.maxHistorySize = 50;
        this.validationCache = new Map();
        this.isSaving = false;
        this.lastSaveTime = null;
        this.searchQuery = '';
        this.searchResults = [];
        
        // Debounced auto-save
        this.autoSaveDebounce = window.debounce ? window.debounce(() => {
            this.flushChanges();
        }, 500) : null;
        
        // Test tone audio context
        this.testToneContext = null;
        this.testToneOscillator = null;
        this.testToneGain = null;
        
        this.loadSettings();
        this.setupEventListeners();
        this.setupEnhancedFeatures();
        // Load API settings from main process after a short delay
        setTimeout(() => this.loadApiSettingsFromMain(), 500);
    }
    
    getDefaultSettings() {
        return {
            api: {
                url: 'http://127.0.0.1:8000',
                timeout: 10000,
                retryCount: 3,
                retryDelay: 1000,
                retryBackoff: true,
                // Authentication
                authType: 'none', // none, api_key, bearer, basic
                apiKey: '',
                apiKeyHeader: 'X-API-Key',
                bearerToken: '',
                basicUsername: '',
                basicPassword: '',
                // Custom headers
                customHeaders: {},
                // Per-endpoint timeouts (ms)
                endpointTimeouts: {
                    health: 5000,
                    generate: 30000,
                    analyze: 60000,
                    live: 10000,
                    transport: 5000,
                    browser: 10000
                },
                // Request configuration
                maxRequestSize: 10485760, // 10MB
                followRedirects: true,
                validateSSL: true,
                // Proxy settings
                useProxy: false,
                proxyHost: '',
                proxyPort: '',
                proxyAuth: false,
                proxyUsername: '',
                proxyPassword: '',
                // Logging and monitoring
                logRequests: false,
                logResponses: false,
                logErrors: true,
                showRequestDetails: false,
                // Connection settings
                keepAlive: true,
                maxConnections: 10,
                connectionTimeout: 5000,
                // Ngrok support
                useNgrok: false,
                ngrokUrl: '',
                ngrokApiKey: '', // For ngrok API to get dynamic URLs
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
            },
            appearance: {
                theme: 'dark',
                fontSize: 'medium',
                uiDensity: 'normal'
            },
            behavior: {
                autoSave: false,
                autoConnect: true,
                defaultTempo: 124
            },
            notifications: {
                enabled: true,
                sound: false,
                duration: 3000
            },
            advanced: {
                debugMode: false,
                logLevel: 'info'
            },
            audio: {
                // Device Configuration
                device: {
                    driverType: 'CoreAudio', // 'CoreAudio', 'ASIO', 'DirectSound', 'WASAPI'
                    inputDevice: 'No Device',
                    outputDevice: 'Default',
                    inputConfig: {
                        enabled: false,
                        channels: []
                    },
                    outputConfig: {
                        enabled: true,
                        channels: []
                    }
                },
                
                // Sample Rate Configuration
                sampleRate: {
                    inOutRate: 44100, // 44100, 48000, 88200, 96000
                    defaultSR: {
                        enabled: true,
                        value: 44100
                    },
                    pitchConversion: 'Normal' // 'Normal', 'Repitch', 'Complex', 'Complex Pro'
                },
                
                // Latency Configuration
                latency: {
                    bufferSize: 128, // Samples: 32, 64, 128, 256, 512, 1024, 2048, etc.
                    inputLatency: 0.00, // ms (read-only, calculated)
                    outputLatency: 0.00, // ms (read-only, calculated)
                    driverErrorCompensation: 0.00, // ms (user-adjustable)
                    overallLatency: 0.00, // ms (read-only, calculated)
                    cpuWarning: "Your CPU can usually handle more tracks and effects if the buffer size is increased, or the sample rate is reduced. However, this may negatively affect latency and audio quality, respectively."
                },
                
                // Test & Monitoring
                test: {
                    testTone: {
                        enabled: false, // 'Off' or 'On'
                        volume: -36, // dB
                        frequency: 440 // Hz
                    },
                    cpuUsageSimulator: 50 // Percentage (0-100)
                },
                
                // Playback settings
                playback: {
                masterVolume: 1.0,
                defaultLoop: false,
                autoPlay: false,
                    crossfadeDuration: 0.0
                },
                
                // Audio context settings (legacy - kept for backward compatibility)
                latencyHint: 'interactive', // 'interactive', 'balanced', 'playback'
                
                // Effects defaults
                effectsEnabled: true,
                reverbRoomSize: 0.5,
                delayTime: 0.3,
                delayFeedback: 0.3,
                eqLowGain: 0,
                eqMidGain: 0,
                eqHighGain: 0,
                compressorThreshold: -24,
                compressorRatio: 12,
                distortionAmount: 50,
                filterFrequency: 1000,
                filterQ: 1,
                chorusRate: 1.5,
                chorusDepth: 0.7,
                
                // Synthesizer defaults
                synthMaxVoices: 8,
                synthWaveform: 'sine',
                synthFilterType: 'lowpass',
                synthFilterFreq: 2000,
                synthFilterQ: 1,
                synthAttack: 0.01,
                synthDecay: 0.1,
                synthSustain: 0.7,
                synthRelease: 0.3,
                synthLfoRate: 0,
                synthLfoAmount: 0,
                synthVolume: 0.3,
                
                // Analyzer settings
                analyzerFftSize: 2048,
                analyzerSmoothing: 0.8,
                analyzerMinDecibels: -100,
                analyzerMaxDecibels: -30,
                analyzerUpdateRate: 60, // FPS for visualization updates
                
                // Performance
                maxActiveEffects: 5,
                enableOfflineRendering: false
            }
        };
    }
    
    loadSettings() {
        try {
            const stored = localStorage.getItem('sergik-settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...this.getDefaultSettings(), ...parsed };
                // Migrate audio settings if needed
                this.migrateAudioSettings();
            }
        } catch (error) {
            console.error('[Settings] Failed to load settings:', error);
        }
        this.applySettings();
        // Update status after a short delay to ensure DOM is ready
        setTimeout(() => this.updateSaveStatus('saved'), 100);
    }
    
    /**
     * Enumerate available audio input and output devices
     * @returns {Promise<{inputs: Array, outputs: Array}>}
     */
    async enumerateAudioDevices() {
        try {
            // Request permission to access media devices (required for device labels)
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                } catch (err) {
                    console.warn('[Settings] Could not request microphone permission:', err);
                }
            }
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                console.warn('[Settings] MediaDevices API not available');
                return { inputs: [], outputs: [] };
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = [];
            const outputs = [];
            
            devices.forEach(device => {
                const deviceInfo = {
                    deviceId: device.deviceId,
                    label: device.label || `Device ${device.deviceId.substring(0, 8)}`,
                    kind: device.kind
                };
                
                if (device.kind === 'audioinput') {
                    inputs.push(deviceInfo);
                } else if (device.kind === 'audiooutput') {
                    outputs.push(deviceInfo);
                }
            });
            
            // Add "No Device" option for inputs
            inputs.unshift({ deviceId: 'none', label: 'No Device', kind: 'audioinput' });
            
            // Add "Default" option for outputs
            outputs.unshift({ deviceId: 'default', label: 'Default', kind: 'audiooutput' });
            
            return { inputs, outputs };
        } catch (error) {
            console.error('[Settings] Failed to enumerate audio devices:', error);
            return { inputs: [{ deviceId: 'none', label: 'No Device', kind: 'audioinput' }], 
                     outputs: [{ deviceId: 'default', label: 'Default', kind: 'audiooutput' }] };
        }
    }
    
    /**
     * Detect driver type based on platform
     * @returns {string}
     */
    detectDriverType() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        if (platform.includes('mac') || userAgent.includes('mac')) {
            return 'CoreAudio';
        } else if (userAgent.includes('win')) {
            // Windows - could be ASIO, DirectSound, or WASAPI
            // Default to WASAPI for modern Windows
            return 'WASAPI';
        } else {
            // Linux or other
            return 'CoreAudio'; // Default fallback
        }
    }
    
    /**
     * Populate audio device dropdowns
     */
    async populateAudioDevices() {
        const { inputs, outputs } = await this.enumerateAudioDevices();
        
        // Populate input device dropdown
        const inputSelect = document.getElementById('settings-audio-device-input');
        if (inputSelect) {
            inputSelect.innerHTML = '';
            inputs.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId === 'none' ? 'No Device' : device.label;
                option.textContent = device.label;
                inputSelect.appendChild(option);
            });
            
            // Set current value
            const currentInput = this.settings.audio?.device?.inputDevice || 'No Device';
            inputSelect.value = currentInput;
        }
        
        // Populate output device dropdown
        const outputSelect = document.getElementById('settings-audio-device-output');
        if (outputSelect) {
            outputSelect.innerHTML = '';
            outputs.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId === 'default' ? 'Default' : device.label;
                option.textContent = device.label;
                outputSelect.appendChild(option);
            });
            
            // Set current value
            const currentOutput = this.settings.audio?.device?.outputDevice || 'Default';
            outputSelect.value = currentOutput;
        }
        
        // Set driver type
        const driverSelect = document.getElementById('settings-audio-device-driver');
        if (driverSelect) {
            const detectedDriver = this.detectDriverType();
            const currentDriver = this.settings.audio?.device?.driverType || detectedDriver;
            driverSelect.value = currentDriver;
        }
    }
    
    /**
     * Calculate latency in milliseconds from buffer size and sample rate
     * @param {number} bufferSize - Buffer size in samples
     * @param {number} sampleRate - Sample rate in Hz
     * @returns {number} Latency in milliseconds
     */
    calculateLatency(bufferSize, sampleRate) {
        if (!bufferSize || !sampleRate) return 0;
        return (bufferSize / sampleRate) * 1000;
    }
    
    /**
     * Calculate overall latency from all components
     * @returns {number} Overall latency in milliseconds
     */
    calculateOverallLatency() {
        const audio = this.settings.audio || {};
        const latency = audio.latency || {};
        const sampleRate = audio.sampleRate?.inOutRate || audio.sampleRate || 44100;
        const bufferSize = latency.bufferSize || 128;
        
        const inputLatency = this.calculateLatency(bufferSize, sampleRate);
        const outputLatency = this.calculateLatency(bufferSize, sampleRate);
        const driverErrorCompensation = latency.driverErrorCompensation || 0;
        
        return inputLatency + outputLatency + driverErrorCompensation;
    }
    
    /**
     * Update latency display fields in UI
     */
    updateLatencyDisplay() {
        const audio = this.settings.audio || {};
        const latency = audio.latency || {};
        const sampleRate = audio.sampleRate?.inOutRate || audio.sampleRate || 44100;
        const bufferSize = latency.bufferSize || 128;
        
        const inputLatency = this.calculateLatency(bufferSize, sampleRate);
        const outputLatency = this.calculateLatency(bufferSize, sampleRate);
        const driverErrorCompensation = latency.driverErrorCompensation || 0;
        const overallLatency = inputLatency + outputLatency + driverErrorCompensation;
        
        // Update read-only latency fields
        const inputLatencyEl = document.getElementById('settings-audio-latency-input');
        if (inputLatencyEl) {
            inputLatencyEl.textContent = `${inputLatency.toFixed(2)} ms`;
        }
        
        const outputLatencyEl = document.getElementById('settings-audio-latency-output');
        if (outputLatencyEl) {
            outputLatencyEl.textContent = `${outputLatency.toFixed(2)} ms`;
        }
        
        const overallLatencyEl = document.getElementById('settings-audio-latency-overall');
        if (overallLatencyEl) {
            overallLatencyEl.textContent = `${overallLatency.toFixed(2)} ms`;
        }
        
        // Update settings object with calculated values
        if (!this.settings.audio.latency) {
            this.settings.audio.latency = {};
        }
        this.settings.audio.latency.inputLatency = inputLatency;
        this.settings.audio.latency.outputLatency = outputLatency;
        this.settings.audio.latency.overallLatency = overallLatency;
    }
    
    /**
     * Migrate audio settings from old structure to new structure
     */
    migrateAudioSettings() {
        if (!this.settings.audio) {
            return;
        }
        
        const audio = this.settings.audio;
        let migrated = false;
        
        // Migrate sampleRate to sampleRate.inOutRate
        if (audio.sampleRate && typeof audio.sampleRate === 'number') {
            if (!audio.sampleRate) {
                audio.sampleRate = {};
            }
            if (typeof audio.sampleRate === 'number') {
                const oldRate = audio.sampleRate;
                audio.sampleRate = {
                    inOutRate: oldRate,
                    defaultSR: {
                        enabled: true,
                        value: oldRate
                    },
                    pitchConversion: 'Normal'
                };
                migrated = true;
            }
        }
        
        // Migrate bufferSize to latency.bufferSize
        if (audio.bufferSize && typeof audio.bufferSize === 'number') {
            if (!audio.latency) {
                audio.latency = {};
            }
            if (!audio.latency.bufferSize) {
                audio.latency.bufferSize = audio.bufferSize;
                migrated = true;
            }
        }
        
        // Migrate playback settings
        if (audio.masterVolume !== undefined || audio.defaultLoop !== undefined || 
            audio.autoPlay !== undefined || audio.crossfadeDuration !== undefined) {
            if (!audio.playback) {
                audio.playback = {};
            }
            if (audio.masterVolume !== undefined && audio.playback.masterVolume === undefined) {
                audio.playback.masterVolume = audio.masterVolume;
            }
            if (audio.defaultLoop !== undefined && audio.playback.defaultLoop === undefined) {
                audio.playback.defaultLoop = audio.defaultLoop;
            }
            if (audio.autoPlay !== undefined && audio.playback.autoPlay === undefined) {
                audio.playback.autoPlay = audio.autoPlay;
            }
            if (audio.crossfadeDuration !== undefined && audio.playback.crossfadeDuration === undefined) {
                audio.playback.crossfadeDuration = audio.crossfadeDuration;
            }
            migrated = true;
        }
        
        // Initialize device structure if missing
        if (!audio.device) {
            audio.device = {
                driverType: this.detectDriverType(),
                inputDevice: 'No Device',
                outputDevice: 'Default',
                inputConfig: { enabled: false, channels: [] },
                outputConfig: { enabled: true, channels: [] }
            };
            migrated = true;
        }
        
        // Initialize latency structure if missing
        if (!audio.latency) {
            audio.latency = {
                bufferSize: audio.bufferSize || 128,
                inputLatency: 0.00,
                outputLatency: 0.00,
                driverErrorCompensation: 0.00,
                overallLatency: 0.00,
                cpuWarning: "Your CPU can usually handle more tracks and effects if the buffer size is increased, or the sample rate is reduced. However, this may negatively affect latency and audio quality, respectively."
            };
            migrated = true;
        }
        
        // Initialize test structure if missing
        if (!audio.test) {
            audio.test = {
                testTone: {
                    enabled: false,
                    volume: -36,
                    frequency: 440
                },
                cpuUsageSimulator: 50
            };
            migrated = true;
        }
        
        // Initialize sampleRate structure if missing
        if (!audio.sampleRate || typeof audio.sampleRate === 'number') {
            const rate = typeof audio.sampleRate === 'number' ? audio.sampleRate : 44100;
            audio.sampleRate = {
                inOutRate: rate,
                defaultSR: {
                    enabled: true,
                    value: rate
                },
                pitchConversion: 'Normal'
            };
            migrated = true;
        }
        
        // Save if migrated
        if (migrated) {
            console.log('[Settings] Migrated audio settings to new structure');
            this.saveSettings(true); // Silent save
        }
    }
    
    saveSettings(silent = false) {
        try {
            localStorage.setItem('sergik-settings', JSON.stringify(this.settings));
            this.applySettings();
            this.lastSaveTime = Date.now();
            this.updateSaveStatus('saved');
            
            if (!silent && window.showNotification) {
                window.showNotification('Settings saved', 'success', 2000);
            }
            return true;
        } catch (error) {
            console.error('[Settings] Failed to save settings:', error);
            this.updateSaveStatus('error');
            if (!silent && window.showNotification) {
                window.showNotification('Failed to save settings', 'error', 3000);
            }
            return false;
        }
    }
    
    // Queue a change for batched saving
    queueChange(path, value, oldValue = null) {
        // Validate before queuing
        const validation = this.validateSetting(path, value);
        if (!validation.valid) {
            this.showValidationError(path, validation.error);
            return false;
        }
        
        this.changeQueue.push({ path, value, oldValue, timestamp: Date.now() });
        this.addToHistory(path, value, oldValue);
        this.updateSaveStatus('saving');
        
        // Trigger debounced save
        if (this.autoSaveDebounce) {
            this.autoSaveDebounce();
        } else {
            // Fallback if debounce not available
            setTimeout(() => this.flushChanges(), 500);
        }
        
        return true;
    }
    
    // Flush queued changes
    flushChanges() {
        if (this.changeQueue.length === 0) return;
        
        this.isSaving = true;
        const changes = [...this.changeQueue];
        this.changeQueue = [];
        
        // Apply all changes
        changes.forEach(({ path, value }) => {
            this.setSettingInternal(path, value);
        });
        
        this.saveSettings(true);
        this.isSaving = false;
    }
    
    // Internal setter (no save)
    setSettingInternal(path, value) {
        const parts = path.split('.');
        const lastPart = parts.pop();
        let obj = this.settings;
        for (const part of parts) {
            if (!obj[part]) obj[part] = {};
            obj = obj[part];
        }
        obj[lastPart] = value;
    }
    
    // Add to change history
    addToHistory(path, value, oldValue = null) {
        this.changeHistory.unshift({
            path,
            value,
            oldValue,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.changeHistory.length > this.maxHistorySize) {
            this.changeHistory.pop();
        }
    }
    
    // Validate a setting
    validateSetting(path, value) {
        const schema = window.SETTINGS_SCHEMA && window.SETTINGS_SCHEMA[path];
        if (!schema || !schema.validator) {
            return { valid: true };
        }
        
        return schema.validator(value);
    }
    
    // Show validation error
    showValidationError(path, error) {
        const field = document.querySelector(`[data-setting-path="${path}"]`) ||
                     document.getElementById(path.replace(/\./g, '-'));
        
        if (field) {
            // Remove existing error
            const existingError = field.parentElement.querySelector('.field-error');
            if (existingError) existingError.remove();
            
            // Add error message
            const errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            errorEl.textContent = error;
            field.parentElement.appendChild(errorEl);
            
            // Add error class
            field.classList.add('field-error-input');
            
            // Remove error after 5 seconds
            setTimeout(() => {
                errorEl.remove();
                field.classList.remove('field-error-input');
            }, 5000);
        }
    }
    
    // Update save status indicator
    updateSaveStatus(status) {
        const indicator = document.getElementById('settings-status-indicator');
        const icon = document.getElementById('settings-status-icon');
        const text = document.getElementById('settings-status-text');
        
        if (!indicator || !icon || !text) return;
        
        indicator.className = `settings-status-indicator status-${status}`;
        
        switch (status) {
            case 'saving':
                icon.textContent = '⏳';
                text.textContent = 'Saving...';
                break;
            case 'saved':
                icon.textContent = '✓';
                text.textContent = 'Saved';
                setTimeout(() => {
                    if (indicator.classList.contains('status-saved')) {
                        icon.textContent = '●';
                        text.textContent = 'Saved';
                    }
                }, 2000);
                break;
            case 'error':
                icon.textContent = '✗';
                text.textContent = 'Error';
                break;
            case 'unsaved':
                icon.textContent = '●';
                text.textContent = 'Unsaved';
                break;
            default:
                icon.textContent = '●';
                text.textContent = 'Ready';
        }
    }
    
    // Setup enhanced features
    setupEnhancedFeatures() {
        // Settings search
        const searchInput = document.getElementById('settings-search-input');
        if (searchInput && !searchInput.dataset.wired) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.performSearch();
            });
            searchInput.dataset.wired = 'true';
        }
        
        // Settings presets
        const presetsSelect = document.getElementById('settings-presets-select');
        if (presetsSelect && !presetsSelect.dataset.wired) {
            presetsSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.applyPreset(e.target.value);
                    e.target.value = '';
                }
            });
            presetsSelect.dataset.wired = 'true';
        }
        
        // Per-section reset buttons
        document.querySelectorAll('.section-reset-btn').forEach(btn => {
            if (!btn.dataset.wired) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const section = e.target.dataset.section;
                    this.resetSection(section);
                });
                btn.dataset.wired = 'true';
            }
        });
        
        // Test tone toggle
        const testToneEnabled = document.getElementById('settings-audio-test-tone-enabled');
        if (testToneEnabled && !testToneEnabled.dataset.wired) {
            testToneEnabled.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.startTestTone();
                } else {
                    this.stopTestTone();
                }
            });
            testToneEnabled.dataset.wired = 'true';
        }
        
        // Test tone volume and frequency changes
        const testToneVolume = document.getElementById('settings-audio-test-tone-volume');
        if (testToneVolume && !testToneVolume.dataset.wired) {
            testToneVolume.addEventListener('input', () => {
                if (this.testToneOscillator) {
                    this.updateTestTone();
                }
            });
            testToneVolume.dataset.wired = 'true';
        }
        
        const testToneFrequency = document.getElementById('settings-audio-test-tone-frequency');
        if (testToneFrequency && !testToneFrequency.dataset.wired) {
            testToneFrequency.addEventListener('input', () => {
                if (this.testToneOscillator) {
                    this.updateTestTone();
                }
            });
            testToneFrequency.dataset.wired = 'true';
        }
        
        // Latency buffer size and sample rate changes
        const latencyBufferSize = document.getElementById('settings-audio-latency-buffer-size');
        if (latencyBufferSize && !latencyBufferSize.dataset.wired) {
            latencyBufferSize.addEventListener('change', () => {
                const num = parseInt(latencyBufferSize.value);
                if (!isNaN(num) && this.settings.audio) {
                    if (!this.settings.audio.latency) {
                        this.settings.audio.latency = {};
                    }
                    this.settings.audio.latency.bufferSize = num;
                    this.updateLatencyDisplay();
                }
            });
            latencyBufferSize.dataset.wired = 'true';
        }
        
        const sampleRateInOut = document.getElementById('settings-audio-sample-rate-inout');
        if (sampleRateInOut && !sampleRateInOut.dataset.wired) {
            sampleRateInOut.addEventListener('change', () => {
                const num = parseInt(sampleRateInOut.value);
                if (!isNaN(num) && this.settings.audio) {
                    if (!this.settings.audio.sampleRate) {
                        this.settings.audio.sampleRate = {};
                    }
                    this.settings.audio.sampleRate.inOutRate = num;
                    this.updateLatencyDisplay();
                }
            });
            sampleRateInOut.dataset.wired = 'true';
        }
        
        const driverCompensation = document.getElementById('settings-audio-latency-driver-compensation');
        if (driverCompensation && !driverCompensation.dataset.wired) {
            driverCompensation.addEventListener('input', () => {
                const num = parseFloat(driverCompensation.value);
                if (!isNaN(num) && this.settings.audio) {
                    if (!this.settings.audio.latency) {
                        this.settings.audio.latency = {};
                    }
                    this.settings.audio.latency.driverErrorCompensation = num;
                    this.updateLatencyDisplay();
                }
            });
            driverCompensation.dataset.wired = 'true';
        }
        
        // CPU simulator value display
        const cpuSimulator = document.getElementById('settings-audio-cpu-simulator');
        const cpuSimulatorValue = document.getElementById('settings-audio-cpu-simulator-value');
        if (cpuSimulator && cpuSimulatorValue && !cpuSimulator.dataset.wired) {
            cpuSimulator.addEventListener('input', () => {
                cpuSimulatorValue.textContent = `${cpuSimulator.value}%`;
            });
            cpuSimulator.dataset.wired = 'true';
        }
        
        // Test tone volume value display
        const testToneVolumeValue = document.getElementById('settings-audio-test-tone-volume-value');
        if (testToneVolume && testToneVolumeValue && !testToneVolume.dataset.wired) {
            testToneVolume.addEventListener('input', () => {
                testToneVolumeValue.textContent = `${testToneVolume.value} dB`;
            });
            testToneVolume.dataset.wired = 'true';
        }
    }
    
    /**
     * Initialize test tone audio context
     */
    async initTestToneContext() {
        if (this.testToneContext) {
            return;
        }
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.testToneContext = new AudioContextClass();
        } catch (error) {
            console.error('[Settings] Failed to initialize test tone context:', error);
        }
    }
    
    /**
     * Start test tone
     */
    async startTestTone() {
        try {
            await this.initTestToneContext();
            
            if (!this.testToneContext) {
                console.error('[Settings] Test tone context not available');
                return;
            }
            
            // Resume context if suspended
            if (this.testToneContext.state === 'suspended') {
                await this.testToneContext.resume();
            }
            
            // Stop existing tone if any
            this.stopTestTone();
            
            // Get settings
            const audio = this.settings.audio || {};
            const test = audio.test || {};
            const testTone = test.testTone || {};
            const frequency = testTone.frequency || 440;
            const volume = testTone.volume || -36;
            
            // Create oscillator
            this.testToneOscillator = this.testToneContext.createOscillator();
            this.testToneGain = this.testToneContext.createGain();
            
            // Configure oscillator
            this.testToneOscillator.type = 'sine';
            this.testToneOscillator.frequency.value = frequency;
            
            // Configure gain (convert dB to linear)
            const linearVolume = Math.pow(10, volume / 20);
            this.testToneGain.gain.value = linearVolume;
            
            // Connect nodes
            this.testToneOscillator.connect(this.testToneGain);
            this.testToneGain.connect(this.testToneContext.destination);
            
            // Start oscillator
            this.testToneOscillator.start();
            
            console.log('[Settings] Test tone started:', { frequency, volume });
        } catch (error) {
            console.error('[Settings] Failed to start test tone:', error);
        }
    }
    
    /**
     * Stop test tone
     */
    stopTestTone() {
        try {
            if (this.testToneOscillator) {
                this.testToneOscillator.stop();
                this.testToneOscillator.disconnect();
                this.testToneOscillator = null;
            }
            if (this.testToneGain) {
                this.testToneGain.disconnect();
                this.testToneGain = null;
            }
            console.log('[Settings] Test tone stopped');
        } catch (error) {
            console.error('[Settings] Failed to stop test tone:', error);
        }
    }
    
    /**
     * Update test tone parameters
     */
    updateTestTone() {
        if (!this.testToneOscillator || !this.testToneGain) {
            return;
        }
        
        try {
            const audio = this.settings.audio || {};
            const test = audio.test || {};
            const testTone = test.testTone || {};
            const frequency = testTone.frequency || 440;
            const volume = testTone.volume || -36;
            
            // Update frequency
            if (this.testToneOscillator.frequency) {
                this.testToneOscillator.frequency.value = frequency;
            }
            
            // Update volume (convert dB to linear)
            const linearVolume = Math.pow(10, volume / 20);
            if (this.testToneGain.gain) {
                this.testToneGain.gain.value = linearVolume;
            }
        } catch (error) {
            console.error('[Settings] Failed to update test tone:', error);
        }
    }
    
    // Perform settings search
    performSearch() {
        if (!this.searchQuery) {
            this.clearSearch();
            return;
        }
        
        this.searchResults = [];
        const query = this.searchQuery;
        
        // Search through all settings
        this.getAllSettingsPaths().forEach(path => {
            const schema = window.SETTINGS_SCHEMA && window.SETTINGS_SCHEMA[path];
            const value = this.getSetting(path);
            
            if (schema) {
                const label = schema.label || path;
                const description = schema.description || '';
                
                if (
                    path.toLowerCase().includes(query) ||
                    label.toLowerCase().includes(query) ||
                    description.toLowerCase().includes(query) ||
                    String(value).toLowerCase().includes(query)
                ) {
                    this.searchResults.push({ path, schema, value });
                }
            }
        });
        
        this.highlightSearchResults();
    }
    
    // Get all settings paths
    getAllSettingsPaths() {
        const paths = [];
        
        const traverse = (obj, prefix = '') => {
            for (const key in obj) {
                const path = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    traverse(obj[key], path);
                } else {
                    paths.push(path);
                }
            }
        };
        
        traverse(this.settings);
        return paths;
    }
    
    // Highlight search results
    highlightSearchResults() {
        // Remove existing highlights
        document.querySelectorAll('.settings-field').forEach(field => {
            field.classList.remove('search-match', 'search-highlight');
        });
        
        // Highlight matching fields
        this.searchResults.forEach(({ path }) => {
            const field = document.querySelector(`[data-setting-path="${path}"]`) ||
                         document.getElementById(path.replace(/\./g, '-'));
            if (field) {
                const fieldContainer = field.closest('.settings-field');
                if (fieldContainer) {
                    fieldContainer.classList.add('search-match');
                }
            }
        });
        
        // Scroll to first result
        const firstMatch = document.querySelector('.search-match');
        if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    // Clear search
    clearSearch() {
        this.searchQuery = '';
        this.searchResults = [];
        document.querySelectorAll('.settings-field').forEach(field => {
            field.classList.remove('search-match', 'search-highlight');
        });
    }
    
    // Apply preset
    applyPreset(presetName) {
        const preset = window.SETTINGS_PRESETS && window.SETTINGS_PRESETS[presetName];
        if (!preset) return;
        
        if (confirm(`Apply "${preset.name}" preset? This will update your settings.`)) {
            // Merge preset settings
            this.settings = this.deepMerge(this.settings, preset.settings);
            this.saveSettings();
            this.populateUI();
            
            if (window.showNotification) {
                window.showNotification(`Applied "${preset.name}" preset`, 'success', 2000);
            }
        }
    }
    
    // Deep merge objects
    deepMerge(target, source) {
        const output = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }
        return output;
    }
    
    // Reset a section
    resetSection(sectionName) {
        if (!confirm(`Reset ${sectionName} settings to defaults?`)) return;
        
        const defaults = this.getDefaultSettings();
        const sectionDefaults = defaults[sectionName];
        
        if (sectionDefaults) {
            this.settings[sectionName] = { ...sectionDefaults };
            this.saveSettings();
            this.populateUI();
            
            if (window.showNotification) {
                window.showNotification(`${sectionName} settings reset`, 'success', 2000);
            }
        }
    }
    
    async applySettings() {
        // Apply theme
        if (this.settings.appearance.theme === 'light') {
            document.body.classList.add('theme-light');
        } else {
            document.body.classList.remove('theme-light');
        }
        
        // Apply font size
        document.documentElement.style.setProperty('--font-size-base', 
            this.settings.appearance.fontSize === 'small' ? '11px' :
            this.settings.appearance.fontSize === 'large' ? '13px' : '12px'
        );
        
        // Apply UI density
        document.body.classList.remove('density-compact', 'density-comfortable');
        if (this.settings.appearance.uiDensity !== 'normal') {
            document.body.classList.add(`density-${this.settings.appearance.uiDensity}`);
        }
        
        // Sync API settings with main process
        if (window.sergikAPI && window.sergikAPI.setApiSettings && this.settings.api) {
            try {
                await window.sergikAPI.setApiSettings(this.settings.api);
            } catch (error) {
                console.error('[Settings] Failed to sync API settings:', error);
            }
        }
        
        // Apply audio settings to audio engine
        if (window.audioEngine && this.settings.audio) {
            const audio = this.settings.audio;
            const playback = audio.playback || {};
            
            // Apply master volume (check new structure first, then legacy)
            const masterVolume = playback.masterVolume !== undefined ? playback.masterVolume : audio.masterVolume;
            if (masterVolume !== undefined && typeof window.audioEngine.setVolume === 'function') {
                window.audioEngine.setVolume(masterVolume);
            }
            
            // Apply default loop (check new structure first, then legacy)
            const defaultLoop = playback.defaultLoop !== undefined ? playback.defaultLoop : audio.defaultLoop;
            if (defaultLoop !== undefined && typeof window.audioEngine.setLoop === 'function') {
                window.audioEngine.setLoop(defaultLoop);
            }
            
            // Apply effects enabled
            if (audio.effectsEnabled !== undefined && typeof window.audioEngine.setEffectsEnabled === 'function') {
                window.audioEngine.setEffectsEnabled(audio.effectsEnabled);
            }
            
            // Apply sample rate if audio engine supports it
            const sampleRate = audio.sampleRate?.inOutRate || (typeof audio.sampleRate === 'number' ? audio.sampleRate : undefined);
            if (sampleRate !== undefined && typeof window.audioEngine.setSampleRate === 'function') {
                window.audioEngine.setSampleRate(sampleRate);
            }
            
            // Apply buffer size if audio engine supports it
            const bufferSize = audio.latency?.bufferSize || audio.bufferSize;
            if (bufferSize !== undefined && typeof window.audioEngine.setBufferSize === 'function') {
                window.audioEngine.setBufferSize(bufferSize);
            }
            
            // Store audio settings for use by audio engine initialization
            if (!window.audioSettings) {
                window.audioSettings = {};
            }
            window.audioSettings = { ...audio };
            
            // Update library audio manager if initialized
            if (window.libraryAudioManager && window.libraryAudioManager.isInitialized) {
                // Update UI controls with new default settings
                window.libraryAudioManager.resetToDefaults(window.audioSettings);
            }
        }
    }
    
    async loadApiSettingsFromMain() {
        // Load API settings from main process if available
        if (window.sergikAPI && window.sergikAPI.getApiSettings) {
            try {
                const mainSettings = await window.sergikAPI.getApiSettings();
                if (mainSettings) {
                    this.settings.api = { ...this.getDefaultSettings().api, ...mainSettings };
                    this.saveSettings();
                }
            } catch (error) {
                console.error('[Settings] Failed to load API settings from main:', error);
            }
        }
    }
    
    setupEventListeners() {
        // Settings modal
        const modal = document.getElementById('settings-modal');
        const closeBtn = document.getElementById('settings-close');
        const cancelBtn = document.getElementById('settings-cancel');
        const saveBtn = document.getElementById('settings-save');
        
        // Navigation
        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Don't trigger if clicking reset button
                if (e.target.classList.contains('section-reset-btn')) {
                    return;
                }
                
                if (window.visualFeedback) {
                    window.visualFeedback.addTabFeedback(btn, true);
                    window.visualFeedback.addRipple(btn, e);
                }
                const section = btn.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Close handlers
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                if (window.visualFeedback) {
                    window.visualFeedback.addRipple(closeBtn, e);
                    window.visualFeedback.addButtonFeedback(closeBtn, null, 'click');
                }
                this.hide();
            });
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                if (window.visualFeedback) {
                    window.visualFeedback.addRipple(cancelBtn, e);
                    window.visualFeedback.addButtonFeedback(cancelBtn, null, 'click');
                }
                this.hide();
            });
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                if (window.visualFeedback) {
                    window.visualFeedback.addRipple(saveBtn, e);
                    window.visualFeedback.addButtonFeedback(saveBtn, 'saving...', 'loading');
                }
                this.saveFromUI();
                if (window.visualFeedback) {
                    setTimeout(() => {
                        window.visualFeedback.addButtonFeedback(saveBtn, 'saved!', 'success');
                    }, 200);
                }
            });
        }
        
        // Close on backdrop click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hide();
                }
            });
        }
        
        // Test API connection
        const testBtn = document.getElementById('test-api-connection');
        if (testBtn) {
            testBtn.addEventListener('click', async (e) => {
                if (window.visualFeedback) {
                    window.visualFeedback.addRipple(testBtn, e);
                    window.visualFeedback.addButtonFeedback(testBtn, 'testing...', 'loading');
                }
                try {
                    await this.testConnection();
                    if (window.visualFeedback) {
                        window.visualFeedback.addButtonFeedback(testBtn, 'connected!', 'success');
                    }
                } catch (error) {
                    if (window.visualFeedback) {
                        window.visualFeedback.addButtonFeedback(testBtn, 'failed!', 'error');
                    }
                }
            });
        }
        
        // Auth type change handler
        const authType = document.getElementById('settings-auth-type');
        if (authType) {
            authType.addEventListener('change', () => {
                if (window.visualFeedback) {
                    window.visualFeedback.addSelectFeedback(authType);
                }
                this.updateAuthFieldsVisibility();
            });
        }
        
        // Export/Import
        const exportBtn = document.getElementById('export-settings');
        const importBtn = document.getElementById('import-settings');
        const resetBtn = document.getElementById('reset-settings');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                if (window.visualFeedback) {
                    window.visualFeedback.addRipple(exportBtn, e);
                    window.visualFeedback.addButtonFeedback(exportBtn, 'exporting...', 'loading');
                }
                this.exportSettings();
                if (window.visualFeedback) {
                    setTimeout(() => {
                        window.visualFeedback.addButtonFeedback(exportBtn, 'exported!', 'success');
                    }, 300);
                }
            });
        }
        if (importBtn) {
            importBtn.addEventListener('click', (e) => {
                if (window.visualFeedback) {
                    window.visualFeedback.addRipple(importBtn, e);
                    window.visualFeedback.addButtonFeedback(importBtn, 'importing...', 'loading');
                }
                this.importSettings();
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                if (window.visualFeedback) {
                    window.visualFeedback.addRipple(resetBtn, e);
                    window.visualFeedback.addButtonFeedback(resetBtn, null, 'click');
                }
                this.resetSettings();
            });
        }
        
        // Add feedback to all checkboxes in settings
        setTimeout(() => {
            document.querySelectorAll('#settings-modal input[type="checkbox"]').forEach(checkbox => {
                if (!checkbox.dataset.hasFeedback) {
                    checkbox.addEventListener('change', (e) => {
                        if (window.visualFeedback) {
                            window.visualFeedback.addCheckboxFeedback(checkbox, e.target.checked);
                        }
                    });
                    checkbox.dataset.hasFeedback = 'true';
                }
            });
            
            // Add feedback to all selects in settings
            document.querySelectorAll('#settings-modal select').forEach(select => {
                if (!select.dataset.hasFeedback) {
                    select.addEventListener('change', () => {
                        if (window.visualFeedback) {
                            window.visualFeedback.addSelectFeedback(select);
                        }
                    });
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
                    select.dataset.hasFeedback = 'true';
                }
            });
            
            // Add feedback to all text inputs in settings
            document.querySelectorAll('#settings-modal input[type="text"], #settings-modal input[type="number"], #settings-modal input[type="password"]').forEach(input => {
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
        }, 100);
    }
    
    show() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            this.populateUI();
            this.setupEnhancedFeatures();
            this.updateSaveStatus('saved');
            modal.classList.add('show');
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }
    
    hide() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            // Stop test tone when closing settings
            this.stopTestTone();
        }
    }
    
    showSection(sectionName) {
        // Update nav buttons
        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            const btnSection = btn.getAttribute('data-section');
            btn.classList.toggle('active', btnSection === sectionName);
            // Update reset button visibility
            const resetBtn = btn.querySelector('.section-reset-btn');
            if (resetBtn) {
                resetBtn.dataset.section = btnSection;
            }
        });
        
        // Update sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.toggle('active', section.id === `settings-${sectionName}`);
        });
        
        // Re-wire reset buttons for this section
        setTimeout(() => this.setupEnhancedFeatures(), 50);
    }
    
    populateUI() {
        // API - Basic
        const apiUrl = document.getElementById('settings-api-url');
        const timeout = document.getElementById('settings-timeout');
        const retryCount = document.getElementById('settings-retry-count');
        const retryDelay = document.getElementById('settings-retry-delay');
        const retryBackoff = document.getElementById('settings-retry-backoff');
        
        if (apiUrl) apiUrl.value = this.settings.api.url || 'http://127.0.0.1:8000';
        if (timeout) timeout.value = this.settings.api.timeout || 10000;
        if (retryCount) retryCount.value = this.settings.api.retryCount || 3;
        if (retryDelay) retryDelay.value = this.settings.api.retryDelay || 1000;
        if (retryBackoff) retryBackoff.checked = this.settings.api.retryBackoff !== false;
        
        // API - Authentication
        const authType = document.getElementById('settings-auth-type');
        const apiKey = document.getElementById('settings-api-key');
        const apiKeyHeader = document.getElementById('settings-api-key-header');
        const bearerToken = document.getElementById('settings-bearer-token');
        const basicUsername = document.getElementById('settings-basic-username');
        const basicPassword = document.getElementById('settings-basic-password');
        
        if (authType) authType.value = this.settings.api.authType || 'none';
        if (apiKey) apiKey.value = this.settings.api.apiKey || '';
        if (apiKeyHeader) apiKeyHeader.value = this.settings.api.apiKeyHeader || 'X-API-Key';
        if (bearerToken) bearerToken.value = this.settings.api.bearerToken || '';
        if (basicUsername) basicUsername.value = this.settings.api.basicUsername || '';
        if (basicPassword) basicPassword.value = this.settings.api.basicPassword || '';
        
        // API - Endpoint Timeouts
        const timeoutHealth = document.getElementById('settings-timeout-health');
        const timeoutGenerate = document.getElementById('settings-timeout-generate');
        const timeoutAnalyze = document.getElementById('settings-timeout-analyze');
        const timeoutLive = document.getElementById('settings-timeout-live');
        
        const timeouts = this.settings.api.endpointTimeouts || {};
        if (timeoutHealth) timeoutHealth.value = timeouts.health || 5000;
        if (timeoutGenerate) timeoutGenerate.value = timeouts.generate || 30000;
        if (timeoutAnalyze) timeoutAnalyze.value = timeouts.analyze || 60000;
        if (timeoutLive) timeoutLive.value = timeouts.live || 10000;
        
        // API - Logging
        const logRequests = document.getElementById('settings-log-requests');
        const logResponses = document.getElementById('settings-log-responses');
        const logErrors = document.getElementById('settings-log-errors');
        const showRequestDetails = document.getElementById('settings-show-request-details');
        
        if (logRequests) logRequests.checked = this.settings.api.logRequests === true;
        if (logResponses) logResponses.checked = this.settings.api.logResponses === true;
        if (logErrors) logErrors.checked = this.settings.api.logErrors !== false;
        if (showRequestDetails) showRequestDetails.checked = this.settings.api.showRequestDetails === true;
        
        // API - Connection
        const keepAlive = document.getElementById('settings-keep-alive');
        const maxConnections = document.getElementById('settings-max-connections');
        const connectionTimeout = document.getElementById('settings-connection-timeout');
        const validateSSL = document.getElementById('settings-validate-ssl');
        
        if (keepAlive) keepAlive.checked = this.settings.api.keepAlive !== false;
        if (maxConnections) maxConnections.value = this.settings.api.maxConnections || 10;
        if (connectionTimeout) connectionTimeout.value = this.settings.api.connectionTimeout || 5000;
        if (validateSSL) validateSSL.checked = this.settings.api.validateSSL !== false;
        
        // Update auth visibility
        this.updateAuthFieldsVisibility();
        
        // Populate API keys (async, loads from main process)
        setTimeout(() => this.populateApiKeysUI(), 100);
        
        // Appearance
        const theme = document.getElementById('settings-theme');
        const fontSize = document.getElementById('settings-font-size');
        const uiDensity = document.getElementById('settings-ui-density');
        
        if (theme) theme.value = this.settings.appearance.theme;
        if (fontSize) fontSize.value = this.settings.appearance.fontSize;
        if (uiDensity) uiDensity.value = this.settings.appearance.uiDensity;
        
        // Behavior
        const autoSave = document.getElementById('settings-auto-save');
        const autoConnect = document.getElementById('settings-auto-connect');
        const defaultTempo = document.getElementById('settings-default-tempo');
        
        if (autoSave) autoSave.checked = this.settings.behavior.autoSave;
        if (autoConnect) autoConnect.checked = this.settings.behavior.autoConnect;
        if (defaultTempo) defaultTempo.value = this.settings.behavior.defaultTempo;
        
        // Notifications
        const notifEnabled = document.getElementById('settings-notifications-enabled');
        const notifSound = document.getElementById('settings-notifications-sound');
        const notifDuration = document.getElementById('settings-notification-duration');
        
        if (notifEnabled) notifEnabled.checked = this.settings.notifications.enabled;
        if (notifSound) notifSound.checked = this.settings.notifications.sound;
        if (notifDuration) notifDuration.value = this.settings.notifications.duration;
        
        // Advanced
        const debugMode = document.getElementById('settings-debug-mode');
        const logLevel = document.getElementById('settings-log-level');
        
        if (debugMode) debugMode.checked = this.settings.advanced.debugMode;
        if (logLevel) logLevel.value = this.settings.advanced.logLevel;
        
        // Keyboard shortcuts
        this.populateKeyboardShortcuts();

        // Ngrok settings
        const useNgrok = document.getElementById('settings-use-ngrok');
        const ngrokUrl = document.getElementById('settings-ngrok-url');
        const ngrokApiKey = document.getElementById('settings-ngrok-api-key');
        
        if (useNgrok) useNgrok.checked = this.settings.api.useNgrok === true;
        if (ngrokUrl) ngrokUrl.value = this.settings.api.ngrokUrl || '';
        if (ngrokApiKey) ngrokApiKey.value = this.settings.api.ngrokApiKey || '';
        
        // Populate API keys
        this.populateApiKeysUI();
        
        // Audio settings
        const audio = this.settings.audio || {};
        
        // Device Configuration
        const device = audio.device || {};
        const driverType = document.getElementById('settings-audio-device-driver');
        if (driverType) driverType.value = device.driverType || this.detectDriverType();
        // Populate device dropdowns (async)
        this.populateAudioDevices();
        
        // Sample Rate
        const sampleRate = audio.sampleRate || {};
        const sampleRateInOut = document.getElementById('settings-audio-sample-rate-inout');
        if (sampleRateInOut) {
            sampleRateInOut.value = sampleRate.inOutRate || (typeof audio.sampleRate === 'number' ? audio.sampleRate : 44100);
        }
        const pitchConversion = document.getElementById('settings-audio-pitch-conversion');
        if (pitchConversion) {
            pitchConversion.value = sampleRate.pitchConversion || 'Normal';
        }
        // Legacy sample rate field (for backward compatibility)
        const legacySampleRate = document.getElementById('settings-audio-sample-rate');
        if (legacySampleRate) {
            legacySampleRate.value = sampleRate.inOutRate || (typeof audio.sampleRate === 'number' ? audio.sampleRate : 44100);
        }
        
        // Latency
        const latency = audio.latency || {};
        const latencyBufferSize = document.getElementById('settings-audio-latency-buffer-size');
        if (latencyBufferSize) {
            latencyBufferSize.value = latency.bufferSize || audio.bufferSize || 128;
        }
        const driverCompensation = document.getElementById('settings-audio-latency-driver-compensation');
        if (driverCompensation) {
            driverCompensation.value = latency.driverErrorCompensation !== undefined ? latency.driverErrorCompensation : 0.00;
        }
        // Update latency display
        this.updateLatencyDisplay();
        // Legacy buffer size field (for backward compatibility)
        const legacyBufferSize = document.getElementById('settings-audio-buffer-size');
        if (legacyBufferSize) {
            legacyBufferSize.value = latency.bufferSize || audio.bufferSize || 2048;
        }
        const latencyHint = document.getElementById('settings-audio-latency-hint');
        if (latencyHint) latencyHint.value = audio.latencyHint !== undefined ? audio.latencyHint : 'interactive';
        
        // Test & Monitoring
        const test = audio.test || {};
        const testTone = test.testTone || {};
        const testToneEnabled = document.getElementById('settings-audio-test-tone-enabled');
        if (testToneEnabled) {
            const wasEnabled = testToneEnabled.checked;
            testToneEnabled.checked = testTone.enabled === true;
            // If test tone was enabled in settings but checkbox wasn't checked, start it
            // (or if it was enabled and we're just populating, ensure state is correct)
            if (testTone.enabled === true && !wasEnabled) {
                // Don't auto-start, let user control it via checkbox
            }
        }
        const testToneVolume = document.getElementById('settings-audio-test-tone-volume');
        const testToneVolumeValue = document.getElementById('settings-audio-test-tone-volume-value');
        if (testToneVolume) {
            testToneVolume.value = testTone.volume !== undefined ? testTone.volume : -36;
            if (testToneVolumeValue) {
                testToneVolumeValue.textContent = `${testTone.volume !== undefined ? testTone.volume : -36} dB`;
            }
        }
        const testToneFrequency = document.getElementById('settings-audio-test-tone-frequency');
        if (testToneFrequency) {
            testToneFrequency.value = testTone.frequency !== undefined ? testTone.frequency : 440;
        }
        const cpuSimulator = document.getElementById('settings-audio-cpu-simulator');
        const cpuSimulatorValue = document.getElementById('settings-audio-cpu-simulator-value');
        if (cpuSimulator) {
            cpuSimulator.value = test.cpuUsageSimulator !== undefined ? test.cpuUsageSimulator : 50;
            if (cpuSimulatorValue) {
                cpuSimulatorValue.textContent = `${test.cpuUsageSimulator !== undefined ? test.cpuUsageSimulator : 50}%`;
            }
        }
        
        // Playback (using new structure)
        const playback = audio.playback || {};
        const masterVolume = document.getElementById('settings-audio-master-volume');
        const masterVolumeValue = document.getElementById('settings-audio-master-volume-value');
        if (masterVolume) {
            const vol = playback.masterVolume !== undefined ? playback.masterVolume : (audio.masterVolume !== undefined ? audio.masterVolume : 1.0);
            masterVolume.value = vol;
            if (masterVolumeValue) {
                masterVolumeValue.textContent = `${Math.round(vol * 100)}%`;
            }
        }
        const defaultLoop = document.getElementById('settings-audio-default-loop');
        if (defaultLoop) {
            defaultLoop.checked = playback.defaultLoop !== undefined ? playback.defaultLoop : (audio.defaultLoop === true);
        }
        const autoPlay = document.getElementById('settings-audio-auto-play');
        if (autoPlay) {
            autoPlay.checked = playback.autoPlay !== undefined ? playback.autoPlay : (audio.autoPlay === true);
        }
        const crossfadeDuration = document.getElementById('settings-audio-crossfade-duration');
        if (crossfadeDuration) {
            crossfadeDuration.value = playback.crossfadeDuration !== undefined ? playback.crossfadeDuration : (audio.crossfadeDuration !== undefined ? audio.crossfadeDuration : 0.0);
        }
        
        // Effects
        const effectsEnabled = document.getElementById('settings-audio-effects-enabled');
        if (effectsEnabled) effectsEnabled.checked = audio.effectsEnabled !== false;
        const reverbRoomSize = document.getElementById('settings-audio-reverb-room-size');
        const reverbRoomSizeValue = document.getElementById('settings-audio-reverb-room-size-value');
        if (reverbRoomSize) {
            reverbRoomSize.value = audio.reverbRoomSize !== undefined ? audio.reverbRoomSize : 0.5;
            if (reverbRoomSizeValue) reverbRoomSizeValue.textContent = audio.reverbRoomSize !== undefined ? audio.reverbRoomSize.toFixed(2) : '0.50';
        }
        const delayTime = document.getElementById('settings-audio-delay-time');
        if (delayTime) delayTime.value = audio.delayTime !== undefined ? audio.delayTime : 0.3;
        const delayFeedback = document.getElementById('settings-audio-delay-feedback');
        const delayFeedbackValue = document.getElementById('settings-audio-delay-feedback-value');
        if (delayFeedback) {
            delayFeedback.value = audio.delayFeedback !== undefined ? audio.delayFeedback : 0.3;
            if (delayFeedbackValue) delayFeedbackValue.textContent = audio.delayFeedback !== undefined ? audio.delayFeedback.toFixed(2) : '0.30';
        }
        const eqLowGain = document.getElementById('settings-audio-eq-low-gain');
        if (eqLowGain) eqLowGain.value = audio.eqLowGain !== undefined ? audio.eqLowGain : 0;
        const eqMidGain = document.getElementById('settings-audio-eq-mid-gain');
        if (eqMidGain) eqMidGain.value = audio.eqMidGain !== undefined ? audio.eqMidGain : 0;
        const eqHighGain = document.getElementById('settings-audio-eq-high-gain');
        if (eqHighGain) eqHighGain.value = audio.eqHighGain !== undefined ? audio.eqHighGain : 0;
        const compressorThreshold = document.getElementById('settings-audio-compressor-threshold');
        if (compressorThreshold) compressorThreshold.value = audio.compressorThreshold !== undefined ? audio.compressorThreshold : -24;
        const compressorRatio = document.getElementById('settings-audio-compressor-ratio');
        if (compressorRatio) compressorRatio.value = audio.compressorRatio !== undefined ? audio.compressorRatio : 12;
        const distortionAmount = document.getElementById('settings-audio-distortion-amount');
        const distortionAmountValue = document.getElementById('settings-audio-distortion-amount-value');
        if (distortionAmount) {
            distortionAmount.value = audio.distortionAmount !== undefined ? audio.distortionAmount : 50;
            if (distortionAmountValue) distortionAmountValue.textContent = `${audio.distortionAmount !== undefined ? audio.distortionAmount : 50}%`;
        }
        const filterFrequency = document.getElementById('settings-audio-filter-frequency');
        if (filterFrequency) filterFrequency.value = audio.filterFrequency !== undefined ? audio.filterFrequency : 1000;
        const filterQ = document.getElementById('settings-audio-filter-q');
        if (filterQ) filterQ.value = audio.filterQ !== undefined ? audio.filterQ : 1;
        const chorusRate = document.getElementById('settings-audio-chorus-rate');
        if (chorusRate) chorusRate.value = audio.chorusRate !== undefined ? audio.chorusRate : 1.5;
        const chorusDepth = document.getElementById('settings-audio-chorus-depth');
        const chorusDepthValue = document.getElementById('settings-audio-chorus-depth-value');
        if (chorusDepth) {
            chorusDepth.value = audio.chorusDepth !== undefined ? audio.chorusDepth : 0.7;
            if (chorusDepthValue) chorusDepthValue.textContent = audio.chorusDepth !== undefined ? audio.chorusDepth.toFixed(2) : '0.70';
        }
        
        // Synthesizer
        const synthMaxVoices = document.getElementById('settings-audio-synth-max-voices');
        if (synthMaxVoices) synthMaxVoices.value = audio.synthMaxVoices !== undefined ? audio.synthMaxVoices : 8;
        const synthWaveform = document.getElementById('settings-audio-synth-waveform');
        if (synthWaveform) synthWaveform.value = audio.synthWaveform !== undefined ? audio.synthWaveform : 'sine';
        const synthFilterType = document.getElementById('settings-audio-synth-filter-type');
        if (synthFilterType) synthFilterType.value = audio.synthFilterType !== undefined ? audio.synthFilterType : 'lowpass';
        const synthFilterFreq = document.getElementById('settings-audio-synth-filter-freq');
        if (synthFilterFreq) synthFilterFreq.value = audio.synthFilterFreq !== undefined ? audio.synthFilterFreq : 2000;
        const synthFilterQ = document.getElementById('settings-audio-synth-filter-q');
        if (synthFilterQ) synthFilterQ.value = audio.synthFilterQ !== undefined ? audio.synthFilterQ : 1;
        const synthAttack = document.getElementById('settings-audio-synth-attack');
        if (synthAttack) synthAttack.value = audio.synthAttack !== undefined ? audio.synthAttack : 0.01;
        const synthDecay = document.getElementById('settings-audio-synth-decay');
        if (synthDecay) synthDecay.value = audio.synthDecay !== undefined ? audio.synthDecay : 0.1;
        const synthSustain = document.getElementById('settings-audio-synth-sustain');
        const synthSustainValue = document.getElementById('settings-audio-synth-sustain-value');
        if (synthSustain) {
            synthSustain.value = audio.synthSustain !== undefined ? audio.synthSustain : 0.7;
            if (synthSustainValue) synthSustainValue.textContent = audio.synthSustain !== undefined ? audio.synthSustain.toFixed(2) : '0.70';
        }
        const synthRelease = document.getElementById('settings-audio-synth-release');
        if (synthRelease) synthRelease.value = audio.synthRelease !== undefined ? audio.synthRelease : 0.3;
        const synthLfoRate = document.getElementById('settings-audio-synth-lfo-rate');
        if (synthLfoRate) synthLfoRate.value = audio.synthLfoRate !== undefined ? audio.synthLfoRate : 0;
        const synthLfoAmount = document.getElementById('settings-audio-synth-lfo-amount');
        const synthLfoAmountValue = document.getElementById('settings-audio-synth-lfo-amount-value');
        if (synthLfoAmount) {
            synthLfoAmount.value = audio.synthLfoAmount !== undefined ? audio.synthLfoAmount : 0;
            if (synthLfoAmountValue) synthLfoAmountValue.textContent = audio.synthLfoAmount !== undefined ? audio.synthLfoAmount.toFixed(2) : '0.00';
        }
        const synthVolume = document.getElementById('settings-audio-synth-volume');
        const synthVolumeValue = document.getElementById('settings-audio-synth-volume-value');
        if (synthVolume) {
            synthVolume.value = audio.synthVolume !== undefined ? audio.synthVolume : 0.3;
            if (synthVolumeValue) synthVolumeValue.textContent = `${Math.round((audio.synthVolume !== undefined ? audio.synthVolume : 0.3) * 100)}%`;
        }
        
        // Analyzer
        const analyzerFftSize = document.getElementById('settings-audio-analyzer-fft-size');
        if (analyzerFftSize) analyzerFftSize.value = audio.analyzerFftSize !== undefined ? audio.analyzerFftSize : 2048;
        const analyzerSmoothing = document.getElementById('settings-audio-analyzer-smoothing');
        const analyzerSmoothingValue = document.getElementById('settings-audio-analyzer-smoothing-value');
        if (analyzerSmoothing) {
            analyzerSmoothing.value = audio.analyzerSmoothing !== undefined ? audio.analyzerSmoothing : 0.8;
            if (analyzerSmoothingValue) analyzerSmoothingValue.textContent = audio.analyzerSmoothing !== undefined ? audio.analyzerSmoothing.toFixed(2) : '0.80';
        }
        const analyzerMinDecibels = document.getElementById('settings-audio-analyzer-min-decibels');
        if (analyzerMinDecibels) analyzerMinDecibels.value = audio.analyzerMinDecibels !== undefined ? audio.analyzerMinDecibels : -100;
        const analyzerMaxDecibels = document.getElementById('settings-audio-analyzer-max-decibels');
        if (analyzerMaxDecibels) analyzerMaxDecibels.value = audio.analyzerMaxDecibels !== undefined ? audio.analyzerMaxDecibels : -30;
        const analyzerUpdateRate = document.getElementById('settings-audio-analyzer-update-rate');
        if (analyzerUpdateRate) analyzerUpdateRate.value = audio.analyzerUpdateRate !== undefined ? audio.analyzerUpdateRate : 60;
        
        // Performance
        const maxActiveEffects = document.getElementById('settings-audio-max-active-effects');
        if (maxActiveEffects) maxActiveEffects.value = audio.maxActiveEffects !== undefined ? audio.maxActiveEffects : 5;
        const enableOfflineRendering = document.getElementById('settings-audio-enable-offline-rendering');
        if (enableOfflineRendering) enableOfflineRendering.checked = audio.enableOfflineRendering === true;
        
        // Setup range input value displays
        this.setupAudioRangeInputs();
    }
    
    setupAudioRangeInputs() {
        // Master Volume
        const masterVolume = document.getElementById('settings-audio-master-volume');
        const masterVolumeValue = document.getElementById('settings-audio-master-volume-value');
        if (masterVolume && masterVolumeValue) {
            masterVolume.addEventListener('input', (e) => {
                masterVolumeValue.textContent = `${Math.round(parseFloat(e.target.value) * 100)}%`;
            });
        }
        
        // Reverb Room Size
        const reverbRoomSize = document.getElementById('settings-audio-reverb-room-size');
        const reverbRoomSizeValue = document.getElementById('settings-audio-reverb-room-size-value');
        if (reverbRoomSize && reverbRoomSizeValue) {
            reverbRoomSize.addEventListener('input', (e) => {
                reverbRoomSizeValue.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
        
        // Delay Feedback
        const delayFeedback = document.getElementById('settings-audio-delay-feedback');
        const delayFeedbackValue = document.getElementById('settings-audio-delay-feedback-value');
        if (delayFeedback && delayFeedbackValue) {
            delayFeedback.addEventListener('input', (e) => {
                delayFeedbackValue.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
        
        // Distortion Amount
        const distortionAmount = document.getElementById('settings-audio-distortion-amount');
        const distortionAmountValue = document.getElementById('settings-audio-distortion-amount-value');
        if (distortionAmount && distortionAmountValue) {
            distortionAmount.addEventListener('input', (e) => {
                distortionAmountValue.textContent = `${Math.round(parseFloat(e.target.value))}%`;
            });
        }
        
        // Chorus Depth
        const chorusDepth = document.getElementById('settings-audio-chorus-depth');
        const chorusDepthValue = document.getElementById('settings-audio-chorus-depth-value');
        if (chorusDepth && chorusDepthValue) {
            chorusDepth.addEventListener('input', (e) => {
                chorusDepthValue.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
        
        // Synth Sustain
        const synthSustain = document.getElementById('settings-audio-synth-sustain');
        const synthSustainValue = document.getElementById('settings-audio-synth-sustain-value');
        if (synthSustain && synthSustainValue) {
            synthSustain.addEventListener('input', (e) => {
                synthSustainValue.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
        
        // Synth LFO Amount
        const synthLfoAmount = document.getElementById('settings-audio-synth-lfo-amount');
        const synthLfoAmountValue = document.getElementById('settings-audio-synth-lfo-amount-value');
        if (synthLfoAmount && synthLfoAmountValue) {
            synthLfoAmount.addEventListener('input', (e) => {
                synthLfoAmountValue.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
        
        // Synth Volume
        const synthVolume = document.getElementById('settings-audio-synth-volume');
        const synthVolumeValue = document.getElementById('settings-audio-synth-volume-value');
        if (synthVolume && synthVolumeValue) {
            synthVolume.addEventListener('input', (e) => {
                synthVolumeValue.textContent = `${Math.round(parseFloat(e.target.value) * 100)}%`;
            });
        }
        
        // Analyzer Smoothing
        const analyzerSmoothing = document.getElementById('settings-audio-analyzer-smoothing');
        const analyzerSmoothingValue = document.getElementById('settings-audio-analyzer-smoothing-value');
        if (analyzerSmoothing && analyzerSmoothingValue) {
            analyzerSmoothing.addEventListener('input', (e) => {
                analyzerSmoothingValue.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
    }
    
    populateKeyboardShortcuts() {
        const list = document.getElementById('keyboard-shortcuts-list');
        if (!list || !window.keyboardShortcuts) return;
        
        list.innerHTML = '';
        const shortcuts = window.keyboardShortcuts.getShortcuts();
        
        shortcuts.forEach(({ key, description }) => {
            if (!description) return;
            
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            item.innerHTML = `
                <span class="shortcut-item-label">${description}</span>
                <kbd class="shortcut-item-key">${key}</kbd>
            `;
            list.appendChild(item);
        });
    }
    
    saveFromUI() {
        // API - Basic
        const apiUrl = document.getElementById('settings-api-url');
        const timeout = document.getElementById('settings-timeout');
        const retryCount = document.getElementById('settings-retry-count');
        const retryDelay = document.getElementById('settings-retry-delay');
        const retryBackoff = document.getElementById('settings-retry-backoff');
        
        if (apiUrl) this.settings.api.url = apiUrl.value;
        if (timeout) this.settings.api.timeout = parseInt(timeout.value) || 10000;
        if (retryCount) this.settings.api.retryCount = parseInt(retryCount.value) || 3;
        if (retryDelay) this.settings.api.retryDelay = parseInt(retryDelay.value) || 1000;
        if (retryBackoff) this.settings.api.retryBackoff = retryBackoff.checked;
        
        // API - Authentication
        const authType = document.getElementById('settings-auth-type');
        const apiKey = document.getElementById('settings-api-key');
        const apiKeyHeader = document.getElementById('settings-api-key-header');
        const bearerToken = document.getElementById('settings-bearer-token');
        const basicUsername = document.getElementById('settings-basic-username');
        const basicPassword = document.getElementById('settings-basic-password');
        
        if (authType) this.settings.api.authType = authType.value;
        if (apiKey) this.settings.api.apiKey = apiKey.value;
        if (apiKeyHeader) this.settings.api.apiKeyHeader = apiKeyHeader.value;
        if (bearerToken) this.settings.api.bearerToken = bearerToken.value;
        if (basicUsername) this.settings.api.basicUsername = basicUsername.value;
        if (basicPassword) this.settings.api.basicPassword = basicPassword.value;
        
        // API - Endpoint Timeouts
        const timeoutHealth = document.getElementById('settings-timeout-health');
        const timeoutGenerate = document.getElementById('settings-timeout-generate');
        const timeoutAnalyze = document.getElementById('settings-timeout-analyze');
        const timeoutLive = document.getElementById('settings-timeout-live');
        
        if (!this.settings.api.endpointTimeouts) {
            this.settings.api.endpointTimeouts = {};
        }
        if (timeoutHealth) this.settings.api.endpointTimeouts.health = parseInt(timeoutHealth.value) || 5000;
        if (timeoutGenerate) this.settings.api.endpointTimeouts.generate = parseInt(timeoutGenerate.value) || 30000;
        if (timeoutAnalyze) this.settings.api.endpointTimeouts.analyze = parseInt(timeoutAnalyze.value) || 60000;
        if (timeoutLive) this.settings.api.endpointTimeouts.live = parseInt(timeoutLive.value) || 10000;
        
        // API - Logging
        const logRequests = document.getElementById('settings-log-requests');
        const logResponses = document.getElementById('settings-log-responses');
        const logErrors = document.getElementById('settings-log-errors');
        const showRequestDetails = document.getElementById('settings-show-request-details');
        
        if (logRequests) this.settings.api.logRequests = logRequests.checked;
        if (logResponses) this.settings.api.logResponses = logResponses.checked;
        if (logErrors) this.settings.api.logErrors = logErrors.checked;
        if (showRequestDetails) this.settings.api.showRequestDetails = showRequestDetails.checked;
        
        // API - Connection
        const keepAlive = document.getElementById('settings-keep-alive');
        const maxConnections = document.getElementById('settings-max-connections');
        const connectionTimeout = document.getElementById('settings-connection-timeout');
        const validateSSL = document.getElementById('settings-validate-ssl');
        
        if (keepAlive) this.settings.api.keepAlive = keepAlive.checked;
        if (maxConnections) {
            const num = parseInt(maxConnections.value) || 10;
            const validation = this.validateSetting('api.maxConnections', num);
            if (validation.valid) {
                this.settings.api.maxConnections = num;
            } else {
                this.showValidationError('api.maxConnections', validation.error);
                return;
            }
        }
        if (connectionTimeout) {
            const num = parseInt(connectionTimeout.value) || 5000;
            const validation = this.validateSetting('api.connectionTimeout', num);
            if (validation.valid) {
                this.settings.api.connectionTimeout = num;
            } else {
                this.showValidationError('api.connectionTimeout', validation.error);
                return;
            }
        }
        if (validateSSL) this.settings.api.validateSSL = validateSSL.checked;
        
        // Ngrok settings
        const useNgrok = document.getElementById('settings-use-ngrok');
        const ngrokUrl = document.getElementById('settings-ngrok-url');
        const ngrokApiKey = document.getElementById('settings-ngrok-api-key');
        
        if (useNgrok) this.settings.api.useNgrok = useNgrok.checked;
        if (ngrokUrl) this.settings.api.ngrokUrl = ngrokUrl.value;
        if (ngrokApiKey) this.settings.api.ngrokApiKey = ngrokApiKey.value;
        
        // Appearance
        const theme = document.getElementById('settings-theme');
        const fontSize = document.getElementById('settings-font-size');
        const uiDensity = document.getElementById('settings-ui-density');
        
        if (theme) this.settings.appearance.theme = theme.value;
        if (fontSize) this.settings.appearance.fontSize = fontSize.value;
        if (uiDensity) this.settings.appearance.uiDensity = uiDensity.value;
        
        // Behavior
        const autoSave = document.getElementById('settings-auto-save');
        const autoConnect = document.getElementById('settings-auto-connect');
        const defaultTempo = document.getElementById('settings-default-tempo');
        
        if (autoSave) this.settings.behavior.autoSave = autoSave.checked;
        if (autoConnect) this.settings.behavior.autoConnect = autoConnect.checked;
        if (defaultTempo) {
            const num = parseInt(defaultTempo.value);
            const validation = this.validateSetting('behavior.defaultTempo', num);
            if (validation.valid) {
                this.settings.behavior.defaultTempo = num;
            } else {
                this.showValidationError('behavior.defaultTempo', validation.error);
                return;
            }
        }
        
        // Notifications
        const notifEnabled = document.getElementById('settings-notifications-enabled');
        const notifSound = document.getElementById('settings-notifications-sound');
        const notifDuration = document.getElementById('settings-notification-duration');
        
        if (notifEnabled) this.settings.notifications.enabled = notifEnabled.checked;
        if (notifSound) this.settings.notifications.sound = notifSound.checked;
        if (notifDuration) {
            const num = parseInt(notifDuration.value);
            const validation = this.validateSetting('notifications.duration', num);
            if (validation.valid) {
                this.settings.notifications.duration = num;
            } else {
                this.showValidationError('notifications.duration', validation.error);
                return;
            }
        }
        
        // Advanced
        const debugMode = document.getElementById('settings-debug-mode');
        const logLevel = document.getElementById('settings-log-level');
        
        if (debugMode) this.settings.advanced.debugMode = debugMode.checked;
        if (logLevel) this.settings.advanced.logLevel = logLevel.value;
        
        // Audio settings
        if (!this.settings.audio) {
            this.settings.audio = {};
        }
        
        // Device Configuration
        if (!this.settings.audio.device) {
            this.settings.audio.device = {};
        }
        const driverType = document.getElementById('settings-audio-device-driver');
        if (driverType) {
            const validation = this.validateSetting('audio.device.driverType', driverType.value);
            if (validation.valid) {
                this.settings.audio.device.driverType = driverType.value;
            } else {
                this.showValidationError('audio.device.driverType', validation.error);
                return;
            }
        }
        const inputDevice = document.getElementById('settings-audio-device-input');
        if (inputDevice) {
            const validation = this.validateSetting('audio.device.inputDevice', inputDevice.value);
            if (validation.valid) {
                this.settings.audio.device.inputDevice = inputDevice.value;
            } else {
                this.showValidationError('audio.device.inputDevice', validation.error);
                return;
            }
        }
        const outputDevice = document.getElementById('settings-audio-device-output');
        if (outputDevice) {
            const validation = this.validateSetting('audio.device.outputDevice', outputDevice.value);
            if (validation.valid) {
                this.settings.audio.device.outputDevice = outputDevice.value;
            } else {
                this.showValidationError('audio.device.outputDevice', validation.error);
                return;
            }
        }
        
        // Sample Rate
        if (!this.settings.audio.sampleRate) {
            this.settings.audio.sampleRate = {};
        }
        const sampleRateInOut = document.getElementById('settings-audio-sample-rate-inout');
        if (sampleRateInOut) {
            const num = parseInt(sampleRateInOut.value);
            const validation = this.validateSetting('audio.sampleRate.inOutRate', num);
            if (validation.valid) {
                this.settings.audio.sampleRate.inOutRate = num;
            } else {
                this.showValidationError('audio.sampleRate.inOutRate', validation.error);
                return;
            }
        }
        const pitchConversion = document.getElementById('settings-audio-pitch-conversion');
        if (pitchConversion) {
            const validation = this.validateSetting('audio.sampleRate.pitchConversion', pitchConversion.value);
            if (validation.valid) {
                this.settings.audio.sampleRate.pitchConversion = pitchConversion.value;
            } else {
                this.showValidationError('audio.sampleRate.pitchConversion', validation.error);
                return;
            }
        }
        // Legacy sample rate field (for backward compatibility)
        const legacySampleRate = document.getElementById('settings-audio-sample-rate');
        if (legacySampleRate) {
            const num = parseInt(legacySampleRate.value);
            const validation = this.validateSetting('audio.sampleRate', num);
            if (validation.valid) {
                this.settings.audio.sampleRate = num; // Keep legacy format too
            }
        }
        
        // Latency
        if (!this.settings.audio.latency) {
            this.settings.audio.latency = {};
        }
        const latencyBufferSize = document.getElementById('settings-audio-latency-buffer-size');
        if (latencyBufferSize) {
            const num = parseInt(latencyBufferSize.value);
            const validation = this.validateSetting('audio.latency.bufferSize', num);
            if (validation.valid) {
                this.settings.audio.latency.bufferSize = num;
            } else {
                this.showValidationError('audio.latency.bufferSize', validation.error);
                return;
            }
        }
        const driverCompensation = document.getElementById('settings-audio-latency-driver-compensation');
        if (driverCompensation) {
            const num = parseFloat(driverCompensation.value);
            const validation = this.validateSetting('audio.latency.driverErrorCompensation', num);
            if (validation.valid) {
                this.settings.audio.latency.driverErrorCompensation = num;
            } else {
                this.showValidationError('audio.latency.driverErrorCompensation', validation.error);
                return;
            }
        }
        // Update latency calculations
        this.updateLatencyDisplay();
        // Legacy buffer size field (for backward compatibility)
        const legacyBufferSize = document.getElementById('settings-audio-buffer-size');
        if (legacyBufferSize) {
            const num = parseInt(legacyBufferSize.value);
            const validation = this.validateSetting('audio.bufferSize', num);
            if (validation.valid) {
                this.settings.audio.bufferSize = num; // Keep legacy format too
            }
        }
        const latencyHint = document.getElementById('settings-audio-latency-hint');
        if (latencyHint) {
            const validation = this.validateSetting('audio.latencyHint', latencyHint.value);
            if (validation.valid) {
                this.settings.audio.latencyHint = latencyHint.value;
            } else {
                this.showValidationError('audio.latencyHint', validation.error);
                return;
            }
        }
        
        // Test & Monitoring
        if (!this.settings.audio.test) {
            this.settings.audio.test = {};
        }
        if (!this.settings.audio.test.testTone) {
            this.settings.audio.test.testTone = {};
        }
        const testToneEnabled = document.getElementById('settings-audio-test-tone-enabled');
        if (testToneEnabled) {
            this.settings.audio.test.testTone.enabled = testToneEnabled.checked;
        }
        const testToneVolume = document.getElementById('settings-audio-test-tone-volume');
        if (testToneVolume) {
            const num = parseFloat(testToneVolume.value);
            const validation = this.validateSetting('audio.test.testTone.volume', num);
            if (validation.valid) {
                this.settings.audio.test.testTone.volume = num;
                // Update test tone if it's currently running
                if (this.testToneOscillator) {
                    this.updateTestTone();
                }
            } else {
                this.showValidationError('audio.test.testTone.volume', validation.error);
                return;
            }
        }
        const testToneFrequency = document.getElementById('settings-audio-test-tone-frequency');
        if (testToneFrequency) {
            const num = parseFloat(testToneFrequency.value);
            const validation = this.validateSetting('audio.test.testTone.frequency', num);
            if (validation.valid) {
                this.settings.audio.test.testTone.frequency = num;
                // Update test tone if it's currently running
                if (this.testToneOscillator) {
                    this.updateTestTone();
                }
            } else {
                this.showValidationError('audio.test.testTone.frequency', validation.error);
                return;
            }
        }
        const cpuSimulator = document.getElementById('settings-audio-cpu-simulator');
        if (cpuSimulator) {
            const num = parseFloat(cpuSimulator.value);
            const validation = this.validateSetting('audio.test.cpuUsageSimulator', num);
            if (validation.valid) {
                this.settings.audio.test.cpuUsageSimulator = num;
            } else {
                this.showValidationError('audio.test.cpuUsageSimulator', validation.error);
                return;
            }
        }
        
        // Playback (using new structure)
        if (!this.settings.audio.playback) {
            this.settings.audio.playback = {};
        }
        const masterVolume = document.getElementById('settings-audio-master-volume');
        if (masterVolume) {
            const num = parseFloat(masterVolume.value);
            const validation = this.validateSetting('audio.masterVolume', num);
            if (validation.valid) {
                this.settings.audio.playback.masterVolume = num;
                this.settings.audio.masterVolume = num; // Keep legacy format too
            } else {
                this.showValidationError('audio.masterVolume', validation.error);
                return;
            }
        }
        const defaultLoop = document.getElementById('settings-audio-default-loop');
        if (defaultLoop) {
            this.settings.audio.playback.defaultLoop = defaultLoop.checked;
            this.settings.audio.defaultLoop = defaultLoop.checked; // Keep legacy format too
        }
        const autoPlay = document.getElementById('settings-audio-auto-play');
        if (autoPlay) {
            this.settings.audio.playback.autoPlay = autoPlay.checked;
            this.settings.audio.autoPlay = autoPlay.checked; // Keep legacy format too
        }
        const crossfadeDuration = document.getElementById('settings-audio-crossfade-duration');
        if (crossfadeDuration) {
            const num = parseFloat(crossfadeDuration.value);
            const validation = this.validateSetting('audio.crossfadeDuration', num);
            if (validation.valid) {
                this.settings.audio.playback.crossfadeDuration = num;
                this.settings.audio.crossfadeDuration = num; // Keep legacy format too
            } else {
                this.showValidationError('audio.crossfadeDuration', validation.error);
                return;
            }
        }
        
        // Effects
        const effectsEnabled = document.getElementById('settings-audio-effects-enabled');
        if (effectsEnabled) this.settings.audio.effectsEnabled = effectsEnabled.checked;
        const reverbRoomSize = document.getElementById('settings-audio-reverb-room-size');
        if (reverbRoomSize) {
            const num = parseFloat(reverbRoomSize.value);
            const validation = this.validateSetting('audio.reverbRoomSize', num);
            if (validation.valid) {
                this.settings.audio.reverbRoomSize = num;
            } else {
                this.showValidationError('audio.reverbRoomSize', validation.error);
                return;
            }
        }
        const delayTime = document.getElementById('settings-audio-delay-time');
        if (delayTime) {
            const num = parseFloat(delayTime.value);
            const validation = this.validateSetting('audio.delayTime', num);
            if (validation.valid) {
                this.settings.audio.delayTime = num;
            } else {
                this.showValidationError('audio.delayTime', validation.error);
                return;
            }
        }
        const delayFeedback = document.getElementById('settings-audio-delay-feedback');
        if (delayFeedback) {
            const num = parseFloat(delayFeedback.value);
            const validation = this.validateSetting('audio.delayFeedback', num);
            if (validation.valid) {
                this.settings.audio.delayFeedback = num;
            } else {
                this.showValidationError('audio.delayFeedback', validation.error);
                return;
            }
        }
        const eqLowGain = document.getElementById('settings-audio-eq-low-gain');
        if (eqLowGain) {
            const num = parseFloat(eqLowGain.value);
            const validation = this.validateSetting('audio.eqLowGain', num);
            if (validation.valid) {
                this.settings.audio.eqLowGain = num;
            } else {
                this.showValidationError('audio.eqLowGain', validation.error);
                return;
            }
        }
        const eqMidGain = document.getElementById('settings-audio-eq-mid-gain');
        if (eqMidGain) {
            const num = parseFloat(eqMidGain.value);
            const validation = this.validateSetting('audio.eqMidGain', num);
            if (validation.valid) {
                this.settings.audio.eqMidGain = num;
            } else {
                this.showValidationError('audio.eqMidGain', validation.error);
                return;
            }
        }
        const eqHighGain = document.getElementById('settings-audio-eq-high-gain');
        if (eqHighGain) {
            const num = parseFloat(eqHighGain.value);
            const validation = this.validateSetting('audio.eqHighGain', num);
            if (validation.valid) {
                this.settings.audio.eqHighGain = num;
            } else {
                this.showValidationError('audio.eqHighGain', validation.error);
                return;
            }
        }
        const compressorThreshold = document.getElementById('settings-audio-compressor-threshold');
        if (compressorThreshold) {
            const num = parseFloat(compressorThreshold.value);
            const validation = this.validateSetting('audio.compressorThreshold', num);
            if (validation.valid) {
                this.settings.audio.compressorThreshold = num;
            } else {
                this.showValidationError('audio.compressorThreshold', validation.error);
                return;
            }
        }
        const compressorRatio = document.getElementById('settings-audio-compressor-ratio');
        if (compressorRatio) {
            const num = parseFloat(compressorRatio.value);
            const validation = this.validateSetting('audio.compressorRatio', num);
            if (validation.valid) {
                this.settings.audio.compressorRatio = num;
            } else {
                this.showValidationError('audio.compressorRatio', validation.error);
                return;
            }
        }
        const distortionAmount = document.getElementById('settings-audio-distortion-amount');
        if (distortionAmount) {
            const num = parseFloat(distortionAmount.value);
            const validation = this.validateSetting('audio.distortionAmount', num);
            if (validation.valid) {
                this.settings.audio.distortionAmount = num;
            } else {
                this.showValidationError('audio.distortionAmount', validation.error);
                return;
            }
        }
        const filterFrequency = document.getElementById('settings-audio-filter-frequency');
        if (filterFrequency) {
            const num = parseFloat(filterFrequency.value);
            const validation = this.validateSetting('audio.filterFrequency', num);
            if (validation.valid) {
                this.settings.audio.filterFrequency = num;
            } else {
                this.showValidationError('audio.filterFrequency', validation.error);
                return;
            }
        }
        const filterQ = document.getElementById('settings-audio-filter-q');
        if (filterQ) {
            const num = parseFloat(filterQ.value);
            const validation = this.validateSetting('audio.filterQ', num);
            if (validation.valid) {
                this.settings.audio.filterQ = num;
            } else {
                this.showValidationError('audio.filterQ', validation.error);
                return;
            }
        }
        const chorusRate = document.getElementById('settings-audio-chorus-rate');
        if (chorusRate) {
            const num = parseFloat(chorusRate.value);
            const validation = this.validateSetting('audio.chorusRate', num);
            if (validation.valid) {
                this.settings.audio.chorusRate = num;
            } else {
                this.showValidationError('audio.chorusRate', validation.error);
                return;
            }
        }
        const chorusDepth = document.getElementById('settings-audio-chorus-depth');
        if (chorusDepth) {
            const num = parseFloat(chorusDepth.value);
            const validation = this.validateSetting('audio.chorusDepth', num);
            if (validation.valid) {
                this.settings.audio.chorusDepth = num;
            } else {
                this.showValidationError('audio.chorusDepth', validation.error);
                return;
            }
        }
        
        // Synthesizer
        const synthMaxVoices = document.getElementById('settings-audio-synth-max-voices');
        if (synthMaxVoices) {
            const num = parseInt(synthMaxVoices.value);
            const validation = this.validateSetting('audio.synthMaxVoices', num);
            if (validation.valid) {
                this.settings.audio.synthMaxVoices = num;
            } else {
                this.showValidationError('audio.synthMaxVoices', validation.error);
                return;
            }
        }
        const synthWaveform = document.getElementById('settings-audio-synth-waveform');
        if (synthWaveform) {
            const validation = this.validateSetting('audio.synthWaveform', synthWaveform.value);
            if (validation.valid) {
                this.settings.audio.synthWaveform = synthWaveform.value;
            } else {
                this.showValidationError('audio.synthWaveform', validation.error);
                return;
            }
        }
        const synthFilterType = document.getElementById('settings-audio-synth-filter-type');
        if (synthFilterType) {
            const validation = this.validateSetting('audio.synthFilterType', synthFilterType.value);
            if (validation.valid) {
                this.settings.audio.synthFilterType = synthFilterType.value;
            } else {
                this.showValidationError('audio.synthFilterType', validation.error);
                return;
            }
        }
        const synthFilterFreq = document.getElementById('settings-audio-synth-filter-freq');
        if (synthFilterFreq) {
            const num = parseFloat(synthFilterFreq.value);
            const validation = this.validateSetting('audio.synthFilterFreq', num);
            if (validation.valid) {
                this.settings.audio.synthFilterFreq = num;
            } else {
                this.showValidationError('audio.synthFilterFreq', validation.error);
                return;
            }
        }
        const synthFilterQ = document.getElementById('settings-audio-synth-filter-q');
        if (synthFilterQ) {
            const num = parseFloat(synthFilterQ.value);
            const validation = this.validateSetting('audio.synthFilterQ', num);
            if (validation.valid) {
                this.settings.audio.synthFilterQ = num;
            } else {
                this.showValidationError('audio.synthFilterQ', validation.error);
                return;
            }
        }
        const synthAttack = document.getElementById('settings-audio-synth-attack');
        if (synthAttack) {
            const num = parseFloat(synthAttack.value);
            const validation = this.validateSetting('audio.synthAttack', num);
            if (validation.valid) {
                this.settings.audio.synthAttack = num;
            } else {
                this.showValidationError('audio.synthAttack', validation.error);
                return;
            }
        }
        const synthDecay = document.getElementById('settings-audio-synth-decay');
        if (synthDecay) {
            const num = parseFloat(synthDecay.value);
            const validation = this.validateSetting('audio.synthDecay', num);
            if (validation.valid) {
                this.settings.audio.synthDecay = num;
            } else {
                this.showValidationError('audio.synthDecay', validation.error);
                return;
            }
        }
        const synthSustain = document.getElementById('settings-audio-synth-sustain');
        if (synthSustain) {
            const num = parseFloat(synthSustain.value);
            const validation = this.validateSetting('audio.synthSustain', num);
            if (validation.valid) {
                this.settings.audio.synthSustain = num;
            } else {
                this.showValidationError('audio.synthSustain', validation.error);
                return;
            }
        }
        const synthRelease = document.getElementById('settings-audio-synth-release');
        if (synthRelease) {
            const num = parseFloat(synthRelease.value);
            const validation = this.validateSetting('audio.synthRelease', num);
            if (validation.valid) {
                this.settings.audio.synthRelease = num;
            } else {
                this.showValidationError('audio.synthRelease', validation.error);
                return;
            }
        }
        const synthLfoRate = document.getElementById('settings-audio-synth-lfo-rate');
        if (synthLfoRate) {
            const num = parseFloat(synthLfoRate.value);
            const validation = this.validateSetting('audio.synthLfoRate', num);
            if (validation.valid) {
                this.settings.audio.synthLfoRate = num;
            } else {
                this.showValidationError('audio.synthLfoRate', validation.error);
                return;
            }
        }
        const synthLfoAmount = document.getElementById('settings-audio-synth-lfo-amount');
        if (synthLfoAmount) {
            const num = parseFloat(synthLfoAmount.value);
            const validation = this.validateSetting('audio.synthLfoAmount', num);
            if (validation.valid) {
                this.settings.audio.synthLfoAmount = num;
            } else {
                this.showValidationError('audio.synthLfoAmount', validation.error);
                return;
            }
        }
        const synthVolume = document.getElementById('settings-audio-synth-volume');
        if (synthVolume) {
            const num = parseFloat(synthVolume.value);
            const validation = this.validateSetting('audio.synthVolume', num);
            if (validation.valid) {
                this.settings.audio.synthVolume = num;
            } else {
                this.showValidationError('audio.synthVolume', validation.error);
                return;
            }
        }
        
        // Analyzer
        const analyzerFftSize = document.getElementById('settings-audio-analyzer-fft-size');
        if (analyzerFftSize) {
            const num = parseInt(analyzerFftSize.value);
            const validation = this.validateSetting('audio.analyzerFftSize', num);
            if (validation.valid) {
                this.settings.audio.analyzerFftSize = num;
            } else {
                this.showValidationError('audio.analyzerFftSize', validation.error);
                return;
            }
        }
        const analyzerSmoothing = document.getElementById('settings-audio-analyzer-smoothing');
        if (analyzerSmoothing) {
            const num = parseFloat(analyzerSmoothing.value);
            const validation = this.validateSetting('audio.analyzerSmoothing', num);
            if (validation.valid) {
                this.settings.audio.analyzerSmoothing = num;
            } else {
                this.showValidationError('audio.analyzerSmoothing', validation.error);
                return;
            }
        }
        const analyzerMinDecibels = document.getElementById('settings-audio-analyzer-min-decibels');
        if (analyzerMinDecibels) {
            const num = parseFloat(analyzerMinDecibels.value);
            const validation = this.validateSetting('audio.analyzerMinDecibels', num);
            if (validation.valid) {
                this.settings.audio.analyzerMinDecibels = num;
            } else {
                this.showValidationError('audio.analyzerMinDecibels', validation.error);
                return;
            }
        }
        const analyzerMaxDecibels = document.getElementById('settings-audio-analyzer-max-decibels');
        if (analyzerMaxDecibels) {
            const num = parseFloat(analyzerMaxDecibels.value);
            const validation = this.validateSetting('audio.analyzerMaxDecibels', num);
            if (validation.valid) {
                this.settings.audio.analyzerMaxDecibels = num;
            } else {
                this.showValidationError('audio.analyzerMaxDecibels', validation.error);
                return;
            }
        }
        const analyzerUpdateRate = document.getElementById('settings-audio-analyzer-update-rate');
        if (analyzerUpdateRate) {
            const num = parseInt(analyzerUpdateRate.value);
            const validation = this.validateSetting('audio.analyzerUpdateRate', num);
            if (validation.valid) {
                this.settings.audio.analyzerUpdateRate = num;
            } else {
                this.showValidationError('audio.analyzerUpdateRate', validation.error);
                return;
            }
        }
        
        // Performance
        const maxActiveEffects = document.getElementById('settings-audio-max-active-effects');
        if (maxActiveEffects) {
            const num = parseInt(maxActiveEffects.value);
            const validation = this.validateSetting('audio.maxActiveEffects', num);
            if (validation.valid) {
                this.settings.audio.maxActiveEffects = num;
            } else {
                this.showValidationError('audio.maxActiveEffects', validation.error);
                return;
            }
        }
        const enableOfflineRendering = document.getElementById('settings-audio-enable-offline-rendering');
        if (enableOfflineRendering) this.settings.audio.enableOfflineRendering = enableOfflineRendering.checked;
        
        this.saveSettings();
        this.hide();
    }
    
    updateAuthFieldsVisibility() {
        const authType = document.getElementById('settings-auth-type');
        if (!authType) return;
        
        const selectedType = authType.value;
        
        // Hide all auth fields
        const apiKeyGroup = document.getElementById('settings-auth-api-key-group');
        const bearerGroup = document.getElementById('settings-auth-bearer-group');
        const basicGroup = document.getElementById('settings-auth-basic-group');
        
        if (apiKeyGroup) apiKeyGroup.classList.remove('active');
        if (bearerGroup) bearerGroup.classList.remove('active');
        if (basicGroup) basicGroup.classList.remove('active');
        
        // Show relevant fields
        switch (selectedType) {
            case 'api_key':
                if (apiKeyGroup) apiKeyGroup.classList.add('active');
                break;
            case 'bearer':
                if (bearerGroup) bearerGroup.classList.add('active');
                break;
            case 'basic':
                if (basicGroup) basicGroup.classList.add('active');
                break;
        }
    }
    
    async testConnection() {
        const apiUrl = document.getElementById('settings-api-url');
        const url = apiUrl ? apiUrl.value : this.settings.api.url;
        
        if (window.loadingStates) {
            window.loadingStates.setButtonLoading(document.getElementById('test-api-connection'), true);
        }
        
        try {
            // Use IPC to test connection with proper auth
            if (window.sergikAPI && window.sergikAPI.checkHealth) {
                const result = await window.sergikAPI.checkHealth();
                if (result.success) {
                    if (window.showNotification) {
                        window.showNotification('Connection successful!', 'success', 2000);
                    }
                } else {
                    throw new Error(result.error || 'Connection failed');
                }
            } else {
                // Fallback to direct fetch
                const response = await fetch(`${url}/health`, { 
                    method: 'GET',
                    timeout: 5000 
                });
                
                if (response.ok) {
                    if (window.showNotification) {
                        window.showNotification('Connection successful!', 'success', 2000);
                    }
                } else {
                    throw new Error('Connection failed');
                }
            }
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.showError(error);
            } else if (window.showNotification) {
                window.showNotification(`Connection failed: ${error.message}`, 'error', 3000);
            }
        } finally {
            if (window.loadingStates) {
                window.loadingStates.setButtonLoading(document.getElementById('test-api-connection'), false);
            }
        }
    }
    
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sergik-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        if (window.showNotification) {
            window.showNotification('Settings exported', 'success', 2000);
        }
    }
    
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    this.settings = { ...this.getDefaultSettings(), ...imported };
                    this.saveSettings();
                    this.populateUI();
                    if (window.showNotification) {
                        window.showNotification('Settings imported', 'success', 2000);
                    }
                } catch (error) {
                    if (window.errorHandler) {
                        window.errorHandler.showError(error);
                    }
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            this.settings = this.getDefaultSettings();
            this.saveSettings();
            this.populateUI();
            if (window.showNotification) {
                window.showNotification('Settings reset to defaults', 'success', 2000);
            }
        }
    }
    
    getSetting(path) {
        const parts = path.split('.');
        let value = this.settings;
        for (const part of parts) {
            value = value[part];
            if (value === undefined) return null;
        }
        return value;
    }
    
    setSetting(path, value) {
        // Use queueChange for auto-save
        if (this.autoSaveDebounce) {
            const oldValue = this.getSetting(path);
            return this.queueChange(path, value, oldValue);
        } else {
            // Fallback to direct set
            this.setSettingInternal(path, value);
            this.saveSettings();
            return true;
        }
    }

    async populateApiKeysUI() {
        const list = document.getElementById('api-keys-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        const services = [
            { name: 'sergik', label: 'SERGIK API', description: 'For SERGIK ML endpoints', envVar: 'SERGIK_API_KEY' },
            { name: 'openai', label: 'OpenAI', description: 'For GPT generation and voice', envVar: 'OPENAI_API_KEY' },
            { name: 'anthropic', label: 'Anthropic Claude', description: 'For Claude AI models', envVar: 'ANTHROPIC_API_KEY' },
            { name: 'google', label: 'Google AI', description: 'For Google AI services', envVar: 'GOOGLE_API_KEY' }
        ];
        
        // Check which services have keys stored and their sources
        const hasKeys = {};
        const keySources = {}; // Track where keys came from (env vs user)
        
        if (window.sergikAPI && window.sergikAPI.listApiKeys) {
            try {
                const storedKeys = await window.sergikAPI.listApiKeys();
                storedKeys.forEach(service => {
                    hasKeys[service] = true;
                });
                
                // Get info about key sources
                if (window.sergikAPI.getApiKeysInfo) {
                    try {
                        const keysInfo = await window.sergikAPI.getApiKeysInfo();
                        Object.entries(keysInfo).forEach(([service, info]) => {
                            keySources[service] = info;
                        });
                    } catch (error) {
                        console.warn('[Settings] Failed to get API keys info:', error);
                    }
                }
            } catch (error) {
                console.error('[Settings] Failed to load API keys list:', error);
            }
        }
        
        services.forEach(({ name, label, description, envVar }) => {
            const keyConfig = this.settings.api?.apiKeys?.[name] || { enabled: false, key: '' };
            const hasKey = hasKeys[name] || false;
            const keySource = keySources[name];
            
            // Show hint about environment variable if key exists and came from env
            let envHint = '';
            if (hasKey && keySource && keySource.source === 'environment' && keySource.envVar) {
                envHint = `<span class="field-hint" style="display: block; margin-top: 2px; font-size: 9px; color: var(--accent-cyan);">✓ Loaded from ${keySource.envVar}</span>`;
            } else if (hasKey && envVar) {
                envHint = `<span class="field-hint" style="display: block; margin-top: 2px; font-size: 9px; color: var(--text-tertiary);">Set ${envVar} to load automatically</span>`;
            }
            
            const item = document.createElement('div');
            item.className = 'api-key-item';
            item.innerHTML = `
                <div class="api-key-header">
                    <div>
                        <label>
                            <input type="checkbox" class="api-key-enabled" data-service="${name}" ${keyConfig.enabled ? 'checked' : ''}>
                            <strong>${label}</strong>
                        </label>
                        <span class="field-hint" style="display: block; margin-top: 4px;">${description}</span>
                        ${envHint}
                    </div>
                    ${hasKey ? `<button class="btn-icon delete-api-key" data-service="${name}" title="Delete key">×</button>` : ''}
                </div>
                <div class="api-key-input">
                    <input type="password" 
                           class="api-key-value" 
                           data-service="${name}" 
                           placeholder="Enter ${label} API key${envVar ? ` (or set ${envVar})` : ''}"
                           value="${hasKey ? '••••••••' : ''}"
                           ${hasKey ? 'data-has-key="true"' : ''}>
                    ${hasKey ? `<button class="btn-small toggle-visibility" data-service="${name}" data-visible="false">Show</button>` : ''}
                </div>
            `;
            list.appendChild(item);
        });
        
        // Add event listeners
        list.querySelectorAll('.api-key-enabled').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const service = e.target.dataset.service;
                if (!this.settings.api.apiKeys[service]) {
                    this.settings.api.apiKeys[service] = { enabled: false, key: '' };
                }
                this.settings.api.apiKeys[service].enabled = e.target.checked;
                this.saveSettings();
            });
        });
        
        list.querySelectorAll('.api-key-value').forEach(input => {
            input.addEventListener('blur', async (e) => {
                const service = e.target.dataset.service;
                const value = e.target.value;
                
                if (value && value !== '••••••••') {
                    // Save to main process securely
                    if (window.sergikAPI && window.sergikAPI.setApiKey) {
                        try {
                            await window.sergikAPI.setApiKey(service, value);
                            // Update UI to show key is saved
                            e.target.value = '••••••••';
                            // Add delete button if not present
                            const item = e.target.closest('.api-key-item');
                            const header = item.querySelector('.api-key-header');
                            if (!header.querySelector('.delete-api-key')) {
                                const deleteBtn = document.createElement('button');
                                deleteBtn.className = 'btn-icon delete-api-key';
                                deleteBtn.dataset.service = service;
                                deleteBtn.title = 'Delete key';
                                deleteBtn.textContent = '×';
                                deleteBtn.addEventListener('click', async () => {
                                    if (confirm(`Delete ${service} API key?`)) {
                                        if (window.sergikAPI && window.sergikAPI.deleteApiKey) {
                                            await window.sergikAPI.deleteApiKey(service);
                                        }
                                        if (this.settings.api.apiKeys[service]) {
                                            delete this.settings.api.apiKeys[service];
                                        }
                                        this.populateApiKeysUI();
                                    }
                                });
                                header.appendChild(deleteBtn);
                            }
                            // Add show/hide button if not present
                            const inputContainer = item.querySelector('.api-key-input');
                            if (!inputContainer.querySelector('.toggle-visibility')) {
                                const toggleBtn = document.createElement('button');
                                toggleBtn.className = 'btn-small toggle-visibility';
                                toggleBtn.dataset.service = service;
                                toggleBtn.dataset.visible = 'false';
                                toggleBtn.textContent = 'Show';
                                toggleBtn.addEventListener('click', () => {
                                    const isVisible = toggleBtn.dataset.visible === 'true';
                                    e.target.type = isVisible ? 'password' : 'text';
                                    toggleBtn.textContent = isVisible ? 'Show' : 'Hide';
                                    toggleBtn.dataset.visible = isVisible ? 'false' : 'true';
                                });
                                inputContainer.appendChild(toggleBtn);
                            }
                            if (window.showNotification) {
                                window.showNotification(`${service.toUpperCase()} API key saved securely`, 'success', 2000);
                            }
                        } catch (error) {
                            console.error('[Settings] Failed to save API key:', error);
                            if (window.showNotification) {
                                window.showNotification('Failed to save API key', 'error', 3000);
                            }
                        }
                    }
                    
                    if (!this.settings.api.apiKeys[service]) {
                        this.settings.api.apiKeys[service] = { enabled: false, key: '' };
                    }
                    this.settings.api.apiKeys[service].key = '***'; // Don't store in localStorage
                    this.saveSettings();
                }
            });
        });
        
        list.querySelectorAll('.delete-api-key').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const service = e.target.dataset.service;
                if (confirm(`Delete ${service} API key?`)) {
                    if (window.sergikAPI && window.sergikAPI.deleteApiKey) {
                        try {
                            await window.sergikAPI.deleteApiKey(service);
                            if (this.settings.api.apiKeys && this.settings.api.apiKeys[service]) {
                                delete this.settings.api.apiKeys[service];
                            }
                            this.populateApiKeysUI();
                            if (window.showNotification) {
                                window.showNotification(`${service.toUpperCase()} API key deleted`, 'success', 2000);
                            }
                        } catch (error) {
                            console.error('[Settings] Failed to delete API key:', error);
                            if (window.showNotification) {
                                window.showNotification('Failed to delete API key', 'error', 3000);
                            }
                        }
                    }
                }
            });
        });
        
        // Toggle visibility buttons
        list.querySelectorAll('.toggle-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                const input = list.querySelector(`.api-key-value[data-service="${service}"]`);
                const isVisible = e.target.dataset.visible === 'true';
                
                if (input) {
                    input.type = isVisible ? 'password' : 'text';
                    e.target.textContent = isVisible ? 'Show' : 'Hide';
                    e.target.dataset.visible = isVisible ? 'false' : 'true';
                }
            });
        });
    }
}

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.SettingsManager = SettingsManager;
    window.settingsManager = new SettingsManager();
    window.showSettingsPanel = function() {
        if (window.settingsManager) {
            window.settingsManager.show();
        }
    };
}

