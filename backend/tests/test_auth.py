from app.auth import SESSION_COOKIE


def register(client, username="ingrid", password="secret-pass"):
    return client.post("/api/register", json={"username": username, "password": password})


def login(client, username="user", password="password"):
    return client.post("/api/login", json={"username": username, "password": password})


def test_register_creates_user_and_signs_in(client):
    response = register(client)
    assert response.status_code == 201
    assert response.json() == {"username": "ingrid"}
    assert client.get("/api/me").json() == {"username": "ingrid"}


def test_register_trims_username(client):
    assert register(client, username="  ingrid  ").json() == {"username": "ingrid"}


def test_register_duplicate_username_returns_409(client):
    register(client)
    assert register(client).status_code == 409
    assert register(client, username="INGRID").status_code == 409
    assert register(client, username="user").status_code == 409


def test_register_validates_input(client):
    assert register(client, password="short").status_code == 422
    assert register(client, username="   ").status_code == 422
    assert register(client, username="x" * 51).status_code == 422


def test_login_sets_session_cookie(client):
    response = login(client)
    assert response.status_code == 200
    assert response.json() == {"username": "user"}
    assert "httponly" in response.headers["set-cookie"].lower()
    assert client.get("/api/me").json() == {"username": "user"}


def test_login_is_case_insensitive_on_username(client):
    assert login(client, username="USER").json() == {"username": "user"}


def test_login_rejects_bad_credentials(client):
    assert login(client, password="wrong-password").status_code == 401
    assert login(client, username="nobody").status_code == 401
    assert SESSION_COOKIE not in client.cookies


def test_me_without_session_returns_401(client):
    assert client.get("/api/me").status_code == 401


def test_logout_invalidates_session(client):
    login(client)
    token = client.cookies[SESSION_COOKIE]
    assert client.post("/api/logout").status_code == 204
    assert client.get("/api/me").status_code == 401

    # The old token no longer works even if a client kept it.
    client.cookies.set(SESSION_COOKIE, token)
    assert client.get("/api/me").status_code == 401
