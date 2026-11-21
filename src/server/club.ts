import { createServerFn } from "@tanstack/react-start";
import { getDb } from "#/db";
import {
  addMonths,
  formatMonth,
  isPastMonth,
  monthKey,
  nextMonth,
} from "#/lib/dates";
import { topGenres } from "#/lib/stats";
import type {
  Assignment,
  DashboardData,
  Game,
  GameDetail,
  GameWithVotes,
  MonthDetail,
  PickData,
  PlayedMonth,
  Review,
  StatsData,
} from "#/lib/types";
import {
  cleanCoverUrl,
  cleanOptionalText,
  cleanPlaytime,
  cleanRating,
  cleanTags,
  cleanText,
  parseTags,
  validMonth,
} from "#/lib/validation";
import { requireAdmin, requireUser } from "#/server/session";

type GameRow = {
  id: number;
  title: string;
  platform: string;
  cover_url: string | null;
  playtime_hours: number | null;
  notes: string | null;
  genres: string | null;
  suggested_by_name: string | null;
  created_at: string;
};

type GameWithVotesRow = GameRow & {
  vote_count: number;
  has_voted: number | null;
};

type ReviewRow = {
  id: number;
  rating: number;
  body: string;
  created_at: string;
  author_name: string;
  author_username: string;
};

type AssignmentRow = GameRow & {
  assignment_id: number;
  month: string;
  assigned_at: string;
};

const GAME_COLUMNS = `
  g.id, g.title, g.platform, g.cover_url, g.playtime_hours, g.notes, g.genres, g.created_at,
  u.name AS suggested_by_name`;

function mapGame(row: GameRow): Game {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    coverUrl: row.cover_url,
    playtimeHours: row.playtime_hours,
    notes: row.notes,
    tags: parseTags(row.genres),
    suggestedByName: row.suggested_by_name,
    createdAt: row.created_at,
  };
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
    authorName: row.author_name,
    authorUsername: row.author_username,
  };
}

function loadReviews(assignmentId: number): Review[] {
  const rows = getDb()
    .query(
      `SELECT r.id, r.rating, r.body, r.created_at, u.name AS author_name, u.username AS author_username
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.assignment_id = ?
       ORDER BY r.created_at DESC`,
    )
    .all(assignmentId) as ReviewRow[];
  return rows.map(mapReview);
}

function loadAssignment(month: string, userId: number): Assignment | null {
  const row = getDb()
    .query(
      `SELECT ${GAME_COLUMNS}, a.id AS assignment_id, a.month, a.created_at AS assigned_at
       FROM assignments a
       JOIN games g ON g.id = a.game_id
       LEFT JOIN users u ON u.id = g.suggested_by
       WHERE a.month = ?`,
    )
    .get(month) as AssignmentRow | null;
  if (!row) return null;

  const reviews = loadReviews(row.assignment_id);
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;

  return {
    id: row.assignment_id,
    month: row.month,
    createdAt: row.assigned_at,
    game: mapGame(row),
    reviews,
    reviewCount: reviews.length,
    averageRating: average,
    myReview:
      reviews.find((review) => review.authorUsername === getUsername(userId)) ??
      null,
  };
}

function getUsername(userId: number): string {
  const row = getDb()
    .query("SELECT username FROM users WHERE id = ?")
    .get(userId) as {
    username: string;
  } | null;
  return row?.username ?? "";
}

function loadBacklog(userId: number): GameWithVotes[] {
  const rows = getDb()
    .query(
      `SELECT ${GAME_COLUMNS},
              COUNT(v.user_id) AS vote_count,
              COALESCE(MAX(CASE WHEN v.user_id = ? THEN 1 ELSE 0 END), 0) AS has_voted
       FROM games g
       LEFT JOIN users u ON u.id = g.suggested_by
       LEFT JOIN votes v ON v.game_id = g.id
       WHERE NOT EXISTS (SELECT 1 FROM assignments a WHERE a.game_id = g.id)
       GROUP BY g.id
       ORDER BY vote_count DESC, g.created_at ASC`,
    )
    .all(userId) as GameWithVotesRow[];

  return rows.map((row) => ({
    ...mapGame(row),
    voteCount: row.vote_count,
    hasVoted: Boolean(row.has_voted),
  }));
}

