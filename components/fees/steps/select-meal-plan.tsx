"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Data interface — structured for future API integration
export interface MealOption {
  id: string;
  name: string;
  image: string;
  price: number;
}

// Mock data from Figma
const MEAL_OPTIONS: MealOption[] = [
  {
    id: "breakfast-lunch",
    name: "Breakfast and Lunch",
    image: "/Breakfast&Lunch.png",
    price: 40000,
  },
  {
    id: "breakfast-supper",
    name: "Breakfast and Supper",
    image: "/Breakfast&Supper.png",
    price: 45000,
  },
  {
    id: "lunch-supper",
    name: "Lunch and Supper",
    image: "/Lunch and Supper.png",
    price: 42000,
  },
  {
    id: "breakfast-lunch-supper",
    name: "Breakfast, Lunch and Supper",
    image: "/Breakfast lunch supper.png",
    price: 60000,
  },
];

interface SelectMealPlanProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SelectMealPlan({ selectedId, onSelect }: SelectMealPlanProps) {
  return (
    <div className="w-full max-w-[1200px] h-[79vh] overflow-y-auto flex flex-col gap-5">
      {/* Header */}
      <h2 className="text-[20px] md:text-[24px] font-bold text-[#0a0d14] dark:text-gray-100 tracking-tight leading-[24px] transition-colors">
        Select your preferred meal Type
      </h2>

      {/* Card Grid — 4 columns on desktop, 1 column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {MEAL_OPTIONS.map((meal) => {
          const isSelected = selectedId === meal.id;

          return (
            <div
              key={meal.id}
              className={cn(
                "relative bg-white dark:bg-gray-900 border border-[#f5f5f5] dark:border-gray-800 overflow-hidden rounded-[12px] flex flex-col gap-2 pt-2 px-2 pb-3 transition-all cursor-pointer",
                isSelected
                  ? "bg-[#e5ecfc] dark:bg-[#003cbb]/20 border border-[#003cbb] dark:border-[#4d82ff] dark:shadow-[0_0_15px_rgba(77,130,255,0.15)] scale-[1.01]"
                  : "shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] dark:shadow-none hover:shadow-md dark:hover:border-gray-700"
              )}
              onClick={() => onSelect(meal.id)}
            >
              {/* Meal Image — static, no carousel */}
              <div className="relative h-[114px] w-full rounded-[8px] overflow-hidden">
                <Image
                  src={meal.image}
                  alt={meal.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 270px"
                />
              </div>

              {/* Meal Name */}
              <div className="flex items-center px-1">
                <p className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] dark:text-gray-100 leading-tight transition-colors">
                  {meal.name}
                </p>
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
