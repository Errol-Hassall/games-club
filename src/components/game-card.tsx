import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { CoverArt } from "#/components/cover-art";
import { Icon } from "#/components/icons";
import { formatPlaytime } from "#/lib/dates";
import type { GameWithVotes } from "#/lib/types";
import { toggleVote } from "#/server/club";

export function VoteButton({
  gameId,
  voteCount,
  hasVoted,
}: {
  gameId: number;
  voteCount: number;
  hasVoted: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVote(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setPending(true);
    setError(null);
    try {
      const result = await toggleVote({ data: { gameId } });
      if ("error" in result)
        setError(result.error ?? "Could not save your vote.");
      else await router.invalidate();
    } catch {
      setError("Could not save your vote.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleVote}
        disabled={pending}
        aria-pressed={hasVoted}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
          hasVoted
            ? "border-forest bg-forest text-cream"
            : "border-line bg-cream text-ink-soft hover:border-forest hover:text-forest"
        }`}
        title={hasVoted ? "Remove your vote" : "Vote for this game"}
      >
        <Icon name="trophy" className="h-3.5 w-3.5" />
        {voteCount}
        <span className="sr-only">{hasVoted ? "Remove vote" : "Vote"}</span>
      </button>
      {error ? <span className="text-[10px] text-clay">{error}</span> : null}
    </div>
  );
}

export function GameCard({ game }: { game: GameWithVotes }) {
  return (
    <article className="group card flex gap-3 p-3 transition-colors hover:border-ink/30">
      <Link
        to="/game/$gameId"
        params={{ gameId: String(game.id) }}
        className="w-20 shrink-0 overflow-hidden rounded-lg bg-ink/5"
      >
        <CoverArt
          title={game.title}
          coverUrl={game.coverUrl}
          className="aspect-[3/4] w-20 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          to="/game/$gameId"
          params={{ gameId: String(game.id) }}
          className="min-w-0"
        >
          <h3 className="truncate text-sm font-bold text-ink group-hover:text-clay">
            {game.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted">{game.platform}</p>
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
            <Icon name="clock" className="h-3.5 w-3.5" />
            {formatPlaytime(game.playtimeHours)}
          </span>
          <VoteButton
            gameId={game.id}
            voteCount={game.voteCount}
            hasVoted={game.hasVoted}
          />
        </div>
      </div>
    </article>
  );
}
