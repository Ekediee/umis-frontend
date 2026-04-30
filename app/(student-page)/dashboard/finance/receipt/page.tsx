"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Download, Printer, CheckCircle, ClipboardList, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const receiptItems = [
  { label: "Mandatory Basic Fees", amount: "₦185,000.00" },
  { label: "Selected Residence (Block C)", amount: "₦152,000.00" },
  { label: "Selected Meal Plan (Daily Standard)", amount: "₦45,000.00" },
  { label: "Selected Worship Center (Tithe/Levy)", amount: "₦12,500.00" },
  { label: "Registration & Admin Charges", amount: "₦252,500.00" },
];

export default function ReceiptPage() {
  return (
    <div className=" px-4 md:px-8 pb-12">

      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 md:flex-row items-left justify-between mb-4">
        <Link
          href="/dashboard/finance"
          className="w-[25%] md:w-auto items-left inline-flex items-center gap-1.5 text-[#1D4ED8] text-[14px] font-medium bg-white border border-[#1D4ED8]/20 rounded-[10px] px-4 py-2 hover:bg-blue-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            className="border-[#1D4ED8] text-[#1D4ED8] rounded-[10px] px-8 py-2 h-auto text-[13px] font-medium gap-1.5 hover:bg-blue-50"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button
            className="bg-[#1D4ED8] hover:bg-[#1839B0] text-white rounded-[10px] px-8 py-2 h-auto text-[13px] font-medium gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Document
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto  md:px-8 flex flex-col gap-4 pb-12">
        {/* Receipt Card */}
        <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm px-2 py-4 md:p-10">
          {/* Success Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-[72px] h-[72px] rounded-full bg-[#ECFDF3] flex items-center justify-center mb-5">
              <CheckCircle className="w-10 h-10 text-[#12B76A]" fill="#12B76A" stroke="white" />
            </div>
            <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-[14px] text-gray-500 text-center max-w-md leading-relaxed">
              Your registration payment has been confirmed. A receipt has been sent to your registered email address.
            </p>
          </div>

          {/* Transaction Summary */}
          <div className="border border-gray-200 rounded-[16px] p-5 md:p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[12px] font-bold text-gray-500 tracking-wider uppercase">Transaction Summary</span>
              <span className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-1">
                Ref: PAY-728910-ARTH
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-[12px] text-gray-400 mb-1">Student Name</p>
                <p className="text-[15px] font-semibold text-gray-900">Arthur Taylor</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-gray-400 mb-1">Amount Paid</p>
                <p className="text-[15px] font-bold text-[#1D4ED8]">₦647,000.00</p>
              </div>
              <div>
                <p className="text-[12px] text-gray-400 mb-1">Payment Method</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0038FF] flex items-center justify-center text-white text-[8px] font-bold">Pz</div>
                  <span className="text-[15px] font-medium text-gray-900">Payzeep</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-gray-400 mb-1">Date & Time</p>
                <p className="text-[15px] font-medium text-gray-900">Oct 14, 2024 • 10:42 AM</p>
              </div>
            </div>
          </div>

          {/* Items Paid For */}
          <div className="mb-8 px-2">
            <div className="flex items-center gap-2 mb-5">
              <ClipboardList className="w-5 h-5 text-gray-600" />
              <h3 className="text-[15px] font-bold text-gray-900">Items Paid For</h3>
            </div>

            <div className="flex flex-col divide-y divide-gray-100">
              {receiptItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3.5">
                  <span className="text-[14px] text-gray-600">{item.label}</span>
                  <span className="text-[14px] font-bold text-gray-900">{item.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#ECFDF3] rounded-[16px] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-3 mb-8">
            <div>
              <span className="text-[13px] font-bold text-[#027A48] tracking-wider uppercase">TOTAL SUM PAID</span>
              <p className="text-[12px] text-[#027A48]/70 mt-0.5">Calculated including VAT and administrative levies.</p>
            </div>
            <p className="text-[28px] md:text-[32px] font-bold text-[#027A48]">₦647,000.00</p>
          </div>

          {/* Verification Footer */}
          <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Digital verification ID:</p>
                <p className="text-[12px] font-medium text-gray-600">SEC-AUT-2024-4RE0-9912</p>
                <p className="text-[11px] text-gray-400">Verify at: portal.univ.edu/verify</p>
              </div>
            </div>
            <div className="md:ml-auto text-center md:text-right">
              <p className="text-[12px] text-gray-400">This is a system generated receipt, no signature required.</p>
              <p className="text-[13px] font-bold text-gray-900 mt-0.5">University Registrar&apos;s Office</p>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
