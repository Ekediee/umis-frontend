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

  // console.log("Coures for sumit: ", payload);

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

// ── Raw API shape ─────────────────────────────────────────────────────────────

/**
 * Shape of each course entry returned by
 * GET /api/v1/semester/registered-course
 */
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

// ── Normalised shape used by the UI ──────────────────────────────────────────

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

// ── Finance Registration Data ─────────────────────────────────────────────────

// ── Raw API shapes ─────────────────────────────────────────────────────────────

interface RawFinanceResidence {
  qresidenceid: number;
  residenceoption: string;
  full_charges: number;
  charges: number;
  residenceid: string;
  residencename: string;
  sex: string;
  min_level: number;
  max_level: number;
  majors: string;
}

interface RawFinanceGeneralCharges {
  fullfees: number;
  fullmeal2fees: number;
  fullmeal3fees: number;
  fees: number;
  meal2fees: number;
  meal3fees: number;
}

interface RawFinanceMealType {
  qselectionid: number;
  mealtype: string;
  selection: string;
}

interface RawFinanceWorshipCenter {
  sabbath_class_id: number;
  sabbath_class_name: string;
  pastor_in_charge: string;
  location_on_campus: string;
  declared_capacity: number;
  occupied_space: number;
  space_left: number;
}

interface RawFinanceRegistrationResponse {
  status: boolean;
  message: string;
  data: {
    residence: RawFinanceResidence[];
    general_charges: RawFinanceGeneralCharges[];
    meal_types: RawFinanceMealType[];
    worship_centers: RawFinanceWorshipCenter[];
  };
}

// ── Normalised shapes used by the UI ─────────────────────────────────────────

export interface FinanceResidence {
  qresidenceid: number;
  residenceoption: string;
  charges: number;
  residenceid: string;
  residencename: string;
  sex: string;
  min_level: number;
  max_level: number;
  /** Raw majors string — used to derive hall type badge */
  majors: string;
}

export interface FinanceGeneralCharges {
  fullfees: number;
  fullmeal2fees: number;
  fullmeal3fees: number;
  fees: number;
  meal2fees: number;
  meal3fees: number;
}

export interface FinanceMealType {
  qselectionid: number;
  mealtype: string;
  selection: string;
}

export interface FinanceWorshipCenter {
  sabbath_class_id: number;
  sabbath_class_name: string;
  pastor_in_charge: string;
  location_on_campus: string;
  declared_capacity: number;
  occupied_space: number;
  space_left: number;
}

export interface FinanceRegistrationData {
  residence: FinanceResidence[];
  general_charges: FinanceGeneralCharges;
  meal_types: FinanceMealType[];
  worship_centers: FinanceWorshipCenter[];
}

export interface FinanceRegistrationResult {
  data?: FinanceRegistrationData;
  message?: string;
  error?: string;
}

/**
 * Fetches all data needed for the financial registration workflow
 * (residences, worship centers, meal types, general charges).
 * Endpoint: GET /api/v1/student/finance-registration
 */
export const getFinanceRegistrationAction =
  async (): Promise<FinanceRegistrationResult> => {
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
        `${apiUrl}/api/v1/student/finance-registration`,
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
        let errorMessage = "Failed to fetch finance registration data";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Response body wasn't JSON — keep the fallback message
        }
        return { error: errorMessage };
      }

      const json: RawFinanceRegistrationResponse = await response.json();

      const rawResidences: RawFinanceResidence[] = Array.isArray(
        json?.data?.residence
      )
        ? json.data.residence
        : [];

      const rawChargesArr: RawFinanceGeneralCharges[] = Array.isArray(
        json?.data?.general_charges
      )
        ? json.data.general_charges
        : [];
      const rawCharges: RawFinanceGeneralCharges = rawChargesArr[0] ?? {
        fullfees: 0,
        fullmeal2fees: 0,
        fullmeal3fees: 0,
        fees: 0,
        meal2fees: 0,
        meal3fees: 0,
      };

      const rawMeals: RawFinanceMealType[] = Array.isArray(
        json?.data?.meal_types
      )
        ? json.data.meal_types
        : [];

      const rawWorship: RawFinanceWorshipCenter[] = Array.isArray(
        json?.data?.worship_centers
      )
        ? json.data.worship_centers
        : [];

      return {
        data: {
          residence: rawResidences.map((r) => ({
            qresidenceid: r.qresidenceid,
            residenceoption: r.residenceoption,
            charges: r.charges,
            residenceid: r.residenceid,
            residencename: r.residencename,
            sex: r.sex,
            min_level: r.min_level,
            max_level: r.max_level,
            majors: r.majors,
          })),
          general_charges: {
            fullfees: rawCharges.fullfees,
            fullmeal2fees: rawCharges.fullmeal2fees,
            fullmeal3fees: rawCharges.fullmeal3fees,
            fees: rawCharges.fees,
            meal2fees: rawCharges.meal2fees,
            meal3fees: rawCharges.meal3fees,
          },
          meal_types: rawMeals.map((m) => ({
            qselectionid: m.qselectionid,
            mealtype: m.mealtype,
            selection: m.selection,
          })),
          worship_centers: rawWorship.map((wc) => ({
            sabbath_class_id: wc.sabbath_class_id,
            sabbath_class_name: wc.sabbath_class_name,
            pastor_in_charge: wc.pastor_in_charge,
            location_on_campus: wc.location_on_campus,
            declared_capacity: wc.declared_capacity,
            occupied_space: wc.occupied_space,
            space_left: wc.space_left,
          })),
        },
        message: json?.message,
      };
    } catch (error) {
      console.error("getFinanceRegistrationAction error:", error);
      return {
        error: "Could not connect to the server. Please try again later.",
      };
    }
  };
