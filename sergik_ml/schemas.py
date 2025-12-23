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


# ============================================================================
# SERGIK DNA - Proprietary Style Classification
# ============================================================================

class SergikDNAMatch(BaseModel):
    """SERGIK DNA style classification result."""
    sergik_score: float = Field(..., ge=0, le=1, description="How well track matches SERGIK DNA (0-1)")
    is_sergik_style: bool = Field(..., description="True if sergik_score >= 0.5")
    match_reasons: List[str] = Field(default_factory=list, description="Reasons for score")
    style_category: str = Field(default="tech-house", description="Classified style category")


class TrackAnalysis(BaseModel):
    """Comprehensive track analysis with SERGIK DNA matching."""
    track_id: str
    bpm: Optional[float] = None
    key: Optional[str] = None
    energy: Optional[float] = None
    brightness: Optional[float] = None
    lufs: Optional[float] = None
    harmonic_ratio: Optional[float] = None
    percussive_ratio: Optional[float] = None
    stereo_width: Optional[float] = None
    duration: Optional[float] = None
    sergik_dna: Optional[SergikDNAMatch] = None


class PackCreateRequest(BaseModel):
    """Request to create a sample pack using SERGIK pipeline."""
    source: str = Field(default="All Tracks", description="Source selection")
    length_bars: int = Field(default=4, ge=1, le=64, description="Loop length in bars")
    tempo: float = Field(default=125, ge=60, le=200, description="Target BPM")
    auto_zip: bool = Field(default=True, description="Create ZIP archive")
    cloud_push: bool = Field(default=False, description="Upload to cloud storage")
    fade_ms: int = Field(default=10, ge=0, le=100, description="Fade in/out duration")
    normalize_lufs: Optional[float] = Field(default=None, ge=-24, le=-6, description="Target LUFS")
    stems_dir: Optional[str] = Field(default=None, description="Custom stems directory")
    custom_path: Optional[str] = Field(default=None, description="Custom export path")


class RateTrackRequest(BaseModel):
    """Request to rate a track for preference learning."""
    track_id: str
    rating: float = Field(..., ge=1, le=5, description="User rating 1-5 stars")
    context: Optional[str] = Field(default=None, description="Rating context (e.g., 'dj_set', 'production')")


# ============================================================================
# SERGIK ML Training Data
# ============================================================================

class PreferenceDataPoint(BaseModel):
    """Single data point for preference model training."""
    track_id: str
    features: List[float] = Field(..., description="Feature vector")
    rating: float = Field(..., ge=1, le=5)
    timestamp: _dt.datetime


class TrainingStats(BaseModel):
    """Training statistics for preference model."""
    total_tracks: int
    rated_tracks: int
    avg_rating: float
    rating_distribution: Dict[str, int] = Field(default_factory=dict)
    mse: Optional[float] = None
    mae: Optional[float] = None
    feature_importance: Dict[str, float] = Field(default_factory=dict)


# ============================================================================
# Advanced MIDI Generation Requests
# ============================================================================

class ChordProgressionRequest(BaseModel):
    """Request to generate chord progression."""
    key: str = Field(default="10B", description="Camelot key (e.g., 10B, 7A)")
    progression_type: str = Field(default="i-VI-III-VII", description="Progression pattern")
    bars: int = Field(default=8, ge=1, le=64)
    voicing: Literal["stabs", "pads"] = Field(default="stabs")
    seventh_chords: bool = Field(default=True)
    tempo: float = Field(default=125, ge=60, le=200)


class WalkingBassRequest(BaseModel):
    """Request to generate walking bass line."""
    key: str = Field(default="10B")
    chord_progression_type: str = Field(default="i-VI-III-VII")
    style: Literal["jazz", "house", "techno"] = Field(default="house")
    bars: int = Field(default=8, ge=1, le=64)
    tempo: float = Field(default=125, ge=60, le=200)


class ArpeggioRequest(BaseModel):
    """Request to generate arpeggios."""
    key: str = Field(default="10B")
    chord_progression_type: str = Field(default="i-VI-III-VII")
    pattern: Literal["up", "down", "updown", "random", "pingpong"] = Field(default="up")
    speed: float = Field(default=0.25, description="Note speed in beats")
    octaves: int = Field(default=2, ge=1, le=4)
    bars: int = Field(default=4, ge=1, le=32)
    tempo: float = Field(default=125, ge=60, le=200)


