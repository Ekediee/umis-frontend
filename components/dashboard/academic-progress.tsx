"use client";

import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";

interface AcademicProgressProps {
  cgpa?: number | null;
  semester_gpa?: number | null;
  current_level?: number | null;
}

export function AcademicProgress({cgpa, semester_gpa, current_level}: AcademicProgressProps) {
  const [showCgpa, toggleCgpa, mountedCgpa] = usePersistentToggle("showCgpa", true);
  const [showSemesterGpa, toggleSemesterGpa, mountedSemesterGpa] = usePersistentToggle("showSemesterGpa", true);

  const mounted = mountedCgpa && mountedSemesterGpa;

  return (
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 md:p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-5 justify-between md:mb-6">
        <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900">Academic Progress</h3>
        <TrendingUp className="w-5 h-5 text-gray-500" />
      </div>

      {/* GPA Metrics */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-6">
        {/* CGPA */}
        <div className="bg-[#f6f8fa] rounded-[16px] p-3 md:p-4 flex flex-col">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[20px] md:text-[24px] font-bold text-[#253ea7] leading-none">
              {mounted && !showCgpa ? "****" : cgpa?.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={toggleCgpa}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-400 active:text-gray-600 md:hover:text-gray-600 transition-colors rounded-full touch-manipulation shrink-0"
              aria-label={showCgpa ? "Hide CGPA" : "Show CGPA"}
            >
              {showCgpa ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
          </div>
          <span className="text-[10px] md:text-[12px] text-gray-500 font-normal mt-1">CGPA</span>
        </div>

        {/* Semester GPA */}
        <div className="bg-[#f6f8fa] rounded-[16px] p-3 md:p-4 flex flex-col">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[20px] md:text-[24px] font-bold text-[#2d9f75] leading-none">
              {mounted && !showSemesterGpa ? "****" : semester_gpa}
            </span>
            <button
              type="button"
              onClick={toggleSemesterGpa}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-400 active:text-gray-600 md:hover:text-gray-600 transition-colors rounded-full touch-manipulation shrink-0"
              aria-label={showSemesterGpa ? "Hide Semester GPA" : "Show Semester GPA"}
            >
              {showSemesterGpa ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
          </div>
          <span className="text-[10px] md:text-[12px] text-gray-500 font-normal mt-1">Semester GPA</span>
        </div>

        {/* Level */}
        <div className="bg-[#f6f8fa] rounded-[16px] p-3 md:p-4 justify-between flex flex-col">
          <span className="text-[20px] md:text-[24px] font-bold text-black leading-none">{current_level}</span>
          <span className="text-[10px] md:text-[12px] text-gray-500 font-normal mt-1">Level</span>
        </div>
      </div>

      {/* Overall Completion */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] md:text-[14px] font-semibold text-gray-800">Overall Completion</span>
          <span className="text-[13px] md:text-[14px] font-bold text-[#003cbb]">31.3%</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-[#003cbb] rounded-full" style={{ width: '31.3%' }}></div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
          <span>45 credits earned</span>
          <span>144 total required</span>
        </div>
      </div>
    </div>
  );
}
