"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useContext } from "react";
import { RegistrationContext } from "@/components/providers/registration-provider";

interface BottomActionBarProps {
  currentStep?: number;
  totalSteps?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  className?: string;
}

export function BottomActionBar(props: BottomActionBarProps) {
  const context = useContext(RegistrationContext);

  const currentStep = props.currentStep !== undefined ? props.currentStep : (context?.currentStep ?? 1);
  const totalSteps = props.totalSteps !== undefined ? props.totalSteps : (context?.totalSteps ?? 1);
  const onPrevious = props.onPrevious !== undefined ? props.onPrevious : (context?.handlePrevious ?? (() => {}));
  const onNext = props.onNext !== undefined ? props.onNext : (context?.handleNext ?? (() => {}));
  const nextLabel = props.nextLabel !== undefined ? props.nextLabel : (context?.nextLabel ?? "Next");
  const isNextDisabled = props.isNextDisabled !== undefined ? props.isNextDisabled : (context?.isNextDisabled ?? false);
  const className = props.className;
  return (
    <div className={cn("fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 md:px-8 md:py-6 z-40", className)}>
      <div className="flex items-center justify-between max-w-[1200px] mx-auto">
        {/* Previous Button */}
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentStep === 1}
          className={cn(
            "rounded-[10px] h-11 px-4 md:px-6 text-[14px] font-medium transition-all gap-2",
            currentStep === 1 ? "opacity-50 cursor-not-allowed bg-[#f6f8fa] dark:bg-gray-800 text-[#cdd0d5] dark:text-gray-600 border-[#f6f8fa] dark:border-gray-800" : "bg-[#f6f8fa] dark:bg-gray-800 text-[#525866] dark:text-gray-300 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline-block">Previous</span>
        </Button>

        {/* Next Button */}
        <Button
          onClick={onNext}
          disabled={isNextDisabled}
          className="rounded-[10px] h-11 px-6 md:px-8 text-[14px] font-medium bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002e8f] dark:hover:bg-[#1D4ED8] text-white shadow-sm gap-2 transition-all"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
