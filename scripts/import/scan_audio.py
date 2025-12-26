#!/usr/bin/env python3
"""
SERGIK Audio Scanner
Builds tracks.csv manifest with full metadata extraction
"""

import csv
import os
import re
import subprocess
import hashlib
import json
from pathlib import Path

AUDIO_EXTS = {".wav", ".aif", ".aiff", ".mp3", ".m4a", ".flac"}
BPM_RE = re.compile(r"(\d{2,3})\s*[Bb][Pp][Mm]")
KEY_RE = re.compile(r"\b([A-G](?:#|b)?)\s*(maj|min|major|minor)?\b", re.IGNORECASE)
COLLAB_RE = re.compile(r"\s+[xX]\s+")
VERSION_RE = re.compile(r"\b(v\d+|vip|final|mix\d+|rev\d+)\b", re.IGNORECASE)

# SERGIK directories to scan
ROOTS = [
    "/Users/machd/Desktop/SERGIKDROPZ",
    "/Users/machd/Desktop/srija",
    "/Users/machd/Music/Music/Media.localized/Music/SERGIK",
    "/Users/machd/Music/Music/Media.localized/Music/Unknown Artist/Unknown Album",
    "/Users/machd/Music/Ableton/Live Recordings",
    "/Users/machd/Desktop/WOMWOM 121BPM",
    "/Users/machd/Desktop/SLAPSTICK Project",
]

OUTPUT_CSV = "data/manifests/tracks.csv"

def sh(cmd):
    try:
        return subprocess.check_output(cmd, stderr=subprocess.DEVNULL, text=True).strip()
    except:
        return ""

def audio_info_afinfo(path):
    """Extract audio info using macOS afinfo"""
    try:
        out = sh(["afinfo", str(path)])
        info = {}
        
        # Parse sample rate
        sr_match = re.search(r"(\d+)\s*Hz", out)
        info["sample_rate_hz"] = int(sr_match.group(1)) if sr_match else 0
        
        # Parse bit depth
        bd_match = re.search(r"source bit depth:\s*[IF]?(\d+)", out)
        if not bd_match:
            bd_match = re.search(r"(\d+)-bit", out)
        info["bit_depth"] = int(bd_match.group(1)) if bd_match else 0
        
        # Parse duration
        dur_match = re.search(r"estimated duration:\s*([\d.]+)", out)
        info["duration_s"] = float(dur_match.group(1)) if dur_match else 0
        
        # Parse channels
        ch_match = re.search(r"(\d+)\s*ch", out)
        info["channels"] = int(ch_match.group(1)) if ch_match else 0
        
        return info
    except:
        return {"duration_s": 0, "sample_rate_hz": 0, "bit_depth": 0, "channels": 0}

def stable_id(full_path):
    return hashlib.sha1(full_path.encode("utf-8")).hexdigest()[:12]

def parse_tags(filename):
    base = Path(filename).stem
    
    # BPM
    bpm = None
    m = BPM_RE.search(base)
    if m:
        val = int(m.group(1))
        if 50 <= val <= 220:
            bpm = val
    
    # Key
    key = None
    km = KEY_RE.search(base)
    if km:
        key = km.group(0).strip()
    
    # Collaborators
    collaborators = []
    if COLLAB_RE.search(base):
        parts = COLLAB_RE.split(base)
        if len(parts) > 1:
            # Skip first part (usually "SERGIK - Title" or just "SERGIK")
            for p in parts[1:]:
                # Clean up: take text before " - " if present
                collab = p.split(" - ")[0].strip()
                if collab and collab.upper() != "SERGIK":
                    collaborators.append(collab)
    
    # Version tag
    version_tag = ""
    vm = VERSION_RE.search(base)
    if vm:
        version_tag = vm.group(1)
    
    # Category
    category = "Solo"
    if collaborators:
        category = "Collab"
    if "remix" in base.lower() or "flip" in base.lower():
        category = "Remix"
    
    return {
        "bpm": bpm,
        "key": key,
        "collaborators": ";".join(collaborators),
        "version_tag": version_tag,
        "category": category
    }

def quality_tier(sample_rate, bit_depth, filename):
    ext = Path(filename).suffix.lower()
    if ext in [".mp3", ".m4a"] or bit_depth < 16:
        return 4
    elif bit_depth == 16 and sample_rate >= 44100:
        return 3
    elif bit_depth >= 24 and sample_rate >= 44100:
        return 1
    elif sample_rate >= 44100:
        return 2
    return 4

def main():
    print("=" * 60)
    print("SERGIK AUDIO SCANNER")
    print("=" * 60)
    
    rows = []
    
    for root in ROOTS:
        rootp = Path(root).expanduser()
        if not rootp.exists():
            print(f"  SKIP: {root} (not found)")
            continue
        
        print(f"\nScanning: {root}")
        count = 0
        
        for p in rootp.rglob("*"):
            if p.is_file() and p.suffix.lower() in AUDIO_EXTS:
                # Filter: only SERGIK tracks from Unknown Album
                if "Unknown Album" in str(p) and not p.name.upper().startswith("SERGIK"):
                    continue
                
                st = p.stat()
                info = audio_info_afinfo(p)
                tags = parse_tags(p.name)
                tier = quality_tier(info["sample_rate_hz"], info["bit_depth"], p.name)
                
                rows.append({
                    "track_id": stable_id(str(p)),
                    "filename": p.name,
                    "full_path": str(p),
                    "bytes": st.st_size,
                    "duration_s": round(info["duration_s"], 2),
                    "sample_rate_hz": info["sample_rate_hz"],
                    "bit_depth": info["bit_depth"],
                    "channels": info["channels"],
                    "bpm": tags["bpm"] or "",
                    "key": tags["key"] or "",
                    "collaborators": tags["collaborators"],
                    "version_tag": tags["version_tag"],
                    "category": tags["category"],
                    "source_bucket": rootp.name,
                    "quality_tier": tier,
                    "include_in_training": tier <= 2
                })
                count += 1
        
        print(f"  Found: {count} tracks")
    
    # Write CSV
    outpath = Path(OUTPUT_CSV)
    outpath.parent.mkdir(parents=True, exist_ok=True)
    
    fieldnames = [
        "track_id", "filename", "full_path", "bytes",
        "duration_s", "sample_rate_hz", "bit_depth", "channels",
        "bpm", "key", "collaborators", "version_tag", "category",
        "source_bucket", "quality_tier", "include_in_training"
    ]
    
    with open(outpath, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    
    # Stats
    training = [r for r in rows if r["include_in_training"]]
    collabs = set()
    for r in rows:
        if r["collaborators"]:
            collabs.update(r["collaborators"].split(";"))
    
    print(f"\n{'=' * 60}")
    print(f"SCAN COMPLETE")
    print(f"{'=' * 60}")
    print(f"Total tracks:     {len(rows)}")
    print(f"Training ready:   {len(training)}")
    print(f"Collaborators:    {len(collabs)}")
    print(f"Output:           {outpath}")
    print("=" * 60)

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent)
    main()
