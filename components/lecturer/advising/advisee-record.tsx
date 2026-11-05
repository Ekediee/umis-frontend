"use client";

/**
 * Advisor's view of one student: unofficial transcript, CA scores in courses
 * they are taking now, and the course audit (failed, missing, still to do).
 * Read-only. Nothing here changes the student's record.
 */

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, BookOpenCheck, CheckCircle2, Clock, Download, FileText, GraduationCap, ListChecks, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { fullName, plural } from "@/lib/lecturer/format";
import { useMutation } from "@/lib/lecturer/query";
import { auditMessage } from "@/lib/lecturer/rules";
import type { AdviseeRecord, AuditCourse, AuditStatus, CourseAudit, CurrentCourse, TranscriptSemester } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Btn, BtnLink, Chip, ExplainedEmpty, Field, ProgressBar, Stat, Surface, Textarea, type Tone } from "../ui/primitives";
import { Sheet } from "../ui/sheet";

const SEMESTER = { 1: "First semester", 2: "Second semester" } as const;

// ── Overview ─────────────────────────────────────────────────────────────────

export function OverviewTab({ record, audit, onOpen }: { record: AdviseeRecord; audit: CourseAudit; onOpen: (tab: "transcript" | "current" | "audit") => void }) {
  const r = record.registration;
  const failedChecks = r.checks.filter((c) => !c.passed);
  const caEntered = record.current.flatMap((c) => c.assessments).filter((a) => a.score !== null);
  const lowAttendance = record.current.filter((c) => c.attendancePct !== null && c.attendancePct < 75);
  return (
    <div className="flex flex-col gap-5">
      <Surface>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          <Stat label="CGPA" value={record.cgpa !== null ? record.cgpa.toFixed(2) : "—"} hint={record.cgpa !== null ? `${record.transcript.length} semesters` : "No results yet"} />
          <Stat label="Standing" value={record.standing} tone={record.standing === "Good" ? undefined : "amber"} />
          <Stat label="Failed, not retaken" value={audit.counts.failed} tone={audit.counts.failed ? "red" : undefined} />
          <Stat label="Required, missing" value={audit.counts.missing} tone={audit.counts.missing ? "amber" : undefined} />
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-[13px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Core units passed</span>
            <span className="text-gray-500 tabular-nums">
              {audit.unitsPassed} of {audit.unitsRequired}
            </span>
          </div>
          <ProgressBar value={audit.unitsPassed} max={audit.unitsRequired} label="Core units passed" />
        </div>
      </Surface>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryLink icon={FileText} title="Unofficial transcript" detail={record.transcript.length ? `${plural(record.transcript.length, "semester")} of results` : "No published results yet"} onClick={() => onOpen("transcript")} />
        <SummaryLink
          icon={BookOpenCheck}
          title="Current courses"
          detail={record.current.length ? `${plural(record.current.length, "course")} · ${plural(caEntered.length, "CA score")} in${lowAttendance.length ? ` · ${lowAttendance.length} below 75% attendance` : ""}` : "Not registered yet"}
          onClick={() => onOpen("current")}
          tone={lowAttendance.length ? "amber" : undefined}
        />
        <SummaryLink
          icon={ListChecks}
          title="Course audit"
          detail={audit.counts.failed + audit.counts.missing ? `${audit.counts.failed} failed · ${audit.counts.missing} missing` : "Nothing failed or missing"}
          onClick={() => onOpen("audit")}
          tone={audit.counts.failed ? "red" : audit.counts.missing ? "amber" : undefined}
        />
      </div>

      <Surface>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-bold text-gray-900 dark:text-gray-100">
            This semester&rsquo;s registration · {record.term.session}, {SEMESTER[record.term.semester].toLowerCase()}
          </h2>
          <BtnLink href={`/lecturer/advising/${r.id}`} size="sm" variant="secondary">
            Open
          </BtnLink>
        </div>
        {r.status === "not_submitted" ? (
          <p className="text-[14px] text-gray-500">Not submitted yet.</p>
        ) : failedChecks.length ? (
          <ul className="flex flex-col gap-1.5">
            {failedChecks.map((c) => (
              <li key={c.id} className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800 dark:bg-red-950/30 dark:text-red-300">
                <XCircle className="mt-0.5 size-4 shrink-0" />
                <span>
                  <strong>{c.label}:</strong> {c.detail}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-[14px] text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" /> All checks passed · {r.courses.reduce((s, c) => s + c.units, 0)} units
          </p>
        )}
      </Surface>
    </div>
  );
}

function SummaryLink({ icon: Icon, title, detail, onClick, tone }: { icon: typeof FileText; title: string; detail: string; onClick: () => void; tone?: "red" | "amber" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-[20px] border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef3fd] text-[#003cbb] dark:bg-[#003cbb]/20 dark:text-[#4d82ff]", tone === "red" && "bg-red-50 text-red-600 dark:bg-red-950/40", tone === "amber" && "bg-amber-50 text-amber-600 dark:bg-amber-950/40")}>
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-[14px] font-bold text-gray-900 dark:text-gray-100">{title}</span>
        <span className="block text-[13px] text-gray-500">{detail}</span>
      </span>
    </button>
  );
}

// ── Transcript ───────────────────────────────────────────────────────────────

export function TranscriptTab({ record }: { record: AdviseeRecord }) {
  if (!record.transcript.length)
    return <ExplainedEmpty icon={FileText} title="No published results yet" reason={`${record.student.firstName} is in their first semester. Results appear here once they are published.`} />;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-[13px] font-medium text-amber-900 dark:text-amber-200">Unofficial transcript. For advising only; Registry issues the official transcript.</p>
        <Btn size="sm" variant="secondary" icon={Download} onClick={() => downloadTranscript(record)}>
          Download PDF
        </Btn>
      </div>
      {record.transcript.map((sem) => (
        <SemesterResults key={`${sem.session}-${sem.semester}`} sem={sem} />
      ))}
    </div>
  );
}

function SemesterResults({ sem }: { sem: TranscriptSemester }) {
  const units = sem.courses.reduce((s, c) => s + c.units, 0);
  return (
    <Surface padded={false}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5 pb-3 md:px-6">
        <h2 className="text-[16px] font-bold text-gray-900 dark:text-gray-100">
          {sem.session} · {SEMESTER[sem.semester]} · Level {sem.level}
        </h2>
        <span className="text-[13px] font-semibold text-gray-500 tabular-nums">
          GPA {sem.gpa.toFixed(2)} · CGPA {sem.cgpa.toFixed(2)} · {units} units
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[14px]">
          <thead>
            <tr className="border-y border-gray-100 text-[12px] font-semibold text-gray-500 dark:border-gray-800">
              <th className="px-5 py-2 md:px-6">Course</th>
              <th className="py-2">Title</th>
              <th className="py-2 text-right">Units</th>
              <th className="py-2 text-right">Score</th>
              <th className="py-2 text-center">Grade</th>
              <th className="py-2 pr-5 text-right md:pr-6">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sem.courses.map((c) => (
              <tr key={c.code} className={cn(c.grade === "F" && "bg-red-50/60 dark:bg-red-950/20")}>
                <td className="px-5 py-2.5 font-bold whitespace-nowrap text-gray-900 md:px-6 dark:text-gray-100">{c.code}</td>
                <td className="py-2.5 text-gray-700 dark:text-gray-300">{c.title}</td>
                <td className="py-2.5 text-right text-gray-500 tabular-nums">{c.units}</td>
                <td className="py-2.5 text-right text-gray-700 tabular-nums dark:text-gray-300">{c.score}</td>
                <td className="py-2.5 text-center">
                  <span className={cn("font-bold", c.grade === "F" ? "text-red-600" : "text-gray-900 dark:text-gray-100")}>{c.grade}</span>
                </td>
                <td className="py-2.5 pr-5 text-right text-gray-500 tabular-nums md:pr-6">{c.gradePoint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}

/** A plain, printable unofficial transcript. jsPDF is loaded only when asked for. */
async function downloadTranscript(record: AdviseeRecord) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  let y = 56;
  const line = (text: string, size = 10, bold = false) => {
    if (y > 790) {
      doc.addPage();
      y = 56;
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.text(text, left, y);
    y += size + 6;
  };
  const s = record.student;
  line("Babcock University · BU Pulse", 9);
  line("UNOFFICIAL TRANSCRIPT · FOR ADVISING ONLY", 14, true);
  line(`${fullName(s)} · ${s.matric} · ${s.programme} · Level ${s.level}`, 10);
  line(`CGPA ${record.cgpa?.toFixed(2) ?? "—"} · Standing: ${record.standing}`, 10);
  y += 8;
  for (const sem of record.transcript) {
    line(`${sem.session} · ${SEMESTER[sem.semester]} · Level ${sem.level}    GPA ${sem.gpa.toFixed(2)} · CGPA ${sem.cgpa.toFixed(2)}`, 11, true);
    for (const c of sem.courses) {
      const row = [c.code.padEnd(10), c.title.slice(0, 46).padEnd(48), String(c.units).padStart(2), String(c.score).padStart(5), c.grade.padStart(4)].join(" ");
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      if (y > 790) {
        doc.addPage();
        y = 56;
      }
      doc.text(row, left, y);
      y += 14;
    }
    y += 8;
  }
  line("Registry issues the official transcript. This copy was generated from BU Pulse for course advising.", 8);
  doc.save(`unofficial-transcript-${s.matric.replace("/", "-")}.pdf`);
  toast.success("Transcript downloaded");
}

// ── Current courses (CA scores so far) ───────────────────────────────────────

export function CurrentCoursesTab({ record }: { record: AdviseeRecord }) {
  if (!record.current.length)
    return <ExplainedEmpty icon={BookOpenCheck} title="Not registered yet" reason="Courses and CA scores show here once their registration is submitted." />;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-gray-500">CA scores are provisional until each lecturer submits final grades. A dash means the score isn&rsquo;t entered yet.</p>
      {record.current.map((c) => (
        <CurrentCourseCard key={c.code} course={c} carryOver={!!record.registration.courses.find((x) => x.code === c.code)?.carryOver} />
      ))}
    </div>
  );
}

function CurrentCourseCard({ course: c, carryOver }: { course: CurrentCourse; carryOver: boolean }) {
  const entered = c.assessments.filter((a) => a.score !== null);
  const got = entered.reduce((s, a) => s + (a.score ?? 0), 0);
  const of = entered.reduce((s, a) => s + a.max, 0);
  const pct = of ? got / of : null;
  const tone: Tone = pct === null ? "neutral" : pct < 0.4 ? "red" : pct < 0.5 ? "amber" : "green";
  const attTone = c.attendancePct === null ? undefined : c.attendancePct < 75 ? (c.attendancePct < 65 ? "red" : "amber") : undefined;
  return (
    <Surface>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-gray-900 dark:text-gray-100">
            {c.code} <span className="font-medium text-gray-700 dark:text-gray-300">{c.title}</span>
            {carryOver && (
              <Chip tone="purple" noIcon>
                Carry-over
              </Chip>
            )}
          </p>
          <p className="text-[12px] text-gray-500">
            {c.units} units · {c.lecturer}
          </p>
        </div>
        <Chip tone={tone} noIcon>
          {pct === null ? "No CA yet" : `CA so far ${got}/${of}`}
        </Chip>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {c.assessments.map((a) => (
          <div key={a.name} className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
            <p className="text-[12px] text-gray-500">{a.name}</p>
            <p className="text-[15px] font-bold text-gray-900 tabular-nums dark:text-gray-100">
              {a.score ?? "—"}
              <span className="text-[12px] font-medium text-gray-400">/{a.max}</span>
            </p>
          </div>
        ))}
        <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
          <p className="text-[12px] text-gray-500">Attendance</p>
          <p className={cn("text-[15px] font-bold tabular-nums", attTone === "red" ? "text-red-600" : attTone === "amber" ? "text-amber-600" : "text-gray-900 dark:text-gray-100")}>{c.attendancePct ?? "—"}%</p>
        </div>
      </div>
    </Surface>
  );
}

// ── Course audit ─────────────────────────────────────────────────────────────

const AUDIT_GROUPS: { status: AuditStatus; title: string; reason: string; tone: Tone; icon: typeof XCircle }[] = [
  { status: "failed", title: "Failed, not registered again", reason: "Must be retaken: add these to the registration.", tone: "red", icon: XCircle },
  { status: "missing", title: "Required but missing", reason: "Core courses from this or an earlier semester they never took or did not pick.", tone: "amber", icon: AlertTriangle },
  { status: "registered", title: "Registered this semester", reason: "In the current registration.", tone: "blue", icon: Clock },
  { status: "passed", title: "Passed", reason: "Completed with E or better.", tone: "green", icon: CheckCircle2 },
  { status: "to_do", title: "Still to do", reason: "Courses for later semesters, plus electives not taken yet.", tone: "neutral", icon: GraduationCap },
];

export function AuditTab({ record, audit }: { record: AdviseeRecord; audit: CourseAudit }) {
  const [sending, setSending] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <Surface>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {AUDIT_GROUPS.map((g) => (
              <Chip key={g.status} tone={g.tone} icon={g.icon}>
                {audit.counts[g.status]} {g.title.split(",")[0].toLowerCase()}
              </Chip>
            ))}
          </div>
          <Btn icon={Send} onClick={() => setSending(true)}>
            Send to student
          </Btn>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[13px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Core units passed</span>
            <span className="text-gray-500 tabular-nums">
              {audit.unitsPassed} of {audit.unitsRequired} · {audit.unitsRequired - audit.unitsPassed} to go
            </span>
          </div>
          <ProgressBar value={audit.unitsPassed} max={audit.unitsRequired} label="Core units passed" />
        </div>
      </Surface>

      {AUDIT_GROUPS.map((g) => {
        const list = audit.courses.filter((c) => c.status === g.status);
        if (!list.length) return null;
        return <AuditGroup key={g.status} title={g.title} reason={g.reason} tone={g.tone} courses={list} collapsed={g.status === "to_do"} />;
      })}

      <SendAuditSheet record={record} audit={audit} open={sending} onClose={() => setSending(false)} />
    </div>
  );
}

function AuditGroup({ title, reason, tone, courses, collapsed }: { title: string; reason: string; tone: Tone; courses: AuditCourse[]; collapsed?: boolean }) {
  const [open, setOpen] = useState(!collapsed);
  const units = courses.reduce((s, c) => s + c.units, 0);
  return (
    <Surface padded={false}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 px-5 pt-5 pb-3 text-left md:px-6">
        <span>
          <span className="flex items-center gap-2 text-[16px] font-bold text-gray-900 dark:text-gray-100">
            {title}
            <Chip tone={tone} noIcon>
              {courses.length}
            </Chip>
          </span>
          <span className="text-[13px] text-gray-500">{reason}</span>
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-gray-500">
          {units} units · {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
          {courses.map((c) => (
            <li key={c.code} className="flex min-h-[52px] flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2 md:px-6">
              <span className="w-[84px] shrink-0 text-[13px] font-bold text-gray-900 dark:text-gray-100">{c.code}</span>
              <span className="min-w-0 flex-1 text-[14px] text-gray-700 dark:text-gray-300">
                {c.title}
                {c.kind === "elective" && <span className="ml-1.5 text-[12px] text-gray-400">Elective</span>}
                {c.retake && (
                  <Chip tone="purple" noIcon className="ml-2">
                    Retake
                  </Chip>
                )}
              </span>
              <span className="text-[12px] text-gray-500">
                Level {c.level} · {c.semester === 1 ? "1st" : "2nd"} sem
              </span>
              {c.grade && <span className={cn("w-6 text-center text-[13px] font-bold", c.grade === "F" ? "text-red-600" : "text-gray-900 dark:text-gray-100")}>{c.grade}</span>}
              <span className="w-8 text-right text-[13px] text-gray-500 tabular-nums">{c.units}u</span>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}

function SendAuditSheet({ record, audit, open, onClose }: { record: AdviseeRecord; audit: CourseAudit; open: boolean; onClose: () => void }) {
  const [body, setBody] = useState("");
  const [wasOpen, setWasOpen] = useState(false);
  const send = useMutation(lecturerApi.sendCheckIn);
  // Pre-fill each time the sheet opens, so it reflects the audit as it is now.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setBody(auditMessage(record.student.firstName, audit));
  }
  return (
    <Sheet
      open={open}
      onClose={onClose}
      dismissible={!send.pending}
      title={`Send course audit to ${fullName(record.student)}`}
      description="They get it in their BU Pulse inbox with a push and email. Edit anything before you send."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            icon={Send}
            loading={send.pending}
            disabled={body.trim().length < 10}
            onClick={async () => {
              const r = await send.mutate(record.student.id, body.trim()).catch(() => undefined);
              if (r) {
                toast.success(`Sent to ${record.student.firstName}`, { description: "Logged on their advising record." });
                onClose();
              }
            }}
          >
            Send
          </Btn>
        </>
      }
    >
      <Field label="Message" htmlFor="audit-msg">
        <Textarea id="audit-msg" value={body} onChange={(e) => setBody(e.target.value)} rows={12} />
      </Field>
      <p className="mt-2 text-[12px] text-gray-500">
        Need to change their registration instead?{" "}
        <Link href={`/lecturer/advising/${record.registration.id}`} className="font-semibold text-[#003cbb] hover:underline dark:text-[#4d82ff]">
          Open the registration
        </Link>
      </p>
    </Sheet>
  );
}
