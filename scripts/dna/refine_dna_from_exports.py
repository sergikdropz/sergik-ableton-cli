#!/usr/bin/env python3
"""
SERGIK DNA Refinement Script
Analyzes new music exports and refines the SERGIK DNA profile

Usage:
    python scripts/refine_dna_from_exports.py [directory_path]
"""

import os
import sys
import json
import csv
import re
import time
from pathlib import Path
from collections import Counter, defaultdict
from typing import Dict, List, Any, Optional
import warnings
warnings.filterwarnings('ignore')

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from sergik_ml.pipelines.audio_analysis import (
        analyze_audio, full_analysis, SERGIK_DNA as BASE_DNA,
        fingerprint_audio, lookup_musicbrainz, match_sergik_dna
    )
    from sergik_ml.pipelines.audio_analysis import CAMELOT_KEYS, KEY_TO_NOTE
    HAS_LIBROSA = True
    HAS_MUSICBRAINZ = True
except Exception as e:
    print(f"Warning: Could not import audio_analysis module: {e}")
    print("Will use fallback analysis method")
    HAS_LIBROSA = False
    HAS_MUSICBRAINZ = False
    fingerprint_audio = None
    lookup_musicbrainz = None
    match_sergik_dna = None
    # Define minimal BASE_DNA for fallback
    BASE_DNA = {
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
    # Camelot key mapping for fallback
    CAMELOT_KEYS = {
        "C": "8B", "C#": "3B", "Db": "3B", "D": "10B", "D#": "5B", "Eb": "5B",
        "E": "12B", "F": "7B", "F#": "2B", "Gb": "2B", "G": "9B", "G#": "4B", "Ab": "4B",
        "A": "11B", "A#": "6B", "Bb": "6B", "B": "1B",
        "Cm": "5A", "C#m": "12A", "Dbm": "12A", "Dm": "7A", "D#m": "2A", "Ebm": "2A",
        "Em": "9A", "Fm": "4A", "F#m": "11A", "Gbm": "11A", "Gm": "6A", "G#m": "1A", "Abm": "1A",
        "Am": "8A", "A#m": "3A", "Bbm": "3A", "Bm": "10A"
    }
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

# Default directory to analyze
DEFAULT_DIR = "/Volumes/SERGIK 2tb2/Exports SERGIK/SERGIK WAVs"

AUDIO_EXTS = {".wav", ".mp3", ".aif", ".aiff", ".m4a", ".flac"}

OUTPUT_DIR = Path("data/manifests")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# MusicBrainz rate limiting (1 request per second)
LAST_MB_REQUEST = 0
MB_RATE_LIMIT = 1.0  # seconds between requests

# Comprehensive genre mapping to SERGIK DNA categories
SERGIK_GENRE_MAPPING = {
    # Hip-Hop / Rap variations
    'hip-hop': 'hiphop', 'hiphop': 'hiphop', 'hip hop': 'hiphop',
    'rap': 'hiphop', 'trap': 'hiphop', 'trap music': 'hiphop',
    'drill': 'hiphop', 'grime': 'hiphop', 'boom bap': 'hiphop',
    'lo-fi hip hop': 'hiphop', 'lofi hip hop': 'hiphop', 'lofi': 'hiphop',
    'lo-fi': 'hiphop', 'lo fi': 'hiphop', 'alternative hip hop': 'hiphop',
    'conscious hip hop': 'hiphop', 'east coast hip hop': 'hiphop',
    'west coast hip hop': 'hiphop', 'southern hip hop': 'hiphop',
    'gangsta rap': 'hiphop', 'hardcore hip hop': 'hiphop',
    
    # House variations
    'house': 'house', 'tech house': 'house', 'tech-house': 'house',
    'deep house': 'house', 'progressive house': 'house', 'electro house': 'house',
    'future house': 'house', 'bass house': 'house', 'tropical house': 'house',
    'garage house': 'house', 'jackin house': 'house', 'jackin': 'house',
    'ghetto house': 'house', 'chicago house': 'house', 'detroit house': 'house',
    'vocal house': 'house', 'funky house': 'house', 'soulful house': 'house',
    'afro house': 'house', 'latin house': 'house',
    
    # Techno (mapped to house as electronic dance)
    'techno': 'house', 'minimal techno': 'house', 'detroit techno': 'house',
    'acid techno': 'house', 'hard techno': 'house', 'industrial techno': 'house',
    
    # Funk variations
    'funk': 'funk', 'p-funk': 'funk', 'g-funk': 'funk', 'g funk': 'funk',
    'nu-funk': 'funk', 'nu funk': 'funk', 'funk rock': 'funk',
    'funk metal': 'funk', 'jazz funk': 'funk', 'disco': 'funk',
    'disco house': 'funk', 'nu-disco': 'funk', 'nu disco': 'funk',
    'italo disco': 'funk', 'boogie': 'funk', 'boogie funk': 'funk',
    
    # Soul / R&B variations
    'soul': 'soul', 'neo-soul': 'soul', 'neo soul': 'soul',
    'southern soul': 'soul', 'northern soul': 'soul', 'deep soul': 'soul',
    'blue-eyed soul': 'soul', 'r&b': 'soul', 'r and b': 'soul', 'rnb': 'soul',
    'contemporary r&b': 'soul', 'contemporary rnb': 'soul', 'urban': 'soul',
    'motown': 'soul', 'philly soul': 'soul', 'memphis soul': 'soul',
    'chicago soul': 'soul',
    
    # Electronic / Dance variations (mapped to house)
    'electronic': 'house', 'edm': 'house', 'electronic dance music': 'house',
    'dance': 'house', 'dance music': 'house', 'club': 'house',
    'club music': 'house', 'progressive': 'house', 'trance': 'house',
    'progressive trance': 'house', 'uplifting trance': 'house',
    'big room': 'house', 'big room house': 'house', 'complextro': 'house',
    'moombahcore': 'house', 'moombah': 'house', 'dubstep': 'house',
    'brostep': 'house', 'future bass': 'house', 'bass music': 'house', 'bass': 'house',
    
    # Reggae / Dancehall (mapped to funk for groove similarity)
    'reggae': 'funk', 'dancehall': 'funk', 'dub': 'funk', 'reggaeton': 'funk',
    'ragga': 'funk', 'ska': 'funk', 'rocksteady': 'funk',
    
    # Jazz (mapped to soul for harmonic similarity)
    'jazz': 'soul', 'smooth jazz': 'soul', 'acid jazz': 'soul', 'nu jazz': 'soul',
    'jazz fusion': 'soul', 'bebop': 'soul', 'hard bop': 'soul',
    'cool jazz': 'soul', 'modal jazz': 'soul', 'free jazz': 'soul',
    
    # Ambient / Downtempo (mapped to soul for chill vibe)
    'ambient': 'soul', 'ambient house': 'house', 'chillout': 'soul',
    'chill out': 'soul', 'downtempo': 'soul', 'trip hop': 'soul',
    'trip-hop': 'soul', 'lounge': 'soul', 'chill': 'soul',
    'chillwave': 'soul', 'vaporwave': 'soul', 'synthwave': 'soul', 'retrowave': 'soul',
    
    # DnB / Breakbeat (mapped to house for electronic nature)
    'dnb': 'house', 'drum and bass': 'house', 'drum n bass': 'house',
    'jungle': 'house', 'breakbeat': 'house', 'breakcore': 'house',
    'neurofunk': 'house', 'liquid dnb': 'house', 'liquid drum and bass': 'house',
    
    # Pop / Commercial (mapped based on style)
    'pop': 'soul', 'dance pop': 'house', 'electropop': 'house',
    'synthpop': 'house', 'indie pop': 'soul', 'alternative pop': 'soul',
    
    # Rock variations (mapped to funk for groove)
    'funk rock': 'funk', 'funk metal': 'funk', 'alternative rock': 'funk',
    'indie rock': 'funk',
    
    # Latin / World (mapped to funk for rhythm)
    'latin': 'funk', 'latin house': 'house', 'salsa': 'funk', 'samba': 'funk',
    'bossa nova': 'funk', 'afrobeat': 'funk', 'afro': 'funk',
    'world': 'funk', 'world music': 'funk',
    
    # Other electronic subgenres
    'idm': 'house', 'intelligent dance music': 'house', 'glitch': 'house',
    'glitch hop': 'house', 'wonky': 'house', 'wonky hip hop': 'hiphop',
    'juke': 'house', 'footwork': 'house', 'ghetto tech': 'house',
    'baltimore club': 'house', 'gqom': 'house', 'amapiano': 'house',
}


def normalize_genre(genre: str) -> str:
    """Normalize genre name for mapping (lowercase, strip, handle variations)."""
    if not genre:
        return ''
    
    # Normalize: lowercase, strip whitespace, handle common variations
    normalized = genre.lower().strip()
    
    # Handle common separators
    normalized = re.sub(r'[_\-\s]+', ' ', normalized)  # Replace _ - with space
    normalized = re.sub(r'\s+', ' ', normalized)  # Multiple spaces to single
    normalized = normalized.strip()
    
    return normalized


def map_genre_to_dna(genre: str) -> str:
    """Map a genre to SERGIK DNA category."""
    normalized = normalize_genre(genre)
    
    # Direct lookup
    if normalized in SERGIK_GENRE_MAPPING:
        return SERGIK_GENRE_MAPPING[normalized]
    
    # Partial matching for compound genres
    for key, value in SERGIK_GENRE_MAPPING.items():
        if key in normalized or normalized in key:
            return value
    
    # Default to 'other' if no match
    return 'other'


def parse_filename_for_mb_search(filename: str) -> Dict[str, Optional[str]]:
    """Parse filename to extract artist and title for MusicBrainz search."""
    # Remove extension
    base = Path(filename).stem
    
    # Common patterns:
    # "ARTIST - TITLE"
    # "ARTIST x ARTIST - TITLE"
    # "SERGIK - TITLE"
    # "SERGIK x ARTIST - TITLE"
    
    # Try " - " separator first
    if " - " in base:
        parts = base.split(" - ", 1)
        artist_part = parts[0].strip()
        title = parts[1].strip() if len(parts) > 1 else None
        
        # Clean up artist (remove "x SERGIK" or "SERGIK x")
        artist_part = re.sub(r'\bSERGIK\b', '', artist_part, flags=re.IGNORECASE)
        artist_part = re.sub(r'\s*x\s*', '', artist_part, flags=re.IGNORECASE)
        artist_part = artist_part.strip()
        
        # If artist is empty or just whitespace, try to extract from "x" notation
        if not artist_part or artist_part == "":
            if " x " in base or " x" in base or "x " in base:
                # Try to find collaborator
                x_match = re.search(r'x\s+([A-Z][^x-]+?)(?:\s+-|\s*$)', base, re.IGNORECASE)
                if x_match:
                    artist_part = x_match.group(1).strip()
        
        artist = artist_part if artist_part else None
        return {"artist": artist, "title": title}
    
    # Try "x" notation
    if " x " in base or " x" in base or "x " in base:
        # Pattern: "ARTIST x ARTIST - TITLE" or "ARTIST x ARTIST"
        parts = re.split(r'\s+x\s+', base, flags=re.IGNORECASE)
        if len(parts) >= 2:
            # First part might be artist, last part might be title
            artist = parts[0].strip() if parts[0].strip().upper() != "SERGIK" else parts[1].strip()
            title = parts[-1].strip() if len(parts) > 2 else None
            return {"artist": artist, "title": title}
    
    # If no clear pattern, assume whole thing is title
    return {"artist": None, "title": base.strip()}


def get_musicbrainz_data(file_path: Path, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Get MusicBrainz data for a track with rate limiting."""
    global LAST_MB_REQUEST
    
    if not HAS_MUSICBRAINZ:
        return {"status": "not_available", "genres": [], "tags": []}
    
    mb_data = {"status": "not_found", "genres": [], "tags": [], "artist": None, "title": None}
    
    try:
        # Rate limiting
        current_time = time.time()
        time_since_last = current_time - LAST_MB_REQUEST
        if time_since_last < MB_RATE_LIMIT:
            time.sleep(MB_RATE_LIMIT - time_since_last)
        LAST_MB_REQUEST = time.time()
        
        # Try fingerprint first
        fingerprint = None
        if fingerprint_audio:
            try:
                fingerprint = fingerprint_audio(str(file_path))
            except:
                pass
        
        # Try lookup with fingerprint
        if fingerprint and lookup_musicbrainz:
            mb_data = lookup_musicbrainz(fingerprint=fingerprint)
        
        # If fingerprint lookup failed, try text search
        if mb_data.get('status') != 'ok' and lookup_musicbrainz:
            # Parse filename for artist/title
            parsed = parse_filename_for_mb_search(file_path.name)
            if parsed.get('artist') or parsed.get('title'):
                mb_data = lookup_musicbrainz(
                    artist=parsed.get('artist'),
                    title=parsed.get('title')
                )
        
    except Exception as e:
        # Silently fail - MusicBrainz is optional
        pass
    
    return mb_data


def scan_directory(directory: str) -> List[Path]:
    """Scan directory for audio files."""
    audio_files = []
    dir_path = Path(directory)
    
    if not dir_path.exists():
        print(f"ERROR: Directory does not exist: {directory}")
        return []
    
    print(f"Scanning: {directory}")
    for file_path in dir_path.rglob("*"):
        # Skip hidden files (macOS resource forks, etc.)
        if file_path.name.startswith('._') or file_path.name.startswith('.'):
            continue
        
        if file_path.is_file() and file_path.suffix.lower() in AUDIO_EXTS:
            audio_files.append(file_path)
    
    print(f"Found {len(audio_files)} audio files")
    return audio_files


def analyze_tracks(audio_files: List[Path], max_files: Optional[int] = None) -> List[Dict[str, Any]]:
    """Analyze all audio files and collect metadata."""
    results = []
    
    if max_files:
        audio_files = audio_files[:max_files]
    
    total = len(audio_files)
    print(f"\nAnalyzing {total} tracks...")
    
    for i, file_path in enumerate(audio_files):
        if (i + 1) % 10 == 0:
            print(f"  Progress: [{i+1}/{total}] ({((i+1)/total)*100:.1f}%)")
        
        try:
            metadata = None
            
            # Try using analyze_audio if available
            if HAS_LIBROSA:
                try:
                    metadata = analyze_audio(file_path=str(file_path))
                except:
                    pass
            
            # Fallback to direct analysis using soundfile/numpy
            if not metadata or metadata.get('status') != 'ok':
                try:
                    import soundfile as sf
                    import numpy as np
                    from scipy import signal
                    
                    # Load audio
                    data, sr = sf.read(str(file_path))
                    
                    # Take first 30 seconds
                    duration_samples = int(30 * sr)
                    data = data[:duration_samples]
                    
                    # Convert to mono if stereo
                    if len(data.shape) > 1:
                        data = np.mean(data, axis=1)
                    
                    # Resample to 22050 for consistent analysis
                    if sr != 22050:
                        factor = sr / 22050
                        new_len = int(len(data) / factor)
                        indices = np.linspace(0, len(data) - 1, new_len).astype(int)
                        data = data[indices]
                        sr = 22050
                    
                    # BPM detection (simple autocorrelation)
                    hop_length = 512
                    frame_length = 2048
                    n_frames = 1 + (len(data) - frame_length) // hop_length
                    frames = np.zeros((n_frames, frame_length))
                    for i in range(n_frames):
                        start = i * hop_length
                        frames[i] = data[start:start + frame_length]
                    
                    energy = np.sqrt(np.mean(frames ** 2, axis=1))
                    onset_env = np.diff(energy, prepend=0)
                    onset_env = np.maximum(0, onset_env)
                    
                    min_lag = int(sr / hop_length * 60 / 180)
                    max_lag = int(sr / hop_length * 60 / 60)
                    
                    if len(onset_env) >= max_lag:
                        autocorr = np.correlate(onset_env, onset_env, mode='full')
                        autocorr = autocorr[len(autocorr)//2:]
                        valid_autocorr = autocorr[min_lag:max_lag]
                        if len(valid_autocorr) > 0:
                            peak_lag = np.argmax(valid_autocorr) + min_lag
                            bpm = 60 * sr / (hop_length * peak_lag)
                            bpm = round(bpm, 1) if 50 <= bpm <= 200 else None
                        else:
                            bpm = None
                    else:
                        bpm = None
                    
                    # Simple key detection (basic chroma)
                    n_fft = 4096
                    hop = n_fft // 4
                    n_frames = 1 + (len(data) - n_fft) // hop
                    chroma = np.zeros((12, n_frames))
                    
                    for i in range(n_frames):
                        start = i * hop
                        frame = data[start:start + n_fft] * np.hanning(n_fft)
                        spectrum = np.abs(np.fft.rfft(frame))
                        freqs = np.fft.rfftfreq(n_fft, 1/sr)
                        
                        for j, freq in enumerate(freqs):
                            if 20 < freq < 5000:
                                midi = 69 + 12 * np.log2(freq / 440)
                                pitch_class = int(round(midi)) % 12
                                chroma[pitch_class, i] += spectrum[j]
                    
                    chroma_avg = np.mean(chroma, axis=1)
                    if np.sum(chroma_avg) > 0:
                        chroma_avg = chroma_avg / np.max(chroma_avg)
                        
                        # Key profiles
                        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
                        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
                        major_profile = major_profile / np.max(major_profile)
                        minor_profile = minor_profile / np.max(minor_profile)
                        
                        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                        max_corr = -1
                        best_key = 0
                        best_mode = 0
                        
                        for i in range(12):
                            rolled_chroma = np.roll(chroma_avg, -i)
                            major_corr = np.corrcoef(rolled_chroma, major_profile)[0, 1]
                            minor_corr = np.corrcoef(rolled_chroma, minor_profile)[0, 1]
                            
                            if not np.isnan(major_corr) and major_corr > max_corr:
                                max_corr = major_corr
                                best_key = i
                                best_mode = 1
                            if not np.isnan(minor_corr) and minor_corr > max_corr:
                                max_corr = minor_corr
                                best_key = i
                                best_mode = 0
                        
                        key_str = f"{notes[best_key]} {'major' if best_mode == 1 else 'minor'}"
                        # Convert to Camelot
                        lookup = notes[best_key] if best_mode == 1 else f"{notes[best_key]}m"
                        camelot_key = CAMELOT_KEYS.get(lookup, "10B")
                    else:
                        key_str = "Unknown"
                        camelot_key = "10B"
                    
                    # Energy calculation
                    rms = np.sqrt(np.mean(data ** 2))
                    energy = int(min(10, max(1, rms * 30 + 1)))
                    
                    # Duration
                    duration = len(data) / sr
                    
                    metadata = {
                        'status': 'ok',
                        'bpm': bpm,
                        'key': camelot_key,
                        'key_notation': key_str,
                        'energy': energy,
                        'duration': round(duration, 2),
                        'sample_rate': sr
                    }
                except Exception as e2:
                    print(f"  Warning: Failed to analyze {file_path.name}: {str(e2)[:100]}")
                    continue
            
            if metadata and metadata.get('status') == 'ok':
                # Get MusicBrainz data for deeper analysis
                mb_data = get_musicbrainz_data(file_path, metadata)
                
                # Calculate DNA match if available
                dna_match = {'overall_match': 0, 'genre_fit': ''}
                if HAS_LIBROSA and match_sergik_dna:
                    try:
                        dna_match = match_sergik_dna(metadata)
                    except:
                        pass
                
                # Extract genres from MusicBrainz
                genres = mb_data.get('genres', [])
                tags = mb_data.get('tags', [])
                
                # Combine MusicBrainz genres with inferred genres from BPM/energy
                all_genres = list(set(genres))
                if not all_genres:
                    # Infer from BPM and energy
                    bpm = metadata.get('bpm', 120)
                    energy = metadata.get('energy', 6)
                    if 80 <= bpm <= 100:
                        all_genres.append('hip-hop')
                    if 120 <= bpm <= 130:
                        all_genres.append('house')
                    if 95 <= bpm <= 115:
                        all_genres.append('funk')
                    if energy <= 5:
                        all_genres.append('soul')
                    if not all_genres:
                        all_genres.append('electronic')
                
                result = {
                    'filename': file_path.name,
                    'path': str(file_path),
                    'bpm': metadata.get('bpm'),
                    'key': metadata.get('key'),
                    'key_notation': metadata.get('key_notation', ''),
                    'energy': metadata.get('energy'),
                    'duration': metadata.get('duration'),
                    'sample_rate': metadata.get('sample_rate'),
                    'dna_match_score': dna_match.get('overall_match', 0),
                    'genre_fit': dna_match.get('genre_fit', ''),
                    # MusicBrainz data
                    'mb_artist': mb_data.get('artist'),
                    'mb_title': mb_data.get('title'),
                    'mb_genres': ';'.join(all_genres),
                    'mb_tags': ';'.join(tags[:5]),  # Top 5 tags
                    'mb_status': mb_data.get('status', 'not_found'),
                    'mb_recording_id': mb_data.get('recording_id'),
                }
                results.append(result)
            else:
                print(f"  Warning: Could not analyze {file_path.name}")
                
        except Exception as e:
            print(f"  Error analyzing {file_path.name}: {str(e)[:100]}")
            continue
    
    print(f"\nSuccessfully analyzed {len(results)} tracks")
    return results


def calculate_statistics(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate statistics from analysis results."""
    stats = {
        'total_tracks': len(results),
        'bpm': {},
        'keys': {},
        'energy': {},
        'dna_match': {},
        'genres': {},
        'musicbrainz': {}
    }
    
    # BPM statistics
    bpms = [r['bpm'] for r in results if r.get('bpm')]
    if bpms:
        stats['bpm'] = {
            'average': round(sum(bpms) / len(bpms), 1),
            'min': round(min(bpms), 1),
            'max': round(max(bpms), 1),
            'distribution': {}
        }
        
        # BPM distribution
        bpm_buckets = defaultdict(int)
        for bpm in bpms:
            if bpm < 90:
                bpm_buckets['< 90'] += 1
            elif bpm < 100:
                bpm_buckets['90-99'] += 1
            elif bpm < 110:
                bpm_buckets['100-109'] += 1
            elif bpm < 120:
                bpm_buckets['110-119'] += 1
            elif bpm < 125:
                bpm_buckets['120-124'] += 1
            elif bpm < 130:
                bpm_buckets['125-129'] += 1
            elif bpm < 140:
                bpm_buckets['130-139'] += 1
            else:
                bpm_buckets['140+'] += 1
        
        stats['bpm']['distribution'] = dict(bpm_buckets)
        
        # Calculate percentages
        total_bpm = len(bpms)
        for bucket in stats['bpm']['distribution']:
            stats['bpm']['distribution'][bucket] = {
                'count': stats['bpm']['distribution'][bucket],
                'percentage': round((stats['bpm']['distribution'][bucket] / total_bpm) * 100, 1)
            }
    
    # Key statistics
    keys = [r['key'] for r in results if r.get('key')]
    if keys:
        key_counts = Counter(keys)
        stats['keys'] = {
            'distribution': dict(key_counts.most_common(20)),
            'top_keys': [k for k, _ in key_counts.most_common(10)]
        }
        
        # Calculate percentages
        total_keys = len(keys)
        for key in stats['keys']['distribution']:
            count = stats['keys']['distribution'][key]
            stats['keys']['distribution'][key] = {
                'count': count,
                'percentage': round((count / total_keys) * 100, 1)
            }
    
    # Energy statistics
    energies = [r['energy'] for r in results if r.get('energy')]
    if energies:
        stats['energy'] = {
            'average': round(sum(energies) / len(energies), 1),
            'min': min(energies),
            'max': max(energies),
            'distribution': dict(Counter(energies))
        }
        
        # Energy sweet spot (5-7)
        sweet_spot = [e for e in energies if 5 <= e <= 7]
        stats['energy']['sweet_spot_percentage'] = round((len(sweet_spot) / len(energies)) * 100, 1) if energies else 0
    
    # DNA match statistics
    dna_scores = [r['dna_match_score'] for r in results if r.get('dna_match_score')]
    if dna_scores:
        stats['dna_match'] = {
            'average': round(sum(dna_scores) / len(dna_scores), 1),
            'min': min(dna_scores),
            'max': max(dna_scores),
            'high_match_count': len([s for s in dna_scores if s >= 70]),
            'high_match_percentage': round((len([s for s in dna_scores if s >= 70]) / len(dna_scores)) * 100, 1) if dna_scores else 0
        }
    
    # Genre statistics from MusicBrainz
    all_genres = []
    for r in results:
        genres_str = r.get('mb_genres', '')
        if genres_str:
            all_genres.extend([g.strip().lower() for g in genres_str.split(';') if g.strip()])
    
    if all_genres:
        genre_counts = Counter(all_genres)
        stats['genres'] = {
            'distribution': dict(genre_counts.most_common(20)),
            'top_genres': [g for g, _ in genre_counts.most_common(10)],
            'total_unique': len(set(all_genres))
        }
    
    # MusicBrainz lookup statistics
    mb_statuses = [r.get('mb_status', 'not_found') for r in results]
    mb_status_counts = Counter(mb_statuses)
    stats['musicbrainz'] = {
        'lookup_success': mb_status_counts.get('ok', 0),
        'lookup_failed': mb_status_counts.get('not_found', 0) + mb_status_counts.get('not_available', 0),
        'success_rate': round((mb_status_counts.get('ok', 0) / len(results)) * 100, 1) if results else 0,
        'total_looked_up': len([r for r in results if r.get('mb_status') != 'not_available'])
    }
    
    return stats


def refine_dna_profile(base_dna: Dict[str, Any], new_stats: Dict[str, Any], results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Refine SERGIK DNA profile based on new analysis data."""
    
    # Start with base DNA
    refined_dna = json.loads(json.dumps(base_dna))  # Deep copy
    
    # Update genre profile from MusicBrainz data
    if new_stats.get('genres') and new_stats['genres'].get('distribution'):
        genre_dist = new_stats['genres']['distribution']
        total_genre_count = sum(genre_dist.values())
        
        # Map genres to SERGIK DNA genre categories using comprehensive mapping
        # Calculate genre percentages
        genre_percentages = {}
        for genre, count in genre_dist.items():
            mapped_genre = map_genre_to_dna(genre)
            if mapped_genre not in genre_percentages:
                genre_percentages[mapped_genre] = 0
            genre_percentages[mapped_genre] += (count / total_genre_count) * 100
        
        # Blend with existing genre distribution
        if 'genres' in refined_dna:
            for genre_key in refined_dna['genres']:
                old_pct = refined_dna['genres'].get(genre_key, 0)
                new_pct = genre_percentages.get(genre_key, 0)
                # Weighted blend (70% old, 30% new)
                refined_dna['genres'][genre_key] = round(old_pct * 0.7 + new_pct * 0.3, 1)
    
    # Update BPM profile
    if new_stats.get('bpm') and new_stats['bpm'].get('average'):
        new_avg_bpm = new_stats['bpm']['average']
        old_avg_bpm = base_dna.get('bpm', {}).get('average', 107.6)
        
        # Weighted average (70% old, 30% new for stability)
        refined_dna['bpm']['average'] = round(old_avg_bpm * 0.7 + new_avg_bpm * 0.3, 1)
        
        # Update BPM zones based on distribution
        if new_stats['bpm'].get('distribution'):
            dist = new_stats['bpm']['distribution']
            
            # Calculate downtempo percentage
            downtempo_count = dist.get('< 90', {}).get('count', 0) + dist.get('90-99', {}).get('count', 0)
            house_count = dist.get('120-124', {}).get('count', 0) + dist.get('125-129', {}).get('count', 0)
            total = sum(v.get('count', 0) for v in dist.values())
            
            if total > 0:
                downtempo_pct = (downtempo_count / total) * 100
                house_pct = (house_count / total) * 100
                
                # Blend with existing percentages
                old_downtempo = base_dna.get('bpm', {}).get('zones', {}).get('downtempo', {}).get('percentage', 41)
                old_house = base_dna.get('bpm', {}).get('zones', {}).get('house', {}).get('percentage', 32)
                
                refined_dna['bpm']['zones']['downtempo']['percentage'] = round(old_downtempo * 0.7 + downtempo_pct * 0.3, 1)
                refined_dna['bpm']['zones']['house']['percentage'] = round(old_house * 0.7 + house_pct * 0.3, 1)
    
    # Update key profile
    if new_stats.get('keys') and new_stats['keys'].get('top_keys'):
        top_keys = new_stats['keys']['top_keys'][:5]  # Top 5 keys
        
        # Merge with existing primary keys
        old_primary = base_dna.get('keys', {}).get('primary', [])
        old_secondary = base_dna.get('keys', {}).get('secondary', [])
        
        # Combine and deduplicate
        all_keys = list(set(old_primary + old_secondary + top_keys))
        
        # Update distribution
        if new_stats['keys'].get('distribution'):
            key_dist = new_stats['keys']['distribution']
            
            # Update key distribution percentages
            for key, data in key_dist.items():
                if isinstance(data, dict):
                    count = data.get('count', 0)
                    pct = data.get('percentage', 0)
                    
                    # Blend with existing
                    old_pct = base_dna.get('keys', {}).get('distribution', {}).get(key, 0)
                    if isinstance(old_pct, (int, float)):
                        refined_dna['keys']['distribution'][key] = round(old_pct * 0.7 + pct * 0.3, 1)
                    else:
                        refined_dna['keys']['distribution'][key] = round(pct, 1)
            
            # Update primary/secondary based on new distribution
            sorted_keys = sorted(
                key_dist.items(),
                key=lambda x: x[1].get('percentage', 0) if isinstance(x[1], dict) else 0,
                reverse=True
            )
            
            if len(sorted_keys) >= 2:
                refined_dna['keys']['primary'] = [sorted_keys[0][0], sorted_keys[1][0]]
            if len(sorted_keys) >= 4:
                refined_dna['keys']['secondary'] = [sorted_keys[2][0], sorted_keys[3][0]]
    
    # Update energy profile
    if new_stats.get('energy') and new_stats['energy'].get('average'):
        new_avg_energy = new_stats['energy']['average']
        old_avg_energy = base_dna.get('energy', {}).get('average', 6)
        
        refined_dna['energy']['average'] = round(old_avg_energy * 0.7 + new_avg_energy * 0.3, 1)
        
        # Update sweet spot if available
        if new_stats['energy'].get('sweet_spot_percentage'):
            # Keep existing sweet spot range but note the percentage
            refined_dna['energy']['sweet_spot_percentage'] = round(new_stats['energy']['sweet_spot_percentage'], 1)
    
    # Add metadata about refinement
    refined_dna['refinement_metadata'] = {
        'tracks_analyzed': new_stats.get('total_tracks', 0),
        'refinement_date': str(Path(__file__).stat().st_mtime),
        'base_dna_version': '1.0'
    }
    
    return refined_dna


def save_results(results: List[Dict[str, Any]], stats: Dict[str, Any], refined_dna: Dict[str, Any], output_dir: Path):
    """Save analysis results to files."""
    
    # Save detailed results CSV
    csv_path = output_dir / "exports_dna_analysis.csv"
    if results:
        fieldnames = [
            'filename', 'path', 'bpm', 'key', 'key_notation', 'energy', 
            'duration', 'sample_rate', 'dna_match_score', 'genre_fit',
            'mb_artist', 'mb_title', 'mb_genres', 'mb_tags', 'mb_status', 'mb_recording_id'
        ]
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        
        print(f"\nSaved detailed results: {csv_path}")
    
    # Save statistics JSON
    stats_path = output_dir / "exports_dna_statistics.json"
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    
    print(f"Saved statistics: {stats_path}")
    
    # Save refined DNA profile
    dna_path = output_dir / "sergik_dna_refined.json"
    with open(dna_path, 'w', encoding='utf-8') as f:
        json.dump(refined_dna, f, indent=2)
    
    print(f"Saved refined DNA profile: {dna_path}")
    
    # Also update the master profile if it exists
    master_profile_path = Path("data/profiles/master_profile.json")
    if master_profile_path.exists():
        with open(master_profile_path, 'r', encoding='utf-8') as f:
            master_profile = json.load(f)
        
        master_profile['dna'] = refined_dna
        master_profile['last_dna_refinement'] = {
            'tracks_analyzed': stats.get('total_tracks', 0),
            'date': refined_dna.get('refinement_metadata', {}).get('refinement_date', '')
        }
        
        with open(master_profile_path, 'w', encoding='utf-8') as f:
            json.dump(master_profile, f, indent=2)
        
        print(f"Updated master profile: {master_profile_path}")


def print_summary(stats: Dict[str, Any], refined_dna: Dict[str, Any]):
    """Print analysis summary."""
    print("\n" + "=" * 70)
    print("SERGIK DNA REFINEMENT SUMMARY")
    print("=" * 70)
    
    print(f"\nTotal Tracks Analyzed: {stats.get('total_tracks', 0)}")
    
    if stats.get('bpm'):
        bpm_stats = stats['bpm']
        print(f"\nBPM Profile:")
        print(f"  Average: {bpm_stats.get('average', 'N/A')} BPM")
        print(f"  Range: {bpm_stats.get('min', 'N/A')} - {bpm_stats.get('max', 'N/A')} BPM")
        print(f"  Refined Average: {refined_dna.get('bpm', {}).get('average', 'N/A')} BPM")
        
        if bpm_stats.get('distribution'):
            print(f"\n  Distribution:")
            for bucket, data in sorted(bpm_stats['distribution'].items()):
                if isinstance(data, dict):
                    print(f"    {bucket:10} {data.get('count', 0):4} tracks ({data.get('percentage', 0):5.1f}%)")
    
    if stats.get('keys'):
        key_stats = stats['keys']
        print(f"\nKey Profile:")
        print(f"  Top Keys: {', '.join(key_stats.get('top_keys', [])[:5])}")
        print(f"  Refined Primary: {', '.join(refined_dna.get('keys', {}).get('primary', []))}")
        print(f"  Refined Secondary: {', '.join(refined_dna.get('keys', {}).get('secondary', []))}")
        
        if key_stats.get('distribution'):
            print(f"\n  Top Key Distribution:")
            sorted_keys = sorted(
                key_stats['distribution'].items(),
                key=lambda x: x[1].get('percentage', 0) if isinstance(x[1], dict) else 0,
                reverse=True
            )[:10]
            for key, data in sorted_keys:
                if isinstance(data, dict):
                    print(f"    {key:4} {data.get('count', 0):4} tracks ({data.get('percentage', 0):5.1f}%)")
    
    if stats.get('energy'):
        energy_stats = stats['energy']
        print(f"\nEnergy Profile:")
        print(f"  Average: {energy_stats.get('average', 'N/A')}/10")
        print(f"  Range: {energy_stats.get('min', 'N/A')} - {energy_stats.get('max', 'N/A')}")
        print(f"  Refined Average: {refined_dna.get('energy', {}).get('average', 'N/A')}/10")
        print(f"  Sweet Spot (5-7): {energy_stats.get('sweet_spot_percentage', 0):.1f}% of tracks")
    
    if stats.get('dna_match'):
        dna_stats = stats['dna_match']
        print(f"\nDNA Match Scores:")
        print(f"  Average: {dna_stats.get('average', 'N/A')}/100")
        print(f"  High Match (≥70): {dna_stats.get('high_match_count', 0)} tracks ({dna_stats.get('high_match_percentage', 0):.1f}%)")
    
    if stats.get('genres'):
        genre_stats = stats['genres']
        print(f"\nGenre Profile (from MusicBrainz):")
        print(f"  Top Genres: {', '.join(genre_stats.get('top_genres', [])[:5])}")
        print(f"  Unique Genres: {genre_stats.get('total_unique', 0)}")
        if genre_stats.get('distribution'):
            print(f"\n  Genre Distribution:")
            for genre, count in list(genre_stats['distribution'].items())[:10]:
                print(f"    {genre:20} {count:4} tracks")
    
    if stats.get('musicbrainz'):
        mb_stats = stats['musicbrainz']
        print(f"\nMusicBrainz Lookup:")
        print(f"  Successful: {mb_stats.get('lookup_success', 0)} tracks")
        print(f"  Failed: {mb_stats.get('lookup_failed', 0)} tracks")
        print(f"  Success Rate: {mb_stats.get('success_rate', 0):.1f}%")
    
    print("\n" + "=" * 70)


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Refine SERGIK DNA from music exports')
    parser.add_argument('directory', nargs='?', default=DEFAULT_DIR,
                       help=f'Directory to analyze (default: {DEFAULT_DIR})')
    parser.add_argument('--max-files', type=int, default=None,
                       help='Maximum number of files to analyze (for testing)')
    parser.add_argument('--skip-analysis', action='store_true',
                       help='Skip analysis and only refine from existing data')
    
    args = parser.parse_args()
    
    # Change to project root
    os.chdir(Path(__file__).parent.parent)
    
    print("=" * 70)
    print("SERGIK DNA REFINEMENT TOOL")
    print("=" * 70)
    
    # Scan directory
    audio_files = scan_directory(args.directory)
    
    if not audio_files:
        print("No audio files found. Exiting.")
        return
    
    # Analyze tracks
    if args.skip_analysis:
        print("\nSkipping analysis (--skip-analysis flag set)")
        results = []
    else:
        results = analyze_tracks(audio_files, max_files=args.max_files)
    
    if not results and not args.skip_analysis:
        print("No tracks successfully analyzed. Exiting.")
        return
    
    # Load existing results if skipping analysis
    if args.skip_analysis:
        csv_path = OUTPUT_DIR / "exports_dna_analysis.csv"
        if csv_path.exists():
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                results = list(reader)
                # Convert numeric fields
                for r in results:
                    for field in ['bpm', 'energy', 'duration', 'sample_rate', 'dna_match_score']:
                        if r.get(field):
                            try:
                                r[field] = float(r[field])
                            except:
                                r[field] = None
            print(f"Loaded {len(results)} existing results from {csv_path}")
        else:
            print("No existing results found. Please run without --skip-analysis first.")
            return
    
    # Calculate statistics
    print("\nCalculating statistics...")
    stats = calculate_statistics(results)
    
    # Refine DNA profile
    print("\nRefining SERGIK DNA profile...")
    refined_dna = refine_dna_profile(BASE_DNA, stats, results)
    
    # Save results
    print("\nSaving results...")
    save_results(results, stats, refined_dna, OUTPUT_DIR)
    
    # Print summary
    print_summary(stats, refined_dna)
    
    print("\n✓ DNA refinement complete!")


if __name__ == "__main__":
    main()

