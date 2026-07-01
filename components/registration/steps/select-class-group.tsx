"use client";

import { cn } from "@/lib/utils";
import { ClassGroup } from "@/app/actions/registration";
import { useRegistration } from "@/components/providers/registration-provider";

interface SelectClassGroupProps {
  selectedGroups?: string[];
  onToggleGroup?: (id: string) => void;
  classGroups?: ClassGroup[];
  isLoading?: boolean;
  error?: string | null;
}

/** Pill-shaped loading skeleton */
function GroupSkeleton() {
  return (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[48px] w-[120px] rounded-[36px] bg-gray-100 animate-pulse"
        />
      ))}
    </div>
  );
}

export function SelectClassGroup(props: SelectClassGroupProps) {
  const context = useRegistration();

  const selectedGroups = props.selectedGroups !== undefined ? props.selectedGroups : context.selectedGroups;
  const onToggleGroup = props.onToggleGroup !== undefined ? props.onToggleGroup : context.toggleGroup;
  const classGroups = props.classGroups !== undefined ? props.classGroups : context.classGroups;
  const isLoading = props.isLoading !== undefined ? props.isLoading : context.classGroupsLoading;
  const error = props.error !== undefined ? props.error : context.classGroupsError;

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
        <div className="flex flex-col gap-1">
          <h3 className="text-[18px] md:text-[20px] font-bold text-[#0a0d14] dark:text-gray-100 tracking-tight">
            Select Class Group
          </h3>
          <p className="text-[13px] text-[#6b7280] dark:text-gray-400">
            You can select one or more class groups.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && <GroupSkeleton />}

        {/* Error State */}
        {!isLoading && error && (
          <div className="rounded-[12px] bg-red-50 border border-red-100 px-4 py-3 text-[14px] text-red-600">
            {error}
          </div>
        )}

        {/* Groups */}
        {!isLoading && !error && (
          <div className="flex flex-wrap gap-3">
            {classGroups.length === 0 ? (
              <p className="text-[14px] text-[#4e5155]">
                No class groups available.
              </p>
            ) : (
              classGroups.map((group) => {
                const isSelected = selectedGroups.includes(String(group.id));

                return (
                  <button
                    key={group.id}
                    onClick={() => onToggleGroup(String(group.id))}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 rounded-[36px] text-[15px] font-medium transition-all",
                      isSelected
                        ? "bg-[#f8faff] border border-[#003cbb] text-[#003cbb] shadow-[0px_1px_2px_0px_rgba(55,93,251,0.08)]"
                        : "bg-[#f6f8fa] border border-transparent text-[#4e5155] hover:bg-[#e2e4e9]"
                    )}
                  >
                    {/* Checkmark indicator */}
                    <span
                      className={cn(
                        "flex items-center justify-center w-[18px] h-[18px] rounded-full border transition-all flex-shrink-0",
                        isSelected
                          ? "bg-[#003cbb] border-[#003cbb]"
                          : "bg-transparent border-[#c5c7cd]"
                      )}
                    >
                      {isSelected && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {group.name}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Selection count badge */}
        {!isLoading && !error && selectedGroups.length > 0 && (
          <p className="text-[13px] text-[#003cbb] dark:text-[#4d82ff] font-medium">
            {selectedGroups.length} group{selectedGroups.length > 1 ? "s" : ""} selected
          </p>
        )}
      </div>

    </div>
  );
}
