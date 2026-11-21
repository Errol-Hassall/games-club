import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { CoverArt } from "#/components/cover-art";
import { Icon } from "#/components/icons";
import { formatMonth, formatPlaytime } from "#/lib/dates";
import type { GameWithVotes } from "#/lib/types";
import { pickRandom, pickWeighted } from "#/lib/validation";
import { assignGame } from "#/server/club";

const COLORS = [
  "#234435",
  "#d6502b",
  "#e9b04b",
  "#7c8b5a",
  "#a9553a",
  "#325b4a",
  "#c98a3c",
  "#5c4a3a",
];

export function Wheel({
  games,
  isAdmin,
  nextMonth,
  weightByVotes = false,
}: {
  games: GameWithVotes[];
  isAdmin: boolean;
  nextMonth: string;
  weightByVotes?: boolean;
}) {
  const router = useRouter();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [month, setMonth] = useState(nextMonth);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slice = games.length > 0 ? 360 / games.length : 360;
  const gradient =
    games.length > 0
      ? `conic-gradient(${games
          .map(
            (_, index) =>
              `${COLORS[index % COLORS.length]} ${index * slice}deg ${(index + 1) * slice}deg`,
          )
          .join(", ")})`
      : "conic-gradient(#ded3c0 0deg 360deg)";
  const result = resultIndex === null ? null : (games[resultIndex] ?? null);

  function spin() {
    if (spinning || games.length === 0) return;
    // +1 so a game with zero votes can still be drawn. The slices stay
    // uniform — only the odds follow the votes.
    const chosen = weightByVotes
      ? pickWeighted(
          games.map((_, index) => index),
          games.map((game) => game.voteCount + 1),
        )
      : pickRandom(games.map((_, index) => index));
    if (chosen === null) return;
    const center = (chosen + 0.5) * slice;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (360 - center - current + 720) % 360;
    setPendingIndex(chosen);
    setResultIndex(null);
    setError(null);
    setSpinning(true);
    setRotation(rotation + 360 * 4 + delta);
  }

  async function handleAssign(event: React.FormEvent) {
    event.preventDefault();
    if (!result) return;
    setAssigning(true);
    setError(null);
    try {
      const response = await assignGame({ data: { gameId: result.id, month } });
      if ("error" in response) {
        setError(response.error ?? "Could not assign that game.");
        return;
      }
      await router.navigate({ to: "/month/$month", params: { month } });
      await router.invalidate();
    } catch {
      setError("Could not assign that game.");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col items-center">
        <div className="relative mb-5 h-2 w-0">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-x-8 border-t-[14px] border-x-transparent border-t-ink" />
        </div>
        <div className="relative aspect-square w-full max-w-[340px]">
          <div
            className="wheel-disc absolute inset-0 rounded-full border-[10px] border-cream shadow-[0_22px_50px_-18px_rgba(23,21,15,0.55)]"
            style={{
              background: gradient,
              transform: `rotate(${rotation}deg)`,
            }}
            onTransitionEnd={() => {
              if (!spinning) return;
              setSpinning(false);
              setResultIndex(pendingIndex);
            }}
          />
          <button
            type="button"
            onClick={spin}
            disabled={spinning || games.length === 0}
            className="absolute top-1/2 left-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center rounded-full border-4 border-cream bg-ink text-cream shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Icon name="dice" className="mb-0.5 h-5 w-5" />
            <span className="text-xs font-bold tracking-[0.15em]">
              {spinning ? "SPIN…" : "SPIN"}
            </span>
          </button>
        </div>
        <p className="mt-6 max-w-xs text-center text-xs leading-relaxed text-muted">
          {games.length === 0
            ? "The hat is empty. Suggest a game or relax the options above."
            : `${games.length} games in the hat. The wheel picks, the club decides.`}
        </p>
        {games.length > 0 ? (
          <div className="mt-4 flex max-w-md flex-wrap justify-center gap-1.5">
            {games.map((game) => (
              <span
                key={game.id}
                className="rounded-full border border-line bg-cream px-2.5 py-1 text-[10px] font-semibold text-ink-soft"
              >
                {game.title}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div aria-live="polite" className="min-h-[280px]">
        {result ? (
          <div className="card overflow-hidden">
            <div className="flex gap-4 p-4">
              <CoverArt
                title={result.title}
                coverUrl={result.coverUrl}
                className="w-24 shrink-0 rounded-lg"
                eager
              />
              <div className="min-w-0 py-1">
                <p className="eyebrow">The wheel chose</p>
                <h3 className="display mt-2 text-3xl text-ink">
                  {result.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{result.platform}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <Icon name="clock" className="h-3.5 w-3.5" />
                  {formatPlaytime(result.playtimeHours)}
                </p>
              </div>
            </div>
            <div className="border-t border-line bg-paper/50 p-4">
              {isAdmin ? (
                <form
                  onSubmit={handleAssign}
                  className="flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                  <label className="flex-1">
                    <span className="label">Give it a month</span>
                    <input
                      type="month"
                      value={month}
                      onChange={(event) => setMonth(event.target.value)}
                      className="input"
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={assigning}
                    className="btn-primary"
                  >
                    {assigning ? "Locking in…" : "Lock it in"}
                  </button>
                </form>
              ) : (
                <p className="text-xs leading-relaxed text-muted">
                  An admin can lock this in for {formatMonth(nextMonth)}. Keep
                  voting below to sway the room.
                </p>
              )}
              {error ? (
                <p className="mt-2 text-xs font-semibold text-clay">{error}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-line p-8 text-center">
            <Icon name="sparkles" className="mx-auto h-8 w-8 text-clay" />
            <h3 className="display mt-4 text-2xl text-ink">
              {spinning ? "Round and round…" : "Let fate choose"}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
              Spin the wheel to pull one game out of the backlog. Use the votes
              below if you would rather keep it democratic.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
