"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function SemesterResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const semesterId = decodeURIComponent(params.id as string || "2018/2019.1");

  const courses = [
    { code: "CSC 101", units: 3, title: "Introduction to Computer Science", score: 95, grade: "A", gp: 12 },
    { code: "GEDS001", units: 2, title: "Citizenship Orientation", score: 75, grade: "B", gp: 9 },
    { code: "CSC 212", units: 4, title: "Andriods", score: 65, grade: "C", gp: 4 },
    { code: "COSC 326", units: 3, title: "Assembly Language", score: 90, grade: "A", gp: 10 },
    { code: "BOT 102", units: 3, title: "Introduction to Biology", score: 40, grade: "D", gp: 5 },
    { code: "CHM 203", units: 3, title: "Chemical Thermodynamics", score: 70, grade: "B", gp: 5 },
    { code: "CSC 101", units: 3, title: "Introduction to Computer Science", score: 40, grade: "D", gp: 5 },
  ];

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case "A": return "bg-[#D1F4E0] text-[#1E8B4A]";
      case "B": return "bg-[#E1E7FC] text-[#3B5B98]";
      case "C": return "bg-[#FCECD1] text-[#E08F22]"; 
      case "D": return "bg-[#FCD1D1] text-[#D32F2F]";
      case "F": return "bg-[#FCD1D1] text-[#D32F2F]";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-7xl mx-auto pb-10 px-4 md:px-0 mt-4 md:mt-0">
      {/* Back button */}
      <div>
        <Button 
          variant="outline" 
          className="rounded-[10px] text-blue-600 font-semibold px-4 h-10 border-gray-200 hover:bg-blue-50 hover:text-blue-700 bg-white shadow-sm transition-colors"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Header Container */}
      <Card className="rounded-[24px] bg-white border-0 shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <h2 className="font-bold text-[18px] text-gray-900">Semester Result</h2>
          
          <button className="flex items-center gap-2 border border-blue-100 rounded-[10px] px-3.5 py-2 bg-white text-blue-600 text-[14px] font-semibold hover:bg-blue-50 transition-colors">
            {semesterId}
            <ChevronDown className="w-4 h-4 text-blue-400" />
          </button>
          
          <div className="bg-[#D1F4E0] text-[13px] font-semibold text-[#1E8B4A] px-3.5 py-2 rounded-[10px] flex items-center">
            Semester GPA: 3.52
          </div>
        </div>

        <Button 
          className="bg-[#003CBB] hover:bg-[#5585EA] text-white font-semibold rounded-[12px] h-11 px-6 w-full md:w-auto shadow-sm transition-colors"
          onClick={() => router.push(`/academic-details/semester-results/${encodeURIComponent(semesterId)}/preview`)}
        >
          Export Result
        </Button>
      </Card>

      {/* Table Area */}
      <div className="flex flex-col gap-3">
         {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr] pl-6 pr-6 py-4 bg-[#E5E7EB] rounded-[16px] mb-2">
          <div className="text-[13px] font-bold text-gray-500">Course Info</div>
          <div className="text-[13px] font-bold text-gray-500">Title</div>
          <div className="text-[13px] font-bold text-gray-500 text-center">Score</div>
          <div className="text-[13px] font-bold text-gray-500 text-center">Grade</div>
          <div className="text-[13px] font-bold text-gray-500 text-center">Grade Point</div>
        </div>

        {/* Rows */}
        {courses.map((course, idx) => (
          <Card key={idx} className="rounded-[16px] border border-transparent shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              {/* DESKTOP VIEW */}
              <div className="hidden md:grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr] items-center px-6">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[15px] text-gray-900">{course.code}</span>
                  <span className="text-[11px] font-semibold text-gray-500 border border-gray-200 rounded-md px-2 py-0.5">
                    {course.units} units
                  </span>
                </div>
                
                <div className="text-[15px] text-gray-500 font-medium truncate pr-4">
                  {course.title}
                </div>
                
                <div className="text-center font-bold text-[15px] text-gray-900 bg-transparent flex items-center justify-center">
                  <span>{course.score}</span>
                  <span className="text-[12px] font-normal text-gray-400 ml-1">/100</span>
                </div>
                
                <div className="flex justify-center">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-[17px] font-bold ${getGradeColor(course.grade)}`}>
                    {course.grade}
                  </span>
                </div>
                
                <div className="text-[15px] font-bold text-gray-900 text-center">
                  {course.gp}
                </div>
              </div>

              {/* MOBILE VIEW */}
              <div className="flex flex-col md:hidden p-5 gap-3">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[16px] text-gray-900">{course.code}</span>
                      <span className="text-[11px] font-medium text-gray-500 border border-gray-200 rounded-md px-2 py-0.5">
                        {course.units} units
                      </span>
                    </div>
                    <span className={`w-9 h-9 flex items-center justify-center rounded-full text-[20px] font-bold ${getGradeColor(course.grade)}`}>
                      {course.grade}
                    </span>
                 </div>
                 
                 <div className="text-[14px] text-gray-500 font-medium">
                    {course.title}
                 </div>

                 <div className="h-px bg-gray-100 my-1 w-full" />

                 <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] font-medium text-gray-400">Score</span>
                        <div className="font-bold text-[15px] text-gray-900">
                           {course.score}<span className="text-[12px] font-normal text-gray-400 ml-1">/100</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-[12px] font-medium text-gray-400">Grade Point</span>
                        <span className="font-bold text-[15px] text-gray-900">{course.gp}</span>
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
          
          <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white font-medium text-gray-900 shadow-sm mx-1">
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
           <button className="flex items-center gap-2 border border-gray-200 rounded-[10px] px-4 py-2 bg-white text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors shadow-sm">
              10 / page
              <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
           </button>
        </div>
      </div> */}
    </div>
  );
}
