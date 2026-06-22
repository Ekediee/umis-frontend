"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { useContext } from "react";
import { RegistrationContext } from "@/components/providers/registration-provider";

interface WebStepperProps {
  currentStep?: number;
}

export function WebStepper(props: WebStepperProps) {
  const context = useContext(RegistrationContext);
  const currentStep = props.currentStep !== undefined ? props.currentStep : (context?.currentStep ?? 1);
  const router = useRouter();

  const steps = [
    { id: 1, title: "Select Class Group" },
    { id: 2, title: "Select Courses" },
    { id: 3, title: "Select Worship Center" },
    { id: 4, title: "Summary" }
  ];

  return (
    <div className="hidden md:flex items-center justify-between w-full pt-3 pb-2 px-8 bg-transparent">
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="flex items-center justify-center gap-1.5 w-[80px] h-10 rounded-xl border border-[#ccdaf9] dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-[#f8faff] dark:hover:bg-gray-800 transition-colors shrink-0"
      >
        <ChevronLeft className="w-4 h-4 text-[#003cbb] dark:text-[#4d82ff]" />
        <span className="text-[14px] font-medium text-[#003cbb] dark:text-[#4d82ff]">Back</span>
      </button>

      {/* Center Content: Session Pill + Stepper */}
      <div className="flex items-center gap-4">
        {/* Session Pill */}
        <div className="bg-[#eaf0ff] dark:bg-[#003cbb]/15 rounded-2xl px-4 py-2.5 flex flex-col justify-center border border-[#ccdaf9] dark:border-[#ccdaf9]/25">
          <span className="text-[13px] font-bold text-[#003cbb] dark:text-[#4d82ff] leading-tight">2025/2026</span>
          <span className="text-[14px] font-medium text-[#003cbb] dark:text-[#4d82ff] leading-tight">First Semester</span>
        </div>

        {/* Stepper Pill */}
        <div className="flex items-center gap-6 bg-white dark:bg-gray-900 rounded-2xl px-6 py-3.5 border border-gray-100 dark:border-gray-800">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-colors",
                    isActive ? "bg-[#003cbb] dark:bg-[#4d82ff] text-white dark:text-gray-900" : 
                    isCompleted ? "bg-[#003cbb] dark:bg-[#4d82ff]/80 text-white dark:text-gray-900" : 
                    "bg-[#f6f8fa] dark:bg-gray-800 text-[#525866] dark:text-gray-400"
                  )}>
                    {step.id}
                  </div>
                  <span className={cn(
                    "text-[14px] font-medium",
                    isActive ? "text-[#0a0d14] dark:text-gray-100" : "text-[#525866] dark:text-gray-400"
                  )}>
                    {step.title}
                  </span>
                </div>
                
                {/* Separator */}
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-[#cdd0d5] dark:text-gray-650" />
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
