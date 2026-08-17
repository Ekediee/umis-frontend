"use server";

import { getSessionToken } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";

// ── Raw API shapes — registered courses ───────────────────────────────────────

/**
 * Flat course object returned by /api/v1/semester/registered-course.
 * instructor is a name string inlined on the course object.
 */
export interface RawRegisteredCourse {
  course_id: string;
  course_title: string;
  instructor: string;
  classoption?: string;
  credithours: number;
  is_carry_over: boolean;
}

interface RawRegisteredCoursesResponse {
  status: boolean;
  message: string;
  data: RawRegisteredCourse[];
}

// ── Normalised shape used by the UI ──────────────────────────────────────────

export interface RegisteredCourse {
  /** Short course code, e.g. "GST 312" */
  courseId: string;
  /** Full course title */
  title: string;
  /** Instructor full name */
  instructor: string;
  /** Class option / group label, if present */
  classOption?: string;
  /** Credit hours */
  units: number;
  /** true → carry-over; false → current semester */
  isCarryOver: boolean;
}

export interface RegisteredCoursesResult {
  data?: RegisteredCourse[];
  message?: string;
  error?: string;
}

// ── Action ────────────────────────────────────────────────────────────────────

/**
 * Fetches the student's registered courses for the current semester.
 * Endpoint: GET /api/v1/semester/registered-course
 *
 * Returns all courses in a single flat array; carry-over vs. current is
 * derived from `isCarryOver` on each item.
 */
export const getRegisteredCoursesAction =
  async (): Promise<RegisteredCoursesResult> => {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("API_URL is not defined in environment variables");
      return { error: "Internal server error: Missing API configuration" };
    }

    const token = await getSessionToken();
    if (!token) {
      return { error: "You are not authenticated. Please log in again." };
    }

    try {
      const response = await loggedFetch(
        `${apiUrl}/api/v1/semester/registered-course`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to fetch registered courses";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Response body wasn't JSON — keep the fallback message
        }
        return { error: errorMessage };
      }

      const json: RawRegisteredCoursesResponse = await response.json();

      const rawCourses: RawRegisteredCourse[] = Array.isArray(json?.data)
        ? json.data
        : [];

      const courses: RegisteredCourse[] = rawCourses.map((item) => ({
        courseId: item.course_id.trim(),
        title: item.course_title.trim(),
        instructor: item.instructor.trim(),
        classOption: item.classoption?.trim() || undefined,
        units: item.credithours,
        isCarryOver: item.is_carry_over,
      }));

      return { data: courses, message: json?.message };
    } catch (error) {
      console.error("getRegisteredCoursesAction error:", error);
      return {
        error: "Could not connect to the server. Please try again later.",
      };
    }
  };

// ── Raw API shapes — academic progress ────────────────────────────────────────

interface RawSemesterProgression {
  semester: string;
  semester_gpa: number | null;
  level: number;
}

interface RawAcademicProgressResponse {
  status: boolean;
  message: string;
  data: {
    total_expected_semesters: number;
    registered_semesters: number;
    remaining_semesters: number;
    semester_progression: RawSemesterProgression[];
  };
}

// ── Normalised shape used by the UI ──────────────────────────────────────────

export interface SemesterProgressPoint {
  /** Raw semester key, e.g. "2023/2024.1C" */
  semester: string;
  /** Friendly label, e.g. "100L 1st" */
  label: string;
  semesterGpa: number;
  level: number;
}

export interface AcademicProgressData {
  totalExpectedSemesters: number;
  registeredSemesters: number;
  remainingSemesters: number;
  /** 0–100, derived from registeredSemesters / totalExpectedSemesters */
  progressPercent: number;
  /** Only entries with a non-null semester_gpa, sorted as returned */
  semesterProgression: SemesterProgressPoint[];
}

