/**
 * @fileoverview Idea Analyzer - Extracts musical parameters from idea text input
 * @module idea-analyzer
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('IdeaAnalyzer');

/**
 * Genre keyword mapping for text extraction
 */
const GENRE_KEYWORDS = {
    'tech house': 'tech_house',
    'techhouse': 'tech_house',
    'house': 'house',
    'deep house': 'deep_house',
    'techno': 'techno',
    'hip hop': 'hiphop',
    'hiphop': 'hiphop',
    'hip-hop': 'hiphop',
    'boom bap': 'boom_bap',
    'boombap': 'boom_bap',
    'trap': 'trap',
    'lo-fi': 'lo_fi',
    'lofi': 'lo_fi',
    'lo fi': 'lo_fi',
    'drill': 'drill',
    'drum and bass': 'dnb',
    'drum & bass': 'dnb',
    'dnb': 'dnb',
    'jungle': 'jungle',
    'reggaeton': 'reggaeton',
    'reggae': 'reggae',
    'ambient': 'ambient',
    'downtempo': 'downtempo',
    'funk': 'funk',
    'soul': 'soul',
    'disco': 'disco',
    'jazz': 'jazz',
    'trance': 'trance',
    'progressive house': 'progressive_house',
    'minimal': 'minimal',
    'acid house': 'acid_house',
    'hard techno': 'hard_techno',
    'bass': 'bass'
};

/**
 * Energy keyword mapping
 */
const ENERGY_KEYWORDS = {
    'ambient': 1,
    'very low': 1,
    'very low energy': 1,
    'chill': 2,
    'low': 2,
    'low energy': 2,
    'lo-fi': 3,
    'lofi': 3,
    'downtempo': 4,
    'mid': 5,
    'mid energy': 5,
    'groove': 6,
    'groovy': 6,
    'upbeat': 7,
    'high': 8,
    'high energy': 8,
    'peak time': 9,
    'peak': 9,
    'festival': 10,
    'intense': 9,
    'aggressive': 9
};

/**
 * Intelligence keyword mapping
 */
const INTELLIGENCE_KEYWORDS = {
    'groovy': 'groovy',
    'funky': 'groovy',
    'rhythmic': 'groovy',
    'chill': 'chill',
    'relaxed': 'chill',
    'mellow': 'chill',
    'intense': 'intense',
    'aggressive': 'intense',
    'powerful': 'intense',
    'calm': 'calm',
    'serene': 'calm',
    'peaceful': 'calm',
    'social': 'social',
    'party': 'social',
    'productivity': 'productivity',
    'focus': 'productivity',
    'work': 'productivity',
    'creative': 'creative',
    'artistic': 'creative',
    'dance floor': 'dance_floor',
    'club': 'dance_floor',
    'festival': 'dance_floor',
    'background': 'background',
    'ambient': 'background',
    'workout': 'workout',
    'gym': 'workout',
    'cardio': 'workout'
};

/**
 * Key notation patterns
 */
const KEY_PATTERNS = [
    { pattern: /(\d+[AB])\s*(?:\([^)]+\))?/gi, extract: (match) => match[1] },
    { pattern: /([CDEFGAB][#b]?)\s*(?:major|minor|maj|min)/gi, extract: (match) => {
        // Convert to Camelot notation (simplified)
        const keyMap = {
            'C': '8B', 'C#': '3B', 'Db': '3B',
            'D': '10B', 'D#': '5B', 'Eb': '5B',
            'E': '12B', 'F': '7B',
            'F#': '2B', 'Gb': '2B',
            'G': '9B', 'G#': '4B', 'Ab': '4B',
            'A': '11B', 'A#': '6B', 'Bb': '6B',
            'B': '1B'
        };
        return keyMap[match[1]] || null;
    }}
];

/**
 * Scale patterns
 */
const SCALE_PATTERNS = {
    'major': ['major', 'maj', 'ionian'],
    'minor': ['minor', 'min', 'aeolian', 'natural minor'],
    'dorian': ['dorian'],
    'phrygian': ['phrygian'],
    'lydian': ['lydian'],
    'mixolydian': ['mixolydian'],
    'locrian': ['locrian'],
    'harmonic_minor': ['harmonic minor', 'harmonic'],
    'melodic_minor': ['melodic minor', 'melodic'],
    'pent_major': ['pentatonic major', 'pent major'],
    'pent_minor': ['pentatonic minor', 'pent minor'],
    'blues': ['blues']
};

/**
 * IdeaAnalyzer class extracts musical parameters from text
 */
export class IdeaAnalyzer {
    /**
     * Create an IdeaAnalyzer instance
     */
    constructor() {
        // No initialization needed
    }
    
