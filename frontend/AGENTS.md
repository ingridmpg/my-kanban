# Frontend

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `@dnd-kit` for drag and drop. `@/` aliases `src/`.

Built as a static export (`output: "export"` in `next.config.ts`) into `out/`, which the Docker image copies into the backend and serves at `/`. Talks to the backend API on the same origin (`/api/*`, see `backend/AGENTS.md`); there is no Next.js server.

## Structure

- `src/app/layout.tsx`: root layout, loads the `Space_Grotesk` (display) and `Manrope` (body) fonts.
- `src/app/page.tsx`: client page. Calls `GET /api/me` on load, then shows `AuthForm` (signed out) or `KanbanBoard` (signed in).
- `src/lib/api.ts`: typed `fetch` wrappers for every endpoint (`api.me`, `login`, `register`, `logout`, `getBoard`, `saveBoard`). Non-2xx responses throw `ApiError` with the status and the API `detail` message.
- `src/components/AuthForm.tsx`: sign in / create account form (toggle), shows API errors; 422 is shown as the username and password rules.
- `src/app/globals.css`: Tailwind import and the color scheme as CSS variables (`--accent-yellow`, `--primary-blue`, `--secondary-purple`, `--navy-dark`, `--gray-text`, plus surface/stroke/shadow). Components use them as `text-[var(--navy-dark)]` etc.
- `src/lib/kanban.ts`: data model and pure logic.
  - `BoardData = { columns: Column[], cards: Record<string, Card> }`. Each `Column` has `id`, `title` and an ordered `cardIds` list; each `Card` has `id`, `title`, `details`. Cards are normalized, not nested in columns.
  - `moveCard(columns, activeId, overId)`: reorders within a column or moves across columns. Dropping onto a column id appends; onto a card id inserts at that position.
  - `createId(prefix)`: random id for new cards.
- `src/components/KanbanBoard.tsx`: loads the board with `GET /api/board` (shows "Loading board..." until then) and owns its state and the `DndContext`. Every change (rename column, add, edit, delete, move card) updates local state and sends the full board with `PUT /api/board`; saves are chained so they reach the server in order, and a failed save shows an alert. Also shows the username and the "Log out" button. The default board comes from the backend (`backend/app/default_board.json`).
- `src/components/KanbanColumn.tsx`: droppable column with an inline title input, a `SortableContext` of cards and `NewCardForm`. The title is a local draft saved on blur or Enter; an empty title reverts to the previous one.
- `src/components/KanbanCard.tsx`: sortable card showing title, details, "Edit" and "Remove" buttons. "Edit" swaps the content for an inline form (title required, details optional, Save / Cancel). While editing, the drag attributes and listeners are not applied, so the form is not nested in the drag handle (`role="button"`, `aria-disabled`).
- `src/components/KanbanCardPreview.tsx`: card shown in the `DragOverlay` while dragging.
- `src/components/NewCardForm.tsx`: toggleable form to add a card (title required, details optional).

Columns are fixed: they can be renamed but not added or removed.

## Tests

- Unit (Vitest + Testing Library, jsdom): `src/**/*.test.ts(x)`, config in `vitest.config.mts`. `src/lib/kanban.test.ts` covers `moveCard`; `src/components/KanbanBoard.test.tsx` checks that each action sends the expected `PUT`; `AuthForm.test.tsx` covers sign in, create account and API errors; `src/app/page.test.tsx` covers the signed in / out switch. `fetch` is mocked with `mockApi` from `src/test/api.ts` (handlers keyed by `"METHOD /path"`, unknown requests fail; `unstubGlobals` restores it after each test). Drag and drop is covered by e2e only. Setup in `src/test/setup.ts` (jest-dom matchers via `@testing-library/jest-dom/vitest`). Vitest globals are typed through `"types"` in `tsconfig.json`.
- E2E (Playwright, Chromium): `tests/`. Runs against the running container at `http://localhost:8000` (start it with `scripts/start.*` first; override with `BASE_URL`). `tests/kanban.spec.ts` covers sign in, sign up, log out, errors, and that every board action survives a reload, a log out and back in, and stays separate per user. Each test signs up its own `e2e-...` user, so runs leave those users in the `my-kanban-data` volume; remove them with `docker exec my-kanban python -c "import sqlite3; c=sqlite3.connect('/app/data/my-kanban.db'); c.execute('PRAGMA foreign_keys=ON'); c.execute(\"DELETE FROM users WHERE username LIKE 'e2e-%'\"); c.commit()"`.

## Commands

```bash
npm install
npx playwright install chromium   # once, for e2e
npm run dev
npm run build
npm run lint
npm run test:unit
npm run test:e2e   # container must be running
```
