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
    const token = data.data.token

    if (!token) {
      return { error: "Authentication successful, but no token was received." };
    }

    // User data is at data.data.user
    const userData: UMISResponse | undefined = data.data?.user ?? undefined;

    // Store token + user data securely in HTTP-only cookies
    await createSession(token, userData);

    // Redirect server-side so cookies are committed before the browser navigates.
    // Using router.push() on the client can race against cookie propagation
    // through a reverse proxy (Apache), causing the session to be missing on
    // the very next request and bouncing the user back to login.
    redirect("/dashboard?login=success");
  } catch (error) {
    console.error("Login API Error:", error);
    return { error: `Failed to connect to the authentication service. Please try again later: ${error}` };
  }
}
