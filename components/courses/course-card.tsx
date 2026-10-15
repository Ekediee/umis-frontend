import Link from "next/link";
import { CalendarClock, FileText, MessageCircleQuestion, Megaphone } from "lucide-react";
import type { CourseSpace } from "@/lib/student/types";
import { relativeDue } from "@/lib/student/rules";
import { cn } from "@/lib/utils";
import { CoverSurface } from "./cover";

export function CourseCard({ space, now }: { space: CourseSpace; now: number }) {
  const due = space.nextDeadline;
  const dueSoon = due && new Date(due.dueAt).getTime() - now < 48 * 3600_000;
  return (
    <Link
      href={`/courses/${encodeURIComponent(space.courseId)}`}
      className="group bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#003cbb]/30"
    >
      <CoverSurface tone={space.tone} className="h-[104px] px-5 pt-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[22px] font-bold tracking-tight leading-none drop-shadow-sm">{space.courseId}</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-bold">
            {space.units} {space.units === 1 ? "unit" : "units"}
          </span>
        </div>
        {space.isCarryOver && <span className="mt-2 inline-flex px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-bold uppercase tracking-wider">Carry-over</span>}
      </CoverSurface>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="min-w-0">
          <h3 className="text-[15px] md:text-[16px] font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 group-hover:text-[#003cbb] dark:group-hover:text-[#4d82ff] transition-colors">{space.title}</h3>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 truncate">{space.instructor || "Lecturer to be assigned"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-gray-500 dark:text-gray-400">
          <span className={cn("inline-flex items-center gap-1.5", space.unreadPosts > 0 && "text-[#003cbb] dark:text-[#4d82ff] font-semibold")}>
            <Megaphone className="w-3.5 h-3.5" />
            {space.unreadPosts > 0 ? `${space.unreadPosts} new` : "Up to date"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircleQuestion className="w-3.5 h-3.5" />
            {space.openQuestions} open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {space.materialsCount} files
          </span>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
          {due ? (
            <p className={cn("flex items-center gap-2 text-[12px] font-semibold", dueSoon ? "text-amber-700 dark:text-amber-300" : "text-gray-600 dark:text-gray-300")}>
              <CalendarClock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {due.title} · due {relativeDue(due.dueAt, new Date(now))}
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-[12px] font-medium text-gray-400 dark:text-gray-500">
              <CalendarClock className="w-3.5 h-3.5" />
              Nothing due
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="h-[104px] bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-1/2 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse mt-2" />
      </div>
    </div>
  );
}
