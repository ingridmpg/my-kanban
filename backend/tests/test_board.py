import json
from pathlib import Path

import pytest

DEFAULT_BOARD = json.loads(
    (Path(__file__).parent.parent / "app" / "default_board.json").read_text()
)


@pytest.fixture
def signed_in(client):
    client.post("/api/login", json={"username": "user", "password": "password"})
    return client


def test_board_routes_require_session(client):
    assert client.get("/api/board").status_code == 401
    assert client.put("/api/board", json=DEFAULT_BOARD).status_code == 401


def test_new_user_gets_default_board(client):
    client.post("/api/register", json={"username": "ingrid", "password": "secret-pass"})
    assert client.get("/api/board").json() == DEFAULT_BOARD


def test_put_then_get_returns_updated_board(signed_in):
    board = signed_in.get("/api/board").json()
    board["columns"][0]["title"] = "Ideas"
    board["cards"]["card-1"]["title"] = "Edited"
    card_id = board["columns"][0]["cardIds"].pop(0)
    board["columns"][1]["cardIds"].append(card_id)

    response = signed_in.put("/api/board", json=board)
    assert response.status_code == 200
    assert response.json() == board
    assert signed_in.get("/api/board").json() == board


def test_put_with_invalid_body_returns_422(signed_in):
    assert signed_in.put("/api/board", json={"columns": "nope"}).status_code == 422

    board = signed_in.get("/api/board").json()
    board["cards"]["card-1"]["title"] = ""
    assert signed_in.put("/api/board", json=board).status_code == 422


def test_put_rejects_changed_columns(signed_in):
    board = signed_in.get("/api/board").json()
    board["columns"].append({"id": "col-new", "title": "New", "cardIds": []})
    assert signed_in.put("/api/board", json=board).status_code == 422

    board = signed_in.get("/api/board").json()
    board["columns"].pop()
    assert signed_in.put("/api/board", json=board).status_code == 422


def test_put_rejects_inconsistent_cards(signed_in):
    board = signed_in.get("/api/board").json()
    board["columns"][0]["cardIds"].append("card-missing")
    assert signed_in.put("/api/board", json=board).status_code == 422

    board = signed_in.get("/api/board").json()
    board["columns"][1]["cardIds"].append(board["columns"][0]["cardIds"][0])
    assert signed_in.put("/api/board", json=board).status_code == 422

    board = signed_in.get("/api/board").json()
    board["columns"][0]["cardIds"].pop(0)
    assert signed_in.put("/api/board", json=board).status_code == 422

    board = signed_in.get("/api/board").json()
    board["cards"]["card-1"]["id"] = "card-other"
    assert signed_in.put("/api/board", json=board).status_code == 422

    assert signed_in.get("/api/board").json() == DEFAULT_BOARD


def test_boards_of_different_users_are_independent(signed_in):
    board = signed_in.get("/api/board").json()
    board["columns"][0]["title"] = "Demo user column"
    signed_in.put("/api/board", json=board)
    signed_in.post("/api/logout")

    signed_in.post("/api/register", json={"username": "ingrid", "password": "secret-pass"})
    assert signed_in.get("/api/board").json() == DEFAULT_BOARD
    other = signed_in.get("/api/board").json()
    other["columns"][0]["title"] = "Ingrid column"
    signed_in.put("/api/board", json=other)
    signed_in.post("/api/logout")

    signed_in.post("/api/login", json={"username": "user", "password": "password"})
    assert signed_in.get("/api/board").json()["columns"][0]["title"] == "Demo user column"
