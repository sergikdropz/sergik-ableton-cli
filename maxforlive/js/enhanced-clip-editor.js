/**
 * Enhanced Clip Editor Panel
 * Comprehensive Ableton Live-style clip editor with interactive knobs,
 * collapsible sections, enhanced waveform and piano roll editors
 */

// ============================================================================
// Parameter Knob Component
// ============================================================================

export class ParameterKnob {
    constructor(element, options = {}) {
        this.element = element;
        this.min = parseFloat(element.dataset.min) || 0;
        this.max = parseFloat(element.dataset.max) || 100;
        this.value = parseFloat(element.dataset.value) || 0;
        this.step = options.step || (this.max - this.min) / 100;
        this.unit = options.unit || '';
        this.format = options.format || ((v) => v.toFixed(1));
        this.onChange = options.onChange || null;
        
        this.isDragging = false;
        this.startY = 0;
        this.startValue = 0;
        this.debounceTimer = null;
        
        this.init();
    }
    
    init() {
        this.updateDisplay();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.element.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        
        // Double-click to reset
        this.element.addEventListener('dblclick', () => this.reset());
        
        // Mouse wheel
        this.element.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -this.step : this.step;
            this.setValue(this.value + delta);
        });
        
        // Keyboard shortcuts
        this.element.addEventListener('keydown', (e) => {
            if (e.key === 'Home') {
                e.preventDefault();
                this.setValue(this.min);
            } else if (e.key === 'End') {
                e.preventDefault();
                this.setValue(this.max);
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                this.reset();
            }
        });
        
        // Make focusable
        this.element.setAttribute('tabindex', '0');
    }
    
    startDrag(e) {
        this.isDragging = true;
        this.startY = e.clientY;
        this.startValue = this.value;
        this.element.classList.add('dragging');
        e.preventDefault();
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const deltaY = this.startY - e.clientY;
        const range = this.max - this.min;
        const sensitivity = range / 200; // Pixels to value ratio
        const newValue = this.startValue + (deltaY * sensitivity);
        
        this.setValue(newValue);
    }
    
    endDrag() {
        if (this.isDragging) {
            this.isDragging = false;
            this.element.classList.remove('dragging');
        }
    }
    
    setValue(newValue) {
        const oldValue = this.value;
        this.value = Math.max(this.min, Math.min(this.max, newValue));
        
        if (this.value !== oldValue) {
            this.updateDisplay();
            this.dispatchChange();
        }
    }
    
    updateDisplay() {
        const normalized = (this.value - this.min) / (this.max - this.min);
        const angle = normalized * 270 - 135; // -135 to +135 degrees
        
        this.element.style.setProperty('--knob-angle', `${angle}deg`);
        
        const valueDisplay = this.element.querySelector('.knob-value');
        if (valueDisplay) {
            valueDisplay.textContent = `${this.format(this.value)}${this.unit}`;
        }
    }
    
    reset() {
        const defaultValue = parseFloat(this.element.dataset.default) || 0;
        this.setValue(defaultValue);
    }
    
    dispatchChange() {
        // Debounce rapid changes
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const event = new CustomEvent('knobChange', {
                detail: {
                    value: this.value,
                    param: this.element.dataset.param
                }
            });
            this.element.dispatchEvent(event);
            
            if (this.onChange) {
                this.onChange(this.value, this.element.dataset.param);
            }
        }, 16); // ~60fps
    }
    
    getValue() {
        return this.value;
    }
}

// ============================================================================
// Enhanced Waveform Editor
// ============================================================================

