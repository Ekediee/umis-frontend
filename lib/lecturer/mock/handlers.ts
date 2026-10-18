/**
 * Mock implementations of every lecturer API endpoint.
 *
 * Each handler mirrors the contract in `../api/index.ts`. When the BU Pulse
 * API is connected, these stay as the offline/demo fallback and test fixtures.
 */

import { DEMO_NOW, getDb } from "./db";
import { caTotal, gradeRow, preSubmitCheck } from "../grading";
import { deadlineUrgency, riskSignals, waitingUrgency } from "../rules";
import { daysBetween, formatSemester, fullName, isoDay, minutes, plural, shortDate, startOfDay, timeRange, dayDate, localDate } from "../format";
import type {
  AttendanceStatus,
  ClassSession,
  Course,
  CourseStudentRow,
  Enrolment,
  GradeSheet,
  Lecturer,
  NotificationPrefs,
  OfficeHourSlot,
  Registration,
  ReturnReason,
  ReviewComment,
  SearchResult,
  Student,
  TodayPayload,
  TodayTask,
  Assessment,
  AttendanceMethod,
} from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const LATENCY = 280;
export const now = () => new Date(DEMO_NOW);

function respond<T>(value: T, ms = LATENCY): Promise<T> {
  const copy = structuredClone(value);
  return new Promise((resolve) => setTimeout(() => resolve(copy), ms));
}

export class MockApiError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

function fail(message: string, code: string): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new MockApiError(message, code)), LATENCY));
}

const course = (id: string) => {
  const c = getDb().courses.find((x) => x.id === id);
  if (!c) throw new MockApiError("We couldn't find that course.", "CRS-404");
  return c;
};

const lecturerName = (l: Lecturer) => `${l.title} ${l.firstName} ${l.lastName}`;

/** Next concrete start Date for a weekly session, on/after `from`. */
function nextOccurrence(s: ClassSession, from: Date) {
  const base = startOfDay(from);
  for (let i = 0; i < 8; i++) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    if (isoDay(day) !== s.day) continue;
    const [h, m] = s.end.split(":").map(Number);
    const end = new Date(day);
    end.setHours(h, m);
    if (end <= from) continue;
    const [sh, sm] = s.start.split(":").map(Number);
    const start = new Date(day);
    start.setHours(sh, sm);
    return start;
  }
  return null;
}

function groupLabels(c: Course, groupIds: string[]) {
  return c.groups.filter((g) => groupIds.includes(g.id)).map((g) => g.label);
}

function courseAssessments(courseId: string) {
  return getDb().assessments.filter((a) => a.courseId === courseId);
}

function releasedCount(courseId: string) {
  const list = courseAssessments(courseId);
  return { graded: list.filter((a) => a.released).length, planned: list.length };
}

/** Class occurrences in the last 7 days that ended with no register (3.3). */
function missingRegisters() {
  const db = getDb();
  const n = now();
  const missing: { session: ClassSession; date: Date }[] = [];
  for (let back = 0; back <= 7; back++) {
    const date = startOfDay(n);
    date.setDate(date.getDate() - back);
    for (const s of db.sessions.filter((x) => x.day === isoDay(date) && !x.cancelled)) {
      const end = new Date(date);
      const [h, m] = s.end.split(":").map(Number);
      end.setHours(h, m);
      if (end > n) continue;
      const has = db.registers.some((r) => r.sessionId === s.id && startOfDay(new Date(r.date)).getTime() === date.getTime());
      if (!has) missing.push({ session: s, date });
    }
  }
  return missing;
}

// ── Session & profile ───────────────────────────────────────────────────────

export function getSession() {
  const db = getDb();
  return respond({ lecturer: db.lecturer, prefs: db.prefs, onboarded: db.onboarded }, 120);
}

export function completeOnboarding(input: { prefs: NotificationPrefs; office: string | null; email: string | null }) {
  const db = getDb();
  db.prefs = input.prefs;
  if (input.office) db.lecturer.office = input.office;
  if (input.email) db.lecturer.email = input.email;
  db.onboarded = true;
  return respond({ ok: true });
}

export function updateProfile(patch: Partial<Pick<Lecturer, "email" | "phone" | "office" | "bio" | "researchAreas" | "orcid" | "publicFields">>) {
  const db = getDb();
  Object.assign(db.lecturer, patch);
  return respond(db.lecturer);
}

export function reportMistake(input: { field: string; problem: string; shouldBe: string }) {
  const db = getDb();
  const id = `rep-${db.reports.length + 1}`;
  db.reports.push({ id, ...input, at: now().toISOString() });
  return respond({ ok: true, reference: `MIS-${String(db.reports.length).padStart(4, "0")}` });
}

export function getSemesters() {
  return respond(getDb().semesters, 100);
}

// ── Today (1.2) ─────────────────────────────────────────────────────────────

