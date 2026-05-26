"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Download, Printer } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useRef, useState } from "react";

export default function DocumentPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const semesterId = decodeURIComponent(params.id as string || "2018/2019.1");
  const [session] = semesterId.split('.');
  const termName = semesterId.includes('.1') ? 'FIRST SEMESTER RESULTS' : semesterId.includes('.2') ? 'SECOND SEMESTER RESULTS' : 'SEMESTER RESULTS';

  const documentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const courses = [
    { sn: 1, code: "GEDS 280", title: "Leadership Skills", units: 3, score: 85, grade: "A", gp: 12 },
    { sn: 2, code: "GEDS 002", title: "Citizenship Orientation", units: 2, score: 40, grade: "D", gp: 9 },
    { sn: 3, code: "GEDS 312", title: "Introduction to Family Life Education", units: 3, score: 75, grade: "B", gp: 3 },
    { sn: 4, code: "COSC 302", title: "Algorithms and Data Structures", units: 3, score: 50, grade: "C", gp: 3 },
    { sn: 5, code: "COSC 105", title: "Students Industrial Work Experience SIWES", units: 3, score: 95, grade: "A", gp: 3 },
    { sn: 6, code: "COSC 105", title: "Students Industrial Work Experience SIWES", units: 3, score: 82, grade: "A", gp: 3 },
    { sn: 7, code: "COSC 105", title: "Internet Technologies and Web Application Development", units: 2, score: 65, grade: "B", gp: 2 },
    { sn: 8, code: "COSC 105", title: "Students Industrial Work Experience SIWES", units: 1, score: 79, grade: "B", gp: 1 },
    { sn: 9, code: "COSC 105", title: "Internet Technologies and Web Application Development", units: 2, score: 55, grade: "C", gp: 2 },
    { sn: 10, code: "COSC 105 Group A", title: "Internet Technologies and Web Application Development", units: 2, score: 78, grade: "B", gp: 2 },
  ];

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setIsDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const node = documentRef.current;
      const imgData = await toPng(node, {
        quality: 1.0,
        pixelRatio: 2,
        width: node.scrollWidth,
        height: node.scrollHeight,
        style: {
          borderRadius: '0px',
          boxShadow: 'none',
          border: 'none',
          margin: '0',
          overflow: 'visible',
          backgroundColor: '#ffffff'
        }
      });

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Result_${session}_${termName.replace(/ /g, '_')}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
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
          <h1 className="text-[17px] font-bold text-gray-900 dark:text-white">Document Preview</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="rounded-[10px] flex-1 md:flex-auto font-medium px-4 h-10 border-[#e2e4e9] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2C2C2C] bg-white dark:bg-transparent text-gray-700 dark:text-gray-100 shadow-sm transition-colors"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? (
               <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-gray-700 animate-spin mr-2" />
            ) : (
               <Download className="w-4 h-4 mr-2.5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
            )}
            Download PDF
          </Button>
          <Button 
            className="rounded-[10px] flex-1 md:flex-auto font-medium px-4 h-10 bg-[#003CBB] dark:bg-[#2563EB] hover:bg-[#5585EA] dark:hover:bg-[#1D4ED8] text-white shadow-sm transition-colors"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2.5" strokeWidth={2} />
            Print Document
          </Button>
        </div>
      </div>

      {/* Print Document Isolation Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-document, #printable-document * {
            visibility: visible;
          }
          #printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}} />

      {/* Document Container - Scrollable Wrapper for Mobile but ignored on Print */}
      <div className="w-full overflow-x-auto bg-transparent rounded-[24px] print:overflow-visible print:rounded-none">
        
        {/* The Paper Sheet */}
        <div id="printable-document" ref={documentRef} className="min-w-[900px] w-full max-w-5xl mx-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-[0_2px_15px_rgba(0,0,0,0.04)] rounded-[24px] relative overflow-hidden flex flex-col p-8 md:p-14 min-h-[800px] print:shadow-none print:border-none print:p-0 print:m-0 print:min-w-0 print:overflow-visible transition-colors duration-200">
          
          {/* Faint Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.6] dark:opacity-[0.2] z-0 print:opacity-[0.6]">
             <Image 
                src="/images/bu_logo2.png" 
                alt="Babcock University Logo" 
                width={500}
                height={500}
                className="h-[500px] w-[500px] object-contain print:opacity-[0.6]" 
                priority
              />
          </div>

          {/* Document Header Text */}
          <div className="relative flex flex-col items-center justify-center text-center mt-4 mb-4 z-10">
            <h2 className="text-[22px] font-normal text-gray-800 dark:text-gray-200 leading-tight tracking-wide mb-1 uppercase">YAKUBU ONOME JOY</h2>
            <h3 className="text-[26px] font-medium text-gray-900 dark:text-gray-100 leading-tight mb-2 uppercase">{session} {termName}</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase mb-1">B.Sc (Hons.) COMPUTER SCIENCE</p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">100 LEVEL COURSES</p>
          </div>

          {/* Document Table */}
          <div className="relative w-full z-10 flex flex-col flex-1 pb-10">
             <div className="grid grid-cols-[50px_1.5fr_3.5fr_1fr_1fr_1fr_1.5fr] bg-[#F8F9FB] dark:bg-gray-800/50 rounded-[12px] py-4 px-6 items-center border border-gray-50 dark:border-gray-800 print:bg-[#F3F4F6] print:border-none transition-colors">
               <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">SN</div>
               <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">Course code</div>
               <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">Course Title</div>
               <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-center">Units</div>
               <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-center">Score</div>
               <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-center">Grade</div>
               <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 text-center">Grade Point</div>
             </div>

             <div className="flex flex-col mt-4 gap-2">
                {courses.map((course, idx) => (
                  <div key={idx} className="grid grid-cols-[50px_1.5fr_3.5fr_1fr_1fr_1fr_1.5fr] py-3.5 px-6 items-center text-[14px] text-gray-600 dark:text-gray-300 rounded-[8px] hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <div>{course.sn}</div>
                    <div className="text-gray-700 dark:text-gray-200">{course.code}</div>
                    <div className="font-medium">{course.title}</div>
                    <div className="text-center">{course.units}</div>
                    <div className="text-center">{course.score}</div>
                    <div className="text-center">{course.grade}</div>
                    <div className="text-center">{course.gp}</div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>

    </div>
  );
}
