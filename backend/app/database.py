import json
import sqlite3
from collections.abc import Iterator
from contextlib import closing
from pathlib import Path
from typing import Annotated

from fastapi import Depends, Request

from app.auth import hash_password

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boards (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    data       TEXT    NOT NULL,
    updated_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

DEFAULT_BOARD = (Path(__file__).parent / "default_board.json").read_text()
DEMO_USERNAME = "user"
DEMO_PASSWORD = "password"


def connect(path: Path) -> sqlite3.Connection:
    # One connection per request; FastAPI may open and use it on different threads.
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init(path: Path) -> None:
    """Create the database and tables if missing, and seed the demo account once."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with closing(connect(path)) as conn:
        conn.executescript(SCHEMA)
        if find_user(conn, DEMO_USERNAME) is None:
            create_user(conn, DEMO_USERNAME, hash_password(DEMO_PASSWORD))


def get_db(request: Request) -> Iterator[sqlite3.Connection]:
    with closing(connect(request.app.state.database_path)) as conn:
        yield conn


Db = Annotated[sqlite3.Connection, Depends(get_db)]


def create_user(conn: sqlite3.Connection, username: str, password_hash: str) -> int:
    """Create a user with the default board. Raises sqlite3.IntegrityError if taken."""
    with conn:
        user_id = conn.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, password_hash),
        ).lastrowid
        conn.execute(
            "INSERT INTO boards (user_id, data) VALUES (?, ?)", (user_id, DEFAULT_BOARD)
        )
    return user_id


def find_user(conn: sqlite3.Connection, username: str) -> sqlite3.Row | None:
    return conn.execute(
        "SELECT id, username, password_hash FROM users WHERE username = ?", (username,)
    ).fetchone()


def get_username(conn: sqlite3.Connection, user_id: int) -> str:
    return conn.execute("SELECT username FROM users WHERE id = ?", (user_id,)).fetchone()[0]


def get_board(conn: sqlite3.Connection, user_id: int) -> dict:
    row = conn.execute("SELECT data FROM boards WHERE user_id = ?", (user_id,)).fetchone()
    return json.loads(row[0])


def save_board(conn: sqlite3.Connection, user_id: int, data: dict) -> None:
    with conn:
        conn.execute(
            "UPDATE boards SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
            (json.dumps(data), user_id),
        )
