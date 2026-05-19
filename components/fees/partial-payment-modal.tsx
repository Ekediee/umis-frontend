"use client";

import { useState, useEffect, useRef } from "react";
import { X, AlertCircle } from "lucide-react";

interface PartialPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPayNow?: (amount: number) => void;
}

export function PartialPaymentModal({ isOpen, onClose, totalAmount, onPayNow: onPayNowCallback }: PartialPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) setAmount("");
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
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

  const parsedAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const isOverpaying = parsedAmount > totalAmount;
  const isValid = parsedAmount > 0;

  const handleAmountChange = (value: string) => {
    // Allow only numbers and commas
    const cleaned = value.replace(/[^0-9.]/g, "");
    setAmount(cleaned);
  };

  const handlePayNow = () => {
    if (!isValid) return;
    onClose();
    onPayNowCallback?.(parsedAmount);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  return (
    <>
      {/* Desktop Modal */}
      <div className="hidden md:block">
        <div
          ref={backdropRef}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-in fade-in duration-200"
          onClick={handleBackdropClick}
        >
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-[16px] w-full max-w-[480px] shadow-xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-0">
              <div>
                <h3 className="text-[18px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">
                  Make Partial Payment
                </h3>
                <p className="text-[14px] text-[#525866] dark:text-gray-400 mt-1 transition-colors">
                  Pay a part of the required fee a time.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
              >
                <X className="w-5 h-5 text-[#525866] dark:text-gray-400 transition-colors" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-gray-800 mx-6 my-4" />

            {/* Content */}
            <div className="px-6 pb-6">
              <p className="text-[14px] font-medium text-[#0a0d14] dark:text-gray-100 mb-3 transition-colors">
                How much do you want to pay at this time?
              </p>

              <label className="text-[13px] font-medium text-[#0a0d14] dark:text-gray-100 mb-2 block transition-colors">
                Enter amount<span className="text-red-500">*</span>
              </label>

              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-[10px] overflow-hidden focus-within:border-[#003cbb] dark:focus-within:border-[#4d82ff] focus-within:ring-1 focus-within:ring-[#003cbb]/20 transition-all">
                {/* Naira prefix */}
                <div className="flex items-center px-3 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-700 h-11 transition-colors">
                  <span className="text-[16px] font-medium text-[#0a0d14] dark:text-gray-100">₦</span>
                </div>

                {/* Input */}
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-3 text-[15px] text-[#0a0d14] dark:text-gray-100 placeholder:text-[#868c98] dark:placeholder:text-gray-500 outline-none bg-white dark:bg-gray-900 transition-colors"
                />

                {/* Currency badge */}
                <div className="flex items-center gap-1.5 px-3 bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 h-11 transition-colors">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-[#008751] flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">🇳🇬</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#0a0d14] dark:text-gray-100">NGN</span>
                </div>
              </div>
              
              {/* Overpayment Warning */}
              {isOverpaying && (
                <div className="mt-4 p-3 bg-[#fff7ed] dark:bg-[#c2410c]/10 border border-[#ffedd5] dark:border-[#c2410c]/20 rounded-[10px] flex gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <p className="text-[13px] font-semibold text-[#c2410c] dark:text-[#f97316]">
                      Amount exceeds total cost
                    </p>
                    <p className="text-[12px] text-[#9a3412] dark:text-gray-300 leading-relaxed">
                      The amount entered (₦{parsedAmount.toLocaleString()}) is greater than the total required fee of ₦{totalAmount.toLocaleString()}. Do you wish to proceed?
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-[10px] border border-gray-200 dark:border-gray-700 text-[14px] font-medium text-[#525866] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayNow}
                  disabled={!isValid}
                  className="flex-1 px-4 py-3 rounded-[10px] bg-[#003cbb] dark:bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#002d8f] dark:hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="md:hidden">
        <div
          className="fixed inset-0 bg-black/40 z-50 transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 rounded-t-[24px] z-50 flex flex-col pt-3 pb-8 px-5 animate-in slide-in-from-bottom duration-300 transition-colors">
          {/* Drag indicator */}
          <div className="w-10 h-1.5 bg-[#e2e4e9] dark:bg-gray-800 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[18px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">
                Make Partial Payment
              </h3>
              <p className="text-[14px] text-[#525866] dark:text-gray-400 mt-1 transition-colors">
                Pay a part of the required fee a time.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
            >
              <X className="w-5 h-5 text-[#525866] dark:text-gray-400 transition-colors" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-gray-800 mb-4" />

          {/* Content */}
          <p className="text-[14px] font-medium text-[#0a0d14] dark:text-gray-100 mb-3 transition-colors">
            How much do you want to pay at this time?
          </p>

          <label className="text-[13px] font-medium text-[#0a0d14] dark:text-gray-100 mb-2 block transition-colors">
            Enter amount<span className="text-red-500">*</span>
          </label>

          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-[10px] overflow-hidden focus-within:border-[#003cbb] dark:focus-within:border-[#4d82ff] focus-within:ring-1 focus-within:ring-[#003cbb]/20 transition-all">
            <div className="flex items-center px-3 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-700 h-11 transition-colors">
              <span className="text-[16px] font-medium text-[#0a0d14] dark:text-gray-100">₦</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-3 py-3 text-[15px] text-[#0a0d14] dark:text-gray-100 placeholder:text-[#868c98] dark:placeholder:text-gray-500 outline-none bg-white dark:bg-gray-900 transition-colors"
            />
            <div className="flex items-center gap-1.5 px-3 bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 h-11 transition-colors">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-[#008751] flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">🇳🇬</span>
              </div>
              <span className="text-[13px] font-medium text-[#0a0d14] dark:text-gray-100">NGN</span>
            </div>
          </div>

          {/* Overpayment Warning */}
          {isOverpaying && (
            <div className="mt-4 p-3 bg-[#fff7ed] dark:bg-[#c2410c]/10 border border-[#ffedd5] dark:border-[#c2410c]/20 rounded-[10px] flex gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-semibold text-[#c2410c] dark:text-[#f97316]">
                  Amount exceeds total cost
                </p>
                <p className="text-[12px] text-[#9a3412] dark:text-gray-300 leading-relaxed">
                  The amount entered (₦{parsedAmount.toLocaleString()}) is greater than the total required fee of ₦{totalAmount.toLocaleString()}. Do you wish to proceed?
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-[10px] border border-gray-200 dark:border-gray-700 text-[14px] font-medium text-[#525866] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayNow}
              disabled={!isValid}
              className="flex-1 px-4 py-3 rounded-[10px] bg-[#003cbb] dark:bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#002d8f] dark:hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Pay Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
