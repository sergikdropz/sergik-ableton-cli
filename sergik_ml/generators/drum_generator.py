"""
================================================================================
SERGIK AI Drum Generator
================================================================================

Comprehensive drum generation with:
- MIDI pattern generation by genre
- Audio drum generation (WAV export)
- Sample library scanning and indexing
- Drum rack preset creation
- Human feel and groove templates

Supported Genres:
- House (classic, deep, tech)
- Techno (minimal, hard, industrial)
- Hip-Hop (boom bap, trap, lo-fi)
- Breakbeat (jungle, DnB)
- Reggaeton / Dembow
- Ambient / Downtempo

Author: SERGIK AI
Version: 1.0
================================================================================
"""

import os
import json
import random
import hashlib
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Literal
from dataclasses import dataclass, field, asdict
from enum import Enum
import wave
import struct

logger = logging.getLogger(__name__)

# ============================================================================
# Constants & Configuration
# ============================================================================

# Standard GM Drum Map (MIDI notes)
GM_DRUM_MAP = {
    "kick": 36,
    "kick_alt": 35,
    "snare": 38,
    "snare_rim": 37,
    "snare_alt": 40,
    "clap": 39,
    "closed_hat": 42,
    "open_hat": 46,
    "pedal_hat": 44,
    "crash": 49,
    "ride": 51,
    "ride_bell": 53,
    "tom_low": 45,
    "tom_mid": 47,
    "tom_high": 50,
    "floor_tom": 41,
    "tambourine": 54,
    "cowbell": 56,
    "conga_high": 63,
    "conga_low": 64,
    "bongo_high": 60,
    "bongo_low": 61,
    "shaker": 70,
    "maracas": 70,
    "clave": 75,
    "wood_block": 76,
    "808_kick": 36,
    "808_snare": 38,
    "808_hat": 42,
    "808_clap": 39,
    "808_tom": 45,
    "808_cymbal": 49,
    "perc_1": 67,
    "perc_2": 68,
}

# Genre-specific velocity ranges
GENRE_VELOCITY = {
    "house": {"kick": (100, 120), "snare": (90, 115), "hat": (70, 100)},
    "techno": {"kick": (110, 127), "snare": (100, 120), "hat": (60, 90)},
    "hiphop": {"kick": (100, 127), "snare": (95, 120), "hat": (50, 85)},
    "trap": {"kick": (110, 127), "snare": (100, 125), "hat": (40, 80)},
    "dnb": {"kick": (105, 125), "snare": (100, 120), "hat": (65, 95)},
    "ambient": {"kick": (60, 90), "snare": (50, 80), "hat": (40, 70)},
}

# Sample file extensions
AUDIO_EXTENSIONS = {".wav", ".aif", ".aiff", ".mp3", ".flac", ".ogg"}


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class DrumHit:
    """Single drum hit."""
    instrument: str
    pitch: int
    start_time: float  # In beats
    duration: float
    velocity: int
    mute: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass 
class DrumPattern:
    """Complete drum pattern."""
    name: str
    genre: str
    tempo: float
    bars: int
    time_signature: Tuple[int, int] = (4, 4)
    hits: List[DrumHit] = field(default_factory=list)
    swing: float = 0.0  # 0-100%
    humanize: float = 0.0  # 0-100%
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "genre": self.genre,
            "tempo": self.tempo,
            "bars": self.bars,
            "time_signature": list(self.time_signature),
            "hits": [h.to_dict() for h in self.hits],
            "swing": self.swing,
            "humanize": self.humanize,
        }
    
    def to_midi_notes(self) -> List[Dict[str, Any]]:
        """Convert to MIDI note format."""
        return [h.to_dict() for h in self.hits]


@dataclass
class Sample:
    """Audio sample metadata."""
    path: str
    name: str
    category: str  # kick, snare, hat, etc.
    subcategory: Optional[str] = None  # acoustic, 808, etc.
    duration: float = 0.0
    sample_rate: int = 44100
    channels: int = 2
    bit_depth: int = 16
    tags: List[str] = field(default_factory=list)
    checksum: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SampleLibrary:
    """Collection of samples."""
    name: str
    path: str
    samples: Dict[str, List[Sample]] = field(default_factory=dict)  # category -> samples
    total_count: int = 0
    
    def get_samples(self, category: str) -> List[Sample]:
        return self.samples.get(category, [])
    
    def get_random_sample(self, category: str) -> Optional[Sample]:
        samples = self.get_samples(category)
        return random.choice(samples) if samples else None


# ============================================================================
# Genre Pattern Templates
# ============================================================================

