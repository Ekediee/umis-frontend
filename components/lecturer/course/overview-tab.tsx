"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, ClipboardPlus, Eye, Megaphone, MessageCircleQuestion, Pin, ScanLine, Upload } from "lucide-react";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { WEEKDAYS_LONG, groupName, plural, relativeDays, shortDate, timeAgo, timeRange, localDate } from "@/lib/lecturer/format";
import { Chip, RoundAction, SectionTitle, Stat, Surface } from "../ui/primitives";
import { AnnounceSheet } from "./announce-sheet";
import { useCourseParams } from "./course-workspace";

type CourseData = Awaited<ReturnType<typeof lecturerApi.getCourse>>;

export function OverviewTab({ data, group }: { data: CourseData; group: string }) {
  const { course: c, nextSession, lastAnnouncement, deadlines, unansweredQuestions } = data;
  const { params, set } = useCourseParams();
  const [composeOpen, setCompose] = useState(false);
  const compose = composeOpen || params.get("compose") === "1";
  const closeCompose = () => {
    setCompose(false);
    if (params.get("compose")) set({ compose: null });
  };
  const now = appNow();

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        <Surface>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Students" value={group === "all" ? c.enrolledTotal : c.groups.find((g) => g.id === group)?.enrolled ?? c.enrolledTotal} />
            <Stat label="Attendance avg" value={`${c.attendanceAvg}%`} tone={c.attendanceAvg < 75 ? "amber" : undefined} />
            <Stat label="CA graded" value={`${c.caGraded}/${c.caPlanned}`} />
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2 border-t border-gray-100 pt-5 dark:border-gray-800">
            {nextSession && <RoundAction icon={ScanLine} label="Take attendance" href={`/lecturer/courses/${c.id}/attendance?session=${nextSession.id}&date=${localDate(nextSession.startsAt)}`} />}
            <RoundAction icon={Megaphone} label="Announce" onClick={() => setCompose(true)} />
            <RoundAction icon={Upload} label="Upload" href={`/lecturer/courses/${c.id}?tab=materials`} />
            <RoundAction icon={ClipboardPlus} label="Assessment" href={`/lecturer/courses/${c.id}?tab=assessments&new=1`} />
          </div>
        </Surface>

        {nextSession && (
          <Surface className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef3fd] text-[#003cbb] dark:bg-[#003cbb]/25 dark:text-[#9bb8ff]">
              <CalendarClock className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-gray-500 uppercase">Next class · {relativeDays(nextSession.startsAt, now)}</p>
              <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                {WEEKDAYS_LONG[nextSession.day - 1]}, {timeRange(nextSession.start, nextSession.end)}
              </p>
              <p className="truncate text-[13px] text-gray-500">
                {nextSession.groupLabels.map(groupName).join(", ")} · {nextSession.online ? "Online" : `${nextSession.venue}, ${nextSession.building}`}
              </p>
            </div>
          </Surface>
        )}

        <Surface>
          <SectionTitle
            title="Last announcement"
            action={
              <button type="button" onClick={() => setCompose(true)} className="text-[13px] font-semibold text-[#3159d1] hover:underline dark:text-[#7aa2ff]">
                New
              </button>
            }
          />
          {lastAnnouncement ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{lastAnnouncement.title}</p>
                {lastAnnouncement.pinned && (
                  <Chip tone="blue" icon={Pin}>
                    Pinned
                  </Chip>
                )}
              </div>
              <p className="mt-1 text-[14px] leading-relaxed text-gray-600 dark:text-gray-400">{lastAnnouncement.body}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-gray-500">
                <Eye className="size-3.5" />
                {lastAnnouncement.seenBy !== null ? `Seen by ${lastAnnouncement.seenBy} of ${lastAnnouncement.recipients}` : `Sent to ${lastAnnouncement.recipients}; read count after an hour`} · {timeAgo(lastAnnouncement.sentAt, now)}
              </p>
            </div>
          ) : (
            <p className="text-[14px] text-gray-500">No announcements yet. Post one instead of a WhatsApp message; students can&apos;t miss it and the university can see it.</p>
          )}
        </Surface>
      </div>

      <div className="flex flex-col gap-5">
        <Surface>
          <SectionTitle title="Upcoming deadlines" />
          {deadlines.length ? (
            <ul className="flex flex-col gap-3">
              {deadlines.map((d) => (
                <li key={d.label} className="flex items-center justify-between gap-3 text-[14px]">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{d.label}</span>
                  <span className="text-[13px] text-gray-500">
                    {shortDate(d.date)} · {relativeDays(d.date, now)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-gray-500">No dated deadlines. Set due dates on assessments so students get reminders.</p>
          )}
        </Surface>
        <Link href={`/lecturer/courses/${c.id}?tab=qa`} className="block">
          <Surface className="flex items-center gap-3 transition-shadow hover:shadow-md">
            <MessageCircleQuestion className="size-5 text-sky-600" />
            <span className="flex-1 text-[14px] font-semibold text-gray-900 dark:text-gray-100">{unansweredQuestions ? `${plural(unansweredQuestions, "unanswered question")}` : "No unanswered questions"}</span>
            <span className="text-[13px] text-gray-400">Q&amp;A →</span>
          </Surface>
        </Link>
        <Surface>
          <SectionTitle title="Weekly topics" as="h3" />
          <ol className="flex flex-col gap-1.5 text-[13px]">
            {c.topics.slice(Math.max(0, c.week - 2), c.week + 2).map((t, i) => {
              const week = Math.max(1, c.week - 1) + i;
              return (
                <li key={t} className={week === c.week ? "font-bold text-gray-900 dark:text-gray-100" : "text-gray-500"}>
                  Week {week}: {t}
                </li>
              );
            })}
          </ol>
        </Surface>
      </div>
      <AnnounceSheet course={c} open={compose} onClose={closeCompose} defaultGroup={group} />
    </div>
  );
}
