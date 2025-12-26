#!/usr/bin/env python3
"""
SERGIK CLI - Command Line Interface for Ableton Live Integration

Proprietary AI-powered music generation using SERGIK algorithms.

Commands:
  sergik generate drums --style tech-house --bars 8
  sergik generate bass --key Cmin --bpm 125
  sergik generate chords --progression "i-VI-III-VII"
  sergik generate melody --scale minor --range 2
  sergik generate vocals --prompt "ethereal vocals"

  sergik send midi --track 1 --file pattern.mid
  sergik control tempo 125
  sergik control play/stop

  sergik analyze <file> --deep
  sergik stems <file> --output ./stems

Requirements:
  pip install click python-osc mido numpy
"""

import click
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent))

# Import sergik_ml modules
try:
    from sergik_ml.services.generation_service import GenerationService
    from sergik_ml.connectors.ableton_osc import osc_send
    from sergik_ml.utils.midi import parse_key_string, get_scale_notes
    from sergik_ml.utils.validators import validate_bpm, validate_key
    HAS_SERGIK_ML = True
except ImportError as e:
    HAS_SERGIK_ML = False
    IMPORT_ERROR = str(e)

# Optional imports with graceful fallback
try:
    from pythonosc import udp_client, osc_message_builder
    HAS_OSC = True
except ImportError:
    HAS_OSC = False

try:
    import mido
    HAS_MIDO = True
except ImportError:
    HAS_MIDO = False

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


# ============================================================================
# Configuration
# ============================================================================

DEFAULT_CONFIG = {
    "osc_host": "127.0.0.1",
    "osc_port": 9000,
    "midi_port": "IAC Driver Bus 1",
    "default_bpm": 125,
    "default_key": "C",
    "default_scale": "minor",
    "output_dir": os.path.expanduser("~/Desktop/SERGIK_Output"),
}

CONFIG_PATH = os.path.expanduser("~/.sergik_config.json")


def load_config():
    """Load configuration from file or return defaults"""
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r') as f:
            config = DEFAULT_CONFIG.copy()
            config.update(json.load(f))
            return config
    return DEFAULT_CONFIG.copy()


def save_config(config):
    """Save configuration to file"""
    with open(CONFIG_PATH, 'w') as f:
        json.dump(config, f, indent=2)


CONFIG = load_config()


# ============================================================================
# OSC Client
# ============================================================================

class AbletonOSC:
    """
    OSC client for Ableton Live communication.
    
    Uses sergik_ml.connectors.ableton_osc if available, otherwise falls back to direct OSC.
    """

    def __init__(self, host=None, port=None):
        self.host = host or CONFIG["osc_host"]
        self.port = port or CONFIG["osc_port"]
        self.client = None

        if HAS_OSC:
            self.client = udp_client.SimpleUDPClient(self.host, self.port)

    def send(self, address, *args):
        """Send OSC message"""
        # Try using sergik_ml OSC connector first
        if HAS_SERGIK_ML:
            try:
                from sergik_ml.connectors.ableton_osc import osc_send
                osc_send(address, {"args": list(args)})
                return True
            except Exception:
                pass
        
        # Fallback to direct OSC
        if not self.client:
            click.echo(click.style("OSC not available. Install: pip install python-osc", fg="red"))
            return False

        try:
            self.client.send_message(address, list(args))
            return True
        except Exception as e:
            click.echo(click.style(f"OSC error: {e}", fg="red"))
            return False

    # Ableton Live controls
    def set_tempo(self, bpm):
        return self.send("/live/song/set/tempo", float(bpm))

    def play(self):
        return self.send("/live/song/start_playing", 1)

    def stop(self):
        return self.send("/live/song/stop_playing", 1)

    def set_track_volume(self, track, volume):
        return self.send("/live/track/set/volume", int(track), float(volume))

    def fire_clip(self, track, clip):
        return self.send("/live/clip/fire", int(track), int(clip))

    def set_device_param(self, track, device, param, value):
        return self.send("/live/device/set/parameter/value",
                        int(track), int(device), int(param), float(value))

    # SERGIK-specific messages
    def send_midi_notes(self, track, notes):
        """Send MIDI note data to Max for Live device

        Notes format: [(pitch, velocity, start_time, duration), ...]
        """
        for note in notes:
            pitch, velocity, start, duration = note
            self.send("/sergik/midi/note", int(track), int(pitch), int(velocity),
                     float(start), float(duration))

    def send_pattern(self, pattern_type, pattern_data):
        """Send a complete pattern to Ableton"""
        self.send(f"/sergik/pattern/{pattern_type}", json.dumps(pattern_data))


