/**
 * Tests for submitCourseSelectionAction
 * (app/actions/registration.ts)
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  submitCourseSelectionAction,
  type SubmitCoursePayload,
} from "@/app/actions/registration";

// ── Mock server-only session helpers ─────────────────────────────────────────
vi.mock("@/lib/session", () => ({
  getSessionToken: vi.fn(),
}));

// ── Mock loggedFetch ──────────────────────────────────────────────────────────
vi.mock("@/lib/logger", () => ({
  loggedFetch: vi.fn(),
}));

import { getSessionToken } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";

const mockGetSessionToken = getSessionToken as ReturnType<typeof vi.fn>;
const mockLoggedFetch = loggedFetch as ReturnType<typeof vi.fn>;

// ── Fixtures ──────────────────────────────────────────────────────────────────
const VALID_PAYLOAD: SubmitCoursePayload = {
  worship_center_id: "4",
  max_credit_unit: 23,
  min_credit_unit: 12,
  courses: [
    {
      courseid: "GST 312",
      coursename: null,
      creditunit: null,
      credithours: 2,
      lecturehours: 2,
      yeartaken: 3,
      qcourseid: 220705,
    },
    {
      courseid: "GST 313",
      coursename: null,
      creditunit: null,
      credithours: 2,
      lecturehours: 2,
      yeartaken: 3,
      qcourseid: 220706,
    },
  ],
};

/** Helper: build a minimal Response-like mock */
function makeFetchResponse(
  body: object,
  status = 200
): ReturnType<typeof vi.fn> {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("submitCourseSelectionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a default valid token
    mockGetSessionToken.mockResolvedValue("test-jwt-token");
    // Set env
    process.env.API_URL = "http://localhost:8000";
  });

  afterEach(() => {
    delete process.env.API_URL;
  });

  it("returns { success: true, message } on a successful 200 response", async () => {
    mockLoggedFetch.mockResolvedValue(
      makeFetchResponse({ status: true, message: "Registration submitted successfully" })
    );

    const result = await submitCourseSelectionAction(VALID_PAYLOAD);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Registration submitted successfully");
    expect(result.error).toBeUndefined();
  });

  it("sends POST to the correct endpoint with the right headers and JSON body", async () => {
    mockLoggedFetch.mockResolvedValue(
      makeFetchResponse({ status: true, message: "OK" })
    );

    await submitCourseSelectionAction(VALID_PAYLOAD);

    expect(mockLoggedFetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/student/submit-course-selection",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-jwt-token",
        }),
        body: JSON.stringify(VALID_PAYLOAD),
      })
    );
  });

  it("returns { error } when the API responds with a 422 status", async () => {
    mockLoggedFetch.mockResolvedValue(
      makeFetchResponse(
        { message: "Credit unit limit exceeded" },
        422
      )
    );

    const result = await submitCourseSelectionAction(VALID_PAYLOAD);

    expect(result.error).toBe("Credit unit limit exceeded");
    expect(result.success).toBeUndefined();
  });

  it("returns a fallback error message when the 4xx body is not valid JSON", async () => {
    mockLoggedFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    });

    const result = await submitCourseSelectionAction(VALID_PAYLOAD);

    expect(result.error).toBe("Failed to submit course selection");
  });

  it("returns { error } when fetch throws a network error", async () => {
    mockLoggedFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await submitCourseSelectionAction(VALID_PAYLOAD);

    expect(result.error).toBe(
      "Could not connect to the server. Please try again later."
    );
  });

  it("returns { error } when there is no session token", async () => {
    mockGetSessionToken.mockResolvedValue(null);

    const result = await submitCourseSelectionAction(VALID_PAYLOAD);

    expect(result.error).toBe(
      "You are not authenticated. Please log in again."
    );
    expect(mockLoggedFetch).not.toHaveBeenCalled();
  });

  it("returns { error } when API_URL is not configured", async () => {
    delete process.env.API_URL;

    const result = await submitCourseSelectionAction(VALID_PAYLOAD);

    expect(result.error).toBe(
      "Internal server error: Missing API configuration"
    );
    expect(mockLoggedFetch).not.toHaveBeenCalled();
  });
});
