"use client";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";
import { Wallet, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function FinanceOverview() {
  const [showFullfee, toggleFullfee, mountedFullfee] = usePersistentToggle("showFullfee", true);
  const mounted = mountedFullfee;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 md:p-6 flex flex-col h-full transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900 dark:text-gray-100">Finance Overview</h3>
        </div>
        <div className="bg-[#cbf5e5] dark:bg-[#12B76A]/20 text-[#176448] dark:text-[#34d399] px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-colors duration-200">
          <CheckCircle2 className="w-[14px] h-[14px] fill-[#12B76A] dark:fill-[#34d399] text-white dark:text-[#064e3b]" />
          Approved
        </div>
      </div>

      {/* Fee Info */}
      <div className="flex flex-wrap items-start justify-between md:gap-6 mb-6 md:mb-8">
        {/* Full Session Fee */}
        <div className="flex flex-col min-w-[100px]">
          <div className="flex items-center h-7 gap-1 mb-1">
            <span className="text-[11px] md:text-[12px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">Full Session Fee</span>
            <button
              type="button"
              onClick={toggleFullfee}
              className="w-5 h-5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full touch-manipulation shrink-0"
              aria-label={showFullfee ? "Hide fees" : "Show fees"}
            >
              {showFullfee ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">
            {mounted && !showFullfee ? "****" : "₦4,500,000"}
          </p>
        </div>

        {/* Amount Paid */}
        <div className="flex flex-col min-w-[100px]">
          <div className="flex items-center h-7 mb-1">
            <span className="text-[11px] md:text-[12px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">Amount Paid</span>
          </div>
          <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">
            {mounted && !showFullfee ? "****" : "₦4,600,000"}
          </p>
        </div>

        {/* Outstanding Payment */}
        <div className="flex flex-col min-w-[100px]">
          <div className="flex items-center h-7 mb-1">
            <span className="text-[11px] md:text-[12px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">Outstanding Payment</span>
          </div>
          <p className="text-[22px] font-bold text-red-500 dark:text-red-400">
            {mounted && !showFullfee ? "****" : "₦0"}
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
