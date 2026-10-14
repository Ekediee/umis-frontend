"use client";

/**
 * 2.3 Class list · 2.3a partial list while registration is open · 2.4 student
 * in this course (private note, at-risk flag, message). Server-side paging
 * kicks in for 300+ classes; here we page at 50 rows client-side.
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { ArrowDownUp, Download, Flag, Info, MessageSquare, Search, StickyNote, Users } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi, type CourseSummary } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { fullName, plural, shortDate } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import { signalLabel, signalTone } from "@/lib/lecturer/rules";
import type { CourseStudentRow } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Btn, CardSkeleton, Checkbox, Chip, Dot, ErrorState, ExplainedEmpty, Field, Input, KeyValue, PersonAvatar, Segmented, Select, Textarea } from "../ui/primitives";
import { Sheet } from "../ui/sheet";
import { useCourseParams } from "./course-workspace";

type Sort = "name" | "attendance" | "ca";
const PAGE = 50;

export function StudentsTab({ course, group }: { course: CourseSummary; group: string }) {
  const q = useLecturerQuery(`classlist:${course.id}:${group}`, () => lecturerApi.getClassList(course.id, group));
  const { params, set } = useCourseParams();
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState<Sort>("name");
  const [filter, setFilter] = useState<"all" | "attention" | "flagged">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [messageOpen, setMessageOpen] = useState(false);
  const openId = params.get("student");

  const rows = useMemo(() => {
    let list = q.data ?? [];
    const t = term.trim().toLowerCase();
    if (t) list = list.filter((r) => `${r.student.firstName} ${r.student.lastName} ${r.student.matric}`.toLowerCase().includes(t));
    if (filter === "attention") list = list.filter((r) => r.signals.length > 0);
    if (filter === "flagged") list = list.filter((r) => r.enrolment.flaggedAtRisk);
    const sorted = [...list];
    if (sort === "attendance") sorted.sort((a, b) => a.enrolment.attendancePct - b.enrolment.attendancePct);
    if (sort === "ca") sorted.sort((a, b) => (a.caTotal ?? -1) - (b.caTotal ?? -1));
    return sorted;
  }, [q.data, term, sort, filter]);

  const visible = rows.slice(0, page * PAGE);
  const attention = q.data?.filter((r) => r.signals.length).length ?? 0;
  const flagged = q.data?.filter((r) => r.enrolment.flaggedAtRisk).length ?? 0;
  const openRow = q.data?.find((r) => r.student.id === openId);
  const active = rows.filter((r) => r.enrolment.status === "active");
  const allSelected = active.length > 0 && active.every((r) => selected.has(r.student.id));

  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const exportCsv = () => {
    const header = ["Name", "Matric", "Programme", "Group", "Attendance %", "CA so far", "Status"];
    const lines = rows.map((r) => [fullName(r.student), r.student.matric, r.student.programme, course.groups.find((g) => g.id === r.enrolment.groupId)?.option ?? "", r.enrolment.attendancePct, r.caTotal ?? "", r.enrolment.status]);
    const csv = [header, ...lines, [], ["Contains student data. Nigeria Data Protection Act 2023: use for teaching only."]].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.code.replace(/\s/g, "")}-class-list.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (q.error) return <ErrorState error={q.error} screen="Class list" onRetry={q.refetch} />;
  if (!q.data) return <CardSkeleton rows={6} />;

  return (
    <div className="flex flex-col gap-4">
      {course.week <= 3 && (
        <p className="flex items-start gap-2 rounded-2xl bg-[#eef3fd] px-4 py-3 text-[13px] text-[#0b2a72] dark:bg-[#003cbb]/20 dark:text-[#cfe0ff]">
          <Info className="mt-0.5 size-4 shrink-0" /> Registration is open. {q.data.length} students registered so far. The list updates every hour.
        </p>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-[320px]">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
          <Input value={term} onChange={(e) => (setTerm(e.target.value), setPage(1))} placeholder="Search name or matric" className="pl-10" aria-label="Search students" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            ariaLabel="Filter students"
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: q.data.length },
              { value: "attention", label: "Needs attention", count: attention },
              { value: "flagged", label: "Flagged", count: flagged },
            ]}
          />
          <label className="sr-only" htmlFor="sort">
            Sort
          </label>
          <div className="relative">
            <ArrowDownUp className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-gray-400" />
            <Select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 w-[170px] pl-9 text-[13px]">
              <option value="name">Sort: Name</option>
              <option value="attendance">Sort: Attendance</option>
              <option value="ca">Sort: CA so far</option>
            </Select>
          </div>
          <Btn size="sm" variant="secondary" icon={Download} onClick={exportCsv}>
            Excel
          </Btn>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-2 z-20 flex items-center justify-between gap-3 rounded-2xl bg-gray-900 px-4 py-2.5 text-white shadow-lg dark:bg-white dark:text-gray-900">
          <span className="text-[14px] font-semibold">{plural(selected.size, "student")} selected</span>
          <div className="flex gap-2">
            <Btn size="sm" variant="ghost" className="text-white hover:bg-white/10 dark:text-gray-900 dark:hover:bg-gray-100" onClick={() => setSelected(new Set())}>
              Clear
            </Btn>
            <Btn size="sm" variant="secondary" icon={MessageSquare} onClick={() => setMessageOpen(true)}>
              Message selected
            </Btn>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <ExplainedEmpty compact icon={Users} title="No students match" reason={filter !== "all" ? "Nobody fits this filter right now. Try All." : "Check the spelling, or search by matric number."} />
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Desktop table */}
          <Table className="hidden w-full text-left text-[14px] md:table">
            <TableHeader className="bg-gray-50 text-[12px] font-semibold tracking-wide text-gray-500 uppercase dark:bg-gray-800/50">
              <TableRow>
                <TableHead className="w-12 pl-2">
                  <Checkbox label="Select all" checked={allSelected} indeterminate={!allSelected && selected.size > 0} onChange={(v) => setSelected(v ? new Set(active.map((r) => r.student.id)) : new Set())} />
                </TableHead>
                <TableHead className="py-3">Student</TableHead>
                <TableHead>Programme</TableHead>
                {course.groups.length > 1 && <TableHead>Group</TableHead>}
                <TableHead className="text-right">Attendance</TableHead>
                <TableHead className="text-right">CA so far</TableHead>
                <TableHead className="pr-5 pl-4">Signals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:border-gray-100 dark:[&_tr]:border-gray-800">
              {visible.map((r) => (
                <StudentRowDesktop key={r.student.id} r={r} course={course} selected={selected.has(r.student.id)} onSelect={toggle} onOpen={() => set({ student: r.student.id })} />
              ))}
            </TableBody>
          </Table>
          {/* Mobile list */}
          <ul className="divide-y divide-gray-100 md:hidden dark:divide-gray-800">
            {visible.map((r) => (
              <li key={r.student.id} className={cn("flex items-center gap-1 pr-3", r.enrolment.status === "dropped" && "opacity-50")}>
                <Checkbox label={`Select ${fullName(r.student)}`} checked={selected.has(r.student.id)} disabled={r.enrolment.status === "dropped"} onChange={(v) => toggle(r.student.id, v)} />
                <button type="button" onClick={() => set({ student: r.student.id })} className="flex min-h-[64px] flex-1 items-center gap-3 text-left">
                  <PersonAvatar first={r.student.firstName} last={r.student.lastName} src={r.student.photoUrl} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                      {signalTone(r.signals) && <Dot tone={signalTone(r.signals)!} />}
                      {fullName(r.student)}
                    </span>
                    <span className="block truncate text-[12px] text-gray-500">
                      {r.student.matric} · {r.enrolment.attendancePct}% · CA {r.caTotal ?? "–"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {visible.length < rows.length && (
            <div className="border-t border-gray-100 p-3 text-center dark:border-gray-800">
              <Btn variant="ghost" onClick={() => setPage((p) => p + 1)}>
                Show {Math.min(PAGE, rows.length - visible.length)} more of {rows.length - visible.length}
              </Btn>
            </div>
          )}
        </div>
      )}

      <StudentSheet row={openRow} course={course} onClose={() => set({ student: null })} />
      <MessageSheet open={messageOpen} onClose={() => setMessageOpen(false)} ids={[...selected]} onSent={() => setSelected(new Set())} />
    </div>
  );
}

