#!/usr/bin/env python3
"""
iTunes/Apple Music Library Scanner - Deduplicated Version
"""

import os
import re
import csv
import json
from pathlib import Path
from collections import Counter, defaultdict

MUSIC_DIRS = [
    "/Users/machd/Music/Music/Media.localized/Music",
    "/Users/machd/Music/Music 1/Media.localized/Music",
]

OUTPUT_DIR = "data/manifests"
AUDIO_EXTS = {".wav", ".mp3", ".aif", ".aiff", ".m4a", ".flac"}

# Collaborator name normalization (map variants to canonical name)
COLLAB_ALIASES = {
    "breauxxx": "Breauxx",
    "breauxx": "Breauxx",
    "nood": "NOOD",
    "andino": "ANDINO",
    "chklz": "CHKLZ",
    "janis": "Janis & The Planets",
    "janis & the planets": "Janis & The Planets",
    "bejanis": "BeJanis",
    "og coconut": "OG Coconut",
    "og coco": "OG Coconut",
    "sean hart": "Sean Hart",
    "sean watson": "Sean Watson",
    "silent jay": "Silent Jay",
    "slick floyd": "Slick Floyd",
    "mateo haze": "Mateo Haze",
    "aloe flipz": "Aloe Flipz",
    "lugh haurie": "Lugh Haurie",
    "www": "WWW",
    "jimii": "JIMII",
    "l9v": "L9V",
    "optikz": "Optikz",
}

GENRE_PATTERNS = {
    "house": r"\b(house|tech.?house|deep.?house|bass.?house)\b",
    "techno": r"\b(techno|minimal)\b",
    "funk": r"\b(funk|funky|funkshway)\b",
    "soul": r"\b(soul|soular|soulful)\b",
    "hiphop": r"\b(hip.?hop|boom.?bap|rap|trap)\b",
    "dnb": r"\b(dnb|drum.?n.?bass|jungle)\b",
    "disco": r"\b(disco|nu.?disco)\b",
    "reggae": r"\b(reggae|reggaeton|dub)\b",
    "jazz": r"\b(jazz|jazzy)\b",
    "ambient": r"\b(ambient|chill|chillout|lo.?fi)\b",
}

BPM_RE = re.compile(r"(\d{2,3})\s*[Bb][Pp][Mm]")

def normalize_collab(name):
    """Normalize collaborator name to canonical form"""
    key = name.lower().strip()
    return COLLAB_ALIASES.get(key, name.strip())

def extract_genre(text):
    text_lower = text.lower()
    genres = []
    for genre, pattern in GENRE_PATTERNS.items():
        if re.search(pattern, text_lower, re.IGNORECASE):
            genres.append(genre)
    return genres

def extract_bpm(text):
    match = BPM_RE.search(text)
    if match:
        bpm = int(match.group(1))
        if 50 <= bpm <= 220:
            return bpm
    return None

def is_sergik_track(filename):
    return filename.upper().startswith("SERGIK")

