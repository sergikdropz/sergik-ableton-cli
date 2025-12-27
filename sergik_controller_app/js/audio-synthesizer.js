/**
 * SERGIK AI Controller - Audio Synthesizer
 * 
 * Audio synthesis using Web Audio API with oscillators, filters, envelopes, and LFOs.
 */

/**
 * Synthesizer voice (single note)
 */
class SynthesizerVoice {
    constructor(audioContext, note, velocity = 127, options = {}) {
        this.audioContext = audioContext;
        this.note = note;
        this.velocity = velocity;
        this.options = options;
        
        // Convert MIDI note to frequency
        this.frequency = 440 * Math.pow(2, (note - 69) / 12);
        
        // Create oscillator
        this.oscillator = audioContext.createOscillator();
        this.oscillator.type = options.waveform || 'sine';
        this.oscillator.frequency.value = this.frequency;
        
        // Create gain for envelope
        this.gainNode = audioContext.createGain();
        this.gainNode.gain.value = 0;
        
        // Create filter
        this.filter = audioContext.createBiquadFilter();
        this.filter.type = options.filterType || 'lowpass';
        this.filter.frequency.value = options.filterFreq || 2000;
        this.filter.Q.value = options.filterQ || 1;
        
        // Connect: oscillator -> filter -> gain -> output
        this.oscillator.connect(this.filter);
        this.filter.connect(this.gainNode);
        
        // Envelope parameters
        this.attack = options.attack || 0.01;
        this.decay = options.decay || 0.1;
        this.sustain = options.sustain || 0.7;
        this.release = options.release || 0.3;
        
        // LFO for modulation
        this.lfo = null;
        this.lfoGain = null;
        if (options.lfoRate && options.lfoAmount) {
            this.lfo = audioContext.createOscillator();
            this.lfo.type = 'sine';
            this.lfo.frequency.value = options.lfoRate;
            
            this.lfoGain = audioContext.createGain();
            this.lfoGain.gain.value = options.lfoAmount;
            
            this.lfo.connect(this.lfoGain);
            this.lfoGain.connect(this.oscillator.frequency);
            this.lfo.start();
        }
        
        this.isPlaying = false;
        this.startTime = 0;
    }
    
    /**
     * Start playing the note
     */
    start(outputNode, time = null) {
        if (this.isPlaying) {
            return;
        }
        
        const startTime = time || this.audioContext.currentTime;
        this.startTime = startTime;
        
        // Calculate velocity gain (0 to 1)
        const velocityGain = this.velocity / 127;
        
        // Attack phase
        this.gainNode.gain.setValueAtTime(0, startTime);
        this.gainNode.gain.linearRampToValueAtTime(velocityGain, startTime + this.attack);
        
        // Decay phase
        const sustainLevel = velocityGain * this.sustain;
        this.gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + this.attack + this.decay);
        
        // Connect to output
        this.gainNode.connect(outputNode);
        
        // Start oscillator
        this.oscillator.start(startTime);
        
        this.isPlaying = true;
    }
    
    /**
     * Stop playing the note (release phase)
     */
    stop(time = null) {
        if (!this.isPlaying) {
            return;
        }
        
        const stopTime = time || this.audioContext.currentTime;
        const currentGain = this.gainNode.gain.value;
        
        // Release phase
        this.gainNode.gain.cancelScheduledValues(stopTime);
        this.gainNode.gain.setValueAtTime(currentGain, stopTime);
        this.gainNode.gain.linearRampToValueAtTime(0, stopTime + this.release);
        
        // Stop oscillator after release
        this.oscillator.stop(stopTime + this.release);
        
        if (this.lfo) {
            this.lfo.stop(stopTime + this.release);
        }
        
        // Cleanup
        setTimeout(() => {
            this.oscillator.disconnect();
            this.filter.disconnect();
            this.gainNode.disconnect();
            if (this.lfo) {
                this.lfo.disconnect();
                this.lfoGain.disconnect();
            }
        }, (this.release + 0.1) * 1000);
        
        this.isPlaying = false;
    }
}

/**
 * Synthesizer with polyphony support
 */
class Synthesizer {
    constructor(audioContext, options = {}) {
        this.audioContext = audioContext;
        this.options = {
            maxVoices: options.maxVoices || 8,
            waveform: options.waveform || 'sine',
            filterType: options.filterType || 'lowpass',
            filterFreq: options.filterFreq || 2000,
            filterQ: options.filterQ || 1,
            attack: options.attack || 0.01,
            decay: options.decay || 0.1,
            sustain: options.sustain || 0.7,
            release: options.release || 0.3,
            lfoRate: options.lfoRate || 0,
            lfoAmount: options.lfoAmount || 0
        };
        
        // Active voices
        this.voices = new Map();
        this.outputGain = audioContext.createGain();
        this.outputGain.gain.value = options.volume !== undefined ? options.volume : 0.3; // Use volume from options
    }
    