export class EnhancedWaveformEditor {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            bpm: options.bpm || 120,
            sampleRate: options.sampleRate || 44100,
            bars: options.bars || 8,
            beatsPerBar: 4,
            ...options
        };
        
        this.waveformData = null;
        this.loopStart = 0;
        this.loopEnd = 1;
        this.selectionStart = null;
        this.selectionEnd = null;
        this.warpMarkers = [];
        this.zoom = 1;
        this.scrollX = 0;
        this.playheadPosition = null;
        this.isSelecting = false;
        this.selectionStartX = null;
        
        this.setupCanvas();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        const resizeObserver = new ResizeObserver(() => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.render();
        });
        resizeObserver.observe(this.canvas);
        
        // Initial size
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    setWaveformData(data) {
        this.waveformData = data;
        this.render();
    }
    
    setBPM(bpm) {
        this.options.bpm = bpm;
        this.render();
    }
    
    setLoopRegion(start, end) {
        this.loopStart = Math.max(0, Math.min(1, start));
        this.loopEnd = Math.max(this.loopStart, Math.min(1, end));
        this.render();
    }
    
    addWarpMarker(time) {
        const marker = {
            time: Math.max(0, Math.min(1, time)),
            beatTime: time * this.options.bars * this.options.beatsPerBar
        };
        this.warpMarkers.push(marker);
        this.warpMarkers.sort((a, b) => a.time - b.time);
        this.render();
        return marker;
    }
    
    removeWarpMarker(index) {
        this.warpMarkers.splice(index, 1);
        this.render();
    }
    
    setPlayhead(position) {
        this.playheadPosition = position;
        this.render();
    }
    
    render() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        
        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        if (!this.waveformData || this.waveformData.length === 0) {
            this.renderPlaceholder();
            return;
        }
        
        // Draw grid
        this.renderGrid();
        
        // Draw waveform
        this.renderWaveform();
        
        // Draw loop region
        this.renderLoopRegion();
        
        // Draw selection
        if (this.selectionStart !== null && this.selectionEnd !== null) {
            this.renderSelection();
        }
        
        // Draw warp markers
        this.renderWarpMarkers();
        
        // Draw playhead
        if (this.playheadPosition !== null) {
            this.renderPlayhead();
        }
    }
    
    renderPlaceholder() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        ctx.fillStyle = '#666666';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('No waveform data', width / 2, height / 2);
    }
    
    renderGrid() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const bars = this.options.bars;
        const beatsPerBar = this.options.beatsPerBar;
        
        // Bar lines (thicker)
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2;
        for (let bar = 0; bar <= bars; bar++) {
            const x = (bar / bars) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Beat lines (lighter)
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        for (let bar = 0; bar < bars; bar++) {
            for (let beat = 1; beat < beatsPerBar; beat++) {
                const x = ((bar + beat / beatsPerBar) / bars) * width;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
        }
    }
    
    renderWaveform() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const samples = this.waveformData;
        const step = width / samples.length;
        const centerY = height / 2;
        const amplitude = height * 0.4;
        
        ctx.strokeStyle = '#00d4aa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        for (let i = 0; i < samples.length; i++) {
            const x = i * step;
            const y = centerY + (samples[i] * amplitude);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
    
    renderLoopRegion() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const startX = this.loopStart * width;
        const endX = this.loopEnd * width;
        
        // Loop region highlight
        ctx.fillStyle = 'rgba(0, 212, 170, 0.1)';
        ctx.fillRect(startX, 0, endX - startX, height);
        
        // Loop brace
        ctx.strokeStyle = '#00d4aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, height);
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, height);
        ctx.stroke();
    }
    
    renderSelection() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const startX = this.selectionStart * width;
        const endX = this.selectionEnd * width;
        
        // Selection highlight
        ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
        ctx.fillRect(startX, 0, endX - startX, height);
        
        // Selection borders
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, height);
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, height);
        ctx.stroke();
    }
    
    renderWarpMarkers() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        
        this.warpMarkers.forEach((marker, index) => {
            const x = marker.time * width;
            
            // Marker line
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            // Marker handle
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(x, height - 8, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Marker index
            ctx.fillStyle = '#1a1a1a';
            ctx.font = '7px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(index.toString(), x, height - 10);
        });
    }
    
    renderPlayhead() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const x = this.playheadPosition * width;
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.startSelection(e));
        this.canvas.addEventListener('mousemove', (e) => this.updateSelection(e));
        this.canvas.addEventListener('mouseup', () => this.endSelection());
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = x / this.canvas.width;
        
        // Add warp marker on Ctrl+Click
        if (e.ctrlKey || e.metaKey) {
            this.addWarpMarker(time);
            this.dispatchEvent('warpMarkerAdded', { time, beatTime: time * this.options.bars * this.options.beatsPerBar });
        } else {
            // Set playhead
            this.setPlayhead(time);
            this.dispatchEvent('playheadMoved', { time });
        }
    }
    
    startSelection(e) {
        if (e.ctrlKey || e.metaKey) return; // Don't start selection if adding warp marker
        
        this.isSelecting = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        this.selectionStartX = x / this.canvas.width;
        this.selectionStart = this.selectionStartX;
        this.selectionEnd = this.selectionStartX;
    }
    
    updateSelection(e) {
        if (!this.isSelecting) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = x / this.canvas.width;
        
        if (time < this.selectionStartX) {
            this.selectionStart = time;
            this.selectionEnd = this.selectionStartX;
        } else {
            this.selectionStart = this.selectionStartX;
            this.selectionEnd = time;
        }
        
        this.render();
    }
    
    endSelection() {
        if (this.isSelecting) {
            this.isSelecting = false;
            if (this.selectionStart === this.selectionEnd) {
                this.selectionStart = null;
                this.selectionEnd = null;
            } else {
                this.dispatchEvent('selectionChanged', {
                    start: this.selectionStart,
                    end: this.selectionEnd
                });
            }
        }
    }
    
    handleRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = x / this.canvas.width;
        
        // Find and remove nearest warp marker
        if (this.warpMarkers.length > 0) {
            const nearest = this.warpMarkers.reduce((prev, curr, index) => {
                const prevDist = Math.abs(prev.time - time);
                const currDist = Math.abs(curr.time - time);
                return currDist < prevDist ? { marker: curr, index } : prev;
            }, { marker: this.warpMarkers[0], index: 0 });
            
            if (Math.abs(nearest.marker.time - time) < 0.02) {
                this.removeWarpMarker(nearest.index);
                this.dispatchEvent('warpMarkerRemoved', { index: nearest.index });
            }
        }
    }
    
    dispatchEvent(name, detail) {
        const event = new CustomEvent(name, { detail });
        this.canvas.dispatchEvent(event);
    }
    
    clearSelection() {
        this.selectionStart = null;
        this.selectionEnd = null;
        this.render();
    }
}

