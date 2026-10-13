/**
 * Mock implementations of the student endpoints. Each one mirrors a live
 * contract declared beside it in `../api/index.ts`.
 */

import { ApiError } from "@/lib/api/error";
import { decodeMockToken, totpCode, verifyTotpCode } from "@/lib/attendance/code";
import { attendancePercent } from "../rules";
import type {
  AttendanceMark,
  CheckInResult,
  CourseAttendance,
  CourseQuestion,
  CourseSpace,
  CourseSpaceDetail,
  Deadline,
  LiveClass,
  NotificationPrefs,
  StudySession,
} from "../types";
import { db, latency, save } from "./db";
import { hash, seedAttendance, seedClassmates, seedDeadlines, seedFeed, seedMaterials, seedQuestions, type SeedCourse } from "./seed";

const LATE_AFTER_MIN = 15;
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);

function questionsFor(c: SeedCourse): CourseQuestion[] {
  const s = db();
  if (!s.questions[c.courseId]) {
    s.questions[c.courseId] = seedQuestions(c, Date.now());
    save();
  }
  return s.questions[c.courseId];
}

function find(courses: SeedCourse[], courseId: string) {
  const c = courses.find((x) => x.courseId.toLowerCase() === courseId.toLowerCase());
  if (!c) throw new ApiError("We couldn't find that course in your registration for this semester.", "CRS-404", 404);
  return c;
}

function spaceOf(c: SeedCourse, i: number, deadlines: Deadline[]): CourseSpace {
  const s = db();
  const feed = seedFeed(c, Date.now());
  const now = Date.now();
  return {
    courseId: c.courseId,
    title: c.title,
    instructor: c.instructor,
    units: c.units,
    classOption: c.classOption,
    isCarryOver: c.isCarryOver,
    tone: hash(c.courseId) % 6,
    unreadPosts: feed.filter((p) => !p.read && !s.readPosts.includes(p.id)).length,
    openQuestions: questionsFor(c).filter((q) => q.answers.length === 0).length,
    materialsCount: seedMaterials(c, now).length,
    nextDeadline:
      deadlines
        .filter((d) => d.courseId === c.courseId && !d.submitted && new Date(d.dueAt).getTime() > now)
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0] ?? null,
  };
}

// ── Course Spaces ─────────────────────────────────────────────────────────────

export async function listSpaces(courses: SeedCourse[]): Promise<CourseSpace[]> {
  await latency();
  const deadlines = seedDeadlines(courses, Date.now());
  return courses.map((c, i) => spaceOf(c, i, deadlines));
}

export async function getSpace(courses: SeedCourse[], courseId: string): Promise<CourseSpaceDetail> {
  await latency();
  const c = find(courses, courseId);
  const s = db();
  const now = Date.now();
  const deadlines = seedDeadlines(courses, now);
  return {
    space: spaceOf(c, courses.indexOf(c), deadlines),
    feed: seedFeed(c, now).map((p) => ({ ...p, read: p.read || s.readPosts.includes(p.id) })),
    materials: seedMaterials(c, now),
    questions: [...questionsFor(c)].sort((a, b) => Number(!!b.pinnedFaq) - Number(!!a.pinnedFaq) || b.upvotes - a.upvotes || b.askedAt.localeCompare(a.askedAt)),
    classmates: seedClassmates(c),
    visibleToClassmates: s.visibleToClassmates[c.courseId] ?? false,
  };
}

export async function markFeedRead(ids: string[]) {
  const s = db();
  s.readPosts = [...new Set([...s.readPosts, ...ids])];
  save();
  return { ok: true as const };
}

export async function askQuestion(courses: SeedCourse[], courseId: string, body: string, anonymous: boolean): Promise<CourseQuestion> {
  await latency(300);
  const c = find(courses, courseId);
  const text = body.trim();
  if (text.length < 10) throw new ApiError("Add a little more detail so classmates can help (at least 10 characters).", "QA-400", 400);
  const q: CourseQuestion = { id: uid(), courseId: c.courseId, body: text, askedBy: anonymous ? null : "You", mine: true, upvotes: 0, myVote: false, askedAt: new Date().toISOString(), answers: [] };
  questionsFor(c).unshift(q);
  save();
  return q;
}

