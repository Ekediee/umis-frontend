"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Atom,
  Award,
  BookOpen,
  FlaskConical,
  Globe,
  GraduationCap,
  Lightbulb,
  Microscope,
  Pencil,
  Ruler,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

// ---------------------------------------------------------------------------
// Floating doodles
// ---------------------------------------------------------------------------

type Doodle =
  | { kind: "icon"; Icon: ComponentType<{ className?: string; strokeWidth?: number; size?: number }>; size: number }
  | { kind: "text"; text: string; size: number };

interface PlacedDoodle {
  doodle: Doodle;
  /** CSS position within the parent, e.g. { top: "8%", left: "4%" }. */
  pos: { top?: string; bottom?: string; left?: string; right?: string };
  rotate: number;
  /** Hidden below `md` to keep small screens uncluttered. */
  desktopOnly?: boolean;
}

const icon = (Icon: Extract<Doodle, { kind: "icon" }>["Icon"], size = 44): Doodle => ({ kind: "icon", Icon, size });
const formula = (text: string, size = 22): Doodle => ({ kind: "text", text, size });

const DOODLE_SETS: Record<"features" | "portals" | "impact", PlacedDoodle[]> = {
  features: [
    { doodle: icon(GraduationCap, 56), pos: { top: "6%", left: "3%" }, rotate: -12 },
    { doodle: formula("E = mc²"), pos: { top: "10%", right: "6%" }, rotate: 8 },
    { doodle: icon(Atom, 48), pos: { top: "38%", right: "2%" }, rotate: 14, desktopOnly: true },
    { doodle: formula("a² + b² = c²", 20), pos: { top: "46%", left: "1.5%" }, rotate: -6, desktopOnly: true },
    { doodle: icon(Pencil, 38), pos: { bottom: "22%", left: "6%" }, rotate: 30, desktopOnly: true },
    { doodle: icon(Lightbulb, 42), pos: { bottom: "10%", right: "8%" }, rotate: -10 },
  ],
  portals: [
    { doodle: icon(BookOpen, 50), pos: { top: "2%", left: "5%" }, rotate: -8 },
    { doodle: formula("∫ f(x) dx", 24), pos: { top: "3%", right: "7%" }, rotate: 6 },
    { doodle: icon(Microscope, 44), pos: { top: "30%", left: "0.5%" }, rotate: 10, desktopOnly: true },
    { doodle: formula("π ≈ 3.14159", 20), pos: { top: "52%", right: "0.5%" }, rotate: -8, desktopOnly: true },
    { doodle: icon(FlaskConical, 44), pos: { bottom: "18%", left: "1%" }, rotate: -14, desktopOnly: true },
    { doodle: icon(Globe, 46), pos: { bottom: "4%", right: "3%" }, rotate: 12, desktopOnly: true },
  ],
  impact: [
    { doodle: formula("Σ xᵢ / n", 22), pos: { top: "8%", left: "6%" }, rotate: -8 },
    { doodle: icon(Ruler, 44), pos: { top: "12%", right: "5%" }, rotate: 38 },
    { doodle: formula("H₂O", 22), pos: { bottom: "12%", left: "3%" }, rotate: 10, desktopOnly: true },
    { doodle: icon(Award, 44), pos: { bottom: "8%", right: "4%" }, rotate: -10, desktopOnly: true },
  ],
};

/**
 * Faint, gently floating line-art (icons + handwritten formulas) that sits
 * behind section content. Purely decorative: aria-hidden and non-interactive.
 */
export function EduDoodles({ set }: { set: keyof typeof DOODLE_SETS }) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 select-none">
      {DOODLE_SETS[set].map(({ doodle, pos, rotate, desktopOnly }, i) => (
        <motion.div
          key={i}
          style={pos}
          className={`absolute text-[#155DFC]/[0.14] dark:text-white/[0.08] ${desktopOnly ? "hidden md:block" : ""}`}
          initial={{ opacity: 0, rotate }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [rotate, rotate + 4, rotate] }}
          transition={{
            opacity: { duration: 0.8, delay: i * 0.1 },
            y: { duration: 6 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.4 },
            rotate: { duration: 8 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.4 },
          }}
        >
          {doodle.kind === "icon" ? (
            <doodle.Icon strokeWidth={1.25} size={doodle.size} className="block" />
          ) : (
            <span
              className="font-serif italic font-medium whitespace-nowrap"
              style={{ fontSize: doodle.size }}
            >
              {doodle.text}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notebook paper backdrop
// ---------------------------------------------------------------------------

/** Ruled exercise-book lines with a red margin, faded out towards the edges. */
export function NotebookBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 opacity-60 dark:opacity-30"
      style={{
        backgroundImage: [
          // Margin line
          "linear-gradient(to right, transparent calc(8% - 1px), rgba(239,68,68,0.18) calc(8% - 1px), rgba(239,68,68,0.18) 8%, transparent 8%)",
          // Ruled lines
          "repeating-linear-gradient(to bottom, transparent 0, transparent 35px, rgba(21,93,252,0.08) 35px, rgba(21,93,252,0.08) 36px)",
        ].join(", "),
        maskImage: "radial-gradient(ellipse 75% 65% at 50% 45%, black 20%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 45%, black 20%, transparent 80%)",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Section eyebrow
// ---------------------------------------------------------------------------

export function SectionEyebrow({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-flex items-center gap-2 rounded-full border border-[#155DFC]/15 bg-[#EEF3FF] dark:bg-[#155DFC]/10 dark:border-[#155DFC]/25 px-3.5 py-1.5 mb-5 text-xs font-semibold tracking-wide text-[#155DFC] dark:text-[#8FB0FF]"
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
    </motion.div>
  );
}
