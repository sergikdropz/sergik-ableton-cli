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

# Dev helpers (optional - may not be available)
try:
    from .dev_helpers import (
        get_dev_assistant,
        ask_agent,
        auto_help,
        code_review,
        get_best_practices,
        develop_sync,
        is_available as dev_helpers_available,
    )
    _DEV_HELPERS_AVAILABLE = True
except ImportError:
    _DEV_HELPERS_AVAILABLE = False

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

# Add dev helpers to __all__ if available
if _DEV_HELPERS_AVAILABLE:
    __all__.extend([
        "get_dev_assistant",
        "ask_agent",
        "auto_help",
        "code_review",
        "get_best_practices",
        "develop_sync",
        "dev_helpers_available",
    ])

