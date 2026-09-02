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
 * Endpoint: GET /api/v1/student/class-option
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
    const classOptions: RawClassOption[] = Array.isArray(raw)
      ? raw
      : raw
      ? [raw]
      : [];
    const groups: ClassGroup[] = classOptions.map((item) => ({
      id: item.class_option_id,
      name: item.class_option_name,
    }));

    return { data: groups, hasMany: json?.data?.has_many_class_option, message: json?.message };
  } catch (error) {
    console.error("getClassGroupsAction error:", error);
    return {
      error: "Could not connect to the server. Please try again later.",
    };
  }
}
