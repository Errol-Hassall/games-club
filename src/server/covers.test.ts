import { describe, expect, test } from "bun:test";
import { isValidCoverFilename } from "./covers";

describe("isValidCoverFilename", () => {
  test("accepts a dashed UUID", () => {
    expect(
      isValidCoverFilename("83983335-c1b5-4bdc-9c3f-4941c4f1c022"),
    ).toBe(true);
  });

  test("rejects traversal, extensions and other shapes", () => {
    expect(isValidCoverFilename("../games-club.db")).toBe(false);
    expect(
      isValidCoverFilename("83983335-c1b5-4bdc-9c3f-4941c4f1c022.png"),
    ).toBe(false);
    // Undashed UUIDs are no longer produced (randomUUID always dashes).
    expect(isValidCoverFilename("deadbeefdeadbeefdeadbeefdeadbeef")).toBe(
      false,
    );
    expect(
      isValidCoverFilename("83983335-C1B5-4BDC-9C3F-4941C4F1C022"),
    ).toBe(false);
  });
});
