"use client";

import { useState } from "react";
import { TrendingUp, Eye, EyeOff, Sparkles } from "lucide-react";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";
import { Button } from "@/components/ui/button";
import { GPAWhatIfSimulator } from "@/components/academic-details/gpa-what-if-simulator";

export interface AcademicProgressProps {
  cgpa?: number | null;
  semester_gpa?: number | null;
  current_level?: number | null;
}

export function AcademicProgress({cgpa, semester_gpa, current_level}: AcademicProgressProps) {
  const [showCgpa, toggleCgpa, mountedCgpa] = usePersistentToggle("showCgpa", true);
  const [showSemesterGpa, toggleSemesterGpa, mountedSemesterGpa] = usePersistentToggle("showSemesterGpa", true);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const mounted = mountedCgpa && mountedSemesterGpa;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 md:p-6 flex flex-col h-full transition-colors duration-200">
      <div className="flex items-center gap-2 mb-5 justify-between md:mb-6">
        <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900 dark:text-gray-100">Academic Progress</h3>
        <TrendingUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>

      {/* GPA Metrics */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-6">
        {/* CGPA */}
        <div className="bg-[#f6f8fa] dark:bg-gray-800 rounded-[20px] p-3 md:p-4 flex flex-col transition-colors duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[20px] md:text-[24px] font-bold text-[#253ea7] dark:text-[#4d82ff] leading-none">
              {mounted && !showCgpa ? "****" : cgpa?.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={toggleCgpa}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 active:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full touch-manipulation shrink-0"
              aria-label={showCgpa ? "Hide CGPA" : "Show CGPA"}
            >
              {showCgpa ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
          </div>
          <span className="text-[10px] md:text-[12px] text-gray-500 dark:text-gray-400 font-normal mt-1">CGPA</span>
        </div>

        {/* Semester GPA */}
        <div className="bg-[#f6f8fa] dark:bg-gray-800 rounded-[20px] p-3 md:p-4 flex flex-col transition-colors duration-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[20px] md:text-[24px] font-bold text-[#2d9f75] dark:text-[#34d399] leading-none">
              {mounted && !showSemesterGpa ? "****" : semester_gpa}
            </span>
            <button
              type="button"
              onClick={toggleSemesterGpa}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 active:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full touch-manipulation shrink-0"
              aria-label={showSemesterGpa ? "Hide Semester GPA" : "Show Semester GPA"}
            >
              {showSemesterGpa ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
          </div>
          <span className="text-[10px] md:text-[12px] text-gray-500 dark:text-gray-400 font-normal mt-1">Semester GPA</span>
        </div>

        {/* Level */}
        <div className="bg-[#f6f8fa] dark:bg-gray-800 rounded-[20px] p-3 md:p-4 justify-between flex flex-col transition-colors duration-200">
          <span className="text-[20px] md:text-[24px] font-bold text-black dark:text-gray-100 leading-none">{current_level}</span>
          <span className="text-[10px] md:text-[12px] text-gray-500 dark:text-gray-400 font-normal mt-1">Level</span>
        </div>
      </div>

      {/* GPA Simulator Trigger Button */}
      <div className="mb-6">
        <Button 
          onClick={() => setIsSimulatorOpen(true)}
          className="w-full bg-gradient-to-r from-[#003cbb] to-[#2563eb] hover:from-[#003095] hover:to-[#1d4ed8] text-white rounded-xl h-11 flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md font-semibold text-[13px]"
        >
          <Sparkles className="w-4 h-4 text-blue-200" strokeWidth={2.5} />
          <span>💡 Simulate What-If GPA</span>
        </Button>
      </div>

      {/* Simulator Modal */}
      <GPAWhatIfSimulator 
        isOpen={isSimulatorOpen} 
        onClose={() => setIsSimulatorOpen(false)} 
      />

      {/* Overall Completion */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] md:text-[14px] font-semibold text-gray-800 dark:text-gray-200">Overall Completion</span>
          <span className="text-[13px] md:text-[14px] font-bold text-[#003cbb] dark:text-[#4d82ff]">31.3%</span>
        </div>
        <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-[#003cbb] dark:bg-[#4d82ff] rounded-full" style={{ width: '31.3%' }}></div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          <span>45 credits earned</span>
          <span>144 total required</span>
        </div>
      </div>
    </div>
  );
}
