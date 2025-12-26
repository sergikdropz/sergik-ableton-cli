"""
Generation Service

Orchestrates MIDI and drum generation.
"""

from typing import Dict, Any, List, Optional
import logging

from .base import BaseService
from ..generators.midi_advanced import (
    generate_chord_progression,
    generate_walking_bass,
    generate_arpeggios,
    generate_drum_variations,
    humanize_midi,
)
from ..generators.drum_generator import DrumGenerator
from ..utils.errors import GenerationError, ValidationError
from ..utils.validators import validate_tempo_range, validate_key

logger = logging.getLogger(__name__)


class GenerationService(BaseService):
    """Service for music generation operations."""
    
    def __init__(self):
        """Initialize generation service."""
        super().__init__()
        self.drum_generator = DrumGenerator()
    
    def generate_chords(
        self,
        key: str = "10B",
        progression_type: str = "i-VI-III-VII",
        bars: int = 8,
        voicing: str = "stabs",
        seventh_chords: bool = True,
        tempo: float = 125.0
    ) -> List[Dict[str, Any]]:
        """
        Generate chord progression.
        
        Args:
            key: Musical key (Camelot or standard notation)
            progression_type: Chord progression pattern
            bars: Number of bars
            voicing: Voicing type ("stabs" or "pads")
            seventh_chords: Whether to use seventh chords
            tempo: Tempo in BPM
            
        Returns:
            List of MIDI notes
            
        Raises:
            GenerationError: If generation fails
        """
        try:
            validate_key(key)
            validate_tempo_range(tempo)
            
            notes = generate_chord_progression(
                key=key,
                progression_type=progression_type,
                bars=bars,
                voicing=voicing,
                seventh_chords=seventh_chords,
                tempo=tempo
            )
            
            self.logger.info(f"Generated {len(notes)} chord notes in {key}")
            return notes
            
        except Exception as e:
            self.logger.error(f"Chord generation failed: {e}")
            raise GenerationError(f"Chord generation failed: {e}")
    
    def generate_bass(
        self,
        key: str = "10B",
        chord_progression_type: str = "i-VI-III-VII",
        style: str = "house",
        bars: int = 8,
        tempo: float = 125.0
    ) -> List[Dict[str, Any]]:
        """
        Generate walking bass line.
        
        Args:
            key: Musical key
            chord_progression_type: Chord progression pattern
            style: Bass style ("jazz", "house", "techno")
            bars: Number of bars
            tempo: Tempo in BPM
            
        Returns:
            List of MIDI notes
            
        Raises:
            GenerationError: If generation fails
        """
        try:
            validate_key(key)
            validate_tempo_range(tempo)
            
            notes = generate_walking_bass(
                key=key,
                chord_progression_type=chord_progression_type,
                style=style,
                bars=bars,
                tempo=tempo
            )
            
            self.logger.info(f"Generated {len(notes)} bass notes ({style} style)")
            return notes
            
        except Exception as e:
            self.logger.error(f"Bass generation failed: {e}")
            raise GenerationError(f"Bass generation failed: {e}")
    
    def generate_arpeggios(
        self,
        key: str = "10B",
        chord_progression_type: str = "i-VI-III-VII",
        pattern: str = "up",
        speed: float = 0.25,
        octaves: int = 2,
        bars: int = 4,
        tempo: float = 125.0
    ) -> List[Dict[str, Any]]:
        """
        Generate arpeggios.
        
        Args:
            key: Musical key
            chord_progression_type: Chord progression pattern
            pattern: Arpeggio pattern ("up", "down", "updown", "random", "pingpong")
            speed: Note speed in beats
            octaves: Number of octaves
            bars: Number of bars
            tempo: Tempo in BPM
            
        Returns:
            List of MIDI notes
            
        Raises:
            GenerationError: If generation fails
        """
        try:
            validate_key(key)
            validate_tempo_range(tempo)
            
            notes = generate_arpeggios(
                key=key,
                chord_progression_type=chord_progression_type,
                pattern=pattern,
                speed=speed,
                octaves=octaves,
                bars=bars,
                tempo=tempo
            )
            
            self.logger.info(f"Generated {len(notes)} arpeggio notes ({pattern} pattern)")
            return notes
            
        except Exception as e:
            self.logger.error(f"Arpeggio generation failed: {e}")
            raise GenerationError(f"Arpeggio generation failed: {e}")
    
    def generate_drums(
        self,
        genre: str = "house",
        bars: int = 4,
        tempo: float = 125.0,
        swing: float = 0.0,
        humanize: float = 0.0,
        density: float = 1.0,
        output_format: str = "midi"
    ) -> Dict[str, Any]:
        """
        Generate drum pattern.
        
        Args:
            genre: Drum genre
            bars: Number of bars
            tempo: Tempo in BPM
            swing: Swing amount (0-100)
            humanize: Humanization amount (0-100)
            density: Pattern density multiplier
            output_format: Output format ("midi" or "audio")
            
        Returns:
            Dictionary with generated pattern data
            
        Raises:
            GenerationError: If generation fails
        """
        try:
            validate_tempo_range(tempo)
            
            pattern = self.drum_generator.generate_pattern(
                genre=genre,
                bars=bars,
                tempo=tempo,
                swing=swing,
                humanize=humanize,
                density=density
            )
            
            if output_format == "audio":
                # Generate audio (would need sample library)
                audio_path = self.drum_generator.render_to_audio(pattern)
                return {
                    "pattern": pattern.to_dict(),
                    "audio_path": audio_path,
                    "format": "audio"
                }
            else:
                return {
                    "pattern": pattern.to_dict(),
                    "format": "midi"
                }
                
        except Exception as e:
            self.logger.error(f"Drum generation failed: {e}")
            raise GenerationError(f"Drum generation failed: {e}")
    
    def generate_drum_variations(
        self,
        seed_pattern: List[Dict[str, Any]],
        num_variations: int = 8
    ) -> List[Dict[str, Any]]:
        """
        Generate drum variations from seed pattern.
        
        Args:
            seed_pattern: Seed MIDI pattern
            num_variations: Number of variations to generate
            
        Returns:
            List of variation patterns
            
        Raises:
            GenerationError: If generation fails
        """
        try:
            variations = generate_drum_variations(
                seed_pattern=seed_pattern,
                num_variations=num_variations
            )
            
            self.logger.info(f"Generated {len(variations)} drum variations")
            return variations
            
        except Exception as e:
            self.logger.error(f"Drum variation generation failed: {e}")
            raise GenerationError(f"Drum variation generation failed: {e}")
    
    def humanize_midi(
        self,
        notes: List[Dict[str, Any]],
        timing_variance_ms: float = 20.0,
        velocity_variance: int = 10,
        tempo: float = 125.0
    ) -> List[Dict[str, Any]]:
        """
        Add human feel to MIDI notes.
        
        Args:
            notes: List of MIDI notes to humanize
            timing_variance_ms: Timing variance in milliseconds
            velocity_variance: Velocity variance amount
            tempo: Tempo in BPM
            
        Returns:
            Humanized MIDI notes
            
        Raises:
            GenerationError: If humanization fails
        """
        try:
            validate_tempo_range(tempo)
            
            humanized = humanize_midi(
                notes=notes,
                timing_variance_ms=timing_variance_ms,
                velocity_variance=velocity_variance,
                tempo=tempo
            )
            
            self.logger.info(f"Humanized {len(humanized)} MIDI notes")
            return humanized
            
        except Exception as e:
            self.logger.error(f"MIDI humanization failed: {e}")
            raise GenerationError(f"MIDI humanization failed: {e}")

