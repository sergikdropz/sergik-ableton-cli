#!/usr/bin/env python3
"""
SERGIK Database Extract and Re-import Script

Extracts all data from sergik_ml.db and re-feeds it back into the system.
This is useful for database migration, backup/restore, or data refresh.
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import logging

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sergik_ml.stores.sql_store import (
    engine,
    music_intelligence,
    pack_manifests,
    emotion_intelligence,
    action_log,
    upsert_track,
    insert_pack_manifest,
    insert_emotion,
    log_action,
    meta
)
from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_all_tracks() -> List[Dict[str, Any]]:
    """Extract all tracks from music_intelligence table."""
    logger.info("Extracting tracks from music_intelligence...")
    with engine.begin() as conn:
        stmt = select(music_intelligence)
        rows = conn.execute(stmt).mappings().all()
        tracks = [dict(row) for row in rows]
    
    logger.info(f"Extracted {len(tracks)} tracks")
    return tracks


def extract_all_packs() -> List[Dict[str, Any]]:
    """Extract all pack manifests."""
    logger.info("Extracting pack manifests...")
    with engine.begin() as conn:
        stmt = select(pack_manifests)
        rows = conn.execute(stmt).mappings().all()
        packs = [dict(row) for row in rows]
    
    logger.info(f"Extracted {len(packs)} pack manifests")
    return packs


def extract_all_emotions() -> List[Dict[str, Any]]:
    """Extract all emotion intelligence records."""
    logger.info("Extracting emotion intelligence records...")
    with engine.begin() as conn:
        stmt = select(emotion_intelligence)
        rows = conn.execute(stmt).mappings().all()
        emotions = [dict(row) for row in rows]
    
    logger.info(f"Extracted {len(emotions)} emotion records")
    return emotions


def extract_all_actions() -> List[Dict[str, Any]]:
    """Extract all action log records."""
    logger.info("Extracting action log records...")
    with engine.begin() as conn:
        stmt = select(action_log)
        rows = conn.execute(stmt).mappings().all()
        actions = [dict(row) for row in rows]
    
    logger.info(f"Extracted {len(actions)} action log records")
    return actions


def extract_all_data(output_dir: Path) -> Dict[str, Any]:
    """
    Extract all data from database and save to JSON files.
    
    Args:
        output_dir: Directory to save extracted data
        
    Returns:
        Dictionary with extraction summary
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info("=" * 60)
    logger.info("EXTRACTING ALL DATABASE DATA")
    logger.info("=" * 60)
    
    # Extract all tables
    tracks = extract_all_tracks()
    packs = extract_all_packs()
    emotions = extract_all_emotions()
    actions = extract_all_actions()
    
    # Save to JSON files
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    tracks_file = output_dir / f"music_intelligence_{timestamp}.json"
    packs_file = output_dir / f"pack_manifests_{timestamp}.json"
    emotions_file = output_dir / f"emotion_intelligence_{timestamp}.json"
    actions_file = output_dir / f"action_log_{timestamp}.json"
    
    with open(tracks_file, 'w', encoding='utf-8') as f:
        json.dump(tracks, f, indent=2, default=str)
    logger.info(f"Saved tracks to: {tracks_file}")
    
    with open(packs_file, 'w', encoding='utf-8') as f:
        json.dump(packs, f, indent=2, default=str)
    logger.info(f"Saved packs to: {packs_file}")
    
    with open(emotions_file, 'w', encoding='utf-8') as f:
        json.dump(emotions, f, indent=2, default=str)
    logger.info(f"Saved emotions to: {emotions_file}")
    
    with open(actions_file, 'w', encoding='utf-8') as f:
        json.dump(actions, f, indent=2, default=str)
    logger.info(f"Saved actions to: {actions_file}")
    
    summary = {
        "timestamp": timestamp,
        "tracks": len(tracks),
        "packs": len(packs),
        "emotions": len(emotions),
        "actions": len(actions),
        "files": {
            "tracks": str(tracks_file),
            "packs": str(packs_file),
            "emotions": str(emotions_file),
            "actions": str(actions_file),
        }
    }
    
    summary_file = output_dir / f"extraction_summary_{timestamp}.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    
    logger.info("=" * 60)
    logger.info("EXTRACTION COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Total tracks: {len(tracks)}")
    logger.info(f"Total packs: {len(packs)}")
    logger.info(f"Total emotions: {len(emotions)}")
    logger.info(f"Total actions: {len(actions)}")
    logger.info(f"Summary saved to: {summary_file}")
    
    return summary


