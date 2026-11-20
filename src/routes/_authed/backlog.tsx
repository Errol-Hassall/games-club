import { createFileRoute, Link } from "@tanstack/react-router";
import { GameCard } from "#/components/game-card";
import { Icon } from "#/components/icons";
import { getBacklog } from "#/server/club";

export const Route = createFileRoute("/_authed/backlog")({
  head: () => ({ meta: [{ title: "Backlog · Games Club" }] }),
  loader: () => getBacklog(),
  component: BacklogPage,
});

function BacklogPage() {
  const games = Route.useLoaderData();

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

      <p className="mt-8 text-xs font-bold tracking-[0.14em] text-muted uppercase">
        {games.length} {games.length === 1 ? "game" : "games"} waiting
      </p>

      {games.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
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
