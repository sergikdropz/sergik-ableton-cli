/**
 * SERGIK AI Controller - Audio Engine
 * 
 * Core audio engine using Web Audio API for playback, effects, and synthesis.
 */

class AudioEngine {
    constructor() {
        // Initialize AudioContext
        this.audioContext = null;
        this.masterGain = null;
        this.destination = null;
        
        // Playback state
        this.currentSource = null;
        this.currentBuffer = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.playbackStartTime = 0;
        this.pauseTime = 0;
        this.loop = false;
        
        // Effects chain
        this.effectsChain = [];
        this.effectsEnabled = true;
        
        // Initialize on first user interaction (required by browsers)
        this.initialized = false;
    }
    
    /**
     * Initialize the audio context (must be called after user interaction)
     */
    async initialize() {
        if (this.initialized && this.audioContext) {
            return;
        }
        
        try {
            // Get audio settings if available
            const audioSettings = window.audioSettings || window.settingsManager?.settings?.audio || {};
            
            // Handle new nested sampleRate structure
            let sampleRate = 44100;
            if (audioSettings.sampleRate) {
                if (typeof audioSettings.sampleRate === 'number') {
                    // Legacy format: direct number
                    sampleRate = audioSettings.sampleRate;
                } else if (audioSettings.sampleRate.inOutRate) {
                    // New format: nested object
                    sampleRate = audioSettings.sampleRate.inOutRate;
                }
            }
            
            // Validate sample rate (must be finite number)
            if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
                console.warn('[AudioEngine] Invalid sample rate, using default 44100');
                sampleRate = 44100;
            }
            
            const latencyHint = audioSettings.latencyHint || audioSettings.playback?.latencyHint || 'interactive';
            
            // Create AudioContext with settings
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const contextOptions = {
                sampleRate: sampleRate,
                latencyHint: latencyHint
            };
            
            this.audioContext = new AudioContextClass(contextOptions);
            this.destination = this.audioContext.destination;
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            const masterVolume = audioSettings.masterVolume !== undefined ? audioSettings.masterVolume : 1.0;
            this.masterGain.gain.value = masterVolume;
            this.masterGain.connect(this.destination);
            
            // Set default loop
            this.loop = audioSettings.defaultLoop === true;
            
            // Set effects enabled
            this.effectsEnabled = audioSettings.effectsEnabled !== false;
            
            this.initialized = true;
            console.log('[AudioEngine] Initialized', { sampleRate, latencyHint, masterVolume, loop: this.loop, effectsEnabled: this.effectsEnabled });
        } catch (error) {
            console.error('[AudioEngine] Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Resume audio context if suspended (required after user interaction)
     */
    async resume() {
        if (!this.audioContext) {
            await this.initialize();
        }
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    /**
     * Load audio file from path or URL
     */
    async loadAudioFile(filePath) {
        await this.resume();
        
        try {
            // Use fetch to load the file
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load audio file: ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.currentBuffer = audioBuffer;
            console.log('[AudioEngine] Loaded audio file:', filePath, {
                duration: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate,
                channels: audioBuffer.numberOfChannels
            });
            
            return audioBuffer;
        } catch (error) {
            console.error('[AudioEngine] Failed to load audio file:', error);
            throw error;
        }
    }
    
    /**
     * Alias for loadAudioFile (for compatibility)
     */
    async loadAudioBuffer(filePath) {
        return this.loadAudioFile(filePath);
    }
    
    /**
     * Play audio with options
     */
    async playAudio(source = null, options = {}) {
        await this.resume();
        
        // Stop current playback if any
        if (this.isPlaying) {
            this.stopAudio();
        }
        
        // Use provided source or current buffer
        const audioBuffer = source || this.currentBuffer;
        if (!audioBuffer) {
            throw new Error('No audio source provided');
        }
        
        // Create buffer source
        const sourceNode = this.audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.loop = options.loop || this.loop || false;
        
        // Build effects chain
        let lastNode = sourceNode;
        
        if (this.effectsEnabled && this.effectsChain.length > 0) {
            // Connect through effects chain
            for (const effect of this.effectsChain) {
                if (effect.enabled && effect.node) {
                    lastNode.connect(effect.node);
                    lastNode = effect.node;
                }
            }
        }
        
        // Connect to master gain
        lastNode.connect(this.masterGain);
        
        // Set playback options
        const startTime = options.startTime || 0;
        const offset = options.offset || 0;
        const duration = options.duration || audioBuffer.duration - offset;
        
        // Store source and state
        this.currentSource = sourceNode;
        this.isPlaying = true;
        this.isPaused = false;
        this.playbackStartTime = this.audioContext.currentTime - offset;
        
        // Handle end of playback
        sourceNode.onended = () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.currentSource = null;
            if (this.onPlaybackEnd) {
                this.onPlaybackEnd();
            }
        };
        
        // Start playback
        sourceNode.start(this.audioContext.currentTime, offset, duration);
        
        console.log('[AudioEngine] Playing audio', { offset, duration, loop: sourceNode.loop });
    }
    
    /**
     * Pause audio playback
     */
    pauseAudio() {
        if (!this.isPlaying || !this.currentSource) {
            return;
        }
        
        // Store pause time
        this.pauseTime = this.audioContext.currentTime - this.playbackStartTime;
        
        // Stop current source
        try {
            this.currentSource.stop();
        } catch (e) {
            // Source may have already ended
        }
        
        this.isPlaying = false;
        this.isPaused = true;
        this.currentSource = null;
        
        console.log('[AudioEngine] Paused at', this.pauseTime);
    }
    
    /**
     * Resume paused audio
     */
    async resumeAudio() {
        if (!this.isPaused || !this.currentBuffer) {
            return;
        }
        
        await this.playAudio(this.currentBuffer, {
            offset: this.pauseTime,
            loop: this.loop
        });
    }
    
    /**
     * Stop audio playback
     */
    stopAudio() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Source may have already ended
            }
            this.currentSource = null;
        }
        
