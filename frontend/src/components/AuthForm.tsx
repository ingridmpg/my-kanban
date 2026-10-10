import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";

type AuthFormProps = {
  onSignedIn: (username: string) => void;
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]";

export const AuthForm = ({ onSignedIn }: AuthFormProps) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const user = await (isSignIn ? api.login : api.register)(username, password);
      onSignedIn(user.username);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 422
          ? "Username must be 1 to 50 characters and password at least 8 characters."
          : (err as Error).message
      );
    }
  };

  const toggleMode = () => {
    setIsSignIn((prev) => !prev);
    setError(null);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-sm rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)]">
        <div className="h-2 w-10 rounded-full bg-[var(--accent-yellow)]" />
        <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--navy-dark)]">
          My Kanban
        </h1>
        <p className="mt-2 text-sm text-[var(--gray-text)]">
          {isSignIn ? "Sign in to see your board." : "Create an account to get your own board."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className={inputClassName}
              required
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
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
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--secondary-purple)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
          >
            {isSignIn ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-4 w-full text-sm font-semibold text-[var(--primary-blue)]"
        >
          {isSignIn ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
};
