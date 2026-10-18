"use client";

/**
 * Live location for the campus map. Wraps `navigator.geolocation.watchPosition`
 * so the "you are here" dot moves as the student walks.
 *
 * - Readings much worse than the last good one (e.g. a cell-tower fix after GPS)
 *   are skipped, so the dot doesn't jump across campus and back.
 * - Heading comes from the device when it reports one while moving, otherwise
 *   from the direction between the last two readings (once you've moved a few metres).
 * - Tracking stops when the map unmounts; nothing runs in the background.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { bearingDeg, distanceM } from "@/lib/student/campus";

export interface LocationFix {
  /** [lng, lat] */
  coords: [number, number];
  /** Metres (68% confidence radius) */
  accuracy: number;
  /** Degrees clockwise from north while moving; null when standing still or unknown */
  heading: number | null;
  at: number;
}

export type LocationStatus = "off" | "locating" | "tracking" | "denied" | "unavailable";

/** A reading this much less precise than the current one is ignored (unless the current one is stale) */
const WORSE_FACTOR = 3;
const STALE_MS = 20_000;
const MIN_MOVE_FOR_HEADING_M = 4;

export function shouldAccept(prev: LocationFix | null, next: LocationFix) {
  if (!prev) return true;
  if (next.at - prev.at > STALE_MS) return true;
  return next.accuracy <= Math.max(prev.accuracy * WORSE_FACTOR, 30);
}

/**
 * Phones can report several readings a second. The map only needs about one: more just
 * re-renders it for a dot that moved a few centimetres. A reading is passed on when a
 * second has passed, the student has really moved, or the accuracy changed a lot.
 */
const MIN_INTERVAL_MS = 1000;
const MIN_MOVE_M = 3;

export function isWorthShowing(prev: LocationFix | null, next: LocationFix) {
  if (!prev) return true;
  if (next.at - prev.at >= MIN_INTERVAL_MS) return true;
  if (distanceM(prev.coords, next.coords) >= MIN_MOVE_M) return true;
  return next.accuracy < prev.accuracy / 2;
}

export function headingFor(prev: LocationFix | null, coords: [number, number], deviceHeading: number | null, speed: number | null): number | null {
  if (deviceHeading != null && !Number.isNaN(deviceHeading) && (speed ?? 0) > 0.5) return deviceHeading;
  if (prev && distanceM(prev.coords, coords) >= MIN_MOVE_FOR_HEADING_M) return bearingDeg(prev.coords, coords);
  return prev?.heading ?? null;
}

export function useLiveLocation() {
  const [fix, setFix] = useState<LocationFix | null>(null);
  const [status, setStatus] = useState<LocationStatus>("off");
  const watchId = useRef<number | null>(null);
  const last = useRef<LocationFix | null>(null);

  const stop = useCallback(() => {
    if (watchId.current != null) navigator.geolocation?.clearWatch(watchId.current);
    watchId.current = null;
    last.current = null;
    setFix(null);
    setStatus("off");
  }, []);

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    if (watchId.current != null) return;
    setStatus("locating");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        const next: LocationFix = {
          coords,
          accuracy: pos.coords.accuracy,
          heading: headingFor(last.current, coords, pos.coords.heading, pos.coords.speed),
          at: pos.timestamp || Date.now(),
        };
        if (!shouldAccept(last.current, next) || !isWorthShowing(last.current, next)) return;
        last.current = next;
        setFix(next);
        setStatus("tracking");
      },
      (err) => {
        if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
  }, []);

  useEffect(
    () => () => {
      if (watchId.current != null) navigator.geolocation?.clearWatch(watchId.current);
    },
    [],
  );

  return { fix, status, start, stop };
}
