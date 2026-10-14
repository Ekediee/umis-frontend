/**
 * Builds the 3D campus scene from OpenStreetMap data (campus.geojson for the
 * boundary and building footprints, scene.geojson for roads, ground areas and
 * known heights). No React here: everything is plain geometry, built once and
 * merged so the whole campus draws in a handful of draw calls.
 *
 * Coordinates: local metres around CAMPUS.center. +X is east, -Z is north, +Y is up.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import { CAMPUS, type Place, type PlaceCategory } from "@/lib/student/campus";

// ── Projection ────────────────────────────────────────────────────────────────

const [LNG0, LAT0] = CAMPUS.center;
const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LNG = 111_320 * Math.cos((LAT0 * Math.PI) / 180);

/** [lng, lat] → [east, north] in metres from the campus centre */
export function toMeters([lng, lat]: [number, number]): [number, number] {
  return [(lng - LNG0) * M_PER_DEG_LNG, (lat - LAT0) * M_PER_DEG_LAT];
}

/** Scene X/Z → [lng, lat] */
export function toLngLat(x: number, z: number): [number, number] {
  return [LNG0 + x / M_PER_DEG_LNG, LAT0 + -z / M_PER_DEG_LAT];
}

// ── Small helpers ─────────────────────────────────────────────────────────────

/** Deterministic RNG, so trees and colours land in the same place every visit */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function polygonArea(pts: [number, number][]) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  return Math.abs(a / 2);
}

export function pointInPolygon([x, y]: [number, number], poly: [number, number][]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** Ring without the repeated closing point and without (near) straight-line vertices */
export function cleanRing(ring: [number, number][], minTurnDeg = 8): [number, number][] {
  const pts = ring.slice();
  if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[(i - 1 + pts.length) % pts.length];
    const b = pts[i];
    const c = pts[(i + 1) % pts.length];
    const ab = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const bc = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let turn = Math.abs(bc - ab) % (2 * Math.PI);
    if (turn > Math.PI) turn = 2 * Math.PI - turn;
    if ((turn * 180) / Math.PI >= minTurnDeg) out.push(b);
  }
  return out.length >= 3 ? out : pts;
}

/** A four-cornered footprint with near-right angles gets a pitched (hip) roof */
export function asRectangle(pts: [number, number][]): [number, number][] | null {
  if (pts.length !== 4) return null;
  for (let i = 0; i < 4; i++) {
    const a = pts[(i + 3) % 4];
    const b = pts[i];
    const c = pts[(i + 1) % 4];
    const v1 = [a[0] - b[0], a[1] - b[1]];
    const v2 = [c[0] - b[0], c[1] - b[1]];
    const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]));
    if (Math.abs(cos) > 0.2) return null; // more than ~12° off square
  }
  return pts;
}

// ── Heights and colours ───────────────────────────────────────────────────────

const STOREY_M = 3.4;

/**
 * Height in metres: OSM height or levels when mapped, else a guess from the
 * footprint (small blocks are bungalows, big blocks are multi-storey), nudged
 * by what the building is (halls of residence and chapels stand taller).
 */
export function buildingHeight(id: string, area: number, known?: { levels: number | null; height: number | null }, category?: PlaceCategory): number {
  if (known?.height) return known.height;
  if (known?.levels) return known.levels * STOREY_M + 0.6;
  let floors = area < 120 ? 1 : area < 450 ? 1 + (hash(id) % 2) : area < 1300 ? 2 + (hash(id) % 2) : 3 + (hash(id) % 2);
  if (category === "hall") floors = Math.max(floors, 4);
  if (category === "academic" || category === "library" || category === "admin") floors = Math.max(floors, 3);
  if (category === "worship") return Math.max(floors * STOREY_M, 13);
  return floors * STOREY_M + 0.6;
}

export interface ScenePalette {
  ground: string;
  campusGround: string;
  wall: string;
  roofs: string[];
  /** Flat concrete roofs */
  flatRoof: string;
  road: string;
  path: string;
  pitch: string;
  court: string;
  parking: string;
  water: string;
  grass: string;
  wood: string;
  farm: string;
  canopy: string[];
  trunk: string;
  sky: string;
}

