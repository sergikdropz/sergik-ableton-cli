/**
 * SERGIK AI Controller - Audio Effects
 * 
 * Real-time audio effects using Web Audio API.
 */

/**
 * Base class for audio effects
 */
class AudioEffect {
    constructor(name, audioContext) {
        this.name = name;
        this.audioContext = audioContext;
        this.node = null;
        this.enabled = true;
    }
    
    connect(input, output) {
        if (this.node && input && output) {
            input.connect(this.node);
            this.node.connect(output);
        }
    }
    
    disconnect() {
        if (this.node) {
            this.node.disconnect();
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

/**
 * Reverb effect using ConvolverNode
 */
class ReverbEffect extends AudioEffect {
    constructor(audioContext, roomSize = 0.5) {
        super('Reverb', audioContext);
        this.roomSize = roomSize;
        this.convolver = audioContext.createConvolver();
        this.node = this.convolver;
        
        // Generate impulse response
        this.generateImpulseResponse(roomSize);
    }
    
    generateImpulseResponse(roomSize) {
        const length = this.audioContext.sampleRate * 2; // 2 seconds
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const n = length - i;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, roomSize);
            }
        }
        
        this.convolver.buffer = impulse;
    }
    
    setRoomSize(roomSize) {
        this.roomSize = Math.max(0, Math.min(1, roomSize));
        this.generateImpulseResponse(this.roomSize);
    }
}

/**
 * Delay effect with feedback
 */
class DelayEffect extends AudioEffect {
    constructor(audioContext, delayTime = 0.3, feedback = 0.3) {
        super('Delay', audioContext);
        this.delayTime = delayTime;
        this.feedback = feedback;
        
        this.delay = audioContext.createDelay(1.0);
        this.feedbackGain = audioContext.createGain();
        this.outputGain = audioContext.createGain();
        
        // Routing: input -> delay -> output
        //          delay -> feedback -> delay (feedback loop)
        this.delay.delayTime.value = delayTime;
        this.feedbackGain.gain.value = feedback;
        this.outputGain.gain.value = 1.0;
        
        this.delay.connect(this.feedbackGain);
        this.feedbackGain.connect(this.delay);
        this.delay.connect(this.outputGain);
        
        this.node = this.outputGain;
    }
    
    setDelayTime(time) {
        this.delayTime = Math.max(0, Math.min(1, time));
        this.delay.delayTime.value = this.delayTime;
    }
    
    setFeedback(feedback) {
        this.feedback = Math.max(0, Math.min(0.95, feedback));
        this.feedbackGain.gain.value = this.feedback;
    }
}

/**
 * Multi-band EQ
 */
class EQEffect extends AudioEffect {
    constructor(audioContext) {
        super('EQ', audioContext);
        
        // Low, mid, high bands
        this.lowFilter = audioContext.createBiquadFilter();
        this.lowFilter.type = 'lowshelf';
        this.lowFilter.frequency.value = 250;
        this.lowFilter.gain.value = 0;
        
        this.midFilter = audioContext.createBiquadFilter();
        this.midFilter.type = 'peaking';
        this.midFilter.frequency.value = 1000;
        this.midFilter.Q.value = 1;
        this.midFilter.gain.value = 0;
        
        this.highFilter = audioContext.createBiquadFilter();
        this.highFilter.type = 'highshelf';
        this.highFilter.frequency.value = 4000;
        this.highFilter.gain.value = 0;
        
        // Chain filters
        this.lowFilter.connect(this.midFilter);
        this.midFilter.connect(this.highFilter);
        
        this.node = this.highFilter;
    }
    
    setLowGain(gain) {
        this.lowFilter.gain.value = Math.max(-40, Math.min(40, gain));
    }
    
    setMidGain(gain) {
        this.midFilter.gain.value = Math.max(-40, Math.min(40, gain));
    }
    
    setHighGain(gain) {
        this.highFilter.gain.value = Math.max(-40, Math.min(40, gain));
    }
}

/**
 * Compressor effect
 */
class CompressorEffect extends AudioEffect {
    constructor(audioContext, threshold = -24, ratio = 12, attack = 0.003, release = 0.25) {
        super('Compressor', audioContext);
        
        this.compressor = audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = threshold;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = ratio;
        this.compressor.attack.value = attack;
        this.compressor.release.value = release;
        
        this.node = this.compressor;
    }
    
    setThreshold(threshold) {
        this.compressor.threshold.value = Math.max(-100, Math.min(0, threshold));
    }
    
