/**
 * Lecturer API — the single seam between the UI and the BU Pulse API.
 *
 * Each method lists the live endpoint contract beside its mock. Paths are
 * proposals for ICT to confirm; response shapes are the types in `../types`.
 * Grades and registration approvals go through their approval chains.
 */

import * as mock from "../mock/handlers";
import { call, q } from "./http";
import type { Assessment, AttendanceMethod, AttendanceStatus, ClassSession, Enrolment, Lecturer, NotificationPrefs, OfficeHourSlot, ReturnReason, ReviewComment } from "../types";

type R<F extends (...args: never[]) => Promise<unknown>> = Awaited<ReturnType<F>>;
const enc = encodeURIComponent;

export type { CourseSummary } from "../mock/handlers";

export const lecturerApi = {
  // ── Session, profile (1.1, 9.1) ──────────────────────────────────────────
  getSession: () => call<R<typeof mock.getSession>>(() => mock.getSession(), { method: "GET", path: "/lecturer/me" }),
  completeOnboarding: (input: { prefs: NotificationPrefs; office: string | null; email: string | null }) =>
    call<R<typeof mock.completeOnboarding>>(() => mock.completeOnboarding(input), { method: "POST", path: "/lecturer/me/onboarding", body: input }),
  updateProfile: (patch: Partial<Pick<Lecturer, "email" | "phone" | "office" | "bio" | "researchAreas" | "orcid" | "publicFields">>) =>
    call<R<typeof mock.updateProfile>>(() => mock.updateProfile(patch), { method: "PATCH", path: "/lecturer/me", body: patch }),
  reportMistake: (input: { field: string; problem: string; shouldBe: string }) =>
    call<R<typeof mock.reportMistake>>(() => mock.reportMistake(input), { method: "POST", path: "/lecturer/data-reports", body: input }),
  getSemesters: () => call<R<typeof mock.getSemesters>>(() => mock.getSemesters(), { method: "GET", path: "/semesters?scope=lecturer" }),

  // ── Today (1.2) ──────────────────────────────────────────────────────────
  getToday: (semester: string, simulate?: string | null) =>
    call<R<typeof mock.getToday>>(() => mock.getToday(semester, simulate), { method: "GET", path: `/lecturer/today${q({ semester })}` }),
  search: (term: string) => call<R<typeof mock.search>>(() => mock.search(term), { method: "GET", path: `/lecturer/search${q({ q: term })}` }),
  getNotifications: () => call<R<typeof mock.getNotifications>>(() => mock.getNotifications(), { method: "GET", path: "/lecturer/notifications" }),
  markNotificationsRead: (ids: string[] | "all") =>
    call<R<typeof mock.markNotificationsRead>>(() => mock.markNotificationsRead(ids), { method: "POST", path: "/lecturer/notifications/read", body: { ids } }),

  // ── Courses (2) ──────────────────────────────────────────────────────────
  getCourses: (semester: string) => call<R<typeof mock.getCourses>>(() => mock.getCourses(semester), { method: "GET", path: `/lecturer/courses${q({ semester })}` }),
  getCourse: (id: string) => call<R<typeof mock.getCourse>>(() => mock.getCourse(id), { method: "GET", path: `/lecturer/courses/${enc(id)}` }),
  getClassList: (id: string, group?: string | null) =>
    call<R<typeof mock.getClassList>>(() => mock.getClassList(id, group), { method: "GET", path: `/lecturer/courses/${enc(id)}/students${q({ group })}` }),
  flagStudent: (courseId: string, studentId: string, note: string) =>
    call<R<typeof mock.flagStudent>>(() => mock.flagStudent(courseId, studentId, note), { method: "POST", path: `/lecturer/courses/${enc(courseId)}/students/${enc(studentId)}/flag`, body: { note } }),
  saveStudentNote: (courseId: string, studentId: string, note: string) =>
    call<R<typeof mock.saveStudentNote>>(() => mock.saveStudentNote(courseId, studentId, note), { method: "PUT", path: `/lecturer/courses/${enc(courseId)}/students/${enc(studentId)}/note`, body: { note } }),
  messageStudents: (studentIds: string[], body: string) =>
    call<R<typeof mock.messageStudents>>(() => mock.messageStudents(studentIds, body), { method: "POST", path: "/lecturer/messages", body: { studentIds, body } }),
  reportDuplicate: (courseId: string) =>
    call<R<typeof mock.reportDuplicate>>(() => mock.reportDuplicate(courseId), { method: "POST", path: `/lecturer/courses/${enc(courseId)}/duplicate-report` }),
  askHod: (semester: string) => call<R<typeof mock.askHod>>(() => mock.askHod(semester), { method: "POST", path: "/lecturer/allocation-requests", body: { semester } }),

  // ── Materials, announcements, Q&A (4) ────────────────────────────────────
  getMaterials: (courseId: string) => call<R<typeof mock.getMaterials>>(() => mock.getMaterials(courseId), { method: "GET", path: `/lecturer/courses/${enc(courseId)}/materials` }),
  uploadMaterial: (input: { courseId: string; week: number; name: string; sizeKb: number; releaseAt?: string; groupIds: string[] }) =>
    // Live: multipart upload with resumable chunks (4.1a); this JSON call registers the uploaded file.
    call<R<typeof mock.uploadMaterial>>(() => mock.uploadMaterial(input), { method: "POST", path: `/lecturer/courses/${enc(input.courseId)}/materials`, body: input }),
  deleteMaterial: (id: string) => call<R<typeof mock.deleteMaterial>>(() => mock.deleteMaterial(id), { method: "DELETE", path: `/lecturer/materials/${enc(id)}` }),
  searchCorpus: (term: string) => call<R<typeof mock.searchCorpus>>(() => mock.searchCorpus(term), { method: "GET", path: `/corpus/search${q({ q: term })}` }),
  addReading: (courseId: string, week: number, paper: { title: string; doi: string }) =>
    call<R<typeof mock.addReading>>(() => mock.addReading(courseId, week, paper), { method: "POST", path: `/lecturer/courses/${enc(courseId)}/readings`, body: { week, ...paper } }),
  getAnnouncements: (courseId: string) =>
    call<R<typeof mock.getAnnouncements>>(() => mock.getAnnouncements(courseId), { method: "GET", path: `/lecturer/courses/${enc(courseId)}/announcements` }),
  postAnnouncement: (input: { courseId: string; title: string; body: string; groupIds: string[]; alsoEmail: boolean; pinned: boolean; urgent: boolean }) =>
    call<R<typeof mock.postAnnouncement>>(() => mock.postAnnouncement(input), { method: "POST", path: `/lecturer/courses/${enc(input.courseId)}/announcements`, body: input, idempotent: true }),
  getQuestions: (courseId: string) => call<R<typeof mock.getQuestions>>(() => mock.getQuestions(courseId), { method: "GET", path: `/lecturer/courses/${enc(courseId)}/questions` }),
  answerQuestion: (id: string, body: string) =>
    call<R<typeof mock.answerQuestion>>(() => mock.answerQuestion(id, body), { method: "POST", path: `/lecturer/questions/${enc(id)}/answer`, body: { body } }),
  updateQuestion: (id: string, patch: { coveredInClass?: boolean; pinnedFaq?: boolean }) =>
    call<R<typeof mock.updateQuestion>>(() => mock.updateQuestion(id, patch), { method: "PATCH", path: `/lecturer/questions/${enc(id)}`, body: patch }),

  // ── Assessments (5A) ─────────────────────────────────────────────────────
  getAssessments: (courseId: string) =>
    call<R<typeof mock.getAssessments>>(() => mock.getAssessments(courseId), { method: "GET", path: `/lecturer/courses/${enc(courseId)}/assessments` }),
  createAssessment: (input: Omit<Assessment, "id" | "released">) =>
    call<R<typeof mock.createAssessment>>(() => mock.createAssessment(input), { method: "POST", path: `/lecturer/courses/${enc(input.courseId)}/assessments`, body: input }),
  getScoreSheet: (courseId: string, assessmentId: string, group?: string | null) =>
    call<R<typeof mock.getScoreSheet>>(() => mock.getScoreSheet(courseId, assessmentId, group), {
      method: "GET",
      path: `/lecturer/courses/${enc(courseId)}/assessments/${enc(assessmentId)}/scores${q({ group })}`,
    }),
  saveCaScore: (courseId: string, assessmentId: string, studentId: string, score: number | null) =>
    call<R<typeof mock.saveCaScore>>(() => mock.saveCaScore(courseId, assessmentId, studentId, score), {
      method: "PUT",
      path: `/lecturer/courses/${enc(courseId)}/assessments/${enc(assessmentId)}/scores/${enc(studentId)}`,
      body: { score },
    }),
  releaseAssessment: (assessmentId: string, input: { comment?: string; showAverage: boolean }) =>
    call<R<typeof mock.releaseAssessment>>(() => mock.releaseAssessment(assessmentId, input), { method: "POST", path: `/lecturer/assessments/${enc(assessmentId)}/release`, body: input, idempotent: true }),
  previewImport: (courseId: string, rows: { matric: string; score: string }[]) =>
    call<R<typeof mock.previewImport>>(() => mock.previewImport(courseId, rows), { method: "POST", path: `/lecturer/courses/${enc(courseId)}/imports/preview`, body: { rows } }),

  // ── Final grades (5B) — writes back to BU Pulse ────────────────────────
  getGradeSheet: (courseId: string, groupId: string) =>
    call<R<typeof mock.getGradeSheet>>(() => mock.getGradeSheet(courseId, groupId), { method: "GET", path: `/lecturer/courses/${enc(courseId)}/grade-sheets/${enc(groupId)}` }),
  saveExamScore: (courseId: string, groupId: string, studentId: string, score: number | null) =>
    call<R<typeof mock.saveExamScore>>(() => mock.saveExamScore(courseId, groupId, studentId, score), {
      method: "PUT",
      path: `/lecturer/courses/${enc(courseId)}/grade-sheets/${enc(groupId)}/rows/${enc(studentId)}`,
      body: { exam: score },
    }),
  setExamStatus: (courseId: string, studentId: string, status: Enrolment["examStatus"] | null, reason: string) =>
    call<R<typeof mock.setExamStatus>>(() => mock.setExamStatus(courseId, studentId, status, reason), {
      method: "PUT",
      path: `/lecturer/courses/${enc(courseId)}/students/${enc(studentId)}/exam-status`,
      body: { status, reason },
    }),
  submitGradeSheet: (courseId: string, groupId: string, lateReason?: string) =>
    call<R<typeof mock.submitGradeSheet>>(() => mock.submitGradeSheet(courseId, groupId, lateReason), {
      method: "POST",
      path: `/lecturer/courses/${enc(courseId)}/grade-sheets/${enc(groupId)}/submit`,
      body: { lateReason },
      idempotent: true,
    }),

  // ── Schedule & attendance (3) ────────────────────────────────────────────
  getSchedule: (semester: string) => call<R<typeof mock.getSchedule>>(() => mock.getSchedule(semester), { method: "GET", path: `/lecturer/timetable${q({ semester })}` }),
  addClass: (input: Omit<ClassSession, "id" | "source">) => call<R<typeof mock.addClass>>(() => mock.addClass(input), { method: "POST", path: "/lecturer/timetable/classes", body: input }),
  changeClass: (
    sessionId: string,
    change: { kind: "cancel" } | { kind: "move"; day: number; start: string; end: string; venue: string } | { kind: "online"; link: string },
    message: string,
  ) => call<R<typeof mock.changeClass>>(() => mock.changeClass(sessionId, change, message), { method: "POST", path: `/lecturer/timetable/classes/${enc(sessionId)}/change`, body: { change, message } }),
  reportClash: (a: string, b: string) => call<R<typeof mock.reportClash>>(() => mock.reportClash(a, b), { method: "POST", path: "/lecturer/timetable/clash-reports", body: { sessions: [a, b] } }),
  getAttendanceRoster: (courseId: string, sessionId: string) =>
    call<R<typeof mock.getAttendanceRoster>>(() => mock.getAttendanceRoster(courseId, sessionId), { method: "GET", path: `/lecturer/sessions/${enc(sessionId)}/roster` }),
  saveRegister: (input: { sessionId: string; date: string; method: AttendanceMethod; marks: Record<string, AttendanceStatus> }) =>
    call<R<typeof mock.saveRegister>>(() => mock.saveRegister(input), { method: "PUT", path: `/lecturer/sessions/${enc(input.sessionId)}/registers/${input.date}`, body: input, idempotent: true }),
  deleteRegister: (id: string) => call<R<typeof mock.deleteRegister>>(() => mock.deleteRegister(id), { method: "DELETE", path: `/lecturer/registers/${enc(id)}` }),

  // ── Advising (6) — writes back to BU Pulse ─────────────────────────────
  getAdvising: () => call<R<typeof mock.getAdvising>>(() => mock.getAdvising(), { method: "GET", path: "/lecturer/advising/registrations" }),
  getRegistration: (id: string) => call<R<typeof mock.getRegistration>>(() => mock.getRegistration(id), { method: "GET", path: `/lecturer/advising/registrations/${enc(id)}` }),
  approveRegistrations: (ids: string[]) =>
    call<R<typeof mock.approveRegistrations>>(() => mock.approveRegistrations(ids), { method: "POST", path: "/lecturer/advising/registrations/approve", body: { ids }, idempotent: true }),
  returnRegistration: (id: string, reasons: ReturnReason[], note: string) =>
    call<R<typeof mock.returnRegistration>>(() => mock.returnRegistration(id, reasons, note), { method: "POST", path: `/lecturer/advising/registrations/${enc(id)}/return`, body: { reasons, note }, idempotent: true }),
  remindNotSubmitted: () => call<R<typeof mock.remindNotSubmitted>>(() => mock.remindNotSubmitted(), { method: "POST", path: "/lecturer/advising/reminders" }),

  // ── Supervision (7) ──────────────────────────────────────────────────────
  getSupervision: () => call<R<typeof mock.getSupervision>>(() => mock.getSupervision(), { method: "GET", path: "/lecturer/supervision" }),
  respondToSupervision: (id: string, decision: "accept" | "concern", note?: string) =>
    call<R<typeof mock.respondToSupervision>>(() => mock.respondToSupervision(id, decision, note), { method: "POST", path: `/lecturer/supervision/requests/${enc(id)}`, body: { decision, note } }),
  getProject: (id: string) => call<R<typeof mock.getProject>>(() => mock.getProject(id), { method: "GET", path: `/lecturer/supervision/projects/${enc(id)}` }),
  addReviewComment: (projectId: string, chapterId: string, input: Pick<ReviewComment, "paragraphId" | "quote" | "body" | "suggestion">) =>
    call<R<typeof mock.addReviewComment>>(() => mock.addReviewComment(projectId, chapterId, input), {
      method: "POST",
      path: `/lecturer/supervision/projects/${enc(projectId)}/chapters/${enc(chapterId)}/comments`,
      body: input,
    }),
  deleteReviewComment: (projectId: string, chapterId: string, commentId: string) =>
    call<R<typeof mock.deleteReviewComment>>(() => mock.deleteReviewComment(projectId, chapterId, commentId), {
      method: "DELETE",
      path: `/lecturer/supervision/projects/${enc(projectId)}/chapters/${enc(chapterId)}/comments/${enc(commentId)}`,
    }),
  decideChapter: (projectId: string, chapterId: string, decision: "approve" | "changes", summary?: string) =>
    call<R<typeof mock.decideChapter>>(() => mock.decideChapter(projectId, chapterId, decision, summary), {
      method: "POST",
      path: `/lecturer/supervision/projects/${enc(projectId)}/chapters/${enc(chapterId)}/decision`,
      body: { decision, summary },
      idempotent: true,
    }),
  addMeetingNote: (projectId: string, entry: { discussed: string; nextSteps: string }) =>
    call<R<typeof mock.addMeetingNote>>(() => mock.addMeetingNote(projectId, entry), { method: "POST", path: `/lecturer/supervision/projects/${enc(projectId)}/meetings`, body: entry }),

  // ── Advisee support (8.4, 8.5) ───────────────────────────────────────────
  getAtRiskQueue: () => call<R<typeof mock.getAtRiskQueue>>(() => mock.getAtRiskQueue(), { method: "GET", path: "/lecturer/advising/at-risk" }),
  markAtRiskHandled: (id: string, note: string) =>
    call<R<typeof mock.markAtRiskHandled>>(() => mock.markAtRiskHandled(id, note), { method: "POST", path: `/lecturer/advising/at-risk/${enc(id)}/handled`, body: { note } }),
  sendCheckIn: (studentId: string, body: string) =>
    call<R<typeof mock.sendCheckIn>>(() => mock.sendCheckIn(studentId, body), { method: "POST", path: `/lecturer/advising/check-ins`, body: { studentId, body } }),

  // ── Office hours (8) ─────────────────────────────────────────────────────
  getOfficeHours: () => call<R<typeof mock.getOfficeHours>>(() => mock.getOfficeHours(), { method: "GET", path: "/lecturer/office-hours" }),
  saveOfficeHours: (input: { slots: OfficeHourSlot[]; paused: boolean }) =>
    call<R<typeof mock.saveOfficeHours>>(() => mock.saveOfficeHours(input), { method: "PUT", path: "/lecturer/office-hours", body: input }),
  cancelBookings: (ids: string[], message: string) =>
    call<R<typeof mock.cancelBookings>>(() => mock.cancelBookings(ids, message), { method: "POST", path: "/lecturer/office-hours/bookings/cancel", body: { ids, message } }),

  // ── Department (9.2) ─────────────────────────────────────────────────────
  getDepartment: () => call<R<typeof mock.getDepartment>>(() => mock.getDepartment(), { method: "GET", path: "/lecturer/department" }),
};

export type LecturerApi = typeof lecturerApi;
