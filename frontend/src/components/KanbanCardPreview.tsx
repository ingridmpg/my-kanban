import type { Card } from "@/lib/kanban";

type KanbanCardPreviewProps = {
  card: Card;
};

export const KanbanCardPreview = ({ card }: KanbanCardPreviewProps) => (
  <article className="rounded-2xl border border-transparent bg-white px-4 py-4 shadow-[0_18px_32px_rgba(46,26,71,0.16)]">
    <h4 className="break-words font-display text-base font-semibold text-[var(--heading)]">
      {card.title}
    </h4>
    {card.details && (
      <p className="mt-2 break-words text-sm leading-6 text-[var(--muted)]">
        {card.details}
      </p>
    )}
  </article>
);
