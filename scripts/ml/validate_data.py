#!/usr/bin/env python3
"""
SERGIK Data Validation Script

Validates data quality in database:
- Feature ranges (BPM 20-300, energy 0-1, etc.)
- Missing required fields
- Duplicate tracks
- Relationship integrity
"""

import sys
from pathlib import Path
from typing import Dict, List, Any
import logging

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sergik_ml.stores.sql_store import (
    engine, music_intelligence, emotion_intelligence, init_db
)
from sqlalchemy import select, func, and_, or_

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def validate_feature_ranges() -> Dict[str, Any]:
    """Validate feature value ranges."""
    logger.info("Validating feature ranges...")
    
    issues = []
    
    with engine.begin() as conn:
        # BPM range (20-300)
        invalid_bpm = conn.execute(
            select(music_intelligence).where(
                and_(
                    music_intelligence.c.bpm.isnot(None),
                    or_(
                        music_intelligence.c.bpm < 20,
                        music_intelligence.c.bpm > 300
                    )
                )
            )
        ).mappings().all()
        
        if invalid_bpm:
            issues.append({
                "field": "bpm",
                "count": len(invalid_bpm),
                "issue": "BPM outside valid range (20-300)",
                "examples": [{"track_id": r["track_id"], "value": r["bpm"]} for r in invalid_bpm[:5]]
            })
        
        # Energy range (0-1)
        invalid_energy = conn.execute(
            select(music_intelligence).where(
                and_(
                    music_intelligence.c.energy.isnot(None),
                    or_(
                        music_intelligence.c.energy < 0,
                        music_intelligence.c.energy > 1
                    )
                )
            )
        ).mappings().all()
        
        if invalid_energy:
            issues.append({
                "field": "energy",
                "count": len(invalid_energy),
                "issue": "Energy outside valid range (0-1)",
                "examples": [{"track_id": r["track_id"], "value": r["energy"]} for r in invalid_energy[:5]]
            })
        
        # Rating range (1-5)
        invalid_rating = conn.execute(
            select(music_intelligence).where(
                and_(
                    music_intelligence.c.rating.isnot(None),
                    or_(
                        music_intelligence.c.rating < 1,
                        music_intelligence.c.rating > 5
                    )
                )
            )
        ).mappings().all()
        
        if invalid_rating:
            issues.append({
                "field": "rating",
                "count": len(invalid_rating),
                "issue": "Rating outside valid range (1-5)",
                "examples": [{"track_id": r["track_id"], "value": r["rating"]} for r in invalid_rating[:5]]
            })
        
        # LUFS range (-60 to 0)
        invalid_lufs = conn.execute(
            select(music_intelligence).where(
                and_(
                    music_intelligence.c.lufs.isnot(None),
                    or_(
                        music_intelligence.c.lufs < -60,
                        music_intelligence.c.lufs > 0
                    )
                )
            )
        ).mappings().all()
        
        if invalid_lufs:
            issues.append({
                "field": "lufs",
                "count": len(invalid_lufs),
                "issue": "LUFS outside valid range (-60 to 0)",
                "examples": [{"track_id": r["track_id"], "value": r["lufs"]} for r in invalid_lufs[:5]]
            })
    
    return {
        "total_issues": len(issues),
        "issues": issues,
    }


def validate_missing_fields() -> Dict[str, Any]:
    """Check for missing required fields."""
    logger.info("Checking for missing required fields...")
    
    with engine.begin() as conn:
        total = conn.execute(select(func.count()).select_from(music_intelligence)).scalar()
        
        missing_bpm = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.bpm.is_(None)
            )
        ).scalar()
        
        missing_energy = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.energy.is_(None)
            )
        ).scalar()
        
        missing_key = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.key.is_(None)
            )
        ).scalar()
    
    return {
        "total_tracks": total,
        "missing_bpm": missing_bpm,
        "missing_energy": missing_energy,
        "missing_key": missing_key,
        "missing_bpm_pct": (missing_bpm / total * 100) if total > 0 else 0,
        "missing_energy_pct": (missing_energy / total * 100) if total > 0 else 0,
        "missing_key_pct": (missing_key / total * 100) if total > 0 else 0,
    }


def validate_duplicates() -> Dict[str, Any]:
    """Check for duplicate tracks."""
    logger.info("Checking for duplicate tracks...")
    
    with engine.begin() as conn:
        # Check for duplicate track_ids (shouldn't happen with primary key)
        # But check for duplicate content (same BPM, key, energy, etc.)
        all_tracks = conn.execute(select(music_intelligence)).mappings().all()
        
        # Group by key features
        seen = {}
        duplicates = []
        
        for track in all_tracks:
            key = (
                track.get("bpm"),
                track.get("key"),
                track.get("energy"),
                track.get("brightness"),
            )
            
            if key in seen:
                duplicates.append({
                    "track_id": track["track_id"],
                    "duplicate_of": seen[key],
                    "features": key
                })
            else:
                seen[key] = track["track_id"]
    
    return {
        "total_tracks": len(all_tracks),
        "duplicate_groups": len(duplicates),
        "duplicates": duplicates[:10],  # First 10
    }


def validate_relationships() -> Dict[str, Any]:
    """Validate foreign key relationships."""
    logger.info("Validating relationships...")
    
    issues = []
    
    with engine.begin() as conn:
        # Check emotion_intelligence.track_id references
        emotion_tracks = conn.execute(
            select(func.distinct(emotion_intelligence.c.track_id))
        ).scalars().all()
        
        for track_id in emotion_tracks:
            track = conn.execute(
                select(music_intelligence).where(
                    music_intelligence.c.track_id == track_id
                )
            ).mappings().first()
            
            if not track:
                issues.append({
                    "type": "orphaned_emotion",
                    "track_id": track_id,
                    "issue": "Emotion record references non-existent track"
                })
    
    return {
        "total_issues": len(issues),
        "issues": issues,
    }


def validate_all() -> Dict[str, Any]:
    """Run all validation checks."""
    logger.info("=" * 60)
    logger.info("DATA VALIDATION")
    logger.info("=" * 60)
    
    results = {
        "feature_ranges": validate_feature_ranges(),
        "missing_fields": validate_missing_fields(),
        "duplicates": validate_duplicates(),
        "relationships": validate_relationships(),
    }
    
    # Summary
    total_issues = (
        results["feature_ranges"]["total_issues"] +
        results["relationships"]["total_issues"]
    )
    
    results["summary"] = {
        "total_issues": total_issues,
        "data_quality_score": max(0, 100 - (total_issues * 10)),  # Simple scoring
    }
    
    return results


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Validate SERGIK ML database data quality"
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Output JSON file for validation results"
    )
    
    args = parser.parse_args()
    
    # Initialize database
    init_db()
    
    # Run validation
    results = validate_all()
    
    # Print summary
    logger.info("=" * 60)
    logger.info("VALIDATION SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Total issues: {results['summary']['total_issues']}")
    logger.info(f"Data quality score: {results['summary']['data_quality_score']}/100")
    
    if results["feature_ranges"]["total_issues"] > 0:
        logger.warning(f"Feature range issues: {results['feature_ranges']['total_issues']}")
    
    if results["missing_fields"]["missing_energy"] > 0:
        logger.warning(f"Missing energy: {results['missing_fields']['missing_energy']}")
    
    if results["relationships"]["total_issues"] > 0:
        logger.warning(f"Relationship issues: {results['relationships']['total_issues']}")
    
    # Save results
    if args.output:
        import json
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        logger.info(f"Results saved to: {args.output}")


if __name__ == "__main__":
    main()

