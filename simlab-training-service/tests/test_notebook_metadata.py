import pytest
from fastapi import HTTPException

from simlab_training_service.notebook import inject_tutorial_metadata, validate_imported_notebook


def minimal_notebook():
    return {
        "cells": [],
        "metadata": {},
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def test_inject_tutorial_metadata_marks_ordinary_notebook_as_tutorial():
    notebook = inject_tutorial_metadata(
        minimal_notebook(),
        tutorial_id="heat-basic-001",
        title="一维稳态导热基础",
        course_id="course-public-id",
        section_id="section-public-id",
        version="1.0",
    )

    assert notebook["metadata"]["simlab_tutorial"] == {
        "enabled": True,
        "tutorial_id": "heat-basic-001",
        "title": "一维稳态导热基础",
        "course_id": "course-public-id",
        "section_id": "section-public-id",
        "version": "1.0",
    }


def test_inject_tutorial_metadata_overwrites_existing_marker():
    notebook = minimal_notebook()
    notebook["metadata"]["simlab_tutorial"] = {"enabled": False, "tutorial_id": "old"}

    updated = inject_tutorial_metadata(
        notebook,
        tutorial_id="new-id",
        title="新教程",
        course_id="course-id",
        section_id="section-id",
        version="2.0",
    )

    assert updated["metadata"]["simlab_tutorial"]["enabled"] is True
    assert updated["metadata"]["simlab_tutorial"]["tutorial_id"] == "new-id"
    assert updated["metadata"]["simlab_tutorial"]["version"] == "2.0"


def test_validate_imported_notebook_rejects_invalid_content():
    with pytest.raises(HTTPException) as exc:
        validate_imported_notebook({"metadata": {}, "nbformat": 4}, title="标题", course_id="c", section_id="s")

    assert exc.value.status_code == 400
