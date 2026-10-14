/**
 * Campus map data helpers. Places live in public/campus/places.geojson,
 * owned by the IT office (positions seeded from OpenStreetMap). Later this can
 * move to GET /campus/places so staff edit places without a deploy.
 */

import type { Feature as GeoFeature, FeatureCollection, Point, Polygon } from "geojson";
import { Banknote, BookOpen, Building2, Church, Dumbbell, GraduationCap, HeartPulse, Home, Landmark, ShoppingBag, UtensilsCrossed, type LucideIcon } from "lucide-react";

export const CAMPUS = {
  name: "Babcock University",
  address: "Ilishan-Remo, Ogun State",
  /** [lng, lat] */
  center: [3.72295, 6.8912] as [number, number],
  /** Outer limit for panning */
  bounds: [
    [3.7125, 6.8815],
    [3.7335, 6.8985],
  ] as [[number, number], [number, number]],
  /** What the map frames on open: the built-up campus */
  view: [
    [3.7168, 6.8868],
    [3.7290, 6.8955],
  ] as [[number, number], [number, number]],
  zoom: 16,
};

export const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

export type PlaceCategory = "academic" | "hall" | "library" | "food" | "shop" | "bank" | "health" | "worship" | "sport" | "admin" | "landmark";

export interface PhotoCredit {
  author: string;
  /** e.g. "CC0", "CC BY-SA 4.0"; null for the university's own photos */
  license: string | null;
  licenseUrl: string | null;
  /** Page the photo came from (Wikimedia Commons), if any */
  source: string | null;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  aliases?: string[];
  photo?: string;
  photoCredit?: PhotoCredit;
  /** [lng, lat] */
  coordinates: [number, number];
}

export const CATEGORY: Record<PlaceCategory, { label: string; icon: LucideIcon; color: string; chip: string }> = {
  academic: { label: "Lecture halls", icon: GraduationCap, color: "#003cbb", chip: "Academic" },
  hall: { label: "Halls of residence", icon: Home, color: "#7c3aed", chip: "Halls" },
  library: { label: "Library", icon: BookOpen, color: "#0369a1", chip: "Library" },
  food: { label: "Food", icon: UtensilsCrossed, color: "#ea580c", chip: "Food" },
  shop: { label: "Shops", icon: ShoppingBag, color: "#db2777", chip: "Shops" },
  bank: { label: "Banks and ATMs", icon: Banknote, color: "#059669", chip: "Banks" },
  health: { label: "Health", icon: HeartPulse, color: "#dc2626", chip: "Health" },
  worship: { label: "Worship", icon: Church, color: "#a16207", chip: "Worship" },
  sport: { label: "Sport", icon: Dumbbell, color: "#0d9488", chip: "Sport" },
  admin: { label: "Offices", icon: Building2, color: "#475569", chip: "Offices" },
  landmark: { label: "Landmarks", icon: Landmark, color: "#64748b", chip: "Landmarks" },
};

/** Order of the filter chips: what students look for most first. */
export const CATEGORY_ORDER: PlaceCategory[] = ["academic", "hall", "food", "library", "bank", "health", "admin", "worship", "sport", "shop", "landmark"];

interface Feature {
  properties: { id: string; name: string; category: PlaceCategory; aliases?: string[]; photo?: string; photoCredit?: PhotoCredit };
  geometry: { coordinates: [number, number] };
}

/** Campus boundary + building footprints (public/campus/campus.geojson, built from OpenStreetMap). */
export async function loadCampusOutline(): Promise<FeatureCollection | null> {
  try {
    const res = await fetch("/campus/campus.geojson", { cache: "no-cache" });
    return res.ok ? ((await res.json()) as FeatureCollection) : null;
  } catch {
    return null;
  }
}

/** Places as GeoJSON for the label layer. */
export function placesToGeoJSON(places: Place[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: places.map((p) => ({ type: "Feature", id: p.id, properties: { id: p.id, name: p.name, category: p.category }, geometry: { type: "Point", coordinates: p.coordinates } })),
  };
}

/** Building footprint that contains the place's point, if any (ray casting). */
export function footprintFor(outline: FeatureCollection | null, p: Place): string | null {
  if (!outline) return null;
  const [x, y] = p.coordinates;
  for (const f of outline.features) {
    if (f.properties?.kind !== "building" || f.geometry.type !== "Polygon") continue;
    const ring = f.geometry.coordinates[0] as [number, number][];
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    if (hit) return String(f.properties.id);
  }
  return null;
}

export async function loadPlaces(): Promise<Place[]> {
  const res = await fetch("/campus/places.geojson", { cache: "no-cache" });
  if (!res.ok) throw new Error("Couldn't load campus places");
  const json = (await res.json()) as { features: Feature[] };
  return json.features.map((f) => ({ ...f.properties, coordinates: f.geometry.coordinates }));
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[—–-]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Search by name or alias; exact and prefix matches rank first. */
export function searchPlaces(places: Place[], query: string) {
  const q = norm(query);
  if (!q) return places;
  const scored = places
    .map((p) => {
      const names = [p.name, ...(p.aliases ?? [])].map(norm);
      let score = 0;
      for (const n of names) {
        if (n === q) score = Math.max(score, 100);
        else if (n.startsWith(q)) score = Math.max(score, 70);
        else if (n.split(" ").some((w) => w.startsWith(q))) score = Math.max(score, 50);
        else if (n.includes(q)) score = Math.max(score, 30);
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));
  return scored.map((x) => x.p);
}

/** Best place for a timetable venue string such as "CST Hall A" or "LT 12". */
export function matchVenue(places: Place[], venue: string): Place | null {
  return searchPlaces(places, venue)[0] ?? null;
}

/**
 * Opens the place in Google Maps, where students can see Google's photos, reviews and Street View.
 * (Google's terms don't allow showing Google Places photos on a non-Google map like ours, so we link out.)
 */
export function googleMapsUrl(p: Place) {
  const [lng, lat] = p.coordinates;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name}, Babcock University, Ilishan-Remo`)}&center=${lat},${lng}`;
}

/** Walking directions in the phone's maps app (v1: no routing server needed). */
export function directionsUrl(p: Place) {
  const [lng, lat] = p.coordinates;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

/** Straight-line distance in metres, for "4 min walk" hints. */
export function distanceM(a: [number, number], b: [number, number]) {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** MapLibre needs WebGL; some old phones, locked-down browsers and remote desktops don't have it. */
let webglSupport: boolean | null = null;

export function supportsWebGL() {
  if (typeof document === "undefined") return true;
  // Checked once: each probe creates a GL context, and browsers cap how many can exist.
  if (webglSupport === null) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

/** Compass bearing from a to b, degrees clockwise from north */
export function bearingDeg(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b[0] - a[0])) * Math.cos(toRad(b[1]));
  const x = Math.cos(toRad(a[1])) * Math.sin(toRad(b[1])) - Math.sin(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.cos(toRad(b[0] - a[0]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** A circle of `radiusM` metres around a point, as a GeoJSON polygon (location accuracy ring) */
export function circlePolygon([lng, lat]: [number, number], radiusM: number, steps = 48): GeoFeature<Polygon> {
  const dLat = radiusM / 110_574;
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    ring.push([lng + dLng * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
}

export function walkLabel(m: number) {
  const min = Math.max(1, Math.round(m / 80)); // ~4.8 km/h
  return m < 1000 ? `${Math.round(m / 10) * 10} m · ${min} min walk` : `${(m / 1000).toFixed(1)} km · ${min} min walk`;
}
