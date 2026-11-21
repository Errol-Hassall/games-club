import { addMonths, monthKey } from "#/lib/dates";

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,23}$/;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

export function cleanOptionalText(
  value: unknown,
  maxLength: number,
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

export function normalizeUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const username = value.trim().toLowerCase();
  return USERNAME_PATTERN.test(username) ? username : null;
}

export function validMonth(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return MONTH_PATTERN.test(value) ? value : null;
}

export function cleanRating(value: unknown): number | null {
  const rating = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
}

export function cleanPlaytime(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const hours = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 1000) return null;
  return Math.round(hours * 10) / 10;
}

export function cleanMetascore(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(score) || score < 0 || score > 100) return null;
  return score;
}

export function cleanCoverUrl(value: unknown): string | null {
  const url = cleanOptionalText(value, 500);
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? url
      : null;
  } catch {
    return null;
  }
}

// Tags are stored as a comma-separated string; these keep both ends tidy.
// Long tags are truncated and the list capped rather than rejected, so a
// clumsy input can never break the form.
export function cleanTags(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const seen = new Set<string>();
  for (const part of value.split(",")) {
    const tag = part.trim().toLowerCase();
    if (!tag) continue;
    seen.add(tag.slice(0, 30));
  }
  return [...seen].slice(0, 10);
}

export function parseTags(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// Identifies an image by its magic bytes so uploads are validated from the
// actual content, not the file name or content type the client sends.
export function detectImageType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpeg";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export function pickRandom<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T | null {
  if (items.length === 0) return null;
  const index = Math.min(
    items.length - 1,
    Math.max(0, Math.floor(random() * items.length)),
  );
  return items[index] ?? null;
}

// Weighted draw: an item's chance is proportional to its weight.
export function pickWeighted<T>(
  items: readonly T[],
  weights: readonly number[],
  random: () => number = Math.random,
): T | null {
  const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (items.length === 0 || total <= 0) return null;
  let roll = random() * total;
  for (let index = 0; index < items.length; index += 1) {
    roll -= Math.max(0, weights[index] ?? 0);
    if (roll < 0) return items[index] ?? null;
  }
  return items[items.length - 1] ?? null;
}

// Drops backlog games whose title matches a played game within the last
// `months` months. shortcut: case-insensitive exact title match — renaming a
// game breaks the match, so upgrade to id-based matching if renames matter.
export function filterRecentlyPlayed<T extends { title: string }>(
  backlog: readonly T[],
  played: readonly { title: string; month: string }[],
  months: number,
): T[] {
  if (months <= 0) return [...backlog];
  const cutoff = addMonths(monthKey(), -months);
  const excluded = new Set(
    played
      .filter((entry) => entry.month >= cutoff)
      .map((entry) => entry.title.toLowerCase()),
  );
  return backlog.filter((game) => !excluded.has(game.title.toLowerCase()));
}
