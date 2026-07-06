from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .auth import CurrentUser, get_current_user
from .db import get_db
from .models import Comment, CommentLike, TrainingCourse, TrainingSection, Tutorial, TutorialVersion, utcnow
from .notebook import inject_tutorial_metadata


router = APIRouter(prefix="/api")


class CommentIn(BaseModel):
    content: str


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    return {"username": user.username, "is_admin": user.is_admin}


@router.get("/courses")
def list_courses(db: Session = Depends(get_db), _user: CurrentUser = Depends(get_current_user)):
    courses = db.execute(
        select(TrainingCourse)
        .where(TrainingCourse.status == "published")
        .order_by(TrainingCourse.sort_order, TrainingCourse.title)
    ).scalars().all()
    result = []
    for course in courses:
        sections = db.execute(
            select(TrainingSection)
            .where(
                TrainingSection.course_id == course.id,
                TrainingSection.status == "published",
            )
            .order_by(TrainingSection.sort_order, TrainingSection.title)
        ).scalars().all()
        section_items = []
        for section in sections:
            tutorials = db.execute(
                select(Tutorial)
                .where(
                    Tutorial.section_id == section.id,
                    Tutorial.status == "published",
                )
                .order_by(Tutorial.sort_order, Tutorial.title)
            ).scalars().all()
            section_items.append({
                "id": section.id,
                "title": section.title,
                "description": section.description,
                "sort_order": section.sort_order,
                "tutorials": [serialize_tutorial(tutorial) for tutorial in tutorials],
            })
        result.append({
            "id": course.id,
            "slug": course.slug,
            "title": course.title,
            "description": course.description,
            "sort_order": course.sort_order,
            "sections": section_items,
        })
    return result


@router.get("/courses/{course_id}")
def get_course(course_id: str, db: Session = Depends(get_db), _user: CurrentUser = Depends(get_current_user)):
    course = db.get(TrainingCourse, course_id)
    if not course or course.status != "published":
        raise HTTPException(status_code=404, detail="Course not found")
    return next(item for item in list_courses(db, _user) if item["id"] == course_id)


@router.get("/tutorials/{public_id}")
def get_tutorial(public_id: str, db: Session = Depends(get_db), _user: CurrentUser = Depends(get_current_user)):
    tutorial = tutorial_or_404(db, public_id)
    return serialize_tutorial(tutorial, include_status=True)


@router.get("/tutorials/{public_id}/content")
def get_tutorial_content(
    public_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _user: CurrentUser = Depends(get_current_user),
):
    tutorial = tutorial_or_404(db, public_id)
    version = current_version_or_404(db, tutorial)
    notebook = request.app.state.storage.load(version.file_object_key)
    return inject_tutorial_metadata(
        notebook,
        tutorial_id=tutorial.public_id,
        title=tutorial.title,
        course_id=tutorial.course_id,
        section_id=tutorial.section_id,
        version=version.version_label,
        notebook_filename=tutorial.notebook_filename,
    )


