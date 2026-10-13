import { describe, expect, it } from "vitest";
import { daysUntil, deadlineTriggers, liveClassTriggers, registrationTriggers, semesterLabel } from "./triggers";

const at = (iso: string) => new Date(iso);
const info = (over: Partial<Parameters<typeof registrationTriggers>[0]> = {}) => ({
  semester: "2025/2026.2",
  startDate: "2026-10-01",
  endDate: "2027-02-20",
  lateRegDate: "2026-10-20",
  check: false,
  ...over,
});
const keys = (n: { key: string }[]) => n.map((x) => x.key);

describe("semesterLabel", () => {
  it("reads the semester code", () => {
    expect(semesterLabel("2025/2026.1")).toBe("2025/2026 first semester");
    expect(semesterLabel("2025/2026.2")).toBe("2025/2026 second semester");
    expect(semesterLabel("2023/2024.1C")).toBe("2023/2024 first semester");
    expect(semesterLabel("odd")).toBe("odd");
  });
});

describe("daysUntil", () => {
  it("counts calendar days, not 24-hour blocks", () => {
    expect(daysUntil("2026-10-14", at("2026-10-13T23:30:00"))).toBe(1);
    expect(daysUntil("2026-10-13", at("2026-10-13T08:00:00"))).toBe(0);
  });
});

describe("registrationTriggers", () => {
  it("announces open registration once per semester, with no countdown far from the deadline", () => {
    expect(keys(registrationTriggers(info(), at("2026-10-05T09:00:00")))).toEqual(["reg-open:2025/2026.2"]);
  });

  it("steps the closing reminder through 7, 3, 1 and 0 days", () => {
    const k = (d: string) => keys(registrationTriggers(info(), at(d))).find((x) => x.startsWith("reg-closing"));
    expect(k("2026-10-13T09:00:00")).toBe("reg-closing:2025/2026.2:7d");
    expect(k("2026-10-17T09:00:00")).toBe("reg-closing:2025/2026.2:3d");
    expect(k("2026-10-19T09:00:00")).toBe("reg-closing:2025/2026.2:1d");
    expect(k("2026-10-20T09:00:00")).toBe("reg-closing:2025/2026.2:0d");
  });

  it("is quiet once the student has started registering, or before it opens", () => {
    expect(registrationTriggers(info({ check: true }), at("2026-10-19T09:00:00"))).toEqual([]);
    expect(registrationTriggers(info(), at("2026-09-20T09:00:00"))).toEqual([]);
  });

  it("flags the last two weeks of the semester", () => {
    expect(keys(registrationTriggers(info({ check: true }), at("2027-02-10T09:00:00")))).toEqual(["sem-ending:2025/2026.2"]);
  });

  it("writes encouraging, actionable copy", () => {
    const [, closing] = registrationTriggers(info(), at("2026-10-19T09:00:00"));
    expect(closing.title).toBe("Registration closes tomorrow");
    expect(closing.href).toBe("/registration");
    expect(closing.type).toBe("REGISTRATION_CLOSING_SOON");
  });
});

describe("deadlineTriggers", () => {
  const now = at("2026-10-13T10:00:00");
  const d = (id: string, dueAt: string, submitted = false) => ({ id, courseId: "COSC 204", title: "Lab 3", kind: "assignment" as const, dueAt, submitted });

  it("reminds once, inside the last 24 hours, for unsubmitted work only", () => {
    const out = deadlineTriggers([d("a", "2026-10-14T09:00:00"), d("b", "2026-10-16T09:00:00"), d("c", "2026-10-13T18:00:00", true), d("e", "2026-10-12T09:00:00")], now, (id) => id);
    expect(keys(out)).toEqual(["deadline-24h:a"]);
    expect(out[0].title).toBe("COSC 204 assignment due tomorrow");
    expect(out[0].href).toBe("/courses/COSC 204");
  });
});

describe("liveClassTriggers", () => {
  const live = { sessionId: "s1", courseId: "COSC 204", title: "COSC 204", venue: "SAT 101", startsAt: "2026-10-13T10:00:00", endsAt: "2026-10-13T12:00:00", checkedIn: false };

  it("nudges from 10 minutes before until the class ends", () => {
    expect(liveClassTriggers(live, at("2026-10-13T09:45:00"))).toEqual([]);
    expect(liveClassTriggers(live, at("2026-10-13T09:55:00"))[0].title).toBe("COSC 204 starts soon");
    expect(liveClassTriggers(live, at("2026-10-13T10:30:00"))[0].title).toBe("COSC 204 has started");
    expect(liveClassTriggers(live, at("2026-10-13T12:30:00"))).toEqual([]);
  });

  it("stays quiet once checked in", () => {
    expect(liveClassTriggers({ ...live, checkedIn: true }, at("2026-10-13T10:30:00"))).toEqual([]);
  });
});
