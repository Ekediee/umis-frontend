import { describe, it, expect } from "vitest";
import { cn, toTitleCase, getUserFriendlyErrorMessage } from "@/lib/utils";

describe("lib/utils", () => {
  describe("cn", () => {
    it("merges class names correctly", () => {
      expect(cn("px-2 py-1", "bg-blue-500")).toBe("px-2 py-1 bg-blue-500");
      expect(cn("px-2", { "px-4": true })).toBe("px-4");
    });
  });

  describe("toTitleCase", () => {
    it("converts strings to title case safely", () => {
      expect(toTitleCase("hello world")).toBe("Hello World");
      expect(toTitleCase("JOHN DOE")).toBe("John Doe");
      expect(toTitleCase("")).toBe("—");
      expect(toTitleCase(null)).toBe("—");
      expect(toTitleCase(undefined)).toBe("—");
    });
  });

  describe("getUserFriendlyErrorMessage", () => {
    it("converts PostgreSQL / SQLSTATE errors into a user-friendly message", () => {
      const sqlError =
        'SQLSTATE[42703]: Undefined column: 7 ERROR: column "expires_at" of relation "password_reset_tokens" does not exist LINE 1: ... insert into "password_reset_tokens" ("email", "token", "expires_at", "created_at") values (agu0869@pg.babcock.edu.ng, ...) ';
      const result = getUserFriendlyErrorMessage(sqlError);
      expect(result).toBe(
        "A server error occurred while processing your request. Please try again or contact support if the issue persists."
      );
    });

    it("converts PDOException and QueryException into a user-friendly message", () => {
      expect(
        getUserFriendlyErrorMessage("Illuminate\\Database\\QueryException: SQLSTATE[HY000]")
      ).toBe(
        "A server error occurred while processing your request. Please try again or contact support if the issue persists."
      );

      expect(
        getUserFriendlyErrorMessage("Fatal error: Uncaught PDOException in /app/Http/Controllers/OtpController.php")
      ).toBe(
        "A server error occurred while processing your request. Please try again or contact support if the issue persists."
      );
    });

    it("converts invalid/wrong OTP errors into a friendly message", () => {
      expect(getUserFriendlyErrorMessage("The provided OTP is invalid")).toBe(
        "The OTP entered is incorrect. Please check and try again."
      );
      expect(getUserFriendlyErrorMessage("Wrong OTP entered")).toBe(
        "The OTP entered is incorrect. Please check and try again."
      );
    });

    it("converts expired OTP errors into a friendly message", () => {
      expect(getUserFriendlyErrorMessage("The OTP has expired")).toBe(
        "This OTP has expired. Please click 'Resend OTP' to receive a new code."
      );
    });

    it("converts throttle / rate limit errors into a friendly message", () => {
      expect(getUserFriendlyErrorMessage("Too many attempts. Throttle active.")).toBe(
        "Too many attempts. Please wait a few minutes before trying again."
      );
      expect(getUserFriendlyErrorMessage("Rate limit exceeded")).toBe(
        "Too many attempts. Please wait a few minutes before trying again."
      );
    });

    it("converts network errors into a friendly message", () => {
      expect(getUserFriendlyErrorMessage("Failed to fetch")).toBe(
        "Unable to connect to the server. Please check your internet connection."
      );
      expect(getUserFriendlyErrorMessage("Network request failed")).toBe(
        "Unable to connect to the server. Please check your internet connection."
      );
    });

    it("retains normal, human-friendly backend messages", () => {
      expect(getUserFriendlyErrorMessage("Student record not found.")).toBe(
        "Student record not found."
      );
      expect(getUserFriendlyErrorMessage("Please verify your email first.")).toBe(
        "Please verify your email first."
      );
    });

    it("falls back gracefully on empty, null, or undefined messages", () => {
      expect(getUserFriendlyErrorMessage(null)).toBe(
        "Something went wrong. Please try again later."
      );
      expect(getUserFriendlyErrorMessage(undefined, "Custom fallback")).toBe(
        "Custom fallback"
      );
      expect(getUserFriendlyErrorMessage("", "Custom fallback")).toBe(
        "Custom fallback"
      );
    });

    it("filters out large code or JSON dumps", () => {
      const jsonDump = JSON.stringify({ error: "crash", trace: [1, 2, 3, 4, 5] });
      expect(getUserFriendlyErrorMessage(jsonDump, "Fallback")).toBe("Fallback");
    });
  });
});

