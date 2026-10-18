/**
 * BU Pulse — Lecturer domain types.
 *
 * These mirror the shapes we expect from the BU Pulse-backed lecturer API.
 * Keep them UI-agnostic: no display strings that belong in `format.ts`, and
 * never expose internal BU Pulse IDs (e.g. Course Item 234841) on screen.
 */

// ── Identity & roles ─────────────────────────────────────────────────────────

export type LecturerRole = "lecturer" | "course_advisor" | "supervisor" | "hod" | "dean";

export interface Lecturer {
  instructorId: string; // BU Pulse instructor id, e.g. "NIYI" — never public
  title: string; // "Dr."
  firstName: string;
  lastName: string;
  email: string | null; // blank in BU Pulse for many staff (1.1b)
  phone: string | null; // private, BU Pulse-owned
  office: string | null;
  photoUrl: string | null;
  bio: string;
  school: string;
  department: string;
  campus: string;
  roles: LecturerRole[];
  levelsApproving: number[];
  researchAreas: string[];
  orcid: string | null;
  publications: { title: string; venue: string; year: number; doi?: string }[];
  /** Fields the lecturer chose to show on their public staff page (9.1a). */
  publicFields: Record<PublicField, boolean>;
}

export type PublicField = "photo" | "email" | "office" | "officeHours" | "courses" | "researchAreas" | "publications";

export interface NotificationPrefs {
  email: boolean;
  push: boolean;
}

// ── Semesters ────────────────────────────────────────────────────────────────

export interface Semester {
  /** BU Pulse code, e.g. "2026/2027.1" — never shown raw. */
  code: string;
  session: string; // "2026/2027"
  term: string; // "1", "2", "3", "M", "1T", "1P", "2T" …
  start: string; // ISO date
  end: string;
  active: boolean;
  /** True when the signed-in lecturer has classes in it (drives default). */
  hasMyClasses: boolean;
}

// ── Courses ──────────────────────────────────────────────────────────────────

export interface CourseGroup {
  id: string;
  label: string; // "A"
  option: string; // BU Pulse option, e.g. "Soft Eng Group A"
  enrolled: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  level: number;
  semesterCode: string;
  groups: CourseGroup[];
  week: number;
  totalWeeks: number;
  attendanceAvg: number; // 0–100
  caWeight: number; // default 40
  examWeight: number; // default 60
  isGradeOwner: boolean;
  coLecturers: string[];
  topics: string[]; // weekly topics, index = week - 1
  /** Data-quality issue surfaced to the lecturer (2.1b). */
  dataIssue?: { kind: "duplicate-title"; otherCode: string };
}

// ── Students & enrolment ────────────────────────────────────────────────────

export interface Student {
  id: string;
  matric: string;
  firstName: string;
  lastName: string;
  programme: string;
  level: number;
  photoUrl: string | null;
  advisorName: string;
}

export type ExamStatus = "absent" | "incomplete";
export type StudentTag = "carry-over" | "other-programme";

export interface Enrolment {
  studentId: string;
  courseId: string;
  groupId: string;
  attendancePct: number;
  /** assessmentId → score; null = not entered (never coerced to 0). */
  caScores: Record<string, number | null>;
  examScore: number | null;
  examStatus?: ExamStatus;
  examStatusReason?: string;
  status: "active" | "dropped";
  droppedOn?: string;
  tags: StudentTag[];
  flaggedAtRisk: boolean;
  privateNote?: string;
}

export interface CourseStudentRow {
  student: Student;
  enrolment: Enrolment;
  caTotal: number | null;
  signals: RiskSignal[];
}

export type RiskSignal =
  | { kind: "attendance"; value: number }
  | { kind: "missed-ca"; assessment: string }
  | { kind: "projected-ca"; value: number; outOf: number };

// ── Timetable & attendance ──────────────────────────────────────────────────

export interface ClassSession {
  id: string;
  courseId: string;
  groupIds: string[];
  /** 1 = Monday … 7 = Sunday */
  day: number;
  start: string; // "10:00"
  end: string; // "12:00"
  venue: string;
  building: string;
  source: "registry" | "lecturer";
  online?: { link: string };
  cancelled?: boolean;
}

export type AttendanceStatus = "present" | "late" | "absent" | "excused";
export type AttendanceMethod = "code" | "list" | "photo";

export interface Register {
  id: string;
  sessionId: string;
  date: string;
  method: AttendanceMethod;
  marks: Record<string, AttendanceStatus>; // studentId → status
  savedAt: string;
}

// ── Materials, announcements, Q&A ───────────────────────────────────────────

export interface Material {
  id: string;
  courseId: string;
  week: number;
  name: string;
  kind: "pdf" | "pptx" | "docx" | "image" | "link" | "paper";
  sizeKb?: number;
  url?: string;
  releaseAt?: string; // scheduled → clock icon, lecturer only
  groupIds: string[]; // empty = all groups
  doi?: string;
}

export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  body: string;
  groupIds: string[];
  pinned: boolean;
  alsoEmail: boolean;
  sentAt: string;
  recipients: number;
  seenBy: number | null; // null until 1h after send
}

export interface Question {
  id: string;
  courseId: string;
  body: string;
  askedBy: string; // lecturer always sees the name
  anonymousToClassmates: boolean;
  upvotes: number;
  askedAt: string;
  answer?: { body: string; at: string };
  coveredInClass?: boolean;
  pinnedFaq?: boolean;
}

// ── Assessment & grading ────────────────────────────────────────────────────

export type AssessmentType = "test" | "assignment" | "project" | "presentation";

export interface Assessment {
  id: string;
  courseId: string;
  name: string;
  type: AssessmentType;
  maxMarks: number;
  dueDate: string | null;
  mode: "online" | "paper";
  released: boolean;
  groupIds: string[];
}

