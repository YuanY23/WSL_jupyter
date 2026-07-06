from simlab_training_service.storage import TutorialStorage


def test_storage_writes_notebook_and_returns_hash(tmp_path):
    storage = TutorialStorage(tmp_path)
    notebook = {"cells": [], "metadata": {}, "nbformat": 4, "nbformat_minor": 5}

    stored = storage.save_version("tutorial-1", "version-1", notebook)

    assert stored.object_key == "tutorial-1/version-1.ipynb"
    assert len(stored.sha256) == 64
    assert (tmp_path / stored.object_key).exists()
    assert storage.load(stored.object_key)["nbformat"] == 4
