"use client";

import { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUserData } from "@/contexts/user-data-context";
import { useAcademicDetailsStore } from "@/hooks/use-academic-details-store";
import { getAcademicProgressAction } from "@/app/actions/academic-details";

export function GraduationProgress() {
  const contextUserData = useUserData();

  const {
    academicProgress,
    academicProgressError,
    isFetchingAcademicProgress,
    setAcademicProgress,
    setAcademicProgressError,
    setIsFetchingAcademicProgress,
  } = useAcademicDetailsStore();

  // Trigger fetch only if not already loaded or in-flight
  useEffect(() => {
    if (academicProgress || isFetchingAcademicProgress) return;
    setIsFetchingAcademicProgress(true);
    getAcademicProgressAction().then((result) => {
      if (result.data) {
        setAcademicProgress(result.data);
      } else {
        setAcademicProgressError(result.error ?? "Unknown error");
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = isFetchingAcademicProgress && !academicProgress;

  // ── Derive values ──────────────────────────────────────────────────────────
  // Academic standing comes from the profile context (not in this endpoint)
  const rawStatus =
    contextUserData?.user_data?.status ??
    contextUserData?.user_data?.academic_information?.status ??
    "GOOD STANDING";
  const standing =
    typeof rawStatus === "string" ? rawStatus.toUpperCase() : "GOOD STANDING";

  // Progress values: prefer live API data, fall back to level-derived estimate
  let progressPercent: number;
  let semesterNum: number;
  let totalSemesters: number;

  if (academicProgress) {
    progressPercent = academicProgress.progressPercent;
    semesterNum = academicProgress.registeredSemesters;
    totalSemesters = academicProgress.totalExpectedSemesters;
  } else {
    // Fallback: estimate from current_level (same logic as before)
    const currentLevel =
      contextUserData?.user_data?.current_level ??
      contextUserData?.user_data?.academic_information?.study_level ??
      200;
    semesterNum = Math.min(
      Math.max(Math.round((Number(currentLevel) / 100) * 2 - 1), 1),
      8
    );
    totalSemesters = 8;
    progressPercent = Math.min(Math.round((semesterNum / totalSemesters) * 100), 100);
  }

  return (
    <Card className="rounded-[20px] border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-[18px] font-bold text-[#0a0a0a] dark:text-gray-100 mb-1">
              Graduation Progress
            </h3>
            <p className="text-[14px] text-[#6a7282] dark:text-gray-400">
              Track your path to graduation
            </p>
          </div>
          <GraduationCap className="w-8 h-8 text-[#0a0a0a] dark:text-gray-400" />
        </div>

        <div className="bg-[#e5ecfc] dark:bg-gray-800/80 border-[0.67px] border-black/10 dark:border-gray-700 rounded-[20px] p-4 md:p-6 flex flex-col justify-between gap-4 transition-colors duration-200">
          {/* Academic Standing Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-normal text-[#525866] dark:text-gray-400 tracking-tight uppercase">
              ACADEMIC STANDING
            </span>
            <span className="bg-[#c2d6ff] dark:bg-[#162664]/30 text-[#162664] dark:text-[#c2d6ff] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#162664] dark:bg-[#4d82ff]" />
              {standing}
            </span>
          </div>

          {/* Semester Label */}
          {isLoading ? (
            <div className="h-4 w-48 bg-[#c2d6ff]/60 dark:bg-gray-700 rounded-full animate-pulse" />
          ) : (
            <h4 className="text-[14px] font-semibold text-[#525866] dark:text-gray-300">
              Academic Progress (Semester {semesterNum} of {totalSemesters})
            </h4>
          )}

          {/* Progress Bar */}
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white dark:bg-gray-900 h-3 rounded-full overflow-hidden">
                <div className="bg-[#c2d6ff]/60 dark:bg-gray-700 h-full rounded-full animate-pulse w-full" />
              </div>
              <div className="h-4 w-8 bg-[#c2d6ff]/60 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white dark:bg-gray-900 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-[#003cbb] dark:bg-[#4d82ff] h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[14px] font-bold text-[#525866] dark:text-gray-300">
                {progressPercent}%
              </span>
            </div>
          )}

          {/* Error fallback notice */}
          {academicProgressError && !academicProgress && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Showing estimated progress — could not load live data.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
