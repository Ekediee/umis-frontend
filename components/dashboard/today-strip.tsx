"use client";

/**
 * Personalised Today (feature 26). A row of cards ranked by rankTodayCards():
 * a class you can check in to leads; mornings favour classes, evenings favour
 * deadlines and revision. Sits under the welcome banner and adds to, never
 * replaces, the existing dashboard cards.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarDays, ClipboardCheck, Flame, MapPin, ScanLine, Timer, TriangleAlert } from "lucide-react";
import { CheckInSheet } from "@/components/attendance/check-in";
import { openStudySheet } from "@/components/student/study-timer";
import { IconBubble, useIsClient } from "@/components/student/ui";
import { studentApi } from "@/lib/student/api";
import { useStudentQuery } from "@/lib/student/query";
import { attendanceStanding, formatMinutes, recoveryLine, rankTodayCards, relativeDue, studyStreak, summarizeWeek, type TodayCardId } from "@/lib/student/rules";
import { cn } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/features";

const card = "bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 p-5 flex flex-col min-h-[176px] snap-start shrink-0 w-[82%] sm:w-[46%] lg:w-auto transition-colors duration-200";

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 16 ? "Good afternoon" : "Good evening";
}

export function TodayStrip() {
  const live = useStudentQuery("live", studentApi.getLiveClass);
  const deadlines = useStudentQuery("deadlines", studentApi.getDeadlines);
  const attendance = useStudentQuery("attendance", studentApi.getAttendance);
  const sessions = useStudentQuery("study:sessions", studentApi.getStudySessions);
  const [checkIn, setCheckIn] = useState(false);
  const isClient = useIsClient();

  const now = new Date();
  const ready = live.data !== undefined && deadlines.data && attendance.data && sessions.data;

  const upcoming = (deadlines.data ?? []).filter((d) => !d.submitted && new Date(d.dueAt) > now && new Date(d.dueAt).getTime() - now.getTime() <= 72 * 3600_000);
  const atRisk = [...(attendance.data ?? [])].sort((a, b) => a.percent - b.percent).find((a) => attendanceStanding(a.percent) === "risk");
  const week = summarizeWeek(sessions.data ?? [], now);
  const streak = studyStreak(sessions.data ?? [], now);

  const order = rankTodayCards({
    now,
    liveClass: !!live.data && !live.data.checkedIn,
    deadlinesNext72h: upcoming.length,
    deadlineWithin24h: upcoming.some((d) => new Date(d.dueAt).getTime() - now.getTime() <= 24 * 3600_000),
    feesOutstanding: false, // fees keep their own Finance card below
    attendanceRisk: !!atRisk,
    hasTimetable: false, // GET /student/timetable is coming with the timetable module
  }).slice(0, 4);

  // A card that leads into another preview feature only shows while that feature is on.
  const needs: Partial<Record<TodayCardId, Parameters<typeof isFeatureEnabled>[0]>> = { "check-in": "attendance", attendance: "attendance", deadlines: "courses", insights: "insights" };

  const render = (id: TodayCardId) => {
    const need = needs[id];
    if (need && !isFeatureEnabled(need)) return null;
    switch (id) {
      case "check-in":
        return live.data ? (
          <div key={id} className={cn(card, "relative overflow-hidden bg-[#0a0d14] dark:bg-gray-900 border-transparent dark:border-gray-800 text-white")}>
            <div aria-hidden className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-[#2563eb]/45 blur-3xl" />
            <p className="relative inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#8ba7ff]">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-[#34d399]" />
              </span>
              Class in progress
            </p>
            <p className="relative mt-2 text-[17px] font-bold leading-snug">{live.data.courseId}</p>
            <p className="relative text-[13px] text-white/70 line-clamp-1">{live.data.title}</p>
            <p className="relative mt-1 inline-flex items-center gap-1 text-[12px] text-white/55">
              <MapPin className="w-3 h-3" />
              {live.data.venue}
            </p>
            <button type="button" onClick={() => setCheckIn(true)} className="relative mt-auto pt-4">
              <span className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-white text-gray-900 text-[14px] font-bold hover:bg-gray-100 active:scale-[0.98] transition-all">
                <ScanLine className="w-4 h-4" />
                Check in
              </span>
            </button>
          </div>
        ) : null;

      case "next-class":
        return (
          <div key={id} className={card}>
            <div className="flex items-center justify-between mb-3">
              <IconBubble icon={CalendarDays} tone="sky" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Next class</span>
            </div>
            <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">Your timetable is on its way</p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Once it&apos;s live, your next class and its venue show here, with directions.</p>
            <Link href="/campus-map" className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#003cbb] dark:text-[#4d82ff]">
              Explore the campus map
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        );

      case "deadlines":
        return (
          <div key={id} className={card}>
            <div className="flex items-center justify-between mb-3">
              <IconBubble icon={CalendarClock} tone="amber" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Due in 3 days</span>
            </div>
            <ul className="flex flex-col gap-2.5">
              {upcoming.slice(0, 2).map((d) => (
                <li key={d.id}>
                  <Link href={`/courses/${encodeURIComponent(d.courseId)}`} className="block group">
                    <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#003cbb] dark:group-hover:text-[#4d82ff] line-clamp-1">
                      {d.courseId} · {d.title}
                    </p>
                    <p className="text-[12px] text-amber-700 dark:text-amber-300 font-medium">Due {relativeDue(d.dueAt, now)}</p>
                  </Link>
                </li>
              ))}
            </ul>
            {upcoming.length > 2 && <p className="mt-auto pt-3 text-[12px] font-semibold text-gray-500">+{upcoming.length - 2} more</p>}
          </div>
        );

      case "attendance":
        return atRisk ? (
          <Link key={id} href="/attendance" className={cn(card, "border-red-100 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/[0.06] ")}>
            <div className="flex items-center justify-between mb-3">
              <IconBubble icon={TriangleAlert} tone="red" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-500/80">Attendance</span>
            </div>
            <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">Let&apos;s get {atRisk.courseId} back on track</p>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
              You&apos;re at <span className="font-semibold text-red-600 dark:text-red-400">{atRisk.percent}%</span>. {recoveryLine(atRisk)}
            </p>
            <span className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-700 dark:text-red-300">
              See attendance
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        ) : null;

      case "insights":
        return (
          <div key={id} className={card}>
            <div className="flex items-center justify-between mb-3">
              <IconBubble icon={Timer} tone="blue" />
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-600 dark:text-amber-400" title="Study streak">
                <Flame className="w-4 h-4" />
                {streak}
              </span>
            </div>
            <p className="text-[24px] font-bold text-gray-900 dark:text-gray-100 leading-none tabular-nums">{formatMinutes(week.minutes)}</p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">logged this week</p>
            <div className="mt-auto pt-3 flex items-center gap-2">
              <button type="button" onClick={() => openStudySheet()} className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-semibold bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff] hover:bg-[#e4ebfa] dark:hover:bg-[#003cbb]/30 active:scale-[0.98] transition-all">
                <Timer className="w-4 h-4" />
                Study
              </button>
              <Link href="/insights" className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 dark:text-gray-300 hover:text-[#003cbb] dark:hover:text-[#4d82ff]">
                Insights
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section aria-labelledby="today-heading" className="mb-5 md:mb-6">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h3 id="today-heading" className="text-[16px] md:text-[18px] font-bold text-gray-900 dark:text-gray-100">
            {isClient ? greeting(now) : "Today"}
          </h3>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 min-h-[1lh]">{isClient ? now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) : ""}</p>
        </div>
        {isFeatureEnabled("attendance") && <Link href="/attendance" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] md:text-[14px] font-medium text-[#3159d1] dark:text-[#4d82ff] hover:text-[#003095]">
          <ClipboardCheck className="w-4 h-4" />
          Attendance
        </Link>}
      </div>

      {!ready ? (
        <div className="flex lg:grid lg:grid-cols-4 gap-3 md:gap-4 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={cn(card, "animate-pulse bg-gray-100 dark:bg-gray-800 border-transparent")} />
          ))}
        </div>
      ) : (
        (() => {
          const cards = order.map(render).filter(Boolean);
          // Grid columns follow the number of cards that have something to say (lg and up).
          return (
            <div className="flex lg:grid gap-3 md:gap-4 overflow-x-auto lg:overflow-visible snap-x snap-mandatory scroll-px-4 md:scroll-px-6 lg:scroll-px-0 no-scrollbar -mx-4 px-4 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 pb-1" style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))` }}>
              {cards}
            </div>
          );
        })()
      )}

      <CheckInSheet open={checkIn} onClose={() => setCheckIn(false)} />
    </section>
  );
}
