#!/usr/bin/env python3
"""
SERGIK Database Analysis Script

Analyzes data distribution across all database tables and identifies gaps
in features, ratings, embeddings, and other critical data.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from collections import Counter, defaultdict
import logging
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sergik_ml.stores.sql_store import (
    engine,
    music_intelligence,
    pack_manifests,
    emotion_intelligence,
    action_log,
    list_tracks,
    get_action_history,
)
from sqlalchemy import select, func
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def analyze_tracks() -> Dict[str, Any]:
    """Analyze music_intelligence table."""
    logger.info("Analyzing music_intelligence table...")
    
    with engine.begin() as conn:
        # Total count
        total_count = conn.execute(
            select(func.count()).select_from(music_intelligence)
        ).scalar()
        
        # Rated tracks
        rated_count = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.rating.isnot(None)
            )
        ).scalar()
        
        # Tracks with embeddings
        with_embedding = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.embedding.isnot(None)
            )
        ).scalar()
        
        # Missing features
        missing_bpm = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.bpm.is_(None)
            )
        ).scalar()
        
        missing_key = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.key.is_(None)
            )
        ).scalar()
        
        missing_energy = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.energy.is_(None)
            )
        ).scalar()
        
        missing_brightness = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.brightness.is_(None)
            )
        ).scalar()
        
        missing_lufs = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.lufs.is_(None)
            )
        ).scalar()
        
        # Rating distribution
        rating_rows = conn.execute(
            select(music_intelligence.c.rating).where(
                music_intelligence.c.rating.isnot(None)
            )
        ).fetchall()
        ratings = [float(r[0]) for r in rating_rows if r[0] is not None]
        
        # Style source distribution
        style_rows = conn.execute(
            select(music_intelligence.c.style_source).where(
                music_intelligence.c.style_source.isnot(None)
            )
        ).fetchall()
        styles = Counter([r[0] for r in style_rows if r[0]])
        
        # BPM statistics
        bpm_rows = conn.execute(
            select(music_intelligence.c.bpm).where(
                music_intelligence.c.bpm.isnot(None)
            )
        ).fetchall()
        bpms = [float(r[0]) for r in bpm_rows if r[0] is not None]
        
        # Key distribution
        key_rows = conn.execute(
            select(music_intelligence.c.key).where(
                music_intelligence.c.key.isnot(None)
            )
        ).fetchall()
        keys = Counter([r[0] for r in key_rows if r[0]])
    
    return {
        "total_tracks": total_count,
        "rated_tracks": rated_count,
        "rated_percentage": (rated_count / total_count * 100) if total_count > 0 else 0,
        "with_embeddings": with_embedding,
        "embedding_percentage": (with_embedding / total_count * 100) if total_count > 0 else 0,
        "missing_features": {
            "bpm": missing_bpm,
            "key": missing_key,
            "energy": missing_energy,
            "brightness": missing_brightness,
            "lufs": missing_lufs,
        },
        "rating_distribution": {
            "count": len(ratings),
            "mean": float(np.mean(ratings)) if ratings else None,
            "std": float(np.std(ratings)) if ratings else None,
            "min": float(np.min(ratings)) if ratings else None,
            "max": float(np.max(ratings)) if ratings else None,
            "by_rating": dict(Counter([int(r) for r in ratings])),
        },
        "style_source_distribution": dict(styles),
        "bpm_statistics": {
            "count": len(bpms),
            "mean": float(np.mean(bpms)) if bpms else None,
            "std": float(np.std(bpms)) if bpms else None,
            "min": float(np.min(bpms)) if bpms else None,
            "max": float(np.max(bpms)) if bpms else None,
        },
        "key_distribution": dict(keys),
    }


def analyze_packs() -> Dict[str, Any]:
    """Analyze pack_manifests table."""
    logger.info("Analyzing pack_manifests table...")
    
    with engine.begin() as conn:
        total_count = conn.execute(
            select(func.count()).select_from(pack_manifests)
        ).scalar()
        
        # Pack statistics
        pack_rows = conn.execute(
            select(
                pack_manifests.c.track_count,
                pack_manifests.c.total_duration_sec
            )
        ).fetchall()
        
        track_counts = [r[0] for r in pack_rows if r[0] is not None]
        durations = [r[1] for r in pack_rows if r[1] is not None]
    
    return {
        "total_packs": total_count,
        "total_tracks_in_packs": sum(track_counts) if track_counts else 0,
        "total_duration_sec": sum(durations) if durations else 0,
        "avg_tracks_per_pack": float(np.mean(track_counts)) if track_counts else 0,
        "avg_duration_per_pack": float(np.mean(durations)) if durations else 0,
    }


def analyze_emotions() -> Dict[str, Any]:
    """Analyze emotion_intelligence table."""
    logger.info("Analyzing emotion_intelligence table...")
    
    with engine.begin() as conn:
        total_count = conn.execute(
            select(func.count()).select_from(emotion_intelligence)
        ).scalar()
        
        # Source distribution
        source_rows = conn.execute(
            select(emotion_intelligence.c.source).where(
                emotion_intelligence.c.source.isnot(None)
            )
        ).fetchall()
        sources = Counter([r[0] for r in source_rows if r[0]])
        
        # Valence, arousal, dominance statistics
        emotion_rows = conn.execute(
            select(
                emotion_intelligence.c.valence,
                emotion_intelligence.c.arousal,
                emotion_intelligence.c.dominance
            )
        ).fetchall()
        
        valences = [float(r[0]) for r in emotion_rows if r[0] is not None]
        arousals = [float(r[1]) for r in emotion_rows if r[1] is not None]
        dominances = [float(r[2]) for r in emotion_rows if r[2] is not None]
        
        # Unique tracks with emotions
        unique_tracks = conn.execute(
            select(func.count(func.distinct(emotion_intelligence.c.track_id)))
        ).scalar()
    
    return {
        "total_emotions": total_count,
        "unique_tracks_with_emotions": unique_tracks,
        "source_distribution": dict(sources),
        "valence_statistics": {
            "mean": float(np.mean(valences)) if valences else None,
            "std": float(np.std(valences)) if valences else None,
            "min": float(np.min(valences)) if valences else None,
            "max": float(np.max(valences)) if valences else None,
        },
        "arousal_statistics": {
            "mean": float(np.mean(arousals)) if arousals else None,
            "std": float(np.std(arousals)) if arousals else None,
            "min": float(np.min(arousals)) if arousals else None,
            "max": float(np.max(arousals)) if arousals else None,
        },
        "dominance_statistics": {
            "mean": float(np.mean(dominances)) if dominances else None,
            "std": float(np.std(dominances)) if dominances else None,
            "min": float(np.min(dominances)) if dominances else None,
            "max": float(np.max(dominances)) if dominances else None,
        },
    }


def analyze_actions() -> Dict[str, Any]:
    """Analyze action_log table."""
    logger.info("Analyzing action_log table...")
    
    with engine.begin() as conn:
        total_count = conn.execute(
            select(func.count()).select_from(action_log)
        ).scalar()
        
        # Command distribution
        cmd_rows = conn.execute(
            select(action_log.c.cmd).where(
                action_log.c.cmd.isnot(None)
            )
        ).fetchall()
        commands = Counter([r[0] for r in cmd_rows if r[0]])
        
        # Status distribution
        status_rows = conn.execute(
            select(action_log.c.status).where(
                action_log.c.status.isnot(None)
            )
        ).fetchall()
        statuses = Counter([r[0] for r in status_rows if r[0]])
        
        # Duration statistics
        duration_rows = conn.execute(
            select(action_log.c.duration_ms).where(
                action_log.c.duration_ms.isnot(None)
            )
        ).fetchall()
        durations = [int(r[0]) for r in duration_rows if r[0] is not None]
        
        # Error count
        error_count = conn.execute(
            select(func.count()).select_from(action_log).where(
                action_log.c.error.isnot(None)
            )
        ).scalar()
    
    return {
        "total_actions": total_count,
        "command_distribution": dict(commands.most_common(20)),
        "status_distribution": dict(statuses),
        "error_count": error_count,
        "error_percentage": (error_count / total_count * 100) if total_count > 0 else 0,
        "duration_statistics": {
            "count": len(durations),
            "mean_ms": float(np.mean(durations)) if durations else None,
            "std_ms": float(np.std(durations)) if durations else None,
            "min_ms": int(np.min(durations)) if durations else None,
            "max_ms": int(np.max(durations)) if durations else None,
        },
    }


def identify_data_gaps(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Identify gaps in data that need to be filled."""
    gaps = {
        "critical": [],
        "important": [],
        "optional": [],
    }
    
    tracks = analysis.get("tracks", {})
    total_tracks = tracks.get("total_tracks", 0)
    
    if total_tracks == 0:
        gaps["critical"].append("No tracks in database")
        return gaps
    
    # Critical gaps
    rated_pct = tracks.get("rated_percentage", 0)
    if rated_pct < 10:
        gaps["critical"].append(
            f"Only {rated_pct:.1f}% of tracks are rated. Need at least 10% for ML training."
        )
    
    missing_features = tracks.get("missing_features", {})
    if missing_features.get("bpm", 0) > total_tracks * 0.5:
        gaps["critical"].append(
            f"Missing BPM for {missing_features['bpm']} tracks ({missing_features['bpm']/total_tracks*100:.1f}%)"
        )
    
    if missing_features.get("energy", 0) > total_tracks * 0.5:
        gaps["critical"].append(
            f"Missing energy for {missing_features['energy']} tracks ({missing_features['energy']/total_tracks*100:.1f}%)"
        )
    
    # Important gaps
    embedding_pct = tracks.get("embedding_percentage", 0)
    if embedding_pct < 50:
        gaps["important"].append(
            f"Only {embedding_pct:.1f}% of tracks have embeddings. Recommend 50%+ for similarity search."
        )
    
    if missing_features.get("key", 0) > total_tracks * 0.3:
        gaps["important"].append(
            f"Missing key for {missing_features['key']} tracks ({missing_features['key']/total_tracks*100:.1f}%)"
        )
    
    # Optional gaps
    if missing_features.get("brightness", 0) > total_tracks * 0.2:
        gaps["optional"].append(
            f"Missing brightness for {missing_features['brightness']} tracks"
        )
    
    if missing_features.get("lufs", 0) > total_tracks * 0.2:
        gaps["optional"].append(
            f"Missing LUFS for {missing_features['lufs']} tracks"
        )
    
    return gaps