class DrumPatternTemplates:
    """Pre-defined drum pattern templates by genre."""
    
    @staticmethod
    def house_basic(bars: int = 4) -> List[Dict[str, Any]]:
        """Classic 4-on-the-floor house pattern."""
        pattern = []
        beats_per_bar = 4
        total_beats = bars * beats_per_bar
        
        for beat in range(total_beats):
            # Kick on every beat
            pattern.append({"instrument": "kick", "beat": beat, "velocity": random.randint(105, 120)})
            
            # Snare/clap on 2 and 4
            if beat % 4 in [1, 3]:
                pattern.append({"instrument": "clap", "beat": beat, "velocity": random.randint(95, 115)})
            
            # Closed hat on every 8th
            for eighth in [0, 0.5]:
                pattern.append({"instrument": "closed_hat", "beat": beat + eighth, "velocity": random.randint(70, 95)})
            
            # Open hat on offbeats occasionally
            if beat % 2 == 0 and random.random() < 0.3:
                pattern.append({"instrument": "open_hat", "beat": beat + 0.5, "velocity": random.randint(60, 85)})
        
        return pattern
    
    @staticmethod
    def tech_house(bars: int = 4) -> List[Dict[str, Any]]:
        """Tech house with syncopated hats and percs."""
        pattern = []
        beats_per_bar = 4
        total_beats = bars * beats_per_bar
        
        for beat in range(total_beats):
            # Kick on every beat
            pattern.append({"instrument": "kick", "beat": beat, "velocity": random.randint(110, 125)})
            
            # Clap on 2 and 4
            if beat % 4 in [1, 3]:
                pattern.append({"instrument": "clap", "beat": beat, "velocity": random.randint(100, 118)})
            
            # 16th note hats with velocity variation
            for sixteenth in [0, 0.25, 0.5, 0.75]:
                vel = random.randint(50, 70) if sixteenth in [0.25, 0.75] else random.randint(75, 95)
                pattern.append({"instrument": "closed_hat", "beat": beat + sixteenth, "velocity": vel})
            
            # Shaker/perc layers
            if random.random() < 0.4:
                pattern.append({"instrument": "shaker", "beat": beat + 0.25, "velocity": random.randint(40, 60)})
            
            # Rimshot fills
            if beat % 8 == 7 and random.random() < 0.5:
                pattern.append({"instrument": "snare_rim", "beat": beat + 0.75, "velocity": random.randint(70, 90)})
        
        return pattern
    
    @staticmethod
    def techno_minimal(bars: int = 4) -> List[Dict[str, Any]]:
        """Minimal techno with sparse elements."""
        pattern = []
        beats_per_bar = 4
        total_beats = bars * beats_per_bar
        
        for beat in range(total_beats):
            # Kick on every beat (hard)
            pattern.append({"instrument": "kick", "beat": beat, "velocity": random.randint(115, 127)})
            
            # Sparse claps
            if beat % 8 in [3, 7]:
                pattern.append({"instrument": "clap", "beat": beat, "velocity": random.randint(100, 120)})
            
            # Hypnotic hi-hat pattern
            for sixteenth in [0.25, 0.75]:
                pattern.append({"instrument": "closed_hat", "beat": beat + sixteenth, "velocity": random.randint(60, 85)})
            
            # Occasional ride
            if beat % 4 == 0 and random.random() < 0.3:
                pattern.append({"instrument": "ride", "beat": beat, "velocity": random.randint(50, 70)})
        
        return pattern
    
    @staticmethod
    def hiphop_boom_bap(bars: int = 4) -> List[Dict[str, Any]]:
        """Classic boom bap hip-hop pattern."""
        pattern = []
        beats_per_bar = 4
        total_beats = bars * beats_per_bar
        
        for beat in range(total_beats):
            bar_beat = beat % 4
            
            # Kick pattern (boom)
            if bar_beat in [0, 2.5]:
                pattern.append({"instrument": "kick", "beat": beat + (0.5 if bar_beat == 2.5 else 0), "velocity": random.randint(105, 120)})
            if bar_beat == 2 and random.random() < 0.3:
                pattern.append({"instrument": "kick", "beat": beat, "velocity": random.randint(90, 105)})
            
            # Snare on 2 and 4 (bap)
            if bar_beat in [1, 3]:
                pattern.append({"instrument": "snare", "beat": beat, "velocity": random.randint(100, 120)})
            
            # Swung hi-hats
            for eighth in [0, 0.5]:
                if not (bar_beat in [1, 3] and eighth == 0):  # Avoid hat on snare
                    swing_offset = 0.08 if eighth == 0.5 else 0  # Swing the offbeats
                    pattern.append({"instrument": "closed_hat", "beat": beat + eighth + swing_offset, "velocity": random.randint(55, 80)})
        
        return pattern
    
    @staticmethod
    def trap_808(bars: int = 4) -> List[Dict[str, Any]]:
        """Modern trap with 808s and hi-hat rolls."""
        pattern = []
        beats_per_bar = 4
        total_beats = bars * beats_per_bar
        
        for beat in range(total_beats):
            bar_beat = beat % 4
            
            # 808 kick (sparse, hard)
            if bar_beat == 0:
                pattern.append({"instrument": "808_kick", "beat": beat, "velocity": random.randint(115, 127)})
            if bar_beat == 2 and random.random() < 0.6:
                pattern.append({"instrument": "808_kick", "beat": beat + 0.5, "velocity": random.randint(100, 120)})
            
            # Snare/clap on 2 and 4
            if bar_beat in [1, 3]:
                pattern.append({"instrument": "808_snare", "beat": beat, "velocity": random.randint(110, 125)})
            
            # Hi-hat rolls (32nd notes with velocity ramps)
            if bar_beat in [0, 2]:
                # Regular 16ths
                for sixteenth in [0, 0.25, 0.5, 0.75]:
                    pattern.append({"instrument": "closed_hat", "beat": beat + sixteenth, "velocity": random.randint(50, 80)})
            else:
                # Rolls on beats 2 and 4
                for thirtysecond in [i * 0.125 for i in range(8)]:
                    vel = int(40 + (thirtysecond / 0.875) * 60)  # Velocity ramp
                    pattern.append({"instrument": "closed_hat", "beat": beat + thirtysecond, "velocity": vel})
            
            # Open hat accents
            if bar_beat == 3 and random.random() < 0.4:
                pattern.append({"instrument": "open_hat", "beat": beat + 0.5, "velocity": random.randint(70, 95)})
        
        return pattern
    
    @staticmethod
    def dnb_jungle(bars: int = 4) -> List[Dict[str, Any]]:
        """Drum and bass / jungle breakbeat pattern."""
        pattern = []
        beats_per_bar = 4
        total_beats = bars * beats_per_bar
        
        # DnB typically at 170-180 BPM, 2-step feel
        for beat in range(total_beats):
            bar_beat = beat % 4
            
            # Kick on 1 and the "and" of 2
            if bar_beat == 0:
                pattern.append({"instrument": "kick", "beat": beat, "velocity": random.randint(110, 125)})
            if bar_beat == 1:
                pattern.append({"instrument": "kick", "beat": beat + 0.5, "velocity": random.randint(100, 115)})
            
            # Snare on 2 and 4
            if bar_beat in [1, 3]:
                pattern.append({"instrument": "snare", "beat": beat, "velocity": random.randint(105, 120)})
            
            # Ghost snares
            if random.random() < 0.3:
                pattern.append({"instrument": "snare", "beat": beat + 0.75, "velocity": random.randint(40, 60)})
            
            # Fast hi-hats
            for sixteenth in [0, 0.25, 0.5, 0.75]:
                pattern.append({"instrument": "closed_hat", "beat": beat + sixteenth, "velocity": random.randint(60, 90)})
        
        return pattern
    
    @staticmethod
    def reggaeton_dembow(bars: int = 4) -> List[Dict[str, Any]]:
        """Reggaeton dembow rhythm."""
        pattern = []
        beats_per_bar = 4
        total_beats = bars * beats_per_bar
        
        for beat in range(total_beats):
            bar_beat = beat % 4
            
            # Kick on 1 and 3
            if bar_beat in [0, 2]:
                pattern.append({"instrument": "kick", "beat": beat, "velocity": random.randint(110, 125)})
            
            # Snare on every beat (dembow signature)
            pattern.append({"instrument": "snare", "beat": beat, "velocity": random.randint(90, 110)})
            
            # Snare on the "and" of beats 2 and 4 (the bounce)
            if bar_beat in [1, 3]:
                pattern.append({"instrument": "snare", "beat": beat + 0.5, "velocity": random.randint(85, 105)})
            
            # Hi-hats
            for sixteenth in [0, 0.25, 0.5, 0.75]:
                pattern.append({"instrument": "closed_hat", "beat": beat + sixteenth, "velocity": random.randint(50, 75)})
        
        return pattern
    
    @staticmethod
    def ambient_downtempo(bars: int = 4) -> List[Dict[str, Any]]:
        """Sparse ambient/downtempo pattern."""
        pattern = []
        beats_per_bar = 4
        total_beats = bars * beats_per_bar
        
        for beat in range(total_beats):
            bar_beat = beat % 4
            
            # Sparse kick
            if bar_beat == 0 and random.random() < 0.7:
                pattern.append({"instrument": "kick", "beat": beat, "velocity": random.randint(70, 95)})
            if bar_beat == 2 and random.random() < 0.4:
                pattern.append({"instrument": "kick", "beat": beat + 0.5, "velocity": random.randint(60, 85)})
            
            # Soft snare/rim
            if bar_beat == 2 and random.random() < 0.6:
                pattern.append({"instrument": "snare_rim", "beat": beat, "velocity": random.randint(50, 75)})
            
            # Gentle hats
            if random.random() < 0.5:
                pattern.append({"instrument": "closed_hat", "beat": beat + random.choice([0, 0.25, 0.5, 0.75]), "velocity": random.randint(35, 60)})
            
            # Occasional shaker
            if random.random() < 0.2:
                pattern.append({"instrument": "shaker", "beat": beat + 0.5, "velocity": random.randint(30, 50)})
        
        return pattern


