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

// Data interface — structured for future API integration
export interface WorshipCenter {
  id: string;
  name: string;
  location: string;
  pastor: string;
  spacesLeft: number;
}

// Mock data from Figma
const WORSHIP_CENTERS: WorshipCenter[] = [
  { id: "beula", name: "Beula Chapel", location: "Platinum Hall Auditorium", pastor: "Emmanuel Enyigare", spacesLeft: 144 },
  { id: "canaan-land", name: "Canaan Land Chapel", location: "Nelson Mandela Auditorium", pastor: "Olugbenga Idowu", spacesLeft: 185 },
  { id: "christ-foundation", name: "Christ Our Foundation Church", location: "Law Activity Hall Iperu Campus", pastor: "Emereonye Ndubuisi M.", spacesLeft: 155 },
  { id: "covenant", name: "Covenant Chapel", location: "White Hall Auditorium", pastor: "Gambo Daudu", spacesLeft: 43 },
  { id: "dominion", name: "Dominion Chapel", location: "Ogden Hall Auditorium", pastor: "Biague LaguBibiaiai", spacesLeft: 155 },
  { id: "glory-land", name: "Glory Land Chapel", location: "Winslow Hall", pastor: "G.I. Okan-Sironiko", spacesLeft: 141 },
  { id: "grace", name: "Grace Chapel", location: "WRA", pastor: "Chukwuemeka Abaribe", spacesLeft: 203 },
  { id: "heir-kingdom", name: "Heir of the Kingdom Chapel", location: "BUTH 600 Seater", pastor: "John Sotunsa", spacesLeft: 128 },
  { id: "heritage", name: "Heritage Church", location: "Old Cafeteria", pastor: "Adeoti J.A.F", spacesLeft: 152 },
  { id: "holy-spirit", name: "Holy Spirit Chapel", location: "New Auditorium", pastor: "Sarah Omoniyi", spacesLeft: 170 },
  { id: "living-faith", name: "Living Faith Chapel", location: "Community Center", pastor: "Emeka Ndukwu", spacesLeft: 200 },
  { id: "mountain-fire", name: "Mountain of Fire Chapel", location: "Faith Hall", pastor: "Chinonso Okeke", spacesLeft: 110 },
  { id: "new-beginning", name: "New Beginning Chapel", location: "Heritage Auditorium", pastor: "Sola Ogunyinka", spacesLeft: 163 },
  { id: "victory", name: "Victory Chapel", location: "The Great Hall", pastor: "Tunde Afolabi", spacesLeft: 125 },
];

// Export for use in summary
export { WORSHIP_CENTERS };

const ITEMS_PER_PAGE = 10;

interface SelectWorshipCenterProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SelectWorshipCenter({ selectedId, onSelect }: SelectWorshipCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() =>
    WORSHIP_CENTERS.filter((wc) =>
      wc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wc.pastor.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]
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
    <div className="w-full max-w-[1200px] md:h-[90%] h-[78vh] flex flex-col gap-5">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[20px] md:text-[24px] font-bold text-[#0a0d14] tracking-tight leading-[24px]">
          Select your preferred worship center
        </h2>
        {/* Search (desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-white rounded-[8px] px-3 py-2 w-[320px] border border-gray-200">
          <Search className="w-5 h-5 text-[#868c98] shrink-0" />
          <input
            type="text"
            placeholder="Search chapels..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 text-[14px] text-[#0a0d14] placeholder:text-[#525866] outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden flex items-center gap-2 bg-[#f6f8fa] rounded-[10px] px-3 py-2.5">
        <Search className="w-5 h-5 text-[#868c98] shrink-0" />
        <input
          type="text"
          placeholder="Search chapels..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 text-[14px] text-[#0a0d14] placeholder:text-[#525866] outline-none bg-transparent"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden">
        <div className="rounded-[16px] overflow-hidden border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f2f4f7] hover:bg-[#f2f4f7] border-none">
                <TableHead className="w-[80px] pl-6"></TableHead>
                <TableHead className="text-[12px] font-bold text-[#525866] uppercase tracking-wider h-12">
                  Worship Center
                </TableHead>
                <TableHead className="text-[12px] font-bold text-[#525866] uppercase tracking-wider h-12">
                  Location on Campus
                </TableHead>
                <TableHead className="text-[12px] font-bold text-[#525866] uppercase tracking-wider h-12">
                  Pastor In Charge
                </TableHead>
                <TableHead className="text-[12px] font-bold text-[#525866] uppercase tracking-wider text-right pr-6 h-12">
                  Space Left
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedDesktop.map((wc) => {
                  const isSelected = selectedId === wc.id;
                  return (
                    <TableRow
                      key={wc.id}
                      className={cn(
                        "cursor-pointer hover:bg-gray-50/50 transition-colors",
                        isSelected && "bg-[#f8faff] hover:bg-[#f8faff]"
                      )}
                      onClick={() => onSelect(wc.id)}
                    >
                      <TableCell className="w-[80px] pl-6">
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected ? "border-[#003cbb]" : "border-[#cdd0d5]"
                        )}>
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#003cbb]" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-[#0a0d14] text-[14px]">
                          {wc.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#525866] text-[14px]">
                        {wc.location}
                      </TableCell>
                      <TableCell className="text-[#525866] text-[14px]">
                        {wc.pastor}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <span className="inline-flex bg-[#eef3fd] text-[#003cbb] font-bold text-[12px] px-3 py-1 rounded-[8px] tracking-wider">
                          {wc.spacesLeft}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {paginatedDesktop.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-[#525866]">
                      No worship centers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-[13px] text-[#525866]">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-[8px] border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-[#525866]" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-9 h-9 rounded-[8px] text-[13px] font-medium transition-colors",
                    currentPage === page
                      ? "bg-[#003cbb] text-white"
                      : "border border-gray-200 text-[#525866] hover:bg-gray-50"
                  )}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-[8px] border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-[#525866]" />
              </button>
            </div>

            <span className="text-[13px] text-[#525866]">
              {ITEMS_PER_PAGE}/page
            </span>
          </div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden flex flex-col gap-3 flex-1 overflow-y-auto">
        {filtered.map((wc) => {
          const isSelected = selectedId === wc.id;
          return (
            <div
              key={wc.id}
              onClick={() => onSelect(wc.id)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-[16px] cursor-pointer transition-all border",
                isSelected
                  ? "bg-[#e5ecfc] border-[#003cbb]"
                  : "bg-white border-gray-100"
              )}
            >
              {/* Radio */}
              <div className="pt-0.5">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected ? "border-[#003cbb]" : "border-[#cdd0d5]"
                )}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#003cbb]" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-[#0a0d14]">
                    {wc.name}
                  </span>
                  <span className="inline-flex bg-[#eef3fd] text-[#003cbb] font-bold text-[11px] px-2 py-0.5 rounded-[6px] shrink-0">
                    {wc.spacesLeft} left
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] text-[#525866]">
                    📍 {wc.location}
                  </span>
                  <span className="text-[13px] text-[#525866]">
                    👤 {wc.pastor}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-[#525866]">
            No worship centers found.
          </div>
        )}
      </div>
    </div>
  );
}
