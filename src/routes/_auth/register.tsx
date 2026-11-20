import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "#/components/icons";
import { register } from "#/server/auth";

export const Route = createFileRoute("/_auth/register")({
  head: () => ({ meta: [{ title: "Join · Games Club" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const result = await register({
        data: {
          name: String(form.get("name") ?? ""),
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
        },
      });
      if ("error" in result) {
        setError(result.error ?? "Could not create your account.");
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Could not create your account. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <p className="eyebrow">Pull up a chair</p>
      <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">
        Join the club.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Pick a username, tell us what to call you, and you are in.
      </p>

      <form method="post" onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="label">Display name</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={60}
            className="input"
            placeholder="Maya Chen"
          />
        </label>
        <label className="block">
          <span className="label">Username</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9][a-zA-Z0-9_-]{2,23}"
            className="input"
            placeholder="maya"
          />
          <span className="mt-1.5 block text-[11px] text-muted">
            3-24 characters. Letters, numbers, dashes and underscores.
          </span>
        </label>
        <label className="block">
          <span className="label">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={200}
            className="input"
            placeholder="At least 8 characters"
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
          {pending ? "Creating account…" : "Create account"}
          <Icon name="arrow" className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-8 border-t border-line pt-5 text-sm text-muted">
        Already a member?{" "}
        <Link
          to="/login"
          className="font-bold text-forest underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
