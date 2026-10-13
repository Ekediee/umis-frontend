"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getRegisteredCoursesAction } from "@/app/actions/academic-details";
import { useAcademicDetailsStore } from "@/hooks/use-academic-details-store";
import type { RegisteredCourse } from "@/app/actions/academic-details";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Skeleton row ──────────────────────────────────────────────────────────────

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

// ── Table renderer ────────────────────────────────────────────────────────────

function renderTable(data: RegisteredCourse[], showInstructorAndGroup = true) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-[15px]">
        No courses found.
      </div>
    );
  }

  return (
    <>
      {/* DESKTOP VIEW */}
      <div className="hidden md:block rounded-[16px] border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <Table>
          <TableHeader className="bg-[#f2f4f7] dark:bg-gray-800">
            <TableRow className="hover:bg-[#f2f4f7] dark:hover:bg-gray-800 border-0">
              <TableHead className="font-bold text-[#525866] dark:text-gray-400 text-[12px] tracking-wider pl-6 w-[150px]">COURSE CODE</TableHead>
              <TableHead className="font-bold text-[#525866] dark:text-gray-400 text-[12px] tracking-wider">COURSE TITLE</TableHead>
              {showInstructorAndGroup && <TableHead className="font-bold text-[#525866] dark:text-gray-400 text-[12px] tracking-wider w-[220px]">INSTRUCTOR</TableHead>}
              <TableHead className="font-bold text-[#525866] dark:text-gray-400 text-[12px] tracking-wider text-right pr-6 w-[140px]">UNITS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((course, idx) => (
              <TableRow key={`${course.courseId}-${idx}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 border-gray-200 dark:border-gray-800">
                <TableCell className="font-bold text-[#0a0d14] dark:text-gray-100 pl-6 whitespace-nowrap">
                  {course.courseId}
                </TableCell>
                <TableCell className="text-[#525866] dark:text-gray-300">
                  <div className="flex flex-col gap-1 items-start">
                    <span className="font-medium">{course.title}</span>
                    {showInstructorAndGroup && course.classOption && (
                      <span className="inline-block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-2.5 py-0.5">
                        {course.classOption}
                      </span>
                    )}
                  </div>
                </TableCell>
                {showInstructorAndGroup && (
                  <TableCell className="text-[#525866] dark:text-gray-300">
                    {course.instructor}
                  </TableCell>
                )}
                <TableCell className="text-right pr-6">
                  <span className="inline-flex bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff] font-bold text-[12px] px-3 py-1 rounded-[8px] uppercase tracking-wider">
                    {course.units} UNITS
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MOBILE VIEW */}
      <div className="flex flex-col md:hidden gap-3">
        {data.map((course, idx) => (
          <Card
            key={`${course.courseId}-${idx}-mobile`}
            className="rounded-[16px] border border-transparent dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-200"
          >
            <CardContent className="p-5 flex flex-col gap-3">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function CoursesContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const semesterId = decodeURIComponent(params.id as string || "2018/2019.1");
  const tabParam = searchParams.get("tab") || "current";

  const [activeTab, setActiveTab] = useState(tabParam);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const semestersList = [
    "2018/2019.1",
    "2018/2019.2",
    "2018/2019.3",
    "2019/2020.1",
    "2019/2020.2",
  ];

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClose = () => setIsDropdownOpen(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [isDropdownOpen]);

  const {
    registeredCourses,
    coursesError,
    setRegisteredCourses,
    setCoursesError,
  } = useAcademicDetailsStore();

  // Derive tab lists
  const currentCourses = (registeredCourses ?? []).filter(
    (c: RegisteredCourse) => !c.isCarryOver
  );
  const carryOverCourses = (registeredCourses ?? []).filter(
    (c: RegisteredCourse) => c.isCarryOver
  );
  
  // Deriving/Mocking repeated courses for user display
  const repeatedCourses = (registeredCourses ?? []).filter(
    (c: any) => c.isRepeated
  );
  const repeatedCoursesList = repeatedCourses.length > 0 ? repeatedCourses : [
    {
      courseId: "GEDS 101",
      title: "Philosophy of Science and Technology",
      instructor: "Dr. E. O. Johnson",
      units: 2,
      isCarryOver: false,
    },
    {
      courseId: "COSC 201",
      title: "Computer Programming I",
      instructor: "Prof. S. A. Adebayo",
      units: 3,
      isCarryOver: false,
    }
  ] as RegisteredCourse[];

  const getActiveCourses = (tab: string): RegisteredCourse[] => {
    if (tab === "current") return currentCourses;
    if (tab === "carry-over") return carryOverCourses;
    if (tab === "repeated") return repeatedCoursesList;
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
    router.push(`/academic-details/courses/${encodeURIComponent(semesterId)}?tab=${value}`);
  };

  // ── Render helpers ──

  const renderContent = (courses: RegisteredCourse[], showInstructor = true) => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} showInstructor={showInstructor} />
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
    return renderTable(courses, showInstructor);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-7xl mx-auto pb-10 px-4 md:mt-0">
      {/* Back button */}
      <div>
        <Button
          variant="outline"
          className="rounded-[10px] text-[#003cbb] dark:text-[#4d82ff] font-semibold px-4 h-10 border-gray-200 dark:border-gray-700 hover:bg-[#f5f8fe] dark:hover:bg-gray-800 hover:text-[#003095] dark:hover:text-[#8ba7ff] bg-white dark:bg-gray-900 transition-colors"
          onClick={() => router.push('/academic-details/courses')}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Header Container */}
      <Card className="rounded-[24px] bg-white dark:bg-gray-900 border-0 shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200 relative">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <h2 className="font-bold text-[18px] text-gray-900 dark:text-gray-100">Registered Courses</h2>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="flex items-center gap-2 border border-[#003cbb]/20 dark:border-[#4d82ff]/30 rounded-[10px] px-3.5 py-2 bg-white dark:bg-gray-800 text-[#003cbb] dark:text-[#4d82ff] text-[14px] font-semibold hover:bg-[#f5f8fe] dark:hover:bg-gray-700 transition-colors"
            >
              {semesterId}
              <ChevronDown className="w-4 h-4 text-blue-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-[180px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[12px] shadow-lg py-1.5 z-50">
                {semestersList.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => {
                      router.push(`/academic-details/courses/${encodeURIComponent(sem)}`);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-[14px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      sem === semesterId
                        ? "text-[#003cbb] dark:text-[#4d82ff] font-bold"
                        : "text-gray-700 dark:text-gray-300 font-medium"
                    }`}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

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
            {!isLoading && !coursesError && `Total Units: ${totalUnits}`}
          </div>
          {/* Total Units — mobile */}
          <div className="font-bold text-gray-900 dark:text-gray-100 text-[15px] ml-auto block md:hidden mb-2">
            {!isLoading && !coursesError && `Total Units: ${totalUnits}`}
          </div>
        </div>

        <TabsContent value="current" className="mt-0 outline-none">
          {renderContent(currentCourses, true)}
        </TabsContent>
        <TabsContent value="carry-over" className="mt-0 outline-none">
          {renderContent(carryOverCourses, true)}
        </TabsContent>
        <TabsContent value="repeated" className="mt-0 outline-none">
          {renderContent(repeatedCoursesList, false)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function CoursesDetailPage() {
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
