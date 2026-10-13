"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronDown, AlertCircle, Download } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  getAcademicResultsAction,
  type SemesterResult,
  type ResultCourse,
} from "@/app/actions/academic-details";

// ── Grade helpers ─────────────────────────────────────────────────────────────

/** 5-point grade scale */
const GRADE_POINTS: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

function getGradePoint(grade: string, unit: number): number | null {
  if (grade === "NG" || !(grade in GRADE_POINTS)) return null;
  return GRADE_POINTS[grade] * unit;
}

function getGradeColor(grade: string) {
  switch (grade) {
    case "A":
      return "bg-[#D1F4E0] dark:bg-[#1E8B4A]/20 text-[#1E8B4A] dark:text-[#34d399]";
    case "B":
      return "bg-[#E1E7FC] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff]";
    case "C":
      return "bg-[#FCECD1] dark:bg-[#E08F22]/20 text-[#E08F22] dark:text-[#fbbf24]";
    case "D":
    case "E":
    case "F":
      return "bg-[#FCD1D1] dark:bg-[#D32F2F]/20 text-[#D32F2F] dark:text-[#f87171]";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCourseRow() {
  return (
    <div className="rounded-[16px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-6 py-4 animate-pulse">
      <div className="hidden md:grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr] gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12" />
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" />
      </div>
      <div className="md:hidden flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56" />
        <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// ── Course Row ────────────────────────────────────────────────────────────────

function CourseRow({ course }: { course: ResultCourse }) {
  const gradePoint = getGradePoint(course.grade, course.unit);
  const isNG = course.grade === "NG" || course.score === null;

  return (
    <Card className="rounded-[16px] border border-transparent dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-200">
      <CardContent className="p-0">
        {/* DESKTOP VIEW */}
        <div className="hidden md:grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr] items-center px-6 py-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
              {course.course_code}
            </span>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-0.5">
              {course.unit} units
            </span>
          </div>

          <div className="text-[15px] text-gray-500 dark:text-gray-400 font-medium truncate pr-4">
            {course.course_title}
          </div>

          <div className="text-center font-bold text-[15px] text-gray-900 dark:text-gray-100 flex items-center justify-center">
            {isNG ? (
              <span className="text-gray-400 dark:text-gray-500">—</span>
            ) : (
              <>
                <span>{course.score}</span>
                <span className="text-[12px] font-normal text-gray-400 dark:text-gray-500 ml-1">
                  /100
                </span>
              </>
            )}
          </div>

          <div className="flex justify-center">
            <span
              className={`w-8 h-8 flex items-center justify-center rounded-full text-[15px] font-bold transition-colors ${getGradeColor(course.grade)}`}
            >
              {course.grade}
            </span>
          </div>

          <div className="text-[15px] font-bold text-gray-900 dark:text-gray-100 text-center">
            {gradePoint !== null ? gradePoint : "—"}
          </div>
        </div>

        {/* MOBILE VIEW */}
        <div className="flex flex-col md:hidden px-5 py-4 gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[16px] text-gray-900 dark:text-gray-100">
                {course.course_code}
              </span>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-0.5">
                {course.unit} units
              </span>
            </div>
            <span
              className={`w-9 h-9 flex items-center justify-center rounded-full text-[18px] font-bold transition-colors ${getGradeColor(course.grade)}`}
            >
              {course.grade}
            </span>
          </div>

          <div className="text-[14px] text-gray-500 dark:text-gray-400 font-medium">
            {course.course_title}
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 w-full" />

          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">
                Score
              </span>
              <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                {isNG ? (
                  <span className="text-gray-400 dark:text-gray-500">—</span>
                ) : (
                  <>
                    {course.score}
                    <span className="text-[12px] font-normal text-gray-400 dark:text-gray-500 ml-1">
                      /100
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">
                Grade Point
              </span>
              <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                {gradePoint !== null ? gradePoint : "—"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SemesterResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const semesterId = decodeURIComponent((params.id as string) || "");

  const [allSemesters, setAllSemesters] = useState<SemesterResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAcademicResultsAction().then((result) => {
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setAllSemesters(result.data);
      }
      setLoading(false);
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSemester = allSemesters.find((s) => s.semester === semesterId);

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
      <Card className="rounded-[24px] bg-white dark:bg-gray-900 border-0 shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200 overflow-visible">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <h2 className="font-bold text-[18px] text-gray-900 dark:text-gray-100">
            Semester Result
          </h2>

          {/* Semester selector dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 border border-[#003cbb]/20 dark:border-[#4d82ff]/30 rounded-[10px] px-3.5 py-2 bg-white dark:bg-gray-800 text-[#003cbb] dark:text-[#4d82ff] text-[14px] font-semibold hover:bg-[#f5f8fe] dark:hover:bg-gray-700 transition-colors"
            >
              {semesterId || "Select Semester"}
              <ChevronDown
                className={`w-4 h-4 text-blue-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && allSemesters.length > 0 && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[12px] shadow-lg overflow-hidden min-w-[180px]">
                {allSemesters.map((s) => (
                  <button
                    key={s.semester}
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push(
                        `/academic-details/semester-results/${encodeURIComponent(s.semester)}`
                      );
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-[#f5f8fe] dark:hover:bg-gray-700 ${
                      s.semester === semesterId
                        ? "text-[#003cbb] dark:text-[#4d82ff] bg-[#f5f8fe] dark:bg-gray-700"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {s.semester}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Semester GPA badge */}
          {currentSemester?.semester_gpa !== null &&
            currentSemester?.semester_gpa !== undefined && (
              <div className="bg-[#D1F4E0] dark:bg-[#1E8B4A]/20 text-[13px] font-semibold text-[#1E8B4A] dark:text-[#34d399] px-3.5 py-2 rounded-[10px] flex items-center transition-colors">
                Semester GPA:{" "}
                {currentSemester.semester_gpa.toFixed(2)}
              </div>
            )}
        </div>

        <Button
          className="bg-[#003CBB] dark:bg-[#4d82ff] hover:bg-[#5585EA] dark:hover:bg-[#7aa4ff] text-white font-semibold rounded-[12px] h-11 px-6 w-full md:w-auto transition-colors flex items-center gap-2"
          onClick={() =>
            router.push(
              `/academic-details/semester-results/${encodeURIComponent(semesterId)}/preview`
            )
          }
        >
          <Download className="w-4 h-4" />
          Export Result
        </Button>
      </Card>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[16px] px-6 py-4 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-[14px] font-medium">{error}</span>
        </div>
      )}

      {/* Table Area */}
      <div className="flex flex-col gap-3">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr] pl-6 pr-6 py-4 bg-[#E5E7EB] dark:bg-gray-800 rounded-[16px] mb-2 transition-colors duration-200">
          <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">
            Course Info
          </div>
          <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">
            Title
          </div>
          <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400 text-center">
            Score
          </div>
          <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400 text-center">
            Grade
          </div>
          <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400 text-center">
            Grade Point
          </div>
        </div>

        {/* Rows */}
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCourseRow key={i} />
            ))
          : currentSemester
          ? currentSemester.courses.map((course, idx) => (
              <CourseRow key={`${course.course_code}-${idx}`} course={course} />
            ))
          : !error && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-[15px]">
                No data found for semester &ldquo;{semesterId}&rdquo;.
              </div>
            )}
      </div>
    </div>
  );
}