# ============================================================================
# Drum Pattern Generator
# ============================================================================

class DrumGenerator:
    """
    Main drum pattern generator.
    
    Supports MIDI and audio output with multiple genres.
    """
    
    GENRE_TEMPLATES = {
        "house": DrumPatternTemplates.house_basic,
        "tech_house": DrumPatternTemplates.tech_house,
        "techno": DrumPatternTemplates.techno_minimal,
        "hiphop": DrumPatternTemplates.hiphop_boom_bap,
        "boom_bap": DrumPatternTemplates.hiphop_boom_bap,
        "trap": DrumPatternTemplates.trap_808,
        "dnb": DrumPatternTemplates.dnb_jungle,
        "jungle": DrumPatternTemplates.dnb_jungle,
        "reggaeton": DrumPatternTemplates.reggaeton_dembow,
        "dembow": DrumPatternTemplates.reggaeton_dembow,
        "ambient": DrumPatternTemplates.ambient_downtempo,
        "downtempo": DrumPatternTemplates.ambient_downtempo,
        "lo_fi": DrumPatternTemplates.hiphop_boom_bap,
    }
    
    def __init__(self, sample_library: Optional[SampleLibrary] = None):
        """Initialize generator."""
        self.sample_library = sample_library
        self.templates = DrumPatternTemplates()
    
    def generate_pattern(
        self,
        genre: str = "house",
        bars: int = 4,
        tempo: float = 125.0,
        swing: float = 0.0,
        humanize: float = 0.0,
        density: float = 1.0,  # 0.0-2.0, affects pattern density
    ) -> DrumPattern:
        """
        Generate a drum pattern.
        
        Args:
            genre: Genre style (house, techno, trap, etc.)
            bars: Number of bars
            tempo: BPM
            swing: Swing amount (0-100%)
            humanize: Humanization amount (0-100%)
            density: Pattern density multiplier
            
        Returns:
            DrumPattern object
        """
        # Get template function
        genre_lower = genre.lower().replace("-", "_").replace(" ", "_")
        template_func = self.GENRE_TEMPLATES.get(genre_lower, DrumPatternTemplates.house_basic)
        
        # Generate base pattern
        raw_pattern = template_func(bars)
        
        # Apply density filter
        if density < 1.0:
            raw_pattern = [h for h in raw_pattern if random.random() < density]
        elif density > 1.0:
            # Add extra hits
            extra_hits = []
            for hit in raw_pattern:
                if random.random() < (density - 1.0) * 0.5:
                    extra_hit = hit.copy()
                    extra_hit["beat"] += random.choice([0.25, -0.25, 0.5])
                    extra_hit["velocity"] = int(extra_hit["velocity"] * 0.7)
                    extra_hits.append(extra_hit)
            raw_pattern.extend(extra_hits)
        
        # Convert to DrumHit objects
        hits = []
        for hit_data in raw_pattern:
            instrument = hit_data["instrument"]
            pitch = GM_DRUM_MAP.get(instrument, 36)
            beat = hit_data["beat"]
            velocity = hit_data.get("velocity", 100)
            
            # Apply swing
            if swing > 0:
                # Swing affects offbeats
                beat_frac = beat % 1
                if 0.4 < beat_frac < 0.6:  # Is an offbeat
                    swing_offset = (swing / 100) * 0.15  # Max 15% of a beat
                    beat += swing_offset
            
            # Apply humanization
            if humanize > 0:
                timing_var = (humanize / 100) * 0.05  # Max 5% timing variance
                velocity_var = int((humanize / 100) * 15)  # Max ±15 velocity
                
                beat += random.uniform(-timing_var, timing_var)
                velocity = max(1, min(127, velocity + random.randint(-velocity_var, velocity_var)))
            
            hits.append(DrumHit(
                instrument=instrument,
                pitch=pitch,
                start_time=max(0, beat),
                duration=0.25,  # Standard hit duration
                velocity=velocity
            ))
        
        # Sort by time
        hits.sort(key=lambda h: h.start_time)
        
        return DrumPattern(
            name=f"{genre}_{bars}bar",
            genre=genre,
            tempo=tempo,
            bars=bars,
            hits=hits,
            swing=swing,
            humanize=humanize
        )
    
    def generate_midi_data(
        self,
        pattern: DrumPattern
    ) -> List[Dict[str, Any]]:
        """
        Convert pattern to MIDI note format.
        
        Returns:
            List of MIDI notes in Max for Live format
        """
        return [
            {
                "pitch": hit.pitch,
                "start_time": hit.start_time,
                "duration": hit.duration,
                "velocity": hit.velocity,
                "mute": hit.mute
            }
            for hit in pattern.hits
        ]
    
    def generate_fill(
        self,
        genre: str = "house",
        length_beats: float = 2.0,
        intensity: float = 1.0
    ) -> List[DrumHit]:
        """
        Generate a drum fill.
        
        Args:
            genre: Genre style
            length_beats: Fill length in beats
            intensity: Fill intensity (0.5-2.0)
            
        Returns:
            List of DrumHit objects
        """
        fills = {
            "house": ["snare", "tom_high", "tom_mid", "tom_low"],
            "techno": ["snare", "clap", "tom_high"],
            "hiphop": ["snare", "tom_mid", "tom_low", "crash"],
            "trap": ["snare", "808_tom", "crash"],
            "dnb": ["snare", "tom_high", "tom_mid", "tom_low"],
        }
        
        fill_instruments = fills.get(genre.lower(), ["snare", "tom_high", "tom_low"])
        
        hits = []
        num_hits = int(length_beats * 4 * intensity)  # 16th notes * intensity
        
        for i in range(num_hits):
            beat = (i / num_hits) * length_beats
            instrument = random.choice(fill_instruments)
            
            # Build velocity
            velocity = int(80 + (i / num_hits) * 40 * intensity)
            velocity = min(127, velocity)
            
            hits.append(DrumHit(
                instrument=instrument,
                pitch=GM_DRUM_MAP.get(instrument, 38),
                start_time=beat,
                duration=0.1,
                velocity=velocity
            ))
        
        return hits


