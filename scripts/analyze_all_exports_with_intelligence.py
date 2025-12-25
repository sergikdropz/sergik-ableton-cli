#!/usr/bin/env python3
"""
Analyze all exported tracks with energy intelligence.

Reads from exports catalog and analyzes each track with intelligence,
then creates comprehensive DNA profile.
"""

import csv
import json
from pathlib import Path
from collections import Counter, defaultdict
from typing import Dict, List, Any
import sys
import os

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from sergik_ml.features.energy_intelligence import analyze_energy_intelligence
    from sergik_ml.pipelines.audio_analysis import SERGIK_DNA as BASE_DNA, analyze_audio
    HAS_INTELLIGENCE = True
except ImportError as e:
    print(f"Error: {e}")
    HAS_INTELLIGENCE = False

EXPORTS_CSV = Path("data/catalog/exports/all_exports.csv")
OUTPUT_DIR = Path("data/manifests")


def analyze_track_from_path(file_path: str) -> Dict[str, Any]:
    """Analyze a single track file."""
    if not os.path.exists(file_path):
        return None
    
    try:
        # Run audio analysis
        result = analyze_audio(file_path)
        
        if result.get("status") != "ok":
            return None
        
        # Extract features for intelligence
        energy = result.get("energy", 5)
        bpm = result.get("bpm", 125)
        brightness = result.get("spectral_centroid", 3500)
        harmonic_ratio = result.get("harmonic_ratio", 0.6)
        percussive_ratio = result.get("percussive_ratio", 0.4)
        energy_std = result.get("energy_std", 0.1)
        
        # Run intelligence analysis
        intelligence = analyze_energy_intelligence(
            energy=energy,
            bpm=bpm,
            brightness=brightness,
            harmonic_ratio=harmonic_ratio,
            percussive_ratio=percussive_ratio,
            energy_std=energy_std,
            stereo_width=0.5,
        )
        
        # Combine results
        combined = {
            "filename": Path(file_path).name,
            "path": file_path,
            "bpm": bpm,
            "key": result.get("key"),
            "key_notation": result.get("key_notation"),
            "energy": energy,
            "duration": result.get("duration"),
            "sample_rate": result.get("sample_rate"),
            "brightness": brightness,
            "harmonic_ratio": harmonic_ratio,
            "percussive_ratio": percussive_ratio,
            "energy_std": energy_std,
            # Intelligence
            "emotional_category": intelligence.get("emotional", {}).get("category"),
            "valence": intelligence.get("emotional", {}).get("valence"),
            "arousal": intelligence.get("emotional", {}).get("arousal"),
            "emotions": ",".join(intelligence.get("emotional", {}).get("emotions", [])),
            "psychological_effect": intelligence.get("psychological", {}).get("primary_effect"),
            "focus": intelligence.get("psychological", {}).get("focus"),
            "relaxation": intelligence.get("psychological", {}).get("relaxation"),
            "motivation": intelligence.get("psychological", {}).get("motivation"),
            "timbre": intelligence.get("sonic", {}).get("timbre"),
            "texture": intelligence.get("sonic", {}).get("texture"),
            "spatial": intelligence.get("sonic", {}).get("spatial"),
            "dynamics": intelligence.get("sonic", {}).get("dynamics"),
            "primary_intent": intelligence.get("intent", {}).get("primary"),
            "use_cases": ",".join(intelligence.get("intent", {}).get("use_cases", [])),
            "intelligence_summary": intelligence.get("summary", {}).get("description"),
        }
        
        return combined
    except Exception as e:
        print(f"Error analyzing {file_path}: {e}")
        return None


