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
        characteristics: ['Steady kick', 'Hi-hats', 'Bassline', 'Piano stabs'],
        defaultTempo: 124,
        defaultEnergy: 6,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    tech_house: {
        bpmRange: '124-128',
        description: 'Tech house with syncopated hats and percussive elements',
        characteristics: ['Syncopated hats', 'Percussive', 'Minimal', 'Groovy'],
        defaultTempo: 126,
        defaultEnergy: 6,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    deep_house: {
        bpmRange: '120-125',
        description: 'Soulful, atmospheric house with warm pads and vocals',
        characteristics: ['Warm pads', 'Vocals', 'Atmospheric', 'Soulful'],
        defaultTempo: 122,
        defaultEnergy: 5,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    techno: {
        bpmRange: '125-140',
        description: 'Minimal, hypnotic techno with driving basslines',
        characteristics: ['Driving bass', 'Minimal', 'Hypnotic', 'Industrial'],
        defaultTempo: 130,
        defaultEnergy: 7,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    disco: {
        bpmRange: '110-120',
        description: 'Classic disco with funky basslines and strings',
        characteristics: ['Funky bass', 'Strings', 'Brass', 'Four-on-floor'],
        defaultTempo: 115,
        defaultEnergy: 7,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    progressive_house: {
        bpmRange: '125-130',
        description: 'Building, evolving house with long progressions',
        characteristics: ['Long progressions', 'Building', 'Evolving', 'Atmospheric'],
        defaultTempo: 128,
        defaultEnergy: 7,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    minimal: {
        bpmRange: '120-130',
        description: 'Sparse, minimal elements with subtle variations',
        characteristics: ['Sparse', 'Subtle variations', 'Minimal', 'Textured'],
        defaultTempo: 125,
        defaultEnergy: 5,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    trance: {
        bpmRange: '130-140',
        description: 'Uplifting, melodic trance with arpeggiated leads',
        characteristics: ['Arpeggiated leads', 'Uplifting', 'Melodic', 'Euphoric'],
        defaultTempo: 135,
        defaultEnergy: 8,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    hard_techno: {
        bpmRange: '135-150',
        description: 'Aggressive, industrial techno with heavy kicks',
        characteristics: ['Heavy kicks', 'Aggressive', 'Industrial', 'Dark'],
        defaultTempo: 140,
        defaultEnergy: 9,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    acid_house: {
        bpmRange: '120-130',
        description: 'House with 303 basslines and acid sounds',
        characteristics: ['303 basslines', 'Acid sounds', 'Squelchy', 'Retro'],
        defaultTempo: 125,
        defaultEnergy: 7,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    experimental: {
        bpmRange: 'Variable',
        description: 'IDM, glitch, and avant-garde experimental music',
        characteristics: ['Glitch', 'IDM', 'Avant-garde', 'Unconventional'],
        defaultTempo: 120,
        defaultEnergy: 5,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    bass: {
        bpmRange: '140-160',
        description: 'Dubstep, future bass, and UK bass music',
        characteristics: ['Heavy bass', 'Wobbles', 'Syncopated', 'Modern'],
        defaultTempo: 140,
        defaultEnergy: 8,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    hiphop: {
        bpmRange: '85-100',
        description: 'Classic hip-hop with boom bap drums',
        characteristics: ['Boom bap', 'Samples', '808s', 'Swing'],
        defaultTempo: 90,
        defaultEnergy: 5,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    boom_bap: {
        bpmRange: '85-95',
        description: 'Classic boom bap hip-hop with sampled drums',
        characteristics: ['Sampled drums', 'Classic', 'Swing', 'Groove'],
        defaultTempo: 90,
        defaultEnergy: 5,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    trap: {
        bpmRange: '130-150',
        description: 'Modern trap with 808s and hi-hat rolls',
        characteristics: ['808s', 'Hi-hat rolls', 'Modern', 'Heavy bass'],
        defaultTempo: 140,
        defaultEnergy: 7,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    lo_fi: {
        bpmRange: '75-90',
        description: 'Lo-fi hip-hop beats with vinyl crackle',
        characteristics: ['Vinyl crackle', 'Chill', 'Relaxed', 'Ambient'],
        defaultTempo: 85,
        defaultEnergy: 3,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    drill: {
        bpmRange: '140-150',
        description: 'Aggressive urban drill with dark vibes',
        characteristics: ['Dark', 'Aggressive', 'Fast hi-hats', 'Urban'],
        defaultTempo: 145,
        defaultEnergy: 8,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    dnb: {
        bpmRange: '170-180',
        description: 'Fast breakbeats with heavy basslines (original)',
        characteristics: ['Fast breakbeats', 'Heavy bass', 'Complex', 'Energetic'],
        defaultTempo: 174,
        defaultEnergy: 9,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    jungle: {
        bpmRange: '160-180',
        description: 'Classic jungle with chopped breaks',
        characteristics: ['Chopped breaks', 'Ragga', 'Classic', 'Fast'],
        defaultTempo: 170,
        defaultEnergy: 9,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    reggae: {
        bpmRange: '60-90',
        description: 'Roots reggae, dancehall, dub, and ska',
        characteristics: ['Off-beat', 'Bass heavy', 'Laid back', 'Vocal'],
        defaultTempo: 75,
        defaultEnergy: 4,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    ambient: {
        bpmRange: '60-90',
        description: 'Sparse, atmospheric ambient music',
        characteristics: ['Atmospheric', 'Sparse', 'Textural', 'Ethereal'],
        defaultTempo: 75,
        defaultEnergy: 2,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    funk: {
        bpmRange: '100-120',
        description: 'Classic funk with syncopated basslines',
        characteristics: ['Syncopated bass', 'Horns', 'Groove', 'Classic'],
        defaultTempo: 110,
        defaultEnergy: 6,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    soul: {
        bpmRange: '70-100',
        description: 'Classic soul with emotional vocals',
        characteristics: ['Emotional vocals', 'Warm', 'Classic', 'Melodic'],
        defaultTempo: 85,
        defaultEnergy: 4,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    psychedelic: {
        bpmRange: 'Variable',
        description: 'Psychedelic rock and trance with trippy sounds',
        characteristics: ['Trippy', 'Echo', 'Delay', 'Experimental'],
        defaultTempo: 120,
        defaultEnergy: 6,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    jazz: {
        bpmRange: 'Variable',
        description: 'Classic jazz with swing and improvisation',
        characteristics: ['Swing', 'Improvisation', 'Complex', 'Sophisticated'],
        defaultTempo: 120,
        defaultEnergy: 5,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    lofi: {
        bpmRange: '75-90',
        description: 'Alternative lo-fi hip-hop beats',
        characteristics: ['Vinyl crackle', 'Chill', 'Relaxed', 'Ambient'],
        defaultTempo: 85,
        defaultEnergy: 3,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    r_and_b: {
        bpmRange: '70-100',
        description: 'R&B rhythms with soulful vocals',
        characteristics: ['Soulful', 'Smooth', 'Vocal', 'Groove'],
        defaultTempo: 90,
        defaultEnergy: 5,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    neo_soul: {
        bpmRange: '70-100',
        description: 'Modern soul with contemporary elements',
        characteristics: ['Modern', 'Soulful', 'Groove', 'Contemporary'],
        defaultTempo: 85,
        defaultEnergy: 5,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    indie_rock: {
        bpmRange: '100-140',
        description: 'Independent rock music',
        characteristics: ['Guitar-driven', 'Alternative', 'Raw', 'Authentic'],
        defaultTempo: 120,
        defaultEnergy: 6,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    alternative: {
        bpmRange: '100-140',
        description: 'Alternative rock music',
        characteristics: ['Alternative', 'Rock', 'Edgy', 'Diverse'],
        defaultTempo: 120,
        defaultEnergy: 6,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    post_rock: {
        bpmRange: '80-120',
        description: 'Post-rock with atmospheric elements',
        characteristics: ['Atmospheric', 'Instrumental', 'Building', 'Textural'],
        defaultTempo: 100,
        defaultEnergy: 5,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    jazz_fusion: {
        bpmRange: 'Variable',
        description: 'Jazz fusion with modern elements',
        characteristics: ['Fusion', 'Modern', 'Complex', 'Sophisticated'],
        defaultTempo: 120,
        defaultEnergy: 6,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    nu_jazz: {
        bpmRange: 'Variable',
        description: 'Nu-jazz with electronic elements',
        characteristics: ['Electronic', 'Jazz', 'Modern', 'Fusion'],
        defaultTempo: 120,
        defaultEnergy: 6,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    reggaeton: {
        bpmRange: '90-100',
        description: 'Reggaeton with dembow rhythm',
        characteristics: ['Dembow', 'Latin', 'Urban', 'Danceable'],
        defaultTempo: 95,
        defaultEnergy: 7,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    dembow: {
        bpmRange: '90-100',
        description: 'Dembow rhythm pattern',
        characteristics: ['Dembow', 'Latin', 'Rhythmic', 'Danceable'],
        defaultTempo: 95,
        defaultEnergy: 7,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    salsa: {
        bpmRange: '150-250',
        description: 'Salsa with Latin rhythms',
        characteristics: ['Latin', 'Rhythmic', 'Danceable', 'Brass'],
        defaultTempo: 180,
        defaultEnergy: 8,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    bossa_nova: {
        bpmRange: '100-130',
        description: 'Bossa nova with Brazilian rhythms',
        characteristics: ['Brazilian', 'Smooth', 'Jazzy', 'Relaxed'],
        defaultTempo: 115,
        defaultEnergy: 4,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    samba: {
        bpmRange: '100-130',
        description: 'Samba with Brazilian rhythms',
        characteristics: ['Brazilian', 'Rhythmic', 'Festive', 'Danceable'],
        defaultTempo: 115,
        defaultEnergy: 7,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    chillout: {
        bpmRange: '60-100',
        description: 'Chillout music for relaxation',
        characteristics: ['Relaxing', 'Ambient', 'Smooth', 'Calm'],
        defaultTempo: 80,
        defaultEnergy: 3,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    trip_hop: {
        bpmRange: '80-110',
        description: 'Trip-hop with downtempo beats',
        characteristics: ['Downtempo', 'Atmospheric', 'Hip-hop', 'Dark'],
        defaultTempo: 95,
        defaultEnergy: 4,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    breakbeat: {
        bpmRange: '120-140',
        description: 'Breakbeat with syncopated rhythms',
        characteristics: ['Breakbeat', 'Syncopated', 'Energetic', 'Danceable'],
        defaultTempo: 130,
        defaultEnergy: 7,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    garage: {
        bpmRange: '130-140',
        description: 'UK garage with 2-step rhythm',
        characteristics: ['2-step', 'UK', 'Garage', 'Syncopated'],
        defaultTempo: 135,
        defaultEnergy: 7,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    '2step': {
        bpmRange: '130-140',
        description: '2-step garage rhythm',
        characteristics: ['2-step', 'Garage', 'Syncopated', 'UK'],
        defaultTempo: 135,
        defaultEnergy: 7,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    afrobeat: {
        bpmRange: '100-120',
        description: 'Afrobeat with African rhythms',
        characteristics: ['African', 'Rhythmic', 'Groovy', 'Percussive'],
        defaultTempo: 110,
        defaultEnergy: 7,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    // SERGIK DNA Intelligence Categories
    sergik_dna: {
        bpmRange: '40-180',
        description: 'SERGIK\'s intelligence-enhanced DNA categories based on analysis of 1,895 tracks. Includes emotional, psychological, sonic, and intent intelligence.',
        characteristics: ['Intelligence-based', 'Emotional mapping', 'Psychological effects', 'Sonic characteristics', 'Intent detection'],
        defaultTempo: 120,
        defaultEnergy: 6,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    sergik_dna_hiphop: {
        bpmRange: '80-90',
        description: 'Hip-Hop with SERGIK DNA intelligence categories',
        characteristics: ['SERGIK DNA Intelligence', 'Groovy', 'Chill', 'Intense', 'Calm', 'Social', 'Productivity', 'Creative', 'Dance Floor', 'Background', 'Workout'],
        defaultTempo: 85,
        defaultEnergy: 5,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    sergik_dna_funk: {
        bpmRange: '100-120',
        description: 'Funk with SERGIK DNA intelligence categories',
        characteristics: ['SERGIK DNA Intelligence', 'Groovy', 'Chill', 'Intense', 'Calm', 'Social', 'Productivity', 'Creative', 'Dance Floor', 'Background', 'Workout'],
        defaultTempo: 110,
        defaultEnergy: 6,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    sergik_dna_house: {
        bpmRange: '120-129',
        description: 'House with SERGIK DNA intelligence categories',
        characteristics: ['SERGIK DNA Intelligence', 'Groovy', 'Chill', 'Intense', 'Calm', 'Social', 'Productivity', 'Creative', 'Dance Floor', 'Background', 'Workout'],
        defaultTempo: 124,
        defaultEnergy: 6,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    sergik_dna_soul: {
        bpmRange: '70-100',
        description: 'Soul with SERGIK DNA intelligence categories',
        characteristics: ['SERGIK DNA Intelligence', 'Groovy', 'Chill', 'Intense', 'Calm', 'Social', 'Productivity', 'Creative', 'Dance Floor', 'Background', 'Workout'],
        defaultTempo: 85,
        defaultEnergy: 4,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    sergik_dna_reggae: {
        bpmRange: '60-90',
        description: 'Reggae with SERGIK DNA intelligence categories',
        characteristics: ['SERGIK DNA Intelligence', 'Groovy', 'Chill', 'Intense', 'Calm', 'Social', 'Productivity', 'Creative', 'Dance Floor', 'Background', 'Workout'],
        defaultTempo: 75,
        defaultEnergy: 4,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    sergik_dna_techno: {
        bpmRange: '125-140',
        description: 'Techno with SERGIK DNA intelligence categories',
        characteristics: ['SERGIK DNA Intelligence', 'Groovy', 'Chill', 'Intense', 'Calm', 'Social', 'Productivity', 'Creative', 'Dance Floor', 'Background', 'Workout'],
        defaultTempo: 130,
        defaultEnergy: 7,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    sergik_dna_disco: {
        bpmRange: '110-120',
        description: 'Disco with SERGIK DNA intelligence categories',
        characteristics: ['SERGIK DNA Intelligence', 'Groovy', 'Chill', 'Intense', 'Calm', 'Social', 'Productivity', 'Creative', 'Dance Floor', 'Background', 'Workout'],
        defaultTempo: 115,
        defaultEnergy: 7,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    sergik_dna_ambient: {
        bpmRange: '60-90',
        description: 'Ambient with SERGIK DNA intelligence categories',
        characteristics: ['SERGIK DNA Intelligence', 'Groovy', 'Chill', 'Intense', 'Calm', 'Social', 'Productivity', 'Creative', 'Dance Floor', 'Background', 'Workout'],
        defaultTempo: 75,
        defaultEnergy: 2,
        defaultKey: '7A',
        defaultScale: 'minor'
    },
    sergik_dna_jazz: {
        bpmRange: 'Variable',
        description: 'Jazz with SERGIK DNA intelligence categories',
        characteristics: ['SERGIK DNA Intelligence', 'Groovy', 'Chill', 'Intense', 'Calm', 'Social', 'Productivity', 'Creative', 'Dance Floor', 'Background', 'Workout'],
        defaultTempo: 120,
        defaultEnergy: 5,
        defaultKey: '10B',
        defaultScale: 'major'
    },
    sergik_dna_dnb: {
        bpmRange: '170-180',
        description: 'Drum & Bass with SERGIK DNA intelligence categories',
        characteristics: ['SERGIK DNA Intelligence', 'Groovy', 'Chill', 'Intense', 'Calm', 'Social', 'Productivity', 'Creative', 'Dance Floor', 'Background', 'Workout'],
        defaultTempo: 174,
        defaultEnergy: 9,
        defaultKey: '7A',
        defaultScale: 'minor'
    }
};

// Memoization cache for genre defaults
const genreDefaultsCache = new Map();

/**
 * Parse BPM range string to get default tempo
 * @param {string} bpmRange - BPM range string like "120-130" or "Variable"
 * @returns {number} Default tempo value
 */
function parseBPMRange(bpmRange) {
    if (!bpmRange || bpmRange === 'Variable') {
        return 120; // Default fallback
    }
    
    const match = bpmRange.match(/(\d+)-(\d+)/);
    if (match) {
        const min = parseInt(match[1], 10);
        const max = parseInt(match[2], 10);
        return Math.round((min + max) / 2); // Return middle of range
    }
    
    return 120; // Default fallback
}

/**
 * Get genre defaults (tempo, energy, key, scale) with memoization
 * @param {string} genre - Genre name
 * @returns {Object|null} Genre defaults or null if not found
 */
export function getGenreDefaults(genre) {
    if (!genre) return null;
    
    const normalized = genre.toLowerCase().trim();
    
    // Check cache first
    if (genreDefaultsCache.has(normalized)) {
        return genreDefaultsCache.get(normalized);
    }
    
    const info = genreInfo[normalized];
    if (!info) return null;
    
    const defaults = {
        tempo: info.defaultTempo || parseBPMRange(info.bpmRange),
        energy: info.defaultEnergy || 6,
        key: info.defaultKey || '10B',
        scale: info.defaultScale || 'major'
    };
    
    // Cache result
    genreDefaultsCache.set(normalized, defaults);
    
    return defaults;
}

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

