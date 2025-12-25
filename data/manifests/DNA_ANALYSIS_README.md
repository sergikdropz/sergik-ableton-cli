# SERGIK DNA Analysis with MusicBrainz Integration

## Overview

The DNA refinement script (`scripts/refine_dna_from_exports.py`) now includes deep MusicBrainz integration for enhanced metadata extraction and genre analysis.

## Features

### 1. Audio Analysis
- **BPM Detection**: Autocorrelation-based tempo detection
- **Key Detection**: Chroma-based musical key analysis (Camelot notation)
- **Energy Analysis**: RMS-based energy level calculation (1-10 scale)
- **Spectral Features**: Spectral centroid, rolloff, rhythm complexity

### 2. MusicBrainz Integration
- **AcoustID Fingerprinting**: Audio fingerprinting for accurate track identification
- **Text Search Fallback**: Filename parsing to extract artist/title for search
- **Genre Extraction**: Automatic genre detection from MusicBrainz tags
- **Metadata Enrichment**: Artist, title, release information, tags

### 3. DNA Profile Refinement
- **BPM Profile**: Weighted average blending (70% existing, 30% new data)
- **Key Distribution**: Updated primary/secondary keys based on new analysis
- **Energy Profile**: Refined energy sweet spot calculation
- **Genre DNA**: Genre distribution updated from MusicBrainz data

## Usage

### Basic Usage
```bash
python scripts/refine_dna_from_exports.py [directory_path]
```

### Options
- `--max-files N`: Limit analysis to first N files (for testing)
- `--skip-analysis`: Skip analysis and refine from existing CSV data

### Example
```bash
# Analyze all tracks in default directory
python scripts/refine_dna_from_exports.py

# Analyze specific directory with limit
python scripts/refine_dna_from_exports.py "/path/to/music" --max-files 50
```

## Output Files

### 1. `exports_dna_analysis.csv`
Detailed analysis of each track including:
- Audio metadata (BPM, key, energy, duration)
- DNA match scores
- MusicBrainz data (artist, title, genres, tags)
- Lookup status

### 2. `exports_dna_statistics.json`
Statistical summary:
- BPM distribution
- Key distribution
- Energy profile
- Genre distribution (from MusicBrainz)
- DNA match statistics
- MusicBrainz lookup success rate

### 3. `sergik_dna_refined.json`
Refined SERGIK DNA profile:
- Updated BPM zones and averages
- Refined key distribution
- Updated energy profile
- Genre DNA percentages
- Refinement metadata

### 4. `data/profiles/master_profile.json`
Updated master profile with refined DNA

## MusicBrainz Setup

### Required Packages
```bash
pip install musicbrainzngs pyacoustid
```

### Optional: AcoustID API Key
For better fingerprinting accuracy, set the environment variable:

**Option 1: Temporary (current session only)**
```bash
export ACOUSTID_API_KEY="your_api_key_here"
```

**Option 2: Permanent (add to your shell profile)**
```bash
# Add to ~/.zshrc (macOS) or ~/.bashrc (Linux)
echo 'export ACOUSTID_API_KEY="your_api_key_here"' >> ~/.zshrc
source ~/.zshrc
```

