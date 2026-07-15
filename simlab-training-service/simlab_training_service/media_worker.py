from __future__ import annotations

import os
import signal
import socket
import time
import uuid

from .config import Settings
from .db import make_session_factory
from .media_jobs import (
    MediaJobLeaseLost,
    claim_transcode_job,
    complete_transcode_job,
    fail_transcode_job,
    renew_transcode_job,
    transcode_job_media_id,
)
from .media_processing import transcode_media_to_hls
from .media_security import require_secret
from .storage import TutorialStorage


def process_next_job(settings, session_factory, storage, worker_id: str) -> bool:
    job_id = claim_transcode_job(session_factory, worker_id, settings.media_job_lease_seconds)
    if not job_id:
        return False
    media_id = transcode_job_media_id(session_factory, job_id, worker_id)
    if not media_id:
        return True

    next_heartbeat = 0.0

    def heartbeat() -> None:
        nonlocal next_heartbeat
        current = time.monotonic()
        if current < next_heartbeat:
            return
        renewed = renew_transcode_job(
            session_factory,
            job_id,
            worker_id,
            settings.media_job_lease_seconds,
        )
        if not renewed:
            raise MediaJobLeaseLost("The transcode job lease was lost")
        next_heartbeat = current + max(10, settings.media_job_lease_seconds // 3)

    try:
        transcode_media_to_hls(
            session_factory,
            storage,
            settings,
            media_id,
            heartbeat=heartbeat,
        )
    except Exception as exc:
        fail_transcode_job(session_factory, job_id, worker_id, exc)
    else:
        complete_transcode_job(session_factory, job_id, worker_id)
    return True


def main() -> None:
    settings = Settings()
    if not settings.media_encrypted_hls_enabled:
        print("Encrypted HLS is disabled; the media worker is idle")
        while True:
            time.sleep(3600)
    require_secret(settings.media_master_key, "SIMLAB_MEDIA_MASTER_KEY")
    require_secret(settings.media_playback_secret, "SIMLAB_MEDIA_PLAYBACK_SECRET")
    session_factory, _engine = make_session_factory(settings.database_url)
    storage = TutorialStorage(settings.storage_dir)
    worker_id = f"{socket.gethostname()}-{os.getpid()}-{uuid.uuid4().hex[:8]}"
    stopping = False

    def stop(_signum, _frame) -> None:
        nonlocal stopping
        stopping = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    while not stopping:
        handled = process_next_job(settings, session_factory, storage, worker_id)
        if not handled:
            time.sleep(max(1, settings.media_worker_poll_seconds))


if __name__ == "__main__":
    main()
