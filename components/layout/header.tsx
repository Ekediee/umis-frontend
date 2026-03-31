"use client"

import { Search, Bell } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  
  const getTitle = () => {
    if (pathname?.includes('/finance')) return "Finance";
    return "Dashboard";
  };

  return (
    <header className="h-[76px] border-b bg-white flex items-center justify-between px-8 shrink-0 relative z-10">
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
  );
}
