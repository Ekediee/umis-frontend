import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock IndexedDB (idb-keyval)
const clearIdbMock = vi.fn().mockResolvedValue(undefined);
vi.mock("idb-keyval", () => ({
  clear: () => clearIdbMock(),
}));

// Mock stores
const clearAcademicProgressMock = vi.fn();
const clearCoursesMock = vi.fn();
const clearCarryoverRepeatedMock = vi.fn();
const clearAcademicStorageMock = vi.fn();

const resetStoreMock = vi.fn();
const clearSemesterInfoMock = vi.fn();
const clearWorshipCenterLockMock = vi.fn();
const clearRegistrationStorageMock = vi.fn();

const clearWalletMock = vi.fn();
const cancelStudyTimerMock = vi.fn();
const clearStudyTimerStorageMock = vi.fn();

const clearStudentQueryCacheMock = vi.fn();
const clearLecturerQueryCacheMock = vi.fn();
const resetMockStoreMock = vi.fn();
const resetLecturerMockDbMock = vi.fn();

vi.mock("@/hooks/use-academic-details-store", () => ({
  useAcademicDetailsStore: {
    getState: () => ({
      clearAcademicProgress: clearAcademicProgressMock,
      clearCourses: clearCoursesMock,
      clearCarryoverRepeated: clearCarryoverRepeatedMock,
    }),
    persist: {
      clearStorage: () => clearAcademicStorageMock(),
    },
  },
}));

vi.mock("@/hooks/use-registration-store", () => ({
  useRegistrationStore: {
    getState: () => ({
      resetStore: resetStoreMock,
      clearSemesterInfo: clearSemesterInfoMock,
      clearWorshipCenterLock: clearWorshipCenterLockMock,
    }),
    persist: {
      clearStorage: () => clearRegistrationStorageMock(),
    },
  },
}));

vi.mock("@/hooks/use-wallet-store", () => ({
  useWalletStore: {
    getState: () => ({
      clearWallet: clearWalletMock,
    }),
  },
}));

vi.mock("@/hooks/use-study-timer", () => ({
  useStudyTimer: {
    getState: () => ({
      cancel: cancelStudyTimerMock,
    }),
    persist: {
      clearStorage: () => clearStudyTimerStorageMock(),
    },
  },
}));

vi.mock("@/lib/student/query", () => ({
  clearStudentQueryCache: () => clearStudentQueryCacheMock(),
}));

vi.mock("@/lib/lecturer/query", () => ({
  clearLecturerQueryCache: () => clearLecturerQueryCacheMock(),
}));

vi.mock("@/lib/student/mock/db", () => ({
  resetMockStore: () => resetMockStoreMock(),
}));

vi.mock("@/lib/lecturer/mock/db", () => ({
  resetDb: () => resetLecturerMockDbMock(),
}));

// Mock logoutAction & deleteSessionAction
const logoutActionMock = vi.fn();
const deleteSessionActionMock = vi.fn();
vi.mock("@/app/actions/auth", () => ({
  logoutAction: (reason?: string) => logoutActionMock(reason),
  deleteSessionAction: () => deleteSessionActionMock(),
}));

import { performClientLogout, clearAuthExpiredFlag } from "@/lib/auth-cleanup";

describe("lib/auth-cleanup", () => {
  const cacheDeleteMock = vi.fn().mockResolvedValue(true);
  const cacheKeysMock = vi.fn().mockResolvedValue(["course-materials", "apis", "pages"]);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    Object.defineProperty(window, "caches", {
      value: {
        keys: cacheKeysMock,
        delete: cacheDeleteMock,
      },
      configurable: true,
      writable: true,
    });
  });

  describe("clearAuthExpiredFlag", () => {
    it("removes auth_session_expired from localStorage", () => {
      localStorage.setItem("auth_session_expired", "true");
      clearAuthExpiredFlag();
      expect(localStorage.getItem("auth_session_expired")).toBeNull();
    });
  });

  describe("performClientLogout", () => {
    it("totally clears Zustand stores, localStorage, sessionStorage, IndexedDB, CacheStorage, sets broadcast flag, and calls deleteSessionAction", async () => {
      localStorage.setItem("profile_avatar:18/0654", "url");
      localStorage.setItem("student_info", "data");
      localStorage.setItem("umis_last_active", "12345");
      localStorage.setItem("academic-details-storage", "data");
      localStorage.setItem("registration-status-storage", "data");
      localStorage.setItem("pulse-study-timer", "data");
      localStorage.setItem("pulse-notification-prefs", "data");
      sessionStorage.setItem("session_daily_verse", "verse");
      sessionStorage.setItem("pulse-lecturer:q:session", "cached");

      logoutActionMock.mockResolvedValueOnce(undefined);
      deleteSessionActionMock.mockResolvedValueOnce(undefined);

      await performClientLogout("manual", true);

      // Verify Zustand state & persisted storage clearing
      expect(clearAcademicProgressMock).toHaveBeenCalled();
      expect(clearCoursesMock).toHaveBeenCalled();
      expect(clearCarryoverRepeatedMock).toHaveBeenCalled();
      expect(clearAcademicStorageMock).toHaveBeenCalled();

      expect(resetStoreMock).toHaveBeenCalled();
      expect(clearSemesterInfoMock).toHaveBeenCalled();
      expect(clearWorshipCenterLockMock).toHaveBeenCalled();
      expect(clearRegistrationStorageMock).toHaveBeenCalled();

      expect(clearWalletMock).toHaveBeenCalled();
      expect(cancelStudyTimerMock).toHaveBeenCalled();
      expect(clearStudyTimerStorageMock).toHaveBeenCalled();

      // Verify in-memory query caches & mock DBs cleared
      expect(clearStudentQueryCacheMock).toHaveBeenCalled();
      expect(clearLecturerQueryCacheMock).toHaveBeenCalled();
      expect(resetMockStoreMock).toHaveBeenCalled();
      expect(resetLecturerMockDbMock).toHaveBeenCalled();

      // Verify all localStorage items removed
      expect(localStorage.getItem("profile_avatar:18/0654")).toBeNull();
      expect(localStorage.getItem("student_info")).toBeNull();
      expect(localStorage.getItem("umis_last_active")).toBeNull();
      expect(localStorage.getItem("academic-details-storage")).toBeNull();
      expect(localStorage.getItem("registration-status-storage")).toBeNull();
      expect(localStorage.getItem("pulse-study-timer")).toBeNull();
      expect(localStorage.getItem("pulse-notification-prefs")).toBeNull();

      // Verify all sessionStorage items removed
      expect(sessionStorage.getItem("session_daily_verse")).toBeNull();
      expect(sessionStorage.getItem("pulse-lecturer:q:session")).toBeNull();
      expect(sessionStorage.length).toBe(0);

      // Verify IndexedDB and CacheStorage cleared
      expect(clearIdbMock).toHaveBeenCalledTimes(1);
      expect(cacheKeysMock).toHaveBeenCalledTimes(1);
      expect(cacheDeleteMock).toHaveBeenCalledWith("course-materials");
      expect(cacheDeleteMock).toHaveBeenCalledWith("apis");
      expect(cacheDeleteMock).toHaveBeenCalledWith("pages");

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
      expect(localStorage.length).toBe(0);
      expect(deleteSessionActionMock).toHaveBeenCalled();
    });
  });
});


