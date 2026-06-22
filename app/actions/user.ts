"use server";

import { getSessionUser, getSessionToken, UMISResponse } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";

/**
 * Returns the current user's data stored in the session cookie.
 * Call this from any Server Component or Server Action.
 * Returns null if no user data is found (e.g. not logged in).
 */
export async function getUserData(): Promise<UMISResponse | null> {
  return getSessionUser();
}

/**
 * Fetches the live student profile from the backend API.
 * Falls back to the session cookie if the API request fails.
 */
export async function getStudentProfileAction(): Promise<UMISResponse | null> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) return getSessionUser();

  const token = await getSessionToken();
  if (!token) return getSessionUser();

  try {
    const response = await loggedFetch(`${apiUrl}/api/v1/student/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (response.ok) {
      const json = await response.json();
      
      // Handle Laravel api envelope standard: { status: true, message: "...", data: ... }
      const payload = json.data ?? json;

      // Ensure it aligns with the UMISResponse interface structure
      if (payload && typeof payload === "object") {
        if ("user_data" in payload) {
          return payload as UMISResponse;
        }
        
        // If the payload is the direct student data object, wrap it
        if ("personal_information" in payload || "student_name" in payload) {
          return {
            entity_id: null,
            entity_name: payload.student_name || null,
            user_data: payload,
          } as UMISResponse;
        }
      }
    }
  } catch (error) {
    console.error("getStudentProfileAction error:", error);
  }

  return getSessionUser();
}
