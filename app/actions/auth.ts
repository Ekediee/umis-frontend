"use server";

import { createSession } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  try {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("API_URL is not defined in environment variables");
      return { error: "Internal server error: Missing API configuration" };
    }

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      let errorMessage = "Invalid credentials or server error";
      try {
        console.log("Checking login response", await response.text());
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Fallback if response isn't JSON
      }
      return { error: errorMessage };
    }

    const data = await response.json();
    
    // Assuming the API returns a token in data.token or data.data.token
    const token = data.token || (data.data && data.data.token);
    
    if (!token) {
      return { error: "Authentication successful, but no token was received." };
    }

    // Store token securely in an HTTP-only cookie
    await createSession(token);

    return { success: true,
      data: data,
     };
  } catch (error) {
    console.error("Login API Error:", error);
    return { error: "Failed to connect to the authentication service. Please try again later." };
  }
}
