"""
ableton_metadata_parser.py — Sergik AI Producer Mode
Version: 1.0
Author: Sergik AI
Purpose:
    Parse Ableton Live .als files (which are gzipped XML) to extract metadata:
    - Project tempo (BPM)
    - Track names and types (audio/MIDI)
    - Devices/instruments per track
    - Clip names and lengths
    - Plugin information
    - Automation data
    - Sample references

Output:
    datasets/projects_als.csv — a structured index of Ableton projects.
    datasets/project_devices.csv — device/plugin usage statistics.
    datasets/project_samples.csv — sample references across projects.

Usage:
    python scripts/ableton_metadata_parser.py /path/to/Ableton/Projects
    python scripts/ableton_metadata_parser.py --single /path/to/project.als
"""

import argparse
import gzip
import json
import logging
import os
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
import re

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Add parent to path for imports
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class TrackInfo:
    """Information about a single track."""
    name: str
    track_type: str  # "audio", "midi", "return", "master"
    color_index: int = 0
    devices: List[str] = field(default_factory=list)
    plugin_names: List[str] = field(default_factory=list)
    clips: List[Dict[str, Any]] = field(default_factory=list)
    frozen: bool = False
    solo: bool = False
    mute: bool = False


@dataclass
class ProjectMetadata:
    """Complete project metadata."""
    project_path: str
    project_name: str
    file_size_mb: float = 0.0
    
    # Tempo/Timing
    tempo: Optional[float] = None
    time_signature_numerator: int = 4
    time_signature_denominator: int = 4
    
    # Track counts
    audio_track_count: int = 0
    midi_track_count: int = 0
    return_track_count: int = 0
    total_track_count: int = 0
    
    # Content
    clip_count: int = 0
    device_count: int = 0
    plugin_count: int = 0
    sample_count: int = 0
    
    # Tracks
    tracks: List[TrackInfo] = field(default_factory=list)
    
    # Device lists
    all_devices: List[str] = field(default_factory=list)
    all_plugins: List[str] = field(default_factory=list)
    
    # Sample references
    sample_refs: List[str] = field(default_factory=list)
    
    # Parse info
    ableton_version: Optional[str] = None
    creator: Optional[str] = None
    parse_timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    parse_errors: List[str] = field(default_factory=list)


# ============================================================================
# Parser Class
# ============================================================================

