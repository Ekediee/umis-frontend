/**
 * Business rules that drive badges, chips and Today cards. Pure and tested.
 */

import { caTotal } from "./grading";
import { daysBetween } from "./format";
import type {
  Assessment,
  AuditCourse,
  AuditStatus,
  CourseAudit,
  CurriculumCourse,
  Enrolment,
  Letter,
  Registration,
  RegistrationCheck,
  RegistrationCourse,
  RegistrationStatus,
  RiskSignal,
  TranscriptCourse,
  TranscriptSemester,
  Urgency,
} from "./types";

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
  ctx: {
    outstandingCarryOvers: { code: string; title: string; failedIn: string }[];
    missingPrereqs: string[];
    clashes: string[];
    /** Core courses for this level and semester (from the curriculum); optional for callers without a curriculum. */
    requiredCore?: { code: string; title: string }[];
  },
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

  if (ctx.requiredCore) {
    const notPicked = ctx.requiredCore.filter((c) => !registered.has(c.code));
    checks.push(
      notPicked.length
        ? {
            id: "core-courses",
            label: "Required courses included",
            passed: false,
            detail: notPicked.map((m) => `Not picked: ${m.code} ${m.title}`).join("; "),
            suggestedReason: "missing-core-course",
          }
        : { id: "core-courses", label: "Required courses included", passed: true },
    );
  }

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
  "missing-core-course": "Missing required course",
  "too-many-units": "Too many units",
  "too-few-units": "Too few units",
  "wrong-elective": "Wrong elective",
  other: "Other",
};

/** Reason text is required: at least one chip or 10 characters (6.3). */
export function isReturnValid(reasons: string[], note: string) {
  return reasons.length > 0 || note.trim().length >= 10;
}

/**
 * An advisor can send a registration back while it is waiting, and also after
 * approving it — by them or by the school officer (confirmed). Returning a
 * school-approved registration withdraws that approval too.
 */
export function canReturn(status: RegistrationStatus) {
  return status === "to_review" || status === "approved_advisor" || status === "approved_school";
}

// ── Course audit: what a student has passed, failed, missed and still has to do ──

/** Babcock 5-point scale. */
export const GRADE_POINTS: Record<Letter, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

/** Order of terms, so "earlier than now" comparisons work across levels. */
const termIndex = (level: number, semester: number) => level * 10 + semester;

/**
 * Sorts every curriculum course into one status:
 * - passed: latest attempt E or better
 * - failed: latest attempt F and not registered again (outstanding carry-over)
 * - registered: in this semester's registration (a retake when failed before)
 * - missing: a core course from this or an earlier term the student never took or did not pick
 * - to_do: belongs to a later term
 * Electives the student skipped are not "missing"; they show as to_do until taken.
 * `registeredCodes` is null while the registration isn't submitted: this term's
 * courses then stay to_do (the "Not submitted" status already says so).
 */
export function auditCourses(
  curriculum: CurriculumCourse[],
  transcript: TranscriptSemester[],
  registeredCodes: string[] | null,
  current: { level: number; semester: 1 | 2 },
): CourseAudit {
  const attempts = new Map<string, Letter[]>();
  for (const sem of transcript) for (const c of sem.courses) attempts.set(c.code, [...(attempts.get(c.code) ?? []), c.grade]);
  const registered = new Set(registeredCodes ?? []);
  const submitted = registeredCodes !== null;
  const now = termIndex(current.level, current.semester);

  const courses: AuditCourse[] = curriculum.map((c) => {
    const tries = attempts.get(c.code) ?? [];
    const grade = tries.at(-1);
    const term = termIndex(c.level, c.semester);
    let status: AuditStatus;
    if (grade && grade !== "F") status = "passed";
    else if (registered.has(c.code)) status = "registered";
    else if (grade === "F") status = "failed";
    else if (c.kind === "core" && (term < now || (term === now && submitted))) status = "missing";
    else status = "to_do";
    return { ...c, status, grade, attempts: tries.length, retake: status === "registered" && grade === "F" ? true : undefined };
  });

  const counts = { passed: 0, failed: 0, registered: 0, missing: 0, to_do: 0 } as Record<AuditStatus, number>;
  courses.forEach((c) => counts[c.status]++);
  const unitsRequired = curriculum.filter((c) => c.kind === "core").reduce((s, c) => s + c.units, 0);
  const unitsPassed = courses.filter((c) => c.status === "passed").reduce((s, c) => s + c.units, 0);
  return { courses, counts, unitsPassed, unitsRequired };
}

/** GPA for a set of results, to two decimals; null when there are none. */
export function gpaOf(results: Pick<TranscriptCourse, "units" | "gradePoint">[]): number | null {
  const units = results.reduce((s, r) => s + r.units, 0);
  if (!units) return null;
  return Math.round((results.reduce((s, r) => s + r.units * r.gradePoint, 0) / units) * 100) / 100;
}

/** The plain-language message an advisor sends a student about their course audit. */
export function auditMessage(firstName: string, audit: CourseAudit) {
  const list = (s: AuditStatus) => audit.courses.filter((c) => c.status === s);
  const line = (c: AuditCourse) => `• ${c.code} ${c.title} (${c.units} units)`;
  const parts = [`Hi ${firstName}, I reviewed your course record.`];
  const failed = list("failed");
  const missing = list("missing");
  if (failed.length) parts.push(`You failed these courses and need to register them again:\n${failed.map(line).join("\n")}`);
  if (missing.length) parts.push(`These required courses are missing from your record or this semester's registration:\n${missing.map(line).join("\n")}`);
  if (!failed.length && !missing.length) parts.push("You have no failed or missing courses. Well done.");
  const left = audit.unitsRequired - audit.unitsPassed;
  parts.push(`You still have ${left} core units to complete before graduation. Come and see me if you have questions.`);
  return parts.join("\n\n");
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
