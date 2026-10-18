import { describe, expect, it } from "vitest";
import { isPlaceholderAvatar, normaliseGender, PLACEHOLDER_AVATARS, placeholderAvatar } from "./placeholder-avatar";

const matrics = Array.from({ length: 40 }, (_, i) => `21/${String(1000 + i * 37)}`);

describe("placeholderAvatar", () => {
  it("gives male students a male avatar and female students a female one", () => {
    for (const m of matrics) {
      expect(PLACEHOLDER_AVATARS.male).toContain(placeholderAvatar("Male", m));
      expect(PLACEHOLDER_AVATARS.female).toContain(placeholderAvatar("Female", m));
    }
  });

  it("always picks the same avatar for the same student", () => {
    expect(placeholderAvatar("Female", "18/1872")).toBe(placeholderAvatar("female", "18/1872"));
  });

  it("spreads students across both avatars", () => {
    expect(new Set(matrics.map((m) => placeholderAvatar("Male", m))).size).toBe(2);
    expect(new Set(matrics.map((m) => placeholderAvatar("Female", m))).size).toBe(2);
  });

  it("uses any of the four when gender is unknown", () => {
    const picks = new Set(matrics.map((m) => placeholderAvatar(null, m)));
    expect(picks.size).toBeGreaterThan(2);
    for (const p of picks) expect(isPlaceholderAvatar(p)).toBe(true);
  });
});

describe("normaliseGender", () => {
  it.each([
    ["M", "male"],
    [" male ", "male"],
    ["F", "female"],
    ["FEMALE", "female"],
    ["-", null],
    [null, null],
  ])("%s → %s", (input, expected) => {
    expect(normaliseGender(input)).toBe(expected);
  });
});
