from fastapi.testclient import TestClient

from simlab_training_service.app import create_app
from simlab_training_service.config import Settings
from simlab_training_service.db import Base, make_session_factory


def make_client(tmp_path):
    session_factory, engine = make_session_factory("sqlite://", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    app = create_app(
        settings=Settings(
            database_url="sqlite://",
            storage_dir=str(tmp_path),
            tutorial_admins="yuan",
        ),
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
