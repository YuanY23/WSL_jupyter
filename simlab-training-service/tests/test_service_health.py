from fastapi.testclient import TestClient

from simlab_training_service.app import create_app


def test_health_endpoint_reports_service_ok():
    client = TestClient(create_app())

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True, "service": "simlab-training"}


def test_health_endpoint_also_works_under_jupyterhub_service_prefix():
    client = TestClient(create_app())

    response = client.get("/services/simlab-training/api/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True, "service": "simlab-training"}