// ============================================================================
// Enhanced Piano Roll Editor
// ============================================================================

export class EnhancedPianoRollEditor {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            bpm: options.bpm || 120,
            bars: options.bars || 8,
            beatsPerBar: 4,
            ...options
        };
        
        this.notes = [];
        this.selectedNotes = new Set();
        this.scale = { root: 'C', type: 'major' };
        this.gridSize = 1/16;
        this.showGrid = true;
        this.showNoteNames = false;
        this.scaleHighlight = false;
        this.foldOctaves = false;
        
        this.setupCanvas();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        const resizeObserver = new ResizeObserver(() => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.render();
        });
        resizeObserver.observe(this.canvas);
        
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    setNotes(notes) {
        this.notes = notes || [];
        this.render();
    }
    
    setScale(root, type) {
        this.scale = { root, type };
        this.render();
    }
    
    setGridSize(size) {
        this.gridSize = size;
        this.render();
    }
    
    setShowGrid(show) {
        this.showGrid = show;
        this.render();
    }
    
    setShowNoteNames(show) {
        this.showNoteNames = show;
        this.render();
    }
    
    setScaleHighlight(show) {
        this.scaleHighlight = show;
        this.render();
    }
    
    render() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        
        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw scale highlight
        if (this.scaleHighlight) {
            this.renderScaleHighlight();
        }
        
        // Draw grid
        if (this.showGrid) {
            this.renderGrid();
        }
        
        // Draw notes
        this.renderNotes();
        
        // Draw selection
        this.renderSelection();
    }
    
    renderGrid() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const bars = this.options.bars;
        const beatsPerBar = this.options.beatsPerBar;
        const totalBeats = bars * beatsPerBar;
        const gridSteps = totalBeats / this.gridSize;
        
        // Vertical grid lines
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridSteps; i++) {
            const x = (i / gridSteps) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Bar lines (thicker)
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2;
        for (let bar = 0; bar <= bars; bar++) {
            const x = (bar / bars) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Horizontal lines (notes)
        const noteHeight = height / 88; // 88 keys
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 88; i++) {
            const y = (i / 88) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Octave lines (thicker)
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
        for (let octave = 0; octave <= 8; octave++) {
            const y = ((88 - (octave * 12)) / 88) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }
    
    renderScaleHighlight() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const scaleNotes = this.getScaleNotes();
        
        ctx.fillStyle = 'rgba(0, 212, 170, 0.1)';
        scaleNotes.forEach(note => {
            const y = ((88 - note) / 88) * height;
            ctx.fillRect(0, y, width, height / 88);
        });
    }
    
    renderNotes() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const bars = this.options.bars;
        const beatsPerBar = this.options.beatsPerBar;
        const totalBeats = bars * beatsPerBar;
        
        this.notes.forEach((note, index) => {
            const isSelected = this.selectedNotes.has(index);
            
            const x = ((note.start || 0) / totalBeats) * width;
            const y = ((88 - note.pitch) / 88) * height;
            const w = ((note.duration || 1) / totalBeats) * width;
            const h = height / 88;
            
            // Note rectangle
            ctx.fillStyle = isSelected ? '#ff6b6b' : '#00d4aa';
            ctx.fillRect(x, y, w, h);
            
            // Note border
            ctx.strokeStyle = isSelected ? '#ff4444' : '#00a88a';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, w, h);
            
            // Note label
            if (this.showNoteNames && w > 20) {
                ctx.fillStyle = '#1a1a1a';
                ctx.font = '8px JetBrains Mono';
                ctx.textAlign = 'center';
                ctx.fillText(this.getNoteName(note.pitch), x + w / 2, y + h / 2 + 3);
            }
        });
    }
    
    renderSelection() {
        // Selection is handled in renderNotes with color coding
    }
    
    getNoteName(midiNote) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const note = notes[midiNote % 12];
        return `${note}${octave}`;
    }
    
    getScaleNotes() {
        const scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            dorian: [0, 2, 3, 5, 7, 9, 10],
            phrygian: [0, 1, 3, 5, 7, 8, 10],
            lydian: [0, 2, 4, 6, 7, 9, 11],
            mixolydian: [0, 2, 4, 5, 7, 9, 10],
            locrian: [0, 1, 3, 5, 6, 8, 10]
        };
        
        const intervals = scales[this.scale.type] || scales.major;
        const rootNote = this.getRootMidiNote(this.scale.root);
        
        // Generate all octaves
        const scaleNotes = [];
        for (let octave = 0; octave < 8; octave++) {
            intervals.forEach(interval => {
                scaleNotes.push(rootNote + (octave * 12) + interval);
            });
        }
        
        return scaleNotes.filter(note => note >= 0 && note <= 127);
    }
    
    getRootMidiNote(root) {
        const roots = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'E#': 5,
            'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        return (roots[root] || 0) + 60; // C4 = MIDI 60
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.canvas.addEventListener('mousemove', (e) => this.drag(e));
        this.canvas.addEventListener('mouseup', () => this.endDrag());
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find clicked note
        const clickedNote = this.findNoteAt(x, y);
        
        if (e.shiftKey) {
            // Add to selection
            if (clickedNote !== null) {
                this.selectedNotes.add(clickedNote);
            }
        } else {
            // Replace selection
            this.selectedNotes.clear();
            if (clickedNote !== null) {
                this.selectedNotes.add(clickedNote);
            }
        }
        
        this.render();
    }
    
    findNoteAt(x, y) {
        const { width, height } = this.canvas;
        const bars = this.options.bars;
        const beatsPerBar = this.options.beatsPerBar;
        const totalBeats = bars * beatsPerBar;
        
        const time = (x / width) * totalBeats;
        const pitch = 88 - Math.floor((y / height) * 88);
        
        return this.notes.findIndex(note => {
            const noteStart = note.start || 0;
            const noteEnd = noteStart + (note.duration || 1);
            const noteTop = ((88 - note.pitch) / 88) * height;
            const noteBottom = noteTop + (height / 88);
            
            return time >= noteStart && time <= noteEnd && y >= noteTop && y <= noteBottom;
        });
    }
    
    startDrag(e) {
        // Implementation for dragging notes
    }
    
    drag(e) {
        // Implementation for dragging notes
    }
    
    endDrag() {
        // Implementation for ending drag
    }
    
    // Transform operations
    transpose(interval) {
        this.selectedNotes.forEach(index => {
            if (this.notes[index]) {
                this.notes[index].pitch += interval;
                this.notes[index].pitch = Math.max(0, Math.min(127, this.notes[index].pitch));
            }
        });
        this.render();
        this.dispatchEvent('notesTransposed', { interval });
    }
    
    quantize() {
        const gridBeats = this.gridSize;
        this.selectedNotes.forEach(index => {
            if (this.notes[index]) {
                const note = this.notes[index];
                note.start = Math.round(note.start / gridBeats) * gridBeats;
            }
        });
        this.render();
        this.dispatchEvent('notesQuantized', { gridSize: gridBeats });
    }
    
    humanize(amount) {
        const maxDeviation = this.gridSize * (amount / 100);
        this.selectedNotes.forEach(index => {
            if (this.notes[index]) {
                const note = this.notes[index];
                const deviation = (Math.random() - 0.5) * 2 * maxDeviation;
                note.start += deviation;
                note.start = Math.max(0, note.start);
            }
        });
        this.render();
        this.dispatchEvent('notesHumanized', { amount });
    }
    
    reverse() {
        if (this.selectedNotes.size === 0) {
            // Reverse all notes
            this.notes.reverse();
        } else {
            // Reverse selected notes
            const selected = Array.from(this.selectedNotes).map(i => this.notes[i]);
            selected.reverse();
            // Reinsert in reverse order
            let insertIndex = 0;
            this.selectedNotes.forEach(index => {
                this.notes[index] = selected[insertIndex++];
            });
        }
        this.render();
        this.dispatchEvent('notesReversed');
    }
    
    legato() {
        const sortedIndices = Array.from(this.selectedNotes).sort((a, b) => {
            return (this.notes[a].start || 0) - (this.notes[b].start || 0);
        });
        
        for (let i = 0; i < sortedIndices.length - 1; i++) {
            const current = this.notes[sortedIndices[i]];
            const next = this.notes[sortedIndices[i + 1]];
            if (current && next) {
                current.duration = next.start - current.start;
            }
        }
        
        this.render();
        this.dispatchEvent('notesLegato');
    }
    
    fitToScale() {
        const scaleNotes = this.getScaleNotes();
        this.selectedNotes.forEach(index => {
            if (this.notes[index]) {
                const note = this.notes[index];
                // Find nearest scale note
                const nearest = scaleNotes.reduce((prev, curr) => {
                    return Math.abs(curr - note.pitch) < Math.abs(prev - note.pitch) ? curr : prev;
                });
                note.pitch = nearest;
            }
        });
        this.render();
        this.dispatchEvent('notesFittedToScale');
    }
    
    invert() {
        if (this.selectedNotes.size === 0) return;
        
        const selected = Array.from(this.selectedNotes).map(i => this.notes[i]);
        const pitches = selected.map(n => n.pitch);
        const minPitch = Math.min(...pitches);
        const maxPitch = Math.max(...pitches);
        const center = (minPitch + maxPitch) / 2;
        
        this.selectedNotes.forEach(index => {
            if (this.notes[index]) {
                const note = this.notes[index];
                note.pitch = Math.round(center - (note.pitch - center));
                note.pitch = Math.max(0, Math.min(127, note.pitch));
            }
        });
        
        this.render();
        this.dispatchEvent('notesInverted');
    }
    
    dispatchEvent(name, detail) {
        const event = new CustomEvent(name, { detail });
        this.canvas.dispatchEvent(event);
    }
}

