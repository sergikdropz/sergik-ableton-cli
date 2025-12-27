/**
 * @fileoverview Editor Handlers - Handles editor function operations
 * @module editor-handlers
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('EditorHandlers');

/**
 * EditorHandlers class handles all editor operations (audio and MIDI)
 */
export class EditorHandlers {
    /**
     * Create an EditorHandlers instance
     * @param {string} apiBaseUrl - Base URL for API calls
     */
    constructor(apiBaseUrl = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;
    }

    // ============================================================================
    // Audio Processing Functions
    // ============================================================================

    /**
     * Apply fade in to selected audio
     * @param {number} duration - Fade duration in seconds
     * @returns {Promise<Object>} Operation result
     */
    async fadeIn(duration = 0.1) {
        try {
            logger.debug('Applying fade in', { duration });
            return await this._transformAudio('fade', { type: 'in', duration });
        } catch (error) {
            logger.error('Fade in failed', error);
            throw error;
        }
    }

    /**
     * Apply fade out to selected audio
     * @param {number} duration - Fade duration in seconds
     * @returns {Promise<Object>} Operation result
     */
    async fadeOut(duration = 0.1) {
        try {
            logger.debug('Applying fade out', { duration });
            return await this._transformAudio('fade', { type: 'out', duration });
        } catch (error) {
            logger.error('Fade out failed', error);
            throw error;
        }
    }

    /**
     * Normalize audio
     * @param {number} targetLevel - Target level in dB (default: -0.1)
     * @returns {Promise<Object>} Operation result
     */
    async normalize(targetLevel = -0.1) {
        try {
            logger.debug('Normalizing audio', { targetLevel });
            return await this._transformAudio('normalize', { target_level: targetLevel });
        } catch (error) {
            logger.error('Normalize failed', error);
            throw error;
        }
    }

    /**
     * Time stretch audio
     * @param {number} factor - Stretch factor (1.0 = no change, 2.0 = double speed)
     * @returns {Promise<Object>} Operation result
     */
    async timeStretch(factor) {
        try {
            logger.debug('Time stretching audio', { factor });
            return await this._transformAudio('time_stretch', { factor });
        } catch (error) {
            logger.error('Time stretch failed', error);
            throw error;
        }
    }

    /**
     * Pitch shift audio
     * @param {number} semitones - Semitones to shift (positive = up, negative = down)
     * @returns {Promise<Object>} Operation result
     */
    async pitchShift(semitones) {
        try {
            logger.debug('Pitch shifting audio', { semitones });
            return await this._transformAudio('pitch_shift', { semitones });
        } catch (error) {
            logger.error('Pitch shift failed', error);
            throw error;
        }
    }

    // ============================================================================
    // MIDI Operations
    // ============================================================================

    /**
     * Quantize MIDI notes
     * @param {string} grid - Grid size (32nd, 16th, 8th, 4th, 2nd, whole, triplet, swing)
     * @param {number} strength - Quantization strength (0-100)
     * @returns {Promise<Object>} Operation result
     */
    async quantize(grid = '16th', strength = 100) {
        try {
            logger.debug('Quantizing MIDI', { grid, strength });
            return await this._transformMIDI('quantize', { grid, strength });
        } catch (error) {
            logger.error('Quantize failed', error);
            throw error;
        }
    }

    /**
     * Transpose MIDI notes
     * @param {number} semitones - Semitones to transpose (positive = up, negative = down)
     * @returns {Promise<Object>} Operation result
     */
    async transpose(semitones) {
        try {
            logger.debug('Transposing MIDI', { semitones });
            return await this._transformMIDI('transpose', { semitones });
        } catch (error) {
            logger.error('Transpose failed', error);
            throw error;
        }
    }

    /**
     * Adjust MIDI velocity
     * @param {string} operation - Operation type (set, scale, randomize)
     * @param {number} value - Value for operation
     * @returns {Promise<Object>} Operation result
     */
    async adjustVelocity(operation, value) {
        try {
            logger.debug('Adjusting velocity', { operation, value });
            return await this._transformMIDI('velocity', { operation, value });
        } catch (error) {
            logger.error('Velocity adjustment failed', error);
            throw error;
        }
    }

    /**
     * Make notes legato (remove gaps)
     * @returns {Promise<Object>} Operation result
     */
    async makeLegato() {
        try {
            logger.debug('Making notes legato');
            return await this._transformMIDI('legato', {});
        } catch (error) {
            logger.error('Make legato failed', error);
            throw error;
        }
    }

    /**
     * Remove overlapping notes
     * @returns {Promise<Object>} Operation result
     */
    async removeOverlaps() {
        try {
            logger.debug('Removing overlaps');
            return await this._transformMIDI('remove_overlaps', {});
        } catch (error) {
            logger.error('Remove overlaps failed', error);
            throw error;
        }
    }

    /**
     * Split clip at selection
     * @returns {Promise<Object>} Operation result
     */
    async split() {
        try {
            logger.debug('Splitting clip');
            // This would use LOM directly
            return await this._lomOperation('split_clip', {});
        } catch (error) {
            logger.error('Split failed', error);
            throw error;
        }
    }