export function getToday(semesterCode: string, simulate?: string | null): Promise<TodayPayload> {
  const db = getDb();
  const n = now();
  const current = db.courses.filter((c) => c.semesterCode === semesterCode);
  const sessions = db.sessions.filter((s) => current.some((c) => c.id === s.courseId) && !s.cancelled);

  // Next class
  let next: TodayPayload["nextClass"] = null;
  let nextAt: Date | null = null;
  for (const s of sessions) {
    const at = nextOccurrence(s, n);
    if (at && (!nextAt || at < nextAt)) {
      nextAt = at;
      const c = current.find((x) => x.id === s.courseId)!;
      next = { ...s, course: { id: c.id, code: c.code, title: c.title }, groupLabels: groupLabels(c, s.groupIds), topic: c.topics[c.week - 1], startsAt: at.toISOString() };
    }
  }

  const tasks: TodayTask[] = [];
  const l = db.lecturer;

  if (l.roles.includes("course_advisor")) {
    const waiting = db.registrations.filter((r) => r.status === "to_review").length;
    if (waiting) {
      tasks.push({
        id: "t-reg",
        kind: "registrations",
        count: waiting,
        title: `${plural(waiting, "registration")} to approve`,
        detail: `${plural(waiting, "student")} waiting. Registration closes ${shortDate(db.advising.closesAt)}.`,
        deadline: db.advising.closesAt,
        urgency: deadlineUrgency(db.advising.closesAt, n, 2),
        href: "/lecturer/advising",
      });
    }
  }

  const submitted = db.projects.flatMap((p) => p.chapters.filter((c) => c.state === "submitted").map((c) => c.submittedAt!));
  if (submitted.length) {
    const oldest = submitted.sort()[0];
    const days = daysBetween(oldest, n);
    tasks.push({
      id: "t-chapters",
      kind: "chapters",
      count: submitted.length,
      title: `${plural(submitted.length, "chapter")} to review`,
      detail: `${plural(submitted.length, "chapter")} submitted. Oldest waiting ${plural(days, "day")}.`,
      urgency: waitingUrgency(oldest, n, 7),
      href: "/lecturer/supervision",
    });
  }

  for (const sheet of db.gradeSheets.filter((g) => current.some((c) => c.id === g.courseId))) {
    const c = course(sheet.courseId);
    const group = c.groups.find((g) => g.id === sheet.groupId)!;
    const groupName = c.groups.length > 1 ? ` Group ${group.label}` : "";
    const rows = db.enrolments.filter((e) => e.groupId === sheet.groupId && e.status === "active");
    if (sheet.status === "returned") {
      tasks.push({
        id: `t-ret-${sheet.id}`,
        kind: "grades-returned",
        count: sheet.returnedStudentIds?.length ?? 1,
        title: `${c.code} grades returned`,
        detail: `${c.code}${groupName} returned by HOD: ${sheet.returnNote?.replace(/^./, (x) => x.toLowerCase())}`,
        urgency: "soon",
        href: `/lecturer/courses/${c.id}/grades?group=${encodeURIComponent(sheet.groupId)}`,
      });
      continue;
    }
    if (sheet.status !== "open" || !c.isGradeOwner) continue;
    const entered = rows.filter((e) => e.examScore !== null || e.examStatus).length;
    const urgency = deadlineUrgency(sheet.dueDate, n, 7);
    if (entered > 0 || urgency !== "normal") {
      tasks.push({
        id: `t-due-${sheet.id}`,
        kind: "grades-due",
        count: rows.length - entered,
        title: `${c.code}${groupName} grades due`,
        detail: `${c.code}${groupName}: ${entered} of ${rows.length} scores entered. Due ${shortDate(sheet.dueDate)}.`,
        deadline: sheet.dueDate,
        urgency,
        href: `/lecturer/courses/${c.id}/grades?group=${encodeURIComponent(sheet.groupId)}`,
      });
    }
  }

  for (const c of current) {
    const stale = db.questions.filter((q) => q.courseId === c.id && !q.answer && !q.coveredInClass && n.getTime() - new Date(q.askedAt).getTime() > 86_400_000);
    if (stale.length) {
      tasks.push({
        id: `t-qa-${c.id}`,
        kind: "questions",
        count: stale.length,
        title: `${plural(stale.length, "unanswered question")} in ${c.code}`,
        detail: `Oldest asked ${plural(daysBetween(stale.map((q) => q.askedAt).sort()[0], n), "day")} ago. Students see answers instantly.`,
        urgency: "soon",
        href: `/lecturer/courses/${c.id}?tab=qa`,
      });
    }
  }

  for (const m of missingRegisters()) {
    const c = course(m.session.courseId);
    tasks.push({
      id: `t-att-${m.session.id}-${m.date.getDate()}`,
      kind: "attendance",
      count: 1,
      title: `Attendance not taken`,
      detail: `No register for ${c.code} on ${dayDate(m.date)}`,
      urgency: "soon",
      href: `/lecturer/courses/${c.id}/attendance?session=${m.session.id}&date=${localDate(m.date)}`,
    });
  }

  const todays = db.bookings.filter((b) => daysBetween(b.date, n) === 0);
  if (todays.length) {
    const start = todays.map((b) => b.start).sort()[0];
    const endMax = todays.map((b) => b.end).sort().at(-1)!;
    const end = `${String(Math.ceil(minutes(endMax) / 60)).padStart(2, "0")}:00`;
    tasks.push({
      id: "t-book",
      kind: "bookings",
      count: todays.length,
      title: `${plural(todays.length, "office-hour booking")} today`,
      detail: `${plural(todays.length, "student")} booked ${timeRange(start, end)}`,
      urgency: "normal",
      href: "/lecturer/office-hours",
    });
  }

  if (!l.email || !l.office) {
    tasks.push({
      id: "t-profile",
      kind: "profile-gap",
      count: Number(!l.email) + Number(!l.office),
      title: "Complete your profile",
      detail: !l.email ? "Add your email so students can reach you" : "Add your office so students can find you",
      urgency: "normal",
      href: "/lecturer/profile",
    });
  }

  // This week (Mon–Sun)
  const monday = startOfDay(n);
  monday.setDate(monday.getDate() - (isoDay(n) - 1));
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const deadlines: string[] = [];
    if (daysBetween(db.advising.closesAt, date) === 0) deadlines.push("Registration closes");
    db.assessments
      .filter((a) => a.dueDate && daysBetween(a.dueDate, date) === 0 && current.some((c) => c.id === a.courseId))
      .forEach((a) => deadlines.push(`${course(a.courseId).code} ${a.name}`));
    db.projects.forEach((p) => p.milestones.filter((m) => !m.done && daysBetween(m.due, date) === 0).forEach((m) => deadlines.push(`${p.student.firstName}: ${m.label}`)));
    return { date: date.toISOString(), classes: sessions.filter((s) => s.day === i + 1).length, deadlines };
  });

  const upcoming = db.assessments
    .filter((a) => a.dueDate && new Date(a.dueDate) > n && current.some((c) => c.id === a.courseId))
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))[0];

  const order: Record<TodayTask["urgency"], number> = { overdue: 0, soon: 1, normal: 2 };
  tasks.sort((a, b) => order[a.urgency] - order[b.urgency]);

  const lastSync = new Date(n);
  lastSync.setHours(7, 40, 0, 0);

  return respond({
    greetingName: `${l.title} ${l.lastName}`,
    nextClass: next,
    tasks: simulate === "clear" ? [] : tasks,
    week,
    nextDeadline: upcoming ? { label: `${upcoming.name} scores for ${course(upcoming.courseId).code}`, date: upcoming.dueDate!, href: `/lecturer/courses/${upcoming.courseId}?tab=assessments` } : null,
    sync: { records: simulate === "down" ? "down" : "ok", lastSyncedAt: lastSync.toISOString(), queued: simulate === "down" ? 2 : 0 },
  });
}

