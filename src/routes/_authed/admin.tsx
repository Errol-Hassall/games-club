import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "#/components/app-shell";
import { Icon } from "#/components/icons";
import { formatDate } from "#/lib/dates";
import type { AdminUser } from "#/server/admin";
import { listUsers, resetUserPassword } from "#/server/admin";

export const Route = createFileRoute("/_authed/admin")({
  head: () => ({ meta: [{ title: "Admin · Games Club" }] }),
  beforeLoad: ({ context }) => {
    if (!context.user?.isAdmin) throw redirect({ to: "/" });
  },
  loader: () => listUsers(),
  component: AdminPage,
});

function AdminPage() {
  const users = Route.useLoaderData();
  const { user } = Route.useRouteContext();

  return (
    <div>
      <header>
        <p className="eyebrow">Club admin</p>
        <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">
          The members.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          There is one admin account. If a member forgets their password, reset
          it here and pass on the temporary one. They will choose a new password
          the next time they sign in.
        </p>
      </header>

      <div className="mt-8 space-y-3">
        {users.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isSelf={member.id === user?.id}
          />
        ))}
      </div>

      <div className="card mt-8 p-5">
        <div className="flex items-start gap-3">
          <Icon name="lock" className="mt-0.5 h-5 w-5 shrink-0 text-clay" />
          <div>
            <h2 className="text-sm font-bold text-ink">
              How the reset flow works
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Resetting signs the member out everywhere and replaces their
              password with a one-time code. Give them the code privately. After
              they sign in, they are sent straight to their account page and
              cannot use the club until they set a new password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, isSelf }: { member: AdminUser; isSelf: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    setPending(true);
    setError(null);
    try {
      const result = await resetUserPassword({ data: { userId: member.id } });
      if ("error" in result) {
        setError(result.error ?? "Could not reset that password.");
        setConfirming(false);
        return;
      }
      setPassword(result.password);
      setConfirming(false);
    } catch {
      setError("Could not reset that password.");
    } finally {
      setPending(false);
    }
  }

  async function copyPassword() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={member.name} size="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-ink">{member.name}</p>
            {member.isAdmin ? <span className="badge">Admin</span> : null}
            {member.mustChangePassword ? (
              <span className="badge-clay">Reset pending</span>
            ) : null}
          </div>
          <p className="text-[11px] text-muted">
            @{member.username} · joined {formatDate(member.createdAt)} ·{" "}
            {member.suggestionCount}{" "}
            {member.suggestionCount === 1 ? "suggestion" : "suggestions"}
          </p>
        </div>
        {isSelf ? (
          <span className="text-[11px] font-semibold text-muted">
            That is you
          </span>
        ) : confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted">
              Sign them out and reset?
            </span>
            <button
              type="button"
              onClick={handleReset}
              disabled={pending}
              className="btn-primary btn-sm"
            >
              {pending ? "Resetting…" : "Yes, reset"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="btn-quiet btn-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn-ghost btn-sm"
          >
            <Icon name="lock" className="h-3.5 w-3.5" />
            Reset password
          </button>
        )}
      </div>

      {password ? (
        <div className="mt-4 rounded-xl border border-gold/50 bg-gold/10 p-4">
          <p className="text-xs font-bold text-ink">
            Temporary password for {member.name}. Shown once.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-lg border border-line bg-cream px-3 py-2 font-mono text-sm font-bold text-ink">
              {password}
            </code>
            <button
              type="button"
              onClick={copyPassword}
              className="btn-ghost btn-sm"
            >
              <Icon name="copy" className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Send it to them privately. They will be asked to change it
            immediately after signing in.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-xs font-semibold text-clay">
          {error}
        </p>
      ) : null}
    </article>
  );
}
