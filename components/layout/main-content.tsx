"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide mobile nav on semester-results detail pages and courses view
  const hideMobileNav = 
    pathname.includes('/academic-details/semester-results') || 
    pathname.includes('/academic-details/courses');

  return (
    <main className={cn(
      "flex-1 overflow-y-auto md:pb-8 pt-6 relative",
      hideMobileNav ? "pb-4" : "pb-24"
    )}>
      {children}
    </main>
  );
}
