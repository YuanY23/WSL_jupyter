from __future__ import annotations

import os
from dataclasses import dataclass, field


def env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_int(name: str, default: int) -> int:
    value = os.environ.get(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    database_url: str = os.environ.get(
        "SIMLAB_TRAINING_DATABASE_URL",
        "sqlite:///./simlab_training.db",
    )
    storage_dir: str = os.environ.get(
        "SIMLAB_TRAINING_STORAGE_DIR",
        "/srv/simlab/tutorials",
    )
    tutorial_admins: str = os.environ.get("SIMLAB_TUTORIAL_ADMINS", "yuan")
    jupyterhub_api_url: str = os.environ.get("JUPYTERHUB_API_URL", "")
    jupyterhub_api_token: str = os.environ.get("JUPYTERHUB_API_TOKEN", "")
    jupyterhub_service_prefix: str = os.environ.get(
        "JUPYTERHUB_SERVICE_PREFIX",
        "/services/simlab-training/",
    )
    media_encrypted_hls_enabled: bool = field(
        default_factory=lambda: env_bool("SIMLAB_MEDIA_ENCRYPTED_HLS_ENABLED", False)
    )
    media_legacy_content_enabled: bool = field(
        default_factory=lambda: env_bool("SIMLAB_MEDIA_LEGACY_CONTENT_ENABLED", True)
    )
    media_master_key: str = field(
        default_factory=lambda: os.environ.get("SIMLAB_MEDIA_MASTER_KEY", "")
    )
    media_playback_secret: str = field(
        default_factory=lambda: os.environ.get("SIMLAB_MEDIA_PLAYBACK_SECRET", "")
    )
    media_playback_ttl_seconds: int = field(
        default_factory=lambda: env_int("SIMLAB_MEDIA_PLAYBACK_TTL_SECONDS", 3600)
    )
    media_ffmpeg_binary: str = field(
        default_factory=lambda: os.environ.get("SIMLAB_MEDIA_FFMPEG_BINARY", "ffmpeg")
    )
    media_ffprobe_binary: str = field(
        default_factory=lambda: os.environ.get("SIMLAB_MEDIA_FFPROBE_BINARY", "ffprobe")
    )
    media_transcode_timeout_seconds: int = field(
        default_factory=lambda: env_int("SIMLAB_MEDIA_TRANSCODE_TIMEOUT_SECONDS", 43200)
    )
    media_worker_poll_seconds: int = field(
        default_factory=lambda: env_int("SIMLAB_MEDIA_WORKER_POLL_SECONDS", 5)
    )
    media_job_lease_seconds: int = field(
        default_factory=lambda: env_int("SIMLAB_MEDIA_JOB_LEASE_SECONDS", 300)
    )
    media_job_max_attempts: int = field(
        default_factory=lambda: env_int("SIMLAB_MEDIA_JOB_MAX_ATTEMPTS", 3)
    )

    @property
    def admin_users(self) -> set[str]:
        return {
            user.strip()
            for user in self.tutorial_admins.split(",")
            if user.strip()
        }
