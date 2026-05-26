"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentProgressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
}

export function PaymentProgressSheet({ isOpen, onClose, currentStep }: PaymentProgressSheetProps) {
  if (!isOpen) return null;

  const steps = [
    { id: 1, title: "Select Residence" },
    { id: 2, title: "Select Meal Plan" },
    { id: 3, title: "Select Worship Center" },
    { id: 4, title: "Summary" },
    { id: 5, title: "Payment Gateway" }
  ];

  return (
    <>
      {/* Backdrop — click to dismiss */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#f8f9fb] dark:bg-gray-900 border-t dark:border-gray-800 rounded-t-[24px] z-50 flex flex-col pt-3 pb-8 px-4 md:hidden animate-in slide-in-from-bottom-full duration-300 transition-colors">
        {/* Handle */}
        <div className="w-10 h-1.5 bg-[#e2e4e9] dark:bg-gray-800 rounded-full mx-auto mb-6" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">Make Payment</h2>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-[13px] font-bold text-[#003cbb] dark:text-[#4d82ff] mb-1 transition-colors">Steps</h3>

          <div className="flex flex-col gap-2">
            {steps.map((step) => {
              const isCompleted = currentStep >= step.id;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-[12px] transition-colors",
                    isCompleted ? "bg-[#eef3fd] dark:bg-[#003cbb]/10" : "bg-transparent"
                  )}
                >
                  <span className="text-[15px] font-medium text-[#4e5155] dark:text-gray-300 transition-colors">
                    {step.title}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10b981] fill-white dark:fill-gray-900 transition-colors" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#cdd0d5] dark:text-gray-700 transition-colors" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
