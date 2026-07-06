from __future__ import annotations

from copy import deepcopy
from typing import Any

from fastapi import HTTPException, status


Notebook = dict[str, Any]


def validate_imported_notebook(
    notebook: Any,
    *,
    title: str,
    course_id: str,
    section_id: str,
) -> Notebook:
    if not isinstance(notebook, dict):
        raise_bad_notebook("Notebook content must be a JSON object")
    if "nbformat" not in notebook:
        raise_bad_notebook("Notebook nbformat is required")
    if not isinstance(notebook.get("cells"), list):
        raise_bad_notebook("Notebook cells must be a list")
    if not title.strip():
        raise_bad_notebook("Tutorial title is required")
    if not course_id:
        raise_bad_notebook("Course id is required")
    if not section_id:
        raise_bad_notebook("Section id is required")
    return notebook


def inject_tutorial_metadata(
    notebook: Notebook,
    *,
    tutorial_id: str,
    title: str,
    course_id: str,
    section_id: str,
    version: str,
    notebook_filename: str = "",
) -> Notebook:
    updated = deepcopy(notebook)
    metadata = updated.setdefault("metadata", {})
    tutorial_metadata = {
        "enabled": True,
        "tutorial_id": tutorial_id,
        "title": title,
        "course_id": course_id,
        "section_id": section_id,
        "version": version,
    }
    if notebook_filename:
        tutorial_metadata["notebook_filename"] = notebook_filename
    metadata["simlab_tutorial"] = tutorial_metadata
    return updated


def raise_bad_notebook(message: str) -> None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
