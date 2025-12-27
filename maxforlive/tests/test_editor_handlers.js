/**
 * Tests for EditorHandlers
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorHandlers } from '../js/editor-handlers.js';

describe('EditorHandlers', () => {
    let editorHandlers;
    let mockFetch;

    beforeEach(() => {
        editorHandlers = new EditorHandlers('http://localhost:8000');
        mockFetch = vi.fn();
        global.fetch = mockFetch;
    });

    describe('timeShift', () => {
        it('should shift clip right by default amount', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 'ok', message: 'Time shifted' })
            });

            // Mock current track/clip
            editorHandlers._getCurrentTrackIndex = () => 0;
            editorHandlers._getCurrentClipSlot = () => 0;

            const result = await editorHandlers.timeShift('right', 0.25);

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/transform/time_shift',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        track_index: 0,
                        clip_slot: 0,
                        direction: 'right',
                        amount: 0.25
                    })
                })
            );
            expect(result.status).toBe('ok');
        });

        it('should handle API errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ detail: 'Time shift failed' })
            });

            editorHandlers._getCurrentTrackIndex = () => 0;
            editorHandlers._getCurrentClipSlot = () => 0;

            await expect(editorHandlers.timeShift('right')).rejects.toThrow();
        });
    });

    describe('rotate', () => {
        it('should rotate MIDI clip (transpose + time shift)', async () => {
            // Mock editor type
            editorHandlers._getCurrentEditorType = () => 'piano-roll';
            editorHandlers._getCurrentTrackIndex = () => 0;
            editorHandlers._getCurrentClipSlot = () => 0;

            // Mock transpose and timeShift
            editorHandlers.transpose = vi.fn().mockResolvedValue({ status: 'ok' });
            editorHandlers.timeShift = vi.fn().mockResolvedValue({ status: 'ok' });

            const result = await editorHandlers.rotate(90);

            // 90 degrees = 3 semitones, 1 beat shift
            expect(editorHandlers.transpose).toHaveBeenCalledWith(3);
            expect(editorHandlers.timeShift).toHaveBeenCalled();
            expect(result.status).toBe('ok');
        });

        it('should rotate audio clip (pitch shift)', async () => {
            editorHandlers._getCurrentEditorType = () => 'waveform';
            editorHandlers._getCurrentTrackIndex = () => 0;
            editorHandlers._getCurrentClipSlot = () => 0;

            editorHandlers.pitchShift = vi.fn().mockResolvedValue({ status: 'ok' });

            const result = await editorHandlers.rotate(60);

            expect(editorHandlers.pitchShift).toHaveBeenCalled();
            expect(result.status).toBe('ok');
        });
    });

    describe('quantize', () => {
        it('should quantize MIDI notes', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 'ok', result: { message: 'Quantized' } })
            });

            editorHandlers._getCurrentTrackIndex = () => 0;
            editorHandlers._getCurrentClipSlot = () => 0;

            const result = await editorHandlers.quantize('1/16', 100);

            expect(result.status).toBe('ok');
        });
    });

    describe('transpose', () => {
        it('should transpose MIDI notes', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 'ok', result: { message: 'Transposed' } })
            });

            editorHandlers._getCurrentTrackIndex = () => 0;
            editorHandlers._getCurrentClipSlot = () => 0;

            const result = await editorHandlers.transpose(12);

            expect(result.status).toBe('ok');
        });
    });
});

