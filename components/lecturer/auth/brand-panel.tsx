"use client";

/**
 * Sign-in brand panel: the Pulse logomark, an animated pulse line and a live
 * preview of the lecturer's Today screen, so the first thing staff see is the
 * product itself. All motion is skipped when the user prefers reduced motion.
 */

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck2, ClipboardCheck, Clock3, FileText, GraduationCap, Megaphone, ScanLine, Undo2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** The logomark on a white tile, so its blue and gold read on any background. */
export function PulseMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_6px_20px_-8px_rgba(0,30,90,0.45)] ring-1 ring-black/5", className)} style={{ width: size, height: size }}>
      <Image src="/images/bu-pulse-logomark.svg" alt="" width={33} height={48} priority className="h-[64%] w-auto" />
    </span>
  );
}

/** Heartbeat line drawn across the panel. */
function PulseLine() {
  const reduce = useReducedMotion();
  const d = "M0 60 H120 L140 60 L152 22 L168 98 L182 40 L192 60 H330 L346 60 L356 34 L368 84 L378 60 H600";
  return (
    <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-16 h-[90px] w-full opacity-70" aria-hidden>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <motion.path
        d={d}
        fill="none"
        stroke="url(#pulse-glow)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 0.6 : 0 }}
        animate={reduce ? undefined : { pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.6 }}
      />
      <defs>
        <linearGradient id="pulse-glow" x1="0" x2="1">
          <stop offset="0" stopColor="#7DD3FC" stopOpacity="0" />
          <stop offset="0.5" stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#FDE68A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Floating({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: [0, -6, 0] }}
      transition={reduce ? undefined : { opacity: { duration: 0.5, delay }, y: { duration: 6, delay, repeat: Infinity, ease: "easeInOut" } }}
    >
      {children}
    </motion.div>
  );
}

const NEEDS_YOU = [
  { icon: ClipboardCheck, title: "14 registrations to approve", meta: "Closes 18 Oct", tone: "text-sky-200" },
  { icon: FileText, title: "3 chapters to review", meta: "Oldest 6 days", tone: "text-amber-200" },
  { icon: Undo2, title: "COSC333 grades returned", meta: "2 rows to fix", tone: "text-rose-200" },
];

const FEATURES: { icon: LucideIcon; title: string; body: string; tint: string }[] = [
  { icon: GraduationCap, title: "Grades and CA", body: "Enter scores, import from Excel, submit checked sheets", tint: "bg-emerald-400/20 text-emerald-200" },
  { icon: CalendarCheck2, title: "Attendance", body: "Show a code, tick a list or snap the signed sheet", tint: "bg-sky-400/20 text-sky-200" },
  { icon: ClipboardCheck, title: "Course advising", body: "Approve or return registrations with a reason", tint: "bg-blue-300/20 text-blue-100" },
  { icon: FileText, title: "Supervision", body: "Comment on chapters and approve them in place", tint: "bg-purple-400/20 text-purple-200" },
  { icon: Megaphone, title: "Materials and Q&A", body: "Share slides by week, post notes, answer questions", tint: "bg-amber-300/20 text-amber-100" },
  { icon: Clock3, title: "Office hours", body: "Students book slots; clashes with classes are blocked", tint: "bg-teal-300/20 text-teal-100" },
];

/** What lecturers can do in Pulse, as glass tiles. */
function FeatureGrid() {
  const reduce = useReducedMotion();
  return (
    <ul className="grid max-w-[560px] grid-cols-2 gap-2.5" aria-label="What you can do in Pulse">
      {FEATURES.map(({ icon: Icon, title, body, tint }, i) => (
        <motion.li
          key={title}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
          className="flex items-start gap-3 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/12 backdrop-blur-sm transition-colors hover:bg-white/[0.12]"
        >
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tint)}>
            <Icon className="size-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] leading-tight font-semibold text-white">{title}</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-white/65 [@media(max-height:780px)]:hidden">{body}</span>
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

/** Glass preview of the Today screen (illustrative copy, not live data). */
function TodayPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]" aria-hidden>
      <Floating className="relative z-10 rounded-[24px] bg-white/12 p-5 ring-1 ring-white/20 backdrop-blur-md">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-300 motion-reduce:animate-none" /> Next class · in 48 min
        </p>
        <p className="mt-3 text-[26px] leading-none font-bold tracking-tight">10:00 am</p>
        <p className="mt-1.5 text-[13px] font-semibold text-white/90">SEN 201 · Group A</p>
        <p className="text-[12px] text-white/65">Hall 2, Science and Technology Complex</p>
        <span className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-[12px] font-bold text-[#003cbb]">
          <ScanLine className="size-4" /> Take attendance
        </span>
      </Floating>

      <Floating delay={0.35} className="relative z-20 -mt-4 ml-8 rounded-[20px] bg-white p-4 text-gray-900 shadow-[0_24px_48px_-20px_rgba(0,20,70,0.6)]">
        <p className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-wider text-gray-400 uppercase">
          Needs you <span className="rounded-full bg-red-500 px-1.5 text-[10px] text-white">3</span>
        </p>
        <ul className="flex flex-col gap-2.5">
          {NEEDS_YOU.map(({ icon: Icon, title, meta }) => (
            <li key={title} className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#eef3fd] text-[#003cbb]">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{title}</span>
                <span className="block text-[11px] text-gray-500">{meta}</span>
              </span>
            </li>
          ))}
        </ul>
      </Floating>
    </div>
  );
}

export function BrandPanel() {
  return (
    <aside className="relative hidden w-[48%] max-w-[680px] sticky top-0 h-dvh flex-col justify-between gap-6 overflow-hidden bg-gradient-to-br from-[#001f66] via-[#003cbb] to-[#1d4ed8] p-10 text-white lg:flex xl:p-12">
      {/* Soft light + dot grid */}
      <div className="pointer-events-none absolute -top-32 -right-24 size-[460px] rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 size-[420px] rounded-full bg-amber-200/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <PulseLine />

      <div className="relative flex items-center gap-3">
        <PulseMark size={44} />
        <div>
          <p className="text-[16px] leading-tight font-bold">BU Pulse</p>
          <p className="text-[12px] text-white/70">Babcock University · Lecturer</p>
        </div>
      </div>

      <div className="relative">
        <h1 className="max-w-[460px] text-[38px] leading-[1.08] font-bold tracking-tight xl:text-[44px]">
          Your week, <span className="bg-gradient-to-r from-sky-200 to-amber-200 bg-clip-text text-transparent">not a wall of tables.</span>
        </h1>
        <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-white/75 [@media(max-height:640px)]:hidden">Teach, assess, approve and supervise from one screen that shows what needs you today.</p>
        <div className="mt-8 [@media(max-height:780px)]:mt-5">
          <FeatureGrid />
        </div>
        <div className="mt-8 hidden [@media(min-height:1100px)]:block">
          <TodayPreview />
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-4 text-[12px] text-white/60">
        <span>One record for teaching, grading and approvals.</span>
        <span className="shrink-0">© {new Date().getFullYear()} Babcock University</span>
      </div>
    </aside>
  );
}
