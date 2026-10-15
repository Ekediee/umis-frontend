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
    pathname.includes('/dashboard/finance/fees') ||
    pathname.includes('/dashboard/finance/fees/payment');

  // The campus map fills the whole content area edge to edge.
  const fullBleed = pathname.startsWith('/campus-map');

  return (
    <main className={cn(
      "flex-1 min-h-0 relative",
      fullBleed
        ? "overflow-hidden pb-[84px] md:pb-0"
        : cn("overflow-y-auto", hideMobileNav ? "pb-4 md:pb-8 pt-0 md:pt-6" : "pb-24 md:pb-8 pt-6")
    )}>
      {children}
    </main>
  );
}
