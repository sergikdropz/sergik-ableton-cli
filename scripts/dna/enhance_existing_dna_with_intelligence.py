#!/usr/bin/env python3
"""
Enhance existing DNA analysis with intelligence data.

Reads existing exports_dna_analysis.csv and adds intelligence analysis
based on the energy, BPM, and other features already calculated.
"""

import csv
import json
from pathlib import Path
from collections import Counter, defaultdict
from typing import Dict, List, Any
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from sergik_ml.features.energy_intelligence import analyze_energy_intelligence
    from sergik_ml.pipelines.audio_analysis import SERGIK_DNA as BASE_DNA
    HAS_INTELLIGENCE = True
except ImportError as e:
    print(f"Error: {e}")
    HAS_INTELLIGENCE = False

INPUT_CSV = Path("data/manifests/exports_dna_analysis.csv")
OUTPUT_CSV = Path("data/manifests/exports_intelligence_analysis.csv")
OUTPUT_DIR = Path("data/manifests")


def enhance_row_with_intelligence(row: Dict[str, Any]) -> Dict[str, Any]:
    """Add intelligence data to existing analysis row."""
    try:
        # Extract existing data
        energy = int(float(row.get("energy", 5)))
        bpm = float(row.get("bpm", 125))
        
        # Use default values for missing features
        brightness = 3500.0  # Default spectral centroid
        harmonic_ratio = 0.6  # Default
        percussive_ratio = 0.4  # Default
        energy_std = 0.1  # Default variation
        stereo_width = 0.5  # Default
        
        # Run intelligence analysis
        intelligence = analyze_energy_intelligence(
            energy=energy,
            bpm=bpm,
            brightness=brightness,
            harmonic_ratio=harmonic_ratio,
            percussive_ratio=percussive_ratio,
            energy_std=energy_std,
            stereo_width=stereo_width,
        )
        
        # Add intelligence fields to row
        row["emotional_category"] = intelligence.get("emotional", {}).get("category")
        row["valence"] = intelligence.get("emotional", {}).get("valence")
        row["arousal"] = intelligence.get("emotional", {}).get("arousal")
        row["emotions"] = ",".join(intelligence.get("emotional", {}).get("emotions", []))
        row["psychological_effect"] = intelligence.get("psychological", {}).get("primary_effect")
        row["focus"] = intelligence.get("psychological", {}).get("focus")
        row["relaxation"] = intelligence.get("psychological", {}).get("relaxation")
        row["motivation"] = intelligence.get("psychological", {}).get("motivation")
        row["timbre"] = intelligence.get("sonic", {}).get("timbre")
        row["texture"] = intelligence.get("sonic", {}).get("texture")
        row["spatial"] = intelligence.get("sonic", {}).get("spatial")
        row["dynamics"] = intelligence.get("sonic", {}).get("dynamics")
        row["primary_intent"] = intelligence.get("intent", {}).get("primary")
        row["use_cases"] = ",".join(intelligence.get("intent", {}).get("use_cases", []))
        row["intelligence_summary"] = intelligence.get("summary", {}).get("description")
        
        return row
    except Exception as e:
        print(f"Error enhancing row: {e}")
        return row