class HumanizeRequest(BaseModel):
    """Request to humanize MIDI notes."""
    notes: List[Dict[str, Any]] = Field(..., description="MIDI notes to humanize")
    timing_variance_ms: float = Field(default=20, ge=0, le=100)
    velocity_variance: int = Field(default=10, ge=0, le=40)
    tempo: float = Field(default=125, ge=60, le=200)


class DrumVariationRequest(BaseModel):
    """Request to generate drum variations."""
    seed_pattern: List[Dict[str, Any]] = Field(..., description="Seed MIDI pattern")
    num_variations: int = Field(default=8, ge=1, le=16)


# ============================================================================
# GPT Actions Requests
# ============================================================================

class GPTGenerateRequest(BaseModel):
    """Natural language generation request."""
    prompt: str = Field(..., description="Natural language generation prompt")
    track_id: Optional[str] = None


class GPTAnalyzeRequest(BaseModel):
    """Natural language analysis request."""
    track_id: Optional[str] = None


class GPTTransformRequest(BaseModel):
    """Natural language transformation request."""
    prompt: str = Field(..., description="Natural language transformation prompt")
    track_id: Optional[str] = None


class GPTWorkflowRequest(BaseModel):
    """Multi-step workflow request."""
    description: str = Field(..., description="Multi-step workflow description")


class GPTSuggestion(BaseModel):
    """Single suggestion from analysis."""
    type: str
    description: str
    rationale: str
    action: Optional[Dict[str, Any]] = None


# ============================================================================
# Drum Generation Requests
# ============================================================================

class DrumPatternRequest(BaseModel):
    """Request to generate drum pattern."""
    genre: str = Field(default="house", description="Genre: house, tech_house, techno, hiphop, trap, dnb, reggaeton, ambient")
    bars: int = Field(default=4, ge=1, le=32)
    tempo: float = Field(default=125, ge=60, le=200)
    swing: float = Field(default=0, ge=0, le=100, description="Swing amount 0-100%")
    humanize: float = Field(default=0, ge=0, le=100, description="Humanization 0-100%")
    density: float = Field(default=1.0, ge=0.1, le=2.0, description="Pattern density multiplier")
    output_format: Literal["midi", "audio"] = Field(default="midi")


class DrumAudioRequest(BaseModel):
    """Request to generate drum audio from pattern."""
    genre: str = Field(default="house")
    bars: int = Field(default=4, ge=1, le=32)
    tempo: float = Field(default=125, ge=60, le=200)
    swing: float = Field(default=0, ge=0, le=100)
    humanize: float = Field(default=0, ge=0, le=100)
    sample_library: Optional[str] = Field(default=None, description="Sample library name to use")
    output_filename: Optional[str] = Field(default=None, description="Output filename (without path)")


class SampleLibraryScanRequest(BaseModel):
    """Request to scan a sample library."""
    path: str = Field(..., description="Directory path to scan")
    library_name: Optional[str] = Field(default=None, description="Name for this library")
    recursive: bool = Field(default=True, description="Scan subdirectories")


class SampleSearchRequest(BaseModel):
    """Request to search samples in library."""
    category: Optional[str] = Field(default=None, description="Category: kick, snare, hat, clap, etc.")
    tags: Optional[List[str]] = Field(default=None, description="Tags to match")
    library_name: Optional[str] = Field(default=None, description="Specific library to search")
    limit: int = Field(default=20, ge=1, le=100)


class DrumRackPresetRequest(BaseModel):
    """Request to create drum rack preset."""
    name: str = Field(..., description="Preset name")
    samples: Dict[str, str] = Field(..., description="Mapping of pad name to sample path")
    output_path: Optional[str] = Field(default=None)


# ============================================================================
# Ableton Live Integration - Track Management
# ============================================================================

class LiveTrackType(BaseModel):
    """Track type enumeration."""
    type: Literal["midi", "audio", "return", "master"] = Field(default="midi")


