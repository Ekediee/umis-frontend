/**
 * Mock store for the student features. Seeded content is generated on demand;
 * only what the student changes (questions, votes, check-ins, study sessions,
 * settings) is persisted to localStorage, so the demo survives a reload.
 */

import { DEFAULT_NOTIFICATION_PREFS } from "../rules";
import type { AttendanceMark, CourseQuestion, NotificationPrefs, StudySession } from "../types";

const KEY = "pulse-student:mock:v1";

export interface MockState {
  questions: Record<string, CourseQuestion[]>;
  readPosts: string[];
  checkins: Record<string, { date: string; mark: AttendanceMark; sessionId: string }[]>;
  sessions: StudySession[];
  prefs: NotificationPrefs;
  visibleToClassmates: Record<string, boolean>;
  liveClass: { day: string; startsAt: string; endsAt: string } | null;
  seededSessions: boolean;
}

const empty = (): MockState => ({
  questions: {},
  readPosts: [],
  checkins: {},
  sessions: [],
  prefs: DEFAULT_NOTIFICATION_PREFS,
  visibleToClassmates: {},
  liveClass: null,
  seededSessions: false,
});

let memory: MockState | null = null;

export function db(): MockState {
  if (memory) return memory;
  memory = empty();
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw) memory = { ...empty(), ...(JSON.parse(raw) as Partial<MockState>) };
  } catch {
    // private mode or corrupt JSON: start fresh in memory
  }
  return memory;
}

export function save() {
  try {
    if (memory && typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // quota or blocked storage: keep working in memory
  }
}

export function resetMockStore() {
  memory = empty();
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Simulated network latency so loading states are exercised in the demo. */
export const latency = (ms = 220) => new Promise<void>((r) => setTimeout(r, ms + Math.random() * 180));
