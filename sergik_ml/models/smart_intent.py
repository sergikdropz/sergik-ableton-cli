"""
SERGIK ML Smart Intent Classifier

Advanced intent parsing using:
  - Fuzzy matching for command recognition
  - Embedding-based semantic similarity
  - Confidence scoring
  - Context-aware argument extraction

Upgrade path:
  - Fine-tuned DistilBERT classifier
  - GPT-based intent parsing
"""

import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import numpy as np

logger = logging.getLogger(__name__)

# Try to import fuzzy matching
try:
    from rapidfuzz import fuzz, process
    FUZZY_AVAILABLE = True
except ImportError:
    FUZZY_AVAILABLE = False
    logger.warning("rapidfuzz not installed. Install: pip install rapidfuzz")


@dataclass
class IntentResult:
    """Result of intent classification."""
    cmd: Optional[str]
    args: Dict[str, Any]
    confidence: float
    tts: str
    alternatives: List[Tuple[str, float]]


# ============================================================================
# Intent Definitions
# ============================================================================

INTENT_PATTERNS = {
    # Pack operations
    "pack.create": {
        "patterns": [
            r"(create|make|build|generate)\s*(a\s+)?(sample\s+)?pack",
            r"sample\s+pack",
            r"export\s+(stems|loops|samples)",
            r"bounce\s+to\s+pack",
        ],
        "keywords": ["pack", "sample", "create", "export", "bounce", "stems"],
        "args_extractors": {
            "length_bars": r"(\d+)\s*bar",
            "cloud_push": r"(cloud|upload|push)",
            "source": r"from\s+([\w\s]+?)(?:\s+and|\s*$)",
        },
        "tts": "Creating sample pack.",
    },

    "pack.rate": {
        "patterns": [
            r"rate\s+(this|it|track)",
            r"give\s+(this|it)\s+(\d)\s+stars?",
            r"(\d)\s+stars?",
            r"(love|like|hate|dislike)\s+(this|it)",
        ],
        "keywords": ["rate", "star", "love", "like", "hate"],
        "args_extractors": {
            "rating": r"(\d)\s*(?:star|out)",
        },
        "tts": "Rating recorded.",
    },

    "pack.similar": {
        "patterns": [
            r"find\s+similar",
            r"similar\s+(tracks?|loops?|samples?)",
            r"more\s+like\s+(this|it)",
            r"sounds?\s+like",
        ],
        "keywords": ["similar", "like", "more", "find"],
        "args_extractors": {
            "k": r"(\d+)\s+(similar|results?)",
        },
        "tts": "Finding similar tracks.",
    },

    # Live control
    "live.set_tempo": {
        "patterns": [
            r"(set\s+)?tempo\s+(\d+)",
            r"(\d+)\s*bpm",
            r"change\s+bpm\s+to\s+(\d+)",
        ],
        "keywords": ["tempo", "bpm", "speed"],
        "args_extractors": {
            "tempo": r"(\d+)",
        },
        "tts": "Setting tempo.",
    },

    "live.play": {
        "patterns": [
            r"\bplay\b",
            r"start\s+playback",
            r"begin\s+playing",
        ],
        "keywords": ["play", "start"],
        "tts": "Starting playback.",
    },

    "live.stop": {
        "patterns": [
            r"\bstop\b",
            r"stop\s+playback",
            r"pause",
        ],
        "keywords": ["stop", "pause"],
        "tts": "Stopping playback.",
    },

    # Generation
    "gen.drums": {
        "patterns": [
            r"(generate|create|make)\s+(some\s+)?drums?",
            r"drum\s+(pattern|loop|beat)",
            r"kick\s+and\s+(snare|hat)",
        ],
        "keywords": ["drum", "beat", "kick", "snare", "percussion"],
        "args_extractors": {
            "style": r"(tech-?house|house|techno|trap|disco|reggaeton)",
            "bars": r"(\d+)\s*bar",
        },
        "tts": "Generating drums.",
    },

    "gen.bass": {
        "patterns": [
            r"(generate|create|make)\s+(a\s+)?bass(line)?",
            r"bass\s+(line|pattern|groove)",
        ],
        "keywords": ["bass", "bassline", "sub"],
        "args_extractors": {
            "key": r"in\s+([A-G][#b]?\s*(?:min|maj|minor|major)?)",
            "bars": r"(\d+)\s*bar",
        },
        "tts": "Generating bassline.",
    },

    "gen.chords": {
        "patterns": [
            r"(generate|create|make)\s+(some\s+)?chords?",
            r"chord\s+progression",
            r"harmony",
        ],
        "keywords": ["chord", "harmony", "progression"],
        "args_extractors": {
            "key": r"in\s+([A-G][#b]?\s*(?:min|maj|minor|major)?)",
            "progression": r"(i+v?|I+V?|vi?|VI?)[-\s]+(i+v?|I+V?|vi?|VI?)",
        },
        "tts": "Generating chords.",
    },

    "gen.melody": {
        "patterns": [
            r"(generate|create|make)\s+(a\s+)?melody",
            r"melodic\s+(line|pattern)",
            r"lead\s+(line|melody)",
        ],
        "keywords": ["melody", "melodic", "lead"],
        "args_extractors": {
            "key": r"in\s+([A-G][#b]?\s*(?:min|maj|minor|major)?)",
            "density": r"(sparse|medium|dense)",
        },
        "tts": "Generating melody.",
    },

    # Stem separation
    "stems.separate": {
        "patterns": [
            r"(separate|split|extract)\s+stems?",
            r"stem\s+separation",
            r"isolate\s+(drums?|bass|vocals?)",
        ],
        "keywords": ["stem", "separate", "split", "isolate"],
        "args_extractors": {
            "model": r"(htdemucs|mdx)",
        },
        "tts": "Separating stems.",
    },

    # Voice/TTS
    "voice.tts": {
        "patterns": [
            r"say\s+(.+)",
            r"speak\s+(.+)",
            r"announce\s+(.+)",
        ],
        "keywords": ["say", "speak", "announce"],
        "args_extractors": {
            "text": r"(?:say|speak|announce)\s+(.+)",
        },
        "tts": "",  # Dynamic
    },
}


