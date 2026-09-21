import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to convert text to Title Case safely
export const toTitleCase = (str?: string | null) => {
  if (!str) return "—"; // Return fallback if string is empty/undefined
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Transforms raw backend errors, database exceptions, or network failures
 * into clean, user-friendly messages for students.
 */
export function getUserFriendlyErrorMessage(
  rawMessage: unknown,
  fallbackMessage: string = "Something went wrong. Please try again later."
): string {
  if (!rawMessage || typeof rawMessage !== "string") {
    return fallbackMessage;
  }

  const trimmed = rawMessage.trim();
  if (!trimmed) return fallbackMessage;

  // Detect raw SQL / Database / Stack trace / Technical errors
  const isTechnicalError =
    /SQLSTATE|PDOException|QueryException|Undefined column|does not exist|syntax error|Relation .* does not exist|insert into|select .* from|update .* set|delete from|Connection: \w+|Host: \d+\.\d+\.\d+\.\d+|Database: \w+|Stack trace|Fatal error|Uncaught exception|Internal Server Error/i.test(
      trimmed
    );

  if (isTechnicalError) {
    return "A server error occurred while processing your request. Please try again or contact support if the issue persists.";
  }

  const lower = trimmed.toLowerCase();

  // Known OTP error cases
  if (
    lower.includes("otp") &&
    (lower.includes("invalid") || lower.includes("incorrect") || lower.includes("wrong") || lower.includes("not match"))
  ) {
    return "The OTP entered is incorrect. Please check and try again.";
  }

  if (lower.includes("otp") && (lower.includes("expired") || lower.includes("timeout"))) {
    return "This OTP has expired. Please click 'Resend OTP' to receive a new code.";
  }

  if (lower.includes("throttle") || lower.includes("too many attempts") || lower.includes("rate limit")) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }

  if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("econnrefused")) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  // Filter out any messages that look like code / unparsed JSON / excessively long technical dumps
  if (trimmed.length > 180 || /[{}[\]<>|^\\$]/.test(trimmed)) {
    return fallbackMessage;
  }

  return trimmed;
}
