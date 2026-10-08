# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read first

- `AGENTS.md` (root) holds the business requirements, technical decisions, color scheme and coding standards. Follow it; it is authoritative.
- `docs/PLAN.md` is the phased execution plan (Parts 1-10). Work proceeds part by part, and several parts (1: plan, 5: database schema) require explicit user sign-off before moving on. Keep progress checklists in `docs/`.
- `backend/AGENTS.md`, `scripts/AGENTS.md` (and `frontend/AGENTS.md` once created in Part 1) describe each subdirectory and should be kept up to date as code is added.

Key standards from `AGENTS.md`: keep it simple, no over-engineering or unnecessary defensive code, no extra features, minimal README, no emojis ever, and prove root cause with evidence before fixing an issue.

## Current state

Only the frontend exists. `backend/` and `scripts/` contain placeholder AGENTS.md files; Docker, FastAPI, SQLite, auth and AI chat are still to be built per `docs/PLAN.md`.

Target architecture: a single Docker container where a FastAPI backend (managed with `uv`) serves the statically exported Next.js build at `/` plus JSON API routes, persists boards in a SQLite DB (created if missing, multi-user schema, one board per user, hardcoded `user`/`password` login for the MVP), and calls OpenRouter (`openai/gpt-oss-120b`, key in root `.env`) with the board JSON + chat history, receiving Structured Outputs that contain a reply and an optional board update. Start/stop scripts for Mac, Windows and Linux go in `scripts/`.

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
npm run test:e2e            # playwright (tests/), auto-starts dev server on 127.0.0.1:3000
npx playwright test tests/kanban.spec.ts -g "test name"
```

## Frontend architecture

- Next.js 16 App Router, React 19, Tailwind v4, `@dnd-kit` for drag and drop. `@/` aliases `src/`.
- `src/lib/kanban.ts` defines the data model and pure logic: `BoardData` is `{ columns: Column[], cards: Record<id, Card> }`, where each column holds an ordered `cardIds` list (cards are normalized, not nested). `moveCard` handles reordering within a column and moving across columns (dropping onto a column id appends; onto a card id inserts at that position). This shape is the natural basis for the backend schema and the JSON sent to the AI.
- `src/components/KanbanBoard.tsx` owns all board state (`useState` seeded from `initialData`, no persistence yet) and passes handlers (rename column, add/delete card, drag end) down to `KanbanColumn` / `KanbanCard`. Wiring to the backend API in Part 7 replaces this local state source.
- Columns are fixed (renamable, not addable/removable).
