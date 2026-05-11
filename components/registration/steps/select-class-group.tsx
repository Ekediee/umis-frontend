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
      <div className="md:hidden bg-[#eef3fd] rounded-[16px] p-4 flex items-center justify-between gap-2 border border-[#ccdaf9]">
        <span className="text-[14px] font-semibold text-[#003cbb] tracking-tight">
          First Semester
        </span>
        <span className="text-[14px] font-medium text-[#003cbb]">
          2025/2026
        </span>
      </div>

      {/* Main Form Area */}
      <div className="bg-white rounded-[24px] p-6 md:p-8 md:border border-gray-100 flex flex-col gap-6">
        <h3 className="text-[18px] md:text-[20px] font-bold text-[#0a0d14] tracking-tight">
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
                    ? "bg-[#f8faff] border border-[#003cbb] text-[#003cbb] shadow-[0px_1px_2px_0px_rgba(55,93,251,0.08)]"
                    : "bg-[#f6f8fa] border border-transparent text-[#4e5155] hover:bg-[#e2e4e9]"
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
