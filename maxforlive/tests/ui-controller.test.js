/**
 * @fileoverview Unit tests for UIController class
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UIController } from '../js/ui-controller.js';

describe('UIController', () => {
    let genreSelect, subGenreSelect, subGenreLine, uiController;

    beforeEach(() => {
        // Create mock DOM elements
        genreSelect = document.createElement('select');
        genreSelect.id = 'genre-select';
        genreSelect.innerHTML = '<option value="house">House</option>';

        subGenreSelect = document.createElement('select');
        subGenreSelect.id = 'subgenre-select';
        subGenreSelect.innerHTML = '<option value="">None</option>';

        subGenreLine = document.createElement('div');
        subGenreLine.id = 'subgenre-line';
        subGenreLine.style.display = 'none';

        document.body.appendChild(genreSelect);
        document.body.appendChild(subGenreSelect);
        document.body.appendChild(subGenreLine);

        uiController = new UIController({
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

    describe('constructor', () => {
        it('should create instance with valid elements', () => {
            expect(uiController).toBeInstanceOf(UIController);
            expect(uiController.genreSelect).toBe(genreSelect);
            expect(uiController.subGenreSelect).toBe(subGenreSelect);
            expect(uiController.subGenreLine).toBe(subGenreLine);
        });

        it('should throw error if elements are missing', () => {
            expect(() => {
                new UIController({
                    genreSelect: null,
                    subGenreSelect,
                    subGenreLine
                });
            }).toThrow();
        });
    });

    describe('showSubGenreDropdown', () => {
        it('should show sub-genre dropdown', () => {
            subGenreLine.style.display = 'none';
            uiController.showSubGenreDropdown();
            expect(subGenreLine.style.display).toBe('flex');
        });
    });

    describe('hideSubGenreDropdown', () => {
        it('should hide sub-genre dropdown', () => {
            subGenreLine.style.display = 'flex';
            uiController.hideSubGenreDropdown();
            expect(subGenreLine.style.display).toBe('none');
        });
    });

    describe('updateSubGenreDropdown', () => {
        it('should populate dropdown with sub-genres', () => {
            const subGenres = ['Classic House', 'Deep House', 'Tech House'];
            uiController.updateSubGenreDropdown(subGenres, (sg) => sg.toLowerCase().replace(/\s+/g, '_'));

            const options = subGenreSelect.querySelectorAll('option');
            expect(options.length).toBe(4); // None + 3 sub-genres
            expect(options[1].value).toBe('classic_house');
            expect(options[1].textContent).toBe('Classic House');
            expect(subGenreLine.style.display).toBe('flex');
        });

        it('should hide dropdown when no sub-genres', () => {
            uiController.updateSubGenreDropdown([], null);
            expect(subGenreSelect.querySelectorAll('option').length).toBe(1); // Only "None"
            expect(subGenreLine.style.display).toBe('none');
        });

        it('should handle empty array', () => {
            uiController.updateSubGenreDropdown([], null);
            expect(subGenreLine.style.display).toBe('none');
        });

        it('should always include "None" option', () => {
            const subGenres = ['Classic House'];
            uiController.updateSubGenreDropdown(subGenres, (sg) => sg.toLowerCase().replace(/\s+/g, '_'));
            const options = subGenreSelect.querySelectorAll('option');
            expect(options[0].value).toBe('');
            expect(options[0].textContent).toBe('None');
        });
    });

    describe('getSelectedGenre', () => {
        it('should return selected genre value', () => {
            genreSelect.value = 'house';
            expect(uiController.getSelectedGenre()).toBe('house');
        });

        it('should return empty string if no selection', () => {
            genreSelect.value = '';
            expect(uiController.getSelectedGenre()).toBe('');
        });
    });

    describe('getSelectedSubGenre', () => {
        it('should return selected sub-genre value', () => {
            subGenreSelect.value = 'classic_house';
            expect(uiController.getSelectedSubGenre()).toBe('classic_house');
        });

        it('should return empty string if no selection', () => {
            subGenreSelect.value = '';
            expect(uiController.getSelectedSubGenre()).toBe('');
        });
    });

    describe('setGenre', () => {
        it('should set genre value', () => {
            genreSelect.value = '';
            uiController.setGenre('techno');
            expect(genreSelect.value).toBe('techno');
        });

        it('should trigger change event', (done) => {
            genreSelect.addEventListener('change', () => {
                done();
            });
            uiController.setGenre('house');
        });
    });

    describe('setSubGenre', () => {
        it('should set sub-genre value', () => {
            subGenreSelect.value = '';
            uiController.setSubGenre('classic_house');
            expect(subGenreSelect.value).toBe('classic_house');
        });
    });
});

