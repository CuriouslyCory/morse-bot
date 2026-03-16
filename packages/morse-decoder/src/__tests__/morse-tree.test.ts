import { describe, expect, it } from "vitest";
import { getMorseForChar, lookupMorse } from "../morse-tree";
import type { MorseElement } from "../types";

describe("lookupMorse", () => {
  it("decodes all letters A-Z", () => {
    const cases: [MorseElement[], string][] = [
      [["dit", "dah"], "A"],
      [["dah", "dit", "dit", "dit"], "B"],
      [["dah", "dit", "dah", "dit"], "C"],
      [["dah", "dit", "dit"], "D"],
      [["dit"], "E"],
      [["dit", "dit", "dah", "dit"], "F"],
      [["dah", "dah", "dit"], "G"],
      [["dit", "dit", "dit", "dit"], "H"],
      [["dit", "dit"], "I"],
      [["dit", "dah", "dah", "dah"], "J"],
      [["dah", "dit", "dah"], "K"],
      [["dit", "dah", "dit", "dit"], "L"],
      [["dah", "dah"], "M"],
      [["dah", "dit"], "N"],
      [["dah", "dah", "dah"], "O"],
      [["dit", "dah", "dah", "dit"], "P"],
      [["dah", "dah", "dit", "dah"], "Q"],
      [["dit", "dah", "dit"], "R"],
      [["dit", "dit", "dit"], "S"],
      [["dah"], "T"],
      [["dit", "dit", "dah"], "U"],
      [["dit", "dit", "dit", "dah"], "V"],
      [["dit", "dah", "dah"], "W"],
      [["dah", "dit", "dit", "dah"], "X"],
      [["dah", "dit", "dah", "dah"], "Y"],
      [["dah", "dah", "dit", "dit"], "Z"],
    ];
    for (const [elements, expected] of cases) {
      expect(lookupMorse(elements), `Expected ${expected}`).toBe(expected);
    }
  });

  it("decodes digits 0-9", () => {
    const cases: [MorseElement[], string][] = [
      [["dit", "dah", "dah", "dah", "dah"], "1"],
      [["dit", "dit", "dah", "dah", "dah"], "2"],
      [["dit", "dit", "dit", "dah", "dah"], "3"],
      [["dit", "dit", "dit", "dit", "dah"], "4"],
      [["dit", "dit", "dit", "dit", "dit"], "5"],
      [["dah", "dit", "dit", "dit", "dit"], "6"],
      [["dah", "dah", "dit", "dit", "dit"], "7"],
      [["dah", "dah", "dah", "dit", "dit"], "8"],
      [["dah", "dah", "dah", "dah", "dit"], "9"],
      [["dah", "dah", "dah", "dah", "dah"], "0"],
    ];
    for (const [elements, expected] of cases) {
      expect(lookupMorse(elements), `Expected ${expected}`).toBe(expected);
    }
  });

  it("decodes common punctuation", () => {
    expect(lookupMorse(["dit", "dah", "dit", "dah", "dit", "dah"])).toBe(".");
    expect(lookupMorse(["dit", "dit", "dah", "dah", "dit", "dit"])).toBe("?");
  });

  it("returns null for unrecognized sequences", () => {
    expect(lookupMorse(["dit", "dit", "dit", "dit", "dit", "dit", "dit"])).toBeNull();
    expect(lookupMorse([])).toBeNull();
  });
});

describe("getMorseForChar", () => {
  it("returns elements for known characters", () => {
    expect(getMorseForChar("A")).toEqual(["dit", "dah"]);
    expect(getMorseForChar("S")).toEqual(["dit", "dit", "dit"]);
    expect(getMorseForChar("O")).toEqual(["dah", "dah", "dah"]);
  });

  it("is case-insensitive", () => {
    expect(getMorseForChar("a")).toEqual(getMorseForChar("A"));
    expect(getMorseForChar("z")).toEqual(getMorseForChar("Z"));
  });

  it("returns null for unknown characters", () => {
    expect(getMorseForChar("~")).toBeNull();
    expect(getMorseForChar(" ")).toBeNull();
  });

  it("roundtrips with lookupMorse", () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
    for (const char of chars) {
      const elements = getMorseForChar(char);
      expect(elements).not.toBeNull();
      expect(lookupMorse(elements!), `Roundtrip failed for ${char}`).toBe(char);
    }
  });
});