class AbletonMetadataParser:
    """
    Parser for Ableton Live Set (.als) files.
    
    .als files are gzipped XML containing the complete project structure.
    """
    
    # Native Ableton devices (not VST/AU plugins)
    NATIVE_DEVICES = {
        "Compressor", "Gate", "EQ Eight", "EQ Three", "Multiband Dynamics",
        "Limiter", "Saturator", "Overdrive", "Redux", "Erosion", "Vinyl Distortion",
        "Reverb", "Delay", "Simple Delay", "Filter Delay", "Grain Delay",
        "Chorus", "Flanger", "Phaser", "Frequency Shifter", "Ring Modulator",
        "Auto Pan", "Auto Filter", "Beat Repeat", "Looper",
        "Utility", "Spectrum", "Tuner", "External Audio Effect", "External Instrument",
        "Operator", "Analog", "Collision", "Electric", "Tension", "Wavetable",
        "Simpler", "Sampler", "Impulse", "Drum Rack", "Instrument Rack", "Audio Effect Rack",
        "Arpeggiator", "Chord", "Note Length", "Pitch", "Random", "Scale", "Velocity",
        "Glue Compressor", "Corpus", "Resonators", "Vocoder", "Pedal", "Amp",
        "Cabinet", "Echo", "Drift", "Hybrid Reverb",
    }
    
    def __init__(self):
        """Initialize parser."""
        self.current_file: Optional[str] = None
    
    def parse_als_file(self, als_path: str) -> Optional[ProjectMetadata]:
        """
        Parse an .als file and extract metadata.
        
        Args:
            als_path: Path to .als file
            
        Returns:
            ProjectMetadata or None if parsing fails
        """
        als_path = Path(als_path)
        self.current_file = str(als_path)
        
        if not als_path.exists():
            logger.error(f"File not found: {als_path}")
            return None
        
        if not als_path.suffix.lower() == ".als":
            logger.error(f"Not an .als file: {als_path}")
            return None
        
        # Initialize metadata
        metadata = ProjectMetadata(
            project_path=str(als_path),
            project_name=als_path.stem,
            file_size_mb=als_path.stat().st_size / (1024 * 1024),
        )
        
        try:
            # Decompress and parse XML
            with gzip.open(als_path, "rb") as f:
                xml_data = f.read()
            
            root = ET.fromstring(xml_data)
            
            # Extract version info
            metadata.ableton_version = root.get("MinorVersion", None)
            metadata.creator = root.get("Creator", None)
            
            # Parse main sections
            self._parse_tempo(root, metadata)
            self._parse_tracks(root, metadata)
            self._parse_samples(root, metadata)
            
            # Calculate totals
            metadata.total_track_count = len(metadata.tracks)
            metadata.audio_track_count = sum(1 for t in metadata.tracks if t.track_type == "audio")
            metadata.midi_track_count = sum(1 for t in metadata.tracks if t.track_type == "midi")
            metadata.return_track_count = sum(1 for t in metadata.tracks if t.track_type == "return")
            
            metadata.clip_count = sum(len(t.clips) for t in metadata.tracks)
            
            # Collect all devices and plugins
            all_devices = []
            all_plugins = []
            for track in metadata.tracks:
                all_devices.extend(track.devices)
                all_plugins.extend(track.plugin_names)
            
            metadata.all_devices = list(set(all_devices))
            metadata.all_plugins = list(set(all_plugins))
            metadata.device_count = len(all_devices)
            metadata.plugin_count = len(all_plugins)
            metadata.sample_count = len(metadata.sample_refs)
            
            return metadata
            
        except gzip.BadGzipFile:
            logger.error(f"Not a valid gzip file: {als_path}")
            metadata.parse_errors.append("Invalid gzip format")
            return metadata
            
        except ET.ParseError as e:
            logger.error(f"XML parse error in {als_path}: {e}")
            metadata.parse_errors.append(f"XML parse error: {e}")
            return metadata
            
        except Exception as e:
            logger.error(f"Failed to parse {als_path}: {e}")
            metadata.parse_errors.append(str(e))
            return metadata
    
    def _parse_tempo(self, root: ET.Element, metadata: ProjectMetadata):
        """Extract tempo and time signature."""
        try:
            # Try multiple paths for tempo
            tempo_paths = [
                ".//LiveSet/MasterTrack/DeviceChain/Mixer/Tempo/Manual",
                ".//MasterTrack/AutomationEnvelopes//Manual",
                ".//Tempo/Manual",
            ]
            
            for path in tempo_paths:
                tempo_node = root.find(path)
                if tempo_node is not None and "Value" in tempo_node.attrib:
                    metadata.tempo = float(tempo_node.attrib["Value"])
                    break
            
            # Time signature
            ts_num = root.find(".//TimeSignature/TimeSignatureNumerator/Value")
            ts_den = root.find(".//TimeSignature/TimeSignatureDenominator/Value")
            
            if ts_num is not None:
                metadata.time_signature_numerator = int(ts_num.text or 4)
            if ts_den is not None:
                metadata.time_signature_denominator = int(ts_den.text or 4)
                
        except Exception as e:
            logger.debug(f"Tempo parse warning: {e}")
    
    def _parse_tracks(self, root: ET.Element, metadata: ProjectMetadata):
        """Extract track information."""
        try:
            tracks_node = root.find(".//Tracks")
            if tracks_node is None:
                return
            
            # Parse different track types
            for track_type, tag in [
                ("audio", "AudioTrack"),
                ("midi", "MidiTrack"),
                ("return", "ReturnTrack"),
            ]:
                for track_node in tracks_node.findall(tag):
                    track_info = self._parse_single_track(track_node, track_type)
                    if track_info:
                        metadata.tracks.append(track_info)
            
            # Parse master track devices
            master = root.find(".//MasterTrack")
            if master is not None:
                master_info = self._parse_single_track(master, "master")
                if master_info:
                    metadata.tracks.append(master_info)
                    
        except Exception as e:
            logger.debug(f"Track parse warning: {e}")
    
    def _parse_single_track(self, track_node: ET.Element, track_type: str) -> Optional[TrackInfo]:
        """Parse a single track node."""
        try:
            # Get track name
            name_node = track_node.find(".//Name/EffectiveName")
            if name_node is not None and "Value" in name_node.attrib:
                name = name_node.attrib["Value"]
            else:
                name_node = track_node.find(".//Name/UserName")
                name = name_node.attrib.get("Value", "Unnamed") if name_node is not None else "Unnamed"
            
            track_info = TrackInfo(name=name, track_type=track_type)
            
            # Get color
            color_node = track_node.find(".//ColorIndex")
            if color_node is not None and "Value" in color_node.attrib:
                track_info.color_index = int(color_node.attrib["Value"])
            
            # Get freeze state
            freeze_node = track_node.find(".//Freeze")
            if freeze_node is not None and "Value" in freeze_node.attrib:
                track_info.frozen = freeze_node.attrib["Value"].lower() == "true"
            
            # Parse devices
            devices_node = track_node.find(".//DeviceChain/DeviceChain/Devices")
            if devices_node is None:
                devices_node = track_node.find(".//DeviceChain/Devices")
            
            if devices_node is not None:
                for device in devices_node:
                    device_name = self._get_device_name(device)
                    if device_name:
                        track_info.devices.append(device_name)
                        
                        # Check if it's a third-party plugin
                        if device_name not in self.NATIVE_DEVICES:
                            track_info.plugin_names.append(device_name)
            
            # Parse clips
            clip_slots = track_node.find(".//ClipSlotList")
            if clip_slots is not None:
                for clip_slot in clip_slots.findall(".//ClipSlot"):
                    clip = self._parse_clip(clip_slot)
                    if clip:
                        track_info.clips.append(clip)
            
            # Also check MainSequencer for arrangement view clips
            main_seq = track_node.find(".//DeviceChain/MainSequencer")
            if main_seq is not None:
                for clip in main_seq.findall(".//AudioClip") + main_seq.findall(".//MidiClip"):
                    clip_info = self._parse_clip_direct(clip)
                    if clip_info:
                        track_info.clips.append(clip_info)
            
            return track_info
            
        except Exception as e:
            logger.debug(f"Single track parse warning: {e}")
            return None
    
    def _get_device_name(self, device_node: ET.Element) -> Optional[str]:
        """Extract device name from device node."""
        try:
            # Try UserName first (custom name)
            user_name = device_node.find(".//UserName")
            if user_name is not None and user_name.attrib.get("Value"):
                return user_name.attrib["Value"]
            
            # Try PlugName for plugins
            plug_name = device_node.find(".//PlugName")
            if plug_name is not None and plug_name.attrib.get("Value"):
                return plug_name.attrib["Value"]
            
            # Fall back to tag name (device type)
            tag = device_node.tag
            # Clean up tag name
            tag = re.sub(r'Device$', '', tag)
            return tag if tag else None
            
        except Exception:
            return None
    
    def _parse_clip(self, clip_slot: ET.Element) -> Optional[Dict[str, Any]]:
        """Parse clip from clip slot."""
        try:
            clip = clip_slot.find(".//AudioClip") or clip_slot.find(".//MidiClip")
            if clip is None:
                return None
            
            return self._parse_clip_direct(clip)
            
        except Exception:
            return None
    
    def _parse_clip_direct(self, clip: ET.Element) -> Optional[Dict[str, Any]]:
        """Parse clip element directly."""
        try:
            name_node = clip.find(".//Name")
            if name_node is None:
                return None
            
            name = name_node.attrib.get("Value", "Unnamed")
            
            # Get loop info
            loop_start = clip.find(".//Loop/LoopStart")
            loop_end = clip.find(".//Loop/LoopEnd")
            
            start = float(loop_start.attrib.get("Value", 0)) if loop_start is not None else 0
            end = float(loop_end.attrib.get("Value", 0)) if loop_end is not None else 0
            
            return {
                "name": name,
                "type": "audio" if clip.tag == "AudioClip" else "midi",
                "length_beats": end - start,
            }
            
        except Exception:
            return None
    
    def _parse_samples(self, root: ET.Element, metadata: ProjectMetadata):
        """Extract sample file references."""
        try:
            # Find all sample references
            sample_refs = set()
            
            # Look for file references
            for file_ref in root.findall(".//FileRef"):
                path_node = file_ref.find(".//Path")
                if path_node is not None and "Value" in path_node.attrib:
                    sample_refs.add(path_node.attrib["Value"])
                
                name_node = file_ref.find(".//Name")
                if name_node is not None and "Value" in name_node.attrib:
                    sample_refs.add(name_node.attrib["Value"])
            
            # Also look for SampleRef elements
            for sample_ref in root.findall(".//SampleRef"):
                file_ref = sample_ref.find(".//FileRef")
                if file_ref is not None:
                    name = file_ref.find(".//Name")
                    if name is not None and "Value" in name.attrib:
                        sample_refs.add(name.attrib["Value"])
            
            metadata.sample_refs = sorted(sample_refs)
            
        except Exception as e:
            logger.debug(f"Sample parse warning: {e}")