class CreateTrackRequest(BaseModel):
    """Request to create a new track in Ableton Live."""
    track_type: Literal["midi", "audio", "return"] = Field(default="midi", description="Type of track to create")
    name: Optional[str] = Field(default=None, description="Track name")
    color: Optional[int] = Field(default=None, ge=0, le=69, description="Track color index (0-69)")
    index: Optional[int] = Field(default=None, ge=-1, description="Insert position (-1 = end)")


class UpdateTrackRequest(BaseModel):
    """Request to update track properties."""
    track_index: int = Field(..., ge=0, description="Track index")
    name: Optional[str] = Field(default=None, description="New track name")
    color: Optional[int] = Field(default=None, ge=0, le=69, description="Track color index")
    arm: Optional[bool] = Field(default=None, description="Arm for recording")
    mute: Optional[bool] = Field(default=None, description="Mute state")
    solo: Optional[bool] = Field(default=None, description="Solo state")
    volume: Optional[float] = Field(default=None, ge=0, le=1, description="Volume (0-1)")
    pan: Optional[float] = Field(default=None, ge=-1, le=1, description="Pan (-1 to 1)")


class DeleteTrackRequest(BaseModel):
    """Request to delete a track."""
    track_index: int = Field(..., ge=0, description="Track index to delete")


class TrackInfo(BaseModel):
    """Track information response."""
    index: int
    name: str
    track_type: str
    color: int
    arm: bool
    mute: bool
    solo: bool
    volume: float
    pan: float
    has_midi_input: bool
    has_audio_input: bool
    device_count: int


class TrackListResponse(BaseModel):
    """Response containing list of tracks."""
    status: Literal["ok", "error"]
    tracks: List[TrackInfo] = Field(default_factory=list)
    count: int = 0
    error: Optional[str] = None


# ============================================================================
# Ableton Live Integration - Device Control
# ============================================================================

class LoadDeviceRequest(BaseModel):
    """Request to load a device onto a track."""
    track_index: int = Field(..., ge=0, description="Track index")
    device_name: str = Field(..., description="Device name (e.g., 'Wavetable', 'Reverb')")
    device_type: Literal["instrument", "audio_effect", "midi_effect"] = Field(
        default="instrument", description="Device type"
    )


class LoadVSTRequest(BaseModel):
    """Request to load a VST/AU plugin."""
    track_index: int = Field(..., ge=0, description="Track index")
    plugin_name: str = Field(..., description="Plugin name (e.g., 'Serum', 'Massive')")
    plugin_format: Literal["vst", "vst3", "au"] = Field(default="vst3", description="Plugin format")


class SetDeviceParamRequest(BaseModel):
    """Request to set a device parameter."""
    track_index: int = Field(..., ge=0, description="Track index")
    device_index: int = Field(..., ge=0, description="Device index on track")
    param_index: Optional[int] = Field(default=None, description="Parameter index")
    param_name: Optional[str] = Field(default=None, description="Parameter name (alternative to index)")
    value: float = Field(..., ge=0, le=1, description="Parameter value (0-1 normalized)")


class ToggleDeviceRequest(BaseModel):
    """Request to enable/disable a device."""
    track_index: int = Field(..., ge=0, description="Track index")
    device_index: int = Field(..., ge=0, description="Device index")
    enabled: Optional[bool] = Field(default=None, description="Enable state (None = toggle)")


class LoadPresetRequest(BaseModel):
    """Request to load a device preset."""
    track_index: int = Field(..., ge=0, description="Track index")
    device_index: int = Field(..., ge=0, description="Device index")
    preset_name: str = Field(..., description="Preset name or path")


class DeviceInfo(BaseModel):
    """Device information."""
    index: int
    name: str
    class_name: str
    enabled: bool
    param_count: int
    can_have_chains: bool
    is_instrument: bool


class DeviceParamInfo(BaseModel):
    """Device parameter information."""
    index: int
    name: str
    value: float
    min_value: float
    max_value: float
    default_value: float
    is_quantized: bool


class DeviceListResponse(BaseModel):
    """Response containing list of devices on a track."""
    status: Literal["ok", "error"]
    track_index: int
    devices: List[DeviceInfo] = Field(default_factory=list)
    count: int = 0
    error: Optional[str] = None


