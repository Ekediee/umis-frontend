"use client";

/**
 * Tiny stale-while-revalidate data layer for the lecturer app.
 *
 * - Shows cached data instantly with "Updated 2 h ago" while refreshing (1.2a).
 * - `invalidate(prefix)` after a mutation refetches every mounted query with
 *   that key prefix, so lists, counts and Today cards stay in sync.
 *
 * Deliberately dependency-free; swap for TanStack Query if the app outgrows it.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { ApiError } from "./api/http";

interface Entry {
  data: unknown;
  at: number;
}

const cache = new Map<string, Entry>();
const listeners = new Set<(key: string) => void>();
const STORAGE_PREFIX = "pulse-lecturer:q:";

function readPersisted(key: string): Entry | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as Entry) : undefined;
  } catch {
    return undefined;
  }
}

function persist(key: string, entry: Entry) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // quota or private mode — cache stays in memory only
  }
}

export function invalidate(prefix = "") {
  for (const key of [...cache.keys()]) if (key.startsWith(prefix)) cache.delete(key);
  listeners.forEach((l) => l(prefix));
}

export interface QueryState<T> {
  data: T | undefined;
  error: ApiError | null;
  isLoading: boolean; // no data yet
  isRefreshing: boolean; // has data, fetching newer
  updatedAt: number | null;
  refetch: () => void;
  /** Optimistically edit cached data (mutations call invalidate after). */
  setData: (updater: (prev: T) => T) => void;
}

export function useLecturerQuery<T>(key: string | null, fetcher: () => Promise<T>, opts: { persist?: boolean } = {}): QueryState<T> {
  // Only the in-memory cache is read during render: sessionStorage is read after
  // mount so server HTML and the first client render always match (hydration).
  const initial = key ? cache.get(key) : undefined;
  const [data, setDataState] = useState<T | undefined>(initial?.data as T | undefined);
  const [updatedAt, setUpdatedAt] = useState<number | null>(initial?.at ?? null);
  const [error, setError] = useState<ApiError | null>(null);
  const [fetching, setFetching] = useState(false);
  const [prevKey, setPrevKey] = useState(key);
  const fetcherRef = useRef(fetcher);
  const generation = useRef(0);

  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });

  // Key changed (e.g. another semester or group): show that key's cache at once.
  if (key !== prevKey) {
    setPrevKey(key);
    setDataState(initial?.data as T | undefined);
    setUpdatedAt(initial?.at ?? null);
    setError(null);
  }

  const run = useCallback(() => {
    if (!key) return;
    if (!cache.has(key) && opts.persist) {
      const saved = readPersisted(key);
      if (saved) {
        cache.set(key, saved);
        setDataState(saved.data as T);
        setUpdatedAt(saved.at);
      }
    }
    const gen = ++generation.current;
    setFetching(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (gen !== generation.current) return;
        const entry = { data: result, at: Date.now() };
        cache.set(key, entry);
        if (opts.persist) persist(key, entry);
        setDataState(result);
        setUpdatedAt(entry.at);
      })
      .catch((e: unknown) => {
        if (gen !== generation.current) return;
        setError(e instanceof ApiError ? e : new ApiError(String((e as Error)?.message ?? e), "UI-0001"));
      })
      .finally(() => gen === generation.current && setFetching(false));
  }, [key, opts.persist]);

  useEffect(() => {
    if (!key) return;
    // Starting a request is synchronising with an external system (the API);
    // `run` flips the pending flag before the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run();
    const listener = (prefix: string) => key.startsWith(prefix) && run();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [key, run]);

  const setData = useCallback(
    (updater: (prev: T) => T) => {
      setDataState((prev) => {
        if (prev === undefined) return prev;
        const next = updater(prev);
        if (key) cache.set(key, { data: next, at: Date.now() });
        return next;
      });
    },
    [key],
  );

  return { data, error, isLoading: data === undefined && !error, isRefreshing: fetching && data !== undefined, updatedAt, refetch: run, setData };
}

/** Run a write with pending + error state; invalidates keys on success. */
export function useMutation<A extends unknown[], T>(fn: (...args: A) => Promise<T>, opts: { invalidates?: string[] } = {}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  });
  const invalidates = opts.invalidates?.join("|");

  const mutate = useCallback(
    async (...args: A): Promise<T | undefined> => {
      setPending(true);
      setError(null);
      try {
        const result = await fnRef.current(...args);
        invalidates?.split("|").forEach((p) => invalidate(p));
        return result;
      } catch (e) {
        const err = e instanceof ApiError ? e : new ApiError(String((e as Error)?.message ?? e), "UI-0002");
        setError(err);
        throw err;
      } finally {
        setPending(false);
      }
    },
    [invalidates],
  );

  return { mutate, pending, error };
}

// ── Online status (1.2d) ────────────────────────────────────────────────────

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

/** Ticks every `ms` so relative times ("2 min ago") stay fresh. */
export function useNow(ms = 30_000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
