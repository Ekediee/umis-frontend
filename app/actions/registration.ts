"use server";

import { getSessionToken } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";

// ── Raw API shapes ────────────────────────────────────────────────────────────

interface RawClassOption {
  class_option_id: string;
  class_option_name: string;
}

interface RawClassGroupsData {
  has_many_class_option: boolean;
  // When has_many_class_option is true  → array of options
  // When has_many_class_option is false → single option object
  class_options: RawClassOption[] | RawClassOption;
}

interface RawClassGroupsResponse {
  status: boolean;
  message: string;
  data: RawClassGroupsData;
}

// ── Normalised shape used by the UI ──────────────────────────────────────────

export interface ClassGroup {
  id: string;
  name: string;
}

export interface ClassGroupsResult {
  data?: ClassGroup[];
  /** Mirrors has_many_class_option from the API — false means only one group exists. */
  hasMany?: boolean;
  message?: string;
  error?: string;
}

// ── Action ────────────────────────────────────────────────────────────────────

/**
 * Fetches available class groups for the logged-in student.
 * Reads API_URL from the server-side environment and attaches the
 * session token as a Bearer token.
 *
 * Response shape from the backend:
 * has_many_class_option=true  → data.class_options is RawClassOption[]
 * has_many_class_option=false → data.class_options is a single RawClassOption object
 */
export const getClassGroupsAction = async (): Promise<ClassGroupsResult> => {
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
    const response = await loggedFetch(`${apiUrl}/api/v1/student/class-option`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // Opt out of the Next.js data-cache so we always get fresh data
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch class options";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Response body wasn't JSON — keep the fallback message
      }
      return { error: errorMessage };
    }

    const json: RawClassGroupsResponse = await response.json();

    const raw = json?.data?.class_options;
    // Normalise: backend returns an array when has_many_class_option=true,
    // or a single object when has_many_class_option=false.
    const classOptions: RawClassOption[] = Array.isArray(raw)
      ? raw
      : raw
      ? [raw]
      : [];
    const groups: ClassGroup[] = classOptions.map((item) => ({
      id: item.class_option_id,
      name: item.class_option_name,
    }));
    console.log("groups", groups);
    return { data: groups, hasMany: json?.data?.has_many_class_option, message: json?.message };
  } catch (error) {
    console.error("getClassGroupsAction error:", error);
    return {
      error: "Could not connect to the server. Please try again later.",
    };
  }
}

// ── Raw API shapes — courses ───────────────────────────────────────────────────

/**
 * Flat course object returned by the new API shape.
 * Instructor name is now inlined directly on the course — no separate wrapper.
 */
interface RawCourse {
  qcourseid: number;
  courseid: string;
  coursetitle: string;
  credithours: number;
  lecturehours: number;
  yeartaken: number;
  coursename: string | null;
  creditunit: string | null;
  instructorname: string;
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
 * Fetches the list of courses for a given class option / group.
 * Endpoint: GET /api/v1/student/select-course/{classOptionId}
 */
export const getCoursesAction = async (classOptionId: string): Promise<CoursesResult> => {
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
      `${apiUrl}/api/v1/student/select-course/${classOptionId}`,
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

    const courses: CourseItem[] = Array.isArray(json?.data?.courses)
      ? json.data.courses.map((item) => ({
          id: String(item.qcourseid),
          code: item.courseid.trim(),
          title: item.coursetitle.trim(),
          units: item.credithours,
          lecturer: item.instructorname.trim(),
          level: formatLevel(item.yeartaken),
        }))
      : [];

    // console.log("courses", courses);
    return {
      data: { studentType: json?.data?.student_type, courses },
      message: json?.message,
    };
  } catch (error) {
    console.error("getCoursesAction error:", error);
    return {
      error: "Could not connect to the server. Please try again later.",
    };
  }
}

// ── Semester Registration Actions ─────────────────────────────────────────────

// ── Raw API shapes — semester registration ────────────────────────────────────

interface RawSemesterData {
  semester: string;
  start_date: string;
  end_date: string;
  late_reg_date: string;
}

interface RawSemesterRegistrationResponse {
  status: boolean;
  message: string;
  data: RawSemesterData;
}

// ── Normalised shape used by the UI ──────────────────────────────────────────

export interface SemesterInfo {
  /** E.g. "2025/2026.2" */
  semester: string;
  /** ISO date string, e.g. "2026-01-05" */
  startDate: string;
  /** ISO date string, e.g. "2026-04-24" */
  endDate: string;
  /** ISO date string — last day for late registration */
  lateRegDate: string;
}

export interface RegistrationStatusResult {
  data?: SemesterInfo;
  message?: string;
  error?: string;
}

/**
 * Fetches the student's semester registration status from the backend.
 * Endpoint: GET /api/v1/student/registration-status
 */
export const getSemesterRegistrationStatusAction = async (): Promise<RegistrationStatusResult> => {
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
    const response = await loggedFetch(`${apiUrl}/api/v1/semester/commence`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch registration status";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // keep fallback
      }
      return { error: errorMessage };
    }

    const json: RawSemesterRegistrationResponse = await response.json();
    return {
      data: {
        semester: json.data.semester,
        startDate: json.data.start_date,
        endDate: json.data.end_date,
        lateRegDate: json.data.late_reg_date,
      },
      message: json?.message,
    };
  } catch (error) {
    console.error("getSemesterRegistrationStatusAction error:", error);
    return {
      error: "Could not connect to the server. Please try again later.",
    };
  }
};

export interface RegisterSemesterResult {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Registers the student for the current semester.
 * Endpoint: POST /api/v1/student/commence-registration
 */
export const registerSemesterAction = async (): Promise<RegisterSemesterResult> => {
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
    const response = await loggedFetch(`${apiUrl}/api/v1/student/commence-registration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = "Failed to register for the semester";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // keep fallback
      }
      return { error: errorMessage };
    }

    const json = await response.json();
    const success = json?.status ?? json?.success ?? true;
    return { success, message: json?.message };
  } catch (error) {
    console.error("registerSemesterAction error:", error);
    return {
      error: "Could not connect to the server. Please try again later.",
    };
  }
};

// ── Worship Centers ───────────────────────────────────────────────────────────

// ── Raw API shape ─────────────────────────────────────────────────────────────

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

// ── Normalised shape used by the UI ──────────────────────────────────────────

export interface WorshipCenter {
  /** Stringified sabbath_class_id */
  id: string;
  name: string;
  location: string;
  pastor: string;
  declaredCapacity: number;
  /** Remaining seats for new students: declared_capacity - new_student */
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
      ? json.data
          .map((item) => ({
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
