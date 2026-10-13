/**
 * Business rules behind the phase-1 student features. Pure and unit tested:
 * the cards, warnings and suggestions are decided here, not in components and
 * not by AI (see "Automations that need no AI" in the requirements plan).
 */

import type { CourseAttendance, Deadline, NotificationCategory, NotificationPrefs, StudySession } from "./types";

/** Attendance below this puts a student at risk (the same 75% the lecturer portal flags). */
export const ATTENDANCE_THRESHOLD = 75;
/** Typical teaching weeks × 2 sessions; used to project how many misses are left. */
export const PLANNED_SESSIONS_PER_COURSE = 26;

// ── Attendance ────────────────────────────────────────────────────────────────

export function attendancePercent(a: Pick<CourseAttendance, "held" | "attended" | "late" | "excused">) {
  if (a.held <= 0) return 100;
  return Math.round(((a.attended + a.late + a.excused) / a.held) * 100);
}

export type AttendanceStanding = "good" | "watch" | "risk";

/** good ≥ 85, watch 75–84, risk < 75 */
export function attendanceStanding(percent: number, threshold = ATTENDANCE_THRESHOLD): AttendanceStanding {
  if (percent < threshold) return "risk";
  if (percent < threshold + 10) return "watch";
  return "good";
}

/**
 * How many classes in a row the student needs to attend to get back to the
 * threshold (0 when already there).
 *
 * Copy rule: attendance messages always point students toward attending
 * ("attend your next 2 classes"), never toward how many they could skip.
 */
export function classesToRecover(a: Pick<CourseAttendance, "held" | "attended" | "late" | "excused">, threshold = ATTENDANCE_THRESHOLD) {
  const counted = a.attended + a.late + a.excused;
  const t = threshold / 100;
  if (a.held <= 0 || counted / a.held >= t) return 0;
  return Math.ceil((t * a.held - counted) / (1 - t));
}

export function attendedLabel(a: Pick<CourseAttendance, "held" | "attended" | "late" | "excused">) {
  return `${a.attended + a.late + a.excused} of ${a.held} attended`;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Encouraging, action-first line for a course below the threshold. */
export function recoveryLine(a: Pick<CourseAttendance, "held" | "attended" | "late" | "excused">, threshold = ATTENDANCE_THRESHOLD) {
  const n = classesToRecover(a, threshold);
  return n > 0 ? `Attend your next ${plural(n, "class", "classes")} to get back above ${threshold}%.` : `You're back above ${threshold}%. Keep it going.`;
}

// ── Study time ────────────────────────────────────────────────────────────────

/** Monday 00:00 local time of the week containing `d`. */
export function weekStart(d: Date) {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (out.getDay() + 6) % 7; // Mon = 0
  out.setDate(out.getDate() - day);
  return out;
}

export function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function summarizeWeek(sessions: StudySession[], now: Date) {
  const start = weekStart(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const inWeek = sessions.filter((s) => {
    const t = new Date(s.startedAt);
    return t >= start && t < end;
  });
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = localDateKey(d);
    return { date: key, minutes: inWeek.filter((s) => localDateKey(new Date(s.startedAt)) === key).reduce((n, s) => n + s.minutes, 0) };
  });
  const courseMap = new Map<string, number>();
  inWeek.forEach((s) => courseMap.set(s.courseId, (courseMap.get(s.courseId) ?? 0) + s.minutes));
  const byCourse = [...courseMap.entries()].map(([courseId, minutes]) => ({ courseId, minutes })).sort((a, b) => b.minutes - a.minutes);
  return { weekStart: localDateKey(start), minutes: inWeek.reduce((n, s) => n + s.minutes, 0), byDay, byCourse };
}

