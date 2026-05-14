"use client";

import { useState } from "react";
import { Search, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCarousel } from "../image-carousel";

// Data interface — structured for future API integration
export interface ResidenceHall {
  id: string;
  name: string;
  type: "CLASSIC" | "PREMIUM" | "CLASSIC+" | "OFF_CAMPUS";
  price: number;
  occupants: number;
  capacity: number;
  images: string[];
}

// Mock data from Figma
export const RESIDENCE_HALLS: ResidenceHall[] = [
  {
    id: "off-campus",
    name: "Off Campus Residence",
    type: "OFF_CAMPUS",
    price: 0,
    occupants: 0,
    capacity: 0,
    images: ["/off-campus-image.png"], // Removed spaces
  },
  {
    id: "neal-wilson-classic",
    name: "Neal Wilson Hall",
    type: "CLASSIC",
    price: 102000,
    occupants: 6,
    capacity: 350,
    images: ["/neal-wilson.png"], // Removed spaces
  },
  {
    id: "neal-wilson-premium",
    name: "Neal Wilson Hall",
    type: "PREMIUM",
    price: 750000,
    occupants: 5,
    capacity: 400,
    images: ["/neal-wilson.png"], 
  },
  {
    id: "winslow-premium",
    name: "Winslow Hall",
    type: "PREMIUM",
    price: 100000,
    occupants: 4,
    capacity: 700,
    images: ["/winslow.png", "/winslow-2.png"], // Standardized casing
  },
  {
    id: "winslow-classic",
    name: "Winslow Hall",
    type: "CLASSIC",
    price: 152000,
    occupants: 3,
    capacity: 300,
    images: ["/winslow.png", "/winslow-2.png"],
  },
  {
    id: "gideon-troopers",
    name: "Gideon Troopers Hall",
    type: "CLASSIC",
    price: 500000,
    occupants: 4,
    capacity: 500,
    images: ["/gideon-troopers.png"], // Removed spaces
  },
  {
    id: "bethel-splendor",
    name: "Bethel Splendor Hall",
    type: "CLASSIC",
    price: 500000,
    occupants: 4,
    capacity: 500,
    images: ["/bethel-splendor.png"], // Removed spaces
  },
  {
    id: "samuel-akande",
    name: "Samuel Akande Hall",
    type: "CLASSIC",
    price: 500000,
    occupants: 4,
    capacity: 500,
    images: ["/samuel-akande.png"], // Removed spaces
  },
  {
    id: "nelson-mandela",
    name: "Nelson Mandela Hall",
    type: "CLASSIC",
    price: 500000,
    occupants: 4,
    capacity: 500,
    images: ["/nelson-mandela.png"], // Removed spaces
  },
  {
    id: "welch-hall",
    name: "Welch Hall",
    type: "PREMIUM",
    price: 400000,
    occupants: 4,
    capacity: 400,
    images: ["/welch-hall.png"], // Removed spaces
  },
  {
    id: "topaz-hall",
    name: "Topaz Hall",
    type: "PREMIUM",
    price: 600000,
    occupants: 5,
    capacity: 600,
    images: ["/topaz-hall.png"], // Removed spaces
  },
  {
    id: "emerald-classic",
    name: "Emerald Hall",
    type: "CLASSIC",
    price: 1000000,
    occupants: 6,
    capacity: 600,
    images: ["/emerald-hall.png"], // Fixed spelling (Emrald -> emerald) and spaces
  },
  {
    id: "emerald-classic-plus",
    name: "Emerald Hall",
    type: "CLASSIC+",
    price: 1000000,
    occupants: 4,
    capacity: 400,
    images: ["/emerald-hall.png"], // Fixed spelling and spaces
  },
  {
    id: "gamaliel",
    name: "Gamaliel Hall",
    type: "CLASSIC",
    price: 450000,
    occupants: 4,
    capacity: 450,
    images: ["/gamaliel.png"],
  },
];

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  CLASSIC: { bg: "bg-[#cac2ff]", text: "text-[#2b1664]" },
  PREMIUM: { bg: "bg-[#c2d6ff]", text: "text-[#162664]" },
  "CLASSIC+": { bg: "bg-[#c2f5e9]", text: "text-[#164564]" },
};

function formatPrice(price: number): string {
  return `₦${price.toLocaleString()}`;
}

