"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronRight, ChevronLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  icon: string;
  logo?: string;
  recommended?: boolean;
}

const GATEWAYS: PaymentGateway[] = [
  {
    id: "payzeep",
    name: "Payzeep",
    description: "Instant confirmation via cards, USSD or Bank Transfer",
    icon: "Z",
    logo: "/payzeep_icon.png.svg",
    recommended: true,
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    description: "Secure payment processing for all African bank cards",
    icon: "F",
    logo: "/flutterwave_symbol.svg.svg",
  },
];

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

export function FundWalletModal({ isOpen, onClose, onSuccess }: FundWalletModalProps) {
  const [step, setStep] = useState<"amount" | "gateway" | "processing" | "success">("amount");
  const [amount, setAmount] = useState("");
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("amount");
      setAmount("");
      setSelectedGateway(null);
    }
  }, [isOpen]);

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
  const isValidAmount = parsedAmount > 0;

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setAmount(cleaned);
  };

  const handleNextToGateway = () => {
    if (isValidAmount) setStep("gateway");
  };

  const handleProcessPayment = () => {
    if (!selectedGateway) return;
    setStep("processing");

    // Simulate external gateway redirect + response (2.5s delay)
    setTimeout(() => {
      setStep("success");
    }, 2500);
  };

  const handleComplete = () => {
    onSuccess(parsedAmount);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && step !== "processing") {
      onClose();
    }
  };

  return (
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-in fade-in duration-200"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-[16px] w-full max-w-[480px] shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
          
          {step === "processing" && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="relative w-[120px] h-[120px] mb-6">
                <Image
                  src="/Flame.gif"
                  alt="Processing"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <h3 className="text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 mb-2">
                Processing Payment
              </h3>
              <p className="text-[14px] text-[#525866] dark:text-gray-400">
                Please wait while we securely process your payment. Do not close this window.
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-[#10b981]" />
              </div>
              <h3 className="text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 mb-2">
                Wallet Funded Successfully!
              </h3>
              <p className="text-[14px] text-[#525866] dark:text-gray-400 mb-8">
                Your wallet has been updated with ₦{parsedAmount.toLocaleString()}.
              </p>
              <button
                onClick={handleComplete}
                className="w-full px-4 py-3 rounded-[10px] bg-[#003cbb] dark:bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#002d8f] dark:hover:bg-[#1D4ED8] transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {(step === "amount" || step === "gateway") && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-0 shrink-0">
                <div>
                  <h3 className="text-[18px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {step === "amount" ? "Fund Your Wallet" : "Select Payment Method"}
                  </h3>
                  <p className="text-[14px] text-[#525866] dark:text-gray-400 mt-1 transition-colors">
                    {step === "amount" ? "Enter the amount you wish to add to your wallet." : "Choose how you want to pay."}
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
              <div className="h-px bg-gray-200 dark:bg-gray-800 mx-6 my-4 shrink-0" />

              {/* Content */}
              <div className="px-6 pb-6 overflow-y-auto">
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

                    <div className="flex items-center gap-3 mt-6">
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-[10px] border border-gray-200 dark:border-gray-700 text-[14px] font-medium text-[#525866] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNextToGateway}
                        disabled={!isValidAmount}
                        className="flex-1 px-4 py-3 rounded-[10px] bg-[#003cbb] dark:bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#002d8f] dark:hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        Continue
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {step === "gateway" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      {GATEWAYS.map((gw) => {
                        const isSelected = selectedGateway === gw.id;
                        return (
                          <button
                            key={gw.id}
                            onClick={() => setSelectedGateway(gw.id)}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-[12px] border-2 transition-all text-left",
                              isSelected
                                ? "bg-[#eef3fd] dark:bg-[#003cbb]/20 border-[#003cbb] dark:border-[#4d82ff]"
                                : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 overflow-hidden",
                              isSelected ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-750"
                            )}>
                              {gw.logo ? (
                                <Image src={gw.logo} alt={gw.name} width={24} height={24} className="object-contain" />
                              ) : (
                                <div className={cn("w-full h-full flex items-center justify-center text-[16px] font-bold", gw.id === "payzeep" ? "bg-[#1a1a2e] text-white" : "bg-[#fff0e6] text-[#f97316]")}>
                                  {gw.icon}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[14px] font-bold text-[#0a0d14] dark:text-gray-100">{gw.name}</span>
                                {gw.recommended && <span className="px-2 py-0.5 bg-[#10b981] text-white text-[9px] font-bold rounded-[4px] uppercase">Recommended</span>}
                              </div>
                              <span className="text-[12px] text-[#525866] dark:text-gray-400 mt-0.5 block">{gw.description}</span>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                              isSelected ? "border-[#003cbb] dark:border-[#4d82ff]" : "border-[#cdd0d5] dark:border-gray-700"
                            )}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#003cbb] dark:bg-[#4d82ff]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="flex items-center justify-center gap-1.5 pb-2 pt-2">
                      <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                      <span className="text-[12px] text-[#525866] dark:text-gray-400">Secure 256-bit SSL Encrypted Payment</span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => setStep("amount")}
                        className="px-4 py-3 rounded-[10px] border border-gray-200 dark:border-gray-700 text-[14px] font-medium text-[#525866] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleProcessPayment}
                        disabled={!selectedGateway}
                        className="flex-1 px-4 py-3 rounded-[10px] bg-[#003cbb] dark:bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#002d8f] dark:hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        Pay ₦{parsedAmount.toLocaleString()} Now
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
