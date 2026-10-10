import { useState, type FormEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { PencilIcon, TrashIcon } from "@/components/icons";
import type { Card } from "@/lib/kanban";

type KanbanCardProps = {
  card: Card;
  onEdit: (cardId: string, title: string, details: string) => void;
  onDelete: (cardId: string) => void;
};

export const KanbanCard = ({ card, onEdit, onDelete }: KanbanCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({ title: "", details: "" });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const startEditing = () => {
    setFormState({ title: card.title, details: card.details });
    setIsEditing(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      return;
    }
    onEdit(card.id, formState.title.trim(), formState.details.trim());
    setIsEditing(false);
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "rounded-2xl border border-transparent bg-white px-4 py-4 shadow-[0_12px_24px_rgba(46,26,71,0.08)]",
        "transition-all duration-150",
        !isEditing && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-60 shadow-[0_18px_32px_rgba(46,26,71,0.16)]"
      )}
      // The edit form must not sit inside the drag handle (role="button").
      {...(isEditing ? {} : { ...attributes, ...listeners })}
      data-testid={`card-${card.id}`}
    >
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={formState.title}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, title: event.target.value }))
            }
            aria-label="Card title"
            className="w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--heading)] outline-none transition focus:border-[var(--primary)]"
            required
          />
          <textarea
            value={formState.details}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, details: event.target.value }))
            }
            aria-label="Card details"
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--muted)] outline-none transition focus:border-[var(--primary)]"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-full bg-[var(--secondary)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-full border border-[var(--stroke)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--heading)]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <h4 className="break-words font-display text-base font-semibold text-[var(--heading)]">
            {card.title}
          </h4>
          {card.details && (
            <p className="mt-2 break-words text-sm leading-6 text-[var(--muted)]">
              {card.details}
            </p>
          )}
          <div className="mt-3 flex justify-end gap-1">
            <button
              type="button"
              onClick={startEditing}
              className="rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--primary)]"
              aria-label={`Edit ${card.title}`}
              title="Edit"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              onClick={() => onDelete(card.id)}
              className="rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--danger)]"
              aria-label={`Delete ${card.title}`}
              title="Delete"
            >
              <TrashIcon />
            </button>
          </div>
        </>
      )}
    </article>
  );
};
