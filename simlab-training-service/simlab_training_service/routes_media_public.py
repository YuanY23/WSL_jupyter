from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .auth import CurrentUser, get_current_user
from .db import get_db
from .models import MediaResource


router = APIRouter(prefix="/api/media")


@router.get("/{media_id}/content")
def get_media_content(
    media_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _user: CurrentUser = Depends(get_current_user),
):
    media = db.get(MediaResource, media_id)
    if not media or media.status != "available":
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
