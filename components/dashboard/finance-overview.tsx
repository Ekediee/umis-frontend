import { Wallet, CheckCircle2, Flag, ArrowRight } from "lucide-react";
import Link from "next/link";

export function FinanceOverview() {
  return (
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 md:p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-gray-500" />
          <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900">Finance Overview</h3>
        </div>
        <div className="bg-[#cbf5e5] text-[#176448] px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-[14px] h-[14px] fill-[#12B76A] text-white" />
          Approved
        </div>
      </div>

      {/* Fee Info */}
      <div className="flex flex-wrap items-start justify-between md:gap-6 mb-6 md:mb-8">
        <div className="flex flex-col gap-3 min-w-[100px]">
          <span className="text-[11px] md:text-[12px] font-medium text-gray-500 tracking-wide mb-1">Full Session Fee</span>
          <span className="text-[18px] md:text-[20px] font-bold text-gray-900 leading-none tracking-tight">₦4,500,000</span>
        </div>
        <div className="flex flex-col gap-3 min-w-[100px]">
          <span className="text-[11px] md:text-[12px] font-medium text-gray-500 tracking-wide mb-1">Amount Paid</span>
          <span className="text-[18px] md:text-[20px] font-bold text-gray-900 leading-none tracking-tight">₦4,600,000</span>
        </div>
        <div className="bg-[#cbf5e5] border border-[#dcfce7] rounded-[16px] p-3 px-4 flex flex-col min-w-[120px]">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#15803d] tracking-wider mb-1 uppercase">
            <Flag className="w-3 h-3" strokeWidth={3} /> Surplus
          </span>
          <span className="text-[18px] md:text-[20px] font-bold text-[#16a34a] leading-none tracking-tight">₦100,000</span>
        </div>
      </div>

      {/* Next Payment */}
      <div className="mt-auto bg-[#e5ecfc] border border-[#dbeafe] rounded-[16px] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[13px] md:text-[14px] font-bold text-gray-900 mb-0.5">Next Payment</span>
          <span className="text-[11px] md:text-[12px] text-gray-600 font-medium leading-tight">Pay for a previous or current semester</span>
        </div>
        <Link 
          href="/dashboard/finance"
          className="bg-[#003cbb] hover:bg-[#002470] text-white rounded-[10px] px-4 md:px-5 py-2.5 text-[13px] md:text-[14px] font-medium flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto transition-colors active:scale-[0.98]"
        >
          Make payment
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
