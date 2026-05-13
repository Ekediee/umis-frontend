"use client";

import { useState } from "react";
import { Info, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Gateway data — structured for future API integration
export interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  icon: string; // Text-based icon fallback
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

function formatPrice(price: number): string {
  return `₦${price.toLocaleString()}`;
}

interface SelectGatewayProps {
  selectedGateway: string | null;
  onSelect: (id: string) => void;
  totalAmount: number;
  studentName?: string;
  academicInfo?: string;
  onCancelPayment: () => void;
  onPayNow: () => void;
}

export function SelectGateway({
  selectedGateway,
  onSelect,
  totalAmount,
  studentName = "Yakubu Onome Joy",
  academicInfo = "Academic Year 2024/2025 - First Semester 200L",
  onCancelPayment,
  onPayNow,
}: SelectGatewayProps) {
  return (
    <div className="w-full max-w-[700px] md:h-[90%] h-[78vh] flex flex-col gap-5">
      {/* Billing Banner */}
      <div className="bg-gradient-to-r from-[#0a1e6e] to-[#1a3cc0] rounded-[16px] p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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
      <div className="flex items-start gap-3 bg-[#eef3fd] rounded-[12px] p-4">
        <div className="w-5 h-5 rounded-full bg-[#003cbb] flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-3 h-3 text-white" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-semibold text-[#0a0d14]">
            Please select a preferred payment method to complete your registration.
          </span>
          <span className="text-[13px] text-[#525866]">
            Processing fees may apply depending on the gateway chosen.
          </span>
        </div>
      </div>

      {/* Gateway Selection */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-bold text-[#0a0d14]">
          Select Payment Method
        </h3>

        <div className="flex flex-col gap-3 mt-1">
          {GATEWAYS.map((gw) => {
            const isSelected = selectedGateway === gw.id;
            return (
              <button
                key={gw.id}
                onClick={() => onSelect(gw.id)}
                className={cn(
                  "flex items-center gap-4 p-4 md:p-5 rounded-[16px] border-2 transition-all text-left",
                  isSelected
                    ? "bg-[#eef3fd] border-[#003cbb]"
                    : "bg-white border-gray-100 hover:border-gray-200"
                )}
              >
                {/* Gateway Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden",
                  isSelected ? "bg-white" : "bg-gray-50 border border-gray-100"
                )}>
                  {gw.logo ? (
                    <Image 
                      src={gw.logo} 
                      alt={gw.name} 
                      width={32} 
                      height={32} 
                      className="object-contain"
                    />
                  ) : (
                    <div className={cn(
                      "w-full h-full flex items-center justify-center text-[20px] font-bold",
                      gw.id === "payzeep" ? "bg-[#1a1a2e] text-white" : "bg-[#fff0e6] text-[#f97316]"
                    )}>
                      {gw.icon}
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-bold text-[#0a0d14]">
                      {gw.name}
                    </span>
                    {gw.recommended && (
                      <span className="px-2 py-0.5 bg-[#10b981] text-white text-[10px] font-bold rounded-[6px] uppercase tracking-wider">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-[13px] text-[#525866] mt-0.5 block">
                    {gw.description}
                  </span>
                </div>

                {/* Radio */}
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  isSelected ? "border-[#003cbb]" : "border-[#cdd0d5]"
                )}>
                  {isSelected && (
                    <div className="w-3 h-3 rounded-full bg-[#003cbb]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between mt-auto pt-4">
        <button
          onClick={onCancelPayment}
          className="text-[14px] font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          Cancel Payment
        </button>

        <button
          onClick={onPayNow}
          disabled={!selectedGateway}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-[10px] text-[14px] font-medium transition-all",
            selectedGateway
              ? "bg-[#003cbb] hover:bg-[#002e8f] text-white shadow-sm"
              : "bg-[#e2e4e9] text-[#868c98] cursor-not-allowed"
          )}
        >
          Pay {formatPrice(totalAmount)} Now
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* SSL Notice */}
      <div className="flex items-center justify-center gap-1.5 pb-4">
        <ShieldCheck className="w-4 h-4 text-[#10b981]" />
        <span className="text-[12px] text-[#525866]">
          Secure 256-bit SSL Encrypted Payment
        </span>
      </div>
    </div>
  );
}
