import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only before import
vi.mock("server-only", () => ({}));

// Mock next/headers
const cookieStore = {
  _store: {} as Record<string, string>,
  set(name: string, value: string) {
    this._store[name] = value;
  },
  get(name: string) {
    const val = this._store[name];
    return val !== undefined ? { value: val } : undefined;
  },
  delete(name: string) {
    delete this._store[name];
  },
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(cookieStore)),
}));

// Mock next/navigation redirect
const redirectMock = vi.fn((url: string) => {
  const error = new Error("NEXT_REDIRECT");
  (error as any).digest = `NEXT_REDIRECT;replace;${url};307;;`;
  throw error;
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

// Mock lib/session
const createSessionMock = vi.fn();
const deleteSessionMock = vi.fn();
const touchSessionMock = vi.fn();
const getSessionTokenMock = vi.fn();

vi.mock("@/lib/session", () => ({
  createSession: (...args: any[]) => createSessionMock(...args),
  deleteSession: () => deleteSessionMock(),
  touchSession: () => touchSessionMock(),
  getSessionToken: () => getSessionTokenMock(),
}));

import {
  loginAction,
  logoutAction,
  touchSessionAction,
  requestPasswordResetAction,
  changePasswordWithTokenAction,
  sendOtpAction,
  verifyOtpAction,

} from "@/app/actions/auth";

describe("auth actions", () => {
  const originalApiUrl = process.env.API_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_URL = "https://api.test.com";
  });

  afterEach(() => {
    process.env.API_URL = originalApiUrl;
    vi.restoreAllMocks();
  });

  describe("loginAction", () => {
    it("returns error if username or password is missing", async () => {
      const formData = new FormData();
      formData.set("user_name", "user123");
      // missing password
      const result = await loginAction(formData);
      expect(result).toEqual({ error: "Username and password are required" });
    });

    it("returns error when API_URL is missing", async () => {
      delete process.env.API_URL;
      const formData = new FormData();
      formData.set("user_name", "user123");
      formData.set("password", "pass123");

      const result = await loginAction(formData);
      expect(result).toEqual({
        error: "Internal server error: Missing API configuration",
      });
    });

    it("returns error on unsuccessful credentials", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ message: "Invalid credentials" }),
        })
      );

      const formData = new FormData();
      formData.set("user_name", "user123");
      formData.set("password", "wrongpass");

      const result = await loginAction(formData);
      expect(result).toEqual({ error: "Invalid credentials" });
    });

    it("creates session and redirects on successful login", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                token: "mock-jwt-token",
                user: { entity_name: "John Doe" },
              },
            }),
        })
      );

      const formData = new FormData();
      formData.set("user_name", "user123");
      formData.set("password", "correctpass");

      await expect(loginAction(formData)).rejects.toThrow("NEXT_REDIRECT");
      expect(createSessionMock).toHaveBeenCalledWith("mock-jwt-token", {
        entity_name: "John Doe",
      });
      expect(redirectMock).toHaveBeenCalledWith("/dashboard?login=success");
    });
  });

  describe("logoutAction", () => {
    it("calls deleteSession and redirects to / when no reason is given", async () => {
      await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT");
      expect(deleteSessionMock).toHaveBeenCalledTimes(1);
      expect(redirectMock).toHaveBeenCalledWith("/");
    });

    it("calls deleteSession and redirects with encoded reason query param", async () => {
      await expect(logoutAction("session_expired")).rejects.toThrow(
        "NEXT_REDIRECT"
      );
      expect(deleteSessionMock).toHaveBeenCalledTimes(1);
      expect(redirectMock).toHaveBeenCalledWith("/?reason=session_expired");
    });
  });

  describe("touchSessionAction", () => {
    it("calls touchSession and returns boolean result", async () => {
      touchSessionMock.mockResolvedValueOnce(true);
      const result = await touchSessionAction();
      expect(result).toBe(true);
      expect(touchSessionMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("requestPasswordResetAction", () => {
    it("validates matric number and email domains", async () => {
      const formData = new FormData();
      formData.set("user_name", "18/0654");
      formData.set("email", "invalid@gmail.com");

      const result = await requestPasswordResetAction(formData);
      expect(result).toEqual({
        error:
          "Email must end in @student.babcock.edu.ng or @pg.babcock.edu.ng.",
      });
    });

    it("returns success on valid student email reset request", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        })
      );

      const formData = new FormData();
      formData.set("user_name", "18/0654");
      formData.set("email", "student@student.babcock.edu.ng");

      const result = await requestPasswordResetAction(formData);
      expect(result).toEqual({
        success: true,
        message:
          "A one-time passcode has been sent to the email registered with 18/0654.",
      });
    });
  });

  describe("sendOtpAction", () => {

    it("validates missing inputs", async () => {
      const result = await sendOtpAction({ user_name: "", email: "" });
      expect(result).toEqual({ error: "Matric number is required." });
    });

    it("successfully calls backend to send OTP", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ status: true, message: "OTP sent" }),
        })
      );

      const result = await sendOtpAction({
        user_name: "18/0654",
        email: "student@babcock.edu.ng",
      });

      expect(result).toEqual({
        success: true,
        message: "OTP sent",
      });
    });

    it("sanitizes raw backend SQLSTATE errors into a user-friendly message", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: () =>
            Promise.resolve({
              status: false,
              message: "SQLSTATE[HY000]: General error: 2006 MySQL server has gone away",
            }),
        })
      );

      const result = await sendOtpAction({
        user_name: "18/0654",
        email: "student@babcock.edu.ng",
      });

      expect(result).toEqual({
        error:
          "A server error occurred while processing your request. Please try again or contact support if the issue persists.",
      });
    });
  });

  describe("verifyOtpAction", () => {
    it("validates missing inputs", async () => {
      const result = await verifyOtpAction({ email: "", otp: "" });
      expect(result).toEqual({ error: "Email address is missing." });
    });

    it("successfully verifies OTP and returns reset_token", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              status: true,
              message: "Otp verified successfully",
              data: { reset_token: "mock-reset-token-20char" },
            }),
        })
      );

      const result = await verifyOtpAction({
        email: "student@babcock.edu.ng",
        otp: "123456",
      });

      expect(result).toEqual({
        success: true,
        message: "Otp verified successfully",
        reset_token: "mock-reset-token-20char",
      });
    });

    it("sanitizes raw backend SQLSTATE errors into a user-friendly message", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: () =>
            Promise.resolve({
              message:
                'SQLSTATE[42703]: Undefined column: 7 ERROR: column "expires_at" of relation "password_reset_tokens" does not exist LINE 1: ... insert into "password_reset_tokens" ("email", "token", "expires_at", "created_at") values (agu0869@pg.babcock.edu.ng, ...)',
            }),
        })
      );

      const result = await verifyOtpAction({
        email: "student@babcock.edu.ng",
        otp: "123456",
      });

      expect(result).toEqual({
        error:
          "A server error occurred while processing your request. Please try again or contact support if the issue persists.",
      });
    });
  });


  describe("changePasswordWithTokenAction", () => {
    it("validates missing username or token", async () => {
      const result = await changePasswordWithTokenAction({
        username: "",
        reset_token: "token123",
        new_password: "password123",
        new_password_confirmation: "password123",
      });

      expect(result).toEqual({
        error: "Matric number is missing.",
      });
    });

    it("validates matching passwords", async () => {
      const result = await changePasswordWithTokenAction({
        username: "18/0654",
        reset_token: "token123",
        new_password: "password123",
        new_password_confirmation: "password456",
      });

      expect(result).toEqual({
        error: "Passwords do not match.",
      });
    });

    it("successfully calls backend to change password", async () => {
      getSessionTokenMock.mockResolvedValueOnce("test-token");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ status: true, message: "Password updated" }),
        })
      );

      const result = await changePasswordWithTokenAction({
        username: "18/0654",
        reset_token: "mock-reset-token-20char",
        new_password: "newpassword123",
        new_password_confirmation: "newpassword123",
      });

      expect(result).toEqual({
        success: true,
        message: "Password updated",
      });
    });

    it("sanitizes raw backend SQLSTATE errors into a user-friendly message", async () => {
      getSessionTokenMock.mockResolvedValueOnce("test-token");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: () =>
            Promise.resolve({
              status: false,
              message: "SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry",
            }),
        })
      );

      const result = await changePasswordWithTokenAction({
        username: "18/0654",
        reset_token: "mock-reset-token-20char",
        new_password: "newpassword123",
        new_password_confirmation: "newpassword123",
      });

      expect(result).toEqual({
        error:
          "A server error occurred while processing your request. Please try again or contact support if the issue persists.",
      });
    });
  });
});


