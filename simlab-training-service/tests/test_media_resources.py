from fastapi.testclient import TestClient
from simlab_training_service.app import create_app
from simlab_training_service.config import Settings
from simlab_training_service.db import Base, make_session_factory
from simlab_training_service.media_security import derive_content_key
from simlab_training_service.media_processing import VideoGeometry
from simlab_training_service.media_worker import process_next_job
from simlab_training_service.models import MediaResource, MediaTranscodeJob, utcnow


def make_client(tmp_path, **settings_overrides):
    session_factory, engine = make_session_factory("sqlite://", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    settings_values = {
        "database_url": "sqlite://",
        "storage_dir": str(tmp_path),
        "tutorial_admins": "yuan",
        "media_encrypted_hls_enabled": False,
        "media_legacy_content_enabled": True,
    }
    settings_values.update(settings_overrides)
    settings = Settings(**settings_values)
    app = create_app(
        settings=settings,
        session_factory=session_factory,
    )
    return TestClient(app)


def admin_headers():
    return {"X-JupyterHub-User": "yuan"}


def user_headers():
    return {"X-JupyterHub-User": "student1"}


def upload_video(client, *, title="第一章导入视频", filename="intro.mp4", content=b"fake-video-bytes"):
    return client.post(
        "/api/admin/media",
        data={"title": title},
        files={"file": (filename, content, "video/mp4")},
        headers=admin_headers(),
    )


def test_admin_can_upload_video_media_and_list_it(tmp_path):
    client = make_client(tmp_path)

    upload = upload_video(client)
    listing = client.get("/api/admin/media", headers=admin_headers())

    assert upload.status_code == 200
    payload = upload.json()
    assert payload["id"].startswith("vid_")
    assert payload["title"] == "第一章导入视频"
    assert payload["original_filename"] == "intro.mp4"
    assert payload["mime_type"] == "video/mp4"
    assert payload["file_size"] == len(b"fake-video-bytes")
    assert payload["status"] == "available"
    assert "object_key" not in payload

    assert listing.status_code == 200
    assert listing.json()[0]["id"] == payload["id"]
    assert listing.json()[0]["title"] == "第一章导入视频"


def test_admin_can_rename_media_resource(tmp_path):
    client = make_client(tmp_path)
    media = upload_video(client, title="旧标题").json()

    response = client.patch(
        f"/api/admin/media/{media['id']}",
        json={"title": "新标题"},
        headers=admin_headers(),
    )
    listing = client.get("/api/admin/media", headers=admin_headers())

    assert response.status_code == 200
    assert response.json()["title"] == "新标题"
    assert listing.json()[0]["title"] == "新标题"


def test_admin_can_delete_media_resource(tmp_path):
    client = make_client(tmp_path)
    media = upload_video(client, title="待删除视频").json()

    response = client.delete(f"/api/admin/media/{media['id']}", headers=admin_headers())
    listing = client.get("/api/admin/media", headers=admin_headers())

    assert response.status_code == 200
    assert listing.json() == []


def test_media_upload_requires_admin(tmp_path):
    client = make_client(tmp_path)

    response = client.post(
        "/api/admin/media",
        data={"title": "学生不能上传"},
        files={"file": ("intro.mp4", b"fake-video-bytes", "video/mp4")},
        headers=user_headers(),
    )

    assert response.status_code == 403


def test_media_upload_rejects_non_video_file(tmp_path):
    client = make_client(tmp_path)

    response = client.post(
        "/api/admin/media",
        data={"title": "错误文件"},
        files={"file": ("notes.txt", b"plain-text", "text/plain")},
        headers=admin_headers(),
    )

    assert response.status_code == 400
    assert "video" in response.text.lower()


def test_media_upload_uses_filename_when_title_is_blank(tmp_path):
    client = make_client(tmp_path)

    response = upload_video(client, title="", filename="heat-intro.mp4")

    assert response.status_code == 200
    assert response.json()["title"] == "heat-intro"


def test_logged_in_user_can_fetch_uploaded_media_content(tmp_path):
    client = make_client(tmp_path)
    media = upload_video(
        client,
        title="课程介绍",
        filename="intro.mp4",
        content=b"fake-video-bytes",
    ).json()

    response = client.get(
        f"/api/media/{media['id']}/content",
        headers=user_headers(),
    )

    assert response.status_code == 200
    assert response.content == b"fake-video-bytes"
    assert response.headers["content-type"].startswith("video/mp4")


def test_media_content_requires_login(tmp_path):
    client = make_client(tmp_path)
    media = upload_video(client).json()

    response = client.get(f"/api/media/{media['id']}/content")

    assert response.status_code == 401


def test_media_content_returns_404_for_missing_media(tmp_path):
    client = make_client(tmp_path)

    response = client.get(
        "/api/media/vid_missing/content",
        headers=user_headers(),
    )

    assert response.status_code == 404


def test_deleted_media_content_is_not_available(tmp_path):
    client = make_client(tmp_path)
    media = upload_video(client, title="待删除视频").json()
    client.delete(f"/api/admin/media/{media['id']}", headers=admin_headers())

    response = client.get(
        f"/api/media/{media['id']}/content",
        headers=user_headers(),
    )

    assert response.status_code == 404


def test_default_playback_descriptor_preserves_blob_mode(tmp_path):
    client = make_client(tmp_path)
    media = upload_video(client).json()

    response = client.post(f"/api/media/{media['id']}/playback", headers=user_headers())

    assert response.status_code == 200
    assert response.json() == {
        "mode": "blob",
        "content_url": f"/api/media/{media['id']}/content",
    }


def test_playback_descriptor_requires_login(tmp_path):
    client = make_client(tmp_path)
    media = upload_video(client).json()

    response = client.post(f"/api/media/{media['id']}/playback")

    assert response.status_code == 401


def test_encrypted_hls_manifest_key_and_segment_require_playback_token(tmp_path):
    master_key = "m" * 32
    playback_secret = "p" * 32
    client = make_client(
        tmp_path,
        media_encrypted_hls_enabled=True,
        media_master_key=master_key,
        media_playback_secret=playback_secret,
    )
    media_id = "vid_encrypted1"
    key_id = "a" * 32
    iv = "b" * 32
    original_path = tmp_path / "media" / media_id / "intro.mp4"
    original_path.parent.mkdir(parents=True)
    original_path.write_bytes(b"original-video")
    hls_dir = tmp_path / "encrypted-media" / media_id
    hls_dir.mkdir(parents=True)
    hls_dir.joinpath("index.m3u8").write_text(
        "#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"key/" + key_id + f"\",IV=0x{iv}\n"
        "#EXTINF:6.0,\nsegment_00000.ts\n#EXT-X-ENDLIST\n",
        encoding="utf-8",
    )
    hls_dir.joinpath("segment_00000.ts").write_bytes(b"encrypted-segment")
    now = utcnow()
    with client.app.state.session_factory() as db:
        db.add(MediaResource(
            id=media_id,
            title="加密视频",
            original_filename="intro.mp4",
            mime_type="video/mp4",
            file_size=len(b"original-video"),
            object_key=f"media/{media_id}/intro.mp4",
            file_sha256="0" * 64,
            hls_playlist_object_key=f"encrypted-media/{media_id}/index.m3u8",
            hls_key_id=key_id,
            hls_iv=iv,
            status="ready",
            created_by="yuan",
            created_at=now,
            updated_at=now,
        ))
        db.commit()

    playback = client.post(f"/api/media/{media_id}/playback", headers=user_headers())
    assert playback.status_code == 200
    descriptor = playback.json()
    assert descriptor["mode"] == "hls"
    assert descriptor["manifest_url"] == f"/api/media/{media_id}/hls/manifest.m3u8"
    token_headers = {"X-SimLab-Playback-Token": descriptor["playback_token"]}

    assert client.get(descriptor["manifest_url"]).status_code == 401
    manifest = client.get(descriptor["manifest_url"], headers=token_headers)
    key = client.get(f"/api/media/{media_id}/hls/key/{key_id}", headers=token_headers)
    segment = client.get(f"/api/media/{media_id}/hls/segment_00000.ts", headers=token_headers)

    assert manifest.status_code == 200
    assert manifest.headers["cache-control"] == "no-store"
    assert key.status_code == 200
    assert key.content == derive_content_key(master_key, media_id, key_id)
    assert key.headers["cache-control"] == "no-store"
    assert segment.status_code == 200
    assert segment.content == b"encrypted-segment"


def test_legacy_content_can_be_disabled_without_changing_admin_media_management(tmp_path):
    client = make_client(tmp_path, media_legacy_content_enabled=False)
    media = upload_video(client, title="仍可管理").json()

    listing = client.get("/api/admin/media", headers=admin_headers())
    content = client.get(f"/api/media/{media['id']}/content", headers=user_headers())

    assert listing.status_code == 200
    assert listing.json()[0]["title"] == "仍可管理"
    assert content.status_code == 404


def test_enabled_upload_queues_durable_multi_quality_hls_job(tmp_path, monkeypatch):
    def fake_run(command, _log_path, **_kwargs):
        playlist_path = tmp_path / command[-1]
        if command[-1].startswith("/"):
            from pathlib import Path
            playlist_path = Path(command[-1])
        segment_template = command[command.index("-hls_segment_filename") + 1].replace("%05d", "00000")
        from pathlib import Path
        segment_template = Path(segment_template)
        playlist_path.write_text(
            "#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"../key/test\"\n"
            "#EXTINF:6.0,\nsegment_00000.ts\n#EXT-X-ENDLIST\n",
            encoding="utf-8",
        )
        segment_template.write_bytes(b"encrypted-segment")

    monkeypatch.setattr("simlab_training_service.media_processing.shutil.which", lambda _value: "/usr/bin/ffmpeg")
    monkeypatch.setattr(
        "simlab_training_service.media_processing.probe_video",
        lambda *_args: VideoGeometry(1920, 1080),
    )
    monkeypatch.setattr("simlab_training_service.media_processing.run_ffmpeg", fake_run)
    client = make_client(
        tmp_path,
        media_encrypted_hls_enabled=True,
        media_master_key="m" * 32,
        media_playback_secret="p" * 32,
    )

    upload = upload_video(client, title="后台加密视频")
    media_id = upload.json()["id"]
    listing = client.get("/api/admin/media", headers=admin_headers())

    assert upload.status_code == 200
    assert upload.json()["status"] == "processing"
    assert listing.json()[0]["status"] == "processing"
    with client.app.state.session_factory() as db:
        job = db.query(MediaTranscodeJob).filter_by(media_id=media_id).one()
        assert job.status == "queued"

    assert process_next_job(
        client.app.state.settings,
        client.app.state.session_factory,
        client.app.state.storage,
        "test-worker",
    ) is True

    listing = client.get("/api/admin/media", headers=admin_headers())
    assert listing.json()[0]["status"] == "ready"
    assert listing.json()[0]["hls_ready"] is True
    assert listing.json()[0]["hls_transcode_version"] == 2
    with client.app.state.session_factory() as db:
        media = db.get(MediaResource, media_id)
        job = db.query(MediaTranscodeJob).filter_by(media_id=media_id).one()
        playlist_path = client.app.state.storage.path_for_object(media.hls_playlist_object_key)
        key_id = media.hls_key_id
        assert job.status == "completed"
    assert playlist_path.is_file()
    assert "480p/index.m3u8" in playlist_path.read_text(encoding="utf-8")
    assert "720p/index.m3u8" in playlist_path.read_text(encoding="utf-8")
    assert "1080p/index.m3u8" in playlist_path.read_text(encoding="utf-8")
    assert not list(playlist_path.parent.glob(".*key*"))

    playback = client.post(f"/api/media/{media_id}/playback", headers=user_headers()).json()
    token_headers = {"X-SimLab-Playback-Token": playback["playback_token"]}
    variant = client.get(f"/api/media/{media_id}/hls/720p/index.m3u8", headers=token_headers)
    segment = client.get(f"/api/media/{media_id}/hls/720p/segment_00000.ts", headers=token_headers)
    key = client.get(f"/api/media/{media_id}/hls/key/{key_id}", headers=token_headers)
    assert variant.status_code == 200
    assert variant.headers["cache-control"] == "no-store"
    assert segment.content == b"encrypted-segment"
    assert key.status_code == 200

    deleted = client.delete(f"/api/admin/media/{media_id}", headers=admin_headers())

    assert deleted.status_code == 200
    assert not (tmp_path / "encrypted-media" / media_id).exists()
