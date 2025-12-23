#!/usr/bin/env python3
"""
SERGIK Data Loader & File Discovery
Unified interface for loading and parsing all SERGIK data sources
"""

import os
import csv
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime

# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path("/Users/machd/sergik_custom_gpt")
DATA_DIR = BASE_DIR / "data"

# Known data locations
DATA_SOURCES = {
    "catalog": {
        "ableton_projects": DATA_DIR / "catalog/ableton_projects/all_projects.csv",
        "exports": DATA_DIR / "catalog/exports/all_exports.csv",
        "sergik_tracks": DATA_DIR / "catalog/itunes_library/sergik_productions.csv",
        "influences": DATA_DIR / "catalog/itunes_library/influences.csv",
    },
    "analysis": {
        "bpm_key": DATA_DIR / "analysis/bpm_key/analyzed_tracks.csv",
        "collaborators": DATA_DIR / "analysis/collaborators/rankings.csv",
        "timeline": DATA_DIR / "analysis/timeline/by_year.csv",
    },
    "profiles": {
        "master": DATA_DIR / "profiles/master_profile.json",
    },
    "external_drives": [
        Path("/Volumes/SERGIK"),
        Path("/Volumes/SERGIK 2tb2"),
    ]
}

# ============================================================
# FILE DISCOVERY
# ============================================================

def find_input_file(filename: str = "pasted.txt", search_paths: List[Path] = None) -> Optional[Path]:
    """
    Search for an input file in common locations.

    Args:
        filename: Name of file to find
        search_paths: Additional paths to search

    Returns:
        Path to file if found, None otherwise
    """
    candidates = [
        Path.cwd() / filename,
        Path.home() / "Downloads" / filename,
        Path.home() / "Desktop" / filename,
        BASE_DIR / filename,
        DATA_DIR / filename,
        Path("/tmp") / filename,
    ]

    if search_paths:
        candidates.extend(search_paths)

    for path in candidates:
        if path.exists():
            print(f"Found: {path}")
            return path

    return None


def find_audio_files(directory: Path, extensions: set = None) -> List[Path]:
    """Find all audio files in a directory."""
    if extensions is None:
        extensions = {".wav", ".mp3", ".aif", ".aiff", ".m4a", ".flac"}

    audio_files = []
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if Path(f).suffix.lower() in extensions:
                audio_files.append(Path(root) / f)

    return audio_files


def find_ableton_projects(directory: Path) -> List[Path]:
    """Find all .als files in a directory."""
    als_files = []
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.endswith('.als') and not f.startswith('._'):
                als_files.append(Path(root) / f)

    return als_files


def discover_external_drives() -> Dict[str, Path]:
    """Discover connected SERGIK external drives."""
    drives = {}
    for drive in DATA_SOURCES["external_drives"]:
        if drive.exists():
            drives[drive.name] = drive
            print(f"Found drive: {drive}")
    return drives


# ============================================================
# DATA LOADERS
# ============================================================

def load_csv(filepath: Path, limit: int = None) -> List[Dict]:
    """Load CSV file into list of dictionaries."""
    if not filepath.exists():
        print(f"File not found: {filepath}")
        return []

    with open(filepath, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        if limit:
            return [row for i, row in enumerate(reader) if i < limit]
        return list(reader)


def load_json(filepath: Path) -> Dict:
    """Load JSON file."""
    if not filepath.exists():
        print(f"File not found: {filepath}")
        return {}

    with open(filepath, 'r') as f:
        return json.load(f)


def save_csv(data: List[Dict], filepath: Path, fieldnames: List[str] = None):
    """Save list of dicts to CSV."""
    if not data:
        print("No data to save")
        return

    filepath.parent.mkdir(parents=True, exist_ok=True)

    if fieldnames is None:
        fieldnames = list(data[0].keys())

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"Saved: {filepath} ({len(data)} rows)")


def save_json(data: Dict, filepath: Path):
    """Save dict to JSON."""
    filepath.parent.mkdir(parents=True, exist_ok=True)

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Saved: {filepath}")


# ============================================================
# CATALOG LOADERS
# ============================================================

def load_ableton_projects(year: str = None) -> List[Dict]:
    """Load Ableton projects, optionally filtered by year."""
    if year:
        filepath = DATA_DIR / f"catalog/ableton_projects/year_{year}.csv"
    else:
        filepath = DATA_SOURCES["catalog"]["ableton_projects"]

    return load_csv(filepath)


def load_exports(format_filter: str = None) -> List[Dict]:
    """Load exports, optionally filtered by format (wav/mp3)."""
    if format_filter:
        filepath = DATA_DIR / f"catalog/exports/{format_filter.lower()}_exports.csv"
    else:
        filepath = DATA_SOURCES["catalog"]["exports"]

    return load_csv(filepath)


