"use client";

/**
 * Lite campus map for devices without WebGL: Leaflet drawing on Canvas/SVG,
 * with OpenStreetMap's standard raster tiles. Slightly softer than the vector
 * map; students get pins, labels, the campus outline, building footprints,
 * the selected-building highlight and "you are here". Building shapes are
 * display-only here (no mapping mode: that IT-office tool lives on the WebGL map).
 *
 * Tile usage: only devices without WebGL load these tiles, which keeps us well
 * inside the OpenStreetMap tile usage policy. Attribution is shown on the map.
 */

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import type { Feature } from "geojson";
import { CAMPUS, type Place } from "@/lib/student/campus";
import { cn } from "@/lib/utils";
import type { MapViewProps } from "./map-view";
import { MeDot, Pin, useGlide } from "./pin";

const toLatLng = ([lng, lat]: [number, number]) => L.latLng(lat, lng);
const viewBounds = L.latLngBounds(toLatLng(CAMPUS.view[0]), toLatLng(CAMPUS.view[1]));
const maxBounds = L.latLngBounds(L.latLng(CAMPUS.bounds[0][1] - 0.02, CAMPUS.bounds[0][0] - 0.02), L.latLng(CAMPUS.bounds[1][1] + 0.02, CAMPUS.bounds[1][0] + 0.02));

function shapeStyle(f: Feature | undefined, dark: boolean, highlight: string | null): L.PathOptions {
  if (f?.properties?.kind === "campus") {
    const c = dark ? "#4d82ff" : "#003cbb";
    return { color: c, weight: 1.6, opacity: 0.6, dashArray: "6 4", fillColor: c, fillOpacity: dark ? 0.06 : 0.035 };
  }
  if (highlight && f?.properties?.id === highlight) return { color: "#003cbb", weight: 1.2, fillColor: "#2563eb", fillOpacity: 0.4 };
  return { color: dark ? "#3b4a6b" : "#b9c6e3", weight: 0.7, fillColor: dark ? "#2a3550" : "#dde5f4", fillOpacity: 0.9 };
}

