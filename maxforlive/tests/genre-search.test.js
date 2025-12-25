/**
 * @fileoverview Unit tests for GenreSearch class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenreSearch } from '../js/genre-search.js';
import { GenreManager } from '../js/genre-manager.js';

describe('GenreSearch', () => {
    let genreManager;
    let genreSelect;
    let searchInput;
    let genreSearch;

    beforeEach(() => {
        genreManager = new GenreManager();
        
        // Create DOM elements
        document.body.innerHTML = '';
        genreSelect = document.createElement('select');
        genreSelect.id = 'genre-select';
        
        // Add some options
        const optgroup = document.createElement('optgroup');
        optgroup.label = 'Electronic';
        ['house', 'techno', 'trance'].forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
            optgroup.appendChild(option);
        });
        genreSelect.appendChild(optgroup);
        
        document.body.appendChild(genreSelect);
    });

    describe('constructor', () => {
        it('should create instance and initialize', () => {
            genreSearch = new GenreSearch(genreManager, genreSelect);
            expect(genreSearch).toBeDefined();
            expect(genreSearch.genreSelect).toBe(genreSelect);
        });

        it('should create search input if not provided', () => {
            genreSearch = new GenreSearch(genreManager, genreSelect);
            expect(genreSearch.searchInput).toBeDefined();
            expect(genreSearch.searchInput.tagName).toBe('INPUT');
        });
    });

    describe('filterGenres', () => {
        beforeEach(() => {
            genreSearch = new GenreSearch(genreManager, genreSelect);
        });

        it('should filter genres by query', () => {
            genreSearch.filterGenres('house');
            const options = genreSelect.querySelectorAll('option');
            expect(options.length).toBeGreaterThan(0);
        });

        it('should restore original options when query is empty', () => {
            genreSearch.filterGenres('house');
            genreSearch.filterGenres('');
            expect(genreSearch.isFiltered).toBe(false);
        });

        it('should handle invalid query gracefully', () => {
            expect(() => genreSearch.filterGenres(null)).not.toThrow();
            expect(() => genreSearch.filterGenres(undefined)).not.toThrow();
        });
    });

    describe('clearSearch', () => {
        beforeEach(() => {
            genreSearch = new GenreSearch(genreManager, genreSelect);
        });

        it('should clear search input and restore options', () => {
            genreSearch.filterGenres('house');
            genreSearch.clearSearch();
            expect(genreSearch.searchInput.value).toBe('');
            expect(genreSearch.isFiltered).toBe(false);
        });
    });
});

