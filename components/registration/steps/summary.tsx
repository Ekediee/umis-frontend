"use client";

import { Box, BookOpen, ShieldCheck, Church } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { useRegistration } from "@/components/providers/registration-provider";
import { MOCK_COURSES } from "@/lib/mock-data";
import { WORSHIP_CENTERS } from "@/components/registration/steps/select-worship-center";

interface SummaryProps {
  selectedGroup?: string | null;
  selectedCourseIds?: string[];
}

export function Summary(props: SummaryProps) {
  const context = useRegistration();

  const selectedGroup = props.selectedGroup !== undefined ? props.selectedGroup : context.selectedGroup;
  const selectedCourseIds = props.selectedCourseIds !== undefined ? props.selectedCourseIds : context.selectedCourseIds;
  const selectedWorshipCenterId = context.selectedWorshipCenterId;

  const worshipCenter = WORSHIP_CENTERS.find(w => w.id === selectedWorshipCenterId);

  // Resolve actual selected courses from the context's dynamic courses, or fallback to mock data if empty
  const allAvailableCourses = context.courses.length > 0 ? context.courses : MOCK_COURSES;
  const selectedCourses = allAvailableCourses.filter(c => selectedCourseIds.includes(c.id));

  const carryOverCourses = selectedCourses.filter(c => (c as any).isCarryOver);
  const currentCourses = selectedCourses.filter(c => !(c as any).isCarryOver);
  const totalUnits = selectedCourses.reduce((sum, course) => sum + course.units, 0);

  const CourseCard = ({ course }: { course: any }) => (
    <div className="flex flex-col gap-2 p-4 rounded-[16px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[15px] font-bold text-[#0a0d14] dark:text-gray-100">{course.code}</span>
        <span className="inline-flex bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff] font-bold text-[10px] px-2 py-0.5 rounded-[6px] uppercase tracking-wider shrink-0">
          {course.units} UNITS
        </span>
      </div>
      <span className="text-[14px] text-[#525866] dark:text-gray-300 leading-snug">{course.title}</span>
      
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
        <div className="flex flex-col">
          <span className="text-[11px] text-[#868c98] dark:text-gray-500 uppercase tracking-wider">Lecturer</span>
          <span className="text-[13px] font-medium text-[#0a0d14] dark:text-gray-100">{course.lecturer}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-[#868c98] dark:text-gray-500 uppercase tracking-wider">Level</span>
          <span className="text-[13px] font-medium text-[#0a0d14] dark:text-gray-100">{course.level}</span>
        </div>
      </div>
    </div>
  );

  const renderTable = (courses: any[]) => (
    <div className="rounded-[16px] border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
      <Table>
        <TableHeader className="bg-[#f2f4f7] dark:bg-gray-800">
          <TableRow className="hover:bg-[#f2f4f7] dark:hover:bg-gray-800 border-0">
            <TableHead className="font-bold text-[#525866] dark:text-gray-400 text-[12px] tracking-wider pl-6">COURSE CODE</TableHead>
            <TableHead className="font-bold text-[#525866] dark:text-gray-400 text-[12px] tracking-wider">COURSE TITLE</TableHead>
            <TableHead className="font-bold text-[#525866] dark:text-gray-400 text-[12px] tracking-wider">LECTURER</TableHead>
            <TableHead className="font-bold text-[#525866] dark:text-gray-400 text-[12px] tracking-wider">LEVEL</TableHead>
            <TableHead className="font-bold text-[#525866] dark:text-gray-400 text-[12px] tracking-wider text-right pr-6">UNITS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 border-gray-200 dark:border-gray-800">
              <TableCell className="font-bold text-[#0a0d14] dark:text-gray-100 w-[140px] pl-6 whitespace-nowrap">
                {course.code}
              </TableCell>
              <TableCell className="text-[#525866] dark:text-gray-300">
                {course.title}
              </TableCell>
              <TableCell className="text-[#525866] dark:text-gray-300 whitespace-nowrap">
                {course.lecturer}
              </TableCell>
              <TableCell className="text-[#525866] dark:text-gray-300 whitespace-nowrap w-[100px]">
                {course.level}
              </TableCell>
              <TableCell className="text-right pr-6 w-[120px]">
                <span className="inline-flex bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff] font-bold text-[12px] px-3 py-1 rounded-[8px] uppercase tracking-wider">
                  {course.units} UNITS
                </span>
              </TableCell>
            </TableRow>
          ))}
          {courses.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-[#525866] dark:text-gray-400">
                No courses selected.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 md:gap-4 w-full pb-20 max-w-[1200px] mx-auto md:mx-0 md:overflow-y-scroll">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[24px] md:text-[28px] font-bold text-[#0a0a0a] dark:text-gray-100">Registration Summary</h2>
        <p className="text-[14px] md:text-[15px] text-[#525866] dark:text-gray-300 leading-relaxed max-w-[800px]">
          Please review your selected courses below. Once confirmed, your registration will be submitted for approval.
          <br className="hidden md:block" /> Ensure all selections are correct before proceeding.
        </p>
      </div>

      {/* Review Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Total Units Selected */}
        <div className="bg-white dark:bg-gray-900 rounded-[16px] md:rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="w-12 h-12 rounded-full bg-[#eef3fd] dark:bg-[#003cbb]/15 flex items-center justify-center shrink-0">
            <Box className="w-6 h-6 text-[#003cbb] dark:text-[#4d82ff]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] text-[#525866] dark:text-gray-400">Total Units Selected</span>
            <span className="text-[24px] font-bold text-[#0a0d14] dark:text-gray-100">{totalUnits}</span>
          </div>
        </div>

        {/* Number of Courses */}
        <div className="bg-white dark:bg-gray-900 rounded-[16px] md:rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="w-12 h-12 rounded-full bg-[#e9f8f2] dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-[#10b981] dark:text-[#38c793]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] text-[#525866] dark:text-gray-400">Number of Courses</span>
            <span className="text-[24px] font-bold text-[#0a0d14] dark:text-gray-100">{selectedCourses.length}</span>
          </div>
        </div>

        {/* Classification */}
        <div className="bg-white dark:bg-gray-900 rounded-[16px] md:rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="w-12 h-12 rounded-full bg-[#f4eefe] dark:bg-purple-950/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#7c3aed] dark:text-[#a78bfa]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] text-[#525866] dark:text-gray-400">Classification</span>
            <div className="flex items-center gap-2">
              <span className="text-[18px] md:text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 leading-tight">Normal Load</span>
              <span className="bg-[#f6f8fa] dark:bg-gray-850 text-[#525866] dark:text-gray-400 text-[11px] font-bold px-2 py-0.5 rounded-md">200L</span>
            </div>
          </div>
        </div>

        {/* Worship Center */}
        {worshipCenter && (
          <div className="bg-white dark:bg-gray-900 rounded-[16px] md:rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="w-12 h-12 rounded-full bg-[#faf5ff] dark:bg-[#a855f7]/15 flex items-center justify-center shrink-0">
              <Church className="w-6 h-6 text-[#a855f7]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] text-[#525866] dark:text-gray-400">Worship Center</span>
              <span className="text-[18px] md:text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 truncate w-full leading-tight" title={worshipCenter.name}>{worshipCenter.name}</span>
            </div>
          </div>
        )}

      </div>

      {/* Desktop Views */}
      <div className="hidden md:flex flex-col gap-8">
        {carryOverCourses.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-[18px] font-bold text-[#0a0d14] dark:text-gray-100">Carry Over Courses</h3>
            {renderTable(carryOverCourses)}
          </div>
        )}
        
        <div className="flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-[#0a0d14] dark:text-gray-100">Current Semester Courses</h3>
          {renderTable(currentCourses)}
        </div>
      </div>

      {/* Mobile Views */}
      <div className="md:hidden flex flex-col gap-6">
        {carryOverCourses.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-[15px] font-bold text-[#0a0d14] dark:text-gray-100">Carry Over Courses</h3>
            <div className="flex flex-col gap-3">
              {carryOverCourses.map(course => <CourseCard key={course.id} course={course} />)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h3 className="text-[15px] font-bold text-[#0a0d14] dark:text-gray-100">Current Semester Courses</h3>
          <div className="flex flex-col gap-3">
            {currentCourses.map((course: any) => <CourseCard key={course.id} course={course} />)}
          </div>
        </div>
      </div>

    </div>
  );
}
