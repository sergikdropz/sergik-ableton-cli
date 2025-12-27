/**
 * Tests for MediaLoader
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaLoader } from '../js/media-loader.js';

describe('MediaLoader', () => {
    let mediaLoader;

    beforeEach(() => {
        mediaLoader = new MediaLoader();
    });

    describe('parseDuration', () => {
        it('should parse seconds as number', () => {
            expect(mediaLoader.parseDuration('120.5')).toBe(120.5);
        });

        it('should parse MM:SS format', () => {
            expect(mediaLoader.parseDuration('4:32')).toBe(272);
        });

        it('should parse HH:MM:SS format', () => {
            expect(mediaLoader.parseDuration('1:30:45')).toBe(5445);
        });

        it('should return 0 for invalid input', () => {
            expect(mediaLoader.parseDuration('invalid')).toBe(0);
            expect(mediaLoader.parseDuration(null)).toBe(0);
        });
    });

    describe('getMediaById', () => {
        it('should find media element by ID', () => {
            const mockElement = document.createElement('div');
            mockElement.setAttribute('data-media-id', 'test-id');
            document.body.appendChild(mockElement);

            const result = mediaLoader.getMediaById('test-id');
            expect(result).toBe(mockElement);

            document.body.removeChild(mockElement);
        });

        it('should return null if not found', () => {
            const result = mediaLoader.getMediaById('non-existent');
            expect(result).toBeNull();
        });
    });

    describe('updateMediaItemState', () => {
        it('should update media item state', () => {
            const mockElement = document.createElement('div');
            mockElement.setAttribute('data-media-id', 'test-id');
            mockElement.classList.add('selected');
            document.body.appendChild(mockElement);

            mediaLoader.updateMediaItemState('test-id', 'loaded');

            expect(mockElement.classList.contains('selected')).toBe(false);
            expect(mockElement.classList.contains('loaded')).toBe(true);

            document.body.removeChild(mockElement);
        });
    });

    describe('navigateBack', () => {
        it('should navigate to previous media in history', async () => {
            mediaLoader.mediaHistory = ['media1', 'media2', 'media3'];
            mediaLoader.historyIndex = 2;
            mediaLoader.loadMediaIntoEditor = vi.fn().mockResolvedValue({});

            await mediaLoader.navigateBack();

            expect(mediaLoader.historyIndex).toBe(1);
            expect(mediaLoader.loadMediaIntoEditor).toHaveBeenCalledWith('media2');
        });

        it('should not navigate if at beginning', async () => {
            mediaLoader.mediaHistory = ['media1'];
            mediaLoader.historyIndex = 0;
            mediaLoader.loadMediaIntoEditor = vi.fn();

            const result = await mediaLoader.navigateBack();

            expect(result).toBeNull();
            expect(mediaLoader.loadMediaIntoEditor).not.toHaveBeenCalled();
        });
    });

    describe('navigateForward', () => {
        it('should navigate to next media in history', async () => {
            mediaLoader.mediaHistory = ['media1', 'media2', 'media3'];
            mediaLoader.historyIndex = 0;
            mediaLoader.loadMediaIntoEditor = vi.fn().mockResolvedValue({});

            await mediaLoader.navigateForward();

            expect(mediaLoader.historyIndex).toBe(1);
            expect(mediaLoader.loadMediaIntoEditor).toHaveBeenCalledWith('media2');
        });
    });

    describe('clearCache', () => {
        it('should clear all caches', () => {
            mediaLoader.mediaCache.set('key1', 'value1');
            mediaLoader.loadedMedia.set('key2', 'value2');

            mediaLoader.clearCache();

            expect(mediaLoader.mediaCache.size).toBe(0);
            expect(mediaLoader.loadedMedia.size).toBe(0);
        });
    });
});

