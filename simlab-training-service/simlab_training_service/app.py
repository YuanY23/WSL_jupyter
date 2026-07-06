from __future__ import annotations

from fastapi import FastAPI

from .config import Settings
from .db import make_session_factory
from .routes_admin import router as admin_router
from .routes_media_admin import router as media_admin_router
from .routes_media_public import router as media_public_router
from .routes_public import router as public_router
from .storage import TutorialStorage


def create_app(*, settings: Settings | None = None, session_factory=None) -> FastAPI:
    app_settings = settings or Settings()
    app = FastAPI(title="SimLab Training Service")
    if session_factory is None:
        session_factory, _engine = make_session_factory(app_settings.database_url)
    app.state.settings = app_settings
    app.state.session_factory = session_factory
    app.state.storage = TutorialStorage(app_settings.storage_dir)

    @app.get("/api/health")
    @app.get(f"{app_settings.jupyterhub_service_prefix.rstrip('/')}/api/health")
    def health():
        return {"ok": True, "service": "simlab-training"}

    app.include_router(public_router)
    app.include_router(admin_router)
    app.include_router(media_admin_router)
    app.include_router(media_public_router)
    service_prefix = app_settings.jupyterhub_service_prefix.rstrip("/")
    if service_prefix:
        app.include_router(public_router, prefix=service_prefix)
        app.include_router(admin_router, prefix=service_prefix)
        app.include_router(media_admin_router, prefix=service_prefix)
        app.include_router(media_public_router, prefix=service_prefix)
    return app


app = create_app()
