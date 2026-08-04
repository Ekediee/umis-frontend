import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RegisteredCourse } from "@/app/actions/academic-details";
import type { AcademicProgressData } from "@/app/actions/academic-details";

interface AcademicDetailsState {
  /** All registered courses for the current semester, or null if not yet fetched. */
  registeredCourses: RegisteredCourse[] | null;
  /** Last error message from the fetch attempt, if any. */
  coursesError: string | null;
  setRegisteredCourses: (courses: RegisteredCourse[]) => void;
  setCoursesError: (error: string | null) => void;
  /**
   * Clear all stored course data — call this on logout so stale data
   * is not shown to the next user on the same device.
   */
  clearCourses: () => void;

  // ── Academic Progress ──────────────────────────────────────────────────────
  /** Fetched academic progress data, or null if not yet loaded. */
  academicProgress: AcademicProgressData | null;
  /** Last error message from the academic progress fetch, if any. */
  academicProgressError: string | null;
  /**
   * True while a fetch is in-flight. Both components (GraduationProgress &
   * CGPAProgressionChart) check this before triggering their own fetch so
   * only one network call is ever made per page load.
   */
  isFetchingAcademicProgress: boolean;
  setAcademicProgress: (data: AcademicProgressData) => void;
  setAcademicProgressError: (error: string | null) => void;
  setIsFetchingAcademicProgress: (loading: boolean) => void;
  /** Clear on logout so stale data is not shown to the next user. */
  clearAcademicProgress: () => void;
}

export const useAcademicDetailsStore = create<AcademicDetailsState>()(
  persist(
    (set) => ({
      registeredCourses: null,
      coursesError: null,
      setRegisteredCourses: (courses) =>
        set({ registeredCourses: courses, coursesError: null }),
      setCoursesError: (error) => set({ coursesError: error }),
      clearCourses: () =>
        set({ registeredCourses: null, coursesError: null }),

      // ── Academic Progress ────────────────────────────────────────────────
      academicProgress: null,
      academicProgressError: null,
      isFetchingAcademicProgress: false,
      setAcademicProgress: (data) =>
        set({
          academicProgress: data,
          academicProgressError: null,
          isFetchingAcademicProgress: false,
        }),
      setAcademicProgressError: (error) =>
        set({ academicProgressError: error, isFetchingAcademicProgress: false }),
      setIsFetchingAcademicProgress: (loading) =>
        set({ isFetchingAcademicProgress: loading }),
      clearAcademicProgress: () =>
        set({
          academicProgress: null,
          academicProgressError: null,
          isFetchingAcademicProgress: false,
        }),
    }),
    {
      name: "academic-details-storage",
    }
  )
);
