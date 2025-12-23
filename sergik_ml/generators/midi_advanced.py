"""
Advanced MIDI Generation - Chord Progressions, Bass, Arpeggios, Humanization

Provides intelligent MIDI generation with harmonic awareness and human feel.
"""

import random
import math
from typing import List, Dict, Any, Optional, Tuple, Literal
from dataclasses import dataclass


# ============================================================================
# Music Theory Constants
# ============================================================================

# Camelot key wheel (compatible with existing SERGIK DNA system)
CAMELOT_KEYS = {
    # Minor keys (A)
    "1A": ("Ab minor", ["Ab", "B", "Db", "Eb", "Gb"]),
    "2A": ("Eb minor", ["Eb", "Gb", "Ab", "Bb", "Db"]),
    "3A": ("Bb minor", ["Bb", "Db", "Eb", "F", "Ab"]),
    "4A": ("F minor", ["F", "Ab", "Bb", "C", "Eb"]),
    "5A": ("C minor", ["C", "Eb", "F", "G", "Bb"]),
    "6A": ("G minor", ["G", "Bb", "C", "D", "F"]),
    "7A": ("D minor", ["D", "F", "G", "A", "C"]),
    "8A": ("A minor", ["A", "C", "D", "E", "G"]),
    "9A": ("E minor", ["E", "G", "A", "B", "D"]),
    "10A": ("B minor", ["B", "D", "E", "F#", "A"]),
    "11A": ("F# minor", ["F#", "A", "B", "C#", "E"]),
    "12A": ("Db minor", ["Db", "E", "Gb", "Ab", "B"]),

    # Major keys (B)
    "1B": ("B Major", ["B", "Db", "Eb", "F", "Ab"]),
    "2B": ("F# Major", ["F#", "Ab", "Bb", "C", "Eb"]),
    "3B": ("Db Major", ["Db", "Eb", "F", "G", "Bb"]),
    "4B": ("Ab Major", ["Ab", "Bb", "C", "D", "F"]),
    "5B": ("Eb Major", ["Eb", "F", "G", "A", "C"]),
    "6B": ("Bb Major", ["Bb", "C", "D", "E", "G"]),
    "7B": ("F Major", ["F", "G", "A", "Bb", "D"]),
    "8B": ("C Major", ["C", "D", "E", "F", "G"]),
    "9B": ("G Major", ["G", "A", "B", "C", "D"]),
    "10B": ("D Major", ["D", "E", "F#", "G", "A"]),
    "11B": ("A Major", ["A", "B", "C#", "D", "E"]),
    "12B": ("E Major", ["E", "F#", "G#", "A", "B"]),
}

NOTE_TO_MIDI = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
    "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
}

# Chord intervals (semitones from root)
CHORD_INTERVALS = {
    "major": [0, 4, 7],
    "minor": [0, 3, 7],
    "maj7": [0, 4, 7, 11],
    "min7": [0, 3, 7, 10],
    "dom7": [0, 4, 7, 10],
    "maj9": [0, 4, 7, 11, 14],
    "min9": [0, 3, 7, 10, 14],
    "sus4": [0, 5, 7],
    "sus2": [0, 2, 7],
    "dim": [0, 3, 6],
    "aug": [0, 4, 8],
}

# Progression templates (Roman numeral notation)
PROGRESSIONS = {
    # House/Techno progressions
    "i-VI-III-VII": {"pattern": ["i", "VI", "III", "VII"], "genre": "house", "mode": "minor"},
    "I-V-vi-IV": {"pattern": ["I", "V", "vi", "IV"], "genre": "house", "mode": "major"},
    "i-iv-VII-VI": {"pattern": ["i", "iv", "VII", "VI"], "genre": "techno", "mode": "minor"},
    "I-IV-I-V": {"pattern": ["I", "IV", "I", "V"], "genre": "techno", "mode": "major"},

    # Jazz progressions
    "jazz_251": {"pattern": ["ii", "V", "I"], "genre": "jazz", "mode": "major"},
    "jazz_1625": {"pattern": ["I", "vi", "ii", "V"], "genre": "jazz", "mode": "major"},

    # Modal progressions
    "modal_dorian": {"pattern": ["i", "IV", "i", "IV"], "genre": "modal", "mode": "dorian"},
    "modal_phrygian": {"pattern": ["i", "bII", "i", "bVII"], "genre": "modal", "mode": "phrygian"},

    # Ambient/atmospheric
    "ambient_pads": {"pattern": ["I", "iii", "vi", "IV"], "genre": "ambient", "mode": "major"},
}