function openPickMonth(): string {
  const db = getDb();
  let month = nextMonth();
  for (let step = 0; step < 36; step += 1) {
    if (!db.query("SELECT 1 FROM assignments WHERE month = ?").get(month))
      return month;
    month = addMonths(month, 1);
  }
  return month;
}

export const getDashboard = createServerFn({ method: "GET" }).handler(
  (): DashboardData => {
    const user = requireUser();
    const db = getDb();
    const currentMonth = monthKey();

    const upcomingRows = db
      .query(
        `SELECT ${GAME_COLUMNS}, a.month
       FROM assignments a
       JOIN games g ON g.id = a.game_id
       LEFT JOIN users u ON u.id = g.suggested_by
       WHERE a.month > ?
       ORDER BY a.month ASC
       LIMIT 3`,
      )
      .all(currentMonth) as Array<GameRow & { month: string }>;

    const recentRows = db
      .query(
        `SELECT r.id, r.rating, r.body, r.created_at, u.name AS author_name, u.username AS author_username,
              g.title AS game_title, g.id AS game_id, a.month
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN assignments a ON a.id = r.assignment_id
       JOIN games g ON g.id = a.game_id
       ORDER BY r.created_at DESC
       LIMIT 3`,
      )
      .all() as Array<
      ReviewRow & { game_title: string; game_id: number; month: string }
    >;

    const stats = db
      .query(
        `SELECT
         (SELECT COUNT(*) FROM users) AS members,
         (SELECT COUNT(*) FROM games) AS games,
         (SELECT COUNT(*) FROM assignments WHERE month < ?) AS played,
         (SELECT COUNT(*) FROM votes) AS votes`,
      )
      .get(currentMonth) as {
      members: number;
      games: number;
      played: number;
      votes: number;
    };

    return {
      month: currentMonth,
      current: loadAssignment(currentMonth, user.id),
      upcoming: upcomingRows.map((row) => ({
        month: row.month,
        game: mapGame(row),
      })),
      backlog: loadBacklog(user.id).slice(0, 4),
      recentReviews: recentRows.map((row) => ({
        ...mapReview(row),
        gameTitle: row.game_title,
        gameId: row.game_id,
        month: row.month,
      })),
      stats,
    };
  },
);

export const getBacklog = createServerFn({ method: "GET" }).handler(
  (): GameWithVotes[] => {
    const user = requireUser();
    return loadBacklog(user.id);
  },
);

export const getPickData = createServerFn({ method: "GET" }).handler(
  (): PickData => {
    const user = requireUser();
    return {
      backlog: loadBacklog(user.id),
      current: loadAssignment(monthKey(), user.id),
      nextMonth: openPickMonth(),
    };
  },
);

export const getStats = createServerFn({ method: "GET" }).handler(
  (): StatsData => {
    requireUser();
    const db = getDb();

    const headline = db
      .query(
        `SELECT (SELECT COUNT(*) FROM users) AS members,
                (SELECT COUNT(*) FROM games) AS games,
                (SELECT COUNT(DISTINCT month) FROM assignments) AS months_planned,
                (SELECT COUNT(*) FROM reviews) AS reviews`,
      )
      .get() as {
      members: number;
      games: number;
      months_planned: number;
      reviews: number;
    };

    // "Played" genres: only games that have a month assigned to them.
    const genreRows = db
      .query(
        `SELECT g.genres FROM games g
         WHERE EXISTS (SELECT 1 FROM assignments a WHERE a.game_id = g.id)`,
      )
      .all() as Array<{ genres: string | null }>;

    const bestMonths = db
      .query(
        `SELECT a.month AS month, AVG(r.rating) AS average, COUNT(r.id) AS count
         FROM assignments a
         JOIN reviews r ON r.assignment_id = a.id
         GROUP BY a.month
         ORDER BY average DESC, count DESC
         LIMIT 5`,
      )
      .all() as Array<{ month: string; average: number; count: number }>;

    const topSuggesters = db
      .query(
        `SELECT u.name AS name, AVG(r.rating) AS average, COUNT(DISTINCT g.id) AS games
         FROM users u
         JOIN games g ON g.suggested_by = u.id
         JOIN assignments a ON a.game_id = g.id
         JOIN reviews r ON r.assignment_id = a.id
         GROUP BY u.id
         ORDER BY average DESC, games DESC
         LIMIT 5`,
      )
      .all() as Array<{ name: string; average: number; games: number }>;

    const reviewerAverages = db
      .query(
        `SELECT u.name AS name, AVG(r.rating) AS average, COUNT(*) AS count
         FROM users u
         JOIN reviews r ON r.user_id = u.id
         GROUP BY u.id
         ORDER BY count DESC, average DESC`,
      )
      .all() as Array<{ name: string; average: number; count: number }>;

    return {
      members: headline.members,
      games: headline.games,
      monthsPlanned: headline.months_planned,
      reviews: headline.reviews,
      topGenres: topGenres(genreRows.map((row) => row.genres)),
      bestMonths,
      topSuggesters,
      reviewerAverages,
    };
  },
);

