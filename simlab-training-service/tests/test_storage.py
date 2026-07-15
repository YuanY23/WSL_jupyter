from simlab_training_service.storage import TutorialStorage


class ChunkTrackingStream:
    def __init__(self, content: bytes):
        self.content = content
        self.offset = 0
        self.read_sizes = []

    def read(self, size: int) -> bytes:
        self.read_sizes.append(size)
        chunk = self.content[self.offset:self.offset + size]
        self.offset += len(chunk)
        return chunk


def test_storage_writes_notebook_and_returns_hash(tmp_path):
    storage = TutorialStorage(tmp_path)
    notebook = {"cells": [], "metadata": {}, "nbformat": 4, "nbformat_minor": 5}

    stored = storage.save_version("tutorial-1", "version-1", notebook)

    assert stored.object_key == "tutorial-1/version-1.ipynb"
    assert len(stored.sha256) == 64
    assert (tmp_path / stored.object_key).exists()
    assert storage.load(stored.object_key)["nbformat"] == 4


def test_storage_streams_large_media_in_bounded_chunks(tmp_path):
    storage = TutorialStorage(tmp_path)
    content = b"video" * 500_000
    stream = ChunkTrackingStream(content)

    stored = storage.save_media_stream("vid_stream", "long.mp4", stream, chunk_size=64 * 1024)

    assert stored.size == len(content)
    assert (tmp_path / stored.object_key).read_bytes() == content
    assert set(stream.read_sizes) == {64 * 1024}
    assert len(stream.read_sizes) > 2