// ── Courses (Stage 2) ───────────────────────────────────────────────────────

export interface CourseSummary extends Course {
  enrolledTotal: number;
  caGraded: number;
  caPlanned: number;
}

function summarise(c: Course): CourseSummary {
  const { graded, planned } = releasedCount(c.id);
  return { ...c, enrolledTotal: c.groups.reduce((s, g) => s + g.enrolled, 0), caGraded: graded, caPlanned: planned };
}

export function getCourses(semesterCode: string) {
  const db = getDb();
  return respond({
    current: db.courses.filter((c) => c.semesterCode === semesterCode).map(summarise),
    earlier: db.courses.filter((c) => c.semesterCode !== semesterCode && c.semesterCode < semesterCode).map(summarise),
    registrationOpen: { until: db.advising.closesAt },
  });
}

export function getCourse(courseId: string) {
  const db = getDb();
  const c = course(courseId);
  const n = now();
  const sessions = db.sessions.filter((s) => s.courseId === courseId);
  const next = sessions
    .map((s) => ({ s, at: nextOccurrence(s, n) }))
    .filter((x) => x.at && !x.s.cancelled)
    .sort((a, b) => a.at!.getTime() - b.at!.getTime())[0];
  const assessments = courseAssessments(courseId);
  const deadlines = assessments.filter((a) => a.dueDate && new Date(a.dueDate) > n).map((a) => ({ label: a.name, date: a.dueDate! }));
  const sheet = db.gradeSheets.find((g) => g.courseId === courseId);
  if (sheet && sheet.status === "open") deadlines.push({ label: "Final grades", date: sheet.dueDate });
  return respond({
    course: summarise(c),
    sessions,
    nextSession: next ? { ...next.s, startsAt: next.at!.toISOString(), groupLabels: groupLabels(c, next.s.groupIds) } : null,
    lastAnnouncement: db.announcements.filter((a) => a.courseId === courseId).sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0] ?? null,
    deadlines: deadlines.sort((a, b) => a.date.localeCompare(b.date)),
    unansweredQuestions: db.questions.filter((q) => q.courseId === courseId && !q.answer && !q.coveredInClass).length,
    gradeSheets: db.gradeSheets.filter((g) => g.courseId === courseId),
  });
}

function rowsFor(courseId: string, groupId?: string | null): CourseStudentRow[] {
  const db = getDb();
  const c = course(courseId);
  const assessments = courseAssessments(courseId);
  return db.enrolments
    .filter((e) => e.courseId === courseId && (!groupId || groupId === "all" || e.groupId === groupId))
    .map((e) => ({
      student: db.students.get(e.studentId)!,
      enrolment: e,
      caTotal: caTotal(e, assessments.filter((a) => a.released), c.caWeight),
      signals: e.status === "active" ? riskSignals(e, assessments, { week: c.week, caWeight: c.caWeight, now: now() }) : [],
    }))
    .sort((a, b) => Number(a.enrolment.status === "dropped") - Number(b.enrolment.status === "dropped") || a.student.lastName.localeCompare(b.student.lastName));
}

