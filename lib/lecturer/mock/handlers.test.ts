import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "./db";
import * as api from "./handlers";

const SEM = "2026/2027.1";

beforeEach(() => resetDb());

describe("Today (1.2)", () => {
  it("builds the Needs you list from the audit scenario", async () => {
    const t = await api.getToday(SEM);
    const kinds = t.tasks.map((x) => x.kind);
    expect(kinds).toEqual(expect.arrayContaining(["registrations", "chapters", "grades-due", "grades-returned", "questions", "attendance", "bookings", "profile-gap"]));
    expect(t.tasks.find((x) => x.kind === "registrations")?.detail).toBe("14 students waiting. Registration closes 18 Oct.");
    expect(t.tasks.find((x) => x.kind === "chapters")?.detail).toBe("3 chapters submitted. Oldest waiting 6 days.");
    expect(t.tasks.find((x) => x.kind === "grades-due")?.detail).toBe("SEN 201 Group B: 41 of 58 scores entered. Due 2 Dec.");
    expect(t.tasks.find((x) => x.kind === "attendance")?.detail).toBe("No register for BU-CSC 333 on Tue 6 Oct");
    expect(t.tasks.find((x) => x.kind === "bookings")?.detail).toBe("2 students booked 2:00 to 3:00 pm");
  });

  it("puts the next class first: SEN 201 Group A at 10:00", async () => {
    const t = await api.getToday(SEM);
    expect(t.nextClass).toMatchObject({ start: "10:00", course: { code: "SEN 201" }, groupLabels: ["A"] });
  });

  it("supports the all-clear and records-down states", async () => {
    expect((await api.getToday(SEM, "clear")).tasks).toEqual([]);
    expect((await api.getToday(SEM, "down")).sync.records).toBe("down");
  });

  it("drops the attendance card once a register is saved", async () => {
    await api.saveRegister({ sessionId: "ses-bucsc333", date: "2026-10-06", method: "list", marks: { x: "present" } });
    expect((await api.getToday(SEM)).tasks.some((x) => x.kind === "attendance")).toBe(false);
  });
});

describe("Courses (2.1)", () => {
  it("shows groups of one course on one card", async () => {
    const { current, earlier } = await api.getCourses(SEM);
    const sen = current.find((c) => c.code === "SEN 201")!;
    expect(sen.groups.map((g) => g.label)).toEqual(["A", "B", "C"]);
    expect(sen.enrolledTotal).toBe(164);
    expect(current).toHaveLength(4);
    expect(earlier.length).toBeGreaterThan(0);
  });
});

describe("Advising (6)", () => {
  it("bulk approve refuses rows with a failed check (6.4)", async () => {
    const { registrations } = await api.getAdvising();
    const review = registrations.filter((r) => r.status === "to_review");
    const failed = review.find((r) => r.checks.some((c) => !c.passed))!;
    const passed = review.find((r) => r.checks.every((c) => c.passed))!;
    const res = await api.approveRegistrations([failed.id, passed.id]);
    expect(res.approved).toEqual([passed.id]);
    expect(res.refused).toEqual([failed.id]);
  });

  it("returning requires a reason", async () => {
    const { registrations } = await api.getAdvising();
    const r = registrations.find((x) => x.status === "to_review")!;
    await expect(api.returnRegistration(r.id, [], "short")).rejects.toMatchObject({ code: "REG-422" });
    const ok = await api.returnRegistration(r.id, ["other"], "");
    expect(ok.status).toBe("returned");
  });
});

describe("Grade sheets (5B)", () => {
  it("won't submit an incomplete sheet, and submit is idempotent", async () => {
    await expect(api.submitGradeSheet("sen-201", "sen-201:B")).rejects.toMatchObject({ code: "GR-5B2" });
    const sheet = await api.getGradeSheet("sen-201", "sen-201:B");
    for (const row of sheet.rows.filter((r) => r.enrolment.status === "active" && r.enrolment.examScore === null)) {
      await api.saveExamScore("sen-201", "sen-201:B", row.student.id, 30);
    }
    const first = await api.submitGradeSheet("sen-201", "sen-201:B");
    expect(first.sheet.status).toBe("with_hod");
    const second = await api.submitGradeSheet("sen-201", "sen-201:B");
    expect(second.alreadySubmitted).toBe(true);
  });

  it("a returned sheet only unlocks the highlighted rows (5B.6)", async () => {
    const sheet = await api.getGradeSheet("cosc-333", "cosc-333:SE");
    const highlighted = sheet.sheet.returnedStudentIds!;
    expect(highlighted).toHaveLength(2);
    const other = sheet.rows.find((r) => !highlighted.includes(r.student.id))!;
    await expect(api.saveExamScore("cosc-333", "cosc-333:SE", other.student.id, 40)).rejects.toMatchObject({ code: "GR-423" });
    await expect(api.saveExamScore("cosc-333", "cosc-333:SE", highlighted[0], 41)).resolves.toEqual({ ok: true });
  });

  it("co-taught courses: only the grade owner submits", async () => {
    await expect(api.submitGradeSheet("bu-csc-333", "bu-csc-333:E")).rejects.toMatchObject({ code: expect.stringMatching(/GR-/) });
  });
});

describe("Search (1.3)", () => {
  it("only returns the lecturer's own students and needs 2+ characters", async () => {
    expect(await api.search("a")).toEqual([]);
    const r = await api.search("Okafor");
    expect(r.some((x) => x.kind === "student")).toBe(true);
  });
});
