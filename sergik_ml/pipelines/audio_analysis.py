"""
SERGIK ML Audio Analysis Pipeline

Comprehensive audio analysis with:
- BPM/Key/Energy detection using librosa
- AcoustID fingerprinting
- MusicBrainz genre/artist lookup
- SERGIK DNA matching
- Genre influence calculation
"""

import logging
import os
import json
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

logger = logging.getLogger(__name__)

# SERGIK Style Signature (from gpt_config.json)
SERGIK_DNA = {
    "bpm": {
        "average": 107.6,
        "zones": {
            "downtempo": {"range": [80, 90], "percentage": 41},
            "house": {"range": [120, 129], "percentage": 32}
        }
    },
    "keys": {
        "primary": ["10B", "11B"],
        "secondary": ["7A", "8A"],
        "distribution": {
            "10B": 31,
            "11B": 21,
            "7A": 13,
            "8A": 12
        }
    },
    "energy": {
        "average": 6,
        "sweet_spot": [5, 7]
    },
    "genres": {
        "hiphop": 42,
        "funk": 17,
        "house": 8,
        "soul": 7
    }
}

# Camelot key mapping
CAMELOT_KEYS = {
    "C": "8B", "C#": "3B", "Db": "3B", "D": "10B", "D#": "5B", "Eb": "5B",
    "E": "12B", "F": "7B", "F#": "2B", "Gb": "2B", "G": "9B", "G#": "4B", "Ab": "4B",
    "A": "11B", "A#": "6B", "Bb": "6B", "B": "1B",
    "Cm": "5A", "C#m": "12A", "Dbm": "12A", "Dm": "7A", "D#m": "2A", "Ebm": "2A",
    "Em": "9A", "Fm": "4A", "F#m": "11A", "Gbm": "11A", "Gm": "6A", "G#m": "1A", "Abm": "1A",
    "Am": "8A", "A#m": "3A", "Bbm": "3A", "Bm": "10A"
}

# Musical key to note mapping
KEY_TO_NOTE = {
    "1A": "Ab minor", "1B": "B major",
    "2A": "Eb minor", "2B": "F# major",
    "3A": "Bb minor", "3B": "Db major",
    "4A": "F minor", "4B": "Ab major",
    "5A": "C minor", "5B": "Eb major",
    "6A": "G minor", "6B": "Bb major",
    "7A": "D minor", "7B": "F major",
    "8A": "A minor", "8B": "C major",
    "9A": "E minor", "9B": "G major",
    "10A": "B minor", "10B": "D major",
    "11A": "F# minor", "11B": "A major",
    "12A": "Db minor", "12B": "E major"
}


def analyze_audio(file_path: str) -> Dict[str, Any]:
    """
    Analyze audio file for BPM, key, energy, and other metadata.
    
    Args:
        file_path: Path to audio file (WAV, MP3, FLAC, etc.)
        
    Returns:
        Dict with bpm, key, energy, duration, sample_rate, etc.
    """
    try:
        import librosa
        import numpy as np
    except ImportError:
        logger.warning("librosa not installed, using stub analysis")
        return _analyze_stub(file_path)
    
    try:
        # Load audio
        y, sr = librosa.load(file_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)
        
        # BPM detection
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(tempo) if isinstance(tempo, (int, float)) else float(tempo[0])
        
        # Key detection using chroma features
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key, mode = _detect_key(chroma)
        camelot_key = _to_camelot(key, mode)
        
        # Energy/loudness analysis
        rms = librosa.feature.rms(y=y)[0]
        energy = _calculate_energy_level(rms)
        
        # Spectral features
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
        
        # Zero crossing rate (rhythm complexity)
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))
        
        return {
            "status": "ok",
            "bpm": round(bpm, 1),
            "key": camelot_key,
            "key_notation": KEY_TO_NOTE.get(camelot_key, "Unknown"),
            "energy": energy,
            "duration": round(duration, 2),
            "sample_rate": sr,
            "spectral_centroid": round(float(spectral_centroid), 2),
            "spectral_rolloff": round(float(spectral_rolloff), 2),
            "rhythm_complexity": round(float(zcr) * 1000, 2),
            "loudness_db": round(float(20 * np.log10(np.mean(rms) + 1e-10)), 2)
        }
        
    except Exception as e:
        logger.error(f"Audio analysis failed: {e}")
        return {"status": "error", "error": str(e)}


