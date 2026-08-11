"use client";

import { Building2, UtensilsCrossed, Church, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type {
  FinanceResidence,
  FinanceGeneralCharges,
  FinanceMealType,
  FinanceWorshipCenter,
} from "@/app/actions/registration";
import { deriveHallType, getResidenceImages } from "./select-residence";
import { getMealPlanPrice } from "./select-meal-plan";

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  CLASSIC: { bg: "bg-[#cac2ff] dark:bg-[#cac2ff]/10", text: "text-[#2b1664] dark:text-[#b4aefc]" },
  PREMIUM: { bg: "bg-[#c2d6ff] dark:bg-[#c2d6ff]/10", text: "text-[#162664] dark:text-[#a0c2ff]" },
  "CLASSIC+": { bg: "bg-[#c2f5e9] dark:bg-[#c2f5e9]/10", text: "text-[#164564] dark:text-[#86efac]" },
};

function formatPrice(price: number): string {
  return `₦${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface PaymentSummaryProps {
  selectedResidence?: FinanceResidence | null;
  isOffCampus?: boolean;
  selectedWorshipCenter?: FinanceWorshipCenter | null;
  selectedMealType?: FinanceMealType | null;
  generalCharges?: FinanceGeneralCharges | null;
  onChangeStep: (step: number) => void;
}

export function PaymentSummary({
  selectedResidence,
  isOffCampus = false,
  selectedWorshipCenter,
  selectedMealType,
  generalCharges,
  onChangeStep,
}: PaymentSummaryProps) {
  // Mandatory basic fees directly from API
  const mandatoryTotal = generalCharges?.fees || 0;

  // Residence cost
  const residencePrice = isOffCampus ? 0 : selectedResidence?.charges || 0;
  const residenceName = isOffCampus
    ? "Off Campus Residence"
    : selectedResidence?.residencename || "Not selected";
  const residenceType = isOffCampus
    ? null
    : selectedResidence
    ? deriveHallType(selectedResidence.majors)
    : null;
  const residenceImages = isOffCampus
    ? ["/off-campus-image.png"]
    : selectedResidence
    ? getResidenceImages(selectedResidence.residenceid)
    : [];

  // Meal plan cost
  const mealPrice = selectedMealType
    ? getMealPlanPrice(selectedMealType.mealtype, generalCharges)
    : 0;

  // Total cost calculation: sum of all displayed fee cards
  const totalCost = mandatoryTotal + residencePrice + mealPrice;



  return (
    <div className="w-full max-w-[1200px] pb-32 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-[20px] md:text-[24px] font-bold text-[#0a0d14] dark:text-gray-100 tracking-tight transition-colors">
          Review Your Selections
        </h2>
        <p className="text-[14px] text-[#525866] dark:text-gray-400 mt-1 transition-colors">
          Please review your choices before finalizing your registration.
        </p>
      </div>

      {/* Mobile: Total Cost Banner at top */}
      <div className="md:hidden">
        <TotalCostBanner total={totalCost} />
      </div>

      {/* Summary Cards */}
      <div className="flex flex-col gap-4">
        {/* 1. Mandatory Basic Fees */}
        <div className="bg-white dark:bg-gray-900 rounded-[16px] border border-gray-100 dark:border-gray-800 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] dark:shadow-none p-5 md:p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#f0fdfa] dark:bg-[#0d9488]/10 flex items-center justify-center shrink-0 transition-colors">
              <GraduationCap className="w-5 h-5 text-[#0d9488]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#868c98] dark:text-gray-500 uppercase tracking-wider transition-colors">
                    Mandatory Basic Fees
                  </span>
                  <span className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    Tuition & Institutional Fees
                  </span>
                  <div className="flex items-center gap-1.5 text-[13px] text-[#525866] dark:text-gray-400 flex-wrap transition-colors">
                    <span>Base Fees: {formatPrice(mandatoryTotal)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[18px] md:text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {formatPrice(mandatoryTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Selected Residence */}
        <div className="bg-white dark:bg-gray-900 rounded-[16px] border border-gray-100 dark:border-gray-800 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] dark:shadow-none p-5 md:p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#eff6ff] dark:bg-[#3b82f6]/10 flex items-center justify-center shrink-0 transition-colors">
              <Building2 className="w-5 h-5 text-[#3b82f6]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#868c98] dark:text-gray-500 uppercase tracking-wider transition-colors">
                      Selected Residence
                    </span>
                    {residenceType && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                          BADGE_STYLES[residenceType]?.bg,
                          BADGE_STYLES[residenceType]?.text
                        )}
                      >
                        {residenceType}
                      </span>
                    )}
                  </div>
                  <span className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {residenceName}
                  </span>
                  {selectedResidence && !isOffCampus && (
                    <span className="text-[13px] text-[#525866] dark:text-gray-400 transition-colors">
                      Level Range: {selectedResidence.min_level}L – {selectedResidence.max_level}L · Room: Pending assignment
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[18px] md:text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {formatPrice(residencePrice)}
                  </span>
                  <button
                    onClick={() => onChangeStep(1)}
                    className="text-[13px] font-medium text-[#003cbb] dark:text-[#4d82ff] hover:underline transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Residence Thumbnail (mobile below) */}
              {residenceImages[0] && (
                <div className="mt-3 md:hidden">
                  <div className="relative w-full h-[120px] rounded-[8px] overflow-hidden">
                    <Image
                      src={residenceImages[0]}
                      alt={residenceName}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 120px"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop thumbnail */}
            {residenceImages[0] && (
              <div className="hidden md:block relative w-[100px] h-[70px] rounded-[8px] overflow-hidden shrink-0">
                <Image
                  src={residenceImages[0]}
                  alt={residenceName}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="100px"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Selected Worship Center */}
        <div className="bg-white dark:bg-gray-900 rounded-[16px] border border-gray-100 dark:border-gray-800 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] dark:shadow-none p-5 md:p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#fef3c7]/60 dark:bg-[#d97706]/10 flex items-center justify-center shrink-0 transition-colors">
              <Church className="w-5 h-5 text-[#d97706]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#868c98] dark:text-gray-500 uppercase tracking-wider transition-colors">
                    Selected Worship Center
                  </span>
                  <span className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {selectedWorshipCenter?.sabbath_class_name || "Not selected"}
                  </span>
                  {selectedWorshipCenter && (
                    <span className="text-[13px] text-[#525866] dark:text-gray-400 transition-colors">
                      {selectedWorshipCenter.location_on_campus} · Pastor: {selectedWorshipCenter.pastor_in_charge}
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[14px] font-bold text-[#38c793] dark:text-[#4ade80] transition-colors">
                    Included
                  </span>
                  <button
                    onClick={() => onChangeStep(2)}
                    className="text-[13px] font-medium text-[#003cbb] dark:text-[#4d82ff] hover:underline transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Selected Meal Plan */}
        <div className="bg-white dark:bg-gray-900 rounded-[16px] border border-gray-100 dark:border-gray-800 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] dark:shadow-none p-5 md:p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#fff7ed] dark:bg-[#f97316]/10 flex items-center justify-center shrink-0 transition-colors">
              <UtensilsCrossed className="w-5 h-5 text-[#f97316]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#868c98] dark:text-gray-500 uppercase tracking-wider transition-colors">
                    Selected Meal Plan
                  </span>
                  <span className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {selectedMealType?.selection || "Not selected"}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[18px] md:text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {formatPrice(mealPrice)}
                  </span>
                  <button
                    onClick={() => onChangeStep(3)}
                    className="text-[13px] font-medium text-[#003cbb] dark:text-[#4d82ff] hover:underline transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Meal icons */}
              {selectedMealType && (
                <div className="flex items-center gap-1.5 mt-2">
                  {selectedMealType.mealtype.includes("B") && (
                    <span className="text-[18px]">☀️</span>
                  )}
                  {selectedMealType.mealtype.includes("L") && (
                    <span className="text-[18px]">🍽️</span>
                  )}
                  {selectedMealType.mealtype.includes("S") && (
                    <span className="text-[18px]">🌙</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Total Cost Banner at bottom */}
      <div className="hidden md:block">
        <TotalCostBanner total={totalCost} />
      </div>
    </div>
  );
}

// Shared Total Cost Banner
function TotalCostBanner({ total }: { total: number }) {
  return (
    <div className="bg-[#e5ecfc] dark:bg-[#003cbb]/10 border border-[#003cbb] dark:border-[#4d82ff] rounded-[16px] p-5 md:p-6 flex items-center justify-between dark:shadow-[0_0_15px_rgba(77,130,255,0.05)] transition-colors">
      <div className="flex flex-col gap-1">
        <span className="text-[16px] md:text-[18px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">
          Total Registration Cost
        </span>
        <span className="text-[13px] text-[#525866] dark:text-gray-400 transition-colors">
          Due before semester commencement
        </span>
      </div>

      <div className="flex flex-col items-end gap-3">
        <span className="inline-flex items-center gap-1 bg-[#fff7ed] dark:bg-[#f97316]/10 text-[#f97316] dark:text-[#fb923c] text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] dark:bg-[#fb923c]" />
          Pending Payment
        </span>
        <span className="text-[24px] md:text-[28px] font-bold text-[#0a0d14] dark:text-gray-100 tracking-tight transition-colors">
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
}
