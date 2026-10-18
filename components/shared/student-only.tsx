"use client";

import { usePathname } from "next/navigation";

/** Renders children everywhere except the lecturer portal (e.g. the student AI chat). */
export function StudentOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/lecturer")) return null;
  return <>{children}</>;
}