export const getGame = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return { gameId: Number(data.gameId) };
  })
  .handler(async ({ data }): Promise<GameDetail | null> => {
    const user = requireUser();
    const db = getDb();
    if (!Number.isInteger(data.gameId)) return null;

    const game = db
      .query(
        `SELECT ${GAME_COLUMNS}
         FROM games g
         LEFT JOIN users u ON u.id = g.suggested_by
         WHERE g.id = ?`,
      )
      .get(data.gameId) as GameRow | null;
    if (!game) return null;

    const assignment = db
      .query("SELECT id, month FROM assignments WHERE game_id = ?")
      .get(data.gameId) as { id: number; month: string } | null;

    const reviews = assignment ? loadReviews(assignment.id) : [];
    const votes = db
      .query(
        `SELECT COUNT(*) AS count, COALESCE(MAX(CASE WHEN user_id = ? THEN 1 ELSE 0 END), 0) AS mine
         FROM votes WHERE game_id = ?`,
      )
      .get(user.id, data.gameId) as { count: number; mine: number };

    const flagRows = db
      .query(
        `SELECT gf.kind, gf.user_id, u.name
         FROM game_flags gf
         JOIN users u ON u.id = gf.user_id
         WHERE gf.game_id = ?
         ORDER BY gf.kind, u.name`,
      )
      .all(data.gameId) as Array<{ kind: string; user_id: number; name: string }>;

    return {
      game: mapGame(game),
      assignment: assignment
        ? {
            id: assignment.id,
            month: assignment.month,
            reviewCount: reviews.length,
          }
        : null,
      reviews,
      voteCount: votes.count,
      hasVoted: Boolean(votes.mine),
      flags: (["played", "owned"] as const).map((kind) => ({
        kind,
        names: flagRows
          .filter((row) => row.kind === kind)
          .map((row) => row.name),
      })),
      myFlags: {
        played: flagRows.some(
          (row) => row.kind === "played" && row.user_id === user.id,
        ),
        owned: flagRows.some(
          (row) => row.kind === "owned" && row.user_id === user.id,
        ),
      },
      openMonth: openPickMonth(),
    };
  });

export const toggleGameFlag = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return {
      gameId: Number(data.gameId),
      kind: typeof data.kind === "string" ? data.kind : "",
    };
  })
  .handler(async ({ data }) => {
    const user = requireUser();
    if (data.kind !== "played" && data.kind !== "owned")
      return { error: "That flag does not exist." };
    if (!Number.isInteger(data.gameId))
      return { error: "That game does not exist." };

    const db = getDb();
    if (!db.query("SELECT id FROM games WHERE id = ?").get(data.gameId))
      return { error: "That game does not exist." };

    const existing = db
      .query(
        "SELECT 1 FROM game_flags WHERE game_id = ? AND user_id = ? AND kind = ?",
      )
      .get(data.gameId, user.id, data.kind);
    if (existing) {
      db.query(
        "DELETE FROM game_flags WHERE game_id = ? AND user_id = ? AND kind = ?",
      ).run(data.gameId, user.id, data.kind);
      return { ok: true as const, flagged: false };
    }

    db.query(
      "INSERT INTO game_flags (game_id, user_id, kind, created_at) VALUES (?, ?, ?, ?)",
    ).run(data.gameId, user.id, data.kind, new Date().toISOString());
    return { ok: true as const, flagged: true };
  });

