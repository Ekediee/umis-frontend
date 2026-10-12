import { describe, expect, it } from "vitest";
import { caPlanStatus, caTotal, gradeRow, letterFor, preSubmitCheck, roundHalfUp, validateScore } from "./grading";
import type { Assessment, Enrolment } from "./types";

const A = (id: string, max: number): Assessment => ({ id, courseId: "c", name: id, type: "test", maxMarks: max, dueDate: null, mode: "paper", released: true, groupIds: [] });
const plan = [A("ca1", 10), A("ca2", 10), A("ca3", 20)];

function enr(over: Partial<Enrolment> = {}): Enrolment {
  return { studentId: "s1", courseId: "c", groupId: "g", attendancePct: 90, caScores: { ca1: 8, ca2: 7, ca3: 15 }, examScore: 40, status: "active", tags: [], flaggedAtRisk: false, ...over };
}

describe("grade scale (confirmed for all schools)", () => {
  it.each([
    [100, "A"], [70, "A"], [69, "B"], [60, "B"], [59, "C"], [50, "C"],
    [49, "D"], [45, "D"], [44, "E"], [40, "E"], [39, "F"], [0, "F"],
  ])("%d → %s", (total, letter) => {
    expect(letterFor(total)).toBe(letter);
  });

  it("rounds half up before applying the letter (49.5 becomes 50, a C)", () => {
    expect(roundHalfUp(49.5)).toBe(50);
    expect(roundHalfUp(49.49)).toBe(49);
    expect(letterFor(49.5)).toBe("C");
    expect(letterFor(69.5)).toBe("A");
  });
});

describe("caTotal", () => {
  it("scales earned CA to the course weight", () => {
    expect(caTotal(enr(), plan, 40)).toBe(30);
  });
  it("keeps blank distinct from zero", () => {
    expect(caTotal(enr({ caScores: { ca1: null, ca2: null, ca3: null } }), plan)).toBeNull();
    expect(caTotal(enr({ caScores: { ca1: 0, ca2: null, ca3: null } }), plan)).toBe(0);
  });
});

describe("gradeRow", () => {
  it("computes total and letter; the lecturer never types a letter", () => {
    expect(gradeRow(enr(), plan)).toMatchObject({ ca: 30, exam: 40, total: 70, letter: "A" });
  });
  it("has no total until the exam score is entered", () => {
    expect(gradeRow(enr({ examScore: null }), plan)).toMatchObject({ total: null, letter: null });
  });
  it("a status (absent from exam) replaces the total", () => {
    expect(gradeRow(enr({ examScore: null, examStatus: "absent" }), plan)).toMatchObject({ total: null, status: "absent" });
  });
});

describe("validateScore", () => {
  it("rejects scores above max with copy that says what to do", () => {
    expect(validateScore("11", 10, "CA 2")).toEqual({ ok: false, message: "CA 2 is out of 10." });
  });
  it("blank stays blank, not zero", () => {
    expect(validateScore("  ", 10, "CA 2")).toEqual({ ok: true, value: null });
  });
  it("accepts decimals and rejects text", () => {
    expect(validateScore("7.5", 10, "CA 2")).toEqual({ ok: true, value: 7.5 });
    expect(validateScore("seven", 10, "CA 2").ok).toBe(false);
    expect(validateScore("-1", 10, "CA 2").ok).toBe(false);
  });
});

describe("preSubmitCheck (5B.2)", () => {
  it("blocks submit while any row has no exam score or status", () => {
    const c = preSubmitCheck([enr(), enr({ studentId: "s2", examScore: null })], plan);
    expect(c.missingExam).toEqual(["s2"]);
    expect(c.canSubmit).toBe(false);
    expect(c.complete).toBe(1);
  });
  it("allows submit when every row has a total or a status", () => {
    const c = preSubmitCheck([enr(), enr({ studentId: "s2", examScore: null, examStatus: "incomplete" })], plan);
    expect(c.canSubmit).toBe(true);
    expect(c.distribution.A).toBe(1);
  });
  it("flags totals over 100 (e.g. from an import)", () => {
    const c = preSubmitCheck([enr({ examScore: 75 })], plan);
    expect(c.overHundred).toEqual(["s1"]);
    expect(c.canSubmit).toBe(false);
  });
  it("ignores dropped students", () => {
    const c = preSubmitCheck([enr(), enr({ studentId: "s2", status: "dropped", examScore: null })], plan);
    expect(c.total).toBe(1);
    expect(c.canSubmit).toBe(true);
  });
  it("lists students with no CA as a warning, not a blocker", () => {
    const c = preSubmitCheck([enr({ caScores: { ca1: null, ca2: null, ca3: null } })], plan);
    expect(c.noCa).toEqual(["s1"]);
    expect(c.canSubmit).toBe(true);
  });
});

describe("caPlanStatus (5A.1)", () => {
  it("warns when planned CA marks don't match the weighting", () => {
    expect(caPlanStatus(plan, 40)).toMatchObject({ planned: 40, balanced: true });
    expect(caPlanStatus([A("x", 10)], 40)).toMatchObject({ planned: 10, balanced: false, over: false });
    expect(caPlanStatus([...plan, A("x", 5)], 40).over).toBe(true);
  });
});
