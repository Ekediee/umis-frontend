"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getRegisteredCoursesAction } from "@/app/actions/academic-details";
import { useAcademicDetailsStore } from "@/hooks/use-academic-details-store";
import type { RegisteredCourse } from "@/app/actions/academic-details";

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <Card className="rounded-[16px] border border-transparent dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-gray-900">
      <CardContent className="p-0">
        {/* Desktop skeleton */}
        <div className="hidden md:grid grid-cols-[1.5fr_3fr_1.5fr_1fr] items-center px-6 py-4 gap-4 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3" />
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
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Table renderer ────────────────────────────────────────────────────────────

function renderTable(data: RegisteredCourse[]) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-[15px]">
        No courses found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((course, idx) => (
        <Card
          key={`${course.courseId}-${idx}`}
          className="rounded-[16px] border border-transparent dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-200"
        >
          <CardContent className="p-0">
            {/* DESKTOP VIEW */}
            <div className="hidden md:grid grid-cols-[1.5fr_3fr_1.5fr_1fr] items-center px-6 py-4">
              <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                {course.courseId}
              </div>
              <div className="text-[15px] text-gray-500 dark:text-gray-400 font-medium pr-4">
                <div className="truncate">{course.title}</div>
                {course.classOption && (
                  <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-2.5 py-0.5">
                    {course.classOption}
                  </span>
                )}
              </div>
              <div className="text-[15px] text-gray-500 dark:text-gray-400 font-medium">
                {course.instructor}
              </div>
              <div className="flex justify-end pr-2">
                <span className="text-[11px] font-bold text-[#003cbb] dark:text-[#4d82ff] bg-[#E1E7FC] dark:bg-[#003cbb]/20 rounded-full px-3 py-1">
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

              {course.classOption && (
                <span className="self-start text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-2.5 py-0.5">
                  {course.classOption}
                </span>
              )}

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 w-full" />

              <div className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                {course.instructor}
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
  } = useAcademicDetailsStore();

  // Derive tab lists
  const currentCourses = (registeredCourses ?? []).filter(
    (c) => !c.isCarryOver
  );
  const carryOverCourses = (registeredCourses ?? []).filter(
    (c) => c.isCarryOver
  );

  const getActiveCourses = (tab: string): RegisteredCourse[] => {
    if (tab === "current") return currentCourses;
    if (tab === "carry-over") return carryOverCourses;
    return [];
  };

  const activeCourses = getActiveCourses(activeTab);
  const totalUnits = activeCourses.reduce((sum, c) => sum + c.units, 0);

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

  useEffect(() => {
    // Use cached data if available; otherwise fetch
    if (registeredCourses === null) {
      fetchCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/academic-details/courses?tab=${value}`);
  };

  // ── Render helpers ──

  const renderContent = (courses: RegisteredCourse[]) => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
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
    return renderTable(courses);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-7xl mx-auto pb-10 px-4 md:px-0 md:mt-0">
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
              className={`px-0 py-3 md:pb-4 border-b-2 font-semibold text-[14px] whitespace-nowrap transition-colors ${
                activeTab === "current"
                  ? "border-[#003cbb] dark:border-[#4d82ff] text-[#003cbb] dark:text-[#4d82ff]"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
              className={`px-0 py-3 md:pb-4 border-b-2 font-semibold text-[14px] whitespace-nowrap transition-colors ${
                activeTab === "carry-over"
                  ? "border-[#003cbb] dark:border-[#4d82ff] text-[#003cbb] dark:text-[#4d82ff]"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Carry Over Courses
            </TabsTrigger>
          </TabsList>

          {/* Total Units — desktop */}
          <div className="font-bold text-gray-900 dark:text-gray-100 text-[15px] whitespace-nowrap self-end pb-4 hidden md:block">
            {!isLoading && !coursesError && `Total Units: ${totalUnits}`}
          </div>
          {/* Total Units — mobile */}
          <div className="font-bold text-gray-900 dark:text-gray-100 text-[15px] ml-auto block md:hidden mb-2">
            {!isLoading && !coursesError && `Total Units: ${totalUnits}`}
          </div>
        </div>

        <TabsContent value="current" className="mt-0 outline-none">
          {renderContent(currentCourses)}
        </TabsContent>
        <TabsContent value="carry-over" className="mt-0 outline-none">
          {renderContent(carryOverCourses)}
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