export interface AcademicProgressResult {
  data?: AcademicProgressData;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a raw semester code + level into a short display label.
 * "2023/2024.1C" + 100 → "100L 1st"
 * "2024/2025.2"  + 200 → "200L 2nd"
 */
function formatSemesterLabel(semesterCode: string, level: number): string {
  const match = semesterCode.match(/\.(\d+)/);
  const semNum = match ? parseInt(match[1], 10) : 1;
  const ordinals = ["1st", "2nd", "3rd"];
  const ordinal = ordinals[semNum - 1] ?? `${semNum}th`;
  return `${level}L ${ordinal}`;
}

// ── Action ────────────────────────────────────────────────────────────────────

/**
 * Fetches the student's academic progress summary.
 * Endpoint: GET /api/v1/student/academic-progress
 *
 * Returns semester-by-semester GPA data and overall semester completion stats.
 * Entries with a null semester_gpa (ongoing semester) are excluded from
 * semesterProgression so the chart never plots undefined points.
 */
export const getAcademicProgressAction =
  async (): Promise<AcademicProgressResult> => {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("API_URL is not defined in environment variables");
      return { error: "Internal server error: Missing API configuration" };
    }

    const token = await getSessionToken();
    if (!token) {
      return { error: "You are not authenticated. Please log in again." };
    }

    try {
      const response = await loggedFetch(
        `${apiUrl}/api/v1/student/academic-progress`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to fetch academic progress";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Response body wasn't JSON — keep the fallback message
        }
        return { error: errorMessage };
      }

      const json: RawAcademicProgressResponse = await response.json();
      const raw = json?.data;

      if (!raw) {
        return { error: "No data returned from academic progress endpoint" };
      }

      const totalExpectedSemesters = raw.total_expected_semesters ?? 8;
      const registeredSemesters = raw.registered_semesters ?? 0;
      const remainingSemesters = raw.remaining_semesters ?? 0;
      const progressPercent = Math.min(
        Math.round((registeredSemesters / totalExpectedSemesters) * 100),
        100
      );

      const semesterProgression: SemesterProgressPoint[] = (
        raw.semester_progression ?? []
      )
        .filter(
          (s) => s.semester_gpa !== null && s.semester_gpa !== undefined
        )
        .map((s) => ({
          semester: s.semester,
          label: formatSemesterLabel(s.semester, s.level),
          semesterGpa: s.semester_gpa as number,
          level: s.level,
        }));

      return {
        data: {
          totalExpectedSemesters,
          registeredSemesters,
          remainingSemesters,
          progressPercent,
          semesterProgression,
        },
      };
    } catch (error) {
      console.error("getAcademicProgressAction error:", error);
      return {
        error: "Could not connect to the server. Please try again later.",
      };
    }
  };

// ── Raw API shapes — academic results ─────────────────────────────────────────

export interface ResultCourse {
  course_code: string;
  course_title: string;
  unit: number;
  score: number | null;
  grade: string;
  remark: string;
}

export interface SemesterResult {
  semester: string;
  total_credit_unit: number;
  semester_gpa: number | null;
  semester_level: number;
  session: string;
  courses: ResultCourse[];
}

interface RawAcademicResultsResponse {
  status: boolean;
  message: string;
  data: SemesterResult[];
}

export interface AcademicResultsResult {
  data?: SemesterResult[];
  error?: string;
}

// ── Action ────────────────────────────────────────────────────────────────────

/**
 * Fetches the student's full academic results across all semesters.
 * Endpoint: GET /api/v1/academics/results
 *
 * Returns the raw semester list as-is (typed). Cumulative computations
 * (C.Hours, C.GPA) are derived on the client from this data.
 */
export const getAcademicResultsAction =
  async (): Promise<AcademicResultsResult> => {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("API_URL is not defined in environment variables");
      return { error: "Internal server error: Missing API configuration" };
    }

    const token = await getSessionToken();
    if (!token) {
      return { error: "You are not authenticated. Please log in again." };
    }

    try {
      const response = await loggedFetch(
        `${apiUrl}/api/v1/academics/results`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to fetch academic results";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Response body wasn't JSON — keep the fallback message
        }
        return { error: errorMessage };
      }

      const json: RawAcademicResultsResponse = await response.json();

      const semesters: SemesterResult[] = Array.isArray(json?.data)
        ? json.data
        : [];

      return { data: semesters };
    } catch (error) {
      console.error("getAcademicResultsAction error:", error);
      return {
        error: "Could not connect to the server. Please try again later.",
      };
    }
  };

