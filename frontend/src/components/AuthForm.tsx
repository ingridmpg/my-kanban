import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";

type AuthFormProps = {
  onSignedIn: (username: string) => void;
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--heading)] outline-none transition focus:border-[var(--primary)]";

export const AuthForm = ({ onSignedIn }: AuthFormProps) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await (isSignIn ? api.login : api.register)(username, password);
      onSignedIn(user.username);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 422
          ? "Username must be 1 to 50 characters and password at least 8 characters."
          : (err as Error).message
      );
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignIn((prev) => !prev);
    setError(null);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-sm rounded-[32px] border border-[var(--stroke)] bg-white/80 px-8 py-7 shadow-[var(--shadow)]">
        <div className="h-2 w-10 rounded-full bg-[var(--accent)]" />
        <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--heading)]">
          My Kanban
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {isSignIn ? "Sign in to see your board." : "Create an account to get your own board."}
        </p>

        {isSignIn && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
            <p>
              Just looking? Try{" "}
              <span className="whitespace-nowrap font-semibold text-[var(--heading)]">
                user / password
              </span>
            </p>
            <button
              type="button"
              onClick={() => {
                setUsername("user");
                setPassword("password");
              }}
              className="shrink-0 rounded-full border border-[var(--primary)] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--primary)] transition hover:border-[var(--candy-5)] hover:bg-[var(--candy-5)] hover:text-[var(--heading)]"
            >
              Use demo account
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className={inputClassName}
              required
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignIn ? "current-password" : "new-password"}
              className={inputClassName}
              required
            />
          </label>
          {error && (
            <p role="alert" className="text-sm font-medium text-[var(--danger)]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[var(--secondary)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {isSignIn ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-3 w-full text-sm font-semibold text-[var(--primary)]"
        >
          {isSignIn ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>

        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Demo app: data is reset from time to time.
        </p>
      </section>
    </main>
  );
};
