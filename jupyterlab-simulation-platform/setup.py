from setuptools import setup
import os


def get_data_files():
    data_files = []
    extension_root = "jupyterlab_simulation_platform/labextension"
    if os.path.isdir(extension_root):
        for root, _dirs, files in os.walk(extension_root):
            file_paths = [os.path.join(root, filename) for filename in files]
            rel_path = os.path.relpath(root, extension_root)
            if rel_path == ".":
                install_path = "share/jupyter/labextensions/jupyterlab-simulation-platform"
            else:
                install_path = os.path.join(
                    "share/jupyter/labextensions/jupyterlab-simulation-platform",
                    rel_path,
                )
            data_files.append((install_path, file_paths))

    data_files.append(
        ("share/jupyter/labextensions/jupyterlab-simulation-platform", ["package.json"])
    )
    return data_files


setup(
    name="jupyterlab_simulation_platform",
    version="0.1.0",
    description="Template-based visible-code simulation Notebook generator",
    packages=["jupyterlab_simulation_platform"],
    data_files=get_data_files(),
    zip_safe=False,
)
