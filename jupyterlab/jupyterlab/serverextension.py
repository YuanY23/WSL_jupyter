# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from jupyter_server.utils import url_path_join
from tornado.web import RedirectHandler


def load_jupyter_server_extension(serverapp):
    from .labapp import LabApp

    """Temporary server extension shim when using
    old notebook server.
    """
    extension = LabApp()
    extension.serverapp = serverapp
    extension.load_config_file()
    extension.update_config(serverapp.config)
    extension.parse_command_line(serverapp.extra_args)
    simlab_favicon_url = url_path_join(serverapp.base_url, "static/lab/jupyter-favicon.svg")
    simlab_logo_url = url_path_join(serverapp.base_url, "static/lab/jupyter.svg")
    extension.handlers.extend(
        [
            (
                r"/static/favicons/favicon.ico",
                RedirectHandler,
                {"url": simlab_favicon_url},
            ),
            (
                r"/static/favicons/favicon-busy-1.ico",
                RedirectHandler,
                {"url": simlab_favicon_url},
            ),
            (
                r"/static/favicons/favicon-busy-2.ico",
                RedirectHandler,
                {"url": simlab_favicon_url},
            ),
            (
                r"/static/favicons/favicon-busy-3.ico",
                RedirectHandler,
                {"url": simlab_favicon_url},
            ),
            (
                r"/static/favicons/favicon-file.ico",
                RedirectHandler,
                {"url": simlab_favicon_url},
            ),
            (
                r"/static/favicons/favicon-notebook.ico",
                RedirectHandler,
                {"url": simlab_favicon_url},
            ),
            (
                r"/static/favicons/favicon-terminal.ico",
                RedirectHandler,
                {"url": simlab_favicon_url},
            ),
            (
                r"/static/logo/logo.png",
                RedirectHandler,
                {"url": simlab_logo_url},
            ),
        ]
    )
    extension.initialize()
