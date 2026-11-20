import { createServerFn } from "@tanstack/react-start";
import { getDb } from "#/db";
import { hashPassword, passwordProblem, verifyPassword } from "#/lib/auth";
import type { PublicUser } from "#/lib/types";
import { cleanText, normalizeUsername } from "#/lib/validation";
import {
  clearSession,
  createSession,
  getSessionUser,
  requireUser,
} from "#/server/session";

type LoginRow = {
  id: number;
  password_hash: string;
  must_change_password: number;
};

// Equalises the password check for unknown usernames.
const DUMMY_HASH = hashPassword("games-club-dummy-password");

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  (): PublicUser | null => {
    return getSessionUser();
  },
);

export const login = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return {
      username: typeof data.username === "string" ? data.username : "",
      password: typeof data.password === "string" ? data.password : "",
    };
  })
  .handler(async ({ data }) => {
    const username = normalizeUsername(data.username);
    const password = data.password;
    if (!username || !password)
      return { error: "Enter your username and password." };

    const row = getDb()
      .query(
        "SELECT id, password_hash, must_change_password FROM users WHERE username = ?",
      )
      .get(username) as LoginRow | null;

    const passwordOk = verifyPassword(
      password,
      row?.password_hash ?? DUMMY_HASH,
    );
    if (!row || !passwordOk) return { error: "Invalid username or password." };

    createSession(row.id);
    return { ok: true as const };
  });

export const register = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return {
      username: typeof data.username === "string" ? data.username : "",
      name: typeof data.name === "string" ? data.name : "",
      password: typeof data.password === "string" ? data.password : "",
    };
  })
  .handler(async ({ data }) => {
    const username = normalizeUsername(data.username);
    const name = cleanText(data.name, 60);
    if (!username)
      return {
        error: "Username must be 3-24 characters (letters, numbers, - or _).",
      };
    if (!name) return { error: "Please enter a display name." };

    const passwordIssue = passwordProblem(data.password);
    if (passwordIssue) return { error: passwordIssue };

    const db = getDb();
    const existing = db
      .query("SELECT id FROM users WHERE username = ?")
      .get(username);
    if (existing) return { error: "That username is taken." };

    const result = db
      .query(
        "INSERT INTO users (username, name, password_hash, is_admin, must_change_password, created_at) VALUES (?, ?, ?, 0, 0, ?)",
      )
      .run(
        username,
        name,
        hashPassword(data.password),
        new Date().toISOString(),
      );

    createSession(Number(result.lastInsertRowid));
    return { ok: true as const };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  clearSession();
  return { ok: true as const };
});

export const changePassword = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = (input ?? {}) as Record<string, unknown>;
    return {
      currentPassword:
        typeof data.currentPassword === "string" ? data.currentPassword : "",
      newPassword: typeof data.newPassword === "string" ? data.newPassword : "",
    };
  })
  .handler(async ({ data }) => {
    const user = requireUser();
    const db = getDb();
    const row = db
      .query("SELECT password_hash FROM users WHERE id = ?")
      .get(user.id) as { password_hash: string } | null;

    if (!row || !verifyPassword(data.currentPassword, row.password_hash)) {
      return { error: "Your current password is not right." };
    }

    const passwordIssue = passwordProblem(data.newPassword);
    if (passwordIssue) return { error: passwordIssue };

    db.query(
      "UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?",
    ).run(hashPassword(data.newPassword), user.id);
    return { ok: true as const };
  });