def _detect_key(chroma) -> Tuple[str, str]:
    """Detect musical key from chroma features."""
    import numpy as np
    
    # Key profiles (Krumhansl-Schmuckler)
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    
    chroma_sum = np.sum(chroma, axis=1)
    
    # Correlate with all keys
    correlations = []
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    for i in range(12):
        major_corr = np.corrcoef(np.roll(major_profile, i), chroma_sum)[0, 1]
        minor_corr = np.corrcoef(np.roll(minor_profile, i), chroma_sum)[0, 1]
        correlations.append((notes[i], 'major', major_corr))
        correlations.append((notes[i], 'minor', minor_corr))
    
    # Find best match
    best = max(correlations, key=lambda x: x[2])
    return best[0], best[1]


def _to_camelot(key: str, mode: str) -> str:
    """Convert key and mode to Camelot notation."""
    if mode == "minor":
        lookup = f"{key}m"
    else:
        lookup = key
    return CAMELOT_KEYS.get(lookup, "8B")


def _calculate_energy_level(rms) -> int:
    """Calculate energy level (1-10) from RMS values."""
    import numpy as np
    
    avg_rms = np.mean(rms)
    # Map RMS to 1-10 scale
    # Typical RMS values: 0.01 (quiet) to 0.3 (loud)
    energy = int(min(10, max(1, avg_rms * 30 + 1)))
    return energy


def _analyze_stub(file_path: str) -> Dict[str, Any]:
    """Stub analysis when librosa is not available."""
    return {
        "status": "ok",
        "bpm": 120.0,
        "key": "10B",
        "key_notation": "D major",
        "energy": 6,
        "duration": 180.0,
        "sample_rate": 44100,
        "note": "Stub analysis - install librosa for real analysis"
    }


