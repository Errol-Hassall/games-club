import { createFileRoute, Link } from "@tanstack/react-router";
import { CoverArt } from "#/components/cover-art";
import { GameCard } from "#/components/game-card";
import { Icon } from "#/components/icons";
import { RatingStars } from "#/components/rating";
import {
  formatDate,
  formatMonth,
  formatMonthShort,
  formatPlaytime,
  monthEndLabel,
} from "#/lib/dates";
import { getDashboard } from "#/server/club";

export const Route = createFileRoute("/_authed/")({
  head: () => ({ meta: [{ title: "Home · Games Club" }] }),
  loader: () => getDashboard(),
  component: DashboardPage,
});

function DashboardPage() {
  const data = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const firstName = user?.name.split(" ")[0] ?? "friend";
  const current = data.current;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The club room · {formatMonth(data.month)}</p>
          <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">
            Good to see you, {firstName}.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            One game a month, picked together. Here is what the club is playing,
            what is next, and what is still on the shelf.
          </p>
        </div>
        <Link to="/suggest" className="btn-dark shrink-0">
          <Icon name="plus" className="h-4 w-4" />
          Suggest a game
        </Link>
      </header>

      {current ? (
        <section className="relative overflow-hidden rounded-[28px] border border-forest-dark/20 bg-forest text-cream shadow-[0_28px_60px_-32px_rgba(23,21,15,0.6)]">
          <div
            className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full border-[40px] border-cream/5"
            aria-hidden="true"
          />
          <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[230px_1fr] md:items-center md:gap-10 md:p-9">
            <div className="mx-auto w-full max-w-[210px] md:mx-0 md:max-w-none">
              <CoverArt
                title={current.game.title}
                coverUrl={current.game.coverUrl}
                className="aspect-[3/4] w-full rotate-[-1.5deg] rounded-xl shadow-[0_24px_40px_-18px_rgba(0,0,0,0.7)]"
                eager
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.22em] text-gold uppercase">
                Now playing · {formatMonth(current.month)}
              </p>
              <h2 className="display mt-3 text-5xl break-words sm:text-6xl">
                {current.game.title}
              </h2>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-cream/70">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="gamepad" className="h-4 w-4 text-gold" />
                  {current.game.platform}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" className="h-4 w-4 text-gold" />
                  {formatPlaytime(current.game.playtimeHours)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="book" className="h-4 w-4 text-gold" />
                  {current.reviewCount}{" "}
                  {current.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>
              {current.game.notes ? (
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-cream/70 italic">
                  “{current.game.notes}”
                </p>
              ) : null}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/month/$month"
                  params={{ month: current.month }}
                  className="btn-primary"
                >
                  Open the month
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
                <span className="text-[11px] font-medium text-cream/55">
                  Discussion opens after {monthEndLabel(current.month)}
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="card flex flex-col items-start gap-4 border-dashed p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Nothing booked</p>
            <h2 className="display mt-2 text-3xl text-ink">
              {formatMonth(data.month)} is a blank page.
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Add a suggestion or spin the wheel to give this month a game.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/suggest" className="btn-primary">
              Suggest a game
            </Link>
            <Link to="/pick" className="btn-ghost">
              Pick a game
            </Link>
          </div>
        </section>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon="book" value={data.stats.played} label="Months played" />
        <Stat
          icon="shelf"
          value={data.stats.games - data.stats.played}
          label="Games waiting"
        />
        <Stat icon="users" value={data.stats.members} label="Club members" />
        <Stat icon="trophy" value={data.stats.votes} label="Votes cast" />
      </dl>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">On the shelf</p>
              <h2 className="display mt-2 text-3xl text-ink">
                Waiting for a month
              </h2>
            </div>
            <Link
              to="/backlog"
              className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-clay"
            >
              All games <Icon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </div>
          {data.backlog.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.backlog.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="card border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-ink">
                The shelf is empty.
              </p>
              <Link to="/suggest" className="btn-ghost btn-sm mt-3">
                Add the first suggestion
              </Link>
            </div>
          )}
        </section>

        <div className="space-y-8">
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="display text-2xl text-ink">Coming up</h2>
              <Icon name="calendar" className="h-5 w-5 text-clay" />
            </div>
            {data.upcoming.length > 0 ? (
              <ul className="mt-4 divide-y divide-line">
                {data.upcoming.map((entry) => (
                  <li
                    key={entry.month}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Link
                      to="/month/$month"
                      params={{ month: entry.month }}
                      className="w-11 shrink-0 overflow-hidden rounded-md"
                    >
                      <CoverArt
                        title={entry.game.title}
                        coverUrl={entry.game.coverUrl}
                        className="aspect-[3/4] w-11"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/month/$month"
                        params={{ month: entry.month }}
                        className="block truncate text-sm font-bold text-ink hover:text-clay"
                      >
                        {entry.game.title}
                      </Link>
                      <p className="text-[11px] font-semibold text-muted">
                        {formatMonthShort(entry.month)}
                      </p>
                    </div>
                    <span className="badge">Booked</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-muted">
                No future months booked yet. The wheel is feeling left out.
              </p>
            )}
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="display text-2xl text-ink">From the club</h2>
              <Link
                to="/played"
                className="text-xs font-bold text-forest hover:text-clay"
              >
                All reviews
              </Link>
            </div>
            {data.recentReviews.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {data.recentReviews.map((review) => (
                  <li key={review.id} className="border-l-2 border-gold pl-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to="/month/$month"
                        params={{ month: review.month }}
                        className="text-xs font-bold text-forest hover:text-clay"
                      >
                        {review.gameTitle}
                      </Link>
                      <RatingStars rating={review.rating} size="h-3 w-3" />
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-soft">
                      “{review.body}”
                    </p>
                    <p className="mt-1.5 text-[10px] font-semibold text-muted">
                      {review.authorName} · {formatDate(review.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-muted">
                No reviews yet. The first finished month will show up here.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: "book" | "shelf" | "users" | "trophy";
  value: number;
  label: string;
}) {
  return (
    <div className="card p-4">
      <Icon name={icon} className="h-4 w-4 text-clay" />
      <dd className="display mt-3 text-3xl text-ink">{value}</dd>
      <dt className="mt-0.5 text-[10px] font-bold tracking-[0.12em] text-muted uppercase">
        {label}
      </dt>
    </div>
  );
}
