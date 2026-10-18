"use client";

/** 7.3 Project overview · 7.5 milestones · 7.6 final sign-off · 7.7 meeting log. */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, BookText, CheckCircle2, ChevronRight, Circle, Download, NotebookPen, Quote, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { daysBetween, dayDate, fullName, shortDate, timeAgo } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import { cn } from "@/lib/utils";
import { Page } from "@/components/lecturer/shell/page";
import { ChapterChip } from "@/components/lecturer/supervision/chapter-state";
import { Btn, CardSkeleton, ErrorState, Field, PageHeader, PersonAvatar, SectionTitle, Surface, Textarea } from "@/components/lecturer/ui/primitives";
import { Sheet } from "@/components/lecturer/ui/sheet";

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const q = useLecturerQuery(`supervision:project:${projectId}`, () => lecturerApi.getProject(projectId));
  const [logOpen, setLogOpen] = useState(false);
  const now = appNow();

  if (q.error)
    return (
      <Page>
        <ErrorState error={q.error} screen="Project" onRetry={q.refetch} />
      </Page>
    );
  if (!q.data)
    return (
      <Page>
        <CardSkeleton rows={6} />
      </Page>
    );

  const p = q.data;
  const totalWords = p.chapters.reduce((s, c) => s + c.words, 0);
  const allApproved = p.chapters.every((c) => c.state === "approved");
  const citationClean = p.chapters.every((c) => c.citationFlags.length === 0);
  const signoff = [
    { label: "All chapters approved", ok: allApproved },
    { label: "Citation audit clean", ok: citationClean },
    { label: "Turnitin report attached and under the department limit", ok: false },
    { label: "Abstract present", ok: false },
  ];

  return (
    <Page>
      <PageHeader back={{ href: "/lecturer/supervision", label: "Supervision" }} title={p.title} description={`${p.type} · ${fullName(p.student)} · ${p.student.programme}, Level ${p.student.level}`} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface padded={false}>
            <div className="flex items-center justify-between px-5 pt-5 pb-2 md:px-6">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-gray-100">Chapters</h2>
              <span className="text-[13px] text-gray-500">{totalWords.toLocaleString()} words</span>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {p.chapters.map((c) => {
                const reviewable = c.paragraphs.length > 0;
                const inner = (
                  <>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[14px] font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">{c.number}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-gray-900 dark:text-gray-100">{c.title}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-500">
                        <span>{c.words.toLocaleString()} words</span>
                        <span className="inline-flex items-center gap-1">
                          <Quote className="size-3" /> {c.citations} citations
                        </span>
                        {c.citationFlags.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="size-3" /> {c.citationFlags.length} audit flags
                          </span>
                        )}
                        {c.state === "submitted" && c.submittedAt && <span className="font-semibold text-amber-700 dark:text-amber-300">waiting {daysBetween(c.submittedAt, now)} d</span>}
                      </span>
                    </span>
                    <ChapterChip chapter={c} />
                    {reviewable && <ChevronRight className="size-5 shrink-0 text-gray-300" />}
                  </>
                );
                return (
                  <li key={c.id}>
                    {reviewable ? (
                      <Link href={`/lecturer/supervision/${p.id}/${c.id}`} className="flex min-h-[72px] items-center gap-3 px-5 hover:bg-gray-50 md:px-6 dark:hover:bg-gray-800/40">
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex min-h-[72px] items-center gap-3 px-5 opacity-70 md:px-6">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Surface>

          <Surface>
            <SectionTitle
              title="Meeting log"
              action={
                <Btn size="sm" variant="secondary" icon={NotebookPen} onClick={() => setLogOpen(true)}>
                  Add entry
                </Btn>
              }
            />
            {p.meetingLog.length === 0 ? (
              <p className="text-[14px] text-gray-500">No meetings logged. Many departments ask for this record at final submission.</p>
            ) : (
              <ol className="flex flex-col gap-4">
                {p.meetingLog.map((m) => (
                  <li key={m.id} className="border-l-2 border-[#003cbb]/30 pl-4">
                    <p className="text-[12px] font-semibold text-gray-500">{dayDate(m.date)}</p>
                    <p className="text-[14px] text-gray-800 dark:text-gray-200">{m.discussed}</p>
                    <p className="mt-1 text-[13px] text-gray-500">
                      <strong className="font-semibold">Next:</strong> {m.nextSteps}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Surface>
        </div>

        <aside className="flex flex-col gap-5">
          <Surface className="flex items-center gap-3">
            <PersonAvatar first={p.student.firstName} last={p.student.lastName} size={48} />
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{fullName(p.student)}</p>
              <p className="text-[12px] text-gray-500">
                {p.student.matric} · active {timeAgo(p.lastActivity, now)}
              </p>
            </div>
          </Surface>

          <Surface>
            <SectionTitle title="Milestones" as="h3" />
            <ol className="flex flex-col gap-3">
              {p.milestones.map((m) => {
                const overdue = !m.done && new Date(m.due) < now;
                return (
                  <li key={m.id} className="flex items-start gap-3">
                    {m.done ? <CheckCircle2 className="mt-0.5 size-5 text-emerald-500" /> : <Circle className={cn("mt-0.5 size-5", overdue ? "text-red-500" : "text-gray-300")} />}
                    <div className="flex-1">
                      <p className={cn("text-[14px] font-semibold", m.done ? "text-gray-500 line-through" : "text-gray-900 dark:text-gray-100")}>{m.label}</p>
                      <p className={cn("text-[12px]", overdue ? "font-semibold text-red-600" : "text-gray-500")}>
                        {overdue ? "Overdue · was due " : "Due "}
                        {shortDate(m.due)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-[12px] text-gray-500">Dates are set by the department. Overdue milestones show on Today and the student&apos;s dashboard.</p>
          </Surface>

          <Surface>
            <SectionTitle title="Final sign-off" as="h3" />
            <ul className="flex flex-col gap-2">
              {signoff.map((s) => (
                <li key={s.label} className="flex items-start gap-2 text-[13px]">
                  {s.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" /> : <Circle className="mt-0.5 size-4 shrink-0 text-gray-300" />}
                  <span className={s.ok ? "text-gray-800 dark:text-gray-200" : "text-gray-500"}>{s.label}</span>
                </li>
              ))}
            </ul>
            <Btn className="mt-4 w-full" icon={ShieldCheck} disabled={!signoff.every((s) => s.ok)}>
              Sign off and send to HOD
            </Btn>
            <Btn className="mt-2 w-full" variant="ghost" icon={Download} onClick={() => toast.info("PDF with line numbers and your approval page", { description: "Generated server-side once the API is connected." })}>
              Download for reading
            </Btn>
          </Surface>

          <p className="flex items-start gap-2 px-1 text-[12px] text-gray-500">
            <BookText className="mt-0.5 size-3.5 shrink-0" /> Only you, co-supervisors and the HOD see this project.
          </p>
        </aside>
      </div>

      <MeetingSheet open={logOpen} onClose={() => setLogOpen(false)} projectId={p.id} />
    </Page>
  );
}

function MeetingSheet({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const [discussed, setDiscussed] = useState("");
  const [next, setNext] = useState("");
  const add = useMutation(lecturerApi.addMeetingNote, { invalidates: [`supervision:project:${projectId}`] });
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log a meeting"
      description="Both you and the student see this. It forms the supervision record."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            loading={add.pending}
            disabled={discussed.trim().length < 5}
            onClick={async () => {
              await add.mutate(projectId, { discussed, nextSteps: next }).catch(() => undefined);
              setDiscussed("");
              setNext("");
              onClose();
            }}
          >
            Save
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="What did you discuss?" htmlFor="ml-d">
          <Textarea id="ml-d" data-autofocus value={discussed} onChange={(e) => setDiscussed(e.target.value)} rows={3} />
        </Field>
        <Field label="Agreed next steps" htmlFor="ml-n">
          <Textarea id="ml-n" value={next} onChange={(e) => setNext(e.target.value)} rows={3} />
        </Field>
      </div>
    </Sheet>
  );
}