export const DAY: ScenePalette = {
  ground: "#9fb07a",
  campusGround: "#a9c47a",
  // Babcock's halls: warm beige render, white frames, brown-orange roofs (see place photos)
  wall: "#e9d9b9",
  roofs: ["#b0573a", "#9c4a31", "#c0703f", "#8a8f96", "#6f7b8c", "#5d7f72"],
  flatRoof: "#a9a59b",
  road: "#7d8086",
  path: "#e4dac4",
  pitch: "#6fae4f",
  court: "#c27a52",
  parking: "#bcb8b0",
  water: "#6fa8c9",
  grass: "#97c463",
  wood: "#7fa356",
  farm: "#bdb36e",
  canopy: ["#4f8a3a", "#5c9a40", "#3f7a34", "#6aa448", "#467f39"],
  trunk: "#6b4f37",
  sky: "#cfe3ee",
};

export const NIGHT: ScenePalette = {
  // Moonlit, not black: the campus still reads clearly in dark mode
  ground: "#36463d",
  campusGround: "#405646",
  wall: "#a3aabb",
  roofs: ["#8c5244", "#7d4739", "#935d49", "#6b7484", "#5d6a7e", "#55706a"],
  flatRoof: "#686b73",
  road: "#545b68",
  path: "#7d7b74",
  pitch: "#3d7048",
  court: "#7c5845",
  parking: "#585a62",
  water: "#346283",
  grass: "#466a40",
  wood: "#375738",
  farm: "#646146",
  canopy: ["#386a34", "#41763b", "#305e31", "#4a8241", "#346337"],
  trunk: "#4a3d32",
  sky: "#1d2b4a",
};

function roofColor(id: string, category: PlaceCategory | undefined, palette: ScenePalette) {
  // Halls and chapels get the classic red roofs; offices and lecture blocks lean grey-blue
  if (category === "hall" || category === "worship") return palette.roofs[hash(id) % 3];
  if (category === "academic" || category === "admin" || category === "library") return palette.roofs[3 + (hash(id) % 3)];
  return palette.roofs[hash(id) % palette.roofs.length];
}

// ── Geometry ──────────────────────────────────────────────────────────────────

function paint(geo: THREE.BufferGeometry, color: THREE.Color, from = 0, count = geo.attributes.position.count, shadeBottom = false) {
  if (!geo.attributes.color) geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
  const col = geo.attributes.color as THREE.BufferAttribute;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = from; i < from + count; i++) {
    // Darker at the foot of the walls: a cheap ambient-occlusion look
    const k = shadeBottom ? 0.78 + 0.22 * Math.min(1, pos.getY(i) / 3) : 1;
    col.setXYZ(i, color.r * k, color.g * k, color.b * k);
  }
}

/** Walls (and a flat roof) for any footprint: an extruded shape stood upright */
function extrude(pts: [number, number][], height: number, wall: THREE.Color, roof: THREE.Color | null) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2); // shape (east, north) → ground plane, extrusion → up
  const g = geo.toNonIndexed();
  geo.dispose();
  // groups: 0 = caps (top and bottom), 1 = walls
  const [caps, sides] = g.groups;
  paint(g, roof ?? wall, caps.start, caps.count);
  paint(g, wall, sides.start, sides.count, true);
  g.clearGroups();
  g.deleteAttribute("uv"); // untextured; also lets walls merge with roofs (position, normal, color only)
  return g;
}

