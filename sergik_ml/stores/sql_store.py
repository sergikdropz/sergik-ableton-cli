"""
SERGIK ML SQL Store - SQLAlchemy-based persistence.

Tables:
  - music_intelligence: Track features and metadata
  - pack_manifests: Sample pack exports
  - emotion_intelligence: Preference/emotion signals
  - action_log: All command executions for ML training
"""

from sqlalchemy import create_engine, MetaData, Table, Column, Index
from sqlalchemy import String, Float, Text, JSON, DateTime, Integer
from sqlalchemy import select
from sqlalchemy.pool import QueuePool, StaticPool
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import SQLAlchemyError
from contextlib import contextmanager
from typing import Any, Dict, List, Optional
import datetime
import uuid
import logging
import time

from ..config import CFG
from ..utils.errors import DatabaseError

logger = logging.getLogger(__name__)

# Determine pool class based on database type
_is_sqlite = CFG.db_url.startswith("sqlite:///")

# Create engine with connection pooling
if _is_sqlite:
    # SQLite uses StaticPool (single connection) but with check_same_thread=False
    engine = create_engine(
        CFG.db_url,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        future=True,
        echo=False
    )
else:
    # PostgreSQL/MySQL use QueuePool with connection pooling
    engine = create_engine(
        CFG.db_url,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,   # Recycle connections after 1 hour
        future=True,
        echo=False
    )

meta = MetaData()

# ============================================================================
# Table Definitions
# ============================================================================

music_intelligence = Table(
    "music_intelligence", meta,
    Column("track_id", String(255), primary_key=True),
    Column("bpm", Float),
    Column("key", String(10)),
    Column("energy", Float),
    Column("brightness", Float),
    Column("lufs", Float),
    Column("harmonic_ratio", Float),
    Column("percussive_ratio", Float),
    Column("stereo_width", Float),
    Column("source_pack", String(255)),
    Column("rating", Float, index=True),  # Index for rated_only queries
    Column("style_source", String(50)),
    Column("prompt_text", Text),
    Column("tags", JSON),
    Column("structure_json", JSON),
    Column("embedding", JSON),  # Store embeddings as JSON array
    Column("updated_at", DateTime, index=True),  # Index for time-based queries
)

pack_manifests = Table(
    "pack_manifests", meta,
    Column("pack_id", String(36), primary_key=True),
    Column("pack_name", String(255)),
    Column("export_dir", Text),
    Column("zip_path", Text),
    Column("cloud_url", Text),
    Column("manifest_json", JSON),
    Column("track_count", Integer),
    Column("total_duration_sec", Float),
    Column("created_at", DateTime),
)

emotion_intelligence = Table(
    "emotion_intelligence", meta,
    Column("emotion_id", String(36), primary_key=True),
    Column("track_id", String(255), index=True),
    Column("valence", Float),
    Column("arousal", Float),
    Column("dominance", Float),
    Column("source", String(50)),
    Column("payload", JSON),
    Column("timestamp", DateTime),
)

action_log = Table(
    "action_log", meta,
    Column("event_id", String(36), primary_key=True),
    Column("cmd", String(100), index=True),
    Column("args", JSON),
    Column("meta", JSON),
    Column("result", JSON),
    Column("status", String(20), index=True),  # Index for filtering by status
    Column("error", Text),
    Column("duration_ms", Integer),
    Column("timestamp", DateTime, index=True),
    # Composite index for common query patterns
    Index("idx_action_log_cmd_timestamp", "cmd", "timestamp"),
)

session_states = Table(
    "session_states", meta,
    Column("session_id", String(36), primary_key=True),
    Column("tempo", Float),
    Column("is_playing", Integer),  # SQLite uses Integer for boolean
    Column("is_recording", Integer),
    Column("track_count", Integer),
    Column("scene_count", Integer),
    Column("state_data", JSON),  # Serialized state (tracks, devices, clips)
    Column("version", Integer, default=1),  # For optimistic locking
    Column("created_at", DateTime),
    Column("updated_at", DateTime, index=True),
    Index("idx_session_states_updated_at", "updated_at"),
)

state_history = Table(
    "state_history", meta,
    Column("history_id", String(36), primary_key=True),
    Column("session_id", String(36), index=True),
    Column("version", Integer),
    Column("state_data", JSON),
    Column("change_summary", Text),  # Description of what changed
    Column("timestamp", DateTime, index=True),
    Index("idx_state_history_session_version", "session_id", "version"),
    Index("idx_state_history_timestamp", "timestamp"),
)


# ============================================================================
# Database Operations
# ============================================================================

def init_db() -> None:
    """Initialize database tables and indexes."""
    try:
        meta.create_all(engine)
        logger.info(f"Database initialized: {CFG.db_url}")
    except SQLAlchemyError as e:
        raise DatabaseError(
            f"Failed to initialize database: {e}",
            details={"db_url": CFG.db_url}
        ) from e


@contextmanager
def get_db_connection():
    """
    Context manager for database connections with retry logic.
    
    Yields:
        Database connection
    """
    max_retries = 3
    retry_delay = 0.1
    
    for attempt in range(max_retries):
        try:
            with engine.begin() as conn:
                yield conn
                return
        except SQLAlchemyError as e:
            if attempt == max_retries - 1:
                raise DatabaseError(
                    f"Database operation failed after {max_retries} attempts: {e}",
                    details={"attempt": attempt + 1, "max_retries": max_retries}
                ) from e
            logger.warning(f"Database connection attempt {attempt + 1} failed, retrying: {e}")
            time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff


def now_utc() -> datetime.datetime:
    """Get current UTC timestamp."""
    return datetime.datetime.utcnow()


