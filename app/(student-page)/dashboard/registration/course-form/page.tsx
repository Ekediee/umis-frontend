"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Download, Printer, GraduationCap, MapPin, User, Users, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, Suspense, useEffect } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { getStudentProfileAction } from "@/app/actions/user";
import { UMISResponse } from "@/lib/session";
import { CourseItem, getWorshipCentersAction, getRegisteredCoursesAction, getHasSubmittedCoursesAction } from "@/app/actions/registration";
import { getOfflineDraft, OFFLINE_COURSE_CART_KEY } from "@/lib/offline-storage";
import { useStudentAvatar, DEFAULT_AVATAR } from "@/hooks/use-student-avatar";
import { isPlaceholderAvatar } from "@/lib/student/placeholder-avatar";
import { getStudentFeesAction } from "@/app/actions/payment";
import type { StudentFeesData } from "@/app/actions/payment.types";

function CourseFormContent() {
  const [userData, setUserData] = useState<UMISResponse | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [courseFetchError, setCourseFetchError] = useState<string | null>(null);
  const [selectedWorshipCenter, setSelectedWorshipCenter] = useState<string | null>(null);
  // "Fully registered" only once the backend confirms the course form was submitted
  const [submission, setSubmission] = useState<"checking" | "submitted" | "not_submitted" | "unknown">("checking");
  // Fees from the same endpoint as the Finance page
  const [fees, setFees] = useState<StudentFeesData | null>(null);
  const [feesState, setFeesState] = useState<"loading" | "ready" | "error">("loading");
  const formRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  // The student's own photo (server, fresh upload or cached copy); the form only shows a real photo
  const { avatarUrl } = useStudentAvatar(userData);
  const [photoFailed, setPhotoFailed] = useState(false);
  const studentPhoto = !photoFailed && avatarUrl !== DEFAULT_AVATAR && !isPlaceholderAvatar(avatarUrl) ? avatarUrl : null;

  useEffect(() => {
    getStudentProfileAction().then(setUserData);

    getStudentFeesAction()
      .then((res) => {
        if (res.success && res.data) {
          setFees(res.data);
          setFeesState("ready");
        } else setFeesState("error");
      })
      .catch(() => setFeesState("error"));

    getHasSubmittedCoursesAction()
      .then((res) => setSubmission(res.data ? (res.data.hasSubmitted ? "submitted" : "not_submitted") : "unknown"))
      .catch(() => setSubmission("unknown"));

    async function loadCourses() {
      setIsLoadingCourses(true);
      setCourseFetchError(null);
      try {
        const res = await getRegisteredCoursesAction();
        if (res.error) {
          setCourseFetchError(res.error);
        } else if (res.data) {
          setCourses(res.data);
        }
      } catch (error) {
        console.error("Failed to load registered courses from API:", error);
        setCourseFetchError("Failed to load courses. Please try again.");
      } finally {
        setIsLoadingCourses(false);
      }
    }

    async function loadDraft() {
      const draft = await getOfflineDraft<{ group: string | null; courses: string[], worshipCenter: string | null }>(OFFLINE_COURSE_CART_KEY);
      if (draft && draft.worshipCenter) {
        try {
          const res = await getWorshipCentersAction();
          if (res.data) {
            const wc = res.data.find(w => w.id === draft.worshipCenter);
            if (wc) {
              setSelectedWorshipCenter(wc.name);
            }
          }
        } catch (error) {
          console.error("Failed to load worship centers:", error);
        }
      }
    }

    loadCourses();
    loadDraft();
  }, []);

  const handleDownload = async () => {
    if (!formRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(formRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const pdfWidth = formRef.current.offsetWidth;
      const pdfHeight = formRef.current.offsetHeight;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('course-form.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const student = userData?.user_data;

  const rawLevel = student?.academic_information?.study_level || student?.current_level;
  const displayLevel = rawLevel ? (Number(rawLevel) < 10 ? Number(rawLevel) * 100 : rawLevel) : null;

  const displayCgpa = typeof student?.academic_information?.cummulative_gpa === 'number'
    ? student.academic_information.cummulative_gpa.toFixed(2)
    : typeof student?.cummulative_gpa === 'number'
    ? student.cummulative_gpa.toFixed(2)
    : student?.academic_information?.cummulative_gpa || student?.cummulative_gpa || "—";

  const displayFullName = student?.personal_information?.student_name || student?.student_name || userData?.entity_name || "—";

  const displayMatricNumber = student?.personal_information?.matric_number || student?.matric_number || "—";

  const displayCourses = courses.map(course => ({
    code: course.code || course.id,
    title: course.title,
    units: typeof course.units === 'number' ? course.units.toFixed(1) : String(course.units || "0.0"),
    option: course.classOption || student?.department || "—",
    lecturer: course.lecturer
  }));

  /** "₦492,984" like the Finance page; a dash while loading or if fees couldn't load */
  const fee = (amount: number | undefined) => {
    if (feesState === "loading") return "₦…";
    if (amount === undefined || Number.isNaN(amount)) return "—";
    const abs = Math.abs(amount);
    return `₦${abs.toLocaleString(undefined, { minimumFractionDigits: abs % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  };

  // The profile API doesn't send a birth date yet; show it as soon as it does
  const personal = (student?.personal_information ?? {}) as Record<string, unknown>;
  const rawBirthDate = personal.date_of_birth ?? personal.birth_date ?? personal.dob;
  const displayBirthDate = (() => {
    if (typeof rawBirthDate !== "string" || !rawBirthDate.trim()) return "—";
    const d = new Date(rawBirthDate);
    return Number.isNaN(d.getTime()) ? rawBirthDate : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
  })();

  const totalUnits = displayCourses.reduce((sum, c) => sum + parseFloat(c.units || "0"), 0).toFixed(1);

  return (
    <div className="px-4 md:px-8 pb-12 print:px-0 print:pb-0 print:bg-white">
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          /* The app shell is dark in dark mode: print on plain white */
          html, body {
            background: #fff !important;
            color-scheme: light;
          }
          body * {
            visibility: hidden;
          }
          #printable-form, #printable-form * {
            visibility: visible;
          }
          #printable-form {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Never split a course row, a section or the signature rows across pages */
          #printable-form tr,
          #printable-form .print-keep {
            break-inside: avoid;
          }
          #printable-form thead {
            display: table-header-group;
          }
        }
      `}} />

      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 md:flex-row items-center justify-between mb-6 print:hidden">
        <Link
          href="/registration"
          className="inline-flex items-center gap-1.5 text-[#003cbb] text-[14px] font-medium bg-white border border-[#003cbb]/20 rounded-[10px] px-4 py-2 hover:bg-[#f5f8fe] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
            className="border-[#003cbb] text-[#003cbb] rounded-[10px] px-6 py-2 h-auto text-[13px] font-medium gap-2 hover:bg-[#f5f8fe]"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-[#003cbb] hover:bg-[#003095] text-white rounded-[10px] px-6 py-2 h-auto text-[13px] font-medium gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Document
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col gap-4 pb-12 print:max-w-none print:px-0 print:pb-0">
        {/* Course Form Card */}
        <div id="printable-form" ref={formRef} className="bg-white text-gray-900 border border-gray-200 rounded-[12px] p-6 sm:p-10 md:p-12 print:p-0 relative overflow-hidden print:shadow-none print:border-none print:rounded-none">
          
          {/* Watermark */}
          <div aria-hidden className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
            <Image
              src="/images/bu_logo2.png"
              alt=""
              width={692}
              height={1163}
              className="w-[46%] max-w-[360px] h-auto opacity-40"
            />
          </div>

          <div className="relative z-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-blue-900/10 pb-8 mb-8 gap-6 print:pb-5 print:mb-5">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                {/* Full Babcock University logo: crest, name and motto */}
                <Image src="/images/bu_logo_full.png" alt="Babcock University" width={875} height={973} priority className="w-[88px] h-auto shrink-0 print:w-[76px]" />
                <div className="flex flex-col">
                  <h1 className="text-[26px] md:text-[32px] font-bold text-[#1e3a8a] tracking-tight print:text-[26px]">BABCOCK UNIVERSITY</h1>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-gray-500 tracking-[1.5px] uppercase">2025/2026.2 REGISTRATION FORM</p>
                </div>
              </div>
              
              {/* Profile Image Placeholder */}
              <div className="relative w-[120px] h-[140px] print:w-[96px] print:h-[112px] bg-gray-50 border-2 border-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                {studentPhoto ? (
                  // Plain <img> so Download PDF (html-to-image) captures it too
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={studentPhoto}
                    alt={`Photo of ${displayFullName}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setPhotoFailed(true)}
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-200" />
                )}
              </div>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 print:gap-3 print:mb-6 print-keep">
              <div className="col-span-1 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-5 print:p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Full Name</p>
                <p className="text-[18px] font-bold text-gray-900 uppercase">{displayFullName}</p>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Matric Number</p>
                  <p className="text-[16px] font-mono font-bold text-gray-800">{displayMatricNumber}</p>
                </div>
              </div>
              <div className="col-span-1 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-5 print:p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[13px] font-bold text-gray-600 uppercase mb-0.5">{student?.school_name || "—"}</p>
                  <p className="text-[14px] font-medium text-gray-500">{student?.department || "—"}</p>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Level</p>
                  <p className="text-[16px] font-bold text-gray-800">{displayLevel ? `${displayLevel}.0` : "—"}</p>
                </div>
              </div>
              <div className="col-span-1 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-5 print:p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Print Date</p>
                  <p className="text-[14px] font-medium text-gray-600">
                    {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                  {(() => {
                    const badge = {
                      submitted: { label: "Fully registered", box: "bg-[#dcfce7] border-[#bbf7d0]", dot: "bg-[#22c55e]", text: "text-[#15803d]" },
                      not_submitted: { label: "Courses not submitted", box: "bg-[#fef3c7] border-[#fde68a]", dot: "bg-[#f59e0b]", text: "text-[#b45309]" },
                      checking: { label: "Checking…", box: "bg-gray-100 border-gray-200", dot: "bg-gray-400 animate-pulse", text: "text-gray-500" },
                      unknown: { label: "Status unavailable", box: "bg-gray-100 border-gray-200", dot: "bg-gray-400", text: "text-gray-500" },
                    }[submission];
                    return (
                      <div className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full ${badge.box}`}>
                        <div className={`w-2 h-2 rounded-full ${badge.dot}`} />
                        <span className={`text-[11px] font-bold uppercase whitespace-nowrap ${badge.text}`}>{badge.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Registration Details Section */}
            <div className="mb-10 print:mb-6 print-keep">
              <div className="flex items-center gap-3 mb-6 print:mb-4">
                <div className="w-1.5 h-6 bg-blue-900 rounded-full" />
                <h2 className="text-[18px] font-bold text-gray-800 uppercase tracking-wide">Student & Registration Details</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-8 px-2 print:gap-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sex</p>
                  <p className="text-[14px] font-medium text-gray-900">{student?.personal_information?.gender || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Marital Status</p>
                  <p className="text-[14px] font-medium text-gray-900">{student?.personal_information?.marital_status || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Birth Date</p>
                  <p className="text-[14px] font-medium text-gray-900">{displayBirthDate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Religion</p>
                  <p className="text-[14px] font-medium text-gray-900">{student?.personal_information?.religion || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Worship Center</p>
                  <p className="text-[14px] font-medium text-gray-900">{selectedWorshipCenter || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Residence</p>
                  <p className="text-[14px] font-medium text-gray-900">{student?.is_off_campus ? "Off Campus" : "On Campus"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Address</p>
                  <p className="text-[14px] font-medium text-gray-900">{student?.contact_information?.residential_address || "—"}</p>
                </div>
              </div>

              {/* CGPA Banner */}
              <div className="mt-8 print:mt-5 bg-blue-50/50 border border-blue-100 rounded-xl p-4 print:py-3 flex items-center justify-between">
                <p className="text-[11px] font-bold text-[#1e3a8a] uppercase tracking-wider">Current CGPA</p>
                <p className="text-[20px] font-bold text-[#1e3a8a]">{displayCgpa}</p>
              </div>
            </div>

            {/* Course List Table */}
            <div className="mb-10 print:mb-6">
              <div className="flex items-center justify-between mb-6 print:mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-900 rounded-full" />
                  <h2 className="text-[18px] font-bold text-gray-800 uppercase tracking-wide">Selected Course List</h2>
                </div>
                {!isLoadingCourses && !courseFetchError && (
                  <div className="text-[14px] font-bold text-gray-400 uppercase">
                    Total Units: <span className="text-blue-900 text-[16px]">{totalUnits}</span>
                  </div>
                )}
              </div>

              {/* Error banner */}
              {courseFetchError && (
                <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                  <p className="text-[13px] font-medium text-red-700">{courseFetchError}</p>
                  <button
                    onClick={() => {
                      setCourseFetchError(null);
                      setIsLoadingCourses(true);
                      getRegisteredCoursesAction().then((res) => {
                        if (res.error) {
                          setCourseFetchError(res.error);
                        } else if (res.data) {
                          setCourses(res.data);
                        }
                        setIsLoadingCourses(false);
                      });
                    }}
                    className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-50 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Course ID</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Course Title</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase text-center">Units</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Class Option</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Lecturer Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoadingCourses ? (
                      /* Loading skeleton */
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-4 py-3.5"><div className="h-3.5 w-20 rounded bg-gray-200" /></td>
                          <td className="px-4 py-3.5"><div className="h-3.5 w-48 rounded bg-gray-200" /></td>
                          <td className="px-4 py-3.5 text-center"><div className="h-3.5 w-8 rounded bg-gray-200 mx-auto" /></td>
                          <td className="px-4 py-3.5"><div className="h-3.5 w-28 rounded bg-gray-200" /></td>
                          <td className="px-4 py-3.5"><div className="h-3.5 w-36 rounded bg-gray-200" /></td>
                        </tr>
                      ))
                    ) : displayCourses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-gray-500">
                          No courses have been registered yet.
                        </td>
                      </tr>
                    ) : (
                      displayCourses.map((course, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5 print:py-2 text-[14px] print:text-[12px] font-mono font-bold text-blue-900 whitespace-nowrap">{course.code}</td>
                          <td className="px-4 py-3.5 print:py-2 text-[14px] print:text-[12px] font-medium text-gray-800">{course.title}</td>
                          <td className="px-4 py-3.5 print:py-2 text-[14px] print:text-[12px] text-gray-700 text-center">{course.units}</td>
                          <td className="px-4 py-3.5 print:py-2 text-[14px] print:text-[12px] text-gray-500">{course.option}</td>
                          <td className="px-4 py-3.5 print:py-2 text-[12px] print:text-[11px] text-gray-800 font-medium uppercase">{course.lecturer}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Section */}
            <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-6 mb-10 print:p-4 print:mb-6 print-keep">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-blue-900 rounded-full" />
                <h2 className="text-[18px] font-bold text-gray-800 uppercase tracking-wide">Student Financial Summary</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 print:gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Account No</p>
                  <p className="text-[14px] font-mono font-bold text-gray-900">{student?.account_number || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Level</p>
                  <p className="text-[14px] font-bold text-gray-900">{displayLevel ? `${displayLevel}.0` : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Semester Fee</p>
                  <p className="text-[14px] font-bold text-gray-900">{fee(fees?.estimated_semester_fee)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Paid</p>
                  <p className="text-[14px] font-bold text-green-600">{fee(fees?.amount_paid_for_semester)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Outstanding</p>
                  <p className="text-[16px] font-bold text-blue-900">{fee(fees?.total_outstanding_fees)}</p>
                </div>
              </div>
            </div>

            {/* Approval Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 pt-8 mb-12 print:pt-10 print:mb-6 print-keep">
               <div className="border-t border-gray-300 pt-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Course Advisor Signature (Okesola, K)</p>
               </div>
               <div className="border-t border-gray-300 pt-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">School Officer Approval</p>
               </div>
               <div className="border-t border-gray-300 pt-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">HOD Signature</p>
               </div>
            </div>

            {/* Footer Tagline */}
            <div className="flex flex-col items-center pt-8 border-t border-gray-100 print:pt-5 print-keep">
               <p className="font-serif italic font-bold text-[18px] print:text-[15px] text-blue-900 mb-8 print:mb-4 text-center tracking-tight leading-relaxed">
                  "A Seventh Day Adventist Institute Of Higher Learning"
               </p>
               
               <div className="w-full flex justify-between gap-6 px-0 sm:px-12 mt-4 print:mt-8">
                  <div className="border-t border-gray-400 pt-2 px-8 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Student Signature</p>
                  </div>
                  <div className="border-t border-gray-400 pt-2 px-8 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Registrar's Office</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003cbb]"></div>
        </div>
      }
    >
      <CourseFormContent />
    </Suspense>
  );
}