/** Hip roof over a rectangle, with a little overhang; ridge along the long side */
function hipRoof(rect: [number, number][], eave: number, color: THREE.Color) {
  const c = rect.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
  const grow = (p: [number, number]): [number, number] => [c[0] + (p[0] - c[0]) * 1.07, c[1] + (p[1] - c[1]) * 1.07];
  let [A, B, C, D] = rect.map(grow);
  if (Math.hypot(B[0] - A[0], B[1] - A[1]) < Math.hypot(C[0] - B[0], C[1] - B[1])) [A, B, C, D] = [B, C, D, A];
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const W = Math.hypot(C[0] - B[0], C[1] - B[1]);
  const u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
  const inset = Math.min(W / 2, L / 2);
  const rise = THREE.MathUtils.clamp(W * 0.32, 1.4, 5);
  const midAD = [(A[0] + D[0]) / 2, (A[1] + D[1]) / 2];
  const midBC = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
  const R1 = [midAD[0] + u[0] * inset, midAD[1] + u[1] * inset];
  const R2 = [midBC[0] - u[0] * inset, midBC[1] - u[1] * inset];
  const v = (p: number[], y: number) => [p[0], y, -p[1]];
  const top = eave + rise;
  const tris = [
    [A, B, R2], [A, R2, R1], // long side
    [C, D, R1], [C, R1, R2], // other long side
    [B, C, R2], // hip end
    [D, A, R1], // hip end
  ];
  const positions: number[] = [];
  for (const t of tris) for (const p of t) positions.push(...v(p, p === R1 || p === R2 ? top : eave));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  paint(g, color);
  return g;
}

/** Flat ribbon along a polyline (roads, paths), lying on the ground at `y` */
export function ribbon(points: [number, number][], width: number, y: number): number[] {
  const out: number[] = [];
  const h = width / 2;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, n1] = points[i];
    const [x2, n2] = points[i + 1];
    const len = Math.hypot(x2 - x1, n2 - n1);
    if (len < 0.01) continue;
    // extend each segment by half a width so corners overlap instead of leaving notches
    const dx = (x2 - x1) / len;
    const dn = (n2 - n1) / len;
    const ax = x1 - dx * h * 0.5, an = n1 - dn * h * 0.5;
    const bx = x2 + dx * h * 0.5, bn = n2 + dn * h * 0.5;
    const px = -dn * h, pn = dx * h;
    const q = [
      [ax + px, an + pn], [ax - px, an - pn], [bx - px, bn - pn],
      [ax + px, an + pn], [bx - px, bn - pn], [bx + px, bn + pn],
    ];
    for (const [x, n] of q) out.push(x, y, -n);
  }
  return out;
}

const ROAD_WIDTH: Record<string, number> = { trunk: 12, primary: 10, secondary: 8.5, tertiary: 7.5, unclassified: 6.5, residential: 6, living_street: 5, service: 4.5, pedestrian: 4, track: 3.5, footway: 2.4, path: 2, cycleway: 2.2, steps: 2 };
const isFootway = (h: string) => ["footway", "path", "cycleway", "steps", "pedestrian", "track"].includes(h);

function flatPolygon(pts: [number, number][], y: number, color: THREE.Color) {
  const shape = new THREE.Shape(pts.map(([x, n]) => new THREE.Vector2(x, n)));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  const ng = g.index ? g.toNonIndexed() : g;
  if (ng !== g) g.dispose();
  paint(ng, color);
  return ng;
}

// ── Whole scene ───────────────────────────────────────────────────────────────

export interface SceneBuilding {
  id: string;
  /** Footprint in metres [east, north] */
  footprint: [number, number][];
  height: number;
  /** Roof apex (for labels and markers) */
  top: number;
  center: [number, number];
  place: Place | null;
}

export interface CampusScene {
  /** One merged mesh for every building (walls + roofs), coloured per vertex */
  buildings: THREE.BufferGeometry;
  /** Triangle index where each building starts in `buildings`, for click picking */
  triStart: Int32Array;
  list: SceneBuilding[];
  ground: THREE.BufferGeometry;
  trees: { matrices: THREE.Matrix4[]; colors: THREE.Color[] };
  /** Rooftop water tanks */
  tanks: THREE.Matrix4[];
  boundary: [number, number][];
  /** Scene-space box the camera may look at */
  extent: { minX: number; maxX: number; minZ: number; maxZ: number };
}

