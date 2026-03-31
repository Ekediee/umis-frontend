'use client'
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";


const GPAMetric = () => {
    const [showCgpa, setShowCgpa] = useState(true);
    const [showSemesterGpa, setShowSemesterGpa] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
    const savedCgpa = localStorage.getItem("showCgpa");
    const savedGpa = localStorage.getItem("showSemesterGpa");
    if (savedCgpa !== null) setShowCgpa(savedCgpa === "true");
    if (savedGpa !== null) setShowSemesterGpa(savedGpa === "true");
    setMounted(true);
    }, []);

    const toggleCgpa = () => {
    const next = !showCgpa;
    setShowCgpa(next);
    localStorage.setItem("showCgpa", String(next));
    };

    const toggleSemesterGpa = () => {
    const next = !showSemesterGpa;
    setShowSemesterGpa(next);
    localStorage.setItem("showSemesterGpa", String(next));
    };
  return (
    <div className="flex items-center gap-2 mb-8">
        {/* CGPA */}
        <div className="flex-1 bg-[#F8F9FB] rounded-2xl p-4 flex items-center justify-between">
        <div className="flex flex-col mr-1">
            <span className="text-[28px] font-bold text-[#1E1E1E] leading-none mb-1">
            {showCgpa ? "3.67" : "****"}
            </span>
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide">CGPA</span>
        </div>
        
        <button
            type="button"
            onClick={toggleCgpa}
            className="w-11 h-11 flex items-center justify-center -mr-4 text-gray-400 active:text-gray-600 md:hover:text-gray-600 transition-colors rounded-full touch-manipulation"
            aria-label={showCgpa ? "Hide CGPA" : "Show CGPA"}
        >
            {showCgpa ? (
            <Eye className="w-5 h-5" /> 
            ) : (
            <EyeOff className="w-5 h-5" />
            )}
        </button>
        </div>

        {/* SEMESTER GPA */}
        <div className="flex-1 bg-[#F8F9FB] rounded-2xl p-4 flex items-center justify-between">
        <div className="flex flex-col mr-1">
            <span className="text-[28px] font-bold text-[#209255] leading-none mb-1">
            {showSemesterGpa ? "3.52" : "****"}
            </span>
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide">SEMESTER GPA</span>
        </div>
        <button
            type="button"
            onClick={toggleSemesterGpa}
            className="w-11 h-11 flex items-center justify-center -mr-2 text-gray-400 active:text-gray-600 md:hover:text-gray-600 transition-colors rounded-full touch-manipulation"
            aria-label={showSemesterGpa ? "Hide Semester GPA" : "Show Semester GPA"}
        >
            {showSemesterGpa ? (
            <Eye className="w-5 h-5" /> 
            ) : (
            <EyeOff className="w-5 h-5" />
            )}
        </button>
        </div>

        {/* CURRENT LEVEL */}
        <div className="flex-1 bg-[#F8F9FB] rounded-2xl p-4 flex items-center justify-between">
        <div className="flex flex-col">
            <span className="text-[28px] font-bold text-[#1E1E1E] leading-none mb-1">200</span>
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">Current Level</span>
        </div>
        </div>
    </div>
  )
}

export default GPAMetric