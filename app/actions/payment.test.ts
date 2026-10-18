/**
 * Tests for app/actions/payment.ts — getStudentFeesAction
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/session", () => ({
  getSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
}));

vi.mock("@/lib/logger", () => ({
  loggedFetch: vi.fn(),
  sanitize: (data: unknown) => data,
}));

import { getStudentFeesAction } from "@/app/actions/payment";
import { loggedFetch } from "@/lib/logger";

describe("getStudentFeesAction", () => {
  const originalApiUrl = process.env.API_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_URL = "https://api.example.com";
  });

  afterEach(() => {
    process.env.API_URL = originalApiUrl;
  });

  it("returns error when API_URL is not configured", async () => {
    delete process.env.API_URL;
    const result = await getStudentFeesAction();
    expect(result.success).toBe(false);
    expect(result.error).toContain("Internal error: API is not configured");
  });

  it("successfully fetches and normalises student fees payload", async () => {
    const mockPayload = {
      status: true,
      message: "Student fees retrieved successfully",
      data: {
        estimated_full_session_fee: 4500000,
        estimated_semester_fee: 2250000,
        amount_paid_for_semester: 1000000,
        total_outstanding_fees: -3097709.8,
      },
    };

    vi.mocked(loggedFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPayload,
    } as unknown as Response);

    const result = await getStudentFeesAction();

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      estimated_full_session_fee: 4500000,
      estimated_semester_fee: 2250000,
      amount_paid_for_semester: 1000000,
      total_outstanding_fees: -3097709.8,
    });
    expect(loggedFetch).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/payment/student-fees",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-session-token",
        }),
      })
    );
  });

  it("handles string representations of numbers gracefully", async () => {
    const mockPayload = {
      status: true,
      message: "Student fees retrieved successfully",
      data: {
        estimated_full_session_fee: "4,500,000",
        estimated_semester_fee: "2,250,000",
        amount_paid_for_semester: "0",
        total_outstanding_fees: "-3,097,709.80",
      },
    };

    vi.mocked(loggedFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPayload,
    } as unknown as Response);

    const result = await getStudentFeesAction();

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      estimated_full_session_fee: 4500000,
      estimated_semester_fee: 2250000,
      amount_paid_for_semester: 0,
      total_outstanding_fees: -3097709.8,
    });
  });

  it("returns error message when API call fails", async () => {
    vi.mocked(loggedFetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        status: false,
        message: "Fees could not be computed",
      }),
    } as unknown as Response);

    const result = await getStudentFeesAction();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Fees could not be computed");
  });

  it("catches network errors gracefully", async () => {
    vi.mocked(loggedFetch).mockRejectedValueOnce(new Error("Network connection error"));

    const result = await getStudentFeesAction();

    expect(result.success).toBe(false);
    expect(result.error).toContain("Could not connect to the server");
  });
});