export default function LiteMapView({ handleRef, places, outline, dark, selectedId, visibleIds, me, meAccuracy, meHeading, onUserMove, highlightBuildingId, onPin, onBackground }: MapViewProps) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const shapesRef = useRef<L.GeoJSON | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [zoom, setZoom] = useState(CAMPUS.zoom);
  const [pinHosts, setPinHosts] = useState<{ place: Place; host: HTMLElement; marker: L.Marker }[]>([]);
  const [meHost, setMeHost] = useState<HTMLElement | null>(null);

  // Latest callbacks for Leaflet listeners registered once
  const cb = useRef({ onBackground, onUserMove });
  useEffect(() => {
    cb.current = { onBackground, onUserMove };
  });

  // Create the map once
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { zoomControl: false, preferCanvas: true, minZoom: 14, maxZoom: 19, maxBounds, maxBoundsViscosity: 0.8, zoomSnap: 0.5 });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    m.fitBounds(viewBounds, { padding: [24, 24] });
    m.on("zoomend", () => setZoom(m.getZoom()));
    m.on("click", (e: L.LeafletMouseEvent) => cb.current.onBackground([e.latlng.lng, e.latlng.lat], null));
    // The student moving the map (not our own fly-to) stops "follow me"
    m.on("dragstart", () => cb.current.onUserMove?.());
    el.current.addEventListener("wheel", () => cb.current.onUserMove?.(), { passive: true });
    mapRef.current = m;
    m.whenReady(() => {
      setMap(m);
      setZoom(m.getZoom());
    });
    return () => {
      m.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current = {
      flyTo: (center, z, bottomPad = 0) => {
        const m = mapRef.current;
        if (!m) return;
        // Offset the target so it lands above a bottom sheet
        const point = m.project(toLatLng(center), z).add([0, bottomPad / 2]);
        m.flyTo(m.unproject(point, z), z, { duration: 0.7 });
      },
      fit: () => mapRef.current?.flyToBounds(viewBounds, { padding: [24, 24], duration: 0.7 }),
      getZoom: () => mapRef.current?.getZoom() ?? CAMPUS.zoom,
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef]);

  // Campus outline + building footprints
  useEffect(() => {
    if (!map || !outline) return;
    // Display only: shapes can't be clicked or hovered, so taps go straight through to the map
    const shapes = L.geoJSON(outline, { style: (f) => shapeStyle(f, dark, null), interactive: false }).addTo(map);
    shapesRef.current = shapes;
    return () => {
      shapes.remove();
      shapesRef.current = null;
    };
  }, [map, outline, dark]);

  // Highlight the selected building without rebuilding 400+ shapes
  useEffect(() => {
    shapesRef.current?.setStyle((f) => shapeStyle(f, dark, highlightBuildingId));
  }, [highlightBuildingId, dark, map, outline]);

  // Pins: Leaflet markers whose content is the shared React <Pin>, rendered through portals
  useEffect(() => {
    if (!map || !places) return;
    const items = places.map((place) => {
      const marker = L.marker(toLatLng(place.coordinates), { icon: L.divIcon({ className: "campus-lite-pin", html: "", iconSize: [0, 0] }), keyboard: false }).addTo(map);
      return { place, host: marker.getElement() as HTMLElement, marker };
    });
    // Leaflet creates the marker elements; React needs them as portal targets
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPinHosts(items);
    return () => items.forEach((i) => i.marker.remove());
  }, [map, places]);

  // Keep the selected pin on top
  useEffect(() => {
    pinHosts.forEach(({ place, marker }) => marker.setZIndexOffset(place.id === selectedId ? 1000 : 0));
  }, [pinHosts, selectedId]);

  // "You are here": one marker that glides between readings, plus an accuracy circle
  const pos = useGlide(me);
  const meMarker = useRef<L.Marker | null>(null);
  const meRing = useRef<L.Circle | null>(null);
  const hasMe = !!pos;
  useEffect(() => {
    if (!map || !hasMe) return;
    const start = toLatLng(pos!);
    const marker = L.marker(start, { icon: L.divIcon({ className: "campus-lite-pin", html: "", iconSize: [0, 0] }), interactive: false, keyboard: false, zIndexOffset: 2000 }).addTo(map);
    const ring = L.circle(start, { radius: 0, color: "#2563eb", weight: 1, opacity: 0.35, fillColor: "#2563eb", fillOpacity: 0.12, interactive: false }).addTo(map);
    meMarker.current = marker;
    meRing.current = ring;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeHost(marker.getElement() as HTMLElement);
    return () => {
      marker.remove();
      ring.remove();
      meMarker.current = null;
      meRing.current = null;
      setMeHost(null);
    };
    // Created once per tracking session; position updates below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, hasMe]);
  useEffect(() => {
    if (!pos) return;
    meMarker.current?.setLatLng(toLatLng(pos));
    meRing.current?.setLatLng(toLatLng(pos)).setRadius(meAccuracy && meAccuracy > 8 ? Math.min(meAccuracy, 300) : 0);
  }, [pos, meAccuracy]);

  return (
    <>
      {/* isolate: Leaflet's panes use z-index 400+, keep them under the page's floating search and cards */}
      <div ref={el} className={cn("h-full w-full isolate bg-[#eef0f3] dark:bg-gray-900", dark && "campus-lite-dark")} aria-label="Campus map" />
      {pinHosts.map(({ place, host }) =>
        createPortal(
          <div className="absolute left-0 bottom-0 -translate-x-1/2">
            <Pin place={place} selected={selectedId === place.id} dimmed={!visibleIds.has(place.id)} label={zoom >= 17} onClick={() => onPin(place)} />
          </div>,
          host,
          place.id,
        ),
      )}
      {meHost &&
        createPortal(
          <div className="absolute -translate-x-1/2 -translate-y-1/2">
            <MeDot heading={meHeading ?? null} />
          </div>,
          meHost,
        )}
    </>
  );
}