# ============================================================================
# Sample Library Scanner
# ============================================================================

class SampleScanner:
    """
    Scans directories for audio samples and categorizes them.
    """
    
    # Keywords for auto-categorization
    CATEGORY_KEYWORDS = {
        "kick": ["kick", "bd", "bass drum", "bassdrum", "808_kick", "kik"],
        "snare": ["snare", "sn", "snr", "sd"],
        "clap": ["clap", "clp", "handclap"],
        "closed_hat": ["hihat", "hat", "hh", "closed", "ch"],
        "open_hat": ["open", "oh", "ophat"],
        "crash": ["crash", "crs"],
        "ride": ["ride", "rd"],
        "tom": ["tom", "tm"],
        "perc": ["perc", "percussion", "shaker", "tambourine", "conga", "bongo"],
        "fx": ["fx", "effect", "noise", "sweep", "riser"],
    }
    
    def __init__(self):
        """Initialize scanner."""
        self.libraries: Dict[str, SampleLibrary] = {}
    
    def scan_directory(
        self,
        path: str,
        library_name: Optional[str] = None,
        recursive: bool = True
    ) -> SampleLibrary:
        """
        Scan directory for samples.
        
        Args:
            path: Directory path
            library_name: Name for this library
            recursive: Whether to scan subdirectories
            
        Returns:
            SampleLibrary object
        """
        path = Path(path)
        
        if not path.exists():
            logger.warning(f"Path not found: {path}")
            return SampleLibrary(name=library_name or "unknown", path=str(path))
        
        library_name = library_name or path.name
        library = SampleLibrary(name=library_name, path=str(path))
        
        # Scan for audio files
        pattern = "**/*" if recursive else "*"
        
        for file_path in path.glob(pattern):
            if file_path.suffix.lower() in AUDIO_EXTENSIONS:
                sample = self._analyze_sample(file_path)
                if sample:
                    category = sample.category
                    if category not in library.samples:
                        library.samples[category] = []
                    library.samples[category].append(sample)
                    library.total_count += 1
        
        self.libraries[library_name] = library
        logger.info(f"Scanned {library.total_count} samples in {library_name}")
        
        return library
    
    def _analyze_sample(self, file_path: Path) -> Optional[Sample]:
        """Analyze a single sample file."""
        try:
            name = file_path.stem
            
            # Auto-categorize based on filename
            category = self._categorize_sample(name, str(file_path))
            
            # Get audio info
            duration = 0.0
            sample_rate = 44100
            channels = 2
            bit_depth = 16
            
            if file_path.suffix.lower() == ".wav":
                try:
                    with wave.open(str(file_path), 'rb') as wav:
                        sample_rate = wav.getframerate()
                        channels = wav.getnchannels()
                        bit_depth = wav.getsampwidth() * 8
                        frames = wav.getnframes()
                        duration = frames / sample_rate
                except Exception:
                    pass
            
            # Generate checksum
            checksum = self._file_checksum(file_path)
            
            # Extract tags from path
            tags = self._extract_tags(file_path)
            
            return Sample(
                path=str(file_path),
                name=name,
                category=category,
                duration=duration,
                sample_rate=sample_rate,
                channels=channels,
                bit_depth=bit_depth,
                tags=tags,
                checksum=checksum
            )
            
        except Exception as e:
            logger.debug(f"Error analyzing {file_path}: {e}")
            return None
    
    def _categorize_sample(self, name: str, path: str) -> str:
        """Auto-categorize sample based on name and path."""
        combined = f"{name} {path}".lower()
        
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in combined:
                    return category
        
        return "other"
    
    def _extract_tags(self, file_path: Path) -> List[str]:
        """Extract tags from file path."""
        tags = []
        
        # Add parent folder names as tags
        parts = file_path.parts[-4:-1]  # Last 3 parent folders
        tags.extend([p.lower() for p in parts if p])
        
        # Extract common descriptors
        descriptors = ["acoustic", "electronic", "808", "analog", "digital", 
                      "vinyl", "clean", "dirty", "processed", "raw", "punchy",
                      "soft", "hard", "deep", "tight", "boomy"]
        
        name_lower = file_path.stem.lower()
        for desc in descriptors:
            if desc in name_lower:
                tags.append(desc)
        
        return list(set(tags))
    
    def _file_checksum(self, file_path: Path, block_size: int = 8192) -> str:
        """Calculate MD5 checksum of file."""
        md5 = hashlib.md5()
        try:
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(block_size), b''):
                    md5.update(chunk)
            return md5.hexdigest()[:16]  # Short checksum
        except Exception:
            return ""
    
    def scan_ableton_library(self) -> Optional[SampleLibrary]:
        """Scan default Ableton sample locations."""
        # Common Ableton paths
        ableton_paths = [
            Path.home() / "Music" / "Ableton" / "User Library" / "Samples",
            Path.home() / "Documents" / "Ableton" / "User Library" / "Samples",
            Path("/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/Core Library/Samples"),
            Path("/Applications/Ableton Live 11 Suite.app/Contents/App-Resources/Core Library/Samples"),
        ]
        
        for path in ableton_paths:
            if path.exists():
                return self.scan_directory(str(path), "Ableton Library")
        
        logger.warning("Ableton sample library not found")
        return None
    
    def discover_all_drives(self) -> List[Dict[str, Any]]:
        """
        Discover all mounted drives on the system.
        
        Returns:
            List of drive info dictionaries
        """
        import subprocess
        import platform
        
        drives = []
        
        if platform.system() == "Darwin":  # macOS
            # List all mounted volumes
            volumes_path = Path("/Volumes")
            if volumes_path.exists():
                for vol in volumes_path.iterdir():
                    if vol.is_dir() and not vol.name.startswith("."):
                        try:
                            # Get disk usage
                            stat = os.statvfs(str(vol))
                            total = stat.f_blocks * stat.f_frsize
                            free = stat.f_bavail * stat.f_frsize
                            used = total - free
                            
                            drives.append({
                                "name": vol.name,
                                "path": str(vol),
                                "total_gb": round(total / (1024**3), 2),
                                "free_gb": round(free / (1024**3), 2),
                                "used_gb": round(used / (1024**3), 2),
                                "type": "volume"
                            })
                        except Exception as e:
                            logger.debug(f"Could not stat {vol}: {e}")
            
            # Also include home directory
            home = Path.home()
            try:
                stat = os.statvfs(str(home))
                total = stat.f_blocks * stat.f_frsize
                free = stat.f_bavail * stat.f_frsize
                drives.append({
                    "name": "Home",
                    "path": str(home),
                    "total_gb": round(total / (1024**3), 2),
                    "free_gb": round(free / (1024**3), 2),
                    "type": "home"
                })
            except Exception:
                pass
                
        return drives
    
    def find_sample_directories(self, root_path: str, max_depth: int = 4) -> List[Dict[str, Any]]:
        """
        Find directories that likely contain samples.
        
        Args:
            root_path: Root path to search from
            max_depth: Maximum directory depth to search
            
        Returns:
            List of potential sample directory info
        """
        sample_dirs = []
        root = Path(root_path)
        
        # Keywords that indicate sample directories
        sample_keywords = [
            "samples", "sample", "drums", "drum", "kicks", "kick",
            "snares", "snare", "hats", "hihat", "hi-hat", "percussion",
            "perc", "loops", "loop", "one-shot", "oneshot", "one shot",
            "808", "sounds", "sound", "audio", "wav", "aiff",
            "splice", "loopmasters", "vengeance", "cymatics", "kshmr",
            "black octopus", "production", "library", "kit", "kits",
            "fx", "effects", "foley", "ambient", "packs", "pack"
        ]
        
        # Skip these directories
        skip_dirs = {
            ".git", ".svn", "node_modules", "__pycache__", ".Trash",
            "Library", "Applications", "System", ".Spotlight-V100",
            ".fseventsd", ".DocumentRevisions-V100", ".TemporaryItems"
        }
        
        def search_dir(current_path: Path, depth: int):
            if depth > max_depth:
                return
                
            try:
                for item in current_path.iterdir():
                    if not item.is_dir():
                        continue
                    if item.name.startswith("."):
                        continue
                    if item.name in skip_dirs:
                        continue
                        
                    name_lower = item.name.lower()
                    
                    # Check if directory name matches sample keywords
                    is_sample_dir = any(kw in name_lower for kw in sample_keywords)
                    
                    if is_sample_dir:
                        # Count audio files
                        audio_count = 0
                        try:
                            for f in item.rglob("*"):
                                if f.suffix.lower() in AUDIO_EXTENSIONS:
                                    audio_count += 1
                                    if audio_count >= 10:  # Found enough
                                        break
                        except PermissionError:
                            pass
                        
                        if audio_count > 0:
                            sample_dirs.append({
                                "name": item.name,
                                "path": str(item),
                                "audio_files_found": audio_count if audio_count < 10 else "10+",
                                "depth": depth
                            })
                    
                    # Continue searching subdirectories
                    search_dir(item, depth + 1)
                    
            except PermissionError:
                pass
            except Exception as e:
                logger.debug(f"Error scanning {current_path}: {e}")
        
        search_dir(root, 0)
        return sample_dirs
    
    def scan_all_drives(
        self,
        max_depth: int = 4,
        scan_found: bool = True,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Discover and scan all sample libraries across all drives.
        
        Args:
            max_depth: Maximum directory depth to search
            scan_found: Whether to fully scan found directories
            progress_callback: Optional callback for progress updates
            
        Returns:
            Summary of discovered and scanned libraries
        """
        results = {
            "drives_scanned": [],
            "directories_found": [],
            "libraries_scanned": [],
            "total_samples": 0,
            "errors": []
        }
        
        # Discover all drives
        drives = self.discover_all_drives()
        results["drives_scanned"] = drives
        
        if progress_callback:
            progress_callback(f"Found {len(drives)} drives to scan")
        
        # Search each drive for sample directories
        all_sample_dirs = []
        for drive in drives:
            if progress_callback:
                progress_callback(f"Searching {drive['name']}...")
            
            try:
                dirs = self.find_sample_directories(drive["path"], max_depth)
                for d in dirs:
                    d["drive"] = drive["name"]
                all_sample_dirs.extend(dirs)
            except Exception as e:
                results["errors"].append(f"Error scanning {drive['name']}: {str(e)}")
        
        results["directories_found"] = all_sample_dirs
        
        if progress_callback:
            progress_callback(f"Found {len(all_sample_dirs)} potential sample directories")
        
        # Scan found directories if requested
        if scan_found:
            for sample_dir in all_sample_dirs:
                if progress_callback:
                    progress_callback(f"Scanning {sample_dir['name']}...")
                
                try:
                    library = self.scan_directory(
                        sample_dir["path"],
                        f"{sample_dir['drive']} - {sample_dir['name']}"
                    )
                    
                    if library.total_count > 0:
                        results["libraries_scanned"].append({
                            "name": library.name,
                            "path": library.path,
                            "samples": library.total_count,
                            "categories": list(library.samples.keys())
                        })
                        results["total_samples"] += library.total_count
                        
                except Exception as e:
                    results["errors"].append(f"Error scanning {sample_dir['path']}: {str(e)}")
        
        if progress_callback:
            progress_callback(f"Complete! Found {results['total_samples']} total samples")
        
        return results
    
    def quick_scan_common_locations(self) -> Dict[str, Any]:
        """
        Quick scan of common sample library locations.
        
        Returns:
            Summary of found libraries
        """
        results = {
            "locations_checked": [],
            "libraries_found": [],
            "total_samples": 0
        }
        
        # Common sample library locations on macOS
        common_paths = [
            # User directories
            Path.home() / "Music" / "Samples",
            Path.home() / "Music" / "Audio" / "Samples",
            Path.home() / "Music" / "Ableton" / "User Library" / "Samples",
            Path.home() / "Documents" / "Samples",
            Path.home() / "Documents" / "Audio" / "Samples",
            Path.home() / "Desktop" / "Samples",
            Path.home() / "Downloads" / "Samples",
            
            # Splice
            Path.home() / "Splice" / "Sounds",
            Path.home() / "Music" / "Splice",
            
            # Common external drive locations
            Path("/Volumes/Samples"),
            Path("/Volumes/Audio"),
            Path("/Volumes/Music/Samples"),
            
            # Native Instruments
            Path.home() / "Documents" / "Native Instruments",
            Path("/Library/Application Support/Native Instruments"),
            
            # Ableton Packs
            Path.home() / "Music" / "Ableton" / "User Library" / "Packs",
            Path("/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/Core Library/Samples"),
            Path("/Applications/Ableton Live 11 Suite.app/Contents/App-Resources/Core Library/Samples"),
            
            # Logic Pro
            Path("/Library/Application Support/Logic/Apple Loops"),
            Path.home() / "Music" / "Audio Music Apps" / "Samples",
            
            # FL Studio (if installed via CrossOver/Wine)
            Path.home() / "Documents" / "Image-Line" / "FL Studio" / "Data" / "Patches" / "Packs",
        ]
        
        # Also check for any directory with "samples" in /Volumes
        volumes = Path("/Volumes")
        if volumes.exists():
            for vol in volumes.iterdir():
                if vol.is_dir() and not vol.name.startswith("."):
                    # Check common subdirectories
                    for subdir in ["Samples", "Music/Samples", "Audio/Samples", "Drums", "Sample Library"]:
                        check_path = vol / subdir
                        if check_path not in common_paths:
                            common_paths.append(check_path)
        
        # Scan each location
        for path in common_paths:
            location_info = {"path": str(path), "exists": path.exists()}
            results["locations_checked"].append(location_info)
            
            if path.exists() and path.is_dir():
                try:
                    library = self.scan_directory(str(path), path.name)
                    if library.total_count > 0:
                        results["libraries_found"].append({
                            "name": library.name,
                            "path": str(path),
                            "samples": library.total_count,
                            "categories": {cat: len(samples) for cat, samples in library.samples.items()}
                        })
                        results["total_samples"] += library.total_count
                except Exception as e:
                    logger.debug(f"Error scanning {path}: {e}")
        
        return results
    
    def export_library_index(self, library: SampleLibrary, output_path: str):
        """Export library index to JSON."""
        data = {
            "name": library.name,
            "path": library.path,
            "total_count": library.total_count,
            "categories": {
                cat: [s.to_dict() for s in samples]
                for cat, samples in library.samples.items()
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Exported library index to {output_path}")


# ============================================================================
# Audio Generator (WAV Export)
# ============================================================================

class AudioDrumGenerator:
    """
    Generates audio drum patterns using samples.
    """
    
    def __init__(self, sample_library: SampleLibrary):
        """Initialize with sample library."""
        self.library = sample_library
        self.sample_rate = 44100
        self.channels = 2
    
    def render_pattern(
        self,
        pattern: DrumPattern,
        output_path: str,
        normalize: bool = True
    ) -> bool:
        """
        Render drum pattern to WAV file.
        
        Args:
            pattern: DrumPattern to render
            output_path: Output WAV file path
            normalize: Whether to normalize output
            
        Returns:
            True if successful
        """
        try:
            # Calculate total length
            total_beats = pattern.bars * 4
            seconds_per_beat = 60.0 / pattern.tempo
            total_samples = int(total_beats * seconds_per_beat * self.sample_rate)
            
            # Initialize stereo buffer
            buffer = [[0.0] * total_samples, [0.0] * total_samples]
            
            # Process each hit
            for hit in pattern.hits:
                sample = self.library.get_random_sample(hit.instrument)
                if not sample:
                    sample = self.library.get_random_sample("kick")  # Fallback
                
                if sample:
                    self._mix_sample(
                        buffer,
                        sample.path,
                        hit.start_time * seconds_per_beat,
                        hit.velocity / 127.0
                    )
            
            # Normalize
            if normalize:
                max_val = max(max(abs(s) for s in buffer[0]), max(abs(s) for s in buffer[1]))
                if max_val > 0:
                    for ch in range(2):
                        buffer[ch] = [s / max_val * 0.95 for s in buffer[ch]]
            
            # Write WAV file
            self._write_wav(output_path, buffer)
            
            logger.info(f"Rendered pattern to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to render pattern: {e}")
            return False
    
    def _mix_sample(
        self,
        buffer: List[List[float]],
        sample_path: str,
        start_time: float,
        gain: float
    ):
        """Mix a sample into the buffer."""
        try:
            start_sample = int(start_time * self.sample_rate)
            
            with wave.open(sample_path, 'rb') as wav:
                frames = wav.readframes(wav.getnframes())
                sample_width = wav.getsampwidth()
                n_channels = wav.getnchannels()
                
                # Decode samples
                if sample_width == 2:
                    fmt = f"<{len(frames) // 2}h"
                    samples = list(struct.unpack(fmt, frames))
                    samples = [s / 32768.0 for s in samples]  # Normalize to -1..1
                else:
                    return
                
                # Mix into buffer
                for i, s in enumerate(samples):
                    ch = i % n_channels
                    buf_idx = start_sample + (i // n_channels)
                    
                    if buf_idx < len(buffer[0]):
                        if n_channels == 1:
                            buffer[0][buf_idx] += s * gain
                            buffer[1][buf_idx] += s * gain
                        else:
                            buffer[ch][buf_idx] += s * gain
                            
        except Exception as e:
            logger.debug(f"Error mixing sample {sample_path}: {e}")
    
    def _write_wav(self, output_path: str, buffer: List[List[float]]):
        """Write buffer to WAV file."""
        n_samples = len(buffer[0])
        
        with wave.open(output_path, 'wb') as wav:
            wav.setnchannels(2)
            wav.setsampwidth(2)  # 16-bit
            wav.setframerate(self.sample_rate)
            
            # Interleave channels
            data = []
            for i in range(n_samples):
                for ch in range(2):
                    sample = int(buffer[ch][i] * 32767)
                    sample = max(-32768, min(32767, sample))
                    data.append(struct.pack('<h', sample))
            
            wav.writeframes(b''.join(data))


# ============================================================================
# Standalone Functions (API convenience)
# ============================================================================

_generator: Optional[DrumGenerator] = None
_scanner: Optional[SampleScanner] = None


def get_generator() -> DrumGenerator:
    """Get or create drum generator instance."""
    global _generator
    if _generator is None:
        _generator = DrumGenerator()
    return _generator


def get_scanner() -> SampleScanner:
    """Get or create sample scanner instance."""
    global _scanner
    if _scanner is None:
        _scanner = SampleScanner()
    return _scanner


def generate_drum_pattern(
    genre: str = "house",
    bars: int = 4,
    tempo: float = 125.0,
    swing: float = 0.0,
    humanize: float = 0.0,
    density: float = 1.0,
    output_format: Literal["midi", "dict"] = "midi"
) -> Dict[str, Any]:
    """
    Generate drum pattern (standalone function).
    
    Args:
        genre: Genre style
        bars: Number of bars
        tempo: BPM
        swing: Swing amount (0-100)
        humanize: Humanization (0-100)
        density: Pattern density (0.0-2.0)
        output_format: "midi" or "dict"
        
    Returns:
        Dictionary with pattern data
    """
    generator = get_generator()
    pattern = generator.generate_pattern(
        genre=genre,
        bars=bars,
        tempo=tempo,
        swing=swing,
        humanize=humanize,
        density=density
    )
    
    if output_format == "midi":
        notes = generator.generate_midi_data(pattern)
        return {
            "status": "ok",
            "pattern_name": pattern.name,
            "genre": pattern.genre,
            "bars": pattern.bars,
            "tempo": pattern.tempo,
            "notes": notes,
            "count": len(notes)
        }
    else:
        return pattern.to_dict()


def scan_sample_library(
    path: str,
    library_name: Optional[str] = None,
    recursive: bool = True
) -> Dict[str, Any]:
    """
    Scan directory for samples.
    
    Args:
        path: Directory path
        library_name: Library name
        recursive: Scan subdirectories
        
    Returns:
        Library summary
    """
    scanner = get_scanner()
    library = scanner.scan_directory(path, library_name, recursive)
    
    return {
        "status": "ok",
        "name": library.name,
        "path": library.path,
        "total_samples": library.total_count,
        "categories": {cat: len(samples) for cat, samples in library.samples.items()}
    }


def get_available_genres() -> List[str]:
    """Get list of available genres."""
    return list(DrumGenerator.GENRE_TEMPLATES.keys())


def get_drum_map() -> Dict[str, int]:
    """Get GM drum map."""
    return GM_DRUM_MAP.copy()

