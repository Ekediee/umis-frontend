"use client";

/** 7.1 Supervision assignments · 7.1a raise a concern · 7.2 My supervisees · 7.2a none yet. */

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Check, ChevronRight, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { daysBetween, fullName, plural, shortDate, timeAgo } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { SupervisionRequest } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Page } from "@/components/lecturer/shell/page";
import { waitingOnYou } from "@/components/lecturer/supervision/chapter-state";
import { Btn, BtnLink, CardSkeleton, Chip, ErrorState, ExplainedEmpty, Field, PageHeader, PersonAvatar, ProgressBar, SectionTitle, Surface, Textarea } from "@/components/lecturer/ui/primitives";
import { Sheet } from "@/components/lecturer/ui/sheet";

export default function SupervisionPage() {
  const q = useLecturerQuery("supervision", () => lecturerApi.getSupervision());
  const respond = useMutation(lecturerApi.respondToSupervision, { invalidates: ["supervision", "today:"] });
  const [concernFor, setConcernFor] = useState<SupervisionRequest | null>(null);
  const now = appNow();

  if (q.error)
    return (
      <Page>
        <ErrorState error={q.error} screen="Supervision" onRetry={q.refetch} />
      </Page>
    );
  if (!q.data)
    return (
      <Page>
        <CardSkeleton rows={4} />
      </Page>
    );

  const projects = [...q.data.projects].sort((a, b) => {
    const wa = waitingOnYou(a);
    const wb = waitingOnYou(b);
    return wb.count - wa.count || (wa.oldest ?? "z").localeCompare(wb.oldest ?? "z");
  });

  return (
    <Page>
      <PageHeader title="Supervision" description="Read, comment on and approve chapters where your students already write, cite and check their work." />

      {q.data.requests.map((r) => (
        <Surface key={r.id} className="mb-5 border-[#003cbb]/20 bg-gradient-to-br from-[#f5f8fe] to-white dark:from-[#003cbb]/15 dark:to-gray-900">
          <p className="text-[12px] font-bold tracking-wide text-[#003cbb] uppercase dark:text-[#7aa2ff]">New supervision request · {timeAgo(r.at, now)}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-800 dark:text-gray-200">
            {r.assignedBy} assigned you to supervise <strong>{fullName(r.student)}</strong>: {r.type}, <em>“{r.title}”</em>. Programme: {r.student.programme}, Level {r.student.level}.
          </p>
          <p className="mt-1 text-[13px] text-gray-500">Accepting gives you Comment and Approve rights on the project, never Edit.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn
              icon={Check}
              loading={respond.pending}
              onClick={async () => {
                const res = await respond.mutate(r.id, "accept").catch(() => undefined);
                if (res) toast.success(`You now supervise ${fullName(r.student)}`, { description: "The student has been notified." });
              }}
            >
              Accept
            </Btn>
            {r.concernRaised ? (
              <Chip tone="amber">Concern sent · waiting for your HOD</Chip>
            ) : (
              <Btn variant="secondary" icon={AlertCircle} onClick={() => setConcernFor(r)}>
                Raise a concern
              </Btn>
            )}
          </div>
        </Surface>
      ))}

      <SectionTitle title="My supervisees" count={projects.length} />
      {projects.length === 0 ? (
        <ExplainedEmpty icon={GraduationCap} title="No supervisees yet" reason="Your HOD assigns students. Research areas on your profile help the HOD match you." action={<BtnLink href="/lecturer/profile">Add research areas</BtnLink>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((p) => {
            const w = waitingOnYou(p);
            const drafted = p.chapters.filter((c) => c.words > 0).length;
            const nextMilestone = p.milestones.find((m) => !m.done);
            const overdue = nextMilestone && new Date(nextMilestone.due) < now;
            return (
              <li key={p.id}>
                <Link href={`/lecturer/supervision/${p.id}`}>
                  <Surface className={cn("flex flex-col gap-4 transition-shadow hover:shadow-md md:flex-row md:items-center", w.count > 0 && "border-amber-200 dark:border-amber-900/50")}>
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <PersonAvatar first={p.student.firstName} last={p.student.lastName} size={44} />
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{fullName(p.student)}</p>
                        <p className="line-clamp-2 text-[14px] text-gray-600 dark:text-gray-400">{p.title}</p>
                        <p className="mt-1 text-[12px] text-gray-500">
                          {p.type} · last activity {timeAgo(p.lastActivity, now)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 md:w-[420px] md:flex-nowrap">
                      <div className="w-[140px]">
                        <p className="mb-1 text-[12px] font-semibold text-gray-600 dark:text-gray-400">
                          {drafted} of {p.chapters.length} chapters drafted
                        </p>
                        <ProgressBar value={drafted} max={p.chapters.length} />
                      </div>
                      <div className="flex flex-1 flex-col items-start gap-1">
                        {w.count > 0 ? (
                          <Chip tone="amber">
                            Waiting on you: {plural(w.count, "chapter")}
                            {w.oldest && `, ${daysBetween(w.oldest, now)} d`}
                          </Chip>
                        ) : (
                          <Chip tone="neutral" noIcon>
                            Nothing waiting
                          </Chip>
                        )}
                        {nextMilestone && (
                          <span className={cn("text-[12px]", overdue ? "font-semibold text-red-600" : "text-gray-500")}>
                            {nextMilestone.label} · {overdue ? "overdue" : "due"} {shortDate(nextMilestone.due)}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="hidden size-5 text-gray-300 md:block" />
                    </div>
                  </Surface>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ConcernSheet request={concernFor} onClose={() => setConcernFor(null)} />
    </Page>
  );
}

function ConcernSheet({ request, onClose }: { request: SupervisionRequest | null; onClose: () => void }) {
  const [note, setNote] = useState("");
  const respond = useMutation(lecturerApi.respondToSupervision, { invalidates: ["supervision"] });
  return (
    <Sheet
      open={!!request}
      onClose={onClose}
      title="Raise a concern with your HOD"
      description="The student doesn't see this. The assignment stays pending until your HOD confirms it or reassigns the student."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            loading={respond.pending}
            disabled={note.trim().length < 10}
            onClick={async () => {
              const r = await respond.mutate(request!.id, "concern", note).catch(() => undefined);
              if (r) toast.success("Sent to your HOD");
              setNote("");
              onClose();
            }}
          >
            Send to HOD
          </Btn>
        </>
      }
    >
      <Field label="Reason" htmlFor="concern" hint="For example workload, or a topic outside your expertise.">
        <Textarea id="concern" data-autofocus value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
      </Field>
    </Sheet>
  );
}