# ============================================================================
# MIDI Generator Engine
# ============================================================================

class SergikMIDIGenerator:
    """
    Generate MIDI patterns in SERGIK style.
    
    This is a compatibility wrapper that uses sergik_ml modules.
    For new code, use GenerationService directly.
    """

    def __init__(self, bpm=125, key="C", scale="minor"):
        self.bpm = bpm
        self.key = key
        self.scale = scale
        self.ticks_per_beat = 480
        
        # Use sergik_ml generation service if available
        if HAS_SERGIK_ML:
            try:
                self.gen_service = GenerationService()
            except Exception:
                self.gen_service = None
        else:
            self.gen_service = None

        if HAS_NUMPY:
            np.random.seed(int(datetime.now().timestamp()) % 2**32)

    def _parse_key(self, key_str):
        """Parse key string like 'Cmin' or 'F#maj' to root note"""
        if HAS_SERGIK_ML:
            try:
                root_midi, scale_type = parse_key_string(key_str)
                return root_midi, scale_type
            except Exception:
                pass
        
        # Fallback to basic parsing
        key_str = key_str.strip()
        if len(key_str) >= 2 and key_str[1] in ['#', 'b']:
            root = key_str[:2]
            mode = key_str[2:].lower() if len(key_str) > 2 else ""
        else:
            root = key_str[0].upper()
            mode = key_str[1:].lower() if len(key_str) > 1 else ""

        NOTE_MAP = {
            "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
            "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
            "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
        }
        root_midi = NOTE_MAP.get(root, 0)

        if "min" in mode or "m" == mode:
            scale_type = "minor"
        elif "maj" in mode:
            scale_type = "major"
        elif "dor" in mode:
            scale_type = "dorian"
        elif "phr" in mode:
            scale_type = "phrygian"
        elif "mix" in mode:
            scale_type = "mixolydian"
        else:
            scale_type = "minor"

        return root_midi, scale_type

    def _get_scale_notes(self, root, scale_name, octave_start=3, octave_range=2):
        """Get all notes in a scale across octave range"""
        if HAS_SERGIK_ML:
            try:
                return get_scale_notes(root, scale_name, octave_start, octave_range)
            except Exception:
                pass
        
        # Fallback
        SCALES = {
            "major": [0, 2, 4, 5, 7, 9, 11],
            "minor": [0, 2, 3, 5, 7, 8, 10],
            "dorian": [0, 2, 3, 5, 7, 9, 10],
            "phrygian": [0, 1, 3, 5, 7, 8, 10],
            "mixolydian": [0, 2, 4, 5, 7, 9, 10],
            "harmonic_minor": [0, 2, 3, 5, 7, 8, 11],
            "melodic_minor": [0, 2, 3, 5, 7, 9, 11],
            "pentatonic_major": [0, 2, 4, 7, 9],
            "pentatonic_minor": [0, 3, 5, 7, 10],
            "blues": [0, 3, 5, 6, 7, 10],
        }
        scale = SCALES.get(scale_name, SCALES["minor"])
        notes = []

        for octave in range(octave_start, octave_start + octave_range):
            for interval in scale:
                midi_note = root + (octave * 12) + interval
                if 0 <= midi_note <= 127:
                    notes.append(midi_note)

        return notes

    # ---- DRUM GENERATION ----

    def generate_drums(self, bars=8, style="tech-house", variation=0.2):
        """Generate drum pattern in SERGIK style"""
        if not HAS_NUMPY:
            return self._generate_drums_basic(bars, style)

        profile = self.STYLE_PROFILES.get(style, self.STYLE_PROFILES["tech-house"])
        notes = []

        # MIDI drum mapping (General MIDI)
        KICK = 36
        SNARE = 38
        CLAP = 39
        CLOSED_HH = 42
        OPEN_HH = 46
        RIMSHOT = 37
        PERC = 56
        SHAKER = 70

        steps_per_bar = 16
        total_steps = bars * steps_per_bar
        step_duration = 0.25

        for step in range(total_steps):
            beat_in_bar = (step % steps_per_bar)
            bar_num = step // steps_per_bar

            swing_offset = profile["swing"] if step % 2 == 1 else 0
            start_time = step * step_duration + swing_offset

            # Style-specific patterns
            if style == "trap":
                # Trap: 808 patterns, hi-hat rolls
                if beat_in_bar in [0, 10]:
                    vel = int(120 + np.random.uniform(-5, 5))
                    notes.append((KICK, vel, start_time, 0.5))
                if beat_in_bar in [4, 12]:
                    vel = int(110 + np.random.uniform(-10, 10))
                    notes.append((SNARE, vel, start_time, 0.125))
                # Hi-hat rolls
                if beat_in_bar % 2 == 0 or np.random.random() < 0.7:
                    vel = int(60 + np.random.uniform(-20, 30))
                    notes.append((CLOSED_HH, vel, start_time, 0.0625))

            elif style == "reggaeton":
                # Reggaeton: dembow rhythm
                if beat_in_bar in [0, 6, 8, 14]:
                    vel = int(110 + np.random.uniform(-10, 10))
                    notes.append((KICK, vel, start_time, 0.25))
                if beat_in_bar in [3, 7, 11, 15]:
                    vel = int(100 + np.random.uniform(-10, 10))
                    notes.append((SNARE, vel, start_time, 0.125))
                if beat_in_bar % 2 == 0:
                    vel = int(70 + np.random.uniform(-15, 15))
                    notes.append((CLOSED_HH, vel, start_time, 0.125))

            else:
                # House/Tech-house/Techno: Four on the floor
                if beat_in_bar in [0, 4, 8, 12]:
                    vel = int(110 + np.random.uniform(-10, 10) * profile["velocity_variation"])
                    notes.append((KICK, vel, start_time, 0.25))

                if profile["ghost_notes"] and beat_in_bar in [7, 15]:
                    if np.random.random() < 0.3 + (bar_num % 4) * 0.1:
                        vel = int(80 + np.random.uniform(-10, 10))
                        notes.append((KICK, vel, start_time, 0.125))

                if beat_in_bar in [4, 12]:
                    vel = int(100 + np.random.uniform(-10, 10) * profile["velocity_variation"])
                    notes.append((CLAP, vel, start_time, 0.125))

                if style in ["techno", "tech-house"]:
                    if beat_in_bar % 2 == 0:
                        vel = int(80 + np.random.uniform(-20, 10) * profile["velocity_variation"])
                        notes.append((CLOSED_HH, vel, start_time, 0.125))
                    elif np.random.random() < 0.5:
                        vel = int(50 + np.random.uniform(-10, 10))
                        notes.append((CLOSED_HH, vel, start_time, 0.0625))
                else:
                    if beat_in_bar in [2, 6, 10, 14]:
                        vel = int(90 + np.random.uniform(-10, 10))
                        notes.append((OPEN_HH, vel, start_time, 0.25))
                    elif beat_in_bar % 2 == 0:
                        vel = int(70 + np.random.uniform(-15, 10))
                        notes.append((CLOSED_HH, vel, start_time, 0.125))

            # Percussion sparse additions
            if np.random.random() < 0.08:
                vel = int(60 + np.random.uniform(-10, 20))
                notes.append((PERC, vel, start_time, 0.125))

        return notes

    def _generate_drums_basic(self, bars, style):
        """Basic drum generation without numpy"""
        import random
        notes = []

        KICK = 36
        CLAP = 39
        CLOSED_HH = 42

        steps_per_bar = 16
        total_steps = bars * steps_per_bar
        step_duration = 0.25

        for step in range(total_steps):
            beat_in_bar = step % steps_per_bar
            start_time = step * step_duration

            if beat_in_bar in [0, 4, 8, 12]:
                notes.append((KICK, 110, start_time, 0.25))
            if beat_in_bar in [4, 12]:
                notes.append((CLAP, 100, start_time, 0.125))
            if beat_in_bar % 2 == 0:
                notes.append((CLOSED_HH, 80, start_time, 0.125))

        return notes

    # ---- BASS GENERATION ----

    def generate_bass(self, bars=8, key="Cmin", pattern_type="groove"):
        """Generate bassline in SERGIK style"""
        root, scale_type = self._parse_key(key)
        bass_notes = self._get_scale_notes(root, scale_type, octave_start=2, octave_range=1)

        if not HAS_NUMPY:
            return self._generate_bass_basic(bars, bass_notes)

        notes = []
        steps_per_bar = 16
        total_steps = bars * steps_per_bar
        step_duration = 0.25

        for step in range(total_steps):
            beat_in_bar = step % steps_per_bar
            start_time = step * step_duration

            if beat_in_bar == 0:
                notes.append((bass_notes[0], 110, start_time, 0.5))
            elif beat_in_bar == 6:
                note = np.random.choice(bass_notes[:3])
                notes.append((note, 100, start_time, 0.25))
            elif beat_in_bar == 10:
                note = bass_notes[4] if len(bass_notes) > 4 else bass_notes[-1]
                notes.append((note, 95, start_time, 0.375))
            elif beat_in_bar == 14:
                note = bass_notes[6] if len(bass_notes) > 6 else bass_notes[-1]
                notes.append((note, 90, start_time, 0.25))
            elif beat_in_bar in [3, 7, 11] and np.random.random() < 0.3:
                note = np.random.choice(bass_notes)
                notes.append((note, 60, start_time, 0.125))

        return notes

    def _generate_bass_basic(self, bars, bass_notes):
        """Basic bass generation without numpy"""
        notes = []
        steps_per_bar = 16
        total_steps = bars * steps_per_bar
        step_duration = 0.25

        for step in range(total_steps):
            beat_in_bar = step % steps_per_bar
            start_time = step * step_duration

            if beat_in_bar == 0:
                notes.append((bass_notes[0], 110, start_time, 0.5))
            elif beat_in_bar == 6:
                notes.append((bass_notes[2 % len(bass_notes)], 100, start_time, 0.25))
            elif beat_in_bar == 10:
                notes.append((bass_notes[4 % len(bass_notes)], 95, start_time, 0.375))

        return notes

    # ---- CHORD GENERATION ----

    def generate_chords(self, bars=8, key="Cmin", progression=None):
        """Generate chord progression in SERGIK style"""
        root, scale_type = self._parse_key(key)
        scale = self.SCALES.get(scale_type, self.SCALES["minor"])

        if progression is None:
            progressions = [
                [0, 5, 3, 4],
                [0, 3, 5, 4],
                [0, 6, 3, 4],
                [0, 5, 6, 4],
            ]
            if HAS_NUMPY:
                progression = progressions[np.random.randint(0, len(progressions))]
            else:
                import random
                progression = random.choice(progressions)
        else:
            progression = self._parse_progression(progression)

        notes = []
        chord_duration = bars / len(progression)

        for chord_idx, degree in enumerate(progression):
            start_time = chord_idx * chord_duration * 4

            chord_root = root + scale[degree % len(scale)]

            if scale_type == "minor":
                if degree in [0, 3, 4]:
                    chord_notes = [chord_root, chord_root + 3, chord_root + 7]
                else:
                    chord_notes = [chord_root, chord_root + 4, chord_root + 7]
            else:
                if degree in [0, 3, 4]:
                    chord_notes = [chord_root, chord_root + 4, chord_root + 7]
                else:
                    chord_notes = [chord_root, chord_root + 3, chord_root + 7]

            chord_notes = [n + 48 for n in chord_notes]

            for note in chord_notes:
                if HAS_NUMPY:
                    vel = int(85 + np.random.uniform(-10, 10))
                else:
                    vel = 85
                notes.append((note, vel, start_time, chord_duration * 4 - 0.25))

        return notes

    def _parse_progression(self, prog_str):
        """Parse progression string like 'i-VI-III-VII'"""
        numerals = {
            "i": 0, "I": 0, "ii": 1, "II": 1, "iii": 2, "III": 2,
            "iv": 3, "IV": 3, "v": 4, "V": 4, "vi": 5, "VI": 5,
            "vii": 6, "VII": 6,
        }
        parts = prog_str.replace(" ", "").split("-")
        return [numerals.get(p, 0) for p in parts]

    # ---- MELODY GENERATION ----

    def generate_melody(self, bars=8, key="Cmin", density=0.4, octave_range=2):
        """Generate melody in SERGIK style"""
        root, scale_type = self._parse_key(key)
        melody_notes = self._get_scale_notes(root, scale_type,
                                             octave_start=4, octave_range=octave_range)

        if not HAS_NUMPY:
            return self._generate_melody_basic(bars, melody_notes, density)

        notes = []
        steps_per_bar = 16
        total_steps = bars * steps_per_bar
        step_duration = 0.25

        last_note = melody_notes[len(melody_notes) // 2]

        for step in range(total_steps):
            beat_in_bar = step % steps_per_bar
            start_time = step * step_duration

            note_prob = density
            if beat_in_bar in [0, 4, 8, 12]:
                note_prob *= 2

            if np.random.random() < note_prob:
                current_idx = melody_notes.index(last_note) if last_note in melody_notes else 0

                movement = np.random.choice([-2, -1, 0, 1, 2],
                                           p=[0.1, 0.25, 0.3, 0.25, 0.1])
                new_idx = max(0, min(len(melody_notes) - 1, current_idx + movement))
                note = melody_notes[new_idx]

                if beat_in_bar in [0, 8]:
                    duration = np.random.choice([0.5, 0.75, 1.0])
                else:
                    duration = np.random.choice([0.25, 0.375, 0.5])

                vel = int(80 + np.random.uniform(-15, 15))
                notes.append((note, vel, start_time, duration))
                last_note = note

        return notes

    def _generate_melody_basic(self, bars, melody_notes, density):
        """Basic melody generation without numpy"""
        import random
        notes = []
        steps_per_bar = 16
        total_steps = bars * steps_per_bar
        step_duration = 0.25
        note_idx = len(melody_notes) // 2

        for step in range(total_steps):
            beat_in_bar = step % steps_per_bar
            start_time = step * step_duration

            if random.random() < density and beat_in_bar in [0, 4, 8, 12]:
                note = melody_notes[note_idx]
                notes.append((note, 85, start_time, 0.5))
                note_idx = max(0, min(len(melody_notes) - 1,
                              note_idx + random.choice([-1, 0, 1])))

        return notes


# ============================================================================
# MIDI File Writer
# ============================================================================

def notes_to_midi_file(notes, output_path, bpm=125):
    """Convert note list to MIDI file"""
    if not HAS_MIDO:
        click.echo(click.style("mido not available. Install: pip install mido", fg="red"))
        return False

    mid = mido.MidiFile(type=1)
    track = mido.MidiTrack()
    mid.tracks.append(track)

    tempo = mido.bpm2tempo(bpm)
    track.append(mido.MetaMessage('set_tempo', tempo=tempo))

    ticks_per_beat = mid.ticks_per_beat
    sorted_notes = sorted(notes, key=lambda x: x[2])

    events = []
    for pitch, velocity, start_beat, duration in sorted_notes:
        start_tick = int(start_beat * ticks_per_beat)
        duration_tick = int(duration * ticks_per_beat)
        events.append((start_tick, 'note_on', pitch, velocity))
        events.append((start_tick + duration_tick, 'note_off', pitch, 0))

    events.sort(key=lambda x: x[0])

    last_time = 0
    for tick, msg_type, pitch, velocity in events:
        delta = tick - last_time
        track.append(mido.Message(msg_type, note=pitch, velocity=velocity, time=delta))
        last_time = tick

    mid.save(output_path)
    return True


# ============================================================================
# CLI Commands
# ============================================================================

@click.group()
@click.version_option(version="1.0.0")
def cli():
    """SERGIK CLI - AI Music Generation for Ableton Live

    Generate drums, bass, chords, and melodies using SERGIK's proprietary
    algorithms, then send them directly to Ableton via OSC/MIDI.
    """
    pass


@cli.group()
def generate():
    """Generate musical elements (drums, bass, chords, melody, vocals)"""
    pass


@generate.command()
@click.option('--style', '-s', default='tech-house',
              type=click.Choice(['tech-house', 'house', 'techno', 'disco', 'trap', 'reggaeton']),
              help='Drum style')
@click.option('--bars', '-b', default=8, help='Number of bars')
@click.option('--bpm', default=125, help='Tempo in BPM')
@click.option('--output', '-o', help='Output MIDI file path')
@click.option('--send', is_flag=True, help='Send directly to Ableton via OSC')
def drums(style, bars, bpm, output, send):
    """Generate drum patterns"""
    click.echo(f"Generating {bars} bars of {style} drums at {bpm} BPM...")

    gen = SergikMIDIGenerator(bpm=bpm)
    notes = gen.generate_drums(bars=bars, style=style)

    click.echo(f"Generated {len(notes)} drum hits")

    if output:
        if notes_to_midi_file(notes, output, bpm):
            click.echo(click.style(f"Saved to: {output}", fg="green"))
    else:
        os.makedirs(CONFIG["output_dir"], exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output = os.path.join(CONFIG["output_dir"], f"drums_{style}_{timestamp}.mid")
        if notes_to_midi_file(notes, output, bpm):
            click.echo(click.style(f"Saved to: {output}", fg="green"))

    if send:
        osc = AbletonOSC()
        osc.send_midi_notes(0, notes)
        click.echo(click.style("Sent to Ableton", fg="green"))


@generate.command()
@click.option('--key', '-k', default='Cmin', help='Key (e.g., Cmin, F#maj)')
@click.option('--bars', '-b', default=8, help='Number of bars')
@click.option('--bpm', default=125, help='Tempo in BPM')
@click.option('--output', '-o', help='Output MIDI file path')
@click.option('--send', is_flag=True, help='Send directly to Ableton via OSC')
def bass(key, bars, bpm, output, send):
    """Generate basslines"""
    click.echo(f"Generating {bars} bars of bass in {key} at {bpm} BPM...")

    gen = SergikMIDIGenerator(bpm=bpm)
    notes = gen.generate_bass(bars=bars, key=key)

    click.echo(f"Generated {len(notes)} bass notes")

    if output:
        if notes_to_midi_file(notes, output, bpm):
            click.echo(click.style(f"Saved to: {output}", fg="green"))
    else:
        os.makedirs(CONFIG["output_dir"], exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output = os.path.join(CONFIG["output_dir"], f"bass_{key}_{timestamp}.mid")
        if notes_to_midi_file(notes, output, bpm):
            click.echo(click.style(f"Saved to: {output}", fg="green"))

    if send:
        osc = AbletonOSC()
        osc.send_midi_notes(1, notes)
        click.echo(click.style("Sent to Ableton", fg="green"))


@generate.command()
@click.option('--key', '-k', default='Cmin', help='Key (e.g., Cmin, F#maj)')
@click.option('--progression', '-p', help='Chord progression (e.g., "i-VI-III-VII")')
@click.option('--bars', '-b', default=8, help='Number of bars')
@click.option('--bpm', default=125, help='Tempo in BPM')
@click.option('--output', '-o', help='Output MIDI file path')
@click.option('--send', is_flag=True, help='Send directly to Ableton via OSC')
def chords(key, progression, bars, bpm, output, send):
    """Generate chord progressions"""
    click.echo(f"Generating {bars} bars of chords in {key} at {bpm} BPM...")
    if progression:
        click.echo(f"Using progression: {progression}")

    gen = SergikMIDIGenerator(bpm=bpm)
    notes = gen.generate_chords(bars=bars, key=key, progression=progression)

    click.echo(f"Generated {len(notes)} chord notes")

    if output:
        if notes_to_midi_file(notes, output, bpm):
            click.echo(click.style(f"Saved to: {output}", fg="green"))
    else:
        os.makedirs(CONFIG["output_dir"], exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output = os.path.join(CONFIG["output_dir"], f"chords_{key}_{timestamp}.mid")
        if notes_to_midi_file(notes, output, bpm):
            click.echo(click.style(f"Saved to: {output}", fg="green"))

    if send:
        osc = AbletonOSC()
        osc.send_midi_notes(2, notes)
        click.echo(click.style("Sent to Ableton", fg="green"))


@generate.command()
@click.option('--key', '-k', default='Cmin', help='Key (e.g., Cmin, F#maj)')
@click.option('--bars', '-b', default=8, help='Number of bars')
@click.option('--density', '-d', default=0.4, help='Note density (0-1)')
@click.option('--bpm', default=125, help='Tempo in BPM')
@click.option('--output', '-o', help='Output MIDI file path')
@click.option('--send', is_flag=True, help='Send directly to Ableton via OSC')
def melody(key, bars, density, bpm, output, send):
    """Generate melodies"""
    click.echo(f"Generating {bars} bars of melody in {key} at {bpm} BPM...")

    gen = SergikMIDIGenerator(bpm=bpm)
    notes = gen.generate_melody(bars=bars, key=key, density=density)

    click.echo(f"Generated {len(notes)} melody notes")

    if output:
        if notes_to_midi_file(notes, output, bpm):
            click.echo(click.style(f"Saved to: {output}", fg="green"))
    else:
        os.makedirs(CONFIG["output_dir"], exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output = os.path.join(CONFIG["output_dir"], f"melody_{key}_{timestamp}.mid")
        if notes_to_midi_file(notes, output, bpm):
            click.echo(click.style(f"Saved to: {output}", fg="green"))

    if send:
        osc = AbletonOSC()
        osc.send_midi_notes(3, notes)
        click.echo(click.style("Sent to Ableton", fg="green"))


@generate.command()
@click.option('--prompt', '-p', required=True, help='Description of vocal style')
@click.option('--duration', '-d', default=30, help='Duration in seconds')
@click.option('--output', '-o', help='Output audio file path')
def vocals(prompt, duration, output):
    """Generate vocals (requires external AI service)"""
    click.echo(f"Vocal generation request: '{prompt}'")
    click.echo(f"Duration: {duration}s")
    click.echo("")
    click.echo(click.style("Vocal generation requires integration with:", fg="yellow"))
    click.echo("  - Eleven Labs API (voice synthesis)")
    click.echo("  - Replicate MusicGen (melodic vocals)")
    click.echo("  - Local Bark/RVC models")


@generate.command()
@click.option('--key', '-k', default='Cmin', help='Key (e.g., Cmin, F#maj)')
@click.option('--style', '-s', default='tech-house',
              type=click.Choice(['tech-house', 'house', 'techno', 'disco', 'trap', 'reggaeton']))
@click.option('--bars', '-b', default=8, help='Number of bars')
@click.option('--bpm', default=125, help='Tempo in BPM')
@click.option('--output-dir', '-o', help='Output directory for MIDI files')
def full(key, style, bars, bpm, output_dir):
    """Generate a full arrangement (drums, bass, chords, melody)"""
    click.echo(f"Generating full {bars}-bar arrangement in {key} ({style}) at {bpm} BPM...")

    gen = SergikMIDIGenerator(bpm=bpm)
    output_dir = output_dir or CONFIG["output_dir"]
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    elements = [
        ("drums", gen.generate_drums(bars=bars, style=style)),
        ("bass", gen.generate_bass(bars=bars, key=key)),
        ("chords", gen.generate_chords(bars=bars, key=key)),
        ("melody", gen.generate_melody(bars=bars, key=key)),
    ]

    for name, notes in elements:
        output = os.path.join(output_dir, f"sergik_{name}_{timestamp}.mid")
        if notes_to_midi_file(notes, output, bpm):
            click.echo(f"  {name}: {len(notes)} notes -> {os.path.basename(output)}")

    click.echo("")
    click.echo(click.style(f"Full arrangement saved to: {output_dir}", fg="green"))


# ---- CONTROL COMMAND GROUP ----

@cli.group()
def control():
    """Control Ableton Live via OSC"""
    pass


@control.command()
@click.argument('bpm', type=float)
def tempo(bpm):
    """Set Ableton tempo"""
    osc = AbletonOSC()
    if osc.set_tempo(bpm):
        click.echo(click.style(f"Tempo set to {bpm} BPM", fg="green"))


@control.command()
def play():
    """Start Ableton playback"""
    osc = AbletonOSC()
    if osc.play():
        click.echo(click.style("Playback started", fg="green"))


@control.command()
def stop():
    """Stop Ableton playback"""
    osc = AbletonOSC()
    if osc.stop():
        click.echo(click.style("Playback stopped", fg="green"))


@control.command()
@click.argument('track', type=int)
@click.argument('volume', type=float)
def volume(track, volume):
    """Set track volume (0-1)"""
    osc = AbletonOSC()
    if osc.set_track_volume(track, volume):
        click.echo(click.style(f"Track {track} volume set to {volume}", fg="green"))


@control.command()
@click.argument('track', type=int)
@click.argument('clip', type=int)
def fire(track, clip):
    """Fire a clip"""
    osc = AbletonOSC()
    if osc.fire_clip(track, clip):
        click.echo(click.style(f"Fired clip {clip} on track {track}", fg="green"))


# ---- CONFIG & STATUS ----

@cli.command()
@click.option('--osc-host', help='OSC host address')
@click.option('--osc-port', type=int, help='OSC port')
@click.option('--midi-port', help='MIDI port name')
@click.option('--show', is_flag=True, help='Show current configuration')
def config(osc_host, osc_port, midi_port, show):
    """Configure SERGIK CLI settings"""
    global CONFIG

    if show:
        click.echo("Current configuration:")
        for key, value in CONFIG.items():
            click.echo(f"  {key}: {value}")
        return

    if osc_host:
        CONFIG["osc_host"] = osc_host
    if osc_port:
        CONFIG["osc_port"] = osc_port
    if midi_port:
        CONFIG["midi_port"] = midi_port

    save_config(CONFIG)
    click.echo(click.style("Configuration saved", fg="green"))


@cli.command()
def status():
    """Check system status and dependencies"""
    click.echo("SERGIK CLI Status")
    click.echo("=" * 40)

    deps = [
        ("python-osc", HAS_OSC),
        ("mido", HAS_MIDO),
        ("numpy", HAS_NUMPY),
    ]

    click.echo("\nDependencies:")
    for name, available in deps:
        status_str = click.style("OK", fg="green") if available else click.style("MISSING", fg="red")
        click.echo(f"  {name}: {status_str}")

    try:
        import librosa
        click.echo(f"  librosa: {click.style('OK', fg='green')}")
    except ImportError:
        click.echo(f"  librosa: {click.style('MISSING', fg='yellow')} (optional)")

    click.echo(f"\nConfiguration:")
    click.echo(f"  OSC Target: {CONFIG['osc_host']}:{CONFIG['osc_port']}")
    click.echo(f"  MIDI Port: {CONFIG['midi_port']}")
    click.echo(f"  Output Dir: {CONFIG['output_dir']}")

    click.echo(f"\nInstall missing: pip install click python-osc mido numpy")


@cli.command()
@click.option('--port', '-p', default=5000, help='HTTP server port')
def server(port):
    """Start the Ableton bridge server"""
    click.echo(f"Starting SERGIK Ableton Bridge Server on port {port}...")
    try:
        sys.path.insert(0, str(Path(__file__).parent / "gpt_actions"))
        from ableton_bridge_server import app
        app.run(host='0.0.0.0', port=port, debug=True)
    except ImportError:
        click.echo(click.style("Bridge server not found.", fg="yellow"))


if __name__ == '__main__':
    cli()
