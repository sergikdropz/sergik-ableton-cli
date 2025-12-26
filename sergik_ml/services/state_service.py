"""
State Management Service

Server-side state management for session state tracking, synchronization,
conflict resolution, and state history with database persistence.
"""

import logging
import time
import json
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass, field, asdict

from .base import BaseService
from ..stores.sql_store import (
    get_db_connection,
    session_states,
    state_history,
    now_utc
)
from ..utils.errors import DatabaseError
from sqlalchemy import select, update
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

logger = logging.getLogger(__name__)


@dataclass
class TrackState:
    """State of a single track."""
    track_index: int
    name: str
    volume: float = 0.0
    pan: float = 0.0
    muted: bool = False
    soloed: bool = False
    armed: bool = False
    device_count: int = 0
    clip_count: int = 0
    last_updated: float = field(default_factory=time.time)


@dataclass
class DeviceState:
    """State of a single device."""
    track_index: int
    device_index: int
    name: str
    class_name: str
    enabled: bool = True
    parameters: Dict[str, float] = field(default_factory=dict)
    last_updated: float = field(default_factory=time.time)


@dataclass
class ClipState:
    """State of a single clip."""
    track_index: int
    slot_index: int
    has_clip: bool = False
    name: Optional[str] = None
    length: Optional[float] = None
    loop_start: Optional[float] = None
    loop_end: Optional[float] = None
    is_playing: bool = False
    is_recording: bool = False
    last_updated: float = field(default_factory=time.time)


