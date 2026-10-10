import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.staticfiles import StaticFiles

from app import auth, database
from app.auth import CurrentUserId, Sessions, SessionToken
from app.database import Db
from app.models import Board, Credentials, NewAccount, User, check_board_update

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
DEFAULT_DATABASE_PATH = "/app/data/my-kanban.db"


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.database_path = Path(os.environ.get("DATABASE_PATH", DEFAULT_DATABASE_PATH))
    database.init(app.state.database_path)
    app.state.sessions = {}
    yield


app = FastAPI(title="My Kanban", lifespan=lifespan)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(account: NewAccount, response: Response, db: Db, sessions: Sessions) -> User:
    try:
        user_id = database.create_user(
            db, account.username, auth.hash_password(account.password), database.EMPTY_BOARD
        )
    except sqlite3.IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
    auth.start_session(response, sessions, user_id)
    return User(username=account.username)


@app.post("/api/login")
def login(credentials: Credentials, response: Response, db: Db, sessions: Sessions) -> User:
    user = database.find_user(db, credentials.username)
    if user is None or not auth.verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")
    auth.start_session(response, sessions, user["id"])
    return User(username=user["username"])


@app.post("/api/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, sessions: Sessions, token: SessionToken = None) -> None:
    auth.end_session(response, sessions, token)


@app.get("/api/me")
def me(user_id: CurrentUserId, db: Db) -> User:
    return User(username=database.get_username(db, user_id))


@app.get("/api/board")
def get_board(user_id: CurrentUserId, db: Db) -> Board:
    return Board.model_validate(database.get_board(db, user_id))


@app.put("/api/board")
def put_board(board: Board, user_id: CurrentUserId, db: Db) -> Board:
    current = Board.model_validate(database.get_board(db, user_id))
    try:
        check_board_update(current, board)
    except ValueError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error))
    database.save_board(db, user_id, board.model_dump(by_alias=True))
    return board


# Mounted last so it does not shadow the /api routes.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
