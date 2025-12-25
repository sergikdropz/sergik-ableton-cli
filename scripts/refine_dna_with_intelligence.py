#!/usr/bin/env python3
"""
Enhanced SERGIK DNA Refinement with Energy Intelligence

Re-analyzes music catalog using enhanced energy intelligence:
- Emotional patterns (valence, arousal, emotions)
- Psychological effects (focus, relaxation, motivation)
- Sonic characteristics (timbre, texture, spatial, dynamics)
- Intent patterns (use cases, contexts)

Usage:
    python scripts/refine_dna_with_intelligence.py [directory_path]
"""

import os
import sys
import json
import csv
import time
from pathlib import Path
from collections import Counter, defaultdict
from typing import Dict, List, Any, Optional
import warnings
warnings.filterwarnings('ignore')

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from sergik_ml.pipelines.audio_analysis import (
        analyze_audio, full_analysis, SERGIK_DNA as BASE_DNA
    )
    from sergik_ml.features.energy_intelligence import analyze_energy_intelligence
    HAS_INTELLIGENCE = True
except ImportError as e:
    print(f"Warning: Could not import intelligence modules: {e}")
    HAS_INTELLIGENCE = False

# Default directory
DEFAULT_DIR = "/Volumes/SERGIK 2tb2/Exports SERGIK/SERGIK WAVs"
AUDIO_EXTS = {".wav", ".mp3", ".aif", ".aiff", ".m4a", ".flac"}
OUTPUT_DIR = Path("data/manifests")


def find_audio_files(directory: Path) -> List[Path]:
    """Find all audio files in directory."""
    audio_files = []
    if not directory.exists():
        print(f"Directory not found: {directory}")
        return audio_files
    
    for ext in AUDIO_EXTS:
        audio_files.extend(directory.glob(f"**/*{ext}"))
    
    return sorted(audio_files)


def analyze_track_with_intelligence(file_path: Path) -> Dict[str, Any]:
    """Analyze track with full intelligence."""
    try:
        # Run full analysis (includes intelligence)
        result = full_analysis(file_path=str(file_path))
        
        if result.get("status") != "ok":
            return {"status": "error", "error": result.get("error", "Unknown error")}
        
        # Extract intelligence data
        intelligence = result.get("intelligence", {})
        metadata = result.get("metadata", {})
        
        return {
            "status": "ok",
            "filename": file_path.name,
            "path": str(file_path),
            "bpm": metadata.get("bpm"),
            "key": metadata.get("key"),
            "key_notation": metadata.get("key_notation"),
            "energy": metadata.get("energy"),
            "duration": metadata.get("duration"),
            "sample_rate": metadata.get("sample_rate"),
            "brightness": metadata.get("spectral_centroid"),
            "harmonic_ratio": metadata.get("harmonic_ratio"),
            "percussive_ratio": metadata.get("percussive_ratio"),
            "energy_std": metadata.get("energy_std"),
            # Intelligence data
            "emotional_category": intelligence.get("emotional", {}).get("category"),
            "valence": intelligence.get("emotional", {}).get("valence"),
            "arousal": intelligence.get("emotional", {}).get("arousal"),
            "emotions": intelligence.get("emotional", {}).get("emotions", []),
            "psychological_effect": intelligence.get("psychological", {}).get("primary_effect"),
            "focus": intelligence.get("psychological", {}).get("focus"),
            "relaxation": intelligence.get("psychological", {}).get("relaxation"),
            "motivation": intelligence.get("psychological", {}).get("motivation"),
            "timbre": intelligence.get("sonic", {}).get("timbre"),
            "texture": intelligence.get("sonic", {}).get("texture"),
            "spatial": intelligence.get("sonic", {}).get("spatial"),
            "dynamics": intelligence.get("sonic", {}).get("dynamics"),
            "primary_intent": intelligence.get("intent", {}).get("primary"),
            "use_cases": intelligence.get("intent", {}).get("use_cases", []),
            "intelligence_summary": intelligence.get("summary", {}).get("description"),
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "filename": file_path.name}


