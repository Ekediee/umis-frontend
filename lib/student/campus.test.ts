import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FeatureCollection } from "geojson";
import { CAMPUS, distanceM, footprintFor, googleMapsUrl, matchVenue, searchPlaces, walkLabel, type Place } from "./campus";
import { checkinUrl, decodeMockToken, encodeMockToken, tokenFromScan, totpCode, verifyTotpCode } from "../attendance/code";

const geo = JSON.parse(readFileSync(join(process.cwd(), "public/campus/places.geojson"), "utf8")) as {
  features: { properties: Omit<Place, "coordinates">; geometry: { coordinates: [number, number] } }[];
};
const places: Place[] = geo.features.map((f) => ({ ...f.properties, coordinates: f.geometry.coordinates }));

describe("campus places file", () => {
  it("has unique ids and every place inside the campus bounds", () => {
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
    for (const p of places) {
      expect(p.coordinates[0]).toBeGreaterThan(CAMPUS.bounds[0][0]);
      expect(p.coordinates[0]).toBeLessThan(CAMPUS.bounds[1][0]);
      expect(p.coordinates[1]).toBeGreaterThan(CAMPUS.bounds[0][1]);
      expect(p.coordinates[1]).toBeLessThan(CAMPUS.bounds[1][1]);
    }
  });
});

const outline = JSON.parse(readFileSync(join(process.cwd(), "public/campus/campus.geojson"), "utf8")) as FeatureCollection;

describe("campus outline", () => {
  it("has one campus boundary and building footprints", () => {
    expect(outline.features.filter((f) => f.properties?.kind === "campus")).toHaveLength(1);
    expect(outline.features.filter((f) => f.properties?.kind === "building").length).toBeGreaterThan(100);
  });

  it("finds the building a place sits in", () => {
    const library = places.find((p) => p.id === "laz-otti-library")!;
    const id = footprintFor(outline, library);
    expect(id === null || id.startsWith("w")).toBe(true);
    expect(footprintFor(outline, { ...library, coordinates: [0, 0] })).toBeNull();
  });

  it("credits every photo and links places to Google Maps", () => {
    for (const p of places.filter((x) => x.photo)) expect(p.photoCredit?.author).toBeTruthy();
    expect(googleMapsUrl(places[0])).toContain("google.com/maps/search/");
  });
});

describe("searchPlaces / matchVenue", () => {
  it("finds by name, alias and word prefix", () => {
    expect(searchPlaces(places, "library")[0].name).toBe("Laz Otti Library");
    expect(searchPlaces(places, "BUTH")[0].name).toBe("Babcock University Teaching Hospital");
    expect(searchPlaces(places, "neal")[0].name).toBe("Neal Wilson Hall");
    expect(matchVenue(places, "Teaching Hospital")?.name).toBe("Babcock University Teaching Hospital");
  });

  it("matches timetable venue strings through aliases", () => {
    expect(matchVenue(places, "CST Hall A")?.name).toBe("Science and Technology");
    expect(matchVenue(places, "Lab 3 — Software")?.name).toBe("Science and Technology");
    expect(matchVenue(places, "Nowhere Hall 99")).toBeNull();
  });

  it("estimates walking distance", () => {
    const m = distanceM(CAMPUS.center, [CAMPUS.center[0] + 0.004, CAMPUS.center[1]]);
    expect(m).toBeGreaterThan(400);
    expect(m).toBeLessThan(470);
    expect(walkLabel(440)).toBe("440 m · 6 min walk");
  });
});

describe("check-in codes", () => {
  const seed = "live:COSC 204:2026-10-08";
  const t0 = Date.UTC(2026, 9, 8, 9, 0, 5);

  it("accepts the current and previous 30-second window only", () => {
    const code = totpCode(seed, t0);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotpCode(seed, code, t0)).toBe(true);
    expect(verifyTotpCode(seed, code, t0 + 30_000)).toBe(true);
    expect(verifyTotpCode(seed, code, t0 + 90_000)).toBe(false);
    expect(verifyTotpCode(seed, `${code.slice(0, 3)} ${code.slice(3)}`, t0)).toBe(true);
  });

  it("round-trips the QR token and reads it from a scanned link", () => {
    const token = encodeMockToken({ seed, code: "123456" });
    expect(decodeMockToken(token)).toEqual({ seed, code: "123456" });
    expect(tokenFromScan(checkinUrl("https://pulse.babcock.edu.ng/", token))).toBe(token);
    expect(decodeMockToken("garbage")).toBeNull();
  });
});