# ============================================================================
# Directory Scanner
# ============================================================================

def scan_als_directory(
    project_dir: str,
    output_dir: Optional[str] = None,
    recursive: bool = True,
) -> Tuple[List[ProjectMetadata], Dict[str, int]]:
    """
    Scan directory for .als files and parse all of them.
    
    Args:
        project_dir: Directory to scan
        output_dir: Output directory for CSV files
        recursive: Whether to scan subdirectories
        
    Returns:
        Tuple of (list of metadata, statistics dict)
    """
    project_dir = Path(project_dir)
    
    if not project_dir.exists():
        logger.error(f"Directory not found: {project_dir}")
        return [], {}
    
    # Find all .als files
    if recursive:
        als_files = list(project_dir.rglob("*.als"))
    else:
        als_files = list(project_dir.glob("*.als"))
    
    if not als_files:
        logger.warning(f"No .als files found in {project_dir}")
        return [], {}
    
    logger.info(f"Found {len(als_files)} .als files to parse")
    
    parser = AbletonMetadataParser()
    all_metadata = []
    stats = {
        "total_files": len(als_files),
        "parsed_ok": 0,
        "parse_errors": 0,
        "total_tracks": 0,
        "total_clips": 0,
        "total_devices": 0,
    }
    
    for i, als_file in enumerate(als_files):
        logger.info(f"[{i+1}/{len(als_files)}] Parsing: {als_file.name}")
        
        metadata = parser.parse_als_file(str(als_file))
        
        if metadata:
            all_metadata.append(metadata)
            
            if not metadata.parse_errors:
                stats["parsed_ok"] += 1
            else:
                stats["parse_errors"] += 1
            
            stats["total_tracks"] += metadata.total_track_count
            stats["total_clips"] += metadata.clip_count
            stats["total_devices"] += metadata.device_count
    
    # Export to CSV if output directory specified
    if output_dir and all_metadata:
        export_to_csv(all_metadata, output_dir)
    
    return all_metadata, stats


