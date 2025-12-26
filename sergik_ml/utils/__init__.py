"""
SERGIK ML Utilities

Shared utility functions used across the codebase.
"""

from .text_extraction import (
    extract_style,
    extract_key,
    extract_bars,
    extract_percentage,
    extract_bpm,
    extract_genre,
)
from .collaborator import (
    normalize_collab,
    extract_collaborators,
    COLLAB_ALIASES,
)
from .midi import (
    note_name_to_midi,
    midi_to_note_name,
    parse_key_string,
    get_scale_notes,
)
from .audio import (
    is_audio_file,
    get_audio_duration,
    validate_audio_file,
)
from .errors import (
    SergikError,
    ValidationError,
    GenerationError,
    AbletonConnectionError,
    AnalysisError,
)
from .validators import (
    validate_bpm,
    validate_key,
    validate_energy,
    validate_tempo_range,
)

__all__ = [
    # Text extraction
    "extract_style",
    "extract_key",
    "extract_bars",
    "extract_percentage",
    "extract_bpm",
    "extract_genre",
    # Collaborator
    "normalize_collab",
    "extract_collaborators",
    "COLLAB_ALIASES",
    # MIDI
    "note_name_to_midi",
    "midi_to_note_name",
    "parse_key_string",
    "get_scale_notes",
    # Audio
    "is_audio_file",
    "get_audio_duration",
    "validate_audio_file",
    # Errors
    "SergikError",
    "ValidationError",
    "GenerationError",
    "AbletonConnectionError",
    "AnalysisError",
    # Validators
    "validate_bpm",
    "validate_key",
    "validate_energy",
    "validate_tempo_range",
]

