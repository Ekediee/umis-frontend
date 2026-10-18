"use client";

/**
 * 3D campus view: every building in Babcock University stood up from its
 * OpenStreetMap footprint, with roofs, roads, pitches and trees, in a scene the
 * student can pan, rotate and zoom. Click a building to open its place card,
 * press L (or the Labels button) to show or hide place names.
 *
 * Implements the same MapViewHandle as the 2D engines, so the shell's search,
 * chips, place cards, "locate me" and "whole campus" buttons work unchanged.
 * Loaded on demand (Three.js is large) and only offered on WebGL devices.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, MapControls } from "@react-three/drei";
import { createFacadeMaterial } from "@/lib/campus/facade-material";
import { MAIN_GATE_TOP, MainGate3D } from "./main-gate-3d";
import * as THREE from "three";
import type { MapControls as MapControlsImpl } from "three-stdlib";
import type { FeatureCollection, Polygon as GeoPolygon } from "geojson";
import { CATEGORY, footprintFor, type Place } from "@/lib/student/campus";
import { buildCampusScene, buildingAtTriangle, buildingGeometry, DAY, distanceToZoom, landmarkPose, NIGHT, toLngLat, toMeters, zoomToDistance, type CampusScene, type Clearing } from "@/lib/campus/scene3d";
import { cn } from "@/lib/utils";
import type { MapViewProps } from "./map-view";

/** Metres from a point to the nearest wall of a footprint (big halls have far-off centres) */
function distanceToRing([x, y]: [number, number], ring: [number, number][]) {
  let best = Infinity;
  for (let i = 0; i < ring.length - 1; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[i + 1];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

/** Roads, ground areas and known heights; optional (the scene still works without it) */
async function loadSceneExtras(): Promise<FeatureCollection | null> {
  try {
    const res = await fetch("/campus/scene.geojson", { cache: "no-cache" });
    return res.ok ? ((await res.json()) as FeatureCollection) : null;
  } catch {
    return null;
  }
}

interface LabelHit {
  place: Place;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where labels were drawn last frame (written by the scene, read by the tap handler) */
class LabelHitStore {
  list: LabelHit[] = [];
  set(list: LabelHit[]) {
    this.list = list;
  }
  at(x: number, y: number) {
    return this.list.find((l) => x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h);
  }
}

const HOME = { target: new THREE.Vector3(-40, 0, 20), offset: new THREE.Vector3(380, 520, 640) };

export default function Campus3DView(props: MapViewProps) {
  const { places, outline, dark } = props;
  const [extras, setExtras] = useState<FeatureCollection | null | undefined>(undefined);
  const [labels, setLabels] = useState(true);

  useEffect(() => {
    loadSceneExtras().then(setExtras);
  }, []);

  // L toggles place names, like most 3D campus explorers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "l" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      setLabels((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Place ↔ building. A pin that sits just outside its footprint (courtyards, entrances)
  // still claims the building whose walls are within 25 m, so it highlights and is clickable.
  const { placeForBuilding, buildingForPlace } = useMemo(() => {
    const pb = new Map<string, Place>();
    const bp = new Map<string, string>();
    if (!outline || !places) return { placeForBuilding: pb, buildingForPlace: bp };
    const centers = outline.features
      .filter((f) => f.properties?.kind === "building" && f.geometry.type === "Polygon")
      .map((f) => {
        const ring = (f.geometry as GeoPolygon).coordinates[0] as [number, number][];
        return { id: String(f.properties!.id), ring: ring.map(toMeters) };
      });
    for (const p of places) {
      let id = footprintFor(outline, p);
      if (!id) {
        const [x, n] = toMeters(p.coordinates);
        let best = 25;
        for (const b of centers) {
          const d = distanceToRing([x, n], b.ring);
          if (d < best && !pb.has(b.id)) [best, id] = [d, b.id];
        }
      }
      if (id && !pb.has(id)) {
        pb.set(id, p);
        bp.set(p.id, id);
      }
    }
    return { placeForBuilding: pb, buildingForPlace: bp };
  }, [places, outline]);

  const palette = dark ? NIGHT : DAY;
  // Hand-built landmark models (the Main Gate), placed on the real road beside their pin
  const landmarks = useMemo(() => {
    const gate = places?.find((p) => p.id === "main-gate");
    if (!gate || extras === undefined) return null;
    return { mainGate: { place: gate, pose: landmarkPose(extras, gate.coordinates) } };
  }, [places, extras]);
  const clearings = useMemo<Clearing[]>(() => (landmarks ? [{ center: landmarks.mainGate.pose.center, radius: 22 }] : []), [landmarks]);

  const scene = useMemo<CampusScene | null>(
    () => (outline && extras !== undefined ? buildCampusScene(outline, extras, placeForBuilding, palette, clearings) : null),
    [outline, extras, placeForBuilding, palette, clearings],
  );
  useEffect(
    () => () => {
      scene?.buildings.dispose();
      scene?.ground.dispose();
    },
    [scene],
  );

  // Where each place label floats: above its building's roof, or 4 m up for open-air places
  const anchors = useMemo<LabelAnchor[]>(() => {
    if (!scene) return [];
    const byId = new Map(scene.list.filter((b) => b.place).map((b) => [b.place!.id, b]));
    return (places ?? []).map((p) => {
      const [x, n] = toMeters(p.coordinates);
      // Landmark models float their label above the model instead of the ground
      const top = p.id === "main-gate" ? MAIN_GATE_TOP : (byId.get(p.id)?.top ?? 2);
      return { place: p, pos: new THREE.Vector3(x, top + 5, -n) };
    });
  }, [places, scene]);
  const labelEls = useRef(new Map<string, HTMLButtonElement>());
  // Labels don't take pointer events (a drag that starts on one must still pan the map).
  // A short tap is hit-tested against where labels were drawn instead.
  const [labelHits] = useState(() => new LabelHitStore());
  const tapOnLabel = useRef(false);
  const down = useRef<{ x: number; y: number; t: number } | null>(null);
  const hitLabel = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left, y = e.clientY - box.top;
    return labels ? labelHits.at(x, y) : undefined;
  };

  // Everything except the live location, which changes with every reading
  const { me, meAccuracy, meHeading, ...sceneProps } = props;

  // Low-power devices skip shadows and render at 1x
  const capable = typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 4) >= 6;

  return (
    <div
      className="relative h-full w-full"
      style={{ background: palette.sky }}
      onPointerDownCapture={(e) => {
        down.current = { x: e.clientX, y: e.clientY, t: Date.now() };
        tapOnLabel.current = false;
      }}
      onPointerUpCapture={(e) => {
        const d = down.current;
        down.current = null;
        if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || Date.now() - d.t > 700) return;
        const hit = hitLabel(e);
        if (hit) {
          // The map's own click (ground/building) is skipped for this tap
          tapOnLabel.current = true;
          props.onPin(hit.place);
        }
      }}
      onPointerMove={(e) => {
        if (e.buttons) return;
        e.currentTarget.style.cursor = hitLabel(e) ? "pointer" : "";
      }}
    >
      {scene ? (
        <Canvas
          shadows={capable ? "soft" : false}
          dpr={capable ? [1, 2] : [1, 1.25]}
          camera={{ fov: 42, near: 2, far: 6000, position: HOME.target.clone().add(HOME.offset).toArray() }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onPointerMissed={() => !tapOnLabel.current && props.onBackground(me ?? toLngLat(0, 0), null)}
          aria-label="3D campus view"
        >
          <World {...sceneProps} highlightBuildingId={(props.selectedId && buildingForPlace.get(props.selectedId)) || props.highlightBuildingId} scene={scene} palette={palette} shadows={capable} labels={labels} anchors={anchors} labelEls={labelEls} labelHits={labelHits} tapOnLabel={tapOnLabel} landmarks={landmarks} />
          {/* The location dot renders on its own: a new GPS reading must not re-render the whole campus */}
          {me && <Me3D me={me} accuracy={meAccuracy ?? null} heading={meHeading ?? null} />}
        </Canvas>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-gray-900/90 text-[13px] font-semibold text-gray-600 dark:text-gray-300 shadow">Building the campus…</span>
        </div>
      )}

      {/*
        Place labels: one DOM layer positioned from the 3D scene every frame (see World).
        Nearest and selected labels win; others shrink to an icon or hide instead of overlapping.
      */}
      <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", !labels && "hidden")} aria-hidden={!labels}>
        {anchors.map(({ place }) => {
          const c = CATEGORY[place.category];
          const selected = place.id === props.selectedId;
          return (
            <button
              key={place.id}
              ref={(el) => {
                if (el) labelEls.current.set(place.id, el);
                else labelEls.current.delete(place.id);
              }}
              type="button"
              data-mode="hidden"
              onClick={() => props.onPin(place)}
              title={place.name}
              className={cn(
                "group absolute left-0 top-0 flex items-center gap-1.5 max-w-[190px] p-0.5 data-[mode=full]:pr-2.5 rounded-full whitespace-nowrap text-[11.5px] font-semibold border select-none will-change-transform",
                "data-[mode=hidden]:invisible pointer-events-none transition-[opacity] duration-150",
                selected ? "bg-[#003cbb] text-white border-[#003cbb] shadow-lg z-20" : "bg-white/95 dark:bg-gray-900/95 text-gray-800 dark:text-gray-100 border-white/70 dark:border-gray-700 shadow-md z-10 hover:z-30",
              )}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: selected ? "rgba(255,255,255,0.22)" : c.color }}>
                <c.icon className="w-3 h-3 text-white" />
              </span>
              <span className="truncate group-data-[mode=icon]:hidden">{place.name}</span>
            </button>
          );
        })}
      </div>

      {/* Labels toggle (L) */}
      <button
        type="button"
        onClick={() => setLabels((v) => !v)}
        aria-pressed={labels}
        title="Show or hide place names (L)"
        className="absolute z-20 left-3 bottom-3 md:left-4 md:bottom-4 h-9 px-3.5 rounded-full bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 text-[13px] font-semibold text-gray-700 dark:text-gray-200 shadow-md inline-flex items-center gap-2"
      >
        <span className={cn("w-2 h-2 rounded-full", labels ? "bg-[#003cbb] dark:bg-[#4d82ff]" : "bg-gray-300 dark:bg-gray-600")} />
        Labels
        <kbd className="hidden md:inline text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">L</kbd>
      </button>
      <Hint />
      <p className="absolute z-10 right-2 bottom-1 text-[10px] text-gray-700/70 dark:text-gray-300/60 pointer-events-none">© OpenStreetMap contributors</p>
    </div>
  );
}

