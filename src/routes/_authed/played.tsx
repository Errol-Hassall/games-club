import { createFileRoute, Link } from "@tanstack/react-router";
import { CoverArt } from "#/components/cover-art";
import { Icon } from "#/components/icons";
import { AverageRating } from "#/components/rating";
import { formatMonth, formatPlaytime } from "#/lib/dates";
import { getPlayed } from "#/server/club";

export const Route = createFileRoute("/_authed/played")({
  head: () => ({ meta: [{ title: "Played · Games Club" }] }),
  loader: () => getPlayed(),
  component: PlayedPage,
});

function PlayedPage() {
  const months = Route.useLoaderData();

  return (
    <div>
      <header>
        <p className="eyebrow">The archive</p>
        <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">
          Every month, remembered.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Look up anything the club has played and see what everyone made of it.
          No score is the final word.
        </p>
      </header>

      {months.length > 0 ? (
        <div className="mt-8 space-y-4">
          {months.map((entry) => (
            <article
              key={entry.month}
              className="card grid gap-4 p-4 sm:grid-cols-[110px_1fr] sm:gap-6 sm:p-5"
            >
              <Link
                to="/month/$month"
                params={{ month: entry.month }}
                className="hidden overflow-hidden rounded-lg sm:block"
              >
                <CoverArt
                  title={entry.game.title}
                  coverUrl={entry.game.coverUrl}
                  className="aspect-[3/4] w-full transition-transform duration-300 hover:scale-[1.03]"
                />
              </Link>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge-clay">{formatMonth(entry.month)}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                    <Icon name="clock" className="h-3.5 w-3.5" />
                    {formatPlaytime(entry.game.playtimeHours)}
                  </span>
                  <AverageRating
                    rating={entry.averageRating}
                    count={entry.reviewCount}
                  />
                </div>
                <Link
                  to="/month/$month"
                  params={{ month: entry.month }}
                  className="mt-2 block"
                >
                  <h2 className="display text-3xl text-ink hover:text-clay">
                    {entry.game.title}
                  </h2>
                </Link>
                <p className="mt-1 text-xs text-muted">{entry.game.platform}</p>
                {entry.latestReview ? (
                  <blockquote className="mt-3 border-l-2 border-gold pl-3">
                    <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">
                      “{entry.latestReview.body}”
                    </p>
                    <footer className="mt-1.5 text-[11px] font-semibold text-muted">
                      {entry.latestReview.authorName}
                    </footer>
                  </blockquote>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    No reviews were written for this month.
                  </p>
                )}
                <Link
                  to="/month/$month"
                  params={{ month: entry.month }}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-clay"
                >
                  Read the discussion{" "}
                  <Icon name="arrow" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card mt-8 flex flex-col items-center border-dashed px-6 py-16 text-center">
          <Icon name="book" className="h-9 w-9 text-clay" />
          <h2 className="display mt-4 text-3xl text-ink">
            No months in the archive yet.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Once a month wraps up, the reviews and ratings live here.
          </p>
          <Link to="/" className="btn-primary mt-5">
            Back to the club
          </Link>
        </div>
      )}
    </div>
  );
}
