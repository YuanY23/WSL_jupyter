from __future__ import annotations

import json
import secrets
import shutil
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from .media_security import derive_content_key
from .models import MediaResource, utcnow


class MediaProcessingError(RuntimeError):
    pass


@dataclass(frozen=True)
class VideoGeometry:
    width: int
    height: int


@dataclass(frozen=True)
class Rendition:
    name: str
    width: int
    height: int
    video_bitrate: int
    max_rate: int
    buffer_size: int


RENDITION_PROFILES = (
    (480, 1_200_000, 1_350_000, 2_400_000),
    (720, 2_500_000, 2_800_000, 5_000_000),
    (1080, 5_000_000, 5_500_000, 10_000_000),
)


def process_media_to_hls(app, media_id: str, heartbeat: Callable[[], None] | None = None) -> None:
    """Compatibility entry point used by maintenance commands and tests."""
    transcode_media_to_hls(
        app.state.session_factory,
        app.state.storage,
        app.state.settings,
        media_id,
        heartbeat=heartbeat,
    )


def transcode_media_to_hls(
    session_factory,
    storage,
    settings,
    media_id: str,
    *,
    heartbeat: Callable[[], None] | None = None,
) -> None:
    heartbeat = heartbeat or (lambda: None)
    with session_factory() as db:
        media = db.get(MediaResource, media_id)
        if not media or not media_is_transcodable(media):
            return
        source_path = storage.path_for_object(media.object_key)

    work_dir: Path | None = None
    try:
        if not source_path.is_file():
            raise MediaProcessingError("Original media file is missing")
        if not shutil.which(settings.media_ffmpeg_binary):
            raise MediaProcessingError(f"FFmpeg binary was not found: {settings.media_ffmpeg_binary}")
        if not shutil.which(settings.media_ffprobe_binary):
            raise MediaProcessingError(f"FFprobe binary was not found: {settings.media_ffprobe_binary}")

        geometry = probe_video(settings.media_ffprobe_binary, source_path)
        renditions = build_renditions(geometry)
        key_id = secrets.token_hex(16)
        iv = secrets.token_hex(16)
        content_key = derive_content_key(settings.media_master_key, media_id, key_id)
        work_dir = storage.create_media_processing_dir(media_id)
        key_path = work_dir / ".content.key"
        key_info_path = work_dir / ".keyinfo"
        key_path.write_bytes(content_key)
        key_path.chmod(0o600)
        key_info_path.write_text(f"../key/{key_id}\n{key_path}\n{iv}\n", encoding="utf-8")
        key_info_path.chmod(0o600)

        for rendition in renditions:
            variant_dir = work_dir / rendition.name
            variant_dir.mkdir(parents=True, exist_ok=True)
            playlist_path = variant_dir / "index.m3u8"
            command = build_ffmpeg_command(
                settings.media_ffmpeg_binary,
                source_path,
                rendition,
                key_info_path,
                playlist_path,
            )
            run_ffmpeg(
                command,
                work_dir / f"ffmpeg-{rendition.name}.log",
                timeout_seconds=settings.media_transcode_timeout_seconds,
                heartbeat=heartbeat,
            )
            if not playlist_path.is_file() or not list(variant_dir.glob("segment_*.ts")):
                raise MediaProcessingError(f"FFmpeg did not produce the {rendition.name} HLS variant")

        (work_dir / "master.m3u8").write_text(build_master_playlist(renditions), encoding="utf-8")
        key_path.unlink(missing_ok=True)
        key_info_path.unlink(missing_ok=True)
        for log_path in work_dir.glob("ffmpeg-*.log"):
            log_path.unlink(missing_ok=True)

        with session_factory() as db:
            media = db.get(MediaResource, media_id)
            if not media or not media_is_transcodable(media):
                shutil.rmtree(work_dir, ignore_errors=True)
                return
            playlist_object_key = storage.promote_hls_dir(media_id, work_dir)
            work_dir = None
            media.hls_playlist_object_key = playlist_object_key
            media.hls_key_id = key_id
            media.hls_iv = iv
            media.hls_transcode_version = 2
            media.processing_error = None
            media.status = "ready"
            media.updated_at = utcnow()
            db.commit()
    except Exception:
        if work_dir is not None:
            shutil.rmtree(work_dir, ignore_errors=True)
        raise


