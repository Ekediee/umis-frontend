"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { lecturerApi } from "@/lib/lecturer/api";
import { defaultSemester } from "@/lib/lecturer/format";
import { useLecturerQuery } from "@/lib/lecturer/query";
import type { Lecturer, LecturerRole, NotificationPrefs, Semester } from "@/lib/lecturer/types";

interface LecturerContextValue {
  lecturer: Lecturer | undefined;
  prefs: NotificationPrefs | undefined;
  semesters: Semester[];
  semester: Semester | undefined;
  setSemester: (code: string) => void;
  hasRole: (role: LecturerRole) => boolean;
  displayName: string;
  refresh: () => void;
}

const LecturerContext = createContext<LecturerContextValue | null>(null);
const SEMESTER_KEY = "pulse-lecturer:semester";
const semesterListeners = new Set<() => void>();
let memorySemester: string | null = null;

function subscribeSemester(cb: () => void) {
  semesterListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    semesterListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function readSemester() {
  try {
    return localStorage.getItem(SEMESTER_KEY) ?? memorySemester;
  } catch {
    return memorySemester;
  }
}

export function LecturerProvider({ children }: { children: ReactNode }) {
  const session = useLecturerQuery("session", () => lecturerApi.getSession(), { persist: true });
  const semesters = useLecturerQuery("semesters", () => lecturerApi.getSemesters(), { persist: true });
  const chosen = useSyncExternalStore(subscribeSemester, readSemester, () => null);

  const setSemester = useCallback((code: string) => {
    try {
      localStorage.setItem(SEMESTER_KEY, code);
    } catch {
      // storage blocked — the choice lasts until reload
      memorySemester = code;
    }
    semesterListeners.forEach((l) => l());
  }, []);

  const value = useMemo<LecturerContextValue>(() => {
    const list = semesters.data ?? [];
    const semester = list.find((s) => s.code === chosen) ?? defaultSemester(list);
    const l = session.data?.lecturer;
    return {
      lecturer: l,
      prefs: session.data?.prefs,
      semesters: list,
      semester,
      setSemester,
      hasRole: (role) => !!l?.roles.includes(role),
      displayName: l ? `${l.title} ${l.firstName} ${l.lastName}` : "",
      refresh: session.refetch,
    };
  }, [semesters.data, chosen, session.data, session.refetch, setSemester]);

  return <LecturerContext.Provider value={value}>{children}</LecturerContext.Provider>;
}

export function useLecturer() {
  const ctx = useContext(LecturerContext);
  if (!ctx) throw new Error("useLecturer must be used inside <LecturerProvider>");
  return ctx;
}
