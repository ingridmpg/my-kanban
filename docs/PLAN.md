# Plan

Work proceeds part by part. Each part has a checklist (checked off as work is done), the tests to write, and success criteria. A part is only done when all its tests pass. Parts 1 and 5 require explicit user sign-off.

## Key decisions

- **Single container, single port.** FastAPI serves the API under `/api/*` and the statically exported Next.js build (`output: "export"`) at `/`. The app runs on `http://localhost:8000`.
- **Docker build.** Multi-stage `Dockerfile` at the repo root: a Node (current LTS) stage runs `npm ci && npm run build` to produce `frontend/out/`; a Python (latest stable, slim) stage installs `backend/requirements.txt` with pip and copies the backend code plus the exported frontend.
- **Backend tests.** `pytest` runs inside the image: `docker run --rm my-trello pytest`. `pytest` and `httpx2` (needed by FastAPI's `TestClient`) are listed in the same `requirements.txt`.
- **Frontend tests.** Unit tests (Vitest) run locally with mocked `fetch`. From Part 3 on, Playwright e2e tests run against the running container at `http://localhost:8000` (same origin for UI and API, no CORS or proxy setup needed).
- **Scripts.** `scripts/start.sh` / `scripts/stop.sh` for Mac and Linux, `scripts/start.ps1` / `scripts/stop.ps1` for Windows. Start builds the image and runs the container in the background; stop stops and removes it.
- **Database location.** SQLite file at `/app/data/my-trello.db` inside the container, on a named Docker volume so data survives restarts. Created on startup if missing.
- **Sessions.** `POST /api/login` checks the hardcoded credentials and sets an HttpOnly cookie with a random session token kept in an in-memory dict on the backend. Restarting the container logs users out, which is acceptable for the MVP.
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

## Part 4: Add in a fake user sign in experience

- [ ] Backend: `POST /api/login` (hardcoded `user` / `password`, sets the session cookie, 401 on bad credentials), `POST /api/logout` (clears the session), `GET /api/me` (current username or 401)
- [ ] Frontend: on load, call `/api/me`; show a login form if not signed in, otherwise the board; add a "Log out" button
- [ ] Login form uses the color scheme (purple submit button) and shows an error message on bad credentials

Tests:
- Backend: valid login sets cookie and `/api/me` returns the user; invalid login returns 401; `/api/me` without cookie returns 401; logout invalidates the session.
- Unit: login form submits credentials, shows the error on 401, shows the board on success (mocked `fetch`).
- E2E: visiting `/` shows the login form; wrong password shows an error; correct login shows the board; log out returns to the login form; reloading after login keeps the user signed in.

Success criteria: the board is only reachable after signing in with `user` / `password`, and logging out works.

## Part 5: Database modeling

- [ ] Propose the schema in `docs/DATABASE.md`. Starting proposal:
  - `users`: `id`, `username` (unique), `created_at`
  - `boards`: `id`, `user_id` (unique FK to `users`, enforcing 1 board per user), `data` (board JSON in the `BoardData` shape), `updated_at`
- [ ] Document how the DB is created on startup, how the `user` row and its default board (the current demo data) are seeded, and why the board is stored as JSON
- [ ] User reviews and signs off

Success criteria: user approval of `docs/DATABASE.md`.

## Part 6: Backend

- [ ] Create the SQLite DB and tables on startup if missing; seed the `user` row and its default board
- [ ] Pydantic models matching `BoardData` (`Card`, `Column`, `Board`)
- [ ] `GET /api/board`: returns the signed-in user's board
- [ ] `PUT /api/board`: validates and replaces the signed-in user's board
- [ ] Routes stay thin; DB access in its own module; DB connection injected with `Depends` (see `backend/AGENTS.md`)
- [ ] Update `backend/AGENTS.md`

Tests (each test uses its own temporary DB):
- DB is created when the file does not exist, and reused when it does.
- `GET /api/board` returns the seeded board for a new user.
- `PUT` then `GET` returns the updated board.
- Both routes return 401 without a session.
- `PUT` with an invalid body returns 422.
- Boards of two different users are independent.

Success criteria: all backend tests pass inside the container; board data survives a container restart.

## Part 7: Frontend + Backend

- [ ] `KanbanBoard` loads the board from `GET /api/board` instead of `initialData`, with a simple loading state
- [ ] Every change (move, add, edit, delete card, rename column) sends the full board with `PUT /api/board`; column rename is saved on blur, not on each keystroke
- [ ] Remove `initialData` from the frontend (the default board now comes from the backend seed)
- [ ] Update `frontend/AGENTS.md` and the root `CLAUDE.md` architecture section

Tests:
- Unit (mocked `fetch`): board renders the data returned by the API; each action triggers a `PUT` with the expected board.
- E2E (against the container): each action (add, edit, delete, move card, rename column) survives a page reload; changes survive logging out and back in; changes survive a container restart.

Success criteria: the app at `http://localhost:8000` is a persistent board; all unit, e2e and backend tests pass.
