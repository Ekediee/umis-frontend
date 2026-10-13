import type { MutableRefObject } from "react";
import type { FeatureCollection } from "geojson";
import type { Place } from "@/lib/student/campus";

/**
 * What the campus map shell needs from a map engine. Two engines implement it:
 * - gl-map-view (MapLibre, WebGL vector map): the default
 * - lite-map-view (Leaflet, Canvas/SVG raster map): for devices without WebGL
 */
export interface MapViewHandle {
  /** Fly to [lng, lat]; `bottomPad` keeps the point above a bottom sheet (px). */
  flyTo: (center: [number, number], zoom: number, bottomPad?: number) => void;
  /** Frame the whole campus. */
  fit: () => void;
  getZoom: () => number;
}

export interface MapViewProps {
  handleRef: MutableRefObject<MapViewHandle | null>;
  places: Place[] | null;
  outline: FeatureCollection | null;
  dark: boolean;
  selectedId: string | null;
  visibleIds: Set<string>;
  me: [number, number] | null;
  /** Building footprint to highlight (selected place, or a mapping-mode pick) */
  highlightBuildingId: string | null;
  /** Mapping mode: clicking a building reports its footprint id */
  mapping: boolean;
  onPin: (p: Place) => void;
  /** Click on the map (not a pin); buildingId is set when a footprint was clicked in mapping mode. */
  onBackground: (lngLat: [number, number], buildingId: string | null) => void;
}

export type MapEngine = "gl" | "lite";
