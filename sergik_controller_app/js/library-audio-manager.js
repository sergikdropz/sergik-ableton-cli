/**
 * Library Audio Manager
 * Manages audio effects, synthesizer, and analyzer for library items
 */

class LibraryAudioManager {
    constructor() {
        this.currentMediaId = null;
        this.currentMediaType = null;
        this.currentAudioBuffer = null;
        this.activeEffects = new Map();
        this.effectPresets = this.loadPresets();
        this.itemEffectSettings = this.loadItemSettings();
        this.analyzerCanvas = null;
        this.analyzerContext = null;
        this.analyzerAnimationFrame = null;
        this.isInitialized = false;
        
        this.initialize();
    }
    
    async initialize() {
        if (!window.audioEngine) {
            console.warn('[LibraryAudioManager] Audio engine not available');
            return;
        }
        
        // Wait for audio engine to be ready
        if (typeof window.audioEngine.initialize === 'function') {
            await window.audioEngine.initialize();
        }
        
        // Connect analyzer if available
        if (window.audioAnalyzer) {
            window.audioEngine.connectAnalyzer(window.audioAnalyzer);
        }
        
        this.setupUI();
        
        // Initialize UI with default settings
        const defaultSettings = window.audioSettings || window.settingsManager?.settings?.audio || {};
        this.resetToDefaults(defaultSettings);
        
        this.isInitialized = true;
    }
    