export async function answerQuestion(courses: SeedCourse[], courseId: string, questionId: string, body: string) {
  await latency(300);
  const c = find(courses, courseId);
  const q = questionsFor(c).find((x) => x.id === questionId);
  if (!q) throw new ApiError("That question was removed.", "QA-404", 404);
  const text = body.trim();
  if (text.length < 2) throw new ApiError("Write an answer first.", "QA-400", 400);
  const a = { id: uid(), body: text, author: "You", at: new Date().toISOString(), upvotes: 0, myVote: false, verified: false, byLecturer: false };
  q.answers.push(a);
  save();
  return a;
}

export async function voteQuestion(courses: SeedCourse[], courseId: string, questionId: string) {
  const c = find(courses, courseId);
  const q = questionsFor(c).find((x) => x.id === questionId);
  if (!q) throw new ApiError("That question was removed.", "QA-404", 404);
  q.myVote = !q.myVote;
  q.upvotes += q.myVote ? 1 : -1;
  save();
  return { upvotes: q.upvotes, myVote: q.myVote };
}

export async function voteAnswer(courses: SeedCourse[], courseId: string, questionId: string, answerId: string) {
  const c = find(courses, courseId);
  const a = questionsFor(c)
    .find((x) => x.id === questionId)
    ?.answers.find((x) => x.id === answerId);
  if (!a) throw new ApiError("That answer was removed.", "QA-404", 404);
  a.myVote = !a.myVote;
  a.upvotes += a.myVote ? 1 : -1;
  save();
  return { upvotes: a.upvotes, myVote: a.myVote };
}

export async function setVisibleToClassmates(courseId: string, visible: boolean) {
  await latency(150);
  db().visibleToClassmates[courseId] = visible;
  save();
  return { visible };
}

