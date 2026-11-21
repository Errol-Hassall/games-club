import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { RatingStars } from "#/components/rating";
import { formatMonth } from "#/lib/dates";
import { getStats } from "#/server/club";

export const Route = createFileRoute("/_authed/stats")({
  head: () => ({ meta: [{ title: "Stats · Games Club" }] }),
  loader: () => getStats(),
  component: StatsPage,
});

function Headline({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="display text-4xl text-ink">{value}</p>
      <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
        {label}
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="text-xs font-bold tracking-[0.14em] text-muted uppercase">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted">{children}</p>;
}

function StatsPage() {
  const data = Route.useLoaderData();
  const maxGenreCount = Math.max(1, ...data.topGenres.map((entry) => entry.count));

  return (
    <div>
      <header>
        <p className="eyebrow">The numbers</p>
        <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">Club stats.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Everything the club has played, suggested and rated, in one quiet place.
        </p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Headline label="Members" value={data.members} />
        <Headline label="Games on the shelf" value={data.games} />
        <Headline label="Months planned" value={data.monthsPlanned} />
        <Headline label="Reviews written" value={data.reviews} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title="Most-played genres">
          {data.topGenres.length > 0 ? (
            <ul className="space-y-2.5">
              {data.topGenres.map(({ tag, count }) => (
                <li key={tag} className="flex items-center gap-3 text-sm">
                  <span className="w-24 truncate font-semibold text-ink-soft">
                    {tag}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink/5">
                    <span
                      className="block h-full rounded-full bg-forest"
                      style={{ width: `${(count / maxGenreCount) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 text-right text-xs text-muted">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>
              Nothing played yet — genres will appear here once a month is assigned.
            </EmptyNote>
          )}
        </Panel>

        <Panel title="Best-rated months">
          {data.bestMonths.length > 0 ? (
            <ul className="space-y-3">
              {data.bestMonths.map(({ month, average, count }) => (
                <li
                  key={month}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-semibold text-ink-soft">
                    {formatMonth(month)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <RatingStars rating={average} />
                    <span className="text-xs text-muted">
                      {average.toFixed(1)} ({count})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>
              No reviews yet — the archive is still waiting for its first verdict.
            </EmptyNote>
          )}
        </Panel>

        <Panel title="Best suggestions">
          {data.topSuggesters.length > 0 ? (
            <ul className="space-y-3">
              {data.topSuggesters.map(({ name, average, games }) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-semibold text-ink-soft">{name}</span>
                  <span className="inline-flex items-center gap-2">
                    <RatingStars rating={average} />
                    <span className="text-xs text-muted">
                      {average.toFixed(1)} across {games} rated{" "}
                      {games === 1 ? "game" : "games"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>
              Suggestions will rank here once their months have been reviewed.
            </EmptyNote>
          )}
        </Panel>

        <Panel title="Average rating per reviewer">
          {data.reviewerAverages.length > 0 ? (
            <ul className="space-y-3">
              {data.reviewerAverages.map(({ name, average, count }) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-semibold text-ink-soft">{name}</span>
                  <span className="inline-flex items-center gap-2">
                    <RatingStars rating={average} />
                    <span className="text-xs text-muted">
                      {average.toFixed(1)} ({count}{" "}
                      {count === 1 ? "review" : "reviews"})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>No reviews yet.</EmptyNote>
          )}
        </Panel>
      </div>
    </div>
  );
}
