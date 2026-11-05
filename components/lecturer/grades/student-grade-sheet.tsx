"use client";

/**
 * One student's marks in a bottom sheet (side panel on desktop). Opened by
 * tapping a name on the grade sheet. Built for the phone loop "check, type,
 * next": big inputs, a live total and grade, Save and next, and ‹ › to step
 * through the class in the order shown on the sheet.
 */

import { useState } from "react";
import { AlertTriangle, CalendarCheck2, ChevronLeft, ChevronRight, Lock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { fullName, groupName } from "@/lib/lecturer/format";
import { letterFor, roundHalfUp, validateScore } from "@/lib/lecturer/grading";
import type { ExamStatus, Letter } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Btn, Chip, PersonAvatar, Textarea } from "../ui/primitives";
import { Sheet } from "../ui/sheet";

type SheetData = Awaited<ReturnType<typeof lecturerApi.getGradeSheet>>;
type Sat = "sat" | ExamStatus;

const LETTER_TONE: Record<Letter, string> = {
  A: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  B: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  C: "bg-[#eef3fd] text-[#003cbb] dark:bg-[#003cbb]/25 dark:text-[#9bb8ff]",
  D: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  E: "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
  F: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
};

const STATUS_OPTIONS: { value: Sat; label: string }[] = [
  { value: "sat", label: "Sat the exam" },
  { value: "absent", label: "Absent" },
  { value: "incomplete", label: "Incomplete" },
];

