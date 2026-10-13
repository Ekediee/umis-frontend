"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Printer, AlertCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useUserData } from "@/contexts/user-data-context";
import {
  getAcademicResultsAction,
  type SemesterResult,
  type ResultCourse,
} from "@/app/actions/academic-details";

// ── Grade helpers ─────────────────────────────────────────────────────────────

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

// ── Semester label helper ─────────────────────────────────────────────────────

function getSemesterLabel(semesterId: string): string {
  const termPart = semesterId.split(".")[1] ?? "1";
  const termNum = parseInt(termPart, 10);
  const labels = ["FIRST", "SECOND", "THIRD"];
  const label = labels[termNum - 1] ?? `${termNum}TH`;
  return `${label} SEMESTER RESULTS`;
}

// ── PDF filename helper ───────────────────────────────────────────────────────

function buildPdfFilename(semesterId: string): string {
  const safe = semesterId.replace(/[^a-zA-Z0-9]/g, "_");
  return `Result_${safe}.pdf`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DocumentSkeleton() {
  return (
    <div className="min-w-[900px] w-full max-w-5xl mx-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-[0_2px_15px_rgba(0,0,0,0.04)] rounded-[24px] p-8 md:p-14 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-80" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
      </div>
      {/* Table header skeleton */}
      <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-[12px] mb-4" />
      {/* Row skeletons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-50 dark:bg-gray-800/50 rounded-[8px] mb-2" />
      ))}
      {/* Footer skeleton */}
      <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-[12px] mt-6" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const semesterId = decodeURIComponent((params.id as string) || "");
  const session = semesterId.split(".")[0];
  const termName = getSemesterLabel(semesterId);

  const documentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────
  const userData = useUserData();
  const [semesterData, setSemesterData] = useState<SemesterResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAcademicResultsAction().then((result) => {
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        const matched = result.data.find((s) => s.semester === semesterId) ?? null;
        setSemesterData(matched);
      }
      setLoading(false);
    });
  }, [semesterId]);

  // ── Student info from context ───────────────────────────────────────────────
  const studentName =
    userData?.user_data?.student_name ??
    userData?.user_data?.personal_information?.student_name ??
    "—";
  const degreeName = userData?.user_data?.degree_name ?? "—";
  const semesterLevel = semesterData?.semester_level ?? null;

  // ── Derived table data ──────────────────────────────────────────────────────
  const courses: ResultCourse[] = semesterData?.courses ?? [];
  const totalCreditUnits = semesterData?.total_credit_unit ?? 0;
  const semesterGpa = semesterData?.semester_gpa ?? null;

  // ── PDF download ────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setIsDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const node = documentRef.current;
      const imgData = await toPng(node, {
        quality: 1.0,
        pixelRatio: 2,
        width: node.scrollWidth,
        height: node.scrollHeight,
        style: {
          borderRadius: "0px",
          boxShadow: "none",
          border: "none",
          margin: "0",
          overflow: "visible",
          backgroundColor: "#ffffff",
        },
      });

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(buildPdfFilename(semesterId));
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10 px-4 md:px-0 mt-4 md:mt-0 print:p-0 print:m-0">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-2 rounded-[16px] p-2 print:hidden transition-colors duration-200">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="rounded-[10px] text-[#003cbb] dark:text-gray-100 font-semibold px-4 h-10 border-[#e2e4e9] dark:border-gray-700 hover:bg-[#f8faff] dark:hover:bg-[#2C2C2C] bg-white dark:bg-transparent transition-colors"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-[17px] font-bold text-gray-900 dark:text-white">
            Document Preview
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            className="rounded-[10px] flex-1 md:flex-auto font-medium px-4 h-10 border-[#e2e4e9] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2C2C2C] bg-white dark:bg-transparent text-gray-700 dark:text-gray-100 transition-colors"
            onClick={handleDownloadPDF}
            disabled={isDownloading || loading || !!error}
          >
            {isDownloading ? (
              <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-gray-700 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2.5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
            )}
            Download PDF
          </Button>
          <Button
            className="rounded-[10px] flex-1 md:flex-auto font-medium px-4 h-10 bg-[#003CBB] dark:bg-[#2563EB] hover:bg-[#5585EA] dark:hover:bg-[#1D4ED8] text-white transition-colors"
            onClick={handlePrint}
            disabled={loading || !!error}
          >
            <Printer className="w-4 h-4 mr-2.5" strokeWidth={2} />
            Print Document
          </Button>
        </div>
      </div>

      {/* Print Isolation Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * { visibility: hidden; }
            #printable-document, #printable-document * { visibility: visible; }
            #printable-document {
              position: absolute; left: 0; top: 0;
              width: 100%; margin: 0; padding: 0;
            }
            @page { size: A4 portrait; margin: 10mm; }
          }
        `,
      }} />

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[16px] px-6 py-4 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-[14px] font-medium">{error}</span>
        </div>
      )}

      {/* Document Container */}
      <div className="w-full overflow-x-auto bg-transparent rounded-[24px] print:overflow-visible print:rounded-none">

        {loading ? (
          <DocumentSkeleton />
        ) : (
          /* The Paper Sheet */
          <div
            id="printable-document"
            ref={documentRef}
            className="min-w-[900px] w-full max-w-5xl mx-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-[0_2px_15px_rgba(0,0,0,0.04)] rounded-[24px] relative overflow-hidden flex flex-col p-8 md:p-14 min-h-[800px] print:shadow-none print:border-none print:p-0 print:m-0 print:min-w-0 print:overflow-visible transition-colors duration-200"
          >
            {/* Faint Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] dark:opacity-[0.04] z-0 print:opacity-[0.06]">
              <Image
                src="/images/bu_logo2.png"
                alt="Babcock University Logo"
                width={500}
                height={500}
                className="h-[500px] w-[500px] object-contain"
                priority
              />
            </div>

            {/* Document Header */}
            <div className="relative flex flex-col items-center justify-center text-center mt-4 mb-6 z-10">
              <h2 className="text-[22px] font-normal text-gray-800 dark:text-gray-200 leading-tight tracking-wide mb-1 uppercase">
                {studentName}
              </h2>
              <h3 className="text-[26px] font-medium text-gray-900 dark:text-gray-100 leading-tight mb-2 uppercase">
                {session} {termName}
              </h3>
              {degreeName !== "—" && (
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase mb-1">
                  {degreeName}
                </p>
              )}
              {semesterLevel !== null && (
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">
                  {semesterLevel} LEVEL COURSES
                </p>
              )}
            </div>

            {/* Document Table */}
            <div className="relative w-full z-10 flex flex-col flex-1 pb-10">
              {/* Table Header */}
              <div className="grid grid-cols-[50px_1.5fr_3.5fr_1fr_1fr_1fr_1.5fr] bg-[#F8F9FB] dark:bg-gray-800/50 rounded-[12px] py-4 px-6 items-center border border-gray-50 dark:border-gray-800 print:bg-[#F3F4F6] print:border-none transition-colors">
                <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">SN</div>
                <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">Course Code</div>
                <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">Course Title</div>
                <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-center">Units</div>
                <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-center">Score</div>
                <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-center">Grade</div>
                <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-center">Grade Point</div>
              </div>

              {/* Course Rows */}
              <div className="flex flex-col mt-2 gap-1">
                {courses.length === 0 ? (
                  <div className="py-12 text-center text-[14px] text-gray-400 dark:text-gray-500">
                    No courses found for this semester.
                  </div>
                ) : (
                  courses.map((course, idx) => {
                    const gradePoint = getGradePoint(course.grade, course.unit);
                    const isNG = course.grade === "NG" || course.score === null;
                    return (
                      <div
                        key={`${course.course_code}-${idx}`}
                        className="grid grid-cols-[50px_1.5fr_3.5fr_1fr_1fr_1fr_1.5fr] py-3 px-6 items-center text-[14px] text-gray-600 dark:text-gray-300 rounded-[8px] hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                      >
                        <div className="text-gray-400 dark:text-gray-500">{idx + 1}</div>
                        <div className="text-gray-700 dark:text-gray-200 font-medium">
                          {course.course_code}
                        </div>
                        <div className="font-medium pr-4">{course.course_title}</div>
                        <div className="text-center">{course.unit}</div>
                        <div className="text-center font-medium">
                          {isNG ? (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          ) : (
                            course.score
                          )}
                        </div>
                        <div className="text-center font-semibold">{course.grade}</div>
                        <div className="text-center font-semibold">
                          {gradePoint !== null ? gradePoint : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary Footer Row */}
              {semesterData && (
                <div className="mt-6 grid grid-cols-[50px_1.5fr_3.5fr_1fr_1fr_1fr_1.5fr] bg-[#F0F4FF] dark:bg-[#1a2744]/50 rounded-[12px] py-4 px-6 items-center border border-[#003cbb]/10 dark:border-[#4d82ff]/20 print:bg-[#EEF2FF] transition-colors">
                  <div />
                  <div className="col-span-3 text-[13px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    Summary
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-0.5">
                      Total Units
                    </div>
                    <div className="text-[15px] font-bold text-gray-800 dark:text-gray-100">
                      {totalCreditUnits}
                    </div>
                  </div>
                  <div />
                  <div className="text-center">
                    <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-0.5">
                      Semester GPA
                    </div>
                    <div className="text-[15px] font-bold text-[#003cbb] dark:text-[#4d82ff]">
                      {semesterGpa !== null ? semesterGpa.toFixed(2) : "—"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
