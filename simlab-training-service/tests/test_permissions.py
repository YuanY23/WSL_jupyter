from fastapi.testclient import TestClient
import requests

from simlab_training_service.app import create_app
from simlab_training_service.config import Settings


def make_client(admins="yuan", jupyterhub_api_url=""):
    settings = Settings(tutorial_admins=admins, jupyterhub_api_url=jupyterhub_api_url)
    return TestClient(create_app(settings=settings))


class HubResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = str(self._payload)

    def json(self):
        return self._payload


def test_me_requires_jupyterhub_user_header():
    response = make_client().get("/api/me")

    assert response.status_code == 401


def test_me_marks_ordinary_user_as_non_admin():
    response = make_client().get("/api/me", headers={"X-JupyterHub-User": "student1"})

    assert response.status_code == 200
    assert response.json() == {"username": "student1", "is_admin": False}


def test_me_marks_configured_admin_user_as_admin():
    response = make_client().get("/api/me", headers={"X-JupyterHub-User": "yuan"})

    assert response.status_code == 200
    assert response.json() == {"username": "yuan", "is_admin": True}


def test_me_uses_verified_jupyterhub_token(monkeypatch):
    def fake_get(url, headers, timeout):
        assert url == "http://hub.example/hub/api/user"
        assert headers == {"Authorization": "token verified-user-token"}
        assert timeout == 5
        return HubResponse(payload={"name": "yuan"})

    monkeypatch.setattr(requests, "get", fake_get)

    response = make_client(jupyterhub_api_url="http://hub.example/hub/api").get(
        "/api/me",
        headers={"Authorization": "token verified-user-token"},
    )

    assert response.status_code == 200
    assert response.json() == {"username": "yuan", "is_admin": True}


def test_verified_jupyterhub_token_takes_precedence_over_spoofed_user_header(monkeypatch):
    def fake_get(url, headers, timeout):
        return HubResponse(payload={"name": "student1"})

    monkeypatch.setattr(requests, "get", fake_get)

    response = make_client(jupyterhub_api_url="http://hub.example/hub/api").get(
        "/api/me",
        headers={
            "Authorization": "token student-token",
            "X-JupyterHub-User": "yuan",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"username": "student1", "is_admin": False}


def test_admin_endpoint_rejects_ordinary_user():
    response = make_client().post(
        "/api/admin/courses",
        json={"title": "课程一", "description": "公开培训课程", "sort_order": 1},
        headers={"X-JupyterHub-User": "student1"},
    )

    assert response.status_code == 403
