import { describe, expect, test } from "bun:test";
import {
  addMonths,
  formatDate,
  formatMonth,
  formatMonthShort,
  formatPlaytime,
  initials,
  isPastMonth,
  monthEndLabel,
  monthKey,
  nextMonth,
} from "#/lib/dates";

describe("month arithmetic", () => {
  test("builds a zero-padded month key", () => {
    expect(monthKey(new Date("2026-01-15T12:00:00Z"))).toBe("2026-01");
    expect(monthKey(new Date("2026-11-21T12:00:00Z"))).toBe("2026-11");
  });

  test("moves across year boundaries", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-06", 18)).toBe("2027-12");
  });

  test("finds the next month", () => {
    expect(nextMonth("2026-11")).toBe("2026-12");
    expect(nextMonth("2026-12")).toBe("2027-01");
  });

  test("compares months lexicographically", () => {
    expect(isPastMonth("2025-12", "2026-01")).toBe(true);
    expect(isPastMonth("2026-01", "2026-01")).toBe(false);
    expect(isPastMonth("2026-02", "2026-01")).toBe(false);
  });
});

describe("formatting", () => {
  test("formats a month label", () => {
    expect(formatMonth("2026-11")).toBe("November 2026");
    expect(formatMonth("2026-01")).toBe("January 2026");
    expect(formatMonth("not-a-month")).toBe("not-a-month");
  });

  test("formats a short month label", () => {
    expect(formatMonthShort("2026-09")).toBe("Sep 2026");
  });

  test("formats the last day of a month", () => {
    expect(monthEndLabel("2026-02")).toBe("28 Feb 2026");
    expect(monthEndLabel("2024-02")).toBe("29 Feb 2024");
    expect(monthEndLabel("2026-11")).toBe("30 Nov 2026");
  });

  test("formats playtime honestly", () => {
    expect(formatPlaytime(null)).toBe("Unknown");
    expect(formatPlaytime(0)).toBe("Unknown");
    expect(formatPlaytime(1)).toBe("1 hour");
    expect(formatPlaytime(12.45)).toBe("12.5 hours");
  });

  test("formats an ISO date", () => {
    expect(formatDate("2026-10-27T19:00:00.000Z")).toContain("Oct 2026");
  });

  test("builds initials", () => {
    expect(initials("Maya Chen")).toBe("MC");
    expect(initials("Errol")).toBe("E");
    expect(initials("  ")).toBe("");
  });
});
