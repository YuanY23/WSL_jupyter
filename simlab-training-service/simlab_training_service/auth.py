from __future__ import annotations

from dataclasses import dataclass
import re

from fastapi import HTTPException, Request, status
import requests


@dataclass(frozen=True)
class CurrentUser:
    username: str
    is_admin: bool


AUTHORIZATION_TOKEN_RE = re.compile(r"^(?:token|bearer)\s+(.+)$", re.IGNORECASE)


def get_current_user(request: Request) -> CurrentUser:
    settings = request.app.state.settings
    token = token_from_authorization_header(request.headers.get("Authorization", ""))
    if token and settings.jupyterhub_api_url:
        return verified_hub_user(settings, token)

    if settings.jupyterhub_api_url:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JupyterHub authorization token is required",
        )

    username = request.headers.get("X-JupyterHub-User", "").strip()
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JupyterHub user header is required",
        )
    return CurrentUser(username=username, is_admin=username in settings.admin_users)


def require_admin(request: Request) -> CurrentUser:
    user = get_current_user(request)
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tutorial administrator permission is required",
        )
    return user


def token_from_authorization_header(header_value: str) -> str:
    match = AUTHORIZATION_TOKEN_RE.match(header_value.strip())
    if not match:
        return ""
    return match.group(1).strip()


def verified_hub_user(settings, token: str) -> CurrentUser:
    url = settings.jupyterhub_api_url.rstrip("/") + "/user"
    try:
        response = requests.get(
            url,
            headers={"Authorization": f"token {token}"},
            timeout=5,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to verify JupyterHub token: {exc}",
        ) from exc

    if response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JupyterHub authorization token is invalid",
        )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"JupyterHub token verification failed: {response.status_code} {response.text}",
        )

    payload = response.json()
    username = str(payload.get("name", "")).strip()
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JupyterHub token response did not include a user name",
        )
    return CurrentUser(username=username, is_admin=username in settings.admin_users)