export async function getDeadlines(courses: SeedCourse[]): Promise<Deadline[]> {
  await latency(120);
  return seedDeadlines(courses, Date.now()).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

// ── Attendance ────────────────────────────────────────────────────────────────

function liveSlot() {
  const s = db();
  if (!s.liveClass || s.liveClass.day !== today()) {
    // Demo: a class started 9 minutes ago, so check-in is open and on time.
    const start = Date.now() - 9 * 60_000;
    s.liveClass = { day: today(), startsAt: new Date(start).toISOString(), endsAt: new Date(start + 110 * 60_000).toISOString() };
    save();
  }
  return s.liveClass;
}

const liveSeed = (courseId: string) => `live:${courseId}:${today()}`;

export async function getAttendance(courses: SeedCourse[]): Promise<CourseAttendance[]> {
  await latency();
  const s = db();
  const now = Date.now();
  return courses.map((c, i) => {
    const history = [...seedAttendance(c, i, courses.length, now), ...(s.checkins[c.courseId] ?? []).map(({ date, mark }) => ({ date, mark }))];
    const count = (m: AttendanceMark) => history.filter((h) => h.mark === m).length;
    const base = { held: history.length, attended: count("present"), late: count("late"), excused: count("excused") };
    return { courseId: c.courseId, title: c.title, ...base, percent: attendancePercent(base), history: history.slice().reverse() };
  });
}

export async function getLiveClass(courses: SeedCourse[]): Promise<LiveClass | null> {
  await latency(120);
  const c = courses[0];
  if (!c) return null;
  const slot = liveSlot();
  const checked = (db().checkins[c.courseId] ?? []).some((x) => x.date === today());
  return { sessionId: liveSeed(c.courseId), courseId: c.courseId, title: c.title, venue: "Science and Technology", startsAt: slot.startsAt, endsAt: slot.endsAt, checkedIn: checked };
}

/** Demo only: the code a lecturer's screen would be showing right now. */
export function demoLiveCode(courses: SeedCourse[]) {
  const c = courses[0];
  return c ? totpCode(liveSeed(c.courseId)) : null;
}

export async function checkIn(courses: SeedCourse[], input: { token?: string; code?: string }): Promise<CheckInResult> {
  await latency(450);
  const live = await getLiveClass(courses);
  if (!live) throw new ApiError("No class is taking attendance right now.", "ATT-404", 404);

  let ok = false;
  if (input.token) {
    const t = decodeMockToken(input.token);
    ok = !!t && t.seed === live.sessionId && verifyTotpCode(t.seed, t.code);
    if (!ok) throw new ApiError("This QR code has expired. Codes change every 30 seconds, so scan the one on screen now.", "ATT-410", 410);
  } else if (input.code) {
    ok = verifyTotpCode(live.sessionId, input.code);
    if (!ok) throw new ApiError("That code doesn't match. Check the screen and try the newest code.", "ATT-401", 401);
  }
  if (!ok) throw new ApiError("Scan the QR code or type the 6-digit code on screen.", "ATT-400", 400);
  if (live.checkedIn) throw new ApiError("You're already checked in to this class.", "ATT-409", 409);

  const late = (Date.now() - new Date(live.startsAt).getTime()) / 60_000 > LATE_AFTER_MIN;
  const mark = late ? "late" : "present";
  const s = db();
  (s.checkins[live.courseId] ??= []).push({ date: today(), mark, sessionId: live.sessionId });
  save();
  const all = await getAttendance(courses);
  return { courseId: live.courseId, title: live.title, venue: live.venue, mark, at: new Date().toISOString(), percent: all.find((a) => a.courseId === live.courseId)?.percent ?? 100 };
}

// ── Study sessions ────────────────────────────────────────────────────────────

function seedStudy(courses: SeedCourse[]) {
  const s = db();
  if (s.seededSessions || courses.length === 0) return;
  // A few sessions earlier this week so the insights card isn't empty on first open.
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const picks = [
    { back: Math.min(dayOfWeek, 3), course: 0, minutes: 50 },
    { back: Math.min(dayOfWeek, 2), course: 1, minutes: 25 },
    { back: Math.min(dayOfWeek, 1), course: 0, minutes: 35 },
  ];
  picks.forEach((p, i) => {
    if (dayOfWeek === 0 && p.back === 0 && i > 0) return;
    const d = new Date(now);
    d.setDate(d.getDate() - p.back);
    d.setHours(19, 10 * i, 0, 0);
    if (d.getTime() > now.getTime()) return;
    const c = courses[p.course % courses.length];
    s.sessions.push({ id: uid(), courseId: c.courseId, startedAt: d.toISOString(), minutes: p.minutes });
  });
  s.seededSessions = true;
  save();
}

export async function getStudySessions(courses: SeedCourse[]): Promise<StudySession[]> {
  await latency(120);
  seedStudy(courses);
  return [...db().sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function logStudySession(input: Omit<StudySession, "id" | "pending"> & { id?: string }): Promise<StudySession> {
  await latency(150);
  const s = db();
  const session = { ...input, id: input.id ?? uid() };
  if (!s.sessions.some((x) => x.id === session.id)) s.sessions.push(session);
  save();
  return session;
}

// ── Notification settings ─────────────────────────────────────────────────────

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  await latency(100);
  return db().prefs;
}

export async function saveNotificationPrefs(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
  await latency(150);
  const s = db();
  s.prefs = { ...s.prefs, ...patch, categories: { ...s.prefs.categories, ...(patch.categories ?? {}) }, quietHours: { ...s.prefs.quietHours, ...(patch.quietHours ?? {}) } };
  save();
  return s.prefs;
}

// ── Push subscriptions ────────────────────────────────────────────────────────
// Mock mode keeps the subscription on this device only; nothing can send to it
// until the backend stores it and calls POST /api/push/send.

const PUSH_KEY = "pulse-student:mock:push-subscription";

export async function savePushSubscription(subscription: PushSubscriptionJSON) {
  await latency(120);
  try {
    localStorage.setItem(PUSH_KEY, JSON.stringify(subscription));
  } catch {
    // ignore
  }
  return { ok: true as const };
}

export async function deletePushSubscription(endpoint: string) {
  await latency(80);
  try {
    const raw = localStorage.getItem(PUSH_KEY);
    if (raw && (JSON.parse(raw) as PushSubscriptionJSON).endpoint === endpoint) localStorage.removeItem(PUSH_KEY);
  } catch {
    // ignore
  }
  return { ok: true as const };
}
