"use client";

/**
 * WebGL campus map: MapLibre with OpenFreeMap vector tiles (no API key).
 * Sharp at every zoom, with building names drawn as a map layer.
 */

import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import { CAMPUS, MAP_STYLES, placesToGeoJSON } from "@/lib/student/campus";
import type { MapViewProps } from "./map-view";
import { MeDot, Pin } from "./pin";

export default function GlMapView({ handleRef, places, outline, dark, selectedId, visibleIds, me, highlightBuildingId, mapping, onPin, onBackground }: MapViewProps) {
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
      {me && (
        <Marker longitude={me[0]} latitude={me[1]} anchor="center">
          <MeDot />
        </Marker>
      )}
    </Map>
  );
}