/** Pitched (hip) roof for halls and smaller rectangular blocks; big or irregular blocks stay flat */
export function pitchedRoofFor(b: Pick<SceneBuilding, "footprint" | "place">) {
  return b.place?.category === "hall" || polygonArea(b.footprint) < 1600 ? asRectangle(b.footprint) : null;
}

export function isConvex(pts: [number, number][]) {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length], [cx, cy] = pts[(i + 2) % pts.length];
    const z = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
    if (Math.abs(z) < 1e-6) continue;
    if (sign === 0) sign = Math.sign(z);
    else if (Math.sign(z) !== sign) return false;
  }
  return true;
}

/** Low wall around a flat roof (convex footprints only, so the inner edge never crosses the outer) */
function parapet(pts: [number, number][], top: number, color: THREE.Color) {
  if (!isConvex(pts)) return null;
  const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
  const radius = pts.reduce((s, p) => s + Math.hypot(p[0] - c[0], p[1] - c[1]), 0) / pts.length;
  const k = 1 - 0.35 / Math.max(radius, 2);
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  shape.holes.push(new THREE.Path(pts.map(([x, y]) => new THREE.Vector2(c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k))));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.9, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, top, 0);
  const g = geo.toNonIndexed();
  geo.dispose();
  g.clearGroups();
  g.deleteAttribute("uv");
  paint(g, color);
  return g;
}

/** Eave height on every vertex: the facade shader only draws windows on storeys that fit under it */
function tagTop(g: THREE.BufferGeometry, top: number) {
  g.setAttribute("aTop", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(top), 1));
  return g;
}

export function buildingGeometry(b: SceneBuilding, wallColor: THREE.Color, roofColorValue: THREE.Color): THREE.BufferGeometry {
  const rect = pitchedRoofFor(b);
  const parts: THREE.BufferGeometry[] = [];
  if (rect) {
    parts.push(extrude(b.footprint, b.height, wallColor, null), hipRoof(rect, b.height, roofColorValue));
  } else {
    parts.push(extrude(b.footprint, b.height, wallColor, roofColorValue));
    const wallTop = parapet(b.footprint, b.height, wallColor.clone().multiplyScalar(0.94));
    if (wallTop) parts.push(wallTop);
  }
  parts.forEach((g) => tagTop(g, b.height));
  if (parts.length === 1) return parts[0];
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return merged;
}

/**
 * Black water tanks on flat roofs, as on most Nigerian campus buildings:
 * one or two per medium block, set back from the edge.
 */
function roofTanks(b: SceneBuilding): THREE.Matrix4[] {
  const area = polygonArea(b.footprint);
  if (pitchedRoofFor(b) || area < 120 || area > 4000) return [];
  const rand = rng(hash(b.id));
  if (rand() < 0.25) return [];
  const count = area > 900 ? 2 : 1;
  const out: THREE.Matrix4[] = [];
  for (let i = 0, tries = 0; i < count && tries < 12; tries++) {
    const x = b.center[0] + (rand() - 0.5) * Math.sqrt(area) * 0.5;
    const n = b.center[1] + (rand() - 0.5) * Math.sqrt(area) * 0.5;
    if (!pointInPolygon([x, n], b.footprint)) continue;
    const s = 0.85 + rand() * 0.35;
    out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, b.height, -n), new THREE.Quaternion(), new THREE.Vector3(s, s, s)));
    i++;
  }
  return out;
}

/** Ground kept free of trees, e.g. where a hand-built landmark model stands */
export interface Clearing {
  /** [east, north] metres */
  center: [number, number];
  radius: number;
}

