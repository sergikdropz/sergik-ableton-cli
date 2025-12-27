/**
 * Settings Enhancements
 * Additional utilities for enhanced settings management
 */

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

// Settings Schema for validation
const SETTINGS_SCHEMA = {
    'api.url': {
        type: 'string',
        format: 'url',
        required: true,
        default: 'http://127.0.0.1:8000',
        label: 'API URL',
        description: 'Base URL for SERGIK ML API',
        category: 'api',
        section: 'basic',
        validator: (value) => {
            try {
                new URL(value);
                return { valid: true };
            } catch {
                return { valid: false, error: 'Must be a valid URL' };
            }
        }
    },
    'api.timeout': {
        type: 'number',
        min: 1000,
        max: 60000,
        default: 10000,
        label: 'Request Timeout',
        description: 'Timeout for API requests in milliseconds',
        category: 'api',
        section: 'basic',
        unit: 'ms',
        validator: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1000 || num > 60000) {
                return { valid: false, error: 'Timeout must be between 1s and 60s' };
            }
            return { valid: true };
        }
    },
    'api.retryCount': {
        type: 'number',
        min: 0,
        max: 10,
        default: 3,
        label: 'Retry Count',
        description: 'Number of retry attempts for failed requests',
        category: 'api',
        section: 'retry',
        validator: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 0 || num > 10) {
                return { valid: false, error: 'Retry count must be between 0 and 10' };
            }
            return { valid: true };
        }
    },
    'api.retryDelay': {
        type: 'number',
        min: 100,
        max: 10000,
        default: 1000,
        label: 'Retry Delay',
        description: 'Initial delay between retries in milliseconds',
        category: 'api',
        section: 'retry',
        unit: 'ms',
        validator: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 100 || num > 10000) {
                return { valid: false, error: 'Retry delay must be between 100ms and 10s' };
            }
            return { valid: true };
        }
    },
    'behavior.defaultTempo': {
        type: 'number',
        min: 60,
        max: 200,
        default: 124,
        label: 'Default Tempo',
        description: 'Default BPM for new projects',
        category: 'behavior',
        validator: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 60 || num > 200) {
                return { valid: false, error: 'Tempo must be between 60 and 200 BPM' };
            }
            return { valid: true };
        }
    },
    'notifications.duration': {
        type: 'number',
        min: 1000,
        max: 10000,
        default: 3000,
        label: 'Notification Duration',
        description: 'How long notifications are displayed',
        category: 'notifications',
        unit: 'ms',
        validator: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1000 || num > 10000) {
                return { valid: false, error: 'Duration must be between 1s and 10s' };
            }
            return { valid: true };
        }
    },
    'api.maxConnections': {
        type: 'number',
        min: 1,
        max: 50,
        default: 10,
        label: 'Max Connections',
        description: 'Maximum concurrent connections',
        category: 'api',
        section: 'connection',
        validator: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1 || num > 50) {
                return { valid: false, error: 'Max connections must be between 1 and 50' };
            }
            return { valid: true };
        }
    },
    'api.connectionTimeout': {
        type: 'number',
        min: 1000,
        max: 30000,
        default: 5000,
        label: 'Connection Timeout',
        description: 'Timeout for establishing connections',
        category: 'api',
        section: 'connection',
        unit: 'ms',
        validator: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1000 || num > 30000) {
                return { valid: false, error: 'Connection timeout must be between 1s and 30s' };
            }
            return { valid: true };
        }
    },
    // Audio Settings Validation
    'audio.masterVolume': {
        type: 'number',
        min: 0.0,
        max: 1.0,
        default: 1.0,
        label: 'Master Volume',
        description: 'Master output volume (0.0 to 1.0)',
        category: 'audio',
        section: 'playback',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 1) {
                return { valid: false, error: 'Master volume must be between 0.0 and 1.0' };
            }
            return { valid: true };
        }
    },
    'audio.defaultLoop': {
        type: 'boolean',
        default: false,
        label: 'Default Loop',
        description: 'Loop audio playback by default',
        category: 'audio',
        section: 'playback',
        validator: (value) => {
            return { valid: typeof value === 'boolean' };
        }
    },
    'audio.autoPlay': {
        type: 'boolean',
        default: false,
        label: 'Auto Play',
        description: 'Automatically play audio when loaded',
        category: 'audio',
        section: 'playback',
        validator: (value) => {
            return { valid: typeof value === 'boolean' };
        }
    },
    'audio.crossfadeDuration': {
        type: 'number',
        min: 0.0,
        max: 5.0,
        default: 0.0,
        label: 'Crossfade Duration',
        description: 'Crossfade duration in seconds when switching tracks',
        category: 'audio',
        section: 'playback',
        unit: 's',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 5) {
                return { valid: false, error: 'Crossfade duration must be between 0 and 5 seconds' };
            }
            return { valid: true };
        }
    },
    // Legacy audio settings (kept for backward compatibility)
    'audio.sampleRate': {
        type: 'number',
        enum: [44100, 48000, 88200, 96000],
        default: 44100,
        label: 'Sample Rate',
        description: 'Audio sample rate in Hz (legacy - use audio.sampleRate.inOutRate)',
        category: 'audio',
        section: 'context',
        unit: 'Hz',
        validator: (value) => {
            const validRates = [44100, 48000, 88200, 96000];
            const num = parseInt(value);
            if (!validRates.includes(num)) {
                return { valid: false, error: 'Sample rate must be 44100, 48000, 88200, or 96000 Hz' };
            }
            return { valid: true };
        }
    },
    'audio.bufferSize': {
        type: 'number',
        enum: [256, 512, 1024, 2048, 4096, 8192, 16384],
        default: 2048,
        label: 'Buffer Size',
        description: 'Audio buffer size (legacy - use audio.latency.bufferSize)',
        category: 'audio',
        section: 'context',
        unit: 'samples',
        validator: (value) => {
            const validSizes = [256, 512, 1024, 2048, 4096, 8192, 16384];
            const num = parseInt(value);
            if (!validSizes.includes(num)) {
                return { valid: false, error: 'Buffer size must be a power of 2 between 256 and 16384' };
            }
            return { valid: true };
        }
    },
    // New audio device settings
    'audio.device.driverType': {
        type: 'string',
        enum: ['CoreAudio', 'ASIO', 'DirectSound', 'WASAPI'],
        default: 'CoreAudio',
        label: 'Driver Type',
        description: 'Audio driver type',
        category: 'audio',
        section: 'device',
        validator: (value) => {
            if (!['CoreAudio', 'ASIO', 'DirectSound', 'WASAPI'].includes(value)) {
                return { valid: false, error: 'Driver type must be CoreAudio, ASIO, DirectSound, or WASAPI' };
            }
            return { valid: true };
        }
    },
    'audio.device.inputDevice': {
        type: 'string',
        default: 'No Device',
        label: 'Audio Input Device',
        description: 'Selected audio input device',
        category: 'audio',
        section: 'device',
        validator: (value) => {
            return { valid: typeof value === 'string' };
        }
    },
    'audio.device.outputDevice': {
        type: 'string',
        default: 'Default',
        label: 'Audio Output Device',
        description: 'Selected audio output device',
        category: 'audio',
        section: 'device',
        validator: (value) => {
            return { valid: typeof value === 'string' };
        }
    },
    // New audio sample rate settings
    'audio.sampleRate.inOutRate': {
        type: 'number',
        enum: [44100, 48000, 88200, 96000],
        default: 44100,
        label: 'In/Out Sample Rate',
        description: 'Audio sample rate in Hz',
        category: 'audio',
        section: 'sampleRate',
        unit: 'Hz',
        validator: (value) => {
            const validRates = [44100, 48000, 88200, 96000];
            const num = parseInt(value);
            if (!validRates.includes(num)) {
                return { valid: false, error: 'Sample rate must be 44100, 48000, 88200, or 96000 Hz' };
            }
            return { valid: true };
        }
    },
    'audio.sampleRate.pitchConversion': {
        type: 'string',
        enum: ['Normal', 'Repitch', 'Complex', 'Complex Pro'],
        default: 'Normal',
        label: 'Default SR & Pitch Conversion',
        description: 'Sample rate and pitch conversion mode',
        category: 'audio',
        section: 'sampleRate',
        validator: (value) => {
            if (!['Normal', 'Repitch', 'Complex', 'Complex Pro'].includes(value)) {
                return { valid: false, error: 'Pitch conversion must be Normal, Repitch, Complex, or Complex Pro' };
            }
            return { valid: true };
        }
    },
    // New audio latency settings
    'audio.latency.bufferSize': {
        type: 'number',
        enum: [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384],
        default: 128,
        label: 'Buffer Size',
        description: 'Audio buffer size in samples (lower = less latency, higher = more stable)',
        category: 'audio',
        section: 'latency',
        unit: 'samples',
        validator: (value) => {
            const validSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];
            const num = parseInt(value);
            if (!validSizes.includes(num)) {
                return { valid: false, error: 'Buffer size must be a power of 2 between 32 and 16384' };
            }
            return { valid: true };
        }
    },
    'audio.latency.driverErrorCompensation': {
        type: 'number',
        min: -100,
        max: 100,
        default: 0.00,
        label: 'Driver Error Compensation',
        description: 'Compensation for driver latency errors in milliseconds',
        category: 'audio',
        section: 'latency',
        unit: 'ms',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < -100 || num > 100) {
                return { valid: false, error: 'Driver error compensation must be between -100 and 100 ms' };
            }
            return { valid: true };
        }
    },
    // New audio test settings
    'audio.test.testTone.enabled': {
        type: 'boolean',
        default: false,
        label: 'Test Tone',
        description: 'Enable test tone for audio monitoring',
        category: 'audio',
        section: 'test',
        validator: (value) => {
            return { valid: typeof value === 'boolean' };
        }
    },
    'audio.test.testTone.volume': {
        type: 'number',
        min: -60,
        max: 0,
        default: -36,
        label: 'Tone Volume',
        description: 'Test tone volume in decibels',
        category: 'audio',
        section: 'test',
        unit: 'dB',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < -60 || num > 0) {
                return { valid: false, error: 'Tone volume must be between -60 and 0 dB' };
            }
            return { valid: true };
        }
    },
    'audio.test.testTone.frequency': {
        type: 'number',
        min: 20,
        max: 20000,
        default: 440,
        label: 'Tone Frequency',
        description: 'Test tone frequency in Hz',
        category: 'audio',
        section: 'test',
        unit: 'Hz',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 20 || num > 20000) {
                return { valid: false, error: 'Tone frequency must be between 20 and 20000 Hz' };
            }
            return { valid: true };
        }
    },
    'audio.test.cpuUsageSimulator': {
        type: 'number',
        min: 0,
        max: 100,
        default: 50,
        label: 'CPU Usage Simulator',
        description: 'Simulate CPU load for testing',
        category: 'audio',
        section: 'test',
        unit: '%',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 100) {
                return { valid: false, error: 'CPU usage simulator must be between 0 and 100%' };
            }
            return { valid: true };
        }
    },
    'audio.latencyHint': {
        type: 'string',
        enum: ['interactive', 'balanced', 'playback'],
        default: 'interactive',
        label: 'Latency Hint',
        description: 'Audio context latency preference',
        category: 'audio',
        section: 'context',
        validator: (value) => {
            if (!['interactive', 'balanced', 'playback'].includes(value)) {
                return { valid: false, error: 'Latency hint must be interactive, balanced, or playback' };
            }
            return { valid: true };
        }
    },
    'audio.effectsEnabled': {
        type: 'boolean',
        default: true,
        label: 'Effects Enabled',
        description: 'Enable audio effects processing',
        category: 'audio',
        section: 'effects',
        validator: (value) => {
            return { valid: typeof value === 'boolean' };
        }
    },
    'audio.reverbRoomSize': {
        type: 'number',
        min: 0.0,
        max: 1.0,
        default: 0.5,
        label: 'Reverb Room Size',
        description: 'Reverb room size (0.0 = small, 1.0 = large)',
        category: 'audio',
        section: 'effects',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 1) {
                return { valid: false, error: 'Room size must be between 0.0 and 1.0' };
            }
            return { valid: true };
        }
    },
    'audio.delayTime': {
        type: 'number',
        min: 0.0,
        max: 1.0,
        default: 0.3,
        label: 'Delay Time',
        description: 'Delay time in seconds',
        category: 'audio',
        section: 'effects',
        unit: 's',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 1) {
                return { valid: false, error: 'Delay time must be between 0 and 1 second' };
            }
            return { valid: true };
        }
    },
    'audio.delayFeedback': {
        type: 'number',
        min: 0.0,
        max: 0.95,
        default: 0.3,
        label: 'Delay Feedback',
        description: 'Delay feedback amount (0.0 to 0.95)',
        category: 'audio',
        section: 'effects',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 0.95) {
                return { valid: false, error: 'Delay feedback must be between 0.0 and 0.95' };
            }
            return { valid: true };
        }
    },
    'audio.eqLowGain': {
        type: 'number',
        min: -40,
        max: 40,
        default: 0,
        label: 'EQ Low Gain',
        description: 'Low frequency EQ gain in dB',
        category: 'audio',
        section: 'effects',
        unit: 'dB',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < -40 || num > 40) {
                return { valid: false, error: 'EQ gain must be between -40 and 40 dB' };
            }
            return { valid: true };
        }
    },
    'audio.eqMidGain': {
        type: 'number',
        min: -40,
        max: 40,
        default: 0,
        label: 'EQ Mid Gain',
        description: 'Mid frequency EQ gain in dB',
        category: 'audio',
        section: 'effects',
        unit: 'dB',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < -40 || num > 40) {
                return { valid: false, error: 'EQ gain must be between -40 and 40 dB' };
            }
            return { valid: true };
        }
    },
    'audio.eqHighGain': {
        type: 'number',
        min: -40,
        max: 40,
        default: 0,
        label: 'EQ High Gain',
        description: 'High frequency EQ gain in dB',
        category: 'audio',
        section: 'effects',
        unit: 'dB',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < -40 || num > 40) {
                return { valid: false, error: 'EQ gain must be between -40 and 40 dB' };
            }
            return { valid: true };
        }
    },
    'audio.compressorThreshold': {
        type: 'number',
        min: -100,
        max: 0,
        default: -24,
        label: 'Compressor Threshold',
        description: 'Compressor threshold in dB',
        category: 'audio',
        section: 'effects',
        unit: 'dB',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < -100 || num > 0) {
                return { valid: false, error: 'Compressor threshold must be between -100 and 0 dB' };
            }
            return { valid: true };
        }
    },
    'audio.compressorRatio': {
        type: 'number',
        min: 1,
        max: 20,
        default: 12,
        label: 'Compressor Ratio',
        description: 'Compressor ratio (1:1 to 20:1)',
        category: 'audio',
        section: 'effects',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 1 || num > 20) {
                return { valid: false, error: 'Compressor ratio must be between 1 and 20' };
            }
            return { valid: true };
        }
    },
    'audio.distortionAmount': {
        type: 'number',
        min: 0,
        max: 100,
        default: 50,
        label: 'Distortion Amount',
        description: 'Distortion amount (0 to 100)',
        category: 'audio',
        section: 'effects',
        unit: '%',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 100) {
                return { valid: false, error: 'Distortion amount must be between 0 and 100' };
            }
            return { valid: true };
        }
    },
    'audio.filterFrequency': {
        type: 'number',
        min: 10,
        max: 22050,
        default: 1000,
        label: 'Filter Frequency',
        description: 'Filter cutoff frequency in Hz',
        category: 'audio',
        section: 'effects',
        unit: 'Hz',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 10 || num > 22050) {
                return { valid: false, error: 'Filter frequency must be between 10 and 22050 Hz' };
            }
            return { valid: true };
        }
    },
    'audio.filterQ': {
        type: 'number',
        min: 0.0001,
        max: 1000,
        default: 1,
        label: 'Filter Q',
        description: 'Filter resonance/Q factor',
        category: 'audio',
        section: 'effects',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0.0001 || num > 1000) {
                return { valid: false, error: 'Filter Q must be between 0.0001 and 1000' };
            }
            return { valid: true };
        }
    },
    'audio.chorusRate': {
        type: 'number',
        min: 0.1,
        max: 20,
        default: 1.5,
        label: 'Chorus Rate',
        description: 'Chorus LFO rate in Hz',
        category: 'audio',
        section: 'effects',
        unit: 'Hz',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0.1 || num > 20) {
                return { valid: false, error: 'Chorus rate must be between 0.1 and 20 Hz' };
            }
            return { valid: true };
        }
    },
    'audio.chorusDepth': {
        type: 'number',
        min: 0.0,
        max: 1.0,
        default: 0.7,
        label: 'Chorus Depth',
        description: 'Chorus modulation depth (0.0 to 1.0)',
        category: 'audio',
        section: 'effects',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 1) {
                return { valid: false, error: 'Chorus depth must be between 0.0 and 1.0' };
            }
            return { valid: true };
        }
    },
    'audio.synthMaxVoices': {
        type: 'number',
        min: 1,
        max: 32,
        default: 8,
        label: 'Synth Max Voices',
        description: 'Maximum simultaneous synthesizer voices',
        category: 'audio',
        section: 'synthesizer',
        validator: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1 || num > 32) {
                return { valid: false, error: 'Max voices must be between 1 and 32' };
            }
            return { valid: true };
        }
    },
    'audio.synthWaveform': {
        type: 'string',
        enum: ['sine', 'square', 'sawtooth', 'triangle'],
        default: 'sine',
        label: 'Synth Waveform',
        description: 'Default synthesizer waveform',
        category: 'audio',
        section: 'synthesizer',
        validator: (value) => {
            if (!['sine', 'square', 'sawtooth', 'triangle'].includes(value)) {
                return { valid: false, error: 'Waveform must be sine, square, sawtooth, or triangle' };
            }
            return { valid: true };
        }
    },
    'audio.synthFilterType': {
        type: 'string',
        enum: ['lowpass', 'highpass', 'bandpass', 'notch', 'allpass'],
        default: 'lowpass',
        label: 'Synth Filter Type',
        description: 'Default synthesizer filter type',
        category: 'audio',
        section: 'synthesizer',
        validator: (value) => {
            if (!['lowpass', 'highpass', 'bandpass', 'notch', 'allpass'].includes(value)) {
                return { valid: false, error: 'Filter type must be lowpass, highpass, bandpass, notch, or allpass' };
            }
            return { valid: true };
        }
    },
    'audio.synthFilterFreq': {
        type: 'number',
        min: 10,
        max: 22050,
        default: 2000,
        label: 'Synth Filter Frequency',
        description: 'Default synthesizer filter frequency in Hz',
        category: 'audio',
        section: 'synthesizer',
        unit: 'Hz',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 10 || num > 22050) {
                return { valid: false, error: 'Filter frequency must be between 10 and 22050 Hz' };
            }
            return { valid: true };
        }
    },
    'audio.synthFilterQ': {
        type: 'number',
        min: 0.0001,
        max: 1000,
        default: 1,
        label: 'Synth Filter Q',
        description: 'Default synthesizer filter Q/resonance',
        category: 'audio',
        section: 'synthesizer',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0.0001 || num > 1000) {
                return { valid: false, error: 'Filter Q must be between 0.0001 and 1000' };
            }
            return { valid: true };
        }
    },
    'audio.synthAttack': {
        type: 'number',
        min: 0.0,
        max: 2.0,
        default: 0.01,
        label: 'Synth Attack',
        description: 'ADSR attack time in seconds',
        category: 'audio',
        section: 'synthesizer',
        unit: 's',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 2) {
                return { valid: false, error: 'Attack time must be between 0 and 2 seconds' };
            }
            return { valid: true };
        }
    },
    'audio.synthDecay': {
        type: 'number',
        min: 0.0,
        max: 2.0,
        default: 0.1,
        label: 'Synth Decay',
        description: 'ADSR decay time in seconds',
        category: 'audio',
        section: 'synthesizer',
        unit: 's',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 2) {
                return { valid: false, error: 'Decay time must be between 0 and 2 seconds' };
            }
            return { valid: true };
        }
    },
    'audio.synthSustain': {
        type: 'number',
        min: 0.0,
        max: 1.0,
        default: 0.7,
        label: 'Synth Sustain',
        description: 'ADSR sustain level (0.0 to 1.0)',
        category: 'audio',
        section: 'synthesizer',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 1) {
                return { valid: false, error: 'Sustain level must be between 0.0 and 1.0' };
            }
            return { valid: true };
        }
    },
    'audio.synthRelease': {
        type: 'number',
        min: 0.0,
        max: 5.0,
        default: 0.3,
        label: 'Synth Release',
        description: 'ADSR release time in seconds',
        category: 'audio',
        section: 'synthesizer',
        unit: 's',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 5) {
                return { valid: false, error: 'Release time must be between 0 and 5 seconds' };
            }
            return { valid: true };
        }
    },
    'audio.synthLfoRate': {
        type: 'number',
        min: 0.0,
        max: 20.0,
        default: 0,
        label: 'Synth LFO Rate',
        description: 'LFO modulation rate in Hz',
        category: 'audio',
        section: 'synthesizer',
        unit: 'Hz',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 20) {
                return { valid: false, error: 'LFO rate must be between 0 and 20 Hz' };
            }
            return { valid: true };
        }
    },
    'audio.synthLfoAmount': {
        type: 'number',
        min: 0.0,
        max: 1.0,
        default: 0,
        label: 'Synth LFO Amount',
        description: 'LFO modulation amount (0.0 to 1.0)',
        category: 'audio',
        section: 'synthesizer',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 1) {
                return { valid: false, error: 'LFO amount must be between 0.0 and 1.0' };
            }
            return { valid: true };
        }
    },
    'audio.synthVolume': {
        type: 'number',
        min: 0.0,
        max: 1.0,
        default: 0.3,
        label: 'Synth Volume',
        description: 'Default synthesizer volume (0.0 to 1.0)',
        category: 'audio',
        section: 'synthesizer',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 1) {
                return { valid: false, error: 'Synth volume must be between 0.0 and 1.0' };
            }
            return { valid: true };
        }
    },
    'audio.analyzerFftSize': {
        type: 'number',
        enum: [256, 512, 1024, 2048, 4096, 8192, 16384],
        default: 2048,
        label: 'Analyzer FFT Size',
        description: 'FFT size for audio analysis (power of 2)',
        category: 'audio',
        section: 'analyzer',
        unit: 'samples',
        validator: (value) => {
            const validSizes = [256, 512, 1024, 2048, 4096, 8192, 16384];
            const num = parseInt(value);
            if (!validSizes.includes(num)) {
                return { valid: false, error: 'FFT size must be a power of 2 between 256 and 16384' };
            }
            return { valid: true };
        }
    },
    'audio.analyzerSmoothing': {
        type: 'number',
        min: 0.0,
        max: 1.0,
        default: 0.8,
        label: 'Analyzer Smoothing',
        description: 'Smoothing factor for analyzer (0.0 to 1.0)',
        category: 'audio',
        section: 'analyzer',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 1) {
                return { valid: false, error: 'Smoothing must be between 0.0 and 1.0' };
            }
            return { valid: true };
        }
    },
    'audio.analyzerMinDecibels': {
        type: 'number',
        min: -200,
        max: 0,
        default: -100,
        label: 'Analyzer Min Decibels',
        description: 'Minimum decibel level for analyzer',
        category: 'audio',
        section: 'analyzer',
        unit: 'dB',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < -200 || num > 0) {
                return { valid: false, error: 'Min decibels must be between -200 and 0 dB' };
            }
            return { valid: true };
        }
    },
    'audio.analyzerMaxDecibels': {
        type: 'number',
        min: -200,
        max: 0,
        default: -30,
        label: 'Analyzer Max Decibels',
        description: 'Maximum decibel level for analyzer',
        category: 'audio',
        section: 'analyzer',
        unit: 'dB',
        validator: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < -200 || num > 0) {
                return { valid: false, error: 'Max decibels must be between -200 and 0 dB' };
            }
            return { valid: true };
        }
    },
    'audio.analyzerUpdateRate': {
        type: 'number',
        min: 10,
        max: 120,
        default: 60,
        label: 'Analyzer Update Rate',
        description: 'Update rate for analyzer visualization in FPS',
        category: 'audio',
        section: 'analyzer',
        unit: 'fps',
        validator: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 10 || num > 120) {
                return { valid: false, error: 'Update rate must be between 10 and 120 FPS' };
            }
            return { valid: true };
        }
    },
    'audio.maxActiveEffects': {
        type: 'number',
        min: 1,
        max: 20,
        default: 5,
        label: 'Max Active Effects',
        description: 'Maximum number of active effects simultaneously',
        category: 'audio',
        section: 'performance',
        validator: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1 || num > 20) {
                return { valid: false, error: 'Max active effects must be between 1 and 20' };
            }
            return { valid: true };
        }
    },
    'audio.enableOfflineRendering': {
        type: 'boolean',
        default: false,
        label: 'Enable Offline Rendering',
        description: 'Enable offline audio rendering for export',
        category: 'audio',
        section: 'performance',
        validator: (value) => {
            return { valid: typeof value === 'boolean' };
        }
    }
};

