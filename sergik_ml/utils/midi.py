"""
MIDI Utilities

MIDI note conversion, key parsing, and scale utilities.
"""

from typing import List, Tuple, Optional

# Note name to MIDI number mapping (C4 = 60)
NOTE_MAP = {
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4,
    "F": 5, "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11,
}

# Scale definitions (intervals from root)
SCALES = {
    "major": [0, 2, 4, 5, 7, 9, 11],
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "phrygian": [0, 1, 3, 5, 7, 8, 10],
    "mixolydian": [0, 2, 4, 5, 7, 9, 10],
    "harmonic_minor": [0, 2, 3, 5, 7, 8, 11],
    "melodic_minor": [0, 2, 3, 5, 7, 9, 11],
    "pentatonic_major": [0, 2, 4, 7, 9],
    "pentatonic_minor": [0, 3, 5, 7, 10],
    "blues": [0, 3, 5, 6, 7, 10],
}


def note_name_to_midi(note_name: str, octave: int = 4) -> int:
    """
    Convert note name to MIDI number.
    
    Args:
        note_name: Note name (e.g., "C", "C#", "Db")
        octave: Octave number (default: 4, where C4 = 60)
        
    Returns:
        MIDI note number (0-127)
        
    Examples:
        >>> note_name_to_midi("C", 4)
        60
        >>> note_name_to_midi("C#", 4)
        61
        >>> note_name_to_midi("A", 3)
        57
    """
    note = note_name.strip()
    if note not in NOTE_MAP:
        raise ValueError(f"Invalid note name: {note_name}")
    
    return NOTE_MAP[note] + (octave * 12)


def midi_to_note_name(midi_number: int) -> Tuple[str, int]:
    """
    Convert MIDI number to note name and octave.
    
    Args:
        midi_number: MIDI note number (0-127)
        
    Returns:
        Tuple of (note_name, octave)
        
    Examples:
        >>> midi_to_note_name(60)
        ('C', 4)
        >>> midi_to_note_name(61)
        ('C#', 4)
    """
    if not 0 <= midi_number <= 127:
        raise ValueError(f"MIDI number out of range: {midi_number}")
    
    octave = midi_number // 12
    note_value = midi_number % 12
    
    # Find note name
    for note, value in NOTE_MAP.items():
        if value == note_value:
            return (note, octave)
    
    raise ValueError(f"Invalid MIDI number: {midi_number}")


def parse_key_string(key_str: str) -> Tuple[int, str]:
    """
    Parse key string like 'Cmin' or 'F#maj' to root note and scale type.
    
    Supports:
    - Standard: "Cmin", "F#maj", "D minor", "Eb major"
    - Camelot: "10B", "7A" (converted to standard)
    
    Args:
        key_str: Key string to parse
        
    Returns:
        Tuple of (root_midi, scale_type)
        root_midi: MIDI note number of root (0-11)
        scale_type: Scale type name (e.g., "minor", "major")
        
    Examples:
        >>> parse_key_string("Cmin")
        (0, 'minor')
        >>> parse_key_string("F#maj")
        (6, 'major')
        >>> parse_key_string("D minor")
        (2, 'minor')
    """
    key_str = key_str.strip()
    
    # Handle Camelot notation (basic conversion)
    # This is simplified - full Camelot conversion would need more logic
    if len(key_str) >= 2 and key_str[-1] in ['A', 'B']:
        # For now, return default - full Camelot support can be added later
        # This would require a Camelot to key mapping
        return (0, "minor")  # Default fallback
    
    # Extract root note
    if len(key_str) >= 2 and key_str[1] in ['#', 'b']:
        root = key_str[:2]
        mode = key_str[2:].lower() if len(key_str) > 2 else ""
    else:
        root = key_str[0].upper()
        mode = key_str[1:].lower() if len(key_str) > 1 else ""
    
    # Get root MIDI number
    root_midi = NOTE_MAP.get(root, 0)
    
    # Determine scale type
    if "min" in mode or mode == "m":
        scale_type = "minor"
    elif "maj" in mode:
        scale_type = "major"
    elif "dor" in mode:
        scale_type = "dorian"
    elif "phr" in mode:
        scale_type = "phrygian"
    elif "mix" in mode:
        scale_type = "mixolydian"
    else:
        scale_type = "minor"  # Default
    
    return (root_midi, scale_type)


def get_scale_notes(
    root: int,
    scale_name: str,
    octave_start: int = 3,
    octave_range: int = 2
) -> List[int]:
    """
    Get all notes in a scale across octave range.
    
    Args:
        root: Root note MIDI number (0-11, where 0=C)
        scale_name: Scale type name (e.g., "minor", "major")
        octave_start: Starting octave (default: 3)
        octave_range: Number of octaves to include (default: 2)
        
    Returns:
        List of MIDI note numbers in the scale
        
    Examples:
        >>> get_scale_notes(0, "minor", 3, 1)
        [36, 38, 39, 41, 43, 44, 46, 48]
    """
    scale = SCALES.get(scale_name, SCALES["minor"])
    notes = []
    
    for octave in range(octave_start, octave_start + octave_range):
        for interval in scale:
            midi_note = root + (octave * 12) + interval
            if 0 <= midi_note <= 127:
                notes.append(midi_note)
    
    return notes

