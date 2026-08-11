"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getRegisteredCoursesAction,
  getCarryoverRepeatedAction,
} from "@/app/actions/academic-details";
import { useAcademicDetailsStore } from "@/hooks/use-academic-details-store";
import type {
  RegisteredCourse,
  CarryOverCourse,
} from "@/app/actions/academic-details";
import { cn } from "@/lib/utils";

// ── Skeleton row — registered courses ─────────────────────────────────────────

function SkeletonRow({ showInstructor = true }: { showInstructor?: boolean }) {
  return (
    <Card className="rounded-[16px] border border-transparent dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-gray-900">
      <CardContent className="p-0">
        {/* Desktop skeleton */}
        <div className={cn(
          "hidden md:grid items-center px-6 py-4 gap-4 animate-pulse",
          showInstructor
            ? "grid-cols-[1.5fr_3fr_1.5fr_1fr]"
            : "grid-cols-[1.5fr_4.5fr_1fr]"
        )}>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
          {showInstructor && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3" />}
          <div className="flex justify-end">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>
        </div>
        {/* Mobile skeleton */}
        <div className="flex flex-col md:hidden p-5 gap-3 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/3" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
          {showInstructor && (
            <>
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton row — carry-over / repeated (5-col) ──────────────────────────────

function CarryoverSkeletonRow() {
  return (
    <Card className="rounded-[16px] border border-transparent dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-gray-900">
      <CardContent className="p-0">
        {/* Desktop skeleton */}
        <div className="hidden md:grid items-center px-6 py-4 gap-4 animate-pulse grid-cols-[1.5fr_3fr_0.8fr_0.8fr_1fr]">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2 mx-auto" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2 mx-auto" />
          <div className="flex justify-end">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>
        </div>
        {/* Mobile skeleton */}
        <div className="flex flex-col md:hidden p-5 gap-3 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/3" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
          <div className="flex gap-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats `yearTaken` into a human-readable label.
 * 0 → "Foundation", 1 → "Year 1", 2 → "Year 2", etc.
 */
function formatYearTaken(year: number): string {
  if (year === 0) return "Foundation";
  return `Year ${year}`;
}

// ── Table renderer — registered courses ───────────────────────────────────────

function renderTable(data: RegisteredCourse[], showInstructorAndGroup = true) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-[15px]">
        No courses found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Desktop Header - Hidden on mobile */}
      <div className={cn(
        "hidden md:grid gap-4 px-6 py-4 bg-[#E5E7EB] dark:bg-gray-800 rounded-[16px] transition-colors duration-200 mb-1",
        showInstructorAndGroup
          ? "grid-cols-[1.5fr_3fr_1.5fr_1fr]"
          : "grid-cols-[1.5fr_4.5fr_1fr]"
      )}>
        <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">Course Code</div>
        <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">Course Title</div>
        {showInstructorAndGroup && <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">Instructor</div>}
        <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400 text-right pr-6">Units</div>
      </div>

      {/* Rows */}
      {data.map((course, idx) => (
        <Card
          key={`${course.courseId}-${idx}`}
          className="rounded-[16px] border border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-200"
        >
          <CardContent className="p-0">
            {/* DESKTOP VIEW */}
            <div className={cn(
              "hidden md:grid items-center gap-4 px-6 py-2.5",
              showInstructorAndGroup
                ? "grid-cols-[1.5fr_3fr_1.5fr_1fr]"
                : "grid-cols-[1.5fr_4.5fr_1fr]"
            )}>
              <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                {course.courseId}
              </div>
              <div className="text-[15px] text-gray-500 dark:text-gray-400 font-medium pr-4">
                <div className="truncate">{course.title}</div>
                {showInstructorAndGroup && course.classOption && (
                  <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-2.5 py-0.5">
                    {course.classOption}
                  </span>
                )}
              </div>
              {showInstructorAndGroup && (
                <div className="text-[15px] text-gray-500 dark:text-gray-400 font-medium">
                  {course.instructor}
                </div>
              )}
              <div className="flex justify-end">
                <span className="text-[11px] font-bold text-[#003cbb] dark:text-[#4d82ff] bg-[#E1E7FC] dark:bg-[#003cbb]/20 rounded-full px-3 py-1 uppercase tracking-wider">
                  {course.units} UNITS
                </span>
              </div>
            </div>

            {/* MOBILE VIEW */}
            <div className="flex flex-col md:hidden p-5 gap-3">
              <div className="flex justify-between items-center">
                <div className="font-bold text-[16px] text-gray-900 dark:text-gray-100">
                  {course.courseId}
                </div>
                <span className="text-[11px] font-bold text-[#003cbb] dark:text-[#4d82ff] bg-[#E1E7FC] dark:bg-[#003cbb]/20 rounded-full px-3 py-1">
                  {course.units} UNITS
                </span>
              </div>

              <div className="text-[14px] text-gray-500 dark:text-gray-400 font-medium">
                {course.title}
              </div>

              {showInstructorAndGroup && course.classOption && (
                <span className="self-start text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-2.5 py-0.5">
                  {course.classOption}
                </span>
              )}

              {showInstructorAndGroup && (
                <>
                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 w-full" />
                  <div className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                    {course.instructor}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Table renderer — carry-over / repeated courses ────────────────────────────

function renderCarryoverTable(data: CarryOverCourse[]) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-[15px]">
        No courses found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Desktop Header */}
      <div className="hidden md:grid gap-4 px-6 py-4 bg-[#E5E7EB] dark:bg-gray-800 rounded-[16px] transition-colors duration-200 mb-1 grid-cols-[1.5fr_3fr_0.8fr_0.8fr_1fr]">
        <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">Course Code</div>
        <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">Course Title</div>
        <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400 text-center">Credit Hrs</div>
        <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400 text-center">Lecture Hrs</div>
        <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400 text-right pr-6">Year</div>
      </div>

      {/* Rows */}
      {data.map((course, idx) => (
        <Card
          key={`${course.courseId}-${idx}`}
          className="rounded-[16px] border border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-200"
        >
          <CardContent className="p-0">
            {/* DESKTOP VIEW */}
            <div className="hidden md:grid items-center gap-4 px-6 py-2.5 grid-cols-[1.5fr_3fr_0.8fr_0.8fr_1fr]">
              <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                {course.courseId}
              </div>
              <div className="text-[15px] text-gray-500 dark:text-gray-400 font-medium pr-4 truncate">
                {course.title}
              </div>
              <div className="text-[14px] text-gray-600 dark:text-gray-400 font-medium text-center">
                {course.creditHours}
              </div>
              <div className="text-[14px] text-gray-600 dark:text-gray-400 font-medium text-center">
                {course.lectureHours}
              </div>
              <div className="flex justify-end">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full px-3 py-1 uppercase tracking-wider whitespace-nowrap">
                  {formatYearTaken(course.yearTaken)}
                </span>
              </div>
            </div>

            {/* MOBILE VIEW */}
            <div className="flex flex-col md:hidden p-5 gap-3">
              <div className="flex justify-between items-center">
                <div className="font-bold text-[16px] text-gray-900 dark:text-gray-100">
                  {course.courseId}
                </div>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full px-3 py-1 whitespace-nowrap">
                  {formatYearTaken(course.yearTaken)}
                </span>
              </div>

              <div className="text-[14px] text-gray-500 dark:text-gray-400 font-medium">
                {course.title}
              </div>

              <div className="flex gap-3 flex-wrap">
                <span className="text-[12px] font-semibold text-[#003cbb] dark:text-[#4d82ff] bg-[#E1E7FC] dark:bg-[#003cbb]/20 rounded-full px-2.5 py-0.5">
                  {course.creditHours} Credit Hr{course.creditHours !== 1 ? "s" : ""}
                </span>
                <span className="text-[12px] font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-full px-2.5 py-0.5">
                  {course.lectureHours} Lecture Hr{course.lectureHours !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function CoursesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "current";

  const [activeTab, setActiveTab] = useState(tabParam);
  const [isLoading, setIsLoading] = useState(false);

  const {
    registeredCourses,
    coursesError,
    setRegisteredCourses,
    setCoursesError,
    carryoverRepeated,
    carryoverRepeatedError,
    isFetchingCarryoverRepeated,
    setCarryoverRepeated,
    setCarryoverRepeatedError,
    setIsFetchingCarryoverRepeated,
  } = useAcademicDetailsStore();

  // Derive current-semester courses from the registered courses list
  const currentCourses = (registeredCourses ?? []).filter(
    (c: RegisteredCourse) => !c.isCarryOver
  );

  const carryCourses = carryoverRepeated?.carryCourses ?? [];
  const repeatedCourses = carryoverRepeated?.repeatedCourses ?? [];

  // Units for the currently active tab
  const getActiveTotalUnits = (tab: string): number => {
    if (tab === "current") {
      return currentCourses.reduce((sum, c) => sum + c.units, 0);
    }
    if (tab === "carry-over") {
      return carryCourses.reduce((sum, c) => sum + c.creditHours, 0);
    }
    if (tab === "repeated") {
      return repeatedCourses.reduce((sum, c) => sum + c.creditHours, 0);
    }
    return 0;
  };

  const totalUnits = getActiveTotalUnits(activeTab);

  // ── Fetch: registered courses ──

  const fetchCourses = async () => {
    setIsLoading(true);
    const result = await getRegisteredCoursesAction();
    if (result.error) {
      setCoursesError(result.error);
    } else if (result.data) {
      setRegisteredCourses(result.data);
    }
    setIsLoading(false);
  };

  // ── Fetch: carry-over / repeated ──

  const fetchCarryoverRepeated = async () => {
    if (isFetchingCarryoverRepeated) return;
    setIsFetchingCarryoverRepeated(true);
    const result = await getCarryoverRepeatedAction();
    if (result.error) {
      setCarryoverRepeatedError(result.error);
    } else if (result.data) {
      setCarryoverRepeated(result.data);
    }
    // isFetchingCarryoverRepeated is reset inside the setters above
  };

  // Load registered courses on mount (cache-first)
  useEffect(() => {
    if (registeredCourses === null) {
      fetchCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazy-load carry-over / repeated when those tabs are first visited
  useEffect(() => {
    if (
      (activeTab === "carry-over" || activeTab === "repeated") &&
      carryoverRepeated === null &&
      !isFetchingCarryoverRepeated
    ) {
      fetchCarryoverRepeated();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/academic-details/courses?tab=${value}`);
  };

  // ── Render helpers ──

  const renderCurrentContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} showInstructor />
          ))}
        </div>
      );
    }
    if (coursesError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-red-500 dark:text-red-400 text-[15px] text-center max-w-sm">
            {coursesError}
          </p>
          <Button
            variant="outline"
            className="rounded-[10px] text-[#003cbb] dark:text-[#4d82ff] font-semibold px-4 h-10 border-gray-200 dark:border-gray-700 hover:bg-[#f5f8fe] dark:hover:bg-gray-800"
            onClick={fetchCourses}
          >
            Retry
          </Button>
        </div>
      );
    }
    return renderTable(currentCourses, true);
  };

  const renderCarryoverContent = (courses: CarryOverCourse[]) => {
    if (isFetchingCarryoverRepeated) {
      return (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CarryoverSkeletonRow key={i} />
          ))}
        </div>
      );
    }
    if (carryoverRepeatedError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-red-500 dark:text-red-400 text-[15px] text-center max-w-sm">
            {carryoverRepeatedError}
          </p>
          <Button
            variant="outline"
            className="rounded-[10px] text-[#003cbb] dark:text-[#4d82ff] font-semibold px-4 h-10 border-gray-200 dark:border-gray-700 hover:bg-[#f5f8fe] dark:hover:bg-gray-800"
            onClick={fetchCarryoverRepeated}
          >
            Retry
          </Button>
        </div>
      );
    }
    return renderCarryoverTable(courses);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-7xl mx-auto pb-10 px-4 md:px-6 md:mt-0">
      {/* Back button */}
      <div>
        <Button 
          variant="outline" 
          className="rounded-[10px] text-[#003cbb] dark:text-[#4d82ff] font-semibold px-4 h-10 border-gray-200 dark:border-gray-700 hover:bg-[#f5f8fe] dark:hover:bg-gray-800 hover:text-[#003095] dark:hover:text-[#8ba7ff] bg-white dark:bg-gray-900 transition-colors"
          onClick={() => router.push('/academic-details')}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Tabs & Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 dark:border-gray-800 mb-6 gap-4 transition-colors">
          <TabsList className="bg-transparent overflow-x-auto flex-nowrap justify-start h-auto p-0 flex gap-6 md:gap-8 min-w-0 w-full md:w-auto border-none no-scrollbar">
            <TabsTrigger
              value="current"
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                borderRadius: 0,
              }}
              className={`px-0 py-3 md:pb-4 border-b-2 font-semibold text-[14px] whitespace-nowrap transition-colors !rounded-none !px-0 data-active:!bg-transparent data-active:!shadow-none !border-t-0 !border-x-0 after:!hidden translate-y-[1px] ${
                activeTab === "current"
                  ? "border-b-[#003cbb] dark:border-b-[#4d82ff] text-[#003cbb] dark:text-[#4d82ff] data-active:!text-[#003cbb] data-active:!border-b-[#003cbb] dark:data-active:!text-[#4d82ff] dark:data-active:!border-b-[#4d82ff]"
                  : "border-b-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Current Semester Courses
            </TabsTrigger>

            <TabsTrigger
              value="carry-over"
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                borderRadius: 0,
              }}
              className={`px-0 py-3 md:pb-4 border-b-2 font-semibold text-[14px] whitespace-nowrap transition-colors !rounded-none !px-0 data-active:!bg-transparent data-active:!shadow-none !border-t-0 !border-x-0 after:!hidden translate-y-[1px] ${
                activeTab === "carry-over"
                  ? "border-b-[#003cbb] dark:border-b-[#4d82ff] text-[#003cbb] dark:text-[#4d82ff] data-active:!text-[#003cbb] data-active:!border-b-[#003cbb] dark:data-active:!text-[#4d82ff] dark:data-active:!border-b-[#4d82ff]"
                  : "border-b-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Carry Over Courses
            </TabsTrigger>

            <TabsTrigger
              value="repeated"
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                borderRadius: 0,
              }}
              className={`px-0 py-3 md:pb-4 border-b-2 font-semibold text-[14px] whitespace-nowrap transition-colors !rounded-none !px-0 data-active:!bg-transparent data-active:!shadow-none !border-t-0 !border-x-0 after:!hidden translate-y-[1px] ${
                activeTab === "repeated"
                  ? "border-b-[#003cbb] dark:border-b-[#4d82ff] text-[#003cbb] dark:text-[#4d82ff] data-active:!text-[#003cbb] data-active:!border-b-[#003cbb] dark:data-active:!text-[#4d82ff] dark:data-active:!border-b-[#4d82ff]"
                  : "border-b-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Repeated Courses
            </TabsTrigger>
          </TabsList>

          {/* Total Units — desktop */}
          <div className="font-bold text-gray-900 dark:text-gray-100 text-[15px] whitespace-nowrap self-end pb-4 hidden md:block">
            {!isLoading && !isFetchingCarryoverRepeated && !coursesError && !carryoverRepeatedError && `Total Units: ${totalUnits}`}
          </div>
          {/* Total Units — mobile */}
          <div className="font-bold text-gray-900 dark:text-gray-100 text-[15px] ml-auto block md:hidden mb-2">
            {!isLoading && !isFetchingCarryoverRepeated && !coursesError && !carryoverRepeatedError && `Total Units: ${totalUnits}`}
          </div>
        </div>

        <TabsContent value="current" className="mt-0 outline-none">
          {renderCurrentContent()}
        </TabsContent>
        <TabsContent value="carry-over" className="mt-0 outline-none">
          {renderCarryoverContent(carryCourses)}
        </TabsContent>
        <TabsContent value="repeated" className="mt-0 outline-none">
          {renderCarryoverContent(repeatedCourses)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          Loading courses...
        </div>
      }
    >
      <CoursesContent />
    </Suspense>
  );
}
