from __future__ import annotations

import argparse

from sqlalchemy import or_, select

from .app import create_app
from .models import MediaResource, MediaTranscodeJob, utcnow


def main() -> None:
    parser = argparse.ArgumentParser(description="Queue media for encrypted adaptive HLS transcoding")
    parser.add_argument(
        "--upgrade-quality",
        action="store_true",
        help="also replace compatible legacy single-quality HLS with adaptive HLS",
    )
    args = parser.parse_args()
    app = create_app()
    settings = app.state.settings
    if not settings.media_encrypted_hls_enabled:
        raise SystemExit("Set SIMLAB_MEDIA_ENCRYPTED_HLS_ENABLED=true before running the media backfill")
    if not settings.media_master_key or not settings.media_playback_secret:
        raise SystemExit("Configure SIMLAB_MEDIA_MASTER_KEY and SIMLAB_MEDIA_PLAYBACK_SECRET first")

    predicate = MediaResource.hls_playlist_object_key.is_(None)
    if args.upgrade_quality:
        predicate = or_(
            predicate,
            MediaResource.hls_transcode_version.is_(None),
            MediaResource.hls_transcode_version < 2,
        )
    with app.state.session_factory() as db:
        media_ids = list(db.execute(
            select(MediaResource.id)
            .where(predicate)
            .order_by(MediaResource.created_at.asc())
        ).scalars())

    total = len(media_ids)
    print(f"Found {total} media resources to queue")
    queued = 0
    for media_id in media_ids:
        with app.state.session_factory() as db:
            media = db.get(MediaResource, media_id)
            if not media:
                continue
            if media.hls_playlist_object_key and not args.upgrade_quality:
                continue
            if media.hls_transcode_version is not None and media.hls_transcode_version >= 2:
                continue
            existing = db.execute(
                select(MediaTranscodeJob).where(MediaTranscodeJob.media_id == media_id)
            ).scalar_one_or_none()
            if existing:
                continue
            if not media.hls_playlist_object_key:
                media.status = "processing"
            media.processing_error = None
            media.updated_at = utcnow()
            db.add(MediaTranscodeJob(
                media_id=media_id,
                status="queued",
                max_attempts=max(1, settings.media_job_max_attempts),
                available_at=utcnow(),
                created_at=utcnow(),
                updated_at=utcnow(),
            ))
            db.commit()
            queued += 1
    print(f"Queued {queued} media resources; the media worker will process them")


if __name__ == "__main__":
    main()
