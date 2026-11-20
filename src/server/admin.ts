import { createServerFn } from "@tanstack/react-start";
import { getDb } from "#/db";
import { hashPassword, randomPassword } from "#/lib/auth";
import { requireAdmin } from "#/server/session";

export type AdminUser = {
  id: number;
  username: string;
  name: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  suggestionCount: number;
};

export const listUsers = createServerFn({ method: "GET" }).handler(
  (): AdminUser[] => {
    requireAdmin();
    const rows = getDb()
      .query(
        `SELECT u.id, u.username, u.name, u.is_admin, u.must_change_password, u.created_at,
              (SELECT COUNT(*) FROM games g WHERE g.suggested_by = u.id) AS suggestion_count
       FROM users u
       ORDER BY u.is_admin DESC, u.name ASC`,
      )
      .all() as Array<{
      id: number;
      username: string;
      name: string;
      is_admin: number;
      must_change_password: number;
      created_at: string;
      suggestion_count: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      name: row.name,
      isAdmin: Boolean(row.is_admin),
      mustChangePassword: Boolean(row.must_change_password),
      createdAt: row.created_at,
      suggestionCount: row.suggestion_count,
    }));
  },
);

export const resetUserPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return { userId: Number(data.userId) };
  })
  .handler(async ({ data }) => {
    const admin = requireAdmin();
    const db = getDb();
    if (!Number.isInteger(data.userId))
      return { error: "That member does not exist." };
    if (data.userId === admin.id) {
      return { error: "Use account settings to change your own password." };
    }

    const target = db
      .query("SELECT id, name FROM users WHERE id = ?")
      .get(data.userId) as {
      id: number;
      name: string;
    } | null;
    if (!target) return { error: "That member does not exist." };

    const password = randomPassword();
    db.query(
      "UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?",
    ).run(hashPassword(password), target.id);
    db.query("DELETE FROM sessions WHERE user_id = ?").run(target.id);

    return { ok: true as const, password, name: target.name };
  });
