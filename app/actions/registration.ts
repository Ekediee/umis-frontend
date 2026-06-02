"use server";

import { getSessionToken } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";

// ── Raw API shapes ────────────────────────────────────────────────────────────

interface RawClassOption {
  class_option_id: number;
  class_option_name: string;
}

interface RawClassGroupItem {
  class_option: RawClassOption;
}

interface RawClassGroupsResponse {
  status: boolean;
  message: string;
  data: RawClassGroupItem[];
}

// ── Normalised shape used by the UI ──────────────────────────────────────────

export interface ClassGroup {
  id: number;
  name: string;
}

export interface ClassGroupsResult {
  data?: ClassGroup[];
  error?: string;
}

// ── Action ────────────────────────────────────────────────────────────────────

/**
 * Fetches available class groups for the logged-in student.
 * Reads API_URL from the server-side environment and attaches the
 * session token as a Bearer token.
 *
 * Response shape from the backend:
 * { status: boolean, message: string, data: [{ class_option: { class_option_id, class_option_name } }] }
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

    const groups: ClassGroup[] = Array.isArray(json?.data)
      ? json.data.map((item) => ({
          id: item.class_option.class_option_id,
          name: item.class_option.class_option_name,
        }))
      : [];
      console.log("groups", groups);
    return { data: groups };
  } catch (error) {
    console.error("getClassGroupsAction error:", error);
    return {
      error: "Could not connect to the server. Please try again later.",
    };
  }
}