    /**
     * Analyze idea text and extract suggestions
     * @param {string} ideaText - User's idea text
     * @returns {Object} Extracted suggestions
     */
    analyze(ideaText) {
        if (!ideaText || typeof ideaText !== 'string') {
            return {
                genre: null,
                tempo: null,
                energy: null,
                key: null,
                scale: null,
                intelligence: null
            };
        }
        
        const normalized = ideaText.toLowerCase().trim();
        
        logger.debug('Analyzing idea text', { ideaText: normalized });
        
        return {
            genre: this.extractGenre(normalized),
            tempo: this.extractTempo(normalized),
            energy: this.extractEnergy(normalized),
            key: this.extractKey(normalized),
            scale: this.extractScale(normalized),
            intelligence: this.extractIntelligence(normalized)
        };
    }
    
    /**
     * Extract genre from text
     * @param {string} text - Normalized text
     * @returns {string|null} Genre value or null
     * @private
     */
    extractGenre(text) {
        // Check for exact matches first (longer phrases first)
        const sortedKeywords = Object.keys(GENRE_KEYWORDS).sort((a, b) => b.length - a.length);
        
        for (const keyword of sortedKeywords) {
            if (text.includes(keyword)) {
                const genre = GENRE_KEYWORDS[keyword];
                logger.debug(`Extracted genre: ${genre} from keyword: ${keyword}`);
                return genre;
            }
        }
        
        return null;
    }
    
    /**
     * Extract tempo from text
     * @param {string} text - Normalized text
     * @returns {number|null} Tempo value or null
     * @private
     */
    extractTempo(text) {
        // Look for BPM patterns: "120 bpm", "126bpm", "at 130", etc.
        const bpmPatterns = [
            /(\d{2,3})\s*bpm/gi,
            /(\d{2,3})bpm/gi,
            /at\s+(\d{2,3})/gi,
            /tempo\s+(\d{2,3})/gi,
            /(\d{2,3})\s+tempo/gi
        ];
        
        for (const pattern of bpmPatterns) {
            const match = pattern.exec(text);
            if (match) {
                const tempo = parseInt(match[1], 10);
                if (tempo >= 60 && tempo <= 200) {
                    logger.debug(`Extracted tempo: ${tempo}`);
                    return tempo;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Extract energy from text
     * @param {string} text - Normalized text
     * @returns {number|null} Energy value or null
     * @private
     */
    extractEnergy(text) {
        // Check for energy keywords
        const sortedKeywords = Object.keys(ENERGY_KEYWORDS).sort((a, b) => b.length - a.length);
        
        for (const keyword of sortedKeywords) {
            if (text.includes(keyword)) {
                const energy = ENERGY_KEYWORDS[keyword];
                logger.debug(`Extracted energy: ${energy} from keyword: ${keyword}`);
                return energy;
            }
        }
        
        // Look for numeric energy: "energy 7", "level 8", etc.
        const energyPatterns = [
            /energy\s+(\d{1,2})/gi,
            /level\s+(\d{1,2})/gi,
            /energy\s+(\d{1,2})\s*\/\s*10/gi
        ];
        
        for (const pattern of energyPatterns) {
            const match = pattern.exec(text);
            if (match) {
                const energy = parseInt(match[1], 10);
                if (energy >= 1 && energy <= 10) {
                    logger.debug(`Extracted energy: ${energy}`);
                    return energy;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Extract key from text
     * @param {string} text - Normalized text
     * @returns {string|null} Key value or null
     * @private
     */
    extractKey(text) {
        // Try Camelot notation first
        const camelotMatch = text.match(/(\d+[AB])/i);
        if (camelotMatch) {
            const key = camelotMatch[1].toUpperCase();
            logger.debug(`Extracted key: ${key}`);
            return key;
        }
        
        // Try standard notation
        for (const keyPattern of KEY_PATTERNS) {
            const match = keyPattern.pattern.exec(text);
            if (match) {
                const key = keyPattern.extract(match);
                if (key) {
                    logger.debug(`Extracted key: ${key}`);
                    return key;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Extract scale from text
     * @param {string} text - Normalized text
     * @returns {string|null} Scale value or null
     * @private
     */
    extractScale(text) {
        // Check for scale patterns
        for (const [scale, patterns] of Object.entries(SCALE_PATTERNS)) {
            for (const pattern of patterns) {
                if (text.includes(pattern)) {
                    logger.debug(`Extracted scale: ${scale} from pattern: ${pattern}`);
                    return scale;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Extract intelligence category from text
     * @param {string} text - Normalized text
     * @returns {string|null} Intelligence category or null
     * @private
     */
    extractIntelligence(text) {
        // Check for intelligence keywords
        const sortedKeywords = Object.keys(INTELLIGENCE_KEYWORDS).sort((a, b) => b.length - a.length);
        
        for (const keyword of sortedKeywords) {
            if (text.includes(keyword)) {
                const intelligence = INTELLIGENCE_KEYWORDS[keyword];
                logger.debug(`Extracted intelligence: ${intelligence} from keyword: ${keyword}`);
                return intelligence;
            }
        }
        
        return null;
    }
}

/**
 * Initialize idea analyzer
 * @returns {IdeaAnalyzer} Analyzer instance
 */
export function initializeIdeaAnalyzer() {
    return new IdeaAnalyzer();
}

