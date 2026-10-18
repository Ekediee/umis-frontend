"use client";

/**
 * Interactive campus map: OpenFreeMap vector tiles (no API key) drawn with
 * MapLibre, places from public/campus/places.geojson.
 * Desktop: search + list panel on the left, map on the right.
 * Phone: full-screen map, floating search and chips, place card at the bottom.
 */

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { FeatureCollection } from "geojson";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Box, Check, Copy, Crosshair, ExternalLink, Images, LocateFixed, Map as MapIcon, MapPin, Navigation, PenLine, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useIsDark } from "@/components/student/charts";
import { CAMPUS, CATEGORY, CATEGORY_ORDER, directionsUrl, distanceM, footprintFor, googleMapsUrl, loadCampusOutline, loadPlaces, matchVenue, searchPlaces, walkLabel, type Place, type PlaceCategory } from "@/lib/student/campus";
import type { MapEngine, MapViewHandle } from "./map-view";
import { useLiveLocation } from "@/hooks/use-live-location";
import { cn } from "@/lib/utils";

function PlaceDetail({ place, me, onClose, className }: { place: Place; me: [number, number] | null; onClose: () => void; className?: string }) {
  const c = CATEGORY[place.category];
  const dist = me ? distanceM(me, place.coordinates) : null;
  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden", className)}>
      {place.photo ? (
        <div className="relative h-36 bg-gray-100 dark:bg-gray-800">
          <Image src={place.photo} alt={place.name} fill unoptimized className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          {place.photoCredit && (
            <span className="absolute left-2.5 bottom-2 max-w-[90%] truncate text-[10px] font-medium text-white/90">
              Photo: {place.photoCredit.author}
              {place.photoCredit.license && (
                <>
                  {" · "}
                  {place.photoCredit.source ? (
                    <a href={place.photoCredit.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                      {place.photoCredit.license}
                    </a>
                  ) : (
                    place.photoCredit.license
                  )}
                </>
              )}
            </span>
          )}
        </div>
      ) : (
        // No photo yet: a tinted header in the category colour rather than an empty grey box
        <div className="relative h-16 overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.color}26, ${c.color}0d)` }}>
          <c.icon aria-hidden className="absolute -right-3 -bottom-4 w-20 h-20 opacity-15" style={{ color: c.color }} />
        </div>
      )}
      <div className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${c.color}1a`, color: c.color }}>
            <c.icon className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 leading-snug">{place.name}</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              {c.label}
              {(() => {
                // Show the first alias that adds information (not already part of the name)
                const extra = place.aliases?.find((a) => !place.name.toLowerCase().includes(a.toLowerCase()));
                return extra ? ` · also "${extra}"` : "";
              })()}
            </p>
            {dist !== null && <p className="text-[12px] font-semibold text-[#003cbb] dark:text-[#4d82ff] mt-1">{walkLabel(dist)}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-1 -mt-1 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <a
          href={directionsUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full inline-flex items-center justify-center gap-2 h-12 rounded-[12px] text-[14px] font-medium bg-[#003cbb] hover:bg-[#002e8f] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8] text-white transition-all active:scale-[0.98]"
        >
          <Navigation className="w-4 h-4" />
          Get walking directions
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
        <a
          href={googleMapsUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 w-full inline-flex items-center justify-center gap-2 h-11 rounded-[12px] text-[13px] font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
        >
          <Images className="w-4 h-4" />
          Photos and Street View on Google Maps
        </a>
      </div>
    </div>
  );
}

interface MapPick {
  lngLat: [number, number];
  buildingId: string | null;
  named: Place | null;
}

/** /campus-map?mapping=1: click a building to get a ready-to-paste places.geojson entry. */
function MappingCard({ pick, onClose, stats }: { pick: MapPick | null; onClose: () => void; stats: { buildings: number; places: number } }) {
  const [copied, setCopied] = useState(false);
  const [lng, lat] = pick?.lngLat ?? [0, 0];
  const snippet = pick
    ? JSON.stringify(
        {
          type: "Feature",
          id: "new-place-id",
          geometry: { type: "Point", coordinates: [Number(lng.toFixed(7)), Number(lat.toFixed(7))] },
          properties: { id: "new-place-id", name: "Place name", category: "academic", aliases: [] },
        },
        null,
        1,
      )
    : "";
  return (
    <div className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-4 w-full md:w-[340px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="inline-flex items-center gap-2 text-[13px] font-bold text-gray-900 dark:text-gray-100">
          <PenLine className="w-4 h-4 text-[#003cbb] dark:text-[#4d82ff]" />
          Mapping mode
        </p>
        <button type="button" onClick={onClose} aria-label="Clear selection" className="w-8 h-8 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
        {stats.places} named places · {stats.buildings} building outlines. Click any building or spot to get an entry for <code className="font-mono">public/campus/places.geojson</code>.
      </p>
      {pick && (
        <div className="mt-3">
          <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200">
            {pick.named ? `Already mapped: ${pick.named.name}` : pick.buildingId ? `Unnamed building (OSM ${pick.buildingId})` : "Open ground"}
          </p>
          <p className="text-[11px] font-mono text-gray-500 mt-0.5">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
          {!pick.named && (
            <>
              <pre className="mt-2 max-h-40 overflow-auto rounded-[10px] bg-gray-50 dark:bg-gray-800 p-2.5 text-[10.5px] leading-snug text-gray-700 dark:text-gray-300">{snippet}</pre>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(snippet);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    toast.error("Couldn't copy. Select the text and copy it manually.");
                  }
                }}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 h-10 rounded-[10px] text-[13px] font-semibold bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff]"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy as a place"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchBox({ value, onChange, onFocus, className }: { value: string; onChange: (v: string) => void; onFocus?: () => void; className?: string }) {
  return (
    <label className={cn("flex items-center gap-2.5 h-12 px-4 rounded-[14px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800", className)}>
      <Search className="w-[18px] h-[18px] text-gray-400 shrink-0" />
      <span className="sr-only">Search campus</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Search a hall, office or venue"
        className="flex-1 min-w-0 bg-transparent text-[15px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none"
        enterKeyHint="search"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="w-7 h-7 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X className="w-4 h-4" />
        </button>
      )}
    </label>
  );
}

/** `floating`: the chips sit over the map (phones) and keep a shadow for contrast; in the side panel they are flat. */
function CategoryChips({ value, onChange, counts, className, floating = false }: { value: PlaceCategory | null; onChange: (c: PlaceCategory | null) => void; counts: Partial<Record<PlaceCategory, number>>; className?: string; floating?: boolean }) {
  return (
    <div className={cn("flex gap-2", className)}>
      {CATEGORY_ORDER.filter((c) => counts[c]).map((c) => {
        const meta = CATEGORY[c];
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : c)}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap border shrink-0 transition-colors",
              floating && "shadow-sm",
              active ? "text-white border-transparent" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
            style={active ? { background: meta.color } : undefined}
          >
            <meta.icon className="w-4 h-4" style={active ? undefined : { color: meta.color }} />
            {meta.chip}
          </button>
        );
      })}
    </div>
  );
}

function ResultRow({ place, onClick, me }: { place: Place; onClick: () => void; me: [number, number] | null }) {
  const c = CATEGORY[place.category];
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-gray-50 dark:hover:bg-gray-800/70 text-left transition-colors">
      <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${c.color}1a`, color: c.color }}>
        <c.icon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate">{place.name}</span>
        <span className="block text-[12px] text-gray-500 dark:text-gray-400 truncate">{me ? walkLabel(distanceM(me, place.coordinates)) : c.label}</span>
      </span>
    </button>
  );
}

