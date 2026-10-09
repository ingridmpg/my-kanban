# Frontend

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `@dnd-kit` for drag and drop. `@/` aliases `src/`.

Built as a static export (`output: "export"` in `next.config.ts`) into `out/`, which the Docker image copies into the backend and serves at `/`. The board still lives in React state only, with no persistence or sign in yet.

## Structure

- `src/app/layout.tsx`: root layout, loads the `Space_Grotesk` (display) and `Manrope` (body) fonts.
- `src/app/page.tsx`: renders `KanbanBoard` at `/`.
- `src/app/globals.css`: Tailwind import and the color scheme as CSS variables (`--accent-yellow`, `--primary-blue`, `--secondary-purple`, `--navy-dark`, `--gray-text`, plus surface/stroke/shadow). Components use them as `text-[var(--navy-dark)]` etc.
- `src/lib/kanban.ts`: data model and pure logic.
  - `BoardData = { columns: Column[], cards: Record<string, Card> }`. Each `Column` has `id`, `title` and an ordered `cardIds` list; each `Card` has `id`, `title`, `details`. Cards are normalized, not nested in columns.
  - `initialData`: demo board with 5 fixed columns (Backlog, Discovery, In Progress, Review, Done) and 8 cards.
  - `moveCard(columns, activeId, overId)`: reorders within a column or moves across columns. Dropping onto a column id appends; onto a card id inserts at that position.
  - `createId(prefix)`: random id for new cards.
- `src/components/KanbanBoard.tsx`: client component that owns all board state (`useState` seeded from `initialData`) and the `DndContext`. Handlers: rename column, add card, edit card, delete card, drag start/end.
- `src/components/KanbanColumn.tsx`: droppable column with an inline title input (rename), a `SortableContext` of cards and `NewCardForm`.
- `src/components/KanbanCard.tsx`: sortable card showing title, details, "Edit" and "Remove" buttons. "Edit" swaps the content for an inline form (title required, details optional, Save / Cancel). While editing, the drag attributes and listeners are not applied, so the form is not nested in the drag handle (`role="button"`, `aria-disabled`).
- `src/components/KanbanCardPreview.tsx`: card shown in the `DragOverlay` while dragging.
- `src/components/NewCardForm.tsx`: toggleable form to add a card (title required, details optional).

Columns are fixed: they can be renamed but not added or removed.

## Tests

- Unit (Vitest + Testing Library, jsdom): `src/**/*.test.ts(x)`, config in `vitest.config.mts`. `src/lib/kanban.test.ts` covers `moveCard`; `src/components/KanbanBoard.test.tsx` covers rendering, column rename, add, edit and remove card. Setup in `src/test/setup.ts` (jest-dom matchers via `@testing-library/jest-dom/vitest`). Vitest globals are typed through `"types"` in `tsconfig.json`.
- E2E (Playwright, Chromium): `tests/`. Runs against the running container at `http://localhost:8000` (start it with `scripts/start.*` first; override with `BASE_URL`). `tests/kanban.spec.ts` covers load, add, edit and remove card, rename column and drag between columns.

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
