"use client";

import { Building2, UtensilsCrossed, Church, GraduationCap, MapPin, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESIDENCE_HALLS, type ResidenceHall } from "./select-residence";
import { type MealOption } from "./select-meal-plan";
import Image from "next/image";

// Mandatory fees — mock data, API will feed later
const MANDATORY_FEES = {
  tuition: 150000,
  lab: 25000,
  dev: 10000,
};
const MANDATORY_TOTAL = MANDATORY_FEES.tuition + MANDATORY_FEES.lab + MANDATORY_FEES.dev;

// Meal options data for lookup
const MEAL_OPTIONS_DATA = [
  { id: "breakfast-lunch", name: "Breakfast and Lunch", price: 40000, mealsPerDay: 2, schedule: "Sunday - Saturday" },
  { id: "breakfast-supper", name: "Breakfast and Supper", price: 45000, mealsPerDay: 2, schedule: "Sunday - Saturday" },
  { id: "lunch-supper", name: "Lunch and Supper", price: 42000, mealsPerDay: 2, schedule: "Sunday - Saturday" },
  { id: "breakfast-lunch-supper", name: "Breakfast, Lunch and Supper", price: 60000, mealsPerDay: 3, schedule: "Sunday - Saturday" },
];

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  CLASSIC: { bg: "bg-[#cac2ff] dark:bg-[#cac2ff]/10", text: "text-[#2b1664] dark:text-[#b4aefc]" },
  PREMIUM: { bg: "bg-[#c2d6ff] dark:bg-[#c2d6ff]/10", text: "text-[#162664] dark:text-[#a0c2ff]" },
  "CLASSIC+": { bg: "bg-[#c2f5e9] dark:bg-[#c2f5e9]/10", text: "text-[#164564] dark:text-[#86efac]" },
};

function formatPrice(price: number): string {
  return `₦${price.toLocaleString()}`;
}

interface PaymentSummaryProps {
  selectedResidenceId: string | null;
  selectedMealPlanId: string | null;
  onChangeStep: (step: number) => void;
}

export function PaymentSummary({
  selectedResidenceId,
  selectedMealPlanId,
  onChangeStep,
}: PaymentSummaryProps) {
  const residence = RESIDENCE_HALLS.find((h) => h.id === selectedResidenceId);
  const meal = MEAL_OPTIONS_DATA.find((m) => m.id === selectedMealPlanId);

  const residencePrice = residence?.price || 0;
  const mealPrice = meal?.price || 0;
  const totalCost = MANDATORY_TOTAL + residencePrice + mealPrice;

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
            {/* Icon */}
            <div className="w-10 h-10 rounded-[10px] bg-[#f0fdfa] dark:bg-[#0d9488]/10 flex items-center justify-center shrink-0 transition-colors">
              <GraduationCap className="w-5 h-5 text-[#0d9488]" />
            </div>

            {/* Content */}
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
                    <span>Tuition: {formatPrice(MANDATORY_FEES.tuition)}</span>
                    <span className="text-[#cdd0d5] dark:text-gray-700">·</span>
                    <span>Lab: {formatPrice(MANDATORY_FEES.lab)}</span>
                    <span className="text-[#cdd0d5] dark:text-gray-700">·</span>
                    <span>Dev: {formatPrice(MANDATORY_FEES.dev)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[18px] md:text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {formatPrice(MANDATORY_TOTAL)}
                  </span>
                  <button className="text-[13px] font-medium text-[#003cbb] dark:text-[#4d82ff] hover:underline transition-colors">
                    Details
                  </button>
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
                    {residence && residence.type !== "OFF_CAMPUS" && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                        BADGE_STYLES[residence.type]?.bg,
                        BADGE_STYLES[residence.type]?.text
                      )}>
                        {residence.type}
                      </span>
                    )}
                  </div>
                  <span className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {residence?.name || "Not selected"}
                  </span>
                  {residence && residence.type !== "OFF_CAMPUS" && (
                    <span className="text-[13px] text-[#525866] dark:text-gray-400 transition-colors">
                      {residence.occupants} occupants per room · Room: Pending assignment
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

              {/* Residence Thumbnail (desktop inline, mobile below) */}
              {residence && residence.images?.[0] && (
                <div className="mt-3 md:hidden">
                  <div className="relative w-full h-[120px] rounded-[8px] overflow-hidden">
                    <Image
                      src={residence.images[0]}
                      alt={residence.name}
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
            {residence && residence.images?.[0] && (
              <div className="hidden md:block relative w-[100px] h-[70px] rounded-[8px] overflow-hidden shrink-0">
                <Image
                  src={residence.images[0]}
                  alt={residence.name}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="100px"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Selected Meal Plan */}
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
                    {meal?.name || "Not selected"}
                  </span>
                  {meal && (
                    <span className="text-[13px] text-[#525866] dark:text-gray-400 transition-colors">
                      {meal.schedule} · {meal.mealsPerDay} meals per day
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[18px] md:text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 transition-colors">
                    {formatPrice(mealPrice)}
                  </span>
                  <button
                    onClick={() => onChangeStep(2)}
                    className="text-[13px] font-medium text-[#003cbb] dark:text-[#4d82ff] hover:underline transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Meal icons */}
              {meal && (
                <div className="flex items-center gap-1.5 mt-2">
                  {meal.id.includes("breakfast") && (
                    <span className="text-[18px]">☀️</span>
                  )}
                  {meal.id.includes("lunch") && (
                    <span className="text-[18px]">🍽️</span>
                  )}
                  {meal.id.includes("supper") && (
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
