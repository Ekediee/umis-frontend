import { describe, expect, it } from "vitest";
import { defaultSemester, formatSemester, localDate, relativeDays, termLabel, timeRange } from "./format";
import { allChecksPassed, deadlineUrgency, isReturnValid, registrationChecks, riskSignals } from "./rules";
import type { Assessment, Enrolment, RegistrationCourse, Semester } from "./types";

describe("semester naming (plain language)", () => {
  it("never shows raw codes", () => {
    expect(formatSemester("2026/2027.1")).toBe("Semester 1, 2026/2027");
    expect(formatSemester("2025/2026.3")).toBe("Summer semester, 2025/2026");
    expect(formatSemester("2026/2027.M")).toBe("Medical year, 2026/2027");
    expect(formatSemester("2026/2027.1P")).toBe("Semester 1 · Postgraduate, 2026/2027");
    expect(termLabel("2T")).toBe("Semester 2 (T)");
  });

  it("defaults to the active semester with the lecturer's classes", () => {
    const s = (code: string, active: boolean, mine: boolean): Semester => ({ code, session: "", term: "", start: "", end: "", active, hasMyClasses: mine });
    expect(defaultSemester([s("M", true, false), s("1T", true, false), s("1", true, true)])?.code).toBe("1");
    expect(defaultSemester([s("M", true, false), s("old", false, true)])?.code).toBe("M");
  });
});

describe("time copy", () => {
  it("formats ranges like the spec", () => {
    expect(timeRange("14:00", "15:00")).toBe("2:00 to 3:00 pm");
    expect(timeRange("10:00", "12:00")).toBe("10:00 am to 12:00 pm");
  });
  it("local dates never shift a day through UTC", () => {
    expect(localDate(new Date(2026, 9, 13, 0, 0))).toBe("2026-10-13");
    expect(localDate(new Date(2026, 9, 13, 23, 59))).toBe("2026-10-13");
  });
  it("relative days", () => {
    const now = new Date(2026, 9, 7, 9);
    expect(relativeDays(new Date(2026, 9, 18), now)).toBe("in 11 days");
    expect(relativeDays(new Date(2026, 9, 8), now)).toBe("tomorrow");
    expect(relativeDays(new Date(2026, 9, 7, 23), now)).toBe("today");
  });
});

describe("registration checks (Stage 6)", () => {
  const base: RegistrationCourse[] = [
    { code: "A", title: "A", units: 6 },
    { code: "B", title: "B", units: 6 },
    { code: "C", title: "C", units: 6 },
  ];
  const ctx = { outstandingCarryOvers: [], missingPrereqs: [], clashes: [] };

  it("passes a clean 18-unit registration", () => {
    expect(allChecksPassed({ checks: registrationChecks(base, ctx) })).toBe(true);
  });

  it("pre-fills a return reason for a missing carry-over (6.2a)", () => {
    const checks = registrationChecks(base, { ...ctx, outstandingCarryOvers: [{ code: "COS 102", title: "Problem Solving", failedIn: "2025/2026" }] });
    const failed = checks.find((c) => !c.passed)!;
    expect(failed.suggestedReason).toBe("missing-carry-over");
    expect(failed.detail).toBe("Missing carry-over: COS 102 Problem Solving (failed 2025/2026)");
  });

  it("checks the unit range both ways", () => {
    expect(registrationChecks(base.slice(0, 2), ctx)[0]).toMatchObject({ passed: false, suggestedReason: "too-few-units" });
    expect(registrationChecks([...base, ...base], ctx)[0]).toMatchObject({ passed: false, suggestedReason: "too-many-units" });
  });

  it("requires a chip or 10 characters to return (6.3)", () => {
    expect(isReturnValid([], "too short")).toBe(false);
    expect(isReturnValid([], "Add COS 102 please")).toBe(true);
    expect(isReturnValid(["other"], "")).toBe(true);
  });
});

describe("at-risk suggestions (Stage 2)", () => {
  const now = new Date(2026, 9, 7);
  const ca = (released: boolean, due: string | null): Assessment => ({ id: "ca1", courseId: "c", name: "CA 1", type: "test", maxMarks: 10, dueDate: due, mode: "paper", released, groupIds: [] });
  const e = (over: Partial<Enrolment>): Enrolment => ({ studentId: "s", courseId: "c", groupId: "g", attendancePct: 90, caScores: { ca1: 8 }, examScore: null, status: "active", tags: [], flaggedAtRisk: false, ...over });

  it("suggests low attendance only after week 4", () => {
    expect(riskSignals(e({ attendancePct: 62 }), [], { week: 3, caWeight: 40, now })).toEqual([]);
    expect(riskSignals(e({ attendancePct: 62 }), [], { week: 6, caWeight: 40, now })).toEqual([{ kind: "attendance", value: 62 }]);
  });

  it("flags a missed, released CA and a low projected CA", () => {
    const signals = riskSignals(e({ caScores: { ca1: null } }), [ca(true, "2026-09-18")], { week: 6, caWeight: 40, now });
    expect(signals).toContainEqual({ kind: "missed-ca", assessment: "CA 1" });
    const low = riskSignals(e({ caScores: { ca1: 3 } }), [ca(true, "2026-09-18")], { week: 6, caWeight: 40, now });
    expect(low).toContainEqual({ kind: "projected-ca", value: 12, outOf: 40 });
  });
});

describe("deadline urgency", () => {
  const now = new Date(2026, 9, 7);
  it("turns amber inside the window and red after", () => {
    expect(deadlineUrgency("2026-10-18", now, 2)).toBe("normal");
    expect(deadlineUrgency("2026-10-09", now, 2)).toBe("soon");
    expect(deadlineUrgency("2026-10-06", now, 2)).toBe("overdue");
  });
});
