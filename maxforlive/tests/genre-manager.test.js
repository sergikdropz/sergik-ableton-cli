/**
 * @fileoverview Unit tests for GenreManager class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GenreManager } from '../js/genre-manager.js';
import { subGenreMap, DEFAULT_GENRE } from '../js/config.js';

describe('GenreManager', () => {
    let genreManager;

    beforeEach(() => {
        genreManager = new GenreManager();
    });

    describe('constructor', () => {
        it('should create instance with default config', () => {
            expect(genreManager).toBeInstanceOf(GenreManager);
            expect(genreManager.subGenreMap).toBeDefined();
            expect(genreManager.defaultGenre).toBe(DEFAULT_GENRE);
        });

        it('should accept custom config', () => {
            const customConfig = {
                subGenreMap: { 'test': ['Sub1', 'Sub2'] },
                defaultGenre: 'test',
                enableLogging: false
            };
            const manager = new GenreManager(customConfig);
            expect(manager.defaultGenre).toBe('test');
            expect(manager.enableLogging).toBe(false);
        });
    });

    describe('getSubGenres', () => {
        it('should return sub-genres for valid genre', () => {
            const subGenres = genreManager.getSubGenres('house');
            expect(Array.isArray(subGenres)).toBe(true);
            expect(subGenres.length).toBeGreaterThan(0);
            expect(subGenres).toContain('Classic House');
        });

        it('should return empty array for invalid genre', () => {
            const subGenres = genreManager.getSubGenres('nonexistent');
            expect(Array.isArray(subGenres)).toBe(true);
            expect(subGenres.length).toBe(0);
        });

        it('should handle null/undefined genre', () => {
            expect(genreManager.getSubGenres(null)).toEqual([]);
            expect(genreManager.getSubGenres(undefined)).toEqual([]);
        });

        it('should handle non-string genre', () => {
            expect(genreManager.getSubGenres(123)).toEqual([]);
            expect(genreManager.getSubGenres({})).toEqual([]);
        });

        it('should normalize genre case', () => {
            const upper = genreManager.getSubGenres('HOUSE');
            const lower = genreManager.getSubGenres('house');
            expect(upper).toEqual(lower);
        });

        it('should trim whitespace', () => {
            const trimmed = genreManager.getSubGenres('  house  ');
            const normal = genreManager.getSubGenres('house');
            expect(trimmed).toEqual(normal);
        });
    });

    describe('hasSubGenres', () => {
        it('should return true for genre with sub-genres', () => {
            expect(genreManager.hasSubGenres('house')).toBe(true);
            expect(genreManager.hasSubGenres('techno')).toBe(true);
        });

        it('should return false for genre without sub-genres', () => {
            // Assuming some genres might not have sub-genres
            // This test depends on actual data
            expect(genreManager.hasSubGenres('nonexistent')).toBe(false);
        });
    });

    describe('getAllGenres', () => {
        it('should return array of all genres', () => {
            const genres = genreManager.getAllGenres();
            expect(Array.isArray(genres)).toBe(true);
            expect(genres.length).toBeGreaterThan(0);
            expect(genres).toContain('house');
        });

        it('should return all keys from subGenreMap', () => {
            const genres = genreManager.getAllGenres();
            const expectedGenres = Object.keys(subGenreMap);
            expect(genres.sort()).toEqual(expectedGenres.sort());
        });
    });

    describe('isValidGenre', () => {
        it('should return true for valid genre', () => {
            expect(genreManager.isValidGenre('house')).toBe(true);
            expect(genreManager.isValidGenre('techno')).toBe(true);
        });

        it('should return false for invalid genre', () => {
            expect(genreManager.isValidGenre('nonexistent')).toBe(false);
        });

        it('should handle null/undefined', () => {
            expect(genreManager.isValidGenre(null)).toBe(false);
            expect(genreManager.isValidGenre(undefined)).toBe(false);
        });

        it('should normalize case', () => {
            expect(genreManager.isValidGenre('HOUSE')).toBe(true);
            expect(genreManager.isValidGenre('  house  ')).toBe(true);
        });
    });

    describe('normalizeSubGenreValue', () => {
        it('should convert to lowercase with underscores', () => {
            expect(genreManager.normalizeSubGenreValue('Classic House')).toBe('classic_house');
            expect(genreManager.normalizeSubGenreValue('Deep House')).toBe('deep_house');
        });

        it('should handle multiple spaces', () => {
            expect(genreManager.normalizeSubGenreValue('Classic  House')).toBe('classic_house');
        });

        it('should handle empty string', () => {
            expect(genreManager.normalizeSubGenreValue('')).toBe('');
        });

        it('should handle null/undefined', () => {
            expect(genreManager.normalizeSubGenreValue(null)).toBe('');
            expect(genreManager.normalizeSubGenreValue(undefined)).toBe('');
        });
    });
});

