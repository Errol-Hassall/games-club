import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export const MAX_COVER_BYTES = 5 * 1024 * 1024;

// Uploads are named <uuid> with no extension — the content type is detected
// from magic bytes at upload and serve time. The strict shape is also the
// path-traversal guard for the /api/covers/:filename route.
const COVER_FILENAME_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

export function coversDir(): string {
  const dbPath = process.env.DATABASE_PATH || "./data/games-club.db";
  return join(dirname(dbPath), "covers");
}

export function ensureCoversDir(): string {
  const dir = coversDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function isValidCoverFilename(filename: string): boolean {
  return COVER_FILENAME_PATTERN.test(filename);
}
