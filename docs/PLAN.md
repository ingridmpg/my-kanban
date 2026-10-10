# Plan

Work proceeds part by part. Each part has a checklist (checked off as work is done), the tests to write, and success criteria. A part is only done when all its tests pass. Parts 1 and 4 require explicit user sign-off.

## Key decisions

- **Single container, single port.** FastAPI serves the API under `/api/*` and the statically exported Next.js build (`output: "export"`) at `/`. The app runs on `http://localhost:8000`.
- **Docker build.** Multi-stage `Dockerfile` at the repo root: a Node (current LTS) stage runs `npm ci && npm run build` to produce `frontend/out/`; a Python (latest stable, slim) stage installs `backend/requirements.txt` with pip and copies the backend code plus the exported frontend.
- **Backend tests.** `pytest` runs inside the image: `docker run --rm my-kanban pytest`. `pytest` and `httpx2` (needed by FastAPI's `TestClient`) are listed in the same `requirements.txt`.
- **Frontend tests.** Unit tests (Vitest) run locally with mocked `fetch`. From Part 3 on, Playwright e2e tests run against the running container at `http://localhost:8000` (same origin for UI and API, no CORS or proxy setup needed).
- **Scripts.** `scripts/start.sh` / `scripts/stop.sh` for Mac and Linux, `scripts/start.ps1` / `scripts/stop.ps1` for Windows. Start builds the image and runs the container in the background; stop stops and removes it.
- **Database location.** SQLite file at `/app/data/my-kanban.db` inside the container, on a named Docker volume so data survives restarts. Created on startup if missing.
- **Accounts.** Users sign up with a unique username and a password (minimum 8 characters). Passwords are hashed with `hashlib.scrypt` (standard library). A demo account `user` / `password` is seeded with the database.
- **Sessions.** `POST /api/login` checks the credentials against the database and sets an HttpOnly cookie with a random session token kept in an in-memory dict on the backend. Restarting the container logs users out, which is acceptable for the MVP.
- **Board persistence.** The board is read and written as a whole (`GET` / `PUT /api/board`) using the same JSON shape as `BoardData` in `frontend/src/lib/kanban.ts`.

## Part 1: Plan

- [x] Enrich this document with a checklist, tests and success criteria for each part
- [x] Create `frontend/AGENTS.md` describing the existing frontend code
- [x] User reviews and approves this plan

Success criteria: user approval.

## Part 2: Scaffolding

- [x] `backend/app/main.py`: FastAPI app with `GET /api/health` returning `{"status": "ok"}` and a static `index.html` "hello world" page served at `/`
- [x] `backend/requirements.txt` with pinned versions (fastapi, uvicorn, pytest, httpx2)
- [x] `Dockerfile` (Python stage only for now) and `.dockerignore`
- [x] `scripts/start.sh`, `scripts/stop.sh`, `scripts/start.ps1`, `scripts/stop.ps1`
- [x] Update `backend/AGENTS.md` and `scripts/AGENTS.md`

Tests:
- Backend: `/api/health` returns 200 and `{"status": "ok"}`; `/` returns the hello world HTML.

Success criteria: on Windows, `scripts/start.ps1` builds and starts the container; `http://localhost:8000` shows hello world and `http://localhost:8000/api/health` returns ok; `scripts/stop.ps1` stops it; backend tests pass inside the container.

## Part 3: Add in Frontend

- [x] Update frontend dependencies to their latest versions and resolve `npm audit` findings (`npm ci` on 2026-10-08 reported 27 vulnerabilities: 1 low, 4 moderate, 18 high, 4 critical). As of 2026-10-09, `npm audit --omit=dev` is clean; 5 high remain in dev-only lint tooling (`eslint-config-next` -> `fast-glob` -> `micromatch` -> `braces@3.0.3`, the latest `braces` release, so no fix exists yet); the user accepted this exception on 2026-10-09. ESLint stays on 9.x and TypeScript on 6.0.x because the plugins in `eslint-config-next` and `typescript-eslint` do not support ESLint 10 or TypeScript 7 yet.
- [x] Set `output: "export"` in `frontend/next.config.ts`
- [x] Add the Node build stage to the `Dockerfile` and serve `frontend/out/` at `/` from FastAPI (replacing the hello world page)
- [x] Add card editing: an "Edit" action on each card opens an inline form with title and details, with Save and Cancel; title is required
- [x] Install the Playwright Chromium browser locally (`npx playwright install chromium`; not installed as of 2026-10-08)
- [x] Make the Playwright base URL configurable so e2e tests run against the container (`http://localhost:8000`)
- [x] Update `frontend/AGENTS.md`

Tests:
- Unit: edit a card (title and details change); cancel leaves the card unchanged; empty title is not saved. Existing tests keep passing after the dependency update.
- `npm audit` reports no high or critical vulnerabilities.
- E2E (against the container): board loads at `/` with 5 columns; add, edit, remove a card; rename a column; drag a card between columns.
- Backend: `/` returns the exported `index.html`; static assets are served.

Success criteria: the demo board is fully usable at `http://localhost:8000` from the container, including card editing; all unit, e2e and backend tests pass.

## Part 4: Database modeling

- [x] Propose the schema in `docs/DATABASE.md`. Starting proposal:
  - `users`: `id`, `username` (unique), `password_hash`, `created_at`
  - `boards`: `id`, `user_id` (unique FK to `users`, enforcing 1 board per user), `data` (board JSON in the `BoardData` shape), `updated_at`
- [x] Document how the DB is created on startup, how the demo `user` account and its board are seeded, how a new user's board is created on sign up, how passwords are hashed, and why the board is stored as JSON
- [x] User reviews and signs off (approved 2026-10-10)

Success criteria: user approval of `docs/DATABASE.md`.

## Part 5: Backend

- [x] Create the SQLite DB and tables on startup if missing; seed the demo `user` / `password` account and its default board (the current demo data)
- [x] Password hashing with `hashlib.scrypt` from the standard library (random salt per user, constant-time comparison); no extra dependency
- [x] `POST /api/register`: creates the user and their default board, then signs them in; 409 if the username is taken, 422 if the password is shorter than 8 characters or the username is empty
- [x] `POST /api/login` (checks the DB, sets the session cookie, 401 on bad credentials), `POST /api/logout` (clears the session), `GET /api/me` (current username or 401)
- [x] Pydantic models matching `BoardData` (`Card`, `Column`, `Board`)
- [x] `GET /api/board`: returns the signed-in user's board
- [x] `PUT /api/board`: validates and replaces the signed-in user's board
- [x] Routes stay thin; DB access and auth in their own modules; DB connection injected with `Depends` (see `backend/AGENTS.md`)
- [x] Update `backend/AGENTS.md`

Tests (each test uses its own temporary DB):
- DB is created when the file does not exist, and reused when it does; the demo user is seeded once.
- Passwords are stored hashed, never in plain text.
- Register creates a user with the default board and signs them in; duplicate username returns 409; short password returns 422.
- Valid login sets the cookie and `/api/me` returns the user; wrong password and unknown user return 401; `/api/me` without cookie returns 401; logout invalidates the session.
- `GET /api/board` returns the default board for a new user; `PUT` then `GET` returns the updated board; `PUT` with an invalid body returns 422.
- Board routes return 401 without a session.
- Boards of two different users are independent.

Success criteria: all backend tests pass inside the container; users and board data survive a container restart.

## Part 6: Frontend + Backend

- [x] On load, call `/api/me`; show the sign in screen if not signed in, otherwise the board
- [x] Sign in screen with a toggle between "Sign in" and "Create account"; uses the color scheme (purple submit button) and shows the error from the API (bad credentials, username taken, password too short)
- [x] "Log out" button on the board
- [x] `KanbanBoard` loads the board from `GET /api/board` instead of `initialData`, with a simple loading state
- [x] Every change (move, add, edit, delete card, rename column) sends the full board with `PUT /api/board`; column rename is saved on blur, not on each keystroke
- [x] Remove `initialData` from the frontend (the default board now comes from the backend)
- [x] Update `frontend/AGENTS.md` and the root `CLAUDE.md` architecture section

Tests:
- Unit (mocked `fetch`): sign in form submits credentials, shows the error on 401, shows the board on success; create account shows the error on 409 and 422; board renders the data returned by the API; each action triggers a `PUT` with the expected board.
- E2E (against the container): visiting `/` shows the sign in screen; wrong password shows an error; the demo account signs in and sees the board; a new account can be created and gets its own default board; changes of one user are not visible to another; each action (add, edit, delete, move card, rename column) survives a page reload; changes survive logging out and back in and a container restart; log out returns to the sign in screen.

Note: the container restart is not part of the e2e suite (Playwright cannot restart the container); it is covered by `test_data_survives_a_restart` in the backend and was checked by hand against the real container in Part 5. Drag and drop is covered by e2e only (the pointer sensor does not run in jsdom).

Success criteria: the app at `http://localhost:8000` supports sign up and sign in with a persistent board per user; all unit, e2e and backend tests pass.

## Part 7: Adjustments

- [x] New accounts start with an empty board (the 5 columns, no cards); the demo account keeps the sample cards (`backend/app/demo_board.json`). This replaces "new users get the default board" in Parts 5 and 6.
- [x] Cards use a single column: title and details full width, actions below
- [x] Edit and delete buttons replaced by icons (inline SVG, keeping their accessible labels)
- [x] Candy color palette (see the color scheme in `AGENTS.md`), with CSS variables renamed by role; one pastel per column
- [x] Sign in screen shows the demo account (`user` / `password`) with a "Use demo account" button, so visitors can try the app without signing up. Trade-off: the demo board is shared by every visitor.
- [x] Fix: a card dropped into an empty column landed in the neighbouring column when columns were tall (`closestCorners` measured distance to the far-away corners of the tall column). Drops now use what is under the pointer (`pointerWithin`), with `closestCorners` as fallback.
- [x] Fix: the target column is highlighted while dragging, also when the pointer is over one of its cards (it was only highlighted over its empty space)
- [x] "Add a card" is a "+" icon at the top of each column; the form opens there and new cards are added at the top of the column
- [x] "One board. Five columns. Zero clutter." in plum (`--heading`) instead of blueberry, which read as a link
- [x] Grab cursor on cards (grabbing while dragging) and pointer cursor on every button
- [x] Update `AGENTS.md`, `CLAUDE.md`, `frontend/AGENTS.md`, `backend/AGENTS.md` and `docs/DATABASE.md`

Tests:
- Backend: the demo account gets the demo board; a new account gets the empty board.
- E2E: dropping into an empty column works and highlights it while the columns are tall (fails on the old collision detection); a new account starts with no cards; edit, delete, move and persistence tests add their own cards first; the demo account signs in from the hint and shows its sample cards.
- Unit: the demo hint fills in the fields and only shows when signing in; existing tests keep passing (the icon buttons keep the "Edit <title>" / "Delete <title>" labels).

Success criteria: all unit, e2e and backend tests pass; the new look checked with screenshots of the sign in screen, the board, a card and the edit form.