// Settings Presets
const SETTINGS_PRESETS = {
    development: {
        name: 'Development',
        description: 'Optimized for development with verbose logging',
        settings: {
            api: {
                logRequests: true,
                logResponses: true,
                logErrors: true,
                showRequestDetails: true
            },
            advanced: {
                debugMode: true,
                logLevel: 'debug'
            }
        }
    },
    production: {
        name: 'Production',
        description: 'Optimized for production with minimal logging',
        settings: {
            api: {
                logRequests: false,
                logResponses: false,
                logErrors: true,
                showRequestDetails: false
            },
            advanced: {
                debugMode: false,
                logLevel: 'info'
            }
        }
    },
    minimal: {
        name: 'Minimal',
        description: 'Bare minimum settings',
        settings: {
            api: {
                logRequests: false,
                logResponses: false,
                logErrors: false,
                showRequestDetails: false
            },
            notifications: {
                enabled: false,
                sound: false
            },
            advanced: {
                debugMode: false,
                logLevel: 'warn'
            }
        }
    },
    performance: {
        name: 'Performance',
        description: 'Optimized for speed',
        settings: {
            api: {
                keepAlive: true,
                maxConnections: 20,
                connectionTimeout: 3000
            },
            behavior: {
                autoSave: true,
                autoConnect: true
            }
        }
    }
};

// Export utilities
if (typeof window !== 'undefined') {
    window.debounce = debounce;
    window.SETTINGS_SCHEMA = SETTINGS_SCHEMA;
    window.SETTINGS_PRESETS = SETTINGS_PRESETS;
}

