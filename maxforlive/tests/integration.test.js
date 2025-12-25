/**
 * @fileoverview Integration tests for genre system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GenreSystem } from '../js/genre-system.js';
import { genreConfig } from '../js/config.js';

describe('GenreSystem Integration', () => {
    let genreSelect, subGenreSelect, subGenreLine, system;

    beforeEach(() => {
        // Create DOM structure
        genreSelect = document.createElement('select');
        genreSelect.id = 'genre-select';
        genreSelect.innerHTML = `
            <option value="house" selected>House</option>
            <option value="techno">Techno</option>
            <option value="hiphop">Hip-Hop</option>
        `;

        subGenreSelect = document.createElement('select');
        subGenreSelect.id = 'subgenre-select';
        subGenreSelect.innerHTML = '<option value="">None</option>';

        subGenreLine = document.createElement('div');
        subGenreLine.id = 'subgenre-line';
        subGenreLine.style.display = 'none';

        document.body.appendChild(genreSelect);
        document.body.appendChild(subGenreSelect);
        document.body.appendChild(subGenreLine);

        system = new GenreSystem(genreConfig);
        system.initialize({
            genreSelect,
            subGenreSelect,
            subGenreLine
        });
    });

    afterEach(() => {
        document.body.removeChild(genreSelect);
        document.body.removeChild(subGenreSelect);
        document.body.removeChild(subGenreLine);
    });

    describe('Full User Flow', () => {
        it('should initialize with default genre', () => {
            expect(system.initialized).toBe(true);
            expect(subGenreLine.style.display).toBe('flex'); // House has sub-genres
            expect(subGenreSelect.querySelectorAll('option').length).toBeGreaterThan(1);
        });

        it('should update sub-genres when genre changes', async () => {
            // Change genre
            genreSelect.value = 'techno';
            genreSelect.dispatchEvent(new Event('change', { bubbles: true }));

            // Wait for async update
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(subGenreLine.style.display).toBe('flex');
            const options = subGenreSelect.querySelectorAll('option');
            expect(options.length).toBeGreaterThan(1);
            // Check that techno sub-genres are present
            const optionTexts = Array.from(options).map(opt => opt.textContent);
            expect(optionTexts.some(text => text.includes('Techno'))).toBe(true);
        });

        it('should handle rapid genre changes', () => {
            const genres = ['house', 'techno', 'hiphop', 'house'];
            genres.forEach((genre, index) => {
                setTimeout(() => {
                    genreSelect.value = genre;
                    genreSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }, index * 10);
            });

            // After all changes, should be on last genre
            setTimeout(() => {
                expect(genreSelect.value).toBe('house');
            }, 50);
        });
    });

    describe('Selection Management', () => {
        it('should get current selection', () => {
            genreSelect.value = 'house';
            subGenreSelect.value = 'classic_house';
            
            const selection = system.getSelection();
            expect(selection.genre).toBe('house');
            expect(selection.subGenre).toBe('classic_house');
        });

        it('should return empty strings if not initialized', () => {
            const uninitializedSystem = new GenreSystem();
            const selection = uninitializedSystem.getSelection();
            expect(selection.genre).toBe('');
            expect(selection.subGenre).toBe('');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid genre gracefully', async () => {
            // First set a valid genre to show sub-genres
            genreSelect.value = 'house';
            genreSelect.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(subGenreLine.style.display).toBe('flex'); // Should be visible
            
            // Now set invalid genre (empty string)
            genreSelect.value = '';
            genreSelect.dispatchEvent(new Event('change', { bubbles: true }));

            // Wait for async update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // The system should hide dropdown for invalid/empty genre
            expect(subGenreLine.style.display).toBe('none');
        });

        it('should handle missing DOM elements', () => {
            const badSystem = new GenreSystem();
            expect(() => {
                badSystem.initialize({
                    genreSelect: null,
                    subGenreSelect: null,
                    subGenreLine: null
                });
            }).toThrow();
        });
    });

    describe('All Genres', () => {
        it('should handle all available genres', () => {
            const genreManager = system.genreManager;
            const allGenres = genreManager.getAllGenres();

            allGenres.forEach(genre => {
                genreSelect.value = genre;
                genreSelect.dispatchEvent(new Event('change', { bubbles: true }));
                
                setTimeout(() => {
                    const subGenres = genreManager.getSubGenres(genre);
                    if (subGenres.length > 0) {
                        expect(subGenreLine.style.display).toBe('flex');
                    } else {
                        expect(subGenreLine.style.display).toBe('none');
                    }
                }, 10);
            });
        });
    });
});

