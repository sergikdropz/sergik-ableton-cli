"""
Text Extraction Utilities

Extract musical parameters from natural language text.
"""

import re
from typing import Optional, List

# Style patterns for extraction
STYLE_PATTERNS = {
    "tech-house": ["tech-house", "tech house", "techhouse"],
    "deep-house": ["deep-house", "deep house", "deephouse"],
    "techno": ["techno"],
    "trap": ["trap"],
    "reggaeton": ["reggaeton", "reggaeton", "dembow"],
    "house": ["house"],
    "ambient": ["ambient", "chill", "chillout"],
    "hiphop": ["hip-hop", "hip hop", "boom bap", "boom-bap"],
    "funk": ["funk", "funky"],
    "soul": ["soul", "soulful"],
    "dnb": ["dnb", "drum and bass", "drum n bass", "jungle"],
    "disco": ["disco", "nu-disco"],
    "lo_fi": ["lo-fi", "lofi", "lo fi"],
}

# Genre patterns for extraction
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

# BPM extraction regex
BPM_RE = re.compile(r"(\d{2,3})\s*[Bb][Pp][Mm]")


def extract_style(prompt: str) -> str:
    """
    Extract music style from natural language text.
    
    Args:
        prompt: Natural language text containing style information
        
    Returns:
        Detected style name (defaults to "house" if not found)
        
    Examples:
        >>> extract_style("generate tech house drums")
        'tech-house'
        >>> extract_style("make a trap beat")
        'trap'
    """
    prompt_lower = prompt.lower()
    
    # Check each style pattern
    for style, patterns in STYLE_PATTERNS.items():
        for pattern in patterns:
            if pattern in prompt_lower:
                return style
    
    return "house"  # Default


def extract_key(prompt: str) -> Optional[str]:
    """
    Extract musical key from natural language text.
    
    Supports:
    - Standard notation: "C major", "D minor", "F#maj"
    - Camelot notation: "10B", "7A"
    - Abbreviated: "Cmin", "F#maj"
    
    Args:
        prompt: Natural language text containing key information
        
    Returns:
        Extracted key string or None if not found
        
    Examples:
        >>> extract_key("generate in D minor")
        'D minor'
        >>> extract_key("chords in 10B")
        '10B'
        >>> extract_key("bass in Cmin")
        'Cmin'
    """
    # Pattern matches: A-G with optional #/b, optional min/maj, or Camelot notation
    key_match = re.search(
        r"([A-G][#b]?\s*(?:min|maj|minor|major)?|[0-9]{1,2}[AB])",
        prompt,
        re.IGNORECASE
    )
    return key_match.group(1) if key_match else None


def extract_bars(prompt: str) -> Optional[int]:
    """
    Extract bar count from natural language text.
    
    Args:
        prompt: Natural language text containing bar information
        
    Returns:
        Extracted bar count or None if not found
        
    Examples:
        >>> extract_bars("generate 8 bars")
        8
        >>> extract_bars("make 16 bar loop")
        16
    """
    bars_match = re.search(r"(\d+)\s*bar", prompt, re.IGNORECASE)
    return int(bars_match.group(1)) if bars_match else None


def extract_percentage(prompt: str) -> Optional[int]:
    """
    Extract percentage value from natural language text.
    
    Args:
        prompt: Natural language text containing percentage
        
    Returns:
        Extracted percentage (0-100) or None if not found
        
    Examples:
        >>> extract_percentage("set swing to 50%")
        50
        >>> extract_percentage("humanize 25 percent")
        25
    """
    # Match percentage patterns: "50%", "25 percent", etc.
    pct_match = re.search(r"(\d+)%", prompt)
    if pct_match:
        return int(pct_match.group(1))
    
    # Also check for "percent" or "per cent"
    percent_match = re.search(r"(\d+)\s*percent", prompt, re.IGNORECASE)
    if percent_match:
        return int(percent_match.group(1))
    
    return None


def extract_bpm(text: str) -> Optional[int]:
    """
    Extract BPM value from text.
    
    Args:
        text: Text containing BPM information
        
    Returns:
        Extracted BPM (50-220) or None if not found/invalid
        
    Examples:
        >>> extract_bpm("Track at 125 BPM")
        125
        >>> extract_bpm("120bpm house track")
        120
    """
    match = BPM_RE.search(text)
    if match:
        bpm = int(match.group(1))
        if 50 <= bpm <= 220:
            return bpm
    return None


def extract_genre(text: str) -> List[str]:
    """
    Extract genre tags from text using pattern matching.
    
    Args:
        text: Text containing genre information
        
    Returns:
        List of detected genre names
        
    Examples:
        >>> extract_genre("tech house track with funk elements")
        ['house', 'funk']
    """
    text_lower = text.lower()
    genres = []
    
    for genre, pattern in GENRE_PATTERNS.items():
        if re.search(pattern, text_lower, re.IGNORECASE):
            genres.append(genre)
    
    return genres

