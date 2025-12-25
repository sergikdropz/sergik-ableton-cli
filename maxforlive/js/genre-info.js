/**
 * @fileoverview Genre Information - BPM ranges, descriptions, and characteristics
 * @module genre-info
 */

/**
 * Genre information database
 * @type {Object.<string, Object>}
 */
export const genreInfo = {
    house: {
        bpmRange: '120-130',
        description: 'Classic 4-on-the-floor pattern with steady kick and hi-hats',
        characteristics: ['Steady kick', 'Hi-hats', 'Bassline', 'Piano stabs']
    },
    tech_house: {
        bpmRange: '124-128',
        description: 'Tech house with syncopated hats and percussive elements',
        characteristics: ['Syncopated hats', 'Percussive', 'Minimal', 'Groovy']
    },
    deep_house: {
        bpmRange: '120-125',
        description: 'Soulful, atmospheric house with warm pads and vocals',
        characteristics: ['Warm pads', 'Vocals', 'Atmospheric', 'Soulful']
    },
    techno: {
        bpmRange: '125-140',
        description: 'Minimal, hypnotic techno with driving basslines',
        characteristics: ['Driving bass', 'Minimal', 'Hypnotic', 'Industrial']
    },
    disco: {
        bpmRange: '110-120',
        description: 'Classic disco with funky basslines and strings',
        characteristics: ['Funky bass', 'Strings', 'Brass', 'Four-on-floor']
    },
    progressive_house: {
        bpmRange: '125-130',
        description: 'Building, evolving house with long progressions',
        characteristics: ['Long progressions', 'Building', 'Evolving', 'Atmospheric']
    },
    minimal: {
        bpmRange: '120-130',
        description: 'Sparse, minimal elements with subtle variations',
        characteristics: ['Sparse', 'Subtle variations', 'Minimal', 'Textured']
    },
    trance: {
        bpmRange: '130-140',
        description: 'Uplifting, melodic trance with arpeggiated leads',
        characteristics: ['Arpeggiated leads', 'Uplifting', 'Melodic', 'Euphoric']
    },
    hard_techno: {
        bpmRange: '135-150',
        description: 'Aggressive, industrial techno with heavy kicks',
        characteristics: ['Heavy kicks', 'Aggressive', 'Industrial', 'Dark']
    },
    acid_house: {
        bpmRange: '120-130',
        description: 'House with 303 basslines and acid sounds',
        characteristics: ['303 basslines', 'Acid sounds', 'Squelchy', 'Retro']
    },
    experimental: {
        bpmRange: 'Variable',
        description: 'IDM, glitch, and avant-garde experimental music',
        characteristics: ['Glitch', 'IDM', 'Avant-garde', 'Unconventional']
    },
    bass: {
        bpmRange: '140-160',
        description: 'Dubstep, future bass, and UK bass music',
        characteristics: ['Heavy bass', 'Wobbles', 'Syncopated', 'Modern']
    },
    hiphop: {
        bpmRange: '85-100',
        description: 'Classic hip-hop with boom bap drums',
        characteristics: ['Boom bap', 'Samples', '808s', 'Swing']
    },
    boom_bap: {
        bpmRange: '85-95',
        description: 'Classic boom bap hip-hop with sampled drums',
        characteristics: ['Sampled drums', 'Classic', 'Swing', 'Groove']
    },
    trap: {
        bpmRange: '130-150',
        description: 'Modern trap with 808s and hi-hat rolls',
        characteristics: ['808s', 'Hi-hat rolls', 'Modern', 'Heavy bass']
    },
    lo_fi: {
        bpmRange: '75-90',
        description: 'Lo-fi hip-hop beats with vinyl crackle',
        characteristics: ['Vinyl crackle', 'Chill', 'Relaxed', 'Ambient']
    },
    drill: {
        bpmRange: '140-150',
        description: 'Aggressive urban drill with dark vibes',
        characteristics: ['Dark', 'Aggressive', 'Fast hi-hats', 'Urban']
    },
    dnb: {
        bpmRange: '170-180',
        description: 'Fast breakbeats with heavy basslines',
        characteristics: ['Fast breakbeats', 'Heavy bass', 'Complex', 'Energetic']
    },
    jungle: {
        bpmRange: '160-180',
        description: 'Classic jungle with chopped breaks',
        characteristics: ['Chopped breaks', 'Ragga', 'Classic', 'Fast']
    },
    reggae: {
        bpmRange: '60-90',
        description: 'Roots reggae, dancehall, dub, and ska',
        characteristics: ['Off-beat', 'Bass heavy', 'Laid back', 'Vocal']
    },
    ambient: {
        bpmRange: '60-90',
        description: 'Sparse, atmospheric ambient music',
        characteristics: ['Atmospheric', 'Sparse', 'Textural', 'Ethereal']
    },
    funk: {
        bpmRange: '100-120',
        description: 'Classic funk with syncopated basslines',
        characteristics: ['Syncopated bass', 'Horns', 'Groove', 'Classic']
    },
    soul: {
        bpmRange: '70-100',
        description: 'Classic soul with emotional vocals',
        characteristics: ['Emotional vocals', 'Warm', 'Classic', 'Melodic']
    },
    psychedelic: {
        bpmRange: 'Variable',
        description: 'Psychedelic rock and trance with trippy sounds',
        characteristics: ['Trippy', 'Echo', 'Delay', 'Experimental']
    },
    jazz: {
        bpmRange: 'Variable',
        description: 'Classic jazz with swing and improvisation',
        characteristics: ['Swing', 'Improvisation', 'Complex', 'Sophisticated']
    }
};

/**
 * Get genre information
 * @param {string} genre - Genre name
 * @returns {Object|null} Genre information or null if not found
 */
export function getGenreInfo(genre) {
    if (!genre) return null;
    const normalized = genre.toLowerCase().trim();
    return genreInfo[normalized] || null;
}

/**
 * Get BPM range for genre
 * @param {string} genre - Genre name
 * @returns {string} BPM range or 'Unknown'
 */
export function getBPMRange(genre) {
    const info = getGenreInfo(genre);
    return info ? info.bpmRange : 'Unknown';
}

/**
 * Get description for genre
 * @param {string} genre - Genre name
 * @returns {string} Description or empty string
 */
export function getGenreDescription(genre) {
    const info = getGenreInfo(genre);
    return info ? info.description : '';
}

