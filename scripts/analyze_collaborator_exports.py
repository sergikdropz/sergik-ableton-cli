#!/usr/bin/env python3
"""
Analyze exported tracks and count collaborators.

Extracts collaborator names from export filenames and counts
unique exported tracks per collaborator.
"""

import csv
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Set

# Normalize collaborator names (handle variations)
COLLAB_NORMALIZE = {
    "SERGIC": "SERGIK",
    "Sergik": "SERGIK",
    "SergikL": "SERGIK",
    "SERG": "SERGIK",
    "ANDINO": "ANDINO",
    "Andino": "ANDINO",
    "DINO": "ANDINO",
    "Slick Floyd": "Slick Floyd",
    "SLICK FLOYD": "Slick Floyd",
    "Slick": "Slick Floyd",
    "Breauxx": "Breauxx",
    "Breauxxx": "Breauxx",
    "OG Coconut": "OG Coconut",
    "NOOD": "NOOD",
    "CHKLZ": "CHKLZ",
    "LODIN": "LODIN",
    "Sean Watson": "Sean Watson",
    "Sean Hart": "Sean Hart",
    "Sean H": "Sean Hart",
    "Jetski": "Jetski",
    "JIMII": "JIMII",
    "Aloe Flipz": "Aloe Flipz",
    "Stan The Guitarman": "Stan The Guitarman",
    "BeJanis": "BeJanis",
    "Frank Terry": "Frank Terry",
    "Batt Lo": "Batt Lo",
    "BATTLO": "Batt Lo",
    "Lugh Haurie": "Lugh Haurie",
    "Zak Martin": "Zak Martin",
    "Cy Heck": "Cy Heck",
    "Janis": "Janis",
    "Janis & The Planets": "Janis & The Planets",
    "Mateo Haze": "Mateo Haze",
    "WWW": "WWW",
    "ESHER": "ESHER",
    "L9V": "L9V",
    "OLEA": "OLEA",
    "Optikz": "Optikz",
    "Bob Secret": "Bob Secret",
    "Javi": "Javi",
    "Ceemoar": "Ceemoar",
    "CEEMOAR": "Ceemoar",
    "Barrio Bros": "Barrio Bros",
    "Silent Jay": "Silent Jay",
}


def normalize_collab(name: str) -> str:
    """Normalize collaborator name."""
    name = name.strip()
    # Check direct mapping first
    if name in COLLAB_NORMALIZE:
        return COLLAB_NORMALIZE[name]
    # Try case-insensitive match
    for key, value in COLLAB_NORMALIZE.items():
        if name.upper() == key.upper():
            return value
    # Return as-is if no match
    return name


def extract_collaborators(filename: str) -> List[str]:
    """Extract collaborator names from filename."""
    collaborators = []
    
    # Remove file extension
    name = Path(filename).stem
    
    # Pattern 1: "ARTIST x SERGIK" or "SERGIK x ARTIST"
    if " x " in name or " X " in name:
        parts = re.split(r"\s+[xX]\s+", name)
        for part in parts:
            # Remove track title if present (after " - ")
            artist = part.split(" - ")[0].strip()
            if artist and artist.upper() not in ["SERGIK", "SERGIC", "SERG"]:
                normalized = normalize_collab(artist)
                if normalized not in collaborators:
                    collaborators.append(normalized)
    
    # Pattern 2: "C MAJOR W BATTLO" (with "W" for "with")
    if re.search(r"\s+[Ww]\s+", name):
        parts = re.split(r"\s+[Ww]\s+", name)
        for part in parts:
            artist = part.split(" - ")[0].strip()
            # Remove common prefixes like "C MAJOR"
            artist = re.sub(r"^[A-G][#b]?\s+(MAJOR|MINOR|MAJ|MIN)\s+", "", artist, flags=re.IGNORECASE)
            artist = artist.strip()
            if artist and artist.upper() not in ["SERGIK", "SERGIC", "SERG"]:
                normalized = normalize_collab(artist)
                if normalized not in collaborators:
                    collaborators.append(normalized)
    
    # Pattern 3: "ft." or "feat." features
    for pattern in [r"\s+ft\.\s+", r"\s+feat\.\s+", r"\s+featuring\s+"]:
        if re.search(pattern, name, re.IGNORECASE):
            parts = re.split(pattern, name, flags=re.IGNORECASE)
            if len(parts) > 1:
                artist = parts[-1].split(" - ")[0].strip()
                if artist:
                    normalized = normalize_collab(artist)
                    if normalized not in collaborators:
                        collaborators.append(normalized)
    
    return collaborators


