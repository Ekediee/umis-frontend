"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinancialConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName?: string;
  isLoading?: boolean;
}

const formatToTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function FinancialConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  studentName = "Yakubu Onome Joy",
  isLoading = false,
}: FinancialConfirmationModalProps) {
  const [isAgreed, setIsAgreed] = useState(false);
  const [currentDateString, setCurrentDateString] = useState("");

  // Set formatted current date on mount / open
  useEffect(() => {
    if (isOpen) {
      setIsAgreed(false);
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        month: "long",
        day: "numeric",
        year: "numeric",
      };
      setCurrentDateString(now.toLocaleDateString("en-US", options));
    }
  }, [isOpen]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Responsive Container: Desktop Dialog / Mobile Bottom Sheet */}
      <div className="w-full max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:rounded-t-[24px] max-md:pb-safe bg-white dark:bg-gray-900 md:max-w-[480px] md:rounded-[20px] shadow-[0px_16px_32px_-12px_rgba(88,92,95,0.15)] flex flex-col relative z-10 animate-in slide-in-from-bottom duration-300 md:animate-in md:zoom-in-95 overflow-hidden transition-colors">

        {/* Mobile Drag Handle Bar & Close */}
        <div className="md:hidden w-full relative pt-3 pb-1 flex justify-center items-center">
          <div className="w-[60px] h-[5px] bg-[#e5e7eb] dark:bg-gray-800 rounded-full" />
          <button
            onClick={onClose}
            className="absolute right-4 top-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex flex-col gap-4">

          {/* Header Icon & Title */}
          <div className="flex flex-col items-center gap-3.5">
            <div className="w-11 h-11 rounded-[14px] bg-[#fff7ed] dark:bg-[#f97316]/15 flex items-center justify-center shrink-0 border border-[#ffedd5] dark:border-[#f97316]/30">
              <Lock className="w-5 h-5 text-[#f97316] dark:text-[#fb923c]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="font-bold text-[18px] md:text-[20px] leading-tight text-[#0a0d14] dark:text-gray-100">
                Confirm Financial Registration
              </h3>
              <p className="text-[13px] text-[#525866] text-center dark:text-gray-400 leading-relaxed">
                Please review carefully. Once submitted, your selection cannot be changed and is locked permanently.
              </p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-[#fffbeb] dark:bg-[#78350f]/25 border border-[#fef3c7] dark:border-[#78350f]/40 rounded-[14px] p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#d97706] dark:text-[#fbbf24] shrink-0 mt-0.5" />
            <span className="text-[12px] text-[#92400e] dark:text-[#fde68a] leading-normal font-medium">
              After submission, your hall residence, worship center, and fee structure will be permanently recorded.
            </span>
          </div>

          {/* Interactive Agreement Checkbox */}
          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="financial-agreement-checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#003cbb] focus:ring-[#003cbb] dark:border-gray-700 dark:bg-gray-800 dark:checked:bg-[#4d82ff] cursor-pointer"
            />
            <label
              htmlFor="financial-agreement-checkbox"
              className="text-[13px] font-medium text-[#0a0d14] dark:text-gray-200 leading-snug cursor-pointer select-none"
            >
              I agree and acknowledge that my selection cannot be changed after submission.
            </label>
          </div>

          {/* Dynamic Cursive Digital Signature & Timestamp */}
          {isAgreed && (
            <div className="bg-[#f8faff] dark:bg-gray-800/60 border border-[#dbe5ff] dark:border-gray-700/80 rounded-[12px] p-3 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Load Cursive Fonts */}
              <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Ms+Madi&display=swap"
              />
              <span className="text-[10px] font-bold text-[#868c98] dark:text-gray-400 uppercase tracking-wider">
                Digital Signature
              </span>
              <div className="flex flex-col items-start gap-1 w-full mt-1">
                <span
                  className="text-[34px] text-[#003cbb] dark:text-[#4d82ff] tracking-wide leading-none py-1 whitespace-nowrap overflow-hidden text-ellipsis w-full"
                  style={{ fontFamily: "'Ms Madi', cursive" }}
                >
                  {formatToTitleCase(studentName)}
                </span>
                <span className="text-[11px] text-[#525866] dark:text-gray-400 font-medium whitespace-nowrap">
                  Signed on {currentDateString}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="border-t border-[#e2e4e9] dark:border-gray-800 p-4 md:px-6 bg-[#f8fafc] dark:bg-gray-900/50 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 md:flex-none rounded-[10px] h-[42px] px-5 border-[#e2e4e9] dark:border-gray-700 text-[#525866] dark:text-gray-300 font-medium"
          >
            Cancel
          </Button>

          <Button
            onClick={onConfirm}
            disabled={!isAgreed || isLoading}
            className="flex-1 md:flex-none rounded-[10px] h-[42px] px-6 bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002e8f] dark:hover:bg-[#1D4ED8] text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </div>

      </div>
    </div>
  );
}