@dataclass
class SessionState:
    """Complete session state."""
    session_id: str
    tempo: float = 120.0
    is_playing: bool = False
    is_recording: bool = False
    track_count: int = 0
    scene_count: int = 0
    tracks: Dict[int, TrackState] = field(default_factory=dict)
    devices: Dict[str, DeviceState] = field(default_factory=dict)  # key: "track_index:device_index"
    clips: Dict[str, ClipState] = field(default_factory=dict)  # key: "track_index:slot_index"
    version: int = 1
    last_updated: float = field(default_factory=time.time)
    created_at: float = field(default_factory=time.time)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session state to dictionary for serialization."""
        return {
            "session_id": self.session_id,
            "tempo": self.tempo,
            "is_playing": self.is_playing,
            "is_recording": self.is_recording,
            "track_count": self.track_count,
            "scene_count": self.scene_count,
            "tracks": {k: asdict(v) for k, v in self.tracks.items()},
            "devices": {k: asdict(v) for k, v in self.devices.items()},
            "clips": {k: asdict(v) for k, v in self.clips.items()},
            "version": self.version,
            "last_updated": self.last_updated,
            "created_at": self.created_at,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SessionState":
        """Create session state from dictionary."""
        tracks = {
            int(k): TrackState(**v) 
            for k, v in data.get("tracks", {}).items()
        }
        devices = {
            k: DeviceState(**v)
            for k, v in data.get("devices", {}).items()
        }
        clips = {
            k: ClipState(**v)
            for k, v in data.get("clips", {}).items()
        }
        
        return cls(
            session_id=data["session_id"],
            tempo=data.get("tempo", 120.0),
            is_playing=data.get("is_playing", False),
            is_recording=data.get("is_recording", False),
            track_count=data.get("track_count", 0),
            scene_count=data.get("scene_count", 0),
            tracks=tracks,
            devices=devices,
            clips=clips,
            version=data.get("version", 1),
            last_updated=data.get("last_updated", time.time()),
            created_at=data.get("created_at", time.time()),
        )


class StateService(BaseService):
    """
    State management service for tracking Ableton Live session state with database persistence.
    """
    
    def __init__(self, session_id: Optional[str] = None):
        """
        Initialize state service.
        
        Args:
            session_id: Optional session ID (defaults to generating new one)
        """
        super().__init__()
        self.session_id = session_id or str(uuid.uuid4())
        self.max_history_size = 100
        self.conflict_resolution_strategy = "timestamp"  # "timestamp", "server", "client"
    
    def initialize_session(self) -> SessionState:
        """
        Initialize new session state.
        
        Returns:
            New session state
        """
        session_state = SessionState(session_id=self.session_id)
        self._save_state_to_db(session_state)
        logger.info(f"Initialized new session state: {self.session_id}")
        return session_state
    
    def get_session_state(self) -> Optional[SessionState]:
        """
        Get current session state from database.
        
        Returns:
            Current session state or None if not found
        """
        try:
            with get_db_connection() as conn:
                result = conn.execute(
                    select(session_states).where(
                        session_states.c.session_id == self.session_id
                    )
                ).mappings().first()
            
            if not result:
                return None
            
            state_data = json.loads(result["state_data"]) if isinstance(result["state_data"], str) else result["state_data"]
            state_data["session_id"] = result["session_id"]
            state_data["version"] = result["version"]
            state_data["created_at"] = result["created_at"].timestamp() if isinstance(result["created_at"], datetime) else result["created_at"]
            state_data["last_updated"] = result["updated_at"].timestamp() if isinstance(result["updated_at"], datetime) else result["updated_at"]
            
            return SessionState.from_dict(state_data)
        except Exception as e:
            logger.error(f"Failed to get session state: {e}", exc_info=True)
            raise DatabaseError(
                f"Failed to get session state: {e}",
                details={"session_id": self.session_id}
            ) from e
    
    def _save_state_to_db(self, state: SessionState, change_summary: Optional[str] = None) -> None:
        """Save state to database with versioning."""
        try:
            state_dict = state.to_dict()
            state_json = json.dumps(state_dict)
            
            now = now_utc()
            
            with get_db_connection() as conn:
                # Check if session exists
                existing = conn.execute(
                    select(session_states.c.version).where(
                        session_states.c.session_id == self.session_id
                    )
                ).scalar()
                
                if existing is not None:
                    # Update existing session with optimistic locking
                    if state.version != existing:
                        raise DatabaseError(
                            "State version conflict - state was modified by another process",
                            details={
                                "session_id": self.session_id,
                                "expected_version": state.version,
                                "actual_version": existing
                            }
                        )
                    
                    # Increment version
                    state.version += 1
                    state_dict["version"] = state.version
                    state_json = json.dumps(state_dict)
                    
                    conn.execute(
                        update(session_states).where(
                            session_states.c.session_id == self.session_id
                        ).values(
                            tempo=state.tempo,
                            is_playing=1 if state.is_playing else 0,
                            is_recording=1 if state.is_recording else 0,
                            track_count=state.track_count,
                            scene_count=state.scene_count,
                            state_data=state_json,
                            version=state.version,
                            updated_at=now
                        )
                    )
                else:
                    # Insert new session
                    conn.execute(
                        session_states.insert().values(
                            session_id=self.session_id,
                            tempo=state.tempo,
                            is_playing=1 if state.is_playing else 0,
                            is_recording=1 if state.is_recording else 0,
                            track_count=state.track_count,
                            scene_count=state.scene_count,
                            state_data=state_json,
                            version=state.version,
                            created_at=now,
                            updated_at=now
                        )
                    )
                
                # Save to history
                if change_summary:
                    history_id = str(uuid.uuid4())
                    conn.execute(
                        state_history.insert().values(
                            history_id=history_id,
                            session_id=self.session_id,
                            version=state.version,
                            state_data=state_json,
                            change_summary=change_summary,
                            timestamp=now
                        )
                    )
                    
                    # Cleanup old history
                    self._cleanup_history(conn)
        except DatabaseError:
            raise
        except Exception as e:
            logger.error(f"Failed to save state to database: {e}", exc_info=True)
            raise DatabaseError(
                f"Failed to save state: {e}",
                details={"session_id": self.session_id}
            ) from e
    
    def _cleanup_history(self, conn) -> None:
        """Clean up old history entries."""
        try:
            # Get count of history entries for this session
            count = conn.execute(
                select([state_history.c.history_id]).where(
                    state_history.c.session_id == self.session_id
                )
            ).rowcount
            
            if count > self.max_history_size:
                # Delete oldest entries
                to_delete = count - self.max_history_size
                conn.execute(
                    state_history.delete().where(
                        state_history.c.session_id == self.session_id
                    ).order_by(state_history.c.timestamp.asc()).limit(to_delete)
                )
        except Exception as e:
            logger.warning(f"Failed to cleanup history: {e}")
    
    def update_track_state(
        self,
        track_index: int,
        updates: Dict[str, Any]
    ) -> TrackState:
        """
        Update track state.
        
        Args:
            track_index: Track index
            updates: State updates
            
        Returns:
            Updated track state
        """
        state = self.get_session_state()
        if not state:
            state = self.initialize_session()
        
        if track_index not in state.tracks:
            state.tracks[track_index] = TrackState(
                track_index=track_index,
                name=updates.get("name", f"Track {track_index}")
            )
        
        track = state.tracks[track_index]
        
        # Update fields
        for key, value in updates.items():
            if hasattr(track, key):
                setattr(track, key, value)
        
        track.last_updated = time.time()
        state.last_updated = time.time()
        
        # Save to database
        self._save_state_to_db(state, change_summary=f"Updated track {track_index}")
        
        logger.debug(f"Updated track {track_index} state: {updates}")
        return track
    
    def update_device_state(
        self,
        track_index: int,
        device_index: int,
        updates: Dict[str, Any]
    ) -> DeviceState:
        """
        Update device state.
        
        Args:
            track_index: Track index
            device_index: Device index
            updates: State updates
            
        Returns:
            Updated device state
        """
        state = self.get_session_state()
        if not state:
            state = self.initialize_session()
        
        key = f"{track_index}:{device_index}"
        
        if key not in state.devices:
            state.devices[key] = DeviceState(
                track_index=track_index,
                device_index=device_index,
                name=updates.get("name", f"Device {device_index}"),
                class_name=updates.get("class_name", "Unknown")
            )
        
        device = state.devices[key]
        
        # Update fields
        for field_key, value in updates.items():
            if hasattr(device, field_key):
                setattr(device, field_key, value)
        
        device.last_updated = time.time()
        state.last_updated = time.time()
        
        # Save to database
        self._save_state_to_db(state, change_summary=f"Updated device {track_index}:{device_index}")
        
        logger.debug(f"Updated device {track_index}:{device_index} state: {updates}")
        return device
    
    def update_clip_state(
        self,
        track_index: int,
        slot_index: int,
        updates: Dict[str, Any]
    ) -> ClipState:
        """
        Update clip state.
        
        Args:
            track_index: Track index
            slot_index: Clip slot index
            updates: State updates
            
        Returns:
            Updated clip state
        """
        state = self.get_session_state()
        if not state:
            state = self.initialize_session()
        
        key = f"{track_index}:{slot_index}"
        
        if key not in state.clips:
            state.clips[key] = ClipState(
                track_index=track_index,
                slot_index=slot_index
            )
        
        clip = state.clips[key]
        
        # Update fields
        for field_key, value in updates.items():
            if hasattr(clip, field_key):
                setattr(clip, field_key, value)
        
        clip.last_updated = time.time()
        state.last_updated = time.time()
        
        # Save to database
        self._save_state_to_db(state, change_summary=f"Updated clip {track_index}:{slot_index}")
        
        logger.debug(f"Updated clip {track_index}:{slot_index} state: {updates}")
        return clip
    
    def sync_state(self, client_state: Dict[str, Any]) -> SessionState:
        """
        Synchronize state with client.
        
        Args:
            client_state: Client state dictionary
            
        Returns:
            Synchronized session state
        """
        state = self.get_session_state()
        if not state:
            state = self.initialize_session()
        
        # Update session-level state
        if "tempo" in client_state:
            state.tempo = float(client_state["tempo"])
        if "is_playing" in client_state:
            state.is_playing = bool(client_state["is_playing"])
        if "is_recording" in client_state:
            state.is_recording = bool(client_state["is_recording"])
        if "track_count" in client_state:
            state.track_count = int(client_state["track_count"])
        if "scene_count" in client_state:
            state.scene_count = int(client_state["scene_count"])
        
        # Update tracks
        if "tracks" in client_state:
            for track_data in client_state["tracks"]:
                track_index = track_data.get("index")
                if track_index is not None:
                    self.update_track_state(track_index, track_data)
        
        # Update devices
        if "devices" in client_state:
            for device_data in client_state["devices"]:
                track_index = device_data.get("track_index")
                device_index = device_data.get("device_index")
                if track_index is not None and device_index is not None:
                    self.update_device_state(track_index, device_index, device_data)
        
        # Update clips
        if "clips" in client_state:
            for clip_data in client_state["clips"]:
                track_index = clip_data.get("track_index")
                slot_index = clip_data.get("slot_index")
                if track_index is not None and slot_index is not None:
                    self.update_clip_state(track_index, slot_index, clip_data)
        
        state.last_updated = time.time()
        
        # Save to database
        self._save_state_to_db(state, change_summary="Synchronized with client")
        
        logger.info("Synchronized state with client")
        return state
    
    def resolve_conflict(
        self,
        server_state: Any,
        client_state: Any,
        field: str
    ) -> Any:
        """
        Resolve state conflict between server and client.
        
        Args:
            server_state: Server state value
            client_state: Client state value
            field: Field name
            
        Returns:
            Resolved state value
        """
        if self.conflict_resolution_strategy == "timestamp":
            # Use most recent (this is a simplified version)
            return client_state
        elif self.conflict_resolution_strategy == "server":
            return server_state
        elif self.conflict_resolution_strategy == "client":
            return client_state
        else:
            # Default to client
            return client_state
    
    def get_state_history(self, limit: int = 10) -> List[SessionState]:
        """
        Get state history from database.
        
        Args:
            limit: Maximum number of states to return
            
        Returns:
            List of historical states
        """
        try:
            with get_db_connection() as conn:
                results = conn.execute(
                    select(state_history).where(
                        state_history.c.session_id == self.session_id
                    ).order_by(state_history.c.timestamp.desc()).limit(limit)
                ).mappings().all()
            
            states = []
            for result in results:
                state_data = json.loads(result["state_data"]) if isinstance(result["state_data"], str) else result["state_data"]
                state_data["session_id"] = result["session_id"]
                state_data["version"] = result["version"]
                state_data["created_at"] = result["timestamp"].timestamp() if isinstance(result["timestamp"], datetime) else result["timestamp"]
                state_data["last_updated"] = result["timestamp"].timestamp() if isinstance(result["timestamp"], datetime) else result["timestamp"]
                states.append(SessionState.from_dict(state_data))
            
            return states
        except Exception as e:
            logger.error(f"Failed to get state history: {e}", exc_info=True)
            raise DatabaseError(
                f"Failed to get state history: {e}",
                details={"session_id": self.session_id}
            ) from e
    
    def get_track_state(self, track_index: int) -> Optional[TrackState]:
        """
        Get track state.
        
        Args:
            track_index: Track index
            
        Returns:
            Track state or None if not found
        """
        state = self.get_session_state()
        if not state:
            return None
        return state.tracks.get(track_index)
    
    def get_device_state(
        self,
        track_index: int,
        device_index: int
    ) -> Optional[DeviceState]:
        """
        Get device state.
        
        Args:
            track_index: Track index
            device_index: Device index
            
        Returns:
            Device state or None if not found
        """
        state = self.get_session_state()
        if not state:
            return None
        key = f"{track_index}:{device_index}"
        return state.devices.get(key)
    
    def get_clip_state(
        self,
        track_index: int,
        slot_index: int
    ) -> Optional[ClipState]:
        """
        Get clip state.
        
        Args:
            track_index: Track index
            slot_index: Clip slot index
            
        Returns:
            Clip state or None if not found
        """
        state = self.get_session_state()
        if not state:
            return None
        key = f"{track_index}:{slot_index}"
        return state.clips.get(key)
    
    def clear_state(self) -> None:
        """Clear all state from database."""
        try:
            with get_db_connection() as conn:
                conn.execute(
                    session_states.delete().where(
                        session_states.c.session_id == self.session_id
                    )
                )
                conn.execute(
                    state_history.delete().where(
                        state_history.c.session_id == self.session_id
                    )
                )
            logger.info(f"Cleared all state for session: {self.session_id}")
        except Exception as e:
            logger.error(f"Failed to clear state: {e}", exc_info=True)
            raise DatabaseError(
                f"Failed to clear state: {e}",
                details={"session_id": self.session_id}
            ) from e
