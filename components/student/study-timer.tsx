"use client";

/**
 * "Start studying": the only reliable source of hours logged (see the
 * requirements plan). A sheet to pick a course and length, and a floating
 * pill that follows the student across pages until they stop.
 */

import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, Clock, Square, Timer, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { elapsedLabel, useStudyTimer } from "@/hooks/use-study-timer";
import { registeredCourses } from "@/lib/student/api";
import { flushStudyQueue, recordStudySession } from "@/lib/student/study-sync";
import { formatMinutes } from "@/lib/student/rules";
import type { SeedCourse } from "@/lib/student/mock/seed";
import { Btn, Sheet } from "./ui";

// ── Open-sheet store (any screen can call openStudySheet) ─────────────────────

const useStudySheet = create<{ open: boolean; courseId: string | null; set: (open: boolean, courseId?: string | null) => void }>((set) => ({
  open: false,
  courseId: null,
  set: (open, courseId = null) => set({ open, courseId }),
}));

export function openStudySheet(courseId?: string) {
  useStudySheet.getState().set(true, courseId ?? null);
}

const PRESETS: { label: string; hint: string; min: number | null }[] = [
  { label: "25 min", hint: "One focus block", min: 25 },
  { label: "50 min", hint: "Deep work", min: 50 },
  { label: "Open", hint: "Stop when you're done", min: null },
];

export async function stopAndLog() {
  const result = useStudyTimer.getState().stop();
  if (!result) {
    toast.message("Session discarded", { description: "Sessions under a minute aren't logged." });
    return;
  }
  const sent = await recordStudySession(result);
  toast.success(`Logged ${formatMinutes(result.minutes)} of ${result.courseId}`, {
    description: sent ? "Added to this week's insights." : "Saved on this device. It will sync when you're back online.",
  });
}

function StartStudySheet() {
  const { open, courseId: preset, set } = useStudySheet();
  const start = useStudyTimer((s) => s.start);
  const [courses, setCourses] = useState<SeedCourse[] | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [length, setLength] = useState<number | null>(25);

  useEffect(() => {
    if (!open) return;
    registeredCourses().then((c) => {
      setCourses(c);
      setCourseId((prev) => preset ?? prev ?? c[0]?.courseId ?? null);
    });
  }, [open, preset]);

  const close = () => set(false);

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Start studying"
      footer={
        <Btn
          className="w-full"
          icon={Timer}
          disabled={!courseId}
          onClick={() => {
            if (!courseId) return;
            start(courseId, length);
            close();
            toast.success(`Timer started for ${courseId}`, { description: length ? `We'll let you know when your ${length} minutes are up.` : "Stop it from the timer at the bottom of the screen." });
          }}
        >
          Start timer
        </Btn>
      }
    >
      <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-5">Time you log here counts toward your weekly insights and study streak. Class time is tracked separately by check-ins.</p>

      <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Course</p>
      <div className="flex flex-col gap-2 mb-6" role="radiogroup" aria-label="Course">
        {!courses &&
          Array.from({ length: 3 }, (_, i) => <div key={i} className="h-14 rounded-[14px] bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        {courses?.map((c) => {
          const active = c.courseId === courseId;
          return (
            <button
              key={c.courseId}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setCourseId(c.courseId)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[14px] border text-left transition-colors",
                active ? "border-[#003cbb] dark:border-[#4d82ff] bg-[#f5f8fe] dark:bg-[#003cbb]/15" : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60",
              )}
            >
              <BookOpen className={cn("w-4 h-4 shrink-0", active ? "text-[#003cbb] dark:text-[#4d82ff]" : "text-gray-400")} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-gray-900 dark:text-gray-100">{c.courseId}</span>
                <span className="block text-[12px] text-gray-500 dark:text-gray-400 truncate">{c.title}</span>
              </span>
              {active && <Check className="w-4 h-4 text-[#003cbb] dark:text-[#4d82ff]" />}
            </button>
          );
        })}
      </div>

      <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Length</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Length">
        {PRESETS.map((p) => {
          const active = p.min === length;
          return (
            <button
              key={p.label}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLength(p.min)}
              className={cn(
                "rounded-[14px] border px-3 py-3 text-left transition-colors",
                active ? "border-[#003cbb] dark:border-[#4d82ff] bg-[#f5f8fe] dark:bg-[#003cbb]/15" : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60",
              )}
            >
              <span className="block text-[15px] font-bold text-gray-900 dark:text-gray-100">{p.label}</span>
              <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{p.hint}</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function TimerPill() {
  const running = useStudyTimer((s) => s.running);
  const cancel = useStudyTimer((s) => s.cancel);
  const [now, setNow] = useState(() => Date.now());
  const [stopping, setStopping] = useState(false);
  /** Session (by start time) we've already said "done" for, so the toast shows once. */
  const notifiedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const at = Date.now();
      setNow(at);
      if (running.targetMin && at - running.startedAt >= running.targetMin * 60_000 && notifiedFor.current !== running.startedAt) {
        notifiedFor.current = running.startedAt;
        toast.success(`${running.targetMin} minutes done`, { description: "Nice work. Stop to log it, or keep going." });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const progress = running?.targetMin ? Math.min(1, (now - running.startedAt) / (running.targetMin * 60_000)) : null;

  const R = 15;
  const C = 2 * Math.PI * R;

  return (
    <AnimatePresence>
      {running && (
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed z-[60] left-3 bottom-[96px] md:left-auto md:right-6 md:bottom-6"
          role="status"
          aria-label={`Studying ${running.courseId}, ${elapsedLabel(running.startedAt, now)} elapsed`}
        >
          <div className="flex items-center gap-3 pl-2 pr-2 py-2 rounded-full bg-[#0a0d14] dark:bg-gray-800 text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] border border-white/10">
            <div className="relative w-10 h-10 shrink-0">
              <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90" aria-hidden>
                <circle cx="20" cy="20" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                {progress !== null && <circle cx="20" cy="20" r={R} fill="none" stroke="#4d82ff" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} className="transition-[stroke-dashoffset] duration-1000" />}
              </svg>
              <span className="absolute inset-0 flex items-center justify-center">{progress === 1 ? <Check className="w-4 h-4 text-[#4d82ff]" /> : <Clock className="w-4 h-4 text-white/80" />}</span>
            </div>
            <div className="min-w-0 pr-1">
              <p className="text-[11px] font-semibold text-white/60 leading-none mb-1">{running.courseId}</p>
              <p className="text-[17px] font-bold tabular-nums leading-none">{elapsedLabel(running.startedAt, now)}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                setStopping(true);
                await stopAndLog();
                setStopping(false);
              }}
              disabled={stopping}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white text-gray-900 text-[13px] font-bold hover:bg-gray-100 active:scale-[0.97] transition-all disabled:opacity-60"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop
            </button>
            <button type="button" onClick={cancel} aria-label="Discard this session" className="w-9 h-9 rounded-full inline-flex items-center justify-center text-white/60 hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Mounted once in the student layout. */
export function StudyTimerHost() {
  useEffect(() => {
    flushStudyQueue();
    const onOnline = () => flushStudyQueue();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
  return (
    <>
      <StartStudySheet />
      <TimerPill />
    </>
  );
}

