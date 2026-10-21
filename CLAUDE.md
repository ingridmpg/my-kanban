# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read first

- `AGENTS.md` (root) is authoritative. This file mirrors its specs below; if they ever disagree, AGENTS.md wins.
- `docs/PLAN.md` is the phased execution plan (Parts 1-8). Work proceeds part by part, and Part 1 (plan), Part 4 (database schema) and Part 8 (deploy) require explicit user sign-off before moving on. All planning and progress documents (including checklists) live in `docs/`.
- `backend/AGENTS.md`, `frontend/AGENTS.md` and `scripts/AGENTS.md` describe each subdirectory (each is imported by a `CLAUDE.md` next to it) and should be kept up to date as code is added.

## Business requirements

A Project Management MVP web app:

- A user can sign up (create an account) and sign in.
- When signed in, the user sees a board representing their project.
- The board has fixed columns that can be renamed.
- The cards on the board can be moved with drag and drop, and edited.

## MVP limitations

- Users are stored in the database with hashed passwords. Anyone can sign up with a unique username and a password (minimum 8 characters). A demo account `user` / `password` is seeded when the database is created. No password reset or rate limiting.
- Only 1 board per signed in user.
- Runs locally, in a Docker container, and online as a portfolio demo on the Render free plan (`render.yaml`; temporary disk, so data is reset on every restart or deploy).

## Technical decisions

- Next.js frontend.
- Python FastAPI backend, which also serves the static Next.js site at `/`.
- Everything packaged into a single Docker container.
- Python dependencies managed with pip and a `requirements.txt` with pinned versions.
- Backend tests run inside the Docker container; no local Python install is required.
- SQLite local database, created if it does not exist.
- Start and stop server scripts for Mac, Windows and Linux in `scripts/` (PowerShell `.ps1` for Windows).

## Color scheme

- Bubblegum Accent `#ff8fab`: accent lines, highlights
- Blueberry Primary `#4353e8`: links, key sections
- Grape Secondary `#8048d8`: submit buttons, important actions
- Plum Heading `#2e1a47`: main headings
- Mauve Text `#7a6d88`: supporting text, labels
- Cherry Danger `#e0245e`: error messages
- Candy column pastels, one per column in order: pink `#ffafcc`, peach `#ffc8a2`, lemon `#ffe17a`, mint `#9be7c4`, sky `#a2d2ff`
- Background `#fff7fb`. Text colors meet WCAG AA contrast (4.5:1) on white; pastels are decorative only.

## Coding standards

1. Use the latest versions of libraries and idiomatic approaches.
2. Keep it simple: never over-engineer, always simplify, no unnecessary defensive programming, no extra features.
3. Be concise. Keep the README minimal. No emojis, ever.
4. When hitting issues, identify the root cause before trying a fix. Do not guess: prove it with evidence, then fix the root cause.
5. Never commit or push automatically. Only run `git commit` or `git push` when the user explicitly asks for it, and each request covers only that one commit or push.

## Current state

Parts 1-7 of `docs/PLAN.md` are done; Part 8 (code review and deploy to the Render free plan, `render.yaml`) is approved and in progress. The Docker container builds the frontend as a static export and serves it from FastAPI at `http://localhost:8000`, started and stopped with the scripts in `scripts/` (SQLite on the `my-kanban-data` volume); backend tests run with `docker run --rm my-kanban pytest`. Users sign up or sign in (demo account `user` / `password`) and get their own persistent board.

## Frontend commands

Run from `frontend/`:

```bash
npm install
npm run dev                 # Next.js dev server
npm run build
npm run lint                # eslint
npm run test:unit           # vitest (src/**/*.test.ts(x), jsdom)
npx vitest run src/lib/kanban.test.ts   # single unit test file
npx vitest run -t "test name"           # single test by name
npm run test:e2e            # playwright (tests/), against the running container on localhost:8000
npx playwright test tests/kanban.spec.ts -g "test name"
```

## Frontend architecture

- Next.js 16 App Router with static export (`output: "export"`), React 19, Tailwind v4, `@dnd-kit` for drag and drop. `@/` aliases `src/`.
- `src/lib/kanban.ts` defines the data model (mirrored by Pydantic models in `backend/app/models.py`) and pure logic: `BoardData` is `{ columns: Column[], cards: Record<id, Card> }`, where each column holds an ordered `cardIds` list (cards are normalized, not nested). `moveCard` handles reordering within a column and moving across columns (dropping onto a column id appends; onto a card id inserts at that position). The backend stores this shape as JSON (see `docs/DATABASE.md`).
- `src/app/page.tsx` checks `GET /api/me` and shows `AuthForm` or `KanbanBoard`. `src/lib/api.ts` wraps every API call.
- `src/components/KanbanBoard.tsx` loads the board from `GET /api/board`, owns its state and passes handlers (rename column, add/edit/delete card, drag end) down to `KanbanColumn` / `KanbanCard`. Every change sends the full board with `PUT /api/board` (saves chained in order). New accounts start with the 5 columns and no cards; the demo account starts with the sample cards in `backend/app/demo_board.json`.
- Columns are fixed (renamable, not addable/removable).