def calculate_statistics_from_enhanced(results: List[Dict]) -> Dict[str, Any]:
    """Calculate intelligence statistics from enhanced data."""
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
    
    for row in results:
        # Emotional
        if row.get("emotional_category"):
            stats["emotional"]["categories"][row["emotional_category"]] += 1
        if row.get("valence"):
            try:
                stats["emotional"]["valence_values"].append(float(row["valence"]))
            except:
                pass
        if row.get("arousal"):
            try:
                stats["emotional"]["arousal_values"].append(float(row["arousal"]))
            except:
                pass
        if row.get("emotions"):
            for emotion in row["emotions"].split(","):
                if emotion.strip():
                    stats["emotional"]["emotions"][emotion.strip()] += 1
        
        # Psychological
        if row.get("psychological_effect"):
            stats["psychological"]["effects"][row["psychological_effect"]] += 1
        for field in ["focus", "relaxation", "motivation"]:
            if row.get(field):
                try:
                    stats["psychological"][f"{field}_values"].append(float(row[field]))
                except:
                    pass
        
        # Sonic
        for field in ["timbre", "texture", "spatial", "dynamics"]:
            if row.get(field):
                stats["sonic"][field][row[field]] += 1
        
        # Intent
        if row.get("primary_intent"):
            stats["intent"]["primary_intents"][row["primary_intent"]] += 1
        if row.get("use_cases"):
            for use_case in row["use_cases"].split(","):
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
    
    return stats


def refine_dna_with_intelligence(base_dna: Dict, stats: Dict) -> Dict:
    """Refine DNA with intelligence statistics."""
    refined = json.loads(json.dumps(base_dna))
    
    refined["intelligence"] = {
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
    
    return refined


def main():
    if not HAS_INTELLIGENCE:
        print("Error: Intelligence module not available")
        return
    
    if not INPUT_CSV.exists():
        print(f"Error: {INPUT_CSV} not found")
        return
    
    print("=" * 60)
    print("ENHANCING EXISTING DNA ANALYSIS WITH INTELLIGENCE")
    print("=" * 60)
    
    # Read existing CSV
    print(f"\nReading: {INPUT_CSV}")
    results = []
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            results.append(row)
    
    print(f"Found {len(results)} tracks")
    
    # Enhance with intelligence
    print("\nEnhancing with intelligence...")
    enhanced = []
    for i, row in enumerate(results, 1):
        if i % 10 == 0:
            print(f"  Progress: {i}/{len(results)}")
        enhanced.append(enhance_row_with_intelligence(row))
    
    # Save enhanced CSV
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if enhanced:
        fieldnames = list(enhanced[0].keys())
        with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(enhanced)
        print(f"\n✓ Saved enhanced analysis: {OUTPUT_CSV}")
    
    # Calculate statistics
    print("\nCalculating statistics...")
    stats = calculate_statistics_from_enhanced(enhanced)
    
    # Refine DNA
    print("Refining DNA...")
    refined_dna = refine_dna_with_intelligence(BASE_DNA, stats)
    
    # Save refined DNA
    dna_path = OUTPUT_DIR / "sergik_dna_intelligence_refined.json"
    with open(dna_path, 'w', encoding='utf-8') as f:
        json.dump(refined_dna, f, indent=2)
    print(f"✓ Saved refined DNA: {dna_path}")
    
    # Save statistics
    stats_path = OUTPUT_DIR / "intelligence_statistics.json"
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    print(f"✓ Saved statistics: {stats_path}")
    
    # Update master profile
    master_profile = Path("data/profiles/master_profile.json")
    if master_profile.exists():
        with open(master_profile, 'r') as f:
            profile = json.load(f)
        profile["intelligence"] = refined_dna.get("intelligence", {})
        with open(master_profile, 'w') as f:
            json.dump(profile, f, indent=2)
        print(f"✓ Updated master profile: {master_profile}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Tracks Enhanced: {len(enhanced)}")
    print(f"\nTop Emotions: {dict(Counter(stats['emotional']['categories']).most_common(3))}")
    print(f"Top Effects: {dict(Counter(stats['psychological']['effects']).most_common(3))}")
    print(f"Top Intents: {dict(Counter(stats['intent']['primary_intents']).most_common(3))}")
    print(f"\nAverage Valence: {stats['emotional']['valence_avg']:.2f}")
    print(f"Average Arousal: {stats['emotional']['arousal_avg']:.2f}")
    print(f"Average Motivation: {stats['psychological']['motivation_avg']:.2f}")
    print("\n✓ Enhancement complete!")


if __name__ == "__main__":
    main()