    /**
     * Consolidate clip
     * @returns {Promise<Object>} Operation result
     */
    async consolidate() {
        try {
            logger.debug('Consolidating clip');
            // This would use LOM directly
            return await this._lomOperation('consolidate_clip', {});
        } catch (error) {
            logger.error('Consolidate failed', error);
            throw error;
        }
    }

    /**
     * Loop/unloop clip
     * @param {boolean} loop - Enable or disable looping
     * @returns {Promise<Object>} Operation result
     */
    async loop(loop = true) {
        try {
            logger.debug('Setting loop', { loop });
            return await this._lomOperation('set_clip_loop', { loop });
        } catch (error) {
            logger.error('Loop failed', error);
            throw error;
        }
    }

    // ============================================================================
    // View/Display Functions
    // ============================================================================

    /**
     * Zoom in
     */
    zoomIn() {
        // This would update canvas viewport
        logger.debug('Zooming in');
        // Implementation depends on editor canvas
    }

    /**
     * Zoom out
     */
    zoomOut() {
        // This would update canvas viewport
        logger.debug('Zooming out');
        // Implementation depends on editor canvas
    }

    /**
     * Fit selection to viewport
     */
    fitSelection() {
        logger.debug('Fitting selection');
        // Implementation depends on editor canvas
    }

    /**
     * Fit all to viewport
     */
    fitAll() {
        logger.debug('Fitting all');
        // Implementation depends on editor canvas
    }

    /**
     * Snap to grid
     * @param {string} mode - Snap mode (grid, zero, relative, off)
     */
    snapToGrid(mode = 'grid') {
        logger.debug('Snapping to grid', { mode });
        // Implementation depends on editor
    }

    // ============================================================================
    // Track Actions
    // ============================================================================

    /**
     * Mute track
     * @param {number} trackIndex - Track index
     * @param {boolean} mute - Mute state
     */
    async trackMute(trackIndex, mute = true) {
        try {
            logger.debug('Setting track mute', { trackIndex, mute });
            return await this._lomOperation('set_track_mute', { trackIndex, mute });
        } catch (error) {
            logger.error('Track mute failed', error);
            throw error;
        }
    }

    /**
     * Solo track
     * @param {number} trackIndex - Track index
     * @param {boolean} solo - Solo state
     */
    async trackSolo(trackIndex, solo = true) {
        try {
            logger.debug('Setting track solo', { trackIndex, solo });
            return await this._lomOperation('set_track_solo', { trackIndex, solo });
        } catch (error) {
            logger.error('Track solo failed', error);
            throw error;
        }
    }

    /**
     * Arm track
     * @param {number} trackIndex - Track index
     * @param {boolean} arm - Arm state
     */
    async trackArm(trackIndex, arm = true) {
        try {
            logger.debug('Setting track arm', { trackIndex, arm });
            return await this._lomOperation('set_track_arm', { trackIndex, arm });
        } catch (error) {
            logger.error('Track arm failed', error);
            throw error;
        }
    }

    /**
     * Freeze track
     * @param {number} trackIndex - Track index
     * @param {boolean} freeze - Freeze state
     */
    async trackFreeze(trackIndex, freeze = true) {
        try {
            logger.debug('Setting track freeze', { trackIndex, freeze });
            return await this._lomOperation('set_track_freeze', { trackIndex, freeze });
        } catch (error) {
            logger.error('Track freeze failed', error);
            throw error;
        }
    }

    // ============================================================================
    // Internal Helper Methods
    // ============================================================================

    /**
     * Transform audio via API
     * @private
     */
    async _transformAudio(operation, params) {
        const response = await fetch(`${this.apiBaseUrl}/api/transform/${operation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                track_index: this._getCurrentTrackIndex(),
                clip_slot: this._getCurrentClipSlot(),
                ...params
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `${operation} failed`);
        }

        return await response.json();
    }

    /**
     * Transform MIDI via API
     * @private
     */
    async _transformMIDI(operation, params) {
        const response = await fetch(`${this.apiBaseUrl}/api/transform/${operation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                track_index: this._getCurrentTrackIndex(),
                clip_slot: this._getCurrentClipSlot(),
                ...params
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `${operation} failed`);
        }

        return await response.json();
    }

    /**
     * LOM operation via API
     * @private
     */
    async _lomOperation(operation, params) {
        const response = await fetch(`${this.apiBaseUrl}/api/live/command`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                command: operation,
                ...params
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `${operation} failed`);
        }

        return await response.json();
    }

    /**
     * Get current track index
     * @private
     */
    _getCurrentTrackIndex() {
        // Try to import state helpers, fallback to window state
        if (typeof getCurrentTrackIndex === 'function') {
            return getCurrentTrackIndex();
        }
        return window.currentTrackIndex || 0;
    }

    /**
     * Get current clip slot
     * @private
     */
    _getCurrentClipSlot() {
        // Try to import state helpers, fallback to window state
        if (typeof getCurrentClipSlot === 'function') {
            return getCurrentClipSlot();
        }
        return window.currentClipSlot || 0;
    }
}

