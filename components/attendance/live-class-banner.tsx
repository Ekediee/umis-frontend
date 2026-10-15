"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, ScanLine } from "lucide-react";
import { studentApi } from "@/lib/student/api";
import { useStudentQuery } from "@/lib/student/query";
import { cn } from "@/lib/utils";
import { CheckInSheet } from "./check-in";

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** "COSC 204 is taking attendance now" with a one-tap Check in. Hidden when no class is live. */
export function LiveClassBanner({ className }: { className?: string }) {
  const q = useStudentQuery("live", studentApi.getLiveClass);
  const [open, setOpen] = useState(false);
  const live = q.data;
  if (!live) return null;

  return (
    <>
      <div className={cn("relative overflow-hidden rounded-[20px] bg-[#0a0d14] dark:bg-gray-900 dark:border dark:border-gray-800 text-white p-5 md:p-6", className)}>
        <div aria-hidden className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-[#2563eb]/40 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#8ba7ff]">
              {live.checkedIn ? (
                <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
              ) : (
                <span className="relative flex w-2.5 h-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-[#34d399]" />
                </span>
              )}
              {live.checkedIn ? "Checked in" : "Taking attendance now"}
            </p>
            <h3 className="mt-2 text-[18px] md:text-[20px] font-bold leading-tight truncate">
              {live.courseId} · {live.title}
            </h3>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-white/70">
              <MapPin className="w-3.5 h-3.5" />
              {live.venue} · {hhmm(live.startsAt)}–{hhmm(live.endsAt)}
            </p>
          </div>
          {!live.checkedIn && (
            <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[12px] bg-white text-gray-900 text-[15px] font-bold hover:bg-gray-100 active:scale-[0.98] transition-all shrink-0">
              <ScanLine className="w-5 h-5" />
              Check in
            </button>
          )}
        </div>
      </div>
      <CheckInSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