export const getMonth = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return { month: typeof data.month === "string" ? data.month : "" };
  })
  .handler(async ({ data }): Promise<MonthDetail | null> => {
    const user = requireUser();
    const month = validMonth(data.month);
    if (!month) return null;
    const assignment = loadAssignment(month, user.id);
    if (!assignment) return null;
    return { ...assignment, canReview: isPastMonth(month) };
  });

export const getPlayed = createServerFn({ method: "GET" }).handler(
  (): PlayedMonth[] => {
    requireUser();
    const db = getDb();
    const currentMonth = monthKey();
    const rows = db
      .query(
        `SELECT ${GAME_COLUMNS}, a.month, a.id AS assignment_id,
              COUNT(r.id) AS review_count, AVG(r.rating) AS average_rating
       FROM assignments a
       JOIN games g ON g.id = a.game_id
       LEFT JOIN users u ON u.id = g.suggested_by
       LEFT JOIN reviews r ON r.assignment_id = a.id
       WHERE a.month < ?
       GROUP BY a.id
       ORDER BY a.month DESC`,
      )
      .all(currentMonth) as Array<
      GameRow & {
        month: string;
        assignment_id: number;
        review_count: number;
        average_rating: number | null;
      }
    >;

    return rows.map((row) => {
      const latest = db
        .query(
          `SELECT r.id, r.rating, r.body, r.created_at, u.name AS author_name, u.username AS author_username
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.assignment_id = ?
         ORDER BY r.created_at DESC
         LIMIT 1`,
        )
        .get(row.assignment_id) as ReviewRow | null;

      return {
        month: row.month,
        game: mapGame(row),
        reviewCount: row.review_count,
        averageRating: row.average_rating,
        latestReview: latest ? mapReview(latest) : null,
      };
    });
  },
);

