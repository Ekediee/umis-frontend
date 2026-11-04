"use client";

import { ArrowLeftRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepDefinition } from "@/components/fees/payment-stepper";

interface PaymentProgressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  steps: StepDefinition[];
  onStepClick?: (stepId: number) => void;
  /** e.g. "2026/2027 · 1st Semester Registration" */
  typeLabel?: string;
  /** Reopens the registration-type choice; leave out once registration is locked */
  onChangeType?: () => void;
}

export function PaymentProgressSheet({
  isOpen,
  onClose,
  currentStep,
  steps,
  onStepClick,
  typeLabel,
  onChangeType,
}: PaymentProgressSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-[#f8f9fb] dark:bg-gray-900 border-t dark:border-gray-800 rounded-t-[24px] z-50 flex flex-col pt-3 pb-8 px-4 md:hidden animate-in slide-in-from-bottom-full duration-300 transition-colors">
        <div className="w-10 h-1.5 bg-[#e2e4e9] dark:bg-gray-800 rounded-full mx-auto mb-6" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">Make Payment</h2>
        </div>

        {typeLabel && (
          <div className="flex items-center justify-between gap-3 mb-6 p-4 rounded-[12px] bg-[#eef3fd] dark:bg-[#003cbb]/10">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#525866] dark:text-gray-400">Registration type</p>
              <p className="text-[15px] font-semibold text-[#0a0d14] dark:text-gray-100 leading-snug">{typeLabel}</p>
            </div>
            {onChangeType && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onChangeType();
                }}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] border border-[#ccdaf9] dark:border-blue-900/60 bg-white dark:bg-gray-900 text-[13px] font-semibold text-[#003cbb] dark:text-[#4d82ff] hover:bg-[#f5f8fe] dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden />
                Change
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-[13px] font-bold text-[#003cbb] dark:text-[#4d82ff] mb-1 transition-colors">Steps</h3>
          <div className="flex flex-col gap-2">
            {steps.map((step, index) => {
              const isCompleted = currentStep >= step.id;
              const displayNumber = index + 1;

              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => {
                    if (onStepClick) {
                      onStepClick(step.id);
                      onClose();
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-[12px] transition-colors w-full text-left",
                    isCompleted ? "bg-[#eef3fd] dark:bg-[#003cbb]/10" : "bg-transparent",
                    onStepClick && "cursor-pointer hover:bg-[#e5ecfc] dark:hover:bg-[#003cbb]/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                      isCompleted
                        ? "bg-[#003cbb] dark:bg-[#4d82ff] text-white"
                        : "bg-[#e2e4e9] dark:bg-gray-800 text-[#525866] dark:text-gray-400"
                    )}>
                      {displayNumber}
                    </span>
                    <span className="text-[15px] font-medium text-[#4e5155] dark:text-gray-300 transition-colors">
                      {step.title}
                    </span>
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10b981] fill-white dark:fill-gray-900 transition-colors" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#cdd0d5] dark:text-gray-700 transition-colors" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
