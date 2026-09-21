import { NextRequest, NextResponse } from "next/server";
import { loggedFetch } from "@/lib/logger";
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

    const userName = body.user_name || body.username || body.matric_number || body.matricNo;
    const email = body.email;

    const response = await loggedFetch(`${apiUrl}/api/v1/entity/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: userName,
        username: userName,
        matric_number: userName,
        email,
      }),
    });

    const data = await response.json().catch(() => null);
    if (data && (!response.ok || data.status === false)) {
      if (data.message) {
        data.message = getUserFriendlyErrorMessage(data.message, "Failed to send OTP. Please try again.");
      }
    }

    return NextResponse.json(
      data || { status: response.ok, message: response.statusText },
      { status: response.status }
    );
  } catch (error) {
    console.error("API proxy send-otp failed:", error);
    return NextResponse.json(
      { status: false, message: "Failed to connect to backend service" },
      { status: 500 }
    );
  }
}
