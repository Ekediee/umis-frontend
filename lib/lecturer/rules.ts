/**
 * Business rules that drive badges, chips and Today cards. Pure and tested.
 */

import { caTotal } from "./grading";
import { daysBetween } from "./format";
import type { Assessment, Enrolment, Registration, RegistrationCheck, RegistrationCourse, RiskSignal, Urgency } from "./types";

// ── At-risk suggestions (Stage 2) ────────────────────────────────────────────
// The system suggests; only the lecturer sends a flag.

export const RISK_DEFAULTS = {
  attendanceBelow: 75,
  attendanceAfterWeek: 4,
  projectedCaBelow: 16, // of 40
};

export function riskSignals(
  enrolment: Enrolment,
  assessments: Assessment[],
  opts: { week: number; caWeight: number; now: Date },
): RiskSignal[] {
  const signals: RiskSignal[] = [];
  if (opts.week > RISK_DEFAULTS.attendanceAfterWeek && enrolment.attendancePct < RISK_DEFAULTS.attendanceBelow) {
    signals.push({ kind: "attendance", value: enrolment.attendancePct });
  }
  const due = assessments.filter((a) => a.dueDate && new Date(a.dueDate) < opts.now);
  for (const a of due) {
    const s = enrolment.caScores[a.id];
    if (a.released && (s === null || s === undefined)) signals.push({ kind: "missed-ca", assessment: a.name });
  }
  // Project the CA total from what has been graded so far.
  const graded = due.filter((a) => a.released);
  if (graded.length) {
    const earned = caTotal(enrolment, graded, 100);
    if (earned !== null) {
      const projected = Math.round((earned / 100) * opts.caWeight);
      if (projected < RISK_DEFAULTS.projectedCaBelow) {
        signals.push({ kind: "projected-ca", value: projected, outOf: opts.caWeight });
      }
    }
  }
  return signals;
}

export function signalLabel(s: RiskSignal) {
  switch (s.kind) {
    case "attendance":
      return `Attendance ${s.value}%`;
    case "missed-ca":
      return `Missed ${s.assessment}`;
    case "projected-ca":
      return `Projected CA ${s.value}/${s.outOf}`;
  }
}

/** Red for a missed assessment, amber otherwise. */
export function signalTone(signals: RiskSignal[]): "red" | "amber" | null {
  if (!signals.length) return null;
  return signals.some((s) => s.kind === "missed-ca") ? "red" : "amber";
}

// ── Registration checks (Stage 6) ────────────────────────────────────────────

export const UNIT_RANGE = { min: 15, max: 24 }; // assumption

export function registrationChecks(
  courses: RegistrationCourse[],
  ctx: { outstandingCarryOvers: { code: string; title: string; failedIn: string }[]; missingPrereqs: string[]; clashes: string[] },
): RegistrationCheck[] {
  const units = courses.reduce((s, c) => s + c.units, 0);
  const checks: RegistrationCheck[] = [];

  checks.push(
    units < UNIT_RANGE.min
      ? { id: "units", label: `Units within ${UNIT_RANGE.min} to ${UNIT_RANGE.max}`, passed: false, detail: `${units} units — below the minimum of ${UNIT_RANGE.min}`, suggestedReason: "too-few-units" }
      : units > UNIT_RANGE.max
        ? { id: "units", label: `Units within ${UNIT_RANGE.min} to ${UNIT_RANGE.max}`, passed: false, detail: `${units} units — above the maximum of ${UNIT_RANGE.max}`, suggestedReason: "too-many-units" }
        : { id: "units", label: `Units within ${UNIT_RANGE.min} to ${UNIT_RANGE.max}`, passed: true, detail: `${units} units` },
  );

  checks.push(
    ctx.missingPrereqs.length
      ? { id: "prerequisites", label: "Prerequisites met", passed: false, detail: `Missing: ${ctx.missingPrereqs.join(", ")}`, suggestedReason: "other" }
      : { id: "prerequisites", label: "Prerequisites met", passed: true },
  );

  const registered = new Set(courses.map((c) => c.code));
  const missing = ctx.outstandingCarryOvers.filter((c) => !registered.has(c.code));
  checks.push(
    missing.length
      ? {
          id: "carry-overs",
          label: "Carry-overs included",
          passed: false,
          detail: missing.map((m) => `Missing carry-over: ${m.code} ${m.title} (failed ${m.failedIn})`).join("; "),
          suggestedReason: "missing-carry-over",
        }
      : { id: "carry-overs", label: "Carry-overs included", passed: true },
  );

  checks.push(
    ctx.clashes.length
      ? { id: "clashes", label: "No timetable clashes", passed: false, detail: ctx.clashes.join("; "), suggestedReason: "other" }
      : { id: "clashes", label: "No timetable clashes", passed: true },
  );

  return checks;
}

export const allChecksPassed = (r: Pick<Registration, "checks">) => r.checks.every((c) => c.passed);

export const RETURN_REASON_LABELS: Record<string, string> = {
  "missing-carry-over": "Missing carry-over",
  "too-many-units": "Too many units",
  "too-few-units": "Too few units",
  "wrong-elective": "Wrong elective",
  other: "Other",
};

/** Reason text is required: at least one chip or 10 characters (6.3). */
export function isReturnValid(reasons: string[], note: string) {
  return reasons.length > 0 || note.trim().length >= 10;
}

// ── Urgency (cross-cutting "days before it turns amber") ────────────────────

export function deadlineUrgency(deadline: string, now: Date, amberWithinDays: number): Urgency {
  const days = daysBetween(now, deadline);
  if (days < 0) return "overdue";
  if (days <= amberWithinDays) return "soon";
  return "normal";
}

export function waitingUrgency(since: string, now: Date, amberAfterDays: number): Urgency {
  return daysBetween(since, now) >= amberAfterDays ? "soon" : "normal";
}
