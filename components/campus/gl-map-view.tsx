"use client";

/**
 * WebGL campus map: MapLibre with OpenFreeMap vector tiles (no API key).
 * Sharp at every zoom, with building names drawn as a map layer.
 */

import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source, type MapLayerMouseEvent, type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import { CAMPUS, MAP_STYLES, circlePolygon, placesToGeoJSON } from "@/lib/student/campus";
import type { MapViewProps } from "./map-view";
import { MeDot, Pin, useGlide } from "./pin";

export default function GlMapView({ handleRef, places, outline, dark, selectedId, visibleIds, me, meAccuracy, meHeading, onUserMove, highlightBuildingId, mapping, onPin, onBackground }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [beforeId, setBeforeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    handleRef.current = {
      flyTo: (center, zoom, bottomPad = 0) => mapRef.current?.flyTo({ center, zoom, duration: 700, padding: { top: 0, bottom: bottomPad, left: 0, right: 0 } }),
      fit: () => mapRef.current?.fitBounds(CAMPUS.view, { padding: 24, duration: 700 }),
      getZoom: () => mapRef.current?.getZoom() ?? CAMPUS.zoom,
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef]);

  // Draw campus shapes under the base map's own labels (roads, place names stay readable)
  const onStyle = useCallback(() => {
    const layers = mapRef.current?.getStyle()?.layers ?? [];
    setBeforeId(layers.find((l) => l.type === "symbol")?.id);
  }, []);

  const labels = useMemo(() => (places ? placesToGeoJSON(places) : null), [places]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ bounds: CAMPUS.view, fitBoundsOptions: { padding: 24 } }}
      maxBounds={[CAMPUS.bounds[0][0] - 0.02, CAMPUS.bounds[0][1] - 0.02, CAMPUS.bounds[1][0] + 0.02, CAMPUS.bounds[1][1] + 0.02]}
      minZoom={14}
      maxZoom={19}
      mapStyle={dark ? MAP_STYLES.dark : MAP_STYLES.light}
      style={{ width: "100%", height: "100%" }}
      onClick={(e: MapLayerMouseEvent) => {
        const hit = e.features?.find((f) => f.properties?.kind === "building");
        onBackground([e.lngLat.lng, e.lngLat.lat], hit ? String(hit.properties?.id) : null);
      }}
      interactiveLayerIds={mapping ? ["campus-buildings"] : undefined}
      onLoad={onStyle}
      onStyleData={onStyle}
      attributionControl={{ compact: true }}
      // A drag, pinch or wheel by the student (not our own fly-to) stops "follow me"
      onMoveStart={(e: ViewStateChangeEvent) => e.originalEvent && onUserMove?.()}
      reuseMaps
    >
      {outline && (
        <Source id="campus" type="geojson" data={outline}>
          <Layer id="campus-area" type="fill" beforeId={beforeId} filter={["==", ["get", "kind"], "campus"]} paint={{ "fill-color": dark ? "#4d82ff" : "#003cbb", "fill-opacity": dark ? 0.06 : 0.035 }} />
          <Layer id="campus-edge" type="line" beforeId={beforeId} filter={["==", ["get", "kind"], "campus"]} paint={{ "line-color": dark ? "#4d82ff" : "#003cbb", "line-width": 1.6, "line-opacity": 0.55, "line-dasharray": [3, 2] }} />
          <Layer id="campus-buildings" type="fill" beforeId={beforeId} filter={["==", ["get", "kind"], "building"]} paint={{ "fill-color": dark ? "#2a3550" : "#dde5f4", "fill-opacity": 0.95 }} />
          <Layer id="campus-buildings-edge" type="line" beforeId={beforeId} filter={["==", ["get", "kind"], "building"]} paint={{ "line-color": dark ? "#3b4a6b" : "#b9c6e3", "line-width": 0.7 }} />
          <Layer
            id="campus-building-selected"
            type="fill"
            beforeId={beforeId}
            filter={["==", ["get", "id"], highlightBuildingId ?? ""]}
            paint={{ "fill-color": "#2563eb", "fill-opacity": 0.35, "fill-outline-color": "#003cbb" }}
          />
        </Source>
      )}
      {labels && (
        <Source id="campus-labels" type="geojson" data={labels}>
          <Layer
            id="campus-place-names"
            type="symbol"
            minzoom={16.6}
            layout={{ "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 11, "text-offset": [0, 0.9], "text-anchor": "top", "text-max-width": 9, "text-optional": true }}
            paint={{ "text-color": dark ? "#e5e7eb" : "#1f2937", "text-halo-color": dark ? "#111827" : "#ffffff", "text-halo-width": 1.4 }}
          />
        </Source>
      )}
      {places?.map((p) => (
        <Marker key={p.id} longitude={p.coordinates[0]} latitude={p.coordinates[1]} anchor="bottom" style={{ zIndex: selectedId === p.id ? 20 : 10 }}>
          <Pin place={p} selected={selectedId === p.id} dimmed={!visibleIds.has(p.id)} onClick={() => onPin(p)} />
        </Marker>
      ))}
      <MeMarker me={me} accuracy={meAccuracy ?? null} heading={meHeading ?? null} />
    </Map>
  );
}

/** Live location: glides between readings, with an accuracy circle and a walking-direction cone */
function MeMarker({ me, accuracy, heading }: { me: [number, number] | null; accuracy: number | null; heading: number | null }) {
  const pos = useGlide(me);
  const ring = useMemo(() => (pos && accuracy && accuracy > 8 ? circlePolygon(pos, Math.min(accuracy, 300)) : null), [pos, accuracy]);
  if (!pos) return null;
  return (
    <>
      {ring && (
        <Source id="me-accuracy" type="geojson" data={ring}>
          <Layer id="me-accuracy-fill" type="fill" paint={{ "fill-color": "#2563eb", "fill-opacity": 0.12 }} />
          <Layer id="me-accuracy-edge" type="line" paint={{ "line-color": "#2563eb", "line-opacity": 0.35, "line-width": 1 }} />
        </Source>
      )}
      {/* The cone points north inside the dot; MapLibre turns the marker with the map */}
      <Marker longitude={pos[0]} latitude={pos[1]} anchor="center" rotation={heading ?? 0} rotationAlignment="map" style={{ zIndex: 30 }}>
        <MeDot heading={heading == null ? null : 0} />
      </Marker>
    </>
  );
}
