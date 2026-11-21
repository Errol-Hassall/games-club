import { describe, expect, test } from "bun:test";
import { topGenres } from "#/lib/stats";

describe("topGenres", () => {
  test("counts tags across CSV rows and sorts by frequency", () => {
    expect(topGenres(["rpg, co-op", "rpg", null, "puzzle"])).toEqual([
      { tag: "rpg", count: 2 },
      { tag: "co-op", count: 1 },
      { tag: "puzzle", count: 1 },
    ]);
  });

  test("breaks ties alphabetically and honours the limit", () => {
    expect(topGenres(["b, a"], 1)).toEqual([{ tag: "a", count: 1 }]);
  });

  test("ignores empty rows and whitespace-only tags", () => {
    expect(topGenres([null, "", " , "])).toEqual([]);
  });
});
