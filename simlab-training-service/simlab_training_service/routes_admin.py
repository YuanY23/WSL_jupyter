from __future__ import annotations

import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import CurrentUser, require_admin
from .db import get_db
from .models import Comment, TrainingCourse, TrainingSection, Tutorial, TutorialVersion, new_id, utcnow
from .notebook import inject_tutorial_metadata, validate_imported_notebook
from .routes_public import mark_deleted, serialize_tutorial


router = APIRouter(prefix="/api/admin")


class CourseIn(BaseModel):
    title: str
    description: str = ""
    sort_order: int = 0
    status: str = "published"


class CoursePatch(BaseModel):
    title: str | None = None
    description: str | None = None
    sort_order: int | None = None
    status: str | None = None


class SectionIn(BaseModel):
    course_id: str
    title: str
    description: str = ""
    sort_order: int = 0
    status: str = "published"


class SectionPatch(BaseModel):
    course_id: str | None = None
    title: str | None = None
    description: str | None = None
    sort_order: int | None = None
    status: str | None = None


class TutorialImportIn(BaseModel):
    course_id: str
    section_id: str
    title: str
    notebook_filename: str = ""
    description: str = ""
    sort_order: int = 0
    version_label: str = "1.0"
    import_note: str = ""
    notebook_json: dict[str, Any]
    publish_now: bool = True


class TutorialPatch(BaseModel):
    course_id: str | None = None
    section_id: str | None = None
    title: str | None = None
    notebook_filename: str | None = None
    description: str | None = None
    sort_order: int | None = None
    status: str | None = None
    comments_locked: bool | None = None


class ReorderItem(BaseModel):
    id: str
    sort_order: int


class ReorderIn(BaseModel):
    items: list[ReorderItem]


class DeleteCommentIn(BaseModel):
    reason: str = ""


