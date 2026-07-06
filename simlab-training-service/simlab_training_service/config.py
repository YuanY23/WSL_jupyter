from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str = os.environ.get(
        "SIMLAB_TRAINING_DATABASE_URL",
        "sqlite:///./simlab_training.db",
    )
    storage_dir: str = os.environ.get(
        "SIMLAB_TRAINING_STORAGE_DIR",
        "/srv/simlab/tutorials",
    )
    tutorial_admins: str = os.environ.get("SIMLAB_TUTORIAL_ADMINS", "yuan")
    jupyterhub_api_url: str = os.environ.get("JUPYTERHUB_API_URL", "")
    jupyterhub_api_token: str = os.environ.get("JUPYTERHUB_API_TOKEN", "")
    jupyterhub_service_prefix: str = os.environ.get(
        "JUPYTERHUB_SERVICE_PREFIX",
        "/services/simlab-training/",
    )

    @property
    def admin_users(self) -> set[str]:
        return {
            user.strip()
            for user in self.tutorial_admins.split(",")
            if user.strip()
        }
