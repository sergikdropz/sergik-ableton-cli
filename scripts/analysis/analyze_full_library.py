#!/usr/bin/env python3
"""
Full Library Analysis: BPM, KEY, and File Info
Analyzes all tracks in iTunes library with comprehensive metadata
"""

import os
import csv
import json
import subprocess
import soundfile as sf
import numpy as np
from scipy import signal
from pathlib import Path
from collections import Counter, defaultdict
import warnings
warnings.filterwarnings('ignore')

MUSIC_DIRS = [
    "/Users/machd/Music/Music/Media.localized/Music",
    "/Users/machd/Music/Music 1/Media.localized/Music",
]

OUTPUT_DIR = "data/manifests"
AUDIO_EXTS = {".wav", ".mp3", ".aif", ".aiff", ".m4a", ".flac"}

# Key mapping from chroma index to musical key
KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
MODE_NAMES = ['minor', 'major']

def get_file_info(file_path):
    """Get file info using afinfo (macOS)"""
    try:
        result = subprocess.run(
            ['afinfo', file_path],
            capture_output=True, text=True, timeout=10
        )
        info = {
            'duration': 0,
            'sample_rate': 0,
            'bit_depth': 0,
            'channels': 0,
            'file_size_mb': round(os.path.getsize(file_path) / (1024*1024), 2)
        }

        for line in result.stdout.split('\n'):
            if 'estimated duration:' in line:
                try:
                    info['duration'] = round(float(line.split(':')[1].strip().split()[0]), 2)
                except:
                    pass
            elif 'Data format:' in line:
                # Parse "2 ch, 44100 Hz, ..."
                import re
                ch_match = re.search(r'(\d+)\s*ch', line)
                hz_match = re.search(r'(\d+)\s*Hz', line)
                bit_match = re.search(r'(\d+)-bit', line)
                if ch_match:
                    info['channels'] = int(ch_match.group(1))
                if hz_match:
                    info['sample_rate'] = int(hz_match.group(1))
                if bit_match:
                    info['bit_depth'] = int(bit_match.group(1))

        return info
    except Exception as e:
        return {
            'duration': 0,
            'sample_rate': 0,
            'bit_depth': 0,
            'channels': 0,
            'file_size_mb': round(os.path.getsize(file_path) / (1024*1024), 2) if os.path.exists(file_path) else 0
        }

def detect_bpm(y, sr):
    """Detect BPM using onset detection and autocorrelation"""
    try:
        # Compute onset strength envelope
        # Use a simple energy-based onset detection
        hop_length = 512
        frame_length = 2048

        # Frame the signal
        n_frames = 1 + (len(y) - frame_length) // hop_length
        frames = np.zeros((n_frames, frame_length))
        for i in range(n_frames):
            start = i * hop_length
            frames[i] = y[start:start + frame_length]

        # Compute RMS energy per frame
        energy = np.sqrt(np.mean(frames ** 2, axis=1))

        # Compute onset strength (difference in energy)
        onset_env = np.diff(energy, prepend=0)
        onset_env = np.maximum(0, onset_env)  # Half-wave rectification

        # Autocorrelation for tempo
        # Look for periodicities between 60-180 BPM
        min_lag = int(sr / hop_length * 60 / 180)  # 180 BPM
        max_lag = int(sr / hop_length * 60 / 60)   # 60 BPM

        if len(onset_env) < max_lag:
            return None

        # Autocorrelation
        autocorr = np.correlate(onset_env, onset_env, mode='full')
        autocorr = autocorr[len(autocorr)//2:]

        # Find peaks in valid range
        valid_autocorr = autocorr[min_lag:max_lag]
        if len(valid_autocorr) == 0:
            return None

        peak_lag = np.argmax(valid_autocorr) + min_lag

        # Convert lag to BPM
        bpm = 60 * sr / (hop_length * peak_lag)

        if 50 <= bpm <= 200:
            return round(bpm, 1)
        return None
    except:
        return None

def detect_key(y, sr):
    """Detect musical key using FFT-based chroma analysis"""
    try:
        # Use FFT to get frequency content
        n_fft = 4096
        hop = n_fft // 4

        # Compute STFT magnitude
        n_frames = 1 + (len(y) - n_fft) // hop
        if n_frames < 1:
            return None

        chroma = np.zeros((12, n_frames))

        for i in range(n_frames):
            start = i * hop
            frame = y[start:start + n_fft] * np.hanning(n_fft)
            spectrum = np.abs(np.fft.rfft(frame))
            freqs = np.fft.rfftfreq(n_fft, 1/sr)

            # Map frequencies to pitch classes
            for j, freq in enumerate(freqs):
                if freq > 20 and freq < 5000:
                    # Convert frequency to MIDI note, then to chroma
                    midi = 69 + 12 * np.log2(freq / 440)
                    pitch_class = int(round(midi)) % 12
                    chroma[pitch_class, i] += spectrum[j]

        # Average chroma across time
        chroma_avg = np.mean(chroma, axis=1)
        if np.sum(chroma_avg) == 0:
            return None
        chroma_avg = chroma_avg / np.max(chroma_avg)

        # Krumhansl-Schmuckler key profiles
        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

        # Normalize profiles
        major_profile = major_profile / np.max(major_profile)
        minor_profile = minor_profile / np.max(minor_profile)

        # Correlate with both profiles for each possible key
        max_corr = -1
        best_key = 0
        best_mode = 0

        for i in range(12):
            rolled_chroma = np.roll(chroma_avg, -i)
            major_corr = np.corrcoef(rolled_chroma, major_profile)[0, 1]
            minor_corr = np.corrcoef(rolled_chroma, minor_profile)[0, 1]

            if not np.isnan(major_corr) and major_corr > max_corr:
                max_corr = major_corr
                best_key = i
                best_mode = 1  # major
            if not np.isnan(minor_corr) and minor_corr > max_corr:
                max_corr = minor_corr
                best_key = i
                best_mode = 0  # minor

        return f"{KEY_NAMES[best_key]} {MODE_NAMES[best_mode]}"
    except:
        return None

def analyze_track(file_path):
    """Full analysis of a single track"""
    result = {
        'bpm': None,
        'key': None,
    }

    try:
        # Load audio using soundfile
        data, sr = sf.read(file_path)

        # Take first 30 seconds
        duration_samples = int(30 * sr)
        data = data[:duration_samples]

        # Convert to mono if stereo
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)

        # Resample to 22050 for consistent analysis
        if sr != 22050:
            # Simple decimation (rough but fast)
            factor = sr / 22050
            new_len = int(len(data) / factor)
            indices = np.linspace(0, len(data) - 1, new_len).astype(int)
            data = data[indices]
            sr = 22050

        if len(data) > 0:
            bpm = detect_bpm(data, sr)
            key = detect_key(data, sr)
            result['bpm'] = float(bpm) if bpm is not None else None
            result['key'] = key
    except Exception as e:
        pass

    return result