/** How to move around; fades after a few seconds */
function Hint() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 7000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={cn("hidden md:flex absolute z-20 left-4 bottom-16 gap-3 px-4 py-2 rounded-full bg-black/60 text-white text-[12px] font-medium whitespace-nowrap backdrop-blur transition-opacity duration-700 pointer-events-none", show ? "opacity-100" : "opacity-0")}>
      <span>Drag to pan</span>
      <span className="opacity-50">·</span>
      <span>Right-drag to rotate</span>
      <span className="opacity-50">·</span>
      <span>Scroll to zoom</span>
      <span className="opacity-50">·</span>
      <span>Click a building</span>
    </div>
  );
}

interface LabelAnchor {
  place: Place;
  pos: THREE.Vector3;
}

type WorldProps = Omit<MapViewProps, "me" | "meAccuracy" | "meHeading"> & { scene: CampusScene; palette: typeof DAY; shadows: boolean; labels: boolean; anchors: LabelAnchor[]; labelEls: React.RefObject<Map<string, HTMLButtonElement>>;
  labelHits: LabelHitStore;
  tapOnLabel: React.RefObject<boolean>;
  landmarks: { mainGate: { place: Place; pose: { x: number; z: number; rotationY: number } } } | null;
};

/** Label sizes by camera distance (metres) */
const FULL_UNDER = 650;
const ICON_UNDER = 1500;