# Scale degree to chord type mapping
SCALE_DEGREE_CHORDS = {
    "minor": {
        "i": "minor", "ii": "dim", "III": "major", "iv": "minor",
        "v": "minor", "VI": "major", "VII": "major"
    },
    "major": {
        "I": "major", "ii": "minor", "iii": "minor", "IV": "major",
        "V": "major", "vi": "minor", "vii": "dim"
    }
}


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class MIDINote:
    """Single MIDI note."""
    pitch: int  # MIDI note number (0-127)
    start_time: float  # In beats
    duration: float  # In beats
    velocity: int  # 0-127
    mute: int = 0  # 0 = not muted, 1 = muted

    def to_dict(self) -> Dict[str, Any]:
        """Convert to Max for Live format."""
        return {
            "pitch": self.pitch,
            "start_time": self.start_time,
            "duration": self.duration,
            "velocity": self.velocity,
            "mute": self.mute
        }


@dataclass
class Chord:
    """Musical chord."""
    root: str  # Note name (e.g., "D", "F#")
    chord_type: str  # "major", "minor", "maj7", etc.
    inversion: int = 0  # 0=root, 1=first, 2=second
    octave: int = 3  # Base octave

    def get_notes(self) -> List[int]:
        """Get MIDI note numbers for this chord."""
        root_midi = NOTE_TO_MIDI[self.root] + (self.octave * 12)
        intervals = CHORD_INTERVALS[self.chord_type]

        notes = [root_midi + interval for interval in intervals]

        # Apply inversion
        for _ in range(self.inversion):
            notes.append(notes.pop(0) + 12)

        return notes


# ============================================================================
# Advanced MIDI Generator Class
# ============================================================================

