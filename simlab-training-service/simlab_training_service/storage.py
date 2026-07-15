from __future__ import annotations

import hashlib
import json
import re
import shutil
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, BinaryIO


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
        from io import BytesIO

        return self.save_media_stream(media_id, filename, BytesIO(content))

    def save_media_stream(
        self,
        media_id: str,
        filename: str,
        stream: BinaryIO,
        chunk_size: int = 1024 * 1024,
    ) -> StoredMedia:
        relative = Path("media") / media_id / safe_filename(filename)
        target = self.root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        digest = hashlib.sha256()
        size = 0
        try:
            with target.open("wb") as output:
                while True:
                    chunk = stream.read(chunk_size)
                    if not chunk:
                        break
                    output.write(chunk)
                    digest.update(chunk)
                    size += len(chunk)
        except Exception:
            target.unlink(missing_ok=True)
            raise
        return StoredMedia(
            object_key=relative.as_posix(),
            sha256=digest.hexdigest(),
            size=size,
        )

    def delete_object(self, object_key: str) -> None:
        target = self.path_for_object(object_key)
        if target.exists() and target.is_file():
            target.unlink()

    def create_media_processing_dir(self, media_id: str) -> Path:
        media_root = self._media_dir("processing", media_id)
        target = media_root / f"job-{uuid.uuid4().hex}"
        target.mkdir(parents=True, exist_ok=True)
        return target

    def promote_hls_dir(self, media_id: str, source: Path) -> str:
        media_root = self._media_dir("encrypted-media", media_id)
        target = media_root / f"set-{uuid.uuid4().hex}"
        target.parent.mkdir(parents=True, exist_ok=True)
        source.replace(target)
        return (Path("encrypted-media") / media_id / target.name / "master.m3u8").as_posix()

    def hls_asset_path(self, playlist_object_key: str, asset_name: str) -> Path:
        base = self.path_for_object(playlist_object_key).parent.resolve()
        target = (base / asset_name).resolve()
        if base not in target.parents or not asset_name or Path(asset_name).is_absolute():
            raise ValueError("Invalid HLS asset name")
        return target

    def legacy_hls_asset_path(self, media_id: str, asset_name: str) -> Path:
        base = self._media_dir("encrypted-media", media_id)
        target = (base / asset_name).resolve()
        if base not in target.parents or not asset_name or Path(asset_name).is_absolute():
            raise ValueError("Invalid legacy HLS asset name")
        return target

    def is_legacy_hls_key(self, media_id: str, key_id: str) -> bool:
        playlist = self._media_dir("encrypted-media", media_id) / "index.m3u8"
        if not playlist.is_file() or not re.fullmatch(r"[0-9a-f]{32}", key_id):
            return False
        content = playlist.read_text(encoding="utf-8")
        return key_id in set(re.findall(r"key/([0-9a-f]{32})", content))

    def delete_media_artifacts(self, media_id: str, original_object_key: str | None = None) -> None:
        if original_object_key:
            self.delete_object(original_object_key)
        for category in ("processing", "encrypted-media"):
            target = self._media_dir(category, media_id)
            if target.exists():
                shutil.rmtree(target)

    def _media_dir(self, category: str, media_id: str) -> Path:
        if not re.fullmatch(r"[A-Za-z0-9_-]+", media_id):
            raise ValueError("Invalid media id")
        target = (self.root / category / media_id).resolve()
        root = self.root.resolve()
        if root not in target.parents:
            raise ValueError("Media directory is outside the storage root")
        return target


def safe_filename(value: str) -> str:
    filename = value.replace("\\", "/").split("/")[-1].strip()
    filename = re.sub(r'[\\/:*?"<>|]+', "_", filename)
    filename = re.sub(r"\s+", " ", filename)
    return filename or "media.bin"