export type GradeSheetStatus = "open" | "with_hod" | "returned" | "with_dean" | "with_registry" | "released";

export interface GradeSheetEvent {
  status: GradeSheetStatus;
  at: string;
  by: string;
  note?: string;
}

export interface GradeSheet {
  id: string;
  courseId: string;
  groupId: string;
  status: GradeSheetStatus;
  dueDate: string;
  history: GradeSheetEvent[];
  returnNote?: string;
  /** Rows the HOD highlighted; only these unlock when Returned (5B.6). */
  returnedStudentIds?: string[];
}

export type Letter = "A" | "B" | "C" | "D" | "E" | "F";

// ── Course advising (Stage 6) ───────────────────────────────────────────────

export type RegistrationStatus = "not_submitted" | "to_review" | "returned" | "approved_advisor" | "approved_school";

export interface RegistrationCourse {
  code: string;
  title: string;
  units: number;
  carryOver?: boolean;
}

export interface RegistrationCheck {
  id: "units" | "prerequisites" | "carry-overs" | "clashes";
  label: string;
  passed: boolean;
  detail?: string;
  /** Pre-filled return reason when the check fails (6.2a). */
  suggestedReason?: ReturnReason;
}

export type ReturnReason = "missing-carry-over" | "too-many-units" | "too-few-units" | "wrong-elective" | "other";

export interface Registration {
  id: string;
  student: Student;
  status: RegistrationStatus;
  submittedAt: string | null;
  cgpa: number;
  standing: "Good" | "Probation" | "Warning";
  courses: RegistrationCourse[];
  checks: RegistrationCheck[];
  resubmitted?: { changes: string[] };
  returned?: { reasons: ReturnReason[]; note: string; at: string };
  decidedAt?: string;
}

export interface AdvisingWindow {
  level: number;
  advisees: number;
  closesAt: string;
}

// ── Supervision (Stage 7) ───────────────────────────────────────────────────

export type ChapterState = "drafting" | "submitted" | "changes_requested" | "approved";
export type ProjectType = "Dissertation" | "Thesis" | "Project";

export interface ReviewComment {
  id: string;
  paragraphId: string;
  quote: string;
  body: string;
  suggestion?: string;
  author: string;
  at: string;
  resolved: boolean;
}

export interface Paragraph {
  id: string;
  text: string;
  /** Present when the paragraph changed since the last review. */
  changedSinceReview?: boolean;
  aiAssisted?: boolean;
}

export interface CitationFlag {
  source: string;
  issue: "missing-doi" | "unverified-source";
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  state: ChapterState;
  words: number;
  citations: number;
  submittedAt?: string;
  changedAfterApproval?: boolean;
  citationFlags: CitationFlag[];
  paragraphs: Paragraph[];
  comments: ReviewComment[];
}

export interface Milestone {
  id: string;
  label: string;
  due: string;
  done: boolean;
}

export interface SupervisionProject {
  id: string;
  student: Student;
  title: string;
  type: ProjectType;
  lastActivity: string;
  chapters: Chapter[];
  milestones: Milestone[];
  meetingLog: { id: string; date: string; discussed: string; nextSteps: string }[];
}

export interface SupervisionRequest {
  id: string;
  student: Student;
  title: string;
  type: ProjectType;
  assignedBy: string;
  at: string;
  /** Lecturer raised a concern; pending until the HOD confirms or reassigns. */
  concernRaised?: boolean;
}

// ── Office hours (Stage 8) ──────────────────────────────────────────────────

export interface OfficeHourSlot {
  id: string;
  day: number;
  start: string;
  end: string;
  slotMinutes: number;
  location: string;
  online?: string;
  audience: "my-students" | "advisees" | "supervisees" | "anyone";
}

export interface Booking {
  id: string;
  student: Student;
  date: string;
  start: string;
  end: string;
  topic: string;
  note?: string;
}

// ── Today, notifications, search ────────────────────────────────────────────

export type TaskKind =
  | "registrations"
  | "chapters"
  | "grades-due"
  | "grades-returned"
  | "questions"
  | "attendance"
  | "bookings"
  | "profile-gap";

export type Urgency = "normal" | "soon" | "overdue";

export interface TodayTask {
  id: string;
  kind: TaskKind;
  /** Count read first by screen readers ("14 registrations to approve"). */
  count: number;
  title: string;
  detail: string;
  deadline?: string;
  urgency: Urgency;
  href: string;
}

export interface TodayPayload {
  greetingName: string;
  nextClass: (ClassSession & { course: Pick<Course, "id" | "code" | "title">; groupLabels: string[]; topic?: string; startsAt: string }) | null;
  tasks: TodayTask[];
  week: { date: string; classes: number; deadlines: string[] }[];
  nextDeadline: { label: string; date: string; href: string } | null;
  sync: SyncStatus;
}

export interface SyncStatus {
  /** Course and student records service (BU Pulse API). */
  records: "ok" | "down";
  lastSyncedAt: string;
  queued: number;
}

export type NotificationKind = "grades" | "registration" | "supervision" | "qa" | "booking" | "system" | "attendance";

export interface LecturerNotification {
  id: string;
  kind: NotificationKind;
  course?: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href: string;
}

export interface SearchResult {
  kind: "course" | "student" | "project";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface DepartmentInfo {
  schoolCode: string;
  schoolName: string;
  departmentCode: string;
  departmentName: string;
  vision: string | null;
  mission: string | null;
  hod: string;
  advisorsByLevel: { level: number; name: string }[];
  programmes: { name: string; years: number }[];
  catalogue: { code: string; title: string; units: number; level: number; prerequisites: string[]; teaching?: string; possibleDuplicateOf?: string }[];
}