    setRatio(ratio) {
        this.compressor.ratio.value = Math.max(1, Math.min(20, ratio));
    }
    
    setAttack(attack) {
        this.compressor.attack.value = Math.max(0, Math.min(1, attack));
    }
    
    setRelease(release) {
        this.compressor.release.value = Math.max(0, Math.min(1, release));
    }
}

/**
 * Distortion effect using wave shaping
 */
class DistortionEffect extends AudioEffect {
    constructor(audioContext, amount = 50) {
        super('Distortion', audioContext);
        this.amount = amount;
        
        this.waveShaper = audioContext.createWaveShaper();
        this.inputGain = audioContext.createGain();
        this.outputGain = audioContext.createGain();
        
        this.inputGain.connect(this.waveShaper);
        this.waveShaper.connect(this.outputGain);
        
        this.node = this.outputGain;
        this.setAmount(amount);
    }
    
    setAmount(amount) {
        this.amount = Math.max(0, Math.min(100, amount));
        
        // Generate distortion curve
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        const amountValue = this.amount / 100;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amountValue) * x * 20 * deg) / (Math.PI + amountValue * Math.abs(x));
        }
        
        this.waveShaper.curve = curve;
        this.waveShaper.oversample = '4x';
        
        // Adjust gain to compensate
        this.inputGain.gain.value = 1 + amountValue * 0.5;
        this.outputGain.gain.value = 1 / (1 + amountValue * 0.5);
    }
}

/**
 * Filter effect (low-pass, high-pass, band-pass)
 */
class FilterEffect extends AudioEffect {
    constructor(audioContext, type = 'lowpass', frequency = 1000, Q = 1) {
        super('Filter', audioContext);
        this.type = type;
        
        this.filter = audioContext.createBiquadFilter();
        this.filter.type = type;
        this.filter.frequency.value = frequency;
        this.filter.Q.value = Q;
        
        this.node = this.filter;
    }
    
    setType(type) {
        if (['lowpass', 'highpass', 'bandpass', 'notch', 'allpass'].includes(type)) {
            this.type = type;
            this.filter.type = type;
        }
    }
    
    setFrequency(frequency) {
        this.filter.frequency.value = Math.max(10, Math.min(22050, frequency));
    }
    
    setQ(Q) {
        this.filter.Q.value = Math.max(0.0001, Math.min(1000, Q));
    }
    
    setResonance(resonance) {
        // Q is related to resonance
        this.setQ(resonance);
    }
}

/**
 * Chorus/Flanger effect
 */
class ChorusEffect extends AudioEffect {
    constructor(audioContext, rate = 1.5, depth = 0.7, delay = 0.005) {
        super('Chorus', audioContext);
        
        this.rate = rate;
        this.depth = depth;
        this.delay = delay;
        
        // Create delay and LFO for modulation
        this.delayNode = audioContext.createDelay(0.1);
        this.delayNode.delayTime.value = delay;
        
        this.lfo = audioContext.createOscillator();
        this.lfo.type = 'sine';
        this.lfo.frequency.value = rate;
        
        this.lfoGain = audioContext.createGain();
        this.lfoGain.gain.value = depth * delay;
        
        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.delayNode.delayTime);
        this.lfo.start();
        
        // Mix dry and wet signals
        this.dryGain = audioContext.createGain();
        this.dryGain.gain.value = 0.5;
        
        this.wetGain = audioContext.createGain();
        this.wetGain.gain.value = 0.5;
        
        this.delayNode.connect(this.wetGain);
        
        // Merge node
        this.merge = audioContext.createGain();
        this.dryGain.connect(this.merge);
        this.wetGain.connect(this.merge);
        
        this.node = this.merge;
    }
    
    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(20, rate));
        this.lfo.frequency.value = this.rate;
    }
    
    setDepth(depth) {
        this.depth = Math.max(0, Math.min(1, depth));
        this.lfoGain.gain.value = this.depth * this.delay;
    }
    
    setDelay(delay) {
        this.delay = Math.max(0.001, Math.min(0.1, delay));
        this.delayNode.delayTime.value = this.delay;
        this.lfoGain.gain.value = this.depth * this.delay;
    }
}

// Export effects factory
window.AudioEffects = {
    Reverb: ReverbEffect,
    Delay: DelayEffect,
    EQ: EQEffect,
    Compressor: CompressorEffect,
    Distortion: DistortionEffect,
    Filter: FilterEffect,
    Chorus: ChorusEffect
};