@router.get("/courses")
def list_admin_courses(db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    courses = db.execute(
        select(TrainingCourse)
        .where(TrainingCourse.status != "archived")
        .order_by(TrainingCourse.sort_order, TrainingCourse.title)
    ).scalars().all()
    return [serialize_admin_course(db, course) for course in courses]


@router.post("/courses")
def create_course(payload: CourseIn, db: Session = Depends(get_db), admin: CurrentUser = Depends(require_admin)):
    course = TrainingCourse(
        slug=unique_slug(db, TrainingCourse, payload.title),
        title=required_title(payload.title),
        description=payload.description,
        sort_order=payload.sort_order,
        status=payload.status,
        created_by=admin.username,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return serialize_course(course)


@router.patch("/courses/{course_id}")
def patch_course(course_id: str, payload: CoursePatch, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    course = db.get(TrainingCourse, course_id) or not_found("Course")
    apply_patch_fields(course, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(course)
    return serialize_course(course)


@router.delete("/courses/{course_id}")
def archive_course(course_id: str, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    course = db.get(TrainingCourse, course_id) or not_found("Course")
    archive_course_tree(db, course)
    db.commit()
    return {"ok": True}


@router.post("/courses/reorder")
def reorder_courses(payload: ReorderIn, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    apply_reorder(db, TrainingCourse, payload.items)
    return {"ok": True}


@router.post("/sections")
def create_section(payload: SectionIn, db: Session = Depends(get_db), admin: CurrentUser = Depends(require_admin)):
    ensure_course(db, payload.course_id)
    section = TrainingSection(
        course_id=payload.course_id,
        title=required_title(payload.title),
        description=payload.description,
        sort_order=payload.sort_order,
        status=payload.status,
        created_by=admin.username,
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return serialize_section(section)


@router.patch("/sections/{section_id}")
def patch_section(section_id: str, payload: SectionPatch, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    section = db.get(TrainingSection, section_id) or not_found("Section")
    updates = payload.model_dump(exclude_unset=True)
    if "course_id" in updates:
        ensure_course(db, updates["course_id"])
    apply_patch_fields(section, updates)
    db.commit()
    db.refresh(section)
    return serialize_section(section)


@router.delete("/sections/{section_id}")
def archive_section(section_id: str, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    section = db.get(TrainingSection, section_id) or not_found("Section")
    archive_section_tree(db, section)
    db.commit()
    return {"ok": True}


@router.post("/sections/reorder")
def reorder_sections(payload: ReorderIn, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    apply_reorder(db, TrainingSection, payload.items)
    return {"ok": True}


@router.post("/tutorials/import")
def import_tutorial(
    payload: TutorialImportIn,
    request: Request,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(require_admin),
):
    ensure_course(db, payload.course_id)
    ensure_section(db, payload.section_id)
    title = required_title(payload.title)
    validate_imported_notebook(
        payload.notebook_json,
        title=title,
        course_id=payload.course_id,
        section_id=payload.section_id,
    )
    public_id = unique_public_id(db, title)
    tutorial = Tutorial(
        public_id=public_id,
        course_id=payload.course_id,
        section_id=payload.section_id,
        slug=unique_slug(db, Tutorial, title),
        title=title,
        notebook_filename=normalize_notebook_filename(payload.notebook_filename, title),
        description=payload.description,
        sort_order=payload.sort_order,
        status="published" if payload.publish_now else "draft",
        created_by=admin.username,
    )
    db.add(tutorial)
    db.flush()
    version = add_version(db, request, tutorial, payload, admin.username)
    tutorial.current_version_id = version.id
    db.commit()
    db.refresh(tutorial)
    return serialize_tutorial(tutorial, include_status=True)


@router.post("/tutorials/{public_id}/versions")
def update_tutorial_version(
    public_id: str,
    payload: TutorialImportIn,
    request: Request,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(require_admin),
):
    tutorial = db.execute(select(Tutorial).where(Tutorial.public_id == public_id)).scalar_one_or_none()
    if not tutorial:
        not_found("Tutorial")
    if payload.notebook_filename:
        tutorial.notebook_filename = normalize_notebook_filename(payload.notebook_filename, tutorial.title)
    validate_imported_notebook(
        payload.notebook_json,
        title=tutorial.title,
        course_id=tutorial.course_id,
        section_id=tutorial.section_id,
    )
    version = add_version(db, request, tutorial, payload, admin.username)
    tutorial.current_version_id = version.id
    tutorial.updated_at = utcnow()
    db.commit()
    db.refresh(tutorial)
    return serialize_tutorial(tutorial, include_status=True)


@router.patch("/tutorials/{public_id}")
def patch_tutorial(public_id: str, payload: TutorialPatch, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    tutorial = db.execute(select(Tutorial).where(Tutorial.public_id == public_id)).scalar_one_or_none()
    if not tutorial:
        not_found("Tutorial")
    updates = payload.model_dump(exclude_unset=True)
    if "course_id" in updates:
        ensure_course(db, updates["course_id"])
    if "section_id" in updates:
        ensure_section(db, updates["section_id"])
    if "notebook_filename" in updates and updates["notebook_filename"] is not None:
        updates["notebook_filename"] = normalize_notebook_filename(updates["notebook_filename"], tutorial.title)
    apply_patch_fields(tutorial, updates)
    db.commit()
    db.refresh(tutorial)
    return serialize_tutorial(tutorial, include_status=True)


@router.delete("/tutorials/{public_id}")
def archive_tutorial(public_id: str, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    tutorial = db.execute(select(Tutorial).where(Tutorial.public_id == public_id)).scalar_one_or_none()
    if not tutorial:
        not_found("Tutorial")
    archive(tutorial)
    db.commit()
    return {"ok": True}


@router.post("/tutorials/reorder")
def reorder_tutorials(payload: ReorderIn, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    apply_reorder(db, Tutorial, payload.items)
    return {"ok": True}


@router.post("/comments/{comment_id}/pin")
def pin_comment(comment_id: str, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    return set_comment_flag(db, comment_id, "is_pinned", True)


@router.delete("/comments/{comment_id}/pin")
def unpin_comment(comment_id: str, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    return set_comment_flag(db, comment_id, "is_pinned", False)


@router.post("/comments/{comment_id}/official")
def mark_official(comment_id: str, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    return set_comment_flag(db, comment_id, "is_official", True)


@router.delete("/comments/{comment_id}/official")
def unmark_official(comment_id: str, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    return set_comment_flag(db, comment_id, "is_official", False)


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: str,
    payload: DeleteCommentIn | None = None,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(require_admin),
):
    comment = db.get(Comment, comment_id) or not_found("Comment")
    mark_deleted(comment, admin=admin.username, reason=payload.reason if payload else "")
    db.commit()
    return {"ok": True}


@router.post("/tutorials/{public_id}/lock-comments")
def lock_comments(public_id: str, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    tutorial = db.execute(select(Tutorial).where(Tutorial.public_id == public_id)).scalar_one_or_none()
    if not tutorial:
        not_found("Tutorial")
    tutorial.comments_locked = True
    db.commit()
    return {"ok": True}


@router.delete("/tutorials/{public_id}/lock-comments")
def unlock_comments(public_id: str, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    tutorial = db.execute(select(Tutorial).where(Tutorial.public_id == public_id)).scalar_one_or_none()
    if not tutorial:
        not_found("Tutorial")
    tutorial.comments_locked = False
    db.commit()
    return {"ok": True}


def add_version(db: Session, request: Request, tutorial: Tutorial, payload: TutorialImportIn, username: str) -> TutorialVersion:
    version_id = new_id()
    notebook = inject_tutorial_metadata(
        payload.notebook_json,
        tutorial_id=tutorial.public_id,
        title=tutorial.title,
        course_id=tutorial.course_id,
        section_id=tutorial.section_id,
        version=payload.version_label,
        notebook_filename=tutorial.notebook_filename,
    )
    stored = request.app.state.storage.save_version(tutorial.public_id, version_id, notebook)
    version = TutorialVersion(
        id=version_id,
        tutorial_id=tutorial.id,
        version_label=payload.version_label,
        file_object_key=stored.object_key,
        file_sha256=stored.sha256,
        imported_by=username,
        import_note=payload.import_note,
    )
    db.add(version)
    db.flush()
    return version


def ensure_course(db: Session, course_id: str) -> TrainingCourse:
    course = db.get(TrainingCourse, course_id)
    if not course:
        not_found("Course")
    return course


def ensure_section(db: Session, section_id: str) -> TrainingSection:
    section = db.get(TrainingSection, section_id)
    if not section:
        not_found("Section")
    return section


def not_found(name: str):
    raise HTTPException(status_code=404, detail=f"{name} not found")


def required_title(title: str) -> str:
    value = title.strip()
    if not value:
        raise HTTPException(status_code=400, detail="Title is required")
    return value


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", title.lower()).strip("-")
    return slug or "item"


def normalize_notebook_filename(value: str, fallback_title: str) -> str:
    filename = (value or "").strip() or f"{required_title(fallback_title)}.ipynb"
    filename = filename.replace("\\", "/").split("/")[-1].strip()
    filename = re.sub(r'[\\/:*?"<>|]+', "_", filename)
    filename = re.sub(r"\s+", " ", filename)
    if not filename.lower().endswith(".ipynb"):
        filename = f"{filename}.ipynb"
    return filename or "tutorial.ipynb"


def unique_slug(db: Session, model, title: str) -> str:
    base = slugify(title)
    candidate = base
    index = 1
    while db.execute(select(model).where(model.slug == candidate)).scalar_one_or_none():
        index += 1
        candidate = f"{base}-{index}"
    return candidate


def unique_public_id(db: Session, title: str) -> str:
    base = slugify(title)
    while True:
        candidate = f"{base}-{new_id()[:8]}"
        exists = db.execute(select(Tutorial).where(Tutorial.public_id == candidate)).scalar_one_or_none()
        if not exists:
            return candidate


def archive(row) -> None:
    row.status = "archived"
    row.archived_at = utcnow()


def archive_course_tree(db: Session, course: TrainingCourse) -> None:
    archive(course)
    sections = db.execute(select(TrainingSection).where(TrainingSection.course_id == course.id)).scalars().all()
    tutorials = db.execute(select(Tutorial).where(Tutorial.course_id == course.id)).scalars().all()
    for section in sections:
        archive(section)
    for tutorial in tutorials:
        archive(tutorial)


def archive_section_tree(db: Session, section: TrainingSection) -> None:
    archive(section)
    tutorials = db.execute(select(Tutorial).where(Tutorial.section_id == section.id)).scalars().all()
    for tutorial in tutorials:
        archive(tutorial)


def apply_patch_fields(row, updates: dict[str, Any]) -> None:
    for key, value in updates.items():
        if value is not None:
            if key == "title":
                value = required_title(value)
            setattr(row, key, value)
    row.updated_at = utcnow()


def apply_reorder(db: Session, model, items: list[ReorderItem]) -> None:
    for item in items:
        row = db.get(model, item.id)
        if row:
            row.sort_order = item.sort_order
            row.updated_at = utcnow()
    db.commit()


def set_comment_flag(db: Session, comment_id: str, field: str, value: bool):
    comment = db.get(Comment, comment_id) or not_found("Comment")
    setattr(comment, field, value)
    comment.updated_at = utcnow()
    db.commit()
    return {"ok": True}


def serialize_admin_course(db: Session, course: TrainingCourse) -> dict:
    sections = db.execute(
        select(TrainingSection)
        .where(
            TrainingSection.course_id == course.id,
            TrainingSection.status != "archived",
        )
        .order_by(TrainingSection.sort_order, TrainingSection.title)
    ).scalars().all()
    return {
        **serialize_course(course),
        "sections": [serialize_admin_section(db, section) for section in sections],
    }


def serialize_admin_section(db: Session, section: TrainingSection) -> dict:
    tutorials = db.execute(
        select(Tutorial)
        .where(
            Tutorial.section_id == section.id,
            Tutorial.status != "archived",
        )
        .order_by(Tutorial.sort_order, Tutorial.title)
    ).scalars().all()
    return {
        **serialize_section(section),
        "tutorials": [serialize_tutorial(tutorial, include_status=True) for tutorial in tutorials],
    }


def serialize_course(course: TrainingCourse) -> dict:
    return {
        "id": course.id,
        "slug": course.slug,
        "title": course.title,
        "description": course.description,
        "sort_order": course.sort_order,
        "status": course.status,
    }


def serialize_section(section: TrainingSection) -> dict:
    return {
        "id": section.id,
        "course_id": section.course_id,
        "title": section.title,
        "description": section.description,
        "sort_order": section.sort_order,
        "status": section.status,
    }
