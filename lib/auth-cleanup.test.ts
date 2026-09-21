import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock stores
const clearAcademicProgressMock = vi.fn();
const clearCoursesMock = vi.fn();
const resetStoreMock = vi.fn();
const clearSemesterInfoMock = vi.fn();

vi.mock("@/hooks/use-academic-details-store", () => ({
  useAcademicDetailsStore: {
    getState: () => ({
      clearAcademicProgress: clearAcademicProgressMock,
      clearCourses: clearCoursesMock,
    }),
  },
}));

vi.mock("@/hooks/use-registration-store", () => ({
  useRegistrationStore: {
    getState: () => ({
      resetStore: resetStoreMock,
      clearSemesterInfo: clearSemesterInfoMock,
    }),
  },
}));

// Mock logoutAction
const logoutActionMock = vi.fn();
// Mock deleteSessionAction
const deleteSessionActionMock = vi.fn();
vi.mock("@/app/actions/auth", () => ({
  logoutAction: (reason?: string) => logoutActionMock(reason),
  deleteSessionAction: () => deleteSessionActionMock(),
}));


import { performClientLogout, clearAuthExpiredFlag } from "@/lib/auth-cleanup";

describe("lib/auth-cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("clearAuthExpiredFlag", () => {
    it("removes auth_session_expired from localStorage", () => {
      localStorage.setItem("auth_session_expired", "true");
      clearAuthExpiredFlag();
      expect(localStorage.getItem("auth_session_expired")).toBeNull();
    });
  });

  describe("performClientLogout", () => {
    it("clears Zustand stores, cleans matching localStorage items, sets broadcast flag, and calls logoutAction", async () => {
      localStorage.setItem("profile_avatar:18/0654", "url");
      localStorage.setItem("student_info", "data");
      localStorage.setItem("umis_last_active", "12345");
      localStorage.setItem("academic_progress", "data");
      localStorage.setItem("registration_step", "2");
      localStorage.setItem("unrelated_key", "keep");

      logoutActionMock.mockResolvedValueOnce(undefined);
      deleteSessionActionMock.mockResolvedValueOnce(undefined);

      await performClientLogout("manual", true);

      // Verify Zustand state clearing
      expect(clearAcademicProgressMock).toHaveBeenCalled();
      expect(clearCoursesMock).toHaveBeenCalled();
      expect(resetStoreMock).toHaveBeenCalled();
      expect(clearSemesterInfoMock).toHaveBeenCalled();

      // Verify matching localStorage items removed
      expect(localStorage.getItem("profile_avatar:18/0654")).toBeNull();
      expect(localStorage.getItem("student_info")).toBeNull();
      expect(localStorage.getItem("umis_last_active")).toBeNull();
      expect(localStorage.getItem("academic_progress")).toBeNull();
      expect(localStorage.getItem("registration_step")).toBeNull();
      expect(localStorage.getItem("unrelated_key")).toBe("keep");

      // Verify broadcast message set in localStorage for other tabs
      const broadcast = localStorage.getItem("auth_session_expired");
      expect(broadcast).not.toBeNull();
      expect(JSON.parse(broadcast!).reason).toBe("manual");

      // Verify server action called
      expect(deleteSessionActionMock).toHaveBeenCalled();
    });

    it("does not set auth_session_expired when isInitiator is false", async () => {
      deleteSessionActionMock.mockResolvedValueOnce(undefined);

      await performClientLogout("storage_event", false);

      expect(localStorage.getItem("auth_session_expired")).toBeNull();
      expect(deleteSessionActionMock).toHaveBeenCalled();
    });
  });
});


