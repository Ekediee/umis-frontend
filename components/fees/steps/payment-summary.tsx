"use client";

import { Building2, UtensilsCrossed, Church, GraduationCap, MapPin, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESIDENCE_HALLS, type ResidenceHall } from "./select-residence";
import { type MealOption } from "./select-meal-plan";
import { WORSHIP_CENTERS, type WorshipCenter } from "./select-worship-center";
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
  CLASSIC: { bg: "bg-[#cac2ff]", text: "text-[#2b1664]" },
  PREMIUM: { bg: "bg-[#c2d6ff]", text: "text-[#162664]" },
  "CLASSIC+": { bg: "bg-[#c2f5e9]", text: "text-[#164564]" },
};

function formatPrice(price: number): string {
  return `₦${price.toLocaleString()}`;
}

interface PaymentSummaryProps {
  selectedResidenceId: string | null;
  selectedMealPlanId: string | null;
  selectedWorshipCenterId: string | null;
  onChangeStep: (step: number) => void;
}

export function PaymentSummary({
  selectedResidenceId,
  selectedMealPlanId,
  selectedWorshipCenterId,
  onChangeStep,
}: PaymentSummaryProps) {
  const residence = RESIDENCE_HALLS.find((h) => h.id === selectedResidenceId);
  const meal = MEAL_OPTIONS_DATA.find((m) => m.id === selectedMealPlanId);
  const worship = WORSHIP_CENTERS.find((w) => w.id === selectedWorshipCenterId);

  const residencePrice = residence?.price || 0;
  const mealPrice = meal?.price || 0;
  const totalCost = MANDATORY_TOTAL + residencePrice + mealPrice;

  return (
    <div className="w-full max-w-[1200px] md:h-[90%] h-[78vh] flex flex-col gap-5 overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-[20px] md:text-[24px] font-bold text-[#0a0d14] tracking-tight">
          Review Your Selections
        </h2>
        <p className="text-[14px] text-[#525866] mt-1">
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
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] p-5 md:p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-10 h-10 rounded-[10px] bg-[#f0fdfa] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-[#0d9488]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#868c98] uppercase tracking-wider">
                    Mandatory Basic Fees
                  </span>
                  <span className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14]">
                    Tuition & Institutional Fees
                  </span>
                  <div className="flex items-center gap-1.5 text-[13px] text-[#525866] flex-wrap">
                    <span>Tuition: {formatPrice(MANDATORY_FEES.tuition)}</span>
                    <span className="text-[#cdd0d5]">·</span>
                    <span>Lab: {formatPrice(MANDATORY_FEES.lab)}</span>
                    <span className="text-[#cdd0d5]">·</span>
                    <span>Dev: {formatPrice(MANDATORY_FEES.dev)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[18px] md:text-[20px] font-bold text-[#0a0d14]">
                    {formatPrice(MANDATORY_TOTAL)}
                  </span>
                  <button className="text-[13px] font-medium text-[#003cbb] hover:underline">
                    Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Selected Residence */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#eff6ff] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#3b82f6]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#868c98] uppercase tracking-wider">
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
                  <span className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14]">
                    {residence?.name || "Not selected"}
                  </span>
                  {residence && residence.type !== "OFF_CAMPUS" && (
                    <span className="text-[13px] text-[#525866]">
                      {residence.occupants} occupants per room · Room: Pending assignment
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[18px] md:text-[20px] font-bold text-[#0a0d14]">
                    {formatPrice(residencePrice)}
                  </span>
                  <button
                    onClick={() => onChangeStep(1)}
                    className="text-[13px] font-medium text-[#003cbb] hover:underline"
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
                  className="object-cover"
                  sizes="100px"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Selected Meal Plan */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#fff7ed] flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-[#f97316]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#868c98] uppercase tracking-wider">
                    Selected Meal Plan
                  </span>
                  <span className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14]">
                    {meal?.name || "Not selected"}
                  </span>
                  {meal && (
                    <span className="text-[13px] text-[#525866]">
                      {meal.schedule} · {meal.mealsPerDay} meals per day
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[18px] md:text-[20px] font-bold text-[#0a0d14]">
                    {formatPrice(mealPrice)}
                  </span>
                  <button
                    onClick={() => onChangeStep(2)}
                    className="text-[13px] font-medium text-[#003cbb] hover:underline"
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

        {/* 4. Selected Worship Center */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[10px] bg-[#faf5ff] flex items-center justify-center shrink-0">
              <Church className="w-5 h-5 text-[#a855f7]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#868c98] uppercase tracking-wider">
                    Selected Worship Center
                  </span>
                  <span className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14]">
                    {worship?.name || "Not selected"}
                  </span>
                </div>

                <button
                  onClick={() => onChangeStep(3)}
                  className="text-[13px] font-medium text-[#003cbb] hover:underline shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Metadata chips */}
              {worship && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 bg-[#f6f8fa] text-[#525866] text-[12px] px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {worship.location}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#f6f8fa] text-[#525866] text-[12px] px-2.5 py-1 rounded-full">
                    <User className="w-3 h-3" />
                    Pastor {worship.pastor}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#ecfdf5] text-[#059669] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    {worship.spacesLeft} spaces remaining
                  </span>
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
    <div className="bg-[#e5ecfc] border border-[#003cbb] rounded-[16px] p-5 md:p-6 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-[16px] md:text-[18px] font-bold text-[#0a0d14]">
          Total Registration Cost
        </span>
        <span className="text-[13px] text-[#525866]">
          Due before semester commencement
        </span>
      </div>

      <div className="flex flex-col items-end gap-3">
        <span className="inline-flex items-center gap-1 bg-[#fff7ed] text-[#f97316] text-[10px] font-medium px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
          Pending Payment
        </span>
        <span className="text-[24px] md:text-[28px] font-bold text-[#0a0d14] tracking-tight">
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
}
