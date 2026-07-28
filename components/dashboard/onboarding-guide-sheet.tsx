"use client";

import { useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { OnboardingGuideCard } from "./onboarding-guide-card";

interface OnboardingGuideSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingGuideSheet({ isOpen, onClose }: OnboardingGuideSheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Side Sheet Panel */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 h-full shadow-2xl z-10 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#003cbb] dark:text-[#4d82ff]" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">
              Registration Guide & Checklist
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close guide sheet"
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          <OnboardingGuideCard isSheet={true} className="shadow-none border-none bg-transparent p-0" />
        </div>
      </div>
    </div>
  );
}
