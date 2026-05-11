"use client"

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Bell, MoreVertical, X, BookOpen, Headphones } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  
  const getTitle = () => {
    if (pathname?.includes('/finance/receipt')) return "Payment";
    if (pathname?.includes('/finance/fees')) return "Make Payment";
    if (pathname?.includes('/finance')) return "Finance";
    if (pathname?.includes('/academic-details')) return "Academic Details";
    if (pathname?.includes('/registration')) return "Registration";
    if (pathname?.includes('/profile')) return "Profile";
    if (pathname?.includes('/notifications')) return "Notifications";
    return "Dashboard";
  };

  // Close bottom sheet on route change
  useEffect(() => {
    setIsBottomSheetOpen(false);
  }, [pathname]);

  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (isBottomSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isBottomSheetOpen]);

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex h-[76px] border-b bg-white items-center justify-between px-8 shrink-0 relative z-10">
        <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight">{getTitle()}</h2>
        <div className="flex items-center gap-5 text-gray-400">
          <button className="hover:text-gray-900 transition-colors p-1">
            <Search className="w-5 h-5 text-gray-500" strokeWidth={2} />
          </button>
          <button 
            onClick={() => router.push('/notifications')}
            className="hover:text-gray-900 transition-colors relative p-1"
          >
            <Bell className="w-5 h-5 text-gray-500" strokeWidth={2} />
            <span className="absolute top-[3px] right-[4px] w-[7px] h-[7px] bg-white rounded-full flex items-center justify-center">
              <span className="w-[5px] h-[5px] bg-red-500 rounded-full border border-white"></span>
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      {!pathname?.includes('/registration/courses') && (
        <header className="md:hidden h-[64px] border-b bg-white flex items-center justify-between px-4 shrink-0 relative z-50">
        {/* Left: Avatar with Badge */}
        <div className="relative z-10">
          <button type="button" className="p-1 touch-manipulation">
            <Avatar className="w-9 h-9 border border-gray-100">
              <AvatarFallback className="bg-[#f5f8fe] text-[#003cbb] font-medium text-xs">YJ</AvatarFallback>
              <AvatarImage src="/Student Image.png" alt="Yakubu Onome Joy" />
            </Avatar>
          </button>
          <span className="absolute bottom-[4px] right-[0px] w-[14px] h-[14px] bg-[#003cbb] border-[2px] border-white rounded-full flex items-center justify-center pointer-events-none">
             <span className="w-1 h-1 bg-white rounded-full opacity-80"></span>
          </span>
        </div>

        {/* Center: Title */}
        <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight absolute left-1/2 -translate-x-1/2 pointer-events-none">
          {getTitle()}
        </h2>

        {/* Right: Bell + Three-Dot Menu */}
        <div className="flex items-center gap-1 z-10">
          <button 
            type="button"
            onClick={() => router.push('/notifications')}
            className="w-10 h-10 flex items-center justify-center text-gray-600 rounded-full active:bg-gray-100 transition-colors touch-manipulation relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-[8px] right-[10px] w-[6px] h-[6px] bg-red-500 rounded-full border border-white"></span>
          </button>
          <button 
            type="button"
            onClick={() => setIsBottomSheetOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-gray-600 rounded-full active:bg-gray-100 transition-colors touch-manipulation"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>
      )}

      {/* Mobile Bottom Sheet Modal */}
      {isBottomSheetOpen && (
        <div className="md:hidden fixed inset-0 z-[200]">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={() => setIsBottomSheetOpen(false)}
          />
          
          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] animate-in slide-in-from-bottom duration-300 pb-safe">
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="text-[17px] font-semibold text-gray-900">Options</h3>
              <button 
                onClick={() => setIsBottomSheetOpen(false)}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Menu Items */}
            <div className="px-1 pb-8">
              <Link 
                href="#" 
                onClick={() => setIsBottomSheetOpen(false)}
                className="flex items-center gap-3 px-5 py-4 text-[15px] font-medium text-gray-700 active:bg-gray-50 transition-colors rounded-xl mx-1"
              >
                <BookOpen className="w-5 h-5 text-gray-400" />
                Online exam
              </Link>
              <Link 
                href="#" 
                onClick={() => setIsBottomSheetOpen(false)}
                className="flex items-center gap-3 px-5 py-4 text-[15px] font-medium text-gray-700 active:bg-gray-50 transition-colors rounded-xl mx-1"
              >
                <Headphones className="w-5 h-5 text-gray-400" />
                Support
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
