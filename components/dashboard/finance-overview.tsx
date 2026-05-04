import { Wallet, CheckCircle2, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FinanceOverview() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden h-full flex flex-col">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-500" />
            <h3 className="text-[17px] font-bold text-gray-900">Finance Overview</h3>
          </div>
          <div className="bg-[#ECFDF3] text-[#12B76A] px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-[#D1FADF]">
            <CheckCircle2 className="w-[14px] h-[14px] fill-[#12B76A] text-white" />
            Approved
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8 sm:flex sm:items-center sm:justify-between sm:flex-wrap">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide mb-1.5 block">Full Session Fee</span>
            <span className="text-[20px] lg:text-[24px] font-bold text-gray-900 leading-none tracking-tight">₦4,500,000</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide mb-1.5 block">Amount Paid</span>
            <span className="text-[20px] lg:text-[24px] font-bold text-gray-900 leading-none tracking-tight">₦4,600,000</span>
          </div>
          <div className="col-span-2 bg-[#ECFDF3] border border-[#D1FADF] rounded-[20px] p-3.5 px-5 flex flex-col items-start min-w-[140px] mt-2 sm:mt-0">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#027A48] tracking-wider mb-2 uppercase">
              <Flag className="w-3 h-3" strokeWidth={3} /> Surplus
            </span>
            <span className="text-[20px] lg:text-[24px] font-bold text-[#12B76A] leading-none tracking-tight">₦100,000</span>
          </div>
        </div>

        <div className="mt-auto bg-[#F8F9FB] rounded-[20px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-gray-900 mb-0.5">Next Payment</span>
            <span className="text-[12px] text-gray-500 font-medium leading-tight">Pay for a previous or current semester</span>
          </div>
          <Button className="bg-[#003095] hover:bg-[#002470] text-white rounded-xl px-5 py-6 text-[14px] font-semibold flex items-center gap-2 h-auto shrink-0 w-full sm:w-auto shadow-md">
            Make payment 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
