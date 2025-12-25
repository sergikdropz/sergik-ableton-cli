"""
Enhanced Energy Analysis with Emotional, Psychological, Sonic, and Intent Intelligence

Comprehensive energy analysis that goes beyond simple RMS to include:
- Emotional mapping (valence, arousal, emotion categories)
- Psychological effects (motivation, relaxation, focus, etc.)
- Sonic characteristics (timbre, texture, spatial, dynamics)
- Intent/purpose detection (dance floor, background, workout, etc.)
"""

import numpy as np
from typing import Dict, Any, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# Emotional Intelligence Mapping
# ============================================================================

# Emotion categories based on energy + other features
EMOTION_MAP = {
    # Low energy (1-3)
    "calm": {"energy_range": [1, 3], "valence": 0.6, "arousal": 0.2, "emotions": ["peaceful", "serene", "meditative"]},
    "melancholic": {"energy_range": [1, 3], "valence": 0.3, "arousal": 0.2, "emotions": ["sad", "nostalgic", "introspective"]},
    "dreamy": {"energy_range": [1, 3], "valence": 0.5, "arousal": 0.15, "emotions": ["ethereal", "floating", "ambient"]},
    
    # Mid-low energy (4-5)
    "chill": {"energy_range": [4, 5], "valence": 0.7, "arousal": 0.4, "emotions": ["relaxed", "laid-back", "comfortable"]},
    "contemplative": {"energy_range": [4, 5], "valence": 0.5, "arousal": 0.3, "emotions": ["thoughtful", "reflective", "mellow"]},
    "warm": {"energy_range": [4, 5], "valence": 0.8, "arousal": 0.4, "emotions": ["cozy", "intimate", "soulful"]},
    
    # Mid energy (6-7) - SERGIK sweet spot
    "groovy": {"energy_range": [6, 7], "valence": 0.8, "arousal": 0.6, "emotions": ["funky", "rhythmic", "danceable"]},
    "uplifting": {"energy_range": [6, 7], "valence": 0.9, "arousal": 0.6, "emotions": ["positive", "energetic", "inspiring"]},
    "confident": {"energy_range": [6, 7], "valence": 0.7, "arousal": 0.65, "emotions": ["strong", "assertive", "powerful"]},
    "smooth": {"energy_range": [6, 7], "valence": 0.75, "arousal": 0.55, "emotions": ["polished", "refined", "sophisticated"]},
    
    # High energy (8-10)
    "intense": {"energy_range": [8, 10], "valence": 0.6, "arousal": 0.9, "emotions": ["driving", "aggressive", "powerful"]},
    "euphoric": {"energy_range": [8, 10], "valence": 0.95, "arousal": 0.95, "emotions": ["ecstatic", "transcendent", "peak"]},
    "energetic": {"energy_range": [8, 10], "valence": 0.85, "arousal": 0.85, "emotions": ["pumping", "vibrant", "dynamic"]},
    "aggressive": {"energy_range": [8, 10], "valence": 0.4, "arousal": 0.9, "emotions": ["hard", "edgy", "intense"]},
}

# Valence-Arousal mapping (Russell's circumplex model)
VALENCE_AROUSAL_MAP = {
    (0.0, 0.0): "bored",
    (0.0, 0.5): "sad",
    (0.0, 1.0): "angry",
    (0.5, 0.0): "calm",
    (0.5, 0.5): "neutral",
    (0.5, 1.0): "tense",
    (1.0, 0.0): "relaxed",
    (1.0, 0.5): "happy",
    (1.0, 1.0): "excited",
}

# ============================================================================
# Psychological Intelligence Mapping
# ============================================================================