        this.isPlaying = false;
        this.isPaused = false;
        this.playbackStartTime = 0;
        this.pauseTime = 0;
        
        console.log('[AudioEngine] Stopped');
    }
    
    /**
     * Seek to specific time
     */
    async seekAudio(time) {
        if (!this.currentBuffer) {
            return;
        }
        
        const wasPlaying = this.isPlaying;
        
        // Stop current playback
        this.stopAudio();
        
        // Resume from new position if was playing
        if (wasPlaying) {
            await this.playAudio(this.currentBuffer, {
                offset: Math.max(0, Math.min(time, this.currentBuffer.duration)),
                loop: this.loop
            });
        } else {
            this.pauseTime = time;
        }
    }
    
    /**
     * Get current playback time
     */
    getCurrentTime() {
        if (!this.audioContext || !this.currentBuffer) {
            return 0;
        }
        
        if (this.isPlaying && this.currentSource) {
            return this.audioContext.currentTime - this.playbackStartTime;
        } else if (this.isPaused) {
            return this.pauseTime;
        }
        
        return 0;
    }
    
    /**
     * Get audio duration
     */
    getDuration() {
        return this.currentBuffer ? this.currentBuffer.duration : 0;
    }
    
    /**
     * Set master volume (0.0 to 1.0)
     */
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    /**
     * Get master volume
     */
    getVolume() {
        return this.masterGain ? this.masterGain.gain.value : 1.0;
    }
    
    /**
     * Set loop mode
     */
    setLoop(loop) {
        this.loop = loop;
        if (this.currentSource) {
            this.currentSource.loop = loop;
        }
    }
    
    /**
     * Add effect to effects chain
     */
    addEffect(effect) {
        if (effect && effect.node) {
            this.effectsChain.push(effect);
            console.log('[AudioEngine] Added effect:', effect.name);
        }
    }
    
    /**
     * Remove effect from chain
     */
    removeEffect(effect) {
        const index = this.effectsChain.indexOf(effect);
        if (index > -1) {
            this.effectsChain.splice(index, 1);
            console.log('[AudioEngine] Removed effect:', effect.name);
        }
    }
    
    /**
     * Enable/disable effects
     */
    setEffectsEnabled(enabled) {
        this.effectsEnabled = enabled;
    }
    
    /**
     * Get audio context (for use by effects, synthesizer, analyzer)
     */
    getAudioContext() {
        return this.audioContext;
    }
    
    /**
     * Get master gain node
     */
    getMasterGain() {
        return this.masterGain;
    }
    
    /**
     * Get master gain node (alias for compatibility)
     */
    get masterGainNode() {
        return this.masterGain;
    }
    
    /**
     * Connect analyzer to audio output
     */
    connectAnalyzer(analyzer) {
        if (analyzer && this.masterGain) {
            // Connect analyzer node to master gain output
            if (analyzer.getNode) {
                this.masterGain.connect(analyzer.getNode());
                // Analyzer node should also connect to destination to maintain audio flow
                analyzer.getNode().connect(this.destination);
            } else if (analyzer.analyser) {
                this.masterGain.connect(analyzer.analyser);
                analyzer.analyser.connect(this.destination);
            } else if (analyzer.connect) {
                analyzer.connect(this.masterGain);
            }
            console.log('[AudioEngine] Connected analyzer');
        }
    }
    
    /**
     * Disconnect analyzer
     */
    disconnectAnalyzer() {
        // Analyzer disconnection is handled by the analyzer itself
        console.log('[AudioEngine] Disconnected analyzer');
    }
    
    /**
     * Cleanup and dispose
     */
    dispose() {
        this.stopAudio();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.effectsChain = [];
        this.currentBuffer = null;
        this.initialized = false;
    }
}

// Create global instance
window.audioEngine = new AudioEngine();

