import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "#/components/app-shell";
import { CoverArt } from "#/components/cover-art";
import { Icon } from "#/components/icons";
import { AverageRating, RatingStars } from "#/components/rating";
import {
  formatDate,
  formatMonth,
  formatPlaytime,
  monthEndLabel,
} from "#/lib/dates";
import type { MonthDetail } from "#/lib/types";
import { addReview, getMonth } from "#/server/club";

export const Route = createFileRoute("/_authed/month/$month")({
  head: ({ params }) => ({
    meta: [{ title: `${formatMonth(params.month)} · Games Club` }],
  }),
  loader: ({ params }) => getMonth({ data: { month: params.month } }),
  component: MonthPage,
});

function MonthPage() {
  const data = Route.useLoaderData() as MonthDetail | null;
  const router = useRouter();

  if (!data) {
    return (
      <div className="card border-dashed p-12 text-center">
        <h1 className="display text-3xl text-ink">No game for that month.</h1>
        <Link to="/" className="btn-primary mt-5">
          Back to the club
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/played"
        className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-clay"
      >
        <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
        The archive
      </Link>

      <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">
            {formatMonth(data.month)} ·{" "}
            {data.canReview ? "Played" : "In the diary"}
          </p>
          <h1 className="display mt-3 text-4xl text-ink sm:text-6xl">
            {data.game.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="gamepad" className="h-4 w-4 text-clay" />
              {data.game.platform}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" className="h-4 w-4 text-clay" />
              {formatPlaytime(data.game.playtimeHours)}
            </span>
            <AverageRating
              rating={data.averageRating}
              count={data.reviewCount}
            />
          </div>
        </div>
        <Link
          to="/game/$gameId"
          params={{ gameId: String(data.game.id) }}
          className="btn-ghost btn-sm"
        >
          Game details
          <Icon name="arrow" className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="display text-3xl text-ink">The discussion</h2>
              <span className="badge">
                {data.reviewCount}{" "}
                {data.reviewCount === 1 ? "review" : "reviews"}
              </span>
            </div>

            {data.canReview ? (
              <ReviewForm
                assignmentId={data.id}
                initialBody={data.myReview?.body ?? ""}
                initialPros={data.myReview?.pros ?? ""}
                initialCons={data.myReview?.cons ?? ""}
                initialRating={data.myReview?.rating ?? 0}
                onSaved={() => router.invalidate()}
              />
            ) : (
              <div className="card mt-4 border-dashed p-5">
                <p className="text-sm font-semibold text-ink">
                  The discussion is still closed.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Reviews open once {formatMonth(data.month)} ends on{" "}
                  {monthEndLabel(data.month)}. Finish the game and come back
                  with thoughts.
                </p>
              </div>
            )}

            {data.reviews.length > 0 ? (
              <ul className="mt-6 space-y-4">
                {data.reviews.map((review) => (
                  <li key={review.id} className="card p-5">
                    <div className="flex items-start gap-3">
                      <Avatar name={review.authorName} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-ink">
                              {review.authorName}
                            </p>
                            <p className="text-[11px] text-muted">
                              @{review.authorUsername} ·{" "}
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                          <RatingStars rating={review.rating} />
                        </div>
                        <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-soft">
                          {review.body}
                        </p>
                        {review.pros || review.cons ? (
                          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                            {review.pros ? (
                              <p className="text-xs leading-relaxed text-forest">
                                <span className="font-bold">Pros · </span>
                                {review.pros}
                              </p>
                            ) : null}
                            {review.cons ? (
                              <p className="text-xs leading-relaxed text-clay">
                                <span className="font-bold">Cons · </span>
                                {review.cons}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-muted">
                {data.canReview
                  ? "No reviews yet. You can be the first to say something nice (or not)."
                  : "Nobody has written a review yet."}
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card overflow-hidden">
            <CoverArt
              title={data.game.title}
              coverUrl={data.game.coverUrl}
              className="aspect-[3/4] w-full"
              eager
            />
            <div className="p-4">
              <p className="label">Club notes</p>
              <p className="text-sm leading-relaxed text-ink-soft">
                {data.game.notes ||
                  "No notes on this one. Play it and find out."}
              </p>
              <p className="mt-4 border-t border-line pt-3 text-[11px] text-muted">
                Suggested by{" "}
                <span className="font-bold text-ink-soft">
                  {data.game.suggestedByName ?? "a mystery member"}
                </span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReviewForm({
  assignmentId,
  initialBody,
  initialPros,
  initialCons,
  initialRating,
  onSaved,
}: {
  assignmentId: number;
  initialBody: string;
  initialPros: string;
  initialCons: string;
  initialRating: number;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(initialRating);
  const [body, setBody] = useState(initialBody);
  const [pros, setPros] = useState(initialPros);
  const [cons, setCons] = useState(initialCons);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const result = await addReview({
        data: { assignmentId, rating, body, pros, cons },
      });
      if ("error" in result) {
        setError(result.error ?? "Could not save your review.");
        return;
      }
      setSaved(true);
      onSaved();
    } catch {
      setError("Could not save your review. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-4 border-forest/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">
          {initialBody ? "Edit your review" : "Add your review"}
        </h3>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Your rating"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="cursor-pointer p-0.5 transition-transform hover:scale-110"
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <span className="sr-only">{value} out of 5</span>
              <Icon
                name="star"
                filled={value <= rating}
                className={`h-6 w-6 ${value <= rating ? "text-gold" : "text-line"}`}
              />
            </label>
          ))}
        </div>
      </div>
      <label className="mt-4 block">
        <span className="sr-only">Your thoughts</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          maxLength={2000}
          required
          minLength={3}
          placeholder="What worked, what did not, who should play it next…"
          className="input resize-y"
        />
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Pros</span>
          <textarea
            value={pros}
            onChange={(event) => setPros(event.target.value)}
            rows={2}
            maxLength={500}
            placeholder="What did the club love?"
            className="input resize-y"
          />
        </label>
        <label className="block">
          <span className="label">Cons</span>
          <textarea
            value={cons}
            onChange={(event) => setCons(event.target.value)}
            rows={2}
            maxLength={500}
            placeholder="What fell short?"
            className="input resize-y"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-muted">{body.length}/2000</p>
        <div className="flex items-center gap-3">
          {saved ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest">
              <Icon name="check" className="h-4 w-4" /> Saved
            </span>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="btn-primary btn-sm"
          >
            {pending
              ? "Saving…"
              : initialBody
                ? "Update review"
                : "Post review"}
          </button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs font-semibold text-clay">
          {error}
        </p>
      ) : null}
    </form>
  );
}
