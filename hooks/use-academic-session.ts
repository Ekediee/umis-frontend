"use client";

import { useEffect } from "react";
import { getSemesterRegistrationStatusAction } from "@/app/actions/registration";
import { useRegistrationStore } from "@/hooks/use-registration-store";

/**
 * The current academic session, from /api/v1/semester/commence.
 * Labels are null until it's known, so nothing shows a guessed session.
 */
export function useAcademicSession() {
  const semester = useRegistrationStore((state) => state.semesterInfo?.semester ?? null);
  const setSemesterInfo = useRegistrationStore((state) => state.setSemesterInfo);

  useEffect(() => {
    if (semester) return;
    let cancelled = false;
    getSemesterRegistrationStatusAction()
      .then((res) => {
        if (!cancelled && res.data) setSemesterInfo(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [semester, setSemesterInfo]);

  const [session, term] = semester?.split(".") ?? [];
  const semesterName = term === "1" ? "First Semester" : term === "2" ? "Second Semester" : null;

  return {
    /** "2026/2027.1" */
    semester,
    /** "2026/2027" */
    session: session ?? null,
    /** "First Semester" */
    semesterName,
  };
}