export function getClassList(courseId: string, groupId?: string | null) {
  return respond(rowsFor(courseId, groupId));
}

export function flagStudent(courseId: string, studentId: string, note: string) {
  const e = getDb().enrolments.find((x) => x.courseId === courseId && x.studentId === studentId);
  if (!e) return fail("Student not found in this course.", "STU-404");
  e.flaggedAtRisk = true;
  e.privateNote = [e.privateNote, note].filter(Boolean).join("\n");
  return respond({ ok: true, advisor: getDb().students.get(studentId)?.advisorName ?? "their advisor" });
}

export function saveStudentNote(courseId: string, studentId: string, note: string) {
  const e = getDb().enrolments.find((x) => x.courseId === courseId && x.studentId === studentId);
  if (e) e.privateNote = note;
  return respond({ ok: true });
}

export function messageStudents(studentIds: string[], body: string) {
  return respond({ ok: true, sent: studentIds.length, body });
}

export function reportDuplicate(courseId: string) {
  const c = course(courseId);
  return respond({ ok: true, reference: `DUP-${c.code.replace(/\W/g, "")}` });
}

export function askHod(semesterCode: string) {
  return respond({ ok: true, message: `Asked your HOD about course allocation for ${formatSemester(semesterCode)}.` });
}

// ── Materials, announcements, Q&A (Stage 4) ─────────────────────────────────

export function getMaterials(courseId: string) {
  return respond(getDb().materials.filter((m) => m.courseId === courseId));
}

export function uploadMaterial(input: { courseId: string; week: number; name: string; sizeKb: number; releaseAt?: string; groupIds: string[] }) {
  const db = getDb();
  const ext = input.name.split(".").pop()?.toLowerCase();
  const kind = ext === "pdf" ? "pdf" : ext === "pptx" || ext === "ppt" ? "pptx" : ext === "docx" || ext === "doc" ? "docx" : ext && ["png", "jpg", "jpeg"].includes(ext) ? "image" : "link";
  const m = { id: `mat-${Date.now()}`, courseId: input.courseId, week: input.week, name: input.name, kind, sizeKb: input.sizeKb, releaseAt: input.releaseAt, groupIds: input.groupIds } as const;
  db.materials.push({ ...m });
  return respond(m, 150);
}

export function deleteMaterial(id: string) {
  const db = getDb();
  db.materials = db.materials.filter((m) => m.id !== id);
  return respond({ ok: true, restoreUntilDays: 30 });
}

export function searchCorpus(q: string) {
  const papers = [
    { title: "Model-driven requirements in Nigerian SMEs", authors: "Ogunleye, A.; Bello, K.", year: 2024, doi: "10.5555/bu.2024.0417", openAccess: true },
    { title: "Continuous integration practices in West African start-ups", authors: "Afolabi, T.", year: 2025, doi: "10.5555/bu.2025.0088", openAccess: true },
    { title: "A study of UML adoption among final-year students", authors: "Okafor, C.; Musa, H.", year: 2023, doi: "10.5555/bu.2023.0231", openAccess: false },
    { title: "Refactoring legacy banking software: a case study", authors: "Eze, N.", year: 2022, doi: "10.5555/bu.2022.0019", openAccess: true },
  ];
  const term = q.trim().toLowerCase();
  return respond(term ? papers.filter((p) => p.title.toLowerCase().includes(term) || p.authors.toLowerCase().includes(term)) : papers, 200);
}

export function addReading(courseId: string, week: number, paper: { title: string; doi: string }) {
  getDb().materials.push({ id: `mat-${Date.now()}`, courseId, week, name: paper.title, kind: "paper", doi: paper.doi, groupIds: [] });
  return respond({ ok: true });
}

export function getAnnouncements(courseId: string) {
  return respond(getDb().announcements.filter((a) => a.courseId === courseId).sort((a, b) => b.sentAt.localeCompare(a.sentAt)));
}

export function postAnnouncement(input: { courseId: string; title: string; body: string; groupIds: string[]; alsoEmail: boolean; pinned: boolean; urgent: boolean }) {
  const db = getDb();
  const c = course(input.courseId);
  const groups = input.groupIds.length ? c.groups.filter((g) => input.groupIds.includes(g.id)) : c.groups;
  const recipients = groups.reduce((s, g) => s + g.enrolled, 0);
  const n = now();
  const quiet = !input.urgent && (n.getHours() >= 22 || n.getHours() < 6);
  const a = { id: `ann-${Date.now()}`, ...input, sentAt: n.toISOString(), recipients, seenBy: null };
  db.announcements.push(a);
  return respond({ announcement: a, heldUntil0600: quiet, groupLabels: groups.map((g) => g.label) });
}

export function getQuestions(courseId: string) {
  const list = getDb().questions.filter((q) => q.courseId === courseId);
  // newest unanswered first, then answered
  return respond(list.sort((a, b) => Number(!!a.answer || !!a.coveredInClass) - Number(!!b.answer || !!b.coveredInClass) || b.askedAt.localeCompare(a.askedAt)));
}

