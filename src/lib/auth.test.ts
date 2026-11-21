import { describe, expect, test } from "bun:test";
import { hashPassword, passwordProblem, randomPassword, verifyPassword } from "#/lib/auth";

describe("password hashing", () => {
  test("verifies a correct password", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  test("rejects a wrong password", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(verifyPassword("wrong password", hash)).toBe(false);
  });

  test("rejects malformed hashes", () => {
    expect(verifyPassword("anything", "")).toBe(false);
    expect(verifyPassword("anything", "bcrypt:abc:def")).toBe(false);
    expect(verifyPassword("anything", "scrypt:only-salt")).toBe(false);
  });

  test("uses a fresh salt per hash", () => {
    expect(hashPassword("same-password")).not.toBe(hashPassword("same-password"));
  });

  test("rejects passwords over the length cap", () => {
    const hash = hashPassword("short");
    expect(verifyPassword("x".repeat(201), hash)).toBe(false);
  });
});

describe("password rules", () => {
  test("requires eight characters", () => {
    expect(passwordProblem("short")).not.toBeNull();
    expect(passwordProblem("long-enough")).toBeNull();
  });

  test("caps the length", () => {
    expect(passwordProblem("x".repeat(201))).not.toBeNull();
  });

  test("accepts any content from eight to two hundred characters", () => {
    expect(passwordProblem("a".repeat(8))).toBeNull();
    expect(passwordProblem("has spaces ok")).toBeNull();
    expect(passwordProblem("pässwörd-ünïcode")).toBeNull();
    expect(passwordProblem('sp3c!al-chars&<>"\'')).toBeNull();
    expect(passwordProblem("x".repeat(200))).toBeNull();
  });

  test("rejects seven and two hundred one characters", () => {
    expect(passwordProblem("a".repeat(7))).not.toBeNull();
    expect(passwordProblem("y".repeat(201))).not.toBeNull();
  });
});

describe("temporary passwords", () => {
  test("are long enough and unique", () => {
    const first = randomPassword();
    const second = randomPassword();
    expect(first.length).toBeGreaterThanOrEqual(12);
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
