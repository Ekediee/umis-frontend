"use client";

import { useState, useContext } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { RegistrationContext } from "@/components/providers/registration-provider";
import { ResetProgressConfirmModal } from "@/components/registration/registration-status-modals";

interface WebStepperProps {
  currentStep?: number;
}

export function WebStepper(props: WebStepperProps) {
  const context = useContext(RegistrationContext);
  const currentStep = props.currentStep !== undefined ? props.currentStep : (context?.currentStep ?? 1);
  const router = useRouter();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const steps = [
    { id: 1, title: "Select Class Group" },
    { id: 2, title: "Select Courses" },
    { id: 3, title: "Summary" }
  ];

  return (
    <>
      <div className="hidden md:grid grid-cols-[130px_1fr_130px] items-center gap-4 w-full pt-3 pb-2 px-6 md:px-8 bg-transparent">
        {/* Left: Back Button */}
        <div className="flex justify-start">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center gap-1.5 w-[80px] h-10 rounded-xl border border-[#ccdaf9] dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-[#f8faff] dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-[#003cbb] dark:text-[#4d82ff]" />
            <span className="text-[14px] font-medium text-[#003cbb] dark:text-[#4d82ff]">Back</span>
          </button>
        </div>

        {/* Center: Centered Pills Container */}
        <div className="flex items-center justify-center gap-3 md:gap-4 min-w-0">
          {/* Session Pill */}
          <div className="bg-[#eaf0ff] dark:bg-[#003cbb]/15 rounded-2xl px-4 py-2.5 flex flex-col justify-center border border-[#ccdaf9] dark:border-[#ccdaf9]/25 shrink-0">
            <span className="text-[13px] font-bold text-[#003cbb] dark:text-[#4d82ff] leading-tight">2025/2026</span>
            <span className="text-[14px] font-medium text-[#003cbb] dark:text-[#4d82ff] leading-tight">First Semester</span>
          </div>

          {/* Stepper Pill */}
          <div className="flex items-center gap-6 bg-white dark:bg-gray-900 rounded-2xl px-6 py-3.5 border border-gray-100 dark:border-gray-800 shrink-0">
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

        {/* Right-most: Cancel Progress Button */}
        <div className="flex justify-end">
          {context?.hasProgress && (
            <button 
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors text-xs font-medium shrink-0"
              title="Cancel progress & clear selections"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel Progress</span>
            </button>
          )}
        </div>
      </div>

      <ResetProgressConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={async () => {
          await context?.resetAllSelections();
          setIsResetModalOpen(false);
        }}
        title="Cancel Course Registration Progress?"
        description="Are you sure you want to cancel your course registration progress? All your selected class groups and courses will be cleared."
      />
    </>
  );
}
