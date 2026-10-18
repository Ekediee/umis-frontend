import { API_MODE } from "./api/http";

/**
 * The app's notion of "now". In mock mode it is pinned to the demo week
 * (Wed 7 Oct 2026, 09:12 — Semester 1, week 6) so dummy deadlines, "next
 * class" and "waiting 6 days" stay meaningful. Live mode uses the real clock.
 */
export const DEMO_NOW = new Date(2026, 9, 7, 9, 12);

export function appNow(): Date {
  return API_MODE === "mock" ? new Date(DEMO_NOW) : new Date();
}
