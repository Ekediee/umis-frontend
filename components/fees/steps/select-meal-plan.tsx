"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { FinanceMealType, FinanceGeneralCharges } from "@/app/actions/registration";

export type { FinanceMealType, FinanceGeneralCharges };

const MEAL_IMAGE_MAP: Record<string, string> = {
  BL: "/Breakfast&Lunch.png",
  BS: "/Breakfast&Supper.png",
  LS: "/Lunch and Supper.png",
  BLS: "/Breakfast lunch supper.png",
};

/**
 * Returns the fee value for a meal plan option from general charges.
 * 2-meal options (BL, BS, LS): meal2fees
 * 3-meal option (BLS): meal3fees
 */
export function getMealPlanPrice(
  mealType: string,
  generalCharges: FinanceGeneralCharges | null | undefined
): number {
  if (!generalCharges) return 0;
  if (mealType === "BLS") {
    return generalCharges.meal3fees || 0;
  } else {
    return generalCharges.meal2fees || 0;
  }
}


function formatPrice(price: number): string {
  return `₦${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function MealPlanCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-[#f5f5f5] dark:border-gray-800 overflow-hidden rounded-[12px] flex flex-col gap-2 pt-2 px-2 pb-3 animate-pulse">
      <div className="h-[114px] w-full bg-gray-200 dark:bg-gray-700 rounded-[8px]" />
      <div className="flex flex-col px-1 gap-1">
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

interface SelectMealPlanProps {
  /** qselectionid as string, mealtype string, or null */
  selectedId: string | null;
  onSelect: (id: string) => void;
  mealTypes?: FinanceMealType[];
  generalCharges?: FinanceGeneralCharges | null;
  isLoading?: boolean;
  error?: string | null;
}

export function SelectMealPlan({
  selectedId,
  onSelect,
  mealTypes = [],
  generalCharges = null,
  isLoading = false,
  error = null,
}: SelectMealPlanProps) {
  return (
    <div className="w-full max-w-[1200px] h-[79vh] overflow-y-auto flex flex-col gap-5">
      {/* Header */}
      <h2 className="text-[20px] md:text-[24px] font-bold text-[#0a0d14] dark:text-gray-100 tracking-tight leading-[24px] transition-colors">
        Select your preferred meal Type
      </h2>

      {/* Error state */}
      {!isLoading && error && (
        <div className="rounded-[12px] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-4 py-3 text-[14px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Card Grid — 4 columns on desktop, 1 column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <MealPlanCardSkeleton key={i} />)}

        {!isLoading &&
          mealTypes.map((meal) => {
            const isSelected =
              selectedId === String(meal.qselectionid) || selectedId === meal.mealtype;
            const price = getMealPlanPrice(meal.mealtype, generalCharges);
            const imageSrc = MEAL_IMAGE_MAP[meal.mealtype] || "/Breakfast&Lunch.png";

            return (
              <div
                key={meal.qselectionid}
                className={cn(
                  "relative bg-white dark:bg-gray-900 border border-[#f5f5f5] dark:border-gray-800 overflow-hidden rounded-[12px] flex flex-col gap-2 pt-2 px-2 pb-3 transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#e5ecfc] dark:bg-[#003cbb]/20 border border-[#003cbb] dark:border-[#4d82ff] dark:shadow-[0_0_15px_rgba(77,130,255,0.15)] scale-[1.01]"
                    : "shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] dark:shadow-none hover:shadow-md dark:hover:border-gray-700"
                )}
                onClick={() => onSelect(String(meal.qselectionid))}
              >
                {/* Meal Image — static, no carousel */}
                <div className="relative h-[114px] w-full rounded-[8px] overflow-hidden">
                  <Image
                    src={imageSrc}
                    alt={meal.selection}
                    fill
                    unoptimized
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 270px"
                  />
                </div>

                {/* Meal Name & Price */}
                <div className="flex flex-col px-1 gap-1">
                  <p className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] dark:text-gray-100 leading-tight transition-colors">
                    {meal.selection}
                  </p>
                  <span className="text-[14px] md:text-[16px] font-bold text-[#003cbb] dark:text-[#4d82ff] tracking-tight">
                    {formatPrice(price)}
                  </span>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-0 left-0 bg-[#003cbb] dark:bg-[#4d82ff] rounded-tl-[12px] rounded-br-[8px] p-1">
                    <div className="w-5 h-5 rounded-[4px] bg-[#ebf1ff] dark:bg-gray-900 flex items-center justify-center shadow-[inset_0px_2px_2px_0px_rgba(22,38,100,0.32)]">
                      <Check className="w-3 h-3 text-[#003cbb] dark:text-[#4d82ff]" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