def main():
    print("=" * 60)
    print("FULL LIBRARY ANALYSIS: BPM, KEY, FILE INFO")
    print("=" * 60)

    # Collect all audio files
    all_files = []
    for music_dir in MUSIC_DIRS:
        if not os.path.exists(music_dir):
            continue
        for root, dirs, files in os.walk(music_dir):
            for file in files:
                if Path(file).suffix.lower() in AUDIO_EXTS:
                    full_path = os.path.join(root, file)
                    artist_folder = Path(root).relative_to(music_dir).parts[0] if len(Path(root).relative_to(music_dir).parts) > 0 else "Unknown"
                    all_files.append({
                        'path': full_path,
                        'filename': file,
                        'artist_folder': artist_folder
                    })

    print(f"Found {len(all_files)} audio files")

    # Analyze all tracks
    results = []
    bpm_values = []
    key_counts = Counter()

    for i, file_info in enumerate(all_files):
        file_path = file_info['path']
        filename = file_info['filename']

        if i % 50 == 0:
            print(f"  [{i+1}/{len(all_files)}] Processing...")

        # Get file info
        info = get_file_info(file_path)

        # Analyze audio (BPM + Key)
        analysis = analyze_track(file_path)

        if analysis['bpm']:
            bpm_values.append(analysis['bpm'])
        if analysis['key']:
            key_counts[analysis['key']] += 1

        # Combine all data
        track_data = {
            'filename': filename,
            'artist_folder': file_info['artist_folder'],
            'bpm': analysis['bpm'] or '',
            'key': analysis['key'] or '',
            'duration_sec': info['duration'],
            'sample_rate': info['sample_rate'],
            'bit_depth': info['bit_depth'],
            'channels': info['channels'],
            'file_size_mb': info['file_size_mb'],
            'format': Path(filename).suffix.lower()[1:],
            'path': file_path
        }
        results.append(track_data)

    print(f"\nAnalysis complete!")
    print(f"  Tracks with BPM: {len(bpm_values)}")
    print(f"  Tracks with Key: {sum(key_counts.values())}")

    # Save full database
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    db_csv = os.path.join(OUTPUT_DIR, "full_library_analysis.csv")
    with open(db_csv, "w", newline="") as f:
        fieldnames = ['filename', 'artist_folder', 'bpm', 'key', 'duration_sec',
                      'sample_rate', 'bit_depth', 'channels', 'file_size_mb', 'format', 'path']
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(results)
    print(f"\nSaved: {db_csv} ({len(results)} tracks)")

    # Print statistics
    if bpm_values:
        avg_bpm = sum(bpm_values) / len(bpm_values)

        # BPM buckets
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
            bar = "#" * int(pct / 2)
            print(f"  {bucket:10} {count:4} ({pct:5.1f}%) {bar}")

    if key_counts:
        print(f"\n{'=' * 60}")
        print("KEY DISTRIBUTION")
        print("=" * 60)
        for key, count in key_counts.most_common(15):
            pct = (count / sum(key_counts.values())) * 100
            bar = "#" * int(pct / 2)
            print(f"  {key:12} {count:4} ({pct:5.1f}%) {bar}")

    # Save summary JSON
    summary = {
        "total_tracks": len(results),
        "tracks_with_bpm": len(bpm_values),
        "tracks_with_key": sum(key_counts.values()),
        "avg_bpm": round(sum(bpm_values)/len(bpm_values), 1) if bpm_values else 0,
        "min_bpm": round(min(bpm_values), 1) if bpm_values else 0,
        "max_bpm": round(max(bpm_values), 1) if bpm_values else 0,
        "bpm_distribution": dict(buckets) if bpm_values else {},
        "key_distribution": dict(key_counts.most_common(15)),
    }

    summary_json = os.path.join(OUTPUT_DIR, "full_analysis_summary.json")
    with open(summary_json, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nSaved: {summary_json}")

if __name__ == "__main__":
    os.chdir("/Users/machd/sergik_custom_gpt")
    main()
