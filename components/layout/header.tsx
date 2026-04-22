"use client"

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Bell, MoreVertical, Settings, User, Download, FileText, CalendarClock } from "lucide-react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const getTitle = () => {
    if (pathname?.includes('/finance/receipt')) return "Payment";
    if (pathname?.includes('/finance')) return "Finance";
    if (pathname?.includes('/academic-details')) return "Academic Details";
    return "Dashboard";
  };

  const handleClickOutside = useCallback((event: MouseEvent | TouchEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [handleClickOutside]);

  const renderMobileMenuItems = () => {
    if (pathname?.includes('/academic-details')) {
      return (
        <>
          <Link href="#" className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 border-b border-gray-50 last:border-0">
            <FileText className="w-[18px] h-[18px] text-gray-400" /> Export Transcript
          </Link>
          <Link href="#" className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 border-b border-gray-50 last:border-0">
            <CalendarClock className="w-[18px] h-[18px] text-gray-400" /> Academic Calendar
          </Link>
        </>
      );
    }
    if (pathname?.includes('/finance')) {
      return (
        <>
          <Link href="#" className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 border-b border-gray-50 last:border-0">
            <Download className="w-[18px] h-[18px] text-gray-400" /> Download Receipts
          </Link>
          <Link href="#" className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 border-b border-gray-50 last:border-0">
            <Settings className="w-[18px] h-[18px] text-gray-400" /> Payment Settings
          </Link>
        </>
      );
    }
    return (
      <>
        <Link href="#" className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 border-b border-gray-50 last:border-0">
          <User className="w-[18px] h-[18px] text-gray-400" /> My Profile
        </Link>
        <Link href="#" className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 border-b border-gray-50 last:border-0">
          <Settings className="w-[18px] h-[18px] text-gray-400" /> Account Settings
        </Link>
      </>
    );
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex h-[76px] border-b bg-white items-center justify-between px-8 shrink-0 relative z-10">
        <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight">{getTitle()}</h2>
        <div className="flex items-center gap-5 text-gray-400">
          <button className="hover:text-gray-900 transition-colors p-1">
            <Search className="w-5 h-5 text-gray-500" strokeWidth={2} />
          </button>
          <button className="hover:text-gray-900 transition-colors relative p-1">
            <Bell className="w-5 h-5 text-gray-500" strokeWidth={2} />
            <span className="absolute top-[3px] right-[4px] w-[7px] h-[7px] bg-white rounded-full flex items-center justify-center">
              <span className="w-[5px] h-[5px] bg-red-500 rounded-full border border-white"></span>
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden h-[64px] border-b bg-white flex items-center justify-between px-4 shrink-0 relative z-50">
        {/* Left: Avatar with Badge */}
        <div className="relative z-10">
          <button type="button" className="p-1 touch-manipulation">
            <Avatar className="w-9 h-9 border border-gray-100">
              <AvatarFallback className="bg-blue-50 text-blue-600 font-medium text-xs">AT</AvatarFallback>
              <AvatarImage src="https://i.pravatar.cc/150?u=arthur" alt="Arthur Taylor" />
            </Avatar>
          </button>
          <span className="absolute bottom-[4px] right-[0px] w-[14px] h-[14px] bg-[#3454D1] border-[2px] border-white rounded-full flex items-center justify-center pointer-events-none">
             <span className="w-1 h-1 bg-white rounded-full opacity-80"></span>
          </span>
        </div>

        {/* Center: Title */}
        <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight absolute left-1/2 -translate-x-1/2 pointer-events-none">
          {getTitle()}
        </h2>

        {/* Right: Actions Menu */}
        <div className="relative z-10" ref={menuRef}>
          <button 
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-11 h-11 flex items-center justify-center text-gray-600 rounded-full active:bg-gray-100 transition-colors touch-manipulation"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-[calc(100%+4px)] right-0 w-52 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-gray-100 py-1 overflow-hidden origin-top-right">
              {renderMobileMenuItems()}
            </div>
          )}
        </div>
      </header>
    </>
  );
}

