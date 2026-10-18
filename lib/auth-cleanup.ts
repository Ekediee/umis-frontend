"use client";

import { clear as clearIdb } from "idb-keyval";
import { useAcademicDetailsStore } from "@/hooks/use-academic-details-store";
import { useRegistrationStore } from "@/hooks/use-registration-store";
import { useWalletStore } from "@/hooks/use-wallet-store";
import { useStudyTimer } from "@/hooks/use-study-timer";
import { clearStudentQueryCache } from "@/lib/student/query";
import { clearLecturerQueryCache } from "@/lib/lecturer/query";
import { resetMockStore } from "@/lib/student/mock/db";
import { resetDb as resetLecturerMockDb } from "@/lib/lecturer/mock/db";
import { deleteSessionAction } from "@/app/actions/auth";

export const SESSION_CLEARED_EVENT = "umis:session-cleared";

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
 * Completely clears all browser caches and storage associated with the current user session:
 * - Client-side Zustand stores (in-memory state + persisted storage)
 * - In-memory SWR query caches and mock databases
 * - localStorage & sessionStorage
 * - IndexedDB (idb-keyval offline drafts, wallet history, pending study sessions)
 * - Browser Cache Storage API (window.caches / Service Worker runtime caches)
 * - Non-HttpOnly client cookies & PWA app badge
 */
export async function clearBrowserSessionCache(options?: {
  reason?: string;
  isInitiator?: boolean;
}): Promise<void> {
  const reason = options?.reason ?? "manual";
  const isInitiator = options?.isInitiator ?? false;

  // 1. Wipe client-side Zustand store states & persisted storage
  try {
    const academicState = useAcademicDetailsStore.getState();
    academicState?.clearAcademicProgress?.();
    academicState?.clearCourses?.();
    academicState?.clearCarryoverRepeated?.();
    useAcademicDetailsStore.persist?.clearStorage?.();

    const registrationState = useRegistrationStore.getState();
    registrationState?.resetStore?.();
    registrationState?.clearSemesterInfo?.();
    registrationState?.clearWorshipCenterLock?.();
    useRegistrationStore.persist?.clearStorage?.();

    useWalletStore.getState()?.clearWallet?.();

    useStudyTimer.getState()?.cancel?.();
    useStudyTimer.persist?.clearStorage?.();
  } catch (err) {
    console.error("Failed to reset client stores on logout:", err);
  }

  // 2. Wipe in-memory SWR query caches & mock stores
  try {
    clearStudentQueryCache();
    clearLecturerQueryCache();
    resetMockStore();
    resetLecturerMockDb();
  } catch (err) {
    console.error("Failed to clear in-memory query caches on logout:", err);
  }

  if (typeof window === "undefined") return;

  // 3. Wipe all localStorage keys for the session
  try {
    const allLocalKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) allLocalKeys.push(k);
    }
    Object.keys(localStorage).forEach((k) => {
      if (!allLocalKeys.includes(k)) allLocalKeys.push(k);
    });
    allLocalKeys.forEach((k) => localStorage.removeItem(k));
    localStorage.clear();

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

  // 4. Wipe all sessionStorage keys for the session
  try {
    if (typeof sessionStorage !== "undefined") {
      const allSessionKeys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k) allSessionKeys.push(k);
      }
      Object.keys(sessionStorage).forEach((k) => {
        if (!allSessionKeys.includes(k)) allSessionKeys.push(k);
      });
      allSessionKeys.forEach((k) => sessionStorage.removeItem(k));
      sessionStorage.clear();
    }
  } catch (err) {
    console.error("Failed to clean sessionStorage on logout:", err);
  }

  // 5. Wipe IndexedDB session data (offline registration drafts, wallet history, pending study sessions)
  try {
    await clearIdb();
  } catch (err) {
    console.error("Failed to clear IndexedDB on logout:", err);
  }

  // 6. Wipe Browser Cache Storage API (Service Worker & runtime caches)
  try {
    if ("caches" in window && window.caches) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    }
  } catch (err) {
    console.error("Failed to clear browser CacheStorage on logout:", err);
  }

  // 7. Expire any client-accessible cookies & clear app badge / notify mounted root providers
  try {
    if (typeof document !== "undefined" && document.cookie) {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = (eqPos > -1 ? cookie.slice(0, eqPos) : cookie).trim();
        if (name) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
    }
  } catch {
    // Ignore cookie errors
  }

  try {
    const nav = navigator as Navigator & { clearAppBadge?: () => Promise<void> };
    await nav.clearAppBadge?.();
  } catch {
    // Ignore app badge errors
  }

  try {
    window.dispatchEvent(new Event(SESSION_CLEARED_EVENT));
  } catch {
    // Ignore event dispatch errors
  }
}

/**
 * Centrally performs complete client and server session cleanup.
 *
 * @param reason - 'idle_timeout' | 'session_expired' | 'manual' | string
 * @param isInitiator - true if this tab triggered the logout; false if triggered via cross-tab storage event
 */
export async function performClientLogout(
  reason: string = "manual",
  isInitiator: boolean = true
): Promise<void> {
  // Prevent double-logout race conditions across components or duplicate storage events
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    await clearBrowserSessionCache({ reason, isInitiator });
    await deleteSessionAction();
  } catch (err) {
    console.error("Failed to clear server session on logout:", err);
  } finally {
    isLoggingOut = false;
    if (typeof window !== "undefined") {
      window.location.replace(`/login?reason=${encodeURIComponent(reason)}`);
    }
  }
}
