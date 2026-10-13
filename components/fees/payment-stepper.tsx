"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ResetProgressConfirmModal } from "@/components/registration/registration-status-modals";

export interface StepDefinition {
  id: number;
  title: string;
  fullTitle?: string;
}

interface PaymentStepperProps {
  currentStep: number;
  steps: StepDefinition[];
  sessionLabel?: string;
  typeLabel?: string;
  hasProgress?: boolean;
  onCancelProgress?: () => void;
}

export function PaymentStepper({
  currentStep,
  steps,
  sessionLabel = "2025/2026",
  typeLabel = "Full Session Registration",
  hasProgress = false,
  onCancelProgress,
}: PaymentStepperProps) {
  const router = useRouter();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  return (
    <>
      {/*
        Sized by the space the stepper actually has (container query), not the window:
        the sidebar takes 256px, so window breakpoints (xl/2xl) showed every label in a
        row too narrow for them and the centred scroller clipped both ends.
      */}
      <div className="@container hidden md:flex items-center justify-between gap-2 @[60rem]:gap-4 w-full pt-3 pb-2 px-2 md:px-4 xl:px-8 bg-transparent">
        {/* Left: Back Button */}
        <div className="flex justify-start shrink-0">
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
        <div className="flex items-center justify-center gap-2 @[60rem]:gap-3 flex-1 min-w-0">
          {/* Session Pill */}
          <div className="bg-[#e5ecfc] dark:bg-[#2b67e5]/10 rounded-2xl px-3 @[60rem]:px-4 h-[48px] @[60rem]:h-[52px] flex flex-col items-start justify-center border border-[#e2e4e9] dark:border-gray-800 min-w-[96px] max-w-[220px] shrink" title={`${sessionLabel} · ${typeLabel}`}>
            <span className="text-[11px] font-bold text-[#003cbb] dark:text-[#4d82ff] leading-tight truncate w-full">{sessionLabel}</span>
            <span className="text-[12px] @[60rem]:text-[13px] font-semibold text-[#2b67e5] dark:text-[#60a5fa] leading-tight truncate w-full">{typeLabel}</span>
          </div>

          {/* Stepper Pill */}
          <div className="flex items-center gap-1.5 @[60rem]:gap-2 bg-white dark:bg-gray-900 rounded-2xl px-3 @[60rem]:px-4 h-[48px] @[60rem]:h-[52px] border border-[#e2e4e9] dark:border-gray-800 shrink-0">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              // Display number is always positional (1, 2, 3…) regardless of skipped IDs
              const displayNumber = index + 1;

              return (
                <div key={step.id} className="flex items-center gap-1.5 @[60rem]:gap-2">
                  <div className="flex items-center gap-1.5" title={step.fullTitle || step.title}>
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-[#38c793] flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[11px] @[60rem]:text-[12px] font-semibold shrink-0",
                        isActive
                          ? "bg-[#375dfb] dark:bg-[#2563EB] text-white"
                          : "bg-white dark:bg-gray-800 border border-[#e2e4e9] dark:border-gray-700 text-[#525866] dark:text-gray-400"
                      )}>
                        {displayNumber}
                      </div>
                    )}
                    <span className={cn(
                      "text-[12px] @[60rem]:text-[13px] whitespace-nowrap",
                      isActive ? "font-semibold text-[#0a0d14] dark:text-gray-100" : "font-normal text-[#525866] dark:text-gray-400",
                      // The current step always keeps its label; the others appear once all four fit
                      !isActive && "hidden @[66rem]:inline"
                    )}>
                      <span className="@[80rem]:hidden">{step.title}</span>
                      {/* Full title once there is room for it */}
                      <span className="hidden @[80rem]:inline">{step.fullTitle || step.title}</span>
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 @[60rem]:w-4 @[60rem]:h-4 text-[#cdd0d5] dark:text-gray-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right-most: Cancel Progress Button */}
        <div className="flex justify-end shrink-0 min-w-[40px] @[52rem]:min-w-[80px]">
          {hasProgress && onCancelProgress ? (
            <button 
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              title="Cancel progress & clear selections"
              aria-label="Cancel progress"
              className="flex items-center justify-center gap-1.5 w-10 @[52rem]:w-auto @[52rem]:px-3 h-10 rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors text-xs font-medium shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {/* Icon only when space is tight */}
              <span className="hidden @[52rem]:inline">Cancel Progress</span>
            </button>
          ) : (
            <div className="w-[40px] @[52rem]:w-[80px]" />
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