PSYCHOLOGICAL_EFFECTS = {
    # Low energy effects
    "meditation": {"energy_range": [1, 3], "focus": 0.9, "relaxation": 0.95, "motivation": 0.1},
    "sleep": {"energy_range": [1, 3], "focus": 0.2, "relaxation": 0.98, "motivation": 0.05},
    "study": {"energy_range": [2, 4], "focus": 0.85, "relaxation": 0.6, "motivation": 0.4},
    
    # Mid-low energy effects
    "background": {"energy_range": [4, 5], "focus": 0.5, "relaxation": 0.7, "motivation": 0.3},
    "chill_work": {"energy_range": [4, 5], "focus": 0.6, "relaxation": 0.65, "motivation": 0.4},
    "social": {"energy_range": [4, 6], "focus": 0.4, "relaxation": 0.7, "motivation": 0.5},
    
    # Mid energy effects (SERGIK sweet spot)
    "productivity": {"energy_range": [6, 7], "focus": 0.7, "relaxation": 0.5, "motivation": 0.75},
    "creative_work": {"energy_range": [6, 7], "focus": 0.65, "relaxation": 0.55, "motivation": 0.8},
    "driving": {"energy_range": [6, 7], "focus": 0.6, "relaxation": 0.4, "motivation": 0.7},
    "social_dance": {"energy_range": [6, 7], "focus": 0.5, "relaxation": 0.6, "motivation": 0.75},
    
    # High energy effects
    "workout": {"energy_range": [8, 10], "focus": 0.5, "relaxation": 0.1, "motivation": 0.95},
    "party": {"energy_range": [8, 10], "focus": 0.3, "relaxation": 0.2, "motivation": 0.9},
    "peak_time": {"energy_range": [8, 10], "focus": 0.4, "relaxation": 0.1, "motivation": 0.95},
    "intense_focus": {"energy_range": [8, 9], "focus": 0.85, "relaxation": 0.2, "motivation": 0.8},
}

# ============================================================================
# Sonic Intelligence Characteristics
# ============================================================================

SONIC_CHARACTERISTICS = {
    "timbre": {
        "warm": {"harmonic_ratio": [0.6, 1.0], "brightness": [0, 3000]},
        "bright": {"harmonic_ratio": [0.4, 0.8], "brightness": [4000, 10000]},
        "dark": {"harmonic_ratio": [0.3, 0.6], "brightness": [0, 2000]},
        "crisp": {"harmonic_ratio": [0.5, 0.9], "brightness": [5000, 12000]},
        "mellow": {"harmonic_ratio": [0.6, 1.0], "brightness": [0, 2500]},
    },
    "texture": {
        "dense": {"harmonic_ratio": [0.5, 1.0], "percussive_ratio": [0.3, 0.7]},
        "sparse": {"harmonic_ratio": [0.2, 0.5], "percussive_ratio": [0.1, 0.4]},
        "layered": {"harmonic_ratio": [0.6, 1.0], "percussive_ratio": [0.4, 0.8]},
        "minimal": {"harmonic_ratio": [0.2, 0.4], "percussive_ratio": [0.2, 0.5]},
        "rich": {"harmonic_ratio": [0.7, 1.0], "percussive_ratio": [0.3, 0.6]},
    },
    "spatial": {
        "intimate": {"stereo_width": [0, 0.3], "reverb": "low"},
        "wide": {"stereo_width": [0.7, 1.0], "reverb": "high"},
        "focused": {"stereo_width": [0.3, 0.6], "reverb": "medium"},
        "expansive": {"stereo_width": [0.6, 1.0], "reverb": "high"},
    },
    "dynamics": {
        "steady": {"energy_std": [0, 0.05], "variation": "low"},
        "dynamic": {"energy_std": [0.1, 0.3], "variation": "high"},
        "pulsing": {"energy_std": [0.05, 0.15], "variation": "medium"},
        "explosive": {"energy_std": [0.2, 0.5], "variation": "very_high"},
    },
}

# ============================================================================
# Intent Intelligence Mapping
# ============================================================================

