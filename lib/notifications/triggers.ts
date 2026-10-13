/**
 * Notification triggers: pure rules that turn the student's real state into
 * notices. No I/O here, so the rules are unit-tested (triggers.test.ts) and
 * run the same on the server (SSE stream) and in the browser (preview data).
 *
 * Every notice carries a stable `key` naming the milestone it announces
 * (e.g. "reg-closing:2025/2026.2:1d"). The inbox dedupes on that key, so a
 * milestone is announced once, however often the rules re-run or the stream
 * reconnects. Copy is written to help students act, never to alarm.
 */

import type { SemesterInfo } from "@/app/actions/registration-semester";
import type { Deadline, LiveClass } from "@/lib/student/types";

export interface Notice {
  /** Stable milestone id; the inbox dedupes on it */
  key: string;
  /** Machine type; drives category (lib/student/rules categoryOf) and urgency */
  type: string;
  title: string;
  message: string;
  /** Where tapping the notice takes the student */
  href?: string;
  /** Inbox only, no toast or push (the screen already confirmed the action) */
  silent?: boolean;
}

const DAY = 86_400_000;

/** "2025/2026.2" → "2025/2026 second semester" */
export function semesterLabel(code: string): string {
  const [session, n] = code.split(".");
  const which = n?.startsWith("1") ? "first" : n?.startsWith("2") ? "second" : n?.startsWith("3") ? "summer" : null;
  return which ? `${session.trim()} ${which} semester` : code;
}

/** Midnight-based day difference, so "tomorrow" means the next calendar day. */
export function daysUntil(dateIso: string, now: Date): number {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return NaN;
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / DAY);
}

export function formatDay(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
}

function when(days: number) {
  return days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
}

/**
 * Registration milestones from GET /semester/commence.
 * - Open: once per semester while registration is open and not started.
 * - Closing: at 7, 3 and 1 day(s) before the late-registration date, and on the day.
 * - Semester ending: once, two weeks out, so students plan for exams.
 */
export function registrationTriggers(info: SemesterInfo, now: Date): Notice[] {
  const out: Notice[] = [];
  const sem = info.semester;
  const label = semesterLabel(sem);
  const toStart = daysUntil(info.startDate, now);
  const toLate = daysUntil(info.lateRegDate, now);
  const toEnd = daysUntil(info.endDate, now);

  if (!info.check && toStart <= 0 && toLate >= 0) {
    out.push({
      key: `reg-open:${sem}`,
      type: "REGISTRATION_OPEN",
      title: "Registration is open",
      message: `Registration for the ${label} is open. Starting early gives you the best pick of class groups.`,
      href: "/registration",
    });

    const bucket = toLate <= 0 ? "0d" : toLate === 1 ? "1d" : toLate <= 3 ? "3d" : toLate <= 7 ? "7d" : null;
    if (bucket) {
      out.push({
        key: `reg-closing:${sem}:${bucket}`,
        type: "REGISTRATION_CLOSING_SOON",
        title: toLate <= 0 ? "Registration closes today" : `Registration closes ${when(toLate)}`,
        message: `Late registration for the ${label} ends ${toLate <= 0 ? "today" : `on ${formatDay(info.lateRegDate)}`}. A few minutes now keeps your semester on track.`,
        href: "/registration",
      });
    }
  }

  if (toEnd > 0 && toEnd <= 14) {
    out.push({
      key: `sem-ending:${sem}`,
      type: "SEMESTER_ENDING",
      title: "Two weeks to the end of semester",
      message: `The ${label} ends on ${formatDay(info.endDate)}. Check your timetable and plan your revision now.`,
      href: "/dashboard/timetable",
    });
  }

  return out;
}

/** Assignment / test reminders: one 24-hour heads-up per deadline, for unsubmitted work. */
export function deadlineTriggers(deadlines: Deadline[], now: Date, courseCode: (courseId: string) => string): Notice[] {
  return deadlines
    .filter((d) => !d.submitted)
    .filter((d) => {
      const ms = new Date(d.dueAt).getTime() - now.getTime();
      return ms > 0 && ms <= DAY;
    })
    .map((d) => ({
      key: `deadline-24h:${d.id}`,
      type: "COURSE_DEADLINE",
      title: `${courseCode(d.courseId)} ${d.kind} due ${daysUntil(d.dueAt, now) <= 0 ? "today" : "tomorrow"}`,
      message: `"${d.title}" is due ${new Date(d.dueAt).toLocaleString("en-NG", { weekday: "short", hour: "numeric", minute: "2-digit" })}. You've got this. Submit early to stay ahead.`,
      href: `/courses/${d.courseId}`,
    }));
}

/** A class is on now (or starts within 10 minutes) and the student hasn't checked in. */
export function liveClassTriggers(live: LiveClass | null, now: Date): Notice[] {
  if (!live || live.checkedIn) return [];
  const start = new Date(live.startsAt).getTime();
  const end = new Date(live.endsAt).getTime();
  const t = now.getTime();
  if (t < start - 10 * 60_000 || t > end) return [];
  const started = t >= start;
  return [
    {
      key: `checkin:${live.sessionId}`,
      type: "ATTENDANCE_CHECKIN_OPEN",
      title: started ? `${live.title} has started` : `${live.title} starts soon`,
      message: `${live.venue}. Check in with the code on the board so today counts toward your attendance.`,
      href: "/attendance/check-in",
    },
  ];
}
