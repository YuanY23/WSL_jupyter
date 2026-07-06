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


def create_course_section_tutorial(client, *, publish_now=True, title="第一节", filename="1-1.ipynb"):
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
            "title": title,
            "notebook_filename": filename,
            "notebook_json": notebook(),
            "publish_now": publish_now,
        },
        headers=admin_headers(),
    ).json()
    return course, section, tutorial


def test_admin_course_tree_includes_drafts_and_notebook_filename(tmp_path):
    client = make_client(tmp_path)
    course, section, tutorial = create_course_section_tutorial(
        client,
        publish_now=False,
        title="压缩空气储能仿真",
        filename="1-1.ipynb",
    )

    admin_tree = client.get("/api/admin/courses", headers=admin_headers())
    public_tree = client.get("/api/courses", headers=user_headers())

    assert admin_tree.status_code == 200
    assert admin_tree.json()[0]["id"] == course["id"]
    assert admin_tree.json()[0]["sections"][0]["id"] == section["id"]
    assert admin_tree.json()[0]["sections"][0]["tutorials"][0]["public_id"] == tutorial["public_id"]
    assert admin_tree.json()[0]["sections"][0]["tutorials"][0]["status"] == "draft"
    assert admin_tree.json()[0]["sections"][0]["tutorials"][0]["notebook_filename"] == "1-1.ipynb"
    assert public_tree.json()[0]["sections"][0]["tutorials"] == []


def test_admin_can_rename_move_publish_and_update_notebook_filename(tmp_path):
    client = make_client(tmp_path)
    course, section, tutorial = create_course_section_tutorial(client, publish_now=False)
    target_section = client.post(
        "/api/admin/sections",
        json={"course_id": course["id"], "title": "第二章"},
        headers=admin_headers(),
    ).json()

    response = client.patch(
        f"/api/admin/tutorials/{tutorial['public_id']}",
        json={
            "section_id": target_section["id"],
            "title": "1-1 热力系统入门",
            "notebook_filename": "1-1.ipynb",
            "status": "published",
            "sort_order": 11,
        },
        headers=admin_headers(),
    )
    content = client.get(f"/api/tutorials/{tutorial['public_id']}/content", headers=user_headers()).json()
    public_tree = client.get("/api/courses", headers=user_headers()).json()

    assert response.status_code == 200
    assert response.json()["section_id"] == target_section["id"]
    assert response.json()["title"] == "1-1 热力系统入门"
    assert response.json()["notebook_filename"] == "1-1.ipynb"
    assert public_tree[0]["sections"][0]["tutorials"] == []
    assert public_tree[0]["sections"][1]["tutorials"][0]["title"] == "1-1 热力系统入门"
    assert public_tree[0]["sections"][1]["tutorials"][0]["notebook_filename"] == "1-1.ipynb"
    assert content["metadata"]["simlab_tutorial"]["title"] == "1-1 热力系统入门"
    assert content["metadata"]["simlab_tutorial"]["notebook_filename"] == "1-1.ipynb"


def test_archiving_tutorial_section_and_course_hides_public_content(tmp_path):
    client = make_client(tmp_path)
    course, section, tutorial = create_course_section_tutorial(client)

    tutorial_delete = client.delete(f"/api/admin/tutorials/{tutorial['public_id']}", headers=admin_headers())
    tutorial_public = client.get(f"/api/tutorials/{tutorial['public_id']}", headers=user_headers())

    assert tutorial_delete.status_code == 200
    assert tutorial_public.status_code == 404

    course, section, tutorial = create_course_section_tutorial(client, title="第二节", filename="1-2.ipynb")
    section_delete = client.delete(f"/api/admin/sections/{section['id']}", headers=admin_headers())
    section_public = client.get(f"/api/tutorials/{tutorial['public_id']}", headers=user_headers())

    assert section_delete.status_code == 200
    assert section_public.status_code == 404

    course, section, tutorial = create_course_section_tutorial(client, title="第三节", filename="1-3.ipynb")
    course_delete = client.delete(f"/api/admin/courses/{course['id']}", headers=admin_headers())
    course_public = client.get(f"/api/tutorials/{tutorial['public_id']}", headers=user_headers())

    assert course_delete.status_code == 200
    assert course_public.status_code == 404