class DeviceParamsResponse(BaseModel):
    """Response containing device parameters."""
    status: Literal["ok", "error"]
    track_index: int
    device_index: int
    device_name: str
    params: List[DeviceParamInfo] = Field(default_factory=list)
    error: Optional[str] = None


# ============================================================================
# Ableton Live Integration - Clip Management
# ============================================================================

class CreateClipRequest(BaseModel):
    """Request to create a new clip."""
    track_index: int = Field(..., ge=0, description="Track index")
    slot_index: int = Field(..., ge=0, description="Clip slot index")
    length_beats: float = Field(default=16, ge=1, description="Clip length in beats")
    name: Optional[str] = Field(default=None, description="Clip name")


class FireClipRequest(BaseModel):
    """Request to fire/launch a clip."""
    track_index: int = Field(..., ge=0, description="Track index")
    slot_index: int = Field(..., ge=0, description="Clip slot index")


class StopClipRequest(BaseModel):
    """Request to stop a clip."""
    track_index: int = Field(..., ge=0, description="Track index")
    slot_index: Optional[int] = Field(default=None, description="Slot index (None = stop all on track)")


class DuplicateClipRequest(BaseModel):
    """Request to duplicate a clip."""
    track_index: int = Field(..., ge=0, description="Source track index")
    slot_index: int = Field(..., ge=0, description="Source slot index")
    target_track: Optional[int] = Field(default=None, description="Target track (None = same track)")
    target_slot: Optional[int] = Field(default=None, description="Target slot (None = next empty)")


class DeleteClipRequest(BaseModel):
    """Request to delete a clip."""
    track_index: int = Field(..., ge=0, description="Track index")
    slot_index: int = Field(..., ge=0, description="Slot index")


class SetClipNotesRequest(BaseModel):
    """Request to set MIDI notes in a clip."""
    track_index: int = Field(..., ge=0, description="Track index")
    slot_index: int = Field(..., ge=0, description="Slot index")
    notes: List[Dict[str, Any]] = Field(..., description="List of notes with pitch, start_time, duration, velocity")
    replace: bool = Field(default=True, description="Replace existing notes")


class GetClipNotesRequest(BaseModel):
    """Request to get MIDI notes from a clip."""
    track_index: int = Field(..., ge=0, description="Track index")
    slot_index: int = Field(..., ge=0, description="Slot index")


class UpdateClipRequest(BaseModel):
    """Request to update clip properties."""
    track_index: int = Field(..., ge=0, description="Track index")
    slot_index: int = Field(..., ge=0, description="Slot index")
    name: Optional[str] = Field(default=None, description="Clip name")
    color: Optional[int] = Field(default=None, ge=0, le=69, description="Clip color index")
    loop_start: Optional[float] = Field(default=None, description="Loop start in beats")
    loop_end: Optional[float] = Field(default=None, description="Loop end in beats")
    start_marker: Optional[float] = Field(default=None, description="Start marker position")
    end_marker: Optional[float] = Field(default=None, description="End marker position")
    warp: Optional[bool] = Field(default=None, description="Warp mode (audio clips)")
    gain: Optional[float] = Field(default=None, ge=0, le=2, description="Clip gain")


class ClipInfo(BaseModel):
    """Clip information."""
    track_index: int
    slot_index: int
    name: str
    color: int
    length: float
    loop_start: float
    loop_end: float
    is_playing: bool
    is_recording: bool
    is_midi_clip: bool
    is_audio_clip: bool
    has_envelopes: bool


class ClipNotesResponse(BaseModel):
    """Response containing clip notes."""
    status: Literal["ok", "error"]
    track_index: int
    slot_index: int
    notes: List[Dict[str, Any]] = Field(default_factory=list)
    count: int = 0
    error: Optional[str] = None


# ============================================================================
# Ableton Live Integration - Browser/Library Access
# ============================================================================

class BrowserSearchRequest(BaseModel):
    """Request to search the Ableton browser/library."""
    query: str = Field(..., description="Search query")
    category: Optional[Literal["sounds", "drums", "instruments", "audio_effects", 
                               "midi_effects", "max_for_live", "plugins", "clips", 
                               "samples", "packs", "user_library"]] = Field(
        default=None, description="Category to search in"
    )
    limit: int = Field(default=20, ge=1, le=100, description="Maximum results")


