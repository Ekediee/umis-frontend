"use client";

import { useAcademicDetailsStore } from "@/hooks/use-academic-details-store";
import { useRegistrationStore } from "@/hooks/use-registration-store";
import { logoutAction } from "@/app/actions/auth";

let isLoggingOut = false;

/**
 * Clears any leftover cross-tab auth expiration flag from localStorage.
 * Call this on login or initial dashboard mount.
 */
export function clearAuthExpiredFlag(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("auth_session_expired");
    } catch {
      // Ignore storage errors (e.g. private browsing)
    }
  }
}

/**
 * Centrally performs complete client and server session cleanup.
 *
 * @param reason - 'idle_timeout' | 'manual' | string
 * @param isInitiator - true if this tab triggered the logout; false if triggered via cross-tab storage event
 */
export async function performClientLogout(
  reason: string = "manual",
  isInitiator: boolean = true
): Promise<void> {
  // Prevent double-logout race conditions across components or duplicate storage events
  if (isLoggingOut) return;
  isLoggingOut = true;

  // 1. Wipe client-side Zustand store states
  try {
    useAcademicDetailsStore.getState().clearAcademicProgress?.();
    useAcademicDetailsStore.getState().clearCourses?.();
    useRegistrationStore.getState().resetStore?.();
    useRegistrationStore.getState().clearSemesterInfo?.();
  } catch (err) {
    console.error("Failed to reset client stores on logout:", err);
  }

  // 2. Explicit localStorage cleanup (iterating explicitly across all keys)
  if (typeof window !== "undefined") {
    try {
      const keysToRemove = Object.keys(localStorage).filter(
        (k) =>
          k.startsWith("profile_avatar") ||
          k.startsWith("student_") ||
          k.includes("academic") ||
          k.includes("course") ||
          k.startsWith("umis_") ||
          k.startsWith("registration_") ||
          k.startsWith("finance_")
      );
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Notify other open tabs if this tab initiated the logout
      if (isInitiator) {
        localStorage.setItem(
          "auth_session_expired",
          JSON.stringify({ reason, timestamp: Date.now() })
        );
      }
    } catch (err) {
      console.error("Failed to clean localStorage on logout:", err);
    }
  }

  // 3. Clear server session cookie and navigate to login
  try {
    await logoutAction(reason);
  } catch {
    // Next.js redirect() throws an internal NEXT_REDIRECT error which is caught here,
    // or if a network disconnect occurred, force client-side redirection.
    if (typeof window !== "undefined") {
      window.location.href = `/?reason=${encodeURIComponent(reason)}`;
    }
  }
}