INTENT_CATEGORIES = {
    "dance_floor": {
        "energy_range": [7, 10],
        "bpm_range": [120, 140],
        "characteristics": ["driving", "rhythmic", "pulsing"],
        "use_cases": ["club", "festival", "party", "peak time"],
    },
    "background": {
        "energy_range": [3, 5],
        "bpm_range": [60, 100],
        "characteristics": ["ambient", "subtle", "non-intrusive"],
        "use_cases": ["cafe", "restaurant", "lounge", "retail"],
    },
    "workout": {
        "energy_range": [8, 10],
        "bpm_range": [130, 180],
        "characteristics": ["intense", "motivational", "driving"],
        "use_cases": ["gym", "running", "cycling", "HIIT"],
    },
    "chill": {
        "energy_range": [4, 6],
        "bpm_range": [70, 100],
        "characteristics": ["relaxed", "smooth", "comfortable"],
        "use_cases": ["home", "study", "reading", "social"],
    },
    "creative": {
        "energy_range": [5, 7],
        "bpm_range": [90, 130],
        "characteristics": ["inspiring", "textured", "layered"],
        "use_cases": ["studio", "production", "writing", "design"],
    },
    "driving": {
        "energy_range": [6, 8],
        "bpm_range": [110, 130],
        "characteristics": ["steady", "engaging", "rhythmic"],
        "use_cases": ["road trip", "commute", "long drive"],
    },
    "meditation": {
        "energy_range": [1, 3],
        "bpm_range": [40, 70],
        "characteristics": ["calm", "peaceful", "minimal"],
        "use_cases": ["yoga", "meditation", "sleep", "therapy"],
    },
    "peak_time": {
        "energy_range": [9, 10],
        "bpm_range": [125, 150],
        "characteristics": ["intense", "euphoric", "explosive"],
        "use_cases": ["main stage", "headliner", "climax"],
    },
}