class LoadBrowserItemRequest(BaseModel):
    """Request to load an item from the browser."""
    item_path: str = Field(..., description="Browser item path or URI")
    track_index: int = Field(..., ge=0, description="Target track index")
    slot_index: Optional[int] = Field(default=None, description="Target clip slot (for samples)")


class HotSwapRequest(BaseModel):
    """Request to hot-swap a sample in Simpler/Sampler."""
    track_index: int = Field(..., ge=0, description="Track index")
    device_index: int = Field(..., ge=0, description="Device index (Simpler/Sampler)")
    sample_path: str = Field(..., description="Path to new sample")


class BrowserItem(BaseModel):
    """Browser item information."""
    name: str
    path: str
    item_type: str
    is_folder: bool
    is_loadable: bool


class BrowserSearchResponse(BaseModel):
    """Response containing browser search results."""
    status: Literal["ok", "error"]
    query: str
    items: List[BrowserItem] = Field(default_factory=list)
    count: int = 0
    error: Optional[str] = None


# ============================================================================
# Ableton Live Integration - Session/Scene Control
# ============================================================================

class FireSceneRequest(BaseModel):
    """Request to fire/launch a scene."""
    scene_index: int = Field(..., ge=0, description="Scene index")


class CreateSceneRequest(BaseModel):
    """Request to create a new scene."""
    index: Optional[int] = Field(default=None, description="Insert position (None = end)")
    name: Optional[str] = Field(default=None, description="Scene name")


class DeleteSceneRequest(BaseModel):
    """Request to delete a scene."""
    scene_index: int = Field(..., ge=0, description="Scene index to delete")


class DuplicateSceneRequest(BaseModel):
    """Request to duplicate a scene."""
    scene_index: int = Field(..., ge=0, description="Scene index to duplicate")


class SetTempoRequest(BaseModel):
    """Request to set session tempo."""
    tempo: float = Field(..., ge=20, le=999, description="Tempo in BPM")


class SetQuantizationRequest(BaseModel):
    """Request to set global quantization."""
    quantization: Literal["none", "8_bars", "4_bars", "2_bars", "1_bar", 
                          "1/2", "1/4", "1/8", "1/16", "1/32"] = Field(
        default="1_bar", description="Quantization value"
    )


class UndoRedoRequest(BaseModel):
    """Request to undo or redo."""
    action: Literal["undo", "redo"] = Field(..., description="Action to perform")


class TransportRequest(BaseModel):
    """Request to control transport."""
    action: Literal["play", "stop", "record", "continue", "stop_all_clips"] = Field(
        ..., description="Transport action"
    )


class SetLocatorRequest(BaseModel):
    """Request to set or jump to a locator."""
    action: Literal["set", "jump"] = Field(..., description="Locator action")
    position: Optional[float] = Field(default=None, description="Position in beats (for set)")
    name: Optional[str] = Field(default=None, description="Locator name")
    locator_index: Optional[int] = Field(default=None, description="Locator index (for jump)")


class MixerSendRequest(BaseModel):
    """Request to set mixer send level."""
    track_index: int = Field(..., ge=0, description="Track index")
    send_index: int = Field(..., ge=0, description="Send index (0=A, 1=B, etc.)")
    level: float = Field(..., ge=0, le=1, description="Send level (0-1)")


class SceneInfo(BaseModel):
    """Scene information."""
    index: int
    name: str
    color: int
    tempo: Optional[float]
    time_signature_numerator: int
    time_signature_denominator: int


class SessionStateResponse(BaseModel):
    """Response containing full session state."""
    status: Literal["ok", "error"]
    tempo: float
    is_playing: bool
    is_recording: bool
    current_song_time: float
    loop_start: float
    loop_length: float
    track_count: int
    scene_count: int
    return_track_count: int
    quantization: str
    tracks: List[TrackInfo] = Field(default_factory=list)
    scenes: List[SceneInfo] = Field(default_factory=list)
    error: Optional[str] = None


class LiveCommandResponse(BaseModel):
    """Generic response for Live commands."""
    status: Literal["ok", "error"]
    command: str
    result: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None