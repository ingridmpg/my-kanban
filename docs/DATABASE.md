# Database

SQLite, accessed with Python's built-in `sqlite3` module (no ORM). Two tables: `users` and `boards`. Sessions are not stored in the database (they live in memory, see `docs/PLAN.md`).

## Schema

```sql
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
```

```
users 1 ──── 1 boards
```

- `username` is unique and case-insensitive (`COLLATE NOCASE`), so `Ingrid` and `ingrid` cannot both exist. It is trimmed before saving; 1 to 50 characters.
- `boards.user_id` is `UNIQUE`, which enforces 1 board per user at the database level. Removing this constraint later is all it takes to allow several boards per user.
- `ON DELETE CASCADE` removes a user's board with the user. SQLite only enforces foreign keys when `PRAGMA foreign_keys = ON` is set, which is done on every connection.
- Timestamps are UTC, stored as ISO text (`YYYY-MM-DD HH:MM:SS`), SQLite's native format. `updated_at` is set explicitly on every board update.

## Board data as JSON

`boards.data` holds the whole board as JSON, in the same shape as `BoardData` in `frontend/src/lib/kanban.ts`:

```json
{
  "columns": [{ "id": "col-backlog", "title": "Backlog", "cardIds": ["card-1"] }],
  "cards": { "card-1": { "id": "card-1", "title": "...", "details": "..." } }
}
```

Why JSON instead of `columns` and `cards` tables:

- The API reads and writes the board as a whole (`GET` / `PUT /api/board`), so a single row read or write is all that is needed.
- The frontend already uses this shape, so there is no mapping layer in either direction.
- Order of cards is part of the data (`cardIds`), which would otherwise need position columns and reordering logic.
- The app never queries individual cards (no search, no filtering across boards).

Trade-offs, acceptable for the MVP: no per-card queries in SQL, and two tabs editing the same board at once means the last save wins. If either becomes a problem, the JSON can be split into tables without changing the API.

Before saving, `PUT /api/board` validates the body with Pydantic (`Board`, `Column`, `Card`) and checks it is consistent; otherwise it returns 422:

- column ids are the same as in the stored board (columns are fixed: they can be renamed, not added or removed);
- every id in a column's `cardIds` exists in `cards`, and every card appears in exactly one column.

## Passwords

Hashed with `hashlib.scrypt` from the standard library, so no extra dependency:

- A random 16-byte salt per user (`os.urandom`).
- Parameters `n=2**17, r=8, p=1` (OWASP's recommended minimum for scrypt), 64-byte key. They need about 128 MB per hash, above Python's default limit, so `maxmem=2**28` is passed. Measured in the container: about 0.7 s per hash, which is the intended cost of a sign in or sign up.
- Stored as one string that carries its own parameters, so they can be raised later without breaking existing users: `scrypt$131072$8$1$<salt hex>$<hash hex>`.
- Verified with `hmac.compare_digest` (constant-time comparison).

Login returns the same 401 for an unknown user and a wrong password, so it does not reveal which usernames exist. Sign up does reveal it (409 when taken), which is unavoidable for a sign up form.

## Creation and seeding

- The database file is `/app/data/my-kanban.db`. The path comes from the `DATABASE_PATH` environment variable with that default, so tests can point it to a temporary file.
- `/app/data` is a named Docker volume (`my-kanban-data`), mounted by `scripts/start.*`, so the database survives container restarts and image rebuilds. `scripts/stop.*` keep the volume; deleting it (`docker volume rm my-kanban-data`) resets all data.
- On startup (FastAPI `lifespan`), the backend creates the directory and the tables if missing (`CREATE TABLE IF NOT EXISTS`). If no user named `user` exists, it creates the demo account `user` / `password` with the default board. Restarting never duplicates or resets it.
- The default board (the 5 columns and 8 demo cards now in `initialData`) moves to the backend as `backend/app/default_board.json`. It is the starting board for the demo account and for every new sign up. `initialData` is removed from the frontend in Part 6.
- Sign up creates the user row and its board row in one transaction, so there is never a user without a board.

## Migrations

None for the MVP: the schema is created if missing and not changed afterwards. If the schema changes during development, delete the volume to start fresh. A migration tool is only worth adding once there is data that must be kept.
