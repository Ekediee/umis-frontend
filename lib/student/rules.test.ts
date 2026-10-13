import { describe, expect, it } from "vitest";
import {
  attendancePercent,
  attendanceStanding,
  categoryOf,
  DEFAULT_NOTIFICATION_PREFS,
  deliveryFor,
  formatMinutes,
  inQuietHours,
  classesToRecover,
  recoveryLine,
  rankTodayCards,
  studyStreak,
  summarizeWeek,
  weeklySuggestion,
  weekStart,
} from "./rules";
import type { CourseAttendance, StudySession } from "./types";

const att = (courseId: string, held: number, attended: number, extra: Partial<CourseAttendance> = {}): CourseAttendance => {
  const base = { courseId, title: courseId, held, attended, late: 0, excused: 0, history: [], percent: 0, ...extra };
  return { ...base, percent: attendancePercent(base) };
};

const session = (courseId: string, iso: string, minutes: number): StudySession => ({ id: `${courseId}-${iso}`, courseId, startedAt: iso, minutes });

describe("attendance", () => {
  it("counts late and excused as attended", () => {
    expect(attendancePercent({ held: 10, attended: 6, late: 1, excused: 1 })).toBe(80);
  });

  it("treats a course with no classes yet as 100%", () => {
    expect(attendancePercent({ held: 0, attended: 0, late: 0, excused: 0 })).toBe(100);
  });

  it("classifies standing around the 75% line", () => {
    expect(attendanceStanding(74)).toBe("risk");
    expect(attendanceStanding(75)).toBe("watch");
    expect(attendanceStanding(85)).toBe("good");
  });

  it("counts the classes to attend to get back above 75%", () => {
    expect(classesToRecover({ held: 10, attended: 8, late: 0, excused: 0 })).toBe(0);
    // 7 of 10 (70%): attending 2 more gives 9 of 12 = 75%
    expect(classesToRecover({ held: 10, attended: 7, late: 0, excused: 0 })).toBe(2);
    expect(classesToRecover({ held: 10, attended: 6, late: 0, excused: 0 })).toBe(6);
  });

  it("phrases attendance as what to attend, never what to skip", () => {
    const line = recoveryLine({ held: 10, attended: 7, late: 0, excused: 0 });
    expect(line).toBe("Attend your next 2 classes to get back above 75%.");
    expect(line).not.toMatch(/miss|skip/i);
  });
});

describe("study time", () => {
  const now = new Date(2026, 9, 8, 15, 0); // Thu 8 Oct 2026

  it("starts the week on Monday", () => {
    expect(weekStart(now).getDate()).toBe(5);
  });

  it("summarises only this week's sessions by day and course", () => {
    const s = summarizeWeek(
      [
        session("COSC 204", new Date(2026, 9, 5, 9).toISOString(), 30),
        session("COSC 204", new Date(2026, 9, 8, 9).toISOString(), 25),
        session("SENG 270", new Date(2026, 9, 7, 20).toISOString(), 50),
        session("SENG 270", new Date(2026, 9, 2, 20).toISOString(), 90), // last week
      ],
      now,
    );
    expect(s.minutes).toBe(105);
    expect(s.byDay).toHaveLength(7);
    expect(s.byDay[0].minutes).toBe(30);
    expect(s.byCourse[0]).toEqual({ courseId: "COSC 204", minutes: 55 });
  });

  it("keeps a streak alive until the end of today", () => {
    const sessions = [7, 6, 5].map((d) => session("X", new Date(2026, 9, d, 10).toISOString(), 20));
    expect(studyStreak(sessions, now)).toBe(3);
    expect(studyStreak([...sessions, session("X", new Date(2026, 9, 8, 8).toISOString(), 10)], now)).toBe(4);
    expect(studyStreak([session("X", new Date(2026, 9, 1, 10).toISOString(), 20)], now)).toBe(0);
  });

  it("formats minutes", () => {
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(120)).toBe("2h");
    expect(formatMinutes(135)).toBe("2h 15m");
  });
});