@router.get("/tutorials/{public_id}/comments")
def list_comments(
    public_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    tutorial_or_404(db, public_id)
    comments = db.execute(
        select(Comment)
        .where(
            Comment.tutorial_public_id == public_id,
            Comment.is_deleted.is_(False),
        )
        .order_by(Comment.is_pinned.desc(), Comment.created_at.asc())
    ).scalars().all()
    like_counts = dict(db.execute(
        select(CommentLike.comment_id, func.count(CommentLike.id))
        .join(Comment, Comment.id == CommentLike.comment_id)
        .where(
            Comment.tutorial_public_id == public_id,
            Comment.is_deleted.is_(False),
        )
        .group_by(CommentLike.comment_id)
    ).all())
    liked_ids = {
        row[0]
        for row in db.execute(
            select(CommentLike.comment_id).where(CommentLike.username == user.username)
        ).all()
    }
    replies_by_parent: dict[str, list[Comment]] = defaultdict(list)
    top_level = []
    for comment in comments:
        if comment.parent_id:
            replies_by_parent[comment.parent_id].append(comment)
        else:
            top_level.append(comment)
    return [
        serialize_comment(comment, replies_by_parent, like_counts, liked_ids, user)
        for comment in top_level
    ]


@router.post("/tutorials/{public_id}/comments")
def create_comment(
    public_id: str,
    payload: CommentIn,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    tutorial = writable_tutorial_or_error(db, public_id)
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment content is required")
    comment = Comment(tutorial_public_id=tutorial.public_id, author=user.username, content=content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return serialize_comment(comment, defaultdict(list), {}, set(), user)


@router.post("/comments/{comment_id}/replies")
def create_reply(
    comment_id: str,
    payload: CommentIn,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    parent = db.get(Comment, comment_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Comment not found")
    if parent.parent_id:
        raise HTTPException(status_code=400, detail="Replies can only target top-level comments")
    writable_tutorial_or_error(db, parent.tutorial_public_id)
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Reply content is required")
    reply = Comment(
        tutorial_public_id=parent.tutorial_public_id,
        parent_id=parent.id,
        author=user.username,
        content=content,
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return serialize_comment(reply, defaultdict(list), {}, set(), user)


@router.post("/comments/{comment_id}/like")
def like_comment(comment_id: str, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    writable_tutorial_or_error(db, comment.tutorial_public_id)
    like = CommentLike(comment_id=comment.id, username=user.username)
    db.add(like)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"ok": True}


@router.delete("/comments/{comment_id}/like")
def unlike_comment(comment_id: str, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.execute(
        CommentLike.__table__.delete().where(
            CommentLike.comment_id == comment.id,
            CommentLike.username == user.username,
        )
    )
    db.commit()
    return {"ok": True}


def tutorial_or_404(db: Session, public_id: str) -> Tutorial:
    tutorial = db.execute(select(Tutorial).where(Tutorial.public_id == public_id)).scalar_one_or_none()
    if not tutorial or tutorial.status != "published":
        raise HTTPException(status_code=404, detail="Tutorial not found")
    course = db.get(TrainingCourse, tutorial.course_id)
    section = db.get(TrainingSection, tutorial.section_id)
    if not course or not section or course.status != "published" or section.status != "published":
        raise HTTPException(status_code=404, detail="Tutorial not found")
    return tutorial


def writable_tutorial_or_error(db: Session, public_id: str) -> Tutorial:
    tutorial = tutorial_or_404(db, public_id)
    if tutorial.comments_locked:
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="Tutorial comments are locked")
    return tutorial


def current_version_or_404(db: Session, tutorial: Tutorial) -> TutorialVersion:
    if not tutorial.current_version_id:
        raise HTTPException(status_code=404, detail="Tutorial version not found")
    version = db.get(TutorialVersion, tutorial.current_version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Tutorial version not found")
    return version


def serialize_tutorial(tutorial: Tutorial, *, include_status: bool = False) -> dict:
    item = {
        "id": tutorial.id,
        "public_id": tutorial.public_id,
        "title": tutorial.title,
        "notebook_filename": tutorial.notebook_filename,
        "description": tutorial.description,
        "sort_order": tutorial.sort_order,
        "current_version_id": tutorial.current_version_id,
        "comments_locked": tutorial.comments_locked,
    }
    if include_status:
        item["status"] = tutorial.status
        item["course_id"] = tutorial.course_id
        item["section_id"] = tutorial.section_id
    return item


def serialize_comment(
    comment: Comment,
    replies_by_parent: dict[str, list[Comment]],
    like_counts: dict[str, int],
    liked_ids: set[str],
    user: CurrentUser,
) -> dict:
    return {
        "id": comment.id,
        "tutorial_public_id": comment.tutorial_public_id,
        "parent_id": comment.parent_id,
        "author": comment.author,
        "content": "该评论已被管理员删除" if comment.is_deleted else comment.content,
        "is_pinned": comment.is_pinned,
        "is_official": comment.is_official,
        "is_deleted": comment.is_deleted,
        "deleted_reason": comment.deleted_reason,
        "created_at": comment.created_at.isoformat(),
        "updated_at": comment.updated_at.isoformat(),
        "like_count": int(like_counts.get(comment.id, 0)),
        "liked_by_current_user": comment.id in liked_ids,
        "can_admin": user.is_admin,
        "replies": [
            serialize_comment(reply, replies_by_parent, like_counts, liked_ids, user)
            for reply in sorted(replies_by_parent.get(comment.id, []), key=lambda item: item.created_at)
        ],
    }


def mark_deleted(comment: Comment, *, admin: str, reason: str) -> None:
    comment.is_deleted = True
    comment.deleted_by = admin
    comment.deleted_reason = reason
    comment.deleted_at = utcnow()
