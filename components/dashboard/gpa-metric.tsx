'use client'

import { AcademicProgressProps } from "./academic-progress";
import { useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";
import { Button } from "@/components/ui/button";
import { GPAWhatIfSimulator } from "@/components/academic-details/gpa-what-if-simulator";

const GPAMetric = ({ cgpa, semester_gpa, current_level }: AcademicProgressProps) => {
    const [showCgpa, toggleCgpa, mountedCgpa] = usePersistentToggle("showCgpa", true);
    const [showSemesterGpa, toggleSemesterGpa, mountedSemesterGpa] = usePersistentToggle("showSemesterGpa", true);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

    const mounted = mountedCgpa && mountedSemesterGpa;

    if (!mounted) return null;

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {/* CGPA */}
                <div className="bg-[#f6f8fa] dark:bg-gray-800 rounded-[20px] p-4 md:p-5 flex flex-col items-start justify-center h-[70px] md:h-[80px] relative transition-colors duration-200">
                    <div className="flex items-center gap-3 justify-between md:gap-5 w-full">
                        <span className="text-[24px] md:text-[28px] font-black text-[#253ea7] dark:text-[#4d82ff] leading-none">
                            {showCgpa ? "3.67" : "****"}
                        </span>
                        <button
                            type="button"
                            onClick={toggleCgpa}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                            aria-label={showCgpa ? "Hide CGPA" : "Show CGPA"}
                        >
                            {showCgpa ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                    </div>
                    <span className="text-[12px] font-normal text-[#4a5565] dark:text-gray-400 mt-1">CGPA</span>
                </div>

                {/* SEMESTER GPA */}
                <div className="bg-[#f6f8fa] dark:bg-gray-800 rounded-[20px] p-4 md:p-5 flex flex-col items-start justify-center h-[70px] md:h-[80px] relative transition-colors duration-200">
                    <div className="flex items-center gap-3 justify-between md:gap-5 w-full">
                        <span className="text-[24px] md:text-[28px] font-black text-[#2d9f75] dark:text-[#34d399] leading-none">
                            {showSemesterGpa ? "3.52" : "****"}
                        </span>
                        <button
                            type="button"
                            onClick={toggleSemesterGpa}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                            aria-label={showSemesterGpa ? "Hide Semester GPA" : "Show Semester GPA"}
                        >
                            {showSemesterGpa ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                    </div>
                    <span className="text-[12px] font-normal text-[#4a5565] dark:text-gray-400 mt-1">Semester GPA</span>
                </div>

                {/* CURRENT LEVEL */}
                <div className="col-span-2 md:col-span-1 bg-[#f6f8fa] dark:bg-gray-800 rounded-[20px] p-4 md:p-5 flex flex-col items-start justify-center h-[70px] md:h-[80px] transition-colors duration-200">
                    <span className="text-[24px] md:text-[28px] font-black text-[#0a0d14] dark:text-gray-100 leading-none">200</span>
                    <span className="text-[12px] font-normal text-[#4a5565] dark:text-gray-400 mt-1 uppercase">Level</span>
                </div>
            </div>

            {/* GPA What-If Simulator Action Trigger */}
            <div className="flex justify-end border-t border-gray-100 dark:border-gray-800/80 pt-4 mt-2">
                <Button
                    onClick={() => setIsSimulatorOpen(true)}
                    className="bg-gradient-to-r from-[#003cbb] to-[#2563eb] hover:from-[#003095] hover:to-[#1d4ed8] text-white rounded-xl h-11 flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md px-6 font-semibold"
                >
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>💡 Simulate What-If GPA</span>
                </Button>
            </div>

            {/* Simulator Modal */}
            <GPAWhatIfSimulator
                isOpen={isSimulatorOpen}
                onClose={() => setIsSimulatorOpen(false)}
            />
        </div>
    );
};

export default GPAMetric;