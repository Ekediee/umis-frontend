/**
 * Student API: the single seam between the phase-1 screens and the backend.
 *
 * Each method declares its live contract beside its mock. Paths are the ones
 * proposed in the "Requirements & API plan" doc for ICT to confirm. The course
 * list itself comes from the live registration API (`registered-course`),
 * which already exists; demo courses are used only in mock mode when that
 * call fails (no backend in local development).
 */

import { getRegisteredCoursesAction } from "@/app/actions/academic-details";
import * as mock from "../mock/handlers";
import { DEMO_COURSES, type SeedCourse } from "../mock/seed";
import type { CheckInResult, CourseAttendance, CourseQuestion, CourseSpace, CourseSpaceDetail, Deadline, LiveClass, NotificationPrefs, PeerAnswer, StudySession } from "../types";
import { call, enc, STUDENT_API_MODE } from "./http";

let coursesPromise: Promise<SeedCourse[]> | null = null;

/** Registered courses for this semester; cached for the page session. */
export function registeredCourses(): Promise<SeedCourse[]> {
  coursesPromise ??= getRegisteredCoursesAction()
    .then((res) => {
      if (res.data && res.data.length > 0) return res.data.map((c) => ({ courseId: c.courseId, title: c.title, instructor: c.instructor, units: c.units, isCarryOver: c.isCarryOver, classOption: c.classOption }));
      if (STUDENT_API_MODE === "mock") return DEMO_COURSES;
      return [];
    })
    .catch(() => (STUDENT_API_MODE === "mock" ? DEMO_COURSES : []));
  return coursesPromise;
}

const withCourses = <T>(fn: (c: SeedCourse[]) => Promise<T>) => () => registeredCourses().then(fn);

export const studentApi = {
  // ── Course Spaces ────────────────────────────────────────────────────────
  listSpaces: () => call<CourseSpace[]>(withCourses(mock.listSpaces), { method: "GET", path: "/courses" }),
  getSpace: (courseId: string) => call<CourseSpaceDetail>(withCourses((c) => mock.getSpace(c, courseId)), { method: "GET", path: `/courses/${enc(courseId)}` }),
  markFeedRead: (courseId: string, ids: string[]) => call(() => mock.markFeedRead(ids), { method: "POST", path: `/courses/${enc(courseId)}/feed/read`, body: { ids } }),
  askQuestion: (courseId: string, body: string, anonymous: boolean) =>
    call<CourseQuestion>(withCourses((c) => mock.askQuestion(c, courseId, body, anonymous)), { method: "POST", path: `/courses/${enc(courseId)}/questions`, body: { body, anonymous }, idempotent: true }),
  answerQuestion: (courseId: string, questionId: string, body: string) =>
    call<PeerAnswer>(withCourses((c) => mock.answerQuestion(c, courseId, questionId, body)), { method: "POST", path: `/questions/${enc(questionId)}/answers`, body: { body }, idempotent: true }),
  voteQuestion: (courseId: string, questionId: string) =>
    call<{ upvotes: number; myVote: boolean }>(withCourses((c) => mock.voteQuestion(c, courseId, questionId)), { method: "POST", path: `/questions/${enc(questionId)}/vote` }),
  voteAnswer: (courseId: string, questionId: string, answerId: string) =>
    call<{ upvotes: number; myVote: boolean }>(withCourses((c) => mock.voteAnswer(c, courseId, questionId, answerId)), { method: "POST", path: `/answers/${enc(answerId)}/vote` }),
  setVisibleToClassmates: (courseId: string, visible: boolean) =>
    call<{ visible: boolean }>(() => mock.setVisibleToClassmates(courseId, visible), { method: "PUT", path: `/courses/${enc(courseId)}/classmates/visibility`, body: { visible } }),
  getDeadlines: () => call<Deadline[]>(withCourses(mock.getDeadlines), { method: "GET", path: "/deadlines" }),

  // ── Attendance ───────────────────────────────────────────────────────────
  getAttendance: () => call<CourseAttendance[]>(withCourses(mock.getAttendance), { method: "GET", path: "/attendance" }),
  getLiveClass: () => call<LiveClass | null>(withCourses(mock.getLiveClass), { method: "GET", path: "/attendance/live" }),
  /** `token` from a scanned QR (signed by the backend in live mode) or the 6-digit `code`. */
  checkIn: (input: { token?: string; code?: string }) =>
    call<CheckInResult>(withCourses((c) => mock.checkIn(c, input)), { method: "POST", path: "/attendance/check-in", body: input, idempotent: true }),

  // ── Study sessions ───────────────────────────────────────────────────────
  getStudySessions: () => call<StudySession[]>(withCourses(mock.getStudySessions), { method: "GET", path: "/study-sessions" }),
  logStudySession: (s: Omit<StudySession, "id" | "pending"> & { id?: string }) =>
    call<StudySession>(() => mock.logStudySession(s), { method: "POST", path: "/study-sessions", body: s, idempotent: true }),

  // ── Notifications ────────────────────────────────────────────────────────
  getNotificationPrefs: () => call<NotificationPrefs>(() => mock.getNotificationPrefs(), { method: "GET", path: "/notification-preferences" }),
  saveNotificationPrefs: (patch: Partial<NotificationPrefs>) =>
    call<NotificationPrefs>(() => mock.saveNotificationPrefs(patch), { method: "PATCH", path: "/notification-preferences", body: patch }),
  /** Stores this device's push subscription; the backend sends through POST /api/push/send. */
  savePushSubscription: (subscription: PushSubscriptionJSON) =>
    call<{ ok: true }>(() => mock.savePushSubscription(subscription), { method: "POST", path: "/push-subscriptions", body: subscription, idempotent: true }),
  deletePushSubscription: (endpoint: string) =>
    call<{ ok: true }>(() => mock.deletePushSubscription(endpoint), { method: "DELETE", path: `/push-subscriptions?endpoint=${enc(endpoint)}` }),
};

/** Mock mode only: the code a lecturer's screen is showing for the demo class. */
export async function demoLiveCode() {
  if (STUDENT_API_MODE !== "mock") return null;
  return mock.demoLiveCode(await registeredCourses());
}
