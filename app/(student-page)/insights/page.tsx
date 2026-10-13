"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpenCheck, CalendarCheck2, ClipboardCheck, CloudOff, Flame, Info, Lightbulb, Timer, TrendingUp, TriangleAlert, Trophy } from "lucide-react";
import { getAcademicResultsAction } from "@/app/actions/academic-details";
import { CourseMinutesBars, GpaTrendChart, StudyByDayChart } from "@/components/student/charts";
import { openStudySheet } from "@/components/student/study-timer";
import { Btn, ErrorPanel, IconBubble, PageContainer, Panel, PanelHeader, PanelSkeleton, Skeleton, timeAgo, useIsClient, type Tone } from "@/components/student/ui";
import { studentApi, registeredCourses } from "@/lib/student/api";
import { useStudentQuery } from "@/lib/student/query";
import { formatMinutes, studyStreak, summarizeWeek, weeklySuggestion, type Suggestion } from "@/lib/student/rules";
import { pendingStudySessions } from "@/lib/student/study-sync";
import type { StudySession } from "@/lib/student/types";
import type { SeedCourse } from "@/lib/student/mock/seed";
import { cn } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/features";

const SUGGESTION_TONE: Record<Suggestion["tone"], { tone: Tone; icon: typeof Lightbulb; box: string }> = {
  risk: { tone: "red", icon: TriangleAlert, box: "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20" },
  warning: { tone: "amber", icon: TriangleAlert, box: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" },
  info: { tone: "blue", icon: Lightbulb, box: "bg-[#f5f8fe] dark:bg-[#003cbb]/10 border-[#e4ebfa] dark:border-[#003cbb]/25" },
  good: { tone: "green", icon: Trophy, box: "bg-[#effaf6] dark:bg-emerald-500/10 border-[#cbf5e5] dark:border-emerald-500/20" },
};

function Stat({ icon, tone, value, label, sub }: { icon: typeof Timer; tone: Tone; value: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 p-4 md:p-5 flex items-start gap-3 md:gap-4">
      <IconBubble icon={icon} tone={tone} />
      <div className="min-w-0">
        <p className="text-[22px] md:text-[24px] font-bold text-gray-900 dark:text-white leading-none tabular-nums">{value}</p>
        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1.5">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function InsightsPage() {
  const search = useSearchParams();
  const sessions = useStudentQuery("study:sessions", studentApi.getStudySessions);
  const attendance = useStudentQuery("attendance", studentApi.getAttendance);
  const deadlines = useStudentQuery("deadlines", studentApi.getDeadlines);
  const courses = useStudentQuery<SeedCourse[]>("courses", registeredCourses);
  const results = useStudentQuery("results", () => getAcademicResultsAction().then((r) => r.data ?? []));
  const [pending, setPending] = useState<StudySession[]>([]);
  const isClient = useIsClient();

  useEffect(() => {
    if (search.get("start") === "1") openStudySheet();
  }, [search]);
  useEffect(() => {
    pendingStudySessions().then(setPending);
  }, [sessions.data]);

  const all = useMemo(() => [...(sessions.data ?? []), ...pending], [sessions.data, pending]);
  const now = new Date();
  const week = summarizeWeek(all, now);
  const streak = studyStreak(all, now);

  const att = attendance.data ?? [];
  const held = att.reduce((n, a) => n + a.held, 0);
  const attPct = held ? Math.round((att.reduce((n, a) => n + a.attended + a.late + a.excused, 0) / held) * 100) : null;
  const past = (deadlines.data ?? []).filter((d) => new Date(d.dueAt) < now);
  const met = past.filter((d) => d.submitted).length;

  const gpa = (results.data ?? []).filter((s) => s.semester_gpa != null).map((s) => ({ semester: s.semester, gpa: Number(s.semester_gpa) }));

  const ready = sessions.data && attendance.data && deadlines.data && courses.data;
  const suggestion = ready
    ? weeklySuggestion({ attendance: att, deadlines: deadlines.data!, minutesThisWeek: week.minutes, minutesByCourse: week.byCourse, courses: courses.data!.map((c) => c.courseId), now })
    : null;
  const st = suggestion ? SUGGESTION_TONE[suggestion.tone] : null;

  const courseRows = (courses.data ?? []).map((c) => ({ courseId: c.courseId, title: c.title, minutes: week.byCourse.find((b) => b.courseId === c.courseId)?.minutes ?? 0 })).sort((a, b) => b.minutes - a.minutes);

  return (
    <PageContainer wide>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 md:mb-6">
        <div>
          <h2 className="text-[18px] md:text-[20px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">Personal study insights</h2>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-0.5 min-h-[1lh]">{isClient ? `Week of ${new Date(week.weekStart).toLocaleDateString(undefined, { day: "numeric", month: "long" })}` : ""}</p>
        </div>
        <Btn icon={Timer} onClick={() => openStudySheet()} className="self-start sm:self-auto h-11">
          Start studying
        </Btn>
      </div>

      {sessions.error && !sessions.data ? (
        <ErrorPanel error={sessions.error} onRetry={sessions.refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
            <Stat icon={Timer} tone="blue" value={sessions.data ? formatMinutes(week.minutes) : <Skeleton className="h-6 w-14" />} label="Hours logged this week" />
            <Stat icon={Flame} tone="amber" value={sessions.data ? `${streak} ${streak === 1 ? "day" : "days"}` : <Skeleton className="h-6 w-14" />} label="Study streak" />
            <Stat icon={ClipboardCheck} tone="green" value={attendance.data ? `${attPct ?? "—"}%` : <Skeleton className="h-6 w-14" />} label="Class attendance" />
            <Stat icon={CalendarCheck2} tone="purple" value={deadlines.data ? `${met}/${past.length}` : <Skeleton className="h-6 w-14" />} label="Deadlines met" />
          </div>

          {suggestion && st && (
            <div className={cn("flex flex-col sm:flex-row sm:items-center gap-4 p-4 md:p-5 rounded-[20px] border mb-5 md:mb-6 animate-in fade-in duration-300", st.box)}>
              <IconBubble icon={st.icon} tone={st.tone} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">This week&apos;s suggestion</p>
                <p className="text-[14px] md:text-[15px] font-semibold text-gray-900 dark:text-gray-100 mt-0.5 leading-snug">{suggestion.text}</p>
              </div>
              {(suggestion.href.startsWith("/attendance") && !isFeatureEnabled("attendance")) || (suggestion.href.startsWith("/courses") && !isFeatureEnabled("courses")) ? null : suggestion.href.includes("start=1") ? (
                <Btn variant="soft" onClick={() => openStudySheet()} className="shrink-0">
                  {suggestion.action}
                  <ArrowRight className="w-4 h-4" />
                </Btn>
              ) : (
                <Link href={suggestion.href} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-[13px] font-semibold bg-white/80 dark:bg-white/10 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-white/15 shrink-0">
                  {suggestion.action}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}

          {/* Time by day on top, by course below (full width, so neither card leaves empty space beside a taller one) */}
          <div className="flex flex-col gap-5 md:gap-6">
            <Panel>
              <PanelHeader title="Time logged by day" action={<span className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">{formatMinutes(week.minutes)} total</span>} />
              {sessions.data ? <StudyByDayChart byDay={week.byDay} height={220} /> : <div className="h-[220px] rounded-[16px] bg-gray-100 dark:bg-gray-800 animate-pulse" />}
            </Panel>

            <Panel>
              <PanelHeader
                title="By course"
                action={
                  courses.data && sessions.data ? (
                    <span className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                      {courseRows.filter((r) => r.minutes > 0).length} of {courseRows.length} studied
                    </span>
                  ) : (
                    <BookOpenCheck className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )
                }
              />
              {courses.data && sessions.data ? <CourseMinutesBars rows={courseRows} columns={2} /> : <div className="h-[180px] rounded-[16px] bg-gray-100 dark:bg-gray-800 animate-pulse" />}
            </Panel>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6 items-start">
            <Panel>
              <PanelHeader title="Semester GPA" icon={TrendingUp} />
              {results.data === undefined ? (
                <div className="h-[180px] rounded-[16px] bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ) : gpa.length < 2 ? (
                <div className="h-[180px] flex flex-col items-center justify-center text-center px-6">
                  <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">Your trend appears after two graded semesters</p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                    See full results in <Link href="/academic-details/semester-results" className="font-semibold text-[#3159d1] dark:text-[#4d82ff]">Academic Details</Link>.
                  </p>
                </div>
              ) : (
                <GpaTrendChart points={gpa} />
              )}
            </Panel>

            {sessions.data ? (
              <Panel>
                <PanelHeader title="Recent sessions" icon={Timer} />
                {all.length === 0 ? (
                  <p className="text-[14px] text-gray-500 dark:text-gray-400">No sessions yet. Tap Start studying before you open your notes.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 -my-2">
                    {all
                      .slice()
                      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
                      .slice(0, 6)
                      .map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{s.courseId}</p>
                            <p className="text-[12px] text-gray-500 dark:text-gray-400">{timeAgo(s.startedAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {s.pending && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300" title="Saved on this device, waiting to sync">
                                <CloudOff className="w-3.5 h-3.5" />
                                Not synced
                              </span>
                            )}
                            <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatMinutes(s.minutes)}</span>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </Panel>
            ) : (
              <PanelSkeleton rows={3} />
            )}
          </div>
          </div>

          <div className="mt-5 md:mt-6 flex items-start gap-3 p-4 md:p-5 rounded-[20px] bg-[#f6f8fa] dark:bg-gray-900 border border-transparent dark:border-gray-800">
            <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-700 dark:text-gray-300">How we count hours.</span> Hours logged come only from the study timer you start and stop. Class time comes from check-ins and is shown as attendance. Time in NotebookLM or on paper can&apos;t be measured, so start a timer if you want it counted.
            </p>
          </div>
        </>
      )}
    </PageContainer>
  );
}

export default function Page() {
  return (
    <Suspense>
      <InsightsPage />
    </Suspense>
  );
}
