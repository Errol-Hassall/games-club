import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "#/db";
import { requireAdmin } from "#/server/session";

export const Route = createFileRoute("/api/export")({
  server: {
    handlers: {
      GET: async () => {
        try {
          requireAdmin();
        } catch {
          return new Response("Only the club admin can export data.", {
            status: 403,
          });
        }

        const db = getDb();
        // Everything except sessions and password hashes.
        const data = {
          exportedAt: new Date().toISOString(),
          users: db
            .query(
              `SELECT id, username, name, is_admin, must_change_password, created_at
               FROM users ORDER BY id`,
            )
            .all(),
          games: db.query("SELECT * FROM games ORDER BY id").all(),
          assignments: db
            .query("SELECT * FROM assignments ORDER BY month")
            .all(),
          reviews: db.query("SELECT * FROM reviews ORDER BY id").all(),
          gameFlags: db
            .query("SELECT * FROM game_flags ORDER BY game_id, user_id")
            .all(),
          votes: db
            .query("SELECT * FROM votes ORDER BY game_id, user_id")
            .all(),
        };

        return new Response(JSON.stringify(data, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": 'attachment; filename="games-club-export.json"',
          },
        });
      },
    },
  },
});
