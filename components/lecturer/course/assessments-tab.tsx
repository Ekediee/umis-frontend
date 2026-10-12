"use client";

/** 5A.1 Assessments · 5A.2 create · 5A.3 submissions summary · 5A.5 release. */

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, ClipboardPlus, Eye, Send } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi, type CourseSummary } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { relativeDays, shortDate } from "@/lib/lecturer/format";
import { caPlanStatus } from "@/lib/lecturer/grading";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { AssessmentType } from "@/lib/lecturer/types";
import { Btn, CardSkeleton, Chip, ErrorState, Field, Input, ProgressBar, Select, Surface, Textarea, Toggle } from "../ui/primitives";
import { Sheet } from "../ui/sheet";
import { useCourseParams } from "./course-workspace";

type Data = Awaited<ReturnType<typeof lecturerApi.getAssessments>>;
type Row = Data["assessments"][number];

export function AssessmentsTab({ course }: { course: CourseSummary }) {
  const key = `assessments:${course.id}`;
  const q = useLecturerQuery(key, () => lecturerApi.getAssessments(course.id));
  const { params, set } = useCourseParams();
  const [creatingOpen, setCreating] = useState(false);
  const creating = creatingOpen || params.get("new") === "1";
  const [releasing, setReleasing] = useState<Row | null>(null);
  const now = appNow();


  if (q.error) return <ErrorState error={q.error} screen="Assessments" onRetry={q.refetch} />;
  if (!q.data) return <CardSkeleton rows={3} />;

  const plan = caPlanStatus(q.data.assessments, course.caWeight);

  return (
    <div className="flex flex-col gap-4">
      <Surface className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
              CA {plan.planned} of {plan.weight} marks planned
            </p>
            <p className="text-[13px] text-gray-500">
              CA {course.caWeight}% · exam {course.examWeight}%. Weighting locks once the first assessment is graded.
            </p>
          </div>
          <Btn icon={ClipboardPlus} onClick={() => setCreating(true)}>
            Add assessment
          </Btn>
        </div>
        <ProgressBar value={plan.planned} max={plan.weight} tone={plan.balanced ? "green" : plan.over ? "red" : "amber"} label="CA marks planned" />
        {!plan.balanced && (
          <p className="flex items-center gap-2 text-[13px] font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="size-4" />
            {plan.over ? `Planned CA is ${plan.planned - plan.weight} marks over the ${plan.weight}% weighting.` : `Planned CA is ${plan.weight - plan.planned} marks short of the ${plan.weight}% weighting.`}
          </p>
        )}
      </Surface>

      <ul className="flex flex-col gap-2.5">
        {q.data.assessments.map((a) => {
          const status = a.released ? "done" : a.dueDate ? "open" : "not-set";
          return (
            <li key={a.id}>
              <Surface padded={false} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{a.name}</p>
                    <span className="text-[13px] text-gray-500">
                      {a.maxMarks} marks · {a.type} · {a.mode === "online" ? "online" : "on paper"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {status === "done" && <Chip tone="green">Released</Chip>}
                    {status === "open" && <Chip tone="blue">Due {shortDate(a.dueDate!)} · {relativeDays(a.dueDate!, now)}</Chip>}
                    {status === "not-set" && <Chip tone="neutral">Not set yet</Chip>}
                    <span className="text-[12px] text-gray-500">
                      {a.entered} of {a.total} scores entered
                    </span>
                    {a.submissions && !a.released && (
                      <span className="text-[12px] text-gray-500">
                        · {a.submissions.submitted} of {a.total} submitted, {a.submissions.late} late
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!a.released && a.entered > 0 && (
                    <Btn size="sm" variant="secondary" icon={Send} onClick={() => setReleasing(a)}>
                      Release
                    </Btn>
                  )}
                  <Link
                    href={`/lecturer/courses/${course.id}/scores/${encodeURIComponent(a.id)}`}
                    className="inline-flex h-9 items-center gap-1 rounded-xl bg-gray-900 px-3 text-[13px] font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900"
                  >
                    {a.released ? "View scores" : "Enter scores"} <ChevronRight className="size-4" />
                  </Link>
                </div>
              </Surface>
            </li>
          );
        })}
      </ul>

      <CreateSheet open={creating} onClose={() => (setCreating(false), params.get("new") && set({ new: null }))} course={course} invalidateKey={key} />
      <ReleaseSheet a={releasing} onClose={() => setReleasing(null)} invalidateKey={key} />
    </div>
  );
}

function CreateSheet({ open, onClose, course, invalidateKey }: { open: boolean; onClose: () => void; course: CourseSummary; invalidateKey: string }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AssessmentType>("test");
  const [max, setMax] = useState("10");
  const [due, setDue] = useState("");
  const [mode, setMode] = useState<"online" | "paper">("paper");
  const create = useMutation(lecturerApi.createAssessment, { invalidates: [invalidateKey, `course:${course.id}`] });
  const maxNum = Number(max);
  const valid = name.trim().length >= 2 && Number.isFinite(maxNum) && maxNum > 0 && maxNum <= 100;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add assessment"
      description="Online assessments create a submission box for students and notify them."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            disabled={!valid}
            loading={create.pending}
            onClick={async () => {
              const a = await create.mutate({ courseId: course.id, name: name.trim(), type, maxMarks: maxNum, dueDate: due ? new Date(due).toISOString() : null, mode, groupIds: [] }).catch(() => undefined);
              if (a) {
                toast.success(`${a.name} added`, { description: mode === "online" ? "Students were notified and can submit online." : undefined });
                setName("");
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
        <div className="sm:col-span-2">
          <Field label="Name" htmlFor="a-name">
            <Input id="a-name" data-autofocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CA 3 Test" />
          </Field>
        </div>
        <Field label="Type" htmlFor="a-type">
          <Select id="a-type" value={type} onChange={(e) => setType(e.target.value as AssessmentType)}>
            <option value="test">Test</option>
            <option value="assignment">Assignment</option>
            <option value="project">Project</option>
            <option value="presentation">Presentation</option>
          </Select>
        </Field>
        <Field label="Max marks" htmlFor="a-max" error={max && !valid && name ? "Between 1 and 100." : null}>
          <Input id="a-max" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ""))} />
        </Field>
        <Field label="Due" htmlFor="a-due" optional>
          <Input id="a-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Submit" htmlFor="a-mode">
          <Select id="a-mode" value={mode} onChange={(e) => setMode(e.target.value as "online" | "paper")}>
            <option value="paper">On paper</option>
            <option value="online">Online</option>
          </Select>
        </Field>
      </div>
    </Sheet>
  );
}

function ReleaseSheet({ a, onClose, invalidateKey }: { a: Row | null; onClose: () => void; invalidateKey: string }) {
  const [comment, setComment] = useState("");
  const [showAverage, setShowAverage] = useState(false);
  const release = useMutation(lecturerApi.releaseAssessment, { invalidates: [invalidateKey] });
  return (
    <Sheet
      open={!!a}
      onClose={onClose}
      size="sm"
      title={a ? `Release ${a.name} scores to ${a.total} students?` : ""}
      description="Students see their own score only. The notification says the score is out, not what it is."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            icon={CheckCircle2}
            loading={release.pending}
            onClick={async () => {
              const r = await release.mutate(a!.id, { comment: comment || undefined, showAverage }).catch(() => undefined);
              if (r) toast.success(`Released to ${r.students} students`);
              onClose();
            }}
          >
            Release
          </Btn>
        </>
      }
    >
      {a && a.entered < a.total && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {a.total - a.entered} students have no score yet. They&apos;ll see “Not graded”.
        </p>
      )}
      <div className="flex flex-col gap-4">
        <Field label="Comment for the class" htmlFor="rel-comment" optional>
          <Textarea id="rel-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="e.g. Question 3 was the hardest; we'll go over it on Tuesday." />
        </Field>
        <Toggle id="rel-avg" checked={showAverage} onChange={setShowAverage} label="Show the class average" description={<span className="inline-flex items-center gap-1"><Eye className="size-3" /> Never other students&apos; scores</span>} />
      </div>
    </Sheet>
  );
}
