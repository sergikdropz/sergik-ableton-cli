/**
 * @fileoverview TypeScript type definitions for genre system
 * @module types
 */

/**
 * Genre configuration
 */
export interface GenreConfig {
    defaultGenre?: string;
    subGenreMap?: Record<string, string[]>;
    enableLogging?: boolean;
    enableErrorHandling?: boolean;
    enableSearch?: boolean;
    enableRecentSelections?: boolean;
    enableTooltips?: boolean;
    enableVisuals?: boolean;
}

/**
 * DOM elements interface
 */
export interface GenreElements {
    genreSelect: HTMLSelectElement;
    subGenreSelect: HTMLSelectElement;
    subGenreLine: HTMLElement;
}

/**
 * Selection result
 */
export interface GenreSelection {
    genre: string;
    subGenre: string;
}

/**
 * Genre information
 */
export interface GenreInfo {
    bpmRange: string;
    description: string;
    characteristics: string[];
}

/**
 * Recent selection item
 */
export interface RecentSelection {
    genre: string;
    subGenre: string;
    timestamp: number;
}

