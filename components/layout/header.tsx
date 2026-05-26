"use client"

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Bell, MoreVertical, X, BookOpen, Headphones, Sun, Moon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { useNotifications } from "@/components/providers/notification-provider";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
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
      <header className="hidden md:flex h-[76px] border-b dark:border-gray-800 bg-white dark:bg-gray-900 items-center justify-between px-8 shrink-0 relative z-10 transition-colors duration-200">
        <h2 className="text-[20px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{getTitle()}</h2>
        <div className="flex items-center gap-5 text-gray-400 dark:text-gray-500">
          <ThemeToggle />
          <button className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors p-1">
            <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" strokeWidth={2} />
          </button>
          <Link 
            href="/notifications"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors relative p-1 flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute top-[2px] right-[2px] min-w-[14px] h-[14px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white dark:border-gray-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

        </div>
      </header>

      {/* Mobile Header */}
      {!pathname?.includes('/registration/courses') && !pathname?.includes('/dashboard/finance/fees/payment') && (
        <header className="md:hidden h-[64px] border-b dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 shrink-0 relative z-50 transition-colors duration-200">
        {/* Left: Avatar with Badge */}
        <div className="relative z-10">
          <button type="button" className="p-1 touch-manipulation">
            <Avatar className="w-9 h-9 border border-gray-100 dark:border-gray-700">
              <AvatarFallback className="bg-[#f5f8fe] dark:bg-gray-800 text-[#003cbb] dark:text-[#4d82ff] font-medium text-xs">YJ</AvatarFallback>
              <AvatarImage src="/Student Image.png" alt="Yakubu Onome Joy" />
            </Avatar>
          </button>
          <span className="absolute bottom-[4px] right-[0px] w-[14px] h-[14px] bg-[#003cbb] border-[2px] border-white rounded-full flex items-center justify-center pointer-events-none">
             <span className="w-1 h-1 bg-white rounded-full opacity-80"></span>
          </span>
        </div>

        {/* Center: Title */}
        <h2 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight absolute left-1/2 -translate-x-1/2 pointer-events-none">
          {getTitle()}
        </h2>

        {/* Right: Bell + Three-Dot Menu */}
        <div className="flex items-center gap-1 z-10">
          <Link 
            href="/notifications"
            className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors touch-manipulation relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-[6px] right-[6px] min-w-[16px] h-[16px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-gray-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <button 
            type="button"
            onClick={() => setIsBottomSheetOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors touch-manipulation"
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
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-[24px] animate-in slide-in-from-bottom duration-300 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">{pathname?.includes('/academic-details') ? 'Quick Actions' : 'Options'}</h3>
              <button 
                onClick={() => setIsBottomSheetOpen(false)}
                className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Menu Items */}
            <div className="px-1 pb-8 flex flex-col gap-1">
              {/* Theme Toggle Item */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-between w-full px-5 py-4 text-[15px] font-medium text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800 transition-colors rounded-xl mx-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                  </div>
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </div>
                <div className={cn(
                  "w-11 h-6 rounded-full p-1 transition-colors duration-200",
                  theme === "dark" ? "bg-[#003cbb]" : "bg-gray-200 dark:bg-gray-700"
                )}>
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                    theme === "dark" ? "translate-x-5" : "translate-x-0"
                  )} />
                </div>
              </button>
              
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-5" />

              {pathname?.includes('/academic-details') ? (
                <>
                  <Link href="/academic-details/semester-results" onClick={() => setIsBottomSheetOpen(false)} className={`flex items-center px-5 py-4 text-[15px] font-medium rounded-xl mx-1 transition-colors ${pathname.endsWith('/semester-results') ? 'bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#0a0d14] dark:text-gray-100' : 'text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800'}`}>View Semester Results</Link>
                  <Link href="/academic-details/courses?tab=current" onClick={() => setIsBottomSheetOpen(false)} className={`flex items-center px-5 py-4 text-[15px] font-medium rounded-xl mx-1 transition-colors ${pathname.includes('tab=current') ? 'bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#0a0d14] dark:text-gray-100' : 'text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800'}`}>View Current Semester Course</Link>
                  <Link href="/academic-details/courses?tab=carry-over" onClick={() => setIsBottomSheetOpen(false)} className={`flex items-center px-5 py-4 text-[15px] font-medium rounded-xl mx-1 transition-colors ${pathname.includes('tab=carry-over') ? 'bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#0a0d14] dark:text-gray-100' : 'text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800'}`}>View Carry Over Course</Link>
                  <Link href="/academic-details/courses?tab=repeated" onClick={() => setIsBottomSheetOpen(false)} className={`flex items-center px-5 py-4 text-[15px] font-medium rounded-xl mx-1 transition-colors ${pathname.includes('tab=repeated') ? 'bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#0a0d14] dark:text-gray-100' : 'text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800'}`}>View Repeated Course</Link>
                  <Link href="/academic-details/transcript" onClick={() => setIsBottomSheetOpen(false)} className={`flex items-center px-5 py-4 text-[15px] font-medium rounded-xl mx-1 transition-colors ${pathname.includes('/transcript') ? 'bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#0a0d14] dark:text-gray-100' : 'text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800'}`}>Export Unofficial Transcript</Link>
                </>
              ) : (
                <>
                  <Link 
                    href="#" 
                    onClick={() => setIsBottomSheetOpen(false)}
                    className="flex items-center gap-3 px-5 py-4 text-[15px] font-medium text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800 transition-colors rounded-xl mx-1"
                  >
                    <BookOpen className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    Online exam
                  </Link>
                  <Link 
                    href="https://support.babcock.edu.ng/" 
                    target="_blank"
                    onClick={() => setIsBottomSheetOpen(false)}
                    className="flex items-center gap-3 px-5 py-4 text-[15px] font-medium text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800 transition-colors rounded-xl mx-1"
                  >
                    <Headphones className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    Support
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
