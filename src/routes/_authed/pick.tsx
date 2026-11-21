import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CoverArt } from "#/components/cover-art";
import { VoteButton } from "#/components/game-card";
import { Icon } from "#/components/icons";
import { Wheel } from "#/components/wheel";
import { formatMonth, formatPlaytime } from "#/lib/dates";
import { filterRecentlyPlayed } from "#/lib/validation";
import { getPickData } from "#/server/club";

export const Route = createFileRoute("/_authed/pick")({
  head: () => ({ meta: [{ title: "Pick a game · Games Club" }] }),
  loader: () => getPickData(),
  component: PickPage,
});

function PickPage() {
  const data = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const [weightByVotes, setWeightByVotes] = useState(false);
  const [skipMonths, setSkipMonths] = useState(0);
  const maxVotes = Math.max(1, ...data.backlog.map((game) => game.voteCount));
  const hatGames = filterRecentlyPlayed(
    data.backlog,
    data.recentlyPlayed,
    skipMonths,
  );

  return (
    <div>
      <header>
        <p className="eyebrow">Democracy or chaos</p>
        <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">
          Pick the next game.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Vote for anything on the shelf, or let the wheel settle it. The next
          open month is{" "}
          <strong className="font-bold text-ink">
            {formatMonth(data.nextMonth)}
          </strong>
          .
        </p>
      </header>

      <section className="card mt-8 p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line pb-4">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink-soft">
            <input
              type="checkbox"
              checked={weightByVotes}
              onChange={(event) => setWeightByVotes(event.target.checked)}
              className="h-3.5 w-3.5 accent-[#234435]"
            />
            Weight by votes
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
            Skip recently played
            <select
              value={skipMonths}
              onChange={(event) => setSkipMonths(Number(event.target.value))}
              className="input py-1.5 text-xs"
            >
              <option value={0}>Never</option>
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </label>
        </div>
        <Wheel
          games={hatGames}
          isAdmin={user?.isAdmin ?? false}
          nextMonth={data.nextMonth}
          weightByVotes={weightByVotes}
        />
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">On the ballot</p>
            <h2 className="display mt-2 text-3xl text-ink">Cast your votes</h2>
          </div>
          <p className="text-xs text-muted">
            Votes are a nudge, not a binding result. An admin locks in the
            month.
          </p>
        </div>

        {data.backlog.length > 0 ? (
          <ol className="mt-5 space-y-2">
            {data.backlog.map((game, index) => (
              <li
                key={game.id}
                className="card flex items-center gap-3 p-3 transition-colors hover:border-ink/25 sm:gap-4 sm:p-4"
              >
                <span className="hidden w-5 shrink-0 text-center text-xs font-bold text-muted sm:block">
                  {index + 1}
                </span>
                <Link
                  to="/game/$gameId"
                  params={{ gameId: String(game.id) }}
                  className="w-12 shrink-0 overflow-hidden rounded-md sm:w-14"
                >
                  <CoverArt
                    title={game.title}
                    coverUrl={game.coverUrl}
                    className="aspect-[3/4] w-full"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/game/$gameId"
                    params={{ gameId: String(game.id) }}
                    className="block truncate text-sm font-bold text-ink hover:text-clay sm:text-base"
                  >
                    {game.title}
                  </Link>
                  <p className="truncate text-xs text-muted">{game.platform}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-line/70">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{
                          width: `${(game.voteCount / maxVotes) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-muted">
                      {formatPlaytime(game.playtimeHours)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <VoteButton
                    gameId={game.id}
                    voteCount={game.voteCount}
                    hasVoted={game.hasVoted}
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="card mt-5 border-dashed p-10 text-center">
            <Icon name="dice" className="mx-auto h-8 w-8 text-clay" />
            <p className="mt-3 text-sm font-semibold text-ink">
              Nothing to pick from yet.
            </p>
            <Link to="/suggest" className="btn-ghost btn-sm mt-3">
              Suggest a game
            </Link>
          </div>
        )}
      </section>

      {data.current ? (
        <p className="mt-10 text-center text-xs text-muted">
          Currently playing{" "}
          <Link
            to="/month/$month"
            params={{ month: data.current.month }}
            className="font-bold text-forest underline-offset-4 hover:underline"
          >
            {data.current.game.title}
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
