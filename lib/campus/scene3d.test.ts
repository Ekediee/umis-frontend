import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import { CAMPUS } from "@/lib/student/campus";
import { asRectangle, buildCampusScene, buildingAtTriangle, buildingHeight, cleanRing, DAY, distanceToZoom, ribbon, toLngLat, toMeters, zoomToDistance } from "./scene3d";

describe("projection", () => {
  it("puts the campus centre at the origin and round-trips", () => {
    expect(toMeters(CAMPUS.center)).toEqual([0, 0]);
    const p: [number, number] = [3.7251, 6.8933];
    const [x, n] = toMeters(p);
    const [lng, lat] = toLngLat(x, -n);
    expect(lng).toBeCloseTo(p[0], 9);
    expect(lat).toBeCloseTo(p[1], 9);
  });

  it("is metric: 0.001° of latitude is about 110 m", () => {
    expect(toMeters([CAMPUS.center[0], CAMPUS.center[1] + 0.001])[1]).toBeCloseTo(110.6, 0);
  });
});

describe("footprints", () => {
  it("drops the closing point and straight-line vertices", () => {
    const ring: [number, number][] = [[0, 0], [5, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    expect(cleanRing(ring)).toEqual([[0, 0], [10, 0], [10, 10], [0, 10]]);
  });

  it("recognises rectangles (pitched roofs) and rejects other shapes", () => {
    expect(asRectangle([[0, 0], [20, 0], [20, 8], [0, 8]])).not.toBeNull();
    expect(asRectangle([[0, 0], [20, 0], [26, 8], [0, 8]])).toBeNull();
    expect(asRectangle([[0, 0], [20, 0], [20, 8]])).toBeNull();
  });

  it("estimates believable heights", () => {
    expect(buildingHeight("a", 60)).toBeCloseTo(4, 0); // bungalow
    expect(buildingHeight("a", 2000)).toBeGreaterThan(10); // big block
    expect(buildingHeight("a", 300, undefined, "hall")).toBeGreaterThanOrEqual(14); // halls are 4+ storeys
    expect(buildingHeight("a", 300, { levels: 2, height: null })).toBeCloseTo(7.4, 1);
    expect(buildingHeight("a", 300, { levels: null, height: 18 })).toBe(18);
  });
});

describe("roads", () => {
  it("lays a flat ribbon of two triangles per segment", () => {
    const pos = ribbon([[0, 0], [10, 0], [10, 10]], 4, 0.1);
    expect(pos.length).toBe(2 * 6 * 3);
    expect(pos.filter((_, i) => i % 3 === 1).every((y) => y === 0.1)).toBe(true);
  });
});

describe("buildCampusScene", () => {
  const square = (x: number, y: number, s: number) => [[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]];
  const d = 0.0002;
  const [cx, cy] = CAMPUS.center;
  const outline: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { kind: "campus" }, geometry: { type: "Polygon", coordinates: [square(cx - 0.003, cy - 0.003, 0.006)] } },
      { type: "Feature", properties: { kind: "building", id: "w1" }, geometry: { type: "Polygon", coordinates: [square(cx, cy, d)] } },
      { type: "Feature", properties: { kind: "building", id: "w2" }, geometry: { type: "Polygon", coordinates: [square(cx + 0.001, cy, d * 2)] } },
    ],
  };

  it("merges every building into one mesh and can find which one was clicked", () => {
    const scene = buildCampusScene(outline, null, new Map(), DAY);
    expect(scene.list.map((b) => b.id)).toEqual(["w1", "w2"]);
    expect(scene.buildings.attributes.color).toBeDefined();
    const tris = scene.buildings.attributes.position.count / 3;
    expect(buildingAtTriangle(scene.triStart, 0)).toBe(0);
    expect(buildingAtTriangle(scene.triStart, scene.triStart[1])).toBe(1);
    expect(buildingAtTriangle(scene.triStart, tris - 1)).toBe(1);
    expect(scene.trees.matrices.length).toBeGreaterThan(50);
  });

  it("never plants a tree inside a building", () => {
    const scene = buildCampusScene(outline, null, new Map(), DAY);
    for (const m of scene.trees.matrices) {
      const x = m.elements[12];
      const n = -m.elements[14];
      for (const b of scene.list) {
        const xs = b.footprint.map((p) => p[0]);
        const ns = b.footprint.map((p) => p[1]);
        const inside = x > Math.min(...xs) && x < Math.max(...xs) && n > Math.min(...ns) && n < Math.max(...ns);
        expect(inside).toBe(false);
      }
    }
  });
});

describe("zoom ↔ camera distance", () => {
  it("round-trips, and zooming in brings the camera closer", () => {
    expect(distanceToZoom(zoomToDistance(16.5))).toBeCloseTo(16.5, 9);
    expect(zoomToDistance(18)).toBeLessThan(zoomToDistance(16));
  });
});
