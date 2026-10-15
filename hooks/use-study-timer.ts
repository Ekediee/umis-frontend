import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Longest a single session can count, so a forgotten timer doesn't log a whole night. */
export const MAX_SESSION_MIN = 180;
/** Sessions shorter than this aren't logged (an accidental tap). */
export const MIN_SESSION_MIN = 1;

export interface RunningTimer {
  courseId: string;
  startedAt: number;
  /** Planned length in minutes (25 or 50), or null for an open-ended session */
  targetMin: number | null;
}

interface StudyTimerState {
  running: RunningTimer | null;
  start: (courseId: string, targetMin: number | null) => void;
  /** Stops the timer and returns the minutes to log (capped), or null when too short. */
  stop: () => { courseId: string; startedAt: string; minutes: number } | null;
  cancel: () => void;
}

/**
 * The "Start studying" timer behind hours-logged. It lives in localStorage so
 * it keeps running across pages and reloads; the minutes are only sent to the
 * API when the student stops it.
 */
export const useStudyTimer = create<StudyTimerState>()(
  persist(
    (set, get) => ({
      running: null,
      start: (courseId, targetMin) => set({ running: { courseId, startedAt: Date.now(), targetMin } }),
      stop: () => {
        const r = get().running;
        set({ running: null });
        if (!r) return null;
        const minutes = Math.min(MAX_SESSION_MIN, Math.round((Date.now() - r.startedAt) / 60_000));
        if (minutes < MIN_SESSION_MIN) return null;
        return { courseId: r.courseId, startedAt: new Date(r.startedAt).toISOString(), minutes };
      },
      cancel: () => set({ running: null }),
    }),
    { name: "pulse-study-timer" },
  ),
);

export function elapsedLabel(startedAt: number, now: number) {
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
