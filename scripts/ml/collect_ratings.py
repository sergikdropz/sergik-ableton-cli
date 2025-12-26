#!/usr/bin/env python3
"""
SERGIK Rating Collection Script

Interactive CLI for collecting track ratings to build preference model training dataset.
Target: 1000+ rated tracks

Features:
- Interactive rating interface
- Batch rating by collaborator/style/year
- Import ratings from CSV
- Validate rating distribution
"""

import sys
import csv
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sergik_ml.stores.sql_store import list_tracks, get_track, init_db
from sergik_ml.services.track_service import TrackService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

track_service = TrackService()


def interactive_rate_track(track: Dict[str, Any]) -> Optional[float]:
    """
    Interactive rating interface for a single track.
    
    Args:
        track: Track dictionary
        
    Returns:
        Rating (1-5) or None if skipped
    """
    print("\n" + "=" * 60)
    print(f"Track: {track.get('track_id', 'unknown')}")
    print(f"BPM: {track.get('bpm', 'N/A')}")
    print(f"Key: {track.get('key', 'N/A')}")
    print(f"Energy: {track.get('energy', 'N/A')}")
    print(f"Style: {track.get('style_source', 'N/A')}")
    if track.get('prompt_text'):
        print(f"Name: {track['prompt_text']}")
    print("=" * 60)
    
    while True:
        rating_input = input("Rate (1-5, 's' to skip, 'q' to quit): ").strip().lower()
        
        if rating_input == 'q':
            return None
        if rating_input == 's':
            return None
        
        try:
            rating = float(rating_input)
            if 1 <= rating <= 5:
                return rating
            else:
                print("Rating must be between 1 and 5")
        except ValueError:
            print("Invalid input. Enter a number between 1 and 5, 's' to skip, or 'q' to quit")


def rate_tracks_interactive(limit: Optional[int] = None, rated_only: bool = False):
    """Interactive rating session."""
    tracks = list_tracks(limit=limit or 100, rated_only=rated_only)
    
    if not tracks:
        logger.info("No tracks found to rate")
        return
    
    logger.info(f"Rating {len(tracks)} tracks. Press 'q' at any time to quit.")
    
    rated_count = 0
    skipped_count = 0
    
    for track in tracks:
        rating = interactive_rate_track(track)
        
        if rating is None:
            skipped_count += 1
            continue
        
        try:
            track_service.rate_track(
                track_id=track['track_id'],
                rating=rating,
                context="interactive_cli"
            )
            rated_count += 1
            logger.info(f"Rated track {track['track_id']}: {rating} stars")
        except Exception as e:
            logger.error(f"Error rating track {track['track_id']}: {e}")
    
    logger.info(f"\nRating session complete: {rated_count} rated, {skipped_count} skipped")


def batch_rate_by_collaborator(collaborator: str, rating: float, limit: Optional[int] = None):
    """Batch rate tracks by collaborator."""
    tracks = list_tracks(limit=limit or 1000)
    
    # Filter by collaborator (in tags)
    collaborator_tracks = []
    for track in tracks:
        tags = track.get("tags", [])
        if isinstance(tags, str):
            try:
                tags = json.loads(tags) if tags else []
            except:
                tags = []
        
        if isinstance(tags, list):
            for tag in tags:
                if collaborator.lower() in str(tag).lower():
                    collaborator_tracks.append(track)
                    break
    
    logger.info(f"Found {len(collaborator_tracks)} tracks with collaborator '{collaborator}'")
    
    rated_count = 0
    for track in collaborator_tracks:
        try:
            track_service.rate_track(
                track_id=track['track_id'],
                rating=rating,
                context=f"batch_collaborator:{collaborator}"
            )
            rated_count += 1
        except Exception as e:
            logger.error(f"Error rating track {track['track_id']}: {e}")
    
    logger.info(f"Batch rated {rated_count} tracks with rating {rating}")


def batch_rate_by_style(style_source: str, rating: float, limit: Optional[int] = None):
    """Batch rate tracks by style source."""
    tracks = list_tracks(limit=limit or 1000)
    
    style_tracks = [t for t in tracks if t.get("style_source") == style_source]
    
    logger.info(f"Found {len(style_tracks)} tracks with style '{style_source}'")
    
    rated_count = 0
    for track in style_tracks:
        try:
            track_service.rate_track(
                track_id=track['track_id'],
                rating=rating,
                context=f"batch_style:{style_source}"
            )
            rated_count += 1
        except Exception as e:
            logger.error(f"Error rating track {track['track_id']}: {e}")
    
    logger.info(f"Batch rated {rated_count} tracks with rating {rating}")


