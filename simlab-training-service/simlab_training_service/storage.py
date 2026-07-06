from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class StoredNotebook:
    object_key: str
    sha256: str


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
