import { describe, expect, test } from "bun:test";
import {
  cleanCoverUrl,
  cleanMetascore,
  cleanOptionalText,
  cleanPlaytime,
  cleanRating,
  cleanTags,
  cleanText,
  detectImageType,
  normalizeUsername,
  parseTags,
  pickRandom,
  validMonth,
} from "#/lib/validation";

describe("text cleaning", () => {
  test("trims and keeps useful text", () => {
    expect(cleanText("  Hades  ", 120)).toBe("Hades");
  });

  test("rejects empty, wrong-typed and oversized text", () => {
    expect(cleanText("   ", 120)).toBeNull();
    expect(cleanText(42, 120)).toBeNull();
    expect(cleanText("x".repeat(121), 120)).toBeNull();
  });

  test("allows optional text to be absent", () => {
    expect(cleanOptionalText(null, 10)).toBeNull();
    expect(cleanOptionalText("  note  ", 10)).toBe("note");
    expect(cleanOptionalText("too long", 4)).toBeNull();
  });
});

describe("usernames", () => {
  test("normalises case and whitespace", () => {
    expect(normalizeUsername("  Maya_1 ")).toBe("maya_1");
  });

  test("rejects invalid handles", () => {
    expect(normalizeUsername("ab")).toBeNull();
    expect(normalizeUsername("-maya")).toBeNull();
    expect(normalizeUsername("maya chen")).toBeNull();
    expect(normalizeUsername("maya!")).toBeNull();
    expect(normalizeUsername("x".repeat(25))).toBeNull();
    expect(normalizeUsername(undefined)).toBeNull();
  });
});

describe("months and ratings", () => {
  test("accepts only real month keys", () => {
    expect(validMonth("2026-11")).toBe("2026-11");
    expect(validMonth("2026-13")).toBeNull();
    expect(validMonth("2026-00")).toBeNull();
    expect(validMonth("November 2026")).toBeNull();
  });

  test("keeps ratings as whole stars", () => {
    expect(cleanRating(5)).toBe(5);
    expect(cleanRating("4")).toBe(4);
    expect(cleanRating(0)).toBeNull();
    expect(cleanRating(6)).toBeNull();
    expect(cleanRating(4.5)).toBeNull();
  });

  test("validates playtime", () => {
    expect(cleanPlaytime("12.5")).toBe(12.5);
    expect(cleanPlaytime("")).toBeNull();
    expect(cleanPlaytime(null)).toBeNull();
    expect(cleanPlaytime(0)).toBeNull();
    expect(cleanPlaytime(1001)).toBeNull();
  });

  test("validates metascores as whole numbers from 0 to 100", () => {
    expect(cleanMetascore(96)).toBe(96);
    expect(cleanMetascore("87")).toBe(87);
    expect(cleanMetascore("")).toBeNull();
    expect(cleanMetascore(null)).toBeNull();
    expect(cleanMetascore(101)).toBeNull();
    expect(cleanMetascore(-1)).toBeNull();
    expect(cleanMetascore(87.5)).toBeNull();
  });
});

describe("cover URLs", () => {
  test("allows local paths and HTTP(S)", () => {
    expect(cleanCoverUrl("/covers/hades.jpg")).toBe("/covers/hades.jpg");
    expect(cleanCoverUrl("https://example.com/cover.jpg")).toBe(
      "https://example.com/cover.jpg",
    );
  });

  test("blocks unsafe schemes and protocol-relative URLs", () => {
    expect(cleanCoverUrl("javascript:alert(1)")).toBeNull();
    expect(cleanCoverUrl("//evil.example/cover.jpg")).toBeNull();
    expect(cleanCoverUrl("data:image/png;base64,abc")).toBeNull();
  });
});

describe("tags", () => {
  test("splits, trims and lowercases comma-separated input", () => {
    expect(cleanTags(" Co-op , ROGUELIKE,co-op ")).toEqual([
      "co-op",
      "roguelike",
    ]);
  });

  test("ignores empty parts and non-string input", () => {
    expect(cleanTags("")).toEqual([]);
    expect(cleanTags(", ,")).toEqual([]);
    expect(cleanTags(null)).toEqual([]);
  });

  test("truncates long tags and caps the list instead of rejecting", () => {
    expect(cleanTags("x".repeat(40))).toEqual(["x".repeat(30)]);
    const twelve = Array.from({ length: 12 }, (_, index) => `tag${index}`).join(",");
    expect(cleanTags(twelve)).toHaveLength(10);
  });

  test("round-trips through the stored CSV form", () => {
    expect(parseTags(cleanTags("a, b ,A").join(", "))).toEqual(["a", "b"]);
    expect(parseTags(null)).toEqual([]);
  });
});

describe("detectImageType", () => {
  test("recognises each supported format from its magic bytes", () => {
    expect(
      detectImageType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("png");
    expect(detectImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(
      detectImageType(Uint8Array.from("GIF89a", (char) => char.charCodeAt(0))),
    ).toBe("gif");
    expect(
      detectImageType(
        Uint8Array.from([
          0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
        ]),
      ),
    ).toBe("webp");
  });

  test("rejects non-image and truncated content", () => {
    expect(detectImageType(Uint8Array.from([]))).toBeNull();
    expect(
      detectImageType(Uint8Array.from("hello world", (char) => char.charCodeAt(0))),
    ).toBeNull();
    expect(detectImageType(Uint8Array.from([0x89, 0x50]))).toBeNull();
  });
});

describe("pickRandom", () => {
  test("returns null for an empty list", () => {
    expect(pickRandom([])).toBeNull();
  });

  test("uses the injected random source", () => {
    expect(pickRandom(["a", "b", "c"], () => 0)).toBe("a");
    expect(pickRandom(["a", "b", "c"], () => 0.5)).toBe("b");
    expect(pickRandom(["a", "b", "c"], () => 0.999)).toBe("c");
    expect(pickRandom(["a", "b", "c"], () => 1)).toBe("c");
  });
});
