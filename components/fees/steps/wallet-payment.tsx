"use client";

import { Wallet, Info, ShieldCheck, ChevronRight, AlertCircle, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function formatPrice(price: number): string {
  return `₦${price.toLocaleString()}`;
}

interface WalletPaymentProps {
  walletBalance: number;
  totalAmount: number;
  studentName?: string;
  academicInfo?: string;
  onCancelPayment: () => void;
  onPayNow: () => void;
  onFundWallet: () => void;
}

export function WalletPayment({
  walletBalance,
  totalAmount,
  studentName = "Yakubu Onome Joy",
  academicInfo = "Academic Year 2024/2025 - First Semester 200L",
  onCancelPayment,
  onPayNow,
  onFundWallet,
}: WalletPaymentProps) {
  const isSufficient = walletBalance >= totalAmount;
  const shortfall = isSufficient ? 0 : totalAmount - walletBalance;

  return (
    <div className="w-full max-w-[700px] md:h-[90%] h-[78vh] flex flex-col gap-5">
      {/* Billing Banner */}
      <div className="bg-gradient-to-r from-[#0a1e6e] to-[#1a3cc0] rounded-[16px] p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
            Student Billing Details
          </span>
          <span className="text-[20px] md:text-[24px] font-bold text-white leading-tight">
            {studentName}
          </span>
          <span className="text-[13px] text-white/70">
            {academicInfo}
          </span>
        </div>

        <div className="flex flex-col md:items-end gap-0.5">
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
            Total Amount Due
          </span>
          <span className="text-[28px] md:text-[36px] font-bold text-white tracking-tight leading-tight">
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>

      {/* Info Alert */}
      <div className="flex items-start gap-3 bg-[#eef3fd] dark:bg-[#1e3a8a]/10 rounded-[12px] p-4 shrink-0">
        <div className="w-5 h-5 rounded-full bg-[#003cbb] dark:bg-[#4d82ff] flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-3 h-3 text-white" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-semibold text-[#0a0d14] dark:text-gray-100">
            Pay with your Student Wallet
          </span>
          <span className="text-[13px] text-[#525866] dark:text-gray-400">
            Ensure your wallet has sufficient funds to complete this transaction.
          </span>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="flex flex-col gap-2 shrink-0">
        <h3 className="text-[18px] font-bold text-[#0a0d14] dark:text-gray-100">
          Your Wallet
        </h3>
        
        <div className={cn(
          "flex flex-col gap-4 p-5 rounded-[16px] border-2 transition-all mt-1",
          isSufficient 
            ? "bg-[#eef3fd] dark:bg-[#003cbb]/20 border-[#003cbb] dark:border-[#4d82ff]" 
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0",
                isSufficient ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-800"
              )}>
                <Wallet className={cn("w-6 h-6", isSufficient ? "text-[#003cbb]" : "text-[#525866]")} />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] text-[#525866] dark:text-gray-400 font-medium">Available Balance</span>
                <span className="text-[20px] font-bold text-[#0a0d14] dark:text-gray-100">{formatPrice(walletBalance)}</span>
              </div>
            </div>

            {/* If sufficient, show a checkmark or indicator */}
            {isSufficient && (
              <div className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] text-[12px] font-bold rounded-full flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Sufficient Funds
              </div>
            )}
          </div>

          {!isSufficient && (
            <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#c2410c] dark:text-[#f97316] leading-relaxed">
                  Insufficient funds. You need an additional <strong>{formatPrice(shortfall)}</strong> to complete this payment.
                </p>
              </div>
              <button
                onClick={onFundWallet}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f8faff] dark:bg-[#1e3a8a]/20 text-[#003cbb] dark:text-[#4d82ff] font-medium text-[14px] rounded-[8px] hover:bg-[#eef3fd] dark:hover:bg-[#1e3a8a]/40 transition-colors w-max"
              >
                <PlusCircle className="w-4 h-4" />
                Fund Wallet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between mt-auto pt-4 shrink-0">
        <button
          onClick={onCancelPayment}
          className="text-[14px] font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
        >
          Cancel Payment
        </button>

        <button
          onClick={onPayNow}
          disabled={!isSufficient}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-[10px] text-[14px] font-medium transition-all",
            isSufficient
              ? "bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002e8f] dark:hover:bg-[#1D4ED8] text-white shadow-sm"
              : "bg-[#e2e4e9] dark:bg-gray-800 text-[#868c98] dark:text-gray-600 cursor-not-allowed"
          )}
        >
          Pay {formatPrice(totalAmount)} Now
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* SSL Notice */}
      <div className="flex items-center justify-center gap-1.5 pb-4 shrink-0">
        <ShieldCheck className="w-4 h-4 text-[#10b981]" />
        <span className="text-[12px] text-[#525866] dark:text-gray-400 transition-colors">
          Secure 256-bit SSL Encrypted Payment
        </span>
      </div>
    </div>
  );
}
