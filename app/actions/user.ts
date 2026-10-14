"use server";

import { getSessionUser, getSessionToken, updateSessionUser, UMISResponse } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";

/**
 * Returns the current user's data stored in the session cookie.
 * Call this from any Server Component or Server Action.
 * Returns null if no user data is found (e.g. not logged in).
 */
export async function getUserData(): Promise<UMISResponse | null> {
  try {
    return await getSessionUser();
  } catch {
    return null;
  }
}

/**
 * Fetches the live student profile from the backend API.
 * Falls back to the session cookie if the API request fails.
 */
export async function getStudentProfileAction(): Promise<UMISResponse | null> {
  try {
    const apiUrl = process.env.API_URL;
    const token = await getSessionToken().catch(() => null);

    if (apiUrl && token) {
      const response = await loggedFetch(`${apiUrl}/api/v1/student/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        // Give the backend up to 15 s before falling back to the session cookie.
        // The backend can be slow (4–5 s is common); 4 s was too tight and caused
        // constant TimeoutError → session fallback on every profile page load.
        signal: AbortSignal.timeout(15000),
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
    }
  } catch (error) {
    console.error("getStudentProfileAction error:", error);
  }

  try {
    return await getSessionUser();
  } catch {
    return null;
  }
}

export interface UpdateProfilePictureResult {
  success: boolean;
  message?: string;
  profile_picture_url?: string;
  error?: string;
}

/**
 * Uploads a new profile picture to /api/v1/student/update_profile_picture.
 * Validates file type (jpeg, png, jpg) and size (<= 1MB).
 */
export async function updateProfilePictureAction(
  formData: FormData
): Promise<UpdateProfilePictureResult> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return { success: false, error: "Internal server error: Missing API configuration" };
  }

  const token = await getSessionToken().catch(() => null);
  if (!token) {
    return { success: false, error: "You are not authenticated. Please log in again." };
  }

  const file = formData.get("profile_picture") as File | null;
  if (!file || typeof file === "string") {
    return { success: false, error: "Please select a profile picture to upload." };
  }

  // Validate file format (jpeg, png, jpg)
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
  const allowedExtensions = [".jpg", ".jpeg", ".png"];
  const fileName = file.name.toLowerCase();
  const isValidMime = allowedMimeTypes.includes(file.type.toLowerCase());
  const isValidExt = allowedExtensions.some((ext) => fileName.endsWith(ext));

  if (!isValidMime && !isValidExt) {
    return {
      success: false,
      error: "Invalid file type. Only JPEG, JPG, and PNG files are supported.",
    };
  }

  // Validate max file size (1MB = 1024 * 1024 bytes)
  const MAX_SIZE = 1 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      success: false,
      error: "File size exceeds the 1MB limit. Please choose a smaller file.",
    };
  }

  try {
    const response = await loggedFetch(
      `${apiUrl}/api/v1/student/update_profile_picture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      let errorMessage = "Failed to upload profile picture";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // use fallback
      }
      return { success: false, error: errorMessage };
    }

    const json = await response.json();
    const message = json.message || "Profile picture updated successfully!";
    let newPictureUrl: string | null =
      json.data?.profile_picture_url ||
      json.data?.profile_picture ||
      json.data?.picture_url ||
      json.data?.picture ||
      json.data?.photo_url ||
      json.data?.photo ||
      json.data?.url ||
      json.profile_picture_url ||
      json.profile_picture ||
      json.picture_url ||
      json.picture ||
      json.url ||
      null;

    // If the upload response didn't include the new URL directly, fetch the updated profile
    if (!newPictureUrl) {
      try {
        const freshProfile = await getStudentProfileAction();
        newPictureUrl =
          freshProfile?.user_data?.personal_information?.profile_picture_url ||
          (freshProfile as unknown as Record<string, unknown>)?.profile_picture_url as string ||
          null;
      } catch {
        // Fallback
      }
    }

    // Update session user cookie if new picture URL is returned or payload exists
    const currentUser = await getSessionUser();
    if (currentUser && currentUser.user_data) {
      const updatedUser: UMISResponse = {
        ...currentUser,
        user_data: {
          ...currentUser.user_data,
          personal_information: {
            ...currentUser.user_data.personal_information,
            profile_picture_url: newPictureUrl || currentUser.user_data.personal_information?.profile_picture_url,
          },
        },
      };
      await updateSessionUser(updatedUser);
    }

    return {
      success: true,
      message,
      profile_picture_url: newPictureUrl || undefined,
    };
  } catch (error) {
    console.error("updateProfilePictureAction error:", error);
    return {
      success: false,
      error: "Could not connect to the server. Please try again later.",
    };
  }
}

