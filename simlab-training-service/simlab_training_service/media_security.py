from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass


class MediaSecurityError(ValueError):
    pass


@dataclass(frozen=True)
class PlaybackClaims:
    username: str
    media_id: str
    expires_at: int


def require_secret(value: str, name: str) -> bytes:
    encoded = value.encode("utf-8")
    if len(encoded) < 32:
        raise MediaSecurityError(f"{name} must contain at least 32 UTF-8 bytes")
    return encoded


def derive_content_key(master_key: str, media_id: str, key_id: str) -> bytes:
    secret = require_secret(master_key, "SIMLAB_MEDIA_MASTER_KEY")
    payload = f"simlab-media-v1\0{media_id}\0{key_id}".encode("utf-8")
    return hmac.new(secret, payload, hashlib.sha256).digest()[:16]


def issue_playback_token(
    secret_value: str,
    *,
    username: str,
    media_id: str,
    ttl_seconds: int,
    now: int | None = None,
) -> tuple[str, int]:
    secret = require_secret(secret_value, "SIMLAB_MEDIA_PLAYBACK_SECRET")
    issued_at = int(time.time()) if now is None else now
    expires_at = issued_at + max(60, ttl_seconds)
    payload = {
        "exp": expires_at,
        "iat": issued_at,
        "jti": secrets.token_urlsafe(12),
        "media_id": media_id,
        "sub": username,
        "v": 1,
    }
    encoded_payload = _base64url(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signature = _base64url(hmac.new(secret, encoded_payload.encode("ascii"), hashlib.sha256).digest())
    return f"{encoded_payload}.{signature}", expires_at


def verify_playback_token(
    secret_value: str,
    token: str,
    *,
    expected_media_id: str,
    now: int | None = None,
) -> PlaybackClaims:
    secret = require_secret(secret_value, "SIMLAB_MEDIA_PLAYBACK_SECRET")
    try:
        encoded_payload, supplied_signature = token.split(".", 1)
    except ValueError as exc:
        raise MediaSecurityError("Malformed playback token") from exc

    expected_signature = _base64url(
        hmac.new(secret, encoded_payload.encode("ascii"), hashlib.sha256).digest()
    )
    if not hmac.compare_digest(supplied_signature, expected_signature):
        raise MediaSecurityError("Invalid playback token signature")

    try:
        payload = json.loads(_base64url_decode(encoded_payload))
        media_id = str(payload["media_id"])
        username = str(payload["sub"])
        expires_at = int(payload["exp"])
        version = int(payload["v"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise MediaSecurityError("Invalid playback token payload") from exc

    if version != 1 or media_id != expected_media_id or not username:
        raise MediaSecurityError("Playback token does not match this media")
    current_time = int(time.time()) if now is None else now
    if expires_at <= current_time:
        raise MediaSecurityError("Playback token has expired")
    return PlaybackClaims(username=username, media_id=media_id, expires_at=expires_at)


def _base64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)
