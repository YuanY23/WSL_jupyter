from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .db import Base


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TrainingCourse(Base):
    __tablename__ = "training_courses"

    id = Column(String(36), primary_key=True, default=new_id)
    slug = Column(String(255), unique=True, nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False, default="")
    sort_order = Column(Integer, nullable=False, default=0)
    status = Column(String(32), nullable=False, default="published")
    created_by = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)
    archived_at = Column(DateTime(timezone=True), nullable=True)

    sections = relationship("TrainingSection", back_populates="course")
    tutorials = relationship("Tutorial", back_populates="course")


class TrainingSection(Base):
    __tablename__ = "training_sections"
    __table_args__ = (Index("ix_training_sections_course_sort", "course_id", "sort_order"),)

    id = Column(String(36), primary_key=True, default=new_id)
    course_id = Column(String(36), ForeignKey("training_courses.id"), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False, default="")
    sort_order = Column(Integer, nullable=False, default=0)
    status = Column(String(32), nullable=False, default="published")
    created_by = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)
    archived_at = Column(DateTime(timezone=True), nullable=True)

    course = relationship("TrainingCourse", back_populates="sections")
    tutorials = relationship("Tutorial", back_populates="section")


class Tutorial(Base):
    __tablename__ = "tutorials"
    __table_args__ = (
        Index("ix_tutorials_section_sort", "section_id", "sort_order"),
    )

    id = Column(String(36), primary_key=True, default=new_id)
    public_id = Column(String(255), unique=True, nullable=False)
    course_id = Column(String(36), ForeignKey("training_courses.id"), nullable=False)
    section_id = Column(String(36), ForeignKey("training_sections.id"), nullable=False)
    slug = Column(String(255), nullable=False)
    title = Column(Text, nullable=False)
    notebook_filename = Column(Text, nullable=False, default="")
    description = Column(Text, nullable=False, default="")
    sort_order = Column(Integer, nullable=False, default=0)
    status = Column(String(32), nullable=False, default="published")
    current_version_id = Column(String(36), nullable=True)
    comments_locked = Column(Boolean, nullable=False, default=False)
    created_by = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)
    archived_at = Column(DateTime(timezone=True), nullable=True)

    course = relationship("TrainingCourse", back_populates="tutorials")
    section = relationship("TrainingSection", back_populates="tutorials")
    versions = relationship("TutorialVersion", back_populates="tutorial")


class TutorialVersion(Base):
    __tablename__ = "tutorial_versions"

    id = Column(String(36), primary_key=True, default=new_id)
    tutorial_id = Column(String(36), ForeignKey("tutorials.id"), nullable=False)
    version_label = Column(Text, nullable=False)
    file_object_key = Column(Text, nullable=False)
    file_sha256 = Column(String(64), nullable=False)
    imported_by = Column(String(255), nullable=False)
    import_note = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    tutorial = relationship("Tutorial", back_populates="versions")


class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = (
        Index("ix_comments_tutorial_pin_created", "tutorial_public_id", "is_pinned", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=new_id)
    tutorial_public_id = Column(String(255), ForeignKey("tutorials.public_id"), nullable=False)
    parent_id = Column(String(36), ForeignKey("comments.id"), nullable=True)
    author = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, nullable=False, default=False)
    is_official = Column(Boolean, nullable=False, default=False)
    is_deleted = Column(Boolean, nullable=False, default=False)
    deleted_by = Column(String(255), nullable=True)
    deleted_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    replies = relationship("Comment", backref="parent", remote_side=[id])
    likes = relationship("CommentLike", back_populates="comment")


class CommentLike(Base):
    __tablename__ = "comment_likes"
    __table_args__ = (UniqueConstraint("comment_id", "username", name="uq_comment_like_user"),)

    id = Column(String(36), primary_key=True, default=new_id)
    comment_id = Column(String(36), ForeignKey("comments.id"), nullable=False)
    username = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    comment = relationship("Comment", back_populates="likes")
