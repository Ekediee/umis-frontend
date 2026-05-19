"use client";

import { cn } from "@/lib/utils";

interface SelectClassGroupProps {
  selectedGroup: string | null;
  onSelectGroup: (group: string) => void;
}

const CLASS_GROUPS = [
  "SENG",
  "SENG Group A",
  "SENG Group B",
  "SENG Group C",
  "SENG Group D",
  "SENG Group E",
  "SENG Group F",
];

export function SelectClassGroup({ selectedGroup, onSelectGroup }: SelectClassGroupProps) {
  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full max-w-[820px] mx-auto md:mx-0">
      
      {/* Session Info Banner (Mobile Only, on Desktop it is in the WebStepper) */}
      <div className="md:hidden bg-[#eef3fd] dark:bg-[#003cbb]/15 rounded-[16px] p-4 flex items-center justify-between gap-2 border border-[#ccdaf9] dark:border-[#ccdaf9]/25">
        <span className="text-[14px] font-semibold text-[#003cbb] dark:text-[#4d82ff] tracking-tight">
          First Semester
        </span>
        <span className="text-[14px] font-medium text-[#003cbb] dark:text-[#4d82ff]">
          2025/2026
        </span>
      </div>

      {/* Main Form Area */}
      <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 md:p-8 md:border border-gray-100 dark:border-gray-800 flex flex-col gap-6">
        <h3 className="text-[18px] md:text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 tracking-tight">
          Select Class Group
        </h3>

        <div className="flex flex-wrap gap-3">
          {CLASS_GROUPS.map((group) => {
            const isSelected = selectedGroup === group;

            return (
              <button
                key={group}
                onClick={() => onSelectGroup(group)}
                className={cn(
                  "px-6 py-3 rounded-[36px] text-[15px] font-medium transition-all",
                  isSelected
                    ? "bg-[#f8faff] dark:bg-[#003cbb]/15 border border-[#003cbb] dark:border-[#4d82ff] text-[#003cbb] dark:text-[#4d82ff] shadow-[0px_1px_2px_0px_rgba(55,93,251,0.08)]"
                    : "bg-[#f6f8fa] dark:bg-gray-800 border border-transparent text-[#4e5155] dark:text-gray-300 hover:bg-[#e2e4e9] dark:hover:bg-gray-700"
                )}
              >
                {group}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