export function answerQuestion(id: string, body: string) {
  const q = getDb().questions.find((x) => x.id === id);
  if (!q) return fail("That question was removed.", "QA-404");
  q.answer = { body, at: now().toISOString() };
  return respond({ ok: true, notified: 1 + q.upvotes });
}

export function updateQuestion(id: string, patch: { coveredInClass?: boolean; pinnedFaq?: boolean }) {
  const q = getDb().questions.find((x) => x.id === id);
  if (q) Object.assign(q, patch);
  return respond({ ok: true });
}

// ── Assessments & scores (Stage 5A) ─────────────────────────────────────────

export function getAssessments(courseId: string) {
  const db = getDb();
  const c = course(courseId);
  const rows = db.enrolments.filter((e) => e.courseId === courseId && e.status === "active");
  return respond({
    course: summarise(c),
    assessments: courseAssessments(courseId).map((a) => ({
      ...a,
      entered: rows.filter((e) => e.caScores[a.id] !== null && e.caScores[a.id] !== undefined).length,
      total: rows.length,
      submissions: a.mode === "online" && a.dueDate ? { submitted: Math.round(rows.length * 0.83), late: 3 } : null,
    })),
  });
}

export function createAssessment(input: Omit<Assessment, "id" | "released">) {
  const db = getDb();
  const a: Assessment = { ...input, id: `${input.courseId}:a${Date.now()}`, released: false };
  db.assessments.push(a);
  db.enrolments.filter((e) => e.courseId === input.courseId).forEach((e) => (e.caScores[a.id] = null));
  return respond(a);
}

export function getScoreSheet(courseId: string, assessmentId: string, groupId?: string | null) {
  const db = getDb();
  const a = db.assessments.find((x) => x.id === assessmentId);
  if (!a) return fail("That assessment no longer exists.", "CA-404");
  const rows = db.enrolments
    .filter((e) => e.courseId === courseId && e.status === "active" && (!groupId || groupId === "all" || e.groupId === groupId))
    .map((e) => ({ student: db.students.get(e.studentId)!, groupId: e.groupId, score: e.caScores[assessmentId] ?? null }))
    .sort((x, y) => x.student.lastName.localeCompare(y.student.lastName));
  return respond({ course: summarise(course(courseId)), assessment: a, rows });
}

/** Saves one cell as typed (5A.4). */
export function saveCaScore(courseId: string, assessmentId: string, studentId: string, score: number | null) {
  const db = getDb();
  const a = db.assessments.find((x) => x.id === assessmentId)!;
  if (score !== null && score > a.maxMarks) return fail(`${a.name} is out of ${a.maxMarks}.`, "CA-422");
  const e = db.enrolments.find((x) => x.courseId === courseId && x.studentId === studentId);
  if (e) e.caScores[assessmentId] = score;
  return respond({ ok: true }, 120);
}

export function releaseAssessment(assessmentId: string, input: { comment?: string; showAverage: boolean }) {
  const db = getDb();
  const a = db.assessments.find((x) => x.id === assessmentId)!;
  a.released = true;
  const n = db.enrolments.filter((e) => e.courseId === a.courseId && e.status === "active").length;
  return respond({ ok: true, students: n, ...input });
}

/** Excel import preview (5A.4a). Nothing saves until confirmed. */
export function previewImport(courseId: string, rows: { matric: string; score: string }[]) {
  const db = getDb();
  const byMatric = new Map(db.enrolments.filter((e) => e.courseId === courseId).map((e) => [db.students.get(e.studentId)!.matric, e.studentId]));
  const seen = new Set<string>();
  const result = { matched: 0, unknown: [] as string[], duplicates: [] as string[] };
  for (const r of rows) {
    if (seen.has(r.matric)) result.duplicates.push(r.matric);
    else if (byMatric.has(r.matric)) result.matched++;
    else result.unknown.push(r.matric);
    seen.add(r.matric);
  }
  return respond(result);
}

// ── Final grades (Stage 5B) ─────────────────────────────────────────────────

export function getGradeSheet(courseId: string, groupId: string) {
  const db = getDb();
  const c = course(courseId);
  const sheet = db.gradeSheets.find((g) => g.courseId === courseId && g.groupId === groupId);
  if (!sheet) return fail("No grade sheet for this group yet. The registry opens it when the grade window starts.", "GR-404");
  const assessments = courseAssessments(courseId);
  const enrolments = db.enrolments.filter((e) => e.courseId === courseId && e.groupId === groupId);
  const rows = enrolments.map((e) => ({ student: db.students.get(e.studentId)!, enrolment: e, grade: gradeRow(e, assessments, c.caWeight) }));
  rows.sort((a, b) => a.student.lastName.localeCompare(b.student.lastName));
  return respond({ course: summarise(c), sheet, rows, check: preSubmitCheck(enrolments, assessments, c.caWeight), assessments });
}

function sheetEditable(sheet: GradeSheet, studentId: string) {
  if (sheet.status === "open") return true;
  if (sheet.status === "returned") return sheet.returnedStudentIds?.includes(studentId) ?? false;
  return false;
}

