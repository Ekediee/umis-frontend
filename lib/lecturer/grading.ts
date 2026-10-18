/**
 * Grading rules (Stage 5A/5B). Pure functions — the single source of truth for
 * totals, letters and the pre-submit check, shared by the UI and tests.
 *
 * Confirmed: A 70–100, B 60–69, C 50–59, D 45–49, E 40–44, F < 40, for all schools.
 * Assumed: CA 40 / exam 60. Totals round half up before the letter is applied.
 */

import type { Assessment, Enrolment, Letter } from "./types";

export const GRADE_SCALE: { letter: Letter; min: number }[] = [
  { letter: "A", min: 70 },
  { letter: "B", min: 60 },
  { letter: "C", min: 50 },
  { letter: "D", min: 45 },
  { letter: "E", min: 40 },
  { letter: "F", min: 0 },
];

/** Round half up (49.5 → 50). Guards against float noise like 49.49999999. */
export function roundHalfUp(value: number) {
  return Math.floor(value + 0.5 + 1e-9);
}

export function letterFor(total: number): Letter {
  const rounded = roundHalfUp(total);
  return GRADE_SCALE.find((g) => rounded >= g.min)!.letter;
}

/**
 * CA total scaled to the course CA weight. Null when no CA score was entered
 * at all, so "blank" stays distinguishable from "zero".
 */
export function caTotal(enrolment: Pick<Enrolment, "caScores">, assessments: Assessment[], caWeight = 40): number | null {
  const planned = assessments.reduce((sum, a) => sum + a.maxMarks, 0);
  if (planned === 0) return null;
  let earned = 0;
  let any = false;
  for (const a of assessments) {
    const s = enrolment.caScores[a.id];
    if (s !== null && s !== undefined) {
      earned += s;
      any = true;
    }
  }
  if (!any) return null;
  // Planned CA marks normally equal the weight (40 of 40); scale if not.
  return Math.round(((earned / planned) * caWeight) * 10) / 10;
}

export interface GradeRow {
  studentId: string;
  ca: number | null;
  exam: number | null;
  total: number | null;
  letter: Letter | null;
  status?: Enrolment["examStatus"];
}

export function gradeRow(enrolment: Enrolment, assessments: Assessment[], caWeight = 40): GradeRow {
  const ca = caTotal(enrolment, assessments, caWeight);
  const exam = enrolment.examScore;
  if (enrolment.examStatus) {
    return { studentId: enrolment.studentId, ca, exam, total: null, letter: null, status: enrolment.examStatus };
  }
  if (exam === null) return { studentId: enrolment.studentId, ca, exam, total: null, letter: null };
  const total = roundHalfUp((ca ?? 0) + exam);
  return { studentId: enrolment.studentId, ca, exam, total, letter: letterFor(total) };
}

export type ScoreValidation = { ok: true; value: number | null } | { ok: false; message: string };

/**
 * Validate a typed score. Blank stays blank (null), never zero.
 * Error copy says what to do (quality bar): "CA 2 is out of 10."
 */
export function validateScore(raw: string, max: number, label: string): ScoreValidation {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return { ok: false, message: `Enter a number for ${label}.` };
  const value = Number(trimmed);
  if (value > max) return { ok: false, message: `${label} is out of ${max}.` };
  return { ok: true, value };
}

export interface PreSubmitCheck {
  missingExam: string[];
  overHundred: string[];
  noCa: string[];
  distribution: Record<Letter, number>;
  /** Submit stays disabled until every row has a total or a status (5B.2). */
  canSubmit: boolean;
  complete: number;
  total: number;
}

export function preSubmitCheck(enrolments: Enrolment[], assessments: Assessment[], caWeight = 40): PreSubmitCheck {
  const active = enrolments.filter((e) => e.status === "active");
  const distribution: Record<Letter, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  const missingExam: string[] = [];
  const overHundred: string[] = [];
  const noCa: string[] = [];
  let complete = 0;

  for (const e of active) {
    const row = gradeRow(e, assessments, caWeight);
    if (row.ca === null) noCa.push(e.studentId);
    if (row.status) {
      complete++;
      continue;
    }
    if (row.exam === null) {
      missingExam.push(e.studentId);
      continue;
    }
    if (row.total !== null && row.total > 100) {
      overHundred.push(e.studentId);
      continue;
    }
    if (row.letter) distribution[row.letter]++;
    complete++;
  }

  return {
    missingExam,
    overHundred,
    noCa,
    distribution,
    canSubmit: missingExam.length === 0 && overHundred.length === 0 && active.length > 0,
    complete,
    total: active.length,
  };
}

/** Warn when planned CA marks don't add up to the course weighting (5A.1). */
export function caPlanStatus(assessments: Assessment[], caWeight = 40) {
  const planned = assessments.reduce((s, a) => s + a.maxMarks, 0);
  return { planned, weight: caWeight, balanced: planned === caWeight, over: planned > caWeight };
}
