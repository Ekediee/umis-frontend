'use client'
import { Eye, EyeOff } from "lucide-react";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";


const GPAMetric = () => {
    const [showCgpa, toggleCgpa, mountedCgpa] = usePersistentToggle("showCgpa", true);
    const [showSemesterGpa, toggleSemesterGpa, mountedSemesterGpa] = usePersistentToggle("showSemesterGpa", true);

    const mounted = mountedCgpa && mountedSemesterGpa;

    if (!mounted) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {/* CGPA */}
            <div className="bg-[#f6f8fa] rounded-[16px] p-4 md:p-5 flex flex-col items-start justify-center h-[70px] md:h-[80px] relative">
                <div className="flex items-center gap-3 justify-between md:gap-5 w-full">
                    <span className="text-[24px] md:text-[28px] font-black text-[#253ea7] leading-none">
                        {showCgpa ? "3.67" : "****"}
                    </span>
                    <button
                        type="button"
                        onClick={toggleCgpa}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label={showCgpa ? "Hide CGPA" : "Show CGPA"}
                    >
                        {showCgpa ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                </div>
                <span className="text-[12px] font-normal text-[#4a5565] mt-1">CGPA</span>
            </div>

            {/* SEMESTER GPA */}
            <div className="bg-[#f6f8fa] rounded-[16px] p-4 md:p-5 flex flex-col items-start justify-center h-[70px] md:h-[80px] relative">
                <div className="flex items-center gap-3 justify-between md:gap-5 w-full">
                    <span className="text-[24px] md:text-[28px] font-black text-[#2d9f75] leading-none">
                        {showSemesterGpa ? "3.52" : "****"}
                    </span>
                    <button
                        type="button"
                        onClick={toggleSemesterGpa}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label={showSemesterGpa ? "Hide Semester GPA" : "Show Semester GPA"}
                    >
                        {showSemesterGpa ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                </div>
                <span className="text-[12px] font-normal text-[#4a5565] mt-1">Semester GPA</span>
            </div>

            {/* CURRENT LEVEL */}
            <div className="col-span-2 md:col-span-1 bg-[#f6f8fa] rounded-[16px] p-4 md:p-5 flex flex-col items-start justify-center h-[70px] md:h-[80px]">
                <span className="text-[24px] md:text-[28px] font-black text-[#0a0d14] leading-none">200</span>
                <span className="text-[12px] font-normal text-[#4a5565] mt-1 uppercase">Level</span>
            </div>
        </div>
    );
};

export default GPAMetric;