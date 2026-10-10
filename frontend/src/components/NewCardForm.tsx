import { useState, type FormEvent } from "react";

type NewCardFormProps = {
  onAdd: (title: string, details: string) => void;
  onClose: () => void;
};

export const NewCardForm = ({ onAdd, onClose }: NewCardFormProps) => {
  const [formState, setFormState] = useState({ title: "", details: "" });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      return;
    }
    onAdd(formState.title.trim(), formState.details.trim());
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <input
        value={formState.title}
        onChange={(event) =>
          setFormState((prev) => ({ ...prev, title: event.target.value }))
        }
        placeholder="Card title"
        className="w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--heading)] outline-none transition focus:border-[var(--primary)]"
        autoFocus
        required
      />
      <textarea
        value={formState.details}
        onChange={(event) =>
          setFormState((prev) => ({ ...prev, details: event.target.value }))
        }
        placeholder="Details"
        rows={3}
        className="w-full resize-none rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--muted)] outline-none transition focus:border-[var(--primary)]"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-full bg-[var(--secondary)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
        >
          Add card
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[var(--stroke)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--heading)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