// ============================================================================
// Clip Editor Sidebar
// ============================================================================

export class ClipEditorSidebar {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.sections = new Map();
        this.knobs = new Map();
        
        this.init();
    }
    
    init() {
        this.setupCollapsibleSections();
        this.setupKnobs();
        this.setupControls();
    }
    
    setupCollapsibleSections() {
        const sectionHeaders = this.container.querySelectorAll('.section-header');
        
        sectionHeaders.forEach(header => {
            const section = header.closest('.clip-section');
            const toggle = header.querySelector('.section-toggle');
            const content = section.querySelector('.section-content');
            
            if (!section || !toggle || !content) return;
            
            const isCollapsed = section.classList.contains('collapsed');
            if (isCollapsed) {
                content.style.display = 'none';
                toggle.textContent = '▶';
            } else {
                content.style.display = 'flex';
                toggle.textContent = '▼';
            }
            
            header.addEventListener('click', () => {
                const isCollapsed = section.classList.contains('collapsed');
                if (isCollapsed) {
                    section.classList.remove('collapsed');
                    content.style.display = 'flex';
                    toggle.textContent = '▼';
                } else {
                    section.classList.add('collapsed');
                    content.style.display = 'none';
                    toggle.textContent = '▶';
                }
            });
        });
    }
    
    setupKnobs() {
        const knobElements = this.container.querySelectorAll('.knob');
        
        knobElements.forEach(knobEl => {
            const param = knobEl.dataset.param;
            const knob = new ParameterKnob(knobEl, {
                onChange: (value, param) => {
                    this.handleKnobChange(value, param);
                }
            });
            this.knobs.set(param, knob);
        });
    }
    
    setupControls() {
        // Time input fields
        const timeInputs = this.container.querySelectorAll('.time-input');
        timeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.handleTimeInputChange(input);
            });
        });
        
        // Set buttons
        const setButtons = this.container.querySelectorAll('.set-btn');
        setButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                if (input && input.classList.contains('time-input')) {
                    this.handleSetTime(input);
                }
            });
        });
        
        // Grid buttons
        const gridButtons = this.container.querySelectorAll('.grid-btn');
        gridButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                gridButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const grid = btn.dataset.grid;
                this.handleGridChange(grid);
            });
        });
        
        // BPM controls
        const bpmDiv2 = this.container.querySelector('#bpm-div2');
        const bpmX2 = this.container.querySelector('#bpm-x2');
        
        if (bpmDiv2) {
            bpmDiv2.addEventListener('click', () => {
                const bpmInput = this.container.querySelector('#clip-bpm');
                if (bpmInput) {
                    const current = parseFloat(bpmInput.value) || 120;
                    bpmInput.value = (current / 2).toFixed(2);
                    this.handleBPMChange(parseFloat(bpmInput.value));
                }
            });
        }
        
        if (bpmX2) {
            bpmX2.addEventListener('click', () => {
                const bpmInput = this.container.querySelector('#clip-bpm');
                if (bpmInput) {
                    const current = parseFloat(bpmInput.value) || 120;
                    bpmInput.value = (current * 2).toFixed(2);
                    this.handleBPMChange(parseFloat(bpmInput.value));
                }
            });
        }
        
        // Transform action buttons
        const transformButtons = {
            'fit-to-scale': () => this.dispatchAction('fitToScale'),
            'invert-pitch': () => this.dispatchAction('invert'),
            'add-interval': () => this.handleAddInterval(),
            'humanize-btn': () => this.handleHumanize(),
            'reverse-clip': () => this.dispatchAction('reverse'),
            'legato-notes': () => this.dispatchAction('legato'),
            'apply-quantize': () => this.handleApplyQuantize()
        };
        
        Object.entries(transformButtons).forEach(([id, handler]) => {
            const btn = this.container.querySelector(`#${id}`);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
    }
    
    handleKnobChange(value, param) {
        this.dispatchEvent('parameterChanged', { param, value });
    }
    
    handleTimeInputChange(input) {
        const field = input.id;
        const value = input.value;
        this.dispatchEvent('timeChanged', { field, value });
    }
    
    handleSetTime(input) {
        const field = input.id;
        const value = input.value;
        this.dispatchEvent('timeSet', { field, value });
    }
    
    handleGridChange(grid) {
        this.dispatchEvent('gridChanged', { grid });
    }
    
    handleBPMChange(bpm) {
        this.dispatchEvent('bpmChanged', { bpm });
    }
    
    handleAddInterval() {
        const input = this.container.querySelector('#interval-input');
        if (input) {
            const interval = parseInt(input.value) || 0;
            this.dispatchAction('addInterval', { interval });
        }
    }
    
    handleHumanize() {
        const input = this.container.querySelector('#humanize-amount');
        if (input) {
            const amount = parseInt(input.value) || 10;
            this.dispatchAction('humanize', { amount });
        }
    }
    
    handleApplyQuantize() {
        const gridButtons = this.container.querySelectorAll('.grid-btn.active');
        const grid = gridButtons[0]?.dataset.grid || '1/8';
        const amountKnob = this.knobs.get('quantize');
        const amount = amountKnob ? amountKnob.getValue() : 100;
        
        this.dispatchAction('quantize', { grid, amount });
    }
    
    dispatchAction(action, params = {}) {
        this.dispatchEvent('action', { action, ...params });
    }
    
    dispatchEvent(name, detail) {
        const event = new CustomEvent(`sidebar:${name}`, { detail });
        this.container.dispatchEvent(event);
    }
    
    getKnob(param) {
        return this.knobs.get(param);
    }
    
    setKnobValue(param, value) {
        const knob = this.knobs.get(param);
        if (knob) {
            knob.setValue(value);
        }
    }
}

