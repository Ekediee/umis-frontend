"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRegistration } from "@/components/providers/registration-provider";

// Re-export the canonical WorshipCenter type (used by summary.tsx)
export type { WorshipCenter } from "@/app/actions/registration";

const ITEMS_PER_PAGE = 10;

interface SelectWorshipCenterProps {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  worshipCenters?: import("@/app/actions/registration").WorshipCenter[];
  isLoading?: boolean;
  error?: string | null;
}

/** Table row skeleton for the desktop loading state */
function TableRowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="w-[80px] pl-6">
        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </TableCell>
      <TableCell className="text-right pr-6">
        <div className="h-6 w-12 rounded-[8px] bg-gray-200 dark:bg-gray-700 animate-pulse ml-auto" />
      </TableCell>
    </TableRow>
  );
}

/** Card skeleton for the mobile loading state */
function CardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-[16px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="w-5 h-5 mt-0.5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}

export function SelectWorshipCenter(props: SelectWorshipCenterProps) {
  const context = useRegistration();

  // Prefer explicit props, fall back to context values
  const selectedId =
    props.selectedId !== undefined ? props.selectedId : context.selectedWorshipCenterId;
  const onSelect =
    props.onSelect !== undefined ? props.onSelect : context.setSelectedWorshipCenterId;
  const worshipCenters =
    props.worshipCenters !== undefined ? props.worshipCenters : context.worshipCenters;
  const isLoading =
    props.isLoading !== undefined ? props.isLoading : context.worshipCentersLoading;
  const error =
    props.error !== undefined ? props.error : context.worshipCentersError;

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(
    () =>
      worshipCenters.filter(
        (wc) =>
          wc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wc.pastor.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery, worshipCenters]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedDesktop = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page on search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-[1200px] pb-32 flex flex-col gap-5">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[20px] md:text-[24px] font-bold text-[#0a0d14] dark:text-gray-100 tracking-tight leading-[24px] transition-colors">
          Select your preferred worship center
        </h2>
        {/* Search (desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-white dark:bg-gray-900 rounded-[8px] px-3 py-2 w-[320px] border border-gray-200 dark:border-gray-800 transition-colors">
          <Search className="w-5 h-5 text-[#868c98] dark:text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search chapels..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 text-[14px] text-[#0a0d14] dark:text-gray-100 placeholder:text-[#525866] dark:placeholder:text-gray-500 outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden flex items-center gap-2 bg-[#f6f8fa] dark:bg-gray-900 border dark:border-gray-800 rounded-[10px] px-3 py-2.5 transition-colors">
        <Search className="w-5 h-5 text-[#868c98] dark:text-gray-500 shrink-0" />
        <input
          type="text"
          placeholder="Search chapels..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 text-[14px] text-[#0a0d14] dark:text-gray-100 placeholder:text-[#525866] dark:placeholder:text-gray-500 outline-none bg-transparent"
        />
      </div>

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-[12px] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-4 py-3 text-[14px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:flex flex-col">
        <div className="rounded-[16px] overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f2f4f7] dark:bg-gray-950 hover:bg-[#f2f4f7] dark:hover:bg-gray-950 border-none transition-colors">
                <TableHead className="w-[80px] pl-6"></TableHead>
                <TableHead className="text-[12px] font-bold text-[#525866] dark:text-gray-400 uppercase tracking-wider h-12">
                  Worship Center
                </TableHead>
                <TableHead className="text-[12px] font-bold text-[#525866] dark:text-gray-400 uppercase tracking-wider h-12">
                  Location on Campus
                </TableHead>
                <TableHead className="text-[12px] font-bold text-[#525866] dark:text-gray-400 uppercase tracking-wider h-12">
                  Pastor In Charge
                </TableHead>
                <TableHead className="text-[12px] font-bold text-[#525866] dark:text-gray-400 uppercase tracking-wider text-right pr-6 h-12">
                  Space Left
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Loading skeletons */}
              {isLoading &&
                Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}

              {/* Data rows */}
              {!isLoading &&
                paginatedDesktop.map((wc) => {
                  const isSelected = selectedId === wc.id;
                  return (
                    <TableRow
                      key={wc.id}
                      className={cn(
                        "cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors",
                        isSelected &&
                          "bg-[#f8faff] dark:bg-[#003cbb]/10 hover:bg-[#f8faff] dark:hover:bg-[#003cbb]/10"
                      )}
                      onClick={() => onSelect(wc.id)}
                    >
                      <TableCell className="w-[80px] pl-6">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-[#003cbb] dark:border-[#4d82ff]"
                              : "border-[#cdd0d5] dark:border-gray-700"
                          )}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#003cbb] dark:bg-[#4d82ff]" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-[#0a0d14] dark:text-gray-100 text-[14px] transition-colors">
                          {wc.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#525866] dark:text-gray-400 text-[14px] transition-colors">
                        {wc.location}
                      </TableCell>
                      <TableCell className="text-[#525866] dark:text-gray-400 text-[14px] transition-colors">
                        {wc.pastor}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <span className="inline-flex bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff] font-bold text-[12px] px-3 py-1 rounded-[8px] tracking-wider transition-colors">
                          {wc.spacesLeft}/<span className="text-[#525866] dark:text-gray-400 text-[12px]">{wc.declaredCapacity}</span>
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {!isLoading && !error && paginatedDesktop.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#525866] dark:text-gray-400">
                    No worship centers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-[13px] text-[#525866] dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-[8px] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-[#525866] dark:text-gray-400" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-9 h-9 rounded-[8px] text-[13px] font-medium transition-colors",
                    currentPage === page
                      ? "bg-[#003cbb] dark:bg-[#2563EB] text-white"
                      : "border border-gray-200 dark:border-gray-800 text-[#525866] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-[8px] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-[#525866] dark:text-gray-400" />
              </button>
            </div>

            <span className="text-[13px] text-[#525866] dark:text-gray-400">
              {ITEMS_PER_PAGE}/page
            </span>
          </div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden flex flex-col gap-3">
        {/* Loading skeletons */}
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}

        {/* Data cards */}
        {!isLoading &&
          filtered.map((wc) => {
            const isSelected = selectedId === wc.id;
            return (
              <div
                key={wc.id}
                onClick={() => onSelect(wc.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-[16px] cursor-pointer transition-all border",
                  isSelected
                    ? "bg-[#e5ecfc] dark:bg-[#003cbb]/20 border-[#003cbb] dark:border-[#4d82ff] dark:shadow-[0_0_15px_rgba(77,130,255,0.15)] scale-[1.01]"
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                )}
              >
                {/* Radio */}
                <div className="pt-0.5">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected
                        ? "border-[#003cbb] dark:border-[#4d82ff]"
                        : "border-[#cdd0d5] dark:border-gray-700"
                    )}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#003cbb] dark:bg-[#4d82ff]" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-[#0a0d14] dark:text-gray-100 transition-colors">
                      {wc.name}
                    </span>
                    <span className="inline-flex bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff] font-bold text-[11px] px-2 py-0.5 rounded-[6px] shrink-0 transition-colors">
                      {wc.spacesLeft} left
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] text-[#525866] dark:text-gray-400">
                      📍 {wc.location}
                    </span>
                    <span className="text-[13px] text-[#525866] dark:text-gray-400">
                      👤 {wc.pastor}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-8 text-[#525866] dark:text-gray-400">
            No worship centers found.
          </div>
        )}
      </div>
    </div>
  );
}
