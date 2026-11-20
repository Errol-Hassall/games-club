import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyPassword } from "#/lib/auth";
import { getDb } from "#/db";

const directory = mkdtempSync(join(tmpdir(), "games-club-test-"));
const globalDb = globalThis as typeof globalThis & { __gamesClubDb?: unknown };

process.env.DATABASE_PATH = join(directory, "club.db");
process.env.SEED_DEMO = "true";
process.env.ADMIN_USERNAME = "testadmin";
process.env.ADMIN_NAME = "Test Admin";
process.env.ADMIN_PASSWORD = "test-password-123";
globalDb.__gamesClubDb = undefined;

afterAll(() => {
  globalDb.__gamesClubDb = undefined;
  rmSync(directory, { recursive: true, force: true });
});

describe("database bootstrap", () => {
  test("creates the admin and demo club exactly once", () => {
    const db = getDb();

    const admin = db
      .query("SELECT username, name, password_hash, is_admin FROM users WHERE username = ?")
      .get("testadmin") as {
      username: string;
      name: string;
      password_hash: string;
      is_admin: number;
    };
    expect(admin.name).toBe("Test Admin");
    expect(admin.is_admin).toBe(1);
    expect(verifyPassword("test-password-123", admin.password_hash)).toBe(true);

    const counts = db
      .query(
        `SELECT
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM games) AS games,
          (SELECT COUNT(*) FROM assignments) AS assignments,
          (SELECT COUNT(*) FROM reviews) AS reviews,
          (SELECT COUNT(*) FROM votes) AS votes`,
      )
      .get() as Record<string, number>;

    expect(counts.users).toBe(5);
    expect(counts.games).toBe(8);
    expect(counts.assignments).toBe(5);
    expect(counts.reviews).toBe(8);
    expect(counts.votes).toBe(13);

    // A second call reuses the live connection and does not duplicate seed data.
    expect(getDb()).toBe(db);
    const gameCount = db.query("SELECT COUNT(*) AS count FROM games").get() as { count: number };
    expect(gameCount.count).toBe(8);
  });

  test("keeps one assignment per game and month", () => {
    const db = getDb();
    expect(() =>
      db
        .query("INSERT INTO assignments (game_id, month, created_at) VALUES (1, '2030-01', ?)")
        .run(new Date().toISOString()),
    ).toThrow();
    expect(() =>
      db
        .query("INSERT INTO assignments (game_id, month, created_at) VALUES (99, '2020-01', ?)")
        .run(new Date().toISOString()),
    ).toThrow();
  });

  test("cascades a deleted game out of assignments", () => {
    const db = getDb();
    const result = db.query("DELETE FROM games WHERE title = ?").run("Portal 2");
    expect(result.changes).toBe(1);
    const assignment = db
      .query(
        "SELECT COUNT(*) AS count FROM assignments a LEFT JOIN games g ON g.id = a.game_id WHERE g.id IS NULL",
      )
      .get() as { count: number };
    expect(assignment.count).toBe(0);
  });
});