class AdvancedMIDIGenerator:
    """
    Advanced MIDI generation with harmonic awareness,
    humanization, and multi-track coordination.
    """

    def __init__(self, key: str = "10B", tempo: float = 125):
        """
        Initialize generator.

        Args:
            key: Camelot key (e.g., "10B", "7A")
            tempo: BPM
        """
        self.key = key
        self.tempo = tempo
        self.key_name, self.scale_notes = CAMELOT_KEYS.get(key, ("C Major", ["C", "D", "E", "F", "G"]))
        self.is_minor = "minor" in self.key_name.lower()

    def generate_chord_progression(
        self,
        progression_type: str = "i-VI-III-VII",
        bars: int = 8,
        voicing: str = "stabs",
        seventh_chords: bool = True
    ) -> List[MIDINote]:
        """
        Generate chord progression.

        Args:
            progression_type: Progression pattern name
            bars: Number of bars
            voicing: "stabs" (rhythmic hits) or "pads" (sustained)
            seventh_chords: Use 7th chords for richer harmony

        Returns:
            List of MIDI notes
        """
        if progression_type not in PROGRESSIONS:
            progression_type = "i-VI-III-VII" if self.is_minor else "I-V-vi-IV"

        prog_def = PROGRESSIONS[progression_type]
        pattern = prog_def["pattern"]

        # Build chords
        chords = []
        beats_per_chord = (bars * 4) / len(pattern)

        for i, roman_numeral in enumerate(pattern):
            chord = self._roman_to_chord(roman_numeral, seventh_chords)
            chords.append((chord, i * beats_per_chord, beats_per_chord))

        # Generate MIDI notes based on voicing
        notes = []

        if voicing == "stabs":
            # Rhythmic chord stabs (common in tech-house)
            for chord, start_beat, duration in chords:
                # Upbeat stabs (every 0.5 beat starting at 0.5)
                for offset in [0.5, 1.5, 2.5, 3.5]:
                    if offset < duration:
                        for pitch in chord.get_notes():
                            notes.append(MIDINote(
                                pitch=pitch,
                                start_time=start_beat + offset,
                                duration=0.25,  # Short stabs
                                velocity=random.randint(95, 110)
                            ))

        elif voicing == "pads":
            # Sustained pads
            for chord, start_beat, duration in chords:
                for pitch in chord.get_notes():
                    notes.append(MIDINote(
                        pitch=pitch,
                        start_time=start_beat,
                        duration=duration,
                        velocity=random.randint(70, 85)
                    ))

        return notes

    def generate_walking_bass(
        self,
        chord_progression: List[Chord],
        style: Literal["jazz", "house", "techno"] = "house",
        bars: int = 8
    ) -> List[MIDINote]:
        """
        Generate walking bass line following chord progression.

        Args:
            chord_progression: List of chords to follow
            style: Bass style (jazz=chromatic approach, house=root-fifth, techno=syncopated)
            bars: Number of bars

        Returns:
            List of MIDI notes
        """
        notes = []
        beats_per_chord = (bars * 4) / len(chord_progression)

        for i, chord in enumerate(chord_progression):
            start_beat = i * beats_per_chord
            root = chord.get_notes()[0] - 24  # Two octaves lower

            if style == "jazz":
                # Chromatic approach tones
                pattern = [
                    (0, root),  # Root
                    (1, root + 7),  # Fifth
                    (2, root + 5),  # Fourth
                    (3, root + 6),  # Chromatic approach to next root
                ]

            elif style == "house":
                # Classic root-fifth pattern
                pattern = [
                    (0, root),  # Root on downbeat
                    (2, root + 7),  # Fifth on beat 3
                ]

            elif style == "techno":
                # Syncopated, aggressive
                pattern = [
                    (0, root),
                    (0.5, root + 12),  # Octave jump (off-beat)
                    (1.5, root + 7),  # Fifth
                    (2.5, root),  # Back to root
                    (3, root - 5),  # Fourth below
                ]

            else:
                pattern = [(0, root), (2, root + 7)]

            for offset, pitch in pattern:
                if offset < beats_per_chord:
                    notes.append(MIDINote(
                        pitch=pitch,
                        start_time=start_beat + offset,
                        duration=0.9,  # Slightly detached
                        velocity=random.randint(100, 115)
                    ))

        return notes

    def generate_arpeggios(
        self,
        chords: List[Chord],
        pattern: Literal["up", "down", "updown", "random", "pingpong"] = "up",
        speed: float = 0.25,  # Note duration in beats (0.25 = 16th notes)
        octaves: int = 2,
        bars: int = 4
    ) -> List[MIDINote]:
        """
        Generate arpeggios from chord progression.

        Args:
            chords: Chord progression
            pattern: Arpeggio pattern
            speed: Note speed (0.25 = 16th, 0.5 = 8th)
            octaves: Number of octaves to span
            bars: Number of bars

        Returns:
            List of MIDI notes
        """
        notes = []
        beats_per_chord = (bars * 4) / len(chords)

        for i, chord in enumerate(chords):
            start_beat = i * beats_per_chord
            chord_notes = chord.get_notes()

            # Extend to multiple octaves
            extended_notes = []
            for oct in range(octaves):
                extended_notes.extend([n + (12 * oct) for n in chord_notes])

            # Apply pattern
            if pattern == "up":
                arp_sequence = extended_notes
            elif pattern == "down":
                arp_sequence = extended_notes[::-1]
            elif pattern == "updown":
                arp_sequence = extended_notes + extended_notes[-2:0:-1]
            elif pattern == "pingpong":
                arp_sequence = extended_notes + extended_notes[::-1]
            elif pattern == "random":
                arp_sequence = extended_notes.copy()
                random.shuffle(arp_sequence)
            else:
                arp_sequence = extended_notes

            # Generate notes
            current_beat = start_beat
            idx = 0
            while current_beat < start_beat + beats_per_chord:
                pitch = arp_sequence[idx % len(arp_sequence)]
                notes.append(MIDINote(
                    pitch=pitch,
                    start_time=current_beat,
                    duration=speed * 0.8,  # Slightly shorter for detached feel
                    velocity=random.randint(85, 105)
                ))
                current_beat += speed
                idx += 1

        return notes

    def generate_drum_variations(
        self,
        seed_pattern: List[MIDINote],
        num_variations: int = 8
    ) -> List[List[MIDINote]]:
        """
        Create variations from seed drum pattern.

        Args:
            seed_pattern: Original drum pattern
            num_variations: Number of variations to create

        Returns:
            List of variations (each is a list of MIDI notes)
        """
        variations = []

        for var_idx in range(num_variations):
            variation = []

            for note in seed_pattern:
                # Variation techniques
                if var_idx == 0:
                    # Sparse: Remove some kick hits
                    if note.pitch == 36 and random.random() < 0.3:  # Kick
                        continue

                elif var_idx == 1:
                    # Add ghost snares
                    if note.pitch == 38:  # Snare
                        variation.append(note)
                        if random.random() < 0.4:
                            ghost = MIDINote(
                                pitch=note.pitch,
                                start_time=note.start_time + 0.125,
                                duration=0.1,
                                velocity=random.randint(40, 60)  # Quiet ghost note
                            )
                            variation.append(ghost)
                        continue

                elif var_idx == 2:
                    # Shuffle hi-hats (micro-timing shift)
                    if note.pitch == 42:  # Closed hi-hat
                        note.start_time += random.uniform(-0.05, 0.05)

                elif var_idx == 3:
                    # Velocity dynamics (crescendo)
                    progress = note.start_time / 16.0  # Assuming 4-bar pattern
                    note.velocity = int(60 + (progress * 60))  # 60 to 120

                elif var_idx == 4:
                    # Half-time feel
                    if note.pitch == 38:  # Snare
                        note.start_time *= 0.5

                variation.append(note)

            variations.append(variation)

        return variations

    def humanize_midi(
        self,
        notes: List[MIDINote],
        timing_variance_ms: float = 20,
        velocity_variance: int = 10
    ) -> List[MIDINote]:
        """
        Add human feel to MIDI notes.

        Args:
            notes: MIDI notes to humanize
            timing_variance_ms: Timing variance in milliseconds
            velocity_variance: Velocity variance (±units)

        Returns:
            Humanized MIDI notes
        """
        # Convert ms to beats (assuming 125 BPM = 480ms per beat)
        ms_per_beat = 60000 / self.tempo
        timing_variance_beats = timing_variance_ms / ms_per_beat

        humanized = []
        for note in notes:
            # Timing variance
            timing_offset = random.uniform(-timing_variance_beats, timing_variance_beats)

            # Velocity variance
            velocity_offset = random.randint(-velocity_variance, velocity_variance)
            new_velocity = max(1, min(127, note.velocity + velocity_offset))

            # Note length micro-variation
            duration_variance = random.uniform(-0.05, 0.05)
            new_duration = max(0.05, note.duration + duration_variance)

            humanized.append(MIDINote(
                pitch=note.pitch,
                start_time=note.start_time + timing_offset,
                duration=new_duration,
                velocity=new_velocity,
                mute=note.mute
            ))

        return humanized

    # ========================================================================
    # Helper Methods
    # ========================================================================

    def _roman_to_chord(self, roman_numeral: str, seventh: bool = True) -> Chord:
        """Convert Roman numeral to Chord object."""
        # Determine scale degree (1-7)
        numeral_map = {
            "i": 0, "I": 0, "ii": 1, "II": 1, "iii": 2, "III": 2,
            "iv": 3, "IV": 3, "v": 4, "V": 4, "vi": 5, "VI": 5,
            "vii": 6, "VII": 6, "bII": 1, "bVII": 6
        }

        degree = numeral_map.get(roman_numeral, 0)

        # Get root note from scale
        root = self.scale_notes[degree % len(self.scale_notes)]

        # Determine chord type
        mode = "minor" if self.is_minor else "major"
        chord_type = SCALE_DEGREE_CHORDS[mode].get(roman_numeral, "major")

        # Use 7th chords if requested
        if seventh:
            if chord_type == "major":
                chord_type = "maj7"
            elif chord_type == "minor":
                chord_type = "min7"

        return Chord(root=root, chord_type=chord_type, octave=3)


