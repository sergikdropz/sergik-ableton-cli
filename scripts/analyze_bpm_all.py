#!/usr/bin/env python3
"""
BPM Analysis for ALL tracks using librosa
"""

import os
import csv
import json
import librosa
from pathlib import Path
from collections import Counter, defaultdict
import warnings
warnings.filterwarnings('ignore')

MUSIC_DIRS = [
    "/Users/machd/Music/Music/Media.localized/Music",
    "/Users/machd/Music/Music 1/Media.localized/Music",
]

OUTPUT_DIR = "data/manifests"
AUDIO_EXTS = {".wav", ".mp3", ".aif", ".aiff", ".m4a"}

def detect_bpm(file_path):
    """Detect BPM using librosa"""
    try:
        # Load 30 seconds for speed
        y, sr = librosa.load(file_path, sr=22050, duration=30)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(tempo) if not hasattr(tempo, '__len__') else float(tempo[0])
        return round(bpm, 1)
    except Exception as e:
        return None

def main():
    print("=" * 60)
    print("BPM ANALYSIS FOR ALL TRACKS")
    print("=" * 60)
    
    # Collect all audio files
    all_files = []
    for music_dir in MUSIC_DIRS:
        if not os.path.exists(music_dir):
            continue
        for root, dirs, files in os.walk(music_dir):
            for file in files:
                if Path(file).suffix.lower() in AUDIO_EXTS:
                    all_files.append(os.path.join(root, file))
    
    print(f"Found {len(all_files)} audio files")
    
    # Analyze BPM (sample first 200 for speed, or all if you want full)
    sample_size = min(200, len(all_files))  # Adjust for full analysis
    print(f"Analyzing {sample_size} tracks...")
    
    results = []
    bpm_values = []
    
    for i, file_path in enumerate(all_files[:sample_size]):
        filename = os.path.basename(file_path)
        if i % 20 == 0:
            print(f"  [{i+1}/{sample_size}] Processing...")
        
        bpm = detect_bpm(file_path)
        if bpm and 50 <= bpm <= 200:
            bpm_values.append(bpm)
            results.append({
                "filename": filename,
                "bpm": bpm,
                "path": file_path
            })
    
    print(f"\nSuccessfully analyzed: {len(bpm_values)} tracks")
    
    # BPM Statistics
    if bpm_values:
        avg_bpm = sum(bpm_values) / len(bpm_values)
        
        # Buckets
        buckets = defaultdict(int)
        for b in bpm_values:
            if b < 90: buckets["< 90"] += 1
            elif b < 100: buckets["90-99"] += 1
            elif b < 110: buckets["100-109"] += 1
            elif b < 120: buckets["110-119"] += 1
            elif b < 125: buckets["120-124"] += 1
            elif b < 130: buckets["125-129"] += 1
            elif b < 140: buckets["130-139"] += 1
            else: buckets["140+"] += 1
        
        print(f"\n{'=' * 60}")
        print("BPM DISTRIBUTION")
        print("=" * 60)
        print(f"Average BPM: {avg_bpm:.1f}")
        print(f"Min: {min(bpm_values):.1f} | Max: {max(bpm_values):.1f}")
        print(f"\nDistribution:")
        
        for bucket in ["< 90", "90-99", "100-109", "110-119", "120-124", "125-129", "130-139", "140+"]:
            count = buckets[bucket]
            pct = (count / len(bpm_values)) * 100
            bar = "█" * int(pct / 2)
            print(f"  {bucket:10} {count:4} ({pct:5.1f}%) {bar}")
        
        # Find the mode (most common BPM range)
        rounded_bpms = [round(b) for b in bpm_values]
        bpm_counts = Counter(rounded_bpms)
        most_common = bpm_counts.most_common(10)
        
        print(f"\nTop 10 Most Common BPMs:")
        for bpm, count in most_common:
            print(f"  {bpm} BPM: {count} tracks")
        
        # Save results
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        bpm_csv = os.path.join(OUTPUT_DIR, "bpm_analysis.csv")
        with open(bpm_csv, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["filename", "bpm", "path"])
            w.writeheader()
            w.writerows(results)
        print(f"\nSaved: {bpm_csv}")
        
        # Save summary
        summary = {
            "tracks_analyzed": len(bpm_values),
            "avg_bpm": round(avg_bpm, 1),
            "min_bpm": round(min(bpm_values), 1),
            "max_bpm": round(max(bpm_values), 1),
            "distribution": dict(buckets),
            "top_bpms": dict(most_common),
        }
        
        summary_json = os.path.join(OUTPUT_DIR, "bpm_summary.json")
        with open(summary_json, "w") as f:
            json.dump(summary, f, indent=2)
        print(f"Saved: {summary_json}")

if __name__ == "__main__":
    os.chdir("/Users/machd/sergik_custom_gpt")
    main()
