import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { getDb } from "#/db";
import { hashToken, randomToken } from "#/lib/auth";
import type { PublicUser } from "#/lib/types";

const SESSION_COOKIE = "games_club_session";
const SESSION_DAYS = 30;

type UserRow = {
  id: number;
  username: string;
  name: string;
  password_hash: string;
  is_admin: number;
  must_change_password: number;
};

type SessionUserRow = UserRow & { expires_at: string };

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    isAdmin: Boolean(row.is_admin),
    mustChangePassword: Boolean(row.must_change_password),
  };
}

export function createSession(userId: number): void {
  const token = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const db = getDb();
  db.query("DELETE FROM sessions WHERE expires_at < ?").run(now.toISOString());
  db.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
  ).run(hashToken(token), userId, expires.toISOString(), now.toISOString());

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    secure: process.env.COOKIE_SECURE === "true",
  });
}

export function clearSession(): void {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    getDb()
      .query("DELETE FROM sessions WHERE token_hash = ?")
      .run(hashToken(token));
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export function getSessionUser(): PublicUser | null {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const row = getDb()
    .query(
      `SELECT u.*, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(hashToken(token)) as SessionUserRow | null;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    getDb()
      .query("DELETE FROM sessions WHERE token_hash = ?")
      .run(hashToken(token));
    return null;
  }

  return toPublicUser(row);
}

export function requireUser(): PublicUser {
  const user = getSessionUser();
  if (!user) throw new Error("You need to sign in first.");
  return user;
}

export function requireAdmin(): PublicUser {
  const user = requireUser();
  if (!user.isAdmin) throw new Error("Only the club admin can do that.");
  return user;
}
