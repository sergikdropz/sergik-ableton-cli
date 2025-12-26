#!/usr/bin/env python3
"""
SERGIK Batch Importer
Import and process files from various sources into the SERGIK database
"""

import os
import csv
import json
import re
import subprocess
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from collections import Counter

# Import from data_loader
from data_loader import (
    BASE_DIR, DATA_DIR,
    find_input_file, find_audio_files, find_ableton_projects,
    discover_external_drives, load_csv, save_csv, save_json,
    import_text_file, import_track_list
)

# ============================================================
# AUDIO METADATA EXTRACTION
# ============================================================

def get_audio_metadata(filepath: Path) -> Dict:
    """Extract metadata from audio file using afinfo (macOS)."""
    try:
        result = subprocess.run(
            ['afinfo', str(filepath)],
            capture_output=True, text=True, timeout=10
        )

        info = {
            'filename': filepath.name,
            'format': filepath.suffix.lower()[1:],
            'duration': 0,
            'sample_rate': 0,
            'bit_depth': 0,
            'channels': 0,
            'size_mb': round(filepath.stat().st_size / (1024*1024), 2),
            'modified': datetime.fromtimestamp(filepath.stat().st_mtime).strftime('%Y-%m-%d'),
            'path': str(filepath)
        }

        for line in result.stdout.split('\n'):
            if 'estimated duration:' in line:
                try:
                    info['duration'] = round(float(line.split(':')[1].strip().split()[0]), 2)
                except:
                    pass
            elif 'Data format:' in line:
                ch_match = re.search(r'(\d+)\s*ch', line)
                hz_match = re.search(r'(\d+)\s*Hz', line)
                bit_match = re.search(r'(\d+)-bit', line)
                if ch_match:
                    info['channels'] = int(ch_match.group(1))
                if hz_match:
                    info['sample_rate'] = int(hz_match.group(1))
                if bit_match:
                    info['bit_depth'] = int(bit_match.group(1))

        return info
    except Exception as e:
        return {
            'filename': filepath.name,
            'format': filepath.suffix.lower()[1:],
            'size_mb': round(filepath.stat().st_size / (1024*1024), 2) if filepath.exists() else 0,
            'path': str(filepath),
            'error': str(e)
        }


def parse_track_name(filename: str) -> Dict:
    """Parse SERGIK naming conventions from filename."""
    name = Path(filename).stem

    result = {
        'name': name,
        'artist': 'SERGIK' if name.upper().startswith('SERGIK') else '',
        'collaborator': '',
        'bpm': '',
        'key': '',
        'version': ''
    }

    # Collaborator (x pattern)
    if ' x ' in name.lower():
        parts = re.split(r'\s+[xX]\s+', name)
        for p in parts:
            artist = p.split(' - ')[0].strip()
            if artist.upper() != 'SERGIK' and len(artist) > 1:
                result['collaborator'] = artist
                break

    # BPM
    bpm_match = re.search(r'(\d{2,3})\s*[Bb][Pp][Mm]', name)
    if bpm_match:
        result['bpm'] = int(bpm_match.group(1))

    # Key
    key_match = re.search(r'\b([A-G][#b]?)\s*(maj|min|major|minor)?\b', name, re.I)
    if key_match:
        result['key'] = key_match.group(0).strip()

    # Version
    version_match = re.search(r'[Vv](\d+)', name)
    if version_match:
        result['version'] = f"V{version_match.group(1)}"

    return result


# ============================================================
# IMPORTERS
# ============================================================

def import_directory(directory: Path, file_type: str = "audio") -> List[Dict]:
    """
    Import all files from a directory.

    Args:
        directory: Path to scan
        file_type: "audio" or "als"

    Returns:
        List of file metadata dicts
    """
    if not directory.exists():
        print(f"Directory not found: {directory}")
        return []

    print(f"Scanning: {directory}")

    if file_type == "als":
        files = find_ableton_projects(directory)
    else:
        files = find_audio_files(directory)

    print(f"Found {len(files)} files")

    results = []
    for i, filepath in enumerate(files):
        if i % 100 == 0 and i > 0:
            print(f"  Processing {i}/{len(files)}...")

        if file_type == "als":
            info = {
                'filename': filepath.name,
                'name': filepath.stem,
                'size_mb': round(filepath.stat().st_size / (1024*1024), 2),
                'modified': datetime.fromtimestamp(filepath.stat().st_mtime).strftime('%Y-%m-%d'),
                'path': str(filepath)
            }
            info.update(parse_track_name(filepath.name))
        else:
            info = get_audio_metadata(filepath)
            info.update(parse_track_name(filepath.name))

        results.append(info)

    return results


def import_from_text_file(filepath: Path = None) -> List[Dict]:
    """Import track list from a text file."""
    if filepath is None:
        filepath = find_input_file("pasted.txt")

    if filepath is None:
        print("No input file found")
        return []

    print(f"Importing from: {filepath}")
    return import_track_list(filepath)


def import_from_clipboard() -> List[Dict]:
    """Import track list from clipboard."""
    try:
        result = subprocess.run(['pbpaste'], capture_output=True, text=True)
        text = result.stdout

        if not text.strip():
            print("Clipboard is empty")
            return []

        lines = [l.strip() for l in text.split('\n') if l.strip()]
        print(f"Found {len(lines)} items in clipboard")

        tracks = []
        for line in lines:
            track = parse_track_name(line)
            track['raw'] = line
            tracks.append(track)

        return tracks
    except Exception as e:
        print(f"Clipboard error: {e}")
        return []