// ============================================================================
// Clip Editor Main
// ============================================================================

export class ClipEditorMain {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.activeTab = 'sample';
        this.waveformEditor = null;
        this.pianoRollEditor = null;
        this.timelineRuler = null;
        
        this.init();
    }
    
    init() {
        this.setupTabs();
        this.setupTimelineRuler();
        this.setupWaveformEditor();
        this.setupPianoRollEditor();
    }
    
    setupTabs() {
        const tabs = this.container.querySelectorAll('.editor-tab');
        const tabContents = {
            'sample': this.container.querySelector('#waveform-editor'),
            'envelopes': this.container.querySelector('#envelopes-editor')
        };
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show/hide content
                Object.entries(tabContents).forEach(([name, content]) => {
                    if (content) {
                        if (name === tabName) {
                            content.style.display = 'block';
                        } else {
                            content.style.display = 'none';
                        }
                    }
                });
                
                this.activeTab = tabName;
                this.dispatchEvent('tabChanged', { tab: tabName });
            });
        });
    }
    
    setupTimelineRuler() {
        const ruler = this.container.querySelector('#timeline-ruler');
        if (!ruler) return;
        
        this.timelineRuler = {
            element: ruler,
            render: () => {
                this.renderTimelineRuler();
            }
        };
        
        this.renderTimelineRuler();
    }
    
    renderTimelineRuler() {
        const ruler = this.container.querySelector('#timeline-ruler');
        if (!ruler) return;
        
        const markers = ruler.querySelector('.ruler-markers');
        if (!markers) return;
        
        markers.innerHTML = '';
        
        const bars = 8;
        const width = ruler.offsetWidth;
        
        for (let bar = 0; bar <= bars; bar++) {
            const marker = document.createElement('div');
            marker.className = 'ruler-marker';
            marker.style.left = `${(bar / bars) * 100}%`;
            marker.textContent = bar.toString();
            markers.appendChild(marker);
        }
    }
    
    setupWaveformEditor() {
        const canvas = this.container.querySelector('#waveform-canvas');
        if (!canvas) return;
        
        this.waveformEditor = new EnhancedWaveformEditor(canvas, {
            bpm: 120,
            sampleRate: 44100,
            bars: 8
        });
        
        // Listen for waveform events
        canvas.addEventListener('warpMarkerAdded', (e) => {
            this.dispatchEvent('warpMarkerAdded', e.detail);
        });
        
        canvas.addEventListener('selectionChanged', (e) => {
            this.dispatchEvent('selectionChanged', e.detail);
        });
    }
    
    setupPianoRollEditor() {
        const canvas = this.container.querySelector('#piano-roll-canvas');
        if (!canvas) return;
        
        this.pianoRollEditor = new EnhancedPianoRollEditor(canvas, {
            bpm: 120,
            bars: 8
        });
        
        // Render piano keys
        this.renderPianoKeys();
        
        // Listen for piano roll events
        canvas.addEventListener('notesTransposed', (e) => {
            this.dispatchEvent('notesTransposed', e.detail);
        });
        
        canvas.addEventListener('notesQuantized', (e) => {
            this.dispatchEvent('notesQuantized', e.detail);
        });
    }
    
    renderPianoKeys() {
        const pianoKeysPanel = this.container.querySelector('#piano-keys');
        if (!pianoKeysPanel) return;
        
        pianoKeysPanel.innerHTML = '';
        
        // Generate 88 keys (A0 to C8)
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const blackKeys = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#
        
        for (let midiNote = 21; midiNote <= 108; midiNote++) {
            const octave = Math.floor((midiNote - 12) / 12);
            const noteIndex = midiNote % 12;
            const noteName = notes[noteIndex];
            const isBlack = blackKeys.includes(noteIndex);
            
            const key = document.createElement('div');
            key.className = `piano-key ${isBlack ? 'black' : ''}`;
            key.textContent = `${noteName}${octave}`;
            key.dataset.midiNote = midiNote;
            pianoKeysPanel.appendChild(key);
        }
    }
    
    setWaveformData(data) {
        if (this.waveformEditor) {
            this.waveformEditor.setWaveformData(data);
        }
    }
    
    setNotes(notes) {
        if (this.pianoRollEditor) {
            this.pianoRollEditor.setNotes(notes);
        }
    }
    
    setBPM(bpm) {
        if (this.waveformEditor) {
            this.waveformEditor.setBPM(bpm);
        }
        if (this.pianoRollEditor) {
            this.pianoRollEditor.options.bpm = bpm;
            this.pianoRollEditor.render();
        }
    }
    
    dispatchEvent(name, detail) {
        const event = new CustomEvent(`editor:${name}`, { detail });
        this.container.dispatchEvent(event);
    }
}

