import re

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_serves_exported_frontend():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "My Kanban" in response.text


def test_static_assets_are_served():
    html = client.get("/").text
    script = re.search(r'src="(/_next/static/[^"]+\.js)"', html).group(1)
    response = client.get(script)
    assert response.status_code == 200
    assert "javascript" in response.headers["content-type"]