# ============================================================
# BATCH OPERATIONS
# ============================================================

def batch_import_drives() -> Dict[str, List[Dict]]:
    """Import from all connected SERGIK drives."""
    drives = discover_external_drives()
    results = {}

    for name, path in drives.items():
        print(f"\n{'='*60}")
        print(f"Importing from: {name}")
        print("="*60)

        # Scan for .als files
        als_files = import_directory(path, file_type="als")
        results[f"{name}_projects"] = als_files

        # Scan for audio exports
        exports_path = path / "Exports SERGIK"
        if exports_path.exists():
            audio_files = import_directory(exports_path, file_type="audio")
            results[f"{name}_exports"] = audio_files

    return results


def merge_with_existing(new_data: List[Dict], existing_file: Path, key_field: str = "path") -> List[Dict]:
    """Merge new data with existing CSV, avoiding duplicates."""
    existing = load_csv(existing_file) if existing_file.exists() else []

    existing_keys = {row.get(key_field) for row in existing}

    new_items = [item for item in new_data if item.get(key_field) not in existing_keys]

    print(f"Existing: {len(existing)}, New: {len(new_items)}")

    return existing + new_items


def update_catalog(data: List[Dict], catalog_type: str):
    """Update a catalog with new data."""
    catalog_paths = {
        "projects": DATA_DIR / "catalog/ableton_projects/all_projects.csv",
        "exports": DATA_DIR / "catalog/exports/all_exports.csv",
        "sergik": DATA_DIR / "catalog/itunes_library/sergik_productions.csv",
    }

    filepath = catalog_paths.get(catalog_type)
    if not filepath:
        print(f"Unknown catalog type: {catalog_type}")
        return

    merged = merge_with_existing(data, filepath)
    save_csv(merged, filepath)


# ============================================================
# ANALYSIS
# ============================================================

def analyze_import(data: List[Dict]) -> Dict:
    """Analyze imported data."""
    if not data:
        return {}

    collabs = Counter(d.get('collaborator', '') for d in data if d.get('collaborator'))
    formats = Counter(d.get('format', '') for d in data)
    years = Counter(d.get('modified', '')[:4] for d in data if d.get('modified'))

    return {
        "total": len(data),
        "with_collaborator": len([d for d in data if d.get('collaborator')]),
        "with_bpm": len([d for d in data if d.get('bpm')]),
        "with_key": len([d for d in data if d.get('key')]),
        "top_collaborators": dict(collabs.most_common(10)),
        "formats": dict(formats),
        "by_year": dict(sorted(years.items(), reverse=True))
    }


def print_analysis(analysis: Dict):
    """Print analysis results."""
    print(f"\n{'='*60}")
    print("IMPORT ANALYSIS")
    print("="*60)

    print(f"\nTotal items: {analysis.get('total', 0)}")
    print(f"With collaborator: {analysis.get('with_collaborator', 0)}")
    print(f"With BPM: {analysis.get('with_bpm', 0)}")
    print(f"With Key: {analysis.get('with_key', 0)}")

    if analysis.get('top_collaborators'):
        print(f"\nTop Collaborators:")
        for artist, count in analysis['top_collaborators'].items():
            print(f"  {artist}: {count}")

    if analysis.get('by_year'):
        print(f"\nBy Year:")
        for year, count in list(analysis['by_year'].items())[:5]:
            print(f"  {year}: {count}")


# ============================================================
# CLI
# ============================================================

def main():
    import sys

    print("=" * 60)
    print("SERGIK BATCH IMPORTER")
    print("=" * 60)

    if len(sys.argv) < 2:
        print("""
Usage:
  python batch_importer.py <command> [options]

Commands:
  drives      Import from all connected SERGIK drives
  directory   Import from a specific directory
  clipboard   Import track list from clipboard
  textfile    Import from pasted.txt
  analyze     Analyze existing data

Examples:
  python batch_importer.py drives
  python batch_importer.py directory /path/to/folder
  python batch_importer.py clipboard
        """)
        return

    command = sys.argv[1].lower()

    if command == "drives":
        results = batch_import_drives()
        for name, data in results.items():
            analysis = analyze_import(data)
            print(f"\n--- {name} ---")
            print_analysis(analysis)

    elif command == "directory":
        if len(sys.argv) < 3:
            print("Please provide directory path")
            return
        path = Path(sys.argv[2])
        file_type = sys.argv[3] if len(sys.argv) > 3 else "audio"
        data = import_directory(path, file_type)
        analysis = analyze_import(data)
        print_analysis(analysis)

    elif command == "clipboard":
        data = import_from_clipboard()
        if data:
            analysis = analyze_import(data)
            print_analysis(analysis)

    elif command == "textfile":
        data = import_from_text_file()
        if data:
            analysis = analyze_import(data)
            print_analysis(analysis)

    elif command == "analyze":
        from data_loader import load_ableton_projects, load_exports
        projects = load_ableton_projects()
        exports = load_exports()
        print("\n--- Projects ---")
        print_analysis(analyze_import(projects))
        print("\n--- Exports ---")
        print_analysis(analyze_import(exports))

    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    main()
