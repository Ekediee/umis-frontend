"use client";

import { X, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

interface MobilePageMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const menuItems = [
  { id: "results", title: "View Semester Results", href: "/academic-details/semester-results" },
  { id: "current", title: "View Current Semester Course", href: "/academic-details/courses?tab=current" },
  { id: "carryover", title: "View Carry Over Course", href: "/academic-details/courses?tab=carry-over" },
  { id: "repeated", title: "View Repeated Course", href: "/academic-details/courses?tab=repeated" },
  { id: "transcript", title: "Export Unofficial Transcript", href: "/academic-details/transcript" },
];

export function MobilePageMenuSheet({ isOpen, onClose, title = "Quick Actions" }: MobilePageMenuSheetProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity animate-in fade-in duration-200 md:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-50 flex flex-col pt-3 pb-8 px-5 md:hidden animate-in slide-in-from-bottom-full duration-300">
        {/* Drag indicator */}
        <div className="w-10 h-1.5 bg-[#e2e4e9] rounded-full mx-auto mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-semibold text-[#0a0d14]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-[#0a0d14]" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col mt-2">
          {/* Theme Toggle Item */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-between w-full py-4 text-[15px] font-medium transition-colors border-b border-transparent rounded-[8px] px-3 -mx-3 text-[#525866] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
          {menuItems.map((item) => {
            // Very basic active check: If pathname starts with the base href
            const baseHref = item.href.split('?')[0];
            const isActive = pathname.startsWith(baseHref) && 
              // Avoid matching "/academic-details/courses" strictly if we are on results
              !(baseHref === "/academic-details/courses" && pathname.includes('results'));

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "py-4 text-[15px] font-medium transition-colors border-b border-transparent rounded-[8px] px-3 -mx-3",
                  isActive 
                    ? "bg-[#eef3fd] text-[#0a0d14]" 
                    : "text-[#525866] hover:bg-gray-50 active:bg-gray-100"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
