"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaymentMethodSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPartial: () => void;
  onSelectFull: () => void;
  sessionLabel?: string;
}

export function PaymentMethodSheet({
  isOpen,
  onClose,
  onSelectPartial,
  onSelectFull,
  sessionLabel = "2025/2026 Session",
}: PaymentMethodSheetProps) {
  const [selected, setSelected] = useState<"partial" | "full">("partial");

  if (!isOpen) return null;

  const handleContinue = () => {
    if (selected === "partial") {
      onSelectPartial();
    } else {
      onSelectFull();
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[100] md:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 rounded-t-[24px] z-[101] flex flex-col pt-3 pb-8 px-4 md:hidden animate-in slide-in-from-bottom-full duration-300 transition-colors">
        {/* Handle */}
        <div className="w-10 h-1.5 bg-[#e2e4e9] dark:bg-gray-800 rounded-full mx-auto mb-6" />

        <div className="flex items-start justify-between mb-2">
          <div className="flex flex-col">
            <h2 className="text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">Make Partial Payment</h2>
            <p className="text-[14px] text-[#525866] dark:text-gray-400 transition-colors">Pay a part of the required fee a time.</p>
          </div>
          <button onClick={onClose} className="p-1">
            <X className="w-6 h-6 text-[#0a0d14] dark:text-gray-100 transition-colors" />
          </button>
        </div>

        <div className="flex flex-col gap-3 my-6">
          {/* Partial Payment Option */}
          <button
            onClick={() => setSelected("partial")}
            className={cn(
              "flex items-center justify-between p-4 rounded-[16px] border transition-all text-left",
              selected === "partial"
                ? "bg-[#eef3fd] dark:bg-[#003cbb]/20 border-[#003cbb] dark:border-[#4d82ff]"
                : "bg-white dark:bg-gray-900 border-[#e2e4e9] dark:border-gray-800"
            )}
          >
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">Partial Payment</span>
              <span className="text-[14px] text-[#525866] dark:text-gray-400 transition-colors">{sessionLabel}</span>
            </div>
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
              selected === "partial" ? "border-[#003cbb] dark:border-[#4d82ff]" : "border-[#cdd0d5] dark:border-gray-700"
            )}>
              {selected === "partial" && <div className="w-3 h-3 rounded-full bg-[#003cbb] dark:bg-[#4d82ff]" />}
            </div>
          </button>

          {/* Full Payment Option */}
          <button
            onClick={() => setSelected("full")}
            className={cn(
              "flex items-center justify-between p-4 rounded-[16px] border transition-all text-left",
              selected === "full"
                ? "bg-[#eef3fd] dark:bg-[#003cbb]/20 border-[#003cbb] dark:border-[#4d82ff]"
                : "bg-white dark:bg-gray-900 border-[#e2e4e9] dark:border-gray-800"
            )}
          >
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">Full Payment</span>
              <span className="text-[14px] text-[#525866] dark:text-gray-400 transition-colors">{sessionLabel}</span>
            </div>
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
              selected === "full" ? "border-[#003cbb] dark:border-[#4d82ff]" : "border-[#cdd0d5] dark:border-gray-700"
            )}>
              {selected === "full" && <div className="w-3 h-3 rounded-full bg-[#003cbb] dark:bg-[#4d82ff]" />}
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-12 rounded-[12px] font-medium text-[#525866] dark:text-gray-300 border-[#e2e4e9] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            className="h-12 rounded-[12px] font-medium bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002e8f] dark:hover:bg-[#1D4ED8] text-white transition-colors"
          >
            Continue
          </Button>
        </div>
      </div>
    </>
  );
}
