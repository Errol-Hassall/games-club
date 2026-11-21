import { describe, expect, test } from "bun:test";
import { mapRawgGame } from "./rawg";

const base = {
  id: 10313,
  name: "Hades",
  background_image: "https://media.rawg.io/hades.jpg",
  description_raw:
    "<div><b>Defy</b> the god of the underworld.</div>\n\n<blockquote>Escape.</blockquote>",
  metascore: 96,
  playtime: 21,
  platforms: [
    { platform: { name: "Windows" } },
    { platform: { name: "Mac" } },
    { platform: { name: "Linux" } },
    { platform: { name: "PlayStation 4" } },
  ],
};

describe("mapRawgGame", () => {
  test("maps every field and trims the platform list to three", () => {
    expect(mapRawgGame(base)).toEqual({
      title: "Hades",
      platform: "Windows, Mac, Linux",
      coverUrl: "https://media.rawg.io/hades.jpg",
      description: "Defy the god of the underworld. Escape.",
      metascore: 96,
      playtimeHours: 21,
      source: "rawg",
      externalId: "10313",
    });
  });

  test("treats missing optionals as null or Unknown", () => {
    const mapped = mapRawgGame({ id: 1, name: "Mystery" });
    expect(mapped.coverUrl).toBeNull();
    expect(mapped.description).toBeNull();
    expect(mapped.metascore).toBeNull();
    expect(mapped.playtimeHours).toBeNull();
    expect(mapped.platform).toBe("Unknown");
  });

  test("rejects metascores outside 0-100 or not integers", () => {
    expect(mapRawgGame({ ...base, metascore: 101 }).metascore).toBeNull();
    expect(mapRawgGame({ ...base, metascore: -5 }).metascore).toBeNull();
    expect(mapRawgGame({ ...base, metascore: 87.5 }).metascore).toBeNull();
    expect(mapRawgGame({ ...base, metascore: 87 }).metascore).toBe(87);
  });

  test("drops zero playtimes and truncates long descriptions", () => {
    expect(mapRawgGame({ ...base, playtime: 0 }).playtimeHours).toBeNull();
    const mapped = mapRawgGame({
      ...base,
      description_raw: "x".repeat(5000),
    });
    expect(mapped.description?.length).toBe(2000);
  });
});
