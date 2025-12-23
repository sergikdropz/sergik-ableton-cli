# SERGIK Workflow & Templates

## Ableton Template System

### Available Templates

| Template | Path | Purpose |
|----------|------|---------|
| SERGIK Template V2 | `/Users/machd/Music/Ableton/User Library/Templates/SERGIK Template V2.als` | Primary production template |
| SERGIK TEMPLATE | `/Users/machd/Music/Ableton/User Library/Templates/SERGIK TEMPLATE.als` | Legacy template |
| SERG 12.3 | `/Users/machd/Music/Ableton/User Library/Templates/SERG 12.3.als` | Ableton 12.3 optimized |
| SERG 12.3-1 | `/Users/machd/Music/Ableton/User Library/Templates/SERG 12.3-1.als` | Variant |

### Template Configuration

**Default Instrument:** Cut Rugs Sampler Cheats2 (Instrument Rack with Sampler)
**Default Audio Effect:** Sergik IO channel strip (custom Audio Effect Rack)
**Mixdown Rack:** g6_Mixdown Rack (32KB preset)

## SergikL Splitz Device

### Location
```
/Users/machd/Music/Ableton/User Library/SergikL Splitz/
```

### Purpose
Professional stem separation and intelligent arrangement system using AI-driven separation.

### Stem Output
7-stem architecture:
1. Vocals
2. Drums
3. Bass
4. Guitars
5. Keys
6. Percussion
7. Other

### Processing Chain (per stem)
1. Simpler or Sampler instrument (user selectable)
2. Gate (tightens transient tails)
3. Multiband Dynamics (spectral frequency control)

### Macro Controls
- **Slice Density:** Simpler Mode + Sensitivity
- **Pitch Control:** Transpose (-12 to +12 semitones)
- **Time Stretching:** Playback speed (0.5x to 2.0x)
- **FX Suppression:** Gate threshold + Multiband compression

### Development Versions
- `/Users/machd/Downloads/SergikL_Splitz_M4L_Build_Kit_v4/`
- `/Users/machd/Downloads/SergikL_Splitz_Max9_Project_READY/`
- `/Users/machd/Downloads/SergikL_Splitz_Alpha/`

## Signal Chain Architecture

### Standard Production Flow
```
1. CAPTURE
   └─ Direct recording to timestamped WAV files
   
2. SEPARATION
   └─ SergikL Splitz → 7 stems
   
3. ARRANGEMENT
   └─ Per-stem Simpler/Sampler chains with macro controls
   
4. PROCESSING
   └─ Gate + Multiband Dynamics per stem
   
5. MIXING
   └─ Reverb/Delay sends recorded as discrete stems
   
6. OUTPUT
   └─ Full-length stem exports + master bounce
```

### Channel Structure
- **Instruments per track:** Instrument Rack with 1-7 chains (one per stem)
- **Effects per chain:** 2 audio effects minimum (Gate + Multiband Dynamics)
- **Master processing:** Sergik IO channel strip + g6_Mixdown rack
- **Send/Return:** A-Reverb and B-Delay as explicit stems

## SERGIK Audio Effect Presets

| Preset | Size | Purpose |
|--------|------|---------|
| SERGIK Vox Chain 1 | 49KB | Vocal processing |
| SERGIK Master Funk Chain | 21KB | Master bus funk aesthetic |
| SERGIK DUB FX | 8.8KB | Dub-style spacious processing |
| SERG Duckka | 5.1KB | Sidechain ducking |
| SERG Duckka-2 | 5.9KB | Alternate ducking |
| SERG Around the Head | 5.9KB | Spatial/binaural processing |

## SERGIK MIDI Effects

- **SERG CHORDS:** Chord generation/manipulation
- **SERG Dmin Harm:** D minor harmonic generator

## Recording Session Patterns

### Live Recordings Structure
```
/Users/machd/Music/Ableton/Live Recordings/
├── 2024-03-15 143022 Temp Project/
│   ├── Ableton Project Info/
│   └── Samples/
│       ├── Recorded/     (live audio captures)
│       └── Processed/    (post-production)
└── [137 total sessions, 1.9GB]
```

### Session Naming Convention
```
YYYY-MM-DD HHMMSS Temp Project/
```

### Recording Statistics
- **Total Sessions:** 137
- **Date Range:** March 2024 - December 2025
- **Total Size:** 1.9 GB
- **Frequency:** 2-4 sessions per week average

## Project Examples

### WOMWOM 121BPM (Stem Export Structure)
```
/Users/machd/Desktop/WOMWOM 121BPM/
├── womwomwom 121BPM.wav          (full mix master)
├── 808.wav                        (bass synth)
├── kick.wav                       (kick drum)
├── clap.wav                       (drum element)
├── lead 1.wav, lead 2.wav, lead 3.wav  (3 melodic layers)
├── percussion.wav, percussion 2.wav
├── womp bass.wav                  (bassline)
├── 10-casio piano.wav             (melodic element)
├── 11-Simpler.wav                 (percussion sampler)
├── 12-Drum Rack.wav               (drum automation)
├── A-Reverb.wav                   (reverb send)
└── B-Delay.wav                    (delay send)
Total: 15 stems, 774 MB
```

### SLAPSTICK (Sample-Based Workflow)
```
/Users/machd/Desktop/SLAPSTICK Project/
├── Samples/
│   ├── Imported/    (22 files - drum loops, organ, etc.)
│   ├── Recorded/    (28 files - timestamped live recordings)
│   └── Processed/   (Crop subfolder)
└── SLAPSTICK.als, SLAPSTICK 1.als
Total: 52 samples, 245 MB
```

## Workflow Preferences

1. **Sampler > Simpler:** Default uses Sampler for more control
2. **Spectral Processing:** Heavy Multiband Dynamics for frequency-specific manipulation
3. **Transient Control:** Gate always present (removes bleed/noise)
4. **Macro Modulation:** Slice density, pitch, time all parameter-mapped
5. **Non-Destructive:** Stem export approach allows full re-mixing
