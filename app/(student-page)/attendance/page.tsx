"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ClipboardCheck, Info, ScanLine, ShieldCheck } from "lucide-react";
import { LiveClassBanner } from "@/components/attendance/live-class-banner";
import { CheckInSheet } from "@/components/attendance/check-in";
import { Btn, ErrorPanel, IconBubble, PageContainer, Panel, PanelHeader, PanelSkeleton, Pill } from "@/components/student/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { studentApi } from "@/lib/student/api";
import { useStudentQuery } from "@/lib/student/query";
import { ATTENDANCE_THRESHOLD, attendanceStanding, attendedLabel, classesToRecover, recoveryLine, type AttendanceStanding } from "@/lib/student/rules";
import type { AttendanceMark, CourseAttendance } from "@/lib/student/types";
import { cn } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/features";

const STANDING: Record<AttendanceStanding, { label: string; tone: "green" | "amber" | "red"; bar: string; text: string }> = {
  good: { label: "On track", tone: "green", bar: "bg-[#12B76A]", text: "text-gray-900 dark:text-gray-100" },
  watch: { label: "Keep it up", tone: "amber", bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  risk: { label: "Needs attention", tone: "red", bar: "bg-red-500", text: "text-red-600 dark:text-red-400" },
};

const MARK: Record<AttendanceMark, string> = {
  present: "bg-[#12B76A]",
  late: "bg-amber-400",
  excused: "bg-sky-400",
  absent: "bg-red-500",
};

function CourseRow({ a }: { a: CourseAttendance }) {
  const [open, setOpen] = useState(false);
  const standing = attendanceStanding(a.percent);
  const s = STANDING[standing];
  const toRecover = classesToRecover(a);

  return (
    <li className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full text-left p-4 md:p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{a.courseId}</p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{a.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("text-[22px] font-bold tabular-nums leading-none", s.text)}>{a.percent}%</span>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")} />
          </div>
        </div>

        {/* Bar with the 75% line marked */}
        <div className="relative h-2 rounded-full bg-gray-100 dark:bg-gray-800">
          <div className={cn("h-full rounded-full transition-[width] duration-700", s.bar)} style={{ width: `${a.percent}%` }} />
          <span aria-hidden className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-gray-900/40 dark:bg-white/40" style={{ left: `${ATTENDANCE_THRESHOLD}%` }} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Pill tone={s.tone}>{s.label}</Pill>
          <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
            {toRecover > 0 ? `Attend your next ${toRecover} to reach ${ATTENDANCE_THRESHOLD}%` : attendedLabel(a)}
          </p>
        </div>
      </button>

      {open && (
        <div className="px-4 md:px-5 pb-5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Class history</p>
            <ol className="flex flex-wrap gap-1.5" aria-label="Class history, newest first">
              {a.history.map((h, i) => (
                <li key={i} title={`${new Date(h.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}: ${h.mark}`} className={cn("w-6 h-6 rounded-[7px]", MARK[h.mark])}>
                  <span className="sr-only">
                    {h.date}: {h.mark}
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[12px] text-gray-500 dark:text-gray-400">
              {(["present", "late", "excused", "absent"] as AttendanceMark[]).map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 capitalize">
                  <span className={cn("w-2.5 h-2.5 rounded-[3px]", MARK[m])} />
                  {m}
                </span>
              ))}
            </div>
            {standing === "risk" && (
              <p className="mt-4 flex items-start gap-2 p-3 rounded-[12px] bg-red-50 dark:bg-red-500/10 text-[13px] text-red-700 dark:text-red-300 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {recoveryLine(a)} {ATTENDANCE_THRESHOLD}% is needed to sit the exam. If you missed classes for a good reason, ask your course adviser to record them as excused; excused absences count.
              </p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function AttendancePage() {
  const q = useStudentQuery("attendance", studentApi.getAttendance);
  const live = useStudentQuery("live", studentApi.getLiveClass);
  const liveBanner = !!live.data && !live.data.checkedIn;
  const [open, setOpen] = useState(false);
  const list = [...(q.data ?? [])].sort((a, b) => a.percent - b.percent);
  const held = list.reduce((n, a) => n + a.held, 0);
  const counted = list.reduce((n, a) => n + a.attended + a.late + a.excused, 0);
  const overall = held ? Math.round((counted / held) * 100) : null;
  const atRisk = list.filter((a) => attendanceStanding(a.percent) === "risk").length;

  return (
    <PageContainer wide>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 md:mb-6">
        <div>
          <h2 className="text-[18px] md:text-[20px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">Attendance</h2>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-0.5">You need {ATTENDANCE_THRESHOLD}% in each course to sit its exam.</p>
        </div>
        {/* The live-class banner below carries its own Check in; avoid two buttons stacked on phones */}
        <Btn icon={ScanLine} onClick={() => setOpen(true)} className={cn("self-start sm:self-auto h-11", liveBanner && "hidden sm:inline-flex")}>
          Check in
        </Btn>
      </div>

      <LiveClassBanner className="mb-5 md:mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 md:gap-6 items-start">
        <div className="min-w-0 order-2 lg:order-1">
          {q.error && !q.data ? (
            <ErrorPanel error={q.error} onRetry={q.refetch} />
          ) : q.isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-[132px] rounded-[20px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No classes yet" description="Your attendance shows here after your first class check-in." />
          ) : (
            <ul className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
              {list.map((a) => (
                <CourseRow key={a.courseId} a={a} />
              ))}
            </ul>
          )}
        </div>

        <aside className="order-1 lg:order-2 flex flex-col gap-4">
          {q.data ? (
            <Panel>
              <PanelHeader title="This semester" icon={ClipboardCheck} />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f6f8fa] dark:bg-gray-800 rounded-[20px] p-4">
                  <p className="text-[24px] font-bold text-[#253ea7] dark:text-[#4d82ff] leading-none">{overall ?? "—"}%</p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1.5">Overall</p>
                </div>
                <div className={cn("rounded-[20px] p-4", atRisk ? "bg-red-50 dark:bg-red-500/10" : "bg-[#effaf6] dark:bg-emerald-500/10")}>
                  <p className={cn("text-[24px] font-bold leading-none", atRisk ? "text-red-600 dark:text-red-400" : "text-[#12B76A] dark:text-[#34d399]")}>{atRisk}</p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1.5">{atRisk === 1 ? "Course at risk" : "Courses at risk"}</p>
                </div>
              </div>
            </Panel>
          ) : (
            <PanelSkeleton rows={1} />
          )}
          <Panel className="p-5 md:p-5">
            <div className="flex gap-3">
              <IconBubble icon={ShieldCheck} tone="blue" size="sm" />
              <div className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">How check-in works</p>
                Scan the QR code on the lecturer&apos;s screen, or type its 6-digit code. Codes change every 30 seconds, so a photo shared later won&apos;t work. Checking in more than 15 minutes after the start marks you late.
              </div>
            </div>
          </Panel>
          <p className="flex items-start gap-2 text-[12px] text-gray-400 dark:text-gray-500 px-1">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Something wrong? Your lecturer can correct a mark from their register.{" "}
            {isFeatureEnabled("courses") && <Link href="/courses" className="font-semibold text-[#3159d1] dark:text-[#4d82ff]">Ask in the course Q&amp;A</Link>}
          </p>
        </aside>
      </div>

      <CheckInSheet open={open} onClose={() => setOpen(false)} />
    </PageContainer>
  );
}
