import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { hashPassword } from "#/lib/auth";
import { addMonths, monthKey } from "#/lib/dates";

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  cover_url TEXT,
  playtime_hours REAL,
  notes TEXT,
  external_source TEXT,
  external_id TEXT,
  suggested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  month TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(assignment_id, user_id)
);

CREATE TABLE IF NOT EXISTS votes (
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_assignment ON reviews(assignment_id);
CREATE INDEX IF NOT EXISTS idx_votes_game ON votes(game_id);
`;

type DbGlobal = typeof globalThis & { __gamesClubDb?: Database };

function databasePath(): string {
  return process.env.DATABASE_PATH || "./data/games-club.db";
}

export function getDb(): Database {
  const global = globalThis as DbGlobal;
  if (global.__gamesClubDb) return global.__gamesClubDb;

  const path = databasePath();
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path, { create: true });
  db.exec(SCHEMA);
  ensureAdmin(db);
  seedDemo(db);
  global.__gamesClubDb = db;
  return db;
}

type AdminRow = { id: number };

function ensureAdmin(db: Database): void {
  const admin = db
    .query("SELECT id FROM users WHERE is_admin = 1 LIMIT 1")
    .get() as AdminRow | null;
  if (admin) return;

  const username = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const name = (process.env.ADMIN_NAME || "Club Admin").trim() || "Club Admin";
  const password = process.env.ADMIN_PASSWORD || "changeme123";
  const existing = db
    .query("SELECT id FROM users WHERE username = ?")
    .get(username) as AdminRow | null;

  if (existing) {
    db.query("UPDATE users SET is_admin = 1 WHERE id = ?").run(existing.id);
    return;
  }

  db.query(
    "INSERT INTO users (username, name, password_hash, is_admin, created_at) VALUES (?, ?, ?, 1, ?)",
  ).run(username, name, hashPassword(password), new Date().toISOString());
}

type SeedGame = {
  title: string;
  platform: string;
  cover: string;
  playtime: number;
  notes: string;
  month?: number;
  votes?: number[];
  reviews?: Array<{ user: number; rating: number; body: string }>;
};

const SEED_USERS = [
  { username: "maya", name: "Maya Chen" },
  { username: "tom", name: "Tom Okafor" },
  { username: "priya", name: "Priya Nair" },
  { username: "sam", name: "Sam Whitlock" },
];

const SEED_GAMES: SeedGame[] = [
  {
    title: "Hades",
    platform: "PC, Switch",
    cover: "/covers/hades.jpg",
    playtime: 21,
    notes:
      "Fast, clever and endlessly replayable. Suggested after the roguelike chat.",
    month: 0,
    votes: [0, 1, 2],
  },
  {
    title: "Outer Wilds",
    platform: "PC, PS5, Xbox",
    cover: "/covers/outer-wilds.jpg",
    playtime: 16,
    notes:
      "A mystery you can only solve once. No spoilers in the chat, please.",
    month: 1,
    votes: [1, 3],
  },
  {
    title: "Stardew Valley",
    platform: "PC, Switch",
    cover: "/covers/stardew-valley.jpg",
    playtime: 53,
    notes: "The comfort game to end all comfort games.",
    month: -1,
    reviews: [
      {
        user: 0,
        rating: 5,
        body: "I lost an entire weekend to the farm and regret nothing. The pacing is gentle but there is always one more thing to do before bed. The multiplayer farm with Tom turned into a nightly ritual.",
      },
      {
        user: 1,
        rating: 4,
        body: "Charming, huge and quietly generous. It took me a while to stop optimising and just live in the valley, but once I did it clicked. Fishing can get in the bin.",
      },
      {
        user: 3,
        rating: 3,
        body: "Lovely art and music, but the first few hours are a grind. It opens up once the town starts remembering you. Worth sticking with.",
      },
    ],
  },
  {
    title: "Disco Elysium",
    platform: "PC, PS5",
    cover: "/covers/disco-elysium.jpg",
    playtime: 23,
    notes: "A detective story where the real case is the guy you are playing.",
    month: -2,
    reviews: [
      {
        user: 2,
        rating: 5,
        body: "The writing is the game and the game is extraordinary. Every skill check felt like a personality test. I have never been so happy to fail a dice roll.",
      },
      {
        user: 0,
        rating: 5,
        body: "Funny, bleak and deeply humane. Revachol feels more lived-in than most open worlds ten times its size. The final conversation has stayed with me for weeks.",
      },
      {
        user: 1,
        rating: 4,
        body: "Dense in the best way. I had to play in longer sessions to keep the voice of the world in my head. The politics are sharp and never simple.",
      },
    ],
  },
  {
    title: "Portal 2",
    platform: "PC, PS3, Xbox 360",
    cover: "/covers/portal-2.jpg",
    playtime: 11,
    notes: "Still the gold standard for a game that respects your time.",
    month: -3,
    reviews: [
      {
        user: 3,
        rating: 5,
        body: "Perfect length, perfect jokes, perfect ending. The co-op campaign is a brilliant bonus. Not a minute wasted.",
      },
      {
        user: 0,
        rating: 5,
        body: "Replayed it for the club and it holds up completely. The teaching is invisible: you learn the language of the room without a single tutorial box.",
      },
    ],
  },
  {
    title: "Celeste",
    platform: "PC, Switch",
    cover: "/covers/celeste.jpg",
    playtime: 9,
    notes: "Precision platforming with a story about being kind to yourself.",
    votes: [0, 2, 3],
  },
  {
    title: "Elden Ring",
    platform: "PC, PS5, Xbox",
    cover: "/covers/elden-ring.jpg",
    playtime: 58,
    notes: "Open world souls. Bring a notebook and a lot of patience.",
    votes: [1, 2],
  },
  {
    title: "Baldur's Gate 3",
    platform: "PC, PS5",
    cover: "/covers/baldurs-gate-3.jpg",
    playtime: 75,
    notes: "The big one. Would need a two-month slot, honestly.",
    votes: [0, 2, 3],
  },
];

function seedDemo(db: Database): void {
  if (process.env.SEED_DEMO !== "true") return;
  const gameCount = db.query("SELECT COUNT(*) AS count FROM games").get() as {
    count: number;
  };
  if (gameCount.count > 0) return;

  const now = new Date();
  const memberIds: number[] = [];
  for (const user of SEED_USERS) {
    const existing = db
      .query("SELECT id FROM users WHERE username = ?")
      .get(user.username) as AdminRow | null;
    if (existing) {
      memberIds.push(existing.id);
      continue;
    }
    const result = db
      .query(
        "INSERT INTO users (username, name, password_hash, is_admin, created_at) VALUES (?, ?, ?, 0, ?)",
      )
      .run(
        user.username,
        user.name,
        hashPassword("gamesclub"),
        now.toISOString(),
      );
    memberIds.push(Number(result.lastInsertRowid));
  }

  const admin = db
    .query("SELECT id FROM users WHERE is_admin = 1 LIMIT 1")
    .get() as AdminRow | null;
  const suggestedBy = admin?.id ?? memberIds[0];

  for (const game of SEED_GAMES) {
    const result = db
      .query(
        "INSERT INTO games (title, platform, cover_url, playtime_hours, notes, suggested_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        game.title,
        game.platform,
        game.cover,
        game.playtime,
        game.notes,
        suggestedBy ?? null,
        now.toISOString(),
      );
    const gameId = Number(result.lastInsertRowid);

    if (game.month !== undefined) {
      const month = addMonths(monthKey(now), game.month);
      const assignment = db
        .query(
          "INSERT INTO assignments (game_id, month, created_at) VALUES (?, ?, ?)",
        )
        .run(gameId, month, now.toISOString());
      const assignmentId = Number(assignment.lastInsertRowid);

      for (const review of game.reviews ?? []) {
        const userId = memberIds[review.user];
        if (!userId) continue;
        const day = 26 + (review.user % 3);
        db.query(
          "INSERT INTO reviews (assignment_id, user_id, rating, body, created_at) VALUES (?, ?, ?, ?, ?)",
        ).run(
          assignmentId,
          userId,
          review.rating,
          review.body,
          `${month}-${day}T19:00:00.000Z`,
        );
      }
    }

    for (const voter of game.votes ?? []) {
      const userId = memberIds[voter];
      if (!userId) continue;
      db.query(
        "INSERT OR IGNORE INTO votes (game_id, user_id, created_at) VALUES (?, ?, ?)",
      ).run(gameId, userId, now.toISOString());
    }
  }
}
