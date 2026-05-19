"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Download, Printer, CheckCircle, ClipboardList, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, Suspense } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useSearchParams } from "next/navigation";

const receiptItems = [
  { label: "Mandatory Basic Fees", amount: "₦185,000.00" },
  { label: "Selected Residence (Block C)", amount: "₦152,000.00" },
  { label: "Selected Meal Plan (Daily Standard)", amount: "₦45,000.00" },
  { label: "Selected Worship Center (Tithe/Levy)", amount: "₦12,500.00" },
  { label: "Registration & Admin Charges", amount: "₦252,500.00" },
];

function ReceiptContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "PAY-728910-ARTH";
  const amount = parseFloat(searchParams.get("amount") || "647000");
  const gateway = searchParams.get("gateway") || "Payzeep";

  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      setIsDownloading(true);

      const dataUrl = await toPng(receiptRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });

      const pdfWidth = receiptRef.current.offsetWidth;
      const pdfHeight = receiptRef.current.offsetHeight;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('receipt.pdf');
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

  return (
    <div className=" px-4 md:px-8 pb-12 print:px-0 print:pb-0 print:bg-white">
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            margin: 0.5cm;
          }
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
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
      <div className="flex flex-col gap-4 md:flex-row items-left justify-between mb-4 print:hidden">
        <Link
          href="/dashboard/finance"
          className="w-[25%] md:w-auto items-left inline-flex items-center gap-1.5 text-[#003cbb] dark:text-gray-200 text-[14px] font-medium bg-white dark:bg-gray-900 border border-[#003cbb]/20 dark:border-gray-800 rounded-[10px] px-4 py-2 hover:bg-[#f5f8fe] dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
            className="border-[#003cbb] dark:border-gray-800 text-[#003cbb] dark:text-gray-200 rounded-[10px] px-8 py-2 h-auto text-[13px] font-medium gap-1.5 hover:bg-[#f5f8fe] dark:hover:bg-gray-800"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-[#003cbb] hover:bg-[#003095] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8] text-white rounded-[10px] px-8 py-2 h-auto text-[13px] font-medium gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Document
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto  md:px-8 flex flex-col gap-4 pb-12 print:max-w-none print:px-0 print:pb-0">
        {/* Receipt Card */}
        <div id="printable-receipt" ref={receiptRef} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[24px] shadow-sm dark:shadow-none px-2 py-4 md:p-10 print:p-4 print:pt-2 relative overflow-hidden print:shadow-none print:border-none print:rounded-none transition-colors">
          {/* Background Watermark Image */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-100 z-0 transition-opacity">
            <img src="/images/BU Torch.png" alt="" className="w-[80%] md:w-[60%] object-contain" />
          </div>

          <div className="relative z-10">
            {/* Success Icon */}
            <div className="flex flex-col items-center mb-8 print:mb-4">
              <div className="w-[72px] h-[72px] rounded-full bg-[#ECFDF3] dark:bg-[#12b76a]/10 flex items-center justify-center mb-5 transition-colors">
                <CheckCircle className="w-10 h-10 text-[#12B76A]" fill="#12B76A" stroke="white" />
              </div>
              <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Payment Successful!</h1>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 text-center max-w-md leading-relaxed transition-colors">
                Your registration payment has been confirmed. A receipt has been sent to your registered email address.
              </p>
            </div>

            {/* Transaction Summary */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-[16px] p-5 md:p-6 mb-8 transition-colors">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[12px] font-bold text-gray-500 dark:text-gray-450 tracking-wider uppercase transition-colors">Transaction Summary</span>
                <span className="text-[10px] font-medium text-gray-450 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 transition-colors">
                  Ref: {ref}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[12px] text-gray-400 dark:text-gray-450 mb-1 transition-colors">Student Name</p>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 transition-colors">Yakubu Onome Joy</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-gray-400 dark:text-gray-450 mb-1 transition-colors">Amount Paid</p>
                  <p className="text-[15px] font-bold text-[#003cbb] dark:text-[#4d82ff] transition-colors">₦{amount.toLocaleString()}.00</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-400 dark:text-gray-450 mb-1 transition-colors">Payment Method</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#003cbb] dark:bg-[#4d82ff] flex items-center justify-center text-white text-[8px] font-bold transition-colors">
                      {gateway.substring(0, 2)}
                    </div>
                    <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors">{gateway}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-gray-400 dark:text-gray-450 mb-1 transition-colors">Date & Time</p>
                  <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors">
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} •{" "}
                    {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Paid For */}
            <div className="mb-8 px-2">
              <div className="flex items-center gap-2 mb-5">
                <ClipboardList className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-colors" />
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 transition-colors">Items Paid For</h3>
              </div>

              <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 transition-colors">
                {receiptItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3.5">
                    <span className="text-[14px] text-gray-600 dark:text-gray-300 transition-colors">{item.label}</span>
                    <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100 transition-colors">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-[#f5f8fe] dark:bg-[#003cbb]/10 rounded-[16px] p-5 md:p-6 print:p-6 flex flex-col md:flex-row print:flex-row items-center justify-between gap-3 mb-8 transition-colors">
              <div>
                <span className="text-[13px] font-bold text-[#003cbb] dark:text-[#4d82ff] tracking-wider uppercase transition-colors">TOTAL SUM PAID</span>
                <p className="text-[12px] text-[#003cbb]/70 dark:text-[#4d82ff]/70 mt-0.5 transition-colors">Calculated including VAT and administrative levies.</p>
              </div>
              <p className="text-[28px] md:text-[32px] print:text-[32px] font-bold text-[#003cbb] dark:text-[#4d82ff] transition-colors">₦{amount.toLocaleString()}.00</p>
            </div>

            {/* Verification Footer */}
            <div className="flex flex-col md:flex-row print:flex-row items-center print:items-start gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 print:bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 transition-colors">
                  <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors" />
                </div>
                <div className="text-center md:text-left print:text-left">
                  <p className="text-[11px] text-gray-400 dark:text-gray-450 transition-colors">Digital verification ID:</p>
                  <p className="text-[12px] font-medium text-gray-600 dark:text-gray-300 transition-colors">SEC-AUT-2024-4RE0-9912</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-450 transition-colors">Verify at: Busary.</p>
                </div>
              </div>
              <div className="md:ml-auto print:ml-auto text-center md:text-right print:text-right">
                <p className="text-[12px] text-gray-400 dark:text-gray-450 transition-colors">This is a system generated receipt, no signature required.</p>
                <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mt-0.5 transition-colors">University Registrar&apos;s Office</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003cbb]"></div>
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  );
}
