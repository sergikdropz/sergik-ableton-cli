# SERGIK AI Team - Knowledge Base Enhancements

## Overview

All agents have been fortified with comprehensive SERGIK knowledge base access, making them domain experts in their respective areas.

## Knowledge Base System

### Core Components

1. **KnowledgeBase Class** (`utils/knowledge_base.py`)
   - Loads JSONL knowledge chunks
   - Loads markdown documentation files
   - Provides search and domain-specific accessors
   - Caches knowledge for fast access

2. **Domain Knowledge Accessors**
   - `get_style_signature()` - SERGIK production style
   - `get_quality_standards()` - Audio quality requirements
   - `get_workflow_info()` - Ableton templates and workflow
   - `get_musical_dna()` - BPM, key, energy profiles

## Agent Enhancements

### 1. VSTCraft (Generation Agent)
**Knowledge Added:**
- SERGIK's BPM sweet spot (122-126 BPM)
- Primary keys (10B, 11B, 7A, 8A)
- Default style (tech_house)
- Production philosophy (groove-first)
- Multi-layer melodic architecture

**Enhanced Features:**
- Defaults to SERGIK's primary key (10B) when not specified
- Uses SERGIK's sweet spot tempo (125 BPM)
- Provides style context in responses
- Shows SERGIK style signature on request

### 2. AbleAgent (Ableton Control)
**Knowledge Added:**
- SERGIK templates (SERGIK Template V2, SERG 12.3)
- Default instruments (Cut Rugs Sampler Cheats2)
- Default effects (Sergik IO channel strip)
- Stem architecture (7 stems)
- Processing chain (Simpler/Sampler → Gate → Multiband Dynamics)

**Enhanced Features:**
- Provides SERGIK context when setting tempo
- Shows template information
- Displays stem architecture details
- Suggests SERGIK workflow patterns

### 3. GrooveSense (Analysis Agent)
**Knowledge Added:**
- SERGIK DNA profile (BPM zones, keys, energy)
- Musical DNA matching
- Catalog statistics
- Genre fusion patterns

**Enhanced Features:**
- DNA matching for analyzed tracks
- Compares results to SERGIK's catalog
- Shows energy sweet spot (5-7)
- Provides key compatibility info

### 4. MaxNode (M4L Specialist)
**Knowledge Added:**
- SERGIK workflow defaults
- Device schema with SERGIK defaults
- Template information
- Processing chain details

**Enhanced Features:**
- Device schema includes SERGIK defaults
- Shows workflow information
- Provides template context

### 5. ControllerDev (Development Agent)
**Knowledge Added:**
- SERGIK API endpoints
- Integration defaults
- Workflow patterns
- Style signature

**Enhanced Features:**
- Shows SERGIK API endpoints
- Provides integration guide
- Context-aware code generation
- SERGIK-specific testing suggestions

### 6. Memoria (Knowledge Base Agent)
**New Agent - RAG Specialist**
- Searches knowledge chunks
- Provides domain-specific knowledge
- Answers style, quality, workflow questions
- Full-text search capabilities

### 7. AuralBrain (Training Agent)
**New Agent - Training Specialist**
- Fine-tune dataset management
- Quality standards for training
- Catalog statistics
- Training preparation steps

### 8. SergikCore (Orchestrator)
**Knowledge Added:**
- Quick SERGIK overview
- Routes to Memoria for knowledge queries
- Provides SERGIK DNA summary

## Knowledge Domains

### Style Signature
- BPM sweet spot: 120-127 BPM
- Primary keys: 10B (31%), 11B (21%), 7A (13%), 8A (12%)
- Production philosophy: Groove-first
- Characteristics: Multi-layer melodic architecture, spectral separation, gate-tight transients

### Quality Standards
- Master quality: 24-bit WAV, 44.1+ kHz
- Loudness target: -14 to -10 LUFS
- Optimal duration: 2:00 - 8:00 minutes
- Dynamic range: > 6 dB

### Workflow
- Templates: SERGIK Template V2, SERG 12.3
- Default instrument: Cut Rugs Sampler Cheats2
- Default effect: Sergik IO channel strip
- Stem count: 7 (Vocals, Drums, Bass, Guitars, Keys, Percussion, Other)
- Processing chain: Simpler/Sampler → Gate → Multiband Dynamics

### Musical DNA
- BPM zones: 80-88 (downtempo) or 122-126 (tech house)
- Top keys: 10B (D major), 11B (A major), 7A (D minor), 8A (A minor)
- Energy profile: Level 5-7 (91% of tracks)
- Genre fusion: Hip-Hop foundation + House energy + Funk/Soul textures

## Usage Examples

### Query Knowledge Base
```bash
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "Memoria", "content": "search SERGIK style signature"}'
```

### Get Style Information
```bash
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "VSTCraft", "content": "sergik style"}'
```

### Generate with SERGIK Defaults
```bash
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "VSTCraft", "content": "generate chords"}'
# Uses: 10B key, 125 BPM, tech_house style (SERGIK defaults)
```

## Benefits

1. **Context-Aware Responses** - Agents provide SERGIK-specific context
2. **Intelligent Defaults** - Uses SERGIK's preferences automatically
3. **Domain Expertise** - Each agent is a master in their craft
4. **Future-Proof** - Knowledge base can be extended without code changes
5. **Consistency** - All agents use the same knowledge source

## Future Enhancements

- Vector embeddings for semantic search
- LLM integration for natural language queries
- Real-time knowledge updates
- Multi-modal knowledge (audio samples, MIDI patterns)
- Collaborative knowledge sharing between agents

