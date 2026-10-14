"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarX2,
  ChevronRight,
  ClipboardCheck,
  CloudOff,
  FileText,
  Megaphone,
  MessageCircleQuestion,
  PartyPopper,
  Presentation,
  RefreshCw,
  ScanLine,
  UserRoundPen,
  Undo2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { WEEKDAYS, WEEKDAYS_LONG, daysBetween, formatSemester, hhmm, isoDay, relativeDays, shortDate, timeAgo, timeRange, localDate } from "@/lib/lecturer/format";
import { useLecturerQuery, useNow } from "@/lib/lecturer/query";
import type { TaskKind, TodayPayload, TodayTask } from "@/lib/lecturer/types";
import { useLecturer } from "../shell/lecturer-provider";
import { SemesterSwitcher } from "../shell/menus";
import { Page } from "../shell/page";
import { BtnLink, CardSkeleton, Chip, ErrorState, RoundAction, SectionTitle, Surface } from "../ui/primitives";
import { Skeleton } from "@/components/ui/skeleton";

const TASK_META: Record<TaskKind, { icon: LucideIcon; tint: string }> = {
  registrations: { icon: ClipboardCheck, tint: "bg-[#eef3fd] text-[#003cbb] dark:bg-[#003cbb]/25 dark:text-[#9bb8ff]" },
  chapters: { icon: FileText, tint: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
  "grades-due": { icon: BookOpen, tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
  "grades-returned": { icon: Undo2, tint: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300" },
  questions: { icon: MessageCircleQuestion, tint: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300" },
  attendance: { icon: CalendarX2, tint: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
  bookings: { icon: Users, tint: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300" },
  "profile-gap": { icon: UserRoundPen, tint: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
};

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function TodayView() {
  const { semester } = useLecturer();
  const simulate = useSearchParams().get("simulate");
  useNow(60_000);
  const today = useLecturerQuery(semester ? `today:${semester.code}:${simulate ?? ""}` : null, () => lecturerApi.getToday(semester!.code, simulate), { persist: true });
  const now = appNow();
  const data = today.data;

  return (
    <Page>
      <div className="mb-4 md:hidden">
        <SemesterSwitcher compact />
      </div>

      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-6">
        <div>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
            {WEEKDAYS_LONG[isoDay(now) - 1]} {shortDate(now)} {semester && <>· {formatSemester(semester)}</>}
          </p>
          <h1 className="mt-0.5 text-[24px] font-bold tracking-tight text-gray-900 md:text-[28px] dark:text-gray-50">
            {greeting(now)}
            {data ? `, ${data.greetingName}` : ""}
          </h1>
        </div>
        {today.updatedAt && (
          <button type="button" onClick={today.refetch} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-2 text-[12px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-200">
            <RefreshCw className={cn("size-3.5", today.isRefreshing && "animate-spin")} />
            {today.isRefreshing ? "Refreshing…" : `Updated ${timeAgo(today.updatedAt, new Date())}`}
          </button>
        )}
      </header>

      {data?.sync.records === "down" && <SyncDownBanner lastSyncedAt={data.sync.lastSyncedAt} queued={data.sync.queued} />}
      {today.error && !data && <ErrorState error={today.error} screen="Today" onRetry={today.refetch} className="mb-6" />}

      {!data ? (
        <TodaySkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
          <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
            <NextClass next={data.nextClass} now={now} />
            <NeedsYou tasks={data.tasks} nextDeadline={data.nextDeadline} now={now} />
          </div>
          <div className="flex flex-col gap-5 lg:gap-6">
            <WeekStrip week={data.week} now={now} />
            <Shortcuts />
          </div>
        </div>
      )}
    </Page>
  );
}

function SyncDownBanner({ lastSyncedAt, queued }: { lastSyncedAt: string; queued: number }) {
  return (
    <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40">
      <CloudOff className="mt-0.5 size-4 shrink-0" />
      <p className="flex-1">
        <span className="font-semibold">Course data last synced {hhmm(new Date(lastSyncedAt))}.</span> Grades and approvals will send when the connection is back.
      </p>
      {queued > 0 && <Chip tone="amber">{queued} waiting to send</Chip>}
    </div>
  );
}

// ── Next class hero (Revolut-style) ─────────────────────────────────────────

function NextClass({ next, now }: { next: TodayPayload["nextClass"]; now: Date }) {
  if (!next) {
    return (
      <Surface className="flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <CalendarClock className="size-5 text-gray-400" />
        </span>
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">No more classes this week</p>
          <p className="text-[13px] text-gray-500">Your timetable isn&apos;t published yet, or you haven&apos;t added classes.</p>
        </div>
        <BtnLink href="/lecturer/schedule" variant="secondary" size="sm">
          Schedule
        </BtnLink>
      </Surface>
    );
  }
  const startsAt = new Date(next.startsAt);
  const mins = Math.round((startsAt.getTime() - now.getTime()) / 60_000);
  const isToday = daysBetween(now, startsAt) === 0;
  const live = mins <= 0;
  const when = live ? "Happening now" : isToday ? (mins < 60 ? `Starts in ${mins} min` : `Today, starts in ${Math.floor(mins / 60)} h ${mins % 60} min`) : `${WEEKDAYS_LONG[next.day - 1]}, ${relativeDays(startsAt, now)}`;
  const groups = next.groupLabels.length ? (next.groupLabels.some((g) => g.length === 1) ? `Group ${next.groupLabels.join(" and ")}` : next.groupLabels.join(", ")) : "";
  const attendanceHref = `/lecturer/courses/${next.course.id}/attendance?session=${next.id}&date=${localDate(startsAt)}`;

  return (
    <section aria-labelledby="next-class" className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#002a85] via-[#003cbb] to-[#2563eb] p-5 text-white shadow-[0_10px_30px_-12px_rgba(0,60,187,0.55)] md:p-7">
      <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold ring-1 ring-white/20">
            <span className={cn("size-2 rounded-full", live ? "animate-pulse bg-emerald-300" : "bg-sky-200")} /> {live ? "Live" : "Next class"} · {when}
          </p>
          {next.source === "lecturer" && <span className="text-[11px] font-medium text-white/70">Added by you</span>}
        </div>
        <h2 id="next-class" className="mt-4 text-[28px] leading-tight font-bold tracking-tight md:text-[34px]">
          {timeRange(next.start, next.end)}
        </h2>
        <p className="mt-1 text-[16px] font-semibold text-white/95">
          {next.course.code} · {next.course.title}
        </p>
        <p className="mt-1 text-[14px] text-white/75">
          {[groups, next.online ? "Online" : `${next.venue}, ${next.building}`].filter(Boolean).join(" · ")}
        </p>
        {next.topic && <p className="mt-3 text-[13px] text-white/70">This week: {next.topic}</p>}

        <div className="mt-6 grid grid-cols-4 gap-2 sm:flex sm:gap-6">
          <RoundAction tone="onBrand" icon={ScanLine} label="Take attendance" href={attendanceHref} />
          <RoundAction tone="onBrand" icon={Presentation} label="Share slides" href={`/lecturer/courses/${next.course.id}?tab=materials`} />
          <RoundAction tone="onBrand" icon={Megaphone} label="Post a note" href={`/lecturer/courses/${next.course.id}?tab=overview&compose=1`} />
          <RoundAction tone="onBrand" icon={CalendarX2} label="Cancel or move" href={`/lecturer/schedule?session=${next.id}`} />
        </div>
      </div>
    </section>
  );
}

// ── Needs you ────────────────────────────────────────────────────────────────

function urgencyChip(task: TodayTask, now: Date) {
  if (task.urgency === "overdue") return <Chip tone="red">Overdue</Chip>;
  if (task.deadline) {
    const label = `Due ${relativeDays(task.deadline, now)}`;
    return task.urgency === "soon" ? <Chip tone="amber">{label}</Chip> : <Chip tone="neutral" noIcon>{label}</Chip>;
  }
  const waiting: Partial<Record<TaskKind, [string, "amber" | "red"]>> = {
    "grades-returned": ["Action needed", "red"],
    questions: ["Over 24 h", "amber"],
    attendance: ["Missing register", "amber"],
    chapters: ["Over 7 days", "amber"],
  };
  const w = waiting[task.kind];
  return task.urgency === "soon" && w ? <Chip tone={w[1]}>{w[0]}</Chip> : null;
}

function NeedsYou({ tasks, nextDeadline, now }: { tasks: TodayTask[]; nextDeadline: TodayPayload["nextDeadline"]; now: Date }) {
  if (!tasks.length) {
    return (
      <Surface className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60">
          <PartyPopper className="size-6 text-emerald-600" />
        </span>
        <h2 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Nothing needs you today.</h2>
        {nextDeadline ? (
          <Link href={nextDeadline.href} className="inline-flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-[#003cbb] hover:underline dark:text-[#7aa2ff]">
            Next deadline: {nextDeadline.label} due {shortDate(nextDeadline.date)} <ArrowRight className="size-4" />
          </Link>
        ) : (
          <p className="text-[14px] text-gray-500">No deadlines coming up.</p>
        )}
      </Surface>
    );
  }

  return (
    <section aria-labelledby="needs-you">
      <SectionTitle title="Needs you" count={tasks.length} />
      <ul className="flex flex-col gap-2.5" id="needs-you">
        {tasks.map((task) => {
          const meta = TASK_META[task.kind];
          return (
            <li key={task.id}>
              <Link
                href={task.href}
                className={cn(
                  "group flex items-center gap-4 rounded-[20px] border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-px hover:shadow-md md:p-5 dark:bg-gray-900",
                  task.urgency === "overdue" ? "border-red-200 dark:border-red-900/60" : task.urgency === "soon" ? "border-amber-200 dark:border-amber-900/50" : "border-gray-200 dark:border-gray-800",
                )}
              >
                <span className={cn("relative flex size-12 shrink-0 items-center justify-center rounded-2xl", meta.tint)}>
                  <meta.icon className="size-5" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  {/* Count read first by screen readers: "14 registrations to approve" */}
                  <h3 className="text-[15px] font-bold text-gray-900 md:text-[16px] dark:text-gray-100">{task.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-gray-500 md:text-[14px] dark:text-gray-400">{task.detail}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 empty:hidden">{urgencyChip(task, now)}</div>
                </div>
                <span className="hidden text-[28px] font-bold tracking-tight text-gray-900 tabular-nums sm:block dark:text-gray-100" aria-hidden>
                  {task.count}
                </span>
                <ChevronRight className="size-5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 dark:text-gray-600" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── This week ───────────────────────────────────────────────────────────────

function WeekStrip({ week, now }: { week: TodayPayload["week"]; now: Date }) {
  const withDeadlines = week.flatMap((d) => d.deadlines.map((label) => ({ label, date: d.date })));
  return (
    <Surface>
      <SectionTitle
        title="This week"
        action={
          <Link href="/lecturer/schedule" className="text-[13px] font-semibold text-[#3159d1] hover:underline dark:text-[#7aa2ff]">
            My week
          </Link>
        }
      />
      <ol className="grid grid-cols-7 gap-1">
        {week.map((d, i) => {
          const date = new Date(d.date);
          const isToday = daysBetween(now, date) === 0;
          const past = date < now && !isToday;
          return (
            <li key={d.date}>
              <Link
                href={`/lecturer/schedule?day=${i + 1}`}
                aria-label={`${WEEKDAYS_LONG[i]}: ${d.classes} classes${d.deadlines.length ? `, ${d.deadlines.length} deadlines` : ""}`}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-colors",
                  isToday ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "hover:bg-gray-50 dark:hover:bg-gray-800",
                  past && "opacity-50",
                )}
              >
                <span className={cn("text-[11px] font-semibold", isToday ? "text-white/70 dark:text-gray-500" : "text-gray-400")}>{WEEKDAYS[i].slice(0, 2)}</span>
                <span className="text-[16px] font-bold tabular-nums">{date.getDate()}</span>
                <span className="flex h-1.5 gap-0.5">
                  {Array.from({ length: Math.min(d.classes, 3) }).map((_, k) => (
                    <span key={k} className={cn("size-1.5 rounded-full", isToday ? "bg-sky-300 dark:bg-[#003cbb]" : "bg-[#003cbb] dark:bg-[#4d82ff]")} />
                  ))}
                  {d.deadlines.length > 0 && <span className="size-1.5 rounded-full bg-amber-500" />}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {withDeadlines.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          {withDeadlines.map((d) => (
            <li key={d.label} className="flex items-center gap-2 text-[13px]">
              <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
              <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{d.label}</span>
              <span className="text-gray-400">{WEEKDAYS[isoDay(new Date(d.date)) - 1]}</span>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}

function Shortcuts() {
  const { hasRole } = useLecturer();
  const items = [
    { href: "/lecturer/courses", label: "My courses", hint: "Class lists, materials, grades", icon: BookOpen },
    hasRole("course_advisor") && { href: "/lecturer/advising", label: "Course advising", hint: "Level 100 registrations", icon: ClipboardCheck },
    hasRole("supervisor") && { href: "/lecturer/supervision", label: "Supervision", hint: "Chapters and milestones", icon: FileText },
    { href: "/lecturer/office-hours", label: "Office hours", hint: "Slots and bookings", icon: Users },
  ].filter(Boolean) as { href: string; label: string; hint: string; icon: LucideIcon }[];
  return (
    <Surface padded={false} className="overflow-hidden">
      <p className="px-5 pt-5 pb-2 text-[16px] font-bold text-gray-900 md:px-6 dark:text-gray-100">Go to</p>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="flex min-h-[60px] items-center gap-3 px-5 hover:bg-gray-50 md:px-6 dark:hover:bg-gray-800/60">
              <i.icon className="size-5 text-gray-400" />
              <span className="flex-1">
                <span className="block text-[14px] font-semibold text-gray-900 dark:text-gray-100">{i.label}</span>
                <span className="block text-[12px] text-gray-500">{i.hint}</span>
              </span>
              <ChevronRight className="size-4 text-gray-300" />
            </Link>
          </li>
        ))}
      </ul>
    </Surface>
  );
}

function TodaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6" aria-busy aria-label="Loading your day">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-[260px] w-full rounded-[24px]" />
        <CardSkeleton rows={4} />
      </div>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-[180px] w-full rounded-[20px]" />
        <Skeleton className="h-[240px] w-full rounded-[20px]" />
      </div>
    </div>
  );
}