export function buildCampusScene(outline: FeatureCollection, extra: FeatureCollection | null, placeForBuilding: Map<string, Place>, palette: ScenePalette, clearings: Clearing[] = []): CampusScene {
  const heights = new Map<string, { levels: number | null; height: number | null }>();
  extra?.features.forEach((f) => f.properties?.kind === "height" && heights.set(f.properties.id, { levels: f.properties.levels, height: f.properties.height }));

  const boundaryFeature = outline.features.find((f) => f.properties?.kind === "campus") as Feature<Polygon> | undefined;
  const boundary = boundaryFeature ? cleanRing((boundaryFeature.geometry.coordinates[0] as [number, number][]).map(toMeters), 0) : [];

  // Buildings
  const wall = new THREE.Color(palette.wall);
  const list: SceneBuilding[] = [];
  const parts: THREE.BufferGeometry[] = [];
  const triStart: number[] = [];
  const tanks: THREE.Matrix4[] = [];
  let tris = 0;
  for (const f of outline.features) {
    if (f.properties?.kind !== "building" || f.geometry.type !== "Polygon") continue;
    const id = String(f.properties.id);
    const footprint = cleanRing((f.geometry.coordinates[0] as [number, number][]).map(toMeters));
    if (footprint.length < 3) continue;
    const area = polygonArea(footprint);
    const place = placeForBuilding.get(id) ?? null;
    const height = buildingHeight(id, area, heights.get(id), place?.category);
    const center = footprint.reduce((s, p) => [s[0] + p[0] / footprint.length, s[1] + p[1] / footprint.length], [0, 0]) as [number, number];
    const b: SceneBuilding = { id, footprint, height, top: height, center, place };
    const wallTint = wall.clone().offsetHSL(0, 0, ((hash(id) % 7) - 3) * 0.008);
    // Coloured tiles on pitched roofs; flat roofs are concrete, as on the real blocks
    const roof = pitchedRoofFor(b) ? roofColor(id, place?.category, palette) : palette.flatRoof;
    const geo = buildingGeometry(b, wallTint, new THREE.Color(roof).offsetHSL(0, 0, ((hash(id + "r") % 5) - 2) * 0.012));
    geo.computeBoundingBox();
    b.top = geo.boundingBox!.max.y;
    tanks.push(...roofTanks(b));
    triStart.push(tris);
    tris += geo.attributes.position.count / 3;
    parts.push(geo);
    list.push(b);
  }
  const buildings = parts.length ? mergeGeometries(parts) : new THREE.BufferGeometry();
  parts.forEach((p) => p.dispose());
  buildings.computeBoundingSphere();

  // Ground: surroundings, the campus lawn, areas, roads, paths (each slightly above the last)
  const ground: THREE.BufferGeometry[] = [];
  const surround = new THREE.PlaneGeometry(9000, 9000).toNonIndexed();
  surround.rotateX(-Math.PI / 2);
  paint(surround, new THREE.Color(palette.ground));
  ground.push(surround);
  if (boundary.length) ground.push(flatPolygon(boundary, 0.02, new THREE.Color(palette.campusGround)));

  const areaColor: Record<string, string> = { pitch: palette.pitch, court: palette.court, parking: palette.parking, water: palette.water, grass: palette.grass, wood: palette.wood, farm: palette.farm };
  const blocked: { poly: [number, number][]; type: string }[] = [];
  const order = ["farm", "grass", "wood", "parking", "water", "pitch", "court"];
  const areas = (extra?.features ?? []).filter((f) => f.properties?.kind === "area" && f.geometry?.type === "Polygon") as Feature<Polygon>[];
  areas.sort((a, b) => order.indexOf(a.properties!.type) - order.indexOf(b.properties!.type));
  areas.forEach((f, i) => {
    const poly = cleanRing((f.geometry.coordinates[0] as [number, number][]).map(toMeters), 0);
    if (poly.length < 3) return;
    const type = f.properties!.type as string;
    ground.push(flatPolygon(poly, 0.04 + i * 0.0005, new THREE.Color(areaColor[type] ?? palette.grass)));
    blocked.push({ poly, type });
  });

  const roads = (extra?.features ?? []).filter((f) => f.properties?.kind === "road" && f.geometry?.type === "LineString") as Feature<LineString>[];
  const roadLines: { pts: [number, number][]; half: number }[] = [];
  const roadPos: number[] = [];
  const pathPos: number[] = [];
  for (const f of roads) {
    const hw = f.properties!.highway as string;
    const pts = (f.geometry.coordinates as [number, number][]).map(toMeters);
    const width = ROAD_WIDTH[hw] ?? 4;
    (isFootway(hw) ? pathPos : roadPos).push(...ribbon(pts, width, isFootway(hw) ? 0.08 : 0.1));
    roadLines.push({ pts, half: width / 2 });
  }
  for (const [pos, color] of [[pathPos, palette.path], [roadPos, palette.road]] as const) {
    if (!pos.length) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    paint(g, new THREE.Color(color));
    ground.push(g);
  }
  // Make every ground part face up with a consistent normal (ribbons can be wound either way)
  for (const g of ground) {
    if (g.index) continue;
    const n = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < n.length; i += 3) n[i + 1] = 1;
    g.setAttribute("normal", new THREE.BufferAttribute(n, 3));
    g.deleteAttribute("uv");
  }
  const groundGeo = mergeGeometries(ground.map((g) => (g.attributes.uv ? (g.deleteAttribute("uv"), g) : g)));
  ground.forEach((g) => g.dispose());

  // Trees: on campus lawns and woods, around the edge for a lush horizon; never on buildings, roads or pitches
  const trees = scatterTrees(boundary, list, roadLines, blocked, palette, clearings);

  const xs = boundary.map((p) => p[0]);
  const ns = boundary.map((p) => p[1]);
  const extent = xs.length ? { minX: Math.min(...xs) - 150, maxX: Math.max(...xs) + 150, minZ: -Math.max(...ns) - 150, maxZ: -Math.min(...ns) + 150 } : { minX: -800, maxX: 800, minZ: -800, maxZ: 800 };

  return { buildings, triStart: Int32Array.from(triStart), list, ground: groundGeo, trees, tanks, boundary, extent };
}

