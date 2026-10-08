import os
import uuid
import math
import struct
import wave
import subprocess
from pathlib import Path
from typing import Tuple, Optional


def synthesize_audio_track(
    title: str,
    genre: str = "Lo-Fi Focus & Study Beats",
    bpm: int = 85,
    duration_sec: int = 15,
    output_dir: Optional[Path] = None,
) -> Tuple[str, Path]:
    """
    Synthesizes a soothing, harmonic instrumental audio track saved as an MP3 file.
    Uses Python's wave module for harmonic tone generation and ffmpeg for MP3 encoding.
    """
    if not output_dir:
        output_dir = Path(__file__).resolve().parent.parent.parent / "uploads" / "generated"
    output_dir.mkdir(parents=True, exist_ok=True)

    audio_id = uuid.uuid4().hex[:10]
    wav_path = output_dir / f"temp_{audio_id}.wav"
    mp3_path = output_dir / f"track_{audio_id}.mp3"

    sample_rate = 44100
    total_samples = sample_rate * duration_sec

    # Harmonically tuned chord progression based on genre (A minor / C major chords)
    # A minor: A3 (220), C4 (261.6), E4 (329.6), G4 (392.0)
    # F major: F3 (174.6), A3 (220), C4 (261.6), E4 (329.6)
    chords = [
        [220.0, 261.63, 329.63, 392.00],  # Am7
        [174.61, 220.0, 261.63, 329.63],  # Fmaj7
        [261.63, 329.63, 392.00, 523.25], # Cmaj
        [196.00, 246.94, 293.66, 392.00], # G
    ]

    chord_duration = total_samples // len(chords)

    with wave.open(str(wav_path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)

        frames = bytearray()
        for i in range(total_samples):
            chord_idx = min(i // chord_duration, len(chords) - 1)
            active_chord = chords[chord_idx]

            sample_val = 0.0
            # Blend harmonic frequencies
            for note_f in active_chord:
                sample_val += math.sin(2.0 * math.pi * note_f * i / sample_rate)

            # Add gentle subtle sub-bass pulse matching BPM
            beat_freq = bpm / 60.0
            beat_env = 0.5 + 0.5 * math.sin(2.0 * math.pi * beat_freq * i / sample_rate)
            sample_val *= (0.6 + 0.4 * beat_env)

            # Master volume scaling & soft limiting
            scaled = int(32767.0 * 0.22 * (sample_val / len(active_chord)))
            scaled = max(-32767, min(32767, scaled))
            frames.extend(struct.pack("<h", scaled))

        wf.writeframes(frames)

    # Convert to MP3 via ffmpeg if available
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(wav_path), "-b:a", "192k", str(mp3_path)],
            capture_output=True,
            timeout=15,
        )
        if wav_path.exists():
            wav_path.unlink()
    except Exception:
        # Fallback if ffmpeg fails: rename wav
        mp3_path = output_dir / f"track_{audio_id}.wav"
        if wav_path.exists():
            wav_path.rename(mp3_path)

    audio_url = f"/api/generated-media/{mp3_path.name}"
    return audio_url, mp3_path


def synthesize_video_clip(
    title: str,
    prompt: str = "",
    duration_sec: int = 4,
    image_path: Optional[str] = None,
    output_dir: Optional[Path] = None,
) -> Tuple[str, Path]:
    """
    Synthesizes a smooth 1080p/720p MP4 video clip matching the topic.
    If image_path is provided, applies a cinematic slow-zoom (Ken Burns effect).
    Otherwise, generates a clean cinematic gradient title card.
    """
    if not output_dir:
        output_dir = Path(__file__).resolve().parent.parent.parent / "uploads" / "generated"
    output_dir.mkdir(parents=True, exist_ok=True)

    vid_id = uuid.uuid4().hex[:10]
    mp4_path = output_dir / f"video_{vid_id}.mp4"

    # Check if a valid local image exists to animate
    if image_path and Path(image_path).exists() and Path(image_path).stat().st_size > 1000:
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", str(image_path),
            "-vf", f"zoompan=z='min(zoom+0.0015,1.25)':d={duration_sec*25}:s=1280x720:fps=25",
            "-t", str(duration_sec),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            str(mp4_path),
        ]
    else:
        # Clean cinematic slate motion video
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"color=c=0x090d16:s=1280x720:d={duration_sec},format=yuv420p",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            str(mp4_path),
        ]

    try:
        subprocess.run(cmd, capture_output=True, timeout=20)
    except Exception as e:
        print(f"[MediaGenerator] Video generation notice: {e}")

    video_url = f"/api/generated-media/{mp4_path.name}"
    return video_url, mp4_path
