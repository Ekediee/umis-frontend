import { describe, expect, it } from "vitest";
import { headingFor, isWorthShowing, shouldAccept, type LocationFix } from "./use-live-location";
import { bearingDeg, circlePolygon, distanceM } from "@/lib/student/campus";

const fix = (over: Partial<LocationFix> = {}): LocationFix => ({ coords: [3.7229, 6.8905], accuracy: 10, heading: null, at: 1_000, ...over });

describe("shouldAccept", () => {
  it("takes the first reading", () => {
    expect(shouldAccept(null, fix({ accuracy: 900 }))).toBe(true);
  });

  it("skips a much less precise reading right after a good one (no jumping dot)", () => {
    expect(shouldAccept(fix({ accuracy: 10 }), fix({ accuracy: 400, at: 3_000 }))).toBe(false);
    expect(shouldAccept(fix({ accuracy: 10 }), fix({ accuracy: 25, at: 3_000 }))).toBe(true);
  });

  it("accepts anything once the last good reading is stale", () => {
    expect(shouldAccept(fix({ accuracy: 10 }), fix({ accuracy: 400, at: 30_000 }))).toBe(true);
  });
});

describe("isWorthShowing", () => {
  it("passes on about one reading a second, not every GPS burst", () => {
    expect(isWorthShowing(null, fix())).toBe(true);
    expect(isWorthShowing(fix({ at: 1_000 }), fix({ at: 1_200, coords: [3.72291, 6.89051] }))).toBe(false);
    expect(isWorthShowing(fix({ at: 1_000 }), fix({ at: 2_000, coords: [3.72291, 6.89051] }))).toBe(true);
  });

  it("shows a real move or a much better accuracy straight away", () => {
    expect(isWorthShowing(fix({ at: 1_000 }), fix({ at: 1_200, coords: [3.7229, 6.89055] }))).toBe(true); // ~5.5 m
    expect(isWorthShowing(fix({ at: 1_000, accuracy: 40 }), fix({ at: 1_200, accuracy: 12 }))).toBe(true);
  });
});

describe("headingFor", () => {
  it("uses the device heading only while moving", () => {
    expect(headingFor(null, [3.7229, 6.8905], 90, 1.2)).toBe(90);
    expect(headingFor(null, [3.7229, 6.8905], 90, 0)).toBeNull();
  });

  it("works out the direction from the last two readings once you've moved", () => {
    const prev = fix();
    const north: [number, number] = [3.7229, 6.8906]; // ~11 m north
    expect(headingFor(prev, north, null, null)).toBeCloseTo(0, 0);
    const east: [number, number] = [3.72300, 6.8905]; // ~11 m east
    expect(headingFor(prev, east, null, null)).toBeCloseTo(90, 0);
  });

  it("keeps the last heading while standing still", () => {
    expect(headingFor(fix({ heading: 45 }), [3.7229, 6.890501], null, null)).toBe(45); // ~1 m: still standing
  });
});

describe("geometry helpers", () => {
  it("bearingDeg points clockwise from north", () => {
    expect(bearingDeg([3.72, 6.89], [3.72, 6.9])).toBeCloseTo(0, 1);
    expect(bearingDeg([3.72, 6.89], [3.71, 6.89])).toBeCloseTo(270, 1);
  });

  it("circlePolygon draws a ring of the requested radius", () => {
    const c: [number, number] = [3.7229, 6.8905];
    const ring = circlePolygon(c, 50).geometry.coordinates[0] as [number, number][];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    for (const p of ring) expect(distanceM(c, p)).toBeCloseTo(50, 0);
  });
});
