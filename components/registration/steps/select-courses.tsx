"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AICourseAdvisor } from "@/components/registration/ai-course-advisor";
import { type CourseItem } from "@/app/actions/registration";
import { useRegistration } from "@/components/providers/registration-provider";

// ── Course Card (mobile) ──────────────────────────────────────────────────────

interface CourseCardProps {
  course: CourseItem;
  selected: boolean;
  onToggle: () => void;
}

const CourseCard = ({ course, selected, onToggle }: CourseCardProps) => {
  return (
    <label
      className={cn(
        "flex items-start gap-3 p-4 rounded-[16px] cursor-pointer transition-all duration-200 border",
        selected
          ? "bg-[#f8faff] dark:bg-[#003cbb]/20 border-[#003cbb] dark:border-[#4d82ff] shadow-[0_4px_16px_rgba(0,60,187,0.06)] dark:shadow-[0_0_15px_rgba(77,130,255,0.15)] scale-[1.01]"
          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"
      )}
    >
      <div className="pt-1">
        <div className={cn(
          "w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors",
          selected ? "bg-[#003cbb] dark:bg-[#4d82ff] border-[#003cbb] dark:border-[#4d82ff]" : "bg-white dark:bg-gray-800 border-[#cdd0d5] dark:border-gray-700"
        )}>
          {selected && <Check className="w-3.5 h-3.5 text-white dark:text-gray-900" strokeWidth={3} />}
        </div>
        <input
          type="checkbox"
          className="sr-only"
          checked={selected}
          onChange={onToggle}
        />
      </div>

      <div className="flex flex-col w-full gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[15px] font-bold text-[#0a0d14] dark:text-gray-100">{course.code}</span>
          <span className="inline-flex bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff] font-bold text-[10px] px-2 py-0.5 rounded-[6px] uppercase tracking-wider shrink-0">
            {course.units} UNITS
          </span>
        </div>
        <span className="text-[14px] text-[#525866] dark:text-gray-400 leading-snug">{course.title}</span>

        <div className="flex items-center gap-4 mt-2">
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
    </label>
  );
};

// ── Loading Skeleton ──────────────────────────────────────────────────────────

const TableSkeleton = () => (
  <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
        <div className="w-5 h-5 rounded-[6px] bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="w-[110px] h-4 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 h-4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="w-[140px] h-4 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="w-[60px] h-4 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="w-[70px] h-6 rounded-[8px] bg-gray-200 dark:bg-gray-700 shrink-0" />
      </div>
    ))}
  </div>
);

const CardSkeleton = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 p-4 rounded-[16px] border border-gray-100 dark:border-gray-800 animate-pulse">
        <div className="w-5 h-5 rounded-[6px] bg-gray-200 dark:bg-gray-700 mt-1 shrink-0" />
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-between">
            <div className="w-[100px] h-4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="w-[60px] h-5 rounded-[6px] bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="w-full h-3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="w-2/3 h-3 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    ))}
  </div>
);

// ── Empty / Error states ──────────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600" />
    <p className="text-[14px] text-[#525866] dark:text-gray-400">{message}</p>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    <AlertCircle className="w-10 h-10 text-red-400" />
    <p className="text-[14px] text-red-500 dark:text-red-400">{message}</p>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

interface SelectCoursesProps {
  /** Live courses returned from the API for the selected class group */
  courses?: CourseItem[];
  isLoading?: boolean;
  error?: string | null;
  selectedCourseIds?: string[];
  onToggleCourse?: (courseId: string) => void;
}