// ============================================================================
// Enhanced Clip Editor (Main Orchestrator)
// ============================================================================

export class EnhancedClipEditor {
    constructor(options = {}) {
        this.options = options;
        this.sidebar = null;
        this.mainEditor = null;
        this.currentClipType = null; // 'audio' or 'midi'
        this.currentMediaId = null;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        const sidebarContainer = document.querySelector('.clip-editor-sidebar');
        const mainContainer = document.querySelector('.clip-editor-main');
        
        if (sidebarContainer) {
            this.sidebar = new ClipEditorSidebar(sidebarContainer);
            this.setupSidebarListeners();
        }
        
        if (mainContainer) {
            this.mainEditor = new ClipEditorMain(mainContainer);
            this.setupMainEditorListeners();
        }
        
        // Integrate with existing editor state
        this.integrateWithEditorState();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        console.log('[EnhancedClipEditor] Initialized');
    }
    
    setupSidebarListeners() {
        if (!this.sidebar) return;
        
        this.sidebar.container.addEventListener('sidebar:parameterChanged', (e) => {
            const { param, value } = e.detail;
            this.handleParameterChange(param, value);
        });
        
        this.sidebar.container.addEventListener('sidebar:action', (e) => {
            const { action, ...params } = e.detail;
            this.handleAction(action, params);
        });
        
        this.sidebar.container.addEventListener('sidebar:bpmChanged', (e) => {
            const { bpm } = e.detail;
            this.handleBPMChange(bpm);
        });
    }
    
