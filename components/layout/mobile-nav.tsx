"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Academics", href: "/academic-details", icon: BookOpen },
  { title: "Register", href: "#", icon: Settings },
  { title: "Finance", href: "/dashboard/finance", icon: Wallet },
];

export function MobileNav() {
  const pathname = usePathname();

  // Hide mobile nav on semester-results detail pages and courses view
  const isHidden = 
    pathname.includes('/academic-details/semester-results') || 
    pathname.includes('/academic-details/courses');

  if (isHidden) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[84px] bg-white border-t flex items-center justify-around px-4 z-50 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
        return (
          <Link 
            key={item.title} 
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-[4px] w-16 h-14 transition-all rounded-2xl",
              isActive ? "text-[#003cbb]" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <div className={cn(
               "flex items-center justify-center w-12 h-8 rounded-full transition-colors",
               isActive ? "bg-[#003cbb] text-white" : ""
            )}>
               <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={cn(
              "text-[10px]",
              isActive ? "font-bold text-[#003cbb]" : "font-medium"
            )}>{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
