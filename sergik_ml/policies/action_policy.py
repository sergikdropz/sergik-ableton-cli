"""
SERGIK ML Action Policy

Safety/allowlist policy for actions from voice/UI.
Only known commands with validated arguments are allowed.
"""

from typing import Dict, Any, Set, Optional
import logging

logger = logging.getLogger(__name__)

# Allowed commands
ALLOWED_CMDS: Set[str] = {
    # Pack operations
    "pack.create",
    "pack.rate",
    "pack.similar",
    "pack.export",
    "pack.list",

    # Generation
    "gen.generate_loop",
    "gen.generate_drums",
    "gen.generate_bass",
    "gen.generate_melody",
    "musicbrains.generate",

    # Voice
    "voice.tts",
    "voice.stt",

    # Ableton Live (executed via M4L LiveAPI)
    "live.set_tempo",
    "live.play",
    "live.stop",
    "live.add_device",
    "live.add_effect",
    "live.set_param",
    "live.list_tracks",
    "live.export_audio",
    "live.fire_clip",

    # System
    "system.health",
    "system.status",
}

# Argument validators per command
ARG_VALIDATORS: Dict[str, callable] = {}


def validate_action(cmd: str, args: Dict[str, Any]) -> None:
    """
    Validate action command and arguments.

    Raises:
        ValueError: If command not allowed or arguments invalid
    """
    if not cmd:
        raise ValueError("Command cannot be empty")

    if cmd not in ALLOWED_CMDS:
        raise ValueError(f"Command not allowed: {cmd}")

    # Run command-specific validation
    if cmd == "pack.create":
        _validate_pack_create(args)
    elif cmd == "pack.rate":
        _validate_pack_rate(args)
    elif cmd == "live.set_tempo":
        _validate_tempo(args)
    elif cmd in ("gen.generate_loop", "musicbrains.generate"):
        _validate_generate(args)

    logger.debug(f"Action validated: {cmd}")


def _validate_pack_create(args: Dict[str, Any]) -> None:
    """Validate pack.create arguments."""
    length = args.get("length_bars")

    if length is not None:
        if isinstance(length, str):
            if length.lower() not in ("full", "auto"):
                raise ValueError(f"Invalid length_bars string: {length}")
        elif isinstance(length, (int, float)):
            if int(length) <= 0:
                raise ValueError("length_bars must be > 0")
        else:
            raise ValueError(f"Invalid length_bars type: {type(length)}")

    fade = args.get("fade_ms")
    if fade is not None and (not isinstance(fade, (int, float)) or fade < 0):
        raise ValueError("fade_ms must be >= 0")


def _validate_pack_rate(args: Dict[str, Any]) -> None:
    """Validate pack.rate arguments."""
    rating = args.get("rating")

    if rating is None:
        raise ValueError("pack.rate requires 'rating' argument")

    try:
        r = float(rating)
        if r < 1 or r > 5:
            raise ValueError("rating must be between 1 and 5")
    except (TypeError, ValueError):
        raise ValueError("rating must be a number between 1 and 5")


def _validate_tempo(args: Dict[str, Any]) -> None:
    """Validate live.set_tempo arguments."""
    tempo = args.get("tempo")

    if tempo is None:
        raise ValueError("live.set_tempo requires 'tempo' argument")

    try:
        t = float(tempo)
        if t < 20 or t > 999:
            raise ValueError("tempo must be between 20 and 999 BPM")
    except (TypeError, ValueError):
        raise ValueError("tempo must be a valid number")


def _validate_generate(args: Dict[str, Any]) -> None:
    """Validate generation arguments."""
    bars = args.get("bars")
    if bars is not None:
        try:
            b = int(bars)
            if b < 1 or b > 64:
                raise ValueError("bars must be between 1 and 64")
        except (TypeError, ValueError):
            raise ValueError("bars must be a valid integer")

    bpm = args.get("bpm")
    if bpm is not None:
        try:
            t = float(bpm)
            if t < 60 or t > 200:
                raise ValueError("bpm must be between 60 and 200")
        except (TypeError, ValueError):
            raise ValueError("bpm must be a valid number")


def is_allowed(cmd: str) -> bool:
    """Check if command is in allowlist."""
    return cmd in ALLOWED_CMDS


def add_allowed_cmd(cmd: str) -> None:
    """Add command to allowlist (for plugins)."""
    ALLOWED_CMDS.add(cmd)
    logger.info(f"Added allowed command: {cmd}")