def calculate_intelligence_statistics(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate statistics from intelligence analysis."""
    stats = {
        "total_tracks": len(results),
        "successful_analyses": len([r for r in results if r.get("status") == "ok"]),
        
        # Emotional patterns
        "emotional": {
            "categories": Counter(),
            "valence_avg": 0.0,
            "arousal_avg": 0.0,
            "emotions": Counter(),
        },
        
        # Psychological patterns
        "psychological": {
            "effects": Counter(),
            "focus_avg": 0.0,
            "relaxation_avg": 0.0,
            "motivation_avg": 0.0,
        },
        
        # Sonic patterns
        "sonic": {
            "timbre": Counter(),
            "texture": Counter(),
            "spatial": Counter(),
            "dynamics": Counter(),
        },
        
        # Intent patterns
        "intent": {
            "primary_intents": Counter(),
            "use_cases": Counter(),
        },
        
        # Energy intelligence distribution
        "energy_intelligence": {
            "by_category": Counter(),
            "valence_by_energy": defaultdict(list),
            "arousal_by_energy": defaultdict(list),
        },
    }
    
    # Process results
    valid_results = [r for r in results if r.get("status") == "ok"]
    
    if not valid_results:
        return stats
    
    valence_sum = 0
    arousal_sum = 0
    focus_sum = 0
    relaxation_sum = 0
    motivation_sum = 0
    count = 0
    
    for result in valid_results:
        # Emotional
        if result.get("emotional_category"):
            stats["emotional"]["categories"][result["emotional_category"]] += 1
        if result.get("valence") is not None:
            valence_sum += result["valence"]
            count += 1
        if result.get("arousal") is not None:
            arousal_sum += result["arousal"]
        if result.get("emotions"):
            for emotion in result["emotions"]:
                stats["emotional"]["emotions"][emotion] += 1
        
        # Psychological
        if result.get("psychological_effect"):
            stats["psychological"]["effects"][result["psychological_effect"]] += 1
        if result.get("focus") is not None:
            focus_sum += result["focus"]
        if result.get("relaxation") is not None:
            relaxation_sum += result["relaxation"]
        if result.get("motivation") is not None:
            motivation_sum += result["motivation"]
        
        # Sonic
        if result.get("timbre"):
            stats["sonic"]["timbre"][result["timbre"]] += 1
        if result.get("texture"):
            stats["sonic"]["texture"][result["texture"]] += 1
        if result.get("spatial"):
            stats["sonic"]["spatial"][result["spatial"]] += 1
        if result.get("dynamics"):
            stats["sonic"]["dynamics"][result["dynamics"]] += 1
        
        # Intent
        if result.get("primary_intent"):
            stats["intent"]["primary_intents"][result["primary_intent"]] += 1
        if result.get("use_cases"):
            for use_case in result["use_cases"]:
                stats["intent"]["use_cases"][use_case] += 1
        
        # Energy intelligence
        energy = result.get("energy")
        if energy:
            energy_cat = "very_low" if energy <= 2 else "low" if energy <= 4 else "medium_low" if energy <= 6 else "medium" if energy <= 7 else "medium_high" if energy <= 8 else "high" if energy <= 9 else "very_high"
            stats["energy_intelligence"]["by_category"][energy_cat] += 1
            
            if result.get("valence") is not None:
                stats["energy_intelligence"]["valence_by_energy"][energy].append(result["valence"])
            if result.get("arousal") is not None:
                stats["energy_intelligence"]["arousal_by_energy"][energy].append(result["arousal"])
    
    # Calculate averages
    if count > 0:
        stats["emotional"]["valence_avg"] = round(valence_sum / count, 3)
        stats["emotional"]["arousal_avg"] = round(arousal_sum / count, 3)
        stats["psychological"]["focus_avg"] = round(focus_sum / count, 3)
        stats["psychological"]["relaxation_avg"] = round(relaxation_sum / count, 3)
        stats["psychological"]["motivation_avg"] = round(motivation_sum / count, 3)
    
    # Convert Counters to dicts
    stats["emotional"]["categories"] = dict(stats["emotional"]["categories"])
    stats["emotional"]["emotions"] = dict(stats["emotional"]["emotions"])
    stats["psychological"]["effects"] = dict(stats["psychological"]["effects"])
    stats["sonic"]["timbre"] = dict(stats["sonic"]["timbre"])
    stats["sonic"]["texture"] = dict(stats["sonic"]["texture"])
    stats["sonic"]["spatial"] = dict(stats["sonic"]["spatial"])
    stats["sonic"]["dynamics"] = dict(stats["sonic"]["dynamics"])
    stats["intent"]["primary_intents"] = dict(stats["intent"]["primary_intents"])
    stats["intent"]["use_cases"] = dict(stats["intent"]["use_cases"])
    stats["energy_intelligence"]["by_category"] = dict(stats["energy_intelligence"]["by_category"])
    
    # Calculate average valence/arousal by energy level
    for energy, valences in stats["energy_intelligence"]["valence_by_energy"].items():
        if valences:
            stats["energy_intelligence"]["valence_by_energy"][energy] = round(sum(valences) / len(valences), 3)
    for energy, arousals in stats["energy_intelligence"]["arousal_by_energy"].items():
        if arousals:
            stats["energy_intelligence"]["arousal_by_energy"][energy] = round(sum(arousals) / len(arousals), 3)
    
    stats["energy_intelligence"]["valence_by_energy"] = dict(stats["energy_intelligence"]["valence_by_energy"])
    stats["energy_intelligence"]["arousal_by_energy"] = dict(stats["energy_intelligence"]["arousal_by_energy"])
    
    return stats


def refine_dna_with_intelligence(base_dna: Dict[str, Any], intelligence_stats: Dict[str, Any]) -> Dict[str, Any]:
    """Refine DNA profile with intelligence data."""
    refined = json.loads(json.dumps(base_dna))  # Deep copy
    
    # Add intelligence section
    refined["intelligence"] = {
        "emotional_profile": {
            "primary_emotions": dict(Counter(intelligence_stats["emotional"]["categories"]).most_common(5)),
            "average_valence": intelligence_stats["emotional"]["valence_avg"],
            "average_arousal": intelligence_stats["emotional"]["arousal_avg"],
            "top_emotions": dict(Counter(intelligence_stats["emotional"]["emotions"]).most_common(10)),
            "emotional_signature": _determine_emotional_signature(intelligence_stats),
        },
        "psychological_profile": {
            "primary_effects": dict(Counter(intelligence_stats["psychological"]["effects"]).most_common(5)),
            "average_focus": intelligence_stats["psychological"]["focus_avg"],
            "average_relaxation": intelligence_stats["psychological"]["relaxation_avg"],
            "average_motivation": intelligence_stats["psychological"]["motivation_avg"],
            "psychological_signature": _determine_psychological_signature(intelligence_stats),
        },
        "sonic_profile": {
            "primary_timbre": dict(Counter(intelligence_stats["sonic"]["timbre"]).most_common(3)),
            "primary_texture": dict(Counter(intelligence_stats["sonic"]["texture"]).most_common(3)),
            "primary_spatial": dict(Counter(intelligence_stats["sonic"]["spatial"]).most_common(3)),
            "primary_dynamics": dict(Counter(intelligence_stats["sonic"]["dynamics"]).most_common(3)),
            "sonic_signature": _determine_sonic_signature(intelligence_stats),
        },
        "intent_profile": {
            "primary_intents": dict(Counter(intelligence_stats["intent"]["primary_intents"]).most_common(5)),
            "top_use_cases": dict(Counter(intelligence_stats["intent"]["use_cases"]).most_common(10)),
            "intent_signature": _determine_intent_signature(intelligence_stats),
        },
        "energy_intelligence": {
            "distribution": intelligence_stats["energy_intelligence"]["by_category"],
            "valence_by_energy": intelligence_stats["energy_intelligence"]["valence_by_energy"],
            "arousal_by_energy": intelligence_stats["energy_intelligence"]["arousal_by_energy"],
        },
    }
    
    # Update refinement metadata
    refined["refinement_metadata"] = {
        "tracks_analyzed": intelligence_stats["total_tracks"],
        "successful_analyses": intelligence_stats["successful_analyses"],
        "refinement_date": time.time(),
        "refinement_type": "intelligence_enhanced",
        "base_dna_version": "1.0",
    }
    
    return refined


def _determine_emotional_signature(stats: Dict) -> str:
    """Determine emotional signature description."""
    top_emotion = Counter(stats["emotional"]["categories"]).most_common(1)
    if top_emotion:
        emotion = top_emotion[0][0]
        valence = stats["emotional"]["valence_avg"]
        arousal = stats["emotional"]["arousal_avg"]
        
        if valence > 0.7 and arousal > 0.6:
            return f"Uplifting and energetic ({emotion})"
        elif valence > 0.7 and arousal < 0.4:
            return f"Positive and relaxed ({emotion})"
        elif valence < 0.5 and arousal < 0.4:
            return f"Contemplative and calm ({emotion})"
        else:
            return f"Balanced emotional profile ({emotion})"
    return "Balanced emotional profile"


def _determine_psychological_signature(stats: Dict) -> str:
    """Determine psychological signature description."""
    top_effect = Counter(stats["psychological"]["effects"]).most_common(1)
    if top_effect:
        effect = top_effect[0][0].replace("_", " ")
        focus = stats["psychological"]["focus_avg"]
        motivation = stats["psychological"]["motivation_avg"]
        
        if focus > 0.7 and motivation > 0.7:
            return f"High focus and motivation ({effect})"
        elif motivation > 0.7:
            return f"Highly motivational ({effect})"
        elif focus > 0.7:
            return f"High focus ({effect})"
        else:
            return f"Balanced psychological profile ({effect})"
    return "Balanced psychological profile"


def _determine_sonic_signature(stats: Dict) -> str:
    """Determine sonic signature description."""
    top_timbre = Counter(stats["sonic"]["timbre"]).most_common(1)
    top_texture = Counter(stats["sonic"]["texture"]).most_common(1)
    
    if top_timbre and top_texture:
        return f"{top_timbre[0][0]} timbre with {top_texture[0][0]} texture"
    return "Balanced sonic profile"


def _determine_intent_signature(stats: Dict) -> str:
    """Determine intent signature description."""
    top_intent = Counter(stats["intent"]["primary_intents"]).most_common(1)
    top_use_case = Counter(stats["intent"]["use_cases"]).most_common(1)
    
    if top_intent and top_use_case:
        intent = top_intent[0][0].replace("_", " ")
        use_case = top_use_case[0][0]
        return f"Primarily {intent} music, best for {use_case}"
    return "Versatile intent profile"


def save_intelligence_results(results: List[Dict], stats: Dict, refined_dna: Dict, output_dir: Path):
    """Save analysis results."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save CSV with intelligence data
    csv_path = output_dir / "exports_intelligence_analysis.csv"
    if results:
        fieldnames = list(results[0].keys())
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        print(f"✓ Saved intelligence analysis: {csv_path}")
    
    # Save statistics
    stats_path = output_dir / "intelligence_statistics.json"
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    print(f"✓ Saved statistics: {stats_path}")
    
    # Save refined DNA
    dna_path = output_dir / "sergik_dna_intelligence_refined.json"
    with open(dna_path, 'w', encoding='utf-8') as f:
        json.dump(refined_dna, f, indent=2)
    print(f"✓ Saved refined DNA: {dna_path}")
    
    # Update master profile
    master_profile_path = Path("data/profiles/master_profile.json")
    if master_profile_path.exists():
        with open(master_profile_path, 'r', encoding='utf-8') as f:
            profile = json.load(f)
        
        profile["intelligence"] = refined_dna.get("intelligence", {})
        profile["refinement_metadata"] = refined_dna.get("refinement_metadata", {})
        
        with open(master_profile_path, 'w', encoding='utf-8') as f:
            json.dump(profile, f, indent=2)
        print(f"✓ Updated master profile: {master_profile_path}")


def print_summary(stats: Dict, refined_dna: Dict):
    """Print analysis summary."""
    print("\n" + "=" * 60)
    print("SERGIK DNA INTELLIGENCE REFINEMENT SUMMARY")
    print("=" * 60)
    
    print(f"\nTracks Analyzed: {stats['total_tracks']}")
    print(f"Successful Analyses: {stats['successful_analyses']}")
    
    # Emotional
    print("\n📊 Emotional Profile:")
    top_emotions = Counter(stats["emotional"]["categories"]).most_common(3)
    for emotion, count in top_emotions:
        print(f"  - {emotion}: {count} tracks")
    print(f"  - Average Valence: {stats['emotional']['valence_avg']:.2f}")
    print(f"  - Average Arousal: {stats['emotional']['arousal_avg']:.2f}")
    
    # Psychological
    print("\n🧠 Psychological Profile:")
    top_effects = Counter(stats["psychological"]["effects"]).most_common(3)
    for effect, count in top_effects:
        print(f"  - {effect.replace('_', ' ')}: {count} tracks")
    print(f"  - Average Focus: {stats['psychological']['focus_avg']:.2f}")
    print(f"  - Average Motivation: {stats['psychological']['motivation_avg']:.2f}")
    
    # Sonic
    print("\n🎵 Sonic Profile:")
    top_timbre = Counter(stats["sonic"]["timbre"]).most_common(1)
    top_texture = Counter(stats["sonic"]["texture"]).most_common(1)
    if top_timbre:
        print(f"  - Primary Timbre: {top_timbre[0][0]} ({top_timbre[0][1]} tracks)")
    if top_texture:
        print(f"  - Primary Texture: {top_texture[0][0]} ({top_texture[0][1]} tracks)")
    
    # Intent
    print("\n🎯 Intent Profile:")
    top_intents = Counter(stats["intent"]["primary_intents"]).most_common(3)
    for intent, count in top_intents:
        print(f"  - {intent.replace('_', ' ')}: {count} tracks")
    
    # Signatures
    intelligence = refined_dna.get("intelligence", {})
    print("\n✨ SERGIK Signatures:")
    print(f"  - Emotional: {intelligence.get('emotional_profile', {}).get('emotional_signature', 'N/A')}")
    print(f"  - Psychological: {intelligence.get('psychological_profile', {}).get('psychological_signature', 'N/A')}")
    print(f"  - Sonic: {intelligence.get('sonic_profile', {}).get('sonic_signature', 'N/A')}")
    print(f"  - Intent: {intelligence.get('intent_profile', {}).get('intent_signature', 'N/A')}")


def main():
    """Main execution."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Refine SERGIK DNA with energy intelligence")
    parser.add_argument("directory", nargs="?", default=DEFAULT_DIR, help="Directory to analyze")
    parser.add_argument("--max-files", type=int, help="Limit to first N files")
    parser.add_argument("--skip-analysis", action="store_true", help="Use existing CSV data")
    
    args = parser.parse_args()
    
    if not HAS_INTELLIGENCE:
        print("Error: Energy intelligence module not available")
        print("Please ensure sergik_ml.features.energy_intelligence is installed")
        return
    
    print("=" * 60)
    print("SERGIK DNA INTELLIGENCE REFINEMENT")
    print("=" * 60)
    
    # Find audio files
    if not args.skip_analysis:
        directory = Path(args.directory)
        print(f"\nScanning: {directory}")
        audio_files = find_audio_files(directory)
        
        if args.max_files:
            audio_files = audio_files[:args.max_files]
        
        print(f"Found {len(audio_files)} audio files")
        
        if not audio_files:
            print("No audio files found. Exiting.")
            return
        
        # Analyze tracks
        print("\nAnalyzing tracks with energy intelligence...")
        results = []
        for i, audio_file in enumerate(audio_files, 1):
            print(f"[{i}/{len(audio_files)}] Analyzing: {audio_file.name}")
            result = analyze_track_with_intelligence(audio_file)
            results.append(result)
            
            if i % 10 == 0:
                print(f"  Progress: {i}/{len(audio_files)} tracks analyzed")
        
        print(f"\n✓ Analyzed {len(results)} tracks")
    else:
        # Load existing CSV
        csv_path = OUTPUT_DIR / "exports_intelligence_analysis.csv"
        if csv_path.exists():
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                results = list(reader)
            print(f"Loaded {len(results)} existing results")
        else:
            print("No existing results found. Run without --skip-analysis first.")
            return
    
    # Calculate statistics
    print("\nCalculating intelligence statistics...")
    stats = calculate_intelligence_statistics(results)
    
    # Refine DNA
    print("\nRefining DNA with intelligence...")
    refined_dna = refine_dna_with_intelligence(BASE_DNA, stats)
    
    # Save results
    print("\nSaving results...")
    save_intelligence_results(results, stats, refined_dna, OUTPUT_DIR)
    
    # Print summary
    print_summary(stats, refined_dna)
    
    print("\n" + "=" * 60)
    print("✓ Intelligence refinement complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

