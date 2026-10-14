"use client";

/**
 * 3.1 My week (merges the two old timetable screens) · 3.1a not
 * published yet · 3.1b clash · 3.2 add a class · 3.6 cancel, move or go online.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Calendar as CalendarIcon, CalendarPlus, Clock, Clock3, Download, Info, List as ListIcon, MapPin, ScanLine, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { WEEKDAYS, WEEKDAYS_LONG, formatSemester, groupName, isoDay, minutes, plural, shortDate, startOfDay, timeRange, localDate } from "@/lib/lecturer/format";
import { invalidate, useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { ClassSession } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { useLecturer } from "@/components/lecturer/shell/lecturer-provider";
import { SemesterSwitcher } from "@/components/lecturer/shell/menus";
import { Page } from "@/components/lecturer/shell/page";
import { Btn, BtnLink, CardSkeleton, Chip, ErrorState, Field, Input, PageHeader, Select, Textarea } from "@/components/lecturer/ui/primitives";
import { Sheet } from "@/components/lecturer/ui/sheet";
import { Button } from "@/components/ui/button";
import { CalendarView } from "@/components/timetable/calendar-view";
import { ListView } from "@/components/timetable/list-view";
import type { DayOfWeek, TimetableSession } from "@/components/timetable/types";

type ScheduleData = Awaited<ReturnType<typeof lecturerApi.getSchedule>>;
type Block = ScheduleData["sessions"][number];


export default function SchedulePage() {
  return (
    <Suspense>
      <Schedule />
    </Suspense>
  );
}

function Schedule() {
  const { semester } = useLecturer();
  const params = useSearchParams();
  const router = useRouter();
  const key = semester ? `schedule:${semester.code}` : null;
  const q = useLecturerQuery(key, () => lecturerApi.getSchedule(semester!.code));
  const now = appNow();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [adding, setAdding] = useState(false);
  const openId = params.get("session");
  const report = useMutation(lecturerApi.reportClash);


  const clashIds = useMemo(() => new Set(q.data?.clashes.flat() ?? []), [q.data]);
  const open = q.data?.sessions.find((s) => s.id === openId);
  const setOpen = (id: string | null) => router.replace(id ? `/lecturer/schedule?session=${id}` : "/lecturer/schedule", { scroll: false });
  // Lecturer sessions in the student timetable shape; the person column shows the group.
  const timetable = useMemo<TimetableSession[]>(
    () =>
      (q.data?.sessions ?? [])
        .filter((s) => !s.cancelled && s.day <= 5)
        .map((s) => ({
          id: s.id,
          code: s.course.code,
          title: s.course.title,
          lecturer: s.groupLabels.map(groupName).join(", "),
          venue: s.online ? "Online" : s.venue,
          day: WEEKDAYS[s.day - 1] as DayOfWeek,
          startTime: s.start,
          endTime: s.end,
          type: /lab/i.test(s.venue) ? "lab" : "lecture",
        })),
    [q.data],
  );
  // Clashing classes sit side by side instead of on top of each other.
  const laneOf = (t: TimetableSession) => {
    if (!clashIds.has(t.id)) return { lane: 0, lanes: 1 };
    const group = timetable.filter((o) => o.day === t.day && clashIds.has(o.id));
    return { lane: group.findIndex((o) => o.id === t.id), lanes: group.length };
  };

  const monday = startOfDay(now);
  monday.setDate(monday.getDate() - (isoDay(now) - 1));

  return (
    <Page wide>
      <div className="mb-4 md:hidden">
        <SemesterSwitcher compact />
      </div>
      <PageHeader
        title="My week"
        description={semester ? `${formatSemester(semester)} · week of ${shortDate(monday)}` : undefined}
        actions={
          <Btn icon={CalendarPlus} onClick={() => setAdding(true)}>
            Add a class
          </Btn>
        }
      />

      {q.error && <ErrorState error={q.error} screen="My week" onRetry={q.refetch} />}
      {!q.data && !q.error && <CardSkeleton rows={5} />}

      {q.data && (
        <div className="flex flex-col gap-4">
          {!q.data.officialPublished && (
            <div className="flex items-start gap-3 rounded-2xl bg-[#eef3fd] px-4 py-3 text-[14px] text-[#0b2a72] dark:bg-[#003cbb]/20 dark:text-[#cfe0ff]">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                Registry hasn&apos;t published the {semester ? formatSemester(semester) : ""} timetable yet (expected by {shortDate(q.data.registryExpected)}). Classes below are <strong>added by you</strong>{" "}so students can see them; we&apos;ll replace them when
                it&apos;s official.
              </p>
            </div>
          )}
          {q.data.clashes.map(([a, b]) => {
            const A = q.data!.sessions.find((s) => s.id === a)!;
            const B = q.data!.sessions.find((s) => s.id === b)!;
            return (
              <div key={a + b} role="alert" className="flex flex-col gap-2 rounded-2xl bg-red-50 px-4 py-3 text-[14px] text-red-900 ring-1 ring-red-100 sm:flex-row sm:items-center dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/50">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="flex-1">
                  <strong>Clash:</strong> {A.course.code} {A.groupLabels.map(groupName).join(", ")} and {B.course.code} both {WEEKDAYS[A.day - 1]} {A.start}.
                </p>
                <Btn
                  size="sm"
                  variant="secondary"
                  loading={report.pending}
                  onClick={async () => {
                    const r = await report.mutate(a, b).catch(() => undefined);
                    if (r) toast.success("Sent to the timetable officer", { description: `Both class details included. Reference ${r.reference}.` });
                  }}
                >
                  Report clash
                </Btn>
              </div>
            );
          })}

          {q.data.sessions.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-gray-200 p-10 text-center dark:border-gray-800">
              <p className="text-[16px] font-bold text-gray-900 dark:text-gray-100">No classes yet</p>
              <p className="mt-1 text-[14px] text-gray-500">Registry hasn&apos;t published the timetable. Add your classes so students see them.</p>
              <Btn className="mt-4" icon={CalendarPlus} onClick={() => setAdding(true)}>
                Add my classes
              </Btn>
            </div>
          ) : (
            <>
              <TimetableStats data={q.data} />

              {/* Main timetable card: same structure as the student timetable */}
              <div className="flex flex-col">
                <div className="relative z-20 flex flex-col items-center justify-between gap-4 rounded-t-2xl border border-gray-100 bg-[#F8FAFC] p-4 sm:flex-row dark:border-gray-800 dark:bg-gray-900">
                  <div className="rounded-full bg-[#CBF5E5] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#176448] uppercase dark:bg-emerald-900/40 dark:text-emerald-300">
                    {plural(timetable.length, "session")} this week
                  </div>
                  <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
                      {(
                        [
                          { value: "calendar", label: "Calendar", icon: CalendarIcon },
                          { value: "list", label: "List", icon: ListIcon },
                        ] as const
                      ).map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          aria-pressed={view === o.value}
                          onClick={() => setView(o.value)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                            view === o.value ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
                          )}
                        >
                          <o.icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{o.label}</span>
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => exportTimetable(timetable)}
                      className="h-10 gap-2 rounded-xl border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </div>
                </div>

                {view === "calendar" ? (
                  <CalendarView sessions={timetable} onSessionClick={(t) => setOpen(t.id)} flaggedIds={clashIds} laneOf={laneOf} />
                ) : (
                  <ListView sessions={timetable} onSessionClick={(t) => setOpen(t.id)} personLabel="GROUP" />
                )}
              </div>

              {q.data.officeHours.length > 0 && (
                <p className="flex flex-wrap items-center gap-2 text-[13px] text-gray-500">
                  <Clock3 className="size-4 text-teal-600" />
                  Office hours: {q.data.officeHours.map((o) => `${WEEKDAYS[o.day - 1]} ${timeRange(o.start, o.end)}`).join(" · ")}
                  <Link href="/lecturer/office-hours" className="font-semibold text-[#003cbb] hover:underline dark:text-[#7aa2ff]">
                    Manage
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      )}

      {q.data && <SessionSheet block={open} onClose={() => setOpen(null)} />}
      {q.data && <AddClassSheet open={adding} onClose={() => setAdding(false)} courses={q.data.courses} />}
    </Page>
  );
}

