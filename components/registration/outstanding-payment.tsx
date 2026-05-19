"use client";

import Image from "next/image";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function OutstandingPayment() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full max-w-[1200px] mx-auto pb-10">
      
      {/* Alert Banner */}
      <div className="bg-[#FEF3EB] dark:bg-[#F97316]/10 rounded-[12px] p-4 flex gap-3 items-start border border-[#F97316]/20 dark:border-[#F97316]/30">
        <div className="mt-0.5">
          <AlertTriangle className="w-[20px] h-[20px] text-[#F97316] dark:stroke-gray-900" fill="#F97316" stroke="#FEF3EB" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-[#0A0D14] dark:text-gray-100 text-[14px]">Outstanding Session Payment</h3>
          <p className="text-[#525866] dark:text-gray-300 text-[14px] leading-relaxed">
            You cannot proceed with this semester registration because you have not completely paid for the previous semester, kindly pay your outstanding bills and Try again.
          </p>
        </div>
      </div>

      {/* Payment Banner */}
      <div className="bg-gradient-to-b from-[#c2d6ff] to-[#ebf1ff] dark:from-[#1b2a4a] dark:to-[#111c30] rounded-[14px] relative overflow-hidden flex flex-col justify-center px-6 md:px-10 py-10 md:h-[220px]">
        <div className="relative z-10 flex flex-col gap-6 md:max-w-[60%]">
          <h2 className="text-[28px] md:text-[32px] font-semibold text-black dark:text-gray-100 tracking-[-0.5px]">
            Pay for a previous semester
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative w-full sm:w-[220px]">
              <select className="w-full appearance-none bg-white dark:bg-gray-800 border border-[#E2E4E9] dark:border-gray-700 text-[#525866] dark:text-gray-300 text-[14px] rounded-[10px] pl-4 pr-10 py-2.5 h-[44px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003CBB]">
                <option value="">Select Semester</option>
                <option value="fall-2025">Fall 2025</option>
                <option value="spring-2025">Spring 2025</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-[#525866] dark:text-gray-400" />
              </div>
            </div>
            
            <Link href="/dashboard/finance/fees">
              <Button className="h-[44px] bg-[#003CBB] dark:bg-[#2563EB] hover:bg-[#003CBB]/90 dark:hover:bg-[#1D4ED8] text-white rounded-[10px] px-6 flex gap-2 w-full sm:w-auto shadow-sm">
                <span className="font-medium text-[14px]">Make payment</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Image */}
        <div className="absolute right-[-20px] md:right-[20px] bottom-[-20px] md:top-1/2 md:-translate-y-1/2 w-[200px] md:w-[260px] opacity-20 md:opacity-100 pointer-events-none mix-blend-multiply md:mix-blend-normal">
          <Image 
            src="/images/HandSuccessPay.png" 
            alt="Payment Successful" 
            width={300} 
            height={300} 
            className="object-contain w-full h-auto"
          />
        </div>
      </div>
      
    </div>
  );
}
