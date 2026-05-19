"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface MobileFlowHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  onProgressClick?: () => void;
}

export function MobileFlowHeader({ currentStep, totalSteps, title, onProgressClick }: MobileFlowHeaderProps) {
  const router = useRouter();
  
  // Calculate dash array for circle progress
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progress = currentStep / totalSteps;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-[#0a0d14] dark:text-gray-100" />
        </button>
        <h2 className="text-[18px] font-medium text-[#0a0d14] dark:text-gray-100 tracking-tight">{title}</h2>
      </div>

      <div 
        onClick={onProgressClick}
        className="relative flex items-center justify-center w-10 h-10 bg-[#eef3fd] dark:bg-[#003cbb]/15 rounded-full shrink-0 cursor-pointer hover:bg-[#e4ebfa] dark:hover:bg-[#003cbb]/25 transition-colors"
      >
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="transparent"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-[#003cbb] dark:text-[#4d82ff] transition-all duration-300 ease-in-out"
          />
        </svg>
        <div className="flex items-baseline gap-[1px] relative z-10">
          <span className="text-[11px] font-bold text-[#0a0d14] dark:text-gray-100">{currentStep}</span>
          <span className="text-[9px] font-medium text-[#525866] dark:text-gray-400">/{totalSteps}</span>
        </div>
      </div>
    </div>
  );
}
