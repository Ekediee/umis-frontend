"use client";

/**
 * Feature 4, as agreed in the plan: Pulse doesn't run its own flashcard engine.
 * It hands students to Google NotebookLM (with their Gemini subscription)
 * and makes the handoff easy: a 3-step guide and a direct link.
 */

import { useState } from "react";
import { ArrowUpRight, Download, FileStack, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/student/ui";

export const NOTEBOOKLM_URL = "https://notebooklm.google.com/";

/** Vivid AI gradient with a soft glow (design taste: AI accents stay vivid and luminous). */
const aiFill = "bg-[linear-gradient(110deg,#d600e0_0%,#a12cff_35%,#6a5cff_65%,#1f6fff_100%)]";

export function AiButton({ className, children = "Study in NotebookLM", onClick }: { className?: string; children?: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[12px] text-[14px] font-semibold text-white",
        aiFill,
        "shadow-[0_6px_20px_-4px_rgba(161,44,255,0.55)] hover:shadow-[0_8px_26px_-4px_rgba(161,44,255,0.7)] transition-all active:scale-[0.98]",
        "before:absolute before:inset-0 before:rounded-[12px] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent_55%)] before:pointer-events-none",
        className,
      )}
    >
      <Sparkles className="w-4 h-4 relative" />
      <span className="relative">{children}</span>
    </button>
  );
}

const STEPS = [
  { icon: Download, title: "Download the slides", body: "Save this week's slides or past questions from Resources." },
  { icon: FileStack, title: "Add them as sources", body: "Open NotebookLM with your school Google account and create a notebook for this course. Upload the files as sources." },
  { icon: Layers, title: "Generate flashcards or a quiz", body: "In the Studio panel, choose Flashcards or Quiz. Ask for harder questions on topics you got wrong." },
];

export function NotebookLmSheet({ open, onClose, courseId }: { open: boolean; onClose: () => void; courseId: string }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Study with NotebookLM"
      footer={
        <a href={NOTEBOOKLM_URL} target="_blank" rel="noopener noreferrer" className={cn("w-full inline-flex items-center justify-center gap-2 h-12 rounded-[12px] text-[14px] font-semibold text-white", aiFill, "shadow-[0_6px_20px_-4px_rgba(161,44,255,0.55)]")}>
          Open NotebookLM
          <ArrowUpRight className="w-4 h-4" />
        </a>
      }
    >
      <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
        Turn the {courseId} slides into flashcards, quizzes and audio overviews. NotebookLM is included with your Gemini subscription.
      </p>
      <ol className="flex flex-col gap-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3.5">
            <div className="relative flex flex-col items-center">
              <span className="w-9 h-9 rounded-full bg-[#f3ecff] dark:bg-[#a12cff]/20 text-[#7c3aed] dark:text-[#c4a1ff] inline-flex items-center justify-center shrink-0">
                <s.icon className="w-4 h-4" />
              </span>
              {i < STEPS.length - 1 && <span className="w-px flex-1 bg-gray-200 dark:bg-gray-800 mt-1" />}
            </div>
            <div className="pb-1">
              <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">
                {i + 1}. {s.title}
              </p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-5 leading-relaxed">Time spent in NotebookLM isn&apos;t counted in your Pulse study hours. Start a study timer first if you want it logged.</p>
    </Sheet>
  );
}

/** Rail / resources card that introduces the handoff. */
export function NotebookLmCard({ courseId, compact = false }: { courseId: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="relative overflow-hidden rounded-[20px] border border-[#e9dcff] dark:border-[#a12cff]/30 bg-[linear-gradient(135deg,#faf5ff_0%,#f3f0ff_45%,#eef4ff_100%)] dark:bg-[linear-gradient(135deg,rgba(161,44,255,0.14),rgba(31,111,255,0.10))] p-5">
        <div aria-hidden className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-[#c084fc]/30 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/10 text-[11px] font-bold text-[#7c3aed] dark:text-[#d8b4fe]">
            <Sparkles className="w-3 h-3" />
            Flashcards and quizzes
          </span>
          <h4 className="mt-3 text-[16px] font-bold text-gray-900 dark:text-gray-100">Revise {courseId} with AI</h4>
          {!compact && <p className="mt-1 text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">Add the slides to NotebookLM and it builds flashcards and practice quizzes for you.</p>}
          <AiButton className="mt-4 w-full" onClick={() => setOpen(true)} />
        </div>
      </div>
      <NotebookLmSheet open={open} onClose={() => setOpen(false)} courseId={courseId} />
    </>
  );
}