/** The campus scene. Memoised: it only re-renders when the scene, selection, filter or theme changes. */
const World = memo(function World({ scene, palette, dark, shadows, labels, anchors, labelEls, labelHits, tapOnLabel, landmarks, handleRef, selectedId, visibleIds, onUserMove, highlightBuildingId, onPin, onBackground }: WorldProps) {
  const controls = useRef<MapControlsImpl>(null);
  const { camera, size } = useThree();
  const widths = useRef(new Map<string, number>());
  const v = useMemo(() => new THREE.Vector3(), []);
  const flight = useRef<{ fromT: THREE.Vector3; toT: THREE.Vector3; fromP: THREE.Vector3; toP: THREE.Vector3; t: number } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  // While a drag is in progress nothing re-renders the scene (hover would), so the
  // controls never lose track of the pointer and every later drag keeps working.
  const dragging = useRef(false);
  const onDragStart = useCallback(() => {
    flight.current = null;
    dragging.current = true;
    onUserMove?.();
  }, [onUserMove]);
  const onDragEnd = useCallback(() => {
    dragging.current = false;
  }, []);
  // Aim once on mount. Passing `target` as a prop would reset it on every re-render.
  useEffect(() => {
    controls.current?.target.copy(HOME.target);
    controls.current?.update();
  }, []);

  const flyTo = useCallback(
    (target: THREE.Vector3, distance: number) => {
      const c = controls.current;
      if (!c) return;
      const dir = camera.position.clone().sub(c.target).normalize();
      // Keep the current heading, but never flatter than ~35° so buildings read well
      if (dir.y < 0.55) dir.setY(0.55).normalize();
      flight.current = { fromT: c.target.clone(), toT: target.clone(), fromP: camera.position.clone(), toP: target.clone().add(dir.multiplyScalar(distance)), t: 0 };
    },
    [camera],
  );

  // The shell talks to every engine through this handle
  useEffect(() => {
    handleRef.current = {
      flyTo: ([lng, lat], zoom) => {
        const [x, n] = toMeters([lng, lat]);
        flyTo(new THREE.Vector3(x, 0, -n), zoomToDistance(zoom));
      },
      fit: () => {
        const c = controls.current;
        if (!c) return;
        flight.current = { fromT: c.target.clone(), toT: HOME.target.clone(), fromP: camera.position.clone(), toP: HOME.target.clone().add(HOME.offset), t: 0 };
      },
      getZoom: () => distanceToZoom(controls.current ? camera.position.distanceTo(controls.current.target) : 800),
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef, camera, flyTo]);

  // The scene takes a moment to build: a place chosen before it was ready (deep link,
  // switching from the map with a card open) gets its fly-in once the scene is up.
  const arrived = useRef(false);
  useEffect(() => {
    if (arrived.current) return;
    arrived.current = true;
    const a = anchors.find((x) => x.place.id === selectedId);
    if (a) setTimeout(() => flyTo(new THREE.Vector3(a.pos.x, 0, a.pos.z), zoomToDistance(17.5)), 150);
  }, [anchors, selectedId, flyTo]);

  /**
   * Projects every label to the screen and declutters: selected first, then nearest.
   * A label that would overlap one already placed shrinks to its icon, or hides.
   */
  const placeLabels = () => {
    const els = labelEls.current;
    if (!els) return;
    const items = anchors
      .map((a) => ({ a, d: camera.position.distanceTo(a.pos), sel: a.place.id === selectedId }))
      .sort((x, y) => (x.sel === y.sel ? x.d - y.d : x.sel ? -1 : 1));
    const placed: [number, number, number, number][] = [];
    const onScreen: LabelHit[] = [];
    const hits = (x: number, y: number, w: number, h: number) => placed.some(([px, py, pw, ph]) => x < px + pw + 4 && x + w + 4 > px && y < py + ph + 3 && y + h + 3 > py);
    for (const { a, d, sel } of items) {
      const el = els.get(a.place.id);
      if (!el) continue;
      v.copy(a.pos).project(camera);
      const offscreen = v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1;
      let mode: "full" | "icon" | "hidden" = offscreen || (!sel && !visibleIds.has(a.place.id)) ? "hidden" : sel || d < FULL_UNDER ? "full" : d < ICON_UNDER ? "icon" : "hidden";
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      if (mode !== "hidden") {
        if (!widths.current.has(a.place.id) && el.dataset.mode === "full") widths.current.set(a.place.id, el.offsetWidth);
        const fullW = widths.current.get(a.place.id) ?? 140;
        if (mode === "full" && !sel && hits(x - fullW / 2, y - 12, fullW, 24)) mode = "icon";
        if (mode === "icon" && hits(x - 13, y - 12, 26, 24)) mode = "hidden";
        const w = mode === "full" ? fullW : 26;
        placed.push([x - w / 2, y - 12, w, 24]);
        onScreen.push({ place: a.place, x: x - w / 2, y: y - 12, w, h: 24 });
        el.style.transform = `translate(${Math.round(x - w / 2)}px, ${Math.round(y - 12)}px)`;
      }
      if (el.dataset.mode !== mode) el.dataset.mode = mode;
    }
    labelHits.set(onScreen);
  };

  useFrame((_, dt) => {
    const c = controls.current;
    const f = flight.current;
    if (c && f) {
      f.t = Math.min(1, f.t + dt / 0.9);
      const k = 1 - Math.pow(1 - f.t, 3); // ease out
      c.target.lerpVectors(f.fromT, f.toT, k);
      camera.position.lerpVectors(f.fromP, f.toP, k);
      if (f.t >= 1) flight.current = null;
    }
    if (c) {
      // Keep the view on campus
      const e = scene.extent;
      const clamped = c.target.clone().set(THREE.MathUtils.clamp(c.target.x, e.minX, e.maxX), 0, THREE.MathUtils.clamp(c.target.z, e.minZ, e.maxZ));
      if (!clamped.equals(c.target)) {
        camera.position.add(clamped.clone().sub(c.target));
        c.target.copy(clamped);
      }
      c.update();
    }
    if (labels) placeLabels();
  });

  // Materials: one for all buildings (vertex colours), one for the ground
  // Windows, frames, roof tiles and night lights are drawn by the facade shader
  const buildingMat = useMemo(() => createFacadeMaterial(dark), [dark]);
  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }), []);
  useEffect(() => () => (buildingMat.dispose(), groundMat.dispose()), [buildingMat, groundMat]);

  // Selected (or hovered) building, redrawn on top in the brand colour
  const highlightIndex = useMemo(() => (highlightBuildingId ? scene.list.findIndex((b) => b.id === highlightBuildingId) : -1), [scene, highlightBuildingId]);
  const highlightGeo = useMemo(() => {
    if (highlightIndex < 0) return null;
    const b = scene.list[highlightIndex];
    return buildingGeometry(b, new THREE.Color(dark ? "#6f95ff" : "#3d6ff0"), new THREE.Color(dark ? "#9db6ff" : "#1f4fd1"));
  }, [scene, highlightIndex, dark]);
  const hoverGeo = useMemo(() => {
    if (hover === null || hover === highlightIndex) return null;
    const b = scene.list[hover];
    return buildingGeometry(b, new THREE.Color(dark ? "#5b6476" : "#fff8ea"), new THREE.Color(dark ? "#6f7d93" : "#d77a5c"));
  }, [scene, hover, highlightIndex, dark]);
  useEffect(() => () => highlightGeo?.dispose(), [highlightGeo]);
  useEffect(() => () => hoverGeo?.dispose(), [hoverGeo]);

  const indexAt = (e: ThreeEvent<PointerEvent | MouseEvent>) => (e.faceIndex == null ? null : buildingAtTriangle(scene.triStart, e.faceIndex));

  const onBuildingClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (tapOnLabel.current) return;
    const i = indexAt(e);
    if (i === null) return;
    const b = scene.list[i];
    if (b.place) onPin(b.place);
    else onBackground(toLngLat(b.center[0], -b.center[1]), null);
  };

  // Tree instances
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const { matrices, colors } = scene.trees;
    const tr = trunks.current, cr = crowns.current;
    if (!tr || !cr) return;
    matrices.forEach((m, i) => {
      tr.setMatrixAt(i, m);
      cr.setMatrixAt(i, m);
      cr.setColorAt(i, colors[i]);
    });
    tr.instanceMatrix.needsUpdate = true;
    cr.instanceMatrix.needsUpdate = true;
    if (cr.instanceColor) cr.instanceColor.needsUpdate = true;
    cr.computeBoundingSphere();
  }, [scene]);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.28, 0.4, 3, 5).translate(0, 1.5, 0), []);
  const crownGeo = useMemo(() => new THREE.IcosahedronGeometry(3, 0).scale(1, 1.15, 1).translate(0, 5.2, 0), []);

  return (
    <>
      <MapControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.12}
        screenSpacePanning={false}
        minDistance={45}
        maxDistance={2400}
        maxPolarAngle={1.32}
        zoomSpeed={0.9}
        onStart={onDragStart}
        onEnd={onDragEnd}
      />

      {/* Sky colour and distance haze */}
      <color attach="background" args={[palette.sky]} />
      <fog attach="fog" args={[palette.sky, 1100, 3200]} />

      {/* What the glass reflects: a soft sky and a bright horizon, rendered once (no download) */}
      <Environment resolution={128} frames={1} environmentIntensity={dark ? 0.85 : 0.4}>
        <Lightformer form="rect" intensity={dark ? 0.6 : 1.4} color={dark ? "#7d90bd" : "#dbe9f7"} scale={[40, 40, 1]} position={[0, 12, 0]} rotation-x={Math.PI / 2} />
        <Lightformer form="ring" intensity={dark ? 0.3 : 2.2} color={dark ? "#9fb4ff" : "#fff3dc"} scale={6} position={[-10, 6, 6]} />
        <Lightformer form="rect" intensity={dark ? 0.15 : 0.7} color={dark ? "#2a3550" : "#a9c47a"} scale={[40, 6, 1]} position={[0, -2, -12]} />
      </Environment>

      <hemisphereLight args={[dark ? "#a9bbe6" : "#e3f0ff", dark ? "#4a5a40" : "#7c8c55", dark ? 2.1 : 0.85]} />
      <directionalLight
        position={dark ? [-300, 600, 200] : [-420, 620, 260]}
        intensity={dark ? 2.1 : 2.7}
        color={dark ? "#c3d0ff" : "#fff0d4"}
        castShadow={shadows}
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-1100}
        shadow-camera-right={1100}
        shadow-camera-top={1100}
        shadow-camera-bottom={-1100}
        shadow-camera-near={10}
        shadow-camera-far={2400}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
      />

      <mesh geometry={scene.ground} material={groundMat} receiveShadow onClick={(e) => {
          e.stopPropagation();
          if (!tapOnLabel.current) onBackground(toLngLat(e.point.x, e.point.z), null);
        }}
      />

      <mesh
        geometry={scene.buildings}
        material={buildingMat}
        castShadow
        receiveShadow
        onClick={onBuildingClick}
        onPointerMove={(e) => {
          e.stopPropagation();
          const i = indexAt(e);
          if (!dragging.current && i !== hover) setHover(i);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(null);
          document.body.style.cursor = "";
        }}
      />
      {hoverGeo && <mesh geometry={hoverGeo} material={buildingMat} raycast={() => null} />}
      {highlightGeo && <mesh geometry={highlightGeo} material={buildingMat} castShadow raycast={() => null} />}

      {/* Rooftop water tanks */}
      {scene.tanks.length > 0 && <Tanks matrices={scene.tanks} />}

      {/* Landmarks modelled by hand */}
      {landmarks && (
        <MainGate3D
          position={[landmarks.mainGate.pose.x, 0, landmarks.mainGate.pose.z]}
          rotationY={landmarks.mainGate.pose.rotationY}
          selected={selectedId === landmarks.mainGate.place.id}
          onClick={() => !tapOnLabel.current && onPin(landmarks.mainGate.place)}
        />
      )}

      <instancedMesh ref={trunks} args={[trunkGeo, undefined, scene.trees.matrices.length]} castShadow raycast={() => null}>
        <meshStandardMaterial color={palette.trunk} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[crownGeo, undefined, scene.trees.matrices.length]} castShadow receiveShadow raycast={() => null}>
        <meshStandardMaterial roughness={0.95} flatShading />
      </instancedMesh>
    </>
  );
});