def generate_report(analysis: Dict[str, Any], output_file: Path) -> None:
    """Generate comprehensive data quality report."""
    report = {
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_tracks": analysis["tracks"]["total_tracks"],
            "rated_tracks": analysis["tracks"]["rated_tracks"],
            "total_packs": analysis["packs"]["total_packs"],
            "total_emotions": analysis["emotions"]["total_emotions"],
            "total_actions": analysis["actions"]["total_actions"],
        },
        "tracks": analysis["tracks"],
        "packs": analysis["packs"],
        "emotions": analysis["emotions"],
        "actions": analysis["actions"],
        "data_gaps": identify_data_gaps(analysis),
        "recommendations": generate_recommendations(analysis),
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, default=str)
    
    logger.info(f"Report saved to: {output_file}")


def generate_recommendations(analysis: Dict[str, Any]) -> List[str]:
    """Generate recommendations based on analysis."""
    recommendations = []
    
    tracks = analysis.get("tracks", {})
    rated_pct = tracks.get("rated_percentage", 0)
    
    if rated_pct < 10:
        recommendations.append(
            f"Collect ratings for at least {int(tracks['total_tracks'] * 0.1)} tracks "
            f"(currently {tracks['rated_tracks']} rated, need {int(tracks['total_tracks'] * 0.1) - tracks['rated_tracks']} more)"
        )
    
    embedding_pct = tracks.get("embedding_percentage", 0)
    if embedding_pct < 50:
        recommendations.append(
            f"Generate embeddings for at least {int(tracks['total_tracks'] * 0.5)} tracks "
            f"(currently {tracks['with_embeddings']} with embeddings)"
        )
    
    missing_features = tracks.get("missing_features", {})
    if missing_features.get("bpm", 0) > 0:
        recommendations.append(
            f"Extract BPM for {missing_features['bpm']} tracks missing this feature"
        )
    
    if missing_features.get("energy", 0) > 0:
        recommendations.append(
            f"Extract energy for {missing_features['energy']} tracks missing this feature"
        )
    
    actions = analysis.get("actions", {})
    error_pct = actions.get("error_percentage", 0)
    if error_pct > 5:
        recommendations.append(
            f"Investigate {actions['error_count']} failed actions ({error_pct:.1f}% error rate)"
        )
    
    return recommendations


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Analyze SERGIK ML database and identify data gaps"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/analysis"),
        help="Directory for analysis reports (default: data/analysis)"
    )
    
    args = parser.parse_args()
    
    args.output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info("=" * 60)
    logger.info("DATABASE ANALYSIS")
    logger.info("=" * 60)
    
    # Run all analyses
    analysis = {
        "tracks": analyze_tracks(),
        "packs": analyze_packs(),
        "emotions": analyze_emotions(),
        "actions": analyze_actions(),
    }
    
    # Print summary
    logger.info("\n" + "=" * 60)
    logger.info("SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Total tracks: {analysis['tracks']['total_tracks']}")
    logger.info(f"Rated tracks: {analysis['tracks']['rated_tracks']} ({analysis['tracks']['rated_percentage']:.1f}%)")
    logger.info(f"Total packs: {analysis['packs']['total_packs']}")
    logger.info(f"Total emotions: {analysis['emotions']['total_emotions']}")
    logger.info(f"Total actions: {analysis['actions']['total_actions']}")
    
    # Generate report
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = args.output_dir / f"database_report_{timestamp}.json"
    generate_report(analysis, report_file)
    
    # Print data gaps
    gaps = identify_data_gaps(analysis)
    if gaps["critical"]:
        logger.info("\n" + "=" * 60)
        logger.info("CRITICAL DATA GAPS")
        logger.info("=" * 60)
        for gap in gaps["critical"]:
            logger.warning(f"  ⚠ {gap}")
    
    if gaps["important"]:
        logger.info("\n" + "=" * 60)
        logger.info("IMPORTANT DATA GAPS")
        logger.info("=" * 60)
        for gap in gaps["important"]:
            logger.info(f"  • {gap}")
    
    logger.info(f"\nFull report saved to: {report_file}")


if __name__ == "__main__":
    main()