/** Occupancy grid (4 m cells) so thousands of trees can be placed without hitting anything */
function scatterTrees(boundary: [number, number][], buildings: SceneBuilding[], roads: { pts: [number, number][]; half: number }[], areas: { poly: [number, number][]; type: string }[], palette: ScenePalette, clearings: Clearing[]) {
  const matrices: THREE.Matrix4[] = [];
  const colors: THREE.Color[] = [];
  if (!boundary.length) return { matrices, colors };

  const CELL = 4;
  const xs = boundary.map((p) => p[0]);
  const ns = boundary.map((p) => p[1]);
  const pad = 260;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minN = Math.min(...ns) - pad, maxN = Math.max(...ns) + pad;
  const cols = Math.ceil((maxX - minX) / CELL), rows = Math.ceil((maxN - minN) / CELL);
  const busy = new Uint8Array(cols * rows);
  const mark = (x: number, n: number) => {
    const c = Math.floor((x - minX) / CELL), r = Math.floor((n - minN) / CELL);
    if (c >= 0 && r >= 0 && c < cols && r < rows) busy[r * cols + c] = 1;
  };
  const fillPoly = (poly: [number, number][], margin: number) => {
    const px = poly.map((p) => p[0]), pn = poly.map((p) => p[1]);
    for (let x = Math.min(...px) - margin; x <= Math.max(...px) + margin; x += CELL / 2)
      for (let n = Math.min(...pn) - margin; n <= Math.max(...pn) + margin; n += CELL / 2) if (pointInPolygon([x, n], poly) || margin > 0) mark(x, n);
  };
  buildings.forEach((b) => fillPoly(b.footprint, 3));
  for (const c of clearings)
    for (let x = c.center[0] - c.radius; x <= c.center[0] + c.radius; x += CELL / 2)
      for (let n = c.center[1] - c.radius; n <= c.center[1] + c.radius; n += CELL / 2) if (Math.hypot(x - c.center[0], n - c.center[1]) <= c.radius) mark(x, n);
  areas.filter((a) => a.type !== "wood" && a.type !== "grass" && a.type !== "farm").forEach((a) => fillPoly(a.poly, 1));
  for (const r of roads)
    for (let i = 0; i < r.pts.length - 1; i++) {
      const [x1, n1] = r.pts[i], [x2, n2] = r.pts[i + 1];
      const len = Math.hypot(x2 - x1, n2 - n1);
      const steps = Math.max(1, Math.ceil(len / (CELL / 2)));
      for (let s = 0; s <= steps; s++) {
        const x = x1 + ((x2 - x1) * s) / steps, n = n1 + ((n2 - n1) * s) / steps;
        for (let o = -(r.half + 2); o <= r.half + 2; o += CELL / 2) mark(x + ((n2 - n1) / len) * o, n - ((x2 - x1) / len) * o);
      }
    }

  const woods = areas.filter((a) => a.type === "wood");
  const rand = rng(20261013);
  const canopy = palette.canopy.map((c) => new THREE.Color(c));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const tries = 26000;
  for (let i = 0; i < tries && matrices.length < 5200; i++) {
    const x = minX + rand() * (maxX - minX);
    const n = minN + rand() * (maxN - minN);
    const c = Math.floor((x - minX) / CELL), r = Math.floor((n - minN) / CELL);
    if (busy[r * cols + c]) continue;
    const onCampus = pointInPolygon([x, n], boundary);
    const inWood = woods.some((w) => pointInPolygon([x, n], w.poly));
    // Thicker outside the campus and in woods, scattered across campus lawns
    const keep = inWood ? 0.9 : onCampus ? 0.32 : 0.75;
    if (rand() > keep) continue;
    busy[r * cols + c] = 1;
    const s = 0.75 + rand() * 0.75;
    q.setFromAxisAngle(up, rand() * Math.PI * 2);
    m.compose(new THREE.Vector3(x, 0, -n), q, new THREE.Vector3(s, s * (0.85 + rand() * 0.4), s));
    matrices.push(m.clone());
    colors.push(canopy[Math.floor(rand() * canopy.length)].clone().offsetHSL(0, 0, (rand() - 0.5) * 0.05));
  }
  return { matrices, colors };
}