    setupMainEditorListeners() {
        if (!this.mainEditor) return;
        
        this.mainEditor.container.addEventListener('editor:warpMarkerAdded', (e) => {
            this.handleWarpMarkerAdded(e.detail);
        });
        
        this.mainEditor.container.addEventListener('editor:selectionChanged', (e) => {
            this.handleSelectionChanged(e.detail);
        });
        
        this.mainEditor.container.addEventListener('editor:notesTransposed', (e) => {
            this.handleNotesTransposed(e.detail);
        });
    }
    
    integrateWithEditorState() {
        // Sync with window.editorStates
        if (!window.editorStates) {
            console.warn('[EnhancedClipEditor] editorStates not available');
            return;
        }
        
        // Listen for media loading
        document.addEventListener('mediaSelected', (e) => {
            this.loadMedia(e.detail.mediaId);
        });
    }
    
    loadMedia(mediaId) {
        this.currentMediaId = mediaId;
        
        // Get media data from editor state or media loader
        const state = window.editorStates?.waveform;
        if (state && state.data) {
            if (state.data.waveform) {
                this.currentClipType = 'audio';
                if (this.mainEditor) {
                    this.mainEditor.setWaveformData(state.data.waveform);
                }
                // Update clip type badge
                const badge = document.getElementById('clip-type-badge');
                if (badge) badge.textContent = 'Audio';
            }
        }
        
        const midiState = window.editorStates?.['piano-roll'];
        if (midiState && midiState.data && midiState.data.notes) {
            this.currentClipType = 'midi';
            if (this.mainEditor) {
                this.mainEditor.setNotes(midiState.data.notes);
            }
            // Update clip type badge
            const badge = document.getElementById('clip-type-badge');
            if (badge) badge.textContent = 'MIDI';
        }
        
        // Update sidebar visibility based on clip type
        this.updateSidebarForClipType();
        
        // Show/hide editors based on type
        if (this.mainEditor) {
            const waveformEditor = this.mainEditor.container.querySelector('#waveform-editor');
            const pianoRollEditor = this.mainEditor.container.querySelector('#piano-roll-editor');
            const velocityLane = this.mainEditor.container.querySelector('#velocity-lane-editor');
            
            if (this.currentClipType === 'audio') {
                if (waveformEditor) waveformEditor.style.display = 'block';
                if (pianoRollEditor) pianoRollEditor.style.display = 'none';
                if (velocityLane) velocityLane.style.display = 'none';
            } else if (this.currentClipType === 'midi') {
                if (waveformEditor) waveformEditor.style.display = 'none';
                if (pianoRollEditor) pianoRollEditor.style.display = 'flex';
                if (velocityLane) velocityLane.style.display = 'block';
            }
        }
    }
    
