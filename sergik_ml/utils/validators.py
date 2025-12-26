"""
Input Validation Utilities

Validation functions for user inputs and parameters.
"""

from typing import Optional
from .errors import ValidationError


def validate_bpm(bpm: float, min_bpm: float = 20.0, max_bpm: float = 300.0) -> float:
    """
    Validate BPM value.
    
    Args:
        bpm: BPM value to validate
        min_bpm: Minimum allowed BPM (default: 20)
        max_bpm: Maximum allowed BPM (default: 300)
        
    Returns:
        Validated BPM value
        
    Raises:
        ValidationError: If BPM is out of range
        
    Examples:
        >>> validate_bpm(125.0)
        125.0
        >>> validate_bpm(500.0)
        ValidationError: BPM must be between 20.0 and 300.0
    """
    if not (min_bpm <= bpm <= max_bpm):
        raise ValidationError(
            f"BPM must be between {min_bpm} and {max_bpm}, got {bpm}",
            details={"bpm": bpm, "min": min_bpm, "max": max_bpm}
        )
    return float(bpm)


def validate_key(key: str) -> str:
    """
    Validate musical key string.
    
    Supports standard notation (C, Cmin, F#maj) and Camelot (10B, 7A).
    
    Args:
        key: Key string to validate
        
    Returns:
        Validated key string
        
    Raises:
        ValidationError: If key format is invalid
        
    Examples:
        >>> validate_key("Cmin")
        'Cmin'
        >>> validate_key("10B")
        '10B'
    """
    if not key or not isinstance(key, str):
        raise ValidationError("Key must be a non-empty string")
    
    key = key.strip()
    
    # Check Camelot notation (1-12, A or B)
    if len(key) >= 2 and key[-1] in ['A', 'B']:
        try:
            number = int(key[:-1])
            if 1 <= number <= 12:
                return key
        except ValueError:
            pass
    
    # Check standard notation (letter + optional #/b + optional min/maj)
    if len(key) >= 1 and key[0].upper() in ['A', 'B', 'C', 'D', 'E', 'F', 'G']:
        return key
    
    raise ValidationError(
        f"Invalid key format: {key}. Expected format: 'Cmin', 'F#maj', '10B', etc.",
        details={"key": key}
    )


def validate_energy(energy: float, min_energy: float = 0.0, max_energy: float = 1.0) -> float:
    """
    Validate energy level (0.0-1.0).
    
    Args:
        energy: Energy value to validate
        min_energy: Minimum allowed energy (default: 0.0)
        max_energy: Maximum allowed energy (default: 1.0)
        
    Returns:
        Validated energy value
        
    Raises:
        ValidationError: If energy is out of range
        
    Examples:
        >>> validate_energy(0.5)
        0.5
        >>> validate_energy(1.5)
        ValidationError: Energy must be between 0.0 and 1.0
    """
    if not (min_energy <= energy <= max_energy):
        raise ValidationError(
            f"Energy must be between {min_energy} and {max_energy}, got {energy}",
            details={"energy": energy, "min": min_energy, "max": max_energy}
        )
    return float(energy)


def validate_tempo_range(tempo: float, min_tempo: float = 60.0, max_tempo: float = 200.0) -> float:
    """
    Validate tempo value for generation.
    
    Args:
        tempo: Tempo value to validate
        min_tempo: Minimum allowed tempo (default: 60)
        max_tempo: Maximum allowed tempo (default: 200)
        
    Returns:
        Validated tempo value
        
    Raises:
        ValidationError: If tempo is out of range
        
    Examples:
        >>> validate_tempo_range(125.0)
        125.0
    """
    if not (min_tempo <= tempo <= max_tempo):
        raise ValidationError(
            f"Tempo must be between {min_tempo} and {max_tempo}, got {tempo}",
            details={"tempo": tempo, "min": min_tempo, "max": max_tempo}
        )
    return float(tempo)

