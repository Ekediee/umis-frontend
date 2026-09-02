"use server";

import { createSession } from "@/lib/session";
import { UMISResponse } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const user_name = formData.get("user_name") as string;
  const password = formData.get("password") as string;

  if (!user_name || !password) {
    return { error: "Username and password are required" };
  }

  // Flag set inside try so redirect() can be called OUTSIDE the catch block.
  // redirect() works by throwing a special NEXT_REDIRECT error internally —
  // if called inside try-catch it gets swallowed and treated as a real error.
  let shouldRedirect = false;

  try {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("API_URL is not defined in environment variables");
      return { error: "Internal server error: Missing API configuration" };
    }

    const response = await loggedFetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_name, password }),
    });

    if (!response.ok) {
      let errorMessage = "Invalid credentials or server error";
      try {
        const errorData = await response.json();
        console.log("Error data", errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Fallback if response isn't JSON
      }
      return { error: errorMessage };
    }

    const data = await response.json();

    // Token is at data.token or data.data.token
    const token = data.data.token;

    if (!token) {
      return { error: "Authentication successful, but no token was received." };
    }

    // User data is at data.data.user
    const userData: UMISResponse | undefined = data.data?.user ?? undefined;

    // Store token + user data securely in HTTP-only cookies
    await createSession(token, userData);

    shouldRedirect = true;
  } catch (error) {
    console.error("Login API Error:", error);
    return { error: `Failed to connect to the authentication service. Please try again later: ${error}` };
  }

  // Called OUTSIDE the try-catch so its internal NEXT_REDIRECT throw is never
  // caught and mistaken for a real error.
  if (shouldRedirect) {
    redirect("/dashboard?login=success");
  }
}

/**
 * Destroys current student session and redirects to login/home page with optional reason.
 */
export async function logoutAction(reason?: string) {
  const { deleteSession } = await import("@/lib/session");
  await deleteSession();
  if (reason) {
    redirect(`/?reason=${encodeURIComponent(reason)}`);
  }
  redirect("/");
}

/**
 * Refreshes cookie expiration timestamps when the user chooses to stay logged in.
 */
export async function touchSessionAction(): Promise<boolean> {
  const { touchSession } = await import("@/lib/session");
  return await touchSession();
}

/**
 * Sends an OTP to the student's registered email for password reset.
 * Endpoint: POST /api/v1/entity/send-otp
 * Body: { user_name, email }
 */
export async function requestPasswordResetAction(formData: FormData) {
  const matricNo = formData.get("user_name") as string;
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!matricNo) {
    return { error: "Matric number is required." };
  }

  if (!email) {
    return { error: "Babcock student email is required." };
  }

  if (!email.endsWith("@student.babcock.edu.ng") && !email.endsWith("@pg.babcock.edu.ng")) {
    return { error: "Email must end in @student.babcock.edu.ng or @pg.babcock.edu.ng." };
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    console.error("API_URL is not defined in environment variables");
    return { error: "Internal server error: Missing API configuration." };
  }

  try {
    const response = await loggedFetch(`${apiUrl}/api/v1/entity/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: matricNo, email }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to send OTP. Please try again or contact support.";
      try {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const json = await response.json();
          errorMessage = json.message || json.error || errorMessage;
        }
      } catch {}
      return { error: errorMessage };
    }

    return {
      success: true,
      message: `A one-time passcode has been sent to the email registered with ${matricNo}.`,
    };
  } catch (e) {
    console.error("Send OTP API call failed:", e);
    return { error: "Failed to connect to the server. Please check your connection and try again." };
  }
}

/**
 * Verifies the OTP and resets the student's password in one step.
 * Endpoint: POST /api/v1/entity/verify-otp
 * Body: { user_name, otp, new_password, new_password_confirmation }
 */
export async function verifyOtpResetPasswordAction(formData: FormData) {
  const user_name = (formData.get("user_name") as string)?.trim();
  const otp = (formData.get("otp") as string)?.trim();
  const new_password = (formData.get("new_password") as string) || "";
  const new_password_confirmation = (formData.get("new_password_confirmation") as string) || "";

  if (!user_name) return { error: "Matric number is missing. Please go back and try again." };
  if (!otp || otp.length < 4) return { error: "Please enter the OTP sent to your email." };
  if (!new_password || !new_password_confirmation) return { error: "New password and confirmation are required." };
  if (new_password !== new_password_confirmation) return { error: "Passwords do not match." };

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return { error: "Internal server error: Missing API configuration." };
  }

  try {
    const response = await loggedFetch(`${apiUrl}/api/v1/entity/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name, otp, new_password, new_password_confirmation }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = json?.message || json?.error || "OTP verification failed. Please try again.";
      return { error: errorMessage };
    }

    return {
      success: true,
      message: json?.message || "Password reset successfully. You can now log in.",
    };
  } catch (e) {
    console.error("Verify OTP API call failed:", e);
    return { error: "Failed to connect to the server. Please try again." };
  }
}

/**
 * Changes student password via the backend API.
 * Endpoint: POST /api/v1/student/change-password
 * Body: { new_password, new_password_confirmation }
 */
export async function changePasswordAction(
  formData: FormData | { new_password?: string; new_password_confirmation?: string; confirm_password?: string }
) {
  let new_password = "";
  let new_password_confirmation = "";

  if (formData instanceof FormData) {
    new_password = (formData.get("new_password") as string) || (formData.get("password") as string) || "";
    new_password_confirmation =
      (formData.get("new_password_confirmation") as string) || (formData.get("confirm_password") as string) || "";
  } else if (typeof formData === "object" && formData !== null) {
    new_password = formData.new_password || "";
    new_password_confirmation = formData.new_password_confirmation || formData.confirm_password || "";
  }

  if (!new_password || !new_password_confirmation) {
    return { error: "New password and confirmation password are required." };
  }

  if (new_password !== new_password_confirmation) {
    return { error: "New password and confirmation password do not match." };
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return { error: "Internal server error: Missing API configuration." };
  }

  try {
    const { getSessionToken } = await import("@/lib/session");
    const token = await getSessionToken().catch(() => null);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await loggedFetch(`${apiUrl}/api/v1/student/change-password`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        new_password,
        new_password_confirmation,
      }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = json?.message || json?.error || "Failed to change password. Please try again.";
      return { error: errorMessage };
    }

    return {
      success: true,
      message: json?.message || "Password changed successfully.",
    };
  } catch (e) {
    console.error("Change password API call failed:", e);
    return { error: "Failed to connect to server. Please try again." };
  }
}

