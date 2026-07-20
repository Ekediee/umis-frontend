import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RegisteredCourse } from "@/app/actions/academic-details";

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
    }),
    {
      name: "academic-details-storage",
    }
  )
);
