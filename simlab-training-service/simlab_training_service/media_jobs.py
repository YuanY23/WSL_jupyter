from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select, update

from .models import MediaResource, MediaTranscodeJob, utcnow


class MediaJobLeaseLost(RuntimeError):
    pass


def claim_transcode_job(session_factory, worker_id: str, lease_seconds: int) -> str | None:
    now = utcnow()
    lease_until = now + timedelta(seconds=max(60, lease_seconds))
    with session_factory() as db:
        db.execute(
            update(MediaTranscodeJob)
            .where(
                MediaTranscodeJob.status == "running",
                MediaTranscodeJob.lease_expires_at < now,
            )
            .values(
                status="queued",
                worker_id=None,
                lease_expires_at=None,
                available_at=now,
                updated_at=now,
            )
        )
        job = db.execute(
            select(MediaTranscodeJob)
            .where(
                MediaTranscodeJob.status == "queued",
                MediaTranscodeJob.available_at <= now,
            )
            .order_by(MediaTranscodeJob.created_at.asc())
            .with_for_update(skip_locked=True)
            .limit(1)
        ).scalar_one_or_none()
        if job is None:
            db.commit()
            return None
        job.status = "running"
        job.worker_id = worker_id
        job.lease_expires_at = lease_until
        job.attempts += 1
        job.updated_at = now
        job_id = job.id
        db.commit()
        return job_id


def transcode_job_media_id(session_factory, job_id: str, worker_id: str) -> str | None:
    with session_factory() as db:
        job = db.get(MediaTranscodeJob, job_id)
        if not job or job.status != "running" or job.worker_id != worker_id:
            return None
        return job.media_id


def renew_transcode_job(session_factory, job_id: str, worker_id: str, lease_seconds: int) -> bool:
    now = utcnow()
    with session_factory() as db:
        result = db.execute(
            update(MediaTranscodeJob)
            .where(
                MediaTranscodeJob.id == job_id,
                MediaTranscodeJob.status == "running",
                MediaTranscodeJob.worker_id == worker_id,
            )
            .values(
                lease_expires_at=now + timedelta(seconds=max(60, lease_seconds)),
                updated_at=now,
            )
        )
        db.commit()
        return result.rowcount == 1


def complete_transcode_job(session_factory, job_id: str, worker_id: str) -> None:
    now = utcnow()
    with session_factory() as db:
        job = db.get(MediaTranscodeJob, job_id)
        if not job or job.status != "running" or job.worker_id != worker_id:
            return
        job.status = "completed"
        job.worker_id = None
        job.lease_expires_at = None
        job.last_error = None
        job.updated_at = now
        db.commit()


def fail_transcode_job(session_factory, job_id: str, worker_id: str, error: Exception) -> None:
    now = utcnow()
    detail = str(error)[-2000:] or error.__class__.__name__
    with session_factory() as db:
        job = db.get(MediaTranscodeJob, job_id)
        if not job or job.status != "running" or job.worker_id != worker_id:
            return
        media = db.get(MediaResource, job.media_id)
        retry = job.attempts < job.max_attempts and media is not None
        job.status = "queued" if retry else "failed"
        job.available_at = now + timedelta(seconds=min(300, 15 * (2 ** max(0, job.attempts - 1))))
        job.worker_id = None
        job.lease_expires_at = None
        job.last_error = detail
        job.updated_at = now
        if media:
            has_working_hls = bool(media.hls_playlist_object_key and media.hls_key_id)
            media.status = "ready" if has_working_hls else ("processing" if retry else "failed")
            media.processing_error = detail
            media.updated_at = now
        db.commit()