    updateSidebarForClipType() {
        if (!this.sidebar) return;
        
        const audioSections = this.sidebar.container.querySelectorAll('.audio-only');
        const midiSections = this.sidebar.container.querySelectorAll('.midi-only');
        
        if (this.currentClipType === 'audio') {
            audioSections.forEach(section => {
                section.style.display = 'block';
            });
            midiSections.forEach(section => {
                section.style.display = 'none';
            });
        } else if (this.currentClipType === 'midi') {
            audioSections.forEach(section => {
                section.style.display = 'none';
            });
            midiSections.forEach(section => {
                section.style.display = 'block';
            });
        }
    }
    
    handleParameterChange(param, value) {
        // Update editor state
        const state = window.editorStates?.waveform;
        if (state && state.clipProperties) {
            if (param === 'gain') {
                state.clipProperties.gain = value;
            } else if (param === 'stretch') {
                // Handle stretch
            } else if (param === 'quantize') {
                // Handle quantize amount
            }
            state.saveState();
        }
        
        // Send to Max
        if (typeof sendToMax === 'function') {
            sendToMax(`set_clip_${param}`, value);
        }
        
        // Update UI
        if (this.mainEditor && this.mainEditor.waveformEditor) {
            this.mainEditor.waveformEditor.render();
        }
    }
    
    handleAction(action, params) {
        if (!this.mainEditor || !this.mainEditor.pianoRollEditor) return;
        
        const editor = this.mainEditor.pianoRollEditor;
        
        switch (action) {
            case 'fitToScale':
                editor.fitToScale();
                break;
            case 'invert':
                editor.invert();
                break;
            case 'addInterval':
                editor.transpose(params.interval || 0);
                break;
            case 'humanize':
                editor.humanize(params.amount || 10);
                break;
            case 'reverse':
                editor.reverse();
                break;
            case 'legato':
                editor.legato();
                break;
            case 'quantize':
                editor.setGridSize(this.parseGridSize(params.grid));
                editor.quantize();
                break;
        }
        
        // Update editor state
        const state = window.editorStates?.['piano-roll'];
        if (state && editor.notes) {
            state.data.notes = editor.notes;
            state.saveState();
        }
    }
    
    handleBPMChange(bpm) {
        if (this.mainEditor) {
            this.mainEditor.setBPM(bpm);
        }
        
        const state = window.editorStates?.waveform;
        if (state && state.clipProperties) {
            state.clipProperties.bpm = bpm;
            state.saveState();
        }
        
        if (typeof sendToMax === 'function') {
            sendToMax('set_clip_bpm', bpm);
        }
    }
    
    handleWarpMarkerAdded(detail) {
        const state = window.editorStates?.waveform;
        if (state && state.clipProperties && state.clipProperties.warp) {
            if (!state.clipProperties.warp.markers) {
                state.clipProperties.warp.markers = [];
            }
            state.clipProperties.warp.markers.push(detail);
            state.saveState();
        }
        
        if (typeof sendToMax === 'function') {
            sendToMax('add_warp_marker', detail);
        }
    }
    
    handleSelectionChanged(detail) {
        const state = window.editorStates?.waveform;
        if (state) {
            state.selection.start = detail.start;
            state.selection.end = detail.end;
        }
    }
    
    handleNotesTransposed(detail) {
        const state = window.editorStates?.['piano-roll'];
        if (state) {
            state.saveState();
        }
        
        if (typeof sendToMax === 'function') {
            sendToMax('transpose_notes', detail);
        }
    }
    
    parseGridSize(grid) {
        const gridMap = {
            '1/32': 1/32,
            '1/16': 1/16,
            '1/8': 1/8,
            '1/4': 1/4,
            '1/2': 1/2,
            '1': 1
        };
        return gridMap[grid] || 1/16;
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle if editor is active
            const editorPanel = document.querySelector('.editor-preview-panel');
            if (!editorPanel || !editorPanel.classList.contains('active')) return;
            
            // Keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'q':
                        e.preventDefault();
                        this.handleAction('quantize', { grid: '1/16' });
                        break;
                    case 'r':
                        e.preventDefault();
                        this.handleAction('reverse', {});
                        break;
                }
            }
        });
    }
}

// Export singleton instance creator
export function createEnhancedClipEditor(options) {
    return new EnhancedClipEditor(options);
}

// Auto-initialize if in browser context
if (typeof window !== 'undefined') {
    window.EnhancedClipEditor = EnhancedClipEditor;
    window.ParameterKnob = ParameterKnob;
    window.EnhancedWaveformEditor = EnhancedWaveformEditor;
    window.EnhancedPianoRollEditor = EnhancedPianoRollEditor;
}

