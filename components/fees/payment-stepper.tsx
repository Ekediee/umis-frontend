"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ResetProgressConfirmModal } from "@/components/registration/registration-status-modals";

interface PaymentStepperProps {
  currentStep: number;
  sessionLabel?: string;
  typeLabel?: string;
  hasProgress?: boolean;
  onCancelProgress?: () => void;
}

const steps = [
  { id: 1, title: "Select Residence" },
  { id: 2, title: "Select Worship Center" },
  { id: 3, title: "Select Meal Plan" },
  { id: 4, title: "Summary" }
];

export function PaymentStepper({ 
  currentStep, 
  sessionLabel = "2025/2026", 
  typeLabel = "Full Session Registration",
  hasProgress = false,
  onCancelProgress,
}: PaymentStepperProps) {
  const router = useRouter();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
          <div className="bg-[#e5ecfc] dark:bg-[#2b67e5]/10 rounded-2xl px-4 py-2.5 flex flex-col items-start justify-center border border-[#e2e4e9] dark:border-gray-800 shrink-0 max-w-[220px]">
            <span className="text-[11px] font-bold text-[#003cbb] dark:text-[#4d82ff] leading-tight">{sessionLabel}</span>
            <span className="text-[13px] font-semibold text-[#2b67e5] dark:text-[#60a5fa] leading-tight truncate w-full">{typeLabel}</span>
          </div>

          {/* Stepper Pill */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-3.5 border border-[#e2e4e9] dark:border-gray-800">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Step Circle */}
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-[#38c793] flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0",
                        isActive
                          ? "bg-[#375dfb] dark:bg-[#2563EB] text-white"
                          : "bg-white dark:bg-gray-800 border border-[#e2e4e9] dark:border-gray-700 text-[#525866] dark:text-gray-400"
                      )}>
                        {step.id}
                      </div>
                    )}
                    
                    {/* Step Label */}
                    <span className={cn(
                      "text-[13.5px] whitespace-nowrap",
                      isActive ? "font-semibold text-[#0a0d14] dark:text-gray-100" : "font-normal text-[#525866] dark:text-gray-400"
                    )}>
                      {step.title}
                    </span>
                  </div>

                  {/* Separator */}
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-[#cdd0d5] dark:text-gray-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right-most: Cancel Progress Button */}
        <div className="flex justify-end">
          {hasProgress && onCancelProgress && (
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

      {hasProgress && onCancelProgress && (
        <ResetProgressConfirmModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={async () => {
            await onCancelProgress();
            setIsResetModalOpen(false);
          }}
          title="Cancel Financial Registration Progress?"
          description="Are you sure you want to cancel your financial registration progress? All your selected residence, worship center, meal plan, and custom amounts will be cleared."
        />
      )}
    </>
  );
}
