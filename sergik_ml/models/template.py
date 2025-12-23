"""
SERGIK ML Template Model

Proposes sample pack templates based on project statistics.

Architecture:
  - V1: Rule-based heuristics (current)
  - V2: Decision tree learned from successful packs
  - V3: Neural template generator
"""

from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class TemplateModel:
    """
    Proposes pack configuration based on input statistics.
    """

    # Template presets
    PRESETS = {
        "drums": {
            "length_bars": 2,
            "normalization_db": -1,
            "grouping": "drums",
            "fade_ms": 5,
            "naming_pattern": "{stem}_drums_{bars}bar",
        },
        "melodic": {
            "length_bars": 8,
            "normalization_db": -3,
            "grouping": "melodic",
            "fade_ms": 20,
            "naming_pattern": "{stem}_melodic_{bars}bar",
        },
        "stems": {
            "length_bars": 4,
            "normalization_db": -1,
            "grouping": "stems",
            "fade_ms": 10,
            "naming_pattern": "{stem}_{bars}bar",
        },
        "full": {
            "length_bars": "Full",
            "normalization_db": 0,
            "grouping": "full",
            "fade_ms": 0,
            "naming_pattern": "{stem}_full",
        },
    }

    def __init__(self):
        self.history: list = []

    def propose(self, stats: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Propose template configuration based on statistics.

        Args:
            stats: Audio statistics (bpm_mean, energy_mean, etc.)
            context: Optional context (user preference, session state)

        Returns:
            Template configuration dict
        """
        bpm = float(stats.get("bpm_mean", 120))
        energy = float(stats.get("energy_mean", 0.05))
        harmonic = float(stats.get("harmonic_ratio_mean", 0.5))
        percussive = float(stats.get("percussive_ratio_mean", 0.5))
        track_count = int(stats.get("track_count", 1))

        # Rule-based selection
        if percussive > 0.6 or energy > 0.08:
            # High energy / percussive -> short drum loops
            template = self.PRESETS["drums"].copy()
        elif harmonic > 0.6 or bpm < 110:
            # Harmonic / slower -> longer melodic loops
            template = self.PRESETS["melodic"].copy()
        elif track_count == 1:
            # Single track -> full export
            template = self.PRESETS["full"].copy()
        else:
            # Default -> standard stems
            template = self.PRESETS["stems"].copy()

        # Apply context overrides
        if context:
            if context.get("prefer_short"):
                template["length_bars"] = min(template.get("length_bars", 4), 2)
            if context.get("prefer_long"):
                template["length_bars"] = max(template.get("length_bars", 4), 8)

        # Log for learning
        self.history.append({
            "stats": stats,
            "context": context,
            "proposed": template,
        })

        logger.debug(f"Template proposed: {template['grouping']} ({template['length_bars']} bars)")
        return template

    def get_preset(self, name: str) -> Dict[str, Any]:
        """Get a named preset."""
        return self.PRESETS.get(name, self.PRESETS["stems"]).copy()

    def list_presets(self) -> list:
        """List available preset names."""
        return list(self.PRESETS.keys())