function StudentRowDesktop({ r, course, selected, onSelect, onOpen }: { r: CourseStudentRow; course: CourseSummary; selected: boolean; onSelect: (id: string, v: boolean) => void; onOpen: () => void }) {
  const dropped = r.enrolment.status === "dropped";
  const tone = signalTone(r.signals);
  return (
    <TableRow className={cn("cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40", dropped && "opacity-50", selected && "bg-[#f5f8fe] dark:bg-[#003cbb]/10")} onClick={onOpen}>
      <TableCell className="pl-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox label={`Select ${fullName(r.student)}`} checked={selected} disabled={dropped} onChange={(v) => onSelect(r.student.id, v)} />
      </TableCell>
      <TableCell className="py-2.5">
        <div className="flex items-center gap-3">
          <PersonAvatar first={r.student.firstName} last={r.student.lastName} src={r.student.photoUrl} size={36} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
              {fullName(r.student)}
              {r.enrolment.tags.map((t) => (
                <Chip key={t} tone="purple" noIcon className="h-5 text-[11px]">
                  {t === "carry-over" ? "Carry-over" : "Other programme"}
                </Chip>
              ))}
              {r.enrolment.flaggedAtRisk && (
                <Chip tone="red" icon={Flag} className="h-5 text-[11px]">
                  Flagged
                </Chip>
              )}
            </p>
            <p className="text-[12px] text-gray-500">{dropped ? `Dropped ${shortDate(r.enrolment.droppedOn!)}` : r.student.matric}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-gray-600 dark:text-gray-400">{r.student.programme}</TableCell>
      {course.groups.length > 1 && <TableCell className="text-gray-600 dark:text-gray-400">{course.groups.find((g) => g.id === r.enrolment.groupId)?.label}</TableCell>}
      <TableCell className={cn("text-right font-semibold tabular-nums", r.enrolment.attendancePct < 75 ? "text-amber-600" : "text-gray-900 dark:text-gray-100")}>{r.enrolment.attendancePct}%</TableCell>
      <TableCell className="text-right font-semibold text-gray-900 tabular-nums dark:text-gray-100">{r.caTotal ?? <span className="text-gray-400">–</span>}</TableCell>
      <TableCell className="pr-5 pl-4">
        {tone ? (
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
            <Dot tone={tone} />
            {r.signals.map(signalLabel).join(" · ")}
          </span>
        ) : (
          <span className="text-[12px] text-gray-400">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function StudentSheet({ row, course, onClose }: { row?: CourseStudentRow; course: CourseSummary; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [flagNote, setFlagNote] = useState("");
  const [flagging, setFlagging] = useState(false);
  const saveNote = useMutation((n: string) => lecturerApi.saveStudentNote(course.id, row!.student.id, n), { invalidates: [`classlist:${course.id}`] });
  const flag = useMutation((n: string) => lecturerApi.flagStudent(course.id, row!.student.id, n), { invalidates: [`classlist:${course.id}`] });
  const [lastId, setLastId] = useState<string | null>(null);
  if (row && row.student.id !== lastId) {
    setLastId(row.student.id);
    setNote(row.enrolment.privateNote ?? "");
    setFlagging(false);
    setFlagNote("");
  }
  const s = row?.student;
  const now = appNow();

  return (
    <Sheet open={!!row} onClose={onClose} variant="panel" title={s ? fullName(s) : ""} description={s ? `${s.matric} · ${s.programme} · Level ${s.level}` : undefined}>
      {row && s && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <PersonAvatar first={s.firstName} last={s.lastName} src={s.photoUrl} size={64} />
            <div className="flex flex-wrap gap-1.5">
              {row.signals.map((sig) => (
                <Chip key={signalLabel(sig)} tone={sig.kind === "missed-ca" ? "red" : "amber"}>
                  {signalLabel(sig)}
                </Chip>
              ))}
              {row.enrolment.flaggedAtRisk && (
                <Chip tone="red" icon={Flag}>
                  Flagged to advisor
                </Chip>
              )}
            </div>
          </div>
          <div>
            <KeyValue label="Course advisor" value={s.advisorName} />
            <KeyValue label="Group" value={course.groups.find((g) => g.id === row.enrolment.groupId)?.option} />
            <KeyValue label={`Attendance in ${course.code}`} value={`${row.enrolment.attendancePct}%`} />
            <KeyValue label="CA so far" value={row.caTotal === null ? "Not entered" : `${row.caTotal} of ${course.caWeight}`} />
          </div>
          <p className="text-[12px] text-gray-400">Grades from other courses are not shown. You only see this student because they take {course.code}.</p>

          <Field label="Private note" htmlFor="private-note" hint="Only you see this. Teaching assistants never do.">
            <Textarea id="private-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. Asked for extra time on CA 2; illness letter seen." />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Btn
              variant="secondary"
              icon={StickyNote}
              loading={saveNote.pending}
              disabled={note === (row.enrolment.privateNote ?? "")}
              onClick={async () => {
                await saveNote.mutate(note).catch(() => undefined);
                toast.success("Note saved");
              }}
            >
              Save note
            </Btn>
            <Btn variant="secondary" icon={MessageSquare} onClick={() => toast.info("Messaging opens a thread tied to this course.", { description: "Direct messages ship in phase 3 (4.6)." })}>
              Message
            </Btn>
            {!row.enrolment.flaggedAtRisk && (
              <Btn variant="danger" icon={Flag} onClick={() => setFlagging(true)}>
                Flag to advisor
              </Btn>
            )}
          </div>

          {flagging && (
            <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/30">
              <Field label={`Tell ${s.advisorName} why`} htmlFor="flag-note" hint={`The student never sees the word "risk". They see "Your lecturer wants to check in".`}>
                <Textarea id="flag-note" value={flagNote} onChange={(e) => setFlagNote(e.target.value)} rows={3} placeholder={row.signals.map(signalLabel).join(". ") || "What have you noticed?"} />
              </Field>
              <div className="mt-3 flex justify-end gap-2">
                <Btn variant="ghost" size="sm" onClick={() => setFlagging(false)}>
                  Cancel
                </Btn>
                <Btn
                  size="sm"
                  variant="dark"
                  loading={flag.pending}
                  disabled={flagNote.trim().length < 5}
                  onClick={async () => {
                    const r = await flag.mutate(flagNote).catch(() => undefined);
                    if (r) toast.success(`Flag sent to ${r.advisor}`, { description: `You'll see "Advisor followed up" when they act. ${shortDate(now)}` });
                    setFlagging(false);
                  }}
                >
                  Send flag
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function MessageSheet({ open, onClose, ids, onSent }: { open: boolean; onClose: () => void; ids: string[]; onSent: () => void }) {
  const [body, setBody] = useState("");
  const send = useMutation(lecturerApi.messageStudents);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Message ${plural(ids.length, "student")}`}
      description="Each student gets a private message. For something the whole group must know, post an announcement."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            loading={send.pending}
            disabled={body.trim().length < 3}
            onClick={async () => {
              const r = await send.mutate(ids, body).catch(() => undefined);
              if (r) {
                toast.success(`Sent to ${plural(r.sent, "student")}`);
                setBody("");
                onSent();
                onClose();
              }
            }}
          >
            Send
          </Btn>
        </>
      }
    >
      <Textarea data-autofocus value={body} onChange={(e) => setBody(e.target.value)} rows={5} aria-label="Message" placeholder="Write your message" />
    </Sheet>
  );
}