def reimport_tracks(tracks: List[Dict[str, Any]]) -> int:
    """Re-import tracks into database."""
    logger.info(f"Re-importing {len(tracks)} tracks...")
    imported = 0
    
    for i, track in enumerate(tracks, 1):
        try:
            # Convert datetime strings back to datetime objects if needed
            if isinstance(track.get('updated_at'), str):
                try:
                    track['updated_at'] = datetime.fromisoformat(track['updated_at'].replace('Z', '+00:00'))
                except:
                    try:
                        track['updated_at'] = datetime.strptime(track['updated_at'], '%Y-%m-%d %H:%M:%S.%f')
                    except:
                        track['updated_at'] = None
            
            upsert_track(track)
            imported += 1
            
            if i % 100 == 0:
                logger.info(f"  Imported {i}/{len(tracks)} tracks...")
                
        except Exception as e:
            logger.error(f"Error importing track {track.get('track_id', 'unknown')}: {e}")
    
    logger.info(f"Successfully imported {imported}/{len(tracks)} tracks")
    return imported


def reimport_packs(packs: List[Dict[str, Any]]) -> int:
    """Re-import pack manifests into database."""
    logger.info(f"Re-importing {len(packs)} pack manifests...")
    imported = 0
    
    for pack in packs:
        try:
            # Convert datetime strings back to datetime objects if needed
            if isinstance(pack.get('created_at'), str):
                try:
                    pack['created_at'] = datetime.fromisoformat(pack['created_at'].replace('Z', '+00:00'))
                except:
                    try:
                        pack['created_at'] = datetime.strptime(pack['created_at'], '%Y-%m-%d %H:%M:%S.%f')
                    except:
                        pack['created_at'] = None
            
            # Use upsert for packs (handle conflicts)
            with engine.begin() as conn:
                stmt = sqlite_insert(pack_manifests).values(**pack)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["pack_id"],
                    set_=pack
                )
                conn.execute(stmt)
            
            imported += 1
            
        except Exception as e:
            logger.error(f"Error importing pack {pack.get('pack_id', 'unknown')}: {e}")
    
    logger.info(f"Successfully imported {imported}/{len(packs)} pack manifests")
    return imported


def reimport_emotions(emotions: List[Dict[str, Any]]) -> int:
    """Re-import emotion intelligence records."""
    logger.info(f"Re-importing {len(emotions)} emotion records...")
    imported = 0
    
    for emotion in emotions:
        try:
            # Convert datetime strings back to datetime objects if needed
            if isinstance(emotion.get('timestamp'), str):
                try:
                    emotion['timestamp'] = datetime.fromisoformat(emotion['timestamp'].replace('Z', '+00:00'))
                except:
                    try:
                        emotion['timestamp'] = datetime.strptime(emotion['timestamp'], '%Y-%m-%d %H:%M:%S.%f')
                    except:
                        emotion['timestamp'] = None
            
            # Use upsert for emotions (handle conflicts)
            with engine.begin() as conn:
                stmt = sqlite_insert(emotion_intelligence).values(**emotion)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["emotion_id"],
                    set_=emotion
                )
                conn.execute(stmt)
            
            imported += 1
            
        except Exception as e:
            logger.error(f"Error importing emotion {emotion.get('emotion_id', 'unknown')}: {e}")
    
    logger.info(f"Successfully imported {imported}/{len(emotions)} emotion records")
    return imported


def reimport_actions(actions: List[Dict[str, Any]]) -> int:
    """Re-import action log records."""
    logger.info(f"Re-importing {len(actions)} action log records...")
    imported = 0
    
    for action in actions:
        try:
            # Convert datetime strings back to datetime objects if needed
            if isinstance(action.get('timestamp'), str):
                try:
                    action['timestamp'] = datetime.fromisoformat(action['timestamp'].replace('Z', '+00:00'))
                except:
                    try:
                        action['timestamp'] = datetime.strptime(action['timestamp'], '%Y-%m-%d %H:%M:%S.%f')
                    except:
                        action['timestamp'] = None
            
            # Use direct insert to preserve original event_id
            with engine.begin() as conn:
                stmt = sqlite_insert(action_log).values(**action)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["event_id"],
                    set_=action
                )
                conn.execute(stmt)
            
            imported += 1
            
        except Exception as e:
            logger.error(f"Error importing action {action.get('event_id', 'unknown')}: {e}")
    
    logger.info(f"Successfully imported {imported}/{len(actions)} action log records")
    return imported


