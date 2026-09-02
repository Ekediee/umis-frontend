"use server";

import { getSessionToken } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";

// ── Raw API shapes — courses ───────────────────────────────────────────────────

/**
 * Flat course object returned by the new API shape.
 * Instructor name is now inlined directly on the course — no separate wrapper.
 */
export interface RawCourse {
  qcourseid: number;
  courseid: string;
  coursetitle: string;
  credithours: number;
  lecturehours: number;
  yeartaken: number;
  coursename: string | null;
  creditunit: string | null;
  instructorname: string;
  classoption: string;
  is_carry_over: boolean;
}

/** `data` envelope returned by /api/v1/student/select-course/{id} */
interface RawCoursesData {
  student_type: string;
  courses: RawCourse[];
}

interface RawCoursesResponse {
  status: boolean;
  message: string;
  data: RawCoursesData;
}

// ── Normalised shape used by the UI ──────────────────────────────────────────

export interface CourseItem {
  /** Unique identifier — stringified qcourseid */
  id: string;
  /** Short course code, e.g. "GST 312" */
  code: string;
  /** Full course title */
  title: string;
  /** Credit hours */
  units: number;
  /** Class Option */
  classOption?: string;
  /** Instructor name */
  lecturer: string;
  /** Derived from yeartaken: 1-4 → "Year N", otherwise "—" */
  level: string;
}

export interface CoursesResult {
  data?: {
    /** E.g. "Undergraduate" */
    studentType: string;
    courses: CourseItem[];
    /** Raw API courses — retained so the provider can build the submission payload. */
    rawCourses: RawCourse[];
  };
  message?: string;
  error?: string;
}

/** Converts a yeartaken number to a human-readable level string. */
function formatLevel(yeartaken: number): string {
  if (yeartaken >= 1 && yeartaken <= 4) return `Year ${yeartaken}`;
  return "—";
}

/**
 * Fetches the list of courses for one or more class option groups.
 * Endpoint: POST /api/v1/student/select-course
 * Body: { class_option_ids: string[] }
 */
export const getCoursesAction = async (classOptionIds: string[]): Promise<CoursesResult> => {
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
      `${apiUrl}/api/v1/student/select-course`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ class_options: classOptionIds }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      let errorMessage = "Failed to fetch courses";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Response body wasn't JSON — keep the fallback message
      }
      return { error: errorMessage };
    }

    const json: RawCoursesResponse = await response.json();

    const rawCourses: RawCourse[] = Array.isArray(json?.data?.courses)
      ? json.data.courses
      : [];

    const courses: CourseItem[] = rawCourses.map((item) => ({
      id: String(item.qcourseid),
      code: item.courseid.trim(),
      title: item.coursetitle.trim(),
      units: item.credithours,
      classOption: item.classoption,
      lecturer: item.instructorname.trim(),
      level: formatLevel(item.yeartaken),
    }));

    return {
      data: { studentType: json?.data?.student_type, courses, rawCourses },
      message: json?.message,
    };
  } catch (error) {
    console.error("getCoursesAction error:", error);
    return {
      error: "Could not connect to the server. Please try again later.",
    };
  }
}

// ── Worship Centers ───────────────────────────────────────────────────────────

interface RawWorshipCenter {
  sabbath_class_id: number;
  sabbath_class_name: string;
  location_on_campus: string;
  pastor_in_charge: string;
  declared_capacity: number;
  occupied_space: number;
  space_left: number;
}

interface RawWorshipCentersResponse {
  status: boolean;
  message: string;
  data: RawWorshipCenter[];
}

export interface WorshipCenter {
  /** Stringified sabbath_class_id */
  id: string;
  name: string;
  location: string;
  pastor: string;
  declaredCapacity: number;
  /** Remaining seats for new students: declared_capacity - occupied_space */
  spacesLeft: number;
}

export interface WorshipCentersResult {
  data?: WorshipCenter[];
  message?: string;
  error?: string;
}

/**
 * Fetches all available worship centers.
 * Endpoint: GET /api/v1/worship-centers
 */
export const getWorshipCentersAction = async (): Promise<WorshipCentersResult> => {
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
    const response = await loggedFetch(`${apiUrl}/api/v1/worship-centers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch worship centers";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Response body wasn't JSON — keep the fallback message
      }
      return { error: errorMessage };
    }

    const json: RawWorshipCentersResponse = await response.json();

    const centers: WorshipCenter[] = Array.isArray(json?.data)
      ? json.data.map((item) => ({
          id: String(item.sabbath_class_id),
          name: item.sabbath_class_name,
          location: item.location_on_campus,
          pastor: item.pastor_in_charge,
          declaredCapacity: item.declared_capacity,
          spacesLeft: Math.max(0, item.declared_capacity - item.occupied_space),
        }))
      : [];

    return { data: centers, message: json?.message };
  } catch (error) {
    console.error("getWorshipCentersAction error:", error);
    return {
      error: "Could not connect to the server. Please try again later.",
    };
  }
};

// ── Submit Course Selection ───────────────────────────────────────────────────

/** Shape of each course entry sent to the submission endpoint. */
export interface RawCourseSubmit {
  courseid: string;
  coursename: string | null;
  creditunit: string | null;
  credithours: number;
  lecturehours: number;
  yeartaken: number;
  qcourseid: number;
  classoption?: string | null;
}

/** Full request payload for POST /api/v1/student/submit-course-selection */
export interface SubmitCoursePayload {
  worship_center_id: string;
  max_credit_unit: number;
  min_credit_unit: number;
  courses: RawCourseSubmit[];
  class_options?: string[];
}

export interface SubmitCourseSelectionResult {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Submits the student's final course selection to the backend.
 * Endpoint: POST /api/v1/student/submit-course-selection
 */
export const submitCourseSelectionAction = async (
  payload: SubmitCoursePayload
): Promise<SubmitCourseSelectionResult> => {
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
      `${apiUrl}/api/v1/student/submit-course-selection`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      let errorMessage = "Failed to submit course selection";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Response body wasn't JSON — keep the fallback message
      }
      return { error: errorMessage };
    }

    const json = await response.json();
    const success = json?.status ?? json?.success ?? true;
    return { success, message: json?.message };
  } catch (error) {
    console.error("submitCourseSelectionAction error:", error);
    return {
      error: "Could not connect to the server. Please try again later.",
    };
  }
};

// ── Registered Courses ────────────────────────────────────────────────────────

interface RawRegisteredCourse {
  course_id: string;
  course_title: string;
  instructor: string;
  classoption: string;
  credithours: number;
}

interface RawRegisteredCoursesResponse {
  status: boolean;
  message: string;
  data: RawRegisteredCourse[];
}

export interface RegisteredCoursesResult {
  data?: CourseItem[];
  message?: string;
  error?: string;
}

/**
 * Fetches the student's registered courses for the current semester.
 * Endpoint: GET /api/v1/semester/registered-course
 */
export const getRegisteredCoursesAction = async (): Promise<RegisteredCoursesResult> => {
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

    const courses: CourseItem[] = rawCourses.map((item, idx) => ({
      id: String(idx),
      code: item.course_id.trim(),
      title: item.course_title.trim(),
      units: item.credithours ?? 0,
      classOption: item.classoption ?? "",
      lecturer: item.instructor.trim(),
      level: "—",
    }));

    return { data: courses, message: json?.message };
  } catch (error) {
    console.error("getRegisteredCoursesAction error:", error);
    return {
      error: "Could not connect to the server. Please try again later.",
    };
  }
};
