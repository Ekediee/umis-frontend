import { CheckCircle2, Info, ChevronDown, ChevronRight, CreditCard, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FinancePage() {
  return (
    <div className="flex flex-col gap-4 pb-12">
      
      {/* Top Approval Status */}
      <div className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
         <span className="text-[14px] font-semibold text-gray-700">Financial Approval</span>
         <div className="bg-[#EAF6ED] text-[#299054] px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-[#D4ECD9]">
            <CheckCircle2 className="w-3.5 h-3.5 fill-[#34A853] text-white" />
            APPROVED
          </div>
      </div>

      {/* Main Finance Card block */}
      <div className="bg-[#EAEFFF] rounded-[24px] overflow-hidden">
        
        {/* Financial Standing section */}
        <div className="p-5">
           <div className="flex items-center justify-between mb-4">
              <span className="text-[16px] font-medium text-gray-600">Financial Standing</span>
              <div className="bg-[#C5D0F5] text-[#3B5B98] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B5B98]"></span>
                GREAT
              </div>
           </div>

           <div className="mb-4">
              <span className="text-[15px] font-semibold text-gray-800 mb-2 block">Payment Progress 100%</span>
              <div className="h-2.5 w-full bg-white rounded-full overflow-hidden">
                 <div className="h-full bg-[#314A95] rounded-full" style={{ width: '85%' }}></div>
              </div>
           </div>

           <div className="flex gap-2.5 items-start">
             <Info className="w-5 h-5 text-[#3B5B98] shrink-0 mt-0.5" />
             <p className="text-[13px] text-[#3B5B98] leading-[1.35] font-medium">
               You must achieve a payment of at least <span className="font-bold">75% payment</span> in order for you to be allowed to write your mid-semester
             </p>
           </div>
        </div>

        {/* Action blocks section */}
        <div className="p-5 pb-6">
           <h3 className="text-[18px] font-bold text-gray-900 mb-3">Pay for a previous semester</h3>
           <div className="relative mb-4">
              <select className="w-full appearance-none bg-white border border-transparent rounded-[14px] px-4 py-3.5 text-[14px] text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
                <option>Select Semester</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
           </div>
           
           <Button className="w-full bg-[#202C82] hover:bg-[#1A2369] text-white rounded-[14px] py-6 text-[15px] font-medium flex items-center justify-center gap-2 mb-6 shadow-md transition-all">
              Make payment <ChevronRight className="w-4 h-4" />
           </Button>

           <h3 className="text-[18px] font-bold text-gray-900 mb-3">Pay for current semester</h3>
           <Button variant="outline" className="w-full bg-white hover:bg-gray-50 text-[#314A95] border-[#314A95]/20 rounded-[14px] py-6 text-[15px] font-medium flex items-center justify-center gap-2">
              Pay School Fees <ChevronRight className="w-4 h-4" />
           </Button>
        </div>
      </div>

      {/* Summary numeric cards */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex items-center mt-2">
         <div className="flex-1 border-r border-gray-100 pr-4">
           <p className="text-[12px] font-medium text-gray-500 mb-1">Full Session Fee</p>
           <p className="text-[18px] font-bold text-gray-900">₦4,500,000</p>
         </div>
         <div className="flex-1 pl-4">
           <p className="text-[12px] font-medium text-gray-500 mb-1">Amount Paid For Semester</p>
           <p className="text-[18px] font-bold text-gray-900">₦4,600,000</p>
         </div>
      </div>

      {/* Surplus card */}
      <div className="bg-[#EAF6ED] rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#D4ECD9] mt-2 relative">
         <Info className="absolute top-4 right-4 w-5 h-5 text-[#299054]" />
         <div className="flex items-center gap-2 text-[#5EB17E] font-medium text-[13px] mb-1">
            <CreditCard className="w-4 h-4" /> Surplus
         </div>
         <p className="text-[24px] font-bold text-[#209255]">₦100,000</p>
      </div>

    </div>
  );
}