def media_is_transcodable(media: MediaResource) -> bool:
    return media.status == "processing" or bool(
        media.status == "ready" and media.hls_playlist_object_key
    )


def probe_video(ffprobe_binary: str, source_path: Path) -> VideoGeometry:
    try:
        completed = subprocess.run(
            [
                ffprobe_binary,
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=width,height",
                "-of",
                "json",
                str(source_path),
            ],
            capture_output=True,
            check=False,
            text=True,
            timeout=60,
        )
    except subprocess.TimeoutExpired as exc:
        raise MediaProcessingError("FFprobe timed out while reading the video") from exc
    if completed.returncode != 0:
        detail = completed.stderr.strip()[-2000:] or "FFprobe could not read the video"
        raise MediaProcessingError(detail)
    try:
        stream = json.loads(completed.stdout)["streams"][0]
        geometry = VideoGeometry(width=int(stream["width"]), height=int(stream["height"]))
    except (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise MediaProcessingError("Video dimensions could not be detected") from exc
    if geometry.width < 2 or geometry.height < 2:
        raise MediaProcessingError("Video dimensions are invalid")
    return geometry


def build_renditions(geometry: VideoGeometry) -> list[Rendition]:
    profiles = [profile for profile in RENDITION_PROFILES if profile[0] <= geometry.height]
    if not profiles:
        source_height = geometry.height - (geometry.height % 2)
        profiles = [(source_height, 800_000, 900_000, 1_600_000)]

    renditions: list[Rendition] = []
    for height, bitrate, max_rate, buffer_size in profiles:
        scaled_width = round((geometry.width * height / geometry.height) / 2) * 2
        renditions.append(Rendition(
            name=f"{height}p",
            width=max(2, scaled_width),
            height=height,
            video_bitrate=bitrate,
            max_rate=max_rate,
            buffer_size=buffer_size,
        ))
    return renditions


def build_ffmpeg_command(
    ffmpeg_binary: str,
    source_path: Path,
    rendition: Rendition,
    key_info_path: Path,
    playlist_path: Path,
) -> list[str]:
    return [
        ffmpeg_binary,
        "-hide_banner",
        "-loglevel",
        "warning",
        "-y",
        "-i",
        str(source_path),
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        "-vf",
        f"scale={rendition.width}:{rendition.height}",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-b:v",
        str(rendition.video_bitrate),
        "-maxrate",
        str(rendition.max_rate),
        "-bufsize",
        str(rendition.buffer_size),
        "-sc_threshold",
        "0",
        "-force_key_frames",
        "expr:gte(t,n_forced*6)",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-sn",
        "-f",
        "hls",
        "-hls_time",
        "6",
        "-hls_playlist_type",
        "vod",
        "-hls_flags",
        "independent_segments",
        "-hls_key_info_file",
        str(key_info_path),
        "-hls_segment_filename",
        str(playlist_path.parent / "segment_%05d.ts"),
        str(playlist_path),
    ]


def run_ffmpeg(
    command: list[str],
    log_path: Path,
    *,
    timeout_seconds: int,
    heartbeat: Callable[[], None],
) -> None:
    started = time.monotonic()
    with log_path.open("w+", encoding="utf-8") as log:
        process = subprocess.Popen(
            command,
            stdout=subprocess.DEVNULL,
            stderr=log,
            text=True,
        )
        try:
            while True:
                return_code = process.poll()
                if return_code is not None:
                    break
                if timeout_seconds > 0 and time.monotonic() - started > max(60, timeout_seconds):
                    raise MediaProcessingError(
                        f"FFmpeg exceeded the configured {timeout_seconds}-second timeout"
                    )
                heartbeat()
                time.sleep(5)
        except Exception:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
            raise

        if return_code != 0:
            log.flush()
            log.seek(0)
            detail = log.read()[-2000:].strip() or f"FFmpeg exited with {return_code}"
            raise MediaProcessingError(detail)


def build_master_playlist(renditions: list[Rendition]) -> str:
    lines = ["#EXTM3U", "#EXT-X-VERSION:3", "#EXT-X-INDEPENDENT-SEGMENTS"]
    for rendition in renditions:
        bandwidth = rendition.max_rate + 128_000
        lines.extend([
            f'#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={rendition.width}x{rendition.height}',
            f"{rendition.name}/index.m3u8",
        ])
    return "\n".join(lines) + "\n"