def analyze_energy_intelligence(
    energy: int,
    bpm: float,
    brightness: float,
    harmonic_ratio: float,
    percussive_ratio: float,
    energy_std: float,
    stereo_width: float = 0.5,
    spectral_rolloff: Optional[float] = None,
    rhythm_complexity: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Comprehensive energy analysis with emotional, psychological, sonic, and intent intelligence.
    
    Args:
        energy: Energy level (1-10)
        bpm: Tempo in BPM
        brightness: Spectral centroid (Hz)
        harmonic_ratio: Harmonic energy ratio (0-1)
        percussive_ratio: Percussive energy ratio (0-1)
        energy_std: Energy standard deviation (variation)
        stereo_width: Stereo width (0-1)
        spectral_rolloff: Spectral rolloff frequency (Hz)
        rhythm_complexity: Rhythm complexity score
        
    Returns:
        Comprehensive energy intelligence analysis
    """
    
    # ========================================================================
    # Emotional Intelligence
    # ========================================================================
    
    # Find matching emotion category
    emotion_category = None
    valence = 0.5
    arousal = 0.5
    
    for emotion, params in EMOTION_MAP.items():
        if params["energy_range"][0] <= energy <= params["energy_range"][1]:
            # Refine based on brightness and harmonic content
            if brightness < 3000 and harmonic_ratio > 0.6:
                if emotion in ["warm", "smooth", "chill"]:
                    emotion_category = emotion
                    valence = params["valence"]
                    arousal = params["arousal"]
                    break
            elif brightness > 5000:
                if emotion in ["bright", "energetic", "euphoric"]:
                    emotion_category = emotion
                    valence = params["valence"]
                    arousal = params["arousal"]
                    break
            else:
                emotion_category = emotion
                valence = params["valence"]
                arousal = params["arousal"]
                break
    
    if not emotion_category:
        # Default based on energy
        if energy <= 3:
            emotion_category = "calm"
            valence, arousal = 0.6, 0.2
        elif energy <= 5:
            emotion_category = "chill"
            valence, arousal = 0.7, 0.4
        elif energy <= 7:
            emotion_category = "groovy"
            valence, arousal = 0.8, 0.6
        else:
            emotion_category = "energetic"
            valence, arousal = 0.85, 0.85
    
    # Get emotion words
    emotion_words = EMOTION_MAP.get(emotion_category, {}).get("emotions", [])
    
    # ========================================================================
    # Psychological Intelligence
    # ========================================================================
    
    # Find matching psychological effect
    psychological_effect = None
    focus_score = 0.5
    relaxation_score = 0.5
    motivation_score = 0.5
    
    for effect, params in PSYCHOLOGICAL_EFFECTS.items():
        if params["energy_range"][0] <= energy <= params["energy_range"][1]:
            psychological_effect = effect
            focus_score = params["focus"]
            relaxation_score = params["relaxation"]
            motivation_score = params["motivation"]
            break
    
    if not psychological_effect:
        # Default based on energy
        if energy <= 3:
            psychological_effect = "meditation"
            focus_score, relaxation_score, motivation_score = 0.9, 0.95, 0.1
        elif energy <= 5:
            psychological_effect = "background"
            focus_score, relaxation_score, motivation_score = 0.5, 0.7, 0.3
        elif energy <= 7:
            psychological_effect = "productivity"
            focus_score, relaxation_score, motivation_score = 0.7, 0.5, 0.75
        else:
            psychological_effect = "workout"
            focus_score, relaxation_score, motivation_score = 0.5, 0.1, 0.95
    
    # ========================================================================
    # Sonic Intelligence
    # ========================================================================
    
    # Timbre analysis
    timbre = "neutral"
    if harmonic_ratio > 0.6:
        if brightness < 3000:
            timbre = "warm"
        elif brightness < 5000:
            timbre = "mellow"
        else:
            timbre = "bright"
    elif harmonic_ratio < 0.4:
        timbre = "dark"
    elif brightness > 5000:
        timbre = "crisp"
    
    # Texture analysis
    texture = "balanced"
    if harmonic_ratio > 0.7 and percussive_ratio > 0.5:
        texture = "layered"
    elif harmonic_ratio > 0.6:
        texture = "rich"
    elif harmonic_ratio < 0.3 and percussive_ratio < 0.3:
        texture = "sparse"
    elif harmonic_ratio < 0.4:
        texture = "minimal"
    elif harmonic_ratio > 0.5 and percussive_ratio > 0.4:
        texture = "dense"
    
    # Spatial analysis
    spatial = "focused"
    if stereo_width < 0.3:
        spatial = "intimate"
    elif stereo_width > 0.7:
        spatial = "wide"
    elif stereo_width > 0.6:
        spatial = "expansive"
    
    # Dynamics analysis
    dynamics = "steady"
    if energy_std < 0.05:
        dynamics = "steady"
    elif energy_std < 0.1:
        dynamics = "pulsing"
    elif energy_std < 0.2:
        dynamics = "dynamic"
    else:
        dynamics = "explosive"
    
    # ========================================================================
    # Intent Intelligence
    # ========================================================================
    
    # Find matching intent categories
    intent_matches = []
    for intent, params in INTENT_CATEGORIES.items():
        energy_match = params["energy_range"][0] <= energy <= params["energy_range"][1]
        bpm_match = params["bpm_range"][0] <= bpm <= params["bpm_range"][1]
        
        if energy_match and bpm_match:
            intent_matches.append({
                "intent": intent,
                "confidence": 0.9,
                "use_cases": params["use_cases"],
                "characteristics": params["characteristics"],
            })
        elif energy_match or bpm_match:
            intent_matches.append({
                "intent": intent,
                "confidence": 0.6,
                "use_cases": params["use_cases"],
                "characteristics": params["characteristics"],
            })
    
    # Sort by confidence
    intent_matches.sort(key=lambda x: x["confidence"], reverse=True)
    primary_intent = intent_matches[0]["intent"] if intent_matches else "creative"
    
    # ========================================================================
    # Compile Results
    # ========================================================================
    
    return {
        "energy_level": energy,
        "energy_category": _get_energy_category(energy),
        
        # Emotional Intelligence
        "emotional": {
            "category": emotion_category,
            "valence": round(valence, 2),  # -1 to 1 (negative to positive)
            "arousal": round(arousal, 2),  # 0 to 1 (calm to excited)
            "emotions": emotion_words,
            "emotional_state": _get_emotional_state(valence, arousal),
        },
        
        # Psychological Intelligence
        "psychological": {
            "primary_effect": psychological_effect,
            "focus": round(focus_score, 2),  # 0-1
            "relaxation": round(relaxation_score, 2),  # 0-1
            "motivation": round(motivation_score, 2),  # 0-1
            "psychological_state": _get_psychological_state(focus_score, relaxation_score, motivation_score),
        },
        
        # Sonic Intelligence
        "sonic": {
            "timbre": timbre,
            "texture": texture,
            "spatial": spatial,
            "dynamics": dynamics,
            "brightness": round(brightness, 0),
            "harmonic_ratio": round(harmonic_ratio, 2),
            "percussive_ratio": round(percussive_ratio, 2),
            "energy_variation": round(energy_std, 3),
        },
        
        # Intent Intelligence
        "intent": {
            "primary": primary_intent,
            "matches": intent_matches[:3],  # Top 3 matches
            "use_cases": intent_matches[0]["use_cases"] if intent_matches else [],
            "suitable_for": _get_suitable_for(primary_intent, energy, bpm),
        },
        
        # Summary
        "summary": {
            "description": _generate_summary(energy, emotion_category, psychological_effect, primary_intent),
            "tags": _generate_tags(emotion_category, psychological_effect, timbre, texture, primary_intent),
        },
    }


def _get_energy_category(energy: int) -> str:
    """Get energy category name."""
    if energy <= 2:
        return "very_low"
    elif energy <= 4:
        return "low"
    elif energy <= 6:
        return "medium_low"
    elif energy <= 7:
        return "medium"  # SERGIK sweet spot
    elif energy <= 8:
        return "medium_high"
    elif energy <= 9:
        return "high"
    else:
        return "very_high"


def _get_emotional_state(valence: float, arousal: float) -> str:
    """Get emotional state from valence-arousal."""
    # Round to nearest quadrant
    v_round = round(valence * 2) / 2
    a_round = round(arousal * 2) / 2
    
    # Find closest match
    closest = None
    min_dist = float('inf')
    for (v, a), state in VALENCE_AROUSAL_MAP.items():
        dist = abs(v - v_round) + abs(a - a_round)
        if dist < min_dist:
            min_dist = dist
            closest = state
    
    return closest or "neutral"


def _get_psychological_state(focus: float, relaxation: float, motivation: float) -> str:
    """Get psychological state description."""
    if focus > 0.8:
        return "highly_focused"
    elif relaxation > 0.8:
        return "deeply_relaxed"
    elif motivation > 0.8:
        return "highly_motivated"
    elif focus > 0.6 and motivation > 0.6:
        return "productive"
    elif relaxation > 0.6:
        return "relaxed"
    elif motivation > 0.6:
        return "energized"
    else:
        return "balanced"


def _get_suitable_for(intent: str, energy: int, bpm: float) -> List[str]:
    """Get suitable use cases."""
    intent_data = INTENT_CATEGORIES.get(intent, {})
    return intent_data.get("use_cases", [])


def _generate_summary(energy: int, emotion: str, psychological: str, intent: str) -> str:
    """Generate human-readable summary."""
    energy_desc = {
        1: "very low",
        2: "very low",
        3: "low",
        4: "low-medium",
        5: "medium",
        6: "medium-high",
        7: "high",
        8: "very high",
        9: "very high",
        10: "peak",
    }.get(energy, "medium")
    
    return (
        f"A {energy_desc} energy track ({energy}/10) with {emotion} emotional character. "
        f"Psychologically suited for {psychological.replace('_', ' ')} activities. "
        f"Best suited for {intent.replace('_', ' ')} contexts."
    )


def _generate_tags(emotion: str, psychological: str, timbre: str, texture: str, intent: str) -> List[str]:
    """Generate descriptive tags."""
    tags = [emotion, psychological, timbre, texture, intent]
    # Add energy-related tags
    tags.extend(["energy_analysis", "intelligent_analysis"])
    return [tag.replace("_", " ") for tag in tags]


def enhance_audio_analysis_with_intelligence(audio_features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enhance existing audio analysis with intelligence layers.
    
    Args:
        audio_features: Dictionary from extract_audio_features or analyze_audio
        
    Returns:
        Enhanced analysis with intelligence layers
    """
    # Extract required parameters
    energy = int(audio_features.get("energy", 5))
    bpm = audio_features.get("bpm", 120)
    brightness = audio_features.get("brightness", audio_features.get("spectral_centroid", 3000))
    harmonic_ratio = audio_features.get("harmonic_ratio", 0.5)
    percussive_ratio = audio_features.get("percussive_ratio", 0.5)
    energy_std = audio_features.get("energy_std", 0.1)
    stereo_width = audio_features.get("stereo_width", 0.5)
    spectral_rolloff = audio_features.get("spectral_rolloff")
    rhythm_complexity = audio_features.get("rhythm_complexity")
    
    # Run intelligence analysis
    intelligence = analyze_energy_intelligence(
        energy=energy,
        bpm=bpm,
        brightness=brightness,
        harmonic_ratio=harmonic_ratio,
        percussive_ratio=percussive_ratio,
        energy_std=energy_std,
        stereo_width=stereo_width,
        spectral_rolloff=spectral_rolloff,
        rhythm_complexity=rhythm_complexity,
    )
    
    # Merge with original features
    enhanced = audio_features.copy()
    enhanced["intelligence"] = intelligence
    
    return enhanced