def main():
    if not HAS_INTELLIGENCE:
        print("Error: Intelligence module not available")
        return
    
    if not EXPORTS_CSV.exists():
        print(f"Error: {EXPORTS_CSV} not found")
        return
    
    print("=" * 60)
    print("ANALYZING ALL EXPORTS WITH INTELLIGENCE")
    print("=" * 60)
    
    # Read exports CSV
    print(f"\nReading: {EXPORTS_CSV}")
    tracks = []
    with open(EXPORTS_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tracks.append(row)
    
    print(f"Found {len(tracks)} exported tracks")
    
    # Analyze tracks (with limit for testing)
    print("\nAnalyzing tracks...")
    print("Note: This will analyze tracks that exist on disk")
    print("Skipping tracks that don't exist...\n")
    
    results = []
    analyzed = 0
    skipped = 0
    
    for i, track in enumerate(tracks, 1):
        file_path = track.get("path", "")
        
        if not file_path or not os.path.exists(file_path):
            skipped += 1
            continue
        
        print(f"[{i}/{len(tracks)}] {Path(file_path).name}")
        result = analyze_track_from_path(file_path)
        
        if result:
            results.append(result)
            analyzed += 1
        
        if i % 10 == 0:
            print(f"  Progress: {analyzed} analyzed, {skipped} skipped")
    
    print(f"\n✓ Analyzed {analyzed} tracks ({skipped} skipped)")
    
    if not results:
        print("No tracks successfully analyzed. Exiting.")
        return
    
    # Calculate statistics
    print("\nCalculating statistics...")
    stats = {
        "total_tracks": len(results),
        "emotional": {
            "categories": Counter(),
            "valence_values": [],
            "arousal_values": [],
            "emotions": Counter(),
        },
        "psychological": {
            "effects": Counter(),
            "focus_values": [],
            "relaxation_values": [],
            "motivation_values": [],
        },
        "sonic": {
            "timbre": Counter(),
            "texture": Counter(),
            "spatial": Counter(),
            "dynamics": Counter(),
        },
        "intent": {
            "primary_intents": Counter(),
            "use_cases": Counter(),
        },
    }
    
    for result in results:
        # Emotional
        if result.get("emotional_category"):
            stats["emotional"]["categories"][result["emotional_category"]] += 1
        if result.get("valence"):
            stats["emotional"]["valence_values"].append(result["valence"])
        if result.get("arousal"):
            stats["emotional"]["arousal_values"].append(result["arousal"])
        if result.get("emotions"):
            for emotion in result["emotions"].split(","):
                if emotion.strip():
                    stats["emotional"]["emotions"][emotion.strip()] += 1
        
        # Psychological
        if result.get("psychological_effect"):
            stats["psychological"]["effects"][result["psychological_effect"]] += 1
        for field in ["focus", "relaxation", "motivation"]:
            if result.get(field):
                stats["psychological"][f"{field}_values"].append(result[field])
        
        # Sonic
        for field in ["timbre", "texture", "spatial", "dynamics"]:
            if result.get(field):
                stats["sonic"][field][result[field]] += 1
        
        # Intent
        if result.get("primary_intent"):
            stats["intent"]["primary_intents"][result["primary_intent"]] += 1
        if result.get("use_cases"):
            for use_case in result["use_cases"].split(","):
                if use_case.strip():
                    stats["intent"]["use_cases"][use_case.strip()] += 1
    
    # Calculate averages
    if stats["emotional"]["valence_values"]:
        stats["emotional"]["valence_avg"] = round(sum(stats["emotional"]["valence_values"]) / len(stats["emotional"]["valence_values"]), 3)
    else:
        stats["emotional"]["valence_avg"] = 0.0
    
    if stats["emotional"]["arousal_values"]:
        stats["emotional"]["arousal_avg"] = round(sum(stats["emotional"]["arousal_values"]) / len(stats["emotional"]["arousal_values"]), 3)
    else:
        stats["emotional"]["arousal_avg"] = 0.0
    
    for field in ["focus", "relaxation", "motivation"]:
        values = stats["psychological"][f"{field}_values"]
        if values:
            stats["psychological"][f"{field}_avg"] = round(sum(values) / len(values), 3)
        else:
            stats["psychological"][f"{field}_avg"] = 0.0
    
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
    
    # Refine DNA
    refined_dna = json.loads(json.dumps(BASE_DNA))
    refined_dna["intelligence"] = {
        "emotional_profile": {
            "primary_emotions": dict(Counter(stats["emotional"]["categories"]).most_common(5)),
            "average_valence": stats["emotional"]["valence_avg"],
            "average_arousal": stats["emotional"]["arousal_avg"],
            "top_emotions": dict(Counter(stats["emotional"]["emotions"]).most_common(10)),
        },
        "psychological_profile": {
            "primary_effects": dict(Counter(stats["psychological"]["effects"]).most_common(5)),
            "average_focus": stats["psychological"]["focus_avg"],
            "average_relaxation": stats["psychological"]["relaxation_avg"],
            "average_motivation": stats["psychological"]["motivation_avg"],
        },
        "sonic_profile": {
            "primary_timbre": dict(Counter(stats["sonic"]["timbre"]).most_common(3)),
            "primary_texture": dict(Counter(stats["sonic"]["texture"]).most_common(3)),
            "primary_spatial": dict(Counter(stats["sonic"]["spatial"]).most_common(3)),
            "primary_dynamics": dict(Counter(stats["sonic"]["dynamics"]).most_common(3)),
        },
        "intent_profile": {
            "primary_intents": dict(Counter(stats["intent"]["primary_intents"]).most_common(5)),
            "top_use_cases": dict(Counter(stats["intent"]["use_cases"]).most_common(10)),
        },
    }
    
    # Save results
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save CSV
    if results:
        csv_path = OUTPUT_DIR / "exports_intelligence_analysis.csv"
        fieldnames = list(results[0].keys())
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        print(f"\n✓ Saved: {csv_path}")
    
    # Save statistics
    stats_path = OUTPUT_DIR / "intelligence_statistics.json"
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    print(f"✓ Saved: {stats_path}")
    
    # Save refined DNA
    dna_path = OUTPUT_DIR / "sergik_dna_intelligence_refined.json"
    with open(dna_path, 'w', encoding='utf-8') as f:
        json.dump(refined_dna, f, indent=2)
    print(f"✓ Saved: {dna_path}")
    
    # Update master profile
    master_profile = Path("data/profiles/master_profile.json")
    if master_profile.exists():
        with open(master_profile, 'r') as f:
            profile = json.load(f)
        profile["intelligence"] = refined_dna.get("intelligence", {})
        with open(master_profile, 'w') as f:
            json.dump(profile, f, indent=2)
        print(f"✓ Updated: {master_profile}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("SERGIK DNA INTELLIGENCE REFINEMENT SUMMARY")
    print("=" * 60)
    print(f"\nTracks Analyzed: {analyzed}")
    print(f"\n📊 Emotional Profile:")
    print(f"  - Average Valence: {stats['emotional']['valence_avg']:.2f}")
    print(f"  - Average Arousal: {stats['emotional']['arousal_avg']:.2f}")
    print(f"  - Top Emotions: {dict(Counter(stats['emotional']['categories']).most_common(3))}")
    
    print(f"\n🧠 Psychological Profile:")
    print(f"  - Average Focus: {stats['psychological']['focus_avg']:.2f}")
    print(f"  - Average Relaxation: {stats['psychological']['relaxation_avg']:.2f}")
    print(f"  - Average Motivation: {stats['psychological']['motivation_avg']:.2f}")
    print(f"  - Top Effects: {dict(Counter(stats['psychological']['effects']).most_common(3))}")
    
    print(f"\n🎵 Sonic Profile:")
    print(f"  - Top Timbre: {dict(Counter(stats['sonic']['timbre']).most_common(1))}")
    print(f"  - Top Texture: {dict(Counter(stats['sonic']['texture']).most_common(1))}")
    
    print(f"\n🎯 Intent Profile:")
    print(f"  - Top Intents: {dict(Counter(stats['intent']['primary_intents']).most_common(3))}")
    print(f"  - Top Use Cases: {dict(Counter(stats['intent']['use_cases']).most_common(5))}")
    
    print("\n✓ Analysis complete!")


if __name__ == "__main__":
    main()

