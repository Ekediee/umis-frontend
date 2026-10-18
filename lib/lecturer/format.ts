/**
 * Plain-language formatting for the lecturer app (design principle 4:
 * "Semester 1, 2026/2027", not "2026/2027.1"; no internal IDs on screen).
 */

import type { Semester } from "./types";

const TERM_LABELS: Record<string, string> = {
  "1": "Semester 1",
  "2": "Semester 2",
  "3": "Summer semester",
  M: "Medical year",
};

/** "1P" → "Semester 1 · Postgraduate", "2T" → "Semester 2 (T)". Full naming is parked (open question). */
export function termLabel(term: string): string {
  if (TERM_LABELS[term]) return TERM_LABELS[term];
  const match = /^(\d)([A-Z])$/.exec(term);
  if (match) {
    const base = TERM_LABELS[match[1]] ?? `Semester ${match[1]}`;
    if (match[2] === "P") return `${base} · Postgraduate`;
    return `${base} (${match[2]})`;
  }
  return `Term ${term}`;
}

/** Accepts a Semester or a raw BU Pulse code like "2026/2027.1". */
export function formatSemester(input: Semester | string): string {
  const code = typeof input === "string" ? input : input.code;
  const dot = code.lastIndexOf(".");
  if (dot === -1) return code;
  const session = code.slice(0, dot).trim();
  const term = code.slice(dot + 1).trim();
  return `${termLabel(term)}, ${session}`;
}

/**
 * Pick the default semester when several are active (M, 1T, 1P, 1 … in the audit):
 * the one with the lecturer's current classes, else the first active one.
 */
export function defaultSemester(semesters: Semester[]): Semester | undefined {
  return (
    semesters.find((s) => s.active && s.hasMyClasses) ??
    semesters.find((s) => s.active) ??
    semesters[0]
  );
}

// ── Dates ────────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function toDate(d: string | Date) {
  return typeof d === "string" ? new Date(d) : d;
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysBetween(from: string | Date, to: string | Date) {
  return Math.round((startOfDay(toDate(to)).getTime() - startOfDay(toDate(from)).getTime()) / DAY_MS);
}

/**
 * Local calendar date as YYYY-MM-DD. Never use toISOString() for this: it
 * converts to UTC, so local midnight in Lagos (UTC+1) becomes the previous day.
 */
export function localDate(d: string | Date) {
  const x = toDate(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

/** "14 Oct" */
export function shortDate(d: string | Date) {
  return toDate(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "Tue 6 Oct" */
export function dayDate(d: string | Date) {
  return toDate(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** "2:00 pm" from "14:00" */
export function clock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "2:00 to 3:00 pm" — drops the first suffix when both share it. */
export function timeRange(start: string, end: string) {
  const a = clock(start);
  const b = clock(end);
  if (a.slice(-2) === b.slice(-2)) return `${a.slice(0, -3)} to ${b}`;
  return `${a} to ${b}`;
}

/** "in 11 days", "tomorrow", "today", "2 days ago" */
export function relativeDays(target: string | Date, now: Date) {
  const diff = daysBetween(now, target);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 1) return `in ${diff} days`;
  return `${-diff} days ago`;
}

/** "Updated 2 h ago", "just now" */
export function timeAgo(at: string | Date | number, now: Date) {
  const ms = now.getTime() - (typeof at === "number" ? at : toDate(at).getTime());
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** 24h "HH:mm" from a Date */
export function hhmm(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Monday-based ISO weekday, 1–7 */
export function isoDay(d: Date) {
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

export function minutes(hhmmStr: string) {
  const [h, m] = hhmmStr.split(":").map(Number);
  return h * 60 + m;
}

// ── People ───────────────────────────────────────────────────────────────────

export function initials(first: string, last?: string) {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? first?.trim()?.split(/\s+/)[1]?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function fullName(p: { firstName: string; lastName: string }) {
  return `${p.firstName} ${p.lastName}`;
}

/** "A" → "Group A"; long BU Pulse options ("DE Software") stay as they are. */
export function groupName(label: string) {
  return label.length <= 2 ? `Group ${label}` : label;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Support reference code shown on every error (quality bar). */
export function supportRef(screen: string, seed = Date.now()) {
  return `${screen.toUpperCase()}-${String(seed % 10_000).padStart(4, "0")}`;
}