export function StudentGradeSheet({
  data,
  studentId,
  order,
  editable,
  highlighted,
  onNavigate,
  onClose,
  onSaved,
}: {
  data: SheetData;
  studentId: string | null;
  /** Student ids in the order shown on the grade sheet (respects filters). */
  order: string[];
  editable: boolean;
  highlighted: Set<string>;
  onNavigate: (id: string) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const row = studentId ? data.rows.find((r) => r.student.id === studentId) : undefined;
  const c = data.course;

  // Draft state, reset whenever a different student opens.
  const [forId, setForId] = useState<string | null>(null);
  const [caText, setCaText] = useState("");
  const [caReset, setCaReset] = useState(false);
  const [examText, setExamText] = useState("");
  const [status, setStatus] = useState<Sat>("sat");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if ((row?.student.id ?? null) !== forId) {
    setForId(row?.student.id ?? null);
    if (row) {
      setCaText(row.grade.ca === null ? "" : String(row.grade.ca));
      setCaReset(false);
      setExamText(row.enrolment.examScore === null ? "" : String(row.enrolment.examScore));
      setStatus(row.enrolment.examStatus ?? "sat");
      setReason(row.enrolment.examStatusReason ?? "");
      setError(null);
      setConfirmDiscard(false);
    }
  }

  if (!row) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;

  const g = row.grade;
  const e = row.enrolment;
  const locked = !editable || (data.sheet.status === "returned" && !highlighted.has(row.student.id));
  const lockReason = !editable ? "This sheet has been submitted, so marks are read-only." : "This sheet was returned. Only the highlighted rows can change.";

  // Validation and the live preview.
  const caCheck = validateScore(caText, c.caWeight, "CA");
  const examCheck = status === "sat" ? validateScore(examText, c.examWeight, "Exam") : ({ ok: true, value: null } as const);
  const caValue = caReset ? g.caComputed : caCheck.ok ? caCheck.value : null;
  const examValue = examCheck.ok ? examCheck.value : null;
  const total = status === "sat" && examValue !== null ? roundHalfUp((caValue ?? 0) + examValue) : null;
  const letter = total !== null ? letterFor(total) : null;

  const initialCa = g.ca === null ? "" : String(g.ca);
  const initialExam = e.examScore === null ? "" : String(e.examScore);
  const initialStatus: Sat = e.examStatus ?? "sat";
  const caChanged = caReset ? g.caEdited : caText.trim() !== initialCa;
  const statusChanged = status !== initialStatus || (status !== "sat" && reason.trim() !== (e.examStatusReason ?? ""));
  const examChanged = status === "sat" && examText.trim() !== initialExam;
  const dirty = !locked && (caChanged || statusChanged || examChanged);
  const reasonMissing = status !== "sat" && reason.trim().length < 5;
  const invalid = (!caReset && !caCheck.ok) || !examCheck.ok || reasonMissing;

  const index = order.indexOf(row.student.id);
  const prevId = index > 0 ? order[index - 1] : null;
  const nextId = index >= 0 && index < order.length - 1 ? order[index + 1] : null;

  const save = async (): Promise<boolean> => {
    if (!dirty) return true;
    if (invalid) {
      setError(!caReset && !caCheck.ok ? caCheck.message : !examCheck.ok ? examCheck.message : "Add a reason of at least 5 characters for the status.");
      return false;
    }
    setSaving(true);
    setError(null);
    try {
      if (caChanged) await lecturerApi.saveCaTotal(c.id, data.sheet.groupId, row.student.id, caReset ? null : caCheck.ok ? caCheck.value : null);
      if (statusChanged) await lecturerApi.setExamStatus(c.id, row.student.id, status === "sat" ? null : status, status === "sat" ? "" : reason.trim());
      if (status === "sat" && (examChanged || statusChanged)) await lecturerApi.saveExamScore(c.id, data.sheet.groupId, row.student.id, examValue);
      onSaved();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const go = async (id: string | null) => {
    if (!id) return;
    if (await save()) onNavigate(id);
  };

  const requestClose = () => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const primary = async () => {
    if (!dirty) return nextId ? onNavigate(nextId) : onClose();
    if (!(await save())) return;
    toast.success(`Saved ${row.student.firstName}'s marks`);
    if (nextId) onNavigate(nextId);
    else onClose();
  };

  const group = c.groups.find((x) => x.id === e.groupId);

  return (
    <Sheet
      open
      variant="panel"
      onClose={requestClose}
      dismissible={!saving}
      title={
        <span className="flex items-center gap-3">
          <PersonAvatar first={row.student.firstName} last={row.student.lastName} size={44} />
          <span className="min-w-0">
            <span className="block truncate">{fullName(row.student)}</span>
            <span className="block text-[13px] font-medium text-gray-500 tabular-nums">
              {row.student.matric}
              {group && ` · ${groupName(group.label)}`}
            </span>
          </span>
        </span>
      }
      footer={
        locked ? (
          <div className="flex w-full items-center justify-between gap-2">
            <NavButtons prevId={prevId} nextId={nextId} onGo={(id) => id && onNavigate(id)} position={index + 1} count={order.length} />
            <Btn variant="secondary" onClick={onClose}>
              Close
            </Btn>
          </div>
        ) : confirmDiscard ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">Discard changes to {row.student.firstName}&apos;s marks?</p>
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={() => setConfirmDiscard(false)}>
                Keep editing
              </Btn>
              <Btn variant="danger" onClick={onClose}>
                Discard
              </Btn>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            <NavButtons prevId={prevId} nextId={nextId} onGo={go} position={index + 1} count={order.length} disabled={saving} />
            <Btn className="flex-1 sm:flex-none" loading={saving} disabled={dirty && invalid} onClick={primary}>
              {dirty ? (nextId ? "Save and next" : "Save") : nextId ? "Next student" : "Done"}
            </Btn>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        {/* Live result */}
        <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
          <div className="flex-1">
            <p className="text-[12px] font-semibold tracking-wider text-gray-500 uppercase">Total</p>
            <p className="text-[32px] leading-none font-bold text-gray-900 tabular-nums dark:text-gray-50">
              {status !== "sat" ? "—" : (total ?? "–")}
              <span className="ml-1 text-[15px] font-semibold text-gray-400">/100</span>
            </p>
            <p className="mt-1 text-[12px] text-gray-500 tabular-nums">
              CA {caValue ?? "–"} + Exam {status === "sat" ? (examValue ?? "–") : STATUS_OPTIONS.find((o) => o.value === status)!.label.toLowerCase()}
            </p>
          </div>
          {letter ? (
            <span className={cn("flex size-14 items-center justify-center rounded-2xl text-[26px] font-bold", LETTER_TONE[letter])} aria-label={`Grade ${letter}`}>
              {letter}
            </span>
          ) : (
            <span className="flex size-14 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-[13px] text-gray-400 dark:border-gray-700">No grade</span>
          )}
        </div>

        {locked && (
          <p className="flex items-start gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-[13px] text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Lock className="mt-0.5 size-4 shrink-0" /> {lockReason}
          </p>
        )}
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}

        {/* Editable marks */}
        <div className="grid grid-cols-2 gap-3">
          <ScoreField
            id="sg-ca"
            label="CA"
            max={c.caWeight}
            value={caText}
            disabled={locked}
            invalid={!caReset && !caCheck.ok}
            onChange={(v) => {
              setCaText(v);
              setCaReset(false);
              setError(null);
            }}
            hint={
              (g.caEdited && !caReset) || (caText.trim() !== "" && caText.trim() !== String(g.caComputed ?? "")) ? (
                <span className="flex flex-wrap items-center gap-x-1.5">
                  Calculated: {g.caComputed ?? "–"}
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => {
                        setCaText(g.caComputed === null ? "" : String(g.caComputed));
                        setCaReset(true);
                      }}
                      className="inline-flex items-center gap-0.5 font-semibold text-[#003cbb] hover:underline dark:text-[#4d82ff]"
                    >
                      <RotateCcw className="size-3" /> Use calculated
                    </button>
                  )}
                </span>
              ) : (
                "From the CA assessments"
              )
            }
          />
          <ScoreField
            id="sg-exam"
            label="Exam"
            max={c.examWeight}
            value={status === "sat" ? examText : ""}
            placeholder={status === "sat" ? "–" : "n/a"}
            disabled={locked || status !== "sat"}
            invalid={status === "sat" && !examCheck.ok}
            onChange={(v) => {
              setExamText(v);
              setError(null);
            }}
            hint={status === "sat" ? "Blank stays blank, not zero" : "Not needed with this status"}
          />
        </div>

        {/* Exam status */}
        <fieldset disabled={locked}>
          <legend className="mb-2 text-[13px] font-semibold text-gray-800 dark:text-gray-200">Exam status</legend>
          <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={status === o.value}
                onClick={() => {
                  setStatus(o.value);
                  setError(null);
                }}
                className={cn(
                  "h-10 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60",
                  status === o.value ? "bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          {status !== "sat" && (
            <div className="mt-3">
              <label htmlFor="sg-reason" className="mb-1.5 block text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                Reason <span className="font-normal text-gray-400">(goes to your HOD)</span>
              </label>
              <Textarea id="sg-reason" value={reason} onChange={(ev) => setReason(ev.target.value)} rows={2} aria-invalid={reasonMissing} placeholder="e.g. Medical certificate from the health centre, dated 2 Dec." />
            </div>
          )}
        </fieldset>

        {/* Read-only context */}
        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-gray-800 dark:text-gray-200">CA assessments</h3>
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
            {data.assessments.map((a) => {
              const score = e.caScores[a.id];
              return (
                <li key={a.id} className="flex min-h-[44px] items-center justify-between gap-3 px-4 text-[14px]">
                  <span className="text-gray-700 dark:text-gray-300">{a.name}</span>
                  <span className="font-semibold text-gray-900 tabular-nums dark:text-gray-100">
                    {score === null || score === undefined ? <span className="font-normal text-gray-400">{a.released ? "Not entered" : "Not graded yet"}</span> : `${score} / ${a.maxMarks}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex flex-wrap gap-1.5">
          <Chip tone={e.attendancePct < 75 ? "amber" : "neutral"} icon={CalendarCheck2}>
            Attendance {e.attendancePct}%
          </Chip>
          {e.tags.includes("carry-over") && (
            <Chip tone="purple" noIcon>
              Carry-over
            </Chip>
          )}
          {e.tags.includes("other-programme") && (
            <Chip tone="purple" noIcon>
              Other programme
            </Chip>
          )}
          {highlighted.has(row.student.id) && <Chip tone="red">Flagged by HOD</Chip>}
        </div>
      </div>
    </Sheet>
  );
}

function ScoreField({
  id,
  label,
  max,
  value,
  onChange,
  disabled,
  invalid,
  hint,
  placeholder = "–",
}: {
  id: string;
  label: string;
  max: number;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  hint?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-gray-800 dark:text-gray-200">
        {label} <span className="font-normal text-gray-400">out of {max}</span>
      </label>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid}
          onChange={(ev) => onChange(ev.target.value)}
          onFocus={(ev) => ev.target.select()}
          className={cn(
            "h-14 w-full rounded-2xl border bg-white pr-12 pl-4 text-[22px] font-bold tabular-nums outline-none focus:ring-3 disabled:bg-gray-50 disabled:text-gray-400 dark:bg-gray-950 dark:text-gray-100 dark:disabled:bg-gray-900",
            invalid ? "border-red-400 focus:ring-red-100 dark:border-red-700" : "border-gray-200 focus:border-[#003cbb] focus:ring-[#003cbb]/15 dark:border-gray-700",
          )}
        />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[14px] font-medium text-gray-400">/{max}</span>
      </div>
      {invalid ? (
        <p className="mt-1 text-[12px] font-medium text-red-600 dark:text-red-400">
          {label} is out of {max}.
        </p>
      ) : (
        hint && <p className="mt-1 text-[12px] text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

function NavButtons({ prevId, nextId, onGo, position, count, disabled }: { prevId: string | null; nextId: string | null; onGo: (id: string | null) => void; position: number; count: number; disabled?: boolean }) {
  const cls =
    "inline-flex size-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-35 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800";
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={cls} onClick={() => onGo(prevId)} disabled={!prevId || disabled} aria-label="Previous student">
        <ChevronLeft className="size-5" />
      </button>
      <span className="min-w-[52px] text-center text-[12px] font-semibold text-gray-500 tabular-nums">
        {position} of {count}
      </span>
      <button type="button" className={cls} onClick={() => onGo(nextId)} disabled={!nextId || disabled} aria-label="Next student">
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
