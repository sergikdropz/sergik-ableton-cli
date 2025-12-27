/**
 * @fileoverview State Helpers - Helper functions for getting current editor state
 * @module state-helpers
 */

/**
 * Get current track index from UI state
 * @returns {number} Current track index
 */
export function getCurrentTrackIndex() {
    // Try multiple methods to get current track
    if (window.currentTrackIndex !== undefined) {
        return window.currentTrackIndex;
    }
    
    // Try to get from selected track element
    const selectedTrack = document.querySelector('.track-item.selected, .track.selected');
    if (selectedTrack) {
        const trackIndex = selectedTrack.getAttribute('data-track-index') || 
                          selectedTrack.getAttribute('data-index');
        if (trackIndex !== null) {
            return parseInt(trackIndex);
        }
    }
    
    // Try to get from track selector
    const trackSelect = document.getElementById('track-select');
    if (trackSelect && trackSelect.value !== 'new') {
        return parseInt(trackSelect.value);
    }
    
    // Default to track 0
    return 0;
}

/**
 * Get current clip slot from UI state
 * @returns {number} Current clip slot index
 */
export function getCurrentClipSlot() {
    // Try multiple methods to get current clip slot
    if (window.currentClipSlot !== undefined) {
        return window.currentClipSlot;
    }
    
    // Try to get from selected clip element
    const selectedClip = document.querySelector('.clip.selected, .clip-slot.selected');
    if (selectedClip) {
        const clipSlot = selectedClip.getAttribute('data-clip-slot') || 
                        selectedClip.getAttribute('data-slot-index');
        if (clipSlot !== null) {
            return parseInt(clipSlot);
        }
    }
    
    // Default to slot 0
    return 0;
}

/**
 * Get current analysis data
 * @returns {Object|null} Current analysis data
 */
export function getCurrentAnalysisData() {
    return window.currentAnalysisData || null;
}

/**
 * Set current track index
 * @param {number} index - Track index
 */
export function setCurrentTrackIndex(index) {
    window.currentTrackIndex = index;
    
    // Update UI to reflect selection
    document.querySelectorAll('.track-item, .track').forEach((track, i) => {
        track.classList.toggle('selected', i === index);
    });
}

/**
 * Set current clip slot
 * @param {number} slot - Clip slot index
 */
export function setCurrentClipSlot(slot) {
    window.currentClipSlot = slot;
    
    // Update UI to reflect selection
    document.querySelectorAll('.clip, .clip-slot').forEach((clip, i) => {
        clip.classList.toggle('selected', i === slot);
    });
}

/**
 * Set current analysis data
 * @param {Object} data - Analysis data
 */
export function setCurrentAnalysisData(data) {
    window.currentAnalysisData = data;
}

/**
 * Get current track file path
 * @returns {string|null} Current track file path
 */
export function getCurrentTrackFile() {
    return window.currentTrackFile || null;
}

/**
 * Set current track file path
 * @param {string} filePath - File path
 */
export function setCurrentTrackFile(filePath) {
    window.currentTrackFile = filePath;
}

/**
 * Get current track metadata
 * @returns {Object} Track metadata
 */
export function getCurrentTrackMetadata() {
    return {
        trackIndex: getCurrentTrackIndex(),
        clipSlot: getCurrentClipSlot(),
        file: getCurrentTrackFile(),
        bpm: window.currentTrackBPM || null,
        key: window.currentTrackKey || null,
        genre: window.currentTrackGenre || null
    };
}

