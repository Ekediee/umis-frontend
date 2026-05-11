"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface WebStepperProps {
  currentStep: number;
}

export function WebStepper({ currentStep }: WebStepperProps) {
  const router = useRouter();

  const steps = [
    { id: 1, title: "Select Class Group" },
    { id: 2, title: "Select Courses" },
    { id: 3, title: "Summary" }
  ];

  return (
    <div className="hidden md:flex items-center justify-between w-full pt-8 pb-6 px-8 bg-transparent">
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="flex items-center justify-center gap-1.5 w-[80px] h-10 rounded-xl border border-[#ccdaf9] bg-white hover:bg-[#f8faff] transition-colors shrink-0"
      >
        <ChevronLeft className="w-4 h-4 text-[#003cbb]" />
        <span className="text-[14px] font-medium text-[#003cbb]">Back</span>
      </button>

      {/* Center Content: Session Pill + Stepper */}
      <div className="flex items-center gap-4">
        {/* Session Pill */}
        <div className="bg-[#eaf0ff] rounded-2xl px-4 py-2.5 flex flex-col justify-center border border-[#ccdaf9]">
          <span className="text-[13px] font-bold text-[#003cbb] leading-tight">2025/2026</span>
          <span className="text-[14px] font-medium text-[#003cbb] leading-tight">First Semester</span>
        </div>

        {/* Stepper Pill */}
        <div className="flex items-center gap-6 bg-white rounded-full px-6 py-3.5 border border-gray-100">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-colors",
                    isActive ? "bg-[#003cbb] text-white" : 
                    isCompleted ? "bg-[#003cbb] text-white" : 
                    "bg-[#f6f8fa] text-[#525866]"
                  )}>
                    {step.id}
                  </div>
                  <span className={cn(
                    "text-[14px] font-medium",
                    isActive ? "text-[#0a0d14]" : "text-[#525866]"
                  )}>
                    {step.title}
                  </span>
                </div>
                
                {/* Separator */}
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-[#cdd0d5]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Empty div for flex balance to perfectly center the middle content */}
      <div className="w-[80px] shrink-0" /> 
    </div>
  );
}
