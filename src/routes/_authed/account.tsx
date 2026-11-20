import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "#/components/app-shell";
import { Icon } from "#/components/icons";
import { changePassword } from "#/server/auth";

export const Route = createFileRoute("/_authed/account")({
  head: () => ({ meta: [{ title: "Your account · Games Club" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  if (!user) return null;
  const mustChangePassword = user.mustChangePassword;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    setError(null);
    setSaved(false);

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result = await changePassword({
        data: {
          currentPassword: String(form.get("currentPassword") ?? ""),
          newPassword,
        },
      });
      if ("error" in result) {
        setError(result.error ?? "Could not change your password.");
        return;
      }
      if (mustChangePassword) {
        window.location.href = "/";
        return;
      }
      setSaved(true);
      event.currentTarget.reset();
    } catch {
      setError("Could not change your password. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Your account</p>
      <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">
        Hello, {user.name}.
      </h1>

      {user.mustChangePassword ? (
        <div className="mt-6 rounded-2xl border border-gold/60 bg-gold/15 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Icon name="lock" className="h-4 w-4 text-clay" />
            Your password was reset by the admin.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            Pick a new one below before you head back to the club.
          </p>
        </div>
      ) : null}

      <div className="card mt-6 flex items-center gap-4 p-5">
        <Avatar name={user.name} size="h-14 w-14" />
        <div>
          <p className="text-lg font-bold text-ink">{user.name}</p>
          <p className="text-xs text-muted">@{user.username}</p>
          <span className="badge mt-2">
            {user.isAdmin ? "Club admin" : "Club member"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card mt-6 p-5">
        <h2 className="display text-2xl text-ink">Change your password</h2>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="label">Current password</span>
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              className="input"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">New password</span>
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={200}
                className="input"
              />
            </label>
            <label className="block">
              <span className="label">Repeat new password</span>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={200}
                className="input"
              />
            </label>
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-4 text-xs font-semibold text-clay">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-forest">
            <Icon name="check" className="h-4 w-4" /> Password updated.
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-muted">
            Locked out? Ask the club admin to reset your password.
          </p>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