def import_ratings_from_csv(csv_file: Path):
    """Import ratings from CSV file.
    
    CSV format: track_id,rating,context (optional)
    """
    if not csv_file.exists():
        logger.error(f"CSV file not found: {csv_file}")
        return
    
    rated_count = 0
    error_count = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            track_id = row.get('track_id')
            rating_str = row.get('rating')
            context = row.get('context', 'csv_import')
            
            if not track_id or not rating_str:
                continue
            
            try:
                rating = float(rating_str)
                if not (1 <= rating <= 5):
                    logger.warning(f"Invalid rating {rating} for track {track_id}, skipping")
                    error_count += 1
                    continue
                
                track_service.rate_track(
                    track_id=track_id,
                    rating=rating,
                    context=context
                )
                rated_count += 1
            except Exception as e:
                logger.error(f"Error rating track {track_id}: {e}")
                error_count += 1
    
    logger.info(f"Imported {rated_count} ratings from CSV ({error_count} errors)")


def validate_rating_distribution() -> Dict[str, Any]:
    """Validate rating distribution and provide statistics."""
    from sergik_ml.stores.sql_store import engine, music_intelligence
    from sqlalchemy import select, func
    from collections import Counter
    
    with engine.begin() as conn:
        # Get rating distribution
        rating_rows = conn.execute(
            select(music_intelligence.c.rating).where(
                music_intelligence.c.rating.isnot(None)
            )
        ).fetchall()
        ratings = [int(float(r[0])) for r in rating_rows if r[0] is not None]
        
        total = len(ratings)
        distribution = dict(Counter(ratings))
        avg_rating = sum(ratings) / total if total > 0 else 0
    
    stats = {
        "total_rated": total,
        "avg_rating": avg_rating,
        "distribution": distribution,
        "target": 1000,
        "remaining": max(0, 1000 - total),
    }
    
    print("\n" + "=" * 60)
    print("RATING DISTRIBUTION")
    print("=" * 60)
    print(f"Total rated tracks: {stats['total_rated']}")
    print(f"Target: {stats['target']}")
    print(f"Remaining: {stats['remaining']}")
    print(f"Average rating: {stats['avg_rating']:.2f}")
    print("\nDistribution:")
    for rating in sorted(distribution.keys()):
        count = distribution[rating]
        percentage = (count / total * 100) if total > 0 else 0
        bar = "█" * int(percentage / 2)
        print(f"  {rating} stars: {count:4d} ({percentage:5.1f}%) {bar}")
    
    return stats


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Collect track ratings for SERGIK ML preference model"
    )
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Interactive rating
    parser_interactive = subparsers.add_parser('interactive', help='Interactive rating session')
    parser_interactive.add_argument('--limit', type=int, help='Limit number of tracks')
    parser_interactive.add_argument('--rated-only', action='store_true', help='Only show already-rated tracks')
    
    # Batch rating by collaborator
    parser_collab = subparsers.add_parser('batch-collaborator', help='Batch rate by collaborator')
    parser_collab.add_argument('collaborator', help='Collaborator name')
    parser_collab.add_argument('rating', type=float, help='Rating (1-5)')
    parser_collab.add_argument('--limit', type=int, help='Limit number of tracks')
    
    # Batch rating by style
    parser_style = subparsers.add_parser('batch-style', help='Batch rate by style')
    parser_style.add_argument('style', help='Style source')
    parser_style.add_argument('rating', type=float, help='Rating (1-5)')
    parser_style.add_argument('--limit', type=int, help='Limit number of tracks')
    
    # Import from CSV
    parser_csv = subparsers.add_parser('import-csv', help='Import ratings from CSV')
    parser_csv.add_argument('csv_file', type=Path, help='CSV file path')
    
    # Validate distribution
    parser_stats = subparsers.add_parser('stats', help='Show rating statistics')
    
    args = parser.parse_args()
    
    # Initialize database
    init_db()
    
    if args.command == 'interactive':
        rate_tracks_interactive(limit=args.limit, rated_only=args.rated_only)
    elif args.command == 'batch-collaborator':
        batch_rate_by_collaborator(args.collaborator, args.rating, limit=args.limit)
    elif args.command == 'batch-style':
        batch_rate_by_style(args.style, args.rating, limit=args.limit)
    elif args.command == 'import-csv':
        import_ratings_from_csv(args.csv_file)
    elif args.command == 'stats':
        validate_rating_distribution()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