const mapLoading = () => <div className="h-full w-full bg-[#eef0f3] dark:bg-gray-900 animate-pulse" />;
const GlMapView = dynamic(() => import("./gl-map-view"), { ssr: false, loading: mapLoading });
const LiteMapView = dynamic(() => import("./lite-map-view"), { ssr: false, loading: mapLoading });
// Three.js is large: the 3D view only downloads when a student switches to it
const Campus3DView = dynamic(() => import("./campus-3d-view"), { ssr: false, loading: mapLoading });

type MapViewMode = "map" | "3d";
const VIEW_KEY = "pulse-campus-view";

/** Map / 3D segmented control (desktop) */
function ViewSwitch({ value, onChange }: { value: MapViewMode; onChange: (v: MapViewMode) => void }) {
  const opts: { id: MapViewMode; label: string; icon: typeof MapIcon }[] = [
    { id: "map", label: "Map", icon: MapIcon },
    { id: "3d", label: "3D", icon: Box },
  ];
  return (
    <div role="radiogroup" aria-label="Campus view" className="flex p-1 rounded-full bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 shadow-md backdrop-blur">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-8 px-3.5 rounded-full inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors",
            value === o.id ? "bg-[#003cbb] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
          )}
        >
          <o.icon className="w-4 h-4" />
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** If the WebGL map fails to start (driver or context errors), fall back to the lite map instead of a blank screen. */
class GlFallback extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("WebGL campus map failed; switching to the lite map.", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function CampusMap({ initialQuery, mapping: mappingRequested = false, engine = "gl", initialView }: { initialQuery?: string | null; mapping?: boolean; engine?: MapEngine; initialView?: MapViewMode | null }) {
  // Mapping mode (IT office tool) is only offered on the WebGL map; the lite map is display-only.
  const mapping = mappingRequested && engine === "gl";
  const mapRef = useRef<MapViewHandle | null>(null);
  const dark = useIsDark();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  // Live location: the dot moves as the student walks; "follow" keeps the map centred on them
  const location = useLiveLocation();
  const me = location.fix?.coords ?? null;
  const [follow, setFollow] = useState(false);
  const [searching, setSearching] = useState(false);
  const [outline, setOutline] = useState<FeatureCollection | null>(null);
  const [pick, setPick] = useState<MapPick | null>(null);

  // 2D map or 3D campus. 3D needs WebGL, so the lite engine never offers it; mapping stays 2D.
  const can3d = engine === "gl" && !mapping;
  const [view, setViewState] = useState<MapViewMode>(() => {
    if (initialView) return initialView;
    try {
      return localStorage.getItem(VIEW_KEY) === "3d" ? "3d" : "map";
    } catch {
      return "map";
    }
  });
  const mode: MapViewMode = can3d ? view : "map";
  const setView = (v: MapViewMode) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
    // Keep the selected place in view after the switch
    if (selected) setTimeout(() => mapRef.current?.flyTo(selected.coordinates, 17.5), 400);
  };

  useEffect(() => {
    loadPlaces()
      .then(setPlaces)
      .catch(() => toast.error("Couldn't load campus places. Check your connection."));
    loadCampusOutline().then(setOutline);
  }, []);

  const selectedFootprint = useMemo(() => (selected ? footprintFor(outline, selected) : null), [selected, outline]);
  const buildingCount = useMemo(() => outline?.features.filter((f) => f.properties?.kind === "building").length ?? 0, [outline]);

  const flyTo = useCallback((p: Place) => {
    setFollow(false); // looking at a place: stop pulling the map back to the student
    setSelected(p);
    setSearching(false);
    const m = mapRef.current;
    m?.flyTo(p.coordinates, Math.max(17, m.getZoom()), typeof window !== "undefined" && window.innerWidth < 768 ? 220 : 0);
  }, []);

  // Deep link: /campus-map?q=Amphitheatre (venue changes, next class)
  const handledQuery = useRef(false);
  useEffect(() => {
    if (!places || !initialQuery || handledQuery.current) return;
    handledQuery.current = true;
    const hit = matchVenue(places, initialQuery);
    if (hit) setTimeout(() => flyTo(hit), 400);
    else toast.message(`"${initialQuery}" isn't on the map yet`, { description: "The IT office is adding venues. Try searching the building name." });
  }, [places, initialQuery, flyTo]);

  // On phones the place card takes the bottom of the screen; the floating AI
  // assistant button steps aside while it's open (see globals.css).
  useEffect(() => {
    const root = document.documentElement;
    if (selected) root.setAttribute("data-map-sheet", "");
    else root.removeAttribute("data-map-sheet");
    return () => root.removeAttribute("data-map-sheet");
  }, [selected]);

  const counts = useMemo(() => {
    const out: Partial<Record<PlaceCategory, number>> = {};
    places?.forEach((p) => (out[p.category] = (out[p.category] ?? 0) + 1));
    return out;
  }, [places]);

  const results = useMemo(() => {
    if (!places) return [];
    const base = category ? places.filter((p) => p.category === category) : places;
    return searchPlaces(base, query);
  }, [places, category, query]);

  // Stable between renders, so the map views can skip work when only the location dot moves
  const visible = useMemo(() => new Set(results.map((r) => r.id)), [results]);
  const stopFollowing = useCallback(() => setFollow(false), []);
  const onBackground = useCallback(
    (lngLat: [number, number], buildingId: string | null) => {
      setSelected(null);
      setSearching(false);
      if (mapping) {
        const named = buildingId && places ? (places.find((pl) => footprintFor(outline, pl) === buildingId) ?? null) : null;
        setPick({ lngLat, buildingId, named });
      }
    },
    [mapping, places, outline],
  );

  // React to each reading: frame the first one, then keep up while following
  const firstFix = useRef(true);
  useEffect(() => {
    const fix = location.fix;
    if (!fix) {
      firstFix.current = true;
      return;
    }
    const m = mapRef.current;
    if (firstFix.current) {
      firstFix.current = false;
      if (distanceM(fix.coords, CAMPUS.center) > 3000) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- off campus: nothing to follow on this map
        setFollow(false);
        toast.message("You're off campus", { description: "Your location keeps updating, and distances are shown from where you are." });
        return;
      }
      m?.flyTo(fix.coords, Math.max(17, m.getZoom()));
      return;
    }
    if (follow) m?.flyTo(fix.coords, m.getZoom());
  }, [location.fix, follow]);

  useEffect(() => {
    if (location.status === "denied") toast.error("Allow location access to see where you are on campus.");
    if (location.status === "unavailable") toast.error("Your location isn't available right now. Try again outside or near a window.");
  }, [location.status]);

  /**
   * Locate button, like most map apps:
   * off → start tracking and follow · tracking → re-centre and follow · following → stop tracking
   */
  const locate = () => {
    if (location.status === "tracking" && follow) {
      location.stop();
      setFollow(false);
      return;
    }
    if (location.status === "tracking" && me) {
      setFollow(true);
      mapRef.current?.flyTo(me, Math.max(17, mapRef.current.getZoom()));
      return;
    }
    if (location.status === "locating") return;
    setFollow(true);
    location.start();
  };

  const resetView = () => {
    setSelected(null);
    mapRef.current?.fit();
  };

  return (
    <div className="relative h-full w-full flex">
      {/* Desktop panel */}
      <aside className="hidden md:flex w-[360px] lg:w-[380px] shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 bg-[#F4F5F7] dark:bg-black">
        <div className="p-5 pb-3">
          <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{CAMPUS.address}</p>
          <h2 className="text-[20px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">{CAMPUS.name}</h2>
          <SearchBox value={query} onChange={setQuery} className="mt-4" />
          <CategoryChips value={category} onChange={setCategory} counts={counts} className="flex-wrap mt-3" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {selected ? (
            <div className="px-2 pt-1">
              <button type="button" onClick={() => setSelected(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#003cbb] dark:text-[#4d82ff] mb-3">
                <ArrowLeft className="w-4 h-4" />
                All places
              </button>
              <PlaceDetail place={selected} me={me} onClose={() => setSelected(null)} />
            </div>
          ) : !places ? (
            Array.from({ length: 8 }, (_, i) => <div key={i} className="h-12 mx-2 my-1.5 rounded-[14px] bg-white dark:bg-gray-900 animate-pulse" />)
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-[14px] text-gray-500 dark:text-gray-400">No places match. Try a building name, like &quot;Senate&quot; or &quot;Library&quot;.</p>
          ) : (
            <>
              <p className="px-3 pb-1 text-[12px] font-semibold text-gray-400">{results.length} places</p>
              {results.map((p) => (
                <ResultRow key={p.id} place={p} me={me} onClick={() => flyTo(p)} />
              ))}
            </>
          )}
        </div>
        <p className="px-5 py-3 text-[11px] text-gray-400 border-t border-gray-200 dark:border-gray-800">Positions from OpenStreetMap, verified by the IT office. Report a wrong pin through Support.</p>
      </aside>

      {/* Map */}
      <div className="relative flex-1 min-w-0">
        {(() => {
          const viewProps = {
            handleRef: mapRef,
            places,
            outline,
            dark,
            selectedId: selected?.id ?? null,
            visibleIds: visible,
            me,
            meAccuracy: location.fix?.accuracy ?? null,
            meHeading: location.fix?.heading ?? null,
            onUserMove: stopFollowing,
            highlightBuildingId: selectedFootprint ?? pick?.buildingId ?? null,
            mapping,
            onPin: flyTo,
            onBackground,
          };
          const lite = <LiteMapView {...viewProps} />;
          if (mode === "3d")
            return (
              <GlFallback fallback={<GlMapView {...viewProps} />}>
                <Campus3DView {...viewProps} />
              </GlFallback>
            );
          return engine === "lite" ? (
            lite
          ) : (
            <GlFallback fallback={lite}>
              <GlMapView {...viewProps} />
            </GlFallback>
          );
        })()}

        {/* Desktop: Map / 3D switch */}
        {can3d && (
          <div className="hidden md:flex absolute z-30 left-4 top-4">
            <ViewSwitch value={mode} onChange={setView} />
          </div>
        )}

        {/* Phone: floating search + chips */}
        <div className="md:hidden absolute top-0 inset-x-0 p-3 flex flex-col gap-2 pointer-events-none z-30">
          <div className="pointer-events-auto shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-[14px]">
            <SearchBox value={query} onChange={(v) => { setQuery(v); setSearching(true); }} onFocus={() => setSearching(true)} />
          </div>
          {searching && query ? (
            <div className="pointer-events-auto max-h-[45dvh] overflow-y-auto rounded-[16px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {results.length === 0 ? <p className="px-3 py-4 text-[14px] text-gray-500">No places match.</p> : results.slice(0, 12).map((p) => <ResultRow key={p.id} place={p} me={me} onClick={() => flyTo(p)} />)}
            </div>
          ) : (
            <CategoryChips floating value={category} onChange={setCategory} counts={counts} className="pointer-events-auto overflow-x-auto no-scrollbar -mx-3 px-3 pb-1" />
          )}
        </div>

        {/* Controls (phones: above the AI assistant button, which steps aside while a card is open) */}
        <div className={cn("absolute z-30 right-3 md:right-4 md:top-4 md:bottom-auto flex flex-col gap-2 transition-[bottom] duration-300", selected ? "bottom-[calc(16px+var(--sheet,0px))]" : "bottom-[180px] md:bottom-4")} style={{ ["--sheet" as string]: selected ? (selected.photo ? "330px" : "200px") : "0px" }}>
          <button
            type="button"
            onClick={locate}
            aria-pressed={location.status === "tracking"}
            aria-label={location.status === "tracking" ? (follow ? "Stop sharing my location" : "Centre on me") : "Show my location"}
            title={location.status === "tracking" ? (follow ? "Following you. Tap to stop." : "Centre on me") : "Show my location"}
            className={cn(
              "w-11 h-11 rounded-full border shadow-md inline-flex items-center justify-center transition-colors",
              location.status === "tracking" && follow
                ? "bg-[#2563eb] border-[#2563eb] text-white"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800",
              location.status === "tracking" && !follow ? "text-[#2563eb] dark:text-[#4d82ff]" : location.status !== "tracking" && "text-gray-700 dark:text-gray-200",
            )}
          >
            {location.status === "tracking" && follow ? (
              <Navigation className="w-5 h-5 fill-current" />
            ) : (
              <LocateFixed className={cn("w-5 h-5", location.status === "locating" && "animate-pulse text-[#2563eb]")} />
            )}
          </button>
          {can3d && (
            <button
              type="button"
              onClick={() => setView(mode === "3d" ? "map" : "3d")}
              aria-label={mode === "3d" ? "Switch to the map" : "Switch to the 3D campus"}
              className="md:hidden w-11 h-11 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md inline-flex items-center justify-center text-[13px] font-bold text-[#003cbb] dark:text-[#4d82ff]"
            >
              {mode === "3d" ? <MapIcon className="w-5 h-5" /> : "3D"}
            </button>
          )}
          <button type="button" onClick={resetView} aria-label="Show the whole campus" className="w-11 h-11 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md inline-flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Crosshair className="w-5 h-5" />
          </button>
        </div>

        {mapping && (
          <div className="absolute z-30 left-3 right-3 bottom-3 md:left-auto md:right-20 md:bottom-6">
            <MappingCard pick={pick} onClose={() => setPick(null)} stats={{ buildings: buildingCount, places: places?.length ?? 0 }} />
          </div>
        )}

        {/* Phone: place card */}
        <AnimatePresence>
          {selected && (
            <motion.div key={selected.id} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 32 }} className="md:hidden absolute z-30 inset-x-3 bottom-3">
              <PlaceDetail place={selected} me={me} onClose={() => setSelected(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {!places && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-gray-900/90 text-[13px] font-semibold text-gray-600 dark:text-gray-300 shadow">
              <MapPin className="w-4 h-4 animate-bounce" />
              Loading campus…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
