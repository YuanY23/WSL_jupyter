from datetime import timedelta

from simlab_training_service.db import Base, make_session_factory
from simlab_training_service.media_jobs import claim_transcode_job, fail_transcode_job
from simlab_training_service.models import MediaResource, MediaTranscodeJob, utcnow


def make_database():
    session_factory, engine = make_session_factory(
        "sqlite://",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    return session_factory


def add_media_and_job(session_factory, *, status="queued", attempts=0, max_attempts=3, lease=None):
    now = utcnow()
    with session_factory() as db:
        media = MediaResource(
            id="vid_jobtest",
            title="长视频",
            original_filename="long.mp4",
            mime_type="video/mp4",
            file_size=3_000_000_000,
            object_key="media/vid_jobtest/long.mp4",
            file_sha256="0" * 64,
            status="processing",
            created_by="yuan",
            created_at=now,
            updated_at=now,
        )
        job = MediaTranscodeJob(
            id="job-1",
            media=media,
            status=status,
            attempts=attempts,
            max_attempts=max_attempts,
            available_at=now - timedelta(seconds=1),
            lease_expires_at=lease,
            worker_id="dead-worker" if status == "running" else None,
            created_at=now,
            updated_at=now,
        )
        db.add_all([media, job])
        db.commit()


def test_expired_worker_lease_is_recovered_by_another_worker():
    session_factory = make_database()
    add_media_and_job(
        session_factory,
        status="running",
        attempts=1,
        lease=utcnow() - timedelta(minutes=1),
    )

    claimed = claim_transcode_job(session_factory, "replacement-worker", 300)

    assert claimed == "job-1"
    with session_factory() as db:
        job = db.get(MediaTranscodeJob, "job-1")
        assert job.status == "running"
        assert job.worker_id == "replacement-worker"
        assert job.attempts == 2


def test_failures_retry_then_finish_as_failed():
    session_factory = make_database()
    add_media_and_job(session_factory, max_attempts=2)

    job_id = claim_transcode_job(session_factory, "worker-1", 300)
    fail_transcode_job(session_factory, job_id, "worker-1", RuntimeError("first failure"))
    with session_factory() as db:
        job = db.get(MediaTranscodeJob, "job-1")
        job.available_at = utcnow() - timedelta(seconds=1)
        db.commit()

    job_id = claim_transcode_job(session_factory, "worker-2", 300)
    fail_transcode_job(session_factory, job_id, "worker-2", RuntimeError("final failure"))

    with session_factory() as db:
        job = db.get(MediaTranscodeJob, "job-1")
        media = db.get(MediaResource, "vid_jobtest")
        assert job.status == "failed"
        assert job.attempts == 2
        assert media.status == "failed"
        assert media.processing_error == "final failure"
