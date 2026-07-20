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