# ============================================================================
# Standalone Functions (for API convenience)
# ============================================================================

def generate_chord_progression(
    key: str = "10B",
    progression_type: str = "i-VI-III-VII",
    bars: int = 8,
    voicing: str = "stabs",
    seventh_chords: bool = True,
    tempo: float = 125
) -> List[Dict[str, Any]]:
    """
    Generate chord progression.

    Returns:
        List of MIDI note dictionaries (Max for Live compatible)
    """
    gen = AdvancedMIDIGenerator(key=key, tempo=tempo)
    notes = gen.generate_chord_progression(
        progression_type=progression_type,
        bars=bars,
        voicing=voicing,
        seventh_chords=seventh_chords
    )
    return [n.to_dict() for n in notes]


def generate_walking_bass(
    key: str = "10B",
    chord_progression_type: str = "i-VI-III-VII",
    style: str = "house",
    bars: int = 8,
    tempo: float = 125
) -> List[Dict[str, Any]]:
    """
    Generate walking bass line.

    Returns:
        List of MIDI note dictionaries
    """
    gen = AdvancedMIDIGenerator(key=key, tempo=tempo)

    # First generate chord progression to follow
    prog_def = PROGRESSIONS.get(chord_progression_type, PROGRESSIONS["i-VI-III-VII"])
    chords = [gen._roman_to_chord(rn) for rn in prog_def["pattern"]]

    notes = gen.generate_walking_bass(
        chord_progression=chords,
        style=style,
        bars=bars
    )
    return [n.to_dict() for n in notes]


