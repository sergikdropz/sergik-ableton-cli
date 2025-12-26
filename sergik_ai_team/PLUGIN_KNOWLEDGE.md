# Plugin Knowledge Base - Comprehensive Database

## Overview

The Plugin Knowledge Base provides comprehensive information about all plugins, VSTs, and audio devices used in SERGIK's production workflow. This knowledge is integrated into all agents, making them experts in plugin selection, usage, and SERGIK-specific workflows.

## Database Contents

### 1. SERGIK Custom Devices (6 devices)

#### SergikL Splitz
- **Type**: Max for Live Device
- **Category**: Stem Separation
- **Purpose**: Professional stem separation and intelligent arrangement system
- **Parameters**: Slice Density, Pitch Control, Time Stretching, FX Suppression
- **SERGIK Usage**: Primary tool for 7-stem architecture (Vocals, Drums, Bass, Guitars, Keys, Percussion, Other)

#### Sergik IO
- **Type**: Audio Effect Rack
- **Category**: Channel Strip
- **Purpose**: Custom default channel strip
- **SERGIK Usage**: Default audio effect in SERGIK templates

#### Cut Rugs Sampler Cheats2
- **Type**: Instrument Rack
- **Category**: Sampler
- **Purpose**: Default instrument with Sampler
- **SERGIK Usage**: Default instrument in SERGIK templates

#### g6_Mixdown Rack
- **Type**: Audio Effect Rack
- **Category**: Mastering
- **Purpose**: Master bus processing (32KB preset)
- **SERGIK Usage**: Standard mixdown rack

#### SERG CHORDS
- **Type**: MIDI Effect
- **Category**: Chord Generator
- **Purpose**: Chord generation/manipulation
- **SERGIK Usage**: Custom chord generation tool

#### SERG Dmin Harm
- **Type**: MIDI Effect
- **Category**: Harmonic Generator
- **Purpose**: D minor harmonic generator
- **SERGIK Usage**: Specialized for D minor (7A/10B)

### 2. Ableton Live Native Instruments (11 instruments)

- **Operator**: FM synthesizer (4 operators, multiple algorithms)
- **Analog**: Virtual analog synthesizer (2 oscillators)
- **Wavetable**: Wavetable synthesizer with morphing
- **Simpler**: Sample playback with slicing
- **Sampler**: Advanced multi-sampling
- **Drum Rack**: Drum pad instrument
- **Impulse**: Classic drum machine
- **Collision**: Physical modeling percussion
- **Electric**: Electric piano modeling
- **Tension**: String physical modeling
- **Drift**: Analog-style synthesizer with drift

### 3. Ableton Live Native Effects (18+ effects)

#### Critical SERGIK Effects:
- **Multiband Dynamics**: CRITICAL - Used in every stem processing chain
- **Gate**: CRITICAL - Applied per stem for clean transient control

#### Standard Effects:
- **EQ Eight**: 8-band parametric EQ
- **EQ Three**: 3-band graphic EQ
- **Compressor**: Classic compressor
- **Glue Compressor**: Bus compressor
- **Limiter**: Peak limiter
- **Saturator**: Waveshaping saturation
- **Reverb**: Convolution reverb (A-Reverb send)
- **Hybrid Reverb**: Convolution + algorithmic
- **Delay**: Ping-pong delay (B-Delay send)
- **Simple Delay**: Basic delay
- **Filter Delay**: Delay with filter per tap
- **Echo**: Analog-style delay
- **Auto Filter**: Envelope/LFO filter
- **Auto Pan**: LFO panning
- **Utility**: Gain, pan, phase, width
- **Spectrum**: Real-time spectrum analyzer

### 4. Ableton Live MIDI Effects (7 effects)

- **Arpeggiator**: Arpeggio generator
- **Chord**: Chord generator
- **Scale**: Scale quantizer
- **Pitch**: Pitch shifter
- **Random**: Random note generator
- **Velocity**: Velocity processor
- **Note Length**: Note length processor

### 5. Popular VST Synthesizers (7 synths)

- **Serum** (Xfer Records): Wavetable synthesizer - industry standard
- **Massive** (Native Instruments): Wavetable synthesizer
- **Massive X** (Native Instruments): Advanced wavetable
- **Sylenth1** (LennarDigital): Virtual analog (classic house/trance)
- **Diva** (u-he): Virtual analog (warmth, character)
- **Pigments** (Arturia): Hybrid synthesizer
- **Omnisphere** (Spectrasonics): Hybrid with samples

### 6. Popular VST Effects (6 effects)

- **FabFilter Pro-Q 3**: Professional parametric EQ
- **FabFilter Pro-C 2**: Professional compressor
- **Valhalla Room**: Algorithmic reverb
- **Valhalla Delay**: Delay plugin
- **Soundtoys Decapitator**: Saturation/distortion
- **iZotope Ozone**: Mastering suite

### 7. Max for Live Devices (3 devices)

- **LFO**: Low-frequency oscillator
- **Envelope Follower**: Audio-to-envelope converter
- **Convolution Reverb Pro**: Advanced convolution reverb

## SERGIK Workflow Integration

### Critical Processing Chain
```
1. Simpler/Sampler (instrument)
2. Gate (CRITICAL - transient control)
3. Multiband Dynamics (CRITICAL - spectral frequency control)
```

### Stem Architecture
- **7 Stems**: Vocals, Drums, Bass, Guitars, Keys, Percussion, Other
- **Per-Stem Processing**: Gate + Multiband Dynamics
- **Send/Return**: A-Reverb and B-Delay as discrete stems

### Template Defaults
- **Default Instrument**: Cut Rugs Sampler Cheats2
- **Default Effect**: Sergik IO channel strip
- **Mixdown Rack**: g6_Mixdown Rack

## Agent Integration

### AbleAgent
- Provides plugin information when loading devices
- Shows SERGIK usage context
- Lists critical plugins
- Searches plugin database

### Memoria
- Plugin search and information retrieval
- Critical plugin listings
- SERGIK-specific plugin usage

### VSTCraft
- Knows which synthesizers are best for different sounds
- Understands SERGIK's preferred instruments
- Can suggest plugins based on style

### ControllerDev
- Plugin integration guidance
- API endpoint information
- Device loading patterns

## Usage Examples

### Query Plugin Information
```bash
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "Memoria", "content": "plugin Multiband Dynamics"}'
```

### Search Plugins
```bash
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "Memoria", "content": "plugin search synthesizer"}'
```

### Load Device with Context
```bash
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "AbleAgent", "content": "load device Multiband Dynamics"}'
```

## Future Enhancements

- Real-time plugin parameter control
- Plugin preset management
- Plugin compatibility checking
- Usage statistics and recommendations
- Integration with plugin manufacturers' APIs
- User-owned plugin inventory tracking

## Data Sources

- Ableton Live documentation
- SERGIK workflow templates
- Industry-standard plugin databases
- SERGIK-specific custom devices
- Max for Live community devices

