import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { CoverArt } from "#/components/cover-art";
import { Icon } from "#/components/icons";
import { formatPlaytime } from "#/lib/dates";
import type { ExternalGame } from "#/server/club";
import { searchExternalGames, suggestGame } from "#/server/club";

export const Route = createFileRoute("/_authed/suggest")({
  head: () => ({ meta: [{ title: "Suggest a game · Games Club" }] }),
  component: SuggestPage,
});

function SuggestPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ExternalGame[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [playtimeHours, setPlaytimeHours] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [externalSource, setExternalSource] = useState("");
  const [externalId, setExternalId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setSearching(true);
    setSearchError(null);
    try {
      const response = await searchExternalGames({ data: { query } });
      setConfigured(response.configured);
      setResults(response.results);
      if (response.error) setSearchError(response.error);
    } catch {
      setSearchError("Search is unavailable right now.");
    } finally {
      setSearching(false);
    }
  }

  function chooseResult(result: ExternalGame) {
    setTitle(result.title);
    setPlatform(result.platform);
    setPlaytimeHours(result.playtimeHours ? String(result.playtimeHours) : "");
    setCoverUrl(result.coverUrl ?? "");
    setExternalSource(result.source);
    setExternalId(result.externalId);
    setResults([]);
    setQuery(result.title);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await suggestGame({
        data: {
          title,
          platform,
          playtimeHours: playtimeHours === "" ? null : Number(playtimeHours),
          coverUrl,
          notes,
          externalSource,
          externalId,
        },
      });
      if ("error" in response) {
        setError(response.error ?? "Could not add that game.");
        return;
      }
      await router.navigate({
        to: "/game/$gameId",
        params: { gameId: String(response.gameId) },
      });
      await router.invalidate();
    } catch {
      setError("Could not add that game. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <header>
        <p className="eyebrow">Add to the shelf</p>
        <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">
          Suggest a game.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Anything goes: a classic nobody has played, a two-hour curiosity, or
          the 80-hour RPG you have been circling for years. If the game database
          is connected, searching fills in the box art, platforms and average
          playtime for you.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="display text-2xl text-ink">Find the game</h2>
              <Icon name="search" className="h-5 w-5 text-clay" />
            </div>
            <form
              onSubmit={handleSearch}
              className="mt-4 flex flex-col gap-2 sm:flex-row"
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input"
                placeholder="Search by title, e.g. Hades"
                aria-label="Search for a game"
                maxLength={80}
              />
              <button
                type="submit"
                disabled={searching || query.trim().length < 2}
                className="btn-dark shrink-0"
              >
                {searching ? "Searching…" : "Search"}
              </button>
            </form>

            {searchError ? (
              <p className="mt-3 text-xs font-semibold text-clay">
                {searchError}
              </p>
            ) : null}
            {configured === false ? (
              <p className="mt-3 rounded-xl bg-forest/5 px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
                Game search is not configured. Set{" "}
                <code className="font-mono">RAWG_API_KEY</code> on the server to
                auto-fill details, or just enter everything below by hand — that
                works perfectly well.
              </p>
            ) : null}

            {results.length > 0 ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {results.map((result) => (
                  <li key={result.externalId}>
                    <button
                      type="button"
                      onClick={() => chooseResult(result)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-cream p-2 text-left transition-colors hover:border-forest"
                    >
                      <CoverArt
                        title={result.title}
                        coverUrl={result.coverUrl}
                        className="h-16 w-12 shrink-0 rounded-md"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-ink">
                          {result.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-muted">
                          {result.platform}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-semibold text-forest">
                          {formatPlaytime(result.playtimeHours)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <form onSubmit={handleSubmit} className="card p-5">
            <h2 className="display text-2xl text-ink">The details</h2>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="label">Game title *</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  maxLength={120}
                  className="input"
                  placeholder="Hades"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Console / platform *</span>
                  <input
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                    required
                    maxLength={60}
                    className="input"
                    placeholder="PC, Switch"
                  />
                </label>
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
                    placeholder="21"
                  />
                </label>
              </div>
              <label className="block">
                <span className="label">Box art URL</span>
                <input
                  value={coverUrl}
                  onChange={(event) => setCoverUrl(event.target.value)}
                  maxLength={500}
                  className="input"
                  placeholder="https://…"
                />
              </label>
              <label className="block">
                <span className="label">Why this one?</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="input resize-y"
                  placeholder="A pitch for the club. Keep it spoiler-free."
                />
              </label>
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-xs font-semibold text-clay">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted">
                Anyone in the club can add a game.
              </p>
              <button type="submit" disabled={pending} className="btn-primary">
                {pending ? "Adding…" : "Add to the shelf"}
                <Icon name="plus" className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        <aside className="card overflow-hidden lg:sticky lg:top-8">
          <CoverArt
            title={title || "Your game"}
            coverUrl={coverUrl || null}
            className="aspect-[3/4] w-full"
          />
          <div className="p-4">
            <p className="eyebrow">Preview</p>
            <h2 className="display mt-2 text-2xl break-words text-ink">
              {title || "Your game"}
            </h2>
            <p className="mt-1 text-xs text-muted">{platform || "Platform"}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {playtimeHours
                ? formatPlaytime(Number(playtimeHours))
                : "Time to beat"}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
