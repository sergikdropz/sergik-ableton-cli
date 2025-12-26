"""
SERGIK ML Type Definitions

Shared type definitions for type hints.
"""

from typing import Dict, List, Any, Optional, Union, Tuple
from pathlib import Path

# MIDI types
MIDINote = Tuple[int, int, float, float]  # (pitch, velocity, start_time, duration)
MIDIPattern = List[MIDINote]

# Audio types
AudioPath = Union[str, Path]
AudioMetadata = Dict[str, Any]

# Track types
TrackID = str
TrackData = Dict[str, Any]
TrackList = List[TrackData]

# Generation types
GenerationRequest = Dict[str, Any]
GenerationResult = Dict[str, Any]

# Service types
ServiceResult = Dict[str, Any]

# Analysis types
AnalysisResult = Dict[str, Any]

# Vector types
Vector = List[float]
VectorSimilarityResult = Dict[str, Any]

# OSC types
OSCAddress = str
OSCPayload = Dict[str, Any]

# Config types
ConfigValue = Union[str, int, float, bool, None]

__all__ = [
    "MIDINote",
    "MIDIPattern",
    "AudioPath",
    "AudioMetadata",
    "TrackID",
    "TrackData",
    "TrackList",
    "GenerationRequest",
    "GenerationResult",
    "ServiceResult",
    "AnalysisResult",
    "Vector",
    "VectorSimilarityResult",
    "OSCAddress",
    "OSCPayload",
    "ConfigValue",
]

