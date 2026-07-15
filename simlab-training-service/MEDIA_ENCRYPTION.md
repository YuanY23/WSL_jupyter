# Encrypted adaptive HLS rollout

Encrypted playback remains disabled by default, so existing uploads and Blob playback continue to work until the feature flag is enabled.

## What is implemented

- Uploads are copied to storage in 1 MiB chunks instead of being loaded into application memory as one byte string.
- Encrypted uploads create a durable database job. A separate media worker claims jobs with a renewable lease, retries failures, and recovers work after a worker restart.
- FFmpeg creates aligned, AES-128-encrypted HLS variants at 480p, 720p, and 1080p without upscaling the source.
- A master playlist lets Shaka Player use adaptive bitrate selection. The Cell player also offers `自动`, `1080p`, `720p`, and `480p` choices when those variants exist.
- Existing Blob videos and the previous single-variant encrypted HLS layout remain playable.
- `media_resources.file_size` is a `BIGINT`, so uploads larger than 2 GiB can be recorded.

## Required secrets

Generate and store two different random secrets outside Git. Each value must contain at least 32 UTF-8 bytes.

- `SIMLAB_MEDIA_MASTER_KEY`: derives a different AES-128 content key for every media/key-id pair.
- `SIMLAB_MEDIA_PLAYBACK_SECRET`: signs short-lived, media-scoped playback tokens.

## Worker and long-video settings

- `SIMLAB_MEDIA_TRANSCODE_TIMEOUT_SECONDS` defaults to `43200` (12 hours) for each rendition. Set it to `0` to disable the hard FFmpeg deadline.
- `SIMLAB_MEDIA_JOB_LEASE_SECONDS` defaults to `300`. The active worker renews this lease while FFmpeg runs; an expired job can be reclaimed after a crash.
- `SIMLAB_MEDIA_JOB_MAX_ATTEMPTS` defaults to `3` with an increasing retry delay.
- `SIMLAB_MEDIA_WORKER_POLL_SECONDS` defaults to `5`.

The service and worker must mount the same media storage volume and use the same PostgreSQL database. Multi-quality output needs substantially more disk than the source; monitor free space for long videos.

## Rollout

1. Rebuild both training-service containers and let the service run `alembic upgrade head`.
2. Set both secrets, set `SIMLAB_MEDIA_ENCRYPTED_HLS_ENABLED=true`, and keep `SIMLAB_MEDIA_LEGACY_CONTENT_ENABLED=true` during migration.
3. Start `simlab-training-service` and `simlab-training-media-worker` from `docker-compose.training.yml`.
4. Queue original uploads that do not yet have HLS output with `python -m simlab_training_service.media_backfill` inside the service container. To explicitly upgrade previous single-quality HLS too, use `python -m simlab_training_service.media_backfill --upgrade-quality`.
5. Wait until media rows are `ready`, then verify both automatic and manual quality selection in a Notebook Cell.
6. Set `SIMLAB_MEDIA_LEGACY_CONTENT_ENABLED=false` only after all required originals have encrypted HLS output.

Already encrypted single-quality videos stay compatible and are not replaced by the default backfill. The explicit `--upgrade-quality` mode keeps their current HLS active while the adaptive replacement is encoded, switches the database pointer only after all variants are ready, and retains the legacy assets so an already-open playback session can finish.

If encrypted playback needs to be rolled back, set `SIMLAB_MEDIA_ENCRYPTED_HLS_ENABLED=false` while legacy content is still enabled. Existing media IDs and Notebook directives do not change.
