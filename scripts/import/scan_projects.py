#!/usr/bin/env python3
"""
Scan Ableton project files (.als) for SERGIK projects
"""

import csv
import os
from datetime import datetime
from pathlib import Path

ABLETON_ROOTS = [
    "/Users/machd/Music/Ableton/User Library/Templates",
    "/Users/machd/Music/Ableton/Live Recordings",
    "/Users/machd/Desktop",
    "/Users/machd/Downloads",
]

OUTPUT_CSV = "data/manifests/projects_als.csv"

def main():
    print("=" * 60)
    print("SERGIK PROJECT SCANNER")
    print("=" * 60)
    
    rows = []
    
    for root in ABLETON_ROOTS:
        rootp = Path(root).expanduser()
        if not rootp.exists():
            continue
        
        print(f"Scanning: {root}")
        
        for p in rootp.rglob("*.als"):
            # Check if SERGIK-related
            is_sergik = (
                "sergik" in p.name.lower() or
                "serg" in p.name.lower() or
                "sergik" in str(p.parent).lower()
            )
            
            st = p.stat()
            
            rows.append({
                "project_path": str(p),
                "project_name": p.stem,
                "parent_folder": p.parent.name,
                "created_time": datetime.fromtimestamp(st.st_birthtime).isoformat(),
                "modified_time": datetime.fromtimestamp(st.st_mtime).isoformat(),
                "size_bytes": st.st_size,
                "contains_sergik": is_sergik,
            })
    
    # Write CSV
    outpath = Path(OUTPUT_CSV)
    outpath.parent.mkdir(parents=True, exist_ok=True)
    
    fieldnames = [
        "project_path", "project_name", "parent_folder",
        "created_time", "modified_time", "size_bytes", "contains_sergik"
    ]
    
    with open(outpath, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    
    sergik_count = len([r for r in rows if r["contains_sergik"]])
    
    print(f"\n{'=' * 60}")
    print(f"Total projects:   {len(rows)}")
    print(f"SERGIK-related:   {sergik_count}")
    print(f"Output:           {outpath}")
    print("=" * 60)

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent)
    main()