def load_itunes_library(category: str = "all") -> List[Dict]:
    """
    Load iTunes library tracks.

    Args:
        category: "sergik", "influences", or "all"
    """
    if category == "sergik":
        return load_csv(DATA_SOURCES["catalog"]["sergik_tracks"])
    elif category == "influences":
        return load_csv(DATA_SOURCES["catalog"]["influences"])
    else:
        sergik = load_csv(DATA_SOURCES["catalog"]["sergik_tracks"])
        influences = load_csv(DATA_SOURCES["catalog"]["influences"])
        return sergik + influences


def load_analysis(analysis_type: str) -> List[Dict]:
    """Load analysis data (bpm_key, collaborators, timeline)."""
    filepath = DATA_SOURCES["analysis"].get(analysis_type)
    if filepath:
        return load_csv(filepath)
    return []


def load_master_profile() -> Dict:
    """Load the master profile."""
    return load_json(DATA_SOURCES["profiles"]["master"])


# ============================================================
# DATA IMPORTERS
# ============================================================

def import_text_file(filepath: Path) -> List[str]:
    """Import a text file as list of lines."""
    if not filepath.exists():
        print(f"File not found: {filepath}")
        return []

    with open(filepath, 'r') as f:
        return [line.strip() for line in f if line.strip()]


def import_track_list(filepath: Path) -> List[Dict]:
    """
    Import a text file containing track names.
    Parses SERGIK naming conventions.
    """
    import re

    lines = import_text_file(filepath)
    tracks = []

    for line in lines:
        track = {"raw": line, "name": line, "collaborator": "", "bpm": "", "key": ""}

        # Extract collaborator (X pattern)
        if ' x ' in line.lower():
            parts = re.split(r'\s+[xX]\s+', line)
            for p in parts:
                artist = p.split(' - ')[0].strip()
                if artist.upper() != 'SERGIK':
                    track["collaborator"] = artist
                    break

        # Extract BPM
        bpm_match = re.search(r'(\d{2,3})\s*[Bb][Pp][Mm]', line)
        if bpm_match:
            track["bpm"] = bpm_match.group(1)

        # Extract Key
        key_match = re.search(r'\b([A-G][#b]?)\s*(maj|min|major|minor)?\b', line, re.I)
        if key_match:
            track["key"] = key_match.group(0)

        tracks.append(track)

    return tracks


def import_from_clipboard() -> str:
    """Import text from system clipboard (macOS)."""
    import subprocess
    result = subprocess.run(['pbpaste'], capture_output=True, text=True)
    return result.stdout


# ============================================================
# QUERY FUNCTIONS
# ============================================================

def search_projects(query: str, limit: int = 20) -> List[Dict]:
    """Search projects by name."""
    projects = load_ableton_projects()
    query_lower = query.lower()

    matches = [p for p in projects if query_lower in p.get('name', '').lower()]
    return matches[:limit]


def search_by_collaborator(collaborator: str) -> List[Dict]:
    """Find all projects with a specific collaborator."""
    projects = load_ableton_projects()
    collab_lower = collaborator.lower()

    return [p for p in projects if collab_lower in p.get('collaborator', '').lower()]


def search_by_year(year: str) -> Dict[str, int]:
    """Get stats for a specific year."""
    projects = load_ableton_projects(year)

    return {
        "total": len(projects),
        "collaborators": len(set(p.get('collaborator', '') for p in projects if p.get('collaborator'))),
    }


def get_stats() -> Dict:
    """Get overall statistics."""
    profile = load_master_profile()
    return profile.get("catalog", {})


# ============================================================
# MAIN / CLI
# ============================================================

def main():
    """CLI interface for data loader."""
    import sys

    print("=" * 60)
    print("SERGIK DATA LOADER")
    print("=" * 60)

    # Show stats
    stats = get_stats()
    print(f"\nLoaded Data:")
    print(f"  Ableton Projects: {stats.get('ableton_projects', 0):,}")
    print(f"  Exports:          {stats.get('exports', 0):,}")
    print(f"  iTunes SERGIK:    {stats.get('itunes_sergik', 0):,}")
    print(f"  iTunes Influences:{stats.get('itunes_influences', 0):,}")

    # Check for external drives
    print(f"\nExternal Drives:")
    drives = discover_external_drives()
    if not drives:
        print("  No SERGIK drives connected")

    # Check for input file
    print(f"\nLooking for pasted.txt...")
    input_file = find_input_file()
    if input_file:
        tracks = import_track_list(input_file)
        print(f"  Imported {len(tracks)} tracks from pasted.txt")
    else:
        print("  No pasted.txt found (optional)")


if __name__ == "__main__":
    main()
