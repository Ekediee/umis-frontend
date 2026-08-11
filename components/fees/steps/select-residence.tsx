"use client";

import { useState } from "react";
import { Search, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCarousel } from "../image-carousel";
import type { FinanceResidence, FinanceGeneralCharges } from "@/app/actions/registration";

// Re-export FinanceResidence so payment-summary can import from here
export type { FinanceResidence };
export type { FinanceGeneralCharges };

// ── Image mapping: API residenceid → public image path ───────────────────────
const RESIDENCE_IMAGE_MAP: Record<string, string[]> = {
  BC:   ["/bethel-splendor.png"],
  EMER2: ["/emerald-hall.png"],
  EMER4: ["/emerald-hall.png"],
  I2:   ["/gamaliel.png"],
  PM:   ["/gideon-troopers.png"],
  NM:   ["/neal-wilson.png"],
  ROYL: ["/nelson-mandela.png"],
  WE:   ["/welch-hall.png"],
  WI:   ["/winslow.png", "/winslow-2.png"],
  // Default fallback
  _OFF_CAMPUS: ["/off-campus-image.png"],
};

/** Derive a badge type from the majors string returned by the API */
function deriveHallType(majors: string): "CLASSIC" | "PREMIUM" | "CLASSIC+" {
  const m = majors.toLowerCase();
  if (m.includes("premium")) return "PREMIUM";
  if (m.includes("classic plus") || m.includes("classic+")) return "CLASSIC+";
  return "CLASSIC";
}

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  CLASSIC:   { bg: "bg-[#cac2ff] dark:bg-[#cac2ff]/10", text: "text-[#2b1664] dark:text-[#b4aefc]" },
  PREMIUM:   { bg: "bg-[#c2d6ff] dark:bg-[#c2d6ff]/10", text: "text-[#162664] dark:text-[#a0c2ff]" },
  "CLASSIC+": { bg: "bg-[#c2f5e9] dark:bg-[#c2f5e9]/10", text: "text-[#164564] dark:text-[#86efac]" },
};

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `₦${price.toLocaleString()}`;
}

// ── Off-Campus sentinel object ────────────────────────────────────────────────
const OFF_CAMPUS_ID = "OFF_CAMPUS";

