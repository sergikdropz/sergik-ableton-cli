"""
SERGIK ML Intent Model

Parses natural language commands into structured {cmd, args}.

Architecture:
  - V1: Rule-based keyword matching (current)
  - V2: Fine-tuned classifier (BERT/DistilBERT)
  - V3: LLM function calling (GPT-4 / Claude)
"""

from typing import Dict, Any, Optional, List, Tuple
import re
import logging

logger = logging.getLogger(__name__)


class IntentModel:
    """
    Rule-based intent parser for voice commands.
    """

    # Intent patterns: (regex, cmd, arg_extractor)
    PATTERNS: List[Tuple[str, str, callable]] = []

    def __init__(self):
        self._build_patterns()

    def _build_patterns(self):
        """Build regex patterns for intent matching."""
        self.PATTERNS = [
            # Sample pack creation
            (
                r"(make|create|export|build).*(sample\s*pack|pack)",
                "pack.create",
                self._extract_pack_args
            ),
            # Similar search
            (
                r"(find|search|show).*(similar|like this|related)",
                "pack.similar",
                lambda t: {"k": 10}
            ),
            # Rating
            (
                r"(rate|rating|star).*([\d])",
                "pack.rate",
                self._extract_rating_args
            ),
            # Tempo
            (
                r"(set\s*)?tempo.*([\d]{2,3})",
                "live.set_tempo",
                self._extract_tempo_args
            ),
            # Play/Stop
            (
                r"\b(play|start)\b",
                "live.play",
                lambda t: {}
            ),
            (
                r"\b(stop|pause)\b",
                "live.stop",
                lambda t: {}
            ),
            # Generate
            (
                r"(generate|create|make).*(loop|beat|melody|bass)",
                "gen.generate_loop",
                self._extract_generate_args
            ),
            # MusicBrains
            (
                r"(musicbrains|brain|ai\s*generate)",
                "musicbrains.generate",
                self._extract_generate_args
            ),
        ]

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Parse text into intent.

        Args:
            text: Natural language command

        Returns:
            {"cmd": str, "args": dict, "tts": str, "confidence": float}
        """
        t = (text or "").lower().strip()

        if not t:
            return {
                "cmd": None,
                "args": {},
                "tts": "I didn't hear anything.",
                "confidence": 0.0
            }

        # Try each pattern
        for pattern, cmd, arg_fn in self.PATTERNS:
            if re.search(pattern, t, re.IGNORECASE):
                args = arg_fn(t)
                tts = self._generate_tts(cmd, args)
                logger.info(f"Intent matched: {cmd} with args {args}")
                return {
                    "cmd": cmd,
                    "args": args,
                    "tts": tts,
                    "confidence": 0.9
                }

        # No match
        return {
            "cmd": None,
            "args": {},
            "tts": "I didn't understand that command. Try 'make a sample pack' or 'find similar'.",
            "confidence": 0.0
        }

    def _extract_pack_args(self, text: str) -> Dict[str, Any]:
        """Extract sample pack arguments from text."""
        args = {
            "source": "All Tracks",
            "length_bars": 4,
            "auto_zip": True,
            "cloud_push": False,
        }

        # Bar length
        bar_match = re.search(r"(\d+)\s*bar", text)
        if bar_match:
            args["length_bars"] = int(bar_match.group(1))
        elif "full" in text:
            args["length_bars"] = "Full"

        # Source
        if "drum" in text or "group" in text:
            args["source"] = "Selected Group"
        elif "selection" in text or "selected" in text:
            args["source"] = "Selection"

        # Cloud
        if "cloud" in text or "upload" in text or "push" in text:
            args["cloud_push"] = True

        return args

    def _extract_rating_args(self, text: str) -> Dict[str, Any]:
        """Extract rating from text."""
        match = re.search(r"(\d)", text)
        rating = int(match.group(1)) if match else 3
        return {"rating": min(max(rating, 1), 5)}

    def _extract_tempo_args(self, text: str) -> Dict[str, Any]:
        """Extract tempo from text."""
        match = re.search(r"(\d{2,3})", text)
        tempo = int(match.group(1)) if match else 120
        return {"tempo": min(max(tempo, 60), 200)}

    def _extract_generate_args(self, text: str) -> Dict[str, Any]:
        """Extract generation arguments from text."""
        args = {"prompt": text, "bars": 8}

        # Type detection
        if "drum" in text or "beat" in text:
            args["type"] = "drums"
            args["bars"] = 4
        elif "bass" in text:
            args["type"] = "bass"
        elif "melody" in text or "lead" in text:
            args["type"] = "melody"
        elif "chord" in text or "pad" in text:
            args["type"] = "chords"

        # Style
        for style in ["tech-house", "techno", "house", "trap", "disco"]:
            if style.replace("-", " ") in text or style in text:
                args["style"] = style
                break

        return args

    def _generate_tts(self, cmd: str, args: Dict[str, Any]) -> str:
        """Generate TTS response for command."""
        if cmd == "pack.create":
            bars = args.get("length_bars", 4)
            cloud = "with cloud upload" if args.get("cloud_push") else ""
            return f"Creating a {bars}-bar sample pack {cloud}."

        if cmd == "pack.similar":
            return "Finding similar loops."

        if cmd == "pack.rate":
            return f"Rated {args.get('rating', 3)} stars."

        if cmd == "live.set_tempo":
            return f"Setting tempo to {args.get('tempo', 120)} BPM."

        if cmd == "live.play":
            return "Starting playback."

        if cmd == "live.stop":
            return "Stopping."

        if cmd in ("gen.generate_loop", "musicbrains.generate"):
            return "Generating audio. This may take a moment."

        return "Done."
