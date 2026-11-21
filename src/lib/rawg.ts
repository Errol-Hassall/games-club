import { cleanMetascore } from "#/lib/validation";

// The subset of a RAWG search result the app actually uses.
export type RawgGame = {
  id: number;
  name: string;
  background_image?: string | null;
  description_raw?: string | null;
  metascore?: number | null;
  playtime?: number;
  platforms?: Array<{ platform: { name: string } }>;
};

export type ExternalGame = {
  title: string;
  platform: string;
  coverUrl: string | null;
  description: string | null;
  metascore: number | null;
  playtimeHours: number | null;
  source: string;
  externalId: string;
};

// RAWG wraps descriptions in HTML and blank lines; strip it to plain text.
function cleanDescription(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 2000) : null;
}

export function mapRawgGame(game: RawgGame): ExternalGame {
  return {
    title: game.name,
    platform:
      game.platforms
        ?.slice(0, 3)
        .map((entry) => entry.platform.name)
        .join(", ") || "Unknown",
    coverUrl: game.background_image ?? null,
    description: cleanDescription(game.description_raw),
    metascore: cleanMetascore(game.metascore),
    playtimeHours: game.playtime && game.playtime > 0 ? game.playtime : null,
    source: "rawg",
    externalId: String(game.id),
  };
}
