"use client";
import { useState, useEffect } from "react";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";
import { Wallet, CheckCircle2, ArrowRight, Eye, EyeOff, Clock } from "lucide-react";
import Link from "next/link";
import { getStudentFeesAction } from "@/app/actions/payment";
import type { StudentFeesData } from "@/app/actions/payment.types";

function formatFee(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₦0";
  const absAmount = Math.abs(amount);
  const hasDecimals = absAmount % 1 !== 0;
  return `₦${absAmount.toLocaleString(undefined, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function FinanceOverview() {
  const [showFullfee, toggleFullfee, mountedFullfee] = usePersistentToggle("showFullfee", true);
  const mounted = mountedFullfee;

  const [studentFees, setStudentFees] = useState<StudentFeesData | null>(null);
  const [isLoadingFees, setIsLoadingFees] = useState(true);

  useEffect(() => {
    getStudentFeesAction()
      .then((res) => {
        if (res.success && res.data) {
          setStudentFees(res.data);
        }
        setIsLoadingFees(false);
      })
      .catch((err) => {
        console.warn("Failed to load student fees:", err);
        setIsLoadingFees(false);
      });
  }, []);

  const paidAmount = studentFees?.amount_paid_for_semester ?? 0;
  const outstandingAmount = studentFees ? Math.abs(studentFees.total_outstanding_fees) : 0;
  const totalObligation = paidAmount + outstandingAmount;

  const progressPercent = totalObligation > 0
    ? Math.min(100, Math.max(0, Math.round((paidAmount / totalObligation) * 100)))
    : (outstandingAmount === 0 && paidAmount > 0 ? 100 : 0);

  const isFinancialApproved = progressPercent >= 75;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 p-5 md:p-6 flex flex-col h-full transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900 dark:text-gray-100">Finance Overview</h3>
        </div>
        {isFinancialApproved ? (
          <div className="bg-[#cbf5e5] dark:bg-[#12B76A]/20 text-[#176448] dark:text-[#34d399] px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-colors duration-200">
            <CheckCircle2 className="w-[14px] h-[14px] fill-[#12B76A] dark:fill-[#34d399] text-white dark:text-[#064e3b]" />
            Approved
          </div>
        ) : (
          <div className="bg-[#FFF4ED] dark:bg-[#F79009]/20 text-[#B54708] dark:text-[#FDB022] px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-colors duration-200">
            <Clock className="w-[14px] h-[14px] text-[#B54708] dark:text-[#FDB022]" />
            Pending Approval
          </div>
        )}
      </div>

      {/* Fee Info - 2x2 Grid */}
      <div className="grid grid-cols-2 mb-6 md:mb-8">
        {/* Estimated Full Session Fee */}
        <div className="flex flex-col min-w-0 pr-3 sm:pr-5 pb-4 sm:pb-5 border-r border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center min-h-[26px] gap-1.5 mb-1">
            <span className="text-[11px] sm:text-[12px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">
              Estimated Full Session Fee
            </span>
            <button
              type="button"
              onClick={toggleFullfee}
              className="w-5 h-5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full touch-manipulation shrink-0"
              aria-label={showFullfee ? "Hide fees" : "Show fees"}
            >
              {showFullfee ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[17px] sm:text-[20px] lg:text-[22px] font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {mounted && !showFullfee ? "****" : (isLoadingFees && !studentFees ? "₦..." : formatFee(studentFees?.estimated_full_session_fee))}
          </p>
        </div>

        {/* Estimated Semester Fee */}
        <div className="flex flex-col min-w-0 pl-3 sm:pl-5 pb-4 sm:pb-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center min-h-[26px] mb-1">
            <span className="text-[11px] sm:text-[12px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">
              Estimated Semester Fee
            </span>
          </div>
          <p className="text-[17px] sm:text-[20px] lg:text-[22px] font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {mounted && !showFullfee ? "****" : (isLoadingFees && !studentFees ? "₦..." : formatFee(studentFees?.estimated_semester_fee))}
          </p>
        </div>

        {/* Amount Paid For Semester */}
        <div className="flex flex-col min-w-0 pr-3 sm:pr-5 pt-4 sm:pt-5 border-r border-gray-100 dark:border-gray-800">
          <div className="flex items-center min-h-[26px] mb-1">
            <span className="text-[11px] sm:text-[12px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">
              Amount Paid For Semester
            </span>
          </div>
          <p className="text-[17px] sm:text-[20px] lg:text-[22px] font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {mounted && !showFullfee ? "****" : (isLoadingFees && !studentFees ? "₦..." : formatFee(studentFees?.amount_paid_for_semester))}
          </p>
        </div>

        {/* Outstanding Payment */}
        <div className="flex flex-col min-w-0 pl-3 sm:pl-5 pt-4 sm:pt-5">
          <div className="flex items-center min-h-[26px] mb-1">
            <span className="text-[11px] sm:text-[12px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">
              Outstanding Payment
            </span>
          </div>
          <p className="text-[17px] sm:text-[20px] lg:text-[22px] font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {mounted && !showFullfee ? "****" : (isLoadingFees && !studentFees ? "₦..." : formatFee(outstandingAmount))}
          </p>
        </div>
      </div>

      {/* Next Payment */}
      <div className="mt-auto bg-[#e5ecfc] dark:bg-gray-800/80 border border-[#dbeafe] dark:border-gray-800 rounded-[20px] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-200">
        <div className="flex flex-col">
          <span className="text-[13px] md:text-[14px] font-bold text-gray-900 dark:text-gray-100 mb-0.5">Next Payment</span>
          <span className="text-[11px] md:text-[12px] text-gray-600 dark:text-gray-400 font-medium leading-tight">Pay for a previous or current semester</span>
        </div>
        <Link 
          href="/dashboard/finance?action=fund"
          className="bg-[#003cbb] hover:bg-[#002470] dark:bg-[#4d82ff] dark:hover:bg-[#3b6ee0] text-white dark:text-gray-900 rounded-[10px] px-4 md:px-5 py-2.5 text-[13px] md:text-[14px] font-bold flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto transition-colors active:scale-[0.98]"
        >
          Fund your wallet
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