/** Black polyethylene water tanks, instanced (one draw call for the whole campus) */
function Tanks({ matrices }: { matrices: THREE.Matrix4[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.CylinderGeometry(0.85, 0.95, 1.7, 14).translate(0, 0.85, 0), []);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    matrices.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [matrices]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, matrices.length]} castShadow raycast={() => null}>
      <meshStandardMaterial color="#1d2024" roughness={0.55} />
    </instancedMesh>
  );
}

/**
 * "You are here" in 3D: a glowing blue marker that glides to each GPS reading,
 * a soft accuracy disc on the ground and a cone pointing the way you're walking.
 */
function Me3D({ me, accuracy, heading }: { me: [number, number]; accuracy: number | null; heading: number | null }) {
  const group = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Mesh>(null);
  const cone = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const target = useMemo(() => {
    const [x, n] = toMeters(me);
    return new THREE.Vector3(x, 0, -n);
  }, [me]);
  const placed = useRef(false);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    // First reading (or a big jump) snaps; after that, glide like a walking person
    if (!placed.current || g.position.distanceTo(target) > 300) {
      g.position.copy(target);
      placed.current = true;
    } else {
      g.position.lerp(target, 1 - Math.exp(-dt * 3));
    }
    const r = accuracy && accuracy > 8 ? Math.min(accuracy, 300) : 0;
    if (disc.current) {
      disc.current.visible = r > 0;
      disc.current.scale.setScalar(Math.max(r, 0.001));
    }
    if (cone.current) {
      cone.current.visible = heading != null;
      // Heading is clockwise from north (-Z); rotation.y turns counter-clockwise
      if (heading != null) cone.current.rotation.y = THREE.MathUtils.lerp(cone.current.rotation.y, -THREE.MathUtils.degToRad(heading), 1 - Math.exp(-dt * 6));
    }
    if (pulse.current) {
      const t = (state.clock.elapsedTime % 1.6) / 1.6;
      pulse.current.scale.setScalar(4 + t * 10);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - t);
    }
  });

  return (
    <group ref={group}>
      <mesh ref={disc} rotation-x={-Math.PI / 2} position-y={0.25} raycast={() => null}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <mesh ref={pulse} rotation-x={-Math.PI / 2} position-y={0.3} raycast={() => null}>
        <ringGeometry args={[0.8, 1, 40]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <group ref={cone} position-y={0.35}>
        <mesh rotation-x={-Math.PI / 2} raycast={() => null}>
          <circleGeometry args={[9, 24, Math.PI / 2 - 0.45, 0.9]} />
          <meshBasicMaterial color="#2563eb" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      </group>
      {/* Marker: a glowing blue ball with a white collar, raised so it reads above the street */}
      <mesh position-y={4} raycast={() => null}>
        <sphereGeometry args={[3.4, 24, 24]} />
        <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={0.75} roughness={0.35} />
      </mesh>
      <mesh position-y={4} rotation-x={Math.PI / 2} raycast={() => null}>
        <torusGeometry args={[3.5, 0.75, 12, 40]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
    </group>
  );
}