describe("weekly suggestion", () => {
  const now = new Date(2026, 9, 8, 10, 0);
  const base = { deadlines: [], minutesThisWeek: 60, minutesByCourse: [{ courseId: "A", minutes: 60 }], courses: ["A"], now };

  it("leads with attendance below the threshold", () => {
    const s = weeklySuggestion({ ...base, attendance: [att("PHY 102", 10, 6)] });
    expect(s.tone).toBe("risk");
    expect(s.text).toContain("PHY 102 attendance is 60%");
    expect(s.text).toContain("Attend your next");
    expect(s.text).not.toMatch(/can miss/i);
  });

  it("then a deadline inside 48 hours", () => {
    const s = weeklySuggestion({
      ...base,
      attendance: [att("A", 10, 10)],
      deadlines: [{ id: "d", courseId: "A", title: "Assignment 2", kind: "assignment", dueAt: new Date(2026, 9, 9, 9).toISOString(), submitted: false }],
    });
    expect(s.tone).toBe("warning");
    expect(s.text).toContain("tomorrow");
  });

  it("nudges to start when nothing is logged", () => {
    const s = weeklySuggestion({ ...base, attendance: [att("A", 10, 10)], minutesThisWeek: 0, minutesByCourse: [] });
    expect(s.action).toBe("Start studying");
  });

  it("names a course with no study time", () => {
    const s = weeklySuggestion({ ...base, attendance: [att("A", 10, 10)], courses: ["A", "B"] });
    expect(s.text).toContain("B");
  });
});

describe("today ordering", () => {
  const base = { liveClass: false, deadlinesNext72h: 0, deadlineWithin24h: false, feesOutstanding: false, attendanceRisk: false, hasTimetable: true };

  it("puts a live class first", () => {
    expect(rankTodayCards({ ...base, now: new Date(2026, 9, 8, 20), liveClass: true })[0]).toBe("check-in");
  });

  it("puts the next class first in the morning and deadlines first in the evening", () => {
    const withDeadlines = { ...base, deadlinesNext72h: 2 };
    expect(rankTodayCards({ ...withDeadlines, now: new Date(2026, 9, 8, 8) })[0]).toBe("next-class");
    expect(rankTodayCards({ ...withDeadlines, now: new Date(2026, 9, 8, 19) })[0]).toBe("deadlines");
  });

  it("drops cards with nothing to say", () => {
    const ids = rankTodayCards({ ...base, now: new Date(2026, 9, 8, 8) });
    expect(ids).not.toContain("fees");
    expect(ids).not.toContain("deadlines");
    expect(ids).toContain("insights");
  });
});

describe("notifications", () => {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, push: true };

  it("handles quiet hours across midnight", () => {
    expect(inQuietHours(prefs, new Date(2026, 9, 8, 23, 30))).toBe(true);
    expect(inQuietHours(prefs, new Date(2026, 9, 8, 6, 59))).toBe(true);
    expect(inQuietHours(prefs, new Date(2026, 9, 8, 7, 0))).toBe(false);
  });

  it("maps backend types to categories", () => {
    expect(categoryOf("PAYMENT_REQUIRED")).toBe("fees");
    expect(categoryOf("REGISTRATION_OPEN")).toBe("registration");
    expect(categoryOf("COURSE_ANNOUNCEMENT")).toBe("courses");
    expect(categoryOf("ATTENDANCE_WARNING")).toBe("attendance");
  });

  it("holds non-urgent pushes in quiet hours and past the cap, but lets urgent ones through", () => {
    const night = new Date(2026, 9, 8, 23);
    const noon = new Date(2026, 9, 8, 12);
    expect(deliveryFor(prefs, { type: "COURSE_ANNOUNCEMENT" }, 0, night)).toBe("inbox-only");
    expect(deliveryFor(prefs, { type: "COURSE_ANNOUNCEMENT" }, 5, noon)).toBe("inbox-only");
    expect(deliveryFor(prefs, { type: "COURSE_ANNOUNCEMENT" }, 0, noon)).toBe("push");
    expect(deliveryFor(prefs, { type: "CLASS_CANCELLED" }, 9, night)).toBe("push");
  });

  it("drops everything in a switched-off category", () => {
    const off = { ...prefs, categories: { ...prefs.categories, fees: false } };
    expect(deliveryFor(off, { type: "PAYMENT_REQUIRED" }, 0, new Date())).toBeNull();
  });
});
