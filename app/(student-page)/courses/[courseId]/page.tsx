"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, ChevronLeft, ClipboardCheck, FolderOpen, Megaphone, MessageCircleQuestion, Timer, User, Users, type LucideIcon } from "lucide-react";
import { CoverSurface } from "@/components/courses/cover";
import { FeedTab } from "@/components/courses/feed-tab";
import { ResourcesTab } from "@/components/courses/resources-tab";
import { QaTab } from "@/components/courses/qa-tab";
import { ClassmatesTab } from "@/components/courses/classmates-tab";
import { AiButton, NotebookLmCard, NotebookLmSheet } from "@/components/courses/notebooklm";
import { openStudySheet } from "@/components/student/study-timer";
import { ErrorPanel, PageContainer, Panel, Skeleton } from "@/components/student/ui";
import { studentApi } from "@/lib/student/api";
import { useStudentQuery } from "@/lib/student/query";
import { attendanceStanding, formatMinutes, relativeDue, summarizeWeek } from "@/lib/student/rules";
import type { CourseQuestion, CourseSpaceDetail } from "@/lib/student/types";
import { cn } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/features";

type Tab = "feed" | "resources" | "qa" | "classmates";
const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "feed", label: "Feed", icon: Megaphone },
  { id: "resources", label: "Resources", icon: FolderOpen },
  { id: "qa", label: "Q&A", icon: MessageCircleQuestion },
  { id: "classmates", label: "Classmates", icon: Users },
];