/** Consecutive days, ending today or yesterday, with at least one logged session. */
export function studyStreak(sessions: StudySession[], now: Date) {
  const days = new Set(sessions.filter((s) => s.minutes > 0).map((s) => localDateKey(new Date(s.startedAt))));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ── Weekly suggestion ─────────────────────────────────────────────────────────

export interface Suggestion {
  tone: "risk" | "warning" | "info" | "good";
  text: string;
  href: string;
  action: string;
}

/**
 * One plain suggestion per week, most urgent first:
 * attendance below threshold → deadline in 48 h → attendance slipping →
 * no study logged → least-studied course → praise.
 */
export function weeklySuggestion(input: { attendance: CourseAttendance[]; deadlines: Deadline[]; minutesThisWeek: number; minutesByCourse: { courseId: string; minutes: number }[]; courses: string[]; now: Date }): Suggestion {
  const { attendance, deadlines, minutesThisWeek, minutesByCourse, courses, now } = input;

  const worst = [...attendance].filter((a) => a.held > 0).sort((a, b) => a.percent - b.percent)[0];
  if (worst && worst.percent < ATTENDANCE_THRESHOLD) {
    return {
      tone: "risk",
      text: `${worst.courseId} attendance is ${worst.percent}%. ${recoveryLine(worst)}`,
      href: "/attendance",
      action: "See attendance",
    };
  }

  const soon = deadlines
    .filter((d) => !d.submitted && new Date(d.dueAt).getTime() > now.getTime() && new Date(d.dueAt).getTime() - now.getTime() <= 48 * 3600_000)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  if (soon) {
    return { tone: "warning", text: `${soon.courseId} ${soon.title} is due ${relativeDue(soon.dueAt, now)}.`, href: `/courses/${encodeURIComponent(soon.courseId)}`, action: "Open course" };
  }

  if (worst && attendanceStanding(worst.percent) === "watch") {
    return { tone: "warning", text: `${worst.courseId} attendance is ${worst.percent}%. Keep showing up: every class you attend keeps you comfortably above ${ATTENDANCE_THRESHOLD}%.`, href: "/attendance", action: "See attendance" };
  }

  if (minutesThisWeek === 0) {
    return { tone: "info", text: "No study time logged this week yet. A 25-minute session today starts your streak.", href: "/insights?start=1", action: "Start studying" };
  }

  const studied = new Set(minutesByCourse.map((c) => c.courseId));
  const untouched = courses.find((c) => !studied.has(c));
  if (untouched) {
    return { tone: "info", text: `You haven't studied ${untouched} this week. Give it one session before the weekend.`, href: "/insights?start=1", action: "Start studying" };
  }

  return { tone: "good", text: `${formatMinutes(minutesThisWeek)} logged across every course this week. Keep it going.`, href: "/insights", action: "See insights" };
}

export function relativeDue(iso: string, now: Date) {
  const due = new Date(iso);
  const hours = Math.round((due.getTime() - now.getTime()) / 3600_000);
  const time = due.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (hours < 1) return "within the hour";
  const sameDay = localDateKey(due) === localDateKey(now);
  if (sameDay) return `today at ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (localDateKey(due) === localDateKey(tomorrow)) return `tomorrow at ${time}`;
  return `${due.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at ${time}`;
}

// ── Today home ────────────────────────────────────────────────────────────────

export type TodayCardId = "next-class" | "deadlines" | "fees" | "attendance" | "insights" | "check-in";

export interface TodayInputs {
  now: Date;
  liveClass: boolean;
  deadlinesNext72h: number;
  deadlineWithin24h: boolean;
  feesOutstanding: boolean;
  attendanceRisk: boolean;
  hasTimetable: boolean;
}

/**
 * Orders the Today cards. A class you can check in to right now always leads.
 * Mornings put classes first; evenings put deadlines and revision first.
 * Cards with nothing to say are dropped, except insights which is always kept.
 */
export function rankTodayCards(i: TodayInputs): TodayCardId[] {
  const hour = i.now.getHours();
  const evening = hour >= 16;
  const score: Partial<Record<TodayCardId, number>> = {};

  if (i.liveClass) score["check-in"] = 100;
  if (i.deadlinesNext72h > 0) score.deadlines = i.deadlineWithin24h ? 90 : evening ? 70 : 50;
  if (i.attendanceRisk) score.attendance = 80;
  score["next-class"] = evening ? 40 : i.hasTimetable ? 75 : 45;
  if (i.feesOutstanding) score.fees = 60;
  score.insights = evening ? 65 : 30;

  return (Object.entries(score) as [TodayCardId, number][]).sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

// ── Notifications ─────────────────────────────────────────────────────────────

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  categories: { courses: true, attendance: true, fees: true, registration: true, events: true, system: true },
  quietHours: { enabled: true, start: "22:00", end: "07:00" },
  dailyDigest: false,
  dailyCap: 5,
  push: false,
};

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function inQuietHours(prefs: NotificationPrefs, now: Date) {
  if (!prefs.quietHours.enabled) return false;
  const t = now.getHours() * 60 + now.getMinutes();
  const s = toMin(prefs.quietHours.start);
  const e = toMin(prefs.quietHours.end);
  return s <= e ? t >= s && t < e : t >= s || t < e;
}

/** Notification type strings from the backend or SSE stream mapped to a category. */
export function categoryOf(type: string): NotificationCategory {
  const t = type.toUpperCase();
  if (/(ATTEND|CHECK_?IN)/.test(t)) return "attendance";
  if (/(PAY|FEE|FINANCE|CLEARANCE)/.test(t)) return "fees";
  if (/REGISTR/.test(t)) return "registration";
  if (/(COURSE|ANNOUNCE|MATERIAL|QUESTION|ANSWER|VENUE|CANCEL)/.test(t)) return "courses";
  if (/EVENT/.test(t)) return "events";
  return "system";
}

export function isUrgent(type: string, message = "") {
  return /(CLOSING|REQUIRED|DEADLINE|URGENT|FAIL|CANCEL|AT_RISK)/.test(`${type} ${message}`.toUpperCase());
}

export type Delivery = "push" | "inbox-only" | "digest";

/**
 * Where a notification goes. The inbox always gets it (unless the category is
 * off); push is gated by quiet hours, the daily cap and the digest setting.
 * Urgent items skip quiet hours and the cap, never the category switch.
 */
export function deliveryFor(prefs: NotificationPrefs, n: { type: string; message?: string }, pushedToday: number, now: Date): Delivery | null {
  const category = categoryOf(n.type);
  if (!prefs.categories[category]) return null;
  const urgent = isUrgent(n.type, n.message);
  if (urgent) return prefs.push ? "push" : "inbox-only";
  if (prefs.dailyDigest) return "digest";
  if (!prefs.push) return "inbox-only";
  if (inQuietHours(prefs, now)) return "inbox-only";
  if (pushedToday >= prefs.dailyCap) return "inbox-only";
  return "push";
}
