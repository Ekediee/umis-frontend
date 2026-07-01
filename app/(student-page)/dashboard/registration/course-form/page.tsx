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
import { getClassGroupsAction, getCoursesAction, CourseItem, getWorshipCentersAction } from "@/app/actions/registration";
import { getOfflineDraft, OFFLINE_COURSE_CART_KEY } from "@/lib/offline-storage";

const COURSE_LIST = [
  { id: "GST 312", title: "Peace and Conflict Resolution", units: "2.0", option: "Soft Eng", lecturer: "APAT KIDEN TANIMU" },
  { id: "ENT 312", title: "Venture Creation", units: "2.0", option: "Soft Eng", lecturer: "ESATOR GOODLUCK" },
  { id: "BU-GST 032", title: "Citizenship Orientation", units: "0.0", option: "Soft Eng", lecturer: "ABIOYE FUNKE VICTORIA" },
  { id: "SEN 322", title: "Software Engineering Innovation", units: "2.0", option: "Soft Eng", lecturer: "MENSAH YAW AGYEI" },
  { id: "CSC 308", title: "Operating Systems", units: "3.0", option: "Soft Eng", lecturer: "AJAYI WUMI" },
  { id: "SEN 306", title: "Software Construction", units: "2.0", option: "Soft Eng", lecturer: "OKESOLA KIKELOMO IBIWUNMI" },
  { id: "SEN 304", title: "Software Testing and QA", units: "2.0", option: "Soft Eng", lecturer: "ADEBANJO ADEDOYIN SAMUEL" },
  { id: "SEN 350", title: "SIWES", units: "6.0", option: "Soft Eng", lecturer: "FATADE OLUWAYEMISI B" },
];