export function saveExamScore(courseId: string, groupId: string, studentId: string, score: number | null) {
  const db = getDb();
  const c = course(courseId);
  const sheet = db.gradeSheets.find((g) => g.courseId === courseId && g.groupId === groupId)!;
  if (!sheetEditable(sheet, studentId)) return fail("This row is locked. Only highlighted rows can change.", "GR-423");
  if (score !== null && score > c.examWeight) return fail(`Exam is out of ${c.examWeight}.`, "GR-422");
  const e = db.enrolments.find((x) => x.courseId === courseId && x.studentId === studentId)!;
  e.examScore = score;
  if (score !== null) {
    e.examStatus = undefined;
    e.examStatusReason = undefined;
  }
  return respond({ ok: true }, 100);
}

export function setExamStatus(courseId: string, studentId: string, status: Enrolment["examStatus"] | null, reason: string) {
  const e = getDb().enrolments.find((x) => x.courseId === courseId && x.studentId === studentId)!;
  e.examStatus = status ?? undefined;
  e.examStatusReason = status ? reason : undefined;
  if (status) e.examScore = null;
  return respond({ ok: true });
}

/** Idempotent: a second submit returns the current status (5B rules). */
export function submitGradeSheet(courseId: string, groupId: string, lateReason?: string) {
  const db = getDb();
  const c = course(courseId);
  const sheet = db.gradeSheets.find((g) => g.courseId === courseId && g.groupId === groupId)!;
  if (sheet.status !== "open" && sheet.status !== "returned") return respond({ sheet, alreadySubmitted: true });
  if (!c.isGradeOwner) return fail("Only the grade owner can submit. Your sheet is marked Ready for review.", "GR-403");
  const enrolments = db.enrolments.filter((e) => e.courseId === courseId && e.groupId === groupId);
  const check = preSubmitCheck(enrolments, courseAssessments(courseId), c.caWeight);
  if (!check.canSubmit) return fail("Some rows still need a score or a status.", "GR-5B2");
  const n = now();
  const late = new Date(sheet.dueDate) < n;
  sheet.status = "with_hod";
  sheet.returnedStudentIds = [];
  sheet.history.push({ status: "with_hod", at: n.toISOString(), by: lecturerName(db.lecturer), note: late ? `Late: ${lateReason ?? "no reason given"}` : undefined });
  return respond({ sheet, alreadySubmitted: false, pdfUrl: `/api/lecturer/grade-sheets/${sheet.id}.pdf` });
}

// ── Schedule & attendance (Stage 3) ─────────────────────────────────────────

export function getSchedule(semesterCode: string) {
  const db = getDb();
  const current = db.courses.filter((c) => c.semesterCode === semesterCode);
  const sessions = db.sessions
    .filter((s) => current.some((c) => c.id === s.courseId))
    .map((s) => {
      const c = current.find((x) => x.id === s.courseId)!;
      return { ...s, course: { id: c.id, code: c.code, title: c.title }, groupLabels: groupLabels(c, s.groupIds) };
    });
  const clashes: [string, string][] = [];
  for (let i = 0; i < sessions.length; i++)
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i];
      const b = sessions[j];
      if (a.day === b.day && !a.cancelled && !b.cancelled && minutes(a.start) < minutes(b.end) && minutes(b.start) < minutes(a.end)) clashes.push([a.id, b.id]);
    }
  return respond({
    officialPublished: sessions.some((s) => s.source === "registry"),
    registryExpected: "2026-10-14",
    sessions,
    clashes,
    courses: current.map((c) => ({ id: c.id, code: c.code, title: c.title, groups: c.groups })),
    officeHours: db.officeHours.slots,
  });
}

export function addClass(input: Omit<ClassSession, "id" | "source">) {
  const s: ClassSession = { ...input, id: `ses-${Date.now()}`, source: "lecturer" };
  getDb().sessions.push(s);
  return respond(s);
}

export function changeClass(sessionId: string, change: { kind: "cancel" } | { kind: "move"; day: number; start: string; end: string; venue: string } | { kind: "online"; link: string }, message: string) {
  const db = getDb();
  const s = db.sessions.find((x) => x.id === sessionId);
  if (!s) return fail("That class no longer exists.", "TT-404");
  if (change.kind === "cancel") s.cancelled = true;
  if (change.kind === "move") Object.assign(s, { day: change.day, start: change.start, end: change.end, venue: change.venue });
  if (change.kind === "online") s.online = { link: change.link };
  const c = course(s.courseId);
  const notified = c.groups.filter((g) => s.groupIds.includes(g.id)).reduce((t, g) => t + g.enrolled, 0);
  return respond({ ok: true, notified, message });
}

export function reportClash(a: string, b: string) {
  return respond({ ok: true, reference: `TT-${a.slice(-3)}${b.slice(-3)}`.toUpperCase() });
}

export function getAttendanceRoster(courseId: string, sessionId: string) {
  const db = getDb();
  const c = course(courseId);
  const s = db.sessions.find((x) => x.id === sessionId) ?? db.sessions.find((x) => x.courseId === courseId)!;
  const roster = db.enrolments
    .filter((e) => e.courseId === courseId && s.groupIds.includes(e.groupId) && e.status === "active")
    .map((e) => ({ student: db.students.get(e.studentId)!, groupId: e.groupId }))
    .sort((a, b) => a.student.lastName.localeCompare(b.student.lastName));
  return respond({ course: summarise(c), session: { ...s, groupLabels: groupLabels(c, s.groupIds) }, roster, topic: c.topics[c.week - 1] });
}

