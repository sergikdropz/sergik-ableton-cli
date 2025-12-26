"""
Plugin Knowledge Base
Comprehensive database of plugins, VSTs, and audio devices
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class PluginInfo:
    """Plugin information structure."""
    name: str
    manufacturer: str
    type: str  # "instrument", "effect", "midi_effect", "m4l_device"
    category: str  # "synthesizer", "sampler", "compressor", etc.
    description: str
    parameters: List[str] = field(default_factory=list)
    common_uses: List[str] = field(default_factory=list)
    sergik_usage: Optional[str] = None
    version: Optional[str] = None


class PluginKnowledgeBase:
    """Comprehensive plugin knowledge database."""
    
    def __init__(self):
        """Initialize plugin knowledge base."""
        self.plugins: Dict[str, PluginInfo] = {}
        self._load_plugin_data()
    
    def _load_plugin_data(self):
        """Load all plugin data."""
        # SERGIK Custom Devices
        self._add_sergik_devices()
        
        # Ableton Live Native Instruments
        self._add_ableton_instruments()
        
        # Ableton Live Native Effects
        self._add_ableton_effects()
        
        # Ableton Live MIDI Effects
        self._add_ableton_midi_effects()
        
        # Popular VST Synthesizers
        self._add_vst_synthesizers()
        
        # Popular VST Effects
        self._add_vst_effects()
        
        # Max for Live Devices
        self._add_m4l_devices()
    
    def _add_sergik_devices(self):
        """Add SERGIK custom devices."""
        self.plugins["SergikL Splitz"] = PluginInfo(
            name="SergikL Splitz",
            manufacturer="SERGIK",
            type="m4l_device",
            category="stem_separation",
            description="Professional stem separation and intelligent arrangement system using AI-driven separation",
            parameters=[
                "Slice Density (Simpler Mode + Sensitivity)",
                "Pitch Control (-12 to +12 semitones)",
                "Time Stretching (0.5x to 2.0x)",
                "FX Suppression (Gate threshold + Multiband compression)"
            ],
            common_uses=["Stem separation", "Sample manipulation", "Arrangement"],
            sergik_usage="Primary tool for 7-stem architecture (Vocals, Drums, Bass, Guitars, Keys, Percussion, Other)"
        )
        
        self.plugins["Sergik IO"] = PluginInfo(
            name="Sergik IO",
            manufacturer="SERGIK",
            type="effect",
            category="channel_strip",
            description="Custom Audio Effect Rack - default channel strip",
            parameters=["Multiple macro controls"],
            common_uses=["Channel processing", "Default track effect"],
            sergik_usage="Default audio effect in SERGIK templates"
        )
        
        self.plugins["Cut Rugs Sampler Cheats2"] = PluginInfo(
            name="Cut Rugs Sampler Cheats2",
            manufacturer="SERGIK",
            type="instrument",
            category="sampler",
            description="Instrument Rack with Sampler - default instrument",
            parameters=["Sampler parameters", "Rack macros"],
            common_uses=["Default instrument", "Sample playback"],
            sergik_usage="Default instrument in SERGIK templates"
        )
        
        self.plugins["g6_Mixdown Rack"] = PluginInfo(
            name="g6_Mixdown Rack",
            manufacturer="SERGIK",
            type="effect",
            category="mastering",
            description="Master bus processing rack (32KB preset)",
            parameters=["Master bus controls"],
            common_uses=["Master bus processing", "Mixdown"],
            sergik_usage="Standard mixdown rack in SERGIK workflow"
        )
        
        self.plugins["SERG CHORDS"] = PluginInfo(
            name="SERG CHORDS",
            manufacturer="SERGIK",
            type="midi_effect",
            category="chord_generator",
            description="Chord generation/manipulation MIDI effect",
            parameters=["Chord voicings", "Inversions"],
            common_uses=["Chord generation", "Harmony manipulation"],
            sergik_usage="Custom chord generation tool"
        )
        
        self.plugins["SERG Dmin Harm"] = PluginInfo(
            name="SERG Dmin Harm",
            manufacturer="SERGIK",
            type="midi_effect",
            category="harmonic_generator",
            description="D minor harmonic generator",
            parameters=["Harmonic patterns"],
            common_uses=["D minor harmony", "Modal generation"],
            sergik_usage="Specialized harmonic generator for D minor (7A/10B)"
        )
    
    def _add_ableton_instruments(self):
        """Add Ableton Live native instruments."""
        instruments = {
            "Operator": {
                "description": "FM synthesizer with 4 operators, multiple algorithms",
                "parameters": ["Oscillator A/B/C/D", "Algorithm", "Filter", "Envelope", "LFO"],
                "common_uses": ["Bass", "Leads", "Pads", "Percussion"],
                "sergik_usage": "Commonly used for bass and lead sounds in tech house"
            },
            "Analog": {
                "description": "Virtual analog synthesizer with 2 oscillators",
                "parameters": ["Oscillator 1/2", "Filter", "Envelope", "LFO", "Unison"],
                "common_uses": ["Bass", "Leads", "Pads", "Classic analog sounds"],
                "sergik_usage": "Warm analog-style bass and leads"
            },
            "Wavetable": {
                "description": "Wavetable synthesizer with morphing waveforms",
                "parameters": ["Wavetable", "Oscillator", "Filter", "Envelope", "LFO", "Modulation"],
                "common_uses": ["Modern leads", "Bass", "Pads", "Textures"],
                "sergik_usage": "Contemporary tech house leads and bass"
            },
            "Simpler": {
                "description": "Sample playback instrument with slicing",
                "parameters": ["Sample", "Filter", "Envelope", "LFO", "Slice mode"],
                "common_uses": ["Sample playback", "Drum programming", "One-shots"],
                "sergik_usage": "Primary sampler in SergikL Splitz workflow"
            },
            "Sampler": {
                "description": "Advanced sample playback with multi-sampling",
                "parameters": ["Sample zones", "Filter", "Envelope", "LFO", "Modulation"],
                "common_uses": ["Multi-sampled instruments", "Complex sample manipulation"],
                "sergik_usage": "Preferred over Simpler for more control (SERGIK workflow preference)"
            },
            "Drum Rack": {
                "description": "Drum pad instrument with individual sample slots",
                "parameters": ["Pad samples", "Choke groups", "Return tracks"],
                "common_uses": ["Drum programming", "Percussion", "One-shot samples"],
                "sergik_usage": "Standard drum programming tool"
            },
            "Impulse": {
                "description": "Drum machine with 8 sample slots",
                "parameters": ["8 sample slots", "Filter", "Envelope"],
                "common_uses": ["Drum programming", "Classic drum machine"],
                "sergik_usage": "Legacy drum machine (less common in modern workflow)"
            },
            "Collision": {
                "description": "Physical modeling percussion synthesizer",
                "parameters": ["Mallet", "Resonator", "Noise", "Envelope"],
                "common_uses": ["Percussion", "Mallets", "Textures"],
                "sergik_usage": "Specialized percussion sounds"
            },
            "Electric": {
                "description": "Electric piano physical modeling",
                "parameters": ["Tine", "Pickup", "Envelope"],
                "common_uses": ["Electric piano", "Rhodes sounds"],
                "sergik_usage": "Keys layer in multi-layer architecture"
            },
            "Tension": {
                "description": "String physical modeling synthesizer",
                "parameters": ["Excitation", "String", "Pickup", "Envelope"],
                "common_uses": ["Strings", "Plucked instruments", "Textures"],
                "sergik_usage": "Textural elements in arrangements"
            },
            "Drift": {
                "description": "Analog-style synthesizer with drift",
                "parameters": ["Oscillator", "Filter", "Envelope", "Drift"],
                "common_uses": ["Analog-style sounds", "Bass", "Leads"],
                "sergik_usage": "Modern analog-style synthesis"
            }
        }
        
        for name, info in instruments.items():
            self.plugins[name] = PluginInfo(
                name=name,
                manufacturer="Ableton",
                type="instrument",
                category="synthesizer" if name not in ["Simpler", "Sampler", "Drum Rack", "Impulse"] else "sampler",
                description=info["description"],
                parameters=info["parameters"],
                common_uses=info["common_uses"],
                sergik_usage=info.get("sergik_usage")
            )
    
    def _add_ableton_effects(self):
        """Add Ableton Live native effects."""
        effects = {
            "Multiband Dynamics": {
                "description": "4-band multiband compressor/expander",
                "parameters": ["Low/Mid-Low/Mid-High/High bands", "Threshold", "Ratio", "Attack", "Release"],
                "common_uses": ["Frequency-specific compression", "Spectral shaping"],
                "sergik_usage": "CRITICAL - Used in every stem processing chain (SERGIK signature)"
            },
            "Gate": {
                "description": "Noise gate with sidechain",
                "parameters": ["Threshold", "Attack", "Hold", "Release", "Floor"],
                "common_uses": ["Noise reduction", "Transient shaping", "Sidechain gating"],
                "sergik_usage": "CRITICAL - Applied per stem for clean transient control (SERGIK signature)"
            },
            "EQ Eight": {
                "description": "8-band parametric equalizer",
                "parameters": ["8 bands", "Frequency", "Gain", "Q", "Filter types"],
                "common_uses": ["Frequency shaping", "Surgical EQ"],
                "sergik_usage": "Spectral separation processing"
            },
            "EQ Three": {
                "description": "3-band graphic equalizer",
                "parameters": ["Low/Mid/High bands", "Gain"],
                "common_uses": ["Quick EQ", "Tone shaping"],
                "sergik_usage": "Simplified EQ for quick adjustments"
            },
            "Compressor": {
                "description": "Classic compressor",
                "parameters": ["Threshold", "Ratio", "Attack", "Release", "Knee"],
                "common_uses": ["Dynamic control", "Punch", "Glue"],
                "sergik_usage": "Standard compression"
            },
            "Glue Compressor": {
                "description": "Bus compressor with character",
                "parameters": ["Threshold", "Ratio", "Attack", "Release", "Dry/Wet"],
                "common_uses": ["Bus compression", "Glue", "Character"],
                "sergik_usage": "Master bus and group compression"
            },
            "Limiter": {
                "description": "Peak limiter",
                "parameters": ["Ceiling", "Release", "Lookahead"],
                "common_uses": ["Peak limiting", "Mastering"],
                "sergik_usage": "Final stage limiting"
            },
            "Saturator": {
                "description": "Waveshaping saturation",
                "parameters": ["Drive", "Base", "Tone", "Output"],
                "common_uses": ["Harmonic saturation", "Warmth", "Distortion"],
                "sergik_usage": "Adding character and warmth"
            },
            "Reverb": {
                "description": "Convolution reverb",
                "parameters": ["Room size", "Decay time", "Pre-delay", "High cut", "Dry/Wet"],
                "common_uses": ["Spatial effects", "Ambience"],
                "sergik_usage": "A-Reverb send (recorded as discrete stem)"
            },
            "Hybrid Reverb": {
                "description": "Convolution + algorithmic reverb",
                "parameters": ["Convolution", "Algorithmic", "Mix", "Pre-delay"],
                "common_uses": ["Advanced reverb", "Spatial design"],
                "sergik_usage": "Modern reverb alternative"
            },
            "Delay": {
                "description": "Ping-pong delay",
                "parameters": ["Time", "Feedback", "Ping-pong", "Dry/Wet"],
                "common_uses": ["Echo effects", "Spatial effects"],
                "sergik_usage": "B-Delay send (recorded as discrete stem)"
            },
            "Simple Delay": {
                "description": "Basic delay",
                "parameters": ["Time", "Feedback", "Dry/Wet"],
                "common_uses": ["Simple echo", "Delay"],
                "sergik_usage": "Basic delay needs"
            },
            "Filter Delay": {
                "description": "Delay with filter per tap",
                "parameters": ["Time", "Feedback", "Filter", "Dry/Wet"],
                "common_uses": ["Filtered delay", "Dub effects"],
                "sergik_usage": "Dub-style processing"
            },
            "Echo": {
                "description": "Analog-style delay/echo",
                "parameters": ["Time", "Feedback", "Modulation", "Dry/Wet"],
                "common_uses": ["Analog delay", "Vintage echo"],
                "sergik_usage": "Vintage-style delay"
            },
            "Auto Filter": {
                "description": "Envelope/LFO filter",
                "parameters": ["Filter type", "Frequency", "Resonance", "Envelope", "LFO"],
                "common_uses": ["Filter sweeps", "Movement", "Automation"],
                "sergik_usage": "Dynamic filtering and movement"
            },
            "Auto Pan": {
                "description": "LFO panning",
                "parameters": ["Rate", "Amount", "Phase", "Shape"],
                "common_uses": ["Panning effects", "Movement"],
                "sergik_usage": "Spatial movement"
            },
            "Utility": {
                "description": "Utility tool (gain, pan, phase, width)",
                "parameters": ["Gain", "Pan", "Phase", "Stereo Width", "Bass Mono"],
                "common_uses": ["Gain staging", "Panning", "Phase correction"],
                "sergik_usage": "Essential utility for gain staging"
            },
            "Spectrum": {
                "description": "Real-time spectrum analyzer",
                "parameters": ["FFT size", "Window", "Smoothing"],
                "common_uses": ["Frequency analysis", "Visual feedback"],
                "sergik_usage": "Frequency analysis and monitoring"
            }
        }
        
        for name, info in effects.items():
            self.plugins[name] = PluginInfo(
                name=name,
                manufacturer="Ableton",
                type="effect",
                category=info.get("category", "effect"),
                description=info["description"],
                parameters=info["parameters"],
                common_uses=info["common_uses"],
                sergik_usage=info.get("sergik_usage")
            )
    
    def _add_ableton_midi_effects(self):
        """Add Ableton Live MIDI effects."""
        midi_effects = {
            "Arpeggiator": {
                "description": "Arpeggio generator",
                "parameters": ["Rate", "Gate", "Steps", "Distance", "Transpose"],
                "common_uses": ["Arpeggios", "Patterns"]
            },
            "Chord": {
                "description": "Chord generator",
                "parameters": ["Chord type", "Shift", "Range"],
                "common_uses": ["Chord generation", "Harmony"]
            },
            "Scale": {
                "description": "Scale quantizer",
                "parameters": ["Scale", "Base"],
                "common_uses": ["Scale quantization", "Musical correction"]
            },
            "Pitch": {
                "description": "Pitch shifter",
                "parameters": ["Pitch", "Range"],
                "common_uses": ["Pitch shifting", "Transposition"]
            },
            "Random": {
                "description": "Random note generator",
                "parameters": ["Chance", "Choices", "Scale"],
                "common_uses": ["Randomization", "Variation"]
            },
            "Velocity": {
                "description": "Velocity processor",
                "parameters": ["Random", "Drive", "Compress", "Out Hi/Lo"],
                "common_uses": ["Velocity shaping", "Dynamics"]
            },
            "Note Length": {
                "description": "Note length processor",
                "parameters": ["Length", "Mode"],
                "common_uses": ["Note length control", "Staccato/Legato"]
            }
        }
        
        for name, info in midi_effects.items():
            self.plugins[name] = PluginInfo(
                name=name,
                manufacturer="Ableton",
                type="midi_effect",
                category="midi_effect",
                description=info["description"],
                parameters=info["parameters"],
                common_uses=info["common_uses"]
            )
    
    def _add_vst_synthesizers(self):
        """Add popular VST synthesizers."""
        vst_synths = {
            # Xfer Records
            "Serum": {
                "manufacturer": "Xfer Records",
                "description": "Wavetable synthesizer - industry standard",
                "parameters": ["Oscillators", "Wavetables", "Filter", "Envelope", "LFO", "Effects"],
                "common_uses": ["Leads", "Bass", "Pads", "Modern electronic music"],
                "sergik_usage": "Popular choice for contemporary tech house leads"
            },
            "LFOTool": {
                "manufacturer": "Xfer Records",
                "description": "LFO and sidechain tool",
                "parameters": ["LFO shapes", "Sidechain", "Volume automation"],
                "common_uses": ["Sidechain", "Volume automation", "Pumping effects"]
            },
            # Native Instruments
            "Massive": {
                "manufacturer": "Native Instruments",
                "description": "Wavetable synthesizer",
                "parameters": ["Oscillators", "Filters", "Envelopes", "LFOs", "Effects"],
                "common_uses": ["Bass", "Leads", "Pads", "Electronic music"]
            },
            "Massive X": {
                "manufacturer": "Native Instruments",
                "description": "Advanced wavetable synthesizer",
                "parameters": ["Oscillators", "Filters", "Modulators", "Effects"],
                "common_uses": ["Modern synthesis", "Complex sounds"]
            },
            "Kontakt": {
                "manufacturer": "Native Instruments",
                "description": "Advanced sampler and sample library host",
                "parameters": ["Sample zones", "Filters", "Envelopes", "Scripting", "Effects"],
                "common_uses": ["Orchestral", "Cinematic", "Realistic instruments", "Sample libraries"]
            },
            "Battery": {
                "manufacturer": "Native Instruments",
                "description": "Drum sampler",
                "parameters": ["Drum cells", "Samples", "Filters", "Effects", "Choke groups"],
                "common_uses": ["Drum programming", "Percussion", "One-shots"]
            },
            "Maschine": {
                "manufacturer": "Native Instruments",
                "description": "Groove production software",
                "parameters": ["Patterns", "Samples", "Synthesizers", "Effects"],
                "common_uses": ["Beat making", "Groove production", "Hip-hop", "Electronic"]
            },
            "Reaktor": {
                "manufacturer": "Native Instruments",
                "description": "Modular synthesizer and effects platform",
                "parameters": ["Modules", "Routings", "Custom instruments"],
                "common_uses": ["Modular synthesis", "Custom instruments", "Experimental"]
            },
            "FM8": {
                "manufacturer": "Native Instruments",
                "description": "FM synthesizer",
                "parameters": ["8 Operators", "Algorithms", "Filters", "Envelopes"],
                "common_uses": ["FM synthesis", "Bass", "Percussion", "Textures"]
            },
            "Absynth": {
                "manufacturer": "Native Instruments",
                "description": "Hybrid synthesizer",
                "parameters": ["Oscillators", "Filters", "Envelopes", "Effects"],
                "common_uses": ["Textures", "Pads", "Atmospheric sounds"]
            },
            "Monark": {
                "manufacturer": "Native Instruments",
                "description": "Minimoog emulation",
                "parameters": ["Oscillators", "Filter", "Envelope", "LFO"],
                "common_uses": ["Classic analog sounds", "Bass", "Leads"]
            },
            # Arturia
            "Pigments": {
                "manufacturer": "Arturia",
                "description": "Hybrid synthesizer",
                "parameters": ["Engines", "Filters", "Modulation", "Effects"],
                "common_uses": ["Modern synthesis", "Complex sounds"]
            },
            "Analog Lab": {
                "manufacturer": "Arturia",
                "description": "Preset browser for Arturia synths",
                "parameters": ["Presets", "Filters", "Effects"],
                "common_uses": ["Quick sound selection", "Vintage sounds", "Preset browsing"]
            },
            "V Collection": {
                "manufacturer": "Arturia",
                "description": "Collection of vintage synth emulations",
                "parameters": ["Multiple synths", "Presets"],
                "common_uses": ["Vintage sounds", "Classic synthesis", "Analog emulation"]
            },
            "Mini V": {
                "manufacturer": "Arturia",
                "description": "Minimoog emulation",
                "parameters": ["Oscillators", "Filter", "Envelope"],
                "common_uses": ["Classic bass", "Leads", "Analog sounds"]
            },
            "Jupiter-8V": {
                "manufacturer": "Arturia",
                "description": "Roland Jupiter-8 emulation",
                "parameters": ["Oscillators", "Filters", "Envelopes", "LFO"],
                "common_uses": ["Pads", "Strings", "Classic analog"]
            },
            "CS-80V": {
                "manufacturer": "Arturia",
                "description": "Yamaha CS-80 emulation",
                "parameters": ["Oscillators", "Filters", "Envelopes", "Ribbon"],
                "common_uses": ["Pads", "Strings", "Cinematic"]
            },
            "ARP 2600 V": {
                "manufacturer": "Arturia",
                "description": "ARP 2600 emulation",
                "parameters": ["Oscillators", "Filters", "Envelopes", "Modulation"],
                "common_uses": ["Classic analog", "Bass", "Leads"]
            },
            "Matrix-12 V": {
                "manufacturer": "Arturia",
                "description": "Oberheim Matrix-12 emulation",
                "parameters": ["Oscillators", "Filters", "Matrix modulation"],
                "common_uses": ["Complex modulation", "Pads", "Textures"]
            },
            "SEM V": {
                "manufacturer": "Arturia",
                "description": "Oberheim SEM emulation",
                "parameters": ["Oscillators", "Filter", "Envelope"],
                "common_uses": ["Classic analog", "Bass", "Leads"]
            },
            "Modular V": {
                "manufacturer": "Arturia",
                "description": "Modular synthesizer",
                "parameters": ["Modules", "Patches", "Routings"],
                "common_uses": ["Modular synthesis", "Experimental", "Custom patches"]
            },
            "Buchla Easel V": {
                "manufacturer": "Arturia",
                "description": "Buchla Easel emulation",
                "parameters": ["Oscillators", "Filters", "Modulation"],
                "common_uses": ["Experimental", "Textures", "Unique sounds"]
            },
            # u-he
            "Diva": {
                "manufacturer": "u-he",
                "description": "Virtual analog synthesizer",
                "parameters": ["Oscillators", "Filter", "Envelope", "LFO"],
                "common_uses": ["Analog sounds", "Warmth", "Character"],
                "sergik_usage": "Warm analog-style bass and leads"
            },
            "Zebra2": {
                "manufacturer": "u-he",
                "description": "Modular synthesizer",
                "parameters": ["Modules", "Routings", "Filters", "Envelopes"],
                "common_uses": ["Complex synthesis", "Cinematic", "Textures"]
            },
            "Hive": {
                "manufacturer": "u-he",
                "description": "Modern synthesizer",
                "parameters": ["Oscillators", "Filters", "Envelopes", "Effects"],
                "common_uses": ["Modern sounds", "Bass", "Leads", "Pads"]
            },
            "Bazille": {
                "manufacturer": "u-he",
                "description": "Modular synthesizer",
                "parameters": ["Modules", "Routings", "Filters"],
                "common_uses": ["Modular synthesis", "Experimental", "Unique sounds"]
            },
            "Repro-5": {
                "manufacturer": "u-he",
                "description": "Prophet-5 emulation",
                "parameters": ["Oscillators", "Filters", "Envelopes", "LFO"],
                "common_uses": ["Classic analog", "Pads", "Strings", "Leads"]
            },
            "Repro-1": {
                "manufacturer": "u-he",
                "description": "Prophet-1 emulation",
                "parameters": ["Oscillators", "Filter", "Envelope"],
                "common_uses": ["Classic analog", "Bass", "Leads"]
            },
            "ACE": {
                "manufacturer": "u-he",
                "description": "Analog Circuit Emulation",
                "parameters": ["Oscillators", "Filters", "Envelopes"],
                "common_uses": ["Analog sounds", "Warmth", "Character"]
            },
            "TyrellN6": {
                "manufacturer": "u-he",
                "description": "Free virtual analog synthesizer",
                "parameters": ["Oscillators", "Filter", "Envelope", "LFO"],
                "common_uses": ["Analog sounds", "Bass", "Leads"]
            },
            # LennarDigital
            # Spectrasonics
            "Omnisphere": {
                "manufacturer": "Spectrasonics",
                "description": "Hybrid synthesizer with samples",
                "parameters": ["Layers", "Oscillators", "Filters", "Effects"],
                "common_uses": ["Cinematic", "Pads", "Textures"]
            },
            "Keyscape": {
                "manufacturer": "Spectrasonics",
                "description": "Virtual keyboard collection",
                "parameters": ["Multiple keyboards", "Effects", "Layering"],
                "common_uses": ["Piano", "Rhodes", "Organ", "Keys"]
            },
            "Trilian": {
                "manufacturer": "Spectrasonics",
                "description": "Bass synthesizer",
                "parameters": ["Bass engines", "Filters", "Effects"],
                "common_uses": ["Bass", "Sub bass", "Low end"]
            },
            "Stylus RMX": {
                "manufacturer": "Spectrasonics",
                "description": "Drum and percussion library",
                "parameters": ["Drum kits", "Loops", "Effects"],
                "common_uses": ["Drums", "Percussion", "Loops"]
            },
            # Other Synthesizers
            "Spire": {
                "manufacturer": "Reveal Sound",
                "description": "Virtual analog synthesizer",
                "parameters": ["Oscillators", "Filters", "Envelopes", "Effects"],
                "common_uses": ["House", "Trance", "EDM", "Bass", "Leads"]
            },
            "VPS Avenger": {
                "manufacturer": "Vengeance Sound",
                "description": "Multi-engine synthesizer",
                "parameters": ["Engines", "Filters", "Effects", "Modulation"],
                "common_uses": ["EDM", "House", "Trance", "Modern sounds"]
            },
            "Nexus": {
                "manufacturer": "reFX",
                "description": "ROMpler synthesizer",
                "parameters": ["Presets", "Filters", "Effects"],
                "common_uses": ["EDM", "House", "Trance", "Quick sounds"]
            },
            "Phase Plant": {
                "manufacturer": "Kilhearts",
                "description": "Modular synthesizer",
                "parameters": ["Generators", "Modulators", "Effects"],
                "common_uses": ["Modern synthesis", "Complex sounds", "Experimental"]
            },
            "Vital": {
                "manufacturer": "Matt Tytel",
                "description": "Free wavetable synthesizer",
                "parameters": ["Oscillators", "Wavetables", "Filters", "Effects"],
                "common_uses": ["Modern sounds", "Bass", "Leads", "Pads"]
            },
            "Surge": {
                "manufacturer": "Surge Synth Team",
                "description": "Open-source synthesizer",
                "parameters": ["Oscillators", "Filters", "Envelopes", "Effects"],
                "common_uses": ["Analog sounds", "Bass", "Leads", "Pads"]
            },
            "Helm": {
                "manufacturer": "Matt Tytel",
                "description": "Free synthesizer",
                "parameters": ["Oscillators", "Filter", "Envelope", "LFO"],
                "common_uses": ["Analog sounds", "Bass", "Leads"]
            }
        }
        
        for name, info in vst_synths.items():
            self.plugins[name] = PluginInfo(
                name=name,
                manufacturer=info["manufacturer"],
                type="instrument",
                category="synthesizer",
                description=info["description"],
                parameters=info["parameters"],
                common_uses=info["common_uses"],
                sergik_usage=info.get("sergik_usage")
            )
    
    def _add_vst_effects(self):
        """Add popular VST effects."""
        vst_effects = {
            # FabFilter
            "FabFilter Pro-Q 3": {
                "manufacturer": "FabFilter",
                "description": "Professional parametric EQ with dynamic bands",
                "parameters": ["Multiple bands", "Dynamic EQ", "Linear phase", "Spectrum analyzer"],
                "common_uses": ["Surgical EQ", "Mastering", "Mixing"]
            },
            "FabFilter Pro-C 2": {
                "manufacturer": "FabFilter",
                "description": "Professional compressor",
                "parameters": ["Threshold", "Ratio", "Attack", "Release", "Knee", "Sidechain"],
                "common_uses": ["Compression", "Mastering", "Mixing"]
            },
            "FabFilter Pro-L 2": {
                "manufacturer": "FabFilter",
                "description": "Professional limiter",
                "parameters": ["Ceiling", "Release", "Lookahead", "True peak"],
                "common_uses": ["Limiting", "Mastering", "Loudness"]
            },
            "FabFilter Pro-R": {
                "manufacturer": "FabFilter",
                "description": "Professional reverb",
                "parameters": ["Room size", "Decay", "Brightness", "Damping"],
                "common_uses": ["Reverb", "Spatial effects", "Mastering"]
            },
            "FabFilter Saturn 2": {
                "manufacturer": "FabFilter",
                "description": "Multiband saturation and distortion",
                "parameters": ["Drive", "Tone", "Model", "Multiband", "Modulation"],
                "common_uses": ["Saturation", "Distortion", "Character", "Warmth"]
            },
            "FabFilter Timeless 3": {
                "manufacturer": "FabFilter",
                "description": "Delay and echo",
                "parameters": ["Time", "Feedback", "Modulation", "Filters"],
                "common_uses": ["Delay", "Echo", "Modulation"]
            },
            "FabFilter Simplon": {
                "manufacturer": "FabFilter",
                "description": "Simple filter",
                "parameters": ["Frequency", "Resonance", "Filter type"],
                "common_uses": ["Filtering", "Simple EQ"]
            },
            "FabFilter One": {
                "manufacturer": "FabFilter",
                "description": "Simple synthesizer",
                "parameters": ["Oscillator", "Filter", "Envelope"],
                "common_uses": ["Simple synthesis", "Bass", "Leads"]
            },
            # Valhalla DSP
            "Valhalla Room": {
                "manufacturer": "Valhalla DSP",
                "description": "Algorithmic reverb with 12 algorithms",
                "parameters": ["Room size", "Decay", "Pre-delay", "Modulation", "Algorithm"],
                "common_uses": ["Reverb", "Spatial effects", "Ambience"]
            },
            "Valhalla VintageVerb": {
                "manufacturer": "Valhalla DSP",
                "description": "Classic digital reverb emulation",
                "parameters": ["Decay", "Size", "Modulation", "Color"],
                "common_uses": ["Vintage reverb", "Classic sounds", "Character"]
            },
            "Valhalla Plate": {
                "manufacturer": "Valhalla DSP",
                "description": "Plate reverb emulation",
                "parameters": ["Decay", "Size", "Modulation", "Damping"],
                "common_uses": ["Plate reverb", "Vocal reverb", "Classic sounds"]
            },
            "Valhalla Delay": {
                "manufacturer": "Valhalla DSP",
                "description": "Delay plugin with multiple modes",
                "parameters": ["Time", "Feedback", "Modulation", "Mode"],
                "common_uses": ["Delay", "Echo", "Modulation"]
            },
            "Valhalla ÜberMod": {
                "manufacturer": "Valhalla DSP",
                "description": "Modulated delay and reverb",
                "parameters": ["Time", "Feedback", "Modulation", "Reverb"],
                "common_uses": ["Modulated delay", "Reverb", "Spatial effects"]
            },
            "Valhalla Shimmer": {
                "manufacturer": "Valhalla DSP",
                "description": "Pitch-shifted reverb",
                "parameters": ["Decay", "Pitch", "Modulation", "Size"],
                "common_uses": ["Shimmer reverb", "Ambient", "Ethereal"]
            },
            "Valhalla SuperMassive": {
                "manufacturer": "Valhalla DSP",
                "description": "Free reverb and delay",
                "parameters": ["Decay", "Delay", "Modulation", "Mode"],
                "common_uses": ["Reverb", "Delay", "Ambient"]
            },
            # Soundtoys
            "Soundtoys Decapitator": {
                "manufacturer": "Soundtoys",
                "description": "Analog saturation modeler",
                "parameters": ["Drive", "Tone", "Model", "Mix"],
                "common_uses": ["Saturation", "Character", "Distortion", "Warmth"]
            },
            "Soundtoys EchoBoy": {
                "manufacturer": "Soundtoys",
                "description": "Delay plugin with vintage models",
                "parameters": ["Time", "Feedback", "Modulation", "Model"],
                "common_uses": ["Delay", "Echo", "Vintage delay"]
            },
            "Soundtoys Little Plate": {
                "manufacturer": "Soundtoys",
                "description": "Plate reverb",
                "parameters": ["Decay", "Damping", "Mix"],
                "common_uses": ["Plate reverb", "Vocal reverb"]
            },
            "Soundtoys Crystallizer": {
                "manufacturer": "Soundtoys",
                "description": "Granular delay and pitch shifter",
                "parameters": ["Time", "Pitch", "Feedback", "Size"],
                "common_uses": ["Granular effects", "Pitch shifting", "Textures"]
            },
            "Soundtoys PhaseMistress": {
                "manufacturer": "Soundtoys",
                "description": "Phaser plugin",
                "parameters": ["Rate", "Depth", "Feedback", "Stages"],
                "common_uses": ["Phasing", "Modulation", "Movement"]
            },
            "Soundtoys Tremolator": {
                "manufacturer": "Soundtoys",
                "description": "Tremolo and panning",
                "parameters": ["Rate", "Depth", "Shape", "Pan"],
                "common_uses": ["Tremolo", "Panning", "Modulation"]
            },
            "Soundtoys FilterFreak": {
                "manufacturer": "Soundtoys",
                "description": "Filter plugin",
                "parameters": ["Frequency", "Resonance", "Modulation", "Type"],
                "common_uses": ["Filtering", "Modulation", "Movement"]
            },
            "Soundtoys Radiator": {
                "manufacturer": "Soundtoys",
                "description": "Tube saturation",
                "parameters": ["Drive", "Tone", "Model"],
                "common_uses": ["Saturation", "Warmth", "Character"]
            },
            "Soundtoys Devil-Loc": {
                "manufacturer": "Soundtoys",
                "description": "Aggressive compression and distortion",
                "parameters": ["Compression", "Distortion", "Mix"],
                "common_uses": ["Aggressive compression", "Distortion", "Character"]
            },
            "Soundtoys PrimalTap": {
                "manufacturer": "Soundtoys",
                "description": "Delay and modulation",
                "parameters": ["Time", "Feedback", "Modulation"],
                "common_uses": ["Delay", "Modulation", "Movement"]
            },
            # iZotope
            "iZotope Ozone": {
                "manufacturer": "iZotope",
                "description": "Mastering suite",
                "parameters": ["EQ", "Compressor", "Limiter", "Exciter", "Stereo Width", "Imager"],
                "common_uses": ["Mastering", "Final processing"]
            },
            "iZotope Neutron": {
                "manufacturer": "iZotope",
                "description": "Mixing suite with AI",
                "parameters": ["EQ", "Compressor", "Gate", "Exciter", "Transient Shaper"],
                "common_uses": ["Mixing", "AI-assisted mixing"]
            },
            "iZotope RX": {
                "manufacturer": "iZotope",
                "description": "Audio repair and restoration",
                "parameters": ["Noise reduction", "De-click", "De-hum", "Spectral repair"],
                "common_uses": ["Audio repair", "Noise reduction", "Restoration"]
            },
            "iZotope Nectar": {
                "manufacturer": "iZotope",
                "description": "Vocal processing suite",
                "parameters": ["EQ", "Compressor", "De-esser", "Pitch correction", "Harmony"],
                "common_uses": ["Vocal processing", "Vocal mixing"]
            },
            "iZotope Trash 2": {
                "manufacturer": "iZotope",
                "description": "Distortion and filtering",
                "parameters": ["Distortion", "Filters", "Convolution", "Modulation"],
                "common_uses": ["Distortion", "Filtering", "Character"]
            },
            "iZotope Insight": {
                "manufacturer": "iZotope",
                "description": "Audio metering and analysis",
                "parameters": ["LUFS", "Spectrum", "Phase", "Stereo"],
                "common_uses": ["Metering", "Analysis", "Mastering"]
            },
            # Waves
            "Waves SSL G-Master Buss Compressor": {
                "manufacturer": "Waves",
                "description": "SSL 4000 G bus compressor emulation",
                "parameters": ["Threshold", "Ratio", "Attack", "Release"],
                "common_uses": ["Bus compression", "Glue", "Mastering"]
            },
            "Waves CLA-76": {
                "manufacturer": "Waves",
                "description": "1176 compressor emulation",
                "parameters": ["Input", "Output", "Attack", "Release"],
                "common_uses": ["Compression", "Vocal compression", "Character"]
            },
            "Waves CLA-2A": {
                "manufacturer": "Waves",
                "description": "LA-2A compressor emulation",
                "parameters": ["Peak Reduction", "Gain"],
                "common_uses": ["Vocal compression", "Smooth compression"]
            },
            "Waves H-Delay": {
                "manufacturer": "Waves",
                "description": "Hybrid delay",
                "parameters": ["Time", "Feedback", "Modulation", "Filters"],
                "common_uses": ["Delay", "Echo", "Modulation"]
            },
            "Waves L2 Ultramaximizer": {
                "manufacturer": "Waves",
                "description": "Limiter/maximizer",
                "parameters": ["Threshold", "Release", "Ceiling"],
                "common_uses": ["Limiting", "Mastering", "Loudness"]
            },
            "Waves SSL G-Equalizer": {
                "manufacturer": "Waves",
                "description": "SSL 4000 G EQ emulation",
                "parameters": ["High", "Mid", "Low", "Frequency"],
                "common_uses": ["EQ", "Mixing", "Character"]
            },
            "Waves Renaissance Axx": {
                "manufacturer": "Waves",
                "description": "Compressor",
                "parameters": ["Threshold", "Ratio", "Attack", "Release"],
                "common_uses": ["Compression", "Mixing"]
            },
            "Waves C6": {
                "manufacturer": "Waves",
                "description": "Multiband compressor",
                "parameters": ["6 bands", "Threshold", "Ratio", "Attack", "Release"],
                "common_uses": ["Multiband compression", "Mastering"]
            },
            "Waves PuigTec EQs": {
                "manufacturer": "Waves",
                "description": "Pultec EQ emulation",
                "parameters": ["Low", "High", "Boost", "Attenuation"],
                "common_uses": ["EQ", "Vintage EQ", "Character"]
            },
            "Waves J37": {
                "manufacturer": "Waves",
                "description": "Tape saturation",
                "parameters": ["Drive", "Bias", "Flutter", "Noise"],
                "common_uses": ["Tape saturation", "Warmth", "Character"]
            },
            # Universal Audio
            "UA 1176 Classic Limiter Collection": {
                "manufacturer": "Universal Audio",
                "description": "1176 compressor emulation",
                "parameters": ["Input", "Output", "Attack", "Release"],
                "common_uses": ["Compression", "Vocal compression", "Character"]
            },
            "UA LA-2A Leveler Collection": {
                "manufacturer": "Universal Audio",
                "description": "LA-2A compressor emulation",
                "parameters": ["Peak Reduction", "Gain"],
                "common_uses": ["Vocal compression", "Smooth compression"]
            },
            "UA Lexicon 224 Digital Reverb": {
                "manufacturer": "Universal Audio",
                "description": "Lexicon 224 reverb emulation",
                "parameters": ["Decay", "Size", "Pre-delay", "Mix"],
                "common_uses": ["Reverb", "Vintage reverb", "Character"]
            },
            "UA Pultec EQP-1A": {
                "manufacturer": "Universal Audio",
                "description": "Pultec EQ emulation",
                "parameters": ["Low", "High", "Boost", "Attenuation"],
                "common_uses": ["EQ", "Vintage EQ", "Character"]
            },
            "UA Fairchild 670": {
                "manufacturer": "Universal Audio",
                "description": "Fairchild compressor emulation",
                "parameters": ["Input", "Output", "Time Constant"],
                "common_uses": ["Bus compression", "Mastering", "Character"]
            },
            # Softube
            "Tube-Tech CL 1B": {
                "manufacturer": "Softube",
                "description": "Tube-Tech compressor emulation",
                "parameters": ["Threshold", "Ratio", "Attack", "Release"],
                "common_uses": ["Compression", "Smooth compression", "Character"]
            },
            "Weiss DS1-MK3": {
                "manufacturer": "Softube",
                "description": "Digital mastering compressor",
                "parameters": ["Threshold", "Ratio", "Attack", "Release"],
                "common_uses": ["Mastering", "Compression"]
            },
            "Modular": {
                "manufacturer": "Softube",
                "description": "Virtual modular synthesizer",
                "parameters": ["Modules", "Patches", "Routings"],
                "common_uses": ["Modular synthesis", "Experimental"]
            },
            # Other Effects
            "Sonnox Oxford Inflator": {
                "manufacturer": "Sonnox",
                "description": "Harmonic distortion and compression",
                "parameters": ["Amount", "Character", "Curve"],
                "common_uses": ["Harmonic enhancement", "Loudness", "Character"]
            },
            "Sonnox Oxford EQ": {
                "manufacturer": "Sonnox",
                "description": "Professional EQ",
                "parameters": ["Multiple bands", "Linear phase", "Dynamic"],
                "common_uses": ["EQ", "Mastering", "Mixing"]
            },
            "Sonnox Oxford Limiter": {
                "manufacturer": "Sonnox",
                "description": "Professional limiter",
                "parameters": ["Ceiling", "Release", "True peak"],
                "common_uses": ["Limiting", "Mastering"]
            },
            "Antares Auto-Tune Pro": {
                "manufacturer": "Antares",
                "description": "Pitch correction",
                "parameters": ["Pitch", "Retune speed", "Scale", "Formant"],
                "common_uses": ["Pitch correction", "Vocal tuning", "Creative effects"]
            },
            "Celemony Melodyne": {
                "manufacturer": "Celemony",
                "description": "Pitch and time correction",
                "parameters": ["Pitch", "Time", "Formant", "Polyphonic"],
                "common_uses": ["Pitch correction", "Time correction", "Vocal editing"]
            },
            "Eventide H3000 Factory": {
                "manufacturer": "Eventide",
                "description": "H3000 hardware emulation",
                "parameters": ["Multiple effects", "Modulation", "Pitch"],
                "common_uses": ["Modulation", "Pitch effects", "Character"]
            },
            "Eventide Blackhole": {
                "manufacturer": "Eventide",
                "description": "Reverb plugin",
                "parameters": ["Decay", "Size", "Modulation", "Mix"],
                "common_uses": ["Reverb", "Ambient", "Spatial effects"]
            },
            "Eventide UltraTap": {
                "manufacturer": "Eventide",
                "description": "Delay plugin",
                "parameters": ["Time", "Feedback", "Modulation", "Taps"],
                "common_uses": ["Delay", "Echo", "Modulation"]
            },
            "Plugin Alliance Brainworx": {
                "manufacturer": "Plugin Alliance",
                "description": "Collection of plugins",
                "parameters": ["Various"],
                "common_uses": ["Mixing", "Mastering", "Character"]
            },
            "Plugin Alliance SPL": {
                "manufacturer": "Plugin Alliance",
                "description": "SPL console emulations",
                "parameters": ["Various"],
                "common_uses": ["Console emulation", "Character"]
            },
            "Plugin Alliance Elysia": {
                "manufacturer": "Plugin Alliance",
                "description": "Mastering plugins",
                "parameters": ["Various"],
                "common_uses": ["Mastering", "Compression", "EQ"]
            },
            "Klanghelm MJUC": {
                "manufacturer": "Klanghelm",
                "description": "Variable-mu compressor",
                "parameters": ["Threshold", "Ratio", "Attack", "Release"],
                "common_uses": ["Compression", "Smooth compression", "Character"]
            },
            "Klanghelm DC8C": {
                "manufacturer": "Klanghelm",
                "description": "Compressor",
                "parameters": ["Threshold", "Ratio", "Attack", "Release"],
                "common_uses": ["Compression", "Mixing"]
            },
            "TDR Kotelnikov": {
                "manufacturer": "Tokyo Dawn Labs",
                "description": "Free compressor",
                "parameters": ["Threshold", "Ratio", "Attack", "Release"],
                "common_uses": ["Compression", "Mixing"]
            },
            "TDR Nova": {
                "manufacturer": "Tokyo Dawn Labs",
                "description": "Dynamic EQ",
                "parameters": ["Multiple bands", "Dynamic", "Threshold"],
                "common_uses": ["Dynamic EQ", "Mixing"]
            },
            "TDR VOS SlickEQ": {
                "manufacturer": "Tokyo Dawn Labs",
                "description": "EQ plugin",
                "parameters": ["Multiple bands", "Character"],
                "common_uses": ["EQ", "Mixing", "Character"]
            },
            "DMG Audio EQuality": {
                "manufacturer": "DMG Audio",
                "description": "Professional EQ",
                "parameters": ["Multiple bands", "Linear phase", "Dynamic"],
                "common_uses": ["EQ", "Mastering", "Mixing"]
            },
            "DMG Audio Compassion": {
                "manufacturer": "DMG Audio",
                "description": "Compressor",
                "parameters": ["Threshold", "Ratio", "Attack", "Release"],
                "common_uses": ["Compression", "Mastering"]
            },
            "DMG Audio Limitless": {
                "manufacturer": "DMG Audio",
                "description": "Limiter",
                "parameters": ["Ceiling", "Release", "True peak"],
                "common_uses": ["Limiting", "Mastering"]
            },
            "Accusonus ERA Bundle": {
                "manufacturer": "Accusonus",
                "description": "Audio repair tools",
                "parameters": ["Noise reduction", "De-esser", "Reverb removal"],
                "common_uses": ["Audio repair", "Noise reduction"]
            },
            "Maag EQ4": {
                "manufacturer": "Plugin Alliance",
                "description": "EQ with Air Band",
                "parameters": ["Low", "Mid", "High", "Air Band"],
                "common_uses": ["EQ", "High-end enhancement", "Character"]
            },
            "bx_console SSL 4000 E": {
                "manufacturer": "Plugin Alliance",
                "description": "SSL console emulation",
                "parameters": ["EQ", "Compression", "Character"],
                "common_uses": ["Console emulation", "Character", "Mixing"]
            },
            "bx_console SSL 4000 G": {
                "manufacturer": "Plugin Alliance",
                "description": "SSL console emulation",
                "parameters": ["EQ", "Compression", "Character"],
                "common_uses": ["Console emulation", "Character", "Mixing"]
            }
        }
        
        for name, info in vst_effects.items():
            self.plugins[name] = PluginInfo(
                name=name,
                manufacturer=info["manufacturer"],
                type="effect",
                category="effect",
                description=info["description"],
                parameters=info["parameters"],
                common_uses=info["common_uses"]
            )
    
    def _add_m4l_devices(self):
        """Add Max for Live devices."""
        m4l_devices = {
            "LFO": {
                "description": "Low-frequency oscillator",
                "parameters": ["Rate", "Shape", "Phase", "Sync"],
                "common_uses": ["Modulation", "Automation"]
            },
            "Envelope Follower": {
                "description": "Audio-to-envelope converter",
                "parameters": ["Attack", "Release", "Gain"],
                "common_uses": ["Sidechain", "Modulation"]
            },
            "Convolution Reverb Pro": {
                "description": "Advanced convolution reverb",
                "parameters": ["Impulse", "Mix", "Pre-delay"],
                "common_uses": ["Reverb", "Spatial effects"]
            }
        }
        
        for name, info in m4l_devices.items():
            self.plugins[name] = PluginInfo(
                name=name,
                manufacturer="Max for Live",
                type="m4l_device",
                category="effect",
                description=info["description"],
                parameters=info["parameters"],
                common_uses=info["common_uses"]
            )
    
    def get_plugin(self, name: str) -> Optional[PluginInfo]:
        """Get plugin by name."""
        return self.plugins.get(name)
    
    def search_plugins(self, query: str) -> List[PluginInfo]:
        """Search plugins by name, manufacturer, or category."""
        query_lower = query.lower()
        results = []
        
        for plugin in self.plugins.values():
            if (query_lower in plugin.name.lower() or
                query_lower in plugin.manufacturer.lower() or
                query_lower in plugin.category.lower() or
                query_lower in plugin.type.lower()):
                results.append(plugin)
        
        return results
    
    def get_by_category(self, category: str) -> List[PluginInfo]:
        """Get plugins by category."""
        return [p for p in self.plugins.values() if p.category == category]
    
    def get_by_type(self, plugin_type: str) -> List[PluginInfo]:
        """Get plugins by type."""
        return [p for p in self.plugins.values() if p.type == plugin_type]
    
    def get_sergik_plugins(self) -> List[PluginInfo]:
        """Get SERGIK-specific plugins."""
        return [p for p in self.plugins.values() if p.sergik_usage is not None]
    
    def get_critical_plugins(self) -> List[PluginInfo]:
        """Get plugins marked as critical in SERGIK workflow."""
        return [p for p in self.plugins.values() if p.sergik_usage and "CRITICAL" in p.sergik_usage]


# Global plugin knowledge base instance
_plugin_kb: Optional[PluginKnowledgeBase] = None


def get_plugin_knowledge_base() -> PluginKnowledgeBase:
    """Get global plugin knowledge base instance."""
    global _plugin_kb
    if _plugin_kb is None:
        _plugin_kb = PluginKnowledgeBase()
    return _plugin_kb