export function SelectCourses(props: SelectCoursesProps) {
  const context = useRegistration();

  const courses = props.courses !== undefined ? props.courses : context.courses;
  const isLoading = props.isLoading !== undefined ? props.isLoading : context.coursesLoading;
  const error = props.error !== undefined ? props.error : context.coursesError;
  const selectedCourseIds = props.selectedCourseIds !== undefined ? props.selectedCourseIds : context.selectedCourseIds;
  const onToggleCourse = props.onToggleCourse !== undefined ? props.onToggleCourse : context.toggleCourse;

  const [activeTab, setActiveTab] = useState<"carry_over" | "current">("current");

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Current semester courses come from the API; carry-over is a future endpoint.
  const currentCourses = courses;
  const carryOverCourses: CourseItem[] = []; // placeholder until carry-over endpoint is wired

  const displayedCourses = activeTab === "carry_over" ? carryOverCourses : currentCourses;

  // Reset to page 1 whenever tab or page-size changes
  const totalPages = Math.max(1, Math.ceil(displayedCourses.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedCourses = displayedCourses.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handlePageSizeChange = (size: typeof PAGE_SIZE_OPTIONS[number]) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: "carry_over" | "current") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // ── Selection helpers ───────────────────────────────────────────────────────
  const isSelected = (course: CourseItem) => selectedCourseIds.includes(course.id);
  const selectedCourses = courses.filter(isSelected);
  const totalUnits = selectedCourses.reduce((sum, c) => sum + c.units, 0);
  const MAX_UNITS = 23;

  const isAllPageSelected =
    pagedCourses.length > 0 && pagedCourses.every(isSelected);

  const handleSelectAllPage = () => {
    if (isAllPageSelected) {
      pagedCourses.forEach(c => { if (isSelected(c)) onToggleCourse(c.id); });
    } else {
      pagedCourses.forEach(c => { if (!isSelected(c)) onToggleCourse(c.id); });
    }
  };

  // ── Mobile: select-all current courses ─────────────────────────────────────
  const isAllCurrentSelected = currentCourses.length > 0 && currentCourses.every(isSelected);
  const handleSelectAllCurrentMobile = () => {
    if (isAllCurrentSelected) {
      currentCourses.forEach(c => { if (isSelected(c)) onToggleCourse(c.id); });
    } else {
      currentCourses.forEach(c => { if (!isSelected(c)) onToggleCourse(c.id); });
    }
  };
// console.log("selectedCourses", selectedCourses)
  return (
    <div className="flex flex-col w-full max-w-[1200px] md:mx-0">

      {/* Header Actions & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 dark:border-gray-800 mb-6 pb-4 md:pb-0 gap-4">
        {/* Tabs (desktop only) */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => handleTabChange("carry_over")}
            className={cn(
              "pb-3 text-[14px] md:text-[15px] font-medium transition-colors relative",
              activeTab === "carry_over"
                ? "text-[#0a0a0a] dark:text-gray-100"
                : "text-[#525866] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-100"
            )}
          >
            Carry Over courses
            {activeTab === "carry_over" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003cbb] dark:bg-[#4d82ff]" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("current")}
            className={cn(
              "pb-3 text-[14px] md:text-[15px] font-medium transition-colors relative",
              activeTab === "current"
                ? "text-[#0a0a0a] dark:text-gray-100"
                : "text-[#525866] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-100"
            )}
          >
            Current Semester courses
            {activeTab === "current" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003cbb] dark:bg-[#4d82ff]" />
            )}
          </button>
        </div>

        {/* AI Advisor Button */}
        <div className="md:pb-3 w-full md:w-auto">
          <AICourseAdvisor selectedCourses={selectedCourseIds} />
        </div>
      </div>

      <div className="flex flex-col pb-5 gap-4">

        {/* ── Desktop Table View ─────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col rounded-[16px] overflow-hidden border border-gray-200 dark:border-gray-800">
          {/* Dark Header */}
          <div className="bg-[#21242d] text-white px-6 py-4 flex items-center justify-between dark:border-b dark:border-gray-800">
            <div
              className={cn(
                "flex items-center gap-4 transition-opacity",
                isLoading || activeTab === "carry_over" ? "opacity-40 pointer-events-none" : "cursor-pointer hover:opacity-80"
              )}
              onClick={handleSelectAllPage}
            >
              <div className={cn(
                "w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors",
                isAllPageSelected ? "bg-white border-white" : "bg-transparent border-white/40"
              )}>
                {isAllPageSelected && <Check className="w-3.5 h-3.5 text-[#21242d]" strokeWidth={3} />}
              </div>
              <span className="text-[15px] font-medium">Select all on page</span>
            </div>

            <div className="text-[15px] font-medium">
              Total Units: <span className={totalUnits > MAX_UNITS ? "text-red-400" : ""}>{totalUnits}</span>/{MAX_UNITS}
            </div>
          </div>

          {/* Table body */}
          <div className="bg-white dark:bg-gray-900">
            {isLoading ? (
              <TableSkeleton />
            ) : error ? (
              <ErrorState message={error} />
            ) : pagedCourses.length === 0 ? (
              <EmptyState
                message={
                  activeTab === "carry_over"
                    ? "Carry-over courses will appear here once available."
                    : "No courses found for this class group."
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f2f4f7] dark:bg-gray-950 hover:bg-[#f2f4f7] dark:hover:bg-gray-950 border-none transition-colors">
                    <TableHead className="w-[80px] pl-6"></TableHead>
                    <TableHead className="text-[12px] font-bold text-[#525866] dark:text-gray-400 uppercase tracking-wider h-12">
                      Course Code
                    </TableHead>
                    <TableHead className="text-[12px] font-bold text-[#525866] dark:text-gray-400 uppercase tracking-wider h-12">
                      Title
                    </TableHead>
                    <TableHead className="text-[12px] font-bold text-[#525866] dark:text-gray-400 uppercase tracking-wider h-12">
                      Class Group
                    </TableHead>
                    <TableHead className="text-[12px] font-bold text-[#525866] dark:text-gray-400 uppercase tracking-wider h-12">
                      Lecturer
                    </TableHead>
                    <TableHead className="text-[12px] font-bold text-[#525866] dark:text-gray-400 uppercase tracking-wider h-12">
                      Year
                    </TableHead>
                    <TableHead className="text-[12px] font-bold text-[#525866] dark:text-gray-400 uppercase tracking-wider h-12">
                      Unit
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedCourses.map((course) => {
                    const selected = isSelected(course);
                    return (
                      <TableRow
                        key={course.id}
                        className={cn(
                          "cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50",
                          selected && "bg-[#f8faff] dark:bg-[#003cbb]/10 hover:bg-[#f8faff] dark:hover:bg-[#003cbb]/10"
                        )}
                        onClick={() => onToggleCourse(course.id)}
                      >
                        <TableCell className="w-[60px] pl-6">
                          <div className={cn(
                            "w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors",
                            selected ? "bg-[#003cbb] dark:bg-[#4d82ff] border-[#003cbb] dark:border-[#4d82ff]" : "bg-white dark:bg-gray-800 border-[#cdd0d5] dark:border-gray-700"
                          )}>
                            {selected && <Check className="w-3.5 h-3.5 text-white dark:text-gray-900" strokeWidth={3} />}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-[#0a0d14] dark:text-gray-100 w-[140px] whitespace-nowrap">
                          {course.code}
                        </TableCell>
                        <TableCell className="text-[#525866] dark:text-gray-300">
                          {course.title}
                        </TableCell>
                        <TableCell className="text-[#525866] dark:text-gray-300">
                          {course.classOption}
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
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* ── Mobile View ────────────────────────────────────────────────────── */}
        <div className="md:hidden flex flex-col gap-6">
          {/* Carry Over Section */}
          {carryOverCourses.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[15px] font-bold text-[#0a0d14] dark:text-gray-100">Carry Over Courses</h3>
              <div className="flex flex-col gap-3">
                {carryOverCourses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    selected={isSelected(course)}
                    onToggle={() => onToggleCourse(course.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Current Semester Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[15px] font-bold text-[#0a0d14] dark:text-gray-100">Current Semester Courses</h3>

            {/* Unit Summary / Select All Banner */}
            <div className="bg-[#eef3fd] dark:bg-[#003cbb]/15 rounded-[16px] p-4 flex flex-col justify-between gap-4 border border-[#ccdaf9] dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex items-center gap-3",
                    isLoading ? "opacity-40 pointer-events-none" : "cursor-pointer"
                  )}
                  onClick={handleSelectAllCurrentMobile}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors",
                    isAllCurrentSelected ? "bg-[#003cbb] dark:bg-[#4d82ff] border-[#003cbb] dark:border-[#4d82ff]" : "bg-white dark:bg-gray-800 border-[#cdd0d5] dark:border-gray-700"
                  )}>
                    {isAllCurrentSelected && <Check className="w-3.5 h-3.5 text-white dark:text-gray-900" strokeWidth={3} />}
                  </div>
                  <span className="text-[14px] text-[#525866] dark:text-gray-300">Select all</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[14px] text-[#525866] dark:text-gray-300">Total Units:</span>
                  <span className={cn(
                    "text-[14px] font-bold ml-1",
                    totalUnits > MAX_UNITS ? "text-[#D92D20] dark:text-red-450" : "text-[#003cbb] dark:text-[#4d82ff]"
                  )}>
                    {totalUnits}
                  </span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <CardSkeleton />
            ) : error ? (
              <ErrorState message={error} />
            ) : currentCourses.length === 0 ? (
              <EmptyState message="No courses found for this class group." />
            ) : (
              <div className="flex flex-col gap-3">
                {currentCourses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    selected={isSelected(course)}
                    onToggle={() => onToggleCourse(course.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Pagination Footer ──────────────────────────────────────────────── */}
        {!isLoading && !error && displayedCourses.length > 0 && (
          <div className="hidden md:flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-[#525866] dark:text-gray-400">
            <span className="text-[14px] font-medium">
              Page {safePage} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (arr[idx - 1] as number) + 1 < p) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-[14px]">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={cn(
                          "w-8 h-8 rounded-md font-medium text-[14px] flex items-center justify-center transition-colors",
                          safePage === p
                            ? "bg-[#f6f8fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#0a0a0a] dark:text-gray-100"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-[#525866] dark:text-gray-400"
                        )}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>

              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={e => handlePageSizeChange(Number(e.target.value) as typeof PAGE_SIZE_OPTIONS[number])}
                className="border border-gray-200 dark:border-gray-800 rounded-md px-2 py-1.5 text-[14px] font-medium bg-transparent outline-none focus:border-[#003cbb] dark:focus:border-[#4d82ff] text-[#525866] dark:text-gray-300"
              >
                {PAGE_SIZE_OPTIONS.map(s => (
                  <option key={s} value={s} className="dark:bg-gray-900">{s} / page</option>
                ))}
              </select>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