// ── Skeleton card ─────────────────────────────────────────────────────────────
function ResidenceCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-[#f5f5f5] dark:border-gray-800 rounded-[12px] overflow-hidden flex flex-col gap-2 pt-2 px-2 pb-3 animate-pulse">
      <div className="h-[120px] md:h-[152px] w-full bg-gray-200 dark:bg-gray-700 rounded-[8px]" />
      <div className="flex flex-col gap-2 px-1">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

// ── Component props ───────────────────────────────────────────────────────────
interface SelectResidenceProps {
  /** qresidenceid as string, or OFF_CAMPUS_ID, or null */
  selectedId: string | null;
  onSelect: (id: string) => void;
  residences?: FinanceResidence[];
  isLoading?: boolean;
  error?: string | null;
}

export function SelectResidence({
  selectedId,
  onSelect,
  residences = [],
  isLoading = false,
  error = null,
}: SelectResidenceProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Sort alphabetically by residencename; Off-Campus is always pinned first
  const sorted = [...residences].sort((a, b) =>
    a.residencename.localeCompare(b.residencename)
  );

  const filteredHalls = sorted.filter((h) =>
    h.residencename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Off-campus passes filter independently
  const showOffCampus =
    searchQuery === "" ||
    "off campus".includes(searchQuery.toLowerCase()) ||
    "off-campus".includes(searchQuery.toLowerCase());

  return (
    <div className="w-full max-w-[1200px] pb-28 flex flex-col gap-5">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[20px] md:text-[24px] font-bold text-[#0a0d14] dark:text-gray-100 tracking-tight leading-[24px] transition-colors">
          Select your preferred residence
        </h2>
        {/* Search (desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-[10px] px-3 py-2 w-[320px] transition-colors">
          <Search className="w-5 h-5 text-[#868c98] dark:text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Find your halls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-[14px] text-[#0a0d14] dark:text-gray-100 placeholder:text-[#525866] dark:placeholder:text-gray-500 outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden flex items-center gap-2 bg-[#f6f8fa] dark:bg-gray-900 border dark:border-gray-800 rounded-[10px] px-3 py-2.5 transition-colors">
        <Search className="w-5 h-5 text-[#868c98] dark:text-gray-500 shrink-0" />
        <input
          type="text"
          placeholder="Find your halls..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 text-[14px] text-[#0a0d14] dark:text-gray-100 placeholder:text-[#525866] dark:placeholder:text-gray-500 outline-none bg-transparent"
        />
      </div>

      {/* Error state */}
      {!isLoading && error && (
        <div className="rounded-[12px] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-4 py-3 text-[14px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Card Grid */}
      <div className="md:overflow-y-scroll overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Loading skeletons */}
          {isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <ResidenceCardSkeleton key={i} />
            ))}

          {/* Off-Campus card — always pinned first */}
          {!isLoading && showOffCampus && (() => {
            const isSelected = selectedId === OFF_CAMPUS_ID;
            return (
              <div
                key={OFF_CAMPUS_ID}
                className={cn(
                  "relative bg-white dark:bg-gray-900 border border-[#f5f5f5] dark:border-gray-800 rounded-[12px] overflow-hidden flex flex-col gap-2 pt-2 px-2 pb-3 transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#e5ecfc] dark:bg-[#003cbb]/20 border border-[#003CBB] dark:border-[#4d82ff] dark:shadow-[0_0_15px_rgba(77,130,255,0.15)] scale-[1.01]"
                    : "shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] dark:shadow-none hover:shadow-md dark:hover:border-gray-700"
                )}
                onClick={() => onSelect(OFF_CAMPUS_ID)}
              >
                <ImageCarousel
                  images={RESIDENCE_IMAGE_MAP._OFF_CAMPUS}
                  alt="Off Campus Residence"
                  className="h-[120px] md:h-[182px] w-full"
                />
                <div className="flex flex-col gap-2 px-1">
                  <p className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] dark:text-gray-100 leading-tight truncate transition-colors">
                    Off Campus Residence
                  </p>
                  <button
                    className="bg-[#e5ecfc] dark:bg-gray-800 text-[#375dfb] dark:text-[#4d82ff] rounded-[10px] px-3 py-2.5 text-[14px] font-medium flex items-center justify-center gap-1 hover:bg-[#dbe5fc] dark:hover:bg-gray-750 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Fill Off Campus Form
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                {isSelected && (
                  <div className="absolute top-0 left-0 bg-[#003cbb] dark:bg-[#4d82ff] rounded-tl-[12px] rounded-br-[8px] p-1">
                    <div className="w-5 h-5 rounded-[4px] bg-[#ebf1ff] dark:bg-gray-900 flex items-center justify-center shadow-[inset_0px_2px_2px_0px_rgba(22,38,100,0.32)]">
                      <Check className="w-3 h-3 text-[#003cbb] dark:text-[#4d82ff]" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* API-driven residence cards */}
          {!isLoading &&
            filteredHalls.map((hall) => {
              const isSelected = selectedId === String(hall.qresidenceid);
              const hallType = deriveHallType(hall.majors);
              const badge = BADGE_STYLES[hallType] || BADGE_STYLES.CLASSIC;
              const images =
                RESIDENCE_IMAGE_MAP[hall.residenceid] ||
                RESIDENCE_IMAGE_MAP._OFF_CAMPUS;

              return (
                <div
                  key={hall.qresidenceid}
                  className={cn(
                    "relative bg-white dark:bg-gray-900 rounded-[12px] border border-[#f5f5f5] dark:border-gray-800 overflow-hidden flex flex-col gap-2 pt-2 px-2 pb-3 transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#e5ecfc] dark:bg-[#003cbb]/20 border border-[#003cbb] dark:border-[#4d82ff] dark:shadow-[0_0_15px_rgba(77,130,255,0.15)] scale-[1.01]"
                      : "shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] dark:shadow-none hover:shadow-md dark:hover:border-gray-700"
                  )}
                  onClick={() => onSelect(String(hall.qresidenceid))}
                >
                  {/* Image Carousel */}
                  <ImageCarousel
                    images={images}
                    alt={hall.residencename}
                    className="h-[120px] md:h-[152px] w-full"
                  />

                  <div className="flex flex-col gap-2 px-1">
                    {/* Hall Name */}
                    <p className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] dark:text-gray-100 leading-tight truncate transition-colors">
                      {hall.residencename}
                    </p>

                    {/* Badge + Price */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider leading-[12px]",
                          badge.bg,
                          badge.text
                        )}
                      >
                        {hallType === "CLASSIC+" ? "Classic+" : hallType}
                      </span>
                      <span className="text-[14px] md:text-[16px] font-bold text-[#003cbb] dark:text-[#4d82ff] tracking-tight">
                        {formatPrice(hall.charges)}
                      </span>
                    </div>

                    {/* Level range */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] md:text-[12px] text-[#525866] dark:text-gray-400 leading-[16px]">
                          Level range
                        </span>
                        <span className="text-[12px] md:text-[14px] font-medium text-[#0a0d14] dark:text-gray-100 leading-[20px]">
                          {hall.min_level}L – {hall.max_level}L
                        </span>
                      </div>
                    </div>
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
    </div>
  );
}

// ── Exported helpers for use by summary/parent ────────────────────────────────

/** Look up images for a given API residenceid */
export function getResidenceImages(residenceid: string): string[] {
  return (
    RESIDENCE_IMAGE_MAP[residenceid] || RESIDENCE_IMAGE_MAP._OFF_CAMPUS
  );
}

/** Derive badge type from majors string */
export { deriveHallType };
export const RESIDENCE_IMAGE_MAP_EXPORT = RESIDENCE_IMAGE_MAP;
