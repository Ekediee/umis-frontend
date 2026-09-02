import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies
const performClientLogoutMock = vi.fn();
const clearAuthExpiredFlagMock = vi.fn();

vi.mock("@/lib/auth-cleanup", () => ({
  performClientLogout: (reason?: string, isInitiator?: boolean) =>
    performClientLogoutMock(reason, isInitiator),
  clearAuthExpiredFlag: () => clearAuthExpiredFlagMock(),
}));

const touchSessionActionMock = vi.fn();
vi.mock("@/app/actions/auth", () => ({
  touchSessionAction: () => touchSessionActionMock(),
}));

import {
  SessionTimeoutProvider,
  useSessionTimeout,
} from "@/components/providers/session-timeout-provider";

function TestChild() {
  const { resetTimer } = useSessionTimeout();
  return (
    <div>
      <span>Inside Protected Shell</span>
      <button onClick={resetTimer}>Reset Activity</button>
    </div>
  );
}

describe("SessionTimeoutProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children and calls clearAuthExpiredFlag on mount", () => {
    render(
      <SessionTimeoutProvider>
        <TestChild />
      </SessionTimeoutProvider>
    );

    expect(screen.getByText("Inside Protected Shell")).toBeDefined();
    expect(clearAuthExpiredFlagMock).toHaveBeenCalledTimes(1);
  });

  it("displays warning modal when elapsed time enters the 2-minute warning window (28 min)", () => {
    render(
      <SessionTimeoutProvider>
        <TestChild />
      </SessionTimeoutProvider>
    );

    expect(screen.queryByText("Session Expiring Soon")).toBeNull();

    // Advance by 28 minutes and 10 seconds (1690000 ms)
    act(() => {
      vi.advanceTimersByTime(28 * 60 * 1000 + 10 * 1000);
    });

    expect(screen.getByText("Session Expiring Soon")).toBeDefined();
    expect(screen.getByText("Stay Logged In")).toBeDefined();
    expect(screen.getByText("Sign Out Now")).toBeDefined();
  });

  it("triggers automatic idle timeout logout at 30 minutes", () => {
    render(
      <SessionTimeoutProvider>
        <TestChild />
      </SessionTimeoutProvider>
    );

    // Advance by 30 minutes and 1 second
    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000 + 1000);
    });

    expect(performClientLogoutMock).toHaveBeenCalledWith("idle_timeout", true);
  });

  it("resets timer and calls touchSessionAction when 'Stay Logged In' is clicked", async () => {
    touchSessionActionMock.mockResolvedValueOnce(true);

    render(
      <SessionTimeoutProvider>
        <TestChild />
      </SessionTimeoutProvider>
    );

    // Advance to warning state
    act(() => {
      vi.advanceTimersByTime(28 * 60 * 1000 + 10 * 1000);
    });

    expect(screen.getByText("Session Expiring Soon")).toBeDefined();

    const stayButton = screen.getByText("Stay Logged In");
    await act(async () => {
      fireEvent.click(stayButton);
    });

    expect(touchSessionActionMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Session Expiring Soon")).toBeNull();
  });

  it("calls performClientLogout('manual', true) when 'Sign Out Now' is clicked", async () => {
    render(
      <SessionTimeoutProvider>
        <TestChild />
      </SessionTimeoutProvider>
    );

    // Advance to warning state
    act(() => {
      vi.advanceTimersByTime(28 * 60 * 1000 + 10 * 1000);
    });

    const signOutButton = screen.getByText("Sign Out Now");
    await act(async () => {
      fireEvent.click(signOutButton);
    });

    expect(performClientLogoutMock).toHaveBeenCalledWith("manual", true);
  });

  it("handles cross-tab logout storage event cleanly", () => {
    render(
      <SessionTimeoutProvider>
        <TestChild />
      </SessionTimeoutProvider>
    );

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "auth_session_expired",
          newValue: JSON.stringify({ reason: "idle_timeout", timestamp: Date.now() }),
        })
      );
    });

    expect(performClientLogoutMock).toHaveBeenCalledWith("idle_timeout", false);
  });
});
