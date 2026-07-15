from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from .auth import CurrentUser, get_current_user
from .db import get_db
from .media_security import (
    MediaSecurityError,
    derive_content_key,
    issue_playback_token,
    verify_playback_token,
)
from .models import MediaResource


router = APIRouter(prefix="/api/media")


@router.get("/{media_id}/content")
def get_media_content(
    media_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _user: CurrentUser = Depends(get_current_user),
):
    if not request.app.state.settings.media_legacy_content_enabled:
        raise HTTPException(status_code=404, detail="Legacy media content is disabled")
    media = db.get(MediaResource, media_id)
    if not media or media.status not in {"available", "processing", "ready", "failed"}:
        raise HTTPException(status_code=404, detail="Media resource not found")

    try:
        path = request.app.state.storage.path_for_object(media.object_key)
    except ValueError:
        raise HTTPException(status_code=404, detail="Media file not found") from None

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Media file not found")

    return FileResponse(
        path,
        media_type=media.mime_type or "application/octet-stream",
        filename=media.original_filename,
    )


@router.post("/{media_id}/playback")
def create_media_playback(
    media_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    media = db.get(MediaResource, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media resource not found")
    settings = request.app.state.settings

    if not settings.media_encrypted_hls_enabled:
        if not settings.media_legacy_content_enabled:
            raise HTTPException(status_code=503, detail="No media playback mode is enabled")
        return {
            "mode": "blob",
            "content_url": _replace_request_suffix(request, "/playback", "/content"),
        }

    if media.status in {"processing", "failed"}:
        if settings.media_legacy_content_enabled:
            return {
                "mode": "blob",
                "content_url": _replace_request_suffix(request, "/playback", "/content"),
            }
        detail = (
            "Media is still being processed"
            if media.status == "processing"
            else "Media processing failed"
        )
        raise HTTPException(status_code=409, detail=detail)
    if not media.hls_playlist_object_key or not media.hls_key_id or not media.hls_iv:
        if settings.media_legacy_content_enabled:
            return {
                "mode": "blob",
                "content_url": _replace_request_suffix(request, "/playback", "/content"),
            }
        raise HTTPException(status_code=409, detail="Encrypted media is not ready")

    try:
        playback_token, expires_at = issue_playback_token(
            settings.media_playback_secret,
            username=user.username,
            media_id=media_id,
            ttl_seconds=settings.media_playback_ttl_seconds,
        )
    except MediaSecurityError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "mode": "hls",
        "manifest_url": _replace_request_suffix(request, "/playback", "/hls/manifest.m3u8"),
        "playback_token": playback_token,
        "expires_at": expires_at,
    }


@router.get("/{media_id}/hls/manifest.m3u8")
def get_hls_manifest(
    media_id: str,
    request: Request,
    playback_token: str = Header("", alias="X-SimLab-Playback-Token"),
    db: Session = Depends(get_db),
):
    media = _authorized_hls_media(media_id, request, db, playback_token)
    playlist_path = request.app.state.storage.path_for_object(media.hls_playlist_object_key)
    if not playlist_path.is_file():
        raise HTTPException(status_code=404, detail="HLS playlist not found")
    return Response(
        playlist_path.read_text(encoding="utf-8"),
        media_type="application/vnd.apple.mpegurl",
        headers={"Cache-Control": "no-store"},
    )


@router.get("/{media_id}/hls/key/{key_id}")
def get_hls_key(
    media_id: str,
    key_id: str,
    request: Request,
    playback_token: str = Header("", alias="X-SimLab-Playback-Token"),
    db: Session = Depends(get_db),
):
    media = _authorized_hls_media(media_id, request, db, playback_token)
    if key_id != media.hls_key_id and not request.app.state.storage.is_legacy_hls_key(media_id, key_id):
        raise HTTPException(status_code=404, detail="Media key not found")
    try:
        content_key = derive_content_key(request.app.state.settings.media_master_key, media_id, key_id)
    except MediaSecurityError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return Response(
        content_key,
        media_type="application/octet-stream",
        headers={"Cache-Control": "no-store"},
    )


@router.get("/{media_id}/hls/{asset_name:path}")
def get_hls_asset(
    media_id: str,
    asset_name: str,
    request: Request,
    playback_token: str = Header("", alias="X-SimLab-Playback-Token"),
    db: Session = Depends(get_db),
):
    media = _authorized_hls_media(media_id, request, db, playback_token)
    suffix = Path(asset_name).suffix.lower()
    if suffix not in {".m3u8", ".ts", ".m4s", ".mp4", ".aac"}:
        raise HTTPException(status_code=404, detail="HLS asset not found")
    try:
        path = request.app.state.storage.hls_asset_path(media.hls_playlist_object_key, asset_name)
        if not path.is_file():
            path = request.app.state.storage.legacy_hls_asset_path(media_id, asset_name)
    except ValueError:
        raise HTTPException(status_code=404, detail="HLS asset not found") from None
    if not path.is_file():
        raise HTTPException(status_code=404, detail="HLS asset not found")
    if suffix == ".m3u8":
        return Response(
            path.read_text(encoding="utf-8"),
            media_type="application/vnd.apple.mpegurl",
            headers={"Cache-Control": "no-store"},
        )
    media_type = "video/mp2t" if suffix == ".ts" else "application/octet-stream"
    return FileResponse(
        path,
        media_type=media_type,
        headers={"Cache-Control": "private, max-age=300"},
    )


def _authorized_hls_media(
    media_id: str,
    request: Request,
    db: Session,
    playback_token: str,
) -> MediaResource:
    settings = request.app.state.settings
    if not settings.media_encrypted_hls_enabled:
        raise HTTPException(status_code=404, detail="Encrypted HLS playback is disabled")
    if not playback_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Playback token is required")
    try:
        verify_playback_token(
            settings.media_playback_secret,
            playback_token,
            expected_media_id=media_id,
        )
    except MediaSecurityError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    media = db.get(MediaResource, media_id)
    if (
        not media
        or media.status != "ready"
        or not media.hls_playlist_object_key
        or not media.hls_key_id
        or not media.hls_iv
    ):
        raise HTTPException(status_code=404, detail="Encrypted media is not available")
    return media


def _replace_request_suffix(request: Request, old_suffix: str, new_suffix: str) -> str:
    path = request.url.path
    if not path.endswith(old_suffix):
        raise HTTPException(status_code=500, detail="Unable to build media playback URL")
    return path[: -len(old_suffix)] + new_suffix
