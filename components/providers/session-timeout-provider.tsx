"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Clock, ShieldAlert, LogOut, CheckCircle2, Loader2 } from "lucide-react";
import { performClientLogout, clearAuthExpiredFlag } from "@/lib/auth-cleanup";
import { touchSessionAction } from "@/app/actions/auth";

// ── Timeout Configurations ───────────────────────────────────────────────────
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutes warning before logout (at 28m)
const ACTIVITY_THROTTLE_MS = 10 * 1000; // Throttle activity updates to once every 10s
const STORAGE_KEY_LAST_ACTIVE = "umis_last_active";
const STORAGE_KEY_AUTH_EXPIRED = "auth_session_expired";

interface SessionTimeoutContextType {
  resetTimer: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType>({
  resetTimer: () => {},
});

export function useSessionTimeout() {
  return useContext(SessionTimeoutContext);
}

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_BEFORE_MS / 1000);
  const [isExtendingSession, setIsExtendingSession] = useState(false);

  const lastActiveRef = useRef<number>(Date.now());
  const lastRecordedActivityRef = useRef<number>(0);

  /**
   * Refreshes client timestamp and syncs to localStorage so other tabs stay updated.
   */
  const recordActivity = useCallback((forceSync: boolean = false) => {
    const now = Date.now();
    if (forceSync || now - lastRecordedActivityRef.current >= ACTIVITY_THROTTLE_MS) {
      lastRecordedActivityRef.current = now;
      lastActiveRef.current = now;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
        } catch {
          // Ignore localStorage errors
        }
      }
      setIsWarningOpen(false);
    }
  }, []);

  /**
   * Called when user clicks "Stay Logged In" on the warning modal.
   * Touches the server session cookie and updates active timestamp.
   */
  const handleStayLoggedIn = async () => {
    try {
      setIsExtendingSession(true);
      await touchSessionAction();
      recordActivity(true);
    } catch (err) {
      console.error("Failed to refresh server session:", err);
      recordActivity(true);
    } finally {
      setIsExtendingSession(false);
      setIsWarningOpen(false);
    }
  };

  /**
   * Called when user clicks "Log Out Now" on the warning modal.
   */
  const handleManualLogout = async () => {
    await performClientLogout("manual", true);
  };

  useEffect(() => {
    // 1. Clear any stale cross-tab expired flags from previous sessions
    clearAuthExpiredFlag();

    // 2. Initialize active timestamp
    const now = Date.now();
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
      if (stored) {
        const parsed = parseInt(stored, 10);
        // Only use stored timestamp if within plausible past range
        if (!isNaN(parsed) && parsed <= now && now - parsed < IDLE_TIMEOUT_MS) {
          lastActiveRef.current = parsed;
        } else {
          lastActiveRef.current = now;
          localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
        }
      } else {
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
      }
    } catch {
      lastActiveRef.current = now;
    }

    // 3. Setup throttled user activity listeners
    const handleUserInteraction = () => {
      // If warning modal is open, user interaction should be deliberate via buttons
      if (!isWarningOpen) {
        recordActivity(false);
      }
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    // 4. Setup cross-tab synchronization via StorageEvent
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_LAST_ACTIVE && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (!isNaN(remoteTime)) {
          lastActiveRef.current = remoteTime;
          setIsWarningOpen(false);
        }
      } else if (e.key === STORAGE_KEY_AUTH_EXPIRED && e.newValue) {
        // Another tab triggered logout; cleanly terminate this tab without re-triggering server call
        try {
          const parsed = JSON.parse(e.newValue);
          performClientLogout(parsed?.reason || "storage_sync", false);
        } catch {
          performClientLogout("storage_sync", false);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // 5. Check elapsed time immediately on system wakeup or tab focus
    const checkImmediateTimeout = () => {
      const currentNow = Date.now();
      let lastActive = lastActiveRef.current;
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed)) lastActive = Math.max(lastActive, parsed);
        }
      } catch {
        // Fallback to in-memory ref
      }

      const elapsed = currentNow - lastActive;
      if (elapsed >= IDLE_TIMEOUT_MS) {
        // Laptop woke up after 30+ min of sleep -> log out immediately
        performClientLogout("idle_timeout", true);
      } else if (elapsed >= IDLE_TIMEOUT_MS - WARNING_BEFORE_MS) {
        const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
        setIsWarningOpen(true);
      } else {
        setIsWarningOpen(false);
      }
    };

    window.addEventListener("visibilitychange", checkImmediateTimeout);
    window.addEventListener("focus", checkImmediateTimeout);

    // 6. Master 1-second interval timer
    const interval = setInterval(() => {
      const currentNow = Date.now();
      let lastActive = lastActiveRef.current;
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed)) lastActive = Math.max(lastActive, parsed);
        }
      } catch {
        // Fallback to in-memory ref
      }

      const elapsed = currentNow - lastActive;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        // Idle time exceeded 30 minutes -> Auto logout
        clearInterval(interval);
        performClientLogout("idle_timeout", true);
      } else if (elapsed >= IDLE_TIMEOUT_MS - WARNING_BEFORE_MS) {
        // Within warning window (last 2 minutes)
        const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
        setIsWarningOpen(true);
      } else if (isWarningOpen) {
        setIsWarningOpen(false);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("visibilitychange", checkImmediateTimeout);
      window.removeEventListener("focus", checkImmediateTimeout);
    };
  }, [recordActivity, isWarningOpen]);

  // Format seconds into MM:SS
  const formatCountdown = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <SessionTimeoutContext.Provider value={{ resetTimer: () => recordActivity(true) }}>
      {children}

      {/* Pre-Logout Warning Modal */}
      {isWarningOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-warning-title"
            aria-describedby="session-warning-description"
          >
            {/* Header Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 mx-auto mb-5">
              <ShieldAlert className="w-7 h-7" />
            </div>

            {/* Title & Description */}
            <div className="text-center mb-6">
              <h3
                id="session-warning-title"
                className="text-[19px] font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-2"
              >
                Session Expiring Soon
              </h3>
              <p
                id="session-warning-description"
                className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto"
              >
                You have been inactive for a while. To protect your student account data, you will be automatically signed out in:
              </p>
            </div>

            {/* Countdown Display */}
            <div className="flex items-center justify-center gap-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-2xl py-4 px-6 mb-6">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-wider text-amber-700 dark:text-amber-300">
                {formatCountdown(secondsRemaining)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleManualLogout}
                className="order-2 sm:order-1 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-semibold text-[14px] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <LogOut className="w-4 h-4 text-gray-500" />
                Sign Out Now
              </button>

              <button
                type="button"
                disabled={isExtendingSession}
                onClick={handleStayLoggedIn}
                className="order-1 sm:order-2 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#003cbb] hover:bg-[#0033a0] text-white font-semibold text-[14px] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#003cbb]/40 disabled:opacity-70"
              >
                {isExtendingSession ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extending...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Stay Logged In
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SessionTimeoutContext.Provider>
  );
}
