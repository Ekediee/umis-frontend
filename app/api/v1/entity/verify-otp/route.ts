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

    const email = body.email;
    const otp = body.otp;

    const response = await loggedFetch(`${apiUrl}/api/v1/entity/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        otp,
        email,
      }),
    });


    const data = await response.json().catch(() => null);
    if (data && (!response.ok || data.status === false)) {
      if (data.message) {
        data.message = getUserFriendlyErrorMessage(data.message, "OTP verification failed. Please try again.");
      }
    }
    console.log("API proxy verify-otp response:", data);
    return NextResponse.json(
      data || { status: response.ok, message: response.statusText },
      { status: response.status }
    );
  } catch (error) {
    console.error("API proxy verify-otp failed:", error);
    return NextResponse.json(
      { status: false, message: "Failed to connect to backend service" },
      { status: 500 }
    );
  }
}
