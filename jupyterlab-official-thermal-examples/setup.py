from setuptools import setup
import os


def get_data_files():
    data_files = []
    extension_root = "jupyterlab_official_thermal_examples/labextension"
    if os.path.isdir(extension_root):
        for root, _dirs, files in os.walk(extension_root):
            file_paths = [os.path.join(root, filename) for filename in files]
            rel_path = os.path.relpath(root, extension_root)
            if rel_path == ".":
                install_path = "share/jupyter/labextensions/jupyterlab-official-thermal-examples"
            else:
                install_path = os.path.join(
                    "share/jupyter/labextensions/jupyterlab-official-thermal-examples",
                    rel_path,
                )
            data_files.append((install_path, file_paths))

    data_files.append(
        ("share/jupyter/labextensions/jupyterlab-official-thermal-examples", ["package.json"])
    )
    return data_files


setup(
    name="jupyterlab_official_thermal_examples",
    version="0.1.0",
    description="Official visible-code thermal process modeling examples",
    packages=["jupyterlab_official_thermal_examples"],
    data_files=get_data_files(),
    zip_safe=False,
)