function CourseFormContent() {
  const [userData, setUserData] = useState<UMISResponse | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedWorshipCenter, setSelectedWorshipCenter] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    getStudentProfileAction().then(setUserData);

    async function loadCourses() {
      try {
        const groupRes = await getClassGroupsAction();
        if (groupRes.data && groupRes.data.length > 0) {
          const coursesRes = await getCoursesAction([groupRes.data[0].id]);
          if (coursesRes.data?.courses) {
            setCourses(coursesRes.data.courses);
          }
        }
      } catch (error) {
        console.error("Failed to load courses from API:", error);
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
  const displayLevel = rawLevel ? (Number(rawLevel) < 10 ? Number(rawLevel) * 100 : rawLevel) : "300";

  const displayCgpa = typeof student?.academic_information?.cummulative_gpa === 'number'
    ? student.academic_information.cummulative_gpa.toFixed(2)
    : typeof student?.cummulative_gpa === 'number'
    ? student.cummulative_gpa.toFixed(2)
    : student?.academic_information?.cummulative_gpa || student?.cummulative_gpa || "4.36";

  const displayFullName = student?.personal_information?.student_name || student?.student_name || userData?.entity_name || "YAKUBU ONOME JOY";

  const displayMatricNumber = student?.personal_information?.matric_number || student?.matric_number || "23/0039";

  const displayCourses = (courses.length > 0 ? courses : COURSE_LIST).map(course => ({
    code: 'code' in course ? (course.code as string) : (course.id as string),
    title: course.title,
    units: typeof course.units === 'number' ? course.units.toFixed(1) : course.units,
    option: 'option' in course ? (course.option as string) : (student?.department || "Software Engineering"),
    lecturer: course.lecturer
  }));

  const totalUnits = displayCourses.reduce((sum, c) => sum + parseFloat(c.units || "0"), 0).toFixed(1);

  return (
    <div className="px-4 md:px-8 pb-12 print:px-0 print:pb-0 print:bg-white">
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            margin: 0.5cm;
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
        <div id="printable-form" ref={formRef} className="bg-white border border-gray-200 rounded-[12px] shadow-sm p-6 md:p-12 print:p-8 relative overflow-hidden print:shadow-none print:border-none">
          
          {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] z-0">
             <Image 
              src="/images/BU Torch.png" 
              alt="" 
              width={500} 
              height={500} 
              className="w-[70%] grayscale"
            />
          </div>

          <div className="relative z-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-blue-900/10 pb-8 mb-8 gap-6">
              <div className="flex items-center gap-6">
                <Image src="/images/BU Torch.png" alt="Babcock University" width={80} height={80} className="shrink-0" />
                <div className="flex flex-col">
                  <h1 className="text-[28px] md:text-[32px] font-bold text-[#1e3a8a] tracking-tight">BABCOCK UNIVERSITY</h1>
                  <p className="text-[14px] font-semibold text-gray-500 tracking-[1.5px] uppercase">2025/2026.2 REGISTRATION FORM</p>
                </div>
              </div>
              
              {/* Profile Image Placeholder */}
              <div className="w-[120px] h-[140px] bg-gray-50 border-2 border-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                 <User className="w-16 h-16 text-gray-200" />
              </div>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="col-span-1 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Full Name</p>
                <p className="text-[18px] font-bold text-gray-900 uppercase">{displayFullName}</p>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Matric Number</p>
                  <p className="text-[16px] font-mono font-bold text-gray-800">{displayMatricNumber}</p>
                </div>
              </div>
              <div className="col-span-1 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[13px] font-bold text-gray-600 uppercase mb-0.5">{student?.school_name || "SCHOOL OF COMPUTING"}</p>
                  <p className="text-[14px] font-medium text-gray-500">{student?.department || "Software Engineering"}</p>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Level</p>
                  <p className="text-[16px] font-bold text-gray-800">{displayLevel}.0</p>
                </div>
              </div>
              <div className="col-span-1 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Print Date</p>
                  <p className="text-[14px] font-medium text-gray-600">
                    {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                  <div className="inline-flex items-center gap-1.5 bg-[#dcfce7] border border-[#bbf7d0] px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    <span className="text-[11px] font-bold text-[#15803d] uppercase">FULLY REGISTERED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Details Section */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-blue-900 rounded-full" />
                <h2 className="text-[18px] font-bold text-gray-800 uppercase tracking-wide">Student & Registration Details</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 px-2">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sex</p>
                  <p className="text-[14px] font-medium text-gray-900">{student?.personal_information?.gender || "Female"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Marital Status</p>
                  <p className="text-[14px] font-medium text-gray-900">{student?.personal_information?.marital_status || "Single"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Birth Date</p>
                  <p className="text-[14px] font-medium text-gray-900">19-Feb-2007</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Religion</p>
                  <p className="text-[14px] font-medium text-gray-900">{student?.personal_information?.religion || "Christian (SDA)"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Worship Center</p>
                  <p className="text-[14px] font-medium text-gray-900">{selectedWorshipCenter || "—"}</p>
                </div>
                <div className="col-span-1 md:col-span-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Residence</p>
                  <p className="text-[14px] font-medium text-gray-900">{student?.is_off_campus ? "Off Campus" : "On Campus"}</p>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Address</p>
                  <p className="text-[14px] font-medium text-gray-900">{student?.contact_information?.residential_address || "11 Eleku Street, Ilishan Remo"}</p>
                </div>
              </div>

              {/* CGPA Banner */}
              <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <p className="text-[11px] font-bold text-[#1e3a8a] uppercase tracking-wider">Current CGPA</p>
                <p className="text-[20px] font-bold text-[#1e3a8a]">{displayCgpa}</p>
              </div>
            </div>

            {/* Course List Table */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-900 rounded-full" />
                  <h2 className="text-[18px] font-bold text-gray-800 uppercase tracking-wide">Selected Course List</h2>
                </div>
                <div className="text-[14px] font-bold text-gray-400 uppercase">
                  Total Units: <span className="text-blue-900 text-[16px]">{totalUnits}</span>
                </div>
              </div>

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
                    {displayCourses.map((course, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5 text-[14px] font-mono font-bold text-blue-900">{course.code}</td>
                        <td className="px-4 py-3.5 text-[14px] font-medium text-gray-800">{course.title}</td>
                        <td className="px-4 py-3.5 text-[14px] text-gray-700 text-center">{course.units}</td>
                        <td className="px-4 py-3.5 text-[14px] text-gray-500">{course.option}</td>
                        <td className="px-4 py-3.5 text-[12px] text-gray-800 font-medium uppercase">{course.lecturer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Section */}
            <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-6 mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-blue-900 rounded-full" />
                <h2 className="text-[18px] font-bold text-gray-800 uppercase tracking-wide">Student Financial Summary</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Account No</p>
                  <p className="text-[14px] font-mono font-bold text-gray-900">{student?.account_number || "S230039"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Level</p>
                  <p className="text-[14px] font-bold text-gray-900">{displayLevel}.0</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Fees</p>
                  <p className="text-[14px] font-bold text-gray-900">₦492,984</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Paid</p>
                  <p className="text-[14px] font-bold text-green-600">₦492,984</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Final Balance</p>
                  <p className="text-[16px] font-bold text-blue-900">-20,109.00</p>
                </div>
              </div>
            </div>

            {/* Approval Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8 mb-12">
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
            <div className="flex flex-col items-center pt-8 border-t border-gray-100">
               <p className="font-serif italic font-bold text-[18px] text-blue-900 mb-8 text-center tracking-tight leading-relaxed">
                  "A Seventh Day Adventist Institute Of Higher Learning"
               </p>
               
               <div className="w-full flex justify-between px-12 mt-4">
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
