"use client";

import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface PaymentStepperProps {
  currentStep: number;
  sessionLabel?: string;
  typeLabel?: string;
}

const steps = [
  { id: 1, title: "Select Residence" },
  { id: 2, title: "Select Meal Plan" },
  { id: 3, title: "Select Worship Center" },
  { id: 4, title: "Summary" },
  { id: 5, title: "Payment Gateway" }
];

export function PaymentStepper({ 
  currentStep, 
  sessionLabel = "2025/2026", 
  typeLabel = "Full Session Fees" 
}: PaymentStepperProps) {
  const router = useRouter();

  return (
    <div className="hidden md:flex flex-col md:flex-row gap-4 w-full pt-2 pb-4 px-8 bg-transparent">
      <div> 
        {/* Back Button + Session Pill + Stepper Row */}
        <div className="flex items-center justify-between w-full">
        {/* Back Button */}
          <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-[8px] border border-[#ccdaf9] bg-white hover:bg-[#f8faff] transition-colors shrink-0 shadow-[0px_1px_2px_0px_rgba(55,93,251,0.08)]"
            >
              <ChevronLeft className="w-5 h-5 text-[#003cbb]" />
              <span className="text-[14px] font-medium text-[#003cbb]">Back</span>
          </button>
        </div>
      </div>

      <div className="hidden md:flex justify-center md:flex-row flex-col gap-4 w-full pt-6 md:pt-0 pb-4 px-8 bg-transparent">

        {/* Session Pill */}
        <div className="bg-[#e5ecfc] rounded-[22px] px-6 py-3 flex flex-col items-start justify-center border-b border-[#e2e4e9] shrink-0">
          <span className="text-[14px] font-medium text-[#003cbb] leading-tight">{sessionLabel}</span>
          <span className="text-[14px] font-semibold text-[#2b67e5] leading-tight">{typeLabel}</span>
        </div>

        {/* Stepper Pill */}
        <div className="flex items-center gap-2 bg-white rounded-[22px] px-6 py-4 border-b border-[#e2e4e9]">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {/* Step Circle */}
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-[#38c793] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-medium shrink-0",
                      isActive
                        ? "bg-[#375dfb] text-white"
                        : "bg-white border border-[#e2e4e9] text-[#525866]"
                    )}>
                      {step.id}
                    </div>
                  )}
                  
                  {/* Step Label */}
                  <span className={cn(
                    "text-[14px] whitespace-nowrap",
                    isActive ? "font-medium text-[#0a0d14]" : "font-normal text-[#525866]"
                  )}>
                    {step.title}
                  </span>
                </div>

                {/* Separator */}
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-[#cdd0d5] shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
