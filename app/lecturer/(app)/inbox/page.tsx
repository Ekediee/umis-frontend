"use client";

/** 1.4 Notifications inbox: grouped Today / This week / Earlier; each names the course and the action. */

import Link from "next/link";
import { BellOff, BookOpen, CalendarCheck, CheckCheck, ClipboardCheck, FileText, MessageCircleQuestion, RefreshCw, Users, type LucideIcon } from "lucide-react";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { daysBetween, timeAgo } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { LecturerNotification, NotificationKind } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Page } from "@/components/lecturer/shell/page";
import { Btn, CardSkeleton, ErrorState, ExplainedEmpty, PageHeader } from "@/components/lecturer/ui/primitives";

const ICON: Record<NotificationKind, { icon: LucideIcon; tint: string }> = {
  grades: { icon: BookOpen, tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
  registration: { icon: ClipboardCheck, tint: "bg-[#eef3fd] text-[#003cbb] dark:bg-[#003cbb]/25 dark:text-[#9bb8ff]" },
  supervision: { icon: FileText, tint: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
  qa: { icon: MessageCircleQuestion, tint: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300" },
  booking: { icon: Users, tint: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300" },
  attendance: { icon: CalendarCheck, tint: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
  system: { icon: RefreshCw, tint: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
};

export default function InboxPage() {
  const q = useLecturerQuery("notifications", () => lecturerApi.getNotifications());
  const mark = useMutation(lecturerApi.markNotificationsRead, { invalidates: ["notifications"] });
  const now = appNow();

  const groups: { label: string; items: LecturerNotification[] }[] = [
    { label: "Today", items: [] },
    { label: "This week", items: [] },
    { label: "Earlier", items: [] },
  ];
  q.data?.forEach((n) => {
    const d = daysBetween(n.at, now);
    groups[d === 0 ? 0 : d < 7 ? 1 : 2].items.push(n);
  });
  const unread = q.data?.filter((n) => !n.read).length ?? 0;

  return (
    <Page className="max-w-[820px]">
      <PageHeader
        title="Inbox"
        description={unread ? `${unread} unread` : "You're all caught up"}
        actions={
          unread > 0 && (
            <Btn variant="secondary" icon={CheckCheck} loading={mark.pending} onClick={() => mark.mutate("all")}>
              Mark all read
            </Btn>
          )
        }
      />
      {q.error && <ErrorState error={q.error} screen="Inbox" onRetry={q.refetch} />}
      {!q.data && !q.error && <CardSkeleton rows={5} />}
      {q.data?.length === 0 && <ExplainedEmpty icon={BellOff} title="No notifications" reason="Deadlines, returned grades, chapter submissions and bookings land here. Reminders also go to your email." />}
      {q.data &&
        groups
          .filter((g) => g.items.length)
          .map((g) => (
            <section key={g.label} className="mb-6">
              <h2 className="mb-2 px-1 text-[12px] font-bold tracking-wider text-gray-400 uppercase">{g.label}</h2>
              <ul className="overflow-hidden rounded-[20px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                {g.items.map((n) => {
                  const meta = ICON[n.kind];
                  return (
                    <li key={n.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                      <Link href={n.href} onClick={() => !n.read && mark.mutate([n.id])} className={cn("flex items-start gap-3 px-4 py-4 hover:bg-gray-50 md:px-5 dark:hover:bg-gray-800/50", !n.read && "bg-[#f8faff] dark:bg-[#003cbb]/5")}>
                        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", meta.tint)}>
                          <meta.icon className="size-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className={cn("text-[14px] text-gray-900 dark:text-gray-100", n.read ? "font-medium" : "font-bold")}>{n.title}</span>
                            {n.course && <span className="rounded-md bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{n.course}</span>}
                          </span>
                          <span className="mt-0.5 block text-[13px] leading-snug text-gray-600 dark:text-gray-400">{n.body}</span>
                          <span className="mt-1 block text-[11px] font-medium text-gray-400">{timeAgo(n.at, now)}</span>
                        </span>
                        {!n.read && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-[#003cbb]" aria-label="Unread" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
    </Page>
  );
}
