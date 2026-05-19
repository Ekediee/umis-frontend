"use client";

import { ChevronLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Mock Data
const STUDENT_INFO = {
  name: "YAKUBU ONOME JOY",
  nationality: "Nigeria",
  id: "23/0039",
  sex: "Female",
  school: "School of Computing",
  ms: "S",
  degreeGoal: "B.A (Hons) Bachelor of",
  major: "Software Engineering",
};

const PERFORMANCE_DATA = [
  { year: "2023/2024", sem1Hrs: "-", sem1Gpa: "-", cum1Hrs: "-", cum1Gpa: "-", sem1CHrs: "17.00", sem1CGpa: "4.29", cum1CHrs: "17.00", cum1CGpa: "4.29", sem2Hrs: "-", sem2Gpa: "-", cum2Hrs: "-", cum2Gpa: "-" },
  { year: "2024/2025", sem1Hrs: "19.00", sem1Gpa: "4.26", cum1Hrs: "56.00", cum1Gpa: "4.29", sem1CHrs: "-", sem1CGpa: "-", cum1CHrs: "-", cum1CGpa: "-", sem2Hrs: "17.00", sem2Gpa: "4.24", cum2Hrs: "73.00", cum2Gpa: "4.27" },
  { year: "2025/2026", sem1Hrs: "22.00", sem1Gpa: "4.64", cum1Hrs: "95.00", cum1Gpa: "4.36", sem1CHrs: "-", sem1CGpa: "-", cum1CHrs: "-", cum1CGpa: "-", sem2Hrs: "-", sem2Gpa: "-", cum2Hrs: "-", cum2Gpa: "-" },
];

const COURSE_HISTORY = [
  { sem: "23/24.1C", id: "BU-COS", title: "Intro to Scripting Languages", hrs: "2.0", grd: "B" },
  { sem: "23/24.1C", id: "COS 101", title: "INTRODUCTION TO COMPUTER", hrs: "3.0", grd: "B" },
  { sem: "23/24.1C", id: "GST 111", title: "Communication in English", hrs: "2.0", grd: "B" },
  { sem: "23/24.1C", id: "PHY 101", title: "General Physics I", hrs: "2.0", grd: "A", highlight: true },
  { sem: "23/24.1C", id: "STA 111", title: "Descriptive Statistics", hrs: "3.0", grd: "A", highlight: true },
  { sem: "23/24.2C", id: "BU-GST", title: "Health Principles", hrs: "1.0", grd: "B" },
  { sem: "23/24.2C", id: "BU-SEN", title: "Web Design and Development", hrs: "3.0", grd: "A", highlight: true },
  { sem: "23/24.2C", id: "GST 112", title: "Nigeria People and culture", hrs: "2.0", grd: "B" },
  { sem: "23/24.2C", id: "PHY 102", title: "General Physics II", hrs: "2.0", grd: "B" },
  { sem: "24/25.1", id: "CSC 203", title: "Discrete Structures", hrs: "2.0", grd: "B" },
  { sem: "24/25.1", id: "IFT 211", title: "Digital Logic Design", hrs: "2.0", grd: "B" },
  { sem: "25/26.1", id: "SEN 301", title: "OO Analysis & Design", hrs: "2.0", grd: "A", highlight: true },
  { sem: "24/25.1", id: "BU-COS", title: "Innovation in Web Design", hrs: "2.0", grd: "A", highlight: true },
  { sem: "24/25.1", id: "BU-GST", title: "Adventist Heritage", hrs: "3.0", grd: "A", highlight: true },
  { sem: "24/25.1", id: "ENT 211", title: "Entrepreneurship & Innovation", hrs: "2.0", grd: "A", highlight: true },
  { sem: "24/25.2", id: "BU-SEN", title: "Internet Technology Web", hrs: "3.0", grd: "A", highlight: true },
  { sem: "24/25.2", id: "GST 212", title: "Phil. Logic & Human", hrs: "2.0", grd: "A", highlight: true },
  { sem: "24/25.2", id: "INS 204", title: "System Analysis & Design", hrs: "3.0", grd: "B" },
  { sem: "25/26.1", id: "BU-COS", title: "Intro to Machine Learning", hrs: "2.0", grd: "B" },
  { sem: "25/26.1", id: "BU-CSC", title: "Database System Design", hrs: "3.0", grd: "A", highlight: true },
  { sem: "25/26.1", id: "BU-GST", title: "Fundamentals of Christian Faith", hrs: "3.0", grd: "A", highlight: true },
  { sem: "25/26.1", id: "BU-SEN", title: "Mobile App Development", hrs: "2.0", grd: "A", highlight: true },
  { sem: "25/26.1", id: "CSC 309", title: "Artificial Intelligence", hrs: "2.0", grd: "A", highlight: true },
  { sem: "25/26.1", id: "SEN 201", title: "Intro to Software Engineering", hrs: "2.0", grd: "A", highlight: true },
];

export default function TranscriptPage() {
  const router = useRouter();

  // Split history into two columns for desktop
  const midpoint = Math.ceil(COURSE_HISTORY.length / 2);
  const leftCol = COURSE_HISTORY.slice(0, midpoint);
  const rightCol = COURSE_HISTORY.slice(midpoint);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // We would use html2pdf.js or @react-pdf/renderer here
    alert("PDF download initiated.");
  };

  return (
    <div className="flex flex-col w-full h-full pb-20 md:pb-6 px-4 md:px-6">
      
      {/* Mobile Header Title */}
      <h2 className="text-[20px] font-semibold text-gray-900 dark:text-gray-100 md:hidden mb-4">Export Unofficial Transcript</h2>

      {/* Top Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full bg-white dark:bg-[#1E1E1E] border border-transparent dark:border-[#2C2C2C] rounded-[16px] md:rounded-[12px] p-2 mb-6 transition-colors duration-200">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="rounded-[8px] h-9 text-[#003cbb] dark:text-gray-100 border-[#e2e4e9] dark:border-gray-700 hover:bg-[#f8faff] dark:hover:bg-[#2C2C2C] dark:bg-transparent text-[13px] font-medium hidden md:flex transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <span className="text-[15px] font-bold text-gray-900 dark:text-white hidden md:block">Document Preview</span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            variant="outline"
            onClick={handleDownload}
            className="flex-1 md:flex-none rounded-[8px] h-10 border-[#e2e4e9] dark:border-gray-700 text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-[#2C2C2C] dark:bg-transparent transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button 
            onClick={handlePrint}
            className="flex-1 md:flex-none rounded-[8px] h-10 bg-[#0a1e6e] dark:bg-[#2563EB] hover:bg-[#00104a] dark:hover:bg-[#1D4ED8] text-white font-medium shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Document
          </Button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW WRAPPER */}
      <div className="w-full bg-white dark:bg-gray-900 rounded-[16px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden print:shadow-none print:border-none print:p-0 relative transition-colors duration-200">
        
        {/* Watermark Logo inside document */}
        <div className="absolute inset-0 flex justify-center items-center opacity-[0.03] dark:opacity-[0.02] pointer-events-none overflow-hidden">
          <Image 
            src="/school-logo.png" 
            alt="" 
            width={600} 
            height={600} 
            className="object-contain" 
            onError={(e) => { e.currentTarget.style.display = 'none' }} // fallback
          />
        </div>

        <div className="p-6 md:p-12 relative z-10 w-full max-w-[1000px] mx-auto min-h-[1000px] flex flex-col">
          
          {/* Header */}
          <div className="text-center mb-10 md:mb-14">
            <h1 className="text-[28px] md:text-[36px] font-serif font-bold text-[#1e293b] dark:text-gray-100 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Unofficial Academic Record
            </h1>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="h-px bg-gray-200 dark:bg-gray-700 w-12 md:w-24 transition-colors"></div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase">
                For Internal Advising Only
              </span>
              <div className="h-px bg-gray-200 dark:bg-gray-700 w-12 md:w-24 transition-colors"></div>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="w-full bg-[#f8fafc] dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-[12px] p-5 md:p-6 mb-10 transition-colors duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 border-dashed pb-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Student Name</span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{STUDENT_INFO.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 border-dashed pb-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Student ID</span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{STUDENT_INFO.id}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 border-dashed pb-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">School</span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{STUDENT_INFO.school}</span>
                </div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Degree Goal</span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{STUDENT_INFO.degreeGoal}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 border-dashed pb-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Nationality</span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{STUDENT_INFO.nationality}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 border-dashed pb-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sex</span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{STUDENT_INFO.sex}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 border-dashed pb-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">M / S</span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{STUDENT_INFO.ms}</span>
                </div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Major</span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{STUDENT_INFO.major}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Performance Summary */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 bg-[#003cbb] dark:bg-[#4d82ff] rounded-full"></div>
              <h3 className="text-[12px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Performance Summary</h3>
            </div>
            
            <div className="overflow-x-auto w-full pb-2">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                    <th className="py-3 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Academic Year</th>
                    <th colSpan={2} className="py-2 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Semester 1</th>
                    <th colSpan={2} className="py-2 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Cumulative</th>
                    <th colSpan={2} className="py-2 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Semester 1C</th>
                    <th colSpan={2} className="py-2 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Cumulative</th>
                    <th colSpan={2} className="py-2 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Semester 2</th>
                    <th colSpan={2} className="py-2 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Cumulative</th>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                    <th className="border-r border-gray-200 dark:border-gray-700"></th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">HRS</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">GPA</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">HRS</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">GPA</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">HRS</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">GPA</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">HRS</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">GPA</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">HRS</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">GPA</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700 border-t border-gray-200 dark:border-gray-700">HRS</th>
                    <th className="py-2 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center border-t border-gray-200 dark:border-gray-700">GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {PERFORMANCE_DATA.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-[12px] font-bold text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-800">{row.year}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.sem1Hrs}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.sem1Gpa}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.cum1Hrs}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.cum1Gpa}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.sem1CHrs}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.sem1CGpa}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.cum1CHrs}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.cum1CGpa}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.sem2Hrs}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.sem2Gpa}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-gray-800">{row.cum2Hrs}</td>
                      <td className="py-3 px-2 text-[12px] text-gray-600 dark:text-gray-300 text-center">{row.cum2Gpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Course Enrollment History */}
          <div className="flex-1 mb-16">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 bg-[#003cbb] dark:bg-[#4d82ff] rounded-full"></div>
              <h3 className="text-[12px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Course Enrollment History</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full">
              
              {/* Left Column */}
              <div className="w-full">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                      <th className="py-3 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-[15%]">SEM</th>
                      <th className="py-3 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-[20%]">ID</th>
                      <th className="py-3 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-[45%]">Course Title</th>
                      <th className="py-3 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right w-[10%]">HRS</th>
                      <th className="py-3 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right w-[10%]">GRD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leftCol.map((course, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className={`py-3 px-2 text-[11px] md:text-[12px] ${course.highlight ? 'text-[#003cbb] dark:text-[#4d82ff] font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{course.sem}</td>
                        <td className="py-3 px-2 text-[11px] md:text-[12px] font-medium text-gray-900 dark:text-gray-100">{course.id}</td>
                        <td className="py-3 px-2 text-[11px] md:text-[12px] text-gray-700 dark:text-gray-300 truncate pr-4 max-w-[150px] md:max-w-[200px]" title={course.title}>{course.title}</td>
                        <td className="py-3 px-2 text-[11px] md:text-[12px] text-gray-600 dark:text-gray-400 text-right">{course.hrs}</td>
                        <td className={`py-3 px-2 text-[11px] md:text-[12px] font-bold text-right ${course.highlight ? 'text-[#003cbb] dark:text-[#4d82ff]' : 'text-gray-900 dark:text-gray-100'}`}>{course.grd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Column (Hidden on mobile unless merged, but keeping desktop layout for simplicity) */}
              <div className="w-full hidden lg:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                      <th className="py-3 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-[15%]">SEM</th>
                      <th className="py-3 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-[20%]">ID</th>
                      <th className="py-3 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-[45%]">Course Title</th>
                      <th className="py-3 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right w-[10%]">HRS</th>
                      <th className="py-3 px-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right w-[10%]">GRD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rightCol.map((course, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className={`py-3 px-2 text-[11px] md:text-[12px] ${course.highlight ? 'text-[#003cbb] dark:text-[#4d82ff] font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{course.sem}</td>
                        <td className="py-3 px-2 text-[11px] md:text-[12px] font-medium text-gray-900 dark:text-gray-100">{course.id}</td>
                        <td className="py-3 px-2 text-[11px] md:text-[12px] text-gray-700 dark:text-gray-300 truncate pr-4 max-w-[200px]" title={course.title}>{course.title}</td>
                        <td className="py-3 px-2 text-[11px] md:text-[12px] text-gray-600 dark:text-gray-400 text-right">{course.hrs}</td>
                        <td className={`py-3 px-2 text-[11px] md:text-[12px] font-bold text-right ${course.highlight ? 'text-[#003cbb] dark:text-[#4d82ff]' : 'text-gray-900 dark:text-gray-100'}`}>{course.grd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Right Column items appended to bottom on small screens */}
              <div className="w-full block lg:hidden">
                <table className="w-full text-left">
                   {/* Headers omitted to connect to top table visually */}
                  <tbody>
                    {rightCol.map((course, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className={`py-3 px-2 text-[11px] md:text-[12px] ${course.highlight ? 'text-[#003cbb] dark:text-[#4d82ff] font-medium' : 'text-gray-600 dark:text-gray-400'} w-[15%]`}>{course.sem}</td>
                        <td className="py-3 px-2 text-[11px] md:text-[12px] font-medium text-gray-900 dark:text-gray-100 w-[20%]">{course.id}</td>
                        <td className="py-3 px-2 text-[11px] md:text-[12px] text-gray-700 dark:text-gray-300 truncate pr-4 max-w-[150px] w-[45%]" title={course.title}>{course.title}</td>
                        <td className="py-3 px-2 text-[11px] md:text-[12px] text-gray-600 dark:text-gray-400 text-right w-[10%]">{course.hrs}</td>
                        <td className={`py-3 px-2 text-[11px] md:text-[12px] font-bold text-right ${course.highlight ? 'text-[#003cbb] dark:text-[#4d82ff]' : 'text-gray-900 dark:text-gray-100'} w-[10%]`}>{course.grd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* Footer Annotations */}
          <div className="mt-auto flex flex-col md:flex-row items-end justify-between border-t border-gray-200 dark:border-gray-700 pt-6 pb-2 transition-colors">
            <div className="flex flex-col gap-1.5 w-full md:w-auto">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Key & Annotations</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">* Indicates repeated course without credit (NG: No Grade Available)</span>
              <span className="text-[10px] text-gray-300 dark:text-gray-600 uppercase tracking-widest mt-4">System Log ID: TR-2026-X039-B</span>
            </div>
            
            <div className="flex flex-col items-end gap-2 mt-6 md:mt-0">
              <div className="w-[140px] h-[40px] border border-dashed border-[#cbd5e1] dark:border-gray-700 bg-[#f8fafc] dark:bg-gray-800/50 rounded flex flex-col items-center justify-center p-1 transition-colors">
                 <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Digital Stamp Area</span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Official Record Only If Stamped</span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider mt-4">PAGE 01 OF 01</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
