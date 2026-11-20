import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "#/components/icons";
import { login } from "#/server/auth";

export const Route = createFileRoute("/_auth/login")({
  head: () => ({ meta: [{ title: "Sign in · Games Club" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const result = await login({
        data: {
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
        },
      });
      if ("error" in result) {
        setError(result.error ?? "Could not sign in.");
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <p className="eyebrow">Members only</p>
      <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">
        Welcome back.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Sign in to see what the club is playing this month.
      </p>

      <form method="post" onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="label">Username</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            className="input"
            placeholder="your-handle"
          />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            placeholder="••••••••"
          />
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-clay/10 px-3 py-2 text-xs font-semibold text-clay"
          >
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Signing in…" : "Sign in"}
          <Icon name="arrow" className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-8 border-t border-line pt-5 text-sm text-muted">
        New to the club?{" "}
        <Link
          to="/register"
          className="font-bold text-forest underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
