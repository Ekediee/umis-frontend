"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomActionBarProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  className?: string;
}

export function BottomActionBar({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  nextLabel = "Proceed",
  isNextDisabled = false,
  className
}: BottomActionBarProps) {
  return (
    <div className={cn("fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-100 p-4 md:px-8 md:py-6 z-40", className)}>
      <div className="flex items-center justify-between max-w-[1200px] mx-auto">
        {/* Previous Button */}
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentStep === 1}
          className={cn(
            "rounded-[10px] h-11 px-4 md:px-6 text-[14px] font-medium transition-all gap-2",
            currentStep === 1 ? "opacity-50 cursor-not-allowed bg-[#f6f8fa] text-[#cdd0d5] border-[#f6f8fa]" : "bg-[#f6f8fa] text-[#525866] border-transparent hover:border-gray-200"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline-block">Previous</span>
        </Button>

        {/* Next Button */}
        <Button
          onClick={onNext}
          disabled={isNextDisabled}
          className="rounded-[10px] h-11 px-6 md:px-8 text-[14px] font-medium bg-[#003cbb] hover:bg-[#002e8f] text-white shadow-sm gap-2 transition-all"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
