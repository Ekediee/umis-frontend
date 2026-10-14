import { cn } from "@/lib/utils";

/** Standard page gutter: 16px on phones (360px-safe), roomier on desktop. */
export function Page({ children, className, wide }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn("mx-auto w-full px-4 py-5 md:px-8 md:py-8", wide ? "max-w-[1400px]" : "max-w-[1200px]", className)}>{children}</div>;
}
