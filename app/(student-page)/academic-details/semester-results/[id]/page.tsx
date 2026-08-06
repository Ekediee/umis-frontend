"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

import { SEMESTER_DATA_MAP } from "../data";

export default function SemesterResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const semesterId = decodeURIComponent(params.id as string || "2018/2019.1");

  const [isOpen, setIsOpen] = useState(false);
  const semestersList = [
    "2018/2019.1",
    "2018/2019.2",
    "2018/2019.3",
    "2019/2020.1",
    "2019/2020.2",
  ];

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [isOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (sem: string) => {
    router.push(`/academic-details/semester-results/${encodeURIComponent(sem)}`);
    setIsOpen(false);
  };

  const currentSemesterData = SEMESTER_DATA_MAP[semesterId] ?? SEMESTER_DATA_MAP["2018/2019.1"];
  const courses = currentSemesterData.courses;
  const semesterGpa = currentSemesterData.gpa;

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case "A": return "bg-[#D1F4E0] dark:bg-[#1E8B4A]/20 text-[#1E8B4A] dark:text-[#34d399]";
      case "B": return "bg-[#E1E7FC] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff]";
      case "C": return "bg-[#FCECD1] dark:bg-[#E08F22]/20 text-[#E08F22] dark:text-[#fbbf24]"; 
      case "D": return "bg-[#FCD1D1] dark:bg-[#D32F2F]/20 text-[#D32F2F] dark:text-[#f87171]";
      case "F": return "bg-[#FCD1D1] dark:bg-[#D32F2F]/20 text-[#D32F2F] dark:text-[#f87171]";
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-7xl mx-auto pb-10 px-4 mt-4 md:mt-0">
      {/* Back button */}
      <div>
        <Button 
          variant="outline" 
          className="rounded-[10px] text-[#003cbb] dark:text-[#4d82ff] font-semibold px-4 h-10 border-gray-200 dark:border-gray-700 hover:bg-[#f5f8fe] dark:hover:bg-gray-800 hover:text-[#003095] dark:hover:text-[#8ba7ff] bg-white dark:bg-gray-900 transition-colors"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Header Container */}
      <Card className="rounded-[24px] bg-white dark:bg-gray-900 border-0 shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200 !overflow-visible">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <h2 className="font-bold text-[18px] text-gray-900 dark:text-gray-100">Semester Result</h2>
          
          <div className="relative">
            <button 
              onClick={toggleDropdown}
              className="flex items-center gap-2 border border-[#003cbb]/20 dark:border-[#4d82ff]/30 rounded-[10px] px-3.5 py-2 bg-white dark:bg-gray-800 text-[#003cbb] dark:text-[#4d82ff] text-[14px] font-semibold hover:bg-[#f5f8fe] dark:hover:bg-gray-700 transition-colors select-none"
            >
              {semesterId}
              <ChevronDown className={cn("w-4 h-4 text-blue-500 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 mt-1.5 w-[160px] bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-[12px] shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {semestersList.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => handleSelect(sem)}
                    className={cn(
                      "w-full text-left px-3.5 py-2 text-[13px] font-medium transition-colors flex items-center justify-between",
                      sem === semesterId
                        ? "text-[#003cbb] dark:text-[#4d82ff] bg-[#f5f8fe] dark:bg-gray-800/80 font-semibold"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <span>{sem}</span>
                    {sem === semesterId && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#003cbb] dark:bg-[#4d82ff]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-[#D1F4E0] dark:bg-[#1E8B4A]/20 text-[13px] font-semibold text-[#1E8B4A] dark:text-[#34d399] px-3.5 py-2 rounded-[10px] flex items-center transition-colors">
            Semester GPA: {semesterGpa.toFixed(2)}
          </div>
        </div>

        <Button 
          className="bg-[#003CBB] dark:bg-[#4d82ff] hover:bg-[#5585EA] dark:hover:bg-[#7aa4ff] text-white font-semibold rounded-[12px] h-11 px-6 w-full md:w-auto transition-colors"
          onClick={() => router.push(`/academic-details/semester-results/${encodeURIComponent(semesterId)}/preview`)}
        >
          Export Result
        </Button>
      </Card>

      {/* Table Area */}
      <div className="flex flex-col gap-3">
         {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr] pl-6 pr-6 py-4 bg-[#E5E7EB] dark:bg-gray-800 rounded-[16px] mb-2 transition-colors duration-200">
          <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">Course Info</div>
          <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">Title</div>
          <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400 text-center">Score</div>
          <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400 text-center">Grade</div>
          <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400 text-center">Grade Point</div>
        </div>

        {/* Rows */}
        {courses.map((course, idx) => (
          <Card key={idx} className="rounded-[16px] border border-transparent dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-200">
            <CardContent className="p-0">
              {/* DESKTOP VIEW */}
              <div className="hidden md:grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr] items-center px-6 py-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100">{course.code}</span>
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-0.5">
                    {course.units} units
                  </span>
                </div>
                
                <div className="text-[15px] text-gray-500 dark:text-gray-400 font-medium truncate pr-4">
                  {course.title}
                </div>
                
                <div className="text-center font-bold text-[15px] text-gray-900 dark:text-gray-100 bg-transparent flex items-center justify-center">
                  <span>{course.score}</span>
                  <span className="text-[12px] font-normal text-gray-400 dark:text-gray-500 ml-1">/100</span>
                </div>
                
                <div className="flex justify-center">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-[17px] font-bold transition-colors ${getGradeColor(course.grade)}`}>
                    {course.grade}
                  </span>
                </div>
                
                <div className="text-[15px] font-bold text-gray-900 dark:text-gray-100 text-center">
                  {course.gp}
                </div>
              </div>

              {/* MOBILE VIEW */}
              <div className="flex flex-col md:hidden px-5 py-4 gap-3">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[16px] text-gray-900 dark:text-gray-100">{course.code}</span>
                      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-0.5">
                        {course.units} units
                      </span>
                    </div>
                    <span className={`w-9 h-9 flex items-center justify-center rounded-full text-[20px] font-bold transition-colors ${getGradeColor(course.grade)}`}>
                      {course.grade}
                    </span>
                 </div>
                 
                 <div className="text-[14px] text-gray-500 dark:text-gray-400 font-medium">
                    {course.title}
                 </div>

                 <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 w-full" />

                 <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">Score</span>
                        <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                           {course.score}<span className="text-[12px] font-normal text-gray-400 dark:text-gray-500 ml-1">/100</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">Grade Point</span>
                        <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100">{course.gp}</span>
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Footer */}
      {/* <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 text-gray-500 text-[13px] md:text-sm">
        <div>
          Page 1 of 2
        </div>
        
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white font-medium text-gray-900 mx-1">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 font-medium transition-colors">
            2
          </button>
          
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors mx-1">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        <div>
           <button className="flex items-center gap-2 border border-gray-200 rounded-[10px] px-4 py-2 bg-white text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors">
              10 / page
              <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
           </button>
        </div>
      </div> */}
    </div>
  );
}
