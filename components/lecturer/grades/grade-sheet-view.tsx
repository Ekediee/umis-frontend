"use client";

/**
 * 5B.1 Grade sheet · 5B.2 pre-submit check · 5B.3 review and submit ·
 * 5B.4 status tracker · 5B.5 grade report · 5B.6 returned by HOD.
 *
 * The lecturer never types a letter: grades are computed from the scale.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Download, FileUp, Info, MoreHorizontal, Send, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { daysBetween, formatSemester, fullName, plural, shortDate } from "@/lib/lecturer/format";
import { GRADE_SCALE } from "@/lib/lecturer/grading";
import { invalidate, useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { ExamStatus, Letter } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Page } from "../shell/page";
import { BackButton, Btn, CardSkeleton, Chip, ErrorState, Field, ProgressBar, Segmented, Select, Surface, Textarea } from "../ui/primitives";
import { Sheet } from "../ui/sheet";
import { ImportSheet } from "./import-sheet";
import { ScoreGrid, type GridRow } from "./score-grid";
import { SheetStatusChip, StatusTracker } from "./status";

type Filter = "all" | "missing" | "over" | "noca" | "highlighted";

export function GradeSheetView({ courseId }: { courseId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const course = useLecturerQuery(`course:${courseId}`, () => lecturerApi.getCourse(courseId));
  const groupId = params.get("group") ?? course.data?.course.groups[0]?.id ?? null;
  const key = groupId ? `gradesheet:${courseId}:${groupId}` : null;
  const q = useLecturerQuery(key, () => lecturerApi.getGradeSheet(courseId, groupId!));
  const [filter, setFilter] = useState<Filter>("all");
  const [statusFor, setStatusFor] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const now = appNow();

  const refresh = () => {
    invalidate(`gradesheet:${courseId}`);
    invalidate("today:");
  };

  const data = q.data;
  const sheet = data?.sheet;
  const editable = sheet?.status === "open" || sheet?.status === "returned";
  const highlighted = new Set(sheet?.returnedStudentIds ?? []);

  const rows = useMemo(() => {
    if (!data) return [];
    const c = data.check;
    return data.rows
      .filter((r) => r.enrolment.status === "active")
      .filter((r) => {
        if (filter === "missing") return c.missingExam.includes(r.student.id);
        if (filter === "over") return c.overHundred.includes(r.student.id);
        if (filter === "noca") return c.noCa.includes(r.student.id);
        if (filter === "highlighted") return highlighted.has(r.student.id);
        return true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filter]);

  if (q.error || course.error)
    return (
      <Page>
        <ErrorState error={(q.error ?? course.error)!} screen="Grade sheet" onRetry={q.refetch} />
      </Page>
    );
  if (!data || !sheet || !course.data)
    return (
      <Page>
        <CardSkeleton rows={8} />
      </Page>
    );

  const c = data.course;
  const group = c.groups.find((g) => g.id === sheet.groupId)!;
  const groupName = c.groups.length > 1 ? (group.label.length <= 2 ? `Group ${group.label}` : group.label) : "";
  const daysLeft = daysBetween(now, sheet.dueDate);
  const check = data.check;

  const gridRows: GridRow[] = rows.map((r) => {
    const locked = !editable || (sheet.status === "returned" && !highlighted.has(r.student.id));
    const g = r.grade;
    return {
      id: r.student.id,
      first: r.student.firstName,
      last: r.student.lastName,
      matric: r.student.matric,
      value: r.enrolment.examScore,
      locked: locked || !!g.status,
      highlight: highlighted.has(r.student.id),
      tags: (
        <>
          {r.enrolment.tags.includes("carry-over") && (
            <Chip tone="purple" noIcon className="h-5 text-[11px]">
              Carry-over
            </Chip>
          )}
          {g.status && (
            <Chip tone="neutral" className="h-5 text-[11px]">
              {g.status === "absent" ? "Absent from exam" : "Incomplete"}
            </Chip>
          )}
        </>
      ),
      cells: [g.ca ?? <span className="text-gray-400">–</span>, g.total ?? <span className="text-gray-400">–</span>, g.letter ? <LetterBadge letter={g.letter} /> : <span className="text-gray-400">–</span>],
      trailing: editable && !locked ? (
        <button type="button" aria-label={`More options for ${fullName(r.student)}`} onClick={() => setStatusFor(r.student.id)} className="inline-flex size-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <MoreHorizontal className="size-4" />
        </button>
      ) : undefined,
    };
  });

  return (
    <Page wide>
      <BackButton href={`/lecturer/courses/${courseId}?tab=grades`} to={`${c.code} grades`} className="mb-4" />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 md:text-[26px] dark:text-gray-50">
            Grade sheet · {c.code} {groupName}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-gray-500">
            <SheetStatusChip status={sheet.status} /> {formatSemester(c.semesterCode)} · CA {c.caWeight} + exam {c.examWeight}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Btn variant="secondary" icon={FileUp} onClick={() => setImportOpen(true)}>
              Import exam scores
            </Btn>
          )}
          <Btn variant="secondary" icon={Download} onClick={() => exportReport(data, `${c.code} ${groupName}`)}>
            Export
          </Btn>
        </div>
      </div>

      {c.groups.length > 1 && (
        <Segmented
          ariaLabel="Group"
          size="sm"
          className="mb-4"
          value={sheet.groupId}
          onChange={(g) => router.replace(`/lecturer/courses/${courseId}/grades?group=${encodeURIComponent(g)}`)}
          options={c.groups.map((g) => ({ value: g.id, label: g.label.length <= 2 ? `Group ${g.label}` : g.label }))}
        />
      )}

      {sheet.status === "returned" && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-[14px] text-red-900 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/50">
          <Undo2 className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Returned by {sheet.history.at(-1)?.by}: {sheet.returnNote}</p>
            <p className="mt-0.5 text-[13px] opacity-80">Only the {plural(highlighted.size, "highlighted row")} can change. Fix them and resubmit; the history is kept.</p>
          </div>
          <Btn size="sm" variant="secondary" onClick={() => setFilter("highlighted")}>
            Show
          </Btn>
        </div>
      )}

      {editable ? (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-200 md:flex-row md:items-center md:gap-6 dark:bg-gray-900 dark:ring-gray-800">
          <p className={cn("flex items-center gap-2 text-[14px] font-semibold", daysLeft < 0 ? "text-red-600" : daysLeft <= 7 ? "text-amber-700 dark:text-amber-300" : "text-gray-900 dark:text-gray-100")}>
            <CalendarClock className="size-4" />
            {daysLeft < 0 ? `Overdue since ${shortDate(sheet.dueDate)}. Submit still works and is marked Late.` : `Due ${shortDate(sheet.dueDate)}, ${plural(daysLeft, "day")} left`}
          </p>
          <div className="flex flex-1 items-center gap-3">
            <ProgressBar value={check.complete} max={check.total} tone={check.complete === check.total ? "green" : "blue"} label="Rows complete" />
            <span className="shrink-0 text-[13px] font-semibold text-gray-700 tabular-nums dark:text-gray-300">
              {check.complete} of {check.total} complete
            </span>
          </div>
        </div>
      ) : (
        <Surface className="mb-4">
          <StatusTracker sheet={sheet} />
          <p className="mt-4 text-center text-[13px] text-gray-500">Read-only after submission. You&apos;ll be notified at each step. Need a change after release? Request a grade change with a reason.</p>
        </Surface>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {filter !== "all" && (
            <div className="mb-3 flex items-center justify-between rounded-xl bg-[#eef3fd] px-4 py-2 text-[13px] text-[#0b2a72] dark:bg-[#003cbb]/20 dark:text-[#cfe0ff]">
              Showing {plural(rows.length, "row")} that need attention
              <button type="button" onClick={() => setFilter("all")} className="min-h-[32px] font-semibold underline">
                Show all
              </button>
            </div>
          )}
          <ScoreGrid
            rows={gridRows}
            max={c.examWeight}
            label="Exam"
            beforeHeaders={[`CA (${c.caWeight})`]}
            extraHeaders={["Total", "Grade"]}
            onSave={async (id, v) => {
              await lecturerApi.saveExamScore(courseId, sheet.groupId, id, v);
              q.refetch();
              invalidate("today:");
            }}
          />
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-gray-500">
            <Info className="size-3.5" /> Totals round half up to a whole number before the grade applies (49.5 becomes 50, a C). Enter moves to the next row.
          </p>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
          <Surface>
            <h2 className="mb-3 text-[16px] font-bold text-gray-900 dark:text-gray-100">Before you submit</h2>
            <ul className="flex flex-col">
              <CheckRow ok={check.missingExam.length === 0} label="Missing exam scores" count={check.missingExam.length} onShow={() => setFilter("missing")} />
              <CheckRow ok={check.overHundred.length === 0} label="Totals over 100" count={check.overHundred.length} onShow={() => setFilter("over")} />
              <CheckRow ok={check.noCa.length === 0} warnOnly label="Students with no CA" count={check.noCa.length} onShow={() => setFilter("noca")} />
            </ul>
            <p className="mt-2 text-[12px] text-gray-500">Every row needs a total or a status (Absent from exam, Incomplete). Use ⋯ on a row to set one.</p>
            <h3 className="mt-5 mb-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300">Grade spread</h3>
            <Distribution dist={check.distribution} />
            {editable && (
              <Btn className="mt-5 w-full" size="lg" icon={Send} disabled={!check.canSubmit || !c.isGradeOwner} onClick={() => setSubmitOpen(true)}>
                {c.isGradeOwner ? "Review and submit" : "Ready for review"}
              </Btn>
            )}
            {editable && !c.isGradeOwner && <p className="mt-2 text-center text-[12px] text-gray-500">Only the grade owner submits.</p>}
          </Surface>
        </aside>
      </div>

      <ExamStatusSheet
        studentId={statusFor}
        name={statusFor ? fullName(data.rows.find((r) => r.student.id === statusFor)!.student) : ""}
        courseId={courseId}
        onClose={() => setStatusFor(null)}
        onSaved={refresh}
      />
      <SubmitSheet open={submitOpen} onClose={() => setSubmitOpen(false)} data={data} groupName={groupName} late={daysLeft < 0} onDone={refresh} />
      <ImportSheet
        open={importOpen}
        onClose={() => setImportOpen(false)}
        courseId={courseId}
        scoreLabel="Exam"
        template={data.rows.map((r) => ({ matric: r.student.matric, name: fullName(r.student) }))}
        onApply={async (rows) => {
          const byMatric = new Map(data.rows.map((r) => [r.student.matric, r.student.id]));
          let saved = 0;
          for (const r of rows) {
            const id = byMatric.get(r.matric);
            if (!id || (r.score !== null && (r.score > c.examWeight || r.score < 0))) continue;
            await lecturerApi.saveExamScore(courseId, sheet.groupId, id, r.score).then(() => saved++, () => undefined);
          }
          toast.success(`Imported ${plural(saved, "score")}`);
          refresh();
        }}
      />
    </Page>
  );
}

function LetterBadge({ letter }: { letter: Letter }) {
  const tone = { A: "text-emerald-700 bg-emerald-50", B: "text-sky-700 bg-sky-50", C: "text-[#003cbb] bg-[#eef3fd]", D: "text-amber-800 bg-amber-50", E: "text-orange-700 bg-orange-50", F: "text-red-700 bg-red-50" }[letter];
  return <span className={cn("inline-flex size-8 items-center justify-center rounded-lg text-[14px] font-bold dark:bg-gray-800 dark:text-gray-100", tone)}>{letter}</span>;
}

function CheckRow({ ok, label, count, onShow, warnOnly }: { ok: boolean; label: string; count: number; onShow: () => void; warnOnly?: boolean }) {
  return (
    <li className="flex min-h-[44px] items-center gap-3 border-b border-gray-100 last:border-0 dark:border-gray-800">
      {ok ? <CheckCircle2 className="size-5 text-emerald-500" /> : <AlertTriangle className={cn("size-5", warnOnly ? "text-amber-500" : "text-red-500")} />}
      <span className="flex-1 text-[14px] text-gray-800 dark:text-gray-200">{label}</span>
      <span className={cn("text-[14px] font-bold tabular-nums", ok ? "text-gray-400" : warnOnly ? "text-amber-600" : "text-red-600")}>{count}</span>
      {!ok && (
        <button type="button" onClick={onShow} className="min-h-[36px] px-1 text-[13px] font-semibold text-[#003cbb] hover:underline dark:text-[#7aa2ff]">
          Show
        </button>
      )}
    </li>
  );
}

function Distribution({ dist }: { dist: Record<Letter, number> }) {
  const max = Math.max(1, ...Object.values(dist));
  return (
    <div className="flex h-[120px] items-end gap-2" role="img" aria-label={`Grade spread: ${GRADE_SCALE.map((g) => `${dist[g.letter]} ${g.letter}`).join(", ")}`}>
      {GRADE_SCALE.map(({ letter }) => (
        <div key={letter} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[11px] font-semibold text-gray-500 tabular-nums">{dist[letter]}</span>
          <div className="w-full rounded-t-md bg-[#003cbb]/80 dark:bg-[#4d82ff]" style={{ height: `${Math.max(3, (dist[letter] / max) * 80)}px` }} />
          <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">{letter}</span>
        </div>
      ))}
    </div>
  );
}

function ExamStatusSheet({ studentId, name, courseId, onClose, onSaved }: { studentId: string | null; name: string; courseId: string; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState<ExamStatus>("absent");
  const [reason, setReason] = useState("");
  const save = useMutation((s: ExamStatus | null) => lecturerApi.setExamStatus(courseId, studentId!, s, reason));
  return (
    <Sheet
      open={!!studentId}
      onClose={onClose}
      size="sm"
      title={`Set a status for ${name}`}
      description="Use this when a student has no exam score for a reason. The reason goes to your HOD."
      footer={
        <>
          <Btn variant="ghost" onClick={() => save.mutate(null).then(() => (onSaved(), onClose()))}>
            Clear status
          </Btn>
          <Btn
            loading={save.pending}
            disabled={reason.trim().length < 5}
            onClick={async () => {
              await save.mutate(status).catch(() => undefined);
              onSaved();
              setReason("");
              onClose();
            }}
          >
            Save
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Status" htmlFor="exam-status">
          <Select id="exam-status" value={status} onChange={(e) => setStatus(e.target.value as ExamStatus)}>
            <option value="absent">Absent from exam</option>
            <option value="incomplete">Incomplete</option>
          </Select>
        </Field>
        <Field label="Reason" htmlFor="exam-reason">
          <Textarea id="exam-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Medical certificate from the health centre, dated 2 Dec." />
        </Field>
      </div>
    </Sheet>
  );
}

type SheetData = Awaited<ReturnType<typeof lecturerApi.getGradeSheet>>;

function SubmitSheet({ open, onClose, data, groupName, late, onDone }: { open: boolean; onClose: () => void; data: SheetData; groupName: string; late: boolean; onDone: () => void }) {
  const [lateReason, setLateReason] = useState("");
  const submit = useMutation(() => lecturerApi.submitGradeSheet(data.course.id, data.sheet.groupId, late ? lateReason : undefined));
  const d = data.check.distribution;
  const summary = GRADE_SCALE.map((g) => `${d[g.letter]} ${g.letter}`).join(", ");
  return (
    <Sheet
      open={open}
      onClose={onClose}
      dismissible={!submit.pending}
      title={`Submit ${data.course.code} ${groupName}`.trim()}
      description="You won't be able to edit after this. It goes to your HOD, then the dean, then the registry."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={submit.pending}>
            Not yet
          </Btn>
          <Btn
            icon={Send}
            loading={submit.pending}
            disabled={late && lateReason.trim().length < 5}
            onClick={async () => {
              const r = await submit.mutate().catch((e: Error) => {
                toast.error(e.message);
                return undefined;
              });
              if (r) {
                toast.success(r.alreadySubmitted ? "Already submitted" : "Submitted to your HOD", { description: "A PDF copy is saved to your downloads area." });
                onDone();
                onClose();
              }
            }}
          >
            Submit
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
          <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{plural(data.check.total, "student")}</p>
          <p className="mt-1 text-[14px] text-gray-600 dark:text-gray-300">{summary}</p>
          {data.rows.some((r) => r.grade.status) && <p className="mt-1 text-[13px] text-gray-500">{plural(data.rows.filter((r) => r.grade.status).length, "student")} with a status (absent or incomplete)</p>}
        </div>
        {late && (
          <Field label="Why is this late?" htmlFor="late-reason" hint="Your HOD sees this with the sheet.">
            <Textarea id="late-reason" value={lateReason} onChange={(e) => setLateReason(e.target.value)} rows={3} />
          </Field>
        )}
      </div>
    </Sheet>
  );
}

function exportReport(data: SheetData, title: string) {
  const header = ["Name", "Matric", "CA", "Exam", "Total", "Grade", "Status"];
  const lines = data.rows.map((r) => [fullName(r.student), r.student.matric, r.grade.ca ?? "", r.grade.exam ?? "", r.grade.total ?? "", r.grade.letter ?? "", r.grade.status ?? r.enrolment.status]);
  const csv = [[title], header, ...lines, [], ["Contains student data. Nigeria Data Protection Act 2023: use for teaching only."]]
    .map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "-")}-grades.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