def reimport_all_data(data_dir: Path, summary_file: Path = None) -> Dict[str, Any]:
    """
    Re-import all data from JSON files back into database.
    
    Args:
        data_dir: Directory containing extracted JSON files
        summary_file: Optional path to extraction summary file
        
    Returns:
        Dictionary with re-import summary
    """
    logger.info("=" * 60)
    logger.info("RE-IMPORTING DATA INTO DATABASE")
    logger.info("=" * 60)
    
    # Load data from files
    if summary_file and summary_file.exists():
        with open(summary_file, 'r', encoding='utf-8') as f:
            summary = json.load(f)
        files = summary['files']
    else:
        # Find latest files
        tracks_files = sorted(data_dir.glob("music_intelligence_*.json"))
        packs_files = sorted(data_dir.glob("pack_manifests_*.json"))
        emotions_files = sorted(data_dir.glob("emotion_intelligence_*.json"))
        actions_files = sorted(data_dir.glob("action_log_*.json"))
        
        if not tracks_files:
            raise FileNotFoundError("No extraction files found in data directory")
        
        files = {
            "tracks": str(tracks_files[-1]),
            "packs": str(packs_files[-1]) if packs_files else None,
            "emotions": str(emotions_files[-1]) if emotions_files else None,
            "actions": str(actions_files[-1]) if actions_files else None,
        }
    
    # Load and re-import tracks
    with open(files['tracks'], 'r', encoding='utf-8') as f:
        tracks = json.load(f)
    tracks_imported = reimport_tracks(tracks)
    
    # Load and re-import packs
    packs_imported = 0
    if files.get('packs'):
        with open(files['packs'], 'r', encoding='utf-8') as f:
            packs = json.load(f)
        packs_imported = reimport_packs(packs)
    
    # Load and re-import emotions
    emotions_imported = 0
    if files.get('emotions'):
        with open(files['emotions'], 'r', encoding='utf-8') as f:
            emotions = json.load(f)
        emotions_imported = reimport_emotions(emotions)
    
    # Load and re-import actions
    actions_imported = 0
    if files.get('actions'):
        with open(files['actions'], 'r', encoding='utf-8') as f:
            actions = json.load(f)
        actions_imported = reimport_actions(actions)
    
    result = {
        "tracks_imported": tracks_imported,
        "packs_imported": packs_imported,
        "emotions_imported": emotions_imported,
        "actions_imported": actions_imported,
        "total_imported": tracks_imported + packs_imported + emotions_imported + actions_imported,
    }
    
    logger.info("=" * 60)
    logger.info("RE-IMPORT COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Tracks imported: {tracks_imported}/{len(tracks)}")
    logger.info(f"Packs imported: {packs_imported}")
    logger.info(f"Emotions imported: {emotions_imported}")
    logger.info(f"Actions imported: {actions_imported}")
    logger.info(f"Total records imported: {result['total_imported']}")
    
    return result


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Extract and re-import SERGIK ML database data"
    )
    parser.add_argument(
        "command",
        choices=["extract", "reimport", "full"],
        help="Command to execute: extract, reimport, or full (extract + reimport)"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/extracted_db"),
        help="Directory for extracted data (default: data/extracted_db)"
    )
    parser.add_argument(
        "--summary-file",
        type=Path,
        help="Path to extraction summary file (for reimport)"
    )
    
    args = parser.parse_args()
    
    if args.command == "extract":
        extract_all_data(args.output_dir)
    
    elif args.command == "reimport":
        reimport_all_data(args.output_dir, args.summary_file)
    
    elif args.command == "full":
        # Extract first
        summary = extract_all_data(args.output_dir)
        summary_file = args.output_dir / f"extraction_summary_{summary['timestamp']}.json"
        
        # Then re-import
        logger.info("\n" + "=" * 60)
        logger.info("Starting re-import process...")
        logger.info("=" * 60 + "\n")
        
        reimport_all_data(args.output_dir, summary_file)


if __name__ == "__main__":
    main()

