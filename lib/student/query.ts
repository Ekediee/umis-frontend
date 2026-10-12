"use client";

/**
 * Stale-while-revalidate hook for the student features: cached data shows
 * instantly, a refresh runs in the background, and `invalidateStudent(prefix)`
 * after a write refetches every mounted query with that key prefix.
 * Same idea as lib/lecturer/query.ts, kept separate so each portal owns its cache.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ApiError } from "./api/http";

const cache = new Map<string, { data: unknown; at: number }>();
const listeners = new Set<(prefix: string) => void>();

export function invalidateStudent(prefix = "") {
  for (const key of [...cache.keys()]) if (key.startsWith(prefix)) cache.delete(key);
  listeners.forEach((l) => l(prefix));
}

export interface StudentQuery<T> {
  data: T | undefined;
  error: ApiError | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refetch: () => void;
  setData: (updater: (prev: T) => T) => void;
}

const toApiError = (e: unknown) => (e instanceof ApiError ? e : new ApiError((e as Error)?.message ?? "Something went wrong.", "UI-500"));

export function useStudentQuery<T>(key: string | null, fetcher: () => Promise<T>): StudentQuery<T> {
  const initial = key ? (cache.get(key)?.data as T | undefined) : undefined;
  const [data, setDataState] = useState<T | undefined>(initial);
  const [error, setError] = useState<ApiError | null>(null);
  const [isRefreshing, setRefreshing] = useState(false);
  const [prevKey, setPrevKey] = useState(key);
  const fetcherRef = useRef(fetcher);
  const run = useRef(0);

  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });

  // Key changed: show that key's cached data at once.
  if (key !== prevKey) {
    setPrevKey(key);
    setDataState(initial);
    setError(null);
  }

  const load = useCallback(() => {
    if (!key) return;
    const id = ++run.current;
    setRefreshing(true);
    fetcherRef
      .current()
      .then((d) => {
        if (id !== run.current) return;
        cache.set(key, { data: d, at: Date.now() });
        setDataState(d);
        setError(null);
      })
      .catch((e) => id === run.current && setError(toApiError(e)))
      .finally(() => id === run.current && setRefreshing(false));
  }, [key]);

  useEffect(() => {
    if (!key) return;
    // Starting a request synchronises with an external system (the API);
    // `load` flips the refreshing flag before the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const onInvalidate = (prefix: string) => key.startsWith(prefix) && load();
    listeners.add(onInvalidate);
    return () => {
      listeners.delete(onInvalidate);
    };
  }, [key, load]);

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

  return { data, error, isLoading: data === undefined && !error, isRefreshing: isRefreshing && data !== undefined, refetch: load, setData };
}
