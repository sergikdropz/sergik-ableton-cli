"""
Audio File Utilities

Audio file validation and metadata extraction.
"""

from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Supported audio file extensions
AUDIO_EXTENSIONS = {".wav", ".mp3", ".aif", ".aiff", ".m4a", ".flac", ".ogg", ".wma"}


def is_audio_file(filepath: str) -> bool:
    """
    Check if file is an audio file based on extension.
    
    Args:
        filepath: Path to file
        
    Returns:
        True if file has audio extension
        
    Examples:
        >>> is_audio_file("track.wav")
        True
        >>> is_audio_file("track.txt")
        False
    """
    path = Path(filepath)
    return path.suffix.lower() in AUDIO_EXTENSIONS


def get_audio_duration(filepath: str) -> Optional[float]:
    """
    Get audio file duration in seconds.
    
    Uses librosa if available, otherwise returns None.
    
    Args:
        filepath: Path to audio file
        
    Returns:
        Duration in seconds, or None if unable to determine
        
    Examples:
        >>> duration = get_audio_duration("track.wav")
        >>> duration  # 180.5
    """
    try:
        import librosa
        y, sr = librosa.load(filepath, sr=None, duration=None)
        duration = len(y) / sr
        return float(duration)
    except ImportError:
        logger.warning("librosa not available, cannot get audio duration")
        return None
    except Exception as e:
        logger.error(f"Error getting audio duration: {e}")
        return None


def validate_audio_file(filepath: str) -> tuple[bool, Optional[str]]:
    """
    Validate that file exists and is an audio file.
    
    Args:
        filepath: Path to file to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        is_valid: True if file is valid audio file
        error_message: Error message if invalid, None if valid
        
    Examples:
        >>> validate_audio_file("track.wav")
        (True, None)
        >>> validate_audio_file("nonexistent.wav")
        (False, 'File does not exist')
    """
    path = Path(filepath)
    
    if not path.exists():
        return (False, "File does not exist")
    
    if not path.is_file():
        return (False, "Path is not a file")
    
    if not is_audio_file(filepath):
        return (False, f"File is not a supported audio format. Supported: {AUDIO_EXTENSIONS}")
    
    return (True, None)

