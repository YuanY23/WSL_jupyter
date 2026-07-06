from pathlib import Path

HERE = Path(__file__).parent.resolve()


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyterlab-training-platform"
    }]


__version__ = "0.1.0"