    setupUI() {
        // Setup collapsible sections
        document.querySelectorAll('.section-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.toggleSection(section);
            });
        });
        
        // Setup effect toggles
        document.querySelectorAll('.effect-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const effectName = e.target.id.replace('effect-', '').replace('-enabled', '');
                if (e.target.checked) {
                    this.enableEffect(effectName);
                } else {
                    this.disableEffect(effectName);
                }
            });
        });
        
        // Setup effect parameter controls
        this.setupEffectControls();
        
        // Setup synthesizer controls
        this.setupSynthesizerControls();
        
        // Setup analyzer
        this.setupAnalyzer();
        
        // Setup presets
        this.setupPresets();
        
        // Setup range input value displays
        this.setupRangeInputs();
    }
    
    setupEffectControls() {
        // Reverb
        const reverbRoomSize = document.getElementById('effect-reverb-room-size');
        if (reverbRoomSize) {
            reverbRoomSize.addEventListener('input', (e) => {
                this.updateEffectParam('reverb', 'roomSize', parseFloat(e.target.value));
                const valueEl = document.getElementById('reverb-room-size-value');
                if (valueEl) valueEl.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
        
        // Delay
        const delayTime = document.getElementById('effect-delay-time');
        if (delayTime) {
            delayTime.addEventListener('input', (e) => {
                this.updateEffectParam('delay', 'time', parseFloat(e.target.value));
            });
        }
        const delayFeedback = document.getElementById('effect-delay-feedback');
        if (delayFeedback) {
            delayFeedback.addEventListener('input', (e) => {
                this.updateEffectParam('delay', 'feedback', parseFloat(e.target.value));
                const valueEl = document.getElementById('delay-feedback-value');
                if (valueEl) valueEl.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
        
        // EQ
        ['low', 'mid', 'high'].forEach(band => {
            const eqControl = document.getElementById(`effect-eq-${band}`);
            if (eqControl) {
                eqControl.addEventListener('input', (e) => {
                    this.updateEffectParam('eq', `${band}Gain`, parseFloat(e.target.value));
                });
            }
        });
        
        // Compressor
        const compressorThreshold = document.getElementById('effect-compressor-threshold');
        if (compressorThreshold) {
            compressorThreshold.addEventListener('input', (e) => {
                this.updateEffectParam('compressor', 'threshold', parseFloat(e.target.value));
            });
        }
        const compressorRatio = document.getElementById('effect-compressor-ratio');
        if (compressorRatio) {
            compressorRatio.addEventListener('input', (e) => {
                this.updateEffectParam('compressor', 'ratio', parseFloat(e.target.value));
            });
        }
        
        // Distortion
        const distortionAmount = document.getElementById('effect-distortion-amount');
        if (distortionAmount) {
            distortionAmount.addEventListener('input', (e) => {
                this.updateEffectParam('distortion', 'amount', parseFloat(e.target.value));
                const valueEl = document.getElementById('distortion-amount-value');
                if (valueEl) valueEl.textContent = `${Math.round(parseFloat(e.target.value))}%`;
            });
        }
        
        // Filter
        const filterFrequency = document.getElementById('effect-filter-frequency');
        if (filterFrequency) {
            filterFrequency.addEventListener('input', (e) => {
                this.updateEffectParam('filter', 'frequency', parseFloat(e.target.value));
            });
        }
        const filterQ = document.getElementById('effect-filter-q');
        if (filterQ) {
            filterQ.addEventListener('input', (e) => {
                this.updateEffectParam('filter', 'q', parseFloat(e.target.value));
            });
        }
        
        // Chorus
        const chorusRate = document.getElementById('effect-chorus-rate');
        if (chorusRate) {
            chorusRate.addEventListener('input', (e) => {
                this.updateEffectParam('chorus', 'rate', parseFloat(e.target.value));
            });
        }
        const chorusDepth = document.getElementById('effect-chorus-depth');
        if (chorusDepth) {
            chorusDepth.addEventListener('input', (e) => {
                this.updateEffectParam('chorus', 'depth', parseFloat(e.target.value));
                const valueEl = document.getElementById('chorus-depth-value');
                if (valueEl) valueEl.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
    }
    
    setupSynthesizerControls() {
        // Synthesizer controls will be set up when MIDI file is selected
        const synthControls = ['max-voices', 'waveform', 'filter-type', 'filter-freq', 'filter-q', 
                              'attack', 'decay', 'sustain', 'release', 'lfo-rate', 'lfo-amount', 'volume'];
        
        synthControls.forEach(control => {
            const element = document.getElementById(`synth-${control}`);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.updateSynthesizerParam(control, e.target.value);
                });
                element.addEventListener('change', (e) => {
                    this.updateSynthesizerParam(control, e.target.value);
                });
            }
        });
    }
    
    setupAnalyzer() {
        const canvas = document.getElementById('analyzer-canvas');
        if (canvas) {
            this.analyzerCanvas = canvas;
            this.analyzerContext = canvas.getContext('2d');
            canvas.width = canvas.offsetWidth;
            canvas.height = 120;
            
            // Start analyzer visualization
            this.startAnalyzer();
        }
        
        // Analyzer controls
        const fftSize = document.getElementById('analyzer-fft-size');
        if (fftSize) {
            fftSize.addEventListener('change', (e) => {
                if (window.audioAnalyzer) {
                    window.audioAnalyzer.setFftSize(parseInt(e.target.value));
                }
            });
        }
        
        const smoothing = document.getElementById('analyzer-smoothing');
        if (smoothing) {
            smoothing.addEventListener('input', (e) => {
                if (window.audioAnalyzer) {
                    window.audioAnalyzer.setSmoothingTimeConstant(parseFloat(e.target.value));
                }
                const valueEl = document.getElementById('analyzer-smoothing-value');
                if (valueEl) valueEl.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
    }
    
    setupPresets() {
        const saveBtn = document.getElementById('preset-save');
        const resetBtn = document.getElementById('preset-reset');
        const presetSelect = document.getElementById('preset-select');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCurrentPreset();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetEffects();
            });
        }
        
        if (presetSelect) {
            presetSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadPreset(e.target.value);
                }
            });
        }
        
        this.updatePresetList();
    }
    
    setupRangeInputs() {
        // Synth sustain
        const synthSustain = document.getElementById('synth-sustain');
        const synthSustainValue = document.getElementById('synth-sustain-value');
        if (synthSustain && synthSustainValue) {
            synthSustain.addEventListener('input', (e) => {
                synthSustainValue.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
        
        // Synth LFO amount
        const synthLfoAmount = document.getElementById('synth-lfo-amount');
        const synthLfoAmountValue = document.getElementById('synth-lfo-amount-value');
        if (synthLfoAmount && synthLfoAmountValue) {
            synthLfoAmount.addEventListener('input', (e) => {
                synthLfoAmountValue.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
        
        // Synth volume
        const synthVolume = document.getElementById('synth-volume');
        const synthVolumeValue = document.getElementById('synth-volume-value');
        if (synthVolume && synthVolumeValue) {
            synthVolume.addEventListener('input', (e) => {
                synthVolumeValue.textContent = `${Math.round(parseFloat(e.target.value) * 100)}%`;
            });
        }
    }
    
    async selectMediaItem(mediaId, mediaType) {
        this.currentMediaId = mediaId;
        this.currentMediaType = mediaType;
        
        if (!window.audioEngine) {
            console.warn('[LibraryAudioManager] Audio engine not available');
            return;
        }
        
        // Load saved settings for this item
        const savedSettings = this.itemEffectSettings[mediaId];
        if (savedSettings) {
            this.applySettings(savedSettings);
        } else {
            // Load defaults from audio settings and populate UI
            const defaultSettings = window.audioSettings || window.settingsManager?.settings?.audio || {};
            this.resetToDefaults(defaultSettings);
        }
        
        // Show/hide synthesizer section based on media type
        const synthSection = document.getElementById('synthesizer-section');
        if (synthSection) {
            synthSection.style.display = mediaType === 'midi' ? 'block' : 'none';
        }
        
        // If audio file, load into audio engine
        if (mediaType === 'audio' && window.audioEngine) {
            try {
                // Get media path from DOM
                const mediaItem = document.querySelector(`[data-media-id="${mediaId}"]`);
                const mediaPath = mediaItem?.dataset.mediaPath || mediaId;
                
                if (mediaPath && (mediaPath.includes('/') || mediaPath.includes('\\'))) {
                    // Load audio file
                    this.currentAudioBuffer = await window.audioEngine.loadAudioBuffer(mediaPath);
                }
            } catch (error) {
                console.error('[LibraryAudioManager] Failed to load audio:', error);
            }
        }
    }
    
    enableEffect(effectName) {
        if (!window.audioEngine) return;
        
        // Get default settings from global audio settings
        const defaultSettings = window.audioSettings || window.settingsManager?.settings?.audio || {};
        const effectDefaults = this.getEffectDefaults(effectName, defaultSettings);
        
        // Get effect class from AudioEffects factory
        const effectClassMap = {
            'reverb': 'Reverb',
            'delay': 'Delay',
            'eq': 'EQ',
            'compressor': 'Compressor',
            'distortion': 'Distortion',
            'filter': 'Filter',
            'chorus': 'Chorus'
        };
        
        const effectKey = effectClassMap[effectName];
        if (!effectKey || !window.AudioEffects || !window.AudioEffects[effectKey]) {
            console.warn(`[LibraryAudioManager] Effect class not found: ${effectName}`);
            return;
        }
        
        const EffectClass = window.AudioEffects[effectKey];
        const audioContext = window.audioEngine.getAudioContext();
        
        if (!audioContext) {
            console.warn('[LibraryAudioManager] Audio context not available');
            return;
        }
        
        try {
            // Create effect instance with defaults
            let effect;
            if (effectName === 'reverb') {
                effect = new EffectClass(audioContext, effectDefaults.roomSize);
            } else if (effectName === 'delay') {
                effect = new EffectClass(audioContext, effectDefaults.time, effectDefaults.feedback);
            } else if (effectName === 'eq') {
                // EQ doesn't take constructor params, set after creation
                effect = new EffectClass(audioContext);
                if (effect.setLowGain) effect.setLowGain(effectDefaults.lowGain);
                if (effect.setMidGain) effect.setMidGain(effectDefaults.midGain);
                if (effect.setHighGain) effect.setHighGain(effectDefaults.highGain);
            } else if (effectName === 'compressor') {
                effect = new EffectClass(audioContext, effectDefaults.threshold, effectDefaults.ratio);
            } else if (effectName === 'distortion') {
                effect = new EffectClass(audioContext, effectDefaults.amount);
            } else if (effectName === 'filter') {
                effect = new EffectClass(audioContext, 'lowpass', effectDefaults.frequency, effectDefaults.q);
            } else if (effectName === 'chorus') {
                effect = new EffectClass(audioContext, effectDefaults.rate, effectDefaults.depth);
            } else {
                effect = new EffectClass(audioContext);
            }
            
            window.audioEngine.addEffect(effect);
            this.activeEffects.set(effectName, effect);
            
            // Update UI
            const paramsDiv = document.getElementById(`${effectName}-params`);
            if (paramsDiv) {
                paramsDiv.style.display = 'block';
            }
            
            // Update UI controls to match effect values
            this.updateEffectUI(effectName, effect);
            
            // Auto-save settings for current item
            if (this.currentMediaId) {
                this.saveItemSettings();
            }
        } catch (error) {
            console.error(`[LibraryAudioManager] Failed to enable effect ${effectName}:`, error);
        }
    }
    
    updateEffectUI(effectName, effect) {
        // Update UI controls to reflect effect parameter values
        if (effectName === 'reverb' && effect.roomSize !== undefined) {
            const slider = document.getElementById('effect-reverb-room-size');
            if (slider) {
                slider.value = effect.roomSize;
                const valueEl = document.getElementById('reverb-room-size-value');
                if (valueEl) valueEl.textContent = effect.roomSize.toFixed(2);
            }
        } else if (effectName === 'delay') {
            if (effect.delayTime !== undefined) {
                const input = document.getElementById('effect-delay-time');
                if (input) input.value = effect.delayTime;
            }
            if (effect.feedback !== undefined) {
                const slider = document.getElementById('effect-delay-feedback');
                if (slider) {
                    slider.value = effect.feedback;
                    const valueEl = document.getElementById('delay-feedback-value');
                    if (valueEl) valueEl.textContent = effect.feedback.toFixed(2);
                }
            }
        } else if (effectName === 'eq') {
            if (effect.lowGain !== undefined) {
                const input = document.getElementById('effect-eq-low');
                if (input) input.value = effect.lowGain;
            }
            if (effect.midGain !== undefined) {
                const input = document.getElementById('effect-eq-mid');
                if (input) input.value = effect.midGain;
            }
            if (effect.highGain !== undefined) {
                const input = document.getElementById('effect-eq-high');
                if (input) input.value = effect.highGain;
            }
        } else if (effectName === 'compressor') {
            if (effect.threshold !== undefined) {
                const input = document.getElementById('effect-compressor-threshold');
                if (input) input.value = effect.threshold;
            }
            if (effect.ratio !== undefined) {
                const input = document.getElementById('effect-compressor-ratio');
                if (input) input.value = effect.ratio;
            }
        } else if (effectName === 'distortion') {
            if (effect.amount !== undefined) {
                const slider = document.getElementById('effect-distortion-amount');
                if (slider) {
                    slider.value = effect.amount;
                    const valueEl = document.getElementById('distortion-amount-value');
                    if (valueEl) valueEl.textContent = `${Math.round(effect.amount)}%`;
                }
            }
        } else if (effectName === 'filter') {
            if (effect.frequency !== undefined) {
                const input = document.getElementById('effect-filter-frequency');
                if (input) input.value = effect.frequency;
            }
            if (effect.q !== undefined) {
                const input = document.getElementById('effect-filter-q');
                if (input) input.value = effect.q;
            }
        } else if (effectName === 'chorus') {
            if (effect.rate !== undefined) {
                const input = document.getElementById('effect-chorus-rate');
                if (input) input.value = effect.rate;
            }
            if (effect.depth !== undefined) {
                const slider = document.getElementById('effect-chorus-depth');
                if (slider) {
                    slider.value = effect.depth;
                    const valueEl = document.getElementById('chorus-depth-value');
                    if (valueEl) valueEl.textContent = effect.depth.toFixed(2);
                }
            }
        }
    }
    
    disableEffect(effectName) {
        const effect = this.activeEffects.get(effectName);
        if (effect && window.audioEngine) {
            window.audioEngine.removeEffect(effect);
            this.activeEffects.delete(effectName);
            
            // Update UI
            const paramsDiv = document.getElementById(`${effectName}-params`);
            if (paramsDiv) {
                paramsDiv.style.display = 'none';
            }
            
            // Auto-save settings for current item
            if (this.currentMediaId) {
                this.saveItemSettings();
            }
        }
    }
    
    updateEffectParam(effectName, paramName, value) {
        const effect = this.activeEffects.get(effectName);
        if (!effect) return;
        
        // Map parameter names to setter methods
        const paramMap = {
            'roomSize': 'setRoomSize',
            'time': 'setDelayTime',
            'feedback': 'setFeedback',
            'lowGain': 'setLowGain',
            'midGain': 'setMidGain',
            'highGain': 'setHighGain',
            'threshold': 'setThreshold',
            'ratio': 'setRatio',
            'amount': 'setAmount',
            'frequency': 'setFrequency',
            'q': 'setQ',
            'rate': 'setRate',
            'depth': 'setDepth'
        };
        
        const setterName = paramMap[paramName];
        if (setterName && typeof effect[setterName] === 'function') {
            effect[setterName](value);
        } else {
            // Fallback: try camelCase setter
            const camelCaseSetter = `set${paramName.charAt(0).toUpperCase() + paramName.slice(1)}`;
            if (typeof effect[camelCaseSetter] === 'function') {
                effect[camelCaseSetter](value);
            } else if (effect[paramName] !== undefined) {
                effect[paramName] = value;
            } else {
                console.warn(`[LibraryAudioManager] Could not set parameter ${paramName} on effect ${effectName}`);
            }
        }
        
        // Auto-save settings for current item
        if (this.currentMediaId) {
            this.saveItemSettings();
        }
    }
    
    updateSynthesizerParam(paramName, value) {
        if (!window.audioSynthesizer) return;
        
        // Map parameter names to setter methods
        const paramMap = {
            'max-voices': 'setMaxVoices',
            'waveform': 'setWaveform',
            'filter-type': 'setFilterType',
            'filter-freq': 'setFilterFreq',
            'filter-q': 'setFilterQ',
            'attack': 'setAttack',
            'decay': 'setDecay',
            'sustain': 'setSustain',
            'release': 'setRelease',
            'lfo-rate': 'setLfoRate',
            'lfo-amount': 'setLfoAmount',
            'volume': 'setVolume'
        };
        
        const methodName = paramMap[paramName] || `set${paramName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`;
        
        if (typeof window.audioSynthesizer[methodName] === 'function') {
            // Convert value to appropriate type
            const numValue = paramName === 'waveform' || paramName === 'filter-type' ? value : parseFloat(value);
            window.audioSynthesizer[methodName](numValue);
        } else {
            console.warn(`[LibraryAudioManager] Synthesizer method not found: ${methodName}`);
        }
        
        // Auto-save settings for current item
        if (this.currentMediaId) {
            this.saveItemSettings();
        }
    }
    
    getEffectClass(effectName) {
        const effectMap = {
            'reverb': 'ReverbEffect',
            'delay': 'DelayEffect',
            'eq': 'EQEffect',
            'compressor': 'CompressorEffect',
            'distortion': 'DistortionEffect',
            'filter': 'FilterEffect',
            'chorus': 'ChorusEffect'
        };
        // Check if effect is available in window or in AudioEffects
        const className = effectMap[effectName];
        if (className && window[className]) {
            return className;
        }
        // Try alternative names
        const altMap = {
            'reverb': 'Reverb',
            'delay': 'Delay',
            'eq': 'EQ',
            'compressor': 'Compressor',
            'distortion': 'Distortion',
            'filter': 'Filter',
            'chorus': 'Chorus'
        };
        const altName = altMap[effectName];
        if (altName && window.AudioEffects && window.AudioEffects[altName]) {
            return window.AudioEffects[altName];
        }
        return null;
    }
    
    getEffectDefaults(effectName, globalSettings) {
        const defaults = {
            reverb: { roomSize: globalSettings.reverbRoomSize || 0.5 },
            delay: { time: globalSettings.delayTime || 0.3, feedback: globalSettings.delayFeedback || 0.3 },
            eq: { lowGain: globalSettings.eqLowGain || 0, midGain: globalSettings.eqMidGain || 0, highGain: globalSettings.eqHighGain || 0 },
            compressor: { threshold: globalSettings.compressorThreshold || -24, ratio: globalSettings.compressorRatio || 12 },
            distortion: { amount: globalSettings.distortionAmount || 50 },
            filter: { frequency: globalSettings.filterFrequency || 1000, q: globalSettings.filterQ || 1 },
            chorus: { rate: globalSettings.chorusRate || 1.5, depth: globalSettings.chorusDepth || 0.7 }
        };
        return defaults[effectName] || {};
    }
    
    resetEffects() {
        // Disable all effects
        this.activeEffects.forEach((effect, name) => {
            this.disableEffect(name);
        });
        
        // Reset UI checkboxes
        document.querySelectorAll('.effect-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset parameter values to defaults from audio settings
        const defaultSettings = window.audioSettings || window.settingsManager?.settings?.audio || {};
        this.resetToDefaults(defaultSettings);
    }
    
    resetToDefaults(defaultSettings) {
        // Reset effect parameter UI controls to default values
        const reverbRoomSize = document.getElementById('effect-reverb-room-size');
        if (reverbRoomSize) {
            const value = defaultSettings.reverbRoomSize !== undefined ? defaultSettings.reverbRoomSize : 0.5;
            reverbRoomSize.value = value;
            const valueEl = document.getElementById('reverb-room-size-value');
            if (valueEl) valueEl.textContent = value.toFixed(2);
        }
        
        const delayTime = document.getElementById('effect-delay-time');
        if (delayTime) {
            delayTime.value = defaultSettings.delayTime !== undefined ? defaultSettings.delayTime : 0.3;
        }
        
        const delayFeedback = document.getElementById('effect-delay-feedback');
        if (delayFeedback) {
            const value = defaultSettings.delayFeedback !== undefined ? defaultSettings.delayFeedback : 0.3;
            delayFeedback.value = value;
            const valueEl = document.getElementById('delay-feedback-value');
            if (valueEl) valueEl.textContent = value.toFixed(2);
        }
        
        ['low', 'mid', 'high'].forEach(band => {
            const eqControl = document.getElementById(`effect-eq-${band}`);
            if (eqControl) {
                const settingKey = `eq${band.charAt(0).toUpperCase() + band.slice(1)}Gain`;
                eqControl.value = defaultSettings[settingKey] !== undefined ? defaultSettings[settingKey] : 0;
            }
        });
        
        const compressorThreshold = document.getElementById('effect-compressor-threshold');
        if (compressorThreshold) {
            compressorThreshold.value = defaultSettings.compressorThreshold !== undefined ? defaultSettings.compressorThreshold : -24;
        }
        
        const compressorRatio = document.getElementById('effect-compressor-ratio');
        if (compressorRatio) {
            compressorRatio.value = defaultSettings.compressorRatio !== undefined ? defaultSettings.compressorRatio : 12;
        }
        
        const distortionAmount = document.getElementById('effect-distortion-amount');
        if (distortionAmount) {
            const value = defaultSettings.distortionAmount !== undefined ? defaultSettings.distortionAmount : 50;
            distortionAmount.value = value;
            const valueEl = document.getElementById('distortion-amount-value');
            if (valueEl) valueEl.textContent = `${Math.round(value)}%`;
        }
        
        const filterFrequency = document.getElementById('effect-filter-frequency');
        if (filterFrequency) {
            filterFrequency.value = defaultSettings.filterFrequency !== undefined ? defaultSettings.filterFrequency : 1000;
        }
        
        const filterQ = document.getElementById('effect-filter-q');
        if (filterQ) {
            filterQ.value = defaultSettings.filterQ !== undefined ? defaultSettings.filterQ : 1;
        }
        
        const chorusRate = document.getElementById('effect-chorus-rate');
        if (chorusRate) {
            chorusRate.value = defaultSettings.chorusRate !== undefined ? defaultSettings.chorusRate : 1.5;
        }
        
        const chorusDepth = document.getElementById('effect-chorus-depth');
        if (chorusDepth) {
            const value = defaultSettings.chorusDepth !== undefined ? defaultSettings.chorusDepth : 0.7;
            chorusDepth.value = value;
            const valueEl = document.getElementById('chorus-depth-value');
            if (valueEl) valueEl.textContent = value.toFixed(2);
        }
        
        // Reset synthesizer controls
        const synthControls = {
            'max-voices': defaultSettings.synthMaxVoices !== undefined ? defaultSettings.synthMaxVoices : 8,
            'waveform': defaultSettings.synthWaveform || 'sine',
            'filter-type': defaultSettings.synthFilterType || 'lowpass',
            'filter-freq': defaultSettings.synthFilterFreq !== undefined ? defaultSettings.synthFilterFreq : 2000,
            'filter-q': defaultSettings.synthFilterQ !== undefined ? defaultSettings.synthFilterQ : 1,
            'attack': defaultSettings.synthAttack !== undefined ? defaultSettings.synthAttack : 0.01,
            'decay': defaultSettings.synthDecay !== undefined ? defaultSettings.synthDecay : 0.1,
            'sustain': defaultSettings.synthSustain !== undefined ? defaultSettings.synthSustain : 0.7,
            'release': defaultSettings.synthRelease !== undefined ? defaultSettings.synthRelease : 0.3,
            'lfo-rate': defaultSettings.synthLfoRate !== undefined ? defaultSettings.synthLfoRate : 0,
            'lfo-amount': defaultSettings.synthLfoAmount !== undefined ? defaultSettings.synthLfoAmount : 0,
            'volume': defaultSettings.synthVolume !== undefined ? defaultSettings.synthVolume : 0.3
        };
        
        Object.entries(synthControls).forEach(([control, value]) => {
            const element = document.getElementById(`synth-${control}`);
            if (element) {
                element.value = value;
                // Update value displays for range inputs
                if (control === 'sustain') {
                    const valueEl = document.getElementById('synth-sustain-value');
                    if (valueEl) valueEl.textContent = value.toFixed(2);
                } else if (control === 'lfo-amount') {
                    const valueEl = document.getElementById('synth-lfo-amount-value');
                    if (valueEl) valueEl.textContent = value.toFixed(2);
                } else if (control === 'volume') {
                    const valueEl = document.getElementById('synth-volume-value');
                    if (valueEl) valueEl.textContent = `${Math.round(value * 100)}%`;
                }
            }
        });
        
        // Reset analyzer controls
        const analyzerFftSize = document.getElementById('analyzer-fft-size');
        if (analyzerFftSize) {
            analyzerFftSize.value = defaultSettings.analyzerFftSize !== undefined ? defaultSettings.analyzerFftSize : 2048;
        }
        
        const analyzerSmoothing = document.getElementById('analyzer-smoothing');
        if (analyzerSmoothing) {
            const value = defaultSettings.analyzerSmoothing !== undefined ? defaultSettings.analyzerSmoothing : 0.8;
            analyzerSmoothing.value = value;
            const valueEl = document.getElementById('analyzer-smoothing-value');
            if (valueEl) valueEl.textContent = value.toFixed(2);
        }
    }
    
    applySettings(settings) {
        // Apply effect settings
        if (settings.effects) {
            Object.entries(settings.effects).forEach(([name, params]) => {
                if (params.enabled) {
                    this.enableEffect(name);
                    Object.entries(params).forEach(([param, value]) => {
                        if (param !== 'enabled') {
                            this.updateEffectParam(name, param, value);
                        }
                    });
                }
            });
        }
        
        // Apply synthesizer settings
        if (settings.synthesizer && window.audioSynthesizer) {
            Object.entries(settings.synthesizer).forEach(([param, value]) => {
                this.updateSynthesizerParam(param, value);
            });
        }
    }
    
    getEffectSettings() {
        const settings = {
            effects: {},
            synthesizer: {}
        };
        
        // Get active effects
        this.activeEffects.forEach((effect, name) => {
            settings.effects[name] = {
                enabled: true,
                ...this.getEffectParams(effect, name)
            };
        });
        
        // Get synthesizer settings
        if (window.audioSynthesizer) {
            settings.synthesizer = this.getSynthesizerParams();
        }
        
        return settings;
    }
    
    getEffectParams(effect, effectName) {
        const params = {};
        // Extract parameters from effect object
        if (effect.roomSize !== undefined) params.roomSize = effect.roomSize;
        if (effect.time !== undefined) params.time = effect.time;
        if (effect.feedback !== undefined) params.feedback = effect.feedback;
        if (effect.lowGain !== undefined) params.lowGain = effect.lowGain;
        if (effect.midGain !== undefined) params.midGain = effect.midGain;
        if (effect.highGain !== undefined) params.highGain = effect.highGain;
        if (effect.threshold !== undefined) params.threshold = effect.threshold;
        if (effect.ratio !== undefined) params.ratio = effect.ratio;
        if (effect.amount !== undefined) params.amount = effect.amount;
        if (effect.frequency !== undefined) params.frequency = effect.frequency;
        if (effect.q !== undefined) params.q = effect.q;
        if (effect.rate !== undefined) params.rate = effect.rate;
        if (effect.depth !== undefined) params.depth = effect.depth;
        return params;
    }
    
    getSynthesizerParams() {
        const params = {};
        const controls = ['max-voices', 'waveform', 'filter-type', 'filter-freq', 'filter-q',
                         'attack', 'decay', 'sustain', 'release', 'lfo-rate', 'lfo-amount', 'volume'];
        controls.forEach(control => {
            const element = document.getElementById(`synth-${control}`);
            if (element) {
                // Keep hyphenated names to match updateSynthesizerParam mapping
                params[control] = element.type === 'range' || element.type === 'number' 
                    ? parseFloat(element.value) 
                    : element.value;
            }
        });
        return params;
    }
    
    saveCurrentPreset() {
        const nameInput = document.getElementById('preset-name-input');
        if (!nameInput || !nameInput.value.trim()) {
            alert('Please enter a preset name');
            return;
        }
        
        const presetName = nameInput.value.trim();
        const settings = this.getEffectSettings();
        
        const preset = {
            name: presetName,
            mediaId: this.currentMediaId || null,
            settings: settings,
            timestamp: Date.now()
        };
        
        this.effectPresets.push(preset);
        this.savePresets();
        this.updatePresetList();
        nameInput.value = '';
        
        if (window.showNotification) {
            window.showNotification(`Preset "${presetName}" saved`, 'success', 2000);
        }
    }
    
    loadPreset(presetName) {
        const preset = this.effectPresets.find(p => p.name === presetName);
        if (!preset) return;
        
        this.applySettings(preset.settings);
        this.updatePresetList();
    }
    
    saveItemSettings() {
        if (!this.currentMediaId) return;
        
        const settings = this.getEffectSettings();
        this.itemEffectSettings[this.currentMediaId] = settings;
        this.persistItemSettings();
    }
    
    persistItemSettings() {
        try {
            localStorage.setItem('library-item-effects', JSON.stringify(this.itemEffectSettings));
        } catch (error) {
            console.error('[LibraryAudioManager] Failed to save item settings:', error);
        }
    }
    
    updatePresetList() {
        const presetSelect = document.getElementById('preset-select');
        if (!presetSelect) return;
        
        presetSelect.innerHTML = '<option value="">Load Preset...</option>';
        
        // Add global presets (no mediaId)
        const globalPresets = this.effectPresets.filter(p => !p.mediaId);
        globalPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            presetSelect.appendChild(option);
        });
        
        // Add item-specific presets
        if (this.currentMediaId) {
            const itemPresets = this.effectPresets.filter(p => p.mediaId === this.currentMediaId);
            if (itemPresets.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = 'Item Presets';
                itemPresets.forEach(preset => {
                    const option = document.createElement('option');
                    option.value = preset.name;
                    option.textContent = preset.name;
                    optgroup.appendChild(option);
                });
                presetSelect.appendChild(optgroup);
            }
        }
    }
    
    toggleSection(sectionName) {
        const section = document.querySelector(`[data-section="${sectionName}"]`);
        const content = section?.querySelector('.section-content');
        const toggle = section?.querySelector('.section-toggle');
        
        if (content && toggle) {
            const isExpanded = content.style.display !== 'none';
            content.style.display = isExpanded ? 'none' : 'block';
            toggle.textContent = isExpanded ? '▶' : '▼';
        }
    }
    
    startAnalyzer() {
        if (!this.analyzerCanvas || !window.audioAnalyzer) return;
        
        const draw = () => {
            if (!this.analyzerCanvas || !window.audioAnalyzer) return;
            
            const ctx = this.analyzerContext;
            const canvas = this.analyzerCanvas;
            const width = canvas.width;
            const height = canvas.height;
            
            // Get frequency data
            const frequencyData = window.audioAnalyzer.getFrequencyData();
            
            // Clear canvas
            ctx.fillStyle = 'var(--bg-dark)';
            ctx.fillRect(0, 0, width, height);
            
            // Draw frequency bars
            const barWidth = width / frequencyData.length;
            ctx.fillStyle = 'var(--accent-cyan)';
            
            frequencyData.forEach((value, i) => {
                const barHeight = (value / 255) * height;
                ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
            });
            
            this.analyzerAnimationFrame = requestAnimationFrame(draw);
        };
        
        draw();
    }
    
    stopAnalyzer() {
        if (this.analyzerAnimationFrame) {
            cancelAnimationFrame(this.analyzerAnimationFrame);
            this.analyzerAnimationFrame = null;
        }
    }
    
    loadPresets() {
        try {
            const stored = localStorage.getItem('library-effect-presets');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[LibraryAudioManager] Failed to load presets:', error);
            return [];
        }
    }
    
    savePresets() {
        try {
            localStorage.setItem('library-effect-presets', JSON.stringify(this.effectPresets));
        } catch (error) {
            console.error('[LibraryAudioManager] Failed to save presets:', error);
        }
    }
    
    loadItemSettings() {
        try {
            const stored = localStorage.getItem('library-item-effects');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('[LibraryAudioManager] Failed to load item settings:', error);
            return {};
        }
    }
}

// Export for use in renderer
if (typeof window !== 'undefined') {
    window.LibraryAudioManager = LibraryAudioManager;
}

