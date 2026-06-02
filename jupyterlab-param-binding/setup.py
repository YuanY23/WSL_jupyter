from setuptools import setup
import os


def get_data_files():
    data_files = []
    extension_root = "jupyterlab_param_binding/labextension"
    if os.path.isdir(extension_root):
        for root, _dirs, files in os.walk(extension_root):
            file_paths = [os.path.join(root, filename) for filename in files]
            rel_path = os.path.relpath(root, extension_root)
            if rel_path == ".":
                install_path = "share/jupyter/labextensions/jupyterlab-param-binding"
            else:
                install_path = os.path.join(
                    "share/jupyter/labextensions/jupyterlab-param-binding",
                    rel_path,
                )
            data_files.append((install_path, file_paths))

    data_files.append(
        ("share/jupyter/labextensions/jupyterlab-param-binding", ["package.json"])
    )
    return data_files


setup(
    name="jupyterlab_param_binding",
    version="0.1.0",
    description="Generic Markdown-region parameter binding sidebar for JupyterLab notebooks",
    packages=["jupyterlab_param_binding"],
    data_files=get_data_files(),
    zip_safe=False,
)
