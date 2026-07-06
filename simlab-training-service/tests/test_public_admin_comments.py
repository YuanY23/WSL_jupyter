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


def notebook():
    return {"cells": [], "metadata": {}, "nbformat": 4, "nbformat_minor": 5}


def test_admin_imports_tutorial_and_public_user_reads_it(tmp_path):
    client = make_client(tmp_path)

    course = client.post(
        "/api/admin/courses",
        json={"title": "课程一", "description": "基础培训", "sort_order": 1},
        headers=admin_headers(),
    ).json()
    section = client.post(
        "/api/admin/sections",
        json={"course_id": course["id"], "title": "第一章", "description": "入门", "sort_order": 1},
        headers=admin_headers(),
    ).json()
    imported = client.post(
        "/api/admin/tutorials/import",
        json={
            "course_id": course["id"],
            "section_id": section["id"],
            "title": "第一节",
            "description": "教程说明",
            "sort_order": 1,
            "version_label": "1.0",
            "import_note": "initial",
            "notebook_json": notebook(),
            "publish_now": True,
        },
        headers=admin_headers(),
    )

    assert imported.status_code == 200
    public_id = imported.json()["public_id"]
    courses = client.get("/api/courses", headers=user_headers()).json()
    content = client.get(f"/api/tutorials/{public_id}/content", headers=user_headers()).json()

    assert courses[0]["title"] == "课程一"
    assert courses[0]["sections"][0]["tutorials"][0]["public_id"] == public_id
    assert content["metadata"]["simlab_tutorial"]["tutorial_id"] == public_id


def test_comments_support_replies_likes_pinning_deletion_and_locking(tmp_path):
    client = make_client(tmp_path)
    course = client.post("/api/admin/courses", json={"title": "课程一"}, headers=admin_headers()).json()
    section = client.post(
        "/api/admin/sections",
        json={"course_id": course["id"], "title": "第一章"},
        headers=admin_headers(),
    ).json()
    tutorial = client.post(
        "/api/admin/tutorials/import",
        json={
            "course_id": course["id"],
            "section_id": section["id"],
            "title": "第一节",
            "notebook_json": notebook(),
        },
        headers=admin_headers(),
    ).json()
    public_id = tutorial["public_id"]

    comment = client.post(
        f"/api/tutorials/{public_id}/comments",
        json={"content": "这节课很有帮助"},
        headers=user_headers(),
    ).json()
    reply = client.post(
        f"/api/comments/{comment['id']}/replies",
        json={"content": "管理员回复"},
        headers=admin_headers(),
    )
    like = client.post(f"/api/comments/{comment['id']}/like", headers=user_headers())
    pin = client.post(f"/api/admin/comments/{comment['id']}/pin", headers=admin_headers())
    official = client.post(f"/api/admin/comments/{reply.json()['id']}/official", headers=admin_headers())
    comments_before_deletion = client.get(f"/api/tutorials/{public_id}/comments", headers=user_headers()).json()
    deleted = client.request(
        "DELETE",
        f"/api/admin/comments/{comment['id']}",
        json={"reason": "测试删除"},
        headers=admin_headers(),
    )
    lock = client.post(f"/api/admin/tutorials/{public_id}/lock-comments", headers=admin_headers())
    locked_comment = client.post(
        f"/api/tutorials/{public_id}/comments",
        json={"content": "锁定后不能发"},
        headers=user_headers(),
    )
    comments_after_deletion = client.get(f"/api/tutorials/{public_id}/comments", headers=user_headers()).json()

    assert reply.status_code == 200
    assert like.status_code == 200
    assert pin.status_code == 200
    assert official.status_code == 200
    assert deleted.status_code == 200
    assert lock.status_code == 200
    assert locked_comment.status_code == 423
    assert comments_before_deletion[0]["is_pinned"] is True
    assert comments_before_deletion[0]["like_count"] == 1
    assert comments_before_deletion[0]["replies"][0]["is_official"] is True
    assert comments_after_deletion == []


def test_deleted_comments_are_omitted_from_public_thread(tmp_path):
    client = make_client(tmp_path)
    course = client.post("/api/admin/courses", json={"title": "课程一"}, headers=admin_headers()).json()
    section = client.post(
        "/api/admin/sections",
        json={"course_id": course["id"], "title": "第一章"},
        headers=admin_headers(),
    ).json()
    tutorial = client.post(
        "/api/admin/tutorials/import",
        json={
            "course_id": course["id"],
            "section_id": section["id"],
            "title": "第一节",
            "notebook_json": notebook(),
        },
        headers=admin_headers(),
    ).json()
    public_id = tutorial["public_id"]

    deleted_top_level = client.post(
        f"/api/tutorials/{public_id}/comments",
        json={"content": "稍后删除的主评论"},
        headers=user_headers(),
    ).json()
    visible_comment = client.post(
        f"/api/tutorials/{public_id}/comments",
        json={"content": "保留的主评论"},
        headers=user_headers(),
    ).json()
    deleted_reply = client.post(
        f"/api/comments/{visible_comment['id']}/replies",
        json={"content": "稍后删除的回复"},
        headers=user_headers(),
    ).json()

    client.request(
        "DELETE",
        f"/api/admin/comments/{deleted_top_level['id']}",
        json={"reason": "隐藏主评论"},
        headers=admin_headers(),
    )
    client.request(
        "DELETE",
        f"/api/admin/comments/{deleted_reply['id']}",
        json={"reason": "隐藏回复"},
        headers=admin_headers(),
    )

    comments = client.get(f"/api/tutorials/{public_id}/comments", headers=user_headers()).json()

    assert [comment["id"] for comment in comments] == [visible_comment["id"]]
    assert comments[0]["content"] == "保留的主评论"
    assert comments[0]["replies"] == []
