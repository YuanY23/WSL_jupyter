from pathlib import Path

HERE = Path(__file__).parent.resolve()


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyterlab-param-binding"
    }]


__version__ = "0.1.0"
