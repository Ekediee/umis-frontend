/**
 * Shapes for the phase-1 student features (Course Spaces, attendance, study
 * insights, notifications). Materials and announcements use the same shape
 * the course team publishes, so both sides of the contract read the same objects.
 */

/** A course material as students see it (same shape the course team publishes) */
export interface Material {
  id: string;
  courseId: string;
  week: number;
  name: string;
  kind: "pdf" | "pptx" | "docx" | "image" | "link" | "paper";
  sizeKb?: number;
  url?: string;
  releaseAt?: string;
  groupIds: string[]; // empty = all groups
  doi?: string;
}

/** A course announcement */
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


// ── Course Spaces ─────────────────────────────────────────────────────────────

export interface CourseSpace {
  /** Course code as registration returns it, e.g. "COSC 204" */
  courseId: string;
  title: string;
  instructor: string;
  units: number;
  classOption?: string;
  isCarryOver: boolean;
  /** Index into the cover palette, stable per course */
  tone: number;
  unreadPosts: number;
  openQuestions: number;
  materialsCount: number;
  nextDeadline: Deadline | null;
}

export type FeedPostKind = "announcement" | "venue-change" | "cancellation" | "material";

export interface FeedPost extends Pick<Announcement, "id" | "courseId" | "title" | "body" | "pinned" | "sentAt"> {
  kind: FeedPostKind;
  author: string;
  /** Present when kind === "material" */
  materialId?: string;
  read: boolean;
}

export interface PeerAnswer {
  id: string;
  body: string;
  author: string;
  at: string;
  upvotes: number;
  myVote: boolean;
  /** Lecturer or TA marked this answer as correct */
  verified: boolean;
  byLecturer: boolean;
}

export interface CourseQuestion {
  id: string;
  courseId: string;
  body: string;
  /** "You" for the signed-in student; null when asked anonymously */
  askedBy: string | null;
  mine: boolean;
  upvotes: number;
  myVote: boolean;
  askedAt: string;
  answers: PeerAnswer[];
  coveredInClass?: boolean;
  pinnedFaq?: boolean;
}

export interface Classmate {
  id: string;
  name: string;
  /** Classmates appear only after they opt in */
  department: string;
  level: number;
}

export interface CourseSpaceDetail {
  space: CourseSpace;
  feed: FeedPost[];
  materials: Material[];
  questions: CourseQuestion[];
  classmates: Classmate[];
  /** The signed-in student has opted in to appear in Classmates */
  visibleToClassmates: boolean;
}

// ── Deadlines ─────────────────────────────────────────────────────────────────

export interface Deadline {
  id: string;
  courseId: string;
  title: string;
  kind: "assignment" | "test" | "project" | "exam";
  dueAt: string;
  submitted: boolean;
}

// ── Attendance ────────────────────────────────────────────────────────────────

export type AttendanceMark = "present" | "late" | "absent" | "excused";

export interface CourseAttendance {
  courseId: string;
  title: string;
  held: number;
  attended: number;
  late: number;
  excused: number;
  /** 0–100, (attended + late + excused) / held */
  percent: number;
  history: { date: string; mark: AttendanceMark }[];
}

export interface LiveClass {
  sessionId: string;
  courseId: string;
  title: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  checkedIn: boolean;
}

export interface CheckInResult {
  courseId: string;
  title: string;
  venue: string;
  mark: Extract<AttendanceMark, "present" | "late">;
  at: string;
  /** Attendance after this check-in */
  percent: number;
}

// ── Study sessions & insights ─────────────────────────────────────────────────

export interface StudySession {
  id: string;
  courseId: string;
  startedAt: string;
  minutes: number;
  /** Saved on this device, waiting to sync */
  pending?: boolean;
}

export interface WeeklyInsights {
  weekStart: string;
  minutesLogged: number;
  minutesByCourse: { courseId: string; minutes: number }[];
  minutesByDay: { date: string; minutes: number }[];
  attendancePercent: number | null;
  deadlinesMet: number;
  deadlinesDue: number;
  cgpaTrend: { semester: string; gpa: number }[];
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationCategory = "courses" | "attendance" | "fees" | "registration" | "events" | "system";

export interface NotificationPrefs {
  categories: Record<NotificationCategory, boolean>;
  quietHours: { enabled: boolean; start: string; end: string };
  dailyDigest: boolean;
  /** Most non-urgent pushes per day; urgent ones always go through */
  dailyCap: number;
  push: boolean;
}