class SmartIntentClassifier:
    """
    Smart intent classifier with fuzzy matching and confidence scoring.
    """

    def __init__(self, confidence_threshold: float = 0.5):
        """
        Initialize classifier.

        Args:
            confidence_threshold: Minimum confidence for command match
        """
        self.confidence_threshold = confidence_threshold
        self._all_keywords = self._build_keyword_index()

    def _build_keyword_index(self) -> Dict[str, List[str]]:
        """Build reverse index from keywords to intents."""
        index = {}
        for cmd, config in INTENT_PATTERNS.items():
            for keyword in config.get("keywords", []):
                if keyword not in index:
                    index[keyword] = []
                index[keyword].append(cmd)
        return index

    def classify(self, text: str, context: Optional[Dict[str, Any]] = None) -> IntentResult:
        """
        Classify intent from text.

        Args:
            text: Input text (transcribed voice or typed command)
            context: Optional context (previous command, session state)

        Returns:
            IntentResult with command, args, confidence
        """
        text = text.lower().strip()

        if not text:
            return IntentResult(
                cmd=None,
                args={},
                confidence=0.0,
                tts="I didn't catch that.",
                alternatives=[],
            )

        # Score all intents
        scores = []
        for cmd, config in INTENT_PATTERNS.items():
            score = self._score_intent(text, config)
            if score > 0:
                scores.append((cmd, score))

        # Sort by score
        scores.sort(key=lambda x: x[1], reverse=True)

        if not scores or scores[0][1] < self.confidence_threshold:
            return IntentResult(
                cmd=None,
                args={},
                confidence=0.0,
                tts="I didn't understand that command.",
                alternatives=scores[:3] if scores else [],
            )

        best_cmd, best_score = scores[0]
        config = INTENT_PATTERNS[best_cmd]

        # Extract arguments
        args = self._extract_args(text, config.get("args_extractors", {}))

        # Apply context
        if context:
            args = self._apply_context(args, context, best_cmd)

        # Generate TTS
        tts = config.get("tts", "Done.")
        if best_cmd == "voice.tts":
            tts = args.get("text", "")
        elif best_cmd == "live.set_tempo" and "tempo" in args:
            tts = f"Setting tempo to {args['tempo']} BPM."
        elif best_cmd == "pack.create" and "length_bars" in args:
            tts = f"Creating {args['length_bars']}-bar sample pack."

        return IntentResult(
            cmd=best_cmd,
            args=args,
            confidence=best_score,
            tts=tts,
            alternatives=scores[1:4] if len(scores) > 1 else [],
        )

    def _score_intent(self, text: str, config: Dict[str, Any]) -> float:
        """Score how well text matches an intent."""
        score = 0.0

        # Pattern matching
        for pattern in config.get("patterns", []):
            if re.search(pattern, text, re.IGNORECASE):
                score += 0.5

        # Keyword matching
        keywords = config.get("keywords", [])
        text_words = set(text.split())

        keyword_hits = sum(1 for kw in keywords if kw in text_words)
        if keywords:
            score += 0.3 * (keyword_hits / len(keywords))

        # Fuzzy matching on keywords
        if FUZZY_AVAILABLE and keywords:
            for word in text_words:
                best_match = process.extractOne(word, keywords, scorer=fuzz.ratio)
                if best_match and best_match[1] > 80:
                    score += 0.1

        return min(1.0, score)

    def _extract_args(
        self,
        text: str,
        extractors: Dict[str, str],
    ) -> Dict[str, Any]:
        """Extract arguments from text using regex patterns."""
        args = {}

        for arg_name, pattern in extractors.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1)

                # Type conversion
                if arg_name in ["tempo", "bars", "k", "rating", "length_bars"]:
                    try:
                        value = int(value)
                    except ValueError:
                        pass
                elif arg_name == "cloud_push":
                    value = True
                elif arg_name == "density":
                    density_map = {"sparse": 0.2, "medium": 0.5, "dense": 0.8}
                    value = density_map.get(value.lower(), 0.5)

                args[arg_name] = value

        return args

    def _apply_context(
        self,
        args: Dict[str, Any],
        context: Dict[str, Any],
        cmd: str,
    ) -> Dict[str, Any]:
        """Apply context to fill in missing arguments."""
        # Use previous key if not specified
        if "key" not in args and "last_key" in context:
            args["key"] = context["last_key"]

        # Use previous style if not specified
        if "style" not in args and "last_style" in context:
            args["style"] = context["last_style"]

        # Use current track_id for rate/similar
        if cmd in ["pack.rate", "pack.similar"] and "track_id" not in args:
            if "current_track_id" in context:
                args["track_id"] = context["current_track_id"]

        return args


# ============================================================================
# Global Instance
# ============================================================================

_classifier: Optional[SmartIntentClassifier] = None


def get_classifier() -> SmartIntentClassifier:
    """Get or create global classifier."""
    global _classifier
    if _classifier is None:
        _classifier = SmartIntentClassifier()
    return _classifier


def classify_intent(
    text: str,
    context: Optional[Dict[str, Any]] = None,
) -> IntentResult:
    """
    Classify intent from text.

    Convenience function for intent classification.
    """
    return get_classifier().classify(text, context)


def parse_command(text: str) -> Dict[str, Any]:
    """
    Parse command from text (backward compatibility).

    Returns dict compatible with old IntentModel interface.
    """
    result = classify_intent(text)
    return {
        "cmd": result.cmd,
        "args": result.args,
        "tts": result.tts,
        "confidence": result.confidence,
    }