function SessionSheet({ block, onClose }: { block?: Block; onClose: () => void }) {
  const [mode, setMode] = useState<"view" | "cancel" | "move" | "online">("view");
  const [message, setMessage] = useState("");
  const [moveTo, setMoveTo] = useState({ day: 1, start: "10:00", end: "12:00", venue: "" });
  const [link, setLink] = useState("");
  const change = useMutation(lecturerApi.changeClass, { invalidates: ["schedule:", "today:", "course:"] });
  const now = appNow();

  const [forId, setForId] = useState<string | null>(null);
  if ((block?.id ?? null) !== forId) {
    setForId(block?.id ?? null);
    if (block) {
      setMode("view");
      setMessage("");
      setMoveTo({ day: block.day, start: block.start, end: block.end, venue: block.venue });
    }
  }

  if (!block) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;

  const date = new Date(startOfDay(now));
  date.setDate(date.getDate() + ((block.day - isoDay(now) + 7) % 7));

  const confirm = async () => {
    const c = mode === "cancel" ? ({ kind: "cancel" } as const) : mode === "move" ? ({ kind: "move", ...moveTo } as const) : ({ kind: "online", link } as const);
    const r = await change.mutate(block.id, c, message).catch(() => undefined);
    if (r) {
      toast.success(`${r.notified} students notified by push and email`);
      onClose();
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${block.course.code} · ${block.groupLabels.map(groupName).join(", ")}`}
      description={`${WEEKDAYS_LONG[block.day - 1]}, ${timeRange(block.start, block.end)}`}
      footer={
        mode === "view" ? undefined : (
          <>
            <Btn variant="ghost" onClick={() => setMode("view")}>
              Back
            </Btn>
            <Btn variant={mode === "cancel" ? "danger" : "primary"} loading={change.pending} disabled={(mode === "online" && !/^https?:\/\//.test(link)) || (mode === "move" && !moveTo.venue)} onClick={confirm}>
              {mode === "cancel" ? "Cancel class and notify" : mode === "move" ? "Move and notify" : "Make online and notify"}
            </Btn>
          </>
        )
      }
    >
      {mode === "view" ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{block.course.title}</p>
          <p className="flex items-center gap-2 text-[14px] text-gray-600 dark:text-gray-400">
            {block.online ? <Video className="size-4" /> : <MapPin className="size-4" />}
            {block.online ? block.online.link : `${block.venue}, ${block.building}`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {block.source === "lecturer" ? <Chip tone="neutral">Added by you</Chip> : <Chip tone="green">Official</Chip>}
            {block.cancelled && <Chip tone="red">Cancelled</Chip>}
          </div>
          <BtnLink href={`/lecturer/courses/${block.course.id}/attendance?session=${block.id}&date=${localDate(date)}`} icon={ScanLine} size="lg">
            Take attendance
          </BtnLink>
          <div className="grid grid-cols-3 gap-2">
            <Btn variant="secondary" onClick={() => setMode("move")}>
              Move
            </Btn>
            <Btn variant="secondary" onClick={() => setMode("online")}>
              Online
            </Btn>
            <Btn variant="danger" onClick={() => setMode("cancel")}>
              Cancel
            </Btn>
          </div>
          <Link href={`/lecturer/courses/${block.course.id}`} className="text-center text-[13px] font-semibold text-[#003cbb] hover:underline dark:text-[#7aa2ff]">
            Open course
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Every student in {block.groupLabels.map(groupName).join(" and ")} is notified at once by push and email. Aim for at least 2 hours&apos; notice.</p>
          {mode === "move" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Day" htmlFor="mv-day">
                <Select id="mv-day" value={moveTo.day} onChange={(e) => setMoveTo((m) => ({ ...m, day: Number(e.target.value) }))}>
                  {WEEKDAYS_LONG.slice(0, 6).map((d, i) => (
                    <option key={d} value={i + 1}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Venue" htmlFor="mv-venue">
                <Input id="mv-venue" value={moveTo.venue} onChange={(e) => setMoveTo((m) => ({ ...m, venue: e.target.value }))} />
              </Field>
              <Field label="Start" htmlFor="mv-start">
                <Input id="mv-start" type="time" value={moveTo.start} onChange={(e) => setMoveTo((m) => ({ ...m, start: e.target.value }))} />
              </Field>
              <Field label="End" htmlFor="mv-end">
                <Input id="mv-end" type="time" value={moveTo.end} onChange={(e) => setMoveTo((m) => ({ ...m, end: e.target.value }))} />
              </Field>
            </div>
          )}
          {mode === "online" && (
            <Field label="Meeting link" htmlFor="mv-link">
              <Input id="mv-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet…" />
            </Field>
          )}
          <Field label="Message to students" htmlFor="mv-msg" optional>
            <Textarea id="mv-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder={mode === "cancel" ? "e.g. I'm at a faculty board. We'll catch up on Thursday." : "Anything students should know"} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

function AddClassSheet({ open, onClose, courses }: { open: boolean; onClose: () => void; courses: ScheduleData["courses"] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const course = courses.find((c) => c.id === courseId);
  const [pickedGroup, setGroupId] = useState("");
  const groupId = course?.groups.some((g) => g.id === pickedGroup) ? pickedGroup : (course?.groups[0]?.id ?? "");
  const [day, setDay] = useState(1);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("10:00");
  const [venue, setVenue] = useState("");
  const [building, setBuilding] = useState("");
  const add = useMutation(lecturerApi.addClass, { invalidates: ["schedule:", "today:", "course:"] });

  const valid = courseId && groupId && venue && minutes(end) > minutes(start);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a class"
      description="Students in that group see it on their schedule within a minute. It's labelled “Added by you” until the official timetable lands."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            disabled={!valid}
            loading={add.pending}
            onClick={async () => {
              const r = await add.mutate({ courseId, groupIds: [groupId], day, start, end, venue, building: building || "—" } as Omit<ClassSession, "id" | "source">).catch(() => undefined);
              if (r) {
                toast.success("Class added. Repeats weekly until the end of the semester.");
                invalidate("schedule:");
                onClose();
              }
            }}
          >
            Save
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course" htmlFor="ac-course">
          <Select id="ac-course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Group" htmlFor="ac-group">
          <Select id="ac-group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            {course?.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Day" htmlFor="ac-day">
          <Select id="ac-day" value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {WEEKDAYS_LONG.slice(0, 6).map((d, i) => (
              <option key={d} value={i + 1}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start" htmlFor="ac-start">
            <Input id="ac-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="End" htmlFor="ac-end" error={minutes(end) <= minutes(start) ? "Ends before it starts." : null}>
            <Input id="ac-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <Field label="Venue" htmlFor="ac-venue" hint="Search from the building list once the registry API is connected.">
          <Input id="ac-venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Hall 2" />
        </Field>
        <Field label="Building" htmlFor="ac-building" optional>
          <Input id="ac-building" value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="e.g. Science and Technology Complex" />
        </Field>
      </div>
    </Sheet>
  );
}

/** Stat cards: same markup as the student timetable. */
function TimetableStats({ data }: { data: ScheduleData }) {
  const active = data.sessions.filter((s) => !s.cancelled);
  const hours = active.reduce((sum, s) => sum + (minutes(s.end) - minutes(s.start)) / 60, 0);
  const groups = new Set(active.flatMap((s) => s.groupIds)).size;
  const venues = new Set(active.map((s) => (s.online ? "Online" : s.venue))).size;
  const stats = [
    { value: data.courses.length, label: "Courses", icon: BookOpen, tint: "bg-blue-50 dark:bg-blue-900/20", color: "text-blue-600 dark:text-blue-400" },
    { value: `${Math.round(hours * 10) / 10}h`, label: "Teaching hours weekly", icon: Clock, tint: "bg-purple-50 dark:bg-purple-900/20", color: "text-purple-600 dark:text-purple-400" },
    { value: groups, label: "Groups", icon: Users, tint: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600 dark:text-emerald-400" },
    { value: venues, label: "Venues", icon: MapPin, tint: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-600 dark:text-amber-400" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", s.tint)}>
            <s.icon className={cn("h-5 w-5", s.color)} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function exportTimetable(sessions: TimetableSession[]) {
  const rows = [["Day", "Start", "End", "Course", "Title", "Group", "Venue"], ...sessions.map((s) => [s.day, s.startTime, s.endTime, s.code, s.title, s.lecturer, s.venue])];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "my-week.csv";
  a.click();
  URL.revokeObjectURL(url);
}
