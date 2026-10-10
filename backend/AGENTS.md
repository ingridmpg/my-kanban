# Backend

Python FastAPI app. Runs only inside the Docker container (see the root `Dockerfile`); there is no local Python setup.

## Structure

- `app/main.py`: FastAPI app and thin routes under `/api`. The `lifespan` creates the database (path from `DATABASE_PATH`, default `/app/data/my-kanban.db`) and the in-memory session store. The `static/` directory is mounted at `/` last, so it never shadows `/api` routes.
  - `GET /api/health`
  - `POST /api/register` (201; 409 if the username is taken, case-insensitive; 422 if invalid), `POST /api/login` (401 on bad credentials), `POST /api/logout` (204), `GET /api/me`. Register and login set an HttpOnly `session` cookie.
  - `GET /api/board`, `PUT /api/board` (full board; 422 if invalid or inconsistent). Return 401 without a session.
- `app/auth.py`: scrypt password hashing (`hash_password`, `verify_password`), in-memory sessions (`start_session`, `end_session`) and the `CurrentUserId` dependency.
- `app/database.py`: SQLite access with `sqlite3` (no ORM). `init` creates the tables and seeds the demo account `user` / `password` once; `get_db` / `Db` gives each request its own connection. Schema and design in `docs/DATABASE.md`.
- `app/models.py`: Pydantic models. `Board` / `Column` / `Card` mirror `BoardData` in `frontend/src/lib/kanban.ts` (`cardIds` via alias). `check_board_update` enforces fixed columns and that every card is in exactly one column.
- `app/demo_board.json`: the demo account's board (5 columns, 8 sample cards). New sign ups get `EMPTY_BOARD` from `app/database.py`: the same columns with no cards.
- `static/`: served at `/`. Not in the repo: the `Dockerfile` copies the exported Next.js build (`frontend/out/`) here.
- `tests/`: pytest tests using FastAPI's `TestClient`. The `client` fixture in `conftest.py` points `DATABASE_PATH` at a temporary file and enters the app lifespan, so each test gets a fresh database. `pytest.ini` puts the backend root on the Python path. Password hashing takes ~0.7 s, so the suite takes ~20 s.
- `requirements.txt`: all dependencies, including test ones, with pinned versions.

## Commands

From the repo root:

```bash
docker build -t my-kanban .
docker run --rm my-kanban pytest          # backend tests
```

## Architecture

Follow SOLID principles pragmatically, without over-engineering:

- Single responsibility: keep HTTP routes, business logic and database access in separate modules. Routes stay thin.
- Dependency inversion: inject dependencies (e.g. the database session) with FastAPI `Depends` instead of importing globals, so they can be swapped in tests.
- Only add an abstraction (interface, base class, repository layer) when there is a real second implementation or a concrete testing need. Plain functions and modules are preferred over classes when they suffice.
