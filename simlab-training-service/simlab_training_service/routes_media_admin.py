from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import CurrentUser, require_admin
from .db import get_db
from .models import MediaResource, MediaTranscodeJob, new_media_id, utcnow


router = APIRouter(prefix="/api/admin/media")

VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm", ".mkv"}


class MediaPatch(BaseModel):
    title: str


@router.get("")
def list_media(db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    rows = db.execute(select(MediaResource).order_by(MediaResource.created_at.desc())).scalars().all()
    return [serialize_media(row) for row in rows]


@router.post("")
async def upload_media(
    request: Request,
    title: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(require_admin),
):
    filename = (file.filename or "").strip()
    mime_type = (file.content_type or "").strip()
    if not is_video_upload(filename, mime_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only video media files are supported",
        )

    media_id = new_media_id()
    stored = await run_in_threadpool(
        request.app.state.storage.save_media_stream,
        media_id,
        filename,
        file.file,
    )
    if not stored.size:
        request.app.state.storage.delete_object(stored.object_key)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded media file is empty")
    now = utcnow()
    media = MediaResource(
        id=media_id,
        title=media_title(title, filename),
        original_filename=filename,
        mime_type=mime_type or "application/octet-stream",
        file_size=stored.size,
        object_key=stored.object_key,
        file_sha256=stored.sha256,
        status="processing" if request.app.state.settings.media_encrypted_hls_enabled else "available",
        created_by=admin.username,
        created_at=now,
        updated_at=now,
    )
    db.add(media)
    if request.app.state.settings.media_encrypted_hls_enabled:
        db.add(MediaTranscodeJob(
            media=media,
            status="queued",
            max_attempts=max(1, request.app.state.settings.media_job_max_attempts),
            available_at=now,
            created_at=now,
            updated_at=now,
        ))
    db.commit()
    db.refresh(media)
    payload = serialize_media(media)
    return payload


@router.patch("/{media_id}")
def rename_media(
    media_id: str,
    payload: MediaPatch,
    db: Session = Depends(get_db),
    _admin: CurrentUser = Depends(require_admin),
):
    media = media_or_404(db, media_id)
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Media title is required")
    media.title = title
    media.updated_at = utcnow()
    db.commit()
    db.refresh(media)
    return serialize_media(media)


@router.delete("/{media_id}")
def delete_media(
    media_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _admin: CurrentUser = Depends(require_admin),
):
    media = media_or_404(db, media_id)
    request.app.state.storage.delete_media_artifacts(media.id, media.object_key)
    db.delete(media)
    db.commit()
    return {"ok": True}


def is_video_upload(filename: str, mime_type: str) -> bool:
    suffix = Path(filename).suffix.lower()
    return mime_type.startswith("video/") or suffix in VIDEO_EXTENSIONS


def media_title(title: str, filename: str) -> str:
    value = title.strip()
    if value:
        return value
    return Path(filename).stem.strip() or "未命名媒体资源"


def media_or_404(db: Session, media_id: str) -> MediaResource:
    media = db.get(MediaResource, media_id)
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media resource not found")
    return media


def serialize_media(media: MediaResource) -> dict:
    return {
        "id": media.id,
        "title": media.title,
        "original_filename": media.original_filename,
        "mime_type": media.mime_type,
        "file_size": media.file_size,
        "status": media.status,
        "hls_ready": bool(media.hls_playlist_object_key and media.hls_key_id),
        "hls_transcode_version": media.hls_transcode_version,
        "processing_error": media.processing_error,
        "created_by": media.created_by,
        "created_at": media.created_at.isoformat(),
        "updated_at": media.updated_at.isoformat(),
    }
