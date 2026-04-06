import json
from pathlib import Path

HERE = Path(__file__).parent.resolve()

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyterlab-thermal-design"
    }]

__version__ = "0.1.0"

