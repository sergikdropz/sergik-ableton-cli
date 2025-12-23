#!/usr/bin/env python3
"""
Rekordbox-Style Track Analyzer
Analyzes tracks like DJ software: BPM, Key (Camelot), Energy, Phrases
"""

import os
import csv
import json
import subprocess
import soundfile as sf
import numpy as np
from scipy import signal
from scipy.ndimage import uniform_filter1d
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

# Camelot Wheel mapping (Key -> Camelot notation)
CAMELOT_WHEEL = {
    'C major': '8B', 'A minor': '8A',
    'G major': '9B', 'E minor': '9A',
    'D major': '10B', 'B minor': '10A',
    'A major': '11B', 'F# minor': '11A',
    'E major': '12B', 'C# minor': '12A',
    'B major': '1B', 'G# minor': '1A',
    'F# major': '2B', 'D# minor': '2A',
    'C# major': '3B', 'A# minor': '3A',
    'G# major': '4B', 'F minor': '4A',
    'D# major': '5B', 'C minor': '5A',
    'A# major': '6B', 'G minor': '6A',
    'F major': '7B', 'D minor': '7A',
}

KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def get_file_info(file_path):
    """Get file metadata using afinfo"""
    try:
        result = subprocess.run(['afinfo', file_path], capture_output=True, text=True, timeout=10)
        info = {
            'duration': 0.0,
            'sample_rate': 0,
            'bit_depth': 0,
            'channels': 0,
            'file_size_mb': round(os.path.getsize(file_path) / (1024*1024), 2)
        }
        import re
        for line in result.stdout.split('\n'):
            if 'estimated duration:' in line:
                try:
                    info['duration'] = round(float(line.split(':')[1].strip().split()[0]), 2)
                except:
                    pass
            elif 'Data format:' in line:
                ch_match = re.search(r'(\d+)\s*ch', line)
                hz_match = re.search(r'(\d+)\s*Hz', line)
                bit_match = re.search(r'(\d+)-bit', line)
                if ch_match: info['channels'] = int(ch_match.group(1))
                if hz_match: info['sample_rate'] = int(hz_match.group(1))
                if bit_match: info['bit_depth'] = int(bit_match.group(1))
        return info
    except:
        return {'duration': 0, 'sample_rate': 0, 'bit_depth': 0, 'channels': 0,
                'file_size_mb': round(os.path.getsize(file_path) / (1024*1024), 2) if os.path.exists(file_path) else 0}


def load_audio(file_path, duration=60, target_sr=22050):
    """Load and preprocess audio file"""
    try:
        data, sr = sf.read(file_path)

        # Limit duration
        max_samples = int(duration * sr)
        data = data[:max_samples]

        # Convert to mono
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)

        # Resample if needed
        if sr != target_sr:
            factor = len(data) * target_sr // sr
            data = signal.resample(data, factor)
            sr = target_sr

        return data.astype(np.float32), sr
    except:
        return None, None