export const suggestGame = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return {
      title: typeof data.title === "string" ? data.title : "",
      platform: typeof data.platform === "string" ? data.platform : "",
      playtimeHours: data.playtimeHours ?? null,
      coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : "",
      notes: typeof data.notes === "string" ? data.notes : "",
      tags: typeof data.tags === "string" ? data.tags : "",
      externalSource:
        typeof data.externalSource === "string" ? data.externalSource : "",
      externalId: typeof data.externalId === "string" ? data.externalId : "",
    };
  })
  .handler(async ({ data }) => {
    const user = requireUser();
    const title = cleanText(data.title, 120);
    const platform = cleanText(data.platform, 60);
    if (!title) return { error: "Please enter a game title." };
    if (!platform) return { error: "Please enter the console or platform." };

    const playtime = cleanPlaytime(data.playtimeHours);
    const coverUrl = cleanCoverUrl(data.coverUrl);
    const notes = cleanOptionalText(data.notes, 1000);
    const tags = cleanTags(data.tags);
    const source = cleanOptionalText(data.externalSource, 24);
    const externalId = cleanOptionalText(data.externalId, 64);

    const result = getDb()
      .query(
        `INSERT INTO games (title, platform, cover_url, playtime_hours, notes, genres, external_source, external_id, suggested_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        title,
        platform,
        coverUrl,
        playtime,
        notes,
        tags.length > 0 ? tags.join(", ") : null,
        source,
        externalId,
        user.id,
        new Date().toISOString(),
      );

    return { ok: true as const, gameId: Number(result.lastInsertRowid) };
  });

type RawgResult = {
  id: number;
  name: string;
  background_image: string | null;
  playtime: number;
  platforms?: Array<{ platform: { name: string } }>;
};

export type ExternalGame = {
  title: string;
  platform: string;
  coverUrl: string | null;
  playtimeHours: number | null;
  source: string;
  externalId: string;
};

export const searchExternalGames = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return {
      query:
        typeof data.query === "string" ? data.query.trim().slice(0, 80) : "",
    };
  })
  .handler(
    async ({
      data,
    }): Promise<{
      configured: boolean;
      results: ExternalGame[];
      error?: string;
    }> => {
      requireUser();
      const apiKey = process.env.RAWG_API_KEY;
      if (!apiKey) return { configured: false, results: [] };
      if (data.query.length < 2) return { configured: true, results: [] };

      try {
        const url = new URL("https://api.rawg.io/api/games");
        url.searchParams.set("key", apiKey);
        url.searchParams.set("search", data.query);
        url.searchParams.set("page_size", "6");
        const response = await fetch(url, {
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
          return {
            configured: true,
            results: [],
            error: "Game search is unavailable right now.",
          };
        }
        const payload = (await response.json()) as { results?: RawgResult[] };
        return {
          configured: true,
          results: (payload.results ?? []).map((game) => ({
            title: game.name,
            platform:
              game.platforms
                ?.slice(0, 3)
                .map((entry) => entry.platform.name)
                .join(", ") || "Unknown",
            coverUrl: game.background_image,
            playtimeHours: game.playtime > 0 ? game.playtime : null,
            source: "rawg",
            externalId: String(game.id),
          })),
        };
      } catch {
        return {
          configured: true,
          results: [],
          error: "Game search timed out. Try again.",
        };
      }
    },
  );

export const toggleVote = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return { gameId: Number(data.gameId) };
  })
  .handler(async ({ data }) => {
    const user = requireUser();
    const db = getDb();
    if (!Number.isInteger(data.gameId))
      return { error: "That game does not exist." };
    const game = db.query("SELECT id FROM games WHERE id = ?").get(data.gameId);
    if (!game) return { error: "That game does not exist." };
    if (
      db.query("SELECT 1 FROM assignments WHERE game_id = ?").get(data.gameId)
    ) {
      return { error: "That game already has a month." };
    }

    const existing = db
      .query("SELECT 1 FROM votes WHERE game_id = ? AND user_id = ?")
      .get(data.gameId, user.id);
    if (existing) {
      db.query("DELETE FROM votes WHERE game_id = ? AND user_id = ?").run(
        data.gameId,
        user.id,
      );
      return { ok: true as const, voted: false };
    }

    db.query(
      "INSERT INTO votes (game_id, user_id, created_at) VALUES (?, ?, ?)",
    ).run(data.gameId, user.id, new Date().toISOString());
    return { ok: true as const, voted: true };
  });

export const assignGame = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return {
      gameId: Number(data.gameId),
      month: typeof data.month === "string" ? data.month : "",
    };
  })
  .handler(async ({ data }) => {
    requireAdmin();
    const month = validMonth(data.month);
    if (!Number.isInteger(data.gameId))
      return { error: "That game does not exist." };
    if (!month) return { error: "Choose a valid month." };

    const db = getDb();
    const game = db.query("SELECT id FROM games WHERE id = ?").get(data.gameId);
    if (!game) return { error: "That game does not exist." };
    if (
      db.query("SELECT 1 FROM assignments WHERE game_id = ?").get(data.gameId)
    ) {
      return { error: "That game already has a month." };
    }
    if (db.query("SELECT 1 FROM assignments WHERE month = ?").get(month)) {
      return { error: `${formatMonth(month)} already has a game.` };
    }

    try {
      db.query(
        "INSERT INTO assignments (game_id, month, created_at) VALUES (?, ?, ?)",
      ).run(data.gameId, month, new Date().toISOString());
      db.query("DELETE FROM votes WHERE game_id = ?").run(data.gameId);
    } catch {
      return {
        error: "Could not assign that game. Please refresh and try again.",
      };
    }

    return { ok: true as const };
  });

export const addReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return {
      assignmentId: Number(data.assignmentId),
      rating: data.rating,
      body: typeof data.body === "string" ? data.body : "",
    };
  })
  .handler(async ({ data }) => {
    const user = requireUser();
    if (!Number.isInteger(data.assignmentId))
      return { error: "That month does not exist." };
    const rating = cleanRating(data.rating);
    const body = cleanText(data.body, 2000);
    if (!rating) return { error: "Choose a rating from 1 to 5." };
    if (!body || body.length < 3)
      return { error: "Write a few thoughts about the game." };

    const db = getDb();
    const assignment = db
      .query("SELECT id, month FROM assignments WHERE id = ?")
      .get(data.assignmentId) as { id: number; month: string } | null;
    if (!assignment) return { error: "That month does not exist." };
    if (!isPastMonth(assignment.month)) {
      return {
        error: `Discussion opens after ${formatMonth(assignment.month)} ends.`,
      };
    }

    db.query(
      `INSERT INTO reviews (assignment_id, user_id, rating, body, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(assignment_id, user_id)
       DO UPDATE SET rating = excluded.rating, body = excluded.body, created_at = excluded.created_at`,
    ).run(assignment.id, user.id, rating, body, new Date().toISOString());

    return { ok: true as const };
  });