**Option 3: Using .env file (recommended)**
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API key
# Then load it before running the script:
export $(cat .env | xargs)
python scripts/refine_dna_from_exports.py
```

**Get your free API key:**
- Visit: https://acoustid.org/api-key
- Sign up for a free account
- Copy your API key and use it in one of the methods above

**Note:** The API key is optional but recommended for better MusicBrainz lookup accuracy. Without it, the script will use text-based search as a fallback.

### Rate Limiting
The script automatically rate-limits MusicBrainz requests to 1 per second to comply with their usage policy.

## Genre Analysis

### Genre Mapping
MusicBrainz genres are comprehensively mapped to SERGIK DNA categories:

#### Hip-Hop Category (`hiphop`)
- All hip-hop variations: `hip-hop`, `hiphop`, `rap`, `trap`, `drill`, `grime`, `boom bap`
- Lo-fi variations: `lo-fi`, `lofi`, `lofi hip hop`
- Regional styles: `east coast hip hop`, `west coast hip hop`, `southern hip hop`
- Subgenres: `conscious hip hop`, `gangsta rap`, `hardcore hip hop`, `alternative hip hop`

#### House Category (`house`)
- All house variations: `house`, `tech house`, `deep house`, `progressive house`, `electro house`
- Regional styles: `chicago house`, `detroit house`, `garage house`
- Subgenres: `bass house`, `tropical house`, `vocal house`, `funky house`, `soulful house`
- Electronic dance: `techno`, `edm`, `electronic`, `dance`, `trance`, `dubstep`, `drum and bass`, `jungle`
- Club music: `club`, `big room`, `complextro`, `moombah`, `future bass`

#### Funk Category (`funk`)
- Funk variations: `funk`, `p-funk`, `g-funk`, `nu-funk`, `boogie`
- Disco: `disco`, `nu-disco`, `italo disco`, `disco house`
- Groove-based: `reggae`, `dancehall`, `dub`, `reggaeton`, `ska`
- World rhythms: `latin`, `salsa`, `samba`, `bossa nova`, `afrobeat`

#### Soul Category (`soul`)
- Soul variations: `soul`, `neo-soul`, `southern soul`, `northern soul`, `deep soul`
- R&B: `r&b`, `rnb`, `contemporary r&b`, `urban`, `motown`
- Jazz: `jazz`, `smooth jazz`, `acid jazz`, `nu jazz`, `jazz fusion`, `bebop`
- Chill/Downtempo: `ambient`, `chillout`, `downtempo`, `trip hop`, `lounge`, `chillwave`
- Pop: `pop`, `indie pop`, `alternative pop`

### Genre Normalization
The mapping system includes:
- **Normalization**: Handles case variations, separators (`-`, `_`, spaces)
- **Partial Matching**: Matches compound genres (e.g., "deep house" matches "house")
- **Fallback**: Unmatched genres default to `other` category

### Fallback Genre Inference
If MusicBrainz lookup fails, genres are inferred from audio analysis:
- **Hip-Hop**: 80-100 BPM
- **House**: 120-130 BPM
- **Funk**: 95-115 BPM
- **Soul**: Low energy (≤5)

## DNA Refinement Algorithm

### Weighted Blending
The refinement uses a 70/30 weighted blend:
- **70%** existing DNA profile (stability)
- **30%** new analysis data (adaptation)

This ensures the DNA profile evolves gradually while maintaining consistency.

### BPM Zones
- **Downtempo**: < 90 BPM
- **House**: 120-129 BPM
- Percentages updated based on new distribution

### Key Distribution
- Primary keys: Top 2 most common
- Secondary keys: Next 2 most common
- Distribution percentages blended with existing data

## Recent Analysis Results

From 381 tracks analyzed:

- **BPM**: Average 100.8 BPM (refined to 105.6)
  - 40.7% downtempo (< 90 BPM)
  - 36.2% house (120-124 BPM)
  
- **Keys**: 
  - Top: 7A (D minor) - 49.9%
  - Secondary: 8A (A minor) - 19.2%
  
- **Energy**: Average 8.4/10 (refined to 6.7)
  - 17.8% in sweet spot (5-7)

- **DNA Match**: 45.9% high match (≥70/100)

## Troubleshooting

### MusicBrainz Lookups Failing
1. Check internet connection
2. Verify `musicbrainzngs` is installed: `pip install musicbrainzngs`
3. Check rate limiting (script handles this automatically)

### AcoustID Fingerprinting Not Working
1. Install `pyacoustid`: `pip install pyacoustid`
2. Optional: Install `fpcalc` binary for better performance
3. Optional: Set `ACOUSTID_API_KEY` environment variable

### Low Success Rate
- MusicBrainz may not have all tracks in database
- Filename parsing helps with text search fallback
- Genre inference provides fallback when lookup fails

## Next Steps

1. **Install MusicBrainz packages** for full functionality:
   ```bash
   pip install musicbrainzngs pyacoustid
   ```

2. **Run full analysis** on all tracks:
   ```bash
   python scripts/refine_dna_from_exports.py
   ```

3. **Review results** in generated CSV and JSON files

4. **Iterate**: Run again on new music directories to continue refining DNA

