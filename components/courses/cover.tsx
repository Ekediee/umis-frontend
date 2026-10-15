import { cn } from "@/lib/utils";

/**
 * Course cover colours. Six brand-adjacent gradients, picked by a stable hash
 * of the course code (CourseSpace.tone), so a course keeps its colour
 * everywhere: list card, header, Today and the study timer.
 */
export const COVERS = [
  "from-[#003cbb] via-[#1d4ed8] to-[#3b82f6]",
  "from-[#3730a3] via-[#4f46e5] to-[#7c3aed]",
  "from-[#065f46] via-[#047857] to-[#10b981]",
  "from-[#075985] via-[#0369a1] to-[#0ea5e9]",
  "from-[#6b21a8] via-[#9333ea] to-[#c026d3]",
  "from-[#92400e] via-[#b45309] to-[#f59e0b]",
] as const;

/** Solid accent per cover, for small marks (dots, bars) that must stay readable. */
export const COVER_ACCENT = ["#003cbb", "#4f46e5", "#047857", "#0369a1", "#9333ea", "#b45309"] as const;

export function CoverSurface({ tone, className, children }: { tone: number; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br text-white", COVERS[tone % COVERS.length], className)}>
      {/* Soft light and a fine dot grid give the cover depth without an image */}
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/15 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