/** Which footprint a triangle of the merged building mesh belongs to */
export function buildingAtTriangle(triStart: Int32Array, tri: number) {
  let lo = 0, hi = triStart.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (triStart[mid] <= tri) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Camera distance ↔ web-map zoom, so the shell's zoom-based calls keep working in 3D */
export const zoomToDistance = (z: number) => 300 * 2 ** (17 - z);
export const distanceToZoom = (d: number) => 17 - Math.log2(d / 300);

/**
 * Where a landmark model stands and which way it faces: on the nearest road
 * within `maxM` of the pin, turned so its local X runs along the road and its
 * local +Z points back towards the pin's side (so a gate's tower stands where
 * the pin is and its beams cross the road). Falls back to the pin itself.
 */
export function landmarkPose(extra: FeatureCollection | null, pin: [number, number], maxM = 30): { x: number; z: number; rotationY: number; center: [number, number] } {
  const p = toMeters(pin);
  let best: { d: number; at: [number, number]; angle: number } | null = null;
  for (const f of extra?.features ?? []) {
    if (f.properties?.kind !== "road" || f.geometry?.type !== "LineString") continue;
    const pts = (f.geometry as LineString).coordinates.map((c) => toMeters(c as [number, number]));
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
      const at: [number, number] = [a[0] + t * dx, a[1] + t * dy];
      const d = Math.hypot(at[0] - p[0], at[1] - p[1]);
      if (d <= maxM && (!best || d < best.d)) best = { d, at, angle: Math.atan2(dy, dx) };
    }
  }
  if (!best) return { x: p[0], z: -p[1], rotationY: 0, center: p };
  // rotation.y = angle puts local +X along the road; local +Z is then (sin, -cos) in east/north
  let rotationY = best.angle;
  const toPin = [p[0] - best.at[0], p[1] - best.at[1]];
  if (toPin[0] * Math.sin(rotationY) - toPin[1] * Math.cos(rotationY) < 0) rotationY += Math.PI;
  return { x: best.at[0], z: -best.at[1], rotationY, center: best.at };
}