def generate_arpeggios(
    key: str = "10B",
    chord_progression_type: str = "i-VI-III-VII",
    pattern: str = "up",
    speed: float = 0.25,
    octaves: int = 2,
    bars: int = 4,
    tempo: float = 125
) -> List[Dict[str, Any]]:
    """
    Generate arpeggios.

    Returns:
        List of MIDI note dictionaries
    """
    gen = AdvancedMIDIGenerator(key=key, tempo=tempo)

    # Generate chord progression to arpeggiate
    prog_def = PROGRESSIONS.get(chord_progression_type, PROGRESSIONS["i-VI-III-VII"])
    chords = [gen._roman_to_chord(rn) for rn in prog_def["pattern"]]

    notes = gen.generate_arpeggios(
        chords=chords,
        pattern=pattern,
        speed=speed,
        octaves=octaves,
        bars=bars
    )
    return [n.to_dict() for n in notes]


def generate_drum_variations(
    seed_pattern: List[Dict[str, Any]],
    num_variations: int = 8
) -> List[List[Dict[str, Any]]]:
    """
    Generate drum variations from seed pattern.

    Args:
        seed_pattern: Original MIDI notes as dictionaries
        num_variations: Number of variations

    Returns:
        List of variations (each is a list of MIDI note dicts)
    """
    # Convert dicts to MIDINote objects
    seed_notes = [
        MIDINote(
            pitch=n["pitch"],
            start_time=n["start_time"],
            duration=n["duration"],
            velocity=n["velocity"],
            mute=n.get("mute", 0)
        )
        for n in seed_pattern
    ]

    gen = AdvancedMIDIGenerator()
    variations = gen.generate_drum_variations(seed_notes, num_variations)

    # Convert back to dicts
    return [[n.to_dict() for n in var] for var in variations]


def humanize_midi(
    notes: List[Dict[str, Any]],
    timing_variance_ms: float = 20,
    velocity_variance: int = 10,
    tempo: float = 125
) -> List[Dict[str, Any]]:
    """
    Add human feel to MIDI notes.

    Args:
        notes: MIDI notes as dictionaries
        timing_variance_ms: Timing variance in milliseconds
        velocity_variance: Velocity variance (±units)
        tempo: BPM for timing calculations

    Returns:
        Humanized MIDI notes as dictionaries
    """
    # Convert dicts to MIDINote objects
    midi_notes = [
        MIDINote(
            pitch=n["pitch"],
            start_time=n["start_time"],
            duration=n["duration"],
            velocity=n["velocity"],
            mute=n.get("mute", 0)
        )
        for n in notes
    ]

    gen = AdvancedMIDIGenerator(tempo=tempo)
    humanized = gen.humanize_midi(midi_notes, timing_variance_ms, velocity_variance)

    return [n.to_dict() for n in humanized]
