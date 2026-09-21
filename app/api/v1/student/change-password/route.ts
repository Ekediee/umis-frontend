import { NextRequest, NextResponse } from "next/server";
import { loggedFetch } from "@/lib/logger";
import { getSessionToken } from "@/lib/session";
import { getUserFriendlyErrorMessage } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { status: false, message: "Missing API configuration" },
        { status: 500 }
      );
    }

    const username = body.username || body.user_name || body.matric_number || body.matricNo;
    const reset_token = body.reset_token;
    const new_password = body.new_password;
    const new_password_confirmation = body.new_password_confirmation;

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
        username,
        user_name: username,
        reset_token,
        new_password,
        new_password_confirmation,
      }),
    });

    const data = await response.json().catch(() => null);
    if (data && (!response.ok || data.status === false)) {
      if (data.message) {
        data.message = getUserFriendlyErrorMessage(data.message, "Failed to change password. Please try again.");
      }
    }

    return NextResponse.json(
      data || { status: response.ok, message: response.statusText },
      { status: response.status }
    );
  } catch (error) {
    console.error("API proxy change-password failed:", error);
    return NextResponse.json(
      { status: false, message: "Failed to connect to backend service" },
      { status: 500 }
    );
  }
}
