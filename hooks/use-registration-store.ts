import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SemesterInfo } from "@/app/actions/registration";

export type RegistrationStatusState = "not_started" | "in_progress" | "completed";

interface RegistrationState {
  regState: RegistrationStatusState;
  payState: RegistrationStatusState;
  setRegState: (state: RegistrationStatusState) => void;
  setPayState: (state: RegistrationStatusState) => void;
  resetStore: () => void;

  // ── Semester Info ──────────────────────────────────────────────────────────
  /** Active semester data from GET /api/v1/semester/commence, null if not yet fetched. */
  semesterInfo: SemesterInfo | null;
  /** Last error from the semester info fetch, if any. */
  semesterInfoError: string | null;
  /**
   * True while a fetch is in-flight. Prevents duplicate network calls when
   * both the registration page and fees page mount at the same time.
   */
  isFetchingSemesterInfo: boolean;
  setSemesterInfo: (info: SemesterInfo) => void;
  setSemesterInfoError: (error: string | null) => void;
  setIsFetchingSemesterInfo: (loading: boolean) => void;
  /** Clear on logout so stale data is not shown to the next user. */
  clearSemesterInfo: () => void;

  // ── Worship Center Lock ────────────────────────────────────────────────────
  /**
   * The sabbath_class_id (as string) of the worship center the student last
   * committed to. Null if no lock is in place.
   */
  lockedWorshipCenterId: string | null;
  /**
   * Unix timestamp (ms) after which the lock expires — exactly 2 years from
   * the submission date. Null when no lock is active.
   */
  worshipCenterLockedUntil: number | null;
  /** Write the lock immediately after a successful financial registration submission. */
  setWorshipCenterLock: (id: string, until: number) => void;
  /** Clear the lock (e.g. on logout or admin override). */
  clearWorshipCenterLock: () => void;
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      regState: "not_started",
      payState: "not_started",
      setRegState: (state) => set({ regState: state }),
      setPayState: (state) => set({ payState: state }),
      resetStore: () => set({ regState: "not_started", payState: "not_started" }),

      // ── Semester Info ──────────────────────────────────────────────────────
      semesterInfo: null,
      semesterInfoError: null,
      isFetchingSemesterInfo: false,
      setSemesterInfo: (info) =>
        set({
          semesterInfo: info,
          semesterInfoError: null,
          isFetchingSemesterInfo: false,
        }),
      setSemesterInfoError: (error) =>
        set({ semesterInfoError: error, isFetchingSemesterInfo: false }),
      setIsFetchingSemesterInfo: (loading) =>
        set({ isFetchingSemesterInfo: loading }),
      clearSemesterInfo: () =>
        set({
          semesterInfo: null,
          semesterInfoError: null,
          isFetchingSemesterInfo: false,
        }),

      // ── Worship Center Lock ────────────────────────────────────────────────
      lockedWorshipCenterId: null,
      worshipCenterLockedUntil: null,
      setWorshipCenterLock: (id, until) =>
        set({ lockedWorshipCenterId: id, worshipCenterLockedUntil: until }),
      clearWorshipCenterLock: () =>
        set({ lockedWorshipCenterId: null, worshipCenterLockedUntil: null }),
    }),
    {
      name: "registration-status-storage",
    }
  )
);
