# SERGIK DNA Genre Mapping Reference

## Overview

The DNA refinement script includes a comprehensive genre mapping system that maps MusicBrainz genres and tags to SERGIK's four core DNA categories: `hiphop`, `house`, `funk`, and `soul`.

## Mapping Categories

### Hip-Hop (`hiphop`)
**Core Genres:**
- hip-hop, hiphop, hip hop
- rap, trap, drill, grime
- boom bap, lo-fi, lofi, lo fi
- alternative hip hop, conscious hip hop
- east coast hip hop, west coast hip hop, southern hip hop
- gangsta rap, hardcore hip hop

**Rationale:** All variations of hip-hop and rap music, including regional styles and subgenres.

### House (`house`)
**Core Genres:**
- house, tech house, tech-house, deep house
- progressive house, electro house, future house
- bass house, tropical house, garage house
- chicago house, detroit house, vocal house
- funky house, soulful house, afro house, latin house
- techno, minimal techno, detroit techno, acid techno
- electronic, edm, electronic dance music
- dance, club, club music, progressive
- trance, progressive trance, uplifting trance
- big room, complextro, moombahcore, moombah
- dubstep, brostep, future bass, bass music, bass
- dnb, drum and bass, drum n bass, jungle
- breakbeat, breakcore, neurofunk, liquid dnb
- idm, intelligent dance music, glitch, glitch hop
- juke, footwork, ghetto tech, baltimore club
- gqom, amapiano

**Rationale:** All electronic dance music styles, including house subgenres, techno, trance, and other EDM variations.

### Funk (`funk`)
**Core Genres:**
- funk, p-funk, g-funk, g funk, nu-funk, nu funk
- funk rock, funk metal, jazz funk, boogie, boogie funk
- disco, disco house, nu-disco, nu disco, italo disco
- reggae, dancehall, dub, reggaeton, ragga, ska, rocksteady
- latin, latin house, salsa, samba, bossa nova
- afrobeat, afro, world, world music

**Rationale:** Groove-based music with rhythmic emphasis, including funk, disco, reggae, and world rhythms.

### Soul (`soul`)
**Core Genres:**
- soul, neo-soul, neo soul, southern soul, northern soul
- deep soul, blue-eyed soul
- r&b, r and b, rnb, contemporary r&b, contemporary rnb
- urban, motown, philly soul, memphis soul, chicago soul
- jazz, smooth jazz, acid jazz, nu jazz, jazz fusion
- bebop, hard bop, cool jazz, modal jazz, free jazz
- ambient, ambient house, chillout, chill out, downtempo
- trip hop, trip-hop, lounge, chill, chillwave
- vaporwave, synthwave, retrowave
- pop, dance pop, electropop, synthpop
- indie pop, alternative pop

**Rationale:** Harmonic and melodic music with soulful elements, including R&B, jazz, ambient/chill, and pop with soulful characteristics.

## Genre Normalization

The mapping system includes intelligent normalization:

1. **Case Insensitive**: All genres are converted to lowercase
2. **Separator Handling**: Handles `-`, `_`, and spaces uniformly
3. **Whitespace Normalization**: Multiple spaces collapsed to single space
4. **Partial Matching**: Compound genres are matched if they contain key terms

### Examples

```
"Tech House" → "house"
"deep-house" → "house"
"hip hop" → "hiphop"
"lo-fi" → "hiphop"
"R&B" → "soul"
"neo-soul" → "soul"
"drum and bass" → "house"
"trip-hop" → "soul"
```

## Usage in DNA Refinement

When analyzing tracks:

1. **MusicBrainz Lookup**: Genres from MusicBrainz tags are normalized and mapped
2. **Fallback Inference**: If no MusicBrainz data, genres are inferred from BPM/energy:
   - 80-100 BPM → `hip-hop`
   - 120-130 BPM → `house`
   - 95-115 BPM → `funk`
   - Energy ≤5 → `soul`
3. **DNA Profile Update**: Mapped genres contribute to DNA category percentages using weighted blending (70% existing, 30% new)

## Statistics

The extended mapping covers:
- **150+ genre variations** mapped to 4 DNA categories
- **4 main categories**: hiphop, house, funk, soul
- **Comprehensive coverage** of electronic, urban, and world music genres

## Extending the Mapping

To add new genre mappings, update the `SERGIK_GENRE_MAPPING` dictionary in `scripts/refine_dna_from_exports.py`:

```python
SERGIK_GENRE_MAPPING = {
    'new_genre': 'dna_category',
    # ... existing mappings
}
```

The `map_genre_to_dna()` function will automatically handle normalization and matching.

