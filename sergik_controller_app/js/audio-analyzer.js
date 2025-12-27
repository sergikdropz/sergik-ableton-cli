/**
 * SERGIK AI Controller - Audio Analyzer
 * 
 * Real-time audio analysis and visualization using Web Audio API.
 */

class AudioAnalyzer {
    constructor(audioContext, options = {}) {
        this.audioContext = audioContext;
        this.options = {
            fftSize: options.fftSize || 2048,
            smoothingTimeConstant: options.smoothingTimeConstant || 0.8,
            minDecibels: options.minDecibels || -100,
            maxDecibels: options.maxDecibels || -30
        };
        
        // Create analyser node
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = this.options.fftSize;
        this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;
        this.analyser.minDecibels = this.options.minDecibels;
        this.analyser.maxDecibels = this.options.maxDecibels;
        
        // Data arrays
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
        
        // Analysis results
        this.waveform = [];
        this.spectrum = [];
        this.peakLevel = 0;
        this.rmsLevel = 0;
        this.bpm = null;
        this.pitch = null;
        
        // Visualization update
        this.animationFrameId = null;
        this.isAnalyzing = false;
    }
    
    /**
     * Connect audio source to analyzer
     */
    connect(source) {
        source.connect(this.analyser);
    }
    
    /**
     * Disconnect from source
     */
    disconnect() {
        this.analyser.disconnect();
    }
    
    /**
     * Get analyser node for connection
     */
    getNode() {
        return this.analyser;
    }
    
    /**
     * Start analyzing
     */
    start() {
        if (this.isAnalyzing) {
            return;
        }
        
        this.isAnalyzing = true;
        this.update();
    }
    
    /**
     * Stop analyzing
     */
    stop() {
        this.isAnalyzing = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Update analysis data
     */
    update() {
        if (!this.isAnalyzing) {
            return;
        }
        
        // Get frequency data (FFT)
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        // Get time domain data (waveform)
        this.analyser.getByteTimeDomainData(this.timeData);
        
        // Convert to normalized arrays
        this.spectrum = Array.from(this.frequencyData).map(v => v / 255);
        this.waveform = Array.from(this.timeData).map(v => (v - 128) / 128);
        
        // Calculate levels
        this.calculateLevels();
        
        // Detect BPM (simplified)
        this.detectBPM();
        
        // Detect pitch
        this.detectPitch();
        
        // Continue updating
        this.animationFrameId = requestAnimationFrame(() => this.update());
        
        // Trigger callback if set
        if (this.onUpdate) {
            this.onUpdate({
                waveform: this.waveform,
                spectrum: this.spectrum,
                peakLevel: this.peakLevel,
                rmsLevel: this.rmsLevel,
                bpm: this.bpm,
                pitch: this.pitch
            });
        }
    }
    
    /**
     * Calculate peak and RMS levels
     */
    calculateLevels() {
        let sum = 0;
        let peak = 0;
        
        for (let i = 0; i < this.waveform.length; i++) {
            const value = Math.abs(this.waveform[i]);
            sum += value * value;
            peak = Math.max(peak, value);
        }
        
        this.rmsLevel = Math.sqrt(sum / this.waveform.length);
        this.peakLevel = peak;
    }
    
    /**
     * Detect BPM (simplified beat detection)
     */
    detectBPM() {
        // Simple energy-based beat detection
        const energy = this.spectrum.reduce((sum, val) => sum + val, 0) / this.spectrum.length;
        
        // This is a simplified version - real BPM detection would use more sophisticated algorithms
        // For now, we'll estimate based on energy peaks
        if (energy > 0.5) {
            // Estimate BPM based on dominant frequency
            const maxIndex = this.spectrum.indexOf(Math.max(...this.spectrum));
            const frequency = (maxIndex * this.audioContext.sampleRate) / (2 * this.analyser.fftSize);
            
            // Convert frequency to approximate BPM (very rough estimate)
            if (frequency > 0.5 && frequency < 10) {
                this.bpm = Math.round(frequency * 60);
            }
        }
    }
    
    /**
     * Detect fundamental pitch
     */
    detectPitch() {
        // Find peak in frequency spectrum
        let maxValue = 0;
        let maxIndex = 0;
        
        for (let i = 0; i < this.spectrum.length; i++) {
            if (this.spectrum[i] > maxValue) {
                maxValue = this.spectrum[i];
                maxIndex = i;
            }
        }
        
        // Convert to frequency
        const frequency = (maxIndex * this.audioContext.sampleRate) / (2 * this.analyser.fftSize);
        
        // Convert frequency to MIDI note number
        if (frequency > 20 && frequency < 20000) {
            const midiNote = 69 + 12 * Math.log2(frequency / 440);
            this.pitch = {
                frequency: frequency,
                midiNote: Math.round(midiNote),
                noteName: this.midiToNoteName(Math.round(midiNote))
            };
        } else {
            this.pitch = null;
        }
    }
    
    /**
     * Convert MIDI note to note name
     */
    midiToNoteName(midiNote) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const note = notes[midiNote % 12];
        return `${note}${octave}`;
    }
    
    /**
     * Get waveform data
     */
    getWaveform() {
        return this.waveform;
    }
    
    /**
     * Get frequency spectrum data
     */
    getSpectrum() {
        return this.spectrum;
    }
    
    /**
     * Get peak level (0-1)
     */
    getPeakLevel() {
        return this.peakLevel;
    }
    
    /**
     * Get RMS level (0-1)
     */
    getRMSLevel() {
        return this.rmsLevel;
    }
    
    /**
     * Get BPM estimate
     */
    getBPM() {
        return this.bpm;
    }
    
    /**
     * Get pitch information
     */
    getPitch() {
        return this.pitch;
    }
    
    /**
     * Get frequency data (for visualization)
     */
    getFrequencyData() {
        this.analyser.getByteFrequencyData(this.frequencyData);
        return this.frequencyData;
    }
    
    /**
     * Set FFT size
     */
    setFftSize(size) {
        this.options.fftSize = size;
        this.analyser.fftSize = size;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
    }
    
    /**
     * Set smoothing time constant
     */
    setSmoothingTimeConstant(value) {
        this.options.smoothingTimeConstant = value;
        this.analyser.smoothingTimeConstant = value;
    }
    
    /**
     * Draw waveform to canvas
     */
    drawWaveform(canvas, width = null, height = null) {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const w = width || canvas.width;
        const h = height || canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, w, h);
        
        if (this.waveform.length === 0) return;
        
        ctx.strokeStyle = '#00d4aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const sliceWidth = w / this.waveform.length;
        let x = 0;
        
        for (let i = 0; i < this.waveform.length; i++) {
            const v = this.waveform[i];
            const y = (v * h / 2) + (h / 2);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
    }
    
    /**
     * Draw frequency spectrum to canvas
     */
    drawSpectrum(canvas, width = null, height = null) {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const w = width || canvas.width;
        const h = height || canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, w, h);
        
        if (this.spectrum.length === 0) return;
        
        const barWidth = w / this.spectrum.length;
        const barCount = Math.min(this.spectrum.length, 256); // Limit bars for performance
        
        for (let i = 0; i < barCount; i++) {
            const value = this.spectrum[i];
            const barHeight = value * h;
            
            // Color gradient based on frequency
            const hue = (i / barCount) * 240; // Blue to red
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
        }
    }
}

// Export analyzer
window.AudioAnalyzer = AudioAnalyzer;

