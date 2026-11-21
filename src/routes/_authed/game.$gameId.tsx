import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { CoverArt } from "#/components/cover-art";
import { VoteButton } from "#/components/game-card";
import { Icon } from "#/components/icons";
import { AverageRating, RatingStars } from "#/components/rating";
import { formatDate, formatMonth, formatPlaytime } from "#/lib/dates";
import type { Game, GameFlagKind } from "#/lib/types";
import {
  assignGame,
  getGame,
  toggleGameFlag,
  updateGame,
} from "#/server/club";

export const Route = createFileRoute("/_authed/game/$gameId")({
  head: () => ({ meta: [{ title: "Game · Games Club" }] }),
  loader: ({ params }) => getGame({ data: { gameId: Number(params.gameId) } }),
  component: GamePage,
});

function GamePage() {
  const router = useRouter();
  const data = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const [editing, setEditing] = useState(false);

  if (!data) {
    return (
      <div className="card border-dashed p-12 text-center">
        <h1 className="display text-3xl text-ink">
          That game is not on the shelf.
        </h1>
        <Link to="/backlog" className="btn-primary mt-5">
          Back to the backlog
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/backlog"
        className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-clay"
      >
        <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
        The backlog
      </Link>

      <div className="mt-5 grid gap-8 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <div>
          <CoverArt
            title={data.game.title}
            coverUrl={data.game.coverUrl}
            className="aspect-[3/4] w-full rounded-2xl shadow-[0_24px_50px_-26px_rgba(23,21,15,0.55)]"
            eager
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {data.assignment ? (
              <span className="badge-clay">
                {formatMonth(data.assignment.month)}
              </span>
            ) : (
              <span className="badge">On the shelf</span>
            )}
            {data.game.suggestedByName ? (
              <span className="text-[11px] font-semibold text-muted">
                Suggested by {data.game.suggestedByName}
              </span>
            ) : null}
          </div>
          <h1 className="display mt-3 text-4xl text-ink sm:text-6xl">
            {data.game.title}
          </h1>
          {data.game.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.game.tags.map((tag) => (
                <span key={tag} className="badge">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="gamepad" className="h-4 w-4 text-clay" />
              {data.game.platform}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" className="h-4 w-4 text-clay" />
              {formatPlaytime(data.game.playtimeHours)}
            </span>
            {data.game.metascore != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="star" className="h-4 w-4 text-gold" />
                Metascore {data.game.metascore}
              </span>
            ) : null}
            {data.assignment ? (
              <AverageRating
                rating={
                  data.reviews.length > 0
                    ? data.reviews.reduce(
                        (sum, review) => sum + review.rating,
                        0,
                      ) / data.reviews.length
                    : null
                }
                count={data.assignment.reviewCount}
              />
            ) : null}
          </div>

          {data.game.description ? (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">
              {data.game.description}
            </p>
          ) : null}

          {data.game.notes ? (
            <p className="mt-5 max-w-xl border-l-2 border-gold pl-4 text-sm leading-relaxed text-ink-soft italic">
              {data.game.notes}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {data.assignment ? (
              <Link
                to="/month/$month"
                params={{ month: data.assignment.month }}
                className="btn-primary"
              >
                Open {formatMonth(data.assignment.month)}
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <VoteButton
                  gameId={data.game.id}
                  voteCount={data.voteCount}
                  hasVoted={data.hasVoted}
                />
                {user?.isAdmin ? (
                  <AssignPanel
                    gameId={data.game.id}
                    openMonth={data.openMonth}
                  />
                ) : (
                  <span className="text-xs text-muted">
                    An admin can give this a month once the club has voted.
                  </span>
                )}
              </>
            )}
            {user?.isAdmin ? (
              <button
                type="button"
                onClick={() => setEditing((value) => !value)}
                className="btn-ghost btn-sm"
              >
                {editing ? "Close editor" : "Edit details"}
              </button>
            ) : null}
          </div>

          {editing ? (
            <EditGameForm
              game={data.game}
              onDone={() => {
                setEditing(false);
                void router.invalidate();
              }}
            />
          ) : null}

          <section aria-label="Club status" className="card mt-7 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-bold tracking-[0.14em] text-muted uppercase">
                Who has this one?
              </h2>
              <div className="flex flex-wrap gap-4">
                <FlagToggle
                  gameId={data.game.id}
                  kind="played"
                  label="I've played it"
                  checked={data.myFlags.played}
                />
                <FlagToggle
                  gameId={data.game.id}
                  kind="owned"
                  label="I own it"
                  checked={data.myFlags.owned}
                />
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs">
              {data.flags.map((flag) => (
                <p key={flag.kind}>
                  <span className="font-bold text-ink-soft">
                    {flag.kind === "played" ? "Played by" : "Owned by"}:{" "}
                  </span>
                  <span className="text-muted">
                    {flag.names.length > 0
                      ? flag.names.join(", ")
                      : "nobody yet"}
                  </span>
                </p>
              ))}
            </div>
          </section>

          {data.assignment && data.reviews.length > 0 ? (
            <section className="mt-10">
              <h2 className="display text-3xl text-ink">What the club said</h2>
              <ul className="mt-4 space-y-4">
                {data.reviews.slice(0, 3).map((review) => (
                  <li key={review.id} className="card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-ink">
                        {review.authorName}
                      </p>
                      <RatingStars rating={review.rating} size="h-3.5 w-3.5" />
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                      {review.body}
                    </p>
                    <p className="mt-2 text-[10px] text-muted">
                      {formatDate(review.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                to="/month/$month"
                params={{ month: data.assignment.month }}
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-clay"
              >
                Read all {data.assignment.reviewCount} reviews{" "}
                <Icon name="arrow" className="h-3.5 w-3.5" />
              </Link>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FlagToggle({
  gameId,
  kind,
  label,
  checked,
}: {
  gameId: number;
  kind: GameFlagKind;
  label: string;
  checked: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    setPending(true);
    try {
      await toggleGameFlag({ data: { gameId, kind } });
      await router.invalidate();
    } finally {
      setPending(false);
    }
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleToggle}
        disabled={pending}
        className="h-3.5 w-3.5 accent-[#234435]"
      />
      {label}
    </label>
  );
}

function AssignPanel({
  gameId,
  openMonth,
}: {
  gameId: number;
  openMonth: string;
}) {
  const router = useRouter();
  const [month, setMonth] = useState(openMonth);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleAssign(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await assignGame({ data: { gameId, month } });
      if ("error" in result) {
        setError(result.error ?? "Could not assign that game.");
        return;
      }
      await router.navigate({ to: "/month/$month", params: { month } });
      await router.invalidate();
    } catch {
      setError("Could not assign that game.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleAssign} className="flex flex-wrap items-end gap-2">
      <label>
        <span className="label">Admin: give it a month</span>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="input py-2"
          required
        />
      </label>
      <button type="submit" disabled={pending} className="btn-dark btn-sm">
        {pending ? "Assigning…" : "Assign"}
      </button>
      {error ? (
        <p className="w-full text-xs font-semibold text-clay">{error}</p>
      ) : null}
    </form>
  );
}

function EditGameForm({ game, onDone }: { game: Game; onDone: () => void }) {
  const [title, setTitle] = useState(game.title);
  const [platform, setPlatform] = useState(game.platform);
  const [playtimeHours, setPlaytimeHours] = useState(
    game.playtimeHours != null ? String(game.playtimeHours) : "",
  );
  const [description, setDescription] = useState(game.description ?? "");
  const [metascore, setMetascore] = useState(
    game.metascore != null ? String(game.metascore) : "",
  );
  const [tags, setTags] = useState(game.tags.join(", "));
  const [coverUrl, setCoverUrl] = useState(game.coverUrl ?? "");
  const [notes, setNotes] = useState(game.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await updateGame({
        data: {
          gameId: game.id,
          title,
          platform,
          playtimeHours:
            playtimeHours === "" ? null : Number(playtimeHours),
          description,
          metascore: metascore === "" ? null : Number(metascore),
          tags,
          coverUrl,
          notes,
        },
      });
      if ("error" in result) {
        setError(result.error ?? "Could not save the changes.");
        return;
      }
      onDone();
    } catch {
      setError("Could not save the changes. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-7 space-y-4 p-5">
      <h2 className="display text-2xl text-ink">Edit details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Game title *</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={120}
            className="input"
          />
        </label>
        <label className="block">
          <span className="label">Console / platform *</span>
          <input
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            required
            maxLength={60}
            className="input"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
        <label className="block">
          <span className="label">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={2000}
            className="input resize-y"
          />
        </label>
        <div className="grid gap-4">
          <label className="block">
            <span className="label">Time to beat (hours)</span>
            <input
              value={playtimeHours}
              onChange={(event) => setPlaytimeHours(event.target.value)}
              type="number"
              min="0.5"
              max="1000"
              step="0.5"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Metascore</span>
            <input
              value={metascore}
              onChange={(event) => setMetascore(event.target.value)}
              type="number"
              min="0"
              max="100"
              step="1"
              className="input"
            />
          </label>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Tags</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            maxLength={120}
            className="input"
          />
        </label>
        <label className="block">
          <span className="label">Box art URL</span>
          <input
            value={coverUrl}
            onChange={(event) => setCoverUrl(event.target.value)}
            maxLength={500}
            className="input"
          />
        </label>
      </div>
      <label className="block">
        <span className="label">Why this one?</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          maxLength={1000}
          className="input resize-y"
        />
      </label>

      {error ? (
        <p role="alert" className="text-xs font-semibold text-clay">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost btn-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
