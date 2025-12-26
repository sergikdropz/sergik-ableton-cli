/**
 * @fileoverview Input validation and sanitization utilities
 * @module utils/validator
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
    if (typeof input !== 'string') {
        return '';
    }

    // Create a temporary div element
    const div = document.createElement('div');
    div.textContent = input;
    return div.textContent || '';
}

/**
 * Validate genre name
 */
export function validateGenre(genre: string): boolean {
    if (!genre || typeof genre !== 'string') {
        return false;
    }

    // Allow alphanumeric, underscore, hyphen, and spaces
    const genrePattern = /^[a-zA-Z0-9_\-\s]+$/;
    return genrePattern.test(genre.trim()) && genre.trim().length > 0 && genre.trim().length <= 50;
}

/**
 * Validate sub-genre name
 */
export function validateSubGenre(subGenre: string): boolean {
    if (!subGenre || typeof subGenre !== 'string') {
        return false;
    }

    // Allow alphanumeric, underscore, hyphen, spaces, and common punctuation
    const subGenrePattern = /^[a-zA-Z0-9_\-\s&,()]+$/;
    return subGenrePattern.test(subGenre.trim()) && subGenre.trim().length > 0 && subGenre.trim().length <= 100;
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): boolean {
    if (typeof query !== 'string') {
        return false;
    }

    // Allow alphanumeric, spaces, and common search characters
    const searchPattern = /^[a-zA-Z0-9\s\-_&,()]*$/;
    return searchPattern.test(query) && query.length <= 200;
}

/**
 * Sanitize and validate search query
 */
export function sanitizeSearchQuery(query: string): string {
    if (!validateSearchQuery(query)) {
        return '';
    }
    return sanitizeString(query.trim());
}

/**
 * Validate localStorage data structure
 */
export interface RecentSelection {
    genre: string;
    subGenre?: string;
    timestamp: number;
}

export function validateRecentSelection(data: unknown): data is RecentSelection {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const selection = data as Record<string, unknown>;

    // Check required fields
    if (typeof selection.genre !== 'string' || !validateGenre(selection.genre)) {
        return false;
    }

    // Check optional subGenre
    if (selection.subGenre !== undefined) {
        if (typeof selection.subGenre !== 'string' || !validateSubGenre(selection.subGenre)) {
            return false;
        }
    }

    // Check timestamp
    if (typeof selection.timestamp !== 'number' || 
        selection.timestamp < 0 || 
        selection.timestamp > Date.now() + 86400000) { // Not more than 1 day in future
        return false;
    }

    return true;
}

/**
 * Validate array of recent selections
 */
export function validateRecentSelectionsArray(data: unknown): RecentSelection[] {
    if (!Array.isArray(data)) {
        return [];
    }

    return data.filter(validateRecentSelection);
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, (m) => map[m]);
}

