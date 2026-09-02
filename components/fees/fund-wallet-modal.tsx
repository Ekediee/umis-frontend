"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronRight, ChevronLeft, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  getPaymentRequirementsAction,
  initialisePaymentAction,
} from "@/app/actions/payment";
import type { PaymentMethod } from "@/app/actions/payment.types";

// ─── Static descriptions for known payment method codes ───────────────────────
const GATEWAY_DESCRIPTIONS: Record<string, string> = {
  FLW: "Secure payment processing for all African bank cards",
  PYZ: "Instant confirmation via cards, USSD or Bank Transfer",
  PYS: "Pay via cards, bank transfer or USSD",
};

const GATEWAY_DEFAULT_DESCRIPTION = "Fast and secure payment gateway";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FundWalletStep = "amount" | "gateway" | "success";

export interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  /**
   * When set to "success", the modal opens directly at the success screen.
   * Used when returning from the merchant's checkout page.
   */
  initialStep?: FundWalletStep;
  /**
   * Pre-fill the funded amount shown on the success screen
   * (e.g. parsed from the callback URL).
   */
  successAmount?: number;
  /** Message from the /wallet/fund API to display on the success screen. */
  successMessage?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FundWalletModal({
  isOpen,
  onClose,
  onSuccess,
  initialStep = "amount",
  successAmount,
  successMessage,
}: FundWalletModalProps) {
  const [step, setStep] = useState<FundWalletStep>(initialStep);
  const [amount, setAmount] = useState("");
  const [selectedMethodCode, setSelectedMethodCode] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [methodsError, setMethodsError] = useState<string | null>(null);
  const [isInitialisingPayment, setIsInitialisingPayment] = useState(false);
  const [initialisationError, setInitialisationError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync step when initialStep changes (e.g. parent opens modal at "success")
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      if (initialStep === "amount") {
        setAmount("");
        setSelectedMethodCode(null);
        setPaymentMethods([]);
        setMethodsError(null);
        setInitialisationError(null);
      }
    }
  }, [isOpen, initialStep]);

  // Trigger confetti celebration when opening at or transitioning to the "success" step
  useEffect(() => {
    if (isOpen && step === "success") {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, step]);

  // Prevent body scroll while modal is open
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
  const isValidAmount = parsedAmount > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setAmount(cleaned);
  };

  const handleNextToGateway = async () => {
    if (!isValidAmount) return;

    setIsLoadingMethods(true);
    setMethodsError(null);

    const result = await getPaymentRequirementsAction();

    setIsLoadingMethods(false);

    if (!result.success || !result.data) {
      setMethodsError(result.error ?? "Failed to load payment options.");
      return;
    }

    setPaymentMethods(result.data.payment_methods);
    setSelectedMethodCode(null);
    setInitialisationError(null);
    setStep("gateway");
  };

  const handlePay = async () => {
    if (!selectedMethodCode) return;

    setIsInitialisingPayment(true);
    setInitialisationError(null);

    // Build the callback URL from the actual running origin so dev (port 3000)
    // and prod both receive the correct address — the backend forwards this to
    // the merchant so it knows where to redirect after checkout.
    const redirectUrl = `${window.location.origin}/api/v1/payment/status`;

    const result = await initialisePaymentAction({
      amount: parsedAmount,
      currency: "NGN",
      payment_method: selectedMethodCode,
      wallet_payment: true,
      redirect_url: redirectUrl,
    });

    setIsInitialisingPayment(false);

    if (!result.success || !result.redirectUrl) {
      setInitialisationError(result.error ?? "Failed to start payment.");
      return;
    }

    // Redirect to merchant's checkout page (external URL)
    window.location.href = result.redirectUrl;
  };

  const handleComplete = () => {
    onSuccess(successAmount ?? parsedAmount);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !isInitialisingPayment && !isLoadingMethods) {
      onClose();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Confetti GIF celebration burst */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[60] flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full max-w-[800px] max-h-[800px] opacity-100 scale-125 md:scale-150">
            <Image
              src="/Confetti.gif"
              alt="Confetti Celebration"
              fill
              className="object-contain"
              unoptimized
              priority
            />
          </div>
        </div>
      )}

      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-in fade-in duration-200 px-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-[16px] w-full max-w-[480px] shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">

          {/* ── Success screen ────────────────────────────────────────────── */}
          {step === "success" && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-[#10b981]" />
              </div>
              <h3 className="text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 mb-2">
                Wallet Funded Successfully!
              </h3>
              <p className="text-[14px] text-[#525866] dark:text-gray-400 mb-8">
                {successMessage
                  ? successMessage
                  : successAmount && successAmount > 0
                  ? `Your wallet has been updated with ₦${successAmount.toLocaleString()}.`
                  : "Your wallet has been updated successfully."}
              </p>
              <button
                onClick={handleComplete}
                className="w-full px-4 py-3 rounded-[10px] bg-[#003cbb] dark:bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#002d8f] dark:hover:bg-[#1D4ED8] transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* ── Amount + Gateway screens ──────────────────────────────────── */}
          {(step === "amount" || step === "gateway") && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-0 shrink-0">
                <div>
                  <h3 className="text-[18px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {step === "amount" ? "Fund Your Wallet" : "Select Payment Method"}
                  </h3>
                  <p className="text-[14px] text-[#525866] dark:text-gray-400 mt-1 transition-colors">
                    {step === "amount"
                      ? "Enter the amount you wish to add to your wallet."
                      : "Choose how you want to pay."}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={isInitialisingPayment || isLoadingMethods}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5 text-[#525866] dark:text-gray-400 transition-colors" />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-200 dark:bg-gray-800 mx-6 my-4 shrink-0" />

              {/* Content */}
              <div className="px-6 pb-6 overflow-y-auto">

                {/* ── Step: amount ─────────────────────────────────────────── */}
                {step === "amount" && (
                  <div className="flex flex-col">
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

                    {/* Inline error from payment requirements fetch */}
                    {methodsError && (
                      <p className="mt-3 text-[13px] text-red-500 dark:text-red-400">{methodsError}</p>
                    )}

                    <div className="flex items-center gap-3 mt-6">
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-[10px] border border-gray-200 dark:border-gray-700 text-[14px] font-medium text-[#525866] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNextToGateway}
                        disabled={!isValidAmount || isLoadingMethods}
                        className="flex-1 px-4 py-3 rounded-[10px] bg-[#003cbb] dark:bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#002d8f] dark:hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoadingMethods ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading…
                          </>
                        ) : (
                          <>
                            Continue
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step: gateway ────────────────────────────────────────── */}
                {step === "gateway" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      {paymentMethods.map((method, index) => {
                        const isSelected = selectedMethodCode === method.code;
                        const description =
                          GATEWAY_DESCRIPTIONS[method.code] ?? GATEWAY_DEFAULT_DESCRIPTION;
                        const isFirst = index === 0;

                        return (
                          <button
                            key={method.code}
                            onClick={() => setSelectedMethodCode(method.code)}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-[12px] border-2 transition-all text-left",
                              isSelected
                                ? "bg-[#eef3fd] dark:bg-[#003cbb]/20 border-[#003cbb] dark:border-[#4d82ff]"
                                : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                            )}
                          >
                            {/* Logo / fallback icon */}
                            <div
                              className={cn(
                                "w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 overflow-hidden",
                                isSelected
                                  ? "bg-white dark:bg-gray-950"
                                  : "bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                              )}
                            >
                              {method.image ? (
                                <Image
                                  src={method.image}
                                  alt={method.provider_name}
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                />
                              ) : (
                                <span className="text-[15px] font-bold text-gray-500 dark:text-gray-400">
                                  {method.provider_name.charAt(0)}
                                </span>
                              )}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[14px] font-bold text-[#0a0d14] dark:text-gray-100">
                                  {method.provider_name}
                                </span>
                                {isFirst && (
                                  <span className="px-2 py-0.5 bg-[#10b981] text-white text-[9px] font-bold rounded-[4px] uppercase">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <span className="text-[12px] text-[#525866] dark:text-gray-400 mt-0.5 block">
                                {description}
                              </span>
                            </div>

                            {/* Radio indicator */}
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                isSelected
                                  ? "border-[#003cbb] dark:border-[#4d82ff]"
                                  : "border-[#cdd0d5] dark:border-gray-700"
                              )}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#003cbb] dark:bg-[#4d82ff]" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* SSL badge */}
                    <div className="flex items-center justify-center gap-1.5 pb-2 pt-2">
                      <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                      <span className="text-[12px] text-[#525866] dark:text-gray-400">
                        Secure 256-bit SSL Encrypted Payment
                      </span>
                    </div>

                    {/* Inline error from payment initialisation */}
                    {initialisationError && (
                      <p className="text-[13px] text-red-500 dark:text-red-400 text-center -mt-1">
                        {initialisationError}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => setStep("amount")}
                        disabled={isInitialisingPayment}
                        className="px-4 py-3 rounded-[10px] border border-gray-200 dark:border-gray-700 text-[14px] font-medium text-[#525866] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handlePay}
                        disabled={!selectedMethodCode || isInitialisingPayment}
                        className="flex-1 px-4 py-3 rounded-[10px] bg-[#003cbb] dark:bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#002d8f] dark:hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isInitialisingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Redirecting…
                          </>
                        ) : (
                          `Pay ₦${parsedAmount.toLocaleString()} Now`
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
