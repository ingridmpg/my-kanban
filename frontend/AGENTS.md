# Frontend

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `@dnd-kit` for drag and drop. `@/` aliases `src/`.

Built as a static export (`output: "export"` in `next.config.ts`) into `out/`, which the Docker image copies into the backend and serves at `/`. Talks to the backend API on the same origin (`/api/*`, see `backend/AGENTS.md`); there is no Next.js server.

## Structure

- `src/app/layout.tsx`: root layout, loads the `Space_Grotesk` (display) and `Manrope` (body) fonts.
- `src/app/page.tsx`: client page. Calls `GET /api/me` on load, then shows `AuthForm` (signed out) or `KanbanBoard` (signed in).
- `src/lib/api.ts`: typed `fetch` wrappers for every endpoint (`api.me`, `login`, `register`, `logout`, `getBoard`, `saveBoard`). Non-2xx responses throw `ApiError` with the status and the API `detail` message (or `Request failed (<status>)` when the body is not JSON). `isUnauthorized` checks for a 401.
- `src/components/AuthForm.tsx`: sign in / create account form (toggle), shows API errors and disables the submit button while the request is in flight; 422 is shown as the username and password rules. In sign in mode it shows the demo account (`user` / `password`) with a "Use demo account" button that fills in the fields. A note at the bottom says that demo data is reset from time to time.
- `src/app/globals.css`: Tailwind import and the candy color scheme as CSS variables named by role, not by color (`--accent`, `--primary`, `--secondary`, `--heading`, `--muted`, `--danger`, plus surface/stroke/shadow), and one pastel per column (`--candy-1` to `--candy-5`). Components use them as `text-[var(--heading)]` etc. To change the palette, change only this file. It also restores `cursor: pointer` on buttons (Tailwind v4 defaults them to the arrow).
- `src/lib/kanban.ts`: data model and pure logic.
  - `BoardData = { columns: Column[], cards: Record<string, Card> }`. Each `Column` has `id`, `title` and an ordered `cardIds` list; each `Card` has `id`, `title`, `details`. Cards are normalized, not nested in columns.
  - `moveCard(columns, activeId, overId)`: reorders within a column or moves across columns. Dropping onto a column id appends; onto a card id inserts at that position.
  - `createId(prefix)`: random id for new cards.
- `src/components/KanbanBoard.tsx`: loads the board with `GET /api/board` (shows "Loading board..." until then, or an alert if it fails) and owns its state and the `DndContext`. Drag and drop uses a custom collision detection: `pointerWithin` (the card or the column empty space under the pointer), falling back to `closestCorners` when the pointer is outside every column. `closestCorners` alone dropped cards into a neighbouring column when columns were tall. `onDragOver` tracks the target column (via `findColumnId`) to highlight it, whether the pointer is over one of its cards or its empty space. Every change (rename column, add, edit, delete, move card) updates local state and sends the full board with `PUT /api/board`; saves are chained so they reach the server in order, and a failed save shows an alert until a later save succeeds. A 401 on load or save (the session is gone, e.g. after a server restart) calls `onSignedOut`, back to the sign in screen. "Log out" waits for pending saves first. Also shows the username and the "Log out" button. Each column gets its pastel by position (`candyColor(index)`), used for the column bar and its header pill. The starting board comes from the backend: empty for new accounts, sample cards for the demo account.
- `src/components/KanbanColumn.tsx`: droppable column. Header: color bar, card count and a "+" icon button (`aria-label` "Add a card") that opens `NewCardForm` right below the title; new cards are added at the top of the column. Then the inline title input and a `SortableContext` of cards. The title is a local draft saved on blur or Enter; an empty title reverts to the previous one. The column color is exposed as the `--column-color` CSS variable (bar, "+" hover). `isDropTarget` (from the board) shows the accent ring while a card is dragged over the column.
- `src/components/KanbanCard.tsx`: sortable card in a single column (grab cursor, grabbing while dragging; neither while editing): title, details (hidden when empty), then a row of icon buttons (pencil and trash from `src/components/icons.tsx`, with `aria-label` "Edit <title>" / "Delete <title>" and a `title` tooltip). "Edit" swaps the content for an inline form (title required, details optional, Save / Cancel). While editing, the drag attributes and listeners are not applied, so the form is not nested in the drag handle (`role="button"`, `aria-disabled`).
- `src/components/KanbanCardPreview.tsx`: card shown in the `DragOverlay` while dragging, same single-column layout without buttons.
- `src/components/icons.tsx`: inline SVG icons (no icon library).
- `src/components/NewCardForm.tsx`: form to add a card (title required, details optional, title focused on open); the column opens and closes it.

Columns are fixed: they can be renamed but not added or removed.

## Tests

- Unit (Vitest + Testing Library, jsdom): `src/**/*.test.ts(x)`, config in `vitest.config.mts`. `src/lib/kanban.test.ts` covers `moveCard`; `src/components/KanbanBoard.test.tsx` checks that each action sends the expected `PUT`; `AuthForm.test.tsx` covers sign in, create account and API errors; `src/app/page.test.tsx` covers the signed in / out switch. `fetch` is mocked with `mockApi` from `src/test/api.ts` (handlers keyed by `"METHOD /path"`, unknown requests fail; `unstubGlobals` restores it after each test). Drag and drop is covered by e2e only. Setup in `src/test/setup.ts` (jest-dom matchers via `@testing-library/jest-dom/vitest`). Vitest globals are typed through `"types"` in `tsconfig.json`.
- E2E (Playwright, Chromium): `tests/`. Runs against the running container at `http://localhost:8000` (start it with `scripts/start.*` first; override with `BASE_URL`). `tests/kanban.spec.ts` covers sign in, sign up, log out, errors, and that every board action survives a reload, a log out and back in, and stays separate per user, plus a regression test that drops a card into an empty column while the columns are tall and checks the target highlight. Each test signs up its own `e2e-...` user (which starts with an empty board, so tests add the cards they need), so runs leave those users in the `my-kanban-data` volume; remove them with `docker exec my-kanban python -c "import sqlite3; c=sqlite3.connect('/app/data/my-kanban.db'); c.execute('PRAGMA foreign_keys=ON'); c.execute(\"DELETE FROM users WHERE username LIKE 'e2e-%'\"); c.commit()"`.

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
