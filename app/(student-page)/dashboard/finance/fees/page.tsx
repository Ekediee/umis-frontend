"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FeesPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<"full" | "semester" | null>(null);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col gap-6 w-full px-4 md:px-8 pb-10 relative bg-white dark:bg-black md:bg-transparent min-h-screen md:min-h-0 transition-colors">
      
      {/* General Back Button (Desktop only) */}
      <div className="hidden md:flex mt-2 mb-2">
        <Button 
          variant="outline" 
          className="rounded-[10px] text-[#003cbb] dark:text-gray-100 font-semibold px-4 h-10 border-gray-200 dark:border-gray-700 hover:bg-[#f5f8fe] dark:hover:bg-gray-800 hover:text-[#003095] dark:hover:text-gray-100 bg-white dark:bg-gray-900 transition-colors"
          onClick={handleBack}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Mobile Header X (matching Figma) */}
      <div className="md:hidden flex items-center py-4 bg-white dark:bg-black transition-colors">
        <button onClick={handleBack} className="p-1">
          <X className="w-6 h-6 text-[#0A0D14] dark:text-gray-100" />
        </button>
      </div>

      <div className="flex justify-center w-[100%] mx-auto">
        <div className="bg-white dark:bg-gray-900 md:border md:border-[#E2E4E9] dark:md:border-gray-800 rounded-[24px] p-6 md:p-8 flex flex-col gap-8 w-full max-w-[560px] shadow-sm md:shadow-none transition-colors">
          
          <h2 className="text-[24px] font-bold text-[#0A0D14] dark:text-gray-100 tracking-tight text-center md:text-left">
            What are you looking to make payment for?
          </h2>

          <div className="flex flex-col gap-3 w-full">
            {/* Option 1: Full Session */}
            <button 
              onClick={() => setSelectedOption("full")}
              className={cn(
                "flex items-center justify-between p-4 rounded-[16px] transition-all border w-full text-left",
                selectedOption === "full" 
                  ? "bg-[#EEF3FD] dark:bg-[#003cbb]/20 border-[#003CBB] dark:border-[#4d82ff] dark:shadow-[0_0_15px_rgba(77,130,255,0.15)] scale-[1.01]" 
                  : "bg-[#F6F8FA] dark:bg-gray-950 border-transparent dark:border-transparent hover:border-[#E2E4E9] dark:hover:border-gray-800"
              )}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[18px] font-semibold text-[#0A0D14] dark:text-gray-100">Full Session Fees</span>
                <span className="text-[16px] text-[#525866] dark:text-gray-400">2025/2026 Session</span>
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                selectedOption === "full" ? "border-[#003CBB] dark:border-[#4d82ff]" : "border-[#CDD0D5] dark:border-gray-700"
              )}>
                {selectedOption === "full" && (
                  <div className="w-3 h-3 rounded-full bg-[#003CBB] dark:bg-[#4d82ff]" />
                )}
              </div>
            </button>

            {/* Option 2: 1st Semester */}
            <button 
              onClick={() => setSelectedOption("semester")}
              className={cn(
                "flex items-center justify-between p-4 rounded-[16px] transition-all border w-full text-left",
                selectedOption === "semester" 
                  ? "bg-[#EEF3FD] dark:bg-[#003cbb]/20 border-[#003CBB] dark:border-[#4d82ff] dark:shadow-[0_0_15px_rgba(77,130,255,0.15)] scale-[1.01]" 
                  : "bg-[#F6F8FA] dark:bg-gray-950 border-transparent dark:border-transparent hover:border-[#E2E4E9] dark:hover:border-gray-800"
              )}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[18px] font-semibold text-[#0A0D14] dark:text-gray-100">1st Semester Fees</span>
                <span className="text-[16px] text-[#525866] dark:text-gray-400">2025/2026 Session</span>
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                selectedOption === "semester" ? "border-[#003CBB] dark:border-[#4d82ff]" : "border-[#CDD0D5] dark:border-gray-700"
              )}>
                {selectedOption === "semester" && (
                  <div className="w-3 h-3 rounded-full bg-[#003CBB] dark:bg-[#4d82ff]" />
                )}
              </div>
            </button>
          </div>

          <Button 
            disabled={!selectedOption}
            onClick={() => router.push(`/dashboard/finance/fees/payment?type=${selectedOption}`)}
            className={cn(
              "w-full h-[52px] rounded-[12px] font-medium text-[16px] flex items-center justify-center gap-2 transition-all",
              selectedOption 
                ? "bg-[#003CBB] dark:bg-[#2563EB] text-white hover:bg-[#003CBB]/90 dark:hover:bg-[#1D4ED8]" 
                : "bg-[#E2E4E9] dark:bg-gray-800 text-[#CDD0D5] dark:text-gray-600 cursor-not-allowed"
            )}
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Info Alert */}
          <div className="bg-[#EBF1FF] dark:bg-[#1e3a8a]/10 rounded-[12px] p-4 flex gap-3 items-start border border-[#CCDAF9]/30 dark:border-[#1e3a8a]/30 transition-colors">
            <Info className="w-5 h-5 text-[#003CBB] dark:text-[#4d82ff] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-medium text-[#0A0D14] dark:text-gray-100 leading-tight">
                Please select a preferred payment method to complete your registration.
              </p>
              <p className="text-[14px] text-[#525866] dark:text-gray-400 leading-relaxed">
                Processing fees may apply depending on the gateway chosen.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