def fingerprint_audio(file_path: str) -> Optional[str]:
    """
    Generate AcoustID fingerprint for audio file.
    
    Args:
        file_path: Path to audio file
        
    Returns:
        Fingerprint string or None
    """
    try:
        import acoustid
        
        duration, fingerprint = acoustid.fingerprint_file(file_path)
        return fingerprint
        
    except ImportError:
        logger.warning("pyacoustid not installed")
        # Try using fpcalc directly
        try:
            result = subprocess.run(
                ['fpcalc', '-raw', file_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if line.startswith('FINGERPRINT='):
                        return line.split('=')[1]
        except Exception as e:
            logger.warning(f"fpcalc not available: {e}")
            
    except Exception as e:
        logger.error(f"Fingerprinting failed: {e}")
    
    return None


def lookup_musicbrainz(fingerprint: str = None, artist: str = None, title: str = None) -> Dict[str, Any]:
    """
    Look up track information from MusicBrainz.
    
    Args:
        fingerprint: AcoustID fingerprint
        artist: Artist name for text search
        title: Track title for text search
        
    Returns:
        Dict with artist, album, genres, tags, etc.
    """
    try:
        import musicbrainzngs
        
        musicbrainzngs.set_useragent("SERGIK_AI", "1.0", "https://sergik.ai")
        
        # Try fingerprint lookup first
        if fingerprint:
            try:
                import acoustid
                
                # AcoustID lookup
                results = acoustid.lookup(
                    os.environ.get('ACOUSTID_API_KEY', ''),
                    fingerprint,
                    meta='recordings releases'
                )
                
                if results and results.get('results'):
                    best = results['results'][0]
                    if best.get('recordings'):
                        recording = best['recordings'][0]
                        return _parse_acoustid_result(recording)
                        
            except Exception as e:
                logger.warning(f"AcoustID lookup failed: {e}")
        
        # Fall back to text search
        if artist and title:
            result = musicbrainzngs.search_recordings(
                artist=artist,
                recording=title,
                limit=5
            )
            
            if result.get('recording-list'):
                recording = result['recording-list'][0]
                return _parse_musicbrainz_recording(recording)
                
    except ImportError:
        logger.warning("musicbrainzngs not installed")
    except Exception as e:
        logger.error(f"MusicBrainz lookup failed: {e}")
    
    return {
        "status": "not_found",
        "artist": artist or "Unknown",
        "title": title or "Unknown",
        "genres": [],
        "tags": []
    }


def _parse_acoustid_result(recording: Dict) -> Dict[str, Any]:
    """Parse AcoustID recording result."""
    return {
        "status": "ok",
        "source": "acoustid",
        "recording_id": recording.get('id'),
        "artist": recording.get('artists', [{}])[0].get('name', 'Unknown'),
        "title": recording.get('title', 'Unknown'),
        "releases": [r.get('title') for r in recording.get('releases', [])[:3]],
        "genres": [],
        "tags": []
    }


def _parse_musicbrainz_recording(recording: Dict) -> Dict[str, Any]:
    """Parse MusicBrainz recording result."""
    artists = recording.get('artist-credit', [])
    artist_name = artists[0].get('artist', {}).get('name', 'Unknown') if artists else 'Unknown'
    
    # Get tags if available
    tags = [t.get('name') for t in recording.get('tag-list', [])]
    
    return {
        "status": "ok",
        "source": "musicbrainz",
        "recording_id": recording.get('id'),
        "artist": artist_name,
        "title": recording.get('title', 'Unknown'),
        "releases": [r.get('title') for r in recording.get('release-list', [])[:3]],
        "genres": _extract_genres_from_tags(tags),
        "tags": tags[:10]
    }


def _extract_genres_from_tags(tags: List[str]) -> List[str]:
    """Extract genre labels from MusicBrainz tags."""
    genre_keywords = {
        'house', 'tech house', 'deep house', 'techno', 'hip hop', 'hip-hop', 'rap',
        'funk', 'soul', 'r&b', 'disco', 'electronic', 'dance', 'edm', 'trap',
        'lo-fi', 'lofi', 'ambient', 'downtempo', 'jazz', 'pop', 'rock'
    }
    
    genres = []
    for tag in tags:
        tag_lower = tag.lower()
        for genre in genre_keywords:
            if genre in tag_lower:
                genres.append(genre)
                break
    
    return list(set(genres))


def match_sergik_dna(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare track metadata against SERGIK's style signature.
    
    Args:
        metadata: Dict with bpm, key, energy, etc.
        
    Returns:
        DNA match result with scores and suggestions
    """
    scores = {}
    suggestions = []
    
    # BPM matching
    bpm = metadata.get('bpm', 0)
    bpm_score = _calculate_bpm_score(bpm)
    scores['bpm'] = bpm_score
    
    if bpm_score < 50:
        if bpm < 80:
            suggestions.append(f"BPM {bpm} is below SERGIK range. Consider 80-90 for hip-hop or 120-129 for house.")
        elif bpm > 130:
            suggestions.append(f"BPM {bpm} is above SERGIK range. Consider bringing down to 120-129 for house.")
    
    # Key matching
    key = metadata.get('key', '')
    key_score = _calculate_key_score(key)
    scores['key'] = key_score
    
    if key_score < 50:
        suggestions.append(f"Key {key} is outside SERGIK's primary keys (10B, 11B, 7A, 8A). Consider transposing.")
    
    # Energy matching
    energy = metadata.get('energy', 5)
    energy_score = _calculate_energy_score(energy)
    scores['energy'] = energy_score
    
    if energy < 5:
        suggestions.append("Energy is low. SERGIK style favors mid-energy grooves (5-7).")
    elif energy > 7:
        suggestions.append("Energy is high. Consider keeping it in the 5-7 range for SERGIK style.")
    
    # Overall DNA match
    overall_score = int(
        scores['bpm'] * 0.35 +
        scores['key'] * 0.35 +
        scores['energy'] * 0.30
    )
    
    # Determine best genre fit
    genre_fit = _determine_genre_fit(bpm, key, energy)
    
    return {
        "overall_match": overall_score,
        "scores": scores,
        "genre_fit": genre_fit,
        "suggestions": suggestions,
        "compatible_collaborators": _suggest_collaborators(genre_fit)
    }


def _calculate_bpm_score(bpm: float) -> int:
    """Calculate BPM match score (0-100)."""
    # SERGIK zones: 80-90 (41%) and 120-129 (32%)
    if 80 <= bpm <= 90:
        return 100  # Perfect hip-hop zone
    elif 120 <= bpm <= 129:
        return 100  # Perfect house zone
    elif 75 <= bpm < 80 or 90 < bpm <= 95:
        return 75  # Near hip-hop zone
    elif 115 <= bpm < 120 or 129 < bpm <= 135:
        return 75  # Near house zone
    elif 95 < bpm < 115:
        return 60  # Funk zone
    else:
        return 30  # Outside typical range


def _calculate_key_score(key: str) -> int:
    """Calculate key match score (0-100)."""
    if key in ['10B', '11B']:
        return 100  # Primary keys
    elif key in ['7A', '8A']:
        return 90  # Secondary keys
    elif key in ['9B', '12B', '6A', '9A']:
        return 70  # Compatible keys
    else:
        return 40  # Less common


def _calculate_energy_score(energy: int) -> int:
    """Calculate energy match score (0-100)."""
    if 5 <= energy <= 7:
        return 100  # Sweet spot
    elif energy == 4 or energy == 8:
        return 75
    elif energy == 3 or energy == 9:
        return 50
    else:
        return 30


def _determine_genre_fit(bpm: float, key: str, energy: int) -> str:
    """Determine best SERGIK genre fit."""
    if 80 <= bpm <= 90 and energy <= 6:
        return "hip-hop"
    elif 120 <= bpm <= 129 and energy >= 6:
        return "house"
    elif 95 <= bpm <= 110:
        return "funk"
    elif bpm <= 90 and energy <= 5:
        return "soul"
    else:
        return "fusion"


def _suggest_collaborators(genre_fit: str) -> List[str]:
    """Suggest collaborators based on genre fit."""
    collaborator_genres = {
        "hip-hop": ["Silent Jay", "Slick Floyd", "OG Coconut"],
        "house": ["Silent Jay", "Breauxx", "NOOD"],
        "funk": ["Slick Floyd", "Sean Watson", "ANDINO"],
        "soul": ["Sean Hart", "LODIN", "CHKLZ"],
        "fusion": ["Silent Jay", "Breauxx", "Slick Floyd"]
    }
    return collaborator_genres.get(genre_fit, ["Silent Jay"])


def calculate_genre_influence(mb_data: Dict[str, Any], metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate genre influence DNA based on MusicBrainz data and audio analysis.
    
    Args:
        mb_data: MusicBrainz lookup result
        metadata: Audio analysis metadata
        
    Returns:
        Genre influence breakdown
    """
    # Start with detected genres
    detected_genres = mb_data.get('genres', [])
    
    # Infer genres from BPM and energy
    bpm = metadata.get('bpm', 120)
    energy = metadata.get('energy', 6)
    
    inferred_genres = []
    if 80 <= bpm <= 100:
        inferred_genres.append('hiphop')
    if 120 <= bpm <= 130:
        inferred_genres.append('house')
    if 95 <= bpm <= 115:
        inferred_genres.append('funk')
    if energy <= 5:
        inferred_genres.append('soul')
    
    # Combine detected and inferred
    all_genres = list(set(detected_genres + inferred_genres))
    
    # Calculate alignment with SERGIK DNA
    sergik_alignment = {}
    for genre, percentage in SERGIK_DNA['genres'].items():
        # Check if genre matches
        if genre in [g.lower().replace('-', '').replace(' ', '') for g in all_genres]:
            sergik_alignment[genre] = min(100, percentage * 2)  # Boost matching genres
        else:
            # Base alignment from SERGIK DNA
            sergik_alignment[genre] = percentage
    
    # Calculate overall influence score
    influence_score = sum(sergik_alignment.values()) / len(sergik_alignment)
    
    return {
        "detected_genres": detected_genres,
        "inferred_genres": inferred_genres,
        "sergik_alignment": sergik_alignment,
        "influence_score": round(influence_score, 1),
        "primary_influence": max(sergik_alignment, key=sergik_alignment.get) if sergik_alignment else "unknown"
    }


def download_from_url(url: str) -> Optional[str]:
    """
    Download audio from URL using yt-dlp.
    
    Args:
        url: YouTube, SoundCloud, or direct audio URL
        
    Returns:
        Path to downloaded audio file or None
    """
    try:
        import yt_dlp
        
        # Create temp directory for download
        temp_dir = tempfile.mkdtemp(prefix='sergik_audio_')
        output_template = os.path.join(temp_dir, '%(title)s.%(ext)s')
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
                'preferredquality': '192',
            }],
            'quiet': True,
            'no_warnings': True
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            # Find the downloaded file
            for f in os.listdir(temp_dir):
                if f.endswith('.wav'):
                    return os.path.join(temp_dir, f)
            
            # If no WAV, return any audio file
            for f in os.listdir(temp_dir):
                return os.path.join(temp_dir, f)
                
    except ImportError:
        logger.warning("yt-dlp not installed")
    except Exception as e:
        logger.error(f"URL download failed: {e}")
    
    return None


def full_analysis(file_path: str = None, url: str = None) -> Dict[str, Any]:
    """
    Perform full audio analysis pipeline.
    
    Args:
        file_path: Path to local audio file
        url: URL to download and analyze
        
    Returns:
        Complete analysis result
    """
    # Handle URL download
    if url and not file_path:
        file_path = download_from_url(url)
        if not file_path:
            return {"status": "error", "error": "Failed to download audio from URL"}
    
    if not file_path or not os.path.exists(file_path):
        return {"status": "error", "error": "No valid audio file provided"}
    
    # Core audio analysis
    metadata = analyze_audio(file_path)
    if metadata.get('status') == 'error':
        return metadata
    
    # Fingerprint and MusicBrainz lookup
    fingerprint = fingerprint_audio(file_path)
    mb_data = lookup_musicbrainz(fingerprint=fingerprint)
    
    # SERGIK DNA matching
    dna_match = match_sergik_dna(metadata)
    
    # Genre influence calculation
    genre_influence = calculate_genre_influence(mb_data, metadata)
    
    return {
        "status": "ok",
        "file": os.path.basename(file_path),
        "metadata": metadata,
        "musicbrainz": mb_data,
        "sergik_dna": dna_match,
        "genre_influence": genre_influence
    }