def scan_library():
    all_tracks = []
    artist_counts = Counter()
    genre_counts = Counter()
    bpm_values = []
    collab_artists = Counter()
    collab_tracks = defaultdict(set)  # Track unique songs per collaborator
    
    for music_dir in MUSIC_DIRS:
        if not os.path.exists(music_dir):
            continue
            
        print(f"Scanning: {music_dir}")
        
        for artist_folder in Path(music_dir).iterdir():
            if not artist_folder.is_dir():
                continue
                
            artist_name = artist_folder.name
            
            for root, dirs, files in os.walk(artist_folder):
                for file in files:
                    ext = Path(file).suffix.lower()
                    if ext not in AUDIO_EXTS:
                        continue
                    
                    file_path = os.path.join(root, file)
                    stat = os.stat(file_path)
                    
                    genres = extract_genre(file)
                    bpm = extract_bpm(file)
                    is_sergik = is_sergik_track(file)
                    
                    artist_counts[artist_name] += 1
                    for g in genres:
                        genre_counts[g] += 1
                    if bpm:
                        bpm_values.append(bpm)
                    
                    # Extract and normalize collaborators
                    if " x " in file.lower() or " X " in file:
                        parts = re.split(r"\s+[xX]\s+", Path(file).stem)
                        # Get base track name for deduplication
                        track_base = re.sub(r"\s*[vV]\d+.*$", "", Path(file).stem)
                        track_base = re.sub(r"\s*\d+\s*[Bb][Pp][Mm].*$", "", track_base)
                        
                        for p in parts:
                            name = p.split(" - ")[0].strip()
                            if name and name.upper() != "SERGIK":
                                normalized = normalize_collab(name)
                                collab_tracks[normalized].add(track_base.lower())
                    
                    track = {
                        "filename": file,
                        "artist_folder": artist_name,
                        "path": file_path,
                        "size_mb": round(stat.st_size / (1024*1024), 2),
                        "format": ext[1:],
                        "genres": ",".join(genres) if genres else "",
                        "bpm": bpm or "",
                        "is_sergik": is_sergik,
                    }
                    all_tracks.append(track)
    
    # Convert track sets to counts (unique projects per collaborator)
    for collab, tracks in collab_tracks.items():
        collab_artists[collab] = len(tracks)
    
    return all_tracks, artist_counts, genre_counts, bpm_values, collab_artists

def main():
    print("=" * 60)
    print("ITUNES LIBRARY ANALYSIS (DEDUPLICATED)")
    print("=" * 60)
    
    tracks, artists, genres, bpms, collabs = scan_library()
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    tracks_csv = os.path.join(OUTPUT_DIR, "itunes_library.csv")
    with open(tracks_csv, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=tracks[0].keys())
        w.writeheader()
        w.writerows(tracks)
    print(f"\nSaved: {tracks_csv} ({len(tracks)} tracks)")
    
    print(f"\n{'=' * 60}")
    print("GENRE DISTRIBUTION")
    print("=" * 60)
    for genre, count in genres.most_common(15):
        pct = (count / len(tracks)) * 100
        print(f"  {genre:15} {count:4} tracks ({pct:.1f}%)")
    
    if bpms:
        avg_bpm = sum(bpms) / len(bpms)
        print(f"\n{'=' * 60}")
        print("BPM ANALYSIS")
        print("=" * 60)
        print(f"  Tracks with BPM: {len(bpms)}")
        print(f"  Average BPM: {avg_bpm:.1f}")
        print(f"  Range: {min(bpms)} - {max(bpms)}")
    
    print(f"\n{'=' * 60}")
    print("TOP COLLABORATORS (Unique Projects)")
    print("=" * 60)
    for artist, count in collabs.most_common(25):
        print(f"  {artist:25} {count:3} projects")
    
    sergik_tracks = [t for t in tracks if t["is_sergik"]]
    other_tracks = [t for t in tracks if not t["is_sergik"]]
    
    print(f"\n{'=' * 60}")
    print("SUMMARY")
    print("=" * 60)
    print(f"  Total tracks: {len(tracks)}")
    print(f"  SERGIK productions: {len(sergik_tracks)}")
    print(f"  Influence library: {len(other_tracks)}")
    print(f"  Unique collaborators: {len(collabs)}")
    
    # Save profile
    profile = {
        "total_tracks": len(tracks),
        "sergik_tracks": len(sergik_tracks),
        "influence_tracks": len(other_tracks),
        "genres": dict(genres.most_common(15)),
        "bpm_avg": round(sum(bpms)/len(bpms), 1) if bpms else 0,
        "collaborators": dict(collabs.most_common(25)),
    }
    
    profile_json = os.path.join(OUTPUT_DIR, "sergik_influence_profile.json")
    with open(profile_json, "w") as f:
        json.dump(profile, f, indent=2)
    print(f"\nSaved: {profile_json}")

if __name__ == "__main__":
    os.chdir("/Users/machd/sergik_custom_gpt")
    main()