def detect_bpm(y, sr):
    """Detect BPM using autocorrelation with multiple checks"""
    try:
        # Onset detection using spectral flux
        hop = 512
        n_fft = 2048

        # Compute spectrogram
        f, t, Sxx = signal.spectrogram(y, sr, nperseg=n_fft, noverlap=n_fft-hop)

        # Spectral flux (onset strength)
        flux = np.sum(np.maximum(0, np.diff(Sxx, axis=1)), axis=0)
        flux = uniform_filter1d(flux, size=3)

        # Autocorrelation
        # BPM range: 70-180
        min_lag = int(sr / hop * 60 / 180)
        max_lag = int(sr / hop * 60 / 70)

        if len(flux) < max_lag:
            return None

        autocorr = np.correlate(flux, flux, mode='full')
        autocorr = autocorr[len(autocorr)//2:]

        # Find peaks in valid range
        valid = autocorr[min_lag:max_lag]
        if len(valid) == 0:
            return None

        # Find top 3 peaks
        peaks = []
        for i in range(3):
            peak_idx = np.argmax(valid)
            peak_lag = peak_idx + min_lag
            bpm = 60 * sr / (hop * peak_lag)
            peaks.append((bpm, valid[peak_idx]))
            # Zero out this peak region for next iteration
            start = max(0, peak_idx - 5)
            end = min(len(valid), peak_idx + 5)
            valid[start:end] = 0

        # Choose most likely BPM (prefer common ranges)
        best_bpm = peaks[0][0]

        # Common BPM ranges for electronic music
        common_ranges = [(118, 132), (85, 95), (140, 150), (170, 180)]

        for bpm, strength in peaks:
            for low, high in common_ranges:
                if low <= bpm <= high:
                    best_bpm = bpm
                    break

        # Handle half/double time
        if best_bpm > 160:
            best_bpm /= 2
        elif best_bpm < 75:
            best_bpm *= 2

        return round(best_bpm, 1)
    except:
        return None


def detect_key(y, sr):
    """Detect musical key using chroma analysis"""
    try:
        n_fft = 4096
        hop = n_fft // 4

        # Compute STFT
        f, t, Zxx = signal.stft(y, sr, nperseg=n_fft, noverlap=n_fft-hop)
        magnitude = np.abs(Zxx)

        # Build chroma from frequency bins
        chroma = np.zeros((12, magnitude.shape[1]))
        freqs = f

        for i, freq in enumerate(freqs):
            if 65 < freq < 2000:  # Focus on musical range
                midi = 69 + 12 * np.log2(freq / 440)
                pitch_class = int(round(midi)) % 12
                chroma[pitch_class] += magnitude[i]

        # Average across time
        chroma_avg = np.mean(chroma, axis=1)
        if np.sum(chroma_avg) == 0:
            return None, None
        chroma_avg = chroma_avg / np.sum(chroma_avg)

        # Krumhansl-Schmuckler key profiles
        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

        major_profile = major_profile / np.sum(major_profile)
        minor_profile = minor_profile / np.sum(minor_profile)

        best_corr = -1
        best_key = 0
        best_mode = 'major'

        for i in range(12):
            rolled = np.roll(chroma_avg, -i)

            maj_corr = np.corrcoef(rolled, major_profile)[0, 1]
            min_corr = np.corrcoef(rolled, minor_profile)[0, 1]

            if not np.isnan(maj_corr) and maj_corr > best_corr:
                best_corr = maj_corr
                best_key = i
                best_mode = 'major'
            if not np.isnan(min_corr) and min_corr > best_corr:
                best_corr = min_corr
                best_key = i
                best_mode = 'minor'

        key_name = f"{KEY_NAMES[best_key]} {best_mode}"
        camelot = CAMELOT_WHEEL.get(key_name, "")

        return key_name, camelot
    except:
        return None, None


def detect_energy(y, sr):
    """Calculate energy level 1-10 (like Rekordbox)"""
    try:
        # RMS energy
        rms = np.sqrt(np.mean(y**2))

        # Spectral centroid (brightness)
        n_fft = 2048
        hop = 512
        f, t, Sxx = signal.spectrogram(y, sr, nperseg=n_fft, noverlap=n_fft-hop)
        centroid = np.sum(f[:, np.newaxis] * Sxx, axis=0) / (np.sum(Sxx, axis=0) + 1e-8)
        avg_centroid = np.mean(centroid)

        # High frequency energy ratio
        high_freq_idx = np.where(f > 4000)[0]
        if len(high_freq_idx) > 0:
            high_energy = np.mean(Sxx[high_freq_idx, :])
            total_energy = np.mean(Sxx) + 1e-8
            hf_ratio = high_energy / total_energy
        else:
            hf_ratio = 0

        # Combine factors
        rms_score = min(rms * 10, 1.0)  # Normalize
        brightness_score = min(avg_centroid / 3000, 1.0)
        hf_score = min(hf_ratio * 5, 1.0)

        # Weighted combination
        energy = (rms_score * 0.5 + brightness_score * 0.3 + hf_score * 0.2) * 10

        return max(1, min(10, round(energy)))
    except:
        return 5


def detect_phrases(y, sr):
    """Detect phrase structure (Intro, Verse, Chorus, Drop, Outro)"""
    try:
        # Segment the track into 8-bar sections (assuming 4/4 at ~120 BPM)
        # Each bar ~ 2 seconds at 120 BPM
        segment_len = int(16 * sr)  # ~16 seconds per segment
        n_segments = len(y) // segment_len

        if n_segments < 3:
            return "Unknown"

        # Analyze energy of each segment
        segment_energies = []
        for i in range(n_segments):
            start = i * segment_len
            end = start + segment_len
            segment = y[start:end]
            energy = np.sqrt(np.mean(segment**2))
            segment_energies.append(energy)

        if not segment_energies:
            return "Unknown"

        # Normalize
        max_energy = max(segment_energies)
        if max_energy > 0:
            segment_energies = [e / max_energy for e in segment_energies]

        # Simple phrase detection
        phrases = []
        for i, energy in enumerate(segment_energies):
            if i == 0 and energy < 0.5:
                phrases.append("Intro")
            elif i == len(segment_energies) - 1 and energy < 0.5:
                phrases.append("Outro")
            elif energy > 0.8:
                phrases.append("Drop")
            elif energy > 0.5:
                phrases.append("Chorus")
            else:
                phrases.append("Verse")

        # Return simplified structure
        unique_phrases = []
        for p in phrases:
            if not unique_phrases or unique_phrases[-1] != p:
                unique_phrases.append(p)

        return " -> ".join(unique_phrases[:6])  # Limit length
    except:
        return "Unknown"


def analyze_track(file_path):
    """Full Rekordbox-style analysis"""
    result = {
        'bpm': None,
        'key': None,
        'camelot': None,
        'energy': None,
        'phrases': None,
    }

    y, sr = load_audio(file_path, duration=60)
    if y is None:
        return result

    result['bpm'] = detect_bpm(y, sr)
    key, camelot = detect_key(y, sr)
    result['key'] = key
    result['camelot'] = camelot
    result['energy'] = detect_energy(y, sr)
    result['phrases'] = detect_phrases(y, sr)

    return result


def main():
    print("=" * 60)
    print("REKORDBOX-STYLE TRACK ANALYZER")
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
                    parts = Path(root).parts
                    # Find artist folder
                    try:
                        music_idx = parts.index('Music')
                        artist = parts[music_idx + 1] if len(parts) > music_idx + 1 else 'Unknown'
                    except:
                        artist = 'Unknown'

                    all_files.append({
                        'path': full_path,
                        'filename': file,
                        'artist': artist
                    })

    print(f"Found {len(all_files)} audio files")
    print("Analyzing tracks (this may take a while)...\n")

    results = []
    bpm_values = []
    key_counts = Counter()
    energy_counts = Counter()

    for i, file_info in enumerate(all_files):
        if i % 25 == 0:
            print(f"  [{i+1}/{len(all_files)}] Processing...")

        # File info
        info = get_file_info(file_info['path'])

        # Audio analysis
        analysis = analyze_track(file_info['path'])

        if analysis['bpm']:
            bpm_values.append(analysis['bpm'])
        if analysis['key']:
            key_counts[analysis['camelot'] or analysis['key']] += 1
        if analysis['energy']:
            energy_counts[analysis['energy']] += 1

        track = {
            'filename': file_info['filename'],
            'artist': file_info['artist'],
            'bpm': analysis['bpm'] or '',
            'key': analysis['key'] or '',
            'camelot': analysis['camelot'] or '',
            'energy': analysis['energy'] or '',
            'phrases': analysis['phrases'] or '',
            'duration_sec': info['duration'],
            'sample_rate': info['sample_rate'],
            'bit_depth': info['bit_depth'],
            'channels': info['channels'],
            'file_size_mb': info['file_size_mb'],
            'format': Path(file_info['filename']).suffix.lower()[1:],
            'path': file_info['path']
        }
        results.append(track)

    # Save database
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    db_csv = os.path.join(OUTPUT_DIR, "rekordbox_analysis.csv")
    fieldnames = ['filename', 'artist', 'bpm', 'key', 'camelot', 'energy', 'phrases',
                  'duration_sec', 'sample_rate', 'bit_depth', 'channels', 'file_size_mb', 'format', 'path']

    with open(db_csv, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(results)
    print(f"\nSaved: {db_csv}")

    # Print statistics
    print(f"\n{'=' * 60}")
    print("ANALYSIS SUMMARY")
    print("=" * 60)
    print(f"Total tracks: {len(results)}")
    print(f"Tracks with BPM: {len(bpm_values)}")
    print(f"Tracks with Key: {sum(key_counts.values())}")

    if bpm_values:
        print(f"\n--- BPM ---")
        print(f"Average: {sum(bpm_values)/len(bpm_values):.1f}")
        print(f"Range: {min(bpm_values):.1f} - {max(bpm_values):.1f}")

        # BPM buckets
        buckets = defaultdict(int)
        for b in bpm_values:
            if b < 90: buckets["< 90"] += 1
            elif b < 100: buckets["90-99"] += 1
            elif b < 110: buckets["100-109"] += 1
            elif b < 120: buckets["110-119"] += 1
            elif b < 130: buckets["120-129"] += 1
            elif b < 140: buckets["130-139"] += 1
            else: buckets["140+"] += 1

        print("\nBPM Distribution:")
        for bucket in ["< 90", "90-99", "100-109", "110-119", "120-129", "130-139", "140+"]:
            count = buckets[bucket]
            pct = (count / len(bpm_values)) * 100
            bar = "#" * int(pct / 2)
            print(f"  {bucket:10} {count:4} ({pct:5.1f}%) {bar}")

    if key_counts:
        print(f"\n--- KEY (Camelot) ---")
        for key, count in key_counts.most_common(12):
            pct = (count / sum(key_counts.values())) * 100
            print(f"  {key:8} {count:4} ({pct:5.1f}%)")

    if energy_counts:
        print(f"\n--- ENERGY LEVELS ---")
        for level in range(1, 11):
            count = energy_counts.get(level, 0)
            pct = (count / len(results)) * 100 if results else 0
            bar = "#" * int(pct / 2)
            print(f"  Level {level:2}: {count:4} ({pct:5.1f}%) {bar}")

    # Save summary
    summary = {
        "total_tracks": len(results),
        "tracks_with_bpm": len(bpm_values),
        "avg_bpm": round(sum(bpm_values)/len(bpm_values), 1) if bpm_values else 0,
        "bpm_range": [round(min(bpm_values), 1), round(max(bpm_values), 1)] if bpm_values else [0, 0],
        "bpm_distribution": dict(buckets) if bpm_values else {},
        "key_distribution": dict(key_counts.most_common(12)),
        "energy_distribution": {str(k): v for k, v in sorted(energy_counts.items())},
    }

    summary_json = os.path.join(OUTPUT_DIR, "rekordbox_summary.json")
    with open(summary_json, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nSaved: {summary_json}")


if __name__ == "__main__":
    os.chdir("/Users/machd/sergik_custom_gpt")
    main()