// ── Raw API shapes — carry-over / repeated courses ────────────────────────────

interface RawCarryOverCourse {
  courseid: string;
  coursetitle: string;
  credithours: number;
  lecturehours: number;
  yeartaken: number;
}

interface RawCarryoverRepeatedResponse {
  status: boolean;
  message: string;
  data: {
    carry_courses: RawCarryOverCourse[];
    /**
     * The API returns `[[]]` (an array containing an empty array) when there
     * are no repeated courses.  We normalise this to an empty flat array.
     */
    repeated_courses: Array<RawCarryOverCourse | []>;
  };
}

// ── Normalised shape used by the UI ──────────────────────────────────────────

export interface CarryOverCourse {
  /** Short course code, e.g. "BU-GST 031" */
  courseId: string;
  /** Full course title */
  title: string;
  /** Credit hours */
  creditHours: number;
  /** Lecture hours */
  lectureHours: number;
  /**
   * Academic year the course was taken / is being repeated.
   * 0 = Foundation / pre-year-1; 1 = Year 1; 2 = Year 2; etc.
   */
  yearTaken: number;
}

export interface CarryoverRepeatedData {
  carryCourses: CarryOverCourse[];
  repeatedCourses: CarryOverCourse[];
}

export interface CarryoverRepeatedResult {
  data?: CarryoverRepeatedData;
  error?: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Normalises a raw carry-over / repeated course object into the UI shape.
 * Returns `null` for malformed entries so they can be filtered out.
 */
function normaliseCarryOverCourse(
  raw: RawCarryOverCourse | []
): CarryOverCourse | null {
  // Guard against the `[[]]` quirk — the nested empty array is not a course object
  if (Array.isArray(raw)) return null;
  return {
    courseId: raw.courseid?.trim() ?? "",
    title: raw.coursetitle?.trim() ?? "",
    creditHours: raw.credithours ?? 0,
    lectureHours: raw.lecturehours ?? 0,
    yearTaken: raw.yeartaken ?? 0,
  };
}

// ── Action ────────────────────────────────────────────────────────────────────

/**
 * Fetches the student's carry-over and repeated courses.
 * Endpoint: GET /api/v1/academics/carryover_repeated
 *
 * Both arrays are normalised and returned; callers can use either or both.
 */
export const getCarryoverRepeatedAction =
  async (): Promise<CarryoverRepeatedResult> => {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("API_URL is not defined in environment variables");
      return { error: "Internal server error: Missing API configuration" };
    }

    const token = await getSessionToken();
    if (!token) {
      return { error: "You are not authenticated. Please log in again." };
    }

    try {
      const response = await loggedFetch(
        `${apiUrl}/api/v1/academics/carryover_repeated`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to fetch carry-over / repeated courses";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Response body wasn't JSON — keep the fallback message
        }
        return { error: errorMessage };
      }

      const json: RawCarryoverRepeatedResponse = await response.json();
      const raw = json?.data;

      const rawCarry: Array<RawCarryOverCourse | []> = Array.isArray(
        raw?.carry_courses
      )
        ? raw.carry_courses
        : [];

      const rawRepeated: Array<RawCarryOverCourse | []> = Array.isArray(
        raw?.repeated_courses
      )
        ? raw.repeated_courses
        : [];

      const carryCourses: CarryOverCourse[] = rawCarry
        .map(normaliseCarryOverCourse)
        .filter((c): c is CarryOverCourse => c !== null);

      const repeatedCourses: CarryOverCourse[] = rawRepeated
        .map(normaliseCarryOverCourse)
        .filter((c): c is CarryOverCourse => c !== null);

      return { data: { carryCourses, repeatedCourses } };
    } catch (error) {
      console.error("getCarryoverRepeatedAction error:", error);
      return {
        error: "Could not connect to the server. Please try again later.",
      };
    }
  };