def analyze_exports(exports_csv: Path) -> Dict[str, Set[str]]:
    """Analyze exports CSV and return collaborator -> set of unique tracks."""
    collab_tracks = defaultdict(set)
    
    with open(exports_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            filename = row.get('filename', '')
            if not filename:
                continue
            
            # Extract base track name (remove version numbers, BPM, etc.)
            base_name = re.sub(r"\s*[vV]\d+.*$", "", filename)
            base_name = re.sub(r"\s*\d+\s*[Bb][Pp][Mm].*$", "", base_name)
            base_name = re.sub(r"\s*\(.*?\).*$", "", base_name)  # Remove (Mastered), etc.
            base_name = base_name.lower().strip()
            
            # Extract collaborators
            collaborators = extract_collaborators(filename)
            
            if collaborators:
                for collab in collaborators:
                    collab_tracks[collab].add(base_name)
            else:
                # Solo track (no collaborator)
                collab_tracks["Solo"].add(base_name)
    
    return collab_tracks


def main():
    """Main analysis function."""
    # Paths
    exports_csv = Path("data/catalog/exports/all_exports.csv")
    output_csv = Path("data/analysis/collaborators/exported_tracks.csv")
    output_json = Path("data/manifests/collaborator_export_counts.json")
    
    if not exports_csv.exists():
        print(f"Error: {exports_csv} not found")
        return
    
    print("=" * 60)
    print("COLLABORATOR EXPORTED TRACKS ANALYSIS")
    print("=" * 60)
    
    # Analyze exports
    collab_tracks = analyze_exports(exports_csv)
    
    # Convert to counts
    collab_counts = {collab: len(tracks) for collab, tracks in collab_tracks.items()}
    
    # Sort by count (descending)
    sorted_collabs = sorted(collab_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Print summary
    print(f"\nTotal collaborators with exported tracks: {len(collab_counts)}")
    print(f"Total unique exported tracks: {sum(collab_counts.values())}")
    print(f"\nTop 20 Collaborators by Exported Tracks:")
    print("-" * 60)
    print(f"{'Rank':<6} {'Collaborator':<30} {'Tracks':<10}")
    print("-" * 60)
    
    for rank, (collab, count) in enumerate(sorted_collabs[:20], 1):
        print(f"{rank:<6} {collab:<30} {count:<10}")
    
    # Write CSV
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['rank', 'collaborator', 'exported_tracks'])
        for rank, (collab, count) in enumerate(sorted_collabs, 1):
            writer.writerow([rank, collab, count])
    
    print(f"\n✓ Saved to: {output_csv}")
    
    # Write JSON
    import json
    output_json.parent.mkdir(parents=True, exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump({
            "total_collaborators": len(collab_counts),
            "total_exported_tracks": sum(collab_counts.values()),
            "collaborators": dict(sorted_collabs),
            "top_10": dict(sorted_collabs[:10])
        }, f, indent=2)
    
    print(f"✓ Saved to: {output_json}")
    
    # Update master profile if it exists
    master_profile = Path("data/profiles/master_profile.json")
    if master_profile.exists():
        import json
        with open(master_profile, 'r', encoding='utf-8') as f:
            profile = json.load(f)
        
        # Add exported tracks data
        if "collaborators" not in profile:
            profile["collaborators"] = {}
        
        # Add exported_tracks field to existing collaborators
        for collab, count in collab_counts.items():
            if collab in profile["collaborators"]:
                if isinstance(profile["collaborators"][collab], dict):
                    profile["collaborators"][collab]["exported_tracks"] = count
                else:
                    # Convert to dict if it's just a number
                    profile["collaborators"][collab] = {
                        "projects": profile["collaborators"][collab],
                        "exported_tracks": count
                    }
            else:
                profile["collaborators"][collab] = {
                    "exported_tracks": count
                }
        
        # Add summary
        if "exported_tracks_summary" not in profile:
            profile["exported_tracks_summary"] = {
                "total_collaborators": len(collab_counts),
                "total_exported_tracks": sum(collab_counts.values()),
                "top_10": dict(sorted_collabs[:10])
            }
        
        with open(master_profile, 'w', encoding='utf-8') as f:
            json.dump(profile, f, indent=2)
        
        print(f"✓ Updated: {master_profile}")
    
    print("\n" + "=" * 60)
    print("Analysis complete!")


if __name__ == "__main__":
    main()

