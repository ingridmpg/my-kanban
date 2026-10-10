"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { api } from "@/lib/api";
import { createId, findColumnId, moveCard, type BoardData } from "@/lib/kanban";

// Each column gets its own pastel from the palette in globals.css.
const candyColor = (index: number) => `var(--candy-${(index % 5) + 1})`;

// The drop target is what is under the pointer: a card, or the column itself when over
// its empty space. closestCorners alone picks a card in a neighbouring column when the
// columns are tall, because a tall column's corners are far from the dragged card.
// It is kept as a fallback for when the pointer is outside every column (e.g. in a gap).
const collisionDetection: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : closestCorners(args);
};

type KanbanBoardProps = {
  username: string;
  onSignedOut: () => void;
};

export const KanbanBoard = ({ username, onSignedOut }: KanbanBoardProps) => {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const saveQueue = useRef(Promise.resolve());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    api.getBoard().then(setBoard);
  }, []);

  if (!board) {
    return (
      <p className="p-12 text-sm font-semibold text-[var(--muted)]">Loading board...</p>
    );
  }

  const update = (next: BoardData) => {
    setBoard(next);
    // Saves run one at a time so they reach the server in order.
    saveQueue.current = saveQueue.current
      .then(() => api.saveBoard(next))
      .then(
        () => undefined,
        () => setSaveFailed(true)
      );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  // Highlights the target column, whether the pointer is over one of its cards or its empty space.
  const handleDragOver = ({ over }: DragOverEvent) => {
    setOverColumnId(over ? (findColumnId(board.columns, over.id as string) ?? null) : null);
  };

  const handleDragCancel = () => {
    setActiveCardId(null);
    setOverColumnId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    handleDragCancel();

    if (!over || active.id === over.id) {
      return;
    }

    const columns = moveCard(board.columns, active.id as string, over.id as string);
    if (columns !== board.columns) {
      update({ ...board, columns });
    }
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    update({
      ...board,
      columns: board.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    });
  };

  const handleAddCard = (columnId: string, title: string, details: string) => {
    const id = createId("card");
    update({
      ...board,
      cards: {
        ...board.cards,
        [id]: { id, title, details },
      },
      columns: board.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [id, ...column.cardIds] }
          : column
      ),
    });
  };

  const handleEditCard = (cardId: string, title: string, details: string) => {
    update({
      ...board,
      cards: {
        ...board.cards,
        [cardId]: { id: cardId, title, details },
      },
    });
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    update({
      ...board,
      cards: Object.fromEntries(
        Object.entries(board.cards).filter(([id]) => id !== cardId)
      ),
      columns: board.columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cardIds: column.cardIds.filter((id) => id !== cardId),
            }
          : column
      ),
    });
  };

  const handleLogout = () => {
    api.logout().then(onSignedOut);
  };

  const activeCard = activeCardId ? board.cards[activeCardId] : null;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(255,175,204,0.35)_0%,_rgba(255,175,204,0.08)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(162,210,255,0.35)_0%,_rgba(162,210,255,0.08)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-10 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">
                Single Board Kanban
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--heading)]">
                My Kanban
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                Keep momentum visible. Rename columns, drag cards between stages,
                and capture quick notes without getting buried in settings.
              </p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                <span>
                  Signed in as{" "}
                  <span className="font-semibold text-[var(--heading)]">{username}</span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--secondary)] transition hover:border-[var(--secondary)]"
                >
                  Log out
                </button>
              </div>
              <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
                  Focus
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--heading)]">
                  One board. Five columns. Zero clutter.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {board.columns.map((column, index) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--heading)]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: candyColor(index) }}
                />
                {column.title}
              </div>
            ))}
          </div>
          {saveFailed && (
            <p role="alert" className="text-sm font-medium text-[var(--danger)]">
              Some changes could not be saved. Reload the page to see the saved board.
            </p>
          )}
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <section className="grid gap-6 lg:grid-cols-5">
            {board.columns.map((column, index) => (
              <KanbanColumn
                key={column.id}
                column={column}
                color={candyColor(index)}
                isDropTarget={column.id === overColumnId}
                cards={column.cardIds.map((cardId) => board.cards[cardId])}
                onRename={handleRenameColumn}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
              />
            ))}
          </section>
          <DragOverlay>
            {activeCard ? (
              <div className="w-[260px] cursor-grabbing">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
};
