"""
Collaborator Utilities

Normalize and extract collaborator names from filenames and metadata.
"""

import re
from pathlib import Path
from typing import List, Dict

# Collaborator name normalization mapping
# Maps common variations to canonical names
COLLAB_ALIASES: Dict[str, str] = {
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

# Additional normalization for analyze_collaborator_exports.py patterns
COLLAB_NORMALIZE: Dict[str, str] = {
    "Breauxx": "Breauxx",
    "NOOD": "NOOD",
    "ANDINO": "ANDINO",
    "CHKLZ": "CHKLZ",
    "OG Coconut": "OG Coconut",
    "Sean Hart": "Sean Hart",
    "Sean Watson": "Sean Watson",
    "Silent Jay": "Silent Jay",
    "Slick Floyd": "Slick Floyd",
    "JIMII": "JIMII",
    "L9V": "L9V",
    "LODIN": "LODIN",
    "ESHER": "ESHER",
    "Stan The Guitarman": "Stan The Guitarman",
}


def normalize_collab(name: str) -> str:
    """
    Normalize collaborator name to canonical form.
    
    Handles case-insensitive matching and common variations.
    
    Args:
        name: Raw collaborator name
        
    Returns:
        Normalized canonical name
        
    Examples:
        >>> normalize_collab("breauxx")
        'Breauxx'
        >>> normalize_collab("NOOD")
        'NOOD'
        >>> normalize_collab("Unknown Artist")
        'Unknown Artist'
    """
    if not name:
        return name
    
    name = name.strip()
    
    # Check direct mapping first (case-sensitive)
    if name in COLLAB_ALIASES:
        return COLLAB_ALIASES[name]
    
    # Check case-insensitive match
    name_lower = name.lower()
    if name_lower in COLLAB_ALIASES:
        return COLLAB_ALIASES[name_lower]
    
    # Check COLLAB_NORMALIZE for additional patterns
    if name in COLLAB_NORMALIZE:
        return COLLAB_NORMALIZE[name]
    
    # Case-insensitive match in COLLAB_NORMALIZE
    for key, value in COLLAB_NORMALIZE.items():
        if name.upper() == key.upper():
            return value
    
    # Return as-is if no match found
    return name


def extract_collaborators(filename: str) -> List[str]:
    """
    Extract collaborator names from filename.
    
    Supports multiple patterns:
    - "ARTIST x SERGIK" or "SERGIK x ARTIST"
    - "ARTIST w ARTIST" (with)
    - "ARTIST ft. ARTIST" (featuring)
    - "ARTIST feat. ARTIST"
    
    Args:
        filename: Filename to extract collaborators from
        
    Returns:
        List of normalized collaborator names (excluding SERGIK)
        
    Examples:
        >>> extract_collaborators("Silent Jay x SERGIK - Track Name.mp3")
        ['Silent Jay']
        >>> extract_collaborators("SERGIK w Breauxx - Song.wav")
        ['Breauxx']
    """
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
    
    # Pattern 2: "ARTIST w ARTIST" (with)
    if re.search(r"\s+[Ww]\s+", name):
        parts = re.split(r"\s+[Ww]\s+", name)
        for part in parts:
            artist = part.split(" - ")[0].strip()
            # Remove common prefixes like "C MAJOR"
            artist = re.sub(
                r"^[A-G][#b]?\s+(MAJOR|MINOR|MAJ|MIN)\s+",
                "",
                artist,
                flags=re.IGNORECASE
            )
            artist = artist.strip()
            if artist and artist.upper() not in ["SERGIK", "SERGIC", "SERG"]:
                normalized = normalize_collab(artist)
                if normalized not in collaborators:
                    collaborators.append(normalized)
    
    # Pattern 3: "ft." or "feat." features
    for pattern in [r"\s+ft\.\s+", r"\s+feat\.\s+", r"\s+featuring\s+"]:
        if re.search(pattern, name, re.IGNORECASE):
            parts = re.split(pattern, name, flags=re.IGNORECASE)
            for part in parts[1:]:  # Skip first part (main artist)
                artist = part.split(" - ")[0].strip()
                if artist and artist.upper() not in ["SERGIK", "SERGIC", "SERG"]:
                    normalized = normalize_collab(artist)
                    if normalized not in collaborators:
                        collaborators.append(normalized)
    
    return collaborators

