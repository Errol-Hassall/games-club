import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GameCard } from "#/components/game-card";
import { Icon } from "#/components/icons";
import { getBacklog } from "#/server/club";

export const Route = createFileRoute("/_authed/backlog")({
  head: () => ({ meta: [{ title: "Backlog · Games Club" }] }),
  loader: () => getBacklog(),
  component: BacklogPage,
});

// 0 = off, 1 = only games with this tag, 2 = hide games with this tag.
type TagState = Record<string, number>;

function matches(gameTags: string[], state: TagState): boolean {
  return Object.entries(state).every(([tag, mode]) => {
    const has = gameTags.includes(tag);
    if (mode === 0) return true;
    return mode === 1 ? has : !has;
  });
}

function BacklogPage() {
  const games = Route.useLoaderData();
  const [tagState, setTagState] = useState<TagState>({});

  const tagCounts = new Map<string, number>();
  for (const game of games)
    for (const tag of game.tags)
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  const allTags = [...tagCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const filtering = Object.values(tagState).some((mode) => mode !== 0);
  const visible = games.filter((game) => matches(game.tags, tagState));

  function cycleTag(tag: string) {
    setTagState((previous) => ({
      ...previous,
      [tag]: ((previous[tag] ?? 0) + 1) % 3,
    }));
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The shelf</p>
          <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">
            The backlog.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Every game the club has suggested but not scheduled yet. Vote for
            what you fancy, or leave it to the wheel.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/pick" className="btn-ghost">
            <Icon name="dice" className="h-4 w-4" />
            Pick one
          </Link>
          <Link to="/suggest" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Suggest
          </Link>
        </div>
      </header>

      {allTags.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
            Filter
          </span>
          {allTags.map(([tag, count]) => {
            const mode = tagState[tag] ?? 0;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => cycleTag(tag)}
                title={`Click to keep only “${tag}”, click again to hide it`}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${
                  mode === 1
                    ? "border-forest bg-forest text-cream"
                    : mode === 2
                      ? "border-clay bg-clay/10 text-clay line-through"
                      : "border-line bg-cream text-ink-soft hover:border-forest"
                }`}
              >
                {tag} · {count}
              </button>
            );
          })}
          {filtering ? (
            <button
              type="button"
              onClick={() => setTagState({})}
              className="rounded-full px-2.5 py-1 text-[10px] font-bold text-muted underline-offset-2 hover:text-clay hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="mt-6 text-xs font-bold tracking-[0.14em] text-muted uppercase">
        {filtering
          ? `${visible.length} of ${games.length} ${games.length === 1 ? "game" : "games"}`
          : `${games.length} ${games.length === 1 ? "game" : "games"} waiting`}
      </p>

      {visible.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : filtering ? (
        <div className="card mt-3 flex flex-col items-center border-dashed px-6 py-16 text-center">
          <h2 className="display mt-4 text-3xl text-ink">
            Nothing matches those tags.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Loosen the filter or clear it to see the whole shelf.
          </p>
          <button
            type="button"
            onClick={() => setTagState({})}
            className="btn-ghost mt-5"
          >
            Clear the filter
          </button>
        </div>
      ) : (
        <div className="card mt-3 flex flex-col items-center border-dashed px-6 py-16 text-center">
          <Icon name="shelf" className="h-9 w-9 text-clay" />
          <h2 className="display mt-4 text-3xl text-ink">
            Nothing on the shelf.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Time to fix that. Any member can add a game, with or without box
            art.
          </p>
          <Link to="/suggest" className="btn-primary mt-5">
            Suggest a game
          </Link>
        </div>
      )}
    </div>
  );
}
