import pytest

from simlab_training_service.media_security import (
    MediaSecurityError,
    derive_content_key,
    issue_playback_token,
    verify_playback_token,
)


def test_content_keys_are_scoped_to_media_and_key_id():
    master = "master-secret-" * 3

    first = derive_content_key(master, "vid_one", "key_one")
    second = derive_content_key(master, "vid_two", "key_one")
    rotated = derive_content_key(master, "vid_one", "key_two")

    assert len(first) == 16
    assert first != second
    assert first != rotated


def test_playback_token_is_media_scoped_and_expires():
    secret = "playback-secret-" * 3
    token, expires_at = issue_playback_token(
        secret,
        username="student1",
        media_id="vid_one",
        ttl_seconds=600,
        now=1000,
    )

    claims = verify_playback_token(secret, token, expected_media_id="vid_one", now=1001)

    assert expires_at == 1600
    assert claims.username == "student1"
    with pytest.raises(MediaSecurityError, match="does not match"):
        verify_playback_token(secret, token, expected_media_id="vid_two", now=1001)
    with pytest.raises(MediaSecurityError, match="expired"):
        verify_playback_token(secret, token, expected_media_id="vid_one", now=1600)


def test_playback_token_rejects_tampering():
    secret = "playback-secret-" * 3
    token, _expires_at = issue_playback_token(
        secret,
        username="student1",
        media_id="vid_one",
        ttl_seconds=600,
        now=1000,
    )

    with pytest.raises(MediaSecurityError, match="signature"):
        verify_playback_token(secret, token + "x", expected_media_id="vid_one", now=1001)
