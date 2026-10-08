# Frontend

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `@dnd-kit` for drag and drop. `@/` aliases `src/`.

Currently a pure frontend demo: the board lives in React state only, with no backend, persistence or sign in.

## Structure

- `src/app/layout.tsx`: root layout, loads the `Space_Grotesk` (display) and `Manrope` (body) fonts.
- `src/app/page.tsx`: renders `KanbanBoard` at `/`.
- `src/app/globals.css`: Tailwind import and the color scheme as CSS variables (`--accent-yellow`, `--primary-blue`, `--secondary-purple`, `--navy-dark`, `--gray-text`, plus surface/stroke/shadow). Components use them as `text-[var(--navy-dark)]` etc.
- `src/lib/kanban.ts`: data model and pure logic.
  - `BoardData = { columns: Column[], cards: Record<string, Card> }`. Each `Column` has `id`, `title` and an ordered `cardIds` list; each `Card` has `id`, `title`, `details`. Cards are normalized, not nested in columns.
  - `initialData`: demo board with 5 fixed columns (Backlog, Discovery, In Progress, Review, Done) and 8 cards.
  - `moveCard(columns, activeId, overId)`: reorders within a column or moves across columns. Dropping onto a column id appends; onto a card id inserts at that position.
  - `createId(prefix)`: random id for new cards.
- `src/components/KanbanBoard.tsx`: client component that owns all board state (`useState` seeded from `initialData`) and the `DndContext`. Handlers: rename column, add card, delete card, drag start/end.
- `src/components/KanbanColumn.tsx`: droppable column with an inline title input (rename), a `SortableContext` of cards and `NewCardForm`.
- `src/components/KanbanCard.tsx`: sortable card showing title, details and a "Remove" button.
- `src/components/KanbanCardPreview.tsx`: card shown in the `DragOverlay` while dragging.
- `src/components/NewCardForm.tsx`: toggleable form to add a card (title required, details optional).

Columns are fixed: they can be renamed but not added or removed. Cards cannot be edited yet (planned in Part 3 of `docs/PLAN.md`).

## Tests

- Unit (Vitest + Testing Library, jsdom): `src/**/*.test.ts(x)`. `src/lib/kanban.test.ts` covers `moveCard`; `src/components/KanbanBoard.test.tsx` covers rendering, column rename, add and remove card. Setup in `src/test/setup.ts`.
- E2E (Playwright, Chromium): `tests/`. `playwright.config.ts` starts the dev server on `127.0.0.1:3000`. `tests/kanban.spec.ts` covers load, add card and drag between columns.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test:unit
npm run test:e2e
```