export interface UpdateEmailResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Updates the student's email via /api/v1/student/update-email.
 */
export async function updateEmailAction(email: string): Promise<UpdateEmailResult> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return { success: false, error: "Internal server error: Missing API configuration" };
  }

  const token = await getSessionToken().catch(() => null);
  if (!token) {
    return { success: false, error: "You are not authenticated. Please log in again." };
  }

  try {
    const response = await loggedFetch(`${apiUrl}/api/v1/student/update-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = "Failed to update email address";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // use fallback
      }
      return { success: false, error: errorMessage };
    }

    const json = await response.json();
    const message = json.message || "Email address updated successfully!";

    // Update the session cookie with the new email
    const currentUser = await getSessionUser();
    if (currentUser && currentUser.user_data) {
      const updatedUser: UMISResponse = {
        ...currentUser,
        user_data: {
          ...currentUser.user_data,
          contact_information: {
            ...currentUser.user_data.contact_information,
            email: email,
          },
        },
      };
      await updateSessionUser(updatedUser);
    }

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("updateEmailAction error:", error);
    return {
      success: false,
      error: "Could not connect to the server. Please try again later.",
    };
  }
}


export interface RefreshAcademicStandingResult {
  success: boolean;
  current_level?: number | null;
  cummulative_gpa?: number | null;
  error?: string;
}

/**
 * Fetches the live profile from /api/v1/student/profile and writes the
 * student's `current_level` and `cummulative_gpa` into the user_data session
 * cookie. Both the top-level fields and the nested `academic_information`
 * fields (`study_level`, `cummulative_gpa`) are updated because different
 * views read from different locations. All other cookie fields are untouched,
 * and null/missing values from the API never overwrite existing values.
 *
 * Call `router.refresh()` on the client afterwards so the layout re-reads the
 * cookie and every `useUserData()` consumer updates.
 */
export async function refreshAcademicStandingAction(): Promise<RefreshAcademicStandingResult> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return { success: false, error: "Internal server error: Missing API configuration" };
  }

  const token = await getSessionToken().catch(() => null);
  if (!token) {
    return { success: false, error: "You are not authenticated. Please log in again." };
  }

  try {
    const response = await loggedFetch(`${apiUrl}/api/v1/student/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch student profile" };
    }

    const json = await response.json();
    const payload = json?.data ?? json;
    const rawLevel = payload?.current_level;
    const rawGpa = payload?.cummulative_gpa;

    const level =
      rawLevel !== null && rawLevel !== undefined && rawLevel !== "" && !Number.isNaN(Number(rawLevel))
        ? Number(rawLevel)
        : null;
    const gpa =
      rawGpa !== null && rawGpa !== undefined && rawGpa !== "" && !Number.isNaN(Number(rawGpa))
        ? Number(rawGpa)
        : null;

    if (level === null && gpa === null) {
      return { success: false, error: "Profile response did not contain level or CGPA" };
    }

    const currentUser = await getSessionUser();
    if (!currentUser || !currentUser.user_data) {
      return { success: false, error: "No active session user to update" };
    }

    const existing = currentUser.user_data;
    const updatedUser: UMISResponse = {
      ...currentUser,
      user_data: {
        ...existing,
        current_level: level ?? existing.current_level,
        cummulative_gpa: gpa ?? existing.cummulative_gpa,
        academic_information: {
          ...existing.academic_information,
          study_level: level ?? existing.academic_information?.study_level ?? null,
          cummulative_gpa: gpa ?? existing.academic_information?.cummulative_gpa ?? null,
        },
      },
    };
    await updateSessionUser(updatedUser);

    return {
      success: true,
      current_level: updatedUser.user_data.current_level,
      cummulative_gpa: updatedUser.user_data.cummulative_gpa,
    };
  } catch (error) {
    console.error("refreshAcademicStandingAction error:", error);
    return {
      success: false,
      error: "Could not connect to the server. Please try again later.",
    };
  }
}