interface SelectResidenceProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SelectResidence({ selectedId, onSelect }: SelectResidenceProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHalls = RESIDENCE_HALLS.filter((hall) =>
    hall.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-[1200px] md:h-[90%] h-[78vh] flex flex-col gap-5">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[20px] md:text-[24px] font-bold text-[#0a0d14] tracking-tight leading-[24px]">
          Select your preferred residence
        </h2>
        {/* Search (desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-white rounded-[8px] px-3 py-2 w-[320px]">
          <Search className="w-5 h-5 text-[#868c98] shrink-0" />
          <input
            type="text"
            placeholder="Find your halls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-[14px] text-[#0a0d14] placeholder:text-[#525866] outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden flex items-center gap-2 bg-[#f6f8fa] rounded-[10px] px-3 py-2.5">
        <Search className="w-5 h-5 text-[#868c98] shrink-0" />
        <input
          type="text"
          placeholder="Find your halls..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 text-[14px] text-[#0a0d14] placeholder:text-[#525866] outline-none bg-transparent"
        />
      </div>

      {/* Card Grid */}
      <div className="md:overflow-y-scroll md:h-[70vh] overflow-y-auto ">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ">
          {filteredHalls.map((hall) => {
            const isSelected = selectedId === hall.id;

            if (hall.type === "OFF_CAMPUS") {
              return (
                <div
                  key={hall.id}
                  className={cn(
                    "bg-white rounded-[10px] overflow-hidden flex flex-col gap-2 pt-2 px-2 pb-3 transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#e5ecfc] border border-[#003cbb]"
                      : "shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] hover:shadow-md"
                  )}
                  onClick={() => onSelect(hall.id)}
                >
                  {/* Image Carousel */}
                  <ImageCarousel
                    images={hall.images}
                    alt={hall.name}
                    className="h-[120px] md:h-[182px] w-full"
                  />

                  <div className="flex flex-col gap-2 px-1">
                    <p className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] leading-tight">
                      {hall.name}
                    </p>
                    <button
                      className="bg-[#e5ecfc] text-[#375dfb] rounded-[10px] px-3 py-2.5 text-[14px] font-medium flex items-center justify-center gap-1 hover:bg-[#dbe5fc] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Fill Off Campus Form
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 bg-[#003cbb] rounded-br-[8px] p-1">
                      <div className="w-5 h-5 rounded-[4px] bg-[#ebf1ff] flex items-center justify-center shadow-[inset_0px_2px_2px_0px_rgba(22,38,100,0.32)]">
                        <Check className="w-3 h-3 text-[#003cbb]" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            const badge = BADGE_STYLES[hall.type] || BADGE_STYLES.CLASSIC;

            return (
              <div
                key={hall.id}
                className={cn(
                  "relative bg-white rounded-[10px] border border-[#f5f5f5] overflow-hidden flex flex-col gap-2 pt-2 px-2 pb-3 transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#e5ecfc] border border-[#003cbb]"
                    : "shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] hover:shadow-md"
                )}
                onClick={() => onSelect(hall.id)}
              >
                {/* Image Carousel */}
                <ImageCarousel
                  images={hall.images}
                  alt={hall.name}
                  className="h-[120px] md:h-[152px] w-full"
                />

                <div className="flex flex-col gap-2 px-1">
                  {/* Hall Name */}
                  <p className="text-[16px] md:text-[18px] font-semibold text-[#0a0d14] leading-tight truncate">
                    {hall.name}
                  </p>

                  {/* Badge + Price */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider leading-[12px]",
                      badge.bg,
                      badge.text
                    )}>
                      {hall.type === "CLASSIC+" ? "Classic+" : hall.type}
                    </span>
                    <span className="text-[14px] md:text-[16px] font-bold text-[#003cbb] tracking-tight">
                      {formatPrice(hall.price)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] md:text-[12px] text-[#525866] leading-[16px]">No. in a room</span>
                      <span className="text-[12px] md:text-[14px] font-medium text-[#0a0d14] leading-[20px]">{hall.occupants} occupants</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] md:text-[12px] text-[#525866] leading-[16px]">Available capacity</span>
                      <span className="text-[12px] md:text-[14px] font-medium text-[#0a0d14] leading-[20px]">{hall.capacity}</span>
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-0 left-0 bg-[#003cbb] rounded-br-[8px] p-1">
                    <div className="w-5 h-5 rounded-[4px] bg-[#ebf1ff] flex items-center justify-center shadow-[inset_0px_2px_2px_0px_rgba(22,38,100,0.32)]">
                      <Check className="w-3 h-3 text-[#003cbb]" strokeWidth={3} />
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
