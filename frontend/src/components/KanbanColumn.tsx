import { useState, type CSSProperties } from "react";
import clsx from "clsx";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Card, Column } from "@/lib/kanban";
import { PlusIcon } from "@/components/icons";
import { KanbanCard } from "@/components/KanbanCard";
import { NewCardForm } from "@/components/NewCardForm";

type KanbanColumnProps = {
  column: Column;
  color: string;
  isDropTarget: boolean;
  cards: Card[];
  onRename: (columnId: string, title: string) => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onEditCard: (cardId: string, title: string, details: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
};

export const KanbanColumn = ({
  column,
  color,
  isDropTarget,
  cards,
  onRename,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: column.id });
  // Draft title while typing; saved on blur. An empty title reverts.
  const [title, setTitle] = useState(column.title);
  const [isAdding, setIsAdding] = useState(false);

  const commitTitle = () => {
    const next = title.trim() || column.title;
    setTitle(next);
    if (next !== column.title) {
      onRename(column.id, next);
    }
  };

  return (
    <section
      ref={setNodeRef}
      style={{ "--column-color": color } as CSSProperties}
      className={clsx(
        "flex min-h-[520px] flex-col rounded-3xl border border-[var(--stroke)] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] transition",
        isDropTarget && "ring-2 ring-[var(--accent)]"
      )}
      data-testid={`column-${column.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-10 rounded-full bg-[var(--column-color)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {cards.length} {cards.length === 1 ? "card" : "cards"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="rounded-full p-1.5 text-[var(--muted)] transition hover:bg-[var(--column-color)] hover:text-[var(--heading)]"
          aria-label="Add a card"
          title="Add a card"
        >
          <PlusIcon />
        </button>
      </div>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={commitTitle}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        className="mt-3 w-full bg-transparent font-display text-lg font-semibold text-[var(--heading)] outline-none"
        aria-label="Column title"
      />
      {isAdding && (
        <NewCardForm
          onAdd={(cardTitle, details) => onAddCard(column.id, cardTitle, details)}
          onClose={() => setIsAdding(false)}
        />
      )}
      <div className="mt-4 flex flex-1 flex-col gap-3">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={(cardId) => onDeleteCard(column.id, cardId)}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--stroke)] px-3 py-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Drop a card here
          </div>
        )}
      </div>
    </section>
  );
};
