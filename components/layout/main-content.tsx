"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide mobile nav on semester-results detail pages and courses view
  const hideMobileNav = 
    pathname.includes('/academic-details/semester-results') || 
    pathname.includes('/academic-details/courses') ||
    pathname.includes('/registration/courses') ||
    pathname.includes('/dashboard/finance/fees');

  return (
    <main className={cn(
      "flex-1 overflow-y-auto relative",
      hideMobileNav ? "pb-4 md:pb-8 pt-0 md:pt-6" : "pb-24 md:pb-8 pt-6"
    )}>
      {children}
    </main>
  );
}
