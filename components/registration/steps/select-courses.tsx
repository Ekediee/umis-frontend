"use client";

import { useState } from "react";
import { Check, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Course, MOCK_COURSES } from "@/lib/mock-data";

interface SelectCoursesProps {
  selectedCourseIds: string[];
  onToggleCourse: (courseId: string) => void;
}

export function SelectCourses({ selectedCourseIds, onToggleCourse }: SelectCoursesProps) {
  const [activeTab, setActiveTab] = useState<"carry_over" | "current">("current");
  
  const carryOverCourses = MOCK_COURSES.filter(c => c.isCarryOver);
  const currentCourses = MOCK_COURSES.filter(c => !c.isCarryOver);
  
  // A course is selected if its ID is in selectedCourseIds
  const isSelected = (course: Course) => selectedCourseIds.includes(course.id);
  
  const selectedCourses = MOCK_COURSES.filter(isSelected);
  const totalUnits = selectedCourses.reduce((sum, course) => sum + course.units, 0);
  const MAX_UNITS = 23;

  // Determine which list to show on desktop based on tab
  const displayedCoursesDesktop = activeTab === "carry_over" ? carryOverCourses : currentCourses;
  const isAllDisplayedSelectedDesktop = displayedCoursesDesktop.length > 0 && displayedCoursesDesktop.every(isSelected);

  const handleSelectAllDesktop = () => {
    if (isAllDisplayedSelectedDesktop) {
      displayedCoursesDesktop.forEach(c => {
        if (selectedCourseIds.includes(c.id)) {
          onToggleCourse(c.id);
        }
      });
    } else {
      displayedCoursesDesktop.forEach(c => {
        if (!isSelected(c)) {
          onToggleCourse(c.id);
        }
      });
    }
  };

  const isAllCurrentSelected = currentCourses.length > 0 && currentCourses.every(isSelected);
  const handleSelectAllCurrentMobile = () => {
    if (isAllCurrentSelected) {
      currentCourses.forEach(c => {
        if (selectedCourseIds.includes(c.id)) {
          onToggleCourse(c.id);
        }
      });
    } else {
      currentCourses.forEach(c => {
        if (!isSelected(c)) {
          onToggleCourse(c.id);
        }
      });
    }
  };

  // Shared Card component for Mobile
  const CourseCard = ({ course }: { course: Course }) => {
    const selected = isSelected(course);
    return (
      <label 
        className={cn(
          "flex items-start gap-3 p-4 rounded-[16px] cursor-pointer transition-all border",
          selected ? "bg-[#f8faff] border-[#ccdaf9]" : "bg-white border-gray-100"
        )}
      >
        <div className="pt-1">
          <div className={cn(
            "w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors",
            selected ? "bg-[#003cbb] border-[#003cbb]" : "bg-white border-[#cdd0d5]"
          )}>
            {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
          <input 
            type="checkbox" 
            className="sr-only" 
            checked={selected}
            onChange={() => onToggleCourse(course.id)}
          />
        </div>

        <div className="flex flex-col w-full gap-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[15px] font-bold text-[#0a0d14]">{course.code}</span>
            <span className="inline-flex bg-[#eef3fd] text-[#003cbb] font-bold text-[10px] px-2 py-0.5 rounded-[6px] uppercase tracking-wider shrink-0">
              {course.units} UNITS
            </span>
          </div>
          <span className="text-[14px] text-[#525866] leading-snug">{course.title}</span>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#868c98] uppercase tracking-wider">Lecturer</span>
              <span className="text-[13px] font-medium text-[#0a0d14]">{course.lecturer}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-[#868c98] uppercase tracking-wider">Level</span>
              <span className="text-[13px] font-medium text-[#0a0d14]">{course.level}</span>
            </div>
          </div>
        </div>
      </label>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-[1200px] md:mx-0">
      
      {/* Tabs (Hidden on Mobile) */}
      <div className="hidden md:flex items-center gap-6 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab("carry_over")}
          className={cn(
            "pb-3 text-[14px] md:text-[15px] font-medium transition-colors relative",
            activeTab === "carry_over" ? "text-[#0a0a0a]" : "text-[#525866] hover:text-[#0a0a0a]"
          )}
        >
          Carry Over courses
          {activeTab === "carry_over" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003cbb]" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("current")}
          className={cn(
            "pb-3 text-[14px] md:text-[15px] font-medium transition-colors relative",
            activeTab === "current" ? "text-[#0a0a0a]" : "text-[#525866] hover:text-[#0a0a0a]"
          )}
        >
          Current Semester courses
          {activeTab === "current" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003cbb]" />
          )}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Desktop Table View */}
        <div className="hidden md:flex flex-col rounded-[16px] overflow-hidden border border-gray-200">
          {/* Dark Header */}
          <div className="bg-[#21242d] text-white px-6 py-4 flex items-center justify-between">
            <div 
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleSelectAllDesktop}
            >
              <div className={cn(
                "w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors",
                isAllDisplayedSelectedDesktop ? "bg-white border-white" : "bg-transparent border-white/40"
              )}>
                {isAllDisplayedSelectedDesktop && <Check className="w-3.5 h-3.5 text-[#21242d]" strokeWidth={3} />}
              </div>
              <span className="text-[15px] font-medium">Select all</span>
            </div>
            
            <div className="text-[15px] font-medium">
              Total Units: {totalUnits}/{MAX_UNITS}
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white">
            <Table>
              <TableBody>
                {displayedCoursesDesktop.map((course) => {
                  const selected = isSelected(course);
                  return (
                    <TableRow 
                      key={course.id}
                      className={cn(
                        "cursor-pointer hover:bg-gray-50/50",
                        selected && "bg-[#f8faff] hover:bg-[#f8faff]"
                      )}
                      onClick={() => onToggleCourse(course.id)}
                    >
                      <TableCell className="w-[60px] pl-6">
                        <div className={cn(
                          "w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors",
                          selected ? "bg-[#003cbb] border-[#003cbb]" : "bg-white border-[#cdd0d5]"
                        )}>
                          {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-[#0a0d14] w-[140px] whitespace-nowrap">
                        {course.code}
                      </TableCell>
                      <TableCell className="text-[#525866]">
                        {course.title}
                      </TableCell>
                      <TableCell className="text-[#525866] whitespace-nowrap">
                        {course.lecturer}
                      </TableCell>
                      <TableCell className="text-[#525866] whitespace-nowrap w-[100px]">
                        {course.level}
                      </TableCell>
                      <TableCell className="text-right pr-6 w-[120px]">
                        <span className="inline-flex bg-[#eef3fd] text-[#003cbb] font-bold text-[12px] px-3 py-1 rounded-[8px] uppercase tracking-wider">
                          {course.units} UNITS
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile View (No Tabs) */}
        <div className="md:hidden flex flex-col gap-6">
          
          {/* Carry Over Section */}
          {carryOverCourses.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[15px] font-bold text-[#0a0d14]">Carry Over Courses</h3>
              <div className="flex flex-col gap-3">
                {carryOverCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          )}

          {/* Current Semester Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[15px] font-bold text-[#0a0d14]">Current Semester Courses</h3>
            
            {/* Unit Summary / Select All Banner */}
            <div className="bg-[#eef3fd] rounded-[16px] p-4 flex flex-col justify-between gap-4 border border-[#ccdaf9]">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={handleSelectAllCurrentMobile}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors",
                    isAllCurrentSelected ? "bg-[#003cbb] border-[#003cbb]" : "bg-white border-[#cdd0d5]"
                  )}>
                    {isAllCurrentSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-[14px] text-[#525866]">Select all</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[14px] text-[#525866]">Total Units:</span>
                  <span className={cn(
                    "text-[14px] font-bold ml-1",
                    totalUnits > MAX_UNITS ? "text-[#D92D20]" : "text-[#003cbb]"
                  )}>
                    {totalUnits}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {currentCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-[#525866]">
          <span className="text-[14px] font-medium">Page 1 of 2</span>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50" disabled>
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1 mx-2">
              <button className="w-8 h-8 rounded-md bg-[#f6f8fa] border border-gray-200 text-[#0a0a0a] font-medium text-[14px] flex items-center justify-center">1</button>
              <button className="w-8 h-8 rounded-md hover:bg-gray-100 text-[#525866] font-medium text-[14px] flex items-center justify-center">2</button>
            </div>

            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select className="border border-gray-200 rounded-md px-2 py-1.5 text-[14px] font-medium bg-transparent outline-none focus:border-[#003cbb]">
              <option>10 / page</option>
              <option>20 / page</option>
              <option>50 / page</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}