export function saveRegister(input: { sessionId: string; date: string; method: AttendanceMethod; marks: Record<string, AttendanceStatus> }) {
  const db = getDb();
  const id = `reg-${input.sessionId}-${input.date}`;
  db.registers = db.registers.filter((r) => r.id !== id);
  db.registers.push({ id, ...input, date: new Date(input.date).toISOString(), savedAt: now().toISOString() });
  const counts = { present: 0, late: 0, absent: 0, excused: 0 };
  Object.values(input.marks).forEach((m) => counts[m]++);
  return respond({ id, counts }, 200);
}

export function deleteRegister(id: string) {
  const db = getDb();
  db.registers = db.registers.filter((r) => r.id !== id);
  return respond({ ok: true }, 80);
}

// ── Advising (Stage 6) ──────────────────────────────────────────────────────

export function getAdvising() {
  const db = getDb();
  return respond({ window: db.advising, registrations: db.registrations });
}

export function getRegistration(id: string) {
  const r = getDb().registrations.find((x) => x.id === id);
  if (!r) return fail("We couldn't find that registration.", "REG-404");
  return respond(r);
}

export function approveRegistrations(ids: string[]) {
  const db = getDb();
  const approved: string[] = [];
  const refused: string[] = [];
  for (const id of ids) {
    const r = db.registrations.find((x) => x.id === id);
    if (!r || r.status !== "to_review") continue;
    if (ids.length > 1 && !r.checks.every((c) => c.passed)) {
      refused.push(id); // failed checks need a single decision (6.4)
      continue;
    }
    r.status = "approved_advisor";
    r.decidedAt = now().toISOString();
    approved.push(id);
  }
  return respond({ approved, refused });
}

export function returnRegistration(id: string, reasons: ReturnReason[], note: string) {
  const r = getDb().registrations.find((x) => x.id === id);
  if (!r) return fail("We couldn't find that registration.", "REG-404");
  if (!reasons.length && note.trim().length < 10) return fail("Pick a reason or write at least 10 characters.", "REG-422");
  r.status = "returned";
  r.returned = { reasons, note, at: now().toISOString() };
  r.decidedAt = r.returned.at;
  return respond(r);
}

export function remindNotSubmitted() {
  const n = getDb().registrations.filter((r) => r.status === "not_submitted").length;
  return respond({ ok: true, reminded: n });
}

// ── Supervision (Stage 7) ───────────────────────────────────────────────────

export function getSupervision() {
  const db = getDb();
  return respond({ projects: db.projects, requests: db.supervisionRequests });
}

export function respondToSupervision(id: string, decision: "accept" | "concern", note?: string) {
  const db = getDb();
  const req = db.supervisionRequests.find((r) => r.id === id);
  if (!req) return fail("This request was already handled.", "SUP-404");
  // A concern keeps the request pending until the HOD confirms or reassigns (7.1a).
  if (decision === "concern") req.concernRaised = true;
  if (decision === "accept") {
    db.supervisionRequests = db.supervisionRequests.filter((r) => r.id !== id);
    db.projects.push({
      id: `proj-${req.student.firstName.toLowerCase()}`,
      student: req.student,
      title: req.title,
      type: req.type,
      lastActivity: now().toISOString(),
      chapters: [{ id: `${id}-1`, number: 1, title: "Introduction", state: "drafting", words: 0, citations: 0, citationFlags: [], paragraphs: [], comments: [] }],
      milestones: [{ id: "m1", label: "Proposal defence", due: new Date(2026, 11, 4).toISOString(), done: false }],
      meetingLog: [],
    });
  }
  return respond({ ok: true, decision, note });
}

export function getProject(id: string) {
  const p = getDb().projects.find((x) => x.id === id);
  if (!p) return fail("You don't supervise this project, or it was reassigned.", "SUP-404");
  return respond(p);
}

export function addReviewComment(projectId: string, chapterId: string, input: Pick<ReviewComment, "paragraphId" | "quote" | "body" | "suggestion">) {
  const db = getDb();
  const ch = db.projects.find((p) => p.id === projectId)?.chapters.find((c) => c.id === chapterId);
  if (!ch) return fail("Chapter not found.", "SUP-404");
  const c: ReviewComment = { ...input, id: `c-${Date.now()}`, author: lecturerName(db.lecturer), at: now().toISOString(), resolved: false };
  ch.comments.push(c);
  return respond(c, 120);
}

export function deleteReviewComment(projectId: string, chapterId: string, commentId: string) {
  const ch = getDb().projects.find((p) => p.id === projectId)?.chapters.find((c) => c.id === chapterId);
  if (ch) ch.comments = ch.comments.filter((c) => c.id !== commentId);
  return respond({ ok: true }, 80);
}

export function decideChapter(projectId: string, chapterId: string, decision: "approve" | "changes", summary?: string) {
  const db = getDb();
  const p = db.projects.find((x) => x.id === projectId);
  const ch = p?.chapters.find((c) => c.id === chapterId);
  if (!p || !ch) return fail("Chapter not found.", "SUP-404");
  if (decision === "changes" && !summary?.trim()) return fail("Add a summary for the student.", "SUP-422");
  ch.state = decision === "approve" ? "approved" : "changes_requested";
  ch.changedAfterApproval = false;
  p.lastActivity = now().toISOString();
  return respond({ chapter: ch, open: ch.comments.filter((c) => !c.resolved).length });
}

