"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CalendarX2, FileText, MapPin, Megaphone, Pin, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBubble, Pill, timeAgo, type Tone } from "@/components/student/ui";
import { studentApi } from "@/lib/student/api";
import { invalidateStudent } from "@/lib/student/query";
import type { FeedPost, FeedPostKind } from "@/lib/student/types";
import { cn } from "@/lib/utils";

const KIND: Record<FeedPostKind, { icon: LucideIcon; tone: Tone; label: string }> = {
  announcement: { icon: Megaphone, tone: "blue", label: "Announcement" },
  "venue-change": { icon: MapPin, tone: "amber", label: "Venue change" },
  cancellation: { icon: CalendarX2, tone: "red", label: "Class cancelled" },
  material: { icon: FileText, tone: "green", label: "New material" },
};

export function FeedTab({ courseId, posts, onOpenResources }: { courseId: string; posts: FeedPost[]; onOpenResources: () => void }) {
  // Opening the feed marks what the student has seen; the dot stays for this visit so they can find it.
  useEffect(() => {
    const unread = posts.filter((p) => !p.read).map((p) => p.id);
    if (!unread.length) return;
    const t = setTimeout(() => {
      studentApi.markFeedRead(courseId, unread).then(() => invalidateStudent("spaces"));
    }, 1500);
    return () => clearTimeout(t);
  }, [courseId, posts]);

  if (!posts.length) return <EmptyState icon={Megaphone} title="No posts yet" description="Announcements, venue changes and new materials from your lecturer will appear here." className="min-h-[240px]" />;

  return (
    <ul className="flex flex-col gap-3 md:gap-4">
      {posts.map((p) => {
        const k = KIND[p.kind];
        return (
          <li
            key={p.id}
            className={cn(
              "border border-gray-100 dark:border-gray-800 p-4 md:p-5 flex items-start gap-4 rounded-[20px] transition-colors",
              p.read ? "bg-white dark:bg-gray-900" : "bg-blue-50/40 dark:bg-[#4d82ff]/[0.04]",
            )}
          >
            <IconBubble icon={k.icon} tone={k.tone} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {p.pinned && (
                  <Pill tone="gray" icon={Pin}>
                    Pinned
                  </Pill>
                )}
                {p.kind !== "announcement" && <Pill tone={k.tone}>{k.label}</Pill>}
              </div>
              <h4 className={cn("text-[14px] md:text-[15px] leading-snug", p.read ? "font-semibold text-gray-800 dark:text-gray-200" : "font-extrabold text-gray-950 dark:text-gray-50")}>{p.title}</h4>
              <p className="text-[13px] md:text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1">{p.body}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
                <span className="text-[11px] md:text-[12px] font-medium text-gray-400">
                  {p.author} · {timeAgo(p.sentAt)}
                </span>
                {p.kind === "material" && (
                  <button type="button" onClick={onOpenResources} className="text-[12px] font-semibold text-[#003cbb] dark:text-[#4d82ff] hover:underline">
                    View in Resources
                  </button>
                )}
                {p.kind === "venue-change" && (
                  <Link href={`/campus-map?q=${encodeURIComponent("Amphitheatre")}`} className="text-[12px] font-semibold text-[#003cbb] dark:text-[#4d82ff] hover:underline">
                    Show on map
                  </Link>
                )}
              </div>
            </div>
            {!p.read && <span className="w-[8px] h-[8px] rounded-full bg-[#003cbb] dark:bg-[#4d82ff] shrink-0 mt-2" aria-label="New" />}
          </li>
        );
      })}
    </ul>
  );
}
