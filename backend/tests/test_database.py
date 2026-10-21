import sqlite3

from fastapi.testclient import TestClient

from app.main import app


def query(db_path, sql):
    with sqlite3.connect(db_path) as conn:
        return conn.execute(sql).fetchall()


def test_database_is_created_when_missing(db_path):
    assert not db_path.exists()
    with TestClient(app):
        pass
    assert db_path.exists()
    assert query(db_path, "SELECT username FROM users") == [("user",)]
    assert query(db_path, "SELECT COUNT(*) FROM boards") == [(1,)]


def test_existing_database_is_reused_and_demo_user_seeded_once(db_path):
    with TestClient(app) as client:
        client.post("/api/register", json={"username": "ingrid", "password": "secret-pass"})
    with TestClient(app):
        pass
    assert query(db_path, "SELECT username FROM users ORDER BY id") == [("user",), ("ingrid",)]


def test_passwords_are_stored_hashed(client, db_path):
    client.post("/api/register", json={"username": "ingrid", "password": "secret-pass"})
    hashes = [row[0] for row in query(db_path, "SELECT password_hash FROM users")]
    assert len(hashes) == 2
    for stored in hashes:
        assert stored.startswith("scrypt$")
        assert "secret-pass" not in stored
        assert "password" not in stored


def rename_first_column(client, username, password, title):
    client.post("/api/login", json={"username": username, "password": password})
    board = client.get("/api/board").json()
    board["columns"][0]["title"] = title
    client.put("/api/board", json=board)


def first_column_title(client, username, password):
    client.post("/api/login", json={"username": username, "password": password})
    return client.get("/api/board").json()["columns"][0]["title"]


def test_data_survives_a_restart(db_path):
    with TestClient(app) as client:
        client.post("/api/register", json={"username": "ingrid", "password": "secret-pass"})
        rename_first_column(client, "ingrid", "secret-pass", "Ideas")

    # A new lifespan is a restart: sessions are gone, data is not.
    with TestClient(app) as client:
        assert client.get("/api/board").status_code == 401
        assert first_column_title(client, "ingrid", "secret-pass") == "Ideas"


def test_demo_board_is_reset_on_restart(db_path):
    with TestClient(app) as client:
        rename_first_column(client, "user", "password", "Vandalized")
        assert first_column_title(client, "user", "password") == "Vandalized"

    with TestClient(app) as client:
        assert first_column_title(client, "user", "password") == "Backlog"