def log_action(
    cmd: str,
    args: Dict[str, Any],
    meta_in: Dict[str, Any],
    status: str,
    result: Dict[str, Any],
    error: Optional[str],
    duration_ms: int = 0
) -> str:
    """Log an action execution for ML training."""
    event_id = str(uuid.uuid4())
    try:
        with get_db_connection() as conn:
            conn.execute(action_log.insert().values(
                event_id=event_id,
                cmd=cmd,
                args=args,
                meta=meta_in,
                result=result,
                status=status,
                error=error,
                duration_ms=duration_ms,
                timestamp=now_utc(),
            ))
        return event_id
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(
            f"Failed to log action: {e}",
            details={"cmd": cmd, "event_id": event_id}
        ) from e


def upsert_track(row: Dict[str, Any]) -> None:
    """Insert or update a track in music_intelligence."""
    if "updated_at" not in row or row["updated_at"] is None:
        row["updated_at"] = now_utc()

    try:
        stmt = sqlite_insert(music_intelligence).values(**row)
        stmt = stmt.on_conflict_do_update(index_elements=["track_id"], set_=row)

        with get_db_connection() as conn:
            conn.execute(stmt)
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(
            f"Failed to upsert track: {e}",
            details={"track_id": row.get("track_id")}
        ) from e


def insert_pack_manifest(row: Dict[str, Any]) -> None:
    """Insert a pack manifest."""
    try:
        with get_db_connection() as conn:
            conn.execute(pack_manifests.insert().values(**row))
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(
            f"Failed to insert pack manifest: {e}",
            details={"pack_id": row.get("pack_id")}
        ) from e


def insert_emotion(ev: Dict[str, Any]) -> None:
    """Insert an emotion/preference event."""
    try:
        with get_db_connection() as conn:
            conn.execute(emotion_intelligence.insert().values(**ev))
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(
            f"Failed to insert emotion: {e}",
            details={"emotion_id": ev.get("emotion_id"), "track_id": ev.get("track_id")}
        ) from e


def get_track(track_id: str) -> Optional[Dict[str, Any]]:
    """Get a single track by ID."""
    try:
        with get_db_connection() as conn:
            r = conn.execute(
                select(music_intelligence).where(music_intelligence.c.track_id == track_id)
            ).mappings().first()
        return dict(r) if r else None
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(
            f"Failed to get track: {e}",
            details={"track_id": track_id}
        ) from e


def list_tracks(limit: int = 5000, rated_only: bool = False) -> List[Dict[str, Any]]:
    """List tracks from music_intelligence."""
    try:
        stmt = select(music_intelligence).limit(limit)
        if rated_only:
            stmt = stmt.where(music_intelligence.c.rating.isnot(None))

        with get_db_connection() as conn:
            rows = conn.execute(stmt).mappings().all()
        return [dict(r) for r in rows]
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(
            f"Failed to list tracks: {e}",
            details={"limit": limit, "rated_only": rated_only}
        ) from e


def get_action_history(cmd: Optional[str] = None, limit: int = 1000) -> List[Dict[str, Any]]:
    """Get action history for training."""
    try:
        stmt = select(action_log).order_by(action_log.c.timestamp.desc()).limit(limit)
        if cmd:
            stmt = stmt.where(action_log.c.cmd == cmd)

        with get_db_connection() as conn:
            rows = conn.execute(stmt).mappings().all()
        return [dict(r) for r in rows]
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(
            f"Failed to get action history: {e}",
            details={"cmd": cmd, "limit": limit}
        ) from e


def batch_upsert_tracks(tracks: List[Dict[str, Any]]) -> int:
    """
    Batch upsert multiple tracks.
    
    Args:
        tracks: List of track dictionaries
        
    Returns:
        Number of tracks successfully upserted
    """
    if not tracks:
        return 0
    
    # Ensure updated_at is set
    for track in tracks:
        if "updated_at" not in track or track["updated_at"] is None:
            track["updated_at"] = now_utc()
    
    inserted = 0
    try:
        with get_db_connection() as conn:
            for track in tracks:
                try:
                    stmt = sqlite_insert(music_intelligence).values(**track)
                    stmt = stmt.on_conflict_do_update(index_elements=["track_id"], set_=track)
                    conn.execute(stmt)
                    inserted += 1
                except SQLAlchemyError as e:
                    logger.error(f"Error upserting track {track.get('track_id', 'unknown')}: {e}")
                    # Continue with next track instead of failing entire batch
        return inserted
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(
            f"Failed to batch upsert tracks: {e}",
            details={"track_count": len(tracks), "inserted": inserted}
        ) from e


def batch_insert_emotions(emotions: List[Dict[str, Any]]) -> int:
    """
    Batch insert emotion events.
    
    Args:
        emotions: List of emotion dictionaries
        
    Returns:
        Number of emotions successfully inserted
    """
    if not emotions:
        return 0
    
    inserted = 0
    try:
        with get_db_connection() as conn:
            for emotion in emotions:
                try:
                    stmt = sqlite_insert(emotion_intelligence).values(**emotion)
                    stmt = stmt.on_conflict_do_update(index_elements=["emotion_id"], set_=emotion)
                    conn.execute(stmt)
                    inserted += 1
                except SQLAlchemyError as e:
                    logger.error(f"Error inserting emotion {emotion.get('emotion_id', 'unknown')}: {e}")
                    # Continue with next emotion instead of failing entire batch
        return inserted
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(
            f"Failed to batch insert emotions: {e}",
            details={"emotion_count": len(emotions), "inserted": inserted}
        ) from e