export function addMeetingNote(projectId: string, entry: { discussed: string; nextSteps: string }) {
  const p = getDb().projects.find((x) => x.id === projectId)!;
  p.meetingLog.unshift({ id: `ml-${Date.now()}`, date: now().toISOString(), ...entry });
  return respond(p.meetingLog[0]);
}

// ── Office hours (Stage 8) ──────────────────────────────────────────────────

export function getOfficeHours() {
  const db = getDb();
  return respond({ ...db.officeHours, bookings: db.bookings.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)) });
}

export function saveOfficeHours(input: { slots: OfficeHourSlot[]; paused: boolean }) {
  const db = getDb();
  const clash = input.slots.find((slot) => db.sessions.some((s) => s.day === slot.day && !s.cancelled && minutes(s.start) < minutes(slot.end) && minutes(slot.start) < minutes(s.end)));
  if (clash) return fail("One slot overlaps a class. Pick another time.", "OH-409");
  db.officeHours = input;
  return respond(db.officeHours);
}

export function cancelBookings(ids: string[], message: string) {
  const db = getDb();
  const affected = db.bookings.filter((b) => ids.includes(b.id));
  db.bookings = db.bookings.filter((b) => !ids.includes(b.id));
  return respond({ ok: true, notified: affected.length, message });
}

// ── Notifications & search ──────────────────────────────────────────────────

export function getNotifications() {
  return respond([...getDb().notifications].sort((a, b) => b.at.localeCompare(a.at)), 150);
}

export function markNotificationsRead(ids: string[] | "all") {
  getDb().notifications.forEach((n) => {
    if (ids === "all" || ids.includes(n.id)) n.read = true;
  });
  return respond({ ok: true }, 60);
}

/** Scoped: only students in the lecturer's courses, advisees or supervisees (1.3). */
export function search(q: string): Promise<SearchResult[]> {
  const db = getDb();
  const term = q.trim().toLowerCase();
  if (term.length < 2) return respond([], 60);
  const results: SearchResult[] = [];
  db.courses
    .filter((c) => `${c.code} ${c.title}`.toLowerCase().includes(term))
    .slice(0, 5)
    .forEach((c) => results.push({ kind: "course", id: c.id, title: `${c.code} · ${c.title}`, subtitle: `${formatSemester(c.semesterCode)} · ${plural(c.groups.length, "group")}`, href: `/lecturer/courses/${c.id}` }));
  const seen = new Set<string>();
  const addStudent = (s: Student, subtitle: string, href: string) => {
    if (seen.has(s.id) || results.length > 24) return;
    if (!`${s.firstName} ${s.lastName} ${s.matric}`.toLowerCase().includes(term)) return;
    seen.add(s.id);
    results.push({ kind: "student", id: s.id, title: fullName(s), subtitle, href });
  };
  db.enrolments.forEach((e) => {
    const s = db.students.get(e.studentId)!;
    addStudent(s, `${s.matric} · ${course(e.courseId).code}`, `/lecturer/courses/${e.courseId}?tab=students&student=${s.id}`);
  });
  db.registrations.forEach((r: Registration) => addStudent(r.student, `${r.student.matric} · Advisee, Level ${r.student.level}`, `/lecturer/advising/${r.id}`));
  db.projects.forEach((p) => {
    addStudent(p.student, `${p.student.matric} · Supervisee`, `/lecturer/supervision/${p.id}`);
    if (p.title.toLowerCase().includes(term)) results.push({ kind: "project", id: p.id, title: p.title, subtitle: `${p.type} · ${fullName(p.student)}`, href: `/lecturer/supervision/${p.id}` });
  });
  return respond(results.slice(0, 20), 160);
}

// ── Department (Stage 9) ────────────────────────────────────────────────────

export function getDepartment() {
  return respond(getDb().department);
}

// ── Advisee support (8.4 / 8.5) ─────────────────────────────────────────────

const handled = new Map<string, string>();

export function getAtRiskQueue() {
  const db = getDb();
  const items: { id: string; student: Student; reason: string; raisedBy: string; at: string; handledNote?: string }[] = [];
  db.registrations
    .filter((r) => r.standing !== "Good")
    .forEach((r) => items.push({ id: `standing-${r.student.id}`, student: r.student, reason: `Academic standing: ${r.standing} (CGPA ${r.cgpa.toFixed(2)})`, raisedBy: "Standing rule", at: r.submittedAt ?? now().toISOString() }));
  // Lecturer flags on Level 100 advisees would arrive from other lecturers' courses (Stage 2).
  items.push({ id: "flag-demo", student: db.registrations[20].student, reason: "Attendance 58% in GEDS 101; missed CA 1", raisedBy: "Mrs. Yemi Olatunji (GEDS 101)", at: new Date(2026, 9, 5, 12).toISOString() });
  return respond(items.map((i) => ({ ...i, handledNote: handled.get(i.id) })));
}

export function markAtRiskHandled(id: string, note: string) {
  handled.set(id, note);
  return respond({ ok: true });
}

export function sendCheckIn(studentId: string, body: string) {
  return respond({ ok: true, studentId, body });
}
