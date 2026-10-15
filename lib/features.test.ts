import { describe, expect, it } from "vitest";
import { _resolveForTest as resolve, PREVIEW_FEATURES } from "./features";

const all = Object.keys(PREVIEW_FEATURES);

describe("preview feature flags", () => {
  it("defaults to on in development and off in production", () => {
    expect([...resolve(undefined, true)]).toEqual(all);
    expect([...resolve(undefined, false)]).toEqual([]);
    expect([...resolve("  ", false)]).toEqual([]);
  });

  it("supports all / none switches regardless of environment", () => {
    expect([...resolve("all", false)]).toEqual(all);
    expect([...resolve("none", true)]).toEqual([]);
    expect([...resolve("OFF", true)]).toEqual([]);
  });

  it("enables only the listed features and ignores unknown names", () => {
    expect([...resolve("courses, insights, nonsense", false)].sort()).toEqual(["courses", "insights"]);
  });
});