def export_to_csv(metadata_list: List[ProjectMetadata], output_dir: str):
    """Export parsed metadata to CSV files."""
    try:
        import pandas as pd
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Main projects CSV
        projects_data = []
        for m in metadata_list:
            projects_data.append({
                "project_name": m.project_name,
                "project_path": m.project_path,
                "tempo": m.tempo,
                "time_signature": f"{m.time_signature_numerator}/{m.time_signature_denominator}",
                "audio_tracks": m.audio_track_count,
                "midi_tracks": m.midi_track_count,
                "return_tracks": m.return_track_count,
                "total_tracks": m.total_track_count,
                "clip_count": m.clip_count,
                "device_count": m.device_count,
                "plugin_count": m.plugin_count,
                "sample_count": m.sample_count,
                "file_size_mb": round(m.file_size_mb, 2),
                "ableton_version": m.ableton_version,
                "parse_errors": "; ".join(m.parse_errors) if m.parse_errors else None,
            })
        
        df_projects = pd.DataFrame(projects_data)
        projects_path = output_dir / "projects_als.csv"
        df_projects.to_csv(projects_path, index=False)
        logger.info(f"✅ Exported: {projects_path}")
        
        # Devices CSV (aggregated)
        all_devices = []
        for m in metadata_list:
            for device in m.all_devices:
                all_devices.append({
                    "project_name": m.project_name,
                    "device": device,
                    "is_plugin": device not in AbletonMetadataParser.NATIVE_DEVICES,
                })
        
        if all_devices:
            df_devices = pd.DataFrame(all_devices)
            devices_path = output_dir / "project_devices.csv"
            df_devices.to_csv(devices_path, index=False)
            logger.info(f"✅ Exported: {devices_path}")
            
            # Device usage statistics
            device_stats = df_devices.groupby("device").size().reset_index(name="usage_count")
            device_stats = device_stats.sort_values("usage_count", ascending=False)
            device_stats_path = output_dir / "device_usage_stats.csv"
            device_stats.to_csv(device_stats_path, index=False)
            logger.info(f"✅ Exported: {device_stats_path}")
        
        # Samples CSV
        all_samples = []
        for m in metadata_list:
            for sample in m.sample_refs:
                all_samples.append({
                    "project_name": m.project_name,
                    "sample_ref": sample,
                })
        
        if all_samples:
            df_samples = pd.DataFrame(all_samples)
            samples_path = output_dir / "project_samples.csv"
            df_samples.to_csv(samples_path, index=False)
            logger.info(f"✅ Exported: {samples_path}")
        
    except ImportError:
        logger.error("pandas not installed. Install: pip install pandas")
    except Exception as e:
        logger.error(f"CSV export failed: {e}")


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    """Run parser from command line."""
    parser = argparse.ArgumentParser(
        description="Sergik AI Ableton Metadata Parser",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Parse all projects in a directory
    python scripts/ableton_metadata_parser.py ~/Music/Ableton\\ Projects
    
    # Parse a single project file
    python scripts/ableton_metadata_parser.py --single ~/Music/Ableton\\ Projects/MySong/MySong.als
    
    # Specify output directory
    python scripts/ableton_metadata_parser.py ~/Music/Ableton\\ Projects -o ./data/catalog

Output files:
    projects_als.csv       - Main project metadata
    project_devices.csv    - Device/plugin usage per project
    device_usage_stats.csv - Aggregated device popularity
    project_samples.csv    - Sample references
        """
    )
    
    parser.add_argument(
        "path",
        help="Path to Ableton projects directory or single .als file"
    )
    parser.add_argument(
        "--single", "-s",
        action="store_true",
        help="Parse single .als file instead of directory"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=None,
        help="Output directory for CSV files (default: data/catalog)"
    )
    parser.add_argument(
        "--no-recursive", "-nr",
        action="store_true",
        help="Don't scan subdirectories"
    )
    parser.add_argument(
        "--json", "-j",
        action="store_true",
        help="Output JSON instead of CSV"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Determine output directory
    output_dir = args.output
    if output_dir is None:
        output_dir = str(PROJECT_ROOT / "data" / "catalog")
    
    print("=" * 60)
    print("🎹 SERGIK AI — Ableton Metadata Parser")
    print("=" * 60)
    
    if args.single:
        # Parse single file
        als_parser = AbletonMetadataParser()
        metadata = als_parser.parse_als_file(args.path)
        
        if metadata:
            print(f"\n📁 Project: {metadata.project_name}")
            print(f"   Tempo: {metadata.tempo or 'Unknown'} BPM")
            print(f"   Tracks: {metadata.total_track_count} ({metadata.audio_track_count} audio, {metadata.midi_track_count} MIDI)")
            print(f"   Clips: {metadata.clip_count}")
            print(f"   Devices: {metadata.device_count}")
            print(f"   Plugins: {metadata.plugin_count}")
            print(f"   Samples: {metadata.sample_count}")
            
            if metadata.all_plugins:
                print(f"\n   🎛️ Plugins used:")
                for plugin in metadata.all_plugins[:10]:
                    print(f"      - {plugin}")
                if len(metadata.all_plugins) > 10:
                    print(f"      ... and {len(metadata.all_plugins) - 10} more")
            
            if args.json:
                # Output as JSON
                output_path = Path(output_dir) / f"{metadata.project_name}_metadata.json"
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Convert to dict (simplified)
                data = {
                    "project_name": metadata.project_name,
                    "tempo": metadata.tempo,
                    "tracks": metadata.total_track_count,
                    "clips": metadata.clip_count,
                    "devices": metadata.all_devices,
                    "plugins": metadata.all_plugins,
                    "samples": metadata.sample_refs,
                }
                
                with open(output_path, "w") as f:
                    json.dump(data, f, indent=2)
                print(f"\n✅ Exported: {output_path}")
        else:
            print("❌ Failed to parse project")
            sys.exit(1)
    else:
        # Scan directory
        all_metadata, stats = scan_als_directory(
            args.path,
            output_dir=output_dir,
            recursive=not args.no_recursive,
        )
        
        print("\n" + "=" * 60)
        print("📊 PARSE STATISTICS")
        print("=" * 60)
        print(f"   Total .als files: {stats.get('total_files', 0)}")
        print(f"   Successfully parsed: {stats.get('parsed_ok', 0)}")
        print(f"   Parse errors: {stats.get('parse_errors', 0)}")
        print(f"   Total tracks: {stats.get('total_tracks', 0)}")
        print(f"   Total clips: {stats.get('total_clips', 0)}")
        print(f"   Total devices: {stats.get('total_devices', 0)}")
        print("=" * 60)
        
        if all_metadata:
            print(f"\n✅ Output written to: {output_dir}")
        else:
            print("\n⚠️ No projects were successfully parsed")
            sys.exit(1)


if __name__ == "__main__":
    main()

