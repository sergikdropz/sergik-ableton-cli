"""
SERGIK ML Schemas - Pydantic models for API and database entities.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List, Literal
import datetime as _dt


# ============================================================================
# Core Command Bus
# ============================================================================

class ActionIn(BaseModel):
    """Incoming action request."""
    cmd: str = Field(..., description="Command identifier (e.g., 'pack.create')")
    args: Dict[str, Any] = Field(default_factory=dict, description="Command arguments")
    meta: Dict[str, Any] = Field(default_factory=dict, description="Metadata (user, session, etc.)")


class ActionOut(BaseModel):
    """Action response."""
    status: Literal["ok", "error"]
    cmd: Optional[str] = None
    result: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None


# ============================================================================
# Database Entities
# ============================================================================

class TrackRow(BaseModel):
    """Music intelligence database row."""
    track_id: str
    bpm: Optional[float] = Field(None, ge=20, le=300)
    key: Optional[str] = None
    energy: Optional[float] = Field(None, ge=0, le=1)
    brightness: Optional[float] = Field(None, ge=0)
    lufs: Optional[float] = Field(None, ge=-60, le=0)
    harmonic_ratio: Optional[float] = Field(None, ge=0, le=1)
    percussive_ratio: Optional[float] = Field(None, ge=0, le=1)
    stereo_width: Optional[float] = Field(None, ge=0, le=1)

    source_pack: Optional[str] = None
    rating: Optional[float] = Field(None, ge=1, le=5)
    style_source: Optional[str] = None  # pack / sergik_dna / musicbrains / hybrid / ai_gen
    prompt_text: Optional[str] = None
    tags: Optional[List[str]] = None
    structure_json: Optional[Dict[str, Any]] = None
    updated_at: Optional[_dt.datetime] = None


class PackManifest(BaseModel):
    """Sample pack manifest."""
    pack_id: str
    pack_name: str
    export_dir: str
    zip_path: Optional[str] = None
    cloud_url: Optional[str] = None
    manifest_json: Dict[str, Any]
    created_at: _dt.datetime


class EmotionEvent(BaseModel):
    """Emotion/preference signal for ML training."""
    emotion_id: str
    track_id: str
    valence: float = Field(..., ge=-1, le=1)
    arousal: float = Field(..., ge=0, le=1)
    dominance: float = Field(..., ge=0, le=1)
    source: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: _dt.datetime


# ============================================================================
# Voice Interface
# ============================================================================

class VoiceIntent(BaseModel):
    """Parsed voice intent."""
    text: str
    cmd: Optional[str] = None
    args: Dict[str, Any] = Field(default_factory=dict)
    tts: str = "Done."
    confidence: float = Field(default=1.0, ge=0, le=1)


class VoiceOut(BaseModel):
    """Voice pipeline response."""
    status: Literal["ok", "error"]
    text: Optional[str] = None
    intent: Optional[VoiceIntent] = None
    action: Optional[ActionOut] = None
    tts_path: Optional[str] = None
    error: Optional[str] = None


# ============================================================================
# Generation Requests
# ============================================================================

class GenerateRequest(BaseModel):
    """Request for AI-generated audio."""
    prompt: str
    style: Optional[str] = "tech-house"
    bpm: float = Field(default=125, ge=60, le=200)
    key: str = "Cmin"
    bars: int = Field(default=8, ge=1, le=64)
    temperature: float = Field(default=0.8, ge=0, le=2)


class SimilarRequest(BaseModel):
    """Request for similar track search."""
    track_id: str
    k: int = Field(default=10, ge=1, le=100)
    style_filter: Optional[str] = None