function Rail({ detail }: { detail: CourseSpaceDetail }) {
  const { space } = detail;
  const att = useStudentQuery("attendance", studentApi.getAttendance);
  const study = useStudentQuery("study:sessions", studentApi.getStudySessions);
  const mine = att.data?.find((a) => a.courseId === space.courseId);
  const week = study.data ? summarizeWeek(study.data, new Date()) : null;
  const minutes = week?.byCourse.find((c) => c.courseId === space.courseId)?.minutes ?? 0;
  const standing = mine ? attendanceStanding(mine.percent) : null;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-5 md:p-5">
        <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Next deadline</p>
        {space.nextDeadline ? (
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 inline-flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{space.nextDeadline.title}</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400">Due {relativeDue(space.nextDeadline.dueAt, new Date())}</p>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-gray-500 dark:text-gray-400">Nothing due for this course.</p>
        )}
      </Panel>

      {(isFeatureEnabled("attendance") || isFeatureEnabled("insights")) && (
      <div className={cn("grid gap-3", isFeatureEnabled("attendance") && isFeatureEnabled("insights") ? "grid-cols-2" : "grid-cols-1")}>
        {isFeatureEnabled("attendance") && <Link href="/attendance" className="rounded-[20px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 transition-shadow">
          <ClipboardCheck className="w-5 h-5 text-[#12B76A] dark:text-[#34d399] mb-2" />
          {mine ? (
            <p className={cn("text-[22px] font-bold leading-none", standing === "risk" ? "text-red-600 dark:text-red-400" : standing === "watch" ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-gray-100")}>{mine.percent}%</p>
          ) : (
            <Skeleton className="h-6 w-14" />
          )}
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">Attendance</p>
        </Link>}
        {isFeatureEnabled("insights") && <button type="button" onClick={() => openStudySheet(space.courseId)} className="text-left rounded-[20px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 transition-shadow">
          <Timer className="w-5 h-5 text-[#003cbb] dark:text-[#4d82ff] mb-2" />
          {week ? <p className="text-[22px] font-bold leading-none text-gray-900 dark:text-gray-100">{formatMinutes(minutes)}</p> : <Skeleton className="h-6 w-14" />}
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">Studied this week</p>
        </button>}
      </div>
      )}

      <div className="hidden lg:block">
        <NotebookLmCard courseId={space.courseId} />
      </div>
    </div>
  );
}

export default function CourseSpacePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId: raw } = use(params);
  const courseId = decodeURIComponent(raw);
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const tab = (TABS.some((t) => t.id === search.get("tab")) ? search.get("tab") : "feed") as Tab;
  const [nlmOpen, setNlmOpen] = useState(false);

  const q = useStudentQuery(`space:${courseId}`, () => studentApi.getSpace(courseId));
  const setTab = useCallback((t: Tab) => router.replace(`${pathname}?tab=${t}`, { scroll: false }), [router, pathname]);
  const updateQuestions = useCallback((fn: (qs: CourseQuestion[]) => CourseQuestion[]) => q.setData((d) => ({ ...d, questions: fn(d.questions) })), [q]);

  if (q.error && !q.data)
    return (
      <PageContainer>
        <div className="mb-5">
          <BackToCourses />
        </div>
        <ErrorPanel error={q.error} onRetry={q.refetch} />
      </PageContainer>
    );

  const d = q.data;
  const counts: Partial<Record<Tab, number>> = d ? { feed: d.feed.filter((p) => !p.read).length, qa: d.questions.filter((x) => x.answers.length === 0).length } : {};

  return (
    <PageContainer wide>
      <div className="mb-4 hidden md:block">
        <BackToCourses />
      </div>

      {/* Cover header */}
      {d ? (
        <CoverSurface tone={d.space.tone} className="rounded-[24px] px-5 py-5 md:px-8 md:py-7 mb-5 md:mb-6">
          <div className="flex items-center justify-between md:hidden mb-4">
            <Link href="/courses" className="inline-flex items-center gap-1 h-9 pl-2 pr-3 rounded-full bg-white/15 backdrop-blur-sm text-[13px] font-semibold">
              <ChevronLeft className="w-4 h-4" />
              Courses
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[12px] font-bold">{d.space.courseId}</span>
                <span className="inline-flex px-2.5 py-1 rounded-full bg-white/15 text-[12px] font-semibold">{d.space.units} units</span>
                {d.space.classOption && <span className="inline-flex px-2.5 py-1 rounded-full bg-white/15 text-[12px] font-semibold">{/group/i.test(d.space.classOption) ? d.space.classOption : `Group ${d.space.classOption}`}</span>}
              </div>
              <h1 className="text-[22px] md:text-[30px] font-bold tracking-tight leading-tight">{d.space.title}</h1>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-white/85">
                <User className="w-4 h-4" />
                {d.space.instructor || "Lecturer to be assigned"}
              </p>
            </div>
            <div className="flex gap-2.5 shrink-0">
              {isFeatureEnabled("insights") && <button type="button" onClick={() => openStudySheet(d.space.courseId)} className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-[12px] bg-white text-gray-900 text-[14px] font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all flex-1 md:flex-none">
                <Timer className="w-4 h-4" />
                Start studying
              </button>}
              <AiButton className="lg:hidden flex-1 md:flex-none" onClick={() => setNlmOpen(true)}>
                NotebookLM
              </AiButton>
            </div>
          </div>
        </CoverSurface>
      ) : (
        <div className="rounded-[24px] h-[168px] md:h-[188px] bg-gray-200 dark:bg-gray-800 animate-pulse mb-5 md:mb-6" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 md:gap-6 items-start">
        <div className="min-w-0">
          {/* Tabs: same segmented control as the timetable view switch */}
          <div role="tablist" aria-label="Course sections" className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[14px] p-1 mb-4 md:mb-5 overflow-x-auto no-scrollbar">
            {TABS.map((t) => {
              const active = t.id === tab;
              const n = counts[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex-1 min-w-fit inline-flex items-center justify-center gap-2 px-3.5 md:px-4 h-10 rounded-[10px] text-[13px] md:text-[14px] font-semibold whitespace-nowrap transition-colors",
                    active ? "bg-blue-50 dark:bg-blue-900/30 text-[#003cbb] dark:text-blue-300" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                  {!!n && <span className={cn("min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center", active ? "bg-[#003cbb] text-white dark:bg-blue-400 dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300")}>{n}</span>}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" className="animate-in fade-in duration-200" key={tab}>
            {!d ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="h-28 rounded-[20px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-pulse" />
                ))}
              </div>
            ) : tab === "feed" ? (
              <FeedTab courseId={courseId} posts={d.feed} onOpenResources={() => setTab("resources")} />
            ) : tab === "resources" ? (
              <ResourcesTab courseId={courseId} materials={d.materials} />
            ) : tab === "qa" ? (
              <QaTab courseId={courseId} questions={d.questions} update={updateQuestions} />
            ) : (
              <ClassmatesTab courseId={courseId} classmates={d.classmates} visible={d.visibleToClassmates} onVisibleChange={(v) => q.setData((x) => ({ ...x, visibleToClassmates: v }))} />
            )}
          </div>
        </div>

        <aside className="min-w-0">{d ? <Rail detail={d} /> : <div className="h-64 rounded-[20px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-pulse" />}</aside>
      </div>

      {d && <NotebookLmSheet open={nlmOpen} onClose={() => setNlmOpen(false)} courseId={d.space.courseId} />}
    </PageContainer>
  );
}

function BackToCourses() {
  return (
    <Link
      href="/courses"
      className="inline-flex items-center gap-1.5 text-[#003cbb] dark:text-gray-200 text-[14px] font-medium bg-white dark:bg-gray-900 border border-[#003cbb]/20 dark:border-gray-800 rounded-[10px] px-4 py-2 hover:bg-[#f5f8fe] dark:hover:bg-gray-800 transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
      All courses
    </Link>
  );
}