    /**
     * Play a MIDI note
     */
    playNote(note, velocity = 127, duration = null) {
        // Find available voice slot or reuse oldest
        let voice = null;
        
        if (this.voices.size >= this.options.maxVoices) {
            // Find oldest voice to reuse
            let oldestTime = Infinity;
            let oldestVoice = null;
            
            for (const [noteNum, v] of this.voices) {
                if (v.startTime < oldestTime) {
                    oldestTime = v.startTime;
                    oldestVoice = v;
                }
            }
            
            if (oldestVoice) {
                oldestVoice.stop();
                this.voices.delete(oldestVoice.note);
            }
        }
        
        // Create new voice
        voice = new SynthesizerVoice(this.audioContext, note, velocity, this.options);
        this.voices.set(note, voice);
        
        // Start voice
        voice.start(this.outputGain);
        
        // Auto-stop after duration if specified
        if (duration) {
            setTimeout(() => {
                this.stopNote(note);
            }, duration * 1000);
        }
        
        return voice;
    }
    
    /**
     * Stop a specific note
     */
    stopNote(note) {
        const voice = this.voices.get(note);
        if (voice) {
            voice.stop();
            this.voices.delete(note);
        }
    }
    
    /**
     * Stop all notes
     */
    stopAll() {
        for (const [note, voice] of this.voices) {
            voice.stop();
        }
        this.voices.clear();
    }
    
    /**
     * Set max voices
     */
    setMaxVoices(maxVoices) {
        this.options.maxVoices = Math.max(1, Math.min(32, maxVoices));
    }
    
    /**
     * Set waveform type
     */
    setWaveform(waveform) {
        if (['sine', 'square', 'sawtooth', 'triangle'].includes(waveform)) {
            this.options.waveform = waveform;
        }
    }
    
    /**
     * Set filter type
     */
    setFilterType(type) {
        if (['lowpass', 'highpass', 'bandpass', 'notch', 'allpass'].includes(type)) {
            this.options.filterType = type;
        }
    }
    
    /**
     * Set filter frequency
     */
    setFilterFreq(frequency) {
        this.options.filterFreq = Math.max(10, Math.min(22050, frequency));
    }
    
    /**
     * Set filter Q
     */
    setFilterQ(Q) {
        this.options.filterQ = Math.max(0.0001, Math.min(1000, Q));
    }
    
    /**
     * Set filter parameters
     */
    setFilter(type, frequency, Q) {
        this.setFilterType(type);
        this.setFilterFreq(frequency);
        this.setFilterQ(Q);
    }
    
    /**
     * Set attack time
     */
    setAttack(attack) {
        this.options.attack = Math.max(0, Math.min(2, attack));
    }
    
    /**
     * Set decay time
     */
    setDecay(decay) {
        this.options.decay = Math.max(0, Math.min(2, decay));
    }
    
    /**
     * Set sustain level
     */
    setSustain(sustain) {
        this.options.sustain = Math.max(0, Math.min(1, sustain));
    }
    
    /**
     * Set release time
     */
    setRelease(release) {
        this.options.release = Math.max(0, Math.min(5, release));
    }
    
    /**
     * Set envelope parameters (ADSR)
     */
    setEnvelope(attack, decay, sustain, release) {
        this.setAttack(attack);
        this.setDecay(decay);
        this.setSustain(sustain);
        this.setRelease(release);
    }
    
    /**
     * Set LFO rate
     */
    setLfoRate(rate) {
        this.options.lfoRate = Math.max(0, Math.min(20, rate));
    }
    
    /**
     * Set LFO amount
     */
    setLfoAmount(amount) {
        this.options.lfoAmount = Math.max(0, Math.min(1, amount));
    }
    
    /**
     * Set LFO parameters
     */
    setLFO(rate, amount) {
        this.setLfoRate(rate);
        this.setLfoAmount(amount);
    }
    
    /**
     * Set output volume
     */
    setVolume(volume) {
        this.outputGain.gain.value = Math.max(0, Math.min(1, volume));
    }
    
    /**
     * Get output node for connection
     */
    getOutput() {
        return this.outputGain;
    }
    
    /**
     * Connect to destination or another node
     */
    connect(destination) {
        this.outputGain.connect(destination);
    }
    
    /**
     * Disconnect from destination
     */
    disconnect() {
        this.outputGain.disconnect();
    }
}

// Export synthesizer
window.Synthesizer = Synthesizer;

