from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class StoredNotebook:
    object_key: str
    sha256: str


@dataclass(frozen=True)
class StoredMedia:
    object_key: str
    sha256: str
    size: int


class TutorialStorage:
    def __init__(self, root: str | Path):
        self.root = Path(root)

    def save_version(self, tutorial_public_id: str, version_id: str, notebook: dict[str, Any]) -> StoredNotebook:
        relative = Path(tutorial_public_id) / f"{version_id}.ipynb"
        target = self.root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        content = json.dumps(notebook, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8")
        target.write_bytes(content)
        return StoredNotebook(
            object_key=relative.as_posix(),
            sha256=hashlib.sha256(content).hexdigest(),
        )

    def load(self, object_key: str) -> dict[str, Any]:
        return json.loads((self.root / object_key).read_text(encoding="utf-8"))

    def path_for_object(self, object_key: str) -> Path:
        target = (self.root / object_key).resolve()
        root = self.root.resolve()
        if root not in target.parents and target != root:
            raise ValueError("Stored object is outside the storage root")
        return target

    def save_media(self, media_id: str, filename: str, content: bytes) -> StoredMedia:
        relative = Path("media") / media_id / safe_filename(filename)
        target = self.root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return StoredMedia(
            object_key=relative.as_posix(),
            sha256=hashlib.sha256(content).hexdigest(),
            size=len(content),
        )

    def delete_object(self, object_key: str) -> None:
        target = self.root / object_key
        if target.exists() and target.is_file():
            target.unlink()


def safe_filename(value: str) -> str:
    filename = value.replace("\\", "/").split("/")[-1].strip()
    filename = re.sub(r'[\\/:*?"<>|]+', "_", filename)
    filename = re.sub(r"\s+", " ", filename)
    return filename or "media.bin"
