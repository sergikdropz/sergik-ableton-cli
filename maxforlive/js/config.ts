/**
 * @fileoverview Configuration and constants for genre/sub-genre system
 * @module config
 */

/**
 * Sub-genre mapping for all genres
 * Maps each genre to an array of available sub-genres
 */
export const subGenreMap: Record<string, string[]> = {
    // Electronic sub-genres
    'house': ['Classic House', 'Deep House', 'Tech House', 'Progressive House', 'Acid House', 'Future House', 'Tropical House', 'Garage House', 'Bass House', 'French House', 'Disco House', 'Soulful House'],
    'tech_house': ['Minimal Tech House', 'Dark Tech House', 'Driving Tech House', 'Groovy Tech House'],
    'deep_house': ['Soulful Deep House', 'Vocal Deep House', 'Instrumental Deep House', 'Classic Deep House'],
    'techno': ['Minimal Techno', 'Hard Techno', 'Industrial Techno', 'Acid Techno', 'Detroit Techno', 'Berlin Techno', 'Raw Techno', 'Melodic Techno'],
    'trance': ['Progressive Trance', 'Uplifting Trance', 'Vocal Trance', 'Psytrance', 'Tech Trance', 'Hard Trance'],
    'disco': ['Classic Disco', 'Nu-Disco', 'Italo Disco', 'French Disco', 'Disco House'],
    'progressive_house': ['Progressive Trance', 'Progressive Breaks', 'Progressive Techno'],
    'minimal': ['Minimal Techno', 'Minimal House', 'Microhouse', 'Minimal Deep'],
    'experimental': ['IDM', 'Glitch', 'Ambient Techno', 'Drone', 'Noise', 'Electroacoustic', 'Sound Art'],
    'bass': ['Dubstep', 'Future Bass', 'Trap', 'Bass House', 'UK Bass', 'Wonky', 'Juke', 'Footwork'],
    // Hip-Hop sub-genres
    'hiphop': ['Boom Bap', 'Trap', 'Drill', 'Mumble Rap', 'Conscious Hip-Hop', 'Gangsta Rap', 'Alternative Hip-Hop', 'Jazz Rap'],
    'boom_bap': ['Classic Boom Bap', 'Modern Boom Bap', 'Jazzy Boom Bap'],
    'trap': ['Atlanta Trap', 'Drill Trap', 'Melodic Trap', 'Latin Trap', 'Trap Metal'],
    'lo_fi': ['Lo-Fi Hip-Hop', 'Lo-Fi House', 'Chill Lo-Fi', 'Jazzy Lo-Fi'],
    'drill': ['UK Drill', 'NY Drill', 'Chicago Drill', 'Brooklyn Drill'],
    // Breakbeat & DnB sub-genres
    'dnb': ['Liquid DnB', 'Neurofunk', 'Jump-Up', 'Techstep', 'Drumfunk', 'Intelligent DnB', 'Darkstep'],
    'jungle': ['Classic Jungle', 'Ragga Jungle', 'Hardcore Jungle', 'Modern Jungle'],
    'breakbeat': ['Big Beat', 'Nu-Skool Breaks', 'Progressive Breaks', 'Acid Breaks'],
    'garage': ['UK Garage', 'Speed Garage', '2-Step', 'Future Garage', 'Bassline'],
    // Latin & World sub-genres
    'reggaeton': ['Classic Reggaeton', 'Trapeton', 'Neo Reggaeton', 'Latin Trap'],
    'reggae': ['Roots Reggae', 'Dancehall', 'Dub', 'Ska', 'Rocksteady', 'Lovers Rock'],
    'salsa': ['Salsa Dura', 'Salsa Romantica', 'Timba', 'Salsa Cubana'],
    // Ambient & Downtempo sub-genres
    'ambient': ['Dark Ambient', 'Drone Ambient', 'Space Ambient', 'Nature Ambient', 'Ambient Techno', 'Ambient House'],
    'downtempo': ['Trip-Hop', 'Chillout', 'Lounge', 'Nu-Jazz', 'Downtempo House'],
    'trip_hop': ['Classic Trip-Hop', 'Dark Trip-Hop', 'Jazzy Trip-Hop'],
    // Funk & Soul sub-genres
    'funk': ['Classic Funk', 'P-Funk', 'Nu-Funk', 'Deep Funk', 'Jazz Funk'],
    'soul': ['Classic Soul', 'Neo-Soul', 'Northern Soul', 'Deep Soul', 'Motown'],
    'r_and_b': ['Contemporary R&B', 'Neo-Soul', 'Alternative R&B', 'Quiet Storm'],
    // Rock & Alternative sub-genres
    'indie_rock': ['Indie Pop', 'Indie Folk', 'Garage Rock', 'Post-Punk Revival'],
    'alternative': ['Alternative Rock', 'Grunge', 'Britpop', 'Indie Alternative'],
    'post_rock': ['Post-Rock', 'Math Rock', 'Shoegaze', 'Ambient Post-Rock'],
    'psychedelic': ['Psychedelic Rock', 'Psytrance', 'Psychedelic Pop', 'Space Rock', 'Krautrock'],
    // Jazz & Fusion sub-genres
    'jazz': ['Bebop', 'Cool Jazz', 'Hard Bop', 'Free Jazz', 'Smooth Jazz', 'Acid Jazz'],
    'jazz_fusion': ['Jazz Fusion', 'Jazz Funk', 'Electric Jazz', 'Progressive Jazz'],
    'nu_jazz': ['Nu-Jazz', 'Jazz-House', 'Acid Jazz', 'Jazztronica']
};

/**
 * Default genre selection
 */
export const DEFAULT_GENRE = 'house';

/**
 * Configuration options for GenreManager
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

export const genreConfig: GenreConfig = {
    defaultGenre: DEFAULT_GENRE,
    subGenreMap: subGenreMap,
    enableLogging: true,
    enableErrorHandling: true
};

