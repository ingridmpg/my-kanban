import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def db_path(tmp_path, monkeypatch):
    path = tmp_path / "data" / "test.db"
    monkeypatch.setenv("DATABASE_PATH", str(path))
    return path


@pytest.fixture
def client(db_path):
    # Entering the context runs the lifespan: creates the DB and seeds the demo user.
    with TestClient(app) as client:
        yield client
