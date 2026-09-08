"use server";

import { getSessionToken } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";

// ── Raw API shapes ─────────────────────────────────────────────────────────────

interface RawSemesterData {
  semester: string;
  start_date: string;
  end_date: string;
  late_reg_date: string;
  check: boolean;
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
  /** Whether the student has commenced registration for this semester */
  check: boolean;
}

export interface RegistrationStatusResult {
  data?: SemesterInfo;
  message?: string;
  error?: string;
}

/**
 * Fetches the student's semester registration status from the backend.
 * Endpoint: GET /api/v1/semester/commence
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
        check: Boolean(json.data.check),